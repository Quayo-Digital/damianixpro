# Short-Let Routing Integration Guide

Complete guide to the integrated short-let routes in the application.

## Routes Added

### Public Routes (No Authentication Required)

#### 1. Search & Discovery
**Path:** `/shortlets`  
**Component:** `ShortletSearchPage`  
**Access:** Public (anyone can search)  
**Features:**
- Search listings
- Filter by location, dates, price, amenities
- Discovery section (featured, popular, recommended)
- URL parameter support for shareable searches

**Example URLs:**
```
/shortlets
/shortlets?location=Lekki&guests=2
/shortlets?checkin_date=2025-03-01&checkout_date=2025-03-05
/shortlets?min_price=10000&max_price=50000&sort_by=price_low
```

#### 2. Listing Detail
**Path:** `/shortlets/:listingId`  
**Component:** `ShortletListingPage`  
**Access:** Public (anyone can view)  
**Features:**
- View listing details
- Booking flow (requires auth when booking)
- Calendar view
- Owner can edit if they own the listing

**Example URLs:**
```
/shortlets/123e4567-e89b-12d3-a456-426614174000
```

### Protected Routes (Owner Only)

#### 3. Owner Short-Let Management
**Path:** `/owner/shortlets`  
**Component:** `ShortletSearchPage` (with owner context)  
**Access:** Owner role required  
**Features:**
- View all owner's listings
- Search and filter own listings
- Access to management features

#### 4. Owner Listing Detail
**Path:** `/owner/shortlets/:listingId`  
**Component:** `ShortletListingPage` (with edit mode)  
**Access:** Owner role required  
**Features:**
- Full listing management
- Edit listing details
- Calendar management
- View bookings
- Wallet/payout access

## Navigation Examples

### From React Components

```tsx
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();

  // Navigate to search
  navigate('/shortlets');

  // Navigate with filters
  navigate('/shortlets?location=Lekki&guests=2');

  // Navigate to listing
  navigate(`/shortlets/${listingId}`);

  // Navigate to owner management
  navigate('/owner/shortlets');
}
```

### From Links

```tsx
import { Link } from 'react-router-dom';

<Link to="/shortlets">Browse Short-Lets</Link>
<Link to={`/shortlets/${listing.id}`}>View Listing</Link>
<Link to="/owner/shortlets">My Listings</Link>
```

### Programmatic Navigation with Filters

```tsx
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Build search URL with filters
const searchParams = new URLSearchParams({
  location: 'Lekki',
  guests: '2',
  min_price: '10000',
  max_price: '50000',
  sort_by: 'price_low'
});

navigate(`/shortlets?${searchParams.toString()}`);
```

## Route Protection

### Public Routes
- `/shortlets` - No authentication required
- `/shortlets/:listingId` - No authentication required (but booking requires auth)

### Protected Routes
- `/owner/shortlets` - Requires `owner` role
- `/owner/shortlets/:listingId` - Requires `owner` role

The booking flow will prompt for authentication when a guest tries to book.

## URL Parameters

### Search Parameters
- `location` - Filter by location (e.g., `Lekki`, `Victoria Island`)
- `checkin_date` - Check-in date (YYYY-MM-DD format)
- `checkout_date` - Check-out date (YYYY-MM-DD format)
- `guests` - Number of guests (integer)
- `min_price` - Minimum price per night (integer)
- `max_price` - Maximum price per night (integer)
- `sort_by` - Sort option (`popular`, `price_low`, `price_high`, `newest`)

### Example
```
/shortlets?location=Lekki&checkin_date=2025-03-01&checkout_date=2025-03-05&guests=2&min_price=10000&max_price=50000&sort_by=price_low
```

## Integration with Existing Navigation

### Add to Main Navigation Menu

```tsx
// In your navigation component
<NavLink to="/shortlets">Short-Lets</NavLink>

// For owners
{user?.role === 'owner' && (
  <NavLink to="/owner/shortlets">My Short-Lets</NavLink>
)}
```

### Add to Owner Dashboard

```tsx
// In EnhancedOwnerDashboardPage.tsx
import { Link } from 'react-router-dom';

<Button asChild>
  <Link to="/owner/shortlets">
    Manage Short-Lets
  </Link>
</Button>
```

### Add to Landing Page

```tsx
// In Landing page
<Button asChild>
  <Link to="/shortlets">
    Browse Short-Lets
  </Link>
</Button>
```

## Route Structure

```
/shortlets                          → Search & Discovery (Public)
/shortlets/:listingId                → Listing Detail (Public)
/owner/shortlets                     → Owner Management (Protected)
/owner/shortlets/:listingId          → Owner Listing Detail (Protected)
```

## Authentication Flow

1. **Public Access:**
   - Anyone can search and view listings
   - Booking button prompts login if not authenticated

2. **Owner Access:**
   - Must be logged in with `owner` role
   - Can access `/owner/shortlets` routes
   - Can edit their own listings

3. **Guest Booking:**
   - Can view listings without auth
   - Must authenticate to complete booking
   - Redirected to login if not authenticated

## Testing Routes

### Test Public Routes
```bash
# Should work without login
http://localhost:5173/shortlets
http://localhost:5173/shortlets?location=Lekki
```

### Test Protected Routes
```bash
# Should redirect to login if not authenticated
http://localhost:5173/owner/shortlets
```

### Test with Authentication
1. Login as owner
2. Navigate to `/owner/shortlets`
3. Should see owner's listings

## Error Handling

### 404 Handling
- Invalid listing ID → Shows "Listing not found"
- Invalid route → Shows 404 page

### Authentication Errors
- Unauthorized access → Redirects to login
- Wrong role → Shows access denied

## Future Enhancements

1. **Guest Routes:**
   - `/guest/bookings` - View guest bookings
   - `/guest/bookings/:bookingId` - Booking details

2. **Admin Routes:**
   - `/admin/shortlets` - Admin listing management
   - `/admin/shortlets/:listingId` - Admin listing detail

3. **Booking Routes:**
   - `/bookings/:bookingId` - Booking confirmation
   - `/bookings/:bookingId/payment` - Payment page

## Notes

- All routes use lazy loading for optimal performance
- Routes are protected using `ProtectedRoute` component
- URL parameters are preserved for shareable links
- Search state is managed via URL for bookmarking

