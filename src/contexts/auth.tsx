// Re-export from new location
import { AuthProvider, useAuth, useAuthSession, useAuthActions } from './auth/index';
import { AuthContextType, UserRole, AuthUser } from './auth/types';

export { AuthProvider, useAuth, useAuthSession, useAuthActions };
export type { AuthContextType, UserRole, AuthUser };
