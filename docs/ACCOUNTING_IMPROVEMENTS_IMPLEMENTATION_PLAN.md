# Accounting System Improvements – Implementation Plan

**Document Version:** 1.0  
**Date:** February 2025  
**Status:** Proposed

This document outlines a concrete implementation plan to harden the DamianixPro accounting system for audit readiness, proper double-entry bookkeeping, reconciliation, and Nigerian regulatory compliance.

---

## Executive Summary

| Phase       | Scope                                                  | Effort   | Priority |
| ----------- | ------------------------------------------------------ | -------- | -------- |
| **Phase 1** | Journal persistence + auto-posting from payments       | 2–3 days | Critical |
| **Phase 2** | Shortlet transaction consistency + wallet audit trail  | 1–2 days | Critical |
| **Phase 3** | Configurable rates + fee settings table                | 1 day    | High     |
| **Phase 4** | Reconciliation reports + period close                  | 2 days   | High     |
| **Phase 5** | Unified cross-product reporting + Nigerian tax formats | 2–3 days | Medium   |

---

## Phase 1: Journal Persistence & Auto-Posting

### 1.1 Database Schema

**New table: `journal_entries`**

```sql
-- Migration: 20250217_create_journal_entries.sql

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_batch_id UUID NOT NULL,  -- Groups related entries (e.g. one payment = one batch)
  entry_date DATE NOT NULL,
  account TEXT NOT NULL,
  debit NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
  description TEXT,
  reference TEXT,
  -- Source linkage
  source_type TEXT NOT NULL,  -- 'rent_payment', 'shortlet_booking', 'payout', 'manual', 'adjustment'
  source_id UUID,
  property_id UUID REFERENCES properties(id),
  tenant_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT valid_debit_credit CHECK (
    (debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0)
  )
);

CREATE INDEX idx_journal_entries_batch ON journal_entries(journal_batch_id);
CREATE INDEX idx_journal_entries_date ON journal_entries(entry_date);
CREATE INDEX idx_journal_entries_account ON journal_entries(account);
CREATE INDEX idx_journal_entries_source ON journal_entries(source_type, source_id);

-- RLS
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and system can manage journal entries"
  ON journal_entries FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (admin_settings->>'is_super_admin')::boolean = true)
  );

COMMENT ON TABLE journal_entries IS 'Double-entry accounting journal entries';
```

**New table: `accounting_config` (optional for Phase 3, can defer)**

```sql
-- For configurable rates (Phase 3)
CREATE TABLE IF NOT EXISTS public.accounting_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO accounting_config (key, value, description) VALUES
  ('platform_fee_rate', '0.05', 'Default platform fee (5%)'),
  ('default_agent_commission_rate', '0.03', 'Default agent commission (3%)'),
  ('default_tax_rate', '0.075', 'VAT rate (7.5%)');
```

### 1.2 New Service: Journal Persistence

**File: `src/services/payments/accounting/journal.ts`**

```typescript
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
    source_id: options.sourceId,
    property_id: options.propertyId,
    tenant_id: options.tenantId,
    created_by: options.createdBy,
  }));

  const { error } = await supabase.from('journal_entries').insert(rows);

  if (error) {
    logger.error('Failed to persist journal entries', error);
    return { success: false, batchId, error: error.message };
  }
  return { success: true, batchId };
}
```

### 1.3 Integrate Auto-Posting into Paystack Webhook

**File: `supabase/functions/paystack-webhook/index.ts`**

After recording `payment_breakdowns`, add journal persistence via a new Edge Function helper or RPC.

**Approach A (recommended):** Create a Supabase RPC `create_journal_entries_from_payment` that:

1. Accepts `payment_id`, `breakdown` (or reads from `payment_breakdowns`).
2. Generates journal entries (mirror `triggerLedgerAutoPost` logic).
3. Inserts into `journal_entries`.

**Approach B:** Call an Edge Function from the webhook that performs the same logic.

**RPC skeleton:**

```sql
-- In migration or as a new function
CREATE OR REPLACE FUNCTION create_journal_entries_from_rent_payment(
  p_payment_id UUID,
  p_entry_date DATE DEFAULT CURRENT_DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_batch_id UUID := gen_random_uuid();
  v_breakdown RECORD;
  v_total_settled NUMERIC;
BEGIN
  SELECT * INTO v_breakdown FROM payment_breakdowns WHERE payment_id = p_payment_id LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment breakdown not found';
  END IF;
  -- Insert journal entries (simplified - full logic in migration)
  INSERT INTO journal_entries (journal_batch_id, entry_date, account, debit, credit, description, reference, source_type, source_id)
  VALUES
    (v_batch_id, p_entry_date, 'Cash/Bank Account', v_breakdown.total_amount, 0, 'Payment received', p_payment_id::text, 'rent_payment', p_payment_id),
    (v_batch_id, p_entry_date, 'Platform Revenue', 0, v_breakdown.platform_fee, 'Platform fee', p_payment_id::text, 'rent_payment', p_payment_id),
    -- ... remaining entries
  ;
  RETURN v_batch_id;
END;
$$;
```

