import { supabase } from '@/integrations/supabase/client';
import { subscriptionGrantsOwnerPaidAccess } from '@/services/subscription/subscriptionEntitlements';
import { fetchUserRoleFromDb, checkIsAdmin } from '@/contexts/auth/authUtils';
import type { UserRole } from '@/contexts/auth/types';

/** Statuses that allow owner monetization features (aligned with `useSubscription` query). */
export const OWNER_SUBSCRIPTION_ALLOWED_STATUSES = ['active', 'trialing'] as const;

/** Note: `useSubscription` applies an implicit Free tier for entitlements when no row exists; this module still requires a real `user_subscriptions` row for owner paid flows (listings / properties). */

export const OWNER_SUBSCRIPTION_REQUIRED_MESSAGE =
  'An active subscription (or trial) is required to add properties and short-let listings. Choose a plan under Subscription in your owner dashboard.';

/**
 * Returns true if the user has at least one subscription row in an entitled status.
 */
export async function userHasOwnerSubscription(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('id, status, trial_end')
    .eq('user_id', userId)
    .in('status', [...OWNER_SUBSCRIPTION_ALLOWED_STATUSES])
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw error;
  const row = data?.[0];
  return subscriptionGrantsOwnerPaidAccess(row ?? null);
}

/**
 * Throws if the property owner must have a subscription but does not.
 * Platform admins can create content without a personal subscription.
 */
export async function assertOwnerSubscriptionForPaidFeatures(
  propertyOwnerId: string
): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    throw new Error('Sign in to continue.');
  }

  const metaRole = session.user.user_metadata?.role as UserRole | undefined;
  const dbRole = await fetchUserRoleFromDb(session.user.id);
  if (checkIsAdmin(metaRole ?? null) || checkIsAdmin(dbRole)) {
    return;
  }

  const ok = await userHasOwnerSubscription(propertyOwnerId);
  if (!ok) {
    throw new Error(OWNER_SUBSCRIPTION_REQUIRED_MESSAGE);
  }
}
