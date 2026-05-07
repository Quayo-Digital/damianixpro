import { supabaseAdmin } from './supabaseClient.mjs';
import { apiStatusFromRent } from './rentLedgerCompat.mjs';

/**
 * Compute outstanding rent balance for a tenant directly via supabaseAdmin.
 * Used by HTTP route (`server/rentBalanceService.mjs`) and the WhatsApp
 * assistant (`server/whatsappVoiceAssistant.mjs`) so they share a single
 * source of truth and the WA path doesn't need a tenant JWT round-trip.
 *
 * @param {string} tenantId
 * @returns {Promise<null | {
 *   tenant_id: string,
 *   tenant: string,
 *   property: string,
 *   balance: number,
 *   currency: 'NGN',
 *   due_date: string,
 *   phone: string | null,
 *   email: string | null,
 * }>}
 */
export async function computeTenantRentBalance(tenantId) {
  if (!supabaseAdmin || !tenantId) return null;

  const { data: tenant, error: tenantErr } = await supabaseAdmin
    .from('tenants')
    .select('id, first_name, last_name, phone, email')
    .eq('id', tenantId)
    .maybeSingle();
  if (tenantErr || !tenant) return null;

  const { data: lease, error: leaseErr } = await supabaseAdmin
    .from('leases')
    .select(
      `
      id,
      tenant_id,
      property_id,
      start_date,
      end_date,
      monthly_rent,
      status,
      properties ( title )
    `
    )
    .eq('tenant_id', tenant.id)
    .eq('status', 'ACTIVE')
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (leaseErr || !lease) return null;

  const { data: ptRow } = await supabaseAdmin
    .from('property_tenants')
    .select('id')
    .eq('tenant_id', lease.tenant_id)
    .eq('property_id', lease.property_id)
    .limit(1)
    .maybeSingle();

  const { data: rentPayRows } = ptRow?.id
    ? await supabaseAdmin
        .from('rent_payments')
        .select('amount, status, due_date')
        .eq('property_tenant_id', ptRow.id)
    : { data: [] };

  const today = new Date();
  const outstanding = (rentPayRows || []).filter((p) => apiStatusFromRent(p.status) !== 'PAID');
  const totalOutstanding = outstanding.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const nextDue = outstanding
    .filter((p) => p.due_date)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];

  return {
    tenant_id: tenant.id,
    tenant: `${tenant.first_name} ${tenant.last_name}`.trim(),
    property: lease.properties?.title ?? 'Unknown Property',
    balance: totalOutstanding,
    currency: 'NGN',
    due_date: nextDue?.due_date ?? today.toISOString().slice(0, 10),
    phone: tenant.phone ?? null,
    email: tenant.email ?? null,
  };
}
