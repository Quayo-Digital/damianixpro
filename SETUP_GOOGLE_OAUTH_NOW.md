# Setup Google OAuth - Step by Step Guide

Your app is already coded for Google OAuth! Just follow these steps to enable it.

## 🎯 Quick Overview

1. Create Google OAuth credentials (15 minutes)
2. Configure Supabase (5 minutes)
3. Test the integration (2 minutes)

---

## 📋 Step 1: Create Google OAuth Credentials

### 1.1 Access Google Cloud Console

1. Go to: https://console.cloud.google.com/
2. Sign in with your Google account
3. Click **"Select a project"** dropdown at the top
4. Click **"NEW PROJECT"**
   - Project name: `DamianixPro`
   - Click **"CREATE"**
5. Wait for project creation, then select it from the dropdown

### 1.2 Configure OAuth Consent Screen

1. In the left sidebar, navigate to: **APIs & Services** > **OAuth consent screen**
2. Choose **External** (unless you have Google Workspace)
3. Click **"CREATE"**
4. Fill in the required fields:

   **OAuth consent screen:**
   - App name: `DamianixPro`
   - User support email: `your-email@example.com`
   - App logo: (optional, can skip for now)

   **App domain (optional):**
   - Leave blank for now

   **Developer contact information:**
   - Email addresses: `your-email@example.com`

5. Click **"SAVE AND CONTINUE"**

6. **Scopes** page:
   - Click **"ADD OR REMOVE SCOPES"**
   - Select these scopes:
     - `/.../auth/userinfo.email`
     - `/.../auth/userinfo.profile`
     - `openid`
   - Click **"UPDATE"**
   - Click **"SAVE AND CONTINUE"**

