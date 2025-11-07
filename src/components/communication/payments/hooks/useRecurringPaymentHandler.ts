
import { useState } from 'react';
import { PaymentCategory, RecurringPaymentType } from '@/utils/PaymentTypes';
import { createRecurringPayment, updatePaymentStatus } from '@/services/payments';
import { toast } from '@/components/ui/sonner';
import { fetchTenantIdFromUser, validatePayment } from '../utils/paymentUtils';
import { useAuth } from '@/contexts/AuthContext';
import { createPaystackPlan, initializePayment, PaystackResponse } from '@/utils/PaystackUtils';

interface UseRecurringPaymentHandlerProps {
  tenantId?: string;
  setIsOpen: (isOpen: boolean) => void;
}

export const useRecurringPaymentHandler = ({ 
  tenantId: initialTenantId,
  setIsOpen
}: UseRecurringPaymentHandlerProps) => {
  const { user } = useAuth();
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
      // If tenantId is not provided, try to fetch it using the current user
      let effectiveTenantId = initialTenantId;
      
      if (!effectiveTenantId && user) {
        effectiveTenantId = await fetchTenantIdFromUser(user.id);
      }
      
      // Validate payment data
      const validation = validatePayment(recurringAmount, effectiveTenantId);
      if (!validation.valid) {
        throw new Error(validation.message);
      }

      if (!user?.email) {
        throw new Error("User email is required to set up recurring payments.");
      }
      
      // Step 1: Create a plan on Paystack
      const planName = `Plan for ${user.email} - ${recurringAmount} ${recurringType}`;
      const paystackResult = await createPaystackPlan(
        planName,
        recurringType,
        recurringAmount * 100 // Paystack amount is in kobo
      );

      if (!paystackResult.success || !paystackResult.planCode) {
        throw new Error(paystackResult.message || 'Failed to set up recurring payment plan with payment provider.');
      }
      
      // Step 2: Record the recurring plan in our database first
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
      
      // Step 3: Initialize the payment with the created plan
      initializePayment({
        amount: recurringAmount * 100, // Convert to kobo
        email: user.email,
        currency: "NGN",
        ref: newPayment.reference,
        plan: paystackResult.planCode,
        metadata: {
          internal_payment_id: newPayment.id,
          is_recurring: "true",
        },
        onSuccess: async (response: PaystackResponse) => {
          console.log('Paystack subscription setup success:', response);
          if (newPaymentId) {
            await updatePaymentStatus(newPaymentId, 'active', true);
          }
          setIsOpen(false);
          toast.success(`Recurring payment plan activated!`, {
            description: "Your payment schedule is now set up.",
          });
        },
        onCancel: () => {
          toast.error('Payment was cancelled');
          if (newPaymentId) {
            updatePaymentStatus(newPaymentId, 'failed', true);
          }
        }
      });

    } catch (error) {
      console.error("Error setting up recurring payment:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to set up recurring payment');

      // Rollback: if payment was created in our DB but Paystack failed, mark it as failed
      if (newPaymentId) {
        await updatePaymentStatus(newPaymentId, 'failed', true);
        toast.info("Recurring payment setup has been rolled back due to an error.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    handleSetupRecurringPayment
  };
};
