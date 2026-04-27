import { Session, User } from '@supabase/supabase-js';

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'owner'
  | 'agent'
  | 'tenant'
  | 'vendor'
  | 'user'
  | 'manager';

export interface AuthUser extends User {
  user_metadata: {
    full_name?: string;
    company?: string;
    role?: UserRole;
    onboarded?: boolean;
    [key: string]: any;
  };
}

/** Session-derived state and role helpers (changes when user / role / session updates). */
export interface AuthSessionContextValue {
  user: User | null;
  userRole: UserRole | null;
  session: Session | null;
  loading: boolean;
  isLoading: boolean;
  isSuperAdmin: () => boolean;
  isAdmin: () => boolean;
  isOwner: () => boolean;
  isAgent: () => boolean;
  isTenant: () => boolean;
  isVendor: () => boolean;
  isManager: () => boolean;
  isAuthenticated: () => boolean;
  getRoleDisplay: () => string;
}

/** Stable auth API surface (callbacks should stay referentially stable across renders). */
export interface AuthActionsContextValue {
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, options?: any) => Promise<any>;
  signInWithGoogle?: () => Promise<any>;
  signInWithPhone?: (phone: string) => Promise<any>;
  verifyOtp?: (phone: string, otp: string) => Promise<any>;
  resetPassword?: (email: string) => Promise<any>;
  refreshUserRole: () => Promise<UserRole | null>;
  updateUserMetadata: (metadata: any) => Promise<void>;
}

/** Full auth context = session + actions (use `useAuthSession` / `useAuthActions` to subscribe narrowly). */
export type AuthContextType = AuthSessionContextValue & AuthActionsContextValue;

export interface AuthProviderProps {
  children: React.ReactNode;
}
