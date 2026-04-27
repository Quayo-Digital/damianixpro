import express from 'express';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from './supabaseClient.mjs';
import { isWebPushConfigured, sendWebPushForUser } from './webPushService.mjs';
import { classifyIntent } from './intentDetectionService.mjs';

const router = express.Router();

const jwtSecret = process.env.SUPABASE_JWT_SECRET;
const port = process.env.VOICE_SERVER_PORT || 4000;
const VOICE_SERVER_URL = process.env.VOICE_SERVER_URL || `http://localhost:${port}`;
const BASE_URL = `http://127.0.0.1:${port}`;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

function getTokenFromHeader(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;
  const [scheme, token] = authHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

async function getTenantFromToken(token) {
  if (!jwtSecret) return null;
  try {
    const payload = jwt.verify(token, jwtSecret);
    const userId = payload.sub || payload.user_id || payload.id;
    if (!userId || !supabaseAdmin) return null;

    const { data: tenant, error } = await supabaseAdmin
      .from('tenants')
      .select('id, first_name, last_name, phone, email, user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !tenant) return null;
    return tenant;
  } catch {
    return null;
  }
}

async function getProfileFromToken(token) {
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

    return profile || null;
  } catch {
    return null;
  }
}

function getMonthRange() {
  const d = new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { dateFrom: start, dateTo: end };
}

function extractExpenseCategory(message) {
  const lower = String(message || '').toLowerCase();
  if (/\bmaintenance\b/.test(lower)) return 'Maintenance';
  if (/\brepair(s)?\b/.test(lower)) return 'Maintenance';
  if (/\butilit(y|ies)\b/.test(lower)) return 'Other';
  return 'Maintenance'; // default for "spending" queries
}

async function fetchProfitLoss(dateFrom, dateTo) {
  const params = new URLSearchParams();
  if (dateFrom) params.set('date_from', dateFrom);
  if (dateTo) params.set('date_to', dateTo);
  const qs = params.toString();
  const res = await fetch(`${BASE_URL}/api/reports/profit-loss${qs ? `?${qs}` : ''}`);
  return res.ok ? res.json() : null;
}

async function fetchExpenses(category, dateFrom, dateTo) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (dateFrom) params.set('date_from', dateFrom);
  if (dateTo) params.set('date_to', dateTo);
  const qs = params.toString();
  const res = await fetch(`${BASE_URL}/api/expenses${qs ? `?${qs}` : ''}`);
  return res.ok ? res.json() : null;
}

async function fetchRentBalance(token) {
  const res = await fetch(`${VOICE_SERVER_URL}/api/tenant/rent-balance`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

async function createFlutterwavePayment(tenantId, amount, redirectUrl) {
  const res = await fetch(`${VOICE_SERVER_URL}/api/payments/rent/flutterwave`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenant_id: tenantId,
      amount,
      redirect_url: redirectUrl,
    }),
  });
  if (!res.ok) return null;
  return res.json();
}

async function sendSMS(phone, message) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) return false;
  const to = phone?.startsWith('+') ? phone : phone ? `+234${String(phone).replace(/^0/, '')}` : null;
  if (!to) return false;
  const params = new URLSearchParams({
    To: to,
    From: TWILIO_PHONE_NUMBER,
    Body: message,
  });
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization:
          'Basic ' +
          Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    }
  );
  return res.ok;
}

