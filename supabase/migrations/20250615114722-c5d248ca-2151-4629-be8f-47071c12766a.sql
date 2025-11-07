
-- Step 1: Add a user_id column to link requests to the user who created them.
-- Old requests will not have a user_id, so they may not be visible to tenants after this change.
-- We'll also ensure that if a user is deleted, their maintenance requests are also removed.
ALTER TABLE public.maintenance_requests
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Update the property_id column to be a UUID for proper referencing.
-- This will improve data integrity by ensuring it correctly links to the properties table.
ALTER TABLE public.maintenance_requests
ALTER COLUMN property_id TYPE UUID USING property_id::uuid;

-- Add a foreign key constraint to formalize the link to the properties table.
ALTER TABLE public.maintenance_requests
ADD CONSTRAINT fk_property
FOREIGN KEY (property_id)
REFERENCES public.properties(id)
ON DELETE SET NULL;

-- Step 3: Enable Row-Level Security on the table.
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

-- Step 4: Define RLS policies for different user roles.

-- Policy for creating requests: Only tenants can create requests for themselves.
CREATE POLICY "Tenants can create their own maintenance requests"
ON public.maintenance_requests
FOR INSERT
WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'tenant'));

-- Policy for viewing requests: Users can see requests based on their role.
CREATE POLICY "Users can view maintenance requests based on their role"
ON public.maintenance_requests
FOR SELECT
USING (
  -- Admins can see all requests.
  public.is_admin(auth.uid()) OR
  -- Tenants can see their own requests.
  (user_id = auth.uid()) OR
  -- Owners can see requests for their properties.
  (EXISTS (
    SELECT 1 FROM public.properties
    WHERE public.properties.id = public.maintenance_requests.property_id AND public.properties.owner_id = auth.uid()
  )) OR
  -- Agents can see requests for properties they manage.
  (EXISTS (
    SELECT 1 FROM public.properties
    WHERE public.properties.id = public.maintenance_requests.property_id AND public.properties.agent_id = auth.uid()
  ))
);

-- Policy for updating requests: Owners, agents, and admins can update requests.
CREATE POLICY "Owners, agents, and admins can update requests"
ON public.maintenance_requests
FOR UPDATE
USING (
  public.is_admin(auth.uid()) OR
  (EXISTS (
    SELECT 1 FROM public.properties
    WHERE public.properties.id = public.maintenance_requests.property_id AND (public.properties.owner_id = auth.uid() OR public.properties.agent_id = auth.uid())
  ))
);

-- Policy for deleting requests: Only admins can delete requests.
CREATE POLICY "Admins can delete maintenance requests"
ON public.maintenance_requests
FOR DELETE
USING (public.is_admin(auth.uid()));
