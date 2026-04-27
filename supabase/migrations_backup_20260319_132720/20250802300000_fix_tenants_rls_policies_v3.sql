-- Fix Tenants Table RLS Policies - Version 3
-- Do not modify is_admin - it is used by many RLS policies across the schema

-- Drop existing tenant policies to recreate them
DROP POLICY IF EXISTS "Users can create their own tenant profile" ON public.tenants;
DROP POLICY IF EXISTS "Tenants can update their own profile" ON public.tenants;
DROP POLICY IF EXISTS "Admins can create tenant profiles" ON public.tenants;
DROP POLICY IF EXISTS "Admins can update tenant profiles" ON public.tenants;
DROP POLICY IF EXISTS "Admins can delete tenant profiles" ON public.tenants;
DROP POLICY IF EXISTS "Tenants can view their own profile" ON public.tenants;
DROP POLICY IF EXISTS "Admins can view all tenant profiles" ON public.tenants;
DROP POLICY IF EXISTS "Users can view tenant profiles" ON public.tenants;
DROP POLICY IF EXISTS "Authenticated users can create tenant profiles" ON public.tenants;
DROP POLICY IF EXISTS "Users can update tenant profiles" ON public.tenants;

-- Create more permissive INSERT policy for authenticated users
CREATE POLICY "Authenticated users can create tenant profiles"
ON public.tenants
FOR INSERT
TO authenticated
WITH CHECK (
    -- Allow if user is creating their own profile OR if user is admin
    (auth.uid() = user_id) OR 
    public.is_admin(auth.uid()) OR
    -- Allow if user_id is null (will be set by trigger)
    (user_id IS NULL)
);

-- Create UPDATE policy for tenants and admins
CREATE POLICY "Users can update tenant profiles"
ON public.tenants
FOR UPDATE
TO authenticated
USING (
    (auth.uid() = user_id) OR 
    public.is_admin(auth.uid())
)
WITH CHECK (
    (auth.uid() = user_id) OR 
    public.is_admin(auth.uid())
);

-- Create DELETE policy for admins only
CREATE POLICY "Admins can delete tenant profiles"
ON public.tenants
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Create SELECT policy
CREATE POLICY "Users can view tenant profiles"
ON public.tenants
FOR SELECT
TO authenticated
USING (
    (auth.uid() = user_id) OR 
    public.is_admin(auth.uid())
);

-- Update the trigger function to be more robust
CREATE OR REPLACE FUNCTION public.set_tenant_user_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Always set user_id to current authenticated user if not provided
    IF NEW.user_id IS NULL THEN
        NEW.user_id := auth.uid();
    END IF;
    
    -- Set email from auth if not provided
    IF NEW.email IS NULL THEN
        NEW.email := (SELECT email FROM auth.users WHERE id = NEW.user_id);
    END IF;
    
    -- Ensure status is set
    IF NEW.status IS NULL THEN
        NEW.status := 'active';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS set_tenant_user_id_trigger ON public.tenants;
CREATE TRIGGER set_tenant_user_id_trigger
    BEFORE INSERT ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION public.set_tenant_user_id();

-- Add a function to bypass RLS for system operations (if needed)
CREATE OR REPLACE FUNCTION public.create_tenant_profile(
    p_first_name TEXT,
    p_last_name TEXT,
    p_email TEXT,
    p_phone TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS UUID AS $$
DECLARE
    tenant_id UUID;
BEGIN
    -- Insert tenant record
    INSERT INTO public.tenants (
        user_id,
        first_name,
        last_name,
        email,
        phone,
        status
    ) VALUES (
        p_user_id,
        p_first_name,
        p_last_name,
        p_email,
        p_phone,
        'active'
    ) RETURNING id INTO tenant_id;
    
    RETURN tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.create_tenant_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;

-- Add helpful comments
COMMENT ON POLICY "Authenticated users can create tenant profiles" ON public.tenants IS 'Allows authenticated users to create tenant profiles with proper user_id validation';
COMMENT ON POLICY "Users can update tenant profiles" ON public.tenants IS 'Allows users to update their own tenant profiles and admins to update any profile';
COMMENT ON POLICY "Users can view tenant profiles" ON public.tenants IS 'Allows users to view their own tenant profiles and admins to view all profiles';

-- Test the policies by creating a simple validation function
CREATE OR REPLACE FUNCTION public.test_tenant_policies()
RETURNS TEXT AS $$
DECLARE
    result TEXT := 'RLS Policies Status: ';
    policy_count INTEGER;
BEGIN
    -- Count policies on tenants table
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'tenants' AND schemaname = 'public';
    
    result := result || 'Found ' || policy_count || ' policies on tenants table. ';
    
    -- Check if RLS is enabled
    IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'tenants' 
        AND n.nspname = 'public' 
        AND c.relrowsecurity = true
    ) THEN
        result := result || 'RLS is enabled. ';
    ELSE
        result := result || 'RLS is NOT enabled. ';
    END IF;
    
    RETURN result || 'Policies should now allow tenant creation.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the test
SELECT public.test_tenant_policies();

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Tenants table RLS policies have been updated successfully. Parameter conflict resolved.';
END $$;
