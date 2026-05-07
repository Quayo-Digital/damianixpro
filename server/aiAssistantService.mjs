/**
 * DamianixPro NL → data assistant (extendable intent registry).
 *
 * POST /api/ai/query
 * Body: { query: string, preferOpenAI?: boolean }
 *
 * RBAC: properties.read (same cohort as property-scoped operational data).
 * Optional: OPENAI_API_KEY + preferOpenAI or AI_QUERY_OPENAI_FALLBACK=true to resolve unknown intents.
 */

import express from 'express';
import { OpenAI } from 'openai';
import { supabaseAdmin } from './supabaseClient.mjs';
import { requireSupabaseJwt } from './middleware/supabaseJwt.mjs';
import { createAttachUserRole } from './middleware/attachUserRole.mjs';
import { createRequireRbacPermission } from './middleware/requireRbacPermission.mjs';
import { createRequireMinimumPlan } from './middleware/requireSubscriptionEntitlement.mjs';
import { apiStatusFromRent, isOverdueRentRow, mapRentRowToLegacyPayment } from './rentLedgerCompat.mjs';

const router = express.Router();
const attachUserRole = createAttachUserRole(supabaseAdmin);
const authChain = [
  requireSupabaseJwt,
  attachUserRole,
  createRequireRbacPermission('properties.read'),
  createRequireMinimumPlan('pro'),
];

const openai =
  process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const INTENTS = /** @type {const} */ ([
  'tenants_owing_rent',
  'rent_report_summary',
  'vacant_properties',
  'unknown',
]);

/** @returns {typeof INTENTS[number]} */
function normalizeIntent(s) {
  const x = String(s || '').trim();
  return INTENTS.includes(x) ? x : 'unknown';
}

async function getVisiblePropertyIds(uid, role) {
  if (
    role === 'admin' ||
    role === 'super_admin' ||
    role === 'accountant' ||
    role === 'facility_manager'
  ) {
    return null;
  }
  if (role === 'owner') {
    const { data } = await supabaseAdmin.from('properties').select('id').eq('owner_id', uid);
    return (data || []).map((r) => r.id);
  }
  if (role === 'agent') {
    const { data } = await supabaseAdmin.from('properties').select('id').eq('agent_id', uid);
    return (data || []).map((r) => r.id);
  }
  if (role === 'manager') {
    const { data } = await supabaseAdmin
      .from('properties')
      .select('id')
      .or(`agent_id.eq.${uid},owner_id.eq.${uid}`);
    return (data || []).map((r) => r.id);
  }
  return [];
}

function detectIntentRules(text) {
  const q = String(text || '').toLowerCase();
  if (!q.trim()) return 'unknown';

  if (
    /owing|owe|arrears|overdue|unpaid|past due|due rent|outstanding rent|tenants.*rent|who.*not paid/.test(
      q
    )
  ) {
    return 'tenants_owing_rent';
  }
  if (/rent report|payment report|collections|generate rent|rent summary|revenue from rent/.test(q)) {
    return 'rent_report_summary';
  }
  if (/vacant|unoccupied|empty (properties|units)|available (properties|listings)/.test(q)) {
    return 'vacant_properties';
  }
  return 'unknown';
}

