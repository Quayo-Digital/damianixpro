/**
 * Flutterwave Payment Provider
 * Uses Supabase Edge Functions for initialize, verify, and refund.
 * Secret key is stored server-side only.
 */

import {
  IPaymentProvider,
  UnifiedPaymentRequest,
  UnifiedPaymentResponse,
  PaymentVerificationResponse,
  RefundRequest,
  RefundResponse,
  PaymentProvider,
  PaymentStatus,
} from '../types';
import { logger } from '@/utils/logger';
import { flutterwaveInitialize, flutterwaveVerify, flutterwaveRefund } from '../edgeFunctionApi';

export class FlutterwaveProvider implements IPaymentProvider {
  private publicKey: string;
  private baseUrl: string;

  constructor() {
    this.publicKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || '';
    this.baseUrl = import.meta.env.VITE_FLUTTERWAVE_BASE_URL || 'https://api.flutterwave.com/v3';

    if (!this.publicKey) {
      logger.warn('Flutterwave public key not configured');
    }
  }

  getName(): PaymentProvider {
    return 'flutterwave';
  }

  isAvailable(): boolean {
    return !!this.publicKey;
  }

  /**
   * Generate unique reference
   */
  private generateReference(prefix: string = 'FLW'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Initialize payment via Edge Function
   */
  async initializePayment(request: UnifiedPaymentRequest): Promise<UnifiedPaymentResponse> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'Flutterwave is not configured. Please set VITE_FLUTTERWAVE_PUBLIC_KEY.',
        provider: 'flutterwave',
      };
    }

    try {
      const txRef =
        request.options?.reference ||
        this.generateReference(request.context === 'shortlet' ? 'BOOK' : 'PAY');

      const result = await flutterwaveInitialize({
        email: request.customer.email,
        amount: request.amount,
        tx_ref: txRef,
        redirect_url:
          request.callback_url ||
          `${typeof window !== 'undefined' ? window.location.origin : ''}/payment/callback`,
        currency: request.currency || 'NGN',
        customer_name: request.customer.name,
        customer_phone: request.customer.phone,
        meta: {
          ...request.metadata,
          context: request.context,
          description: request.description,
        },
      });

      if (result.status === 'success' && result.data) {
        return {
          success: true,
          payment_id: result.data.tx_ref,
          reference: result.data.tx_ref,
          authorization_url: result.data.link,
          provider: 'flutterwave',
          metadata: {
            flw_ref: result.data.flw_ref,
          },
        };
      } else {
        logger.error('Flutterwave initialization failed', undefined, {
          response: result,
          request: { amount: request.amount, email: request.customer.email },
        });
        return {
          success: false,
          error: result.message || 'Payment initialization failed',
          provider: 'flutterwave',
        };
      }
    } catch (error) {
      logger.error('Flutterwave initialization error', error, {
        amount: request.amount,
        email: request.customer.email,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
        provider: 'flutterwave',
      };
    }
  }

  /**
   * Verify payment via Edge Function
   */
  async verifyPayment(reference: string): Promise<PaymentVerificationResponse> {
    if (!this.isAvailable()) {
      return {
        success: false,
        status: 'failed',
        amount: 0,
        reference,
        provider: 'flutterwave',
        error: 'Flutterwave is not configured',
      };
    }

    try {
      const result = await flutterwaveVerify(reference);

      if (result.status === 'success' && result.data) {
        const transaction = result.data;
        let status: PaymentStatus = 'pending';

        if (transaction.status === 'successful') {
          status = 'completed';
        } else if (transaction.status === 'failed') {
          status = 'failed';
        }

        return {
          success: transaction.status === 'successful',
          status,
          amount: transaction.amount,
          reference: transaction.tx_ref,
          provider: 'flutterwave',
          customer: {
            email: transaction.customer?.email || '',
            name: transaction.customer?.name,
          },
          metadata: transaction.meta || {},
          paid_at: transaction.created_at,
          fees: transaction.app_fee,
          gateway_response: transaction.processor_response,
        };
      } else {
        return {
          success: false,
          status: 'failed',
          amount: 0,
          reference,
          provider: 'flutterwave',
          error: result.message || 'Payment verification failed',
        };
      }
    } catch (error) {
      logger.error('Flutterwave verification error', error, { reference });
      return {
        success: false,
        status: 'failed',
        amount: 0,
        reference,
        provider: 'flutterwave',
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  /**
   * Create refund via Edge Function
   */
  async createRefund(request: RefundRequest): Promise<RefundResponse> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'Flutterwave is not configured',
      };
    }

    try {
      const result = await flutterwaveRefund({
        transaction_reference: request.transaction_reference,
        amount: request.amount,
        comments: request.merchant_note || request.customer_note || 'Refund request',
      });

      if (result.status === 'success' && result.data) {
        const data = result.data as { id?: string; tx_ref?: string; amount?: number };
        return {
          success: true,
          refund_id: data.id?.toString(),
          amount: data.amount,
          reference: data.tx_ref,
        };
      } else {
        return {
          success: false,
          error: result.message || 'Refund creation failed',
        };
      }
    } catch (error) {
      logger.error('Flutterwave refund error', error, {
        transaction_reference: request.transaction_reference,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  /**
   * Get public key (for client-side use if needed)
   */
  getPublicKey(): string {
    return this.publicKey;
  }
}
