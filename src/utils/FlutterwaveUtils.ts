/**
 * Flutterwave payment utilities
 * Primary payment helpers — redirect flow via Edge Function
 */

import { toast } from '@/components/ui/sonner';
import { flutterwaveInitialize } from '@/services/payments/edgeFunctionApi';
import { logger } from '@/utils/logger';

export interface FlutterwaveResponse {
  tx_ref: string;
  status: 'successful' | 'success' | 'failed';
  message?: string;
  transaction?: Record<string, unknown>;
}

export interface InitializePaymentConfig {
  amount: number; // Amount in Naira (Flutterwave expects Naira, not kobo)
  email: string;
  currency?: string;
  ref?: string;
  metadata?: Record<string, string | number | undefined>;
  onSuccess?: (response: FlutterwaveResponse) => void;
  onCancel?: () => void;
}

/**
 * Initialize payment and redirect to Flutterwave checkout.
 * Note: Flutterwave uses redirect flow - user returns to callback_url on success.
 * onSuccess is called before redirect (payment not yet confirmed - webhook confirms).
 */
export const initializePayment = async (
  config: Omit<InitializePaymentConfig, 'onSuccess' | 'onCancel'> & {
    onSuccess?: (response: FlutterwaveResponse) => void;
    onCancel?: () => void;
  }
): Promise<void> => {
  try {
    const publicKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY;
    if (!publicKey) {
      throw new Error('Flutterwave is not configured. Set VITE_FLUTTERWAVE_PUBLIC_KEY in .env');
    }

    const txRef =
      config.ref || `FLW_${Date.now()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const result = await flutterwaveInitialize({
      email: config.email,
      amount: config.amount,
      tx_ref: txRef,
      redirect_url: `${window.location.origin}/payment/callback`,
      currency: config.currency || 'NGN',
      meta: config.metadata || {},
    });

    if (result.status === 'success' && result.data?.link) {
      config.onSuccess?.({ tx_ref: result.data.tx_ref, status: 'success' });
      window.location.href = result.data.link;
    } else {
      throw new Error(result.message || 'Payment initialization failed');
    }
  } catch (error) {
    logger.error('Flutterwave initialization error', error);
    toast.error('Payment gateway initialization failed');
    config.onCancel?.();
  }
};

/**
 * Create recurring payment plan (subscription).
 * Flutterwave subscription API — for now returns a stub where not yet wired.
 * Use one-time payments or integrate Flutterwave subscriptions separately.
 */
export const createPaymentPlan = async (
  _name: string,
  _interval: 'monthly' | 'quarterly' | 'annually',
  _amount: number // amount in Naira
): Promise<{ success: boolean; planCode?: string; message?: string }> => {
  // Flutterwave subscriptions require different API integration
  return {
    success: false,
    message:
      'Recurring plans: Use Flutterwave subscription API or one-time payments. Configure flutterwave-payments Edge Function for subscription support.',
  };
};
