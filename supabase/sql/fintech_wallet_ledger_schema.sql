-- =============================================================================
-- DamianixPro — Fintech wallet, double-entry ledger, escrow, VA, withdrawals,
-- subscriptions (PostgreSQL / Supabase-ready)
--
-- File: supabase/sql/fintech_wallet_ledger_schema.sql
--
-- Prerequisites: auth.users (Supabase).
-- Property management app: prefer public.fintech_auth_users + migration
-- 20260413120000_fintech_auth_users_and_rent_payment_link.sql; set fintech-api FINTECH_USER_TABLE=fintech_auth_users.
-- If this file's public.users conflicts with an org-scoped public.users, use fintech_auth_users only and skip creating public.users here.
--
-- Posting ledger lines: wrap in a transaction; deferred triggers validate balance at COMMIT.
-- App writes should use service_role or Edge Functions; authenticated users are RLS-scoped.
--
-- Admin access: set public.users.role = 'admin' for that auth user (service_role).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- USERS (app profile; mirrors auth.users)
-- -----------------------------------------------------------------------------
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'owner', 'tenant', 'agent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_role ON public.users (role);
CREATE INDEX idx_users_email ON public.users (email) WHERE email IS NOT NULL;

-- -----------------------------------------------------------------------------
-- PLANS (subscription catalog)
-- -----------------------------------------------------------------------------
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  amount_minor BIGINT NOT NULL CHECK (amount_minor >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN',
  billing_interval TEXT NOT NULL CHECK (
    billing_interval IN ('day', 'week', 'month', 'year')
  ),
  trial_days INT NOT NULL DEFAULT 0 CHECK (trial_days >= 0),
  metadata JSONB NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_plans_active ON public.plans (active) WHERE active = TRUE;

-- -----------------------------------------------------------------------------
-- ACCOUNTS (chart of accounts: wallet, escrow, revenue, clearing, etc.)
-- -----------------------------------------------------------------------------
CREATE TYPE public.account_kind AS ENUM(
  'wallet',
  'escrow',
  'revenue',
  'platform_fee',
  'payable',
  'clearing',
  'system'
);

CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  owner_user_id UUID REFERENCES public.users (id) ON DELETE RESTRICT,
  kind public.account_kind NOT NULL,
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN',
  code TEXT,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'frozen', 'closed')
  ),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ck_accounts_owner_wallet CHECK (
    (
      kind IN ('wallet', 'escrow')
      AND owner_user_id IS NOT NULL
    )
    OR (kind NOT IN ('wallet', 'escrow'))
  )
);

CREATE INDEX idx_accounts_owner ON public.accounts (owner_user_id);
CREATE INDEX idx_accounts_kind_currency ON public.accounts (kind, currency_code);
CREATE INDEX idx_accounts_status ON public.accounts (status);

-- Stable lookups for system / pool accounts (user wallets may omit code)
CREATE UNIQUE INDEX idx_accounts_code_unique ON public.accounts (code)
WHERE
  code IS NOT NULL;

COMMENT ON TABLE public.accounts IS 'Chart of accounts; derive balances from ledger_entries using one app-wide debit/credit convention.';

-- -----------------------------------------------------------------------------
-- LEDGER JOURNALS (groups balanced double-entry lines)
-- -----------------------------------------------------------------------------
CREATE TABLE public.ledger_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  idempotency_key TEXT UNIQUE,
  reference TEXT,
  description TEXT,
  source TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ledger_journals_created ON public.ledger_journals (created_at DESC);
CREATE INDEX idx_ledger_journals_idempotency ON public.ledger_journals (idempotency_key)
WHERE
  idempotency_key IS NOT NULL;

-- -----------------------------------------------------------------------------
-- LEDGER ENTRIES (double-entry lines: exactly one of debit or credit > 0)
-- -----------------------------------------------------------------------------
CREATE TABLE public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  journal_id UUID NOT NULL REFERENCES public.ledger_journals (id) ON DELETE RESTRICT,
  account_id UUID NOT NULL REFERENCES public.accounts (id) ON DELETE RESTRICT,
  debit_minor BIGINT NOT NULL DEFAULT 0 CHECK (debit_minor >= 0),
  credit_minor BIGINT NOT NULL DEFAULT 0 CHECK (credit_minor >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN',
  memo TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ck_ledger_entries_exclusive_amount CHECK (
    (
      debit_minor > 0 AND credit_minor = 0
    )
    OR (
      credit_minor > 0
      AND debit_minor = 0
    )
  ),
  CONSTRAINT ck_ledger_entries_not_both_zero CHECK (
    debit_minor > 0
    OR credit_minor > 0
  )
);

