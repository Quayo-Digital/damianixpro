/**
 * React Hook for Short-Let Payment Processing
 * Provides easy-to-use functions for payment operations
 */

import { useState, useCallback } from 'react';
import { useAuthSession } from '@/contexts/auth';
import { useToast } from '@/hooks/use-toast';
import {
  initializeBookingPayment,
  verifyBookingPayment,
  processRefund,
} from '@/services/shortlet/api/transactions';
import { getBookingById } from '@/services/shortlet/api/bookings';

export interface UseShortletPaymentReturn {
  initializePayment: (
    bookingId: string,
    amount: number,
    callbackUrl?: string
  ) => Promise<{
    success: boolean;
    payment_url?: string;
    reference?: string;
    error?: string;
  }>;
  verifyPayment: (reference: string) => Promise<{
    success: boolean;
    booking?: any;
    error?: string;
  }>;
  processRefund: (
    bookingId: string,
    amount?: number,
    reason?: string
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;
  isLoading: boolean;
}

export function useShortletPayment(): UseShortletPaymentReturn {
  const { user } = useAuthSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const initializePayment = useCallback(
    async (bookingId: string, amount: number, callbackUrl?: string) => {
      setIsLoading(true);
      try {
        if (!user?.email) {
          throw new Error('User email is required for payment');
        }

        const result = await initializeBookingPayment(bookingId, user.email, amount, callbackUrl);

        if (result.payment_url) {
          toast({
            title: 'Payment initialized',
            description: 'Redirecting to payment gateway...',
          });
          return {
            success: true,
            payment_url: result.payment_url,
            reference: result.reference,
          };
        } else {
          throw new Error('Failed to initialize payment');
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Payment initialization failed';
        toast({
          title: 'Payment Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [user, toast]
  );

  const verifyPayment = useCallback(
    async (reference: string) => {
      setIsLoading(true);
      try {
        const result = await verifyBookingPayment(reference);

        if (result.success) {
          toast({
            title: 'Payment Verified',
            description: 'Your payment has been confirmed successfully.',
          });

          // Refresh booking data
          if (result.booking) {
            const updatedBooking = await getBookingById(result.booking.id);
            return {
              success: true,
              booking: updatedBooking,
            };
          }

          return {
            success: true,
            booking: result.booking,
          };
        } else {
          toast({
            title: 'Verification Failed',
            description: result.error || 'Could not verify payment',
            variant: 'destructive',
          });
          return {
            success: false,
            error: result.error,
          };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Payment verification failed';
        toast({
          title: 'Verification Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const processRefund = useCallback(
    async (bookingId: string, amount?: number, reason?: string) => {
      setIsLoading(true);
      try {
        const result = await processRefund(bookingId, amount, reason);

        if (result.success) {
          toast({
            title: 'Refund Processed',
            description: 'Refund has been initiated successfully.',
          });
          return {
            success: true,
          };
        } else {
          toast({
            title: 'Refund Failed',
            description: result.error || 'Could not process refund',
            variant: 'destructive',
          });
          return {
            success: false,
            error: result.error,
          };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Refund processing failed';
        toast({
          title: 'Refund Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  return {
    initializePayment,
    verifyPayment,
    processRefund,
    isLoading,
  };
}
