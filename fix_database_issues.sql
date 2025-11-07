-- Fix Database Issues for Nigeria Homes Platform
-- This script addresses the agent role and property creation issues

-- 1. First, let's ensure we have some test users with agent roles
-- Create a test agent user (you'll need to replace with actual user IDs from your auth.users table)

-- Check if we have any users in the system
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM auth.users;
    RAISE NOTICE 'Total users in auth.users: %', user_count;
END $$;

-- 2. Create a test agent user if none exist
-- Note: This creates a user in auth.users - you might want to do this through the Supabase dashboard instead
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'agent@nigeriahomes.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
) ON CONFLICT (email) DO NOTHING;

-- 3. Create profile for the test agent
INSERT INTO public.profiles (
    id,
    full_name,
    email,
    phone,
    role,
    created_at,
    updated_at
)
SELECT 
    u.id,
    'Test Agent',
    'agent@nigeriahomes.com',
    '+234-800-000-0000',
    'agent',
    NOW(),
    NOW()
FROM auth.users u
WHERE u.email = 'agent@nigeriahomes.com'
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    updated_at = NOW();

-- 4. Assign agent role to the test user
INSERT INTO public.user_roles (user_id, role)
SELECT 
    u.id,
    'agent'::public.user_role
FROM auth.users u
WHERE u.email = 'agent@nigeriahomes.com'
ON CONFLICT (user_id) DO UPDATE SET
    role = 'agent'::public.user_role;

-- 5. Ensure properties table has all required columns
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS price DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS bedrooms INTEGER,
ADD COLUMN IF NOT EXISTS bathrooms INTEGER,
ADD COLUMN IF NOT EXISTS squareFeet DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS lease_terms TEXT,
ADD COLUMN IF NOT EXISTS availability_date DATE,
ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS imageUrl TEXT,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8),
ADD COLUMN IF NOT EXISTS agent_commission_rate DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS tour_url TEXT;

-- 6. Create a test property owner user
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'owner@nigeriahomes.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
) ON CONFLICT (email) DO NOTHING;

-- 7. Create profile for the test owner
INSERT INTO public.profiles (
    id,
    full_name,
    email,
    phone,
    role,
    created_at,
    updated_at
)
SELECT 
    u.id,
    'Test Owner',
    'owner@nigeriahomes.com',
    '+234-800-000-0001',
    'owner',
    NOW(),
    NOW()
FROM auth.users u
WHERE u.email = 'owner@nigeriahomes.com'
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    updated_at = NOW();

-- 8. Assign owner role to the test user
INSERT INTO public.user_roles (user_id, role)
SELECT 
    u.id,
    'owner'::public.user_role
FROM auth.users u
WHERE u.email = 'owner@nigeriahomes.com'
ON CONFLICT (user_id) DO UPDATE SET
    role = 'owner'::public.user_role;

-- 9. Verify the setup
SELECT 'Agent users:' as info, COUNT(*) as count FROM public.user_roles WHERE role = 'agent';
SELECT 'Owner users:' as info, COUNT(*) as count FROM public.user_roles WHERE role = 'owner';
SELECT 'Total users:' as info, COUNT(*) as count FROM auth.users;

-- 10. Create a test property
INSERT INTO public.properties (
    name,
    address,
    type,
    price,
    location,
    status,
    description,
    bedrooms,
    bathrooms,
    squareFeet,
    amenities,
    owner_id,
    agent_id,
    created_at,
    updated_at
)
SELECT 
    'Beautiful 3-Bedroom Apartment in Lekki',
    '123 Admiralty Way, Lekki Phase 1, Lagos',
    'apartment',
    250000.00,
    'Lekki, Lagos',
    'available',
    'A modern 3-bedroom apartment with stunning ocean views, fully furnished and ready for immediate occupancy.',
    3,
    2,
    120.00,
    ARRAY['parking', 'security', 'generator', 'air_conditioning', 'balcony'],
    (SELECT id FROM auth.users WHERE email = 'owner@nigeriahomes.com'),
    (SELECT id FROM auth.users WHERE email = 'agent@nigeriahomes.com'),
    NOW(),
    NOW()
ON CONFLICT DO NOTHING;

-- 11. Final verification
SELECT 'Setup complete!' as status;
SELECT 'Test users created:' as info;
SELECT email, role FROM auth.users WHERE email IN ('agent@nigeriahomes.com', 'owner@nigeriahomes.com');
SELECT 'Test property created:' as info;
SELECT name, price, location FROM public.properties LIMIT 1;
