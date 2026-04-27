# Step-by-Step Fix for DamianixPro App

## 🚨 Current Issue

The SQL script is failing because you need to replace the placeholder UUIDs with actual user IDs.

## ✅ Complete Solution

### Step 1: Create Test Users in Supabase Dashboard

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to**: Authentication → Users
3. **Click "Add User"** and create these two users:

**User 1 - Agent:**

- Email: `agent@nigeriahomes.com`
- Password: `password123`
- Confirm email: ✅ Yes

**User 2 - Owner:**

- Email: `owner@nigeriahomes.com`
- Password: `password123`
- Confirm email: ✅ Yes

### Step 2: Get the User IDs

1. **Go to**: SQL Editor in your Supabase dashboard
2. **Run this query** to get the user IDs:

```sql
SELECT id, email
FROM auth.users
WHERE email IN ('agent@nigeriahomes.com', 'owner@nigeriahomes.com');
```

3. **Copy the UUIDs** from the results (they look like: `12345678-1234-1234-1234-123456789abc`)

### Step 3: Update and Run the Fix Script

1. **Open** `quick-database-fix.sql` in your editor
2. **Replace** these placeholders with the actual UUIDs:
   - Replace `USER_ID_FOR_AGENT` with the agent user's UUID
   - Replace `USER_ID_FOR_OWNER` with the owner user's UUID
3. **Copy the updated script** and run it in Supabase SQL Editor

### Step 4: Verify the Fix

After running the script, you should see:

- ✅ Agent users: 1
- ✅ Owner users: 1
- ✅ Properties: 1

### Step 5: Test the Application

1. **Refresh your browser** at http://localhost:3000
2. **Login with**: `agent@nigeriahomes.com` / `password123`
3. **Try creating a property** - the agent assignment should now work!

## 🔧 Alternative: One-Step Fix

If you want to do it all in one go, here's a complete script that creates users and sets everything up:

```sql
-- Complete Fix Script (run this in Supabase SQL Editor)
-- This will create users, profiles, roles, and test data

-- Step 1: Create test users (you'll need to do this manually in the dashboard first)
-- Go to Authentication > Users > Add User
-- Create: agent@nigeriahomes.com / password123
-- Create: owner@nigeriahomes.com / password123

-- Step 2: Get the user IDs
SELECT id, email FROM auth.users WHERE email IN ('agent@nigeriahomes.com', 'owner@nigeriahomes.com');

-- Step 3: Replace the UUIDs below with the actual IDs from Step 2
-- Then run the rest of the script

-- Create profiles
INSERT INTO public.profiles (id, email, phone, created_at, updated_at)
VALUES
  ('REPLACE_WITH_AGENT_UUID', 'agent@nigeriahomes.com', '+234-800-000-0000', NOW(), NOW()),
  ('REPLACE_WITH_OWNER_UUID', 'owner@nigeriahomes.com', '+234-800-000-0001', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  updated_at = NOW();

-- Assign roles
INSERT INTO public.user_roles (user_id, role)
VALUES
  ('REPLACE_WITH_AGENT_UUID', 'agent'::public.user_role),
  ('REPLACE_WITH_OWNER_UUID', 'owner'::public.user_role)
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
  name, address, type, price, location, status, description,
  bedrooms, bathrooms, squareFeet, amenities, owner_id, agent_id,
  created_at, updated_at
)
VALUES (
  'Beautiful 3-Bedroom Apartment in Lekki',
  '123 Admiralty Way, Lekki Phase 1, Lagos',
  'apartment', 250000.00, 'Lekki, Lagos', 'available',
  'A modern 3-bedroom apartment with stunning ocean views.',
  3, 2, 120.00,
  ARRAY['parking', 'security', 'generator', 'air_conditioning', 'balcony'],
  'REPLACE_WITH_OWNER_UUID', 'REPLACE_WITH_AGENT_UUID',
  NOW(), NOW()
);

-- Verify setup
SELECT 'Setup complete!' as status;
SELECT 'Agent users:' as info, COUNT(*) as count FROM public.user_roles WHERE role = 'agent';
SELECT 'Owner users:' as info, COUNT(*) as count FROM public.user_roles WHERE role = 'owner';
SELECT 'Properties:' as info, COUNT(*) as count FROM public.properties;
```

## 🎯 Expected Results

After completing these steps:

- ✅ No more "No users with agent role found" errors
- ✅ Property creation will work
- ✅ Agent assignment dropdown will populate
- ✅ Properties will load without 400 errors

The app should now work properly! 🚀
