/**
 * Nigerian tax report stub - structure for VAT/FIRS reporting
 * Format can be refined with an accountant for exact FIRS requirements
 */

import { supabase } from '@/integrations/supabase/client';
import { toPgDateOnly } from '@/utils/toPgDateOnly';

export interface TaxReportSection {
  taxableSupply: number;
  outputVat: number;
  items: Array<{
    date: string;
    description: string;
    amount: number;
    vatAmount: number;
  }>;
}

export interface NigerianTaxReport {
  periodStart: string;
  periodEnd: string;
  currency: string;
  vatSummary: TaxReportSection;
  notes: string[];
  generatedAt: string;
}

export async function generateNigerianTaxReport(
  startDate: string,
  endDate: string
): Promise<NigerianTaxReport> {
  const notes: string[] = [];
  const ps = toPgDateOnly(startDate);
  const pe = toPgDateOnly(endDate);

  const { data: paymentsInRange } = await supabase
    .from('rent_payments')
    .select('id, payment_date')
    .eq('status', 'successful')
    .gte('payment_date', ps)
    .lte('payment_date', pe);

  const paymentIds = (paymentsInRange || []).map((p) => p.id);
  const paymentDates = new Map((paymentsInRange || []).map((p) => [p.id, p.payment_date]));

  const items: TaxReportSection['items'] = [];
  let taxableSupply = 0;
  let outputVat = 0;

  if (paymentIds.length > 0) {
    const { data: breakdowns } = await supabase
      .from('payment_breakdowns')
      .select('payment_id, total_amount, tax_amount')
      .in('payment_id', paymentIds);

    for (const b of breakdowns || []) {
      const amount = Number(b.total_amount || 0);
      const vat = Number(b.tax_amount || 0);
      const date = paymentDates.get(b.payment_id) || '';
      items.push({
        date,
        description: 'Rent payment',
        amount,
        vatAmount: vat,
      });
      taxableSupply += amount;
      outputVat += vat;
    }
  }

  notes.push(
    'Report structure is for reference. Consult an accountant for FIRS submission format.'
  );
  notes.push('VAT rate in Nigeria is typically 7.5% on applicable goods and services.');

  return {
    periodStart: startDate,
    periodEnd: endDate,
    currency: 'NGN',
    vatSummary: {
      taxableSupply,
      outputVat,
      items,
    },
    notes,
    generatedAt: new Date().toISOString(),
  };
}
