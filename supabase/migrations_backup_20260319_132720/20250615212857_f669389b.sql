
CREATE TABLE IF NOT EXISTS public.rental_milestones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  tenant_name text NOT NULL,
  property_id uuid NOT NULL,
  property_name text NOT NULL,
  milestone_type text NOT NULL CHECK (milestone_type IN ('lease_expiration', 'rent_increase', 'inspection', 'maintenance', 'other')),
  description text NOT NULL,
  date date NOT NULL,
  notification_sent boolean NOT NULL DEFAULT false,
  status text NOT NULL CHECK (status IN ('upcoming', 'active', 'completed', 'overdue')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rental_milestones_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants (id) ON DELETE CASCADE,
  CONSTRAINT rental_milestones_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties (id) ON DELETE CASCADE
);

COMMENT ON TABLE public.rental_milestones IS 'Stores important dates and events for tenants and properties.';

-- Enable RLS
ALTER TABLE public.rental_milestones ENABLE ROW LEVEL SECURITY;

-- Policies for SELECT
CREATE POLICY "Allow admins to see all milestones"
ON public.rental_milestones FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Allow property owners to see milestones for their properties"
ON public.rental_milestones FOR SELECT
USING (auth.uid() = (SELECT owner_id FROM public.properties WHERE id = rental_milestones.property_id));

CREATE POLICY "Allow tenants to see their own milestones"
ON public.rental_milestones FOR SELECT
USING (auth.uid() = (SELECT user_id FROM public.tenants WHERE id = rental_milestones.tenant_id));

-- Policies for CUD (Create, Update, Delete)
CREATE POLICY "Allow admins and owners to manage milestones"
ON public.rental_milestones FOR ALL
USING (is_admin(auth.uid()) OR auth.uid() = (SELECT owner_id FROM public.properties WHERE id = rental_milestones.property_id))
WITH CHECK (is_admin(auth.uid()) OR auth.uid() = (SELECT owner_id FROM public.properties WHERE id = rental_milestones.property_id));

-- Trigger to update 'updated_at' timestamp
CREATE TRIGGER set_rental_milestones_updated_at
BEFORE UPDATE ON public.rental_milestones
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

