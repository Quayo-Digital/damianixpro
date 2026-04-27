-- Enable Row Level Security on the properties table
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Properties are viewable by everyone" ON public.properties;
DROP POLICY IF EXISTS "Owners can create properties" ON public.properties;
DROP POLICY IF EXISTS "Owners or assigned agents can update properties" ON public.properties;
DROP POLICY IF EXISTS "Owners or admins can delete properties" ON public.properties;

CREATE POLICY "Properties are viewable by everyone"
ON public.properties FOR SELECT
USING (true);

CREATE POLICY "Owners can create properties"
ON public.properties FOR INSERT
WITH CHECK (
  owner_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text IN ('owner', 'admin')
  )
);

CREATE POLICY "Owners or assigned agents can update properties"
ON public.properties FOR UPDATE
USING ( auth.uid() = owner_id OR auth.uid() = agent_id OR public.is_admin(auth.uid()) )
WITH CHECK ( auth.uid() = owner_id OR auth.uid() = agent_id OR public.is_admin(auth.uid()) );

CREATE POLICY "Owners or admins can delete properties"
ON public.properties FOR DELETE
USING ( auth.uid() = owner_id OR public.is_admin(auth.uid()) );
