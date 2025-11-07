# Troubleshooting "Failed to Fetch" Error

## Quick Fix Steps

### Step 1: Clear Browser Storage
The app might be trying to use cached authentication data for users that no longer exist.

**Option A: Using Browser DevTools (Recommended)**
1. Open your browser DevTools (Press `F12`)
2. Go to the **Application** tab (Chrome) or **Storage** tab (Firefox)
3. In the left sidebar, click on **Local Storage**
4. Click on your site URL (http://localhost:3000)
5. Click **Clear All** or delete individual items
6. Do the same for **Session Storage**
7. Refresh the page (Ctrl+Shift+R or Cmd+Shift+R)

**Option B: Using Browser Console**
1. Open DevTools (F12)
2. Go to the **Console** tab
3. Run these commands:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

### Step 2: Verify You're on the Login Page
- Make sure you're at: `http://localhost:3000/auth` or `http://localhost:3000`
- If you're on a protected route, you'll get errors. Navigate to `/auth` first.

### Step 3: Create a New User
Since we purged the database, you need to create a new user:

**Option A: Through Supabase Dashboard**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication > Users**
4. Click **"Add User"**
5. Enter:
   - Email: `admin@nigeriahomes.com`
   - Password: `password123`
   - Check **"Confirm email"**
6. Click **"Create User"**

**Option B: Through Your App**
1. Go to `http://localhost:3000/auth`
2. Click on the **"Register"** tab
3. Fill in the form and create a new account

### Step 4: Assign Admin Role (If Needed)
After creating a user, run `quick-assign-admin.sql` in Supabase SQL Editor to make them admin.

### Step 5: Try Logging In
1. Go to `http://localhost:3000/auth`
2. Use the credentials you just created
3. Click **"Sign In"**

## Common Causes of "Failed to Fetch"

1. **Cached Authentication Data**: Old session tokens for deleted users
   - **Fix**: Clear browser storage (Step 1)

2. **No Users in Database**: App trying to authenticate non-existent user
   - **Fix**: Create a new user (Step 3)

3. **Network Issues**: Can't reach Supabase
   - **Fix**: Check internet connection, verify Supabase URL is correct

4. **CORS Errors**: Browser blocking requests
   - **Fix**: Check browser console for CORS errors, verify Supabase settings

5. **Service Worker Issues**: Cached service worker causing problems
   - **Fix**: Unregister service worker:
     ```javascript
     navigator.serviceWorker.getRegistrations().then(function(registrations) {
       for(let registration of registrations) {
         registration.unregister();
       }
     });
     ```

## Still Having Issues?

1. **Check Browser Console** (F12 > Console tab)
   - Look for red error messages
   - Copy any error messages you see

2. **Check Network Tab** (F12 > Network tab)
   - Look for failed requests (red entries)
   - Click on failed requests to see error details

3. **Verify Supabase Connection**
   - Check that your Supabase project is active
   - Verify the URL and API key in `src/integrations/supabase/client.ts`

4. **Try Incognito/Private Mode**
   - This bypasses all cached data
   - If it works in incognito, it's a cache issue

## Quick Test

Run this in your browser console to check Supabase connection:
```javascript
// Test Supabase connection
fetch('https://qbazneoxrgbttbzrsjho.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXpuZW94cmdidHRienJzamhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExOTQyOTQsImV4cCI6MjA3Njc3MDI5NH0.a6iW9clWbo2i2wNsN3J25VPC2Du98LVX9d8jk9h9tMc'
  }
})
.then(r => console.log('Supabase connection: OK', r))
.catch(e => console.error('Supabase connection: FAILED', e));
```

