import { useState } from 'react';
import { initializePayment } from '@/utils/FlutterwaveUtils';
import { Payment, PaymentCategory } from '@/utils/PaymentTypes';
import { toast } from '@/components/ui/sonner';
import { fetchTenantIdFromUser, validatePayment } from '../utils/paymentUtils';
import { useAuthSession } from '@/contexts/auth';
import { recordPayment } from '@/services/payments';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import {
  isMissingSupabaseRelationError,
  isPropertyTenantsRelationMissing,
  markPropertyTenantsRelationMissing,
} from '@/utils/supabaseErrors';

interface UsePaymentHandlerProps {
  tenantId?: string;
  onPaymentSuccess: (payment: Payment) => void;
  setIsOpen: (isOpen: boolean) => void;
}

export const usePaymentHandler = ({
  tenantId: initialTenantId,
  onPaymentSuccess,
  setIsOpen,
}: UsePaymentHandlerProps) => {
  const { user } = useAuthSession();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleOneTimePayment = async (
    amount: number,
    category: PaymentCategory,
    description: string
  ) => {
    setIsProcessing(true);

    try {
      let effectiveTenantId = initialTenantId;
      if (!effectiveTenantId && user) {
        effectiveTenantId = await fetchTenantIdFromUser(user.id);
      }

      const validation = validatePayment(amount, effectiveTenantId);
      if (!validation.valid) {
        throw new Error(validation.message);
      }

      if (isPropertyTenantsRelationMissing()) {
        toast.error('Payments unavailable', {
          description:
            'The tenancy table is not available on this project yet. Apply database migrations or contact support.',
          duration: 8000,
        });
        throw new Error('property_tenants table not available');
      }

      // Find the active tenancy to link the payment
      const { data: propertyTenant, error: ptError } = await supabase
        .from('property_tenants')
        .select('id, property_id')
        .eq('tenant_id', effectiveTenantId)
        .maybeSingle();

      if (ptError) {
        if (isMissingSupabaseRelationError(ptError)) {
          markPropertyTenantsRelationMissing();
          toast.error('Payments unavailable', {
            description:
              'The tenancy table is not available on this project yet. Apply database migrations or contact support.',
            duration: 8000,
          });
          throw new Error('property_tenants table not available');
        }
        throw ptError;
      }

      if (!propertyTenant) {
        toast.error('No active tenancy found.', {
          description: 'Please contact your property manager.',
        });
        throw new Error('No active tenancy found for this user.');
      }

      const reference = uuidv4();

      const pendingPayment: Omit<Payment, 'id'> = {
        date: new Date().toISOString().split('T')[0],
        amount,
        status: 'pending',
        reference,
        property_tenant_id: propertyTenant.id,
        category,
        description,
      };

      const recordedPayment = await recordPayment(pendingPayment);
      if (!recordedPayment) {
        throw new Error('Could not initiate payment record.');
      }

      onPaymentSuccess(recordedPayment);

      initializePayment({
        amount,
        email: user?.email || 'tenant@example.com',
        currency: 'NGN',
        ref: reference,
        metadata: {
          tenantId: effectiveTenantId,
          propertyId: propertyTenant.property_id,
          category,
          description,
          internal_payment_id: recordedPayment.id,
        },
        onSuccess: (response) => {
          setIsProcessing(false);
          setIsOpen(false);
          toast.success('Payment submitted!', {
            description: "We are confirming your payment. You will be notified once it's complete.",
          });
        },
        onCancel: () => {
          setIsProcessing(false);
          toast.error('Payment was cancelled');
        },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : '';
      if (msg === 'property_tenants table not available') {
        setIsProcessing(false);
        return;
      }
      console.error('Payment error:', error);
      setIsProcessing(false);
      toast.error(error instanceof Error ? error.message : 'Failed to process payment');
    }
  };

  const handleViewReceipt = (payment: Payment) => {
    const receiptUrl = `/receipt/${payment.id}`;
    window.open(receiptUrl, '_blank');
  };

  return {
    isProcessing,
    handleOneTimePayment,
    handleViewReceipt,
  };
};
