import { supabase } from '@/integrations/supabase/client';

// Payment interfaces
export interface PaymentRequest {
  tenant_id: string;
  lease_id: string;
  amount: number;
  payment_type: 'rent' | 'deposit' | 'late_fee' | 'utility' | 'maintenance' | 'other';
  payment_method: 'bank_transfer' | 'card' | 'mobile_money' | 'ussd';
  description: string;
  due_date: string;
}

export interface PaymentResponse {
  success: boolean;
  payment_id?: string;
  reference_number?: string;
  authorization_url?: string;
  access_code?: string;
  error?: string;
  message?: string;
}

export interface PaymentVerification {
  success: boolean;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  reference: string;
  gateway_response?: string;
  paid_at?: string;
  fees?: number;
}

// Nigerian Payment Providers Configuration
const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_your_paystack_public_key';
const FLUTTERWAVE_PUBLIC_KEY = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-your_flutterwave_public_key';

// Payment Service Class
export class PaymentService {
  private static instance: PaymentService;

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  // Initialize payment with Paystack
  async initializePaystackPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'tenant@example.com', // This should come from tenant data
          amount: paymentRequest.amount * 100, // Paystack expects amount in kobo
          reference: this.generateReference(),
          callback_url: `${window.location.origin}/payment/callback`,
          metadata: {
            tenant_id: paymentRequest.tenant_id,
            lease_id: paymentRequest.lease_id,
            payment_type: paymentRequest.payment_type,
            description: paymentRequest.description,
          },
        }),
      });

      const data = await response.json();

      if (data.status) {
        // Save payment record to database
        await this.savePaymentRecord({
          ...paymentRequest,
          reference_number: data.data.reference,
          payment_status: 'pending',
          gateway: 'paystack',
          access_code: data.data.access_code,
        });

        return {
          success: true,
          payment_id: data.data.reference,
          reference_number: data.data.reference,
          authorization_url: data.data.authorization_url,
          access_code: data.data.access_code,
        };
      } else {
        return {
          success: false,
          error: data.message || 'Payment initialization failed',
        };
      }
    } catch (error) {
      console.error('Paystack initialization error:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }

  // Initialize payment with Flutterwave
  async initializeFlutterwavePayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tx_ref: this.generateReference(),
          amount: paymentRequest.amount,
          currency: 'NGN',
          redirect_url: `${window.location.origin}/payment/callback`,
          customer: {
            email: 'tenant@example.com', // This should come from tenant data
            name: 'Tenant Name', // This should come from tenant data
          },
          customizations: {
            title: 'Nigeria Homes - Rent Payment',
            description: paymentRequest.description,
            logo: `${window.location.origin}/logo.png`,
          },
          meta: {
            tenant_id: paymentRequest.tenant_id,
            lease_id: paymentRequest.lease_id,
            payment_type: paymentRequest.payment_type,
          },
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        // Save payment record to database
        await this.savePaymentRecord({
          ...paymentRequest,
          reference_number: data.data.tx_ref,
          payment_status: 'pending',
          gateway: 'flutterwave',
        });

        return {
          success: true,
          payment_id: data.data.tx_ref,
          reference_number: data.data.tx_ref,
          authorization_url: data.data.link,
        };
      } else {
        return {
          success: false,
          error: data.message || 'Payment initialization failed',
        };
      }
    } catch (error) {
      console.error('Flutterwave initialization error:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }

  // Bank Transfer Payment (Generate Account Details)
  async initializeBankTransferPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      const reference = this.generateReference();
      
      // Save payment record to database
      await this.savePaymentRecord({
        ...paymentRequest,
        reference_number: reference,
        payment_status: 'pending',
        gateway: 'bank_transfer',
      });

      // In a real implementation, you would integrate with a bank API
      // to generate dedicated account numbers for each payment
      return {
        success: true,
        payment_id: reference,
        reference_number: reference,
        message: 'Bank transfer details generated. Please make payment to the provided account.',
      };
    } catch (error) {
      console.error('Bank transfer initialization error:', error);
      return {
        success: false,
        error: 'Failed to generate bank transfer details',
      };
    }
  }

  // USSD Payment
  async initializeUSSDPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      const reference = this.generateReference();
      
      // Save payment record to database
      await this.savePaymentRecord({
        ...paymentRequest,
        reference_number: reference,
        payment_status: 'pending',
        gateway: 'ussd',
      });

      // Generate USSD codes for different banks
      const ussdCodes = this.generateUSSDCodes(paymentRequest.amount, reference);

      return {
        success: true,
        payment_id: reference,
        reference_number: reference,
        message: `USSD payment initiated. Use any of the provided USSD codes to complete payment.`,
      };
    } catch (error) {
      console.error('USSD initialization error:', error);
      return {
        success: false,
        error: 'Failed to generate USSD payment codes',
      };
    }
  }

  // Verify payment status
  async verifyPayment(reference: string, gateway: string): Promise<PaymentVerification> {
    try {
      let verificationData;

      switch (gateway) {
        case 'paystack':
          verificationData = await this.verifyPaystackPayment(reference);
          break;
        case 'flutterwave':
          verificationData = await this.verifyFlutterwavePayment(reference);
          break;
        case 'bank_transfer':
          verificationData = await this.verifyBankTransferPayment(reference);
          break;
        case 'ussd':
          verificationData = await this.verifyUSSDPayment(reference);
          break;
        default:
          throw new Error('Unsupported payment gateway');
      }

      // Update payment record in database
      await this.updatePaymentRecord(reference, verificationData);

      return verificationData;
    } catch (error) {
      console.error('Payment verification error:', error);
      return {
        success: false,
        status: 'failed',
        amount: 0,
        reference,
        gateway_response: 'Verification failed',
      };
    }
  }

  // Private helper methods
  private generateReference(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `NH_${timestamp}_${random}`.toUpperCase();
  }

  private async savePaymentRecord(paymentData: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('tenant_payments')
        .insert({
          tenant_id: paymentData.tenant_id,
          lease_id: paymentData.lease_id,
          amount: paymentData.amount,
          payment_type: paymentData.payment_type,
          payment_method: paymentData.payment_method,
          payment_status: paymentData.payment_status,
          reference_number: paymentData.reference_number,
          description: paymentData.description,
          due_date: paymentData.due_date,
          gateway: paymentData.gateway,
          access_code: paymentData.access_code,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error saving payment record:', error);
        throw error;
      }
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }

  private async updatePaymentRecord(reference: string, verificationData: PaymentVerification): Promise<void> {
    try {
      const { error } = await supabase
        .from('tenant_payments')
        .update({
          payment_status: verificationData.status,
          gateway_response: verificationData.gateway_response,
          paid_at: verificationData.paid_at,
          fees: verificationData.fees,
          updated_at: new Date().toISOString(),
        })
        .eq('reference_number', reference);

      if (error) {
        console.error('Error updating payment record:', error);
        throw error;
      }
    } catch (error) {
      console.error('Database update error:', error);
      throw error;
    }
  }

  private async verifyPaystackPayment(reference: string): Promise<PaymentVerification> {
    try {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_PAYSTACK_SECRET_KEY}`,
        },
      });

      const data = await response.json();

      if (data.status && data.data) {
        return {
          success: true,
          status: data.data.status === 'success' ? 'completed' : 'failed',
          amount: data.data.amount / 100, // Convert from kobo to naira
          reference: data.data.reference,
          gateway_response: data.data.gateway_response,
          paid_at: data.data.paid_at,
          fees: data.data.fees / 100,
        };
      } else {
        return {
          success: false,
          status: 'failed',
          amount: 0,
          reference,
          gateway_response: data.message || 'Verification failed',
        };
      }
    } catch (error) {
      console.error('Paystack verification error:', error);
      throw error;
    }
  }

  private async verifyFlutterwavePayment(reference: string): Promise<PaymentVerification> {
    try {
      const response = await fetch(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${reference}`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_FLUTTERWAVE_SECRET_KEY}`,
        },
      });

      const data = await response.json();

      if (data.status === 'success' && data.data) {
        return {
          success: true,
          status: data.data.status === 'successful' ? 'completed' : 'failed',
          amount: data.data.amount,
          reference: data.data.tx_ref,
          gateway_response: data.data.processor_response,
          paid_at: data.data.created_at,
          fees: data.data.app_fee,
        };
      } else {
        return {
          success: false,
          status: 'failed',
          amount: 0,
          reference,
          gateway_response: data.message || 'Verification failed',
        };
      }
    } catch (error) {
      console.error('Flutterwave verification error:', error);
      throw error;
    }
  }

  private async verifyBankTransferPayment(reference: string): Promise<PaymentVerification> {
    // In a real implementation, this would check with bank APIs
    // For now, we'll simulate manual verification
    return {
      success: true,
      status: 'pending', // Bank transfers require manual verification
      amount: 0,
      reference,
      gateway_response: 'Awaiting bank confirmation',
    };
  }

  private async verifyUSSDPayment(reference: string): Promise<PaymentVerification> {
    // In a real implementation, this would check with bank APIs
    // For now, we'll simulate verification
    return {
      success: true,
      status: 'pending', // USSD payments require verification
      amount: 0,
      reference,
      gateway_response: 'Awaiting USSD confirmation',
    };
  }

  private generateUSSDCodes(amount: number, reference: string): { [bank: string]: string } {
    // Generate USSD codes for major Nigerian banks
    return {
      'GTBank': `*737*1*${amount}*${reference}#`,
      'Access Bank': `*901*0*${amount}*${reference}#`,
      'First Bank': `*894*0*${amount}*${reference}#`,
      'UBA': `*919*0*${amount}*${reference}#`,
      'Zenith Bank': `*966*0*${amount}*${reference}#`,
      'Fidelity Bank': `*770*0*${amount}*${reference}#`,
    };
  }

  // Get payment history for a tenant
  async getPaymentHistory(tenantId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('tenant_payments')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payment history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Payment history error:', error);
      return [];
    }
  }

  // Get pending payments for a tenant
  async getPendingPayments(tenantId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('tenant_payments')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('payment_status', 'pending')
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Error fetching pending payments:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Pending payments error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const paymentService = PaymentService.getInstance();
