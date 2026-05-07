/**
 * Executive portfolio analytics (aggregated KPIs + series).
 *
 * GET /api/analytics/executive?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&property_id=<uuid>
 *
 * RBAC: reports.financial OR reports.operational
 */

import express from 'express';
import { supabaseAdmin } from './supabaseClient.mjs';
import { requireSupabaseJwt } from './middleware/supabaseJwt.mjs';
import { createAttachUserRole } from './middleware/attachUserRole.mjs';
import { getPermissionSetForRole } from './rbac/matrix.mjs';
import { createRequireMinimumPlan } from './middleware/requireSubscriptionEntitlement.mjs';
const router = express.Router();

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isUuid(s) {
  return typeof s === 'string' && UUID_RE.test(s);
}
const attachUserRole = createAttachUserRole(supabaseAdmin);
const auth = [requireSupabaseJwt, attachUserRole, createRequireMinimumPlan('business')];

function requireReportsAccess(req, res, next) {
  const set = getPermissionSetForRole(req.userRole);
  if (!set.has('reports.financial') && !set.has('reports.operational')) {
    return res.status(403).json({
      error: 'FORBIDDEN',
      required_permission: 'reports.financial or reports.operational',
      role: req.userRole,
    });
  }
  next();
}

/**
 * @returns {{ scopePropertyIds: string[] | null, error?: string }}
 *   scopePropertyIds null = global (admin-wide); [] = no access
 */
function resolvePropertyScope(visiblePropertyIds, propertyIdQuery) {
  if (!propertyIdQuery || typeof propertyIdQuery !== 'string') {
    return { scopePropertyIds: visiblePropertyIds };
  }
  const pid = propertyIdQuery.trim();
  if (!isUuid(pid)) return { error: 'INVALID_PROPERTY_ID' };
  if (visiblePropertyIds === null) return { scopePropertyIds: [pid] };
  if (!visiblePropertyIds.includes(pid)) return { error: 'FORBIDDEN_PROPERTY' };
  return { scopePropertyIds: [pid] };
}

async function listScopedPropertyOptions(propertyIds) {
  if (Array.isArray(propertyIds) && propertyIds.length === 0) {
    return [];
  }
  if (propertyIds == null) {
    const { data, error } = await supabaseAdmin.from('properties').select('id, name').order('name').limit(300);
    if (error) throw error;
    return (data || []).map((r) => ({ id: r.id, name: r.name || 'Property' }));
  }

  const merged = new Map();
  const chunk = 120;
  for (let i = 0; i < propertyIds.length; i += chunk) {
    const slice = propertyIds.slice(i, i + chunk);
    const { data, error } = await supabaseAdmin.from('properties').select('id, name').in('id', slice);
    if (error) throw error;
    for (const r of data || []) {
      merged.set(r.id, { id: r.id, name: r.name || 'Property' });
    }
  }

  return [...merged.values()].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 300);
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

