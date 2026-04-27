# Quick Fix for DamianixPro App Issues

## 🚨 Current Issues

1. **No agent users found** - System can't find users with "agent" role
2. **Property creation failing** - Database schema issues
3. **Supabase API errors** - 400 errors when fetching properties

## ✅ Simple Solution

### Step 1: Create Test Users in Supabase Dashboard

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to**: Authentication > Users
3. **Click "Add User"** and create these two users:

**User 1 - Agent:**

- Email: `agent@nigeriahomes.com`
- Password: `password123`
- Confirm email: ✅ Yes

**User 2 - Owner:**

- Email: `owner@nigeriahomes.com`
- Password: `password123`
- Confirm email: ✅ Yes

### Step 2: Run SQL Script in Supabase

1. **Go to**: SQL Editor in your Supabase dashboard
2. **Copy and paste** the contents of `simple-fix.sql`
3. **Replace the placeholder UUIDs** with the actual user IDs from Step 1
4. **Run the script**

### Step 3: Verify the Fix

After running the SQL script, you should see:

- ✅ 1 agent user created
- ✅ 1 owner user created
- ✅ 1 test property created
- ✅ All database columns added

### Step 4: Test the Application

1. **Refresh your browser** at http://localhost:3000
2. **Login with**: `agent@nigeriahomes.com` / `password123`
3. **Try creating a property** - the agent assignment should now work
4. **Check the Properties page** - you should see the test property

## 🔧 Alternative: Manual Database Setup

If you prefer to set up the database manually:

1. **Go to Supabase Dashboard** > Table Editor
2. **Check the `user_roles` table** - should have entries for agent and owner
3. **Check the `profiles` table** - should have profiles for both users
4. **Check the `properties` table** - should have the test property
5. **Verify all required columns exist** in the properties table

## 🎯 Expected Results

After the fix:

- ✅ No more "No users with agent role found" errors
- ✅ Property creation should work
- ✅ Agent assignment dropdown should populate
- ✅ Properties should load without 400 errors

## 🆘 If Issues Persist

1. **Clear browser cache** (Ctrl+Shift+R)
2. **Check browser console** for any remaining errors
3. **Verify Supabase connection** in the app
4. **Check database permissions** in Supabase dashboard

The app should now work properly! 🎉
