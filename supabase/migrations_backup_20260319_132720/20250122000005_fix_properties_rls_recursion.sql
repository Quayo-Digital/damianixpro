-- Fix Infinite Recursion in RLS Policies
-- Multiple policies were querying tables recursively, causing infinite recursion.
-- This migration fixes all recursive policy issues.

-- ============================================================================
-- CREATE HELPER FUNCTIONS FIRST (before policies that use them)
-- ============================================================================

-- Function to check if user has active lease for property
-- This avoids recursion by using SECURITY DEFINER to bypass RLS
-- Supports both lease_agreements and leases tables
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
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='lease_agreements') THEN
    RETURN EXISTS (
      SELECT 1 FROM public.lease_agreements la
      INNER JOIN public.tenants t ON t.id = la.tenant_id
      WHERE la.property_id = p_property_id AND t.user_id = p_user_id
      AND (UPPER(la.status) = 'ACTIVE' OR (la.end_date IS NULL OR la.end_date >= CURRENT_DATE))
    );
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='leases') THEN
    RETURN EXISTS (
      SELECT 1 FROM public.leases l
      INNER JOIN public.tenants t ON t.id = l.tenant_id
      WHERE l.property_id = p_property_id AND t.user_id = p_user_id
      AND (UPPER(l.status) = 'ACTIVE' OR (l.end_date IS NULL OR l.end_date >= CURRENT_DATE))
    );
  END IF;
  RETURN FALSE;
END;
$$;

-- Function to check property ownership without recursion
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
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='properties' AND column_name='agent_id') THEN
    RETURN EXISTS (SELECT 1 FROM public.properties WHERE id = p_property_id AND (owner_id = p_user_id OR agent_id = p_user_id));
  ELSE
    RETURN EXISTS (SELECT 1 FROM public.properties WHERE id = p_property_id AND owner_id = p_user_id);
  END IF;
END;
$$;

-- ============================================================================
-- PROPERTIES TABLE - Fix tenant access policy (remove recursion)
-- ============================================================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "Tenants can view their properties and available properties" ON public.properties;

-- Recreate without recursion - build policy dynamically (property_tenants may not exist)
DO $pol$
DECLARE
  policy_sql text;
  has_pt boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='property_tenants') INTO has_pt;

  policy_sql := '(auth.uid() IS NULL AND (status IS NULL OR LOWER(status) = ''available'')) OR (auth.uid() IS NOT NULL AND (status IS NULL OR LOWER(status) = ''available'') AND (owner_id IS NULL OR owner_id != auth.uid()))';

  IF has_pt THEN
    policy_sql := policy_sql || ' OR (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.property_tenants pt INNER JOIN public.tenants t ON t.id = pt.tenant_id WHERE pt.property_id = properties.id AND t.user_id = auth.uid() AND (pt.end_date IS NULL OR pt.end_date >= CURRENT_DATE)))';
  END IF;

  policy_sql := policy_sql || ' OR (auth.uid() IS NOT NULL AND public.has_active_lease_for_property(properties.id, auth.uid()))';
  policy_sql := policy_sql || ' OR (EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = ''public'' AND routine_name = ''is_admin'') AND public.is_admin(auth.uid()))';

  EXECUTE format('CREATE POLICY "Tenants can view their properties and available properties" ON public.properties FOR SELECT USING (%s)', policy_sql);
END $pol$;

-- ============================================================================
-- PROPERTIES TABLE - Fix public access policy (remove recursion)
-- ============================================================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "Public can view properties" ON public.properties;

-- Recreate without recursion - use direct column check instead of subquery
CREATE POLICY "Public can view properties" ON public.properties
  FOR SELECT
  USING (
    auth.uid() IS NULL
    OR (auth.uid() IS NOT NULL AND (owner_id IS NULL OR owner_id != auth.uid()))
  );

-- ============================================================================
-- MAINTENANCE_REQUESTS TABLE - Fix policies to avoid recursion (only if exists)
-- ============================================================================

DO $$
DECLARE
  has_user_id boolean;
  tenant_clause text;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='maintenance_requests') THEN
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='maintenance_requests' AND column_name='user_id') INTO has_user_id;
    IF has_user_id THEN
      tenant_clause := 'public.is_admin(auth.uid()) OR (user_id = auth.uid())';
    ELSE
      tenant_clause := 'public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = maintenance_requests.tenant_id AND t.user_id = auth.uid())';
    END IF;
    DROP POLICY IF EXISTS "Users can view maintenance requests based on their role" ON public.maintenance_requests;
    DROP POLICY IF EXISTS "Owners, agents, and admins can update requests" ON public.maintenance_requests;
    DROP POLICY IF EXISTS "Owners and agents can view their property maintenance requests" ON public.maintenance_requests;
    EXECUTE format('CREATE POLICY "Users can view maintenance requests based on their role" ON public.maintenance_requests FOR SELECT USING (%s)', tenant_clause);
    CREATE POLICY "Owners and agents can view their property maintenance requests" ON public.maintenance_requests FOR SELECT
      USING (property_id IS NOT NULL AND public.check_property_access(property_id, auth.uid()));
    CREATE POLICY "Owners, agents, and admins can update requests" ON public.maintenance_requests FOR UPDATE
      USING (public.is_admin(auth.uid()) OR (property_id IS NOT NULL AND public.check_property_access(property_id, auth.uid())));
  END IF;
END $$;

-- ============================================================================
-- LEASE_AGREEMENTS / LEASES TABLE - Ensure no recursion (only if table exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='lease_agreements') THEN
    ALTER TABLE public.lease_agreements ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Tenants can view their leases" ON public.lease_agreements;
    DROP POLICY IF EXISTS "Users can view their lease agreements" ON public.lease_agreements;
    CREATE POLICY "Tenants can view their leases" ON public.lease_agreements FOR SELECT
      USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = lease_agreements.tenant_id AND t.user_id = auth.uid()));
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='leases') THEN
    ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Tenants can view their leases" ON public.leases;
    CREATE POLICY "Tenants can view their leases" ON public.leases FOR SELECT
      USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = leases.tenant_id AND t.user_id = auth.uid()));
  END IF;
END $$;
