import { useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export const usePasswordOperations = () => {
  const resetPassword = useCallback(async (email: string) => {
    try {
      logger.debug('Initiating password reset', { email });

      const { error, data } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });

      if (error) {
        logger.error('Password reset error', error);
        toast.error(error.message || 'Failed to send password reset email');
        throw error;
      }

      toast.success('Password reset email sent');
      return data;
    } catch (error) {
      logger.error('Password reset exception', error);
      toast.error('An error occurred during password reset');
      throw error;
    }
  }, []);

  return useMemo(() => ({ resetPassword }), [resetPassword]);
};
