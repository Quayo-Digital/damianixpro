/**
 * Unified Payment Service
 * Single service for handling all payment operations (regular and shortlet)
 */

import {
  IPaymentProvider,
  UnifiedPaymentRequest,
  UnifiedPaymentResponse,
  PaymentVerificationRequest,
  PaymentVerificationResponse,
  RefundRequest,
  RefundResponse,
  PaymentMethod,
  PaymentProvider,
  PaymentServiceConfig,
} from './types';
import { FlutterwaveProvider } from './providers/FlutterwaveProvider';
import { BankTransferProvider } from './providers/BankTransferProvider';
import { logger } from '@/utils/logger';

export class UnifiedPaymentService {
  private static instance: UnifiedPaymentService;
  private providers: Map<PaymentProvider, IPaymentProvider>;
  private config: PaymentServiceConfig;

  private constructor(config?: PaymentServiceConfig) {
    this.config = {
      defaultMethod: 'flutterwave',
      defaultCurrency: 'NGN',
      callbackBaseUrl: typeof window !== 'undefined' ? window.location.origin : '',
      ...config,
    };

    // Initialize payment providers
    this.providers = new Map();
    this.providers.set('flutterwave', new FlutterwaveProvider());
    this.providers.set('bank_transfer', new BankTransferProvider());
    // USSD provider can be added later if needed
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: PaymentServiceConfig): UnifiedPaymentService {
    if (!UnifiedPaymentService.instance) {
      UnifiedPaymentService.instance = new UnifiedPaymentService(config);
    }
    return UnifiedPaymentService.instance;
  }

  /**
   * Get payment provider
   */
  private getProvider(method: PaymentMethod): IPaymentProvider | null {
    // Map payment methods to providers
    let provider: PaymentProvider;

    if (method === 'flutterwave' || method === 'card') {
      provider = 'flutterwave';
    } else if (method === 'bank_transfer') {
      provider = 'bank_transfer';
    } else {
      logger.warn('Unsupported payment method', { method });
      return null;
    }

    const paymentProvider = this.providers.get(provider);
    if (!paymentProvider || !paymentProvider.isAvailable()) {
      logger.warn('Payment provider not available', { provider, method });
      return null;
    }

    return paymentProvider;
  }

