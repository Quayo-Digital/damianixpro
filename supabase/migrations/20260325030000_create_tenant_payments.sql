-- Create tenant_payments used by PaymentService and tenant dashboard.
-- This table was missing in the target project, causing PostgREST 404s.

CREATE TABLE IF NOT EXISTS public.tenant_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lease_id uuid REFERENCES public.leases(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL,
  payment_type text NOT NULL DEFAULT 'rent',
  payment_method text NOT NULL DEFAULT 'bank_transfer',
  payment_status text NOT NULL DEFAULT 'pending',
  reference_number text UNIQUE,
  description text,
  due_date date,
  gateway text,
  access_code text,
  gateway_response text,
  paid_at timestamptz,
  fees numeric(12,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_payments_tenant_id ON public.tenant_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_payments_reference_number ON public.tenant_payments(reference_number);
CREATE INDEX IF NOT EXISTS idx_tenant_payments_created_at ON public.tenant_payments(created_at DESC);

ALTER TABLE public.tenant_payments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'tenant_payments'
      AND policyname = 'tenant_payments_select_own'
  ) THEN
    CREATE POLICY "tenant_payments_select_own" ON public.tenant_payments
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.tenants t
          WHERE t.id = tenant_payments.tenant_id
            AND t.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'tenant_payments'
      AND policyname = 'tenant_payments_insert_owner_admin'
  ) THEN
    CREATE POLICY "tenant_payments_insert_owner_admin" ON public.tenant_payments
      FOR INSERT TO authenticated
      WITH CHECK (
        public.is_admin(auth.uid())
        OR EXISTS (
          SELECT 1
          FROM public.tenants t
          JOIN public.leases l ON l.tenant_id = t.id
          JOIN public.properties p ON p.id = l.property_id
          WHERE t.id = tenant_payments.tenant_id
            AND p.owner_id = auth.uid()
        )
      );
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON public.tenant_payments TO authenticated;
