# Fix OAuth Redirect to Lovable.dev Issue

If you're being redirected to Lovable.dev when using Google OAuth, this is because your Supabase project still has the old Lovable redirect URL configured. Here's how to fix it:

## Step 1: Update Supabase Redirect URLs

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** > **URL Configuration**
4. Update the **Site URL** to your current domain:
   - For development: `http://localhost:3000`
   - For production: `https://yourdomain.com`
5. Add **Redirect URLs**:
   - `http://localhost:3000/**` (for development)
   - `https://yourdomain.com/**` (for production)
   - `http://localhost:3000/auth/callback` (specific callback)
   - `https://yourdomain.com/auth/callback` (production callback)
6. Click **Save**

## Step 2: Update Google OAuth Redirect URIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, make sure you have:
   - `http://localhost:3000/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)
   - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback` (Supabase callback)
5. **Remove any Lovable.dev URLs** if they exist
6. Click **Save**

## Step 3: Verify Your Current Domain

The code uses `window.location.origin` which automatically uses your current domain. To verify:

1. Open your browser's developer console
2. Type: `window.location.origin`
3. Make sure it shows your current domain (not Lovable.dev)

## Step 4: Clear Browser Cache

Sometimes browsers cache old redirect URLs:

1. Clear your browser cache
2. Or use an incognito/private window
3. Try the Google sign-in again

## Step 5: Test the OAuth Flow

1. Navigate to `/auth` or `/auth?tab=login`
2. Click "Continue with Google"
3. You should be redirected to Google's sign-in page
4. After signing in, you should be redirected back to `/auth/callback` on YOUR domain (not Lovable.dev)

## Troubleshooting

### Still Redirecting to Lovable.dev?

1. **Check Supabase Dashboard**: Make sure the Site URL and Redirect URLs are updated
2. **Check Google Console**: Verify no Lovable.dev URLs are in the authorized redirect URIs
3. **Check Browser Console**: Look for any errors or redirect issues
4. **Hard Refresh**: Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac) to clear cache

### "redirect_uri_mismatch" Error

- Ensure all redirect URIs match exactly (no trailing slashes)
- Make sure the Supabase callback URL is included in Google OAuth settings
- Verify the Site URL in Supabase matches your current domain

### OAuth Works But Redirects to Wrong Page

- Check that `/auth/callback` route is properly configured in `PublicRoutes.tsx`
- Verify the `AuthCallback` component is handling the redirect correctly

## Important Notes

- The code uses `window.location.origin` which automatically adapts to your current domain
- Supabase handles the OAuth flow, so the redirect URL in Supabase settings is critical
- Google OAuth requires the exact redirect URI to be whitelisted
- Changes to redirect URLs may take a few minutes to propagate