**Code change in webhook (after breakdown insert):**

```typescript
// After: if (breakdownError) ...
const { data: batchId, error: journalError } = await supabase.rpc(
  'create_journal_entries_from_rent_payment',
  {
    p_payment_id: payment.id,
    p_entry_date: new Date().toISOString().slice(0, 10),
  }
);
if (journalError) console.error('Journal posting failed:', journalError);
```

### 1.4 LedgerPosting: Persist on “Post to Ledger”

**File: `src/components/billing/LedgerPosting.tsx`**

- Import `persistJournalEntries`.
- In `handlePost`, after `calculateLedgerPosting()`:
  1. Call `persistJournalEntries(posting.journalEntries, { ... })`.
  2. On success: toast, optionally refetch or show confirmation.
  3. On failure: toast error.
- Add `sourceType: 'manual'`, `sourceId` from payment reference, `propertyId`, `tenantId` from form.

### 1.5 Update triggerLedgerAutoPost to Support Persistence

**File: `src/services/billing/integrations.ts`**

- Add optional `persist?: boolean` to the function’s return or as a parameter.
- When `persist` is true (e.g. called from payment success flow), call `persistJournalEntries` with the computed entries.
- The client-side “payment success” flow (e.g. redirect handler) would need to call this with `persist: true`. The webhook path uses the RPC instead.

---

## Phase 2: Shortlet Transaction Consistency

### 2.1 Ensure Every Wallet Change Creates a Transaction

**File: `src/services/shortlet/api/wallets.ts`**

**Changes to `creditWallet`:**

- Always create a transaction (remove `if (bookingId)` guard).
- Use `bookingId` or a generic description when no booking.

**Changes to `debitWallet`:**

- Always create a transaction before updating balance.
- Add `TransactionType.WITHDRAWAL` or extend `TransactionType` if needed.

```typescript
// debitWallet - add transaction
await createTransaction({
  booking_id: null, // or pass optional ref
  user_id: userId,
  amount,
  type: TransactionType.PAYOUT, // or new type 'withdrawal'
  provider: getPayoutProvider(),
  status: TransactionStatus.SUCCESS,
  description: description || 'Wallet debit',
});
```

**Schema note:** `transactions` has `booking_id` as optional; ensure `user_id` is set for all wallet-affecting transactions.

### 2.2 Shortlet Webhook: Create Transaction on Wallet Credit

**File: `supabase/functions/paystack-shortlet-webhook/index.ts`**

In `handleChargeSuccess`, after updating wallet:

1. Insert into `transactions` table with:
   - `booking_id`: booking.id
   - `user_id`: booking.owner_id
   - `amount`: booking.payout_amount
   - `type`: 'commission' or 'charge' (owner side)
   - `provider`: 'paystack'
   - `provider_ref`: data.reference
   - `status`: 'success'
   - `description`: 'Earnings from booking'

This keeps a transaction record for every wallet credit, matching `creditWallet` behavior.

### 2.3 release-pending-funds: Create Transaction on Release

**File: `supabase/functions/release-pending-funds/index.ts`**

When moving funds from pending to available:

- Create a transaction of type `deposit` or `commission` (or introduce `pending_release`) to record the movement.
- Ensures a clear audit trail for pending → available.

---

## Phase 3: Configurable Rates

### 3.1 Use `accounting_config` for Default Rates

**Files to update:**

- `src/services/payments/accounting/breakdown.ts`
- `supabase/functions/paystack-webhook/index.ts`
- `src/services/billing/integrations.ts`

**Flow:**

1. Fetch `accounting_config` by key (or cache in memory).
2. Fall back to hardcoded values if not found.
3. Property-level `agent_commission_rate` continues to override the default.

**New helper: `src/services/payments/accounting/config.ts`**

```typescript
export async function getAccountingRates(): Promise<{
  platformFeeRate: number;
  agentCommissionRate: number;
  taxRate: number;
}> {
  const { data } = await supabase
    .from('accounting_config')
    .select('key, value')
    .in('key', ['platform_fee_rate', 'default_agent_commission_rate', 'default_tax_rate']);
  const map = Object.fromEntries((data || []).map((r) => [r.key, Number(r.value)]));
  return {
    platformFeeRate: map.platform_fee_rate ?? 0.05,
    agentCommissionRate: map.default_agent_commission_rate ?? 0.03,
    taxRate: map.default_tax_rate ?? 0.075,
  };
}
```

---

## Phase 4: Reconciliation & Period Close

### 4.1 Reconciliation Table (Optional)

```sql
CREATE TABLE IF NOT EXISTS public.reconciliation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT DEFAULT 'draft',  -- draft, finalized, locked
  total_revenue NUMERIC(14,2),
  total_payouts NUMERIC(14,2),
  discrepancy NUMERIC(14,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  finalized_at TIMESTAMPTZ,
  finalized_by UUID REFERENCES auth.users(id)
);
```

