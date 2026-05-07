/**
 * Profit and Loss Report for DamianixPro
 *
 * GET /api/reports/profit-loss
 * Query: date_from, date_to (optional - filter by created_at)
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
 * GET /api/reports/profit-loss
 *
 * Uses journal_entries (single source) + accounting_transactions + expenses table.
 * Income: journal credits to Rent Income + accounting_transactions type=income
 * Expenses: journal debits to expense accounts + accounting_transactions type=expense + expenses table
 * Avoids double-count by preferring journal_entries; accounting_transactions/expenses supplement.
 */
router.get("/api/reports/profit-loss", requireSupabaseJwt, attachUserRole, requireReportsFinancial, async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Service not configured." });
    }

    const { date_from, date_to } = req.query;
    const dateFrom = date_from ? String(date_from).trim().slice(0, 10) : null;
    const dateTo = date_to ? String(date_to).trim().slice(0, 10) : null;

    // Get income/expense accounts from chart_of_accounts
    const { data: coa } = await supabaseAdmin
      .from("chart_of_accounts")
      .select("account_name, account_type");

    const incomeAccounts = (coa || []).filter((a) => a.account_type === "income").map((a) => a.account_name);
    const expenseAccounts = (coa || []).filter((a) => a.account_type === "expense").map((a) => a.account_name);

    // Fallback if chart empty
    if (incomeAccounts.length === 0) incomeAccounts.push("Rent Income");
    if (expenseAccounts.length === 0) expenseAccounts.push("Maintenance Expense");

    // Journal entries: income = sum(credit) for income accounts, expenses = sum(debit) for expense accounts
    let journalIncomeQuery = supabaseAdmin
      .from("journal_entries")
      .select("credit, entry_date")
      .in("account", incomeAccounts);

    let journalExpenseQuery = supabaseAdmin
      .from("journal_entries")
      .select("debit, entry_date")
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

    // Supplement with accounting_transactions (for manual entries not in journal)
    let atIncomeQuery = supabaseAdmin.from("accounting_transactions").select("amount, created_at").eq("type", "income");
    let atExpenseQuery = supabaseAdmin.from("accounting_transactions").select("amount, created_at").eq("type", "expense");

    if (dateFrom) {
      atIncomeQuery = atIncomeQuery.gte("created_at", dateFrom);
      atExpenseQuery = atExpenseQuery.gte("created_at", dateFrom);
    }
    if (dateTo) {
      atIncomeQuery = atIncomeQuery.lte("created_at", `${dateTo}T23:59:59.999Z`);
      atExpenseQuery = atExpenseQuery.lte("created_at", `${dateTo}T23:59:59.999Z`);
    }

    const [atIncomeRes, atExpenseRes] = await Promise.all([atIncomeQuery, atExpenseQuery]);

    totalIncome += (atIncomeRes.data || []).reduce((s, r) => s + Number(r.amount || 0), 0);
    totalExpenses += (atExpenseRes.data || []).reduce((s, r) => s + Number(r.amount || 0), 0);

    // Supplement with expenses table (expense API creates both journal + expenses; journal may have different date)
    let expQuery = supabaseAdmin.from("expenses").select("amount, created_at");
    if (dateFrom) expQuery = expQuery.gte("created_at", dateFrom);
    if (dateTo) expQuery = expQuery.lte("created_at", `${dateTo}T23:59:59.999Z`);
    const { data: expData } = await expQuery;
    totalExpenses += (expData || []).reduce((s, r) => s + Number(r.amount || 0), 0);

    // Deduplicate: expense API creates journal + accounting_transaction + expenses. Use journal as primary.
    // For simplicity, use only journal_entries for P&L to avoid any double-count.
    // If journal has data, trust it. Otherwise use accounting_transactions + expenses.
    const hasJournalIncome = (journalIncomeRes.data || []).length > 0;
    const hasJournalExpense = (journalExpenseRes.data || []).length > 0;

    if (hasJournalIncome || hasJournalExpense) {
      totalIncome = (journalIncomeRes.data || []).reduce((s, r) => s + Number(r.credit || 0), 0);
      totalExpenses = (journalExpenseRes.data || []).reduce((s, r) => s + Number(r.debit || 0), 0);
    } else {
      totalIncome = (atIncomeRes.data || []).reduce((s, r) => s + Number(r.amount || 0), 0);
      totalExpenses =
        (atExpenseRes.data || []).reduce((s, r) => s + Number(r.amount || 0), 0) +
        (expData || []).reduce((s, r) => s + Number(r.amount || 0), 0);
    }

    const netProfit = totalIncome - totalExpenses;

    return res.json({
      total_income: Math.round(totalIncome * 100) / 100,
      total_expenses: Math.round(totalExpenses * 100) / 100,
      net_profit: Math.round(netProfit * 100) / 100,
    });
  } catch (err) {
    console.error("[reports/profit-loss]", err?.message);
    return res.status(500).json({ error: "Failed to generate profit and loss report." });
  }
});

export function createProfitLossReportRouter() {
  return router;
}
