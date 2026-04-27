import { useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { getAuthNetworkFailureMessage } from '@/utils/authNetworkErrors';
import {
  formatSupabaseAuthSignInError,
  formatSupabaseAuthSignUpError,
} from '@/utils/supabaseErrors';

export const useBasicAuthOperations = () => {
  const signIn = useCallback(async (email: string, password: string) => {
    logger.debug('Signing in with email', { email });
    let result;
    try {
      result = await supabase.auth.signInWithPassword({ email, password });
    } catch (error) {
      logger.error('Sign in exception', error);
      const networkHint = getAuthNetworkFailureMessage(error);
      toast.error(networkHint || 'Sign-in failed. Please try again.');
      throw error;
    }

    const { data, error } = result;
    if (error) {
      logger.warn('Sign in rejected', {
        status: (error as { status?: number })?.status,
        code: (error as { code?: string })?.code,
        message: (error as { message?: string })?.message,
      });
      toast.error(formatSupabaseAuthSignInError(error));
      throw error;
    }

    if (data?.user) {
      logger.debug('Sign in successful', { userId: data.user.id });
      toast.success('Signed in successfully');
    }

    return data;
  }, []);

  const signOut = useCallback(async () => {
    logger.debug('Signing out user');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.error('Sign out error', error);
        toast.error(error.message || 'Failed to sign out');
        throw error;
      }
      toast.success('Signed out successfully');
    } catch (error) {
      logger.error('Sign out exception', error);
      const networkHint = getAuthNetworkFailureMessage(error);
      toast.error(networkHint || 'An error occurred while signing out');
      throw error;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, metadata: any = {}) => {
    logger.debug('Registering with email and role', { email, role: metadata.role });

    try {
      const redirectUrl = `${window.location.origin}/dashboard`;

      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: metadata,
        },
      });

      if (error) {
        logger.warn('Sign up rejected', {
          status: (error as { status?: number })?.status,
          code: (error as { code?: string })?.code,
          message: (error as { message?: string })?.message,
        });
        toast.error(formatSupabaseAuthSignUpError(error));
        throw error;
      }

      if (data.user) {
        logger.debug('Signup successful', { userId: data.user.id });

        if (!data.session && data.user && !data.user.email_confirmed_at) {
          toast.success('Please check your email to confirm your account');
        } else {
          toast.success('Account created successfully');
        }

        return data;
      }
    } catch (error) {
      const networkHint = getAuthNetworkFailureMessage(error);
      if (networkHint) {
        logger.error('Sign up exception', error);
        toast.error(networkHint, { duration: 12_000 });
        throw error;
      }

      logger.warn('Sign up exception', error);
      toast.error(formatSupabaseAuthSignUpError(error));
      throw error;
    }
  }, []);

  return useMemo(
    () => ({
      signIn,
      signOut,
      signUp,
    }),
    [signIn, signOut, signUp]
  );
};
