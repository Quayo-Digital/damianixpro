import { useMemo } from 'react';
import { useBasicAuthOperations } from './useBasicAuthOperations';
import { useRoleOperations } from './useRoleOperations';
import { useSocialAuthOperations } from './useSocialAuthOperations';
import { usePasswordOperations } from './usePasswordOperations';

/**
 * Merges auth operation slices. Each slice returns a stable object when its
 * useCallback-backed methods are unchanged, so this useMemo rarely recomputes.
 */
export function useAuthOperations() {
  const basicAuth = useBasicAuthOperations();
  const roleOperations = useRoleOperations();
  const socialAuth = useSocialAuthOperations();
  const passwordOps = usePasswordOperations();

  return useMemo(
    () => ({
      ...basicAuth,
      ...roleOperations,
      ...socialAuth,
      ...passwordOps,
    }),
    [basicAuth, roleOperations, socialAuth, passwordOps]
  );
}
