-- Fix vendor_jobs RLS policy to allow vendors to create jobs
-- This migration updates the RLS policy to allow vendors to create and manage their own jobs

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Vendor jobs management" ON public.vendor_jobs;

-- Create a new policy that allows vendors to create jobs for themselves
CREATE POLICY "Vendor jobs management"
ON public.vendor_jobs
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('admin', 'owner', 'agent')
    ) OR  -- Admins, owners, and agents can manage all jobs
    EXISTS (
        SELECT 1 FROM public.vendors v 
        WHERE v.id = vendor_id AND v.user_id = auth.uid()
    )  -- Vendors can create and manage their own jobs
);

-- Verification
DO $$
BEGIN
    RAISE NOTICE 'Updated vendor_jobs RLS policy to allow vendors to create their own jobs';
    RAISE NOTICE 'Policy now allows: admins, owners, agents (all jobs) + vendors (own jobs only)';
END $$;
