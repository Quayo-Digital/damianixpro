/**
 * Cash Flow Report for DamianixPro
 *
 * GET /api/reports/cash-flow
 * Query: date_from, date_to (optional - period for money in/out)
 *
 * Response: opening_balance, money_in, money_out, closing_balance
 */

import express from "express";
import { supabaseAdmin } from "./supabaseClient.mjs";

const router = express.Router();

// Cash/bank accounts (asset type)
const CASH_ACCOUNTS = ["Bank Account", "Bank", "Cash", "Cash/Bank Account"];

/**
 * GET /api/reports/cash-flow
 */
router.get("/api/reports/cash-flow", async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Service not configured." });
    }

    const { date_from, date_to } = req.query;
    const dateFrom = date_from ? String(date_from).trim().slice(0, 10) : null;
    const dateTo = date_to ? String(date_to).trim().slice(0, 10) : null;

    // Get asset accounts from chart (cash/bank)
    const { data: coa } = await supabaseAdmin
      .from("chart_of_accounts")
      .select("account_name")
      .eq("account_type", "asset");

    const cashAccounts =
      (coa || []).map((a) => a.account_name).filter(Boolean).length > 0
        ? (coa || []).map((a) => a.account_name)
        : CASH_ACCOUNTS;

    // All journal entries for cash accounts
    const { data: allEntries } = await supabaseAdmin
      .from("journal_entries")
      .select("entry_date, debit, credit")
      .in("account", cashAccounts);

    const entries = allEntries || [];

    let openingBalance = 0;
    let moneyIn = 0;
    let moneyOut = 0;

    if (!dateFrom && !dateTo) {
      openingBalance = 0;
      moneyIn = entries.reduce((s, e) => s + Number(e.debit || 0), 0);
      moneyOut = entries.reduce((s, e) => s + Number(e.credit || 0), 0);
    } else {
      openingBalance = entries
        .filter((e) => ((e.entry_date || "").slice(0, 10)) < (dateFrom || "0000-01-01"))
        .reduce((s, e) => s + Number(e.debit || 0) - Number(e.credit || 0), 0);

      const inPeriod = (e) => {
        const d = (e.entry_date || "").slice(0, 10);
        if (dateFrom && d < dateFrom) return false;
        if (dateTo && d > dateTo) return false;
        return true;
      };

      moneyIn = entries.filter(inPeriod).reduce((s, e) => s + Number(e.debit || 0), 0);
      moneyOut = entries.filter(inPeriod).reduce((s, e) => s + Number(e.credit || 0), 0);
    }

    const closingBalance = openingBalance + moneyIn - moneyOut;

    return res.json({
      opening_balance: Math.round(openingBalance * 100) / 100,
      money_in: Math.round(moneyIn * 100) / 100,
      money_out: Math.round(moneyOut * 100) / 100,
      closing_balance: Math.round(closingBalance * 100) / 100,
    });
  } catch (err) {
    console.error("[reports/cash-flow]", err?.message);
    return res.status(500).json({ error: "Failed to generate cash flow report." });
  }
});

export function createCashFlowReportRouter() {
  return router;
}
