-- Quick Fix: Update RLS Policies for listing_pricing table
-- Run this in your Supabase SQL Editor to fix the INSERT permission issue

-- Drop and recreate the policy with proper WITH CHECK clause
DROP POLICY IF EXISTS "Owners can manage pricing" ON listing_pricing;

-- Recreate with both USING and WITH CHECK for INSERT/UPDATE/DELETE
CREATE POLICY "Owners can manage pricing" ON listing_pricing
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      JOIN properties p ON l.property_id = p.id
      WHERE l.id = listing_pricing.listing_id
      AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings l
      JOIN properties p ON l.property_id = p.id
      WHERE l.id = listing_pricing.listing_id
      AND p.owner_id = auth.uid()
    )
  );

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'listing_pricing' 
AND policyname = 'Owners can manage pricing';
