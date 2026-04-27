import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import {
  clearPropertyTenantsRelationMissingCache,
  isMissingSupabaseRelationError,
  isPropertyTenantsRelationMissing,
  markPropertyTenantsRelationMissing,
} from '@/utils/supabaseErrors';
import { flutterwaveInitialize, flutterwaveVerify } from '@/services/payments/edgeFunctionApi';
import {
  mapRentRowToPaymentUi,
  verificationStatusToRentStatus,
  type RentPaymentRow,
} from '@/services/payments/rentPaymentCompat';

// Payment interfaces
export interface PaymentRequest {
  tenant_id: string;
  /** Legacy alias: callers pass `property_tenants.id` here (active tenancy row). */
  lease_id: string;
  /** Optional explicit `property_tenants.id`; when set, overrides `lease_id` for inserts. */
  property_tenant_id?: string;
  amount: number;
  payment_type: 'rent' | 'deposit' | 'late_fee' | 'utility' | 'maintenance' | 'other';
  payment_method: 'bank_transfer' | 'card' | 'mobile_money' | 'ussd';
  description: string;
  due_date: string;
  /** When true, successful Flutterwave card charges may store a recurring mandate (webhook). */
  recurring_opt_in?: boolean;
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

function propertyTenantIdFromRequest(paymentRequest: PaymentRequest): string {
  return paymentRequest.property_tenant_id ?? paymentRequest.lease_id;
}

function dueDateOnly(isoOrDate: string): string {
  if (!isoOrDate) return new Date().toISOString().split('T')[0];
  return isoOrDate.includes('T') ? isoOrDate.split('T')[0] : isoOrDate;
}

// Payment Service Class
export class PaymentService {
  private static instance: PaymentService;

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  // Initialize payment with Flutterwave (via Edge Function - secret key server-side only)
  async initializeFlutterwavePayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    const ptId = propertyTenantIdFromRequest(paymentRequest);
    const txRef = this.generateReference();
    const paymentId = crypto.randomUUID();

    try {
      await this.insertPendingRentPayment({
        id: paymentId,
        property_tenant_id: ptId,
        amount: paymentRequest.amount,
        reference: txRef,
        payment_type: paymentRequest.payment_type,
        payment_method: 'card',
        description: paymentRequest.description,
        due_date: dueDateOnly(paymentRequest.due_date),
      });

      const { data: ptMeta } = await supabase
        .from('property_tenants')
        .select('property_id')
        .eq('id', ptId)
        .maybeSingle();

      const result = await flutterwaveInitialize({
        email: 'tenant@example.com',
        amount: paymentRequest.amount,
        tx_ref: txRef,
        redirect_url: `${window.location.origin}/payment/callback`,
        meta: {
          tenant_id: paymentRequest.tenant_id,
          lease_id: ptId,
          property_id: ptMeta?.property_id,
          payment_type: paymentRequest.payment_type,
          description: paymentRequest.description,
          internal_payment_id: paymentId,
          recurring_opt_in: paymentRequest.recurring_opt_in === true,
        },
      });

      if (result.status === 'success' && result.data) {
        return {
          success: true,
          payment_id: paymentId,
          reference_number: result.data.tx_ref,
          authorization_url: result.data.link,
        };
      }

      await supabase.from('rent_payments').update({ status: 'failed' }).eq('id', paymentId);
      return {
        success: false,
        error: result.message || 'Payment initialization failed',
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Flutterwave initialization error', error, {
        tenant_id: paymentRequest.tenant_id,
        amount: paymentRequest.amount,
      });
      await supabase.from('rent_payments').update({ status: 'failed' }).eq('id', paymentId);

      const isEdgeFunctionError = errMsg.includes('Edge Function') || errMsg.includes('non-2xx');
      return {
        success: false,
        error: isEdgeFunctionError
          ? 'Payment gateway not configured. Ask the admin to set the FLUTTERWAVE_SECRET_KEY in Supabase Edge Function secrets.'
          : 'Network error occurred',
      };
    }
  }

  // Bank Transfer Payment (Generate Account Details)
  async initializeBankTransferPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      const reference = this.generateReference();
      const ptId = propertyTenantIdFromRequest(paymentRequest);

      await this.insertPendingRentPayment({
        id: crypto.randomUUID(),
        property_tenant_id: ptId,
        amount: paymentRequest.amount,
        reference,
        payment_type: paymentRequest.payment_type,
        payment_method: 'bank_transfer',
        description: paymentRequest.description,
        due_date: dueDateOnly(paymentRequest.due_date),
      });

      return {
        success: true,
        payment_id: reference,
        reference_number: reference,
        message: 'Bank transfer details generated. Please make payment to the provided account.',
      };
    } catch (error) {
      logger.error('Bank transfer initialization error', error, {
        tenant_id: paymentRequest.tenant_id,
        amount: paymentRequest.amount,
      });
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
      const ptId = propertyTenantIdFromRequest(paymentRequest);

      await this.insertPendingRentPayment({
        id: crypto.randomUUID(),
        property_tenant_id: ptId,
        amount: paymentRequest.amount,
        reference,
        payment_type: paymentRequest.payment_type,
        payment_method: 'mobile_money',
        description: paymentRequest.description,
        due_date: dueDateOnly(paymentRequest.due_date),
      });

      this.generateUSSDCodes(paymentRequest.amount, reference);

      return {
        success: true,
        payment_id: reference,
        reference_number: reference,
        message: `USSD payment initiated. Use any of the provided USSD codes to complete payment.`,
      };
    } catch (error) {
      logger.error('USSD initialization error:', error);
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
          // Legacy 'paystack' or unknown - try Flutterwave
          verificationData = await this.verifyFlutterwavePayment(reference);
          break;
      }

      await this.updatePaymentRecord(reference, verificationData);

      return verificationData;
    } catch (error) {
      logger.error('Payment verification error:', error);
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

  private async insertPendingRentPayment(params: {
    id: string;
    property_tenant_id: string;
    amount: number;
    reference: string;
    payment_type: string;
    payment_method: string;
    description: string;
    due_date: string;
  }): Promise<void> {
    const now = new Date().toISOString();
    const { error } = await supabase.from('rent_payments').insert({
      id: params.id,
      property_tenant_id: params.property_tenant_id,
      amount: params.amount,
      reference: params.reference,
      status: 'pending',
      category: params.payment_type,
      description: params.description,
      due_date: params.due_date,
      payment_method: params.payment_method,
      payment_date: null,
      is_recurring: false,
      created_at: now,
      updated_at: now,
    });

    if (error) {
      logger.error('Error saving rent payment record:', error);
      throw error;
    }
  }

  private async updatePaymentRecord(
    reference: string,
    verificationData: PaymentVerification
  ): Promise<void> {
    try {
      const nextStatus = verificationStatusToRentStatus(verificationData.status);
      const patch: Record<string, unknown> = {
        status: nextStatus,
        updated_at: new Date().toISOString(),
      };

      if (verificationData.status === 'completed' && verificationData.paid_at) {
        patch.payment_date = verificationData.paid_at;
      }

      const { error } = await supabase
        .from('rent_payments')
        .update(patch)
        .eq('reference', reference);

      if (error) {
        logger.error('Error updating rent payment record:', error);
        throw error;
      }
    } catch (error) {
      logger.error('Database update error:', error);
      throw error;
    }
  }

  private async verifyFlutterwavePayment(reference: string): Promise<PaymentVerification> {
    try {
      const result = await flutterwaveVerify(reference);

      if (result.status === 'success' && result.data) {
        const data = result.data;
        return {
          success: true,
          status: data.status === 'successful' ? 'completed' : 'failed',
          amount: data.amount,
          reference: data.tx_ref,
          gateway_response: data.processor_response,
          paid_at: data.created_at,
          fees: data.app_fee,
        };
      } else {
        return {
          success: false,
          status: 'failed',
          amount: 0,
          reference,
          gateway_response: result.message || 'Verification failed',
        };
      }
    } catch (error) {
      logger.error('Flutterwave verification error', error);
      throw error;
    }
  }

  private async verifyBankTransferPayment(reference: string): Promise<PaymentVerification> {
    return {
      success: true,
      status: 'pending',
      amount: 0,
      reference,
      gateway_response: 'Awaiting bank confirmation',
    };
  }

  private async verifyUSSDPayment(reference: string): Promise<PaymentVerification> {
    return {
      success: true,
      status: 'pending',
      amount: 0,
      reference,
      gateway_response: 'Awaiting USSD confirmation',
    };
  }

  private generateUSSDCodes(amount: number, reference: string): { [bank: string]: string } {
    return {
      GTBank: `*737*1*${amount}*${reference}#`,
      'Access Bank': `*901*0*${amount}*${reference}#`,
      'First Bank': `*894*0*${amount}*${reference}#`,
      UBA: `*919*0*${amount}*${reference}#`,
      'Zenith Bank': `*966*0*${amount}*${reference}#`,
      'Fidelity Bank': `*770*0*${amount}*${reference}#`,
    };
  }

  private async propertyTenantIdsForTenant(tenantId: string): Promise<string[]> {
    if (isPropertyTenantsRelationMissing()) {
      return [];
    }
    const { data, error } = await supabase
      .from('property_tenants')
      .select('id')
      .eq('tenant_id', tenantId);
    if (error) {
      if (isMissingSupabaseRelationError(error)) {
        markPropertyTenantsRelationMissing();
        if (import.meta.env.DEV) {
          logger.debug('property_tenants not available; empty payment scope', { tenantId });
        }
      } else {
        logger.error('Error resolving property_tenants for tenant', error);
      }
      return [];
    }
    clearPropertyTenantsRelationMissingCache();
    return (data ?? []).map((r) => r.id);
  }

  // Get payment history for a tenant (unified rent_payments ledger)
  async getPaymentHistory(tenantId: string): Promise<any[]> {
    try {
      const ptIds = await this.propertyTenantIdsForTenant(tenantId);
      if (ptIds.length === 0) return [];

      const { data, error } = await supabase
        .from('rent_payments')
        .select('*')
        .in('property_tenant_id', ptIds)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching payment history:', error);
        return [];
      }

      return (
        (data as RentPaymentRow[] | null)?.map((row) => mapRentRowToPaymentUi(row, tenantId)) ?? []
      );
    } catch (error) {
      logger.error('Payment history error:', error);
      return [];
    }
  }

  // Get pending payments for a tenant
  async getPendingPayments(tenantId: string): Promise<any[]> {
    try {
      const ptIds = await this.propertyTenantIdsForTenant(tenantId);
      if (ptIds.length === 0) return [];

      const { data, error } = await supabase
        .from('rent_payments')
        .select('*')
        .in('property_tenant_id', ptIds)
        .in('status', ['pending', 'active'])
        .order('due_date', { ascending: true });

      if (error) {
        logger.error('Error fetching pending payments:', error);
        return [];
      }

      return (
        (data as RentPaymentRow[] | null)?.map((row) => mapRentRowToPaymentUi(row, tenantId)) ?? []
      );
    } catch (error) {
      logger.error('Pending payments error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const paymentService = PaymentService.getInstance();
