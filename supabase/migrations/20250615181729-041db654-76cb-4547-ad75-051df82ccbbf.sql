
-- Enable Row Level Security on the properties table
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view properties (for public listings)
CREATE POLICY "Properties are viewable by everyone"
ON public.properties FOR SELECT
USING (true);

-- Allow owners and admins to create new properties
CREATE POLICY "Owners can create properties"
ON public.properties FOR INSERT
WITH CHECK ( (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin')) AND owner_id = auth.uid() );

-- Allow owners, assigned agents, or admins to update properties
CREATE POLICY "Owners or assigned agents can update properties"
ON public.properties FOR UPDATE
USING ( auth.uid() = owner_id OR auth.uid() = agent_id OR is_admin(auth.uid()) )
WITH CHECK ( auth.uid() = owner_id OR auth.uid() = agent_id OR is_admin(auth.uid()) );

-- Allow owners or admins to delete properties
CREATE POLICY "Owners or admins can delete properties"
ON public.properties FOR DELETE
USING ( auth.uid() = owner_id OR is_admin(auth.uid()) );
