-- Units table for property management (individual apartments/rooms within a property)
-- Fixes: relation "units" does not exist (42P01)

CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    unit_number TEXT,
    unit_type TEXT,
    bedrooms INTEGER,
    bathrooms INTEGER,
    square_feet INTEGER,
    rent_amount DECIMAL(12,2),
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'unavailable')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_units_property_id ON public.units(property_id);
CREATE INDEX IF NOT EXISTS idx_units_status ON public.units(status);

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view units for properties they can access
DROP POLICY IF EXISTS "Users can view units for accessible properties" ON public.units;
CREATE POLICY "Users can view units for accessible properties"
ON public.units FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = property_id
        AND (p.owner_id = auth.uid() OR p.agent_id = auth.uid())
    )
    OR EXISTS (
        SELECT 1 FROM public.profiles pr
        WHERE pr.id = auth.uid() AND LOWER(pr.role::text) IN ('admin', 'super_admin')
    )
);

-- Owners/agents can manage units for their properties
DROP POLICY IF EXISTS "Owners and agents can manage units" ON public.units;
CREATE POLICY "Owners and agents can manage units"
ON public.units FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = property_id
        AND (p.owner_id = auth.uid() OR p.agent_id = auth.uid())
    )
    OR EXISTS (
        SELECT 1 FROM public.profiles pr
        WHERE pr.id = auth.uid() AND LOWER(pr.role::text) IN ('admin', 'super_admin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = property_id
        AND (p.owner_id = auth.uid() OR p.agent_id = auth.uid())
    )
    OR EXISTS (
        SELECT 1 FROM public.profiles pr
        WHERE pr.id = auth.uid() AND LOWER(pr.role::text) IN ('admin', 'super_admin')
    )
);