CREATE INDEX idx_ledger_entries_journal ON public.ledger_entries (journal_id);
CREATE INDEX idx_ledger_entries_account ON public.ledger_entries (account_id);
CREATE INDEX idx_ledger_entries_account_created ON public.ledger_entries (account_id, created_at DESC);
CREATE INDEX idx_ledger_entries_created ON public.ledger_entries (created_at DESC);

COMMENT ON TABLE public.ledger_entries IS 'Double-entry lines: each row is either a debit or a credit (never both). Journals must balance (deferred trigger).';

-- Deferred balance check: sum(debits) == sum(credits) per journal at commit time
CREATE OR REPLACE FUNCTION public.enforce_ledger_journal_balanced ()
 RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $fn$
DECLARE
  j_id UUID;
  total_debit BIGINT;
  total_credit BIGINT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    j_id := OLD.journal_id;
  ELSE
    j_id := NEW.journal_id;
  END IF;

  SELECT
    COALESCE(SUM(debit_minor), 0),
    COALESCE(SUM(credit_minor), 0) INTO total_debit,
    total_credit
  FROM
    public.ledger_entries
  WHERE
    journal_id = j_id;

  IF total_debit != total_credit THEN
    RAISE EXCEPTION 'Ledger journal % is not double-entry balanced (debits % vs credits %)', j_id, total_debit, total_credit;
  END IF;

  IF total_debit = 0 AND EXISTS (
    SELECT
      1
    FROM
      public.ledger_entries
    WHERE
      journal_id = j_id) THEN
    RAISE EXCEPTION 'Ledger journal % has lines but zero totals', j_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$fn$;

CREATE CONSTRAINT TRIGGER trg_ledger_entries_balanced_insert AFTER INSERT ON public.ledger_entries DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
  EXECUTE FUNCTION public.enforce_ledger_journal_balanced ();

CREATE CONSTRAINT TRIGGER trg_ledger_entries_balanced_update
  AFTER UPDATE ON public.ledger_entries DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
  EXECUTE FUNCTION public.enforce_ledger_journal_balanced ();

CREATE CONSTRAINT TRIGGER trg_ledger_entries_balanced_delete
  AFTER DELETE ON public.ledger_entries DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
  EXECUTE FUNCTION public.enforce_ledger_journal_balanced ();

-- -----------------------------------------------------------------------------
-- TRANSACTIONS (business-facing payment / movement; links to journal when posted)
-- -----------------------------------------------------------------------------
CREATE TYPE public.ledger_transaction_type AS ENUM(
  'deposit',
  'withdrawal',
  'transfer',
  'escrow_fund',
  'escrow_release',
  'subscription_charge',
  'commission',
  'adjustment',
  'fee'
);

CREATE TYPE public.ledger_transaction_status AS ENUM(
  'pending',
  'posted',
  'failed',
  'reversed'
);

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  type public.ledger_transaction_type NOT NULL,
  status public.ledger_transaction_status NOT NULL DEFAULT 'pending',
  amount_minor BIGINT NOT NULL CHECK (amount_minor >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN',
  idempotency_key TEXT UNIQUE,
  journal_id UUID REFERENCES public.ledger_journals (id) ON DELETE SET NULL,
  provider TEXT,
  provider_reference TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_user_created ON public.transactions (user_id, created_at DESC);
CREATE INDEX idx_transactions_status ON public.transactions (status);
CREATE INDEX idx_transactions_journal ON public.transactions (journal_id);
CREATE INDEX idx_transactions_idempotency ON public.transactions (idempotency_key)
WHERE
  idempotency_key IS NOT NULL;

-- -----------------------------------------------------------------------------
-- ESCROW (agreements / holds; funded via postings on linked accounts)
-- -----------------------------------------------------------------------------
CREATE TYPE public.escrow_status AS ENUM(
  'draft',
  'awaiting_funding',
  'funded',
  'releasing',
  'released',
  'disputed',
  'cancelled'
);

CREATE TABLE public.escrow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  reference TEXT UNIQUE,
  payer_user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  beneficiary_user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  escrow_account_id UUID NOT NULL REFERENCES public.accounts (id) ON DELETE RESTRICT,
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN',
  status public.escrow_status NOT NULL DEFAULT 'draft',
  funded_journal_id UUID REFERENCES public.ledger_journals (id) ON DELETE SET NULL,
  release_journal_id UUID REFERENCES public.ledger_journals (id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  funded_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ck_escrow_distinct_parties CHECK (payer_user_id <> beneficiary_user_id)
);

CREATE INDEX idx_escrow_payer ON public.escrow (payer_user_id);
CREATE INDEX idx_escrow_beneficiary ON public.escrow (beneficiary_user_id);
CREATE INDEX idx_escrow_status ON public.escrow (status);

-- -----------------------------------------------------------------------------
-- VIRTUAL ACCOUNTS (e.g. Flutterwave VA — collections routing to a ledger account)
-- -----------------------------------------------------------------------------
CREATE TABLE public.virtual_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  linked_account_id UUID NOT NULL REFERENCES public.accounts (id) ON DELETE RESTRICT,
  provider TEXT NOT NULL DEFAULT 'flutterwave',
  account_number TEXT NOT NULL,
  bank_name TEXT,
  account_name TEXT,
  provider_customer_ref TEXT,
  provider_account_ref TEXT,
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_virtual_accounts_provider_account UNIQUE (provider, account_number)
);

