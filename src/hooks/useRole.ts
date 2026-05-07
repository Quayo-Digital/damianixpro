import { useMemo } from 'react';
import { useAuthSession } from '@/contexts/auth';
import type { UserRole } from '@/contexts/auth/types';

/**
 * Role-focused helpers for RBAC UI. Uses the same `user_roles` row and
 * `config/rbac-permission-matrix.json` as `useAuthSession().permissions`.
 *
 * Prefer `useAuth()` / `useAuthSession()` when you also need session actions;
 * use this hook when components only care about role and capability checks.
 */
export function useRole() {
  const s = useAuthSession();

  return useMemo(() => {
    const role = s.userRole;

    const hasRole = (r: UserRole | readonly UserRole[]) => {
      const list = (Array.isArray(r) ? r : [r]) as readonly UserRole[];
      return role != null && list.includes(role);
    };

    return {
      role,
      /** True if the current `userRole` is one of the given roles. */
      hasRole,
      isSuperAdmin: s.isSuperAdmin,
      isAdmin: s.isAdmin,
      isOwner: s.isOwner,
      isAgent: s.isAgent,
      isTenant: s.isTenant,
      isVendor: s.isVendor,
      isManager: s.isManager,
      isAccountant: s.isAccountant,
      isFacilityManager: s.isFacilityManager,
      can: s.hasPermission,
      canAny: s.hasAnyPermission,
      canAll: s.hasAllPermissions,
      permissions: s.permissions,
    };
  }, [s]);
}
