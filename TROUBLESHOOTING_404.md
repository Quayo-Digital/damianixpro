# Troubleshooting 404 Errors

If you're seeing a "404 - Not Found" error, here are the most common causes and solutions:

## Common Routes

### Tenant Routes

- `/tenant-portal` - Main tenant portal (requires tenant role)
- `/tenant/dashboard` - Enhanced tenant dashboard
- `/messages` - Messages page (shows different views for tenants vs owners)

### Owner Routes

- `/owner/dashboard` - Owner dashboard
- `/owner/payments` - Owner payments
- `/messages` - Messages page

### Public Routes

- `/` - Landing page
- `/auth` - Authentication page
- `/properties` - Public properties listing
- `/shortlets` - Short-let listings

## Troubleshooting Steps

### 1. Check Your Role

Make sure you're logged in with the correct role:

- **Tenant Portal**: Requires `tenant` role
- **Owner Dashboard**: Requires `owner` role
- **Messages**: Works for all roles but shows different views

### 2. Verify the URL

Common mistakes:

- `/tenant-portal` ✅ (correct)
- `/tenantportal` ❌ (missing hyphen)
- `/tenant/portal` ❌ (wrong path)

### 3. Check Browser Console

Open browser DevTools (F12) and check:

- **Console tab**: Look for JavaScript errors
- **Network tab**: Check if requests are failing
- **Application tab**: Verify you have a valid session

### 4. Clear Cache

Sometimes cached routes can cause issues:

1. Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac) for hard refresh
2. Or clear browser cache completely

### 5. Check Authentication

Make sure you're logged in:

- Go to `/auth` and verify your login status
- Check if your session expired

### 6. Verify Route Protection

Some routes are protected by role:

- `/tenant-portal` requires `tenant` role
- `/owner/dashboard` requires `owner` role
- If you don't have the right role, you'll be redirected or see 404

## Common Issues

### Issue: "404" when accessing `/tenant-portal`

**Solution**:

1. Verify you're logged in as a tenant
2. Check your user role in the database
3. Try accessing `/tenant/dashboard` instead

### Issue: "404" when accessing `/messages`

**Solution**:

1. Make sure you're logged in
2. The route should work for all authenticated users
3. Check browser console for errors

### Issue: Component fails to load

**Solution**:

1. Check browser console for import errors
2. Verify all components are properly exported
3. Try a hard refresh (Ctrl+Shift+R)

## Still Having Issues?

1. **Check the exact URL** you're trying to access
2. **Check your user role** in Supabase dashboard
3. **Check browser console** for specific error messages
4. **Try accessing from an incognito window** to rule out cache issues

## Quick Test Routes

Try these routes to verify your setup:

- `/` - Should show landing page
- `/auth` - Should show login page
- `/properties` - Should show public properties (if logged out)
- `/dashboard` - Should redirect based on your role

If these work but specific routes don't, the issue is likely:

- Route protection (wrong role)
- Missing component export
- Runtime error in component
