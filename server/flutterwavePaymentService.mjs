import express from "express";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { supabaseAdmin } from "./supabaseClient.mjs";
import { requireSupabaseJwt } from "./middleware/supabaseJwt.mjs";
import { createAttachUserRole } from "./middleware/attachUserRole.mjs";
import { createRequireRbacPermission } from "./middleware/requireRbacPermission.mjs";
import {
  enqueuePaymentFailed,
  enqueuePaymentReceived,
  drainNotificationOutbox,
} from "./notifications/outboxTriggers.mjs";
import {
  legacyMatchesRefinedFilter,
  mapRentRowToLegacyPayment,
  needsLegacyStatusRefinement,
  resolvePropertyTenantIdFromLease,
  rentStatusesMatchingApiFilter,
} from "./rentLedgerCompat.mjs";
import { claimPaymentWebhookEvent } from "./paymentWebhookDedup.mjs";
import { apiError, logger } from "./observability.mjs";

const router = express.Router();
const attachUserRole = createAttachUserRole(supabaseAdmin);
const requirePaymentsRead = createRequireRbacPermission("payments.read");
const requirePaymentsWrite = createRequireRbacPermission("payments.write");

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isUuid(s) {
  return typeof s === "string" && UUID_RE.test(s);
}
function asPgDateOnly(s) {
  if (!s || typeof s !== "string") return null;
  const x = s.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(x)) return null;
  const d = new Date(`${x}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return x;
}
function asLimitedString(v, maxLen) {
  if (v == null) return null;
  const out = String(v).trim();
  if (!out) return null;
  return out.length > maxLen ? out.slice(0, maxLen) : out;
}
function looksLikeTxRef(v) {
  if (!v || typeof v !== "string") return false;
  const x = v.trim();
  if (x.length < 6 || x.length > 200) return false;
  return /^[a-zA-Z0-9._:-]+$/.test(x);
}
function safeHttpUrl(v) {
  if (!v || typeof v !== "string") return null;
  const s = v.trim();
  if (!s || s.length > 2048) return null;
  try {
    const u = new URL(s);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return u.toString();
  } catch {
    return null;
  }
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

async function applyPaymentsVisibility(query, uid, role) {
  if (role === "admin" || role === "super_admin") return query;
  if (role === "tenant") {
    const tid = await getTenantIdForUser(uid);
    if (!tid) return query.eq("id", "__none__");
    return query.eq("property_tenants.tenant_id", tid);
  }
  const ids = await getVisiblePropertyIds(uid, role);
  if (!ids || ids.length === 0) return query.eq("id", "__none__");
  return query.in("property_tenants.property_id", ids);
}

const secretKey = () =>
  process.env.FLUTTERWAVE_SECRET_KEY || process.env.FLW_SECRET_KEY;
const secretHash = () =>
  process.env.FLUTTERWAVE_SECRET_HASH || process.env.FLW_SECRET_HASH;

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

router.post("/api/payments/webhook", async (req, res) => {
  try {
    const hash = secretHash();
    const signature = req.headers["verif-hash"];
    if (hash && (!signature || !safeEqual(signature, hash))) {
      logger.warn("flutterwave_webhook_signature_invalid", { request_id: req.requestId });
      return apiError(res, 401, "INVALID_SIGNATURE", "Invalid webhook signature.", null, req.requestId);
    }

    const payload = req.body;
    const event = payload?.event;
    const data = payload?.data;

    if (!data?.tx_ref) {
      return res.status(200).end();
    }

    const txRef = data.tx_ref;
    const flwId = data.id;

    if (event !== "charge.completed") {
      return res.status(200).end();
    }

    const key = secretKey();
    if (!key || !supabaseAdmin) {
      return res.status(200).end();
    }

    let verified;
    try {
      const verifyRes = await axios.get(
        `https://api.flutterwave.com/v3/transactions/${flwId}/verify`,
        { headers: { Authorization: `Bearer ${key}` } }
      );
      verified = verifyRes.data?.data;
    } catch (verifyErr) {
      logger.error("flutterwave_webhook_verify_failed", {
        request_id: req.requestId,
        error: verifyErr?.response?.data || verifyErr?.message,
      });
      return res.status(200).end();
    }
    const status = verified?.status;
    const amount = verified?.amount ?? data.amount;
    const currency = verified?.currency ?? data.currency;
    const verifiedTxRef = verified?.tx_ref ?? txRef;

    const { data: payment, error: payErr } = await supabaseAdmin
      .from("rent_payments")
      .select("id, amount, status, property_tenant_id, reference")
      .eq("reference", verifiedTxRef)
      .maybeSingle();

    if (payErr || !payment) {
      return res.status(200).end();
    }

    if (String(payment.status || "").toLowerCase() === "successful") {
      return res.status(200).end();
    }

    const verifiedFlwId = String(verified?.id ?? flwId ?? "").trim();
    if (verifiedFlwId) {
      const claim = await claimPaymentWebhookEvent(supabaseAdmin, {
        provider: "flutterwave",
        externalId: verifiedFlwId,
      });
      if (!claim.ok) {
        logger.error("flutterwave_webhook_dedup_failed", {
          request_id: req.requestId,
          error: claim.error,
        });
        return res.status(500).end();
      }
      if (!claim.firstDelivery) {
        return res.status(200).end();
      }
    }

    const today = new Date().toISOString().slice(0, 10);

    const { data: ptRow } = await supabaseAdmin
      .from("property_tenants")
      .select("tenant_id")
      .eq("id", payment.property_tenant_id)
      .maybeSingle();
    const tenantIdForNotify = ptRow?.tenant_id;

    if (status === "successful") {
      const expectedAmount = Number(payment.amount);
      const actualAmount = Number(amount);
      if (
        Math.abs(expectedAmount - actualAmount) > 0.01 ||
        (currency && currency !== "NGN")
      ) {
        return res.status(200).end();
      }

      const { error: updateErr } = await supabaseAdmin
        .from("rent_payments")
        .update({
          status: "successful",
          payment_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      if (updateErr) {
        logger.error("flutterwave_webhook_update_failed", {
          request_id: req.requestId,
          error: updateErr?.message || String(updateErr),
        });
        return res.status(200).end();
      }

      const { data: payCtx } = await supabaseAdmin
        .from("rent_payments")
        .select(
          `
          id,
          property_tenants (
            property_id,
            properties ( id ),
            tenants ( user_id )
          )
        `
        )
        .eq("id", payment.id)
        .maybeSingle();

      const propertyIdForLedger =
        payCtx?.property_tenants?.properties?.id ?? payCtx?.property_tenants?.property_id ?? null;
      const tenantUserIdForLedger = payCtx?.property_tenants?.tenants?.user_id ?? null;

      const { error: finalizeErr } = await supabaseAdmin.rpc("finalize_rent_payment_flutterwave", {
        p_payment_id: payment.id,
        p_provider: "flutterwave",
        p_external_id: verifiedFlwId || null,
        p_property_id: propertyIdForLedger,
        p_tenant_user_id: tenantUserIdForLedger,
        p_entry_date: today,
      });
      if (finalizeErr) {
        logger.error("flutterwave_finalize_accounting_failed", {
          request_id: req.requestId,
          error: finalizeErr?.message || String(finalizeErr),
        });
      }

      const { data: tenant } = await supabaseAdmin
        .from("tenants")
        .select("user_id, phone, email, first_name, last_name")
        .eq("id", tenantIdForNotify)
        .maybeSingle();

      if (tenant) {
        await enqueuePaymentReceived({
          tenant: { ...tenant, first_name: tenant.first_name || "Tenant" },
          amount: actualAmount,
          txRef: verifiedTxRef,
          channels: ["in_app", "email", "sms", "whatsapp"],
        });
        await drainNotificationOutbox(30);
      }

      // Optional: store Flutterwave card authorization for recurring rent (meta.recurring_opt_in).
      try {
        const metaRaw = verified?.meta ?? data?.meta;
        const meta =
          metaRaw && typeof metaRaw === "object" && !Array.isArray(metaRaw) ? metaRaw : {};
        const recurringOptIn =
          meta.recurring_opt_in === true ||
          meta.recurring_opt_in === "true" ||
          String(meta.recurring_opt_in || "").toLowerCase() === "true";
        const authCode = verified?.authorization?.authorization_code;
        if (recurringOptIn && authCode && tenantIdForNotify) {
          const { data: ptFull } = await supabaseAdmin
            .from("property_tenants")
            .select("id, property_id")
            .eq("id", payment.property_tenant_id)
            .maybeSingle();
          const { data: tenRow } = await supabaseAdmin
            .from("tenants")
            .select("user_id")
            .eq("id", tenantIdForNotify)
            .maybeSingle();
          const propertyId = ptFull?.property_id;
          const tenantUserId = tenRow?.user_id;
          if (propertyId && tenantUserId) {
            const last4 =
              verified?.authorization?.last4 ??
              verified?.authorization?.last_4 ??
              null;
            const brand =
              verified?.authorization?.issuer ??
              verified?.authorization?.brand ??
              null;
            await supabaseAdmin
              .from("rent_recurrence_mandates")
              .update({
                status: "cancelled",
                updated_at: new Date().toISOString(),
              })
              .eq("tenant_id", tenantIdForNotify)
              .eq("property_id", propertyId)
              .eq("status", "active");
            const nextDue = new Date();
            nextDue.setMonth(nextDue.getMonth() + 1);
            nextDue.setDate(1);
            const { error: manErr } = await supabaseAdmin
              .from("rent_recurrence_mandates")
              .insert({
                tenant_user_id: tenantUserId,
                tenant_id: tenantIdForNotify,
                property_id: propertyId,
                property_tenant_id: ptFull?.id ?? null,
                provider: "flutterwave",
                status: "active",
                amount_ngn: actualAmount,
                frequency: "monthly",
                flutterwave_authorization_code: String(authCode),
                card_last4: last4 != null ? String(last4) : null,
                card_brand: brand != null ? String(brand) : null,
                last_successful_charge_at: new Date().toISOString(),
                next_charge_due_date: nextDue.toISOString().slice(0, 10),
              });
            if (manErr) {
              logger.warn("flutterwave_webhook_mandate_insert_warning", {
                request_id: req.requestId,
                error: manErr.message,
              });
            }
          }
        }
      } catch (recErr) {
        logger.warn("flutterwave_webhook_mandate_non_fatal", {
          request_id: req.requestId,
          error: recErr?.message,
        });
      }
    } else {
      const { error: failErr } = await supabaseAdmin
        .from("rent_payments")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      if (failErr) {
        logger.error("flutterwave_webhook_mark_failed_error", {
          request_id: req.requestId,
          error: failErr?.message || String(failErr),
        });
      }

      const { data: tenant } = await supabaseAdmin
        .from("tenants")
        .select("user_id, phone, email, first_name, last_name")
        .eq("id", tenantIdForNotify)
        .maybeSingle();

      if (tenant) {
        await enqueuePaymentFailed({
          tenant: { ...tenant, first_name: tenant.first_name || "Tenant" },
          txRef: verifiedTxRef,
          channels: ["in_app", "email", "sms", "whatsapp"],
        });
        await drainNotificationOutbox(30);
      }
    }

    return res.status(200).end();
  } catch (err) {
    logger.error("flutterwave_webhook_unexpected", {
      request_id: req.requestId,
      error: err?.response?.data || err?.message,
    });
    return res.status(200).end();
  }
});

