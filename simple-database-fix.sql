-- Simple Database Fix for Nigeria Homes App
-- This script fixes the database schema issues without creating users

-- Step 1: Check current database state
SELECT 'Current state check:' as info;
SELECT COUNT(*) as total_users FROM auth.users;
SELECT COUNT(*) as total_profiles FROM public.profiles;
SELECT COUNT(*) as total_user_roles FROM public.user_roles;
SELECT COUNT(*) as total_properties FROM public.properties;

-- Step 2: Ensure all required columns exist in properties table
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

-- Step 3: Check if we have any agent users
SELECT 'Checking for agent users:' as info;
SELECT COUNT(*) as agent_count FROM public.user_roles WHERE role = 'agent';

-- Step 4: If you need to create an agent user, do it manually:
-- Go to Supabase Dashboard > Authentication > Users > Add User
-- Email: agent@nigeriahomes.com
-- Password: password123
-- Confirm email: Yes

-- Step 5: After creating the agent user, run this to set up their profile and role
-- (Only run this if you created the agent user above)
INSERT INTO public.profiles (id, email, phone, created_at, updated_at)
SELECT 
    u.id,
    'agent@nigeriahomes.com',
    '+234-800-000-0000',
    NOW(),
    NOW()
FROM auth.users u
WHERE u.email = 'agent@nigeriahomes.com'
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    updated_at = NOW();

-- Assign agent role
INSERT INTO public.user_roles (user_id, role)
SELECT 
    u.id,
    'agent'::public.user_role
FROM auth.users u
WHERE u.email = 'agent@nigeriahomes.com'
ON CONFLICT (user_id) DO UPDATE SET
    role = 'agent'::public.user_role;

-- Step 6: Create a test property (only if agent user exists)
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
    (SELECT id FROM auth.users WHERE email = 'owner@nigeriahomes.com' LIMIT 1),
    (SELECT id FROM auth.users WHERE email = 'agent@nigeriahomes.com' LIMIT 1),
    NOW(),
    NOW()
WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = 'agent@nigeriahomes.com')
  AND NOT EXISTS (
    SELECT 1 FROM public.properties 
    WHERE name = 'Beautiful 3-Bedroom Apartment in Lekki'
  );

-- Step 7: Final verification
SELECT 'Final verification:' as info;
SELECT 'Agent users:' as info, COUNT(*) as count FROM public.user_roles WHERE role = 'agent';
SELECT 'Owner users:' as info, COUNT(*) as count FROM public.user_roles WHERE role = 'owner';
SELECT 'Properties:' as info, COUNT(*) as count FROM public.properties;
SELECT 'Database schema fixed! You can now create properties.' as status;

