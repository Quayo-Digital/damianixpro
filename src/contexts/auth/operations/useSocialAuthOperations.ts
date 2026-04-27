import { useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatPhoneNumber } from '../authUtils';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export const useSocialAuthOperations = () => {
  const signInWithGoogle = useCallback(async () => {
    logger.debug('Initiating Google sign-in');

    const currentOrigin = window.location.origin;
    const redirectUrl = `${currentOrigin}/auth/callback`;

    logger.debug('Current origin and redirect URL', { currentOrigin, redirectUrl });

    if (currentOrigin.includes('lovable.dev') || currentOrigin.includes('lovable-dev')) {
      logger.error(
        'Detected Lovable.dev in origin - please update Supabase URL Configuration',
        new Error('Invalid origin')
      );
      toast.error(
        'Configuration error: Please update Supabase URL settings. See console for details.'
      );
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        logger.error('Google sign-in error', error, {
          message: error.message,
          status: error.status,
          redirectUrl,
        });
        toast.error(error.message || 'Failed to sign in with Google');
        throw error;
      }

      if (data?.url) {
        logger.debug('OAuth URL generated', { url: data.url });
      }
    } catch (error) {
      logger.error('Google sign-in exception', error);
      toast.error('An error occurred during Google sign-in');
      throw error;
    }
  }, []);

  const signInWithPhone = useCallback(async (phone: string) => {
    try {
      const formattedPhone = formatPhoneNumber(phone);
      logger.debug('Initiating phone sign-in', { phone: formattedPhone });

      const { error, data } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
        logger.error('Phone sign-in error', error);
        toast.error(error.message || 'Failed to send OTP');
        throw error;
      }

      toast.success('OTP sent to your phone');
      return data;
    } catch (error) {
      logger.error('Phone sign-in exception', error);
      toast.error('An error occurred during phone sign-in');
      throw error;
    }
  }, []);

  const verifyOtp = useCallback(async (phone: string, otp: string) => {
    try {
      const formattedPhone = formatPhoneNumber(phone);
      logger.debug('Verifying OTP', { phone: formattedPhone });

      const { error, data } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms',
      });

      if (error) {
        logger.error('OTP verification error', error);
        toast.error(error.message || 'Invalid OTP');
        throw error;
      }

      toast.success('Phone number verified successfully');
      return data;
    } catch (error) {
      logger.error('OTP verification exception', error);
      toast.error('An error occurred during OTP verification');
      throw error;
    }
  }, []);

  return useMemo(
    () => ({
      signInWithGoogle,
      signInWithPhone,
      verifyOtp,
    }),
    [signInWithGoogle, signInWithPhone, verifyOtp]
  );
};