CREATE INDEX idx_virtual_accounts_user ON public.virtual_accounts (user_id);
CREATE INDEX idx_virtual_accounts_linked_account ON public.virtual_accounts (linked_account_id);
CREATE INDEX idx_virtual_accounts_active ON public.virtual_accounts (active)
WHERE
  active = TRUE;

-- -----------------------------------------------------------------------------
-- WITHDRAWALS (payout requests; journal posted on completion)
-- -----------------------------------------------------------------------------
CREATE TYPE public.withdrawal_status AS ENUM(
  'requested',
  'approved',
  'processing',
  'completed',
  'failed',
  'cancelled'
);

CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  wallet_account_id UUID NOT NULL REFERENCES public.accounts (id) ON DELETE RESTRICT,
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'NGN',
  fee_minor BIGINT NOT NULL DEFAULT 0 CHECK (fee_minor >= 0),
  status public.withdrawal_status NOT NULL DEFAULT 'requested',
  destination JSONB NOT NULL DEFAULT '{}',
  journal_id UUID REFERENCES public.ledger_journals (id) ON DELETE SET NULL,
  provider TEXT,
  provider_transfer_ref TEXT,
  idempotency_key TEXT UNIQUE,
  failure_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_withdrawals_user_created ON public.withdrawals (user_id, created_at DESC);
CREATE INDEX idx_withdrawals_status ON public.withdrawals (status);

-- -----------------------------------------------------------------------------
-- SUBSCRIPTIONS
-- -----------------------------------------------------------------------------
CREATE TYPE public.subscription_status AS ENUM(
  'trialing',
  'active',
  'past_due',
  'cancelled',
  'expired'
);

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans (id) ON DELETE RESTRICT,
  status public.subscription_status NOT NULL DEFAULT 'trialing',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  provider TEXT,
  provider_subscription_ref TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- At most one “billable” subscription row per user (trialing / active / past_due).
CREATE UNIQUE INDEX uq_subscriptions_one_active_trialing_or_active ON public.subscriptions (user_id)
WHERE
  status IN ('trialing', 'active', 'past_due');

