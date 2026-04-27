# Google OAuth Setup Guide

This guide will help you configure Google OAuth authentication for your application.

## Prerequisites

- A Google Cloud Platform (GCP) account
- Access to your Supabase project dashboard

## Step 1: Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in the required information:
     - App name: "DamianixPro" (or your app name)
     - User support email: Your email
     - Developer contact information: Your email
   - Add scopes: `email`, `profile`, `openid`
   - Add test users (if in testing mode)
6. Create OAuth client ID:
   - Application type: **Web application**
   - Name: "DamianixPro Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000/auth/callback` (for development)
     - `https://yourdomain.com/auth/callback` (for production)
     - **IMPORTANT**: Also add your Supabase callback URL:
       - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
7. Copy the **Client ID** and **Client Secret**

## Step 2: Configure Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. **IMPORTANT**: First, update URL Configuration:
   - Navigate to **Authentication** > **URL Configuration**
   - Set **Site URL** to your current domain:
     - Development: `http://localhost:3000`
     - Production: `https://yourdomain.com`
   - Add **Redirect URLs**:
     - `http://localhost:3000/**` (development)
     - `https://yourdomain.com/**` (production)
     - `http://localhost:3000/auth/callback` (development callback)
     - `https://yourdomain.com/auth/callback` (production callback)
   - **Remove any Lovable.dev or old URLs** if present
   - Click **Save**
4. Now configure Google provider:
   - Navigate to **Authentication** > **Providers**
   - Find **Google** in the list and click to configure
   - Enable Google provider
   - Enter your Google OAuth credentials:
     - **Client ID (for OAuth)**: Paste your Google Client ID
     - **Client Secret (for OAuth)**: Paste your Google Client Secret
   - Click **Save**

## Step 3: Update Redirect URLs

Make sure your Supabase redirect URL is added to Google OAuth:

1. In Google Cloud Console, go to your OAuth client
2. Add this redirect URI:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
   Replace `YOUR_PROJECT_REF` with your actual Supabase project reference.

## Step 4: Test the Integration

1. Start your development server
2. Navigate to `/auth` or `/auth?tab=login`
3. Click the **"Continue with Google"** button
4. You should be redirected to Google's sign-in page
5. After signing in, you'll be redirected back to `/auth/callback`
6. The callback handler will:
   - Exchange the code for a session
   - Check if you're a new user (needs onboarding)
   - Redirect to `/onboarding` (new users) or `/dashboard` (existing users)

## Troubleshooting

### "redirect_uri_mismatch" Error

- Ensure all redirect URIs are correctly added in Google Cloud Console
- Check that the Supabase callback URL is included
- Verify there are no trailing slashes or typos

### "Access blocked: This app's request is invalid"

- Check that your OAuth consent screen is properly configured
- If in testing mode, ensure the user email is added as a test user
- Verify that the required scopes are added

### User Not Redirected After Sign-In

- Check browser console for errors
- Verify the callback route is properly configured in `PublicRoutes.tsx`
- Ensure the `AuthCallback` component is correctly handling the OAuth flow

### New Users Not Getting Role Assigned

- The callback handler checks if a profile exists
- If no profile/role exists, users are redirected to `/onboarding`
- Ensure the onboarding flow properly assigns roles

## Security Notes

- Never commit your OAuth credentials to version control
- Use environment variables for sensitive data in production
- Regularly rotate your OAuth client secrets
- Monitor OAuth usage in Google Cloud Console

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase OAuth Providers](https://supabase.com/docs/guides/auth/social-login/auth-google)
