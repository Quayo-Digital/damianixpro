-- Quick Fix: Allow Owners to View Agent Profiles
-- Run this in Supabase SQL Editor to fix agent profile loading issue

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users, owners, and admins can view profiles" ON public.profiles;

-- Ensure helper functions exist (idempotent)
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
