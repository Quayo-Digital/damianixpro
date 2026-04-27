import type { TenantLease, TenantPayment } from '@/hooks/useEnhancedTenantData';

/**
 * Normalize dates and status for dashboard display.
 * - If DB had no end date or end === start, use a one-year term (end = start + 1 year − 1 day).
 * - If status is active but there is no completed payment, show as pending payment.
 */
export function finalizeTenantLeaseForUi(
  lease: TenantLease | null,
  payments: TenantPayment[]
): TenantLease | null {
  if (!lease) return null;

  const hasCompletedPayment = payments.some((p) => p.payment_status === 'completed');
  let lease_status: TenantLease['lease_status'] = lease.lease_status;
  if (lease_status === 'active' && !hasCompletedPayment) {
    lease_status = 'pending_payment';
  }

  const startDay = String(lease.start_date).split('T')[0];
  let endDay = String(lease.end_date).split('T')[0];
  if (!endDay || endDay === startDay) {
    const d = new Date(`${startDay}T12:00:00`);
    if (!Number.isNaN(d.getTime())) {
      d.setFullYear(d.getFullYear() + 1);
      d.setDate(d.getDate() - 1);
      endDay = d.toISOString().split('T')[0];
    }
  }

  return {
    ...lease,
    lease_status,
    start_date: lease.start_date,
    end_date: endDay,
  };
}

export function formatTenantLeaseStatusLabel(status: string | undefined): string {
  if (!status) return '—';
  if (status === 'pending_payment') return 'Pending payment';
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}