7. **Test users** page:
   - Click **"ADD USERS"**
   - Add your Gmail address (you'll use this for testing)
   - Click **"ADD"**
   - Click **"SAVE AND CONTINUE"**

8. Review the summary and click **"BACK TO DASHBOARD"**

### 1.3 Create OAuth Client ID

1. In the left sidebar: **APIs & Services** > **Credentials**
2. Click **"CREATE CREDENTIALS"** > **"OAuth client ID"**
3. Configure the OAuth client:

   **Application type:** `Web application`

   **Name:** `DamianixPro Web Client`

   **Authorized JavaScript origins:**
   - Click **"ADD URI"**
   - Add ONLY the base URL (NO trailing slash, NO paths):
     ```
     http://localhost:3000
     ```
   - For production, later add: `https://yourdomain.com`

   **Authorized redirect URIs:**
   - Click **"ADD URI"**
   - Add these TWO URIs (IMPORTANT - these MUST have paths):
     ```
     http://localhost:3000/auth/callback
     https://nocrbgzxcrirfpbuqhop.supabase.co/auth/v1/callback
     ```

   ⚠️ **COMMON MISTAKES TO AVOID:**
   - ❌ Don't add `/auth/callback` to JavaScript origins (no paths allowed there)
   - ❌ Don't add trailing slashes: `http://localhost:3000/` is invalid
   - ❌ Don't copy-paste with extra whitespace
   - ✅ JavaScript origins = base URL only
   - ✅ Redirect URIs = full callback paths

4. Click **"CREATE"**
5. A popup appears with your credentials:
   - Copy the **Client ID** (looks like: `xxxxx.apps.googleusercontent.com`)
   - Copy the **Client secret** (looks like: `GOCSPX-xxxxx`)
   - Save both somewhere safe!

---

## 🔧 Step 2: Configure Supabase

### 2.1 Update URL Configuration (CRITICAL!)

1. Go to: https://supabase.com/dashboard/project/nocrbgzxcrirfpbuqhop
2. Click on **Authentication** (left sidebar)
3. Click on **URL Configuration** tab
4. Update these settings:

   **Site URL:**

   ```
   http://localhost:3000
   ```

   **Redirect URLs:**
   Click "Add URL" and add these one by one:

   ```
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   http://localhost:3000/dashboard
   ```

5. **IMPORTANT**: If you see any `lovable.dev` URLs, delete them!
6. Click **"Save"**

### 2.2 Enable Google Provider

1. Stay in **Authentication** section
2. Click on **Providers** tab
3. Scroll down to find **Google**
4. Click on **Google** to expand it
5. Toggle **"Enable Sign in with Google"** to ON
6. Fill in the credentials:

   **Client ID (for OAuth):**

   ```
   [Paste your Google Client ID here]
   ```

   **Client Secret (for OAuth):**

   ```
   [Paste your Google Client Secret here]
   ```

7. **Authorized Client IDs:** Leave empty
8. Click **"Save"**

---

## 🧪 Step 3: Test the Integration

### 3.1 Test on Your Running App

1. Your app should already be running at: http://localhost:3000
   - If not, run: `npm run dev`

2. Navigate to the login page: http://localhost:3000/auth

3. You should see a **"Continue with Google"** button

4. Click the Google button

5. **Expected flow:**
   - Redirected to Google sign-in page
   - Sign in with the Gmail account you added as a test user
   - See consent screen (first time only)
   - Click "Continue" or "Allow"
   - Redirected back to your app at `/auth/callback`
   - See "Authentication Successful!" message
   - Automatically redirected to dashboard or onboarding

### 3.2 Verify in Browser Console

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for these logs:
   ```
   Initiating Google sign-in
   OAuth URL generated: https://...
   ```

### 3.3 Check Supabase Logs

1. Go to Supabase Dashboard > **Authentication** > **Users**
2. You should see your new user with Google provider

---

## 🐛 Troubleshooting

### Error: "redirect_uri_mismatch"

**Problem:** Google doesn't recognize your redirect URI

**Solution:**

1. Go back to Google Cloud Console > Credentials
2. Edit your OAuth client
3. Make sure these URIs are added:
   ```
   http://localhost:3000/auth/callback
   https://nocrbgzxcrirfpbuqhop.supabase.co/auth/v1/callback
   ```
4. Save and wait 5 minutes for changes to propagate

### Error: "Access blocked: This app's request is invalid"

**Problem:** OAuth consent screen not properly configured

**Solution:**

1. Check OAuth consent screen has all required fields
2. Make sure your email is added as a test user
3. Verify scopes are added (email, profile, openid)

### Error: "Configuration error: Supabase is redirecting to the wrong domain"

**Problem:** Supabase URL configuration has old/wrong URLs

**Solution:**

1. Go to Supabase > Authentication > URL Configuration
2. Remove ALL lovable.dev URLs
3. Add only localhost URLs as shown in Step 2.1
4. Save and try again

### Browser Console Shows: "signInWithGoogle is not a function"

**Problem:** Auth context not properly loaded

**Solution:**

1. Refresh the page
2. Check that you're on the latest code
3. Restart the dev server: `npm run dev`

### Button clicks but nothing happens

**Problem:** Popup blocked or JavaScript error

**Solution:**

1. Check browser console for errors
2. Allow popups for localhost
3. Try in incognito mode
4. Check Supabase project is active (not paused)

---

## 🎉 Success Checklist

- [ ] Google Cloud project created
- [ ] OAuth consent screen configured
- [ ] OAuth client ID created
- [ ] Client ID and Secret copied
- [ ] Supabase URL configuration updated
- [ ] Supabase Google provider enabled
- [ ] Google credentials added to Supabase
- [ ] Test user can sign in with Google
- [ ] User appears in Supabase Authentication > Users
- [ ] User redirected to dashboard/onboarding

---

## 📚 Additional Notes

### For Production Deployment:

When you deploy to production, you'll need to:

1. **Update Google OAuth Client:**
   - Add production domain to Authorized JavaScript origins
   - Add production callback URL: `https://yourdomain.com/auth/callback`
   - Add production Supabase callback: `https://nocrbgzxcrirfpbuqhop.supabase.co/auth/v1/callback`

2. **Update Supabase:**
   - Change Site URL to: `https://yourdomain.com`
   - Add production redirect URLs

3. **Publish OAuth Consent Screen:**
   - Currently in "Testing" mode (100 users max)
   - To go live, submit for Google verification
   - Or keep in testing for internal/limited use

### Security Best Practices:

- Never commit OAuth credentials to git
- Use environment variables in production
- Regularly rotate client secrets
- Monitor OAuth usage in Google Cloud Console
- Review and limit OAuth scopes to minimum needed

---

## 🆘 Need Help?

- **Supabase Docs:** https://supabase.com/docs/guides/auth/social-login/auth-google
- **Google OAuth Docs:** https://developers.google.com/identity/protocols/oauth2
- **Check Supabase Logs:** Project Dashboard > Logs > Auth logs

---

## Your Supabase Project Info

- Project URL: `https://nocrbgzxcrirfpbuqhop.supabase.co`
- Dashboard: https://supabase.com/dashboard/project/nocrbgzxcrirfpbuqhop
- Auth Callback: `https://nocrbgzxcrirfpbuqhop.supabase.co/auth/v1/callback`
