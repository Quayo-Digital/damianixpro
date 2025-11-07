# Authentication Database Reset Guide

## ⚠️ WARNING
**This will delete ALL users and their authentication data!**

## Two Options Available

### Option 1: Complete Purge (`purge-auth-database.sql`)
- Deletes ALL users
- Deletes ALL user-related data
- Deletes ALL properties, tenants, leases, etc.
- **Use this if you want a completely fresh start**

### Option 2: Safe Purge (`purge-auth-database-safe.sql`) ⭐ RECOMMENDED
- Deletes ALL users
- Deletes user-related data
- **Preserves properties and business data**
- Clears user links from properties (owner_id, agent_id set to NULL)
- **Use this if you want to keep your properties and other business data**

## How to Execute

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: `qbazneoxrgbttbzrsjho`
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Run the SQL Script
1. Click **"New Query"**
2. Copy the contents of either:
   - `purge-auth-database.sql` (complete purge)
   - `purge-auth-database-safe.sql` (safe purge - recommended)
3. Paste into the SQL Editor
4. Click **"Run"** or press `Ctrl+Enter`

### Step 3: Verify
After running, you should see:
- `remaining_users: 0`
- `remaining_profiles: 0`
- `remaining_user_roles: 0`

### Step 4: Create New Users
After purging, you can create new users:

#### Option A: Through Supabase Dashboard
1. Go to **Authentication > Users**
2. Click **"Add User"**
3. Enter email and password
4. Check **"Confirm email"** to skip email verification

#### Option B: Through Your App
1. Use the sign-up flow in your application
2. Users will be automatically created with profiles and roles

## What Gets Deleted

### Always Deleted:
- ✅ All users from `auth.users`
- ✅ All profiles from `public.profiles`
- ✅ All user roles from `public.user_roles`
- ✅ All subscriptions and billing data
- ✅ All KYC/verification records
- ✅ All messages and conversations
- ✅ All notifications
- ✅ All documents
- ✅ All maintenance requests
- ✅ All rental applications

### Preserved (Safe Purge Only):
- ✅ Properties (but user links cleared)
- ✅ Property images
- ✅ Database schema and structure
- ✅ All migrations and functions

## After Reset

1. **Clear browser storage** (optional but recommended):
   - Open browser DevTools (F12)
   - Go to Application/Storage tab
   - Clear Local Storage and Session Storage
   - Or use: `localStorage.clear()` in console

2. **Refresh your app** at http://localhost:3000

3. **Create your first user**:
   - Sign up through the app, OR
   - Create manually in Supabase Dashboard

## Troubleshooting

### If you get permission errors:
- Make sure you're using the Supabase SQL Editor (not a client)
- Check that you have admin access to the project

### If users still appear:
- Check the verification query at the end of the script
- Make sure all DELETE statements executed successfully
- Try running the script again

### If properties are missing (after safe purge):
- Check the properties table: `SELECT * FROM public.properties;`
- Properties should still exist, just without owner_id/agent_id links

## Need Help?

If you encounter issues:
1. Check the Supabase logs in the Dashboard
2. Verify the SQL executed without errors
3. Check that foreign key constraints are set to CASCADE

