import type { UserSubscription } from '@/types/subscription';

/**
 * Whether a DB subscription row currently allows owner paid features (properties, short-lets, etc.).
 * Trialing access ends when `trial_end` is in the past (also enforced by RPC + optional cron).
 */
export function subscriptionGrantsOwnerPaidAccess(
  sub: Pick<UserSubscription, 'status' | 'trial_end'> | null | undefined
): boolean {
  if (!sub) return false;
  if (sub.status === 'active') return true;
  if (sub.status !== 'trialing') return false;
  if (!sub.trial_end) return true;
  return new Date(sub.trial_end).getTime() > Date.now();
}