async function detectIntentOpenAI(userQuery) {
  if (!openai) return 'unknown';
  const model = process.env.OPENAI_AI_QUERY_MODEL || process.env.OPENAI_SUPPORT_MODEL || 'gpt-4o-mini';
  const res = await openai.chat.completions.create({
    model,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Classify the user's message for a property management app. Reply with JSON only: {"intent":"tenants_owing_rent"|"rent_report_summary"|"vacant_properties"|"unknown"}.
- tenants_owing_rent: who owes rent, overdue, arrears, unpaid balances.
- rent_report_summary: aggregates, monthly rent collections, reports.
- vacant_properties: empty units/properties, availability.`,
      },
      { role: 'user', content: userQuery.slice(0, 2000) },
    ],
  });
  const raw = res.choices?.[0]?.message?.content;
  if (!raw) return 'unknown';
  try {
    const j = JSON.parse(raw);
    return normalizeIntent(j.intent);
  } catch {
    return 'unknown';
  }
}

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

function isPropertyTenantActiveNow(row) {
  const st = String(row.status || '').toLowerCase();
  if (st !== 'active') return false;
  const start = row.start_date ? String(row.start_date).slice(0, 10) : null;
  const end = row.end_date ? String(row.end_date).slice(0, 10) : null;
  const today = todayISODate();
  if (start && start > today) return false;
  if (end && end < today) return false;
  return true;
}

async function runTenantsOwingRent(visibleIds) {
  const { data: rawRows, error } = await supabaseAdmin.from('rent_payments').select(
    `
      id,
      amount,
      status,
      due_date,
      payment_date,
      property_tenants!inner (
        property_id,
        tenants ( first_name, last_name ),
        properties ( id, name )
      )
    `
  );

  if (error) {
    console.error('[ai/query] tenants owing', error);
    throw new Error('Failed to load rent payments.');
  }

  const rows = (rawRows || []).filter((row) => {
    const pid = row.property_tenants?.property_id;
    if (!pid) return false;
    if (visibleIds && !visibleIds.includes(pid)) return false;
    const legacy = mapRentRowToLegacyPayment(row);
    const st = legacy.status || apiStatusFromRent(row.status);
    if (st === 'PAID' || st === 'CANCELLED') return false;
    if (st === 'OVERDUE') return true;
    if (st === 'PENDING' && isOverdueRentRow(row)) return true;
    return st === 'PENDING';
  });

  const items = rows.slice(0, 100).map((row) => {
    const pt = row.property_tenants || {};
    const t = pt.tenants || {};
    const p = pt.properties || {};
    const legacy = mapRentRowToLegacyPayment(row);
    const name = `${t.first_name || ''} ${t.last_name || ''}`.trim() || 'Tenant';
    return {
      rent_payment_id: row.id,
      property_id: pt.property_id,
      property_name: p.name || 'Property',
      tenant_name: name,
      amount_ngn: Number(row.amount) || 0,
      due_date: row.due_date,
      status: legacy.status || apiStatusFromRent(row.status),
    };
  });

  return {
    kind: 'table',
    title: 'Tenants with outstanding rent',
    columns: [
      { key: 'tenant_name', label: 'Tenant' },
      { key: 'property_name', label: 'Property' },
      { key: 'amount_ngn', label: 'Amount (NGN)', format: 'currency' },
      { key: 'due_date', label: 'Due' },
      { key: 'status', label: 'Status' },
    ],
    rows: items,
    summary: { count: items.length },
  };
}

async function runRentReportSummary(visibleIds) {
  const since = new Date();
  since.setMonth(since.getMonth() - 5);

  const { data: rawRows, error } = await supabaseAdmin
    .from('rent_payments')
    .select(
      `
      amount,
      status,
      due_date,
      payment_date,
      created_at,
      property_tenants!inner ( property_id )
    `
    )
    .gte('created_at', since.toISOString());

  if (error) {
    console.error('[ai/query] rent report', error);
    throw new Error('Failed to load rent data for report.');
  }

  const rows = (rawRows || []).filter((row) => {
    const pid = row.property_tenants?.property_id;
    if (!pid) return false;
    if (visibleIds && !visibleIds.includes(pid)) return false;
    return true;
  });

  const byMonth = new Map();
  for (const row of rows) {
    const ref = (row.payment_date || row.due_date || '').slice(0, 7);
    if (!ref || ref.length < 7) continue;
    const legacy = mapRentRowToLegacyPayment(row);
    const paid = legacy.status === 'PAID';
    const cur = byMonth.get(ref) || { month: ref, collected_ngn: 0, outstanding_ngn: 0, payment_count: 0 };
    const amt = Number(row.amount) || 0;
    if (paid) {
      cur.collected_ngn += amt;
      cur.payment_count += 1;
    } else if (legacy.status !== 'CANCELLED') {
      cur.outstanding_ngn += amt;
    }
    byMonth.set(ref, cur);
  }

  const monthRows = [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));

  return {
    kind: 'table',
    title: 'Rent collections (last ~6 months, scoped to your properties)',
    columns: [
      { key: 'month', label: 'Month' },
      { key: 'collected_ngn', label: 'Collected (NGN)', format: 'currency' },
      { key: 'outstanding_ngn', label: 'Outstanding (NGN)', format: 'currency' },
      { key: 'payment_count', label: 'Paid rows' },
    ],
    rows: monthRows,
    summary: {
      months: monthRows.length,
      total_collected_ngn: monthRows.reduce((s, r) => s + r.collected_ngn, 0),
      total_outstanding_ngn: monthRows.reduce((s, r) => s + r.outstanding_ngn, 0),
    },
  };
}

async function runVacantProperties(visibleIds) {
  let propQuery = supabaseAdmin.from('properties').select('id, name, status, address, city, state');
  if (visibleIds?.length) {
    propQuery = propQuery.in('id', visibleIds);
  } else if (visibleIds && visibleIds.length === 0) {
    return {
      kind: 'table',
      title: 'Vacant properties',
      columns: [
        { key: 'name', label: 'Property' },
        { key: 'location', label: 'Address' },
        { key: 'reason', label: 'Note' },
      ],
      rows: [],
      summary: { count: 0 },
    };
  }

  const { data: properties, error: pe } = await propQuery;
  if (pe) {
    console.error('[ai/query] vacant props', pe);
    throw new Error('Failed to load properties.');
  }

  const ids = (properties || []).map((p) => p.id);
  let leases = [];
  if (ids.length) {
    const { data: ptRows, error: le } = await supabaseAdmin
      .from('property_tenants')
      .select('property_id, status, start_date, end_date')
      .in('property_id', ids);
    if (le) {
      console.error('[ai/query] property_tenants', le);
      throw new Error('Failed to load leases.');
    }
    leases = ptRows || [];
  }

  const occupied = new Set();
  for (const row of leases) {
    if (row.property_id && isPropertyTenantActiveNow(row)) occupied.add(row.property_id);
  }

  const vacant = (properties || []).filter((p) => {
    if (occupied.has(p.id)) return false;
    const ns = String(p.status || '').toLowerCase();
    if (ns === 'rented' || ns === 'occupied') return false;
    return true;
  });

  const items = vacant.slice(0, 100).map((p) => ({
    id: p.id,
    name: p.name || 'Unnamed',
    location: [p.address, p.city, p.state].filter(Boolean).join(', '),
    status: p.status || '',
    reason: 'No active lease on record for today',
  }));

  return {
    kind: 'table',
    title: 'Vacant properties (no active property_tenant for today)',
    columns: [
      { key: 'name', label: 'Property' },
      { key: 'location', label: 'Location' },
      { key: 'status', label: 'Listing status' },
      { key: 'reason', label: 'Note' },
    ],
    rows: items,
    summary: { count: items.length },
  };
}

router.post('/api/ai/query', ...authChain, async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Service not configured (Supabase env missing).' });
    }

    const query = typeof req.body?.query === 'string' ? req.body.query : '';
    const preferOpenAI = Boolean(req.body?.preferOpenAI);

    if (!query.trim()) {
      return res.status(400).json({ error: 'query is required (non-empty string).' });
    }

    const uid = req.auth.sub;
    const role = req.userRole;
    const visibleIds = await getVisiblePropertyIds(uid, role);
    if (visibleIds && visibleIds.length === 0) {
      return res.json({
        intent: 'unknown',
        message:
          'No properties are linked to your account for this assistant. Ask an admin to assign properties or staff access.',
        data: null,
        meta: { router: 'rules', scoped: true, empty_scope: true },
      });
    }

    let intent = detectIntentRules(query);
    let routerSource = 'rules';

    const openaiFallback =
      preferOpenAI ||
      String(process.env.AI_QUERY_OPENAI_FALLBACK || '').toLowerCase() === 'true';

    if (intent === 'unknown' && openai && openaiFallback) {
      intent = await detectIntentOpenAI(query);
      routerSource = 'openai';
    }

    intent = normalizeIntent(intent);

    if (intent === 'unknown') {
      return res.json({
        intent: 'unknown',
        message:
          'Try: “Show tenants owing rent”, “Generate rent report”, or “List vacant properties”. Enable OpenAI routing with preferOpenAI: true or AI_QUERY_OPENAI_FALLBACK=true when OPENAI_API_KEY is set.',
        data: null,
        meta: { router: routerSource, openai_configured: Boolean(openai) },
      });
    }

    let data;
    if (intent === 'tenants_owing_rent') {
      data = await runTenantsOwingRent(visibleIds);
    } else if (intent === 'rent_report_summary') {
      data = await runRentReportSummary(visibleIds);
    } else if (intent === 'vacant_properties') {
      data = await runVacantProperties(visibleIds);
    }

    return res.json({
      intent,
      message: data?.title || 'Here is what we found.',
      data,
      meta: {
        router: routerSource,
        scoped: Boolean(visibleIds),
        intents_supported: INTENTS.filter((i) => i !== 'unknown'),
      },
    });
  } catch (e) {
    console.error('[ai/query]', e);
    return res.status(500).json({ error: e?.message || 'Query failed.' });
  }
});

export function createAiAssistantRouter() {
  return router;
}