### 4.2 Reconciliation Report Service

**File: `src/services/payments/accounting/reconciliation.ts`**

```typescript
export async function runReconciliation(
  startDate: string,
  endDate: string
): Promise<{
  revenueFromPayments: number;
  revenueFromJournal: number;
  payoutsFromBreakdowns: number;
  payoutsFromJournal: number;
  discrepancy: number;
  balanced: boolean;
}> {
  // Sum rent_payments in range
  // Sum journal_entries for same period
  // Sum payment_breakdowns.owner_amount where paid_to_owner
  // Compare and return discrepancy
}
```

### 4.3 Period Lock (Optional)

- Add `period_locked_before DATE` to `accounting_config`.
- Before updating `journal_entries` or `payment_breakdowns`, check that `entry_date >= period_locked_before`.
- Admin UI to set the lock date.

---

## Phase 5: Unified Reporting & Nigerian Tax

### 5.1 Unified Accounting Summary

**File: `src/services/payments/accounting/unifiedSummary.ts`**

- Aggregate from:
  - `payment_breakdowns` (long-term rent)
  - `transactions` (shortlet charges, payouts)
  - `journal_entries` (if used as source of truth)
- Return a combined view: total revenue, platform fees, agent commissions, owner payouts, taxes, by product (rent vs shortlet).

### 5.2 Nigerian Tax Report Stub

- Add `src/services/payments/accounting/taxReport.ts`.
- Export structure for VAT (e.g. taxable supply, output VAT) from `journal_entries` and `payment_breakdowns`.
- Format suitable for FIRS-style reporting (structure only; exact format can be refined with an accountant).

---

## Implementation Order

| Step | Task                                                   | Depends On |
| ---- | ------------------------------------------------------ | ---------- |
| 1    | Create `journal_entries` migration                     | —          |
| 2    | Add `persistJournalEntries` service                    | Step 1     |
| 3    | Create RPC `create_journal_entries_from_rent_payment`  | Step 1     |
| 4    | Call RPC from Paystack webhook after breakdown         | Steps 2–3  |
| 5    | Update LedgerPosting to call `persistJournalEntries`   | Step 2     |
| 6    | Add transaction creation in shortlet webhook           | —          |
| 7    | Add transaction creation in debitWallet                | —          |
| 8    | Add transaction creation in release-pending-funds      | —          |
| 9    | Create `accounting_config` table (optional)            | —          |
| 10   | Implement config fetching and use in breakdown/webhook | Step 9     |
| 11   | Implement reconciliation report                        | Step 1     |
| 12   | Implement unified summary                              | Steps 1–2  |

---

## Files to Create

| File                                                      | Purpose                  |
| --------------------------------------------------------- | ------------------------ |
| `supabase/migrations/20250217_create_journal_entries.sql` | Journal schema + RPC     |
| `src/services/payments/accounting/journal.ts`             | Persist journal entries  |
| `src/services/payments/accounting/config.ts`              | Fetch accounting config  |
| `src/services/payments/accounting/reconciliation.ts`      | Reconciliation report    |
| `src/services/payments/accounting/unifiedSummary.ts`      | Cross-product summary    |
| `src/services/payments/accounting/taxReport.ts`           | Nigerian tax report stub |

---

## Files to Modify

| File                                                    | Changes                                   |
| ------------------------------------------------------- | ----------------------------------------- |
| `supabase/functions/paystack-webhook/index.ts`          | Call journal RPC after breakdown          |
| `supabase/functions/paystack-shortlet-webhook/index.ts` | Create transaction on wallet credit       |
| `supabase/functions/release-pending-funds/index.ts`     | Create transaction on release             |
| `src/components/billing/LedgerPosting.tsx`              | Persist journal on Post                   |
| `src/services/shortlet/api/wallets.ts`                  | Always create transaction on credit/debit |
| `src/services/payments/accounting/breakdown.ts`         | Use config rates (Phase 3)                |
| `src/services/billing/integrations.ts`                  | Optional persist in triggerLedgerAutoPost |
| `src/integrations/supabase/types.ts`                    | Regenerate after migrations               |

---

## Testing Checklist

- [ ] Rent payment via Paystack → `payment_breakdowns` + `journal_entries` created
- [ ] LedgerPosting manual post → `journal_entries` created, batch id returned
- [ ] Shortlet payment success → wallet updated + `transactions` row created
- [ ] Payout debit → `transactions` row created
- [ ] release-pending-funds → transaction created for release
- [ ] Reconciliation report matches payment_breakdowns totals
- [ ] Debits = credits for each journal batch

---

## Rollback Plan

- `journal_entries` can be dropped without affecting existing `payment_breakdowns` or `rent_payments`.
- RPC can be removed; webhook will continue to record breakdowns only.
- Transaction creation in shortlet is additive; no existing logic removed.
