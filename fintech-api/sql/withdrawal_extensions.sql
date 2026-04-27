-- Withdrawal retry / reversal audit (run after fintech_wallet_ledger_schema.sql)
ALTER TABLE public.withdrawals
  ADD COLUMN IF NOT EXISTS payout_attempt_count INT NOT NULL DEFAULT 0 CHECK (payout_attempt_count >= 0),
  ADD COLUMN IF NOT EXISTS reversal_journal_id UUID REFERENCES public.ledger_journals (id) ON DELETE SET NULL;

-- Suspense: Dr suspense / Cr wallet holds user funds until payout succeeds (then suspense → FW_CLEARING) or user cancels (reversal).
INSERT INTO public.accounts (id, owner_user_id, kind, currency_code, code, name, status)
SELECT
  '20000000-0000-4000-8000-000000000001'::uuid,
  NULL,
  'clearing',
  'NGN',
  'WITHDRAWAL_SUSPENSE',
  'Withdrawal payout suspense (ledger only)',
  'active'
WHERE
  NOT EXISTS (
    SELECT
      1
    FROM
      public.accounts
    WHERE
      code = 'WITHDRAWAL_SUSPENSE'
  );
