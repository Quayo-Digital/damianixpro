
-- Enable Row Level Security on tables used for messaging
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_tenants ENABLE ROW LEVEL SECURITY;

-- Policies for the 'messages' table
-- Allow users to see and manage messages they've sent or received.
CREATE POLICY "Users can manage their own messages"
ON public.messages
FOR ALL
USING (auth.uid() = sender_id OR auth.uid() = recipient_id)
WITH CHECK (auth.uid() = sender_id);

-- Allow admins to view any message.
CREATE POLICY "Admins can view all messages"
ON public.messages
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Policies for the 'tenants' table
-- Allow tenants to see their own profile information.
CREATE POLICY "Tenants can view their own profile"
ON public.tenants
FOR SELECT
USING (user_id = auth.uid());

-- Allow admins to see all tenant profiles.
CREATE POLICY "Admins can view all tenant profiles"
ON public.tenants
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Policies for the 'properties' table
-- Allow any logged-in user to see property information.
CREATE POLICY "Authenticated users can view properties"
ON public.properties
FOR SELECT
USING (auth.role() = 'authenticated');

-- Policies for the 'property_tenants' join table
-- Allow tenants to see their own property assignments.
CREATE POLICY "Tenants can view their property link"
ON public.property_tenants
FOR SELECT
USING (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = property_tenants.tenant_id AND tenants.user_id = auth.uid()));

-- Allow admins to see all property-tenant assignments.
CREATE POLICY "Admins can view all property-tenant links"
ON public.property_tenants
FOR SELECT
USING (public.is_admin(auth.uid()));
