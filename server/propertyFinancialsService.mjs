/**
 * Property-Level Accounting for DamianixPro
 *
 * GET /api/properties/:id/financials
 * Query: date_from, date_to (optional)
 *
 * Response: { total_income, total_expenses, profit }
 */

import express from "express";
import { supabaseAdmin } from "./supabaseClient.mjs";
import { requireSupabaseJwt } from "./middleware/supabaseJwt.mjs";
import { createAttachUserRole } from "./middleware/attachUserRole.mjs";
import { createRequireRbacPermission } from "./middleware/requireRbacPermission.mjs";

const router = express.Router();
const attachUserRole = createAttachUserRole(supabaseAdmin);
const requireReportsFinancial = createRequireRbacPermission("reports.financial");

/**
 * GET /api/properties/:id/financials
 */
router.get("/api/properties/:id/financials", requireSupabaseJwt, attachUserRole, requireReportsFinancial, async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Service not configured." });
    }

    const propertyId = req.params.id;
    if (!propertyId) {
      return res.status(400).json({ error: "Property ID is required." });
    }

    const { date_from, date_to } = req.query;
    const dateFrom = date_from ? String(date_from).trim().slice(0, 10) : null;
    const dateTo = date_to ? String(date_to).trim().slice(0, 10) : null;

    const { data: coa } = await supabaseAdmin
      .from("chart_of_accounts")
      .select("account_name, account_type");

    const incomeAccounts = (coa || []).filter((a) => a.account_type === "income").map((a) => a.account_name);
    const expenseAccounts = (coa || []).filter((a) => a.account_type === "expense").map((a) => a.account_name);

    if (incomeAccounts.length === 0) incomeAccounts.push("Rent Income");
    if (expenseAccounts.length === 0) expenseAccounts.push("Maintenance Expense");

    let journalIncomeQuery = supabaseAdmin
      .from("journal_entries")
      .select("credit, entry_date")
      .eq("property_id", propertyId)
      .in("account", incomeAccounts);

    let journalExpenseQuery = supabaseAdmin
      .from("journal_entries")
      .select("debit, entry_date")
      .eq("property_id", propertyId)
      .in("account", expenseAccounts);

    if (dateFrom) {
      journalIncomeQuery = journalIncomeQuery.gte("entry_date", dateFrom);
      journalExpenseQuery = journalExpenseQuery.gte("entry_date", dateFrom);
    }
    if (dateTo) {
      journalIncomeQuery = journalIncomeQuery.lte("entry_date", dateTo);
      journalExpenseQuery = journalExpenseQuery.lte("entry_date", dateTo);
    }

    const [journalIncomeRes, journalExpenseRes] = await Promise.all([
      journalIncomeQuery,
      journalExpenseQuery,
    ]);

    let totalIncome = (journalIncomeRes.data || []).reduce((s, r) => s + Number(r.credit || 0), 0);
    let totalExpenses = (journalExpenseRes.data || []).reduce((s, r) => s + Number(r.debit || 0), 0);

    const hasJournal = (journalIncomeRes.data || []).length > 0 || (journalExpenseRes.data || []).length > 0;

    if (!hasJournal) {
      let atIncome = supabaseAdmin
        .from("accounting_transactions")
        .select("amount")
        .eq("property_id", propertyId)
        .eq("type", "income");
      let atExpense = supabaseAdmin
        .from("accounting_transactions")
        .select("amount")
        .eq("property_id", propertyId)
        .eq("type", "expense");
      let expQuery = supabaseAdmin.from("expenses").select("amount").eq("property_id", propertyId);

      if (dateFrom) {
        atIncome = atIncome.gte("created_at", dateFrom);
        atExpense = atExpense.gte("created_at", dateFrom);
        expQuery = expQuery.gte("created_at", dateFrom);
      }
      if (dateTo) {
        atIncome = atIncome.lte("created_at", `${dateTo}T23:59:59.999Z`);
        atExpense = atExpense.lte("created_at", `${dateTo}T23:59:59.999Z`);
        expQuery = expQuery.lte("created_at", `${dateTo}T23:59:59.999Z`);
      }

      const [atInc, atExp, exp] = await Promise.all([atIncome, atExpense, expQuery]);
      totalIncome = (atInc.data || []).reduce((s, r) => s + Number(r.amount || 0), 0);
      totalExpenses =
        (atExp.data || []).reduce((s, r) => s + Number(r.amount || 0), 0) +
        (exp.data || []).reduce((s, r) => s + Number(r.amount || 0), 0);
    }

    const profit = totalIncome - totalExpenses;

    return res.json({
      total_income: Math.round(totalIncome * 100) / 100,
      total_expenses: Math.round(totalExpenses * 100) / 100,
      profit: Math.round(profit * 100) / 100,
    });
  } catch (err) {
    console.error("[properties/financials]", err?.message);
    return res.status(500).json({ error: "Failed to fetch property financials." });
  }
});

export function createPropertyFinancialsRouter() {
  return router;
}
