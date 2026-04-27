import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { logger } from '@/utils/logger';

// Get configuration from environment variables - NO FALLBACKS IN PRODUCTION
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required configuration - throw error if missing
if (!SUPABASE_URL) {
  const error = new Error('Missing Supabase URL. Please set VITE_SUPABASE_URL in your .env file.');
  logger.error('Supabase configuration error', error);
  throw error;
}

if (!SUPABASE_PUBLISHABLE_KEY) {
  const error = new Error(
    'Missing Supabase publishable key. Please set VITE_SUPABASE_ANON_KEY in your .env file.'
  );
  logger.error('Supabase configuration error', error);
  throw error;
}

// Validate URL format
if (!SUPABASE_URL.includes('supabase.co')) {
  const error = new Error(
    'Invalid Supabase URL format. Please check VITE_SUPABASE_URL in your .env file.'
  );
  logger.error('Supabase configuration error', error);
  throw error;
}

// Log configuration status (only in development)
if (import.meta.env.DEV) {
  logger.debug('Supabase client initialized', {
    url: SUPABASE_URL.replace(/\/rest\/v1.*$/, ''),
    hasKey: !!SUPABASE_PUBLISHABLE_KEY,
  });
}

/**
 * Avoid Web Locks API for auth serialization. Default navigator locks + React 18 Strict Mode
 * (double mount) + concurrent getSession/onAuthStateChange often yields:
 * `AbortError: signal is aborted without reason` (locks.ts / GoTrueClient).
 */
const authLockBypass = async <R>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<R>
): Promise<R> => fn();

// Create the Supabase client with proper auth configuration
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    lock: authLockBypass,
  },
  // Removed global Content-Type header to allow proper file uploads
  // The browser will automatically set the correct Content-Type for each request
});

/**
 * Helper for shortlet tables (transactions, bookings) when generated types are out of sync.
 * Use this when supabase.from('table') gives "not assignable to parameter" type errors.
 * Regenerate types with: npx supabase gen types typescript --project-id <PROJECT_REF> --schema public
 */
export const fromShortletTable = (table: 'transactions' | 'bookings') =>
  supabase.from(table as keyof Database['public']['Tables']);

// Helper to check if auth is initialized
export const isAuthInitialized = async () => {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch (error) {
    logger.error('Error checking auth initialization', error);
    return false;
  }
};

// Helper for secure data operations
export const secureDataOperation = async <T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Operation failed'
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    logger.error(errorMessage, error);
    throw new Error(`${errorMessage}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
