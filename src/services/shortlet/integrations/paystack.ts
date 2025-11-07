/**
 * Paystack Integration Service for Short-Lets
 * Handles payment initialization, verification, refunds, and payouts
 */

import { Transaction, TransactionType, TransactionStatus } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface PaystackConfig {
  secretKey: string;
  publicKey: string;
  baseUrl?: string;
}

export interface InitializePaymentRequest {
  email: string;
  amount: number; // Amount in Naira (will be converted to kobo)
  reference?: string;
  callback_url?: string;
  metadata?: Record<string, any>;
  currency?: string;
}

export interface InitializePaymentResponse {
  success: boolean;
  authorization_url?: string;
  access_code?: string;
  reference?: string;
  message?: string;
  error?: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  status: 'success' | 'failed' | 'pending';
  amount: number;
  reference: string;
  customer?: {
    email: string;
    name?: string;
  };
  metadata?: Record<string, any>;
  message?: string;
  error?: string;
}

export interface RefundRequest {
  transaction_reference: string;
  amount?: number; // Partial refund if specified, full refund if omitted
  currency?: string;
  customer_note?: string;
  merchant_note?: string;
}

export interface RefundResponse {
  success: boolean;
  transaction_id?: string;
  refund_id?: string;
  amount?: number;
  message?: string;
  error?: string;
}

export interface TransferRequest {
  amount: number; // Amount in Naira
  recipient_code: string; // Paystack recipient code
  reason?: string;
  reference?: string;
  currency?: string;
}

export interface TransferResponse {
  success: boolean;
  transfer_code?: string;
  reference?: string;
  amount?: number;
  message?: string;
  error?: string;
}

export interface CreateRecipientRequest {
  type: 'nuban'; // Nigerian bank account
  name: string;
  account_number: string;
  bank_code: string;
  currency?: string;
  description?: string;
}

export interface CreateRecipientResponse {
  success: boolean;
  recipient_code?: string;
  account_number?: string;
  account_name?: string;
  bank_name?: string;
  message?: string;
  error?: string;
}

// ============================================================================
// Paystack Service Class
// ============================================================================

export class PaystackService {
  private config: PaystackConfig;
  private baseUrl: string;

  constructor(config: PaystackConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.paystack.co';
  }

