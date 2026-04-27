import { useMemo } from 'react';
import { useAuthSession } from '@/contexts/auth';
import { useSubscription } from '@/hooks/useSubscription';
import { subscriptionGrantsOwnerPaidAccess } from '@/services/subscription/subscriptionEntitlements';

/**
 * Hybrid owner model: account can be created freely; listing/property creation requires
 * an active or trialing subscription (admins exempt).
 */
export function useOwnerSubscriptionAccess() {
  const { userRole } = useAuthSession();
  const { currentSubscription, subscriptionLoading, plansLoading } = useSubscription();

  const isAdminExempt = userRole === 'admin' || userRole === 'super_admin';

  const hasPaidOwnerAccess = useMemo(() => {
    if (isAdminExempt) return true;
    return subscriptionGrantsOwnerPaidAccess(currentSubscription);
  }, [currentSubscription, isAdminExempt]);

  return {
    hasPaidOwnerAccess,
    /** True while subscription query is loading (admins: false). */
    isCheckingAccess: !isAdminExempt && (subscriptionLoading || plansLoading),
  };
}
