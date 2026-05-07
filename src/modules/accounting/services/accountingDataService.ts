/**
 * Accounting module data access (NGN, Nigerian locale).
 * Reads rent_payments for income; accounting_* tables for expenses & commissions; journal_entries when present.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { toPgDateOnly } from '@/utils/toPgDateOnly';

export type IncomeCategory = 'rent' | 'service_charge' | 'other';

export type IncomeLine = {
  id: string;
  amount: number;
  paymentDate: string | null;
  category: IncomeCategory;
  description: string | null;
  propertyTenantId: string;
  propertyId: string | null;
  propertyName: string | null;
};

export type ExpenseRow = {
  id: string;
  property_id: string | null;
  maintenance_ticket_id?: string | null;
  maintenance_ticket_number?: string | null;
  expense_type: string;
  amount_ngn: number;
  vat_amount_ngn: number;
  expense_date: string;
  description: string | null;
};

export type CommissionRow = {
  id: string;
  property_id: string;
  agent_id: string;
  basis_amount_ngn: number;
  commission_pct: number;
  commission_amount_ngn: number;
  period_month: string;
  status: string;
  notes: string | null;
};

export type JournalRow = {
  id: string;
  entry_date?: string | null;
  account?: string | null;
  debit: number | null;
  credit: number | null;
  description: string | null;
  reference: string | null;
  property_id?: string | null;
};

export type MonthlyPlRow = {
  month: string;
  incomeRent: number;
  incomeServiceCharge: number;
  incomeOther: number;
  expenses: number;
  commissions: number;
  /** Resolved work orders with actual_cost, attributed by resolution/update date. */
  maintenanceActual: number;
  /** From payment_breakdowns (Flutterwave settlement), by payment_date month. */
  platformFeesSettled: number;
  agentCommissionSettled: number;
  taxSettled: number;
  /** Owner pool from breakdowns (informational; not subtracted in net). */
  ownerShareSettled: number;
  net: number;
};

/** One row per successful rent payment with optional settlement breakdown. */
export type PaymentBreakdownLine = {
  rentPaymentId: string;
  paymentDate: string | null;
  propertyId: string | null;
  propertyName: string | null;
  gross: number;
  platformFee: number;
  agentCommission: number;
  ownerAmount: number;
  taxAmount: number;
};

export type MaintenanceCostLine = {
  id: string;
  ticketNumber: string;
  propertyId: string;
  propertyName: string | null;
  status: string;
  amount: number;
  isActualCost: boolean;
  costDate: string;
};

function classifyIncome(category: string | null | undefined): IncomeCategory {
  const c = (category || '').toLowerCase();
  if (c.includes('service')) return 'service_charge';
  if (c === 'rent' || c === '') return 'rent';
  return 'other';
}

async function propertyTenantMap(
  ids: string[]
): Promise<Map<string, { propertyId: string; name: string | null }>> {
  const map = new Map<string, { propertyId: string; name: string | null }>();
  if (ids.length === 0) return map;
  const unique = [...new Set(ids)];
  const { data, error } = await supabase
    .from('property_tenants')
    .select('id, property_id, properties(id, name)')
    .in('id', unique);
  if (error) {
    logger.warn('accounting: property_tenants lookup', error);
    return map;
  }
  for (const row of data || []) {
    const p = row.properties as { id?: string; name?: string | null } | null;
    map.set(row.id as string, {
      propertyId: (row.property_id as string) || p?.id || '',
      name: p?.name ?? null,
    });
  }
  return map;
}

export async function fetchIncomeLines(
  start: string,
  end: string,
  propertyId: string | null
): Promise<IncomeLine[]> {
  const d0 = toPgDateOnly(start);
  const d1 = toPgDateOnly(end);
  const { data: payments, error } = await supabase
    .from('rent_payments')
    .select('id, amount, payment_date, status, category, description, property_tenant_id')
    .eq('status', 'successful')
    .gte('payment_date', d0)
    .lte('payment_date', d1)
    .order('payment_date', { ascending: false });

  if (error) {
    logger.warn('accounting: rent_payments', error);
    return [];
  }

  const rows = payments || [];
  const ptIds = rows.map((r) => r.property_tenant_id as string).filter(Boolean);
  const pmap = await propertyTenantMap(ptIds);

  const out: IncomeLine[] = [];
  for (const r of rows) {
    const pt = pmap.get(r.property_tenant_id as string);
    if (propertyId && pt?.propertyId !== propertyId) continue;
    out.push({
      id: r.id as string,
      amount: Number(r.amount) || 0,
      paymentDate: (r.payment_date as string) || null,
      category: classifyIncome(r.category as string | null),
      description: (r.description as string) || null,
      propertyTenantId: r.property_tenant_id as string,
      propertyId: pt?.propertyId ?? null,
      propertyName: pt?.name ?? null,
    });
  }
  return out;
}

