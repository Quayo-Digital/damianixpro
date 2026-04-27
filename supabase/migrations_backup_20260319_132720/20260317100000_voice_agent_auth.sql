-- Voice Agent Authentication
-- Phone recognition, OTP verification, tenant voice PIN
-- Sensitive operations (e.g. payments) require verification

-- 1) Verification sessions: tracks verified callers for sensitive ops
CREATE TABLE IF NOT EXISTS public.voice_agent_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  method TEXT NOT NULL CHECK (method IN ('phone', 'otp', 'pin')),
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_voice_agent_verifications_session ON public.voice_agent_verifications(session_id);
CREATE INDEX IF NOT EXISTS idx_voice_agent_verifications_expires ON public.voice_agent_verifications(expires_at);

-- 2) OTP codes: short-lived codes sent via SMS
CREATE TABLE IF NOT EXISTS public.voice_agent_otp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_voice_agent_otp_phone ON public.voice_agent_otp(phone);
CREATE INDEX IF NOT EXISTS idx_voice_agent_otp_expires ON public.voice_agent_otp(expires_at);

-- 3) Tenant voice PIN: hashed PIN for voice verification
CREATE TABLE IF NOT EXISTS public.tenant_voice_pin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
  pin_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_voice_pin_tenant ON public.tenant_voice_pin(tenant_id);

-- RLS
ALTER TABLE public.voice_agent_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_agent_otp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_voice_pin ENABLE ROW LEVEL SECURITY;

-- Server-only tables: deny direct client access (service_role bypasses RLS)
CREATE POLICY "No direct client access to verifications"
  ON public.voice_agent_verifications FOR ALL
  USING (false) WITH CHECK (false);

CREATE POLICY "No direct client access to OTP"
  ON public.voice_agent_otp FOR ALL
  USING (false) WITH CHECK (false);

CREATE POLICY "Tenants can view own voice PIN record"
  ON public.tenant_voice_pin FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenants can insert own voice PIN"
  ON public.tenant_voice_pin FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenants can update own voice PIN"
  ON public.tenant_voice_pin FOR UPDATE
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE user_id = auth.uid()
    )
  );