router.get(
  "/api/payments",
  requireSupabaseJwt,
  attachUserRole,
  requirePaymentsRead,
  async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Service not configured." });
    }

    const statusFilter = req.query.status;
    const dateFrom = req.query.date_from;
    const dateTo = req.query.date_to;
    const statusUpper = statusFilter ? String(statusFilter).toUpperCase() : "";

    let query = supabaseAdmin
      .from("rent_payments")
      .select(
        `
        id,
        amount,
        status,
        due_date,
        payment_date,
        payment_method,
        reference,
        created_at,
        property_tenants!inner (
          tenant_id,
          tenants ( first_name, last_name )
        )
      `
      )
      .order("created_at", { ascending: false });

    const rentSt = statusFilter ? rentStatusesMatchingApiFilter(statusUpper) : null;
    if (needsLegacyStatusRefinement(statusFilter)) {
      query = query.in("status", ["pending", "active"]);
    } else if (rentSt?.length) {
      query = query.in("status", rentSt);
    }
    const df = asPgDateOnly(dateFrom);
    const dt = asPgDateOnly(dateTo);
    if (dateFrom && !df) return res.status(400).json({ error: "Invalid date_from (YYYY-MM-DD required)." });
    if (dateTo && !dt) return res.status(400).json({ error: "Invalid date_to (YYYY-MM-DD required)." });
    if (df) {
      query = query.gte("due_date", df);
    }
    if (dt) {
      query = query.lte("due_date", dt);
    }

    query = await applyPaymentsVisibility(query, req.auth.sub, req.userRole);
    const { data: payments, error } = await query.limit(500);

    if (error) {
      console.error("[payments]", error);
      return res.status(500).json({ error: "Failed to fetch payments." });
    }

    let rows = payments || [];
    if (needsLegacyStatusRefinement(statusFilter)) {
      rows = rows.filter((p) =>
        legacyMatchesRefinedFilter(mapRentRowToLegacyPayment(p).status, statusFilter)
      );
    }

    const list = rows.map((p) => {
      const legacy = mapRentRowToLegacyPayment(p);
      const t = legacy.tenants || {};
      const tenantName = `${t.first_name || ""} ${t.last_name || ""}`.trim() || "Tenant";
      const date = legacy.paid_date || legacy.due_date || "";
      return {
        id: legacy.id,
        tenant_name: tenantName,
        amount: Number(legacy.amount) || 0,
        status: (legacy.status || "").toLowerCase(),
        date,
        payment_method: legacy.payment_method || null,
        transaction_id: legacy.transaction_id || null,
      };
    });

    return res.json(list);
  } catch (err) {
    console.error("[payments]", err?.message);
    return res.status(500).json({ error: "Failed to fetch payments." });
  }
});

