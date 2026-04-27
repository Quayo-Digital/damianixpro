/**
 * Accounting config - fetches configurable rates from database
 */

import { supabase } from '@/integrations/supabase/client';

export interface AccountingRates {
  platformFeeRate: number;
  agentCommissionRate: number;
  taxRate: number;
}

const DEFAULT_RATES: AccountingRates = {
  platformFeeRate: 0.05,
  agentCommissionRate: 0.03,
  taxRate: 0.075,
};

let cachedRates: AccountingRates | null = null;

export async function getAccountingRates(): Promise<AccountingRates> {
  if (cachedRates) return cachedRates;

  try {
    const { data, error } = await supabase
      .from('accounting_config')
      .select('key, value')
      .in('key', ['platform_fee_rate', 'default_agent_commission_rate', 'default_tax_rate']);

    if (error) throw error;

    const map: Record<string, number> = {};
    for (const row of data || []) {
      const val = row.value;
      map[row.key] = typeof val === 'number' ? val : Number(val) || 0;
    }

    cachedRates = {
      platformFeeRate: map.platform_fee_rate ?? DEFAULT_RATES.platformFeeRate,
      agentCommissionRate: map.default_agent_commission_rate ?? DEFAULT_RATES.agentCommissionRate,
      taxRate: map.default_tax_rate ?? DEFAULT_RATES.taxRate,
    };
    return cachedRates;
  } catch {
    return DEFAULT_RATES;
  }
}

export function clearAccountingRatesCache(): void {
  cachedRates = null;
}
