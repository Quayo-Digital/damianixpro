import type { TenantLease } from '@/hooks/useEnhancedTenantData';

/**
 * Nigerian rental market: rent is typically quoted and collected on an annual basis.
 * We store monthly equivalents in some tables; `lease_price` on properties is annual (NGN).
 */
export function annualRentNgn(
  lease: Pick<TenantLease, 'lease_price' | 'monthly_rent'> | null | undefined
): number {
  if (!lease) return 0;
  const explicit = Number(lease.lease_price ?? 0);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const monthly = Number(lease.monthly_rent ?? 0);
  if (Number.isFinite(monthly) && monthly > 0) return monthly * 12;
  return 0;
}
