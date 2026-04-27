# URGENT: Fix Lovable.dev Redirect Issue

If you're still being redirected to Lovable.dev, this is **definitely** a Supabase configuration issue, not a code issue. The code is correct and uses your current domain.

## The Problem

Supabase is using the **Site URL** configured in the Supabase Dashboard instead of the redirect URL we pass in code. This is a Supabase security feature.

## IMMEDIATE FIX (Required in Supabase Dashboard)

### Step 1: Update Supabase URL Configuration (CRITICAL)

1. Go to: https://supabase.com/dashboard
2. Select your project: **nocrbgzxcrirfpbuqhop**
3. Navigate to: **Authentication** → **URL Configuration**
4. **Site URL** - Change this to:

   ```
   http://localhost:3000
   ```

   (For production, use your actual domain like `https://yourdomain.com`)

5. **Redirect URLs** - Add these EXACT URLs (one per line):

   ```
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   https://nocrbgzxcrirfpbuqhop.supabase.co/auth/v1/callback
   ```

   **IMPORTANT**:
   - Remove ANY URLs containing `lovable.dev` or `lovable-dev`
   - Make sure there are NO trailing slashes
   - Each URL should be on its own line

6. Click **Save**

### Step 2: Verify Google OAuth Settings

1. Go to: https://console.cloud.google.com/
2. Navigate to: **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, ensure you have:
   ```
   http://localhost:3000/auth/callback
   https://nocrbgzxcrirfpbuqhop.supabase.co/auth/v1/callback
   ```
5. **Remove ALL Lovable.dev URLs** if present
6. Click **Save**

### Step 3: Clear Everything

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Clear localStorage**:
   - Open browser console (F12)
   - Type: `localStorage.clear()`
   - Press Enter
3. **Restart your dev server**:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

### Step 4: Test Again

1. Open browser in **Incognito/Private mode** (to avoid cache)
2. Navigate to: `http://localhost:3000/auth`
3. Click "Continue with Google"
4. Check the browser console (F12) for logs
5. You should see:
   - "Current origin: http://localhost:3000"
   - "Redirect URL: http://localhost:3000/auth/callback"

## If Still Redirecting to Lovable.dev

The issue is **100% in Supabase Dashboard configuration**. Check:

1. **Double-check Site URL** in Supabase:
   - Authentication → URL Configuration
   - Must be `http://localhost:3000` (not Lovable.dev)

2. **Check Redirect URLs list**:
   - Must include `http://localhost:3000/**`
   - Must NOT include any Lovable.dev URLs

3. **Wait a few minutes** after saving (Supabase may cache settings)

4. **Check browser console** for the warning message:
   - If you see "⚠️ WARNING: Detected Lovable.dev in origin!", the code detected the issue
   - This means `window.location.origin` is showing Lovable.dev, which means you might be accessing the app through a Lovable.dev URL

## Are You Accessing the App Through Lovable.dev?

If you're accessing your app at a URL like `https://some-project.lovable.dev`, that's the problem! You need to:

1. Access your app at `http://localhost:3000` (local development)
2. Or deploy to your own domain (not Lovable.dev)

The code cannot override the domain you're accessing the app from.

## Verification Checklist

- [ ] Supabase Site URL is `http://localhost:3000` (not Lovable.dev)
- [ ] Redirect URLs include `http://localhost:3000/**`
- [ ] No Lovable.dev URLs in Supabase Redirect URLs
- [ ] Google OAuth has correct redirect URIs
- [ ] No Lovable.dev URLs in Google OAuth settings
- [ ] Browser cache cleared
- [ ] localStorage cleared
- [ ] Dev server restarted
- [ ] Testing in incognito mode
- [ ] Accessing app at `http://localhost:3000` (not Lovable.dev URL)

## Still Not Working?

If after all these steps it still redirects to Lovable.dev, please check:

1. What URL are you accessing the app from? (Check browser address bar)
2. What does `window.location.origin` show in the browser console?
3. Take a screenshot of your Supabase URL Configuration page

The code is correct - the issue is in the Supabase Dashboard configuration.
