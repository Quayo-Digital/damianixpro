# Route Testing Guide

Complete guide for testing the short-let routes.

## 🧪 Testing Checklist

### 1. Public Routes (No Authentication Required)

#### ✅ Test: `/shortlets`
**Expected:**
- Page loads without requiring login
- Shows search bar
- Shows filter options (dates, guests, price, amenities)
- Shows discovery section (featured, popular listings)
- Can search and filter listings

**Test Steps:**
1. Open browser (or incognito mode)
2. Navigate to: `http://localhost:5173/shortlets`
3. Verify page loads
4. Try searching for listings
5. Test filters (dates, guests, price)
6. Check if listings display

**URL Parameters to Test:**
```
/shortlets
/shortlets?location=Lekki
/shortlets?guests=2
/shortlets?min_price=10000&max_price=50000
/shortlets?checkin_date=2025-03-01&checkout_date=2025-03-05
/shortlets?sort_by=price_low
```

#### ✅ Test: `/shortlets/:listingId`
**Expected:**
- Page loads with listing details
- Shows booking flow component
- Calendar view (if owner)
- Can view listing information

**Test Steps:**
1. Get a listing ID from database or create one
2. Navigate to: `http://localhost:5173/shortlets/{listingId}`
3. Verify listing details display
4. Test booking flow (will require auth)
5. Check calendar view (if owner)

**Example:**
```
/shortlets/123e4567-e89b-12d3-a456-426614174000
```

### 2. Protected Routes (Owner Only)

#### ✅ Test: `/owner/shortlets`
**Expected:**
- Redirects to login if not authenticated
- Shows owner's listings if logged in as owner
- Can manage listings
- Can create new listings

**Test Steps:**
1. **Without Login:**
   - Navigate to: `http://localhost:5173/owner/shortlets`
   - Should redirect to `/auth` or show login prompt

2. **With Owner Login:**
   - Login as owner
   - Navigate to: `http://localhost:5173/owner/shortlets`
   - Should show owner's short-let listings
   - Should have management options

#### ✅ Test: `/owner/shortlets/:listingId`
**Expected:**
- Redirects to login if not authenticated
- Shows listing with edit mode if owner
- Can edit listing details
- Can manage calendar
- Can view bookings

**Test Steps:**
1. Login as owner
2. Navigate to: `http://localhost:5173/owner/shortlets/{listingId}`
3. Verify edit mode is available
4. Test calendar management
5. Check bookings tab

### 3. Navigation Links

#### ✅ Test: Sidebar Navigation
**Expected:**
- "Short-Lets" appears in sidebar for owners/admins
- Sub-items appear for owners
- Active state highlights when on short-let pages

**Test Steps:**
1. Login as owner
2. Check sidebar for "Short-Lets" menu
3. Click to expand (should show "My Short-Lets" and "Browse All")
4. Navigate to short-let page
5. Verify sidebar item is highlighted

#### ✅ Test: Owner Dashboard Quick Actions
**Expected:**
- "Short-Lets" section in dropdown
- "Manage Short-Lets" navigates to `/owner/shortlets`
- "Browse All Short-Lets" navigates to `/shortlets`

**Test Steps:**
1. Login as owner
2. Go to `/owner/dashboard`
3. Click "Quick Actions" dropdown
4. Find "Short-Lets" section
5. Click "Manage Short-Lets" → should go to `/owner/shortlets`
6. Click "Browse All Short-Lets" → should go to `/shortlets`

#### ✅ Test: Landing Page Links
**Expected:**
- "Short-Lets" link in header
- "Find Short-Lets" button in hero section
- Both navigate to `/shortlets`

**Test Steps:**
1. Go to landing page (`/`)
2. Check header for "Short-Lets" link
3. Click → should go to `/shortlets`
4. Check hero section for "Find Short-Lets" button
5. Click → should go to `/shortlets`

## 🔍 Common Issues & Solutions

### Issue: Route returns 404
**Solution:**
- Check if route is defined in `App.routes.tsx`
- Verify component is exported correctly
- Check browser console for errors

### Issue: Page loads but shows blank
**Solution:**
- Check browser console for JavaScript errors
- Verify component imports are correct
- Check if API calls are failing

### Issue: Redirects to login unexpectedly
**Solution:**
- Verify route is marked as public in `App.routes.tsx`
- Check `ProtectedRoute` component logic
- Ensure route is outside protected route wrapper

### Issue: Navigation link doesn't work
**Solution:**
- Verify `Link` component from `react-router-dom` is used
- Check if route path matches exactly
- Ensure route is defined before catch-all route

## 📝 Manual Testing Script

```bash
# 1. Start dev server
npm run dev

# 2. Test public routes (no login)
# Open browser and test:
- http://localhost:5173/shortlets
- http://localhost:5173/shortlets?location=Lekki

# 3. Test protected routes (with login)
# Login as owner, then test:
- http://localhost:5173/owner/shortlets
- http://localhost:5173/owner/shortlets/{listingId}

# 4. Test navigation
# - Click sidebar "Short-Lets"
# - Click dashboard "Manage Short-Lets"
# - Click landing page "Short-Lets" link
```

## 🧪 Automated Testing (Future)

Consider adding:
- Route component tests
- Navigation link tests
- Protected route tests
- URL parameter tests

## ✅ Success Criteria

All routes should:
- ✅ Load without errors
- ✅ Display correct content
- ✅ Handle authentication correctly
- ✅ Navigate properly from links
- ✅ Show active states in navigation
- ✅ Handle invalid routes gracefully

## 🐛 Debugging Tips

1. **Check Browser Console:**
   - Look for React errors
   - Check network requests
   - Verify route matches

2. **Check Network Tab:**
   - Verify API calls succeed
   - Check for 404s or 500s
   - Look for CORS issues

3. **Check React DevTools:**
   - Verify component renders
   - Check props and state
   - Inspect route context

4. **Check Terminal:**
   - Look for build errors
   - Check TypeScript errors
   - Verify imports resolve

## 📊 Test Results Template

```
Route: /shortlets
Status: ✅ PASS / ❌ FAIL
Issues: [List any issues]
Notes: [Any observations]

Route: /shortlets/:listingId
Status: ✅ PASS / ❌ FAIL
Issues: [List any issues]
Notes: [Any observations]

Route: /owner/shortlets
Status: ✅ PASS / ❌ FAIL
Issues: [List any issues]
Notes: [Any observations]

Navigation: Sidebar
Status: ✅ PASS / ❌ FAIL
Issues: [List any issues]
Notes: [Any observations]
```

