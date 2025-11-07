import { createContext } from 'react';
import { User } from '@supabase/supabase-js';
import { AuthContextType, UserRole } from './types';

// Create context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  signIn: async () => {},
  signOut: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  signInWithPhone: async () => {},
  verifyOtp: async () => {},
  resetPassword: async () => {},
  isLoading: true,
  loading: true,
  session: null,
  isSuperAdmin: () => false,
  isAdmin: () => false,
  isOwner: () => false,
  isAgent: () => false,
  isTenant: () => false,
  isVendor: () => false,
  isManager: () => false,
  isAuthenticated: () => false,
  getRoleDisplay: () => 'User',
  refreshUserRole: async () => null,
  updateUserMetadata: async () => {}
});

export default AuthContext;
