-- Quick Fix: Restrict Properties and Listings Operations to Owners Only
-- Run this in Supabase SQL Editor to fix tenant permission issues

-- ============================================================================
-- PROPERTIES TABLE - Ensure strict INSERT/UPDATE/DELETE policies
-- ============================================================================

-- Drop existing policies to recreate with strict checks
DROP POLICY IF EXISTS "Owners can create properties" ON public.properties;
DROP POLICY IF EXISTS "Owners or assigned agents can update properties" ON public.properties;
DROP POLICY IF EXISTS "Owners or admins can delete properties" ON public.properties;

-- INSERT policy - Only owners can create properties
CREATE POLICY "Owners can create properties" ON public.properties
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND owner_id = auth.uid()
    AND EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'owner'
    )
  );

-- UPDATE policy - Only owners, assigned agents, or admins can update
CREATE POLICY "Owners or assigned agents can update properties" ON public.properties
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND (
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
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
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
    auth.uid() IS NOT NULL
    AND (
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
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'owner'
    )
    AND EXISTS (
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
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'owner'
    )
    AND EXISTS (
      SELECT 1 
      FROM public.properties p
      WHERE p.id = listings.property_id
      AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'owner'
    )
    AND EXISTS (
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
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'owner'
    )
    AND EXISTS (
      SELECT 1 
      FROM public.properties p
      WHERE p.id = listings.property_id
      AND p.owner_id = auth.uid()
    )
  );
