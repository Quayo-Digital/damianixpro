-- Fix: allow agents/managers (via properties.agent_id) to review and act
-- on rental_applications for the properties they manage.
--
-- Without this, applications may be inserted by the tenant successfully,
-- but agents see nothing / cannot approve, causing the lease workflow to stall.

BEGIN;

ALTER TABLE public.rental_applications ENABLE ROW LEVEL SECURITY;

-- SELECT: agent can view applications for properties they manage
DROP POLICY IF EXISTS "rental_applications_select_as_agent" ON public.rental_applications;
CREATE POLICY "rental_applications_select_as_agent"
ON public.rental_applications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = rental_applications.property_id
      AND p.agent_id = auth.uid()
  )
);

-- UPDATE: agent can approve/reject applications for their managed properties
DROP POLICY IF EXISTS "rental_applications_update_as_agent" ON public.rental_applications;
CREATE POLICY "rental_applications_update_as_agent"
ON public.rental_applications
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = rental_applications.property_id
      AND p.agent_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = rental_applications.property_id
      AND p.agent_id = auth.uid()
  )
);

COMMIT;

