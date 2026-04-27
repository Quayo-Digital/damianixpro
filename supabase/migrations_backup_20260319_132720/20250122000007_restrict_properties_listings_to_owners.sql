-- Restrict Properties and Listings Operations to Owners Only
-- This ensures tenants cannot create, update, or delete properties/listings
-- Even if they somehow bypass UI restrictions, RLS will block them

-- ============================================================================
-- PROPERTIES TABLE - Ensure strict INSERT/UPDATE/DELETE policies
-- ============================================================================

-- Drop existing policies to recreate with strict checks
DROP POLICY IF EXISTS "Owners can create properties" ON public.properties;
DROP POLICY IF EXISTS "Owners or assigned agents can update properties" ON public.properties;
DROP POLICY IF EXISTS "Owners or admins can delete properties" ON public.properties;

-- INSERT policy - Only owners can create properties
-- Must verify: 1) user is owner, 2) owner_id matches auth.uid()
CREATE POLICY "Owners can create properties" ON public.properties
  FOR INSERT
  WITH CHECK (
    -- Must be authenticated
    auth.uid() IS NOT NULL
    AND
    -- owner_id must match authenticated user
    owner_id = auth.uid()
    AND
    -- Verify user has 'owner' role in user_roles table
    EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'owner'
    )
  );

-- UPDATE policy - Only owners, assigned agents, or admins can update
-- Must verify ownership or agent assignment
CREATE POLICY "Owners or assigned agents can update properties" ON public.properties
  FOR UPDATE
  USING (
    -- Must be authenticated
    auth.uid() IS NOT NULL
    AND
    (
      -- Owner can update their own properties
      (
        owner_id = auth.uid()
        AND EXISTS (
          SELECT 1 
          FROM public.user_roles ur
          WHERE ur.user_id = auth.uid()
          AND ur.role = 'owner'
        )
      )
      OR
      -- Assigned agent can update
      (
        agent_id = auth.uid()
        AND EXISTS (
          SELECT 1 
          FROM public.user_roles ur
          WHERE ur.user_id = auth.uid()
          AND ur.role = 'agent'
        )
      )
      OR
      -- Admin can update
      public.is_admin(auth.uid())
    )
  )
  WITH CHECK (
    -- Same checks for WITH CHECK clause
    auth.uid() IS NOT NULL
    AND
    (
      (
        owner_id = auth.uid()
        AND EXISTS (
          SELECT 1 
          FROM public.user_roles ur
          WHERE ur.user_id = auth.uid()
          AND ur.role = 'owner'
        )
      )
      OR
      (
        agent_id = auth.uid()
        AND EXISTS (
          SELECT 1 
          FROM public.user_roles ur
          WHERE ur.user_id = auth.uid()
          AND ur.role = 'agent'
        )
      )
      OR
      public.is_admin(auth.uid())
    )
  );

-- DELETE policy - Only owners or admins can delete
CREATE POLICY "Owners or admins can delete properties" ON public.properties
  FOR DELETE
  USING (
    -- Must be authenticated
    auth.uid() IS NOT NULL
    AND
    (
      -- Owner can delete their own properties
      (
        owner_id = auth.uid()
        AND EXISTS (
          SELECT 1 
          FROM public.user_roles ur
          WHERE ur.user_id = auth.uid()
          AND ur.role = 'owner'
        )
      )
      OR
      -- Admin can delete
      public.is_admin(auth.uid())
    )
  );

-- ============================================================================
-- LISTINGS TABLE - Ensure strict INSERT/UPDATE/DELETE policies
-- ============================================================================

-- Drop existing policies to recreate with strict checks
DROP POLICY IF EXISTS "Owners can create listings for their properties" ON public.listings;
DROP POLICY IF EXISTS "Owners can update their own listings" ON public.listings;
DROP POLICY IF EXISTS "Owners can delete their own listings" ON public.listings;

-- INSERT policy - Only owners can create listings for their properties
CREATE POLICY "Owners can create listings for their properties" ON public.listings
  FOR INSERT
  WITH CHECK (
    -- Must be authenticated
    auth.uid() IS NOT NULL
    AND
    -- Verify user has 'owner' role
    EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'owner'
    )
    AND
    -- Verify the property belongs to the authenticated user
    EXISTS (
      SELECT 1 
      FROM public.properties p
      WHERE p.id = listings.property_id
      AND p.owner_id = auth.uid()
    )
  );

-- UPDATE policy - Only owners can update their listings
CREATE POLICY "Owners can update their own listings" ON public.listings
  FOR UPDATE
  USING (
    -- Must be authenticated
    auth.uid() IS NOT NULL
    AND
    -- Verify user has 'owner' role
    EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'owner'
    )
    AND
    -- Verify the property belongs to the authenticated user
    EXISTS (
      SELECT 1 
      FROM public.properties p
      WHERE p.id = listings.property_id
      AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Same checks for WITH CHECK clause
    auth.uid() IS NOT NULL
    AND
    EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'owner'
    )
    AND
    EXISTS (
      SELECT 1 
      FROM public.properties p
      WHERE p.id = listings.property_id
      AND p.owner_id = auth.uid()
    )
  );

-- DELETE policy - Only owners can delete their listings
CREATE POLICY "Owners can delete their own listings" ON public.listings
  FOR DELETE
  USING (
    -- Must be authenticated
    auth.uid() IS NOT NULL
    AND
    -- Verify user has 'owner' role
    EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'owner'
    )
    AND
    -- Verify the property belongs to the authenticated user
    EXISTS (
      SELECT 1 
      FROM public.properties p
      WHERE p.id = listings.property_id
      AND p.owner_id = auth.uid()
    )
  );
