# Fix DNS Resolution Issue

## Problem
The error `ERR_NAME_NOT_RESOLVED` means your computer cannot resolve the Supabase domain name. This is a network/DNS issue.

## Solutions

### Solution 1: Verify Supabase Project Still Exists ⭐ MOST LIKELY

The project URL might be incorrect or the project was deleted/paused.

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Check if your project exists**
3. **If it exists, go to Settings > API**
4. **Copy the Project URL** - it should look like: `https://xxxxx.supabase.co`
5. **Verify it matches** what's in `src/integrations/supabase/client.ts`

### Solution 2: Check Internet Connection

1. Try accessing https://supabase.com in your browser
2. If that doesn't work, you have an internet connectivity issue
3. Try a different network (mobile hotspot, different WiFi)

### Solution 3: Fix DNS Settings

**Option A: Use Google DNS**
1. Open Network Settings
2. Change DNS to:
   - Primary: `8.8.8.8`
   - Secondary: `8.8.4.4`

**Option B: Flush DNS Cache (Windows)**
```powershell
ipconfig /flushdns
```

### Solution 4: Check Firewall/VPN

1. **Disable VPN** if you're using one
2. **Check Windows Firewall** - make sure it's not blocking connections
3. **Check corporate firewall** - if on a work network, it might be blocking Supabase

### Solution 5: Use Different DNS Server

Try using Cloudflare DNS:
- Primary: `1.1.1.1`
- Secondary: `1.0.0.1`

## Quick Test

Run this in PowerShell to test DNS resolution:

```powershell
# Test 1: Can we resolve supabase.co?
Resolve-DnsName supabase.co

# Test 2: Can we reach Supabase?
Test-NetConnection -ComputerName supabase.co -Port 443

# Test 3: Try with Google DNS
nslookup qbazneoxrgbttbzrsjho.supabase.co 8.8.8.8
```

## Most Likely Fix

**The Supabase project URL is probably wrong or the project was deleted.**

1. Go to https://supabase.com/dashboard
2. Check if project `qbazneoxrgbttbzrsjho` exists
3. If it doesn't exist:
   - Create a new project
   - Get the new project URL
   - Update `src/integrations/supabase/client.ts` with the new URL and API key

## If Project Was Deleted

You'll need to:
1. Create a new Supabase project
2. Update the URL and API key in the code
3. Run your migrations again
4. Create new users

Let me know what you find in the Supabase Dashboard!

