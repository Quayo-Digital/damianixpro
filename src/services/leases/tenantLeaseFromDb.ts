/**
 * Build the TenantLease shape used by the dashboard / payment modal from
 * raw `leases`, `lease_agreements`, or `property_tenants` rows (+ optional property join).
 */
import { supabase } from '@/integrations/supabase/client';
import { annualRentNgnFromPropertyRow } from '@/services/property/utils';
import {
  clearPropertyTenantsRelationMissingCache,
  isMissingSupabaseRelationError,
  isPropertyTenantsRelationMissing,
  markPropertyTenantsRelationMissing,
} from '@/utils/supabaseErrors';

type LeaseStatusUi = 'active' | 'expired' | 'terminated' | 'pending_renewal';

function parseLeaseStatus(raw: unknown): LeaseStatusUi {
  const s = String(raw ?? 'active').toLowerCase();
  if (s.includes('expir') || s === 'ended') return 'expired';
  if (s.includes('termin') || s.includes('cancel')) return 'terminated';
  if (s.includes('pending') || s.includes('renewal')) return 'pending_renewal';
  return 'active';
}

/** Map a lease/lease_agreements row (optionally enriched with `properties`). */
export function mapLeaseLikeRowToTenantLease(
  row: Record<string, unknown>,
  enriched?: { properties?: Record<string, unknown> | null }
) {
  const props =
    enriched?.properties ?? (row.properties as Record<string, unknown> | null | undefined);
  const propertyName =
    (props?.name as string) ||
    (row.property_title as string) ||
    (row.title as string) ||
    'Your property';
  const addressParts = [props?.address, props?.city, props?.state].filter(Boolean);
  const propertyAddress =
    addressParts.length > 0
      ? addressParts.join(', ')
      : String(props?.address ?? row.property_address ?? '');

  const monthlyFromRow = Number(row.monthly_rent ?? 0);
  const annualFromRow = Number(row.annual_rent ?? row.lease_price ?? 0);
  const propsRec = props as Record<string, unknown> | null | undefined;
  const propertyAnnualFromMeta =
    propsRec && Object.keys(propsRec).length > 0 ? annualRentNgnFromPropertyRow(propsRec) : 0;
  const leasePriceFromProp =
    Number(propsRec?.lease_price ?? 0) > 0
      ? Number(propsRec?.lease_price ?? 0)
      : propertyAnnualFromMeta > 0
        ? propertyAnnualFromMeta
        : 0;
  const monthlyFromProp = Number(propsRec?.monthly_rent ?? 0);
  let monthlyRent = monthlyFromRow;
  if (!(monthlyRent > 0) && monthlyFromProp > 0) {
    monthlyRent = monthlyFromProp;
  }
  if (!(monthlyRent > 0) && annualFromRow > 0) {
    monthlyRent = annualFromRow / 12;
  }
  if (!(monthlyRent > 0)) {
    const ra = Number(row.rent_amount ?? 0);
    if (ra > 0) monthlyRent = ra;
  }
  if (!(monthlyRent > 0) && leasePriceFromProp > 0) {
    monthlyRent = leasePriceFromProp / 12;
  }
  const lease_price =
    leasePriceFromProp > 0
      ? leasePriceFromProp
      : annualFromRow > 0
        ? annualFromRow
        : monthlyRent > 0
          ? monthlyRent * 12
          : undefined;
  const deposit = Number(row.security_deposit ?? row.deposit_amount ?? 0);

  const start = String(row.start_date ?? new Date().toISOString().split('T')[0]).split('T')[0];
  let end =
    row.end_date != null && String(row.end_date).trim() !== ''
      ? String(row.end_date).split('T')[0]
      : '';
  if (!end || end === start) {
    const d = new Date(`${start}T12:00:00`);
    if (!Number.isNaN(d.getTime())) {
      d.setFullYear(d.getFullYear() + 1);
      d.setDate(d.getDate() - 1);
      end = d.toISOString().split('T')[0];
    } else {
      end = start;
    }
  }

  return {
    id: String(row.id ?? ''),
    tenant_id: String(row.tenant_id ?? ''),
    property_id: String(row.property_id ?? ''),
    property_title: propertyName,
    property_address: propertyAddress,
    property_type: String(props?.property_type ?? row.property_type ?? '—'),
    start_date: start,
    end_date: end,
    monthly_rent: Number.isFinite(monthlyRent) ? monthlyRent : 0,
    ...(lease_price != null && lease_price > 0 ? { lease_price } : {}),
    security_deposit: Number.isFinite(deposit) ? deposit : 0,
    lease_status: parseLeaseStatus(row.status ?? row.lease_status),
    auto_renewal: Boolean(row.auto_renewal),
    rent_due_date: typeof row.rent_due_date === 'number' ? row.rent_due_date : 1,
    late_fee_amount: Number(row.late_fee_amount ?? 0),
    grace_period_days: Number(row.grace_period_days ?? 5),
    lease_document_url: row.lease_document_url as string | undefined,
    special_terms: row.special_terms as string | undefined,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

/** When `leases` / `lease_agreements` are empty or blocked, derive lease + property from property_tenants. */
export async function fetchTenantLeaseFromPropertyTenants(tenantId: string) {
  if (isPropertyTenantsRelationMissing()) return null;

  const { data, error } = await supabase
    .from('property_tenants')
    .select(
      'id, property_id, tenant_id, start_date, end_date, rent_amount, monthly_rent, deposit_amount, security_deposit, status, created_at, updated_at'
    )
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingSupabaseRelationError(error)) {
      markPropertyTenantsRelationMissing();
      return null;
    }
    console.warn('[tenant] property_tenants lease fallback failed:', error);
    return null;
  }

  clearPropertyTenantsRelationMissingCache();

  if (!data) return null;

  const pt = data as Record<string, unknown>;
  let rent = Number(pt.rent_amount ?? pt.monthly_rent ?? 0);
  const deposit = Number(pt.deposit_amount ?? pt.security_deposit ?? 0);

  let props: Record<string, unknown> | null = null;
  const pid = pt.property_id as string | undefined;
  if (pid) {
    // Do not select columns missing from remote `properties` (PostgREST 400). Annual rent still comes from lease rows.
    const pr = await supabase
      .from('properties')
      .select(
        'id, name, address, city, state, lease_price, monthly_rent, property_type, shortlet_details'
      )
      .eq('id', pid)
      .maybeSingle();
    if (!pr.error && pr.data) {
      props = pr.data as Record<string, unknown>;
      const lp = Number(props.lease_price ?? 0);
      const mp = Number(props.monthly_rent ?? 0);
      if (!(rent > 0) && mp > 0) rent = mp;
      if (!(rent > 0) && lp > 0) rent = lp / 12;
    }
  }

  const synthetic: Record<string, unknown> = {
    id: pt.id,
    tenant_id: pt.tenant_id,
    property_id: pt.property_id,
    start_date: pt.start_date,
    end_date: pt.end_date,
    monthly_rent: rent,
    security_deposit: deposit,
    status: pt.status ?? 'active',
    created_at: pt.created_at,
    updated_at: pt.updated_at,
    properties: props,
  };

  return mapLeaseLikeRowToTenantLease(synthetic, { properties: props });
}

