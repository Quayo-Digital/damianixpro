/**
 * AI Financial Assistant for DamianixPro
 *
 * POST /api/ai/financial-assistant
 *
 * Capabilities:
 * - Answer financial questions (profit, income, expenses)
 * - Analyze spending
 * - Predict revenue
 * - Suggest cost savings
 *
 * Requires: OPENAI_API_KEY
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from './supabaseClient.mjs';
import { OpenAI } from 'openai';

const router = express.Router();
const port = process.env.VOICE_SERVER_PORT || 4000;
const baseUrl = `http://127.0.0.1:${port}`;

const openai =
  process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

function getTokenFromHeader(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;
  const [scheme, token] = authHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

async function getUserFromToken(token) {
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  if (!jwtSecret || !supabaseAdmin) return null;
  try {
    const payload = jwt.verify(token, jwtSecret);
    const userId = payload.sub || payload.user_id || payload.id;
    if (!userId) return null;

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, role, full_name')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) return null;
    return { id: profile.id, role: profile.role, full_name: profile.full_name };
  } catch {
    return null;
  }
}

async function fetchFinancialContext(dateFrom, dateTo, ownerId) {
  const params = new URLSearchParams();
  if (dateFrom) params.set('date_from', dateFrom);
  if (dateTo) params.set('date_to', dateTo);
  if (ownerId) params.set('owner_id', ownerId);

  const qs = params.toString();
  const suffix = qs ? `?${qs}` : '';

  const [profitLossRes, cashFlowRes, expensesRes, transactionsRes, insightsRes] =
    await Promise.all([
      fetch(`${baseUrl}/api/reports/profit-loss${suffix}`),
      fetch(`${baseUrl}/api/reports/cash-flow${suffix}`),
      fetch(`${baseUrl}/api/expenses${suffix}`),
      fetch(`${baseUrl}/api/accounting/transactions${suffix}`),
      fetch(`${baseUrl}/api/payments/insights${ownerId ? `?owner_id=${ownerId}` : ''}`),
    ]);

  const profitLoss = profitLossRes.ok ? await profitLossRes.json() : null;
  const cashFlow = cashFlowRes.ok ? await cashFlowRes.json() : null;
  const expenses = expensesRes.ok ? await expensesRes.json() : [];
  const transactionsRaw = transactionsRes.ok ? await transactionsRes.json() : null;
  const transactions = Array.isArray(transactionsRaw) ? transactionsRaw : [];
  const insights = insightsRes.ok ? await insightsRes.json() : null;

  // Spending analysis: group expenses by category
  const byCategory = {};
  for (const e of Array.isArray(expenses) ? expenses : []) {
    const cat = e.category || 'Other';
    byCategory[cat] = (byCategory[cat] || 0) + Number(e.amount || 0);
  }

  // Month-over-month expense change (simplified)
  const expenseList = Array.isArray(expenses) ? expenses : [];
  const thisMonth = new Date().toISOString().slice(0, 7);
  const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 7);
  const thisMonthExp = expenseList
    .filter((e) => (e.created_at || '').slice(0, 7) === thisMonth)
    .reduce((s, e) => s + Number(e.amount || 0), 0);
  const lastMonthExp = expenseList
    .filter((e) => (e.created_at || '').slice(0, 7) === lastMonth)
    .reduce((s, e) => s + Number(e.amount || 0), 0);
  const expenseChangePct =
    lastMonthExp > 0
      ? Math.round(((thisMonthExp - lastMonthExp) / lastMonthExp) * 100)
      : 0;

  return {
    profitLoss,
    cashFlow,
    expenses: expenseList,
    transactions: Array.isArray(transactions) ? transactions : [],
    insights,
    spendingByCategory: byCategory,
    expenseChangePct,
    thisMonthExpenses: thisMonthExp,
    lastMonthExpenses: lastMonthExp,
  };
}

router.post('/api/ai/financial-assistant', async (req, res) => {
  try {
    const token = getTokenFromHeader(req) || req.body?.auth_token;
    const message = String(req.body?.message ?? req.body?.question ?? '').trim();
    const dateFrom = req.body?.date_from || null;
    const dateTo = req.body?.date_to || null;

    if (!message) {
      return res.status(400).json({
        reply: "I didn't receive a question. Please ask something like: 'How much profit did I make this month?'",
      });
    }

    if (!token) {
      return res.status(401).json({
        reply: 'Please log in to use the financial assistant.',
      });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(401).json({
        reply: "I couldn't verify your account. Please log in again.",
      });
    }

    const allowedRoles = ['admin', 'owner', 'agent', 'manager', 'super_admin'];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        reply: 'The financial assistant is available to property owners and managers only.',
      });
    }

    if (!openai) {
      return res.status(503).json({
        reply: 'The AI financial assistant is not configured. Please contact support.',
      });
    }

    const ownerId = user.role === 'owner' ? user.id : req.body?.owner_id || null;
    const ctx = await fetchFinancialContext(dateFrom, dateTo, ownerId);

    const systemPrompt = [
      'You are DamianixPro AI Financial Assistant for Nigerian property management.',
      'You help owners and managers understand their finances: profit, income, expenses, spending trends, revenue predictions, and cost-saving suggestions.',
      'Be concise (2-4 sentences). Use Nigerian Naira (₦). Format large numbers as ₦XM (e.g. ₦9M).',
      '',
      'Financial data (use this to answer):',
      JSON.stringify(
        {
          profit_loss: ctx.profitLoss
            ? {
                total_income: ctx.profitLoss.total_income,
                total_expenses: ctx.profitLoss.total_expenses,
                net_profit: ctx.profitLoss.net_profit ?? ctx.profitLoss.profit,
              }
            : null,
          cash_flow: ctx.cashFlow,
          spending_by_category: ctx.spendingByCategory,
          expense_change_vs_last_month_pct: ctx.expenseChangePct,
          this_month_expenses: ctx.thisMonthExpenses,
          last_month_expenses: ctx.lastMonthExpenses,
          revenue_prediction: ctx.insights?.revenue_prediction
            ? {
                predicted_amount: ctx.insights.revenue_prediction.predicted_amount,
                narrative: ctx.insights.revenue_prediction.narrative,
              }
            : null,
          late_payments: ctx.insights?.late_payments
            ? {
                count: ctx.insights.late_payments.count,
                total_amount: ctx.insights.late_payments.total_amount,
              }
            : null,
          top_tenants: ctx.insights?.top_tenants,
          recent_expenses_sample: (ctx.expenses || []).slice(0, 5).map((e) => ({
            category: e.category,
            amount: e.amount,
            description: e.description,
          })),
        },
        null,
        2
      ),
      '',
      'When asked about profit, income, or expenses, cite the numbers above.',
      'When asked to analyze spending, mention categories and any notable increase (e.g. "Maintenance costs increased by 20%").',
      'When asked about revenue prediction, use the revenue_prediction data.',
      'When suggesting cost savings, consider: maintenance optimization, late payment reduction, expense categories.',
    ].join('\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      max_tokens: 400,
      temperature: 0.3,
    });

    const reply =
      response.choices?.[0]?.message?.content?.trim() ||
      "I couldn't generate a response. Please try rephrasing your question.";

    return res.json({ reply });
  } catch (err) {
    console.error('[ai/financial-assistant]', err?.message);
    return res.status(500).json({
      reply: "Something went wrong. Please try again in a moment.",
    });
  }
});

export function createAIFinancialAssistantRouter() {
  return router;
}
