import express from "express";
import { supabaseAdmin } from "./supabaseClient.mjs";
import { mapRentRowToLegacyPayment } from "./rentLedgerCompat.mjs";
import { requireSupabaseJwt } from "./middleware/supabaseJwt.mjs";
import { createAttachUserRole } from "./middleware/attachUserRole.mjs";
import { createRequireRbacPermission } from "./middleware/requireRbacPermission.mjs";
import { holtLinearForecast } from "./forecasting.mjs";

const router = express.Router();
const attachUserRole = createAttachUserRole(supabaseAdmin);
const requirePaymentsRead = createRequireRbacPermission("payments.read");

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isUuid(s) {
  return typeof s === "string" && UUID_RE.test(s);
}

async function getTenantIdForUser(uid) {
  const { data } = await supabaseAdmin
    .from("tenants")
    .select("id")
    .eq("user_id", uid)
    .maybeSingle();
  return data?.id ?? null;
}

async function getVisiblePropertyIds(uid, role) {
  if (
    role === "admin" ||
    role === "super_admin" ||
    role === "accountant" ||
    role === "facility_manager"
  ) {
    return null;
  }
  if (role === "owner") {
    const { data } = await supabaseAdmin.from("properties").select("id").eq("owner_id", uid);
    return (data || []).map((r) => r.id);
  }
  if (role === "agent") {
    const { data } = await supabaseAdmin.from("properties").select("id").eq("agent_id", uid);
    return (data || []).map((r) => r.id);
  }
  if (role === "manager") {
    const { data } = await supabaseAdmin
      .from("properties")
      .select("id")
      .or(`agent_id.eq.${uid},owner_id.eq.${uid}`);
    return (data || []).map((r) => r.id);
  }
  return [];
}