router.get(
  "/api/payments/summary",
  requireSupabaseJwt,
  attachUserRole,
  requirePaymentsRead,
  async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Service not configured." });
    }

    let q = supabaseAdmin.from("rent_payments").select(
      `
      amount,
      status,
      property_tenants!inner ( tenant_id, property_id )
    `
    );
    q = await applyPaymentsVisibility(q, req.auth.sub, req.userRole);
    const { data: payments, error } = await q.limit(2000);

    if (error) {
      console.error("[payments/summary]", error);
      return res.status(500).json({ error: "Failed to fetch payment summary." });
    }

    const list = payments || [];
    const totalRevenue = list
      .filter((p) => String(p.status || "").toLowerCase() === "successful")
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    const pendingPayments = list
      .filter((p) => {
        const st = String(p.status || "").toLowerCase();
        return st === "pending" || st === "active";
      })
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    const completedPayments = list
      .filter((p) => String(p.status || "").toLowerCase() === "successful")
      .reduce((s, p) => s + Number(p.amount || 0), 0);

    return res.json({
      total_revenue: totalRevenue,
      pending_payments: pendingPayments,
      completed_payments: completedPayments,
    });
  } catch (err) {
    console.error("[payments/summary]", err?.message);
    return res.status(500).json({ error: "Failed to fetch payment summary." });
  }
});

