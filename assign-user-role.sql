-- =====================================================
-- ASSIGN USER ROLE SCRIPT
-- =====================================================
-- This script helps you assign a role to a user
-- =====================================================

-- Step 1: Replace 'YOUR_EMAIL_HERE' with the actual user email
-- Example: WHERE email = 'admin@nigeriahomes.com'

-- First, let's see all users and their current roles
SELECT 
    u.id as user_id,
    u.email,
    u.created_at as user_created,
    ur.role as current_role
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
ORDER BY u.created_at DESC;

-- Step 2: Assign role to a specific user
-- Replace 'USER_EMAIL_HERE' with the email address
-- Replace 'admin' with the desired role: 'admin', 'owner', 'agent', 'tenant', or 'vendor'

DO $$
DECLARE
    target_email TEXT := 'USER_EMAIL_HERE';  -- CHANGE THIS to the user's email
    target_role TEXT := 'admin';  -- CHANGE THIS to: 'admin', 'owner', 'agent', 'tenant', or 'vendor'
    user_uuid UUID;
BEGIN
    -- Get the user ID from email
    SELECT id INTO user_uuid 
    FROM auth.users 
    WHERE email = target_email;
    
    -- Check if user exists
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', target_email;
    END IF;
    
    -- Insert or update the role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (user_uuid, target_role::user_role)
    ON CONFLICT (user_id) 
    DO UPDATE SET role = target_role::user_role;
    
    RAISE NOTICE 'Successfully assigned role "%" to user: %', target_role, target_email;
END $$;

-- Step 3: Verify the role was assigned
SELECT 
    u.email,
    ur.role,
    u.created_at
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
ORDER BY u.created_at DESC;

