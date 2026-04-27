-- ============================================================================
-- QUICK FIX: Run this SQL directly in Supabase SQL Editor to fix recursion
-- ============================================================================
-- This fixes the infinite recursion error in RLS policies
-- Copy and paste this entire file into Supabase SQL Editor and click Run

-- Step 1: Create helper functions (must be created first)
CREATE OR REPLACE FUNCTION public.has_active_lease_for_property(
  p_property_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.lease_agreements la
    INNER JOIN public.tenants t ON t.id = la.tenant_id
    WHERE la.property_id = p_property_id
    AND t.user_id = p_user_id
    AND (
      UPPER(la.status) = 'ACTIVE'
      OR (la.end_date IS NULL OR la.end_date >= CURRENT_DATE)
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_property_access(
  p_property_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.properties
    WHERE id = p_property_id 
    AND (owner_id = p_user_id OR agent_id = p_user_id)
  );
END;
$$;

-- Step 2: Fix properties policies
DROP POLICY IF EXISTS "Tenants can view their properties and available properties" ON public.properties;
DROP POLICY IF EXISTS "Public can view properties" ON public.properties;

CREATE POLICY "Tenants can view their properties and available properties" ON public.properties
  FOR SELECT
  USING (
    (auth.uid() IS NULL AND status = 'available')
    OR
    (auth.uid() IS NOT NULL AND status = 'available' AND owner_id != auth.uid())
    OR
    (
      auth.uid() IS NOT NULL
      AND EXISTS (
        SELECT 1 
        FROM public.property_tenants pt
        INNER JOIN public.tenants t ON t.id = pt.tenant_id
        WHERE pt.property_id = properties.id
        AND t.user_id = auth.uid()
        AND (pt.end_date IS NULL OR pt.end_date >= CURRENT_DATE)
      )
    )
    OR
    (
      auth.uid() IS NOT NULL
      AND public.has_active_lease_for_property(properties.id, auth.uid())
    )
    OR
    (
      EXISTS (
        SELECT 1 FROM information_schema.routines
        WHERE routine_schema = 'public'
        AND routine_name = 'is_admin'
      )
      AND public.is_admin(auth.uid())
    )
  );

CREATE POLICY "Public can view properties" ON public.properties
  FOR SELECT
  USING (
    auth.uid() IS NULL
    OR
    (auth.uid() IS NOT NULL AND owner_id != auth.uid())
  );

-- Step 3: Fix maintenance_requests policies
DROP POLICY IF EXISTS "Users can view maintenance requests based on their role" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Owners, agents, and admins can update requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Owners and agents can view their property maintenance requests" ON public.maintenance_requests;

CREATE POLICY "Users can view maintenance requests based on their role" ON public.maintenance_requests
  FOR SELECT
  USING (
    public.is_admin(auth.uid()) OR
    (user_id = auth.uid())
  );

CREATE POLICY "Owners and agents can view their property maintenance requests" ON public.maintenance_requests
  FOR SELECT
  USING (
    property_id IS NOT NULL
    AND public.check_property_access(property_id, auth.uid())
  );

CREATE POLICY "Owners, agents, and admins can update requests" ON public.maintenance_requests
  FOR UPDATE
  USING (
    public.is_admin(auth.uid()) OR
    (property_id IS NOT NULL AND public.check_property_access(property_id, auth.uid()))
  );

-- Step 4: Fix lease_agreements policies
ALTER TABLE public.lease_agreements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenants can view their leases" ON public.lease_agreements;
DROP POLICY IF EXISTS "Users can view their lease agreements" ON public.lease_agreements;

CREATE POLICY "Tenants can view their leases" ON public.lease_agreements
  FOR SELECT
  USING (
    public.is_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 
      FROM public.tenants t
      WHERE t.id = lease_agreements.tenant_id
      AND t.user_id = auth.uid()
    )
  );
