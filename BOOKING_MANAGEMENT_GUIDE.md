# Booking Management Components Guide

Complete guide to the booking management system.

## 📦 Components Created

### 1. BookingList
**Location:** `src/components/shortlet/BookingList.tsx`

Comprehensive booking list component with:
- Status filtering (All, Pending, Confirmed, Cancelled, Completed)
- Search functionality
- Status counts per tab
- Multiple modes (owner, guest, listing)
- Status management actions

**Props:**
```typescript
interface BookingListProps {
  listingId?: string;      // Filter by listing
  ownerId?: string;        // Filter by owner
  guestId?: string;        // Filter by guest
  mode?: 'owner' | 'guest' | 'listing';
  onBookingClick?: (bookingId: string) => void;
}
```

**Usage:**
```tsx
// Owner's bookings
<BookingList 
  ownerId={userId}
  mode="owner"
  onBookingClick={(id) => navigate(`/bookings/${id}`)}
/>

// Guest's bookings
<BookingList 
  guestId={userId}
  mode="guest"
/>

// Listing's bookings
<BookingList 
  listingId={listingId}
  mode="listing"
/>
```

### 2. BookingCard
**Location:** `src/components/shortlet/BookingCard.tsx`

Individual booking card component with:
- Booking details (dates, guests, price)
- Status badge
- Guest/Owner information
- Action buttons (Approve, Cancel, View)
- Confirmation dialogs

**Props:**
```typescript
interface BookingCardProps {
  booking: Booking;
  mode?: 'owner' | 'guest' | 'listing';
  onView?: (bookingId: string) => void;
  onStatusChange?: (bookingId: string, status: BookingStatus) => void;
}
```

### 3. BookingDetails
**Location:** `src/components/shortlet/BookingDetails.tsx`

Detailed booking view with:
- Complete booking information
- Listing details
- Guest/Host information
- Price breakdown
- Payment information
- Action buttons (Approve, Cancel)
- Special requests display

**Props:**
```typescript
interface BookingDetailsProps {
  bookingId?: string;
  mode?: 'owner' | 'guest';
}
```

## 📄 Pages Created

### 1. BookingsPage
**Location:** `src/pages/BookingsPage.tsx`

Main bookings management page:
- Shows all bookings for user
- Owner mode: All bookings across listings
- Guest mode: User's booking history
- Tabbed interface for different views

**Route:** `/bookings`

### 2. BookingDetailPage
**Location:** `src/pages/BookingDetailPage.tsx`

Detailed booking view page:
- Full booking information
- Actions based on user role
- Navigation back to list

**Route:** `/bookings/:bookingId`

## 🎯 Features

### Status Management
- **Approve:** Owner can approve pending bookings
- **Cancel:** Owner or guest can cancel bookings
- **View:** View detailed booking information
- **Status Filtering:** Filter by booking status

### Information Display
- **Booking Details:** Dates, guests, nights
- **Price Breakdown:** Total, fees, payout
- **Guest Info:** Name, email, phone (for owners)
- **Host Info:** Name, email (for guests)
- **Payment Status:** Payment reference and status

### Actions
- **Approve Booking:** Change status from pending to confirmed
- **Cancel Booking:** Cancel with reason
- **View Listing:** Navigate to listing page
- **View Details:** See full booking information

## 🔄 API Functions

### getBookingsByOwner
```typescript
const bookings = await getBookingsByOwner(ownerId, status?);
```

### getBookingsByGuest
```typescript
const bookings = await getBookingsByGuest(guestId, status?);
```

### getBookingsByListing
```typescript
const bookings = await getBookingsByListing(listingId);
```

### getBookingById
```typescript
const booking = await getBookingById(bookingId);
```

### updateBookingStatus
```typescript
await updateBookingStatus(bookingId, 'confirmed', reason?);
```

## 🎨 Status Badges

- **Pending:** Secondary badge with Clock icon
- **Confirmed:** Default badge with CheckCircle icon
- **Cancelled:** Destructive badge with XCircle icon
- **Completed:** Default badge with CheckCircle icon
- **Refunded:** Secondary badge with AlertCircle icon

## 📍 Integration Points

### In Listing Page
```tsx
// In ShortletListingPage.tsx
<TabsContent value="bookings">
  <BookingList 
    listingId={listing.id}
    mode="listing"
    onBookingClick={(id) => navigate(`/bookings/${id}`)}
  />
</TabsContent>
```

### In Owner Dashboard
```tsx
// Add to owner dashboard
<BookingList 
  ownerId={user.id}
  mode="owner"
/>
```

### In Guest Dashboard
```tsx
// Add to guest/tenant dashboard
<BookingList 
  guestId={user.id}
  mode="guest"
/>
```

## 🔗 Routes

### Public Routes
- `/bookings` - Bookings list (requires auth)
- `/bookings/:bookingId` - Booking details (requires auth)

### Navigation
```tsx
// Navigate to bookings
navigate('/bookings');

// Navigate to specific booking
navigate(`/bookings/${bookingId}`);

// Navigate with filters
navigate('/bookings?listingId=123');
```

## 🎯 User Flows

### Owner Flow
1. View all bookings in `/bookings`
2. Filter by status (Pending, Confirmed, etc.)
3. Click booking to view details
4. Approve or cancel booking
5. View guest information

### Guest Flow
1. View booking history in `/bookings`
2. Filter by status
3. Click booking to view details
4. Cancel booking if needed
5. View listing information

## ✨ Key Features

1. **Status Management:** Approve, cancel, view bookings
2. **Filtering:** By status, search, listing
3. **Information Display:** Complete booking details
4. **Actions:** Context-aware actions based on role
5. **Confirmation Dialogs:** Safe status changes
6. **Responsive Design:** Works on all devices

## 🐛 Common Issues

### Issue: Bookings not loading
**Solution:** Check if user has proper permissions and bookings exist

### Issue: Status update fails
**Solution:** Verify booking status allows the transition

### Issue: Guest/Owner info not showing
**Solution:** Check if related data is fetched in API query

## 📝 Future Enhancements

1. **Bulk Actions:** Select multiple bookings for bulk operations
2. **Export:** Export bookings to CSV/PDF
3. **Calendar View:** Show bookings on calendar
4. **Notifications:** Real-time booking updates
5. **Messaging:** Direct communication between owner and guest
6. **Reviews:** Add review functionality after completion