router.get(
  "/api/payments/status/:tx_ref",
  requireSupabaseJwt,
  attachUserRole,
  requirePaymentsRead,
  async (req, res) => {
  try {
    const txRef = req.params.tx_ref;
    if (!txRef || !supabaseAdmin) {
      return res.status(400).json({ error: "tx_ref is required." });
    }
    if (!looksLikeTxRef(txRef)) {
      return res.status(400).json({ error: "Invalid tx_ref." });
    }

    let q = supabaseAdmin
      .from("rent_payments")
      .select(
        `
        id,
        amount,
        status,
        payment_date,
        reference,
        due_date,
        property_tenants!inner ( tenant_id, property_id, tenants ( first_name, last_name ) )
      `
      )
      .eq("reference", txRef);
    q = await applyPaymentsVisibility(q, req.auth.sub, req.userRole);
    const { data: payment, error } = await q.maybeSingle();

    if (error) {
      return res.status(500).json({ error: "Failed to fetch payment status." });
    }

    if (!payment) {
      return res.status(404).json({ error: "Payment not found." });
    }

    const legacy = mapRentRowToLegacyPayment({
      ...payment,
      property_tenants: payment.property_tenants || { tenant_id: null, tenants: {} },
    });

    res.json({
      status: legacy.status,
      amount: payment.amount,
      paid_date: legacy.paid_date,
      transaction_id: payment.reference,
    });
  } catch (err) {
    console.error("[payments/status]", err?.message);
    res.status(500).json({ error: "Failed to verify payment." });
  }
});

