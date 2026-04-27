-- Fix public visibility for /public/properties
-- Root cause: mixed status casing ('Available' vs 'AVAILABLE') with strict RLS checks.

BEGIN;

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Normalize existing data so legacy rows become consistently public-visible.
UPDATE public.properties
SET status = 'AVAILABLE'
WHERE status IS NOT NULL
  AND UPPER(status) = 'AVAILABLE';

-- Remove common legacy public-read policies if present.
DROP POLICY IF EXISTS "Anyone can view available properties" ON public.properties;
DROP POLICY IF EXISTS "Public can view properties" ON public.properties;
DROP POLICY IF EXISTS "Authenticated users can view properties" ON public.properties;

-- Recreate a single explicit public-read policy with case-insensitive status guard.
CREATE POLICY "Public can view available properties"
ON public.properties
FOR SELECT
TO anon, authenticated
USING (UPPER(COALESCE(status, '')) = 'AVAILABLE');

COMMIT;

