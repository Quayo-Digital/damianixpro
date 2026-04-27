-- Fix User Roles Automation - Simplified Approach
-- This migration ensures that all users have proper roles assigned

-- Step 1: Simply assign default 'user' role to any profiles missing roles
-- This is a safe, direct approach that avoids auth schema permissions
INSERT INTO public.user_roles (user_id, role)
SELECT 
    p.id,
    'user'::public.user_role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
WHERE ur.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Step 2: Add a comment about the existing trigger
-- Note: The existing handle_new_user trigger should already handle role assignment
-- for new users. This migration only fixes existing users who are missing roles.

-- The existing trigger function should work for future signups.
-- If there are still issues with new user role assignment, 
-- they can be addressed through the application layer or manual assignment.
