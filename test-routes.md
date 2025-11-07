# Quick Route Testing Guide

## ✅ Routes to Test

### 1. Public Routes (No Login Required)

#### `/shortlets`
- **URL:** `http://localhost:5173/shortlets`
- **Expected:** Search page with filters and discovery section
- **Test:**
  - [ ] Page loads without errors
  - [ ] Search bar is visible
  - [ ] Filters work (dates, guests, price)
  - [ ] Discovery section shows listings

#### `/shortlets/:listingId`
- **URL:** `http://localhost:5173/shortlets/{any-uuid}`
- **Expected:** Listing detail page or "Listing not found"
- **Test:**
  - [ ] Page loads
  - [ ] Shows error message if listing doesn't exist
  - [ ] Shows booking flow if listing exists

### 2. Protected Routes (Owner Login Required)

#### `/owner/shortlets`
- **URL:** `http://localhost:5173/owner/shortlets`
- **Expected:** Redirects to login if not authenticated
- **Test:**
  - [ ] Without login: redirects to `/auth`
  - [ ] With owner login: shows owner's listings

#### `/owner/shortlets/:listingId`
- **URL:** `http://localhost:5173/owner/shortlets/{listingId}`
- **Expected:** Listing page with edit mode
- **Test:**
  - [ ] Shows edit button for owner
  - [ ] Calendar management works
  - [ ] Bookings tab visible

## 🔗 Navigation Links to Test

### Sidebar (Owner Login)
- [ ] "Short-Lets" menu item appears
- [ ] Click expands to show "My Short-Lets" and "Browse All"
- [ ] "My Short-Lets" → `/owner/shortlets`
- [ ] "Browse All" → `/shortlets`
- [ ] Menu item highlights when on short-let pages

### Owner Dashboard
- [ ] Quick Actions dropdown has "Short-Lets" section
- [ ] "Manage Short-Lets" → `/owner/shortlets`
- [ ] "Browse All Short-Lets" → `/shortlets`

### Landing Page
- [ ] Header has "Short-Lets" link → `/shortlets`
- [ ] Hero has "Find Short-Lets" button → `/shortlets`

## 🐛 Common Issues

1. **404 Error:**
   - Check browser console for route errors
   - Verify route is in `App.routes.tsx`
   - Check component export name matches

2. **Blank Page:**
   - Check browser console for React errors
   - Verify all imports are correct
   - Check if API calls are failing

3. **Redirect Loop:**
   - Check authentication state
   - Verify ProtectedRoute logic
   - Check route order in App.routes.tsx

## 📝 Test Checklist

```
Public Routes:
[ ] /shortlets loads
[ ] /shortlets?location=Lekki works
[ ] /shortlets/:listingId loads (or shows error)

Protected Routes:
[ ] /owner/shortlets redirects when not logged in
[ ] /owner/shortlets loads when logged in as owner
[ ] /owner/shortlets/:listingId works

Navigation:
[ ] Sidebar link works
[ ] Dashboard Quick Actions work
[ ] Landing page links work
[ ] Active states highlight correctly
```

## 🚀 Quick Test Commands

```bash
# Start dev server (if not running)
npm run dev

# Then open browser and test:
# 1. http://localhost:5173/shortlets
# 2. http://localhost:5173/owner/shortlets (after login)
# 3. Click navigation links
```

