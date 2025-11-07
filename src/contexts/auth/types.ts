import { Session, User } from '@supabase/supabase-js';

export type UserRole = 'super_admin' | 'admin' | 'owner' | 'agent' | 'tenant' | 'vendor' | 'user' | 'manager';

export interface AuthUser extends User {
  user_metadata: {
    full_name?: string;
    company?: string;
    role?: UserRole;
    onboarded?: boolean;
    [key: string]: any;
  };
}

export interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  session: Session | null;
  loading: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, options?: any) => Promise<any>;
  signInWithGoogle?: () => Promise<any>;
  signInWithPhone?: (phone: string) => Promise<any>;
  verifyOtp?: (phone: string, otp: string) => Promise<any>;
  resetPassword?: (email: string) => Promise<any>;
  isSuperAdmin: () => boolean;
  isAdmin: () => boolean;
  isOwner: () => boolean;
  isAgent: () => boolean;
  isTenant: () => boolean;
  isVendor: () => boolean;
  isManager: () => boolean;
  isAuthenticated: () => boolean;
  getRoleDisplay: () => string;
  refreshUserRole: () => Promise<UserRole | null>;
  updateUserMetadata: (metadata: any) => Promise<void>;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}
