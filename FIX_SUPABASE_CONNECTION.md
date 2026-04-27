# Fix Supabase Connection Error (ERR_NAME_NOT_RESOLVED)

## Problem

The app is trying to connect to `qbazneoxrgbttbzrsjho.supabase.co` but getting `ERR_NAME_NOT_RESOLVED` errors. This is causing:

- Network failures
- Service worker spam logging
- Performance issues

## Solution

### Step 1: Check Your .env File

1. **Check if you have a `.env` file** in the project root
2. **Open the `.env` file** and look for:
   ```env
   VITE_SUPABASE_URL=https://qbazneoxrgbttbzrsjho.supabase.co
   VITE_SUPABASE_ANON_KEY=...
   ```

### Step 2: Update .env File

**Option A: Use the correct Supabase project**
If you have a valid Supabase project, update your `.env` file:

```env
VITE_SUPABASE_URL=https://nocrbgzxcrirfpbuqhop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vY3JiZ3p4Y3JpcmZwYnVxaG9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2MDQ2NDEsImV4cCI6MjA2MjE4MDY0MX0.dyrmLzQu05-xyksMREPc5gwDE1nmjJUf1KZ10MvrVEA
```

**Option B: Remove .env file to use fallback**
If you don't have a `.env` file or want to use the hardcoded fallback:

1. Delete or rename your `.env` file
2. The app will use the fallback URL: `https://nocrbgzxcrirfpbuqhop.supabase.co`

### Step 3: Restart Dev Server

After updating `.env`:

```bash
# Stop the server (Ctrl+C)
npm run dev
```

### Step 4: Clear Browser Cache

1. Open browser DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. Or clear localStorage: `localStorage.clear()` in console

## Verify Connection

After fixing, check the browser console. You should see:

```
🔗 Supabase URL: https://nocrbgzxcrirfpbuqhop.supabase.co
```

If you still see `qbazneoxrgbttbzrsjho`, there might be:

- A cached `.env` file
- Multiple `.env` files (`.env.local`, `.env.development`, etc.)
- Browser cache issues

## Demo Data Fallback

The app will automatically show demo data when there are network errors, so you can still use the app even if Supabase is unavailable.

## Service Worker Logging Fix

The service worker has been updated to reduce excessive logging. It will now only log errors once per URL every 5 minutes instead of on every failed request.

## After Fixing

1. **Unregister the service worker** to clear old cache:
   - Open browser DevTools (F12)
   - Go to Application tab → Service Workers
   - Click "Unregister" for the service worker
   - Refresh the page

2. **Clear browser cache**:
   - DevTools → Application → Clear storage → Clear site data

3. **Restart dev server**:
   ```bash
   npm run dev
   ```
