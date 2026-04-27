/**
 * Accounting Transaction Engine for DamianixPro
 *
 * POST /api/accounting/transactions - Record a transaction
 * GET  /api/accounting/transactions - List transactions with filtering
 *
 * Event → Accounting Engine → Journal Entries
 * Manual transactions automatically create double-entry journal records.
 */

import express from "express";
import { supabaseAdmin } from "./supabaseClient.mjs";
import { recordManualTransaction } from "./accountingEngine.mjs";

const router = express.Router();

/**
 * POST /api/accounting/transactions
 *
 * Body: { type, amount, account, description?, property_id?, tenant_id? }
 */
router.post("/api/accounting/transactions", async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Service not configured." });
    }

    const { type, amount, account, description, property_id, tenant_id } = req.body || {};

    if (!type || !["income", "expense"].includes(String(type))) {
      return res.status(400).json({ error: "type must be 'income' or 'expense'." });
    }

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ error: "amount must be a positive number." });
    }

    if (!account || typeof account !== "string" || !account.trim()) {
      return res.status(400).json({ error: "account is required." });
    }

    // Verify account exists in chart of accounts
    const { data: coa, error: coaErr } = await supabaseAdmin
      .from("chart_of_accounts")
      .select("account_name")
      .eq("account_name", account.trim())
      .maybeSingle();

    if (coaErr || !coa) {
      return res.status(400).json({
        error: `Account "${account}" not found in chart of accounts.`,
      });
    }

    const row = {
      type: String(type).toLowerCase(),
      amount: amt,
      account: account.trim(),
      description: description ? String(description).trim() : null,
      property_id: property_id || null,
      tenant_id: tenant_id || null,
    };

    const { data: tx, error } = await supabaseAdmin
      .from("accounting_transactions")
      .insert(row)
      .select("id, type, amount, account, description, property_id, tenant_id, created_at")
      .single();

    if (error) {
      console.error("[accounting/transactions] Insert failed", error);
      return res.status(500).json({ error: "Failed to record transaction." });
    }

    // Event → Accounting Engine → Journal Entries
    let tenantUserId = tx.tenant_id;
    if (tx.tenant_id) {
      const { data: t } = await supabaseAdmin.from("tenants").select("user_id").eq("id", tx.tenant_id).maybeSingle();
      tenantUserId = t?.user_id || null;
    }
    const entryDate = new Date().toISOString().slice(0, 10);
    const { error: journalErr } = await recordManualTransaction(supabaseAdmin, {
      txId: tx.id,
      type: tx.type,
      amount: tx.amount,
      account: tx.account,
      description: tx.description,
      propertyId: tx.property_id,
      tenantId: tenantUserId,
      entryDate,
    });
    if (journalErr) {
      console.error("[accounting/transactions] Journal entry failed", journalErr?.message);
      // Transaction recorded; journal is supplementary - don't fail the request
    }

    return res.status(201).json(tx);
  } catch (err) {
    console.error("[accounting/transactions] POST", err?.message);
    return res.status(500).json({ error: "Failed to record transaction." });
  }
});

/**
 * GET /api/accounting/transactions
 *
 * Query: type, account, property_id, tenant_id, date_from, date_to
 */
router.get("/api/accounting/transactions", async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Service not configured." });
    }

    let query = supabaseAdmin
      .from("accounting_transactions")
      .select("id, type, amount, account, description, property_id, tenant_id, created_at")
      .order("created_at", { ascending: false });

    const { type, account, property_id, tenant_id, date_from, date_to } = req.query;

    if (type && ["income", "expense"].includes(String(type))) {
      query = query.eq("type", String(type).toLowerCase());
    }
    if (account && String(account).trim()) {
      query = query.eq("account", String(account).trim());
    }
    if (property_id && String(property_id).trim()) {
      query = query.eq("property_id", String(property_id).trim());
    }
    if (tenant_id && String(tenant_id).trim()) {
      query = query.eq("tenant_id", String(tenant_id).trim());
    }
    if (date_from && String(date_from).trim()) {
      query = query.gte("created_at", String(date_from).trim());
    }
    if (date_to && String(date_to).trim()) {
      const to = String(date_to).trim();
      // Include full day
      const endOfDay = to.length === 10 ? `${to}T23:59:59.999Z` : to;
      query = query.lte("created_at", endOfDay);
    }

    const { data: list, error } = await query;

    if (error) {
      console.error("[accounting/transactions] List failed", error);
      return res.status(500).json({ error: "Failed to fetch transactions." });
    }

    return res.json(list || []);
  } catch (err) {
    console.error("[accounting/transactions] GET", err?.message);
    return res.status(500).json({ error: "Failed to fetch transactions." });
  }
});

export function createAccountingTransactionRouter() {
  return router;
}
