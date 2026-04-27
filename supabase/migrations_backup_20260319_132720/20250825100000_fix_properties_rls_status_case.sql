-- Fix properties RLS: status check used 'available' but DB stores 'AVAILABLE'
-- Use UPPER() for case-insensitive match so both work

DROP POLICY IF EXISTS "Tenants can view their properties and available properties" ON public.properties;

CREATE POLICY "Tenants can view their properties and available properties" ON public.properties
  FOR SELECT
  USING (
    (auth.uid() IS NULL AND (UPPER(COALESCE(status, '')) = 'AVAILABLE' OR status = 'available'))
    OR
    (auth.uid() IS NOT NULL AND (UPPER(COALESCE(status, '')) = 'AVAILABLE' OR status = 'available') AND (owner_id IS NULL OR owner_id != auth.uid()))
    OR
    (auth.uid() IS NOT NULL AND owner_id = auth.uid())
    OR
    (EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'is_admin') AND public.is_admin(auth.uid()))
  );