export async function fetchExpenses(
  start: string,
  end: string,
  propertyId: string | null
): Promise<ExpenseRow[]> {
  const d0 = toPgDateOnly(start);
  const d1 = toPgDateOnly(end);
  let q = supabase
    .from('accounting_expenses')
    .select('*, maintenance_tickets(ticket_number)')
    .gte('expense_date', d0)
    .lte('expense_date', d1)
    .order('expense_date', { ascending: false });

  if (propertyId) q = q.eq('property_id', propertyId);

  const { data, error } = await q;
  if (error) {
    if (error.code === '42P01' || error.message?.includes('does not exist')) return [];
    logger.warn('accounting: expenses', error);
    return [];
  }
  return (data || []).map((row: Record<string, unknown>) => {
    const emb = row.maintenance_tickets as { ticket_number?: string } | null | undefined;
    const { maintenance_tickets: _t, ...rest } = row;
    return {
      ...(rest as Omit<ExpenseRow, 'maintenance_ticket_number'>),
      maintenance_ticket_number: emb?.ticket_number ?? null,
    };
  });
}

/** Successful rent payments with Flutterwave / ledger settlement splits when present. */
export async function fetchPaymentBreakdownLines(
  start: string,
  end: string,
  propertyId: string | null
): Promise<PaymentBreakdownLine[]> {
  const d0 = toPgDateOnly(start);
  const d1 = toPgDateOnly(end);
  const { data: payments, error } = await supabase
    .from('rent_payments')
    .select('id, amount, payment_date, status, property_tenant_id')
    .eq('status', 'successful')
    .gte('payment_date', d0)
    .lte('payment_date', d1)
    .order('payment_date', { ascending: false });

  if (error) {
    logger.warn('accounting: rent_payments for settlements', error);
    return [];
  }

  const rows = payments || [];
  const ids = rows.map((r) => r.id as string).filter(Boolean);
  if (ids.length === 0) return [];

  const { data: byPaymentId, error: e1 } = await supabase
    .from('payment_breakdowns')
    .select(
      'payment_id, rent_payment_id, total_amount, platform_fee, agent_commission, owner_amount, tax_amount'
    )
    .in('payment_id', ids);

  if (e1 && e1.code !== '42P01' && !e1.message?.includes('does not exist')) {
    logger.warn('accounting: payment_breakdowns by payment_id', e1);
  }

  const { data: byRentId, error: e2 } = await supabase
    .from('payment_breakdowns')
    .select(
      'payment_id, rent_payment_id, total_amount, platform_fee, agent_commission, owner_amount, tax_amount'
    )
    .in('rent_payment_id', ids);

  if (e2 && e2.code !== '42P01' && !e2.message?.includes('does not exist')) {
    logger.warn('accounting: payment_breakdowns by rent_payment_id', e2);
  }

  const breakdownByRentPayment = new Map<string, Record<string, unknown>>();
  for (const b of [...(byPaymentId || []), ...(byRentId || [])]) {
    const row = b as Record<string, unknown>;
    const rid = (row.payment_id as string) || (row.rent_payment_id as string);
    if (!rid || breakdownByRentPayment.has(rid)) continue;
    breakdownByRentPayment.set(rid, row);
  }

  const ptIds = rows.map((r) => r.property_tenant_id as string).filter(Boolean);
  const pmap = await propertyTenantMap(ptIds);

  const out: PaymentBreakdownLine[] = [];
  for (const r of rows) {
    const pt = pmap.get(r.property_tenant_id as string);
    if (propertyId && pt?.propertyId !== propertyId) continue;

    const b = breakdownByRentPayment.get(r.id as string);
    const gross = Number(b?.total_amount ?? r.amount ?? 0);
    out.push({
      rentPaymentId: r.id as string,
      paymentDate: (r.payment_date as string) || null,
      propertyId: pt?.propertyId ?? null,
      propertyName: pt?.name ?? null,
      gross,
      platformFee: Number(b?.platform_fee ?? 0),
      agentCommission: Number(b?.agent_commission ?? 0),
      ownerAmount: Number(b?.owner_amount ?? 0),
      taxAmount: Number(b?.tax_amount ?? 0),
    });
  }
  return out;
}

/**
 * Maintenance ticket spend for accounting views.
 * - **Actuals**: `actual_cost` > 0, must have `resolved_at`; attributed only by resolution date (inclusive range).
 * - **Estimates** (tab only, excluded from P&L): positive `cost_estimate`, no qualifying actual; dated by `updated_at`.
 */
