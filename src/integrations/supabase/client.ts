
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://nocrbgzxcrirfpbuqhop.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vY3JiZ3p4Y3JpcmZwYnVxaG9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2MDQ2NDEsImV4cCI6MjA2MjE4MDY0MX0.dyrmLzQu05-xyksMREPc5gwDE1nmjJUf1KZ10MvrVEA";

// Validate required configuration
if (!SUPABASE_URL) {
  throw new Error('Missing Supabase URL');
}

if (!SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing Supabase publishable key');
}

// Create the Supabase client with proper auth configuration
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
  // Removed global Content-Type header to allow proper file uploads
  // The browser will automatically set the correct Content-Type for each request
});

// Helper to check if auth is initialized
export const isAuthInitialized = async () => {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch (error) {
    console.error('Error checking auth initialization:', error);
    return false;
  }
};

// Helper for secure data operations
export const secureDataOperation = async <T>(
  operation: () => Promise<T>, 
  errorMessage: string = "Operation failed"
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    console.error(errorMessage, error);
    throw new Error(`${errorMessage}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
