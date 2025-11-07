-- Fix Tenants Table RLS Policies
-- Add missing INSERT and UPDATE policies for tenants table

-- Allow authenticated users to create their own tenant profile
CREATE POLICY "Users can create their own tenant profile"
ON public.tenants
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow tenants to update their own profile
CREATE POLICY "Tenants can update their own profile"
ON public.tenants
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow admins to create tenant profiles for any user
CREATE POLICY "Admins can create tenant profiles"
ON public.tenants
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- Allow admins to update any tenant profile
CREATE POLICY "Admins can update tenant profiles"
ON public.tenants
FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Allow admins to delete tenant profiles
CREATE POLICY "Admins can delete tenant profiles"
ON public.tenants
FOR DELETE
USING (public.is_admin(auth.uid()));

-- Create a function to check if a user can create a tenant profile
-- This ensures users can only create one tenant profile per user_id
CREATE OR REPLACE FUNCTION public.can_create_tenant_profile(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user already has a tenant profile
    IF EXISTS (SELECT 1 FROM public.tenants WHERE user_id = target_user_id) THEN
        RETURN FALSE;
    END IF;
    
    -- Allow if user is creating their own profile or if user is admin
    RETURN (auth.uid() = target_user_id OR public.is_admin(auth.uid()));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the INSERT policy to use the function for better validation
DROP POLICY IF EXISTS "Users can create their own tenant profile" ON public.tenants;

CREATE POLICY "Users can create their own tenant profile"
ON public.tenants
FOR INSERT
WITH CHECK (public.can_create_tenant_profile(user_id));

-- Add a trigger to automatically set user_id if not provided
CREATE OR REPLACE FUNCTION public.set_tenant_user_id()
RETURNS TRIGGER AS $$
BEGIN
    -- If user_id is not set, use the current authenticated user
    IF NEW.user_id IS NULL THEN
        NEW.user_id := auth.uid();
    END IF;
    
    -- Ensure email matches the authenticated user's email if creating own profile
    IF NEW.user_id = auth.uid() THEN
        NEW.email := COALESCE(NEW.email, auth.email());
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS set_tenant_user_id_trigger ON public.tenants;
CREATE TRIGGER set_tenant_user_id_trigger
    BEFORE INSERT ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION public.set_tenant_user_id();

-- Add some helpful comments
COMMENT ON POLICY "Users can create their own tenant profile" ON public.tenants IS 'Allows authenticated users to create their own tenant profile, preventing duplicate profiles';
COMMENT ON POLICY "Tenants can update their own profile" ON public.tenants IS 'Allows tenants to update their own profile information';
COMMENT ON POLICY "Admins can create tenant profiles" ON public.tenants IS 'Allows admins to create tenant profiles for any user';
COMMENT ON POLICY "Admins can update tenant profiles" ON public.tenants IS 'Allows admins to update any tenant profile';
COMMENT ON POLICY "Admins can delete tenant profiles" ON public.tenants IS 'Allows admins to delete tenant profiles';

-- Log the migration completion
DO $$
BEGIN
    RAISE NOTICE 'Tenants table RLS policies have been created successfully. Users can now create and update tenant profiles.';
END $$;