  /**
   * Initialize payment
   */
  async initializePayment(request: UnifiedPaymentRequest): Promise<UnifiedPaymentResponse> {
    try {
      const provider = this.getProvider(request.method);

      if (!provider) {
        return {
          success: false,
          error: `Payment method ${request.method} is not available or not configured`,
        };
      }

      // Set default callback URL if not provided
      if (!request.callback_url && this.config.callbackBaseUrl) {
        request.callback_url = `${this.config.callbackBaseUrl}/payment/callback`;
      }

      // Set default currency
      if (!request.currency) {
        request.currency = this.config.defaultCurrency || 'NGN';
      }

      logger.info('Initializing payment', {
        method: request.method,
        amount: request.amount,
        context: request.context,
        provider: provider.getName(),
      });

      const response = await provider.initializePayment(request);

      if (response.success) {
        logger.info('Payment initialized successfully', {
          reference: response.reference,
          provider: response.provider,
        });
      } else {
        logger.error('Payment initialization failed', undefined, {
          error: response.error,
          provider: response.provider,
        });
      }

      return response;
    } catch (error) {
      logger.error('Payment initialization error', error, {
        method: request.method,
        amount: request.amount,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment initialization failed',
      };
    }
  }

  /**
   * Verify payment
   */
  async verifyPayment(request: PaymentVerificationRequest): Promise<PaymentVerificationResponse> {
    try {
      let provider: IPaymentProvider | null = null;

      // If provider is specified, use it
      if (request.provider) {
        provider = this.providers.get(request.provider) || null;
      } else {
        // Try to auto-detect provider by reference prefix
        if (
          request.reference.startsWith('FLW_') ||
          request.reference.startsWith('PAY_') ||
          request.reference.startsWith('BOOK_')
        ) {
          provider = this.providers.get('flutterwave');
        } else if (request.reference.startsWith('BANK_')) {
          provider = this.providers.get('bank_transfer');
        } else {
          // Try Flutterwave
          const tryOrder: PaymentProvider[] = ['flutterwave'];
          for (const providerKey of tryOrder) {
            const p = this.providers.get(providerKey);
            if (p?.isAvailable()) {
              const result = await p.verifyPayment(request.reference);
              if (result.success || result.error !== 'Payment verification failed') {
                return result;
              }
            }
          }
          return {
            success: false,
            status: 'failed',
            amount: 0,
            reference: request.reference,
            provider: 'flutterwave',
            error: 'Could not verify payment with any provider',
          };
        }
      }

      if (!provider || !provider.isAvailable()) {
        return {
          success: false,
          status: 'failed',
          amount: 0,
          reference: request.reference,
          provider: request.provider || 'flutterwave',
          error: 'Payment provider not available',
        };
      }

      logger.info('Verifying payment', {
        reference: request.reference,
        provider: provider.getName(),
      });

      const response = await provider.verifyPayment(request.reference);

      if (response.success) {
        logger.info('Payment verified successfully', {
          reference: response.reference,
          status: response.status,
        });
      }

      return response;
    } catch (error) {
      logger.error('Payment verification error', error, {
        reference: request.reference,
      });
      return {
        success: false,
        status: 'failed',
        amount: 0,
        reference: request.reference,
        provider: request.provider || 'flutterwave',
        error: error instanceof Error ? error.message : 'Payment verification failed',
      };
    }
  }

  /**
   * Create refund
   */
  async createRefund(request: RefundRequest): Promise<RefundResponse> {
    try {
      let provider: IPaymentProvider | null = null;

      if (request.provider) {
        provider = this.providers.get(request.provider) || null;
      } else {
        // Auto-detect provider
        if (
          request.transaction_reference.startsWith('PAY_') ||
          request.transaction_reference.startsWith('BOOK_') ||
          request.transaction_reference.startsWith('FLW_')
        ) {
          provider = this.providers.get('flutterwave');
        } else {
          provider = this.providers.get('flutterwave'); // Default
        }
      }

      if (!provider || !provider.isAvailable()) {
        return {
          success: false,
          error: 'Payment provider not available for refund',
        };
      }

      logger.info('Creating refund', {
        transaction_reference: request.transaction_reference,
        provider: provider.getName(),
        amount: request.amount,
      });

      const response = await provider.createRefund(request);

      if (response.success) {
        logger.info('Refund created successfully', {
          refund_id: response.refund_id,
          amount: response.amount,
        });
      }

      return response;
    } catch (error) {
      logger.error('Refund creation error', error, {
        transaction_reference: request.transaction_reference,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Refund creation failed',
      };
    }
  }

  /**
   * Get available payment methods
   */
  getAvailableMethods(): PaymentMethod[] {
    const methods: PaymentMethod[] = [];

    // Flutterwave is the primary card payment provider
    if (this.providers.get('flutterwave')?.isAvailable()) {
      methods.push('flutterwave', 'card');
    }
    if (this.providers.get('bank_transfer')?.isAvailable()) {
      methods.push('bank_transfer');
    }

    return methods;
  }

  /**
   * Check if a payment method is available
   */
  isMethodAvailable(method: PaymentMethod): boolean {
    return this.getAvailableMethods().includes(method);
  }

  /**
   * Get provider by method
   */
  getProviderByMethod(method: PaymentMethod): IPaymentProvider | null {
    return this.getProvider(method);
  }
}

// Export singleton instance getter
export const getUnifiedPaymentService = (config?: PaymentServiceConfig) => {
  return UnifiedPaymentService.getInstance(config);
};