CREATE INDEX idx_subscriptions_user ON public.subscriptions (user_id);
CREATE INDEX idx_subscriptions_plan ON public.subscriptions (plan_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions (status);

-- =============================================================================
-- RLS helpers
-- =============================================================================
CREATE OR REPLACE FUNCTION public.is_platform_admin ()
  RETURNS BOOLEAN
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
  AS $$
  SELECT
    EXISTS (
      SELECT
        1
      FROM
        public.users u
      WHERE
        u.id = auth.uid()
        AND u.role = 'admin');
$$;

COMMENT ON FUNCTION public.is_platform_admin IS 'True when public.users.role = admin for auth.uid(). Service role bypasses RLS.';

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.ledger_journals ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.escrow ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.virtual_accounts ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- USERS
CREATE POLICY users_select_self_or_admin ON public.users
  FOR SELECT TO authenticated
    USING (id = auth.uid()
      OR public.is_platform_admin ());

CREATE POLICY users_update_self_or_admin ON public.users
  FOR UPDATE
    TO authenticated
    USING (id = auth.uid()
      OR public.is_platform_admin ())
    WITH CHECK (id = auth.uid()
      OR public.is_platform_admin ());

CREATE POLICY users_insert_admin ON public.users
  FOR INSERT
    TO authenticated
    WITH CHECK (public.is_platform_admin ()
      OR id = auth.uid());

-- PLANS (catalog readable by any signed-in user; admin can manage)
CREATE POLICY plans_select_authenticated ON public.plans
  FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY plans_all_admin ON public.plans
  FOR ALL
    TO authenticated
    USING (public.is_platform_admin ())
    WITH CHECK (public.is_platform_admin ());

-- ACCOUNTS — own wallets / escrow; admin sees all
CREATE POLICY accounts_select_own_or_admin ON public.accounts
  FOR SELECT
    TO authenticated
    USING (owner_user_id = auth.uid()
      OR public.is_platform_admin ());

CREATE POLICY accounts_insert_own_wallet ON public.accounts
  FOR INSERT
    TO authenticated
    WITH CHECK ((
      owner_user_id = auth.uid()
 AND kind IN ('wallet', 'escrow'))
    OR public.is_platform_admin ());

CREATE POLICY accounts_update_own_or_admin ON public.accounts
  FOR UPDATE
    TO authenticated
    USING (owner_user_id = auth.uid()
      OR public.is_platform_admin ())
    WITH CHECK (owner_user_id = auth.uid()
      OR public.is_platform_admin ());

-- LEDGER JOURNALS — visible if any line touches user-owned account
CREATE POLICY ledger_journals_select_participant ON public.ledger_journals
  FOR SELECT
    TO authenticated
    USING (public.is_platform_admin ()
      OR EXISTS (
        SELECT
          1
        FROM
          public.ledger_entries le
          JOIN public.accounts a ON a.id = le.account_id
        WHERE
          le.journal_id = ledger_journals.id
          AND a.owner_user_id = auth.uid()));

-- LEDGER ENTRIES — same participation rule; no direct client writes recommended
CREATE POLICY ledger_entries_select_participant ON public.ledger_entries
  FOR SELECT
    TO authenticated
    USING (public.is_platform_admin ()
      OR EXISTS (
        SELECT
          1
        FROM
          public.accounts a
        WHERE
          a.id = ledger_entries.account_id
          AND a.owner_user_id = auth.uid()));

CREATE POLICY ledger_entries_all_admin ON public.ledger_entries
  FOR ALL
    TO authenticated
    USING (public.is_platform_admin ())
    WITH CHECK (public.is_platform_admin ());

CREATE POLICY ledger_journals_all_admin ON public.ledger_journals
  FOR ALL
    TO authenticated
    USING (public.is_platform_admin ())
    WITH CHECK (public.is_platform_admin ());

-- TRANSACTIONS
CREATE POLICY transactions_select_own_or_admin ON public.transactions
  FOR SELECT
    TO authenticated
    USING (user_id = auth.uid()
      OR public.is_platform_admin ());

CREATE POLICY transactions_insert_own_or_admin ON public.transactions
  FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid()
      OR public.is_platform_admin ());

CREATE POLICY transactions_update_admin ON public.transactions
  FOR UPDATE
    TO authenticated
    USING (public.is_platform_admin ())
    WITH CHECK (public.is_platform_admin ());

-- ESCROW
CREATE POLICY escrow_select_parties_or_admin ON public.escrow
  FOR SELECT
    TO authenticated
    USING (payer_user_id = auth.uid()
      OR beneficiary_user_id = auth.uid()
      OR public.is_platform_admin ());

CREATE POLICY escrow_insert_parties ON public.escrow
  FOR INSERT
    TO authenticated
    WITH CHECK (payer_user_id = auth.uid()
      OR public.is_platform_admin ());

CREATE POLICY escrow_update_admin ON public.escrow
  FOR UPDATE
    TO authenticated
    USING (public.is_platform_admin ())
    WITH CHECK (public.is_platform_admin ());

-- VIRTUAL ACCOUNTS
CREATE POLICY virtual_accounts_select_own_or_admin ON public.virtual_accounts
  FOR SELECT
    TO authenticated
    USING (user_id = auth.uid()
      OR public.is_platform_admin ());

CREATE POLICY virtual_accounts_insert_own_or_admin ON public.virtual_accounts
  FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid()
      OR public.is_platform_admin ());

CREATE POLICY virtual_accounts_update_own_or_admin ON public.virtual_accounts
  FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid()
      OR public.is_platform_admin ())
    WITH CHECK (user_id = auth.uid()
      OR public.is_platform_admin ());

