# Fix DNS Resolution Issue - Step by Step

## The Problem
Your computer cannot resolve `nocrbgzxcrirfpbuqhop.supabase.co`. This is a DNS/network issue, not a code issue.

## Solution 1: Change DNS Server (RECOMMENDED) ⭐

### Windows:
1. **Open Network Settings**:
   - Right-click network icon in system tray
   - Click "Open Network & Internet settings"
   - Click "Change adapter options"
   - Right-click your active connection (WiFi/Ethernet)
   - Click "Properties"

2. **Change DNS**:
   - Select "Internet Protocol Version 4 (TCP/IPv4)"
   - Click "Properties"
   - Select "Use the following DNS server addresses"
   - Enter:
     - **Preferred DNS server**: `8.8.8.8` (Google DNS)
     - **Alternate DNS server**: `8.8.4.4`
   - Click "OK"

3. **Flush DNS**:
   ```powershell
   ipconfig /flushdns
   ```

4. **Restart your browser** and try again

### Alternative DNS Servers:
- **Cloudflare**: `1.1.1.1` and `1.0.0.1`
- **OpenDNS**: `208.67.222.222` and `208.67.220.220`

## Solution 2: Test Direct Access

1. **Open your browser**
2. **Try to access**: https://nocrbgzxcrirfpbuqhop.supabase.co
3. **If it works**: The DNS is fine, might be a browser cache issue
4. **If it doesn't work**: DNS issue confirmed

## Solution 3: Use Hosts File (Temporary Workaround)

If DNS still fails, you can manually map the domain:

1. **Find the IP address**:
   - Go to https://www.whatsmydns.net/#A/nocrbgzxcrirfpbuqhop.supabase.co
   - Or ask me to help find it

2. **Edit hosts file**:
   - Open Notepad as Administrator
   - Open file: `C:\Windows\System32\drivers\etc\hosts`
   - Add line: `[IP_ADDRESS] nocrbgzxcrirfpbuqhop.supabase.co`
   - Save

## Solution 4: Check Firewall/VPN

1. **Disable VPN** if you're using one
2. **Check Windows Firewall**:
   - Windows Security > Firewall & network protection
   - Make sure it's not blocking connections
3. **Try a different network**:
   - Mobile hotspot
   - Different WiFi network

## Solution 5: Wait for DNS Propagation

Sometimes new Supabase projects take a few minutes for DNS to propagate globally. Wait 5-10 minutes and try again.

## Quick Test

After changing DNS, test in PowerShell:
```powershell
nslookup nocrbgzxcrirfpbuqhop.supabase.co 8.8.8.8
```

If this works, your local DNS is the problem.

## Most Likely Fix

**Change your DNS to Google DNS (8.8.8.8)** - this fixes 90% of DNS issues.

After changing DNS:
1. Flush DNS cache: `ipconfig /flushdns`
2. Restart browser
3. Try the app again

Let me know if changing DNS fixes it!