async function sendWhatsApp(to, text) {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) return false;
  const cleanTo = String(to).replace(/\D/g, '');
  if (!cleanTo) return false;
  const res = await fetch(`https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanTo,
      type: 'text',
      text: { body: text },
    }),
  });
  return res.ok;
}

function isConfirmation(message) {
  const lower = String(message || '').toLowerCase().trim();
  return /^(yes|yeah|yep|confirm|okay|ok|proceed|go ahead|sure|please do|do it)$/.test(lower);
}

router.post('/api/ai/assistant', async (req, res) => {
  try {
    const token = getTokenFromHeader(req) || req.body?.auth_token;
    const message = String(req.body?.message ?? req.body?.transcript ?? '').trim();
    const context = req.body?.context || {};

    if (!message) {
      return res.json({
        reply: "I didn't catch that. Could you please repeat?",
        context: {},
      });
    }

    if (!token) {
      return res.json({
        reply: 'Please log in to use the voice assistant.',
        context: {},
      });
    }

    const tenant = await getTenantFromToken(token);
    const profile = await getProfileFromToken(token);
    const isOwnerOrManager = profile && ['admin', 'owner', 'agent', 'manager', 'super_admin'].includes(profile.role);

    if (!tenant && !isOwnerOrManager) {
      return res.json({
        reply: "Please log in to use the voice assistant.",
        context: {},
      });
    }

    const { intent, confidence } = await classifyIntent(message);

    // Accounting / financial intents (owners and managers)
    if (isOwnerOrManager && confidence >= 0.6) {
      const { dateFrom, dateTo } = getMonthRange();
      const financialIntents = [
        'financial_total_income',
        'financial_total_expenses',
        'financial_net_profit',
        'financial_expenses_by_category',
        'landlord_financial_report',
      ];

      if (financialIntents.includes(intent)) {
        // Total income
        if (intent === 'financial_total_income' || (intent === 'landlord_financial_report' && /\b(income|revenue|earned)\b/i.test(message))) {
          const pl = await fetchProfitLoss(dateFrom, dateTo);
          const income = pl?.total_income ?? 0;
          return res.json({
            reply: `Your total income this month is ₦${Number(income).toLocaleString()}.`,
            context: {},
          });
        }

        // Expenses by category (maintenance, repairs)
        if (intent === 'financial_expenses_by_category' || (intent === 'landlord_financial_report' && /\b(maintenance|repair|spent on)\b/i.test(message))) {
          const category = extractExpenseCategory(message);
          const expenses = await fetchExpenses(category, dateFrom, dateTo);
          const total = Array.isArray(expenses) ? expenses.reduce((s, e) => s + Number(e.amount || 0), 0) : 0;
          return res.json({
            reply: `You spent ₦${Number(total).toLocaleString()} on ${category.toLowerCase()} this month.`,
            context: {},
          });
        }

        // Total expenses
        if (intent === 'financial_total_expenses' || (intent === 'landlord_financial_report' && /\b(expense|spent|spending|cost)\b/i.test(message))) {
          const pl = await fetchProfitLoss(dateFrom, dateTo);
          const expenses = pl?.total_expenses ?? 0;
          return res.json({
            reply: `Your total expenses this month are ₦${Number(expenses).toLocaleString()}.`,
            context: {},
          });
        }

        // Net profit
        if (intent === 'financial_net_profit' || (intent === 'landlord_financial_report' && /\b(profit|net|earnings)\b/i.test(message))) {
          const pl = await fetchProfitLoss(dateFrom, dateTo);
          const profit = pl?.net_profit ?? (pl?.total_income ?? 0) - (pl?.total_expenses ?? 0);
          return res.json({
            reply: `Your net profit this month is ₦${Number(profit).toLocaleString()}.`,
            context: {},
          });
        }

        // Fallback: full P&L summary
        const pl = await fetchProfitLoss(dateFrom, dateTo);
        const income = pl?.total_income ?? 0;
        const exp = pl?.total_expenses ?? 0;
        const profit = pl?.net_profit ?? income - exp;
        return res.json({
          reply: `This month: income ₦${Number(income).toLocaleString()}, expenses ₦${Number(exp).toLocaleString()}, profit ₦${Number(profit).toLocaleString()}.`,
          context: {},
        });
      }
    }

    // Tenant-only intents
    if (!tenant) {
      return res.json({
        reply: "I can help you pay your rent, check your balance, or report maintenance. Say 'pay my rent' to get started.",
        context: {},
      });
    }

    if (intent === 'pay_rent' && confidence >= 0.6) {
      const awaitingConfirm = context.awaiting_pay_confirmation === true;
      const hasConfirmData = context.tenant_id && context.amount != null;

      if (awaitingConfirm && hasConfirmData && isConfirmation(message)) {
        const { tenant_id, amount } = context;
        const redirectUrl =
          process.env.PAYMENT_REDIRECT_URL ||
          `${VOICE_SERVER_URL}/api/payments/callback`;

        const payment = await createFlutterwavePayment(tenant_id, amount, redirectUrl);
        if (!payment?.payment_link) {
          return res.json({
            reply: "I couldn't generate the payment link. Please try again later.",
            context: {},
          });
        }

        const link = payment.payment_link;
        const amountStr = Number(amount).toLocaleString();
        const smsMsg = `DamianixPro: Pay your rent of ₦${amountStr}. Secure link: ${link}`;
        const waMsg = `DamianixPro: Pay your rent of ₦${amountStr}.\n\nSecure payment link: ${link}`;

        let sentVia = [];
        if (tenant.phone && (await sendSMS(tenant.phone, smsMsg))) sentVia.push('SMS');
        const waNumber = tenant.phone?.replace(/\D/g, '') || tenant.email;
        if (waNumber && (await sendWhatsApp(waNumber, waMsg))) sentVia.push('WhatsApp');

        if (tenant.user_id && supabaseAdmin) {
          const notifTitle = 'Rent Payment Link';
          const notifDesc = `Your rent payment link for ₦${amountStr}: ${link}`;
          const tenantLink = '/tenant';
          const { error: notifErr } = await supabaseAdmin.from('notifications').insert({
            user_id: tenant.user_id,
            title: notifTitle,
            description: notifDesc,
            type: 'payment',
            link: tenantLink,
            metadata: { payment_link: link, amount, tx_ref: payment.tx_ref },
          });
          if (!notifErr) {
            sentVia.push('in-app');
            if (isWebPushConfigured()) {
              void sendWebPushForUser(tenant.user_id, {
                title: notifTitle,
                body: notifDesc,
                url: tenantLink,
              });
            }
          }
        }

        return res.json({
          reply:
            "I've generated a secure payment link for you. Please check your phone to complete the payment.",
          context: {},
          payment_link: link,
          sent_via: sentVia,
        });
      }

      const balanceData = await fetchRentBalance(token);
      if (!balanceData) {
        return res.json({
          reply: "I couldn't fetch your rent balance. Please try again.",
          context: {},
        });
      }

      const balance = Number(balanceData.balance) || 0;
      if (balance <= 0) {
        return res.json({
          reply: "You don't have any outstanding rent balance. You're all set!",
          context: {},
        });
      }

      const amountStr = balance.toLocaleString();
      return res.json({
        reply: `Your rent balance is ₦${amountStr}. Would you like me to generate a payment link? Say yes to confirm.`,
        context: {
          awaiting_pay_confirmation: true,
          tenant_id: balanceData.tenant_id,
          amount: balance,
        },
      });
    }

    if (intent === 'check_rent_balance' && confidence >= 0.6) {
      const balanceData = await fetchRentBalance(token);
      if (!balanceData) {
        return res.json({
          reply: "I couldn't fetch your rent balance. Please try again.",
          context: {},
        });
      }
      const balance = Number(balanceData.balance) || 0;
      const amountStr = balance.toLocaleString();
      return res.json({
        reply:
          balance > 0
            ? `Your rent balance is ₦${amountStr}. Say "pay my rent" to get a payment link.`
            : "You don't have any outstanding rent. You're all set!",
        context: {},
      });
    }

    return res.json({
      reply:
        isOwnerOrManager
          ? "Ask about your income, expenses, profit, or spending on maintenance. For example: 'What is my total income this month?' or 'How much did I spend on maintenance?'"
          : "I can help you pay your rent, check your balance, or report maintenance. Say 'pay my rent' to get started.",
      context: {},
    });
  } catch (err) {
    console.error('[voice-assistant]', err);
    return res.json({
      reply: "Something went wrong. Please try again.",
      context: {},
    });
  }
});

export function createVoiceAssistantRouter() {
  return router;
}
