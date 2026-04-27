import express from "express";
import { supabaseAdmin } from "./supabaseClient.mjs";
import { mapRentRowToLegacyPayment } from "./rentLedgerCompat.mjs";

const router = express.Router();

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
router.get("/api/payments/insights", async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Service not configured." });
    }

    const ownerId = req.query.owner_id || null;

    const { data: rawRows, error } = await supabaseAdmin
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

    // Filter by owner if specified
    const filtered = ownerId
      ? list.filter((p) => {
          const owner = p.leases?.properties?.owner_id;
          return owner === ownerId;
        })
      : list;

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

    const sortedMonths = Array.from(paidByMonth.keys()).sort().reverse();
    const lastMonths = sortedMonths.slice(0, 6);
    const monthlyAmounts = lastMonths.map((m) => paidByMonth.get(m) || 0);

    let predictedNextMonth = 0;
    if (monthlyAmounts.length > 0) {
      const avg = monthlyAmounts.reduce((a, b) => a + b, 0) / monthlyAmounts.length;
      // Simple trend: if recent months are higher, nudge up slightly
      const recent = monthlyAmounts.slice(0, 2).reduce((a, b) => a + b, 0) / Math.min(2, monthlyAmounts.length);
      const trend = recent > avg ? 1.05 : 1;
      predictedNextMonth = Math.round(avg * trend);
    }

    // Build the narrative message
    const predictedFormatted = formatNaira(predictedNextMonth);
    const narrative =
      predictedNextMonth > 0
        ? `You are expected to receive ${predictedFormatted} next month based on trends.`
        : "Insufficient payment history to predict next month's revenue.";

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
        narrative,
        months_analyzed: lastMonths.length,
        monthly_breakdown: lastMonths.map((m) => ({
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
