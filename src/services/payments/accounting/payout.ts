import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

/**
 * Processes an owner payout
 */
export const processOwnerPayout = async (
  ownerId: string,
  amount: number,
  paymentIds: string[]
): Promise<boolean> => {
  try {
    // 1. Record the payout in owner_payouts table
    const { error: payoutError } = await supabase.from('owner_payouts').insert({
      owner_id: ownerId,
      amount,
      payment_ids: paymentIds,
      status: 'processed',
      payout_date: new Date().toISOString(),
    });

    if (payoutError) throw payoutError;

    // 2. Update the payment_breakdowns to mark them as paid
    const { data, error: updateError } = await supabase
      .from('payment_breakdowns')
      .update({ paid_to_owner: true })
      .in('payment_id', paymentIds)
      .select();

    if (updateError) throw updateError;

    toast.success(`Owner payout of ₦${amount.toLocaleString()} processed`);
    return true;
  } catch (error) {
    console.error('Error processing owner payout:', error);
    toast.error('Failed to process owner payout');
    return false;
  }
};
