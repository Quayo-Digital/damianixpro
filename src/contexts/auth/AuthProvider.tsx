
import React, { ReactNode } from 'react';
import { useAuthState } from './useAuthState';
import AuthContext from './AuthContext';
import { 
  getRoleDisplay, 
  checkIsSuperAdmin,
  checkIsAdmin, 
  checkIsOwner, 
  checkIsAgent, 
  checkIsTenant, 
  checkIsVendor,
  checkIsManager 
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
    updateUserMetadata
  } = useAuthState();

  const value = {
    user,
    userRole,
    signIn,
    signOut,
    signUp,
    signInWithGoogle,
    signInWithPhone,
    verifyOtp,
    resetPassword,
    isLoading,
    loading: isLoading, // maintain backward compatibility
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
    refreshUserRole,
    updateUserMetadata
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
