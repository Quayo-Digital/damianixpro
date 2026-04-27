-- Fix Agents RLS Policies to Allow Owners to View Agents
-- This allows property owners to view and select agents for property assignment

-- Only run agents RLS if agents table exists (created later in 20250806)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agents') THEN
    DROP POLICY IF EXISTS "Users can view agent records" ON public.agents;
    DROP POLICY IF EXISTS "Users, owners, and admins can view agent records" ON public.agents;

    CREATE POLICY "Users, owners, and admins can view agent records"
    ON public.agents
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id OR
        EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'super_admin')) OR
        EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'owner')
    );
  END IF;
END $$;

-- Also ensure user_roles table allows owners to query agent roles
-- Check if user_roles has RLS enabled and what policies exist
DO $$
BEGIN
    -- Check if user_roles has RLS enabled
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'user_roles'
    ) THEN
        -- Enable RLS if not already enabled
        ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they're too restrictive
        DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
        DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;
        DROP POLICY IF EXISTS "Authenticated users can view user roles" ON public.user_roles;
        
        -- Create permissive SELECT policy for authenticated users
        -- This allows owners to query for agents
        CREATE POLICY "Authenticated users can view user roles"
        ON public.user_roles
        FOR SELECT
        TO authenticated
        USING (true); -- Allow all authenticated users to view roles (needed for agent selection)
    END IF;
END $$;

-- Fix profiles table RLS to allow owners to view agent profiles
-- Drop existing SELECT policies (both old and new names)
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users, owners, and admins can view profiles" ON public.profiles;

-- Create a helper function to check if a user is an owner
CREATE OR REPLACE FUNCTION public.is_owner(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = $1
        AND ur.role = 'owner'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a helper function to check if a user is an agent
CREATE OR REPLACE FUNCTION public.is_agent(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = $1
        AND ur.role = 'agent'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create is_admin if not exists (used by profiles policy)
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = check_user_id
        AND ur.role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new SELECT policy that allows:
-- 1. Users to view their own profile
-- 2. Admins to view all profiles
-- 3. Owners to view agent profiles (for property assignment)
CREATE POLICY "Users, owners, and admins can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    -- Users can view their own profile
    (auth.uid() = id) OR 
    -- Admins can view all
    public.is_admin(auth.uid()) OR
    -- Owners can view profiles of users who have 'agent' role
    (public.is_owner() AND public.is_agent(id))
);

