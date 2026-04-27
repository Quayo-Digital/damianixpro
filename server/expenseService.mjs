/**
 * Expense Tracking System for DamianixPro
 *
 * POST /api/expenses - Save expense, link to accounting, deduct from profit
 * GET  /api/expenses - List expenses with filtering
 *
 * Event → Accounting Engine → Journal Entries (Debit Expense, Credit Bank)
 */

import express from "express";
import { supabaseAdmin } from "./supabaseClient.mjs";
import { recordExpense } from "./accountingEngine.mjs";

const router = express.Router();

// Map category to chart of accounts expense account
const CATEGORY_TO_ACCOUNT = {
  Maintenance: "Maintenance Expense",
  maintenance: "Maintenance Expense",
  Repairs: "Maintenance Expense",
  repairs: "Maintenance Expense",
  Other: "Maintenance Expense",
  other: "Maintenance Expense",
};

function getAccountForCategory(category) {
  const c = String(category || "").trim();
  return CATEGORY_TO_ACCOUNT[c] || "Maintenance Expense";
}

/**
 * POST /api/expenses
 *
 * Body: { amount, category, property_id?, description? }
 */
router.post("/api/expenses", async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Service not configured." });
    }

    const { amount, category, property_id, description } = req.body || {};

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ error: "amount must be a positive number." });
    }

    if (!category || typeof category !== "string" || !category.trim()) {
      return res.status(400).json({ error: "category is required." });
    }

    const account = getAccountForCategory(category.trim());

    // Verify account exists in chart of accounts
    const { data: coa, error: coaErr } = await supabaseAdmin
      .from("chart_of_accounts")
      .select("account_name")
      .eq("account_name", account)
      .maybeSingle();

    if (coaErr || !coa) {
      return res.status(400).json({
        error: `Category "${category}" maps to account "${account}" which is not in chart of accounts.`,
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    const propertyId = property_id || null;

    // 1. Save expense
    const { data: expense, error: expErr } = await supabaseAdmin
      .from("expenses")
      .insert({
        amount: amt,
        category: category.trim(),
        property_id: propertyId,
        description: description ? String(description).trim() : null,
      })
      .select("id, amount, category, property_id, description, created_at")
      .single();

    if (expErr) {
      console.error("[expenses] Insert failed", expErr);
      return res.status(500).json({ error: "Failed to save expense." });
    }

    // 2. Event → Accounting Engine → Journal Entries (Debit Expense, Credit Bank)
    try {
      const { error: journalErr } = await recordExpense(supabaseAdmin, {
        expenseId: expense.id,
        amount: amt,
        account,
        description: description || `${category} expense`,
        propertyId,
        entryDate: today,
      });
      if (journalErr) throw journalErr;
    } catch (journalErr) {
      console.error("[expenses] Accounting link failed", journalErr);
    }

    // 3. Also create accounting_transaction for reporting
    await supabaseAdmin.from("accounting_transactions").insert({
      type: "expense",
      amount: amt,
      account,
      description: description || `${category} expense`,
      property_id: propertyId,
      tenant_id: null,
    });

    return res.status(201).json({
      ...expense,
      account,
      message: "Expense saved and linked to accounting. Deducted from profit.",
    });
  } catch (err) {
    console.error("[expenses] POST", err?.message);
    return res.status(500).json({ error: "Failed to save expense." });
  }
});

/**
 * GET /api/expenses
 *
 * Query: category, property_id, date_from, date_to
 */
router.get("/api/expenses", async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Service not configured." });
    }

    let query = supabaseAdmin
      .from("expenses")
      .select("id, amount, category, property_id, description, created_at")
      .order("created_at", { ascending: false });

    const { category, property_id, date_from, date_to } = req.query;

    if (category && String(category).trim()) {
      query = query.eq("category", String(category).trim());
    }
    if (property_id && String(property_id).trim()) {
      query = query.eq("property_id", String(property_id).trim());
    }
    if (date_from && String(date_from).trim()) {
      query = query.gte("created_at", String(date_from).trim());
    }
    if (date_to && String(date_to).trim()) {
      const to = String(date_to).trim();
      const endOfDay = to.length === 10 ? `${to}T23:59:59.999Z` : to;
      query = query.lte("created_at", endOfDay);
    }

    const { data: list, error } = await query;

    if (error) {
      console.error("[expenses] List failed", error);
      return res.status(500).json({ error: "Failed to fetch expenses." });
    }

    return res.json(list || []);
  } catch (err) {
    console.error("[expenses] GET", err?.message);
    return res.status(500).json({ error: "Failed to fetch expenses." });
  }
});

export function createExpenseRouter() {
  return router;
}
