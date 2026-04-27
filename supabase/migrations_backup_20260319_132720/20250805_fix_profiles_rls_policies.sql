-- Fix Profiles Table RLS Policies
-- Allow admins and authenticated users to create/manage profiles

-- Drop existing policies on profiles table to recreate them
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can create profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can create profiles" ON public.profiles;

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- CREATE policies for profiles table

-- 1. INSERT policy - Allow admins and authenticated users to create profiles
CREATE POLICY "Authenticated users can create profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
    -- Allow if user is admin OR creating their own profile
    public.is_admin(auth.uid()) OR 
    (auth.uid() = id)
);

-- 2. SELECT policy - Users can view their own profile, admins can view all
CREATE POLICY "Users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    (auth.uid() = id) OR 
    public.is_admin(auth.uid())
);

-- 3. UPDATE policy - Users can update their own profile, admins can update all
CREATE POLICY "Users can update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    (auth.uid() = id) OR 
    public.is_admin(auth.uid())
)
WITH CHECK (
    (auth.uid() = id) OR 
    public.is_admin(auth.uid())
);

-- 4. DELETE policy - Only admins can delete profiles
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Add helpful comments
COMMENT ON POLICY "Authenticated users can create profiles" ON public.profiles IS 'Allows admins to create any profile and users to create their own profile';
COMMENT ON POLICY "Users can view profiles" ON public.profiles IS 'Users can view their own profile, admins can view all profiles';
COMMENT ON POLICY "Users can update profiles" ON public.profiles IS 'Users can update their own profile, admins can update all profiles';
COMMENT ON POLICY "Admins can delete profiles" ON public.profiles IS 'Only admins can delete profiles';

-- Verify the policies were created
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    -- Count policies on profiles table
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'profiles' AND schemaname = 'public';
    
    RAISE NOTICE 'Created % RLS policies on profiles table', policy_count;
    
    IF policy_count < 4 THEN
        RAISE WARNING 'Expected at least 4 policies on profiles table, but found %', policy_count;
    END IF;
END $$;
