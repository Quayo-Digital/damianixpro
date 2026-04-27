-- 3D tour service requests for property owners/agents
CREATE TABLE IF NOT EXISTS public.property_tour_service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'in_progress', 'scheduled', 'completed', 'cancelled')),
    notes TEXT,
    admin_notes TEXT,
    scheduled_at TIMESTAMPTZ,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    tour_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_tour_requests_property_id
    ON public.property_tour_service_requests(property_id);

CREATE INDEX IF NOT EXISTS idx_property_tour_requests_requested_by
    ON public.property_tour_service_requests(requested_by);

CREATE INDEX IF NOT EXISTS idx_property_tour_requests_status
    ON public.property_tour_service_requests(status);

ALTER TABLE public.property_tour_service_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Requesters can view their own tour requests" ON public.property_tour_service_requests;
CREATE POLICY "Requesters can view their own tour requests"
    ON public.property_tour_service_requests
    FOR SELECT
    USING (requested_by = auth.uid());

DROP POLICY IF EXISTS "Requesters can create their own tour requests" ON public.property_tour_service_requests;
CREATE POLICY "Requesters can create their own tour requests"
    ON public.property_tour_service_requests
    FOR INSERT
    WITH CHECK (requested_by = auth.uid());

DROP POLICY IF EXISTS "Admins can view all tour requests" ON public.property_tour_service_requests;
CREATE POLICY "Admins can view all tour requests"
    ON public.property_tour_service_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
              AND ur.role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Admins can update all tour requests" ON public.property_tour_service_requests;
CREATE POLICY "Admins can update all tour requests"
    ON public.property_tour_service_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
              AND ur.role IN ('admin', 'super_admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
              AND ur.role IN ('admin', 'super_admin')
        )
    );

CREATE OR REPLACE FUNCTION public.update_property_tour_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_property_tour_requests_updated_at
    ON public.property_tour_service_requests;

CREATE TRIGGER update_property_tour_requests_updated_at
    BEFORE UPDATE ON public.property_tour_service_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_property_tour_requests_updated_at();
