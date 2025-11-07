# Debugging "Failed to Fetch" Error

Since the error persists even in a new browser, this suggests a deeper issue. Let's diagnose it systematically.

## Step 1: Open the Diagnostic Tool

1. Open the file `diagnose-fetch-error.html` in your browser
2. Click "Run All Tests"
3. Review the results - this will tell us exactly what's failing

## Step 2: Check Browser Console

1. Open your app at `http://localhost:3000`
2. Open DevTools (F12)
3. Go to the **Console** tab
4. Look for red error messages
5. **Copy the exact error message** you see

## Step 3: Check Network Tab

1. In DevTools, go to the **Network** tab
2. Refresh the page
3. Look for failed requests (they'll be red)
4. Click on a failed request
5. Check:
   - **Status Code** (e.g., 404, 500, CORS error)
   - **Request URL** (what endpoint is failing?)
   - **Response** tab (what error message?)

## Step 4: Test Supabase Connection Directly

Open your browser console and run:

```javascript
// Test 1: Basic Supabase connection
fetch('https://qbazneoxrgbttbzrsjho.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXpuZW94cmdidHRienJzamhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExOTQyOTQsImV4cCI6MjA3Njc3MDI5NH0.a6iW9clWbo2i2wNsN3J25VPC2Du98LVX9d8jk9h9tMc'
  }
})
.then(r => console.log('✅ Connection OK:', r.status))
.catch(e => console.error('❌ Connection FAILED:', e));

// Test 2: Check user_roles table
fetch('https://qbazneoxrgbttbzrsjho.supabase.co/rest/v1/user_roles?select=*&limit=1', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXpuZW94cmdidHRienJzamhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExOTQyOTQsImV4cCI6MjA3Njc3MDI5NH0.a6iW9clWbo2i2wNsN3J25VPC2Du98LVX9d8jk9h9tMc',
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log('✅ user_roles table OK:', data))
.catch(e => console.error('❌ user_roles table FAILED:', e));
```

## Common Issues & Solutions

### Issue 1: CORS Error
**Symptom**: Console shows "CORS policy" or "Access-Control-Allow-Origin"  
**Solution**: 
- Check Supabase Dashboard > Settings > API
- Verify CORS settings allow your origin
- Make sure you're using the correct API key

### Issue 2: Table Doesn't Exist
**Symptom**: 404 or "relation does not exist"  
**Solution**: 
- Run migrations in Supabase
- Check if `user_roles` table exists in Table Editor

### Issue 3: Network/Firewall
**Symptom**: "Failed to fetch" or timeout  
**Solution**:
- Check internet connection
- Check if firewall is blocking requests
- Try from a different network

### Issue 4: Service Worker Issue
**Symptom**: Requests being intercepted incorrectly  
**Solution**: Unregister service worker:
```javascript
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for(let registration of registrations) {
    registration.unregister();
  }
  location.reload();
});
```

### Issue 5: Supabase Project Paused/Inactive
**Symptom**: All requests fail  
**Solution**:
- Check Supabase Dashboard
- Make sure project is active (not paused)
- Check billing status

## Quick Fix: Disable Role Fetching Temporarily

If you need to get the app working immediately, we can temporarily disable role fetching. But first, let's identify the exact issue using the steps above.

## What to Report Back

Please share:
1. Results from `diagnose-fetch-error.html`
2. Exact error message from browser console
3. Failed request details from Network tab
4. Results from the JavaScript test above

This will help us pinpoint the exact issue!

