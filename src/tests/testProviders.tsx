import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AuthSessionContext, AuthActionsContext } from '@/contexts/auth/AuthContext';
import type {
  AuthSessionContextValue,
  AuthActionsContextValue,
  UserRole,
} from '@/contexts/auth/types';

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

  return {
    user,
    userRole,
    session,
    loading,
    isLoading,
    isSuperAdmin: () => userRole === 'super_admin',
    isAdmin: () => userRole === 'admin',
    isOwner: () => userRole === 'owner',
    isAgent: () => userRole === 'agent',
    isTenant: () => userRole === 'tenant',
    isVendor: () => userRole === 'vendor',
    isManager: () => userRole === 'manager',
    isAuthenticated: () => user !== null,
    getRoleDisplay: () => String(userRole),
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
