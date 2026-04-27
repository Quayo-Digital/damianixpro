import { useQuery } from '@tanstack/react-query';
import { useAuthSession } from '@/contexts/auth';
import { getRoleScreeningEvaluation } from '@/services/screening/roleScreeningAccess';

/**
 * Loads KYC + optional tenant screening + waiver flags and evaluates `evaluateRoleScreening`.
 * Admins still get data for the hub UI; policy marks them passed in evaluateRoleScreening.
 */
export function useRoleScreening() {
  const { user, userRole } = useAuthSession();

  return useQuery({
    queryKey: ['role-screening-eval', user?.id, userRole],
    queryFn: async () => {
      if (!user?.id) throw new Error('Not signed in');
      return getRoleScreeningEvaluation(user.id, userRole);
    },
    enabled: !!user?.id && !!userRole,
    staleTime: 45_000,
  });
}
