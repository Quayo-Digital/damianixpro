-- Optional audit table for ledgerService.transfer (append-only logging).
CREATE TABLE IF NOT EXISTS public.ledger_transfer_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  journal_id UUID NOT NULL REFERENCES public.ledger_journals (id) ON DELETE RESTRICT,
  idempotency_key TEXT NOT NULL,
  debit_account_id UUID NOT NULL REFERENCES public.accounts (id) ON DELETE RESTRICT,
  credit_account_id UUID NOT NULL REFERENCES public.accounts (id) ON DELETE RESTRICT,
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency_code CHAR(3) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ledger_transfer_audit_journal ON public.ledger_transfer_audit (journal_id);

CREATE INDEX IF NOT EXISTS idx_ledger_transfer_audit_idempotency ON public.ledger_transfer_audit (idempotency_key);