export async function fetchMaintenanceCostLines(
  start: string,
  end: string,
  propertyId: string | null
): Promise<MaintenanceCostLine[]> {
  let q = supabase
    .from('maintenance_tickets')
    .select(
      'id, ticket_number, property_id, status, cost_estimate, actual_cost, resolved_at, updated_at, properties(name)'
    )
    .neq('status', 'cancelled')
    .order('updated_at', { ascending: false })
    .limit(500);

  if (propertyId) q = q.eq('property_id', propertyId);

  const { data, error } = await q;
  if (error) {
    if (error.code === '42P01' || error.message?.includes('does not exist')) return [];
    logger.warn('accounting: maintenance_tickets', error);
    return [];
  }

  const lines: MaintenanceCostLine[] = [];
  for (const t of data || []) {
    const resolvedAt = (t.resolved_at as string | null) || null;
    const hasActualAmount = t.actual_cost != null && Number(t.actual_cost) > 0;

    if (hasActualAmount) {
      if (!resolvedAt) continue;
      const costDate = resolvedAt.slice(0, 10);
      if (costDate.length < 10 || costDate < start || costDate > end) continue;
      lines.push({
        id: t.id as string,
        ticketNumber: (t.ticket_number as string) || '',
        propertyId: t.property_id as string,
        propertyName: (t.properties as { name?: string | null } | null)?.name ?? null,
        status: t.status as string,
        amount: Number(t.actual_cost),
        isActualCost: true,
        costDate,
      });
      continue;
    }

    const est = Number(t.cost_estimate ?? 0);
    if (est <= 0) continue;
    const estDate = ((t.updated_at as string) || '').slice(0, 10);
    if (estDate.length < 10 || estDate < start || estDate > end) continue;
    lines.push({
      id: t.id as string,
      ticketNumber: (t.ticket_number as string) || '',
      propertyId: t.property_id as string,
      propertyName: (t.properties as { name?: string | null } | null)?.name ?? null,
      status: t.status as string,
      amount: est,
      isActualCost: false,
      costDate: estDate,
    });
  }
  return lines;
}

export async function fetchMaintenanceTicketsForExpenseLink(
  propertyId: string
): Promise<{ id: string; label: string; suggestedAmount: number }[]> {
  if (!propertyId) return [];
  const { data, error } = await supabase
    .from('maintenance_tickets')
    .select('id, ticket_number, actual_cost, cost_estimate, status')
    .eq('property_id', propertyId)
    .neq('status', 'cancelled')
    .order('updated_at', { ascending: false })
    .limit(40);

  if (error) {
    logger.warn('accounting: maintenance_tickets for link', error);
    return [];
  }

  return (data || []).map((t) => {
    const hasActual = t.actual_cost != null && Number(t.actual_cost) > 0;
    const suggested = hasActual ? Number(t.actual_cost) : Number(t.cost_estimate ?? 0);
    const sn = (t.ticket_number as string) || t.id;
    return {
      id: t.id as string,
      label: `${sn} · ${t.status}${hasActual ? ` · actual ₦${suggested}` : ` · est. ₦${suggested}`}`,
      suggestedAmount: suggested,
    };
  });
}

export async function fetchCommissions(
  start: string,
  end: string,
  propertyId: string | null,
  agentId: string | null
): Promise<CommissionRow[]> {
  let q = supabase
    .from('accounting_commissions')
    .select('*')
    .gte('period_month', start)
    .lte('period_month', end)
    .order('period_month', { ascending: false });

  if (propertyId) q = q.eq('property_id', propertyId);
  if (agentId) q = q.eq('agent_id', agentId);

  const { data, error } = await q;
  if (error) {
    if (error.code === '42P01' || error.message?.includes('does not exist')) return [];
    logger.warn('accounting: commissions', error);
    return [];
  }
  return (data || []) as CommissionRow[];
}

export async function fetchJournal(start: string, end: string): Promise<JournalRow[]> {
  const startTs = `${start}T00:00:00`;
  const endTs = `${end}T23:59:59.999`;

  const { data: sample, error: sampleErr } = await supabase
    .from('journal_entries')
    .select('*')
    .limit(1);
  if (sampleErr) return [];

  const row = sample?.[0] as Record<string, unknown> | undefined;
  const dateCol =
    row && typeof row.entry_date === 'string' ? 'entry_date' : ('created_at' as const);

  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .gte(dateCol, dateCol === 'entry_date' ? start : startTs)
    .lte(dateCol, dateCol === 'entry_date' ? end : endTs)
    .order(dateCol, { ascending: false })
    .limit(500);

  if (error) {
    logger.warn('accounting: journal_entries', error);
    return [];
  }
  return (data || []) as JournalRow[];
}