router.get(
  "/api/payments/:id",
  requireSupabaseJwt,
  attachUserRole,
  requirePaymentsRead,
  async (req, res) => {
  try {
    const id = req.params.id;
    if (!id || !supabaseAdmin) {
      return res.status(400).json({ error: "Payment ID is required." });
    }
    if (!isUuid(id)) return res.status(400).json({ error: "Invalid payment id." });

    let q = supabaseAdmin
      .from("rent_payments")
      .select(
        `
        id,
        amount,
        status,
        due_date,
        payment_date,
        payment_method,
        reference,
        created_at,
        property_tenants!inner (
          tenant_id,
          tenants ( first_name, last_name )
        )
      `
      )
      .eq("id", id);
    q = await applyPaymentsVisibility(q, req.auth.sub, req.userRole);
    const { data: payment, error } = await q.maybeSingle();

    if (error || !payment) {
      return res.status(404).json({ error: "Payment not found." });
    }

    const legacy = mapRentRowToLegacyPayment(payment);
    const t = legacy.tenants || {};
    const tenantName = `${t.first_name || ""} ${t.last_name || ""}`.trim() || "Tenant";
    const date = legacy.paid_date || legacy.due_date || "";

    return res.json({
      id: legacy.id,
      tenant_name: tenantName,
      amount: Number(legacy.amount) || 0,
      status: (legacy.status || "").toLowerCase(),
      payment_method: legacy.payment_method || "—",
      transaction_id: legacy.transaction_id || "—",
      date,
      due_date: legacy.due_date,
      paid_date: legacy.paid_date,
      created_at: legacy.created_at,
    });
  } catch (err) {
    console.error("[payments/:id]", err?.message);
    return res.status(500).json({ error: "Failed to fetch payment." });
  }
});

