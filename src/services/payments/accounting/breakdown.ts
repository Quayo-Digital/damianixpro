
import { supabase } from '@/integrations/supabase/client';
import { Payment } from '@/utils/PaymentTypes';
import { PaymentBreakdown } from '@/utils/AccountingTypes';

/**
 * Calculates the payment breakdown for a payment
 */
export const calculatePaymentBreakdown = (payment: Payment): PaymentBreakdown => {
  // Default platform fee rate is 5%
  const platformFeeRate = 0.05;
  // Default agent commission rate is 3%
  const agentCommissionRate = 0.03;
  // Default tax rate is 7.5% (VAT in Nigeria)
  const taxRate = 0.075;

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
    taxRate
  };
};

/**
 * Records a payment breakdown in the database
 */
export const recordPaymentBreakdown = async (breakdown: PaymentBreakdown): Promise<boolean> => {
  try {
    // Insert directly to payment_breakdowns table instead of using RPC
    const { error } = await supabase
      .from('payment_breakdowns')
      .insert({
        payment_id: breakdown.paymentId,
        total_amount: breakdown.totalAmount,
        platform_fee: breakdown.platformFee,
        agent_commission: breakdown.agentCommission,
        owner_amount: breakdown.ownerAmount,
        tax_amount: breakdown.taxAmount,
        tax_rate: breakdown.taxRate,
        paid_to_owner: breakdown.paid_to_owner || false
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
