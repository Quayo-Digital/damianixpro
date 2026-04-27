import { PaymentCategory, RecurringPaymentType } from '@/utils/PaymentTypes';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

/**
 * Fetches tenant ID using the current user ID
 */
export const fetchTenantIdFromUser = async (userId: string): Promise<string | null> => {
  try {
    // First try direct user_id match
    const { data: directMatch, error: directError } = await supabase
      .from('tenants')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (directError) {
      const status = (directError as { status?: number }).status;
      if (status === 401 || directError.code === 'PGRST301') {
        throw new Error('auth session expired');
      }
    }

    if (directMatch?.id) {
      return directMatch.id;
    }

    // If no direct match, try to get user email and match by email
    const { data: userData, error: getUserError } = await supabase.auth.getUser();
    if (getUserError) {
      const status = (getUserError as { status?: number }).status;
      if (status === 401) {
        throw new Error('auth session expired');
      }
    }

    if (userData?.user?.email) {
      const { data: emailMatch, error: emailError } = await supabase
        .from('tenants')
        .select('id')
        .eq('email', userData.user.email)
        .maybeSingle();

      if (emailError) {
        const status = (emailError as { status?: number }).status;
        if (status === 401 || emailError.code === 'PGRST301') {
          throw new Error('auth session expired');
        }
      }

      if (emailMatch?.id) {
        // Found a match by email, update the tenant record with user_id for future
        await supabase.from('tenants').update({ user_id: userId }).eq('id', emailMatch.id);

        return emailMatch.id;
      }
    }

    console.log('No tenant record found for the user');
    return null;
  } catch (error) {
    console.error('Error in tenant ID fetch:', error);
    const msg = error instanceof Error ? error.message : '';
    if (msg === 'auth session expired') {
      toast.error('Session expired', {
        description: 'Please sign in again to continue with payments.',
      });
      return null;
    }
    toast.error('Could not retrieve tenant information');
    return null;
  }
};

/**
 * Validate payment data before processing
 */
export const validatePayment = (
  amount: number,
  tenantId?: string
): { valid: boolean; message?: string } => {
  if (!tenantId) {
    return {
      valid: false,
      message:
        'Tenant information is missing. Please contact your property manager to set up your tenant profile.',
    };
  }

  if (!amount || amount <= 0) {
    return { valid: false, message: 'Payment amount must be greater than zero' };
  }

  return { valid: true };
};
