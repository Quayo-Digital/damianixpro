-- Rent escrow extensions (run against same DB as fintech_wallet_ledger_schema.sql)
ALTER TABLE public.escrow
  ADD COLUMN IF NOT EXISTS hold_period_days INT NOT NULL DEFAULT 7 CHECK (hold_period_days >= 0),
  ADD COLUMN IF NOT EXISTS commission_bps INT NOT NULL DEFAULT 0 CHECK (commission_bps >= 0 AND commission_bps <= 10000),
  ADD COLUMN IF NOT EXISTS hold_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS disputed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS dispute_reason TEXT,
  ADD COLUMN IF NOT EXISTS disputed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS disputed_by UUID REFERENCES public.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS release_commission_journal_id UUID REFERENCES public.ledger_journals (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.escrow.commission_bps IS 'Platform commission in basis points (100 = 1%). Applied on release.';

COMMENT ON COLUMN public.escrow.hold_until IS 'Earliest time release is allowed; set when escrow becomes funded.';

CREATE INDEX IF NOT EXISTS idx_escrow_hold_until_funded ON public.escrow (hold_until)
WHERE
  status = 'funded'::escrow_status
  AND disputed = FALSE;
