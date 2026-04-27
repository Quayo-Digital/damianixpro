import { supabase } from '@/integrations/supabase/client';

export type RentRecurrenceStatus =
  | 'pending_authorization'
  | 'active'
  | 'paused'
  | 'cancelled'
  | 'failed';

export interface RentRecurrenceMandate {
  id: string;
  tenant_user_id: string;
  tenant_id: string;
  property_id: string;
  property_tenant_id: string | null;
  provider: string;
  status: RentRecurrenceStatus;
  amount_ngn: number;
  frequency: string;
  flutterwave_authorization_code: string | null;
  card_last4: string | null;
  card_brand: string | null;
  last_successful_charge_at: string | null;
  next_charge_due_date: string | null;
  created_at: string;
  updated_at: string;
}

function isMissingTable(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  if (err.code === '42P01') return true;
  const m = (err.message || '').toLowerCase();
  return m.includes('rent_recurrence_mandates') && m.includes('does not exist');
}

export async function fetchActiveRentRecurrenceMandate(
  tenantId: string,
  propertyId: string
): Promise<RentRecurrenceMandate | null> {
  if (!tenantId || !propertyId) return null;

  const { data, error } = await supabase
    .from('rent_recurrence_mandates')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('property_id', propertyId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    if (isMissingTable(error)) return null;
    console.error('[rentRecurrence]', error);
    return null;
  }

  return data as RentRecurrenceMandate | null;
}

export async function updateRentRecurrenceStatus(
  mandateId: string,
  status: RentRecurrenceStatus
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from('rent_recurrence_mandates')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', mandateId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
