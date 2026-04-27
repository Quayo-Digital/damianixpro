-- Accounting Improvements Phase 1: Journal entries for double-entry bookkeeping
-- Also includes accounting_config (Phase 3) and reconciliation_runs (Phase 4)

-- =============================================================================
-- 1. journal_entries table
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_batch_id UUID NOT NULL,
  entry_date DATE NOT NULL,
  account TEXT NOT NULL,
  debit NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
  description TEXT,
  reference TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('rent_payment', 'shortlet_booking', 'owner_payout', 'manual', 'adjustment')),
  source_id UUID,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT valid_debit_credit CHECK (
    (debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0)
  )
);

-- Add journal_batch_id if table existed with different schema
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS journal_batch_id UUID;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='journal_entries' AND column_name='journal_batch_id') THEN
    CREATE INDEX IF NOT EXISTS idx_journal_entries_batch ON public.journal_entries(journal_batch_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='journal_entries' AND column_name='entry_date') THEN
    CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON public.journal_entries(entry_date);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='journal_entries' AND column_name='account') THEN
    CREATE INDEX IF NOT EXISTS idx_journal_entries_account ON public.journal_entries(account);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='journal_entries' AND column_name='source_type') THEN
    CREATE INDEX IF NOT EXISTS idx_journal_entries_source ON public.journal_entries(source_type, source_id);
  END IF;
END $$;

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage journal entries"
  ON public.journal_entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

COMMENT ON TABLE public.journal_entries IS 'Double-entry accounting journal entries';

-- =============================================================================
-- 2. RPC: create_journal_entries_from_rent_payment
-- =============================================================================
CREATE OR REPLACE FUNCTION public.create_journal_entries_from_rent_payment(
  p_payment_id UUID,
  p_entry_date DATE DEFAULT CURRENT_DATE,
  p_property_id UUID DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch_id UUID := gen_random_uuid();
  v_breakdown RECORD;
  v_ref TEXT;
BEGIN
  SELECT * INTO v_breakdown
  FROM public.payment_breakdowns
  WHERE payment_id = p_payment_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment breakdown not found for payment_id %', p_payment_id;
  END IF;

  v_ref := p_payment_id::TEXT;

  -- Debit: Cash/Bank Account
  INSERT INTO public.journal_entries (journal_batch_id, entry_date, account, debit, credit, description, reference, source_type, source_id, property_id, tenant_id)
  VALUES (v_batch_id, p_entry_date, 'Cash/Bank Account', v_breakdown.total_amount, 0, 'Payment received', v_ref, 'rent_payment', p_payment_id, p_property_id, p_tenant_id);

  -- Credit: Platform Revenue
  IF v_breakdown.platform_fee > 0 THEN
    INSERT INTO public.journal_entries (journal_batch_id, entry_date, account, debit, credit, description, reference, source_type, source_id, property_id, tenant_id)
    VALUES (v_batch_id, p_entry_date, 'Platform Revenue', 0, v_breakdown.platform_fee, 'Platform service fee', v_ref, 'rent_payment', p_payment_id, p_property_id, p_tenant_id);
  END IF;

  -- Credit: Agent Commission Payable
  IF v_breakdown.agent_commission > 0 THEN
    INSERT INTO public.journal_entries (journal_batch_id, entry_date, account, debit, credit, description, reference, source_type, source_id, property_id, tenant_id)
    VALUES (v_batch_id, p_entry_date, 'Agent Commission Payable', 0, v_breakdown.agent_commission, 'Agent commission', v_ref, 'rent_payment', p_payment_id, p_property_id, p_tenant_id);
  END IF;

  -- Credit: Tax Payable
  IF v_breakdown.tax_amount > 0 THEN
    INSERT INTO public.journal_entries (journal_batch_id, entry_date, account, debit, credit, description, reference, source_type, source_id, property_id, tenant_id)
    VALUES (v_batch_id, p_entry_date, 'Tax Payable', 0, v_breakdown.tax_amount, 'VAT/Tax', v_ref, 'rent_payment', p_payment_id, p_property_id, p_tenant_id);
  END IF;

  -- Credit: Owner Payout Payable
  IF v_breakdown.owner_amount > 0 THEN
    INSERT INTO public.journal_entries (journal_batch_id, entry_date, account, debit, credit, description, reference, source_type, source_id, property_id, tenant_id)
    VALUES (v_batch_id, p_entry_date, 'Owner Payout Payable', 0, v_breakdown.owner_amount, 'Amount due to property owner', v_ref, 'rent_payment', p_payment_id, p_property_id, p_tenant_id);
  END IF;

  RETURN v_batch_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_journal_entries_from_rent_payment(UUID, DATE, UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_journal_entries_from_rent_payment(UUID, DATE, UUID, UUID) TO authenticated;

-- =============================================================================
-- 3. accounting_config table (Phase 3)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.accounting_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.accounting_config (key, value, description) VALUES
  ('platform_fee_rate', '0.05'::jsonb, 'Default platform fee (5%)'),
  ('default_agent_commission_rate', '0.03'::jsonb, 'Default agent commission (3%)'),
  ('default_tax_rate', '0.075'::jsonb, 'VAT rate (7.5%)')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.accounting_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage accounting config"
  ON public.accounting_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Allow anon/authenticated to read config for rate lookup
CREATE POLICY "Authenticated can read accounting config"
  ON public.accounting_config FOR SELECT
  TO authenticated
  USING (true);

-- =============================================================================
-- 4. reconciliation_runs table (Phase 4)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.reconciliation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'finalized', 'locked')),
  total_revenue NUMERIC(14,2),
  total_payouts NUMERIC(14,2),
  discrepancy NUMERIC(14,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  finalized_at TIMESTAMPTZ,
  finalized_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.reconciliation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage reconciliation runs"
  ON public.reconciliation_runs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );
