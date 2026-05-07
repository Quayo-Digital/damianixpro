import { supabase } from '@/integrations/supabase/client';
import { AccountingSummary } from '@/utils/AccountingTypes';
import { toPgDateOnly } from '@/utils/toPgDateOnly';

/**
 * Gets accounting summary for the specified date range
 */
export const getAccountingSummary = async (
  startDate?: string,
  endDate?: string
): Promise<AccountingSummary> => {
  try {
    let query = supabase.from('payment_breakdowns').select('*, rent_payments!inner(payment_date)');

    if (startDate) {
      query = query.gte('rent_payments.payment_date', toPgDateOnly(startDate));
    }

    if (endDate) {
      query = query.lte('rent_payments.payment_date', toPgDateOnly(endDate));
    }

    const { data: breakdowns, error } = await query;

    if (error) throw error;

    if (!breakdowns || breakdowns.length === 0) {
      return {
        totalRevenue: 0,
        platformFees: 0,
        agentCommissions: 0,
        ownerPayouts: 0,
        taxes: 0,
        pendingPayouts: 0,
      };
    }

    const summary: AccountingSummary = breakdowns.reduce(
      (acc, breakdown) => {
        acc.totalRevenue += breakdown.total_amount;
        acc.platformFees += breakdown.platform_fee;
        acc.agentCommissions += breakdown.agent_commission;
        acc.taxes += breakdown.tax_amount;
        if (breakdown.paid_to_owner) {
          acc.ownerPayouts += breakdown.owner_amount;
        } else {
          acc.pendingPayouts += breakdown.owner_amount;
        }
        return acc;
      },
      {
        totalRevenue: 0,
        platformFees: 0,
        agentCommissions: 0,
        ownerPayouts: 0,
        taxes: 0,
        pendingPayouts: 0,
      }
    );

    return summary;
  } catch (error) {
    console.error('Error getting accounting summary:', error);
    return {
      totalRevenue: 0,
      platformFees: 0,
      agentCommissions: 0,
      ownerPayouts: 0,
      taxes: 0,
      pendingPayouts: 0,
    };
  }
};
