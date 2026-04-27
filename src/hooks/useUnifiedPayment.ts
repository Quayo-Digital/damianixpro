/**
 * Unified Payment Hook
 * React hook for using the unified payment service
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  getUnifiedPaymentService,
  UnifiedPaymentRequest,
  PaymentVerificationRequest,
  RefundRequest,
  PaymentMethod,
} from '@/services/payments';
import { logger } from '@/utils/logger';

export interface UseUnifiedPaymentReturn {
  initializePayment: (request: UnifiedPaymentRequest) => Promise<void>;
  verifyPayment: (request: PaymentVerificationRequest) => Promise<void>;
  createRefund: (request: RefundRequest) => Promise<void>;
  isLoading: boolean;
  availableMethods: PaymentMethod[];
  isMethodAvailable: (method: PaymentMethod) => boolean;
}

export function useUnifiedPayment() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const paymentService = getUnifiedPaymentService();

  const initializePayment = useCallback(
    async (request: UnifiedPaymentRequest) => {
      setIsLoading(true);
      try {
        const response = await paymentService.initializePayment(request);

        if (response.success && response.authorization_url) {
          // Redirect to payment gateway
          window.location.href = response.authorization_url;
        } else if (response.success) {
          // Bank transfer or other methods that don't redirect
          toast({
            title: 'Payment Initiated',
            description: response.message || 'Please complete the payment process',
          });
        } else {
          throw new Error(response.error || 'Payment initialization failed');
        }
      } catch (error) {
        logger.error('Payment initialization error', error);
        toast({
          title: 'Payment Failed',
          description: error instanceof Error ? error.message : 'Failed to initialize payment',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [paymentService, toast]
  );

  const verifyPayment = useCallback(
    async (request: PaymentVerificationRequest) => {
      setIsLoading(true);
      try {
        const response = await paymentService.verifyPayment(request);

        if (response.success) {
          toast({
            title: 'Payment Verified',
            description: `Payment of ₦${response.amount.toLocaleString()} verified successfully`,
          });
        } else {
          throw new Error(response.error || 'Payment verification failed');
        }
      } catch (error) {
        logger.error('Payment verification error', error);
        toast({
          title: 'Verification Failed',
          description: error instanceof Error ? error.message : 'Failed to verify payment',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [paymentService, toast]
  );

  const createRefund = useCallback(
    async (request: RefundRequest) => {
      setIsLoading(true);
      try {
        const response = await paymentService.createRefund(request);

        if (response.success) {
          toast({
            title: 'Refund Processed',
            description:
              response.message ||
              `Refund of ₦${response.amount?.toLocaleString()} processed successfully`,
          });
        } else {
          throw new Error(response.error || 'Refund creation failed');
        }
      } catch (error) {
        logger.error('Refund creation error', error);
        toast({
          title: 'Refund Failed',
          description: error instanceof Error ? error.message : 'Failed to create refund',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [paymentService, toast]
  );

  return {
    initializePayment,
    verifyPayment,
    createRefund,
    isLoading,
    availableMethods: paymentService.getAvailableMethods(),
    isMethodAvailable: (method: PaymentMethod) => paymentService.isMethodAvailable(method),
  };
}
