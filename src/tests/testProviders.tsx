import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AuthSessionContext, AuthActionsContext } from '@/contexts/auth/AuthContext';
import type {
  AuthSessionContextValue,
  AuthActionsContextValue,
  UserRole,
} from '@/contexts/auth/types';
import { getPermissionsForRole } from '@/auth/rbac/matrix';

const noop = () => Promise.resolve(null as unknown as null);
const noopVoid = () => Promise.resolve();

/** Minimal auth session for component tests (avoids full Supabase AuthProvider). */
export function createMockAuthSession(
  overrides: Partial<AuthSessionContextValue> = {}
): AuthSessionContextValue {
  const userRole = (overrides.userRole ?? 'tenant') as UserRole;
  const user = overrides.user ?? null;
  const session = overrides.session ?? null;
  const loading = overrides.loading ?? false;
  const isLoading = overrides.isLoading ?? false;
  const permSet = getPermissionsForRole(userRole);
  const permissions = Object.freeze([...permSet]);

  return {
    user,
    userRole,
    session,
    loading,
    isLoading,
    isSuperAdmin: () => userRole === 'super_admin',
    isAdmin: () => userRole === 'super_admin' || userRole === 'admin',
    isOwner: () => userRole === 'owner',
    isAgent: () => userRole === 'agent',
    isTenant: () => userRole === 'tenant',
    isVendor: () => userRole === 'vendor',
    isManager: () => userRole === 'manager',
    isAccountant: () => userRole === 'accountant',
    isFacilityManager: () => userRole === 'facility_manager',
    isAuthenticated: () => user !== null,
    getRoleDisplay: () => String(userRole),
    permissions: overrides.permissions ?? permissions,
    hasPermission: overrides.hasPermission ?? ((p: string) => permSet.has(p)),
    hasAnyPermission:
      overrides.hasAnyPermission ?? ((ps: readonly string[]) => ps.some((p) => permSet.has(p))),
    hasAllPermissions:
      overrides.hasAllPermissions ?? ((ps: readonly string[]) => ps.every((p) => permSet.has(p))),
  };
}

const defaultActions: AuthActionsContextValue = {
  signIn: noop,
  signOut: noopVoid,
  signUp: noop,
  refreshUserRole: noop,
  updateUserMetadata: noopVoid,
};

export function TestAuthProviders({
  children,
  session,
  actionOverrides,
}: {
  children: React.ReactNode;
  session?: Partial<AuthSessionContextValue>;
  actionOverrides?: Partial<AuthActionsContextValue>;
}) {
  const sessionValue = createMockAuthSession(session ?? {});
  const actionsValue = { ...defaultActions, ...actionOverrides };
  return (
    <AuthSessionContext.Provider value={sessionValue}>
      <AuthActionsContext.Provider value={actionsValue}>{children}</AuthActionsContext.Provider>
    </AuthSessionContext.Provider>
  );
}

export function TestAppShell({
  children,
  session,
  actionOverrides,
  initialEntries = ['/'],
}: {
  children: React.ReactNode;
  session?: Partial<AuthSessionContextValue>;
  actionOverrides?: Partial<AuthActionsContextValue>;
  initialEntries?: string[];
}) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <TestAuthProviders session={session} actionOverrides={actionOverrides}>
        {children}
      </TestAuthProviders>
    </MemoryRouter>
  );
}
