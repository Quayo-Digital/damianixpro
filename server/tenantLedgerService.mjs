/**
 * Tenant Ledger System for DamianixPro
 *
 * GET /api/tenants/:id/ledger
 *
 * Response: [{ date, type, description, amount, balance }]
 * type: "rent" | "payment"
 * balance: running balance (rent increases, payment decreases)
 */

import express from "express";
import { supabaseAdmin } from "./supabaseClient.mjs";
import { fetchRentPaymentsForTenant, mapRentRowToLegacyPayment } from "./rentLedgerCompat.mjs";
import { requireSupabaseJwt } from "./middleware/supabaseJwt.mjs";
import { createAttachUserRole } from "./middleware/attachUserRole.mjs";
import { createRequireRbacPermission } from "./middleware/requireRbacPermission.mjs";

const router = express.Router();
const attachUserRole = createAttachUserRole(supabaseAdmin);
const requireAccountingRead = createRequireRbacPermission("accounting.read");

/**
 * GET /api/tenants/:id/ledger
 */
router.get("/api/tenants/:id/ledger", requireSupabaseJwt, attachUserRole, requireAccountingRead, async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Service not configured." });
    }

    const tenantId = req.params.id;
    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID is required." });
    }

    const rawRows = await fetchRentPaymentsForTenant(supabaseAdmin, tenantId);
    const payments = rawRows
      .map(mapRentRowToLegacyPayment)
      .sort((a, b) => String(a.due_date || "").localeCompare(String(b.due_date || "")));

    const entries = [];

    for (const p of payments || []) {
      const amt = Number(p.amount) || 0;
      const dueDate = (p.due_date || "").slice(0, 10);
      const paidDate = (p.paid_date || "").slice(0, 10);

      entries.push({
        date: dueDate,
        type: "rent",
        description: `Rent due ${dueDate}`,
        amount: amt,
        payment_id: p.id,
      });

      if (p.status === "PAID" && paidDate) {
        entries.push({
          date: paidDate,
          type: "payment",
          description:
            paidDate === dueDate ? "Rent payment" : `Rent payment (Ref: ${p.transaction_id || p.id})`,
          amount: amt,
          payment_id: p.id,
        });
      }
    }

    // Sort by date, then rent before payment on same day
    entries.sort((a, b) => {
      const d = a.date.localeCompare(b.date);
      if (d !== 0) return d;
      return a.type === "rent" ? -1 : 1;
    });

    // Compute running balance
    let balance = 0;
    const result = entries.map((e) => {
      if (e.type === "rent") {
        balance += e.amount;
      } else {
        balance -= e.amount;
      }
      return {
        date: e.date,
        type: e.type,
        description: e.description,
        amount: e.amount,
        balance: Math.round(balance * 100) / 100,
      };
    });

    return res.json(result);
  } catch (err) {
    console.error("[tenants/ledger]", err?.message);
    return res.status(500).json({ error: "Failed to fetch tenant ledger." });
  }
});

export function createTenantLedgerRouter() {
  return router;
}