/**
 * When there is no row in `leases` / `property_tenants` yet, derive display + rent from the
 * tenant's latest approved rental application and the linked property (common before `tenants` onboarding).
 */
export async function fetchTenantLeaseFromApprovedApplication(
  authUserId: string,
  resolvedTenantId?: string | null
) {
  try {
    const { data: app, error: appErr } = await supabase
      .from('rental_applications')
      .select('id, property_id, move_in_date, tenancy_period, status, updated_at, created_at')
      .eq('user_id', authUserId)
      .eq('status', 'approved')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (appErr) {
      const code = (appErr as { code?: string }).code;
      const msg = String((appErr as { message?: string }).message ?? '').toLowerCase();
      if (code === '42P01' || msg.includes('does not exist') || msg.includes('schema cache')) {
        return null;
      }
      console.warn('[tenant] rental_applications lease fallback:', appErr);
      return null;
    }

    const appRow = app as Record<string, unknown> | null;
    const propertyId = appRow?.property_id != null ? String(appRow.property_id) : '';
    if (!propertyId) return null;

    const { data: prop, error: propErr } = await supabase
      .from('properties')
      .select(
        'id, name, address, city, state, lease_price, monthly_rent, property_type, shortlet_details'
      )
      .eq('id', propertyId)
      .maybeSingle();

    if (propErr || !prop) {
      if (propErr) console.warn('[tenant] property for approved application:', propErr);
      return null;
    }

    const props = prop as Record<string, unknown>;
    const startRaw =
      (appRow.move_in_date as string | undefined)?.trim() ||
      (appRow.created_at as string | undefined)?.split('T')[0] ||
      new Date().toISOString().split('T')[0];
    const months = Math.max(1, Number(appRow.tenancy_period ?? 12) || 12);
    const startD = new Date(`${String(startRaw).split('T')[0]}T12:00:00`);
    let endStr = '';
    if (!Number.isNaN(startD.getTime())) {
      const endD = new Date(startD);
      endD.setMonth(endD.getMonth() + months);
      endD.setDate(endD.getDate() - 1);
      endStr = endD.toISOString().split('T')[0];
    }

    const synthetic: Record<string, unknown> = {
      id: `application:${String(appRow.id)}`,
      tenant_id: resolvedTenantId != null && resolvedTenantId !== '' ? resolvedTenantId : '',
      property_id: propertyId,
      start_date: String(startRaw).split('T')[0],
      end_date: endStr || String(startRaw).split('T')[0],
      monthly_rent: Number(props.monthly_rent ?? 0),
      security_deposit: null,
      status: 'active',
      created_at: appRow.created_at,
      updated_at: appRow.updated_at,
      properties: props,
    };

    return mapLeaseLikeRowToTenantLease(synthetic, { properties: props });
  } catch (e) {
    console.warn('[tenant] fetchTenantLeaseFromApprovedApplication:', e);
    return null;
  }
}
