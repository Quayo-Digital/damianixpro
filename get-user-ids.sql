-- Get User IDs for DamianixPro App Fix
-- Run this first to get the actual user IDs

-- Step 1: Check if the test users exist
SELECT id, email, created_at 
FROM auth.users 
WHERE email IN ('agent@nigeriahomes.com', 'owner@nigeriahomes.com')
ORDER BY created_at;

-- Step 2: If no users exist, you need to create them first in the Supabase Dashboard
-- Go to Authentication > Users > Add User
-- Create these two users:
-- 1. Email: agent@nigeriahomes.com, Password: password123
-- 2. Email: owner@nigeriahomes.com, Password: password123

-- Step 3: After creating the users, run this query again to get their IDs
-- Then copy the IDs and use them in the quick-database-fix.sql script
