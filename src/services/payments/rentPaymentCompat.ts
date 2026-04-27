/**
 * Maps `rent_payments` rows to the legacy tenant payment UI shape used by
 * PaymentInterface and useEnhancedTenantData (previously backed by tenant_payments).
 */

export type UiPaymentStatus = 'pending' | 'completed' | 'failed';

export interface RentPaymentRow {
  id: string;
  property_tenant_id: string;
  amount: number | string;
  status?: string | null;
  reference?: string | null;
  category?: string | null;
  description?: string | null;
  due_date?: string | null;
  payment_date?: string | null;
  payment_method?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/** Normalize DB status (webhooks use `successful`) for UI + analytics. */
export function rentStatusToUiStatus(status: string | null | undefined): UiPaymentStatus {
  const s = String(status ?? '').toLowerCase();
  if (s === 'successful') return 'completed';
  if (s === 'failed') return 'failed';
  return 'pending';
}

/** Map client verification result to rent_payments.status */
export function verificationStatusToRentStatus(
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
): string {
  if (status === 'completed') return 'successful';
  if (status === 'failed') return 'failed';
  if (status === 'cancelled') return 'cancelled';
  return 'pending';
}

/**
 * Shape expected by PaymentInterface (payment_status, reference_number, etc.)
 */
export function mapRentRowToPaymentUi(row: RentPaymentRow, tenantId: string) {
  const uiStatus = rentStatusToUiStatus(row.status);
  const method = (row.payment_method || 'card') as string;
  return {
    id: row.id,
    tenant_id: tenantId,
    amount: Number(row.amount),
    payment_status: uiStatus,
    reference_number: row.reference || '',
    description: row.description || '',
    payment_method: method,
    payment_type: row.category || 'rent',
    due_date: row.due_date || row.created_at?.split('T')[0] || '',
    payment_date: row.payment_date || row.due_date || row.created_at || '',
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || row.created_at || new Date().toISOString(),
    // lease_id in legacy types often meant property_tenants row
    lease_id: row.property_tenant_id,
    late_fee_applied: 0,
    receipt_url: undefined as string | undefined,
  };
}