function formatNaira(amount) {
  const n = Number(amount) || 0;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(1)}K`;
  return `₦${n.toLocaleString()}`;
}

function formatNairaFull(amount) {
  return `₦${Number(amount || 0).toLocaleString()}`;
}

/**
 * GET /api/payments/insights
 *
 * AI-style insights for payments:
 * - Late payments (OVERDUE or PAID after due_date)
 * - Top-paying tenants
 * - Next month revenue prediction
 *
 * Query params:
 * - owner_id: filter by property owner (optional)
 */
router.get("/api/payments/insights", requireSupabaseJwt, attachUserRole, requirePaymentsRead, async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Service not configured." });
    }

    const ownerId = req.query.owner_id || null;
    if (ownerId && !isUuid(String(ownerId))) {
      return res.status(400).json({ error: "Invalid owner_id." });
    }

    let query = supabaseAdmin
      .from("rent_payments")
      .select(
        `
        id,
        amount,
        status,
        due_date,
        payment_date,
        reference,
        created_at,
        property_tenants!inner (
          tenant_id,
          property_id,
          tenants ( first_name, last_name ),
          properties ( owner_id )
        )
      `
      )
      .order("due_date", { ascending: false });

    const uid = req.auth.sub;
    const role = req.userRole;

    // Enforce visibility on the DB query (avoid fetching global then filtering in JS).
    if (role === "admin" || role === "super_admin") {
      if (ownerId) {
        query = query.eq("property_tenants.properties.owner_id", ownerId);
      }
    } else if (role === "tenant") {
      const tid = await getTenantIdForUser(uid);
      if (!tid) {
        return res.json({
          late_payments: { count: 0, total_amount: 0, items: [] },
          top_tenants: [],
          revenue_prediction: {
            predicted_amount: 0,
            predicted_formatted: formatNairaFull(0),
            narrative: "No tenant profile linked.",
            months_analyzed: 0,
            monthly_breakdown: [],
          },
        });
      }
      query = query.eq("property_tenants.tenant_id", tid);
      if (ownerId) return res.status(403).json({ error: "FORBIDDEN" });
    } else {
      const ids = await getVisiblePropertyIds(uid, role);
      if (!ids || ids.length === 0) {
        return res.json({
          late_payments: { count: 0, total_amount: 0, items: [] },
          top_tenants: [],
          revenue_prediction: {
            predicted_amount: 0,
            predicted_formatted: formatNairaFull(0),
            narrative: "No visible properties for this user.",
            months_analyzed: 0,
            monthly_breakdown: [],
          },
        });
      }
      query = query.in("property_tenants.property_id", ids);
      if (ownerId) return res.status(403).json({ error: "FORBIDDEN" });
    }

    const { data: rawRows, error } = await query.limit(2500);

    if (error) {
      console.error("[payments/insights]", error);
      return res.status(500).json({ error: "Failed to fetch payment insights." });
    }

    const list = (rawRows || []).map((row) => {
      const legacy = mapRentRowToLegacyPayment(row);
      return {
        ...legacy,
        tenant_id: row.property_tenants?.tenant_id,
        lease_id: null,
        leases: row.property_tenants?.property_id
          ? {
              property_id: row.property_tenants.property_id,
              properties: row.property_tenants.properties || {},
            }
          : null,
      };
    });

    const filtered = list;

    // 1. Late payments: OVERDUE status, or PAID with paid_date > due_date
    const latePayments = filtered.filter((p) => {
      if (p.status === "OVERDUE") return true;
      if (p.status === "PAID" && p.paid_date && p.due_date) {
        return new Date(p.paid_date) > new Date(p.due_date);
      }
      return false;
    });

    const latePaymentsFormatted = latePayments.slice(0, 10).map((p) => {
      const t = p.tenants || {};
      const tenantName = `${t.first_name || ""} ${t.last_name || ""}`.trim() || "Tenant";
      const daysLate =
        p.paid_date && p.due_date
          ? Math.ceil((new Date(p.paid_date) - new Date(p.due_date)) / (1000 * 60 * 60 * 24))
          : p.status === "OVERDUE"
            ? Math.ceil((Date.now() - new Date(p.due_date)) / (1000 * 60 * 60 * 24))
            : null;
      return {
        id: p.id,
        tenant_name: tenantName,
        amount: Number(p.amount) || 0,
        due_date: p.due_date,
        paid_date: p.paid_date,
        status: p.status,
        days_late: daysLate,
      };
    });

    // 2. Top-paying tenants (by total PAID amount)
    const tenantTotals = new Map();
    for (const p of filtered) {
      if (p.status !== "PAID") continue;
      const tid = p.tenant_id;
      const t = p.tenants || {};
      const name = `${t.first_name || ""} ${t.last_name || ""}`.trim() || "Tenant";
      const amt = Number(p.amount) || 0;
      if (!tenantTotals.has(tid)) {
        tenantTotals.set(tid, { tenant_id: tid, tenant_name: name, total: 0, count: 0 });
      }
      const entry = tenantTotals.get(tid);
      entry.total += amt;
      entry.count += 1;
    }

    const topTenants = Array.from(tenantTotals.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map((t) => ({
        tenant_id: t.tenant_id,
        tenant_name: t.tenant_name,
        total_paid: t.total,
        payment_count: t.count,
      }));

    // 3. Predict next month's revenue from historical monthly totals
    const paidByMonth = new Map(); // "YYYY-MM" -> total
    for (const p of filtered) {
      if (p.status !== "PAID") continue;
      const date = p.paid_date || p.due_date || p.created_at;
      if (!date) continue;
      const month = String(date).slice(0, 7);
      const amt = Number(p.amount) || 0;
      paidByMonth.set(month, (paidByMonth.get(month) || 0) + amt);
    }

    /**
     * Use Holt's linear (double exponential smoothing) over the most recent
     * 6 months to forecast next month's collections, with a 95% interval
     * derived from in-sample residuals. Falls back to mean / last-value when
     * history is too short.
     */
    const sortedMonthsAsc = Array.from(paidByMonth.keys()).sort();
    const lastMonthsAsc = sortedMonthsAsc.slice(-6);
    const lastMonthsAmountsAsc = lastMonthsAsc.map((m) => paidByMonth.get(m) || 0);

    const forecast = holtLinearForecast(lastMonthsAmountsAsc, { h: 1 });
    const predictedNextMonth = forecast.point;

    let narrative;
    if (predictedNextMonth <= 0) {
      narrative = "Insufficient payment history to predict next month's revenue.";
    } else if (forecast.method === 'holt' && forecast.upper > forecast.lower) {
      narrative = `Forecast: ${formatNaira(predictedNextMonth)} next month (likely ${formatNaira(
        forecast.lower
      )}\u2013${formatNaira(forecast.upper)} based on the last ${lastMonthsAsc.length} months).`;
    } else {
      narrative = `Forecast: ${formatNaira(predictedNextMonth)} next month based on the last ${
        lastMonthsAsc.length
      } months of paid rent.`;
    }

    return res.json({
      late_payments: {
        count: latePayments.length,
        total_amount: latePayments.reduce((s, p) => s + (Number(p.amount) || 0), 0),
        items: latePaymentsFormatted,
      },
      top_tenants: topTenants,
      revenue_prediction: {
        predicted_amount: predictedNextMonth,
        predicted_formatted: formatNairaFull(predictedNextMonth),
        lower_amount: forecast.lower,
        upper_amount: forecast.upper,
        method: forecast.method,
        narrative,
        months_analyzed: lastMonthsAsc.length,
        monthly_breakdown: lastMonthsAsc.map((m) => ({
          month: m,
          amount: paidByMonth.get(m) || 0,
        })),
      },
    });
  } catch (err) {
    console.error("[payments/insights]", err?.message);
    return res.status(500).json({ error: "Failed to generate payment insights." });
  }
});

export function createPaymentInsightsRouter() {
  return router;
}