-- WITHDRAWALS
CREATE POLICY withdrawals_select_own_or_admin ON public.withdrawals
  FOR SELECT
    TO authenticated
    USING (user_id = auth.uid()
      OR public.is_platform_admin ());

CREATE POLICY withdrawals_insert_own ON public.withdrawals
  FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid()
      OR public.is_platform_admin ());

CREATE POLICY withdrawals_update_admin ON public.withdrawals
  FOR UPDATE
    TO authenticated
    USING (public.is_platform_admin ())
    WITH CHECK (public.is_platform_admin ());

-- SUBSCRIPTIONS
CREATE POLICY subscriptions_select_own_or_admin ON public.subscriptions
  FOR SELECT
    TO authenticated
    USING (user_id = auth.uid()
      OR public.is_platform_admin ());

CREATE POLICY subscriptions_insert_own_or_admin ON public.subscriptions
  FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid()
      OR public.is_platform_admin ());

CREATE POLICY subscriptions_update_own_or_admin ON public.subscriptions
  FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid()
      OR public.is_platform_admin ())
    WITH CHECK (user_id = auth.uid()
      OR public.is_platform_admin ());

-- =============================================================================
-- Optional: sync public.users from auth.users (Supabase)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user ()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''))
  ON CONFLICT (id)
    DO UPDATE SET
      email = EXCLUDED.email,
      updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user ();

-- =============================================================================
-- SAMPLE SEED DATA (plans + system ledger accounts — no auth.users required)
-- =============================================================================
-- Amounts in minor units (e.g. kobo): 1500000 = NGN 15,000.00
INSERT INTO public.plans (code, name, description, amount_minor, currency_code, billing_interval, trial_days, active)
  VALUES ('free', 'Free', 'Starter access', 0, 'NGN', 'month', 0, TRUE),
('starter', 'Starter', 'Small landlords', 1500000, 'NGN', 'month', 14, TRUE),
('professional', 'Professional', 'Growing portfolios', 4500000, 'NGN', 'month', 30, TRUE),
('enterprise', 'Enterprise', 'Unlimited scale', 15000000, 'NGN', 'month', 30, TRUE)
ON CONFLICT (code)
 DO NOTHING;

-- System accounts (owner_user_id NULL): stable UUIDs + codes for app lookups
INSERT INTO public.accounts (id, owner_user_id, kind, currency_code, code, name, status)
  VALUES ('10000000-0000-4000-8000-000000000001'::uuid, NULL, 'clearing', 'NGN', 'FW_CLEARING', 'Flutterwave clearing / suspense', 'active'),
('10000000-0000-4000-8000-000000000002'::uuid, NULL, 'revenue', 'NGN', 'PLATFORM_REVENUE', 'Platform fee revenue', 'active'),
('10000000-0000-4000-8000-000000000003'::uuid, NULL, 'platform_fee', 'NGN', 'SUBSCRIPTION_REVENUE', 'Subscription revenue', 'active'),
('10000000-0000-4000-8000-000000000004'::uuid, NULL, 'payable', 'NGN', 'PAYABLE_LANDLORDS', 'Aggregate landlord payables (optional pool)', 'active'),
('10000000-0000-4000-8000-000000000005'::uuid, NULL, 'system', 'NGN', 'SYSTEM_ROUNDING', 'Rounding / adjustments', 'active')
ON CONFLICT (code)
  DO NOTHING;

-- -----------------------------------------------------------------------------
-- Example balanced journal (run inside a transaction after you have real user accounts)
-- -----------------------------------------------------------------------------
-- BEGIN;
-- INSERT INTO ledger_journals (idempotency_key, description) VALUES ('demo-seed-1', 'Demo funding');
-- INSERT INTO ledger_entries (journal_id, account_id, debit_minor, credit_minor, currency_code, memo)
--   SELECT id, '10000000-0000-4000-8000-000000000001'::uuid, 100000, 0, 'NGN', 'Clearing debit' FROM ledger_journals WHERE idempotency_key = 'demo-seed-1';
-- INSERT INTO ledger_entries (journal_id, account_id, debit_minor, credit_minor, currency_code, memo)
--   SELECT id, '<USER_WALLET_ACCOUNT_UUID>'::uuid, 0, 100000, 'NGN', 'Wallet credit' FROM ledger_journals WHERE idempotency_key = 'demo-seed-1';
-- COMMIT;

GRANT EXECUTE ON FUNCTION public.is_platform_admin () TO authenticated;