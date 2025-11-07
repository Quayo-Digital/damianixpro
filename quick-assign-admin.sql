-- =====================================================
-- QUICK ASSIGN ADMIN ROLE
-- =====================================================
-- This script assigns admin role to the most recently created user
-- =====================================================

DO $$
DECLARE
    latest_user_id UUID;
    latest_user_email TEXT;
BEGIN
    -- Get the most recently created user
    SELECT id, email INTO latest_user_id, latest_user_email
    FROM auth.users
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Check if user exists
    IF latest_user_id IS NULL THEN
        RAISE EXCEPTION 'No users found. Please create a user first.';
    END IF;
    
    -- Assign admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (latest_user_id, 'admin'::user_role)
    ON CONFLICT (user_id) 
    DO UPDATE SET role = 'admin'::user_role;
    
    RAISE NOTICE 'Successfully assigned admin role to: %', latest_user_email;
    RAISE NOTICE 'User ID: %', latest_user_id;
END $$;

-- Verify
SELECT 
    u.email,
    ur.role,
    u.created_at
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id;

