import { useState } from 'react';
import { PaymentCategory, RecurringPaymentType } from '@/utils/PaymentTypes';
import { createRecurringPayment, updatePaymentStatus } from '@/services/payments';
import { toast } from '@/components/ui/sonner';
import { fetchTenantIdFromUser, validatePayment } from '../utils/paymentUtils';
import { useAuthSession } from '@/contexts/AuthContext';
import { initializePayment } from '@/utils/FlutterwaveUtils';

interface UseRecurringPaymentHandlerProps {
  tenantId?: string;
  setIsOpen: (isOpen: boolean) => void;
}

export const useRecurringPaymentHandler = ({
  tenantId: initialTenantId,
  setIsOpen,
}: UseRecurringPaymentHandlerProps) => {
  const { user } = useAuthSession();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSetupRecurringPayment = async (
    recurringAmount: number,
    recurringType: RecurringPaymentType,
    recurringCategory: PaymentCategory,
    recurringDescription: string
  ) => {
    setIsProcessing(true);
    let newPaymentId: string | null = null;

    try {
      let effectiveTenantId = initialTenantId;

      if (!effectiveTenantId && user) {
        effectiveTenantId = await fetchTenantIdFromUser(user.id);
      }

      const validation = validatePayment(recurringAmount, effectiveTenantId);
      if (!validation.valid) {
        throw new Error(validation.message);
      }

      if (!user?.email) {
        throw new Error('User email is required to set up recurring payments.');
      }

      // Record the recurring plan in our database first
      const newPayment = await createRecurringPayment(
        effectiveTenantId!,
        recurringAmount,
        recurringType,
        recurringCategory,
        recurringDescription
      );

      if (!newPayment) {
        throw new Error('Failed to record recurring payment plan in our system.');
      }
      newPaymentId = newPayment.id;

      // Initialize Flutterwave payment (one-time first payment; full recurring requires Flutterwave subscription API)
      initializePayment({
        amount: recurringAmount,
        email: user.email,
        currency: 'NGN',
        ref: newPayment.reference,
        metadata: {
          internal_payment_id: newPayment.id,
          is_recurring: 'true',
          tenantId: effectiveTenantId,
        },
        onSuccess: async () => {
          if (newPaymentId) {
            await updatePaymentStatus(newPaymentId, 'active', true);
          }
          setIsOpen(false);
          toast.success('Recurring payment plan activated!', {
            description: 'Your payment schedule is now set up.',
          });
        },
        onCancel: () => {
          toast.error('Payment was cancelled');
          if (newPaymentId) {
            updatePaymentStatus(newPaymentId, 'failed', true);
          }
        },
      });
    } catch (error) {
      console.error('Error setting up recurring payment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to set up recurring payment');

      if (newPaymentId) {
        await updatePaymentStatus(newPaymentId, 'failed', true);
        toast.info('Recurring payment setup has been rolled back due to an error.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    handleSetupRecurringPayment,
  };
};
