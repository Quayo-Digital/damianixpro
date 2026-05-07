/**
 * Reconciliation report - compares payment records with journal entries
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { toPgDateOnly } from '@/utils/toPgDateOnly';

export interface ReconciliationResult {
  revenueFromPayments: number;
  revenueFromJournal: number;
  payoutsFromBreakdowns: number;
  payoutsFromJournal: number;
  discrepancy: number;
  balanced: boolean;
  periodStart: string;
  periodEnd: string;
}

export async function runReconciliation(
  startDate: string,
  endDate: string
): Promise<ReconciliationResult> {
  try {
    const ps = toPgDateOnly(startDate);
    const pe = toPgDateOnly(endDate);
    // Revenue from rent_payments in date range
    const { data: payments, error: paymentsError } = await supabase
      .from('rent_payments')
      .select('amount')
      .eq('status', 'successful')
      .gte('payment_date', ps)
      .lte('payment_date', pe);

    if (paymentsError) throw paymentsError;

    const revenueFromPayments = payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) ?? 0;

    // Revenue from journal (Cash/Bank Account debits)
    const { data: journalDebits, error: journalError } = await supabase
      .from('journal_entries')
      .select('debit')
      .eq('account', 'Cash/Bank Account')
      .gte('entry_date', ps)
      .lte('entry_date', pe);

    if (journalError) throw journalError;

    const revenueFromJournal =
      journalDebits?.reduce((sum, e) => sum + Number(e.debit || 0), 0) ?? 0;

    // Payouts from payment_breakdowns (owner_amount where paid_to_owner, in date range)
    const { data: paymentsInRange } = await supabase
      .from('rent_payments')
      .select('id')
      .eq('status', 'successful')
      .gte('payment_date', ps)
      .lte('payment_date', pe);

    const paymentIds = (paymentsInRange || []).map((p) => p.id);

    let payoutsFromBreakdowns = 0;
    if (paymentIds.length > 0) {
      const { data: breakdowns, error: breakdownError } = await supabase
        .from('payment_breakdowns')
        .select('owner_amount')
        .eq('paid_to_owner', true)
        .in('payment_id', paymentIds);

      if (!breakdownError) {
        payoutsFromBreakdowns =
          breakdowns?.reduce((sum, b) => sum + Number(b.owner_amount || 0), 0) ?? 0;
      }
    }

    // Payouts from journal (Owner Payout Payable credits - when paid, we'd debit it;
    // for now we compare owner amounts. Simpler: sum Owner Payout Payable credits)
    const { data: ownerCredits, error: ownerError } = await supabase
      .from('journal_entries')
      .select('credit')
      .eq('account', 'Owner Payout Payable')
      .gte('entry_date', ps)
      .lte('entry_date', pe);

    if (ownerError) throw ownerError;

    const payoutsFromJournal =
      ownerCredits?.reduce((sum, e) => sum + Number(e.credit || 0), 0) ?? 0;

    const revenueDiscrepancy = Math.abs(revenueFromPayments - revenueFromJournal);
    const payoutDiscrepancy = Math.abs(payoutsFromBreakdowns - payoutsFromJournal);
    const discrepancy = revenueDiscrepancy + payoutDiscrepancy;
    const balanced = discrepancy < 0.01;

    return {
      revenueFromPayments,
      revenueFromJournal,
      payoutsFromBreakdowns,
      payoutsFromJournal,
      discrepancy,
      balanced,
      periodStart: startDate,
      periodEnd: endDate,
    };
  } catch (error) {
    logger.error('Reconciliation failed', error instanceof Error ? error : undefined);
    return {
      revenueFromPayments: 0,
      revenueFromJournal: 0,
      payoutsFromBreakdowns: 0,
      payoutsFromJournal: 0,
      discrepancy: 0,
      balanced: false,
      periodStart: startDate,
      periodEnd: endDate,
    };
  }
}

export async function saveReconciliationRun(
  startDate: string,
  endDate: string,
  result: ReconciliationResult,
  status: 'draft' | 'finalized' = 'draft'
): Promise<{ id: string } | { error: string }> {
  const { data, error } = await supabase
    .from('reconciliation_runs')
    .insert({
      period_start: startDate,
      period_end: endDate,
      status,
      total_revenue: result.revenueFromPayments,
      total_payouts: result.payoutsFromBreakdowns,
      discrepancy: result.discrepancy,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
}
