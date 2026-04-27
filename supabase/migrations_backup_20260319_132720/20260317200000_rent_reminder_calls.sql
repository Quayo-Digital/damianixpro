-- AI Rent Reminder System
-- Tracks outbound reminder calls and Paystack links

CREATE TABLE IF NOT EXISTS public.rent_reminder_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lease_id UUID NOT NULL REFERENCES public.leases(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,
  days_until_due INTEGER NOT NULL,
  paystack_reference TEXT,
  paystack_authorization_url TEXT,
  tts_audio_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'calling', 'completed', 'payment_sent', 'failed')),
  call_sid TEXT,
  sms_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rent_reminder_tenant ON public.rent_reminder_calls(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rent_reminder_status ON public.rent_reminder_calls(status);
CREATE INDEX IF NOT EXISTS idx_rent_reminder_due ON public.rent_reminder_calls(due_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rent_reminder_tenant_due ON public.rent_reminder_calls(tenant_id, due_date) WHERE status IN ('pending', 'calling');

ALTER TABLE public.rent_reminder_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service manages rent reminders"
  ON public.rent_reminder_calls FOR ALL
  USING (true) WITH CHECK (true);
