/**
 * Journal persistence for double-entry accounting
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface JournalEntryRow {
  account: string;
  debit: number;
  credit: number;
  description: string;
  reference: string;
}

export type JournalSourceType =
  | 'rent_payment'
  | 'shortlet_booking'
  | 'owner_payout'
  | 'manual'
  | 'adjustment';

export interface PersistJournalOptions {
  journalBatchId?: string;
  entryDate: string;
  sourceType: JournalSourceType;
  sourceId?: string;
  propertyId?: string;
  tenantId?: string;
  createdBy?: string;
}

export async function persistJournalEntries(
  entries: JournalEntryRow[],
  options: PersistJournalOptions
): Promise<{ success: boolean; batchId: string; error?: string }> {
  const batchId = options.journalBatchId ?? crypto.randomUUID();

  const rows = entries.map((e) => ({
    journal_batch_id: batchId,
    entry_date: options.entryDate,
    account: e.account,
    debit: e.debit,
    credit: e.credit,
    description: e.description,
    reference: e.reference,
    source_type: options.sourceType,
    source_id: options.sourceId || null,
    property_id: options.propertyId || null,
    tenant_id: options.tenantId || null,
    created_by: options.createdBy || null,
  }));

  const { error } = await supabase.from('journal_entries').insert(rows);

  if (error) {
    logger.error('Failed to persist journal entries', error instanceof Error ? error : undefined);
    return { success: false, batchId, error: error.message };
  }
  return { success: true, batchId };
}