function parseDateParam(s, fallback) {
  if (!s || typeof s !== 'string') return fallback;
  const x = s.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(x)) return null;
  const d = new Date(`${x}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function monthKey(iso) {
  return String(iso || '').slice(0, 7);
}

function toDateOnly(d) {
  return d.toISOString().slice(0, 10);
}

/** Successful rent in range by payment_date (indexed). Lean select. */
async function fetchSuccessfulRentPaymentsPage(dateFrom, dateTo, ptIdsOrNull, rangeStart, pageSize) {
  let q = supabaseAdmin
    .from('rent_payments')
    .select(
      `
      amount,
      payment_date,
      property_tenant_id,
      property_tenants (
        property_id,
        properties ( id, name )
      )
    `
    )
    .eq('status', 'successful')
    .gte('payment_date', dateFrom)
    .lte('payment_date', dateTo)
    .order('payment_date', { ascending: true })
    .order('id', { ascending: true })
    .range(rangeStart, rangeStart + pageSize - 1);

  if (ptIdsOrNull?.length) {
    q = q.in('property_tenant_id', ptIdsOrNull);
  }

  return q;
}

async function fetchSuccessfulRentInRange(dateFrom, dateTo, scopePropertyIds) {
  const pageSize = 1000;
  const rows = [];

  let ptFilter = null;
  if (scopePropertyIds?.length) {
    const { data: pts, error: pte } = await supabaseAdmin
      .from('property_tenants')
      .select('id')
      .in('property_id', scopePropertyIds);
    if (pte) throw pte;
    ptFilter = (pts || []).map((r) => r.id);
    if (ptFilter.length === 0) return [];
  }

  const drainPaged = async (ptSlice) => {
    let start = 0;
    for (;;) {
      const { data, error } = await fetchSuccessfulRentPaymentsPage(
        dateFrom,
        dateTo,
        ptSlice,
        start,
        pageSize
      );
      if (error) {
        console.error('[executive-analytics] rent_payments', error);
        throw error;
      }
      if (!data?.length) break;
      rows.push(...data);
      if (data.length < pageSize) break;
      start += pageSize;
    }
  };

  if (!ptFilter) {
    await drainPaged(null);
    return rows;
  }

  const chunk = 120;
  for (let i = 0; i < ptFilter.length; i += chunk) {
    await drainPaged(ptFilter.slice(i, i + chunk));
  }
  return rows;
}

async function listPropertyTenantIdsForProperties(propertyIds) {
  if (!propertyIds?.length) return [];
  const out = [];
  const chunk = 80;
  for (let i = 0; i < propertyIds.length; i += chunk) {
    const slice = propertyIds.slice(i, i + chunk);
    const { data, error } = await supabaseAdmin.from('property_tenants').select('id').in('property_id', slice);
    if (error) throw error;
    out.push(...(data || []).map((r) => r.id));
  }
  return out;
}

async function sumArrearsOutstandingNgn(scopePropertyIds) {
  const addChunk = async (ptSlice) => {
    let sub = 0;
    const inner = 200;
    for (let j = 0; j < ptSlice.length; j += inner) {
      const { data, error } = await supabaseAdmin
        .from('property_tenant_arrears')
        .select('outstanding_ngn')
        .in('property_tenant_id', ptSlice.slice(j, j + inner));
      if (error) throw error;
      for (const r of data || []) sub += Number(r.outstanding_ngn) || 0;
    }
    return sub;
  };

  if (scopePropertyIds === null) {
    let sum = 0;
    let start = 0;
    const page = 1000;
    for (;;) {
      const { data, error } = await supabaseAdmin
        .from('property_tenant_arrears')
        .select('outstanding_ngn')
        .range(start, start + page - 1);
      if (error) throw error;
      if (!data?.length) break;
      for (const r of data) sum += Number(r.outstanding_ngn) || 0;
      if (data.length < page) break;
      start += page;
    }
    return sum;
  }

  const ptIds = await listPropertyTenantIdsForProperties(scopePropertyIds);
  if (ptIds.length === 0) return 0;

  let sum = 0;
  const chunk = 500;
  for (let i = 0; i < ptIds.length; i += chunk) {
    sum += await addChunk(ptIds.slice(i, i + chunk));
  }
  return sum;
}

async function occupancyForProperties(propertyIds) {
  let pq = supabaseAdmin.from('properties').select('id');
  if (propertyIds?.length) {
    pq = pq.in('id', propertyIds);
  }
  const { data: props, error: pe } = await pq;
  if (pe) throw pe;
  const total = (props || []).length;
  if (total === 0) return { rate: 0, occupied_properties: 0, total_properties: 0 };

  const ids = (props || []).map((p) => p.id);
  const { data: leases, error: le } = await supabaseAdmin
    .from('property_tenants')
    .select('property_id')
    .eq('status', 'active')
    .in('property_id', ids);
  if (le) throw le;
  const occupied = new Set((leases || []).map((l) => l.property_id)).size;
  return {
    rate: occupied / total,
    occupied_properties: occupied,
    total_properties: total,
  };
}

async function accountingMaintenanceExpensesInRange(dateFromStr, dateToStr, propertyIds) {
  let q = supabaseAdmin
    .from('accounting_expenses')
    .select('amount_ngn')
    .gte('expense_date', dateFromStr)
    .lte('expense_date', dateToStr)
    .in('expense_type', ['maintenance', 'utilities']);

  if (propertyIds?.length) {
    q = q.in('property_id', propertyIds);
  }

  const { data, error } = await q;
  if (error) {
    console.warn('[executive-analytics] accounting_expenses', error.message);
    return 0;
  }
  let sum = 0;
  for (const r of data || []) sum += Number(r.amount_ngn) || 0;
  return sum;
}

async function maintenanceCostsInRange(fromIso, toIso, dateFromStr, dateToStr, propertyIds) {
  let tq = supabaseAdmin
    .from('maintenance_tickets')
    .select('actual_cost, created_at, property_id')
    .gte('created_at', fromIso)
    .lte('created_at', toIso)
    .not('actual_cost', 'is', null);

  if (propertyIds?.length) {
    tq = tq.in('property_id', propertyIds);
  }

  const { data, error } = await tq;
  if (error) {
    console.warn('[executive-analytics] maintenance_tickets', error.message);
    return { tickets_ngn: 0, expenses_ngn: 0, combined_ngn: 0 };
  }
  let ticketsNgn = 0;
  for (const r of data || []) {
    ticketsNgn += Number(r.actual_cost) || 0;
  }

  const expensesNgn = await accountingMaintenanceExpensesInRange(dateFromStr, dateToStr, propertyIds);

  return {
    tickets_ngn: ticketsNgn,
    expenses_ngn: expensesNgn,
    combined_ngn: ticketsNgn + expensesNgn,
  };
}

/**
 * Maintenance spend by calendar month (tickets by resolved/created; accounting expenses by expense_date).
 */
async function maintenanceMonthlySeries(fromIso, toIso, dateFromStr, dateToStr, scopePropertyIds) {
  const fromMs = new Date(fromIso).getTime();
  const toMs = new Date(toIso).getTime();
  const byMonth = new Map();

  const bump = (iso, n) => {
    if (!iso) return;
    const t = new Date(iso).getTime();
    if (t < fromMs || t > toMs) return;
    const mk = monthKey(iso);
    byMonth.set(mk, (byMonth.get(mk) || 0) + n);
  };

  let tq = supabaseAdmin
    .from('maintenance_tickets')
    .select('actual_cost, resolved_at, created_at')
    .not('actual_cost', 'is', null);

  if (scopePropertyIds?.length) {
    tq = tq.in('property_id', scopePropertyIds);
  }

  const { data: tickets, error: te } = await tq;
  if (te) {
    console.warn('[executive-analytics] maintenance monthly tickets', te.message);
  } else {
    for (const r of tickets || []) {
      const cost = Number(r.actual_cost) || 0;
      const when = r.resolved_at || r.created_at;
      bump(when, cost);
    }
  }

  let exq = supabaseAdmin
    .from('accounting_expenses')
    .select('amount_ngn, expense_date')
    .gte('expense_date', dateFromStr)
    .lte('expense_date', dateToStr)
    .in('expense_type', ['maintenance', 'utilities']);

  if (scopePropertyIds?.length) {
    exq = exq.in('property_id', scopePropertyIds);
  }

  const { data: exps, error: ee } = await exq;
  if (!ee) {
    for (const e of exps || []) {
      const d = e.expense_date;
      bump(d ? `${d}T12:00:00.000Z` : null, Number(e.amount_ngn) || 0);
    }
  }

  return [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, maintenance_ngn]) => ({ month, maintenance_ngn }));
}

function aggregateSuccessfulRent(rows) {
  let collected = 0;
  const revenueByMonth = new Map();
  const byProperty = new Map();

  for (const row of rows) {
    const amt = Number(row.amount) || 0;
    collected += amt;
    const pd = row.payment_date;
    const mk = monthKey(pd ? String(pd) : '');
    if (mk.length >= 7) {
      revenueByMonth.set(mk, (revenueByMonth.get(mk) || 0) + amt);
    }
    const pid = row.property_tenants?.property_id;
    const pr = row.property_tenants?.properties;
    const pname =
      (pr && typeof pr === 'object' && 'name' in pr && pr.name) ||
      (pr && typeof pr === 'object' && 'title' in pr && pr.title) ||
      'Property';
    if (pid) {
      const p = byProperty.get(pid) || {
        property_id: pid,
        name: pname,
        revenue_ngn: 0,
      };
      p.revenue_ngn += amt;
      p.name = pname;
      byProperty.set(pid, p);
    }
  }

  const topProperties = [...byProperty.values()]
    .sort((a, b) => b.revenue_ngn - a.revenue_ngn)
    .slice(0, 8);

  return {
    total_revenue_ngn: collected,
    rent_collected_ngn: collected,
    revenue_by_month: revenueByMonth,
    top_properties: topProperties,
  };
}

function mergeMonthlySeries(revenueByMonth, maintenanceMonthly) {
  const keys = new Set([...revenueByMonth.keys(), ...maintenanceMonthly.map((m) => m.month)]);
  const monthly = [...keys]
    .sort((a, b) => a.localeCompare(b))
    .map((month) => ({
      month,
      collected: revenueByMonth.get(month) || 0,
      maintenance_ngn: maintenanceMonthly.find((x) => x.month === month)?.maintenance_ngn || 0,
    }));
  return monthly;
}

router.get('/api/analytics/executive', ...auth, requireReportsAccess, async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Service not configured.' });
    }

    const uid = req.auth.sub;
    const role = req.userRole;

    const defaultTo = new Date();
    const defaultFrom = new Date();
    defaultFrom.setFullYear(defaultFrom.getFullYear() - 1);

    const dateTo = req.query.date_to ? parseDateParam(req.query.date_to, null) : defaultTo;
    const dateFrom = req.query.date_from ? parseDateParam(req.query.date_from, null) : defaultFrom;
    if (req.query.date_to && !dateTo) {
      return res.status(400).json({ error: 'INVALID_DATE_TO', detail: 'date_to must be YYYY-MM-DD' });
    }
    if (req.query.date_from && !dateFrom) {
      return res.status(400).json({ error: 'INVALID_DATE_FROM', detail: 'date_from must be YYYY-MM-DD' });
    }
    if (dateFrom > dateTo) {
      return res.status(400).json({ error: 'INVALID_DATE_RANGE', detail: 'date_from must be <= date_to' });
    }
    const rangeDays = Math.round((dateTo.getTime() - dateFrom.getTime()) / 86400000);
    if (rangeDays > 730) {
      return res.status(400).json({ error: 'RANGE_TOO_LARGE', detail: 'Maximum range is 730 days' });
    }
    const fromIso = dateFrom.toISOString();
    const toIso = dateTo.toISOString();
    const dateFromStr = toDateOnly(dateFrom);
    const dateToStr = toDateOnly(dateTo);

    const visible = await getVisiblePropertyIds(uid, role);
    const scopeRes = resolvePropertyScope(visible, req.query.property_id);
    if (scopeRes.error === 'INVALID_PROPERTY_ID') {
      return res.status(400).json({ error: 'INVALID_PROPERTY_ID' });
    }
    if (scopeRes.error === 'FORBIDDEN_PROPERTY') {
      return res.status(403).json({ error: 'FORBIDDEN_PROPERTY' });
    }

    const scopePropertyIds = scopeRes.scopePropertyIds;

    let filterProperties = [];
    try {
      filterProperties = await listScopedPropertyOptions(visible === null ? null : visible);
    } catch (fpErr) {
      console.warn('[executive-analytics] filter properties', fpErr?.message);
    }

    if (visible && visible.length === 0) {
      return res.json({
        range: { from: fromIso, to: toIso },
        kpis: {
          total_revenue_ngn: 0,
          rent_collected_ngn: 0,
          rent_outstanding_ngn: 0,
          arrears_ngn: null,
          occupancy_rate: 0,
          maintenance_costs_ngn: 0,
          maintenance_breakdown: { tickets_ngn: 0, expenses_ngn: 0, combined_ngn: 0 },
        },
        occupancy: {
          rate: 0,
          occupied_properties: 0,
          total_properties: 0,
        },
        series: { monthly: [] },
        top_properties: [],
        filter_options: { properties: filterProperties },
        meta: { scoped_empty: true, arrears_available: false },
      });
    }

    const analyticsPropertyScope =
      scopePropertyIds === null ? visible || undefined : scopePropertyIds;

    const rows = await fetchSuccessfulRentInRange(dateFromStr, dateToStr, analyticsPropertyScope ?? undefined);
    const agg = aggregateSuccessfulRent(rows);
    const maint = await maintenanceCostsInRange(
      fromIso,
      toIso,
      dateFromStr,
      dateToStr,
      analyticsPropertyScope ?? undefined
    );
    const maintMonthly = await maintenanceMonthlySeries(
      fromIso,
      toIso,
      dateFromStr,
      dateToStr,
      analyticsPropertyScope ?? undefined
    );
    const monthly = mergeMonthlySeries(agg.revenue_by_month, maintMonthly);

    const occ = await occupancyForProperties(analyticsPropertyScope ?? undefined);

    let arrearsNgn = null;
    try {
      arrearsNgn = await sumArrearsOutstandingNgn(
        analyticsPropertyScope === undefined ? null : analyticsPropertyScope
      );
    } catch (arErr) {
      console.warn('[executive-analytics] arrears', arErr?.message);
    }

    return res.json({
      range: { from: fromIso, to: toIso },
      kpis: {
        total_revenue_ngn: agg.total_revenue_ngn,
        rent_collected_ngn: agg.rent_collected_ngn,
        rent_outstanding_ngn: arrearsNgn != null ? arrearsNgn : 0,
        arrears_ngn: arrearsNgn,
        occupancy_rate: occ.rate,
        maintenance_costs_ngn: maint.combined_ngn ?? maint.tickets_ngn + (maint.expenses_ngn || 0),
        maintenance_breakdown: maint,
      },
      occupancy: {
        rate: occ.rate,
        occupied_properties: occ.occupied_properties,
        total_properties: occ.total_properties,
      },
      series: { monthly },
      top_properties: agg.top_properties,
      filter_options: { properties: filterProperties },
      meta: {
        payment_rows_used: rows.length,
        scope: visible ? 'filtered' : 'organization',
        property_filter: scopePropertyIds?.length === 1 ? scopePropertyIds[0] : null,
        revenue_basis: 'successful_payment_date',
        arrears_available: arrearsNgn !== null,
      },
    });
  } catch (e) {
    console.error('[executive-analytics]', e);
    return res.status(500).json({ error: e?.message || 'Aggregation failed.' });
  }
});

export function createExecutiveAnalyticsRouter() {
  return router;
}
