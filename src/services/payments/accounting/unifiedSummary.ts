/**
 * Unified accounting summary across long-term rent and shortlet
 */

import { supabase } from '@/integrations/supabase/client';
import { getAccountingSummary } from './summary';
import type { AccountingSummary } from '@/utils/AccountingTypes';

export interface UnifiedAccountingSummary {
  rent: AccountingSummary;
  shortlet: {
    totalRevenue: number;
    platformFees: number;
    ownerPayouts: number;
    pendingPayouts: number;
  };
  combined: {
    totalRevenue: number;
    platformFees: number;
    agentCommissions: number;
    ownerPayouts: number;
    taxes: number;
    pendingPayouts: number;
  };
  periodStart?: string;
  periodEnd?: string;
}

export async function getUnifiedAccountingSummary(
  startDate?: string,
  endDate?: string
): Promise<UnifiedAccountingSummary> {
  const rent = await getAccountingSummary(startDate, endDate);

  let shortletQuery = supabase
    .from('transactions')
    .select('amount, type, created_at')
    .eq('status', 'success');

  if (startDate) {
    shortletQuery = shortletQuery.gte('created_at', `${startDate}T00:00:00`);
  }
  if (endDate) {
    shortletQuery = shortletQuery.lte('created_at', `${endDate}T23:59:59`);
  }

  const { data: shortletTxs } = await shortletQuery;

  const charges =
    shortletTxs
      ?.filter((t) => t.type === 'charge')
      .reduce((s, t) => s + Number(t.amount || 0), 0) ?? 0;
  const commissions =
    shortletTxs
      ?.filter((t) => t.type === 'commission')
      .reduce((s, t) => s + Number(t.amount || 0), 0) ?? 0;
  const payouts =
    shortletTxs
      ?.filter((t) => t.type === 'payout')
      .reduce((s, t) => s + Number(t.amount || 0), 0) ?? 0;

  const shortlet = {
    totalRevenue: charges,
    platformFees: charges - commissions,
    ownerPayouts: payouts,
    pendingPayouts: Math.max(0, commissions - payouts),
  };

  return {
    rent,
    shortlet,
    combined: {
      totalRevenue: rent.totalRevenue + shortlet.totalRevenue,
      platformFees: rent.platformFees + shortlet.platformFees,
      agentCommissions: rent.agentCommissions,
      ownerPayouts: rent.ownerPayouts + shortlet.ownerPayouts,
      taxes: rent.taxes,
      pendingPayouts: rent.pendingPayouts + shortlet.pendingPayouts,
    },
    periodStart: startDate,
    periodEnd: endDate,
  };
}
