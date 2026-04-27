import { createContext } from 'react';
import type { AuthActionsContextValue, AuthSessionContextValue } from './types';

export const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);
export const AuthActionsContext = createContext<AuthActionsContextValue | null>(null);