router.post(
  "/api/payments/:id/resend-link",
  requireSupabaseJwt,
  attachUserRole,
  requirePaymentsWrite,
  async (req, res) => {
  try {
    const id = req.params.id;
    const key = secretKey();
    if (!id || !key || !supabaseAdmin) {
      return res.status(400).json({ error: "Payment ID is required." });
    }
    if (!isUuid(id)) return res.status(400).json({ error: "Invalid payment id." });

    let q = supabaseAdmin
      .from("rent_payments")
      .select(
        `
        id,
        amount,
        status,
        due_date,
        payment_date,
        reference,
        property_tenants!inner ( tenant_id )
      `
      )
      .eq("id", id);
    q = await applyPaymentsVisibility(q, req.auth.sub, req.userRole);
    const { data: payment, error } = await q.maybeSingle();

    if (error || !payment) {
      return res.status(404).json({ error: "Payment not found." });
    }

    const legacy = mapRentRowToLegacyPayment(payment);
    if (legacy.status !== "PENDING" && legacy.status !== "OVERDUE") {
      return res.status(400).json({ error: "Can only resend link for pending payments." });
    }

    const tenantId = payment.property_tenants?.tenant_id;
    const { data: tenant } = await supabaseAdmin
      .from("tenants")
      .select("first_name, last_name, email")
      .eq("id", tenantId)
      .maybeSingle();

    const tenantName = tenant
      ? `${tenant.first_name || ""} ${tenant.last_name || ""}`.trim() || "Tenant"
      : "Tenant";
    const tenantEmail = tenant?.email || `tenant-${tenantId}@damianixpro.local`;
    const tx_ref = "DMX-" + uuidv4();

    const response = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      {
        tx_ref,
        amount: Number(payment.amount),
        currency: "NGN",
        redirect_url:
          safeHttpUrl(process.env.PAYMENT_REDIRECT_URL) ||
          "https://yourdomain.com/api/payments/callback",
        customer: { email: tenantEmail, name: tenantName },
        customizations: {
          title: "DamianixPro Rent Payment",
          description: "Rent payment",
          logo: safeHttpUrl(process.env.PAYMENT_LOGO_URL) || "https://yourdomain.com/logo.png",
        },
        meta: { tenant_id: tenantId, payment_type: "rent" },
      },
      {
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.status !== "success" || !response.data.data?.link) {
      return res.status(502).json({
        error: "Failed to generate payment link.",
        details: response.data.message,
      });
    }

    await supabaseAdmin
      .from("rent_payments")
      .update({
        reference: tx_ref,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    return res.json({
      payment_link: response.data.data.link,
      tx_ref,
    });
  } catch (err) {
    console.error("[payments/:id/resend-link]", err?.response?.data || err?.message);
    return res.status(500).json({ error: "Failed to resend payment link." });
  }
});

router.get(
  "/api/payments/:id/receipt",
  requireSupabaseJwt,
  attachUserRole,
  requirePaymentsRead,
  async (req, res) => {
  const id = req.params.id;
  if (!id || !supabaseAdmin) {
    return res.status(400).json({ error: "Payment ID is required." });
  }
  if (!isUuid(id)) return res.status(400).json({ error: "Invalid payment id." });

  try {
    let q = supabaseAdmin
      .from("rent_payments")
      .select(
        `
        id,
        amount,
        status,
        due_date,
        payment_date,
        payment_method,
        reference,
        created_at,
        property_tenants!inner (
          tenant_id,
          tenants ( first_name, last_name )
        )
      `
      )
      .eq("id", id);
    q = await applyPaymentsVisibility(q, req.auth.sub, req.userRole);
    const { data: payment, error } = await q.maybeSingle();

    if (error || !payment) {
      return res.status(404).json({ error: "Payment not found." });
    }

    const legacy = mapRentRowToLegacyPayment(payment);
    const t = legacy.tenants || {};
    const tenantName = `${t.first_name || ""} ${t.last_name || ""}`.trim() || "Tenant";
    const amount = Number(legacy.amount) || 0;
    const date = legacy.paid_date || legacy.due_date || "—";
    const txRef = legacy.transaction_id || "—";

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([400, 520]);
    const { height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = height - 50;

    page.drawText("Payment Receipt", {
      x: 50,
      y,
      size: 22,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.2),
    });
    y -= 40;

    const row = (label, value, isAmount = false) => {
      page.drawText(label, {
        x: 50,
        y,
        size: 10,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
      page.drawText(value, {
        x: 50,
        y: y - 16,
        size: isAmount ? 16 : 12,
        font: isAmount ? fontBold : font,
        color: rgb(0.1, 0.1, 0.2),
      });
      y -= 44;
    };

    row("Tenant Name", tenantName);
    row("Amount", `₦${amount.toLocaleString()}`, true);
    row("Date", date);
    row("Transaction Reference", txRef);
    row("Status", (legacy.status || "").toUpperCase());

    if (legacy.payment_method) {
      row("Payment Method", legacy.payment_method);
    }

    y -= 20;
    page.drawText(`DamianixPro • Generated ${new Date().toISOString().slice(0, 10)}`, {
      x: 50,
      y,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();
    const filename = `receipt-${id.slice(0, 8)}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBytes.length);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error("[payments/:id/receipt]", err?.message);
    res.status(500).json({ error: "Failed to generate receipt." });
  }
});

router.get("/api/payments/callback", (req, res) => {
  const txRef = req.query.tx_ref || req.query.transaction_id || "";
  const status = req.query.status || "unknown";
  const appScheme = process.env.APP_DEEP_LINK_SCHEME || "damianixpro";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment - DamianixPro</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: #f5f5f5; }
    .card { background: white; border-radius: 12px; padding: 32px; max-width: 360px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    h1 { margin: 0 0 8px; font-size: 1.5rem; color: #1a1a1a; }
    p { margin: 0 0 24px; color: #666; font-size: 0.95rem; }
    .btn { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; }
    .btn:hover { background: #1d4ed8; }
    .success { color: #059669; }
    .failed { color: #dc2626; }
  </style>
</head>
<body>
  <div class="card">
    <h1 class="${status === "successful" ? "success" : "failed"}">${status === "successful" ? "Payment Successful" : "Payment Incomplete"}</h1>
    <p>${status === "successful" ? "Your rent payment has been received. You can close this page and return to the app." : "The payment was not completed. Please try again from the app."}</p>
    <a href="${appScheme}://payment/callback?tx_ref=${encodeURIComponent(txRef || "")}&status=${encodeURIComponent(status)}" class="btn">Return to App</a>
  </div>
</body>
</html>`;

  res.type("text/html").send(html);
});

const handleRentPayment = async (req, res) => {
  let paymentRowId;
  let pendingRentRowInserted = false;

  try {
    const { tenant_id, amount, redirect_url } = req.body;

    if (!tenant_id || amount == null || amount === "") {
      return res.status(400).json({ error: "tenant_id and amount are required." });
    }
    if (!isUuid(String(tenant_id))) {
      return res.status(400).json({ error: "tenant_id must be a UUID." });
    }

    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: "amount must be a positive number." });
    }
    if (numericAmount > 50_000_000) {
      return res.status(400).json({ error: "amount is too large." });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Service not configured." });
    }

    const key = secretKey();
    if (!key) {
      return res.status(500).json({ error: "Flutterwave secret key not configured." });
    }

    // Fetch tenant and lease from DB
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .select("id, first_name, last_name, email")
      .eq("id", tenant_id)
      .maybeSingle();

    if (tenantError || !tenant) {
      return res.status(404).json({ error: "Tenant not found." });
    }

    const { data: lease, error: leaseError } = await supabaseAdmin
      .from("leases")
      .select("id, property_id, tenant_id")
      .eq("tenant_id", tenant.id)
      .in("status", ["ACTIVE", "active"])
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (leaseError || !lease) {
      return res.status(400).json({ error: "No active lease found for tenant." });
    }

    const propertyTenantId = await resolvePropertyTenantIdFromLease(supabaseAdmin, lease);
    if (!propertyTenantId) {
      return res.status(400).json({
        error: "No property_tenants row for this lease; cannot record rent payment.",
      });
    }

    const tenantName = `${tenant.first_name || ""} ${tenant.last_name || ""}`.trim() || "Tenant";
    const tenantEmail = tenant.email || `tenant-${tenant_id}@damianixpro.local`;

    const paymentDescription = "Rent payment (Node Flutterwave)";
    paymentRowId = uuidv4();
    const tx_ref = "DMX-" + uuidv4();
    const now = new Date().toISOString();

    const { error: insertError } = await supabaseAdmin.from("rent_payments").insert({
      id: paymentRowId,
      property_tenant_id: propertyTenantId,
      amount: numericAmount,
      due_date: new Date().toISOString().slice(0, 10),
      status: "pending",
      payment_method: "flutterwave",
      reference: tx_ref,
      category: "rent",
      description: paymentDescription,
      payment_date: null,
      created_at: now,
      updated_at: now,
    });

    if (insertError) {
      console.error("[payments] Failed to create pending rent_payment", insertError);
      return res.status(500).json({ error: "Failed to create payment record." });
    }

    pendingRentRowInserted = true;

    let response;
    try {
      response = await axios.post(
        "https://api.flutterwave.com/v3/payments",
        {
          tx_ref,
          amount: numericAmount,
          currency: "NGN",
          redirect_url:
            safeHttpUrl(redirect_url) ||
            safeHttpUrl(process.env.PAYMENT_REDIRECT_URL) ||
            "https://yourdomain.com/payment/callback",
          customer: {
            email: tenantEmail,
            name: tenantName,
          },
          customizations: {
            title: "DamianixPro Rent Payment",
            description: "Rent payment for property",
            logo: safeHttpUrl(process.env.PAYMENT_LOGO_URL) || "https://yourdomain.com/logo.png",
          },
          meta: {
            tenant_id,
            payment_type: "rent",
            description: paymentDescription,
            internal_payment_id: paymentRowId,
            lease_id: propertyTenantId,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (fwErr) {
      await supabaseAdmin.from("rent_payments").delete().eq("id", paymentRowId);
      console.error("[payments] Flutterwave request failed", fwErr?.response?.data || fwErr?.message);
      return res.status(502).json({
        error: "Payment initialization failed.",
        details: fwErr?.response?.data?.message || fwErr?.message,
      });
    }

    if (response.data.status !== "success" || !response.data.data?.link) {
      await supabaseAdmin.from("rent_payments").delete().eq("id", paymentRowId);
      return res.status(502).json({
        error: "Flutterwave did not return a payment link.",
        details: response.data.message,
      });
    }

    const paymentLink = response.data.data.link;

    return res.status(201).json({
      payment_link: paymentLink,
      tx_ref,
      payment_id: paymentRowId,
      status: "pending",
    });
  } catch (error) {
    if (pendingRentRowInserted && paymentRowId && supabaseAdmin) {
      await supabaseAdmin.from("rent_payments").delete().eq("id", paymentRowId);
    }
    console.error(error.response?.data || error.message);
    return res.status(500).json({
      error: "Payment initialization failed",
      details: error.response?.data?.message || error.message,
    });
  }
};

router.post("/api/payments/rent", handleRentPayment);
router.post("/api/payments/rent/flutterwave", handleRentPayment);

export function createFlutterwavePaymentRouter() {
  return router;
}
export default router;