-- Chart of Accounts for DamianixPro
-- Defines accounting accounts with types for double-entry bookkeeping

-- =============================================================================
-- 1. account_type enum
-- =============================================================================
DO $$ BEGIN
  CREATE TYPE public.account_type_enum AS ENUM ('asset', 'income', 'expense', 'liability');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- 2. chart_of_accounts table
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name TEXT NOT NULL UNIQUE,
  account_type public.account_type_enum NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_type ON public.chart_of_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_name ON public.chart_of_accounts(account_name);

ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;

-- Admins can manage chart of accounts
CREATE POLICY "Admins can manage chart of accounts"
  ON public.chart_of_accounts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Authenticated users can read chart of accounts
CREATE POLICY "Authenticated can read chart of accounts"
  ON public.chart_of_accounts FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON TABLE public.chart_of_accounts IS 'Chart of accounts for DamianixPro double-entry accounting';

-- =============================================================================
-- 3. Default accounts
-- =============================================================================
INSERT INTO public.chart_of_accounts (account_name, account_type) VALUES
  ('Rent Income', 'income'),
  ('Maintenance Expense', 'expense'),
  ('Cash', 'asset'),
  ('Bank', 'asset'),
  ('Tenant Deposits', 'liability')
ON CONFLICT (account_name) DO NOTHING;
