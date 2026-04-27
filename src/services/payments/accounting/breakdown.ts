import { supabase } from '@/integrations/supabase/client';
import { Payment } from '@/utils/PaymentTypes';
import { PaymentBreakdown } from '@/utils/AccountingTypes';
import { getAccountingRates, type AccountingRates } from './config';

/**
 * Calculates the payment breakdown for a payment
 * Uses configurable rates from accounting_config when not provided
 */
export const calculatePaymentBreakdown = (
  payment: Payment,
  rates?: Partial<AccountingRates>
): PaymentBreakdown => {
  const platformFeeRate = rates?.platformFeeRate ?? 0.05;
  const agentCommissionRate = rates?.agentCommissionRate ?? 0.03;
  const taxRate = rates?.taxRate ?? 0.075;

  const platformFee = payment.amount * platformFeeRate;
  const agentCommission = payment.amount * agentCommissionRate;
  const taxAmount = payment.amount * taxRate;
  const ownerAmount = payment.amount - (platformFee + agentCommission + taxAmount);

  return {
    paymentId: payment.id,
    totalAmount: payment.amount,
    platformFee,
    agentCommission,
    ownerAmount,
    taxAmount,
    taxRate,
  };
};

/**
 * Calculates payment breakdown using rates from accounting_config
 */
export const calculatePaymentBreakdownWithConfig = async (
  payment: Payment,
  agentCommissionRateOverride?: number
): Promise<PaymentBreakdown> => {
  const rates = await getAccountingRates();
  return calculatePaymentBreakdown(payment, {
    ...rates,
    agentCommissionRate: agentCommissionRateOverride ?? rates.agentCommissionRate,
  });
};

/**
 * Records a payment breakdown in the database
 */
export const recordPaymentBreakdown = async (breakdown: PaymentBreakdown): Promise<boolean> => {
  try {
    // Insert directly to payment_breakdowns table instead of using RPC
    const { error } = await supabase.from('payment_breakdowns').insert({
      payment_id: breakdown.paymentId,
      total_amount: breakdown.totalAmount,
      platform_fee: breakdown.platformFee,
      agent_commission: breakdown.agentCommission,
      owner_amount: breakdown.ownerAmount,
      tax_amount: breakdown.taxAmount,
      tax_rate: breakdown.taxRate,
      paid_to_owner: breakdown.paid_to_owner || false,
    });

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error recording payment breakdown:', error);
    return false;
  }
};
