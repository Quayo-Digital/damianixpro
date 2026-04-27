-- Allow Tenant Access to Properties
-- Tenants should be able to view:
-- 1. Properties they're renting (via property_tenants or leases)
-- 2. Shortlet listings (for browsing and their bookings)
-- 3. Available properties for browsing

-- Ensure properties has status column (remote DB may have been created from older schema)
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'AVAILABLE';

-- ============================================================================
-- PROPERTIES TABLE - Allow tenant access
-- ============================================================================

-- Drop existing public policy to recreate with tenant support
DROP POLICY IF EXISTS "Public can view properties" ON public.properties;
DROP POLICY IF EXISTS "Tenants can view their properties and available properties" ON public.properties;

-- Create policy (only references tables that exist - property_tenants/lease_agreements may not exist yet)
DO $policy$
DECLARE
  policy_sql text;
  has_pt boolean;
  has_la boolean;
  has_leases boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='property_tenants') INTO has_pt;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='lease_agreements') INTO has_la;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='leases') INTO has_leases;

  policy_sql := '(auth.uid() IS NULL AND (status IS NULL OR LOWER(status) = ''available'')) OR (auth.uid() IS NOT NULL AND (status IS NULL OR LOWER(status) = ''available'') AND (owner_id IS NULL OR owner_id != auth.uid()))';

  IF has_pt THEN
    policy_sql := policy_sql || ' OR (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.property_tenants pt INNER JOIN public.tenants t ON t.id = pt.tenant_id WHERE pt.property_id = properties.id AND t.user_id = auth.uid() AND (pt.end_date IS NULL OR pt.end_date >= CURRENT_DATE)))';
  END IF;

  IF has_la THEN
    policy_sql := policy_sql || ' OR (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.lease_agreements la INNER JOIN public.tenants t ON t.id = la.tenant_id WHERE la.property_id = properties.id AND t.user_id = auth.uid() AND (UPPER(la.status) = ''ACTIVE'' OR (la.end_date IS NULL OR la.end_date >= CURRENT_DATE))))';
  ELSIF has_leases THEN
    policy_sql := policy_sql || ' OR (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.leases l INNER JOIN public.tenants t ON t.id = l.tenant_id WHERE l.property_id = properties.id AND t.user_id = auth.uid() AND (UPPER(l.status) = ''ACTIVE'' OR (l.end_date IS NULL OR l.end_date >= CURRENT_DATE))))';
  END IF;

  policy_sql := policy_sql || ' OR (EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = ''public'' AND routine_name = ''is_admin'') AND public.is_admin(auth.uid()))';

  EXECUTE format('CREATE POLICY "Tenants can view their properties and available properties" ON public.properties FOR SELECT USING (%s)', policy_sql);
END $policy$;

-- ============================================================================
-- LISTINGS TABLE - Allow tenant access to shortlet listings
-- ============================================================================

-- Drop existing public policy if it exists
DROP POLICY IF EXISTS "Public can view listings" ON public.listings;
DROP POLICY IF EXISTS "Tenants can view available listings" ON public.listings;
DROP POLICY IF EXISTS "Tenants can view listings and their bookings" ON public.listings;

-- Allow tenants to view:
-- 1. All active listings (for browsing shortlets)
-- 2. Listings they have bookings for
CREATE POLICY "Tenants can view listings and their bookings" ON public.listings
  FOR SELECT
  USING (
    -- Unauthenticated users can view active listings
    (auth.uid() IS NULL AND active = true)
    OR
    -- Authenticated users (tenants) can view active listings
    (auth.uid() IS NOT NULL AND active = true)
    OR
    -- Tenants can view listings they have bookings for
    (
      auth.uid() IS NOT NULL
      AND EXISTS (
        SELECT 1 
        FROM public.bookings b
        INNER JOIN public.profiles p ON p.id = b.guest_id
        WHERE b.listing_id = listings.id
        AND p.id = auth.uid()
      )
    )
    OR
    -- Owners can view their own listings (handled by owner policy)
    (
      EXISTS (
        SELECT 1 
        FROM public.properties prop
        WHERE prop.id = listings.property_id
        AND prop.owner_id = auth.uid()
      )
    )
    OR
    -- Admins can view all listings
    (
      EXISTS (
        SELECT 1 FROM information_schema.routines
        WHERE routine_schema = 'public'
        AND routine_name = 'is_admin'
      )
      AND public.is_admin(auth.uid())
    )
  );

-- ============================================================================
-- BOOKINGS TABLE - Allow tenants to view their bookings
-- ============================================================================

-- Ensure bookings table has RLS enabled
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing booking policies if they exist
DROP POLICY IF EXISTS "Tenants can view their bookings" ON public.bookings;
DROP POLICY IF EXISTS "Guests can view their bookings" ON public.bookings;

-- Allow tenants/guests to view their own bookings
CREATE POLICY "Guests can view their bookings" ON public.bookings
  FOR SELECT
  USING (
    -- Guests can view their own bookings
    (
      auth.uid() IS NOT NULL
      AND EXISTS (
        SELECT 1 
        FROM public.profiles p
        WHERE p.id = bookings.guest_id
        AND p.id = auth.uid()
      )
    )
    OR
    -- Owners can view bookings for their listings
    (
      auth.uid() IS NOT NULL
      AND EXISTS (
        SELECT 1 
        FROM public.listings l
        INNER JOIN public.properties prop ON prop.id = l.property_id
        WHERE l.id = bookings.listing_id
        AND prop.owner_id = auth.uid()
      )
    )
    OR
    -- Admins can view all bookings
    (
      EXISTS (
        SELECT 1 FROM information_schema.routines
        WHERE routine_schema = 'public'
        AND routine_name = 'is_admin'
      )
      AND public.is_admin(auth.uid())
    )
  );