export function aggregateMonthlyPl(
  income: IncomeLine[],
  expenses: ExpenseRow[],
  commissions: CommissionRow[],
  maintenanceLines: MaintenanceCostLine[],
  settlementLines: PaymentBreakdownLine[]
): MonthlyPlRow[] {
  const byMonth = new Map<string, MonthlyPlRow>();

  const keyOf = (d: string) => d.slice(0, 7);

  const ensure = (k: string): MonthlyPlRow => {
    let row = byMonth.get(k);
    if (!row) {
      row = {
        month: k,
        incomeRent: 0,
        incomeServiceCharge: 0,
        incomeOther: 0,
        expenses: 0,
        commissions: 0,
        maintenanceActual: 0,
        platformFeesSettled: 0,
        agentCommissionSettled: 0,
        taxSettled: 0,
        ownerShareSettled: 0,
        net: 0,
      };
      byMonth.set(k, row);
    }
    return row;
  };

  for (const i of income) {
    const d = i.paymentDate || '';
    if (d.length < 7) continue;
    const k = keyOf(d);
    const cur = ensure(k);
    if (i.category === 'rent') cur.incomeRent += i.amount;
    else if (i.category === 'service_charge') cur.incomeServiceCharge += i.amount;
    else cur.incomeOther += i.amount;
  }

  for (const e of expenses) {
    const k = keyOf(e.expense_date);
    const cur = ensure(k);
    cur.expenses += Number(e.amount_ngn) + Number(e.vat_amount_ngn || 0);
  }

  for (const c of commissions) {
    const k = keyOf(c.period_month);
    const cur = ensure(k);
    cur.commissions += Number(c.commission_amount_ngn);
  }

  for (const m of maintenanceLines) {
    if (m.costDate.length < 7) continue;
    if (!m.isActualCost) continue;
    const cur = ensure(keyOf(m.costDate));
    cur.maintenanceActual += m.amount;
  }

  for (const s of settlementLines) {
    const d = s.paymentDate || '';
    if (d.length < 7) continue;
    const cur = ensure(keyOf(d));
    cur.platformFeesSettled += s.platformFee;
    cur.agentCommissionSettled += s.agentCommission;
    cur.taxSettled += s.taxAmount;
    cur.ownerShareSettled += s.ownerAmount;
  }

  for (const cur of byMonth.values()) {
    const incomeTotal = cur.incomeRent + cur.incomeServiceCharge + cur.incomeOther;
    cur.net =
      incomeTotal -
      cur.expenses -
      cur.commissions -
      cur.maintenanceActual -
      cur.platformFeesSettled -
      cur.agentCommissionSettled -
      cur.taxSettled;
  }

  return [...byMonth.values()].sort((a, b) => b.month.localeCompare(a.month));
}

export async function insertExpense(payload: {
  property_id: string | null;
  expense_type: string;
  amount_ngn: number;
  vat_amount_ngn?: number;
  expense_date: string;
  description?: string | null;
  maintenance_request_id?: string | null;
  maintenance_ticket_id?: string | null;
}): Promise<{ error: string | null }> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  const { error } = await supabase.from('accounting_expenses').insert({
    ...payload,
    vat_amount_ngn: payload.vat_amount_ngn ?? 0,
    created_by: uid,
  });
  if (error) return { error: error.message };
  return { error: null };
}

export async function insertCommission(payload: {
  property_id: string;
  agent_id: string;
  basis_amount_ngn: number;
  commission_pct: number;
  commission_amount_ngn: number;
  period_month: string;
  notes?: string | null;
  rent_payment_id?: string | null;
}): Promise<{ error: string | null }> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  const { error } = await supabase.from('accounting_commissions').insert({
    ...payload,
    status: 'pending',
    created_by: uid,
  });
  if (error) return { error: error.message };
  return { error: null };
}

export async function fetchPropertiesForAccounting(): Promise<{ id: string; name: string }[]> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return [];

  const { data: roleRows } = await supabase.from('user_roles').select('role').eq('user_id', uid);
  const isAdmin = (roleRows || []).some((r) => r.role === 'admin' || r.role === 'super_admin');

  if (isAdmin) {
    const { data } = await supabase.from('properties').select('id, name').order('name').limit(200);
    return (data || []).map((p) => ({
      id: p.id as string,
      name: (p.name as string) || 'Property',
    }));
  }

  const { data } = await supabase
    .from('properties')
    .select('id, name')
    .or(`owner_id.eq.${uid},agent_id.eq.${uid}`)
    .order('name');

  return (data || []).map((p) => ({ id: p.id as string, name: (p.name as string) || 'Property' }));
}

export async function fetchProfilesForAgents(): Promise<{ id: string; label: string }[]> {
  const { data } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email')
    .limit(300);
  return (data || []).map((p) => {
    const fn = (p.first_name as string) || '';
    const ln = (p.last_name as string) || '';
    const label = `${fn} ${ln}`.trim() || (p.email as string) || (p.id as string);
    return { id: p.id as string, label };
  });
}
