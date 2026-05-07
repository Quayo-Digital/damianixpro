import React, { ReactNode, useMemo } from 'react';
import { useAuthState } from './useAuthState';
import { AuthSessionContext, AuthActionsContext } from './AuthContext';
import type { AuthContextType } from './types';
import {
  getRoleDisplay,
  checkIsSuperAdmin,
  checkIsAdmin,
  checkIsOwner,
  checkIsAgent,
  checkIsTenant,
  checkIsVendor,
  checkIsManager,
  checkIsAccountant,
  checkIsFacilityManager,
} from './authUtils';
import { getPermissionsForRole } from '@/auth/rbac/matrix';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const {
    user,
    userRole,
    isLoading,
    session,
    signIn,
    signOut,
    signUp,
    signInWithGoogle,
    signInWithPhone,
    verifyOtp,
    resetPassword,
    refreshUserRole,
    updateUserMetadata,
  } = useAuthState();

  const sessionValue = useMemo(() => {
    const permSet = getPermissionsForRole(userRole);
    const permissions = Object.freeze([...permSet]);
    return {
      user,
      userRole,
      isLoading,
      loading: isLoading,
      session,
      isSuperAdmin: () => checkIsSuperAdmin(userRole),
      isAdmin: () => checkIsAdmin(userRole),
      isOwner: () => checkIsOwner(userRole),
      isAgent: () => checkIsAgent(userRole),
      isTenant: () => checkIsTenant(userRole),
      isVendor: () => checkIsVendor(userRole),
      isManager: () => checkIsManager(userRole),
      isAccountant: () => checkIsAccountant(userRole),
      isFacilityManager: () => checkIsFacilityManager(userRole),
      isAuthenticated: () => user !== null,
      getRoleDisplay: () => getRoleDisplay(userRole),
      permissions,
      hasPermission: (permission: string) => permSet.has(permission),
      hasAnyPermission: (perms: readonly string[]) => perms.some((p) => permSet.has(p)),
      hasAllPermissions: (perms: readonly string[]) => perms.every((p) => permSet.has(p)),
    };
  }, [user, userRole, isLoading, session]);

  const actionsValue = useMemo(
    () => ({
      signIn,
      signOut,
      signUp,
      signInWithGoogle,
      signInWithPhone,
      verifyOtp,
      resetPassword,
      refreshUserRole,
      updateUserMetadata,
    }),
    [
      signIn,
      signOut,
      signUp,
      signInWithGoogle,
      signInWithPhone,
      verifyOtp,
      resetPassword,
      refreshUserRole,
      updateUserMetadata,
    ]
  );

  return (
    <AuthSessionContext.Provider value={sessionValue}>
      <AuthActionsContext.Provider value={actionsValue}>{children}</AuthActionsContext.Provider>
    </AuthSessionContext.Provider>
  );
};

export const useAuthSession = () => {
  const context = React.useContext(AuthSessionContext);
  if (context == null) {
    throw new Error('useAuthSession must be used within an AuthProvider');
  }
  return context;
};

export const useAuthActions = () => {
  const context = React.useContext(AuthActionsContext);
  if (context == null) {
    throw new Error('useAuthActions must be used within an AuthProvider');
  }
  return context;
};

export const useAuth = (): AuthContextType => {
  const session = useAuthSession();
  const actions = useAuthActions();
  return useMemo(
    () => ({
      ...session,
      ...actions,
    }),
    [session, actions]
  );
};
