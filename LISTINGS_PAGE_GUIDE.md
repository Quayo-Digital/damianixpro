# Listings List/Search Page Guide

Complete guide to the new listings list and search page.

## 📄 Page Overview

**File:** `src/pages/ShortletListingsPage.tsx`

A comprehensive listings page that combines search, filtering, and listing management in one interface.

## 🎯 Features

### Public Mode (`/shortlets`)
- **Search Bar:** Text search for listings
- **Advanced Filters:** Dates, guests, price, amenities, location
- **Grid/List View:** Toggle between grid and list layouts
- **Pagination:** Load more functionality
- **Results Count:** Shows total listings found
- **Empty State:** Helpful message when no listings found

### Owner Mode (`/owner/shortlets`)
- **All Public Features:** Plus owner-specific features
- **Create Listing:** Button to create new listing
- **Edit/Delete Actions:** Manage own listings
- **Owner's Listings Only:** Shows only listings owned by user
- **Quick Actions:** Edit and delete buttons on cards

## 🎨 View Modes

### Grid View (Default)
- 3-column layout on desktop
- 2-column on tablet
- 1-column on mobile
- Card-based display with image, title, price

### List View
- Horizontal card layout
- Image on left, details on right
- More information visible at once
- Better for comparing listings

## 🔍 Search & Filters

### Search Bar
- Real-time text search
- Searches title and description
- Enter key to search
- Search button for manual trigger

### Filters
- **Dates:** Check-in/check-out calendar picker
- **Guests:** Number input
- **Price:** Slider with min/max inputs
- **Amenities:** Multi-select checkboxes
- **Location:** Text input
- **Sort:** Popular, Price Low/High, Newest

### URL Parameters
All filters are synced with URL for shareable links:
```
/shortlets?location=Lekki&guests=2&min_price=10000&max_price=50000&sort_by=price_low
```

## 📋 Owner Features

### Create Listing
- "Create New Listing" button in header
- Opens dialog with `ShortletListingForm`
- Redirects to listing detail after creation

### Manage Listings
- Edit button on each listing card
- Delete button (with confirmation - TODO)
- View own listings only
- Quick access to listing management

## 🎯 Usage

### Public Access
```tsx
// Navigate to public listings
navigate('/shortlets');

// With filters
navigate('/shortlets?location=Lekki&guests=2');
```

### Owner Access
```tsx
// Navigate to owner listings
navigate('/owner/shortlets');

// Create new listing
navigate('/owner/shortlets');
// Click "Create New Listing" button
```

## 🔄 Route Structure

```
/shortlets                    → Public listings page
/shortlets?location=Lekki     → Filtered public listings
/owner/shortlets              → Owner's listings (protected)
/owner/shortlets/:listingId    → Owner listing detail
```

## 🎨 Component Structure

```
ShortletListingsPage
├── Header (title, create button)
├── Search Bar (with filter toggle)
├── SearchFilters (conditional, when filters shown)
├── Results Header (count, view toggle)
├── Listings Grid/List
│   └── ShortletListingCard (grid or list mode)
├── Load More Button (if has more)
└── Create Dialog (owner mode only)
```

## 📱 Responsive Design

- **Mobile:** Single column, stacked layout
- **Tablet:** 2-column grid
- **Desktop:** 3-column grid
- **List View:** Horizontal cards on all sizes

## 🔧 API Integration

### Public Listings
```typescript
await searchListings({
  query: searchQuery,
  location: filters.location,
  guests: filters.guests,
  min_price: filters.min_price,
  max_price: filters.max_price,
  sort_by: filters.sort_by,
  page: page,
  page_size: 12
});
```

### Owner Listings
```typescript
await getOwnerListings(userId);
```

## ✨ Key Features

1. **Dual Mode:** Public and owner modes in one component
2. **View Toggle:** Grid and list views
3. **URL Sync:** Filters saved in URL
4. **Pagination:** Load more for better performance
5. **Empty States:** Helpful messages for no results
6. **Create Flow:** Integrated listing creation for owners
7. **Responsive:** Works on all screen sizes

## 🐛 Common Issues

### Issue: Owner listings not showing
**Solution:** Check if user has properties. Listings require properties first.

### Issue: Filters not working
**Solution:** Verify URL parameters are being read correctly.

### Issue: List view not displaying
**Solution:** Check `viewMode` prop is passed to `ShortletListingCard`.

## 📝 Future Enhancements

1. **Delete Confirmation:** Add confirmation dialog for delete
2. **Bulk Actions:** Select multiple listings for bulk operations
3. **Export:** Export listings to CSV/PDF
4. **Saved Searches:** Save favorite filter combinations
5. **Map View:** Show listings on map
6. **Sorting Options:** More sort criteria (rating, distance, etc.)

## 🧪 Testing

### Test Public Mode
1. Navigate to `/shortlets`
2. Test search functionality
3. Test filters
4. Toggle grid/list view
5. Test pagination

### Test Owner Mode
1. Login as owner
2. Navigate to `/owner/shortlets`
3. Create new listing
4. Edit existing listing
5. Test delete (when implemented)

