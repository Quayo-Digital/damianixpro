-- Complete Fix Script for DamianixPro App
-- Run this in your Supabase SQL Editor

-- Step 1: First, let's see what users exist
SELECT 'Current users:' as info;
SELECT id, email, created_at 
FROM auth.users 
WHERE email IN ('agent@nigeriahomes.com', 'owner@nigeriahomes.com')
ORDER BY created_at;

-- Step 2: If no users exist, you need to create them first
-- Go to Supabase Dashboard > Authentication > Users > Add User
-- Create: agent@nigeriahomes.com / password123
-- Create: owner@nigeriahomes.com / password123

-- Step 3: After creating users, run this query to get their IDs
-- Copy the UUIDs from the results above

-- Step 4: Replace the UUIDs in the script below with the actual IDs
-- Then run the rest of this script

-- Create profiles (replace with actual UUIDs)
INSERT INTO public.profiles (id, email, phone, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  CASE 
    WHEN u.email = 'agent@nigeriahomes.com' THEN '+234-800-000-0000'
    WHEN u.email = 'owner@nigeriahomes.com' THEN '+234-800-000-0001'
  END,
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email IN ('agent@nigeriahomes.com', 'owner@nigeriahomes.com')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  updated_at = NOW();

-- Assign roles (replace with actual UUIDs)
INSERT INTO public.user_roles (user_id, role)
SELECT 
  u.id,
  CASE 
    WHEN u.email = 'agent@nigeriahomes.com' THEN 'agent'::public.user_role
    WHEN u.email = 'owner@nigeriahomes.com' THEN 'owner'::public.user_role
  END
FROM auth.users u
WHERE u.email IN ('agent@nigeriahomes.com', 'owner@nigeriahomes.com')
ON CONFLICT (user_id) DO UPDATE SET
  role = EXCLUDED.role;

-- Ensure properties table has required columns
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

-- Create test property
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
WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = 'owner@nigeriahomes.com')
  AND EXISTS (SELECT 1 FROM auth.users WHERE email = 'agent@nigeriahomes.com');

-- Verify the setup
SELECT 'Setup complete!' as status;
SELECT 'Agent users:' as info, COUNT(*) as count FROM public.user_roles WHERE role = 'agent';
SELECT 'Owner users:' as info, COUNT(*) as count FROM public.user_roles WHERE role = 'owner';
SELECT 'Properties:' as info, COUNT(*) as count FROM public.properties;
