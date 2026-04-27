-- Accounting Transactions table for DamianixPro transaction engine
-- Records income and expense transactions linked to chart of accounts

CREATE TABLE IF NOT EXISTS public.accounting_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  account TEXT NOT NULL,
  description TEXT,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT account_exists FOREIGN KEY (account) REFERENCES public.chart_of_accounts(account_name)
);

CREATE INDEX IF NOT EXISTS idx_accounting_transactions_type ON public.accounting_transactions(type);
CREATE INDEX IF NOT EXISTS idx_accounting_transactions_account ON public.accounting_transactions(account);
CREATE INDEX IF NOT EXISTS idx_accounting_transactions_created_at ON public.accounting_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_accounting_transactions_property ON public.accounting_transactions(property_id);
CREATE INDEX IF NOT EXISTS idx_accounting_transactions_tenant ON public.accounting_transactions(tenant_id);

ALTER TABLE public.accounting_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage accounting transactions"
  ON public.accounting_transactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Authenticated can read accounting transactions"
  ON public.accounting_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'owner', 'agent')
    )
  );

COMMENT ON TABLE public.accounting_transactions IS 'Income and expense transactions linked to chart of accounts';
