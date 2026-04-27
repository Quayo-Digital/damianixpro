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
} from './authUtils';

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

  const sessionValue = useMemo(
    () => ({
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
      isAuthenticated: () => user !== null,
      getRoleDisplay: () => getRoleDisplay(userRole),
    }),
    [user, userRole, isLoading, session]
  );

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
