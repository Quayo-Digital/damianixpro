-- Simple Fix for Nigeria Homes App Issues
-- Run this in your Supabase SQL Editor

-- 1. Create test agent user (you'll need to do this through Supabase Auth dashboard)
-- Go to Authentication > Users > Add User
-- Email: agent@nigeriahomes.com
-- Password: password123
-- Confirm email: Yes

-- 2. Create test owner user (you'll need to do this through Supabase Auth dashboard)  
-- Go to Authentication > Users > Add User
-- Email: owner@nigeriahomes.com
-- Password: password123
-- Confirm email: Yes

-- 3. After creating the users above, run this SQL to set up their profiles and roles:

-- First, let's see what users we have
SELECT id, email FROM auth.users WHERE email IN ('agent@nigeriahomes.com', 'owner@nigeriahomes.com');

-- First, let's check what columns exist in the profiles table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Create profiles for the users (replace the UUIDs with actual user IDs from the query above)
-- Note: Adjust the column names based on what exists in your profiles table
INSERT INTO public.profiles (id, email, phone, created_at, updated_at)
VALUES 
  -- Replace 'USER_ID_FOR_AGENT' with the actual agent user ID
  ('USER_ID_FOR_AGENT', 'agent@nigeriahomes.com', '+234-800-000-0000', NOW(), NOW()),
  -- Replace 'USER_ID_FOR_OWNER' with the actual owner user ID  
  ('USER_ID_FOR_OWNER', 'owner@nigeriahomes.com', '+234-800-000-0001', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  updated_at = NOW();

-- Assign roles to the users
INSERT INTO public.user_roles (user_id, role)
VALUES 
  -- Replace 'USER_ID_FOR_AGENT' with the actual agent user ID
  ('USER_ID_FOR_AGENT', 'agent'::public.user_role),
  -- Replace 'USER_ID_FOR_OWNER' with the actual owner user ID
  ('USER_ID_FOR_OWNER', 'owner'::public.user_role)
ON CONFLICT (user_id) DO UPDATE SET
  role = EXCLUDED.role;

-- 4. Ensure properties table has all required columns
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

-- 5. Create a test property (replace the UUIDs with actual user IDs)
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
VALUES (
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
  'USER_ID_FOR_OWNER', -- Replace with actual owner user ID
  'USER_ID_FOR_AGENT', -- Replace with actual agent user ID
  NOW(),
  NOW()
);

-- 6. Verify the setup
SELECT 'Setup complete!' as status;
SELECT 'Agent users:' as info, COUNT(*) as count FROM public.user_roles WHERE role = 'agent';
SELECT 'Owner users:' as info, COUNT(*) as count FROM public.user_roles WHERE role = 'owner';
SELECT 'Properties:' as info, COUNT(*) as count FROM public.properties;