  /**
   * Get authorization header
   */
  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.config.secretKey}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Generate unique reference
   */
  generateReference(prefix: string = 'SL'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Initialize payment transaction
   */
  async initializePayment(request: InitializePaymentRequest): Promise<InitializePaymentResponse> {
    try {
      const reference = request.reference || this.generateReference('BOOK');
      const amountInKobo = Math.round(request.amount * 100); // Convert Naira to kobo

      const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          email: request.email,
          amount: amountInKobo,
          reference,
          callback_url: request.callback_url,
          metadata: request.metadata || {},
          currency: request.currency || 'NGN'
        })
      });

      const data = await response.json();

      if (data.status) {
        return {
          success: true,
          authorization_url: data.data.authorization_url,
          access_code: data.data.access_code,
          reference: data.data.reference
        };
      } else {
        return {
          success: false,
          error: data.message || 'Payment initialization failed'
        };
      }
    } catch (error) {
      console.error('Paystack initialization error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  /**
   * Verify payment transaction
   */
  async verifyPayment(reference: string): Promise<VerifyPaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/transaction/verify/${reference}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (data.status && data.data.status === 'success') {
        return {
          success: true,
          status: 'success',
          amount: data.data.amount / 100, // Convert kobo to Naira
          reference: data.data.reference,
          customer: {
            email: data.data.customer?.email || '',
            name: data.data.customer?.name
          },
          metadata: data.data.metadata || {}
        };
      } else {
        return {
          success: false,
          status: data.data?.status || 'failed',
          amount: data.data?.amount ? data.data.amount / 100 : 0,
          reference: data.data?.reference || reference,
          error: data.message || 'Payment verification failed'
        };
      }
    } catch (error) {
      console.error('Paystack verification error:', error);
      return {
        success: false,
        status: 'failed',
        amount: 0,
        reference,
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  /**
   * Create refund
   */
  async createRefund(request: RefundRequest): Promise<RefundResponse> {
    try {
      const body: any = {
        transaction: request.transaction_reference,
        currency: request.currency || 'NGN'
      };

      if (request.amount) {
        body.amount = Math.round(request.amount * 100); // Convert to kobo
      }

      if (request.customer_note) {
        body.customer_note = request.customer_note;
      }

      if (request.merchant_note) {
        body.merchant_note = request.merchant_note;
      }

      const response = await fetch(`${this.baseUrl}/refund`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.status) {
        return {
          success: true,
          transaction_id: data.data.transaction?.id?.toString(),
          refund_id: data.data.id?.toString(),
          amount: data.data.amount ? data.data.amount / 100 : undefined
        };
      } else {
        return {
          success: false,
          error: data.message || 'Refund creation failed'
        };
      }
    } catch (error) {
      console.error('Paystack refund error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  /**
   * Create transfer recipient (for payouts)
   */
  async createRecipient(request: CreateRecipientRequest): Promise<CreateRecipientResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/transferrecipient`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          type: request.type,
          name: request.name,
          account_number: request.account_number,
          bank_code: request.bank_code,
          currency: request.currency || 'NGN',
          description: request.description
        })
      });

      const data = await response.json();

      if (data.status) {
        return {
          success: true,
          recipient_code: data.data.recipient_code,
          account_number: data.data.details?.account_number,
          account_name: data.data.details?.account_name,
          bank_name: data.data.details?.bank_name
        };
      } else {
        return {
          success: false,
          error: data.message || 'Recipient creation failed'
        };
      }
    } catch (error) {
      console.error('Paystack create recipient error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  /**
   * Initiate transfer (payout to owner)
   */
  async initiateTransfer(request: TransferRequest): Promise<TransferResponse> {
    try {
      const amountInKobo = Math.round(request.amount * 100); // Convert Naira to kobo
      const reference = request.reference || this.generateReference('PAYOUT');

      const response = await fetch(`${this.baseUrl}/transfer`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          source: 'balance', // Transfer from Paystack balance
          amount: amountInKobo,
          recipient: request.recipient_code,
          reason: request.reason || 'Short-let booking payout',
          reference,
          currency: request.currency || 'NGN'
        })
      });

      const data = await response.json();

      if (data.status) {
        return {
          success: true,
          transfer_code: data.data.transfer_code,
          reference: data.data.reference,
          amount: data.data.amount ? data.data.amount / 100 : undefined
        };
      } else {
        return {
          success: false,
          error: data.message || 'Transfer initiation failed'
        };
      }
    } catch (error) {
      console.error('Paystack transfer error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  /**
   * Verify transfer status
   */
  async verifyTransfer(transfer_code: string): Promise<{ success: boolean; status?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/transfer/${transfer_code}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (data.status) {
        return {
          success: true,
          status: data.data.status
        };
      } else {
        return {
          success: false,
          error: data.message || 'Transfer verification failed'
        };
      }
    } catch (error) {
      console.error('Paystack transfer verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  /**
   * List banks (for recipient creation)
   */
  async listBanks(): Promise<{ success: boolean; banks?: any[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/bank?country=nigeria`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (data.status) {
        return {
          success: true,
          banks: data.data
        };
      } else {
        return {
          success: false,
          error: data.message || 'Failed to fetch banks'
        };
      }
    } catch (error) {
      console.error('Paystack list banks error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  /**
   * Resolve bank account (verify account number)
   */
  async resolveAccount(account_number: string, bank_code: string): Promise<{
    success: boolean;
    account_name?: string;
    account_number?: string;
    bank_code?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      const data = await response.json();

      if (data.status) {
        return {
          success: true,
          account_name: data.data.account_name,
          account_number: data.data.account_number,
          bank_code: data.data.bank_code
        };
      } else {
        return {
          success: false,
          error: data.message || 'Account resolution failed'
        };
      }
    } catch (error) {
      console.error('Paystack resolve account error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let paystackInstance: PaystackService | null = null;

/**
 * Get Paystack service instance
 */
export function getPaystackService(): PaystackService {
  if (!paystackInstance) {
    const secretKey = import.meta.env.VITE_PAYSTACK_SECRET_KEY;
    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

    if (!secretKey || !publicKey) {
      throw new Error('Paystack keys not configured. Please set VITE_PAYSTACK_SECRET_KEY and VITE_PAYSTACK_PUBLIC_KEY');
    }

    paystackInstance = new PaystackService({
      secretKey,
      publicKey,
      baseUrl: import.meta.env.VITE_PAYSTACK_BASE_URL || 'https://api.paystack.co'
    });
  }

  return paystackInstance;
}

