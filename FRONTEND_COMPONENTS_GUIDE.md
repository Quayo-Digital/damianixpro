# Frontend Components Guide

Complete guide to the short-let frontend components.

## Components Overview

### 1. ShortletCalendar
**Location:** `src/components/shortlet/ShortletCalendar.tsx`

Interactive calendar component for viewing and managing listing availability.

**Features:**
- Visual calendar with date selection
- Color-coded availability (available, blocked, booked)
- Block/unblock dates functionality
- Conflict detection
- Integration with booking system

**Usage:**
```tsx
import { ShortletCalendar } from '@/components/shortlet';

<ShortletCalendar
  listingId="listing-uuid"
  listingTitle="Cozy Apartment"
  mode="manage" // or "view"
  onDateSelect={(date) => console.log(date)}
/>
```

**Props:**
- `listingId` (string, required): The listing ID
- `listingTitle` (string, optional): Display title
- `onDateSelect` (function, optional): Callback when date is clicked
- `mode` ('view' | 'manage'): Display mode

### 2. BookingFlow
**Location:** `src/components/shortlet/BookingFlow.tsx`

Complete booking flow component for guests to book short-lets.

**Features:**
- Multi-step booking process
- Date selection with availability checking
- Guest count selection
- Price calculation and breakdown
- Payment integration
- Special requests

**Usage:**
```tsx
import { BookingFlow } from '@/components/shortlet';

<BookingFlow
  listingId="listing-uuid"
  onBookingComplete={(bookingId) => navigate(`/bookings/${bookingId}`)}
/>
```

**Steps:**
1. **Dates**: Select check-in and check-out dates
2. **Guests**: Enter number of guests and special requests
3. **Review**: Review booking summary and price breakdown
4. **Payment**: Redirect to Paystack payment
5. **Success**: Confirmation screen

### 3. ShortletListingForm
**Location:** `src/components/shortlet/ShortletListingForm.tsx`

Form component for creating and editing short-let listings.

**Features:**
- Property selection
- Listing details (title, description, capacity)
- Pricing (base price, cleaning fee, security deposit)
- Amenities selection
- Instant book toggle
- Form validation with Zod

**Usage:**
```tsx
import { ShortletListingForm } from '@/components/shortlet';

<ShortletListingForm
  propertyId="property-uuid"
  listingId="listing-uuid" // for editing
  onSuccess={(listingId) => console.log('Created:', listingId)}
  onCancel={() => console.log('Cancelled')}
/>
```

### 4. ShortletListingCard
**Location:** `src/components/shortlet/ShortletListingCard.tsx`

Card component for displaying listing information in a grid/list.

**Features:**
- Listing image
- Title and location
- Price display
- Amenities badges
- Action buttons (view, edit, delete)

**Usage:**
```tsx
import { ShortletListingCard } from '@/components/shortlet';

<ShortletListingCard
  listing={listingData}
  onView={(id) => navigate(`/shortlets/${id}`)}
  onEdit={(id) => setEditingId(id)}
  onDelete={(id) => handleDelete(id)}
  showActions={true}
/>
```

## Pages

### ShortletListingPage
**Location:** `src/pages/ShortletListingPage.tsx`

Complete page for viewing and managing a single listing.

**Features:**
- Listing details display
- Tabbed interface (View & Book, Calendar, Bookings)
- Edit mode for owners
- Integrated booking flow
- Calendar management

**Usage:**
Add to your routes:
```tsx
<Route path="/shortlets/:listingId" element={<ShortletListingPage />} />
```

## Component Integration

### Example: Listing Management Page

```tsx
import { useState } from 'react';
import { ShortletListingCard, ShortletListingForm } from '@/components/shortlet';
import { Dialog } from '@/components/ui/dialog';
import { getListingsByOwner } from '@/services/shortlet/api/listings';

function MyListingsPage() {
  const [listings, setListings] = useState([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map(listing => (
        <ShortletListingCard
          key={listing.id}
          listing={listing}
          onEdit={setEditingId}
          showActions={true}
        />
      ))}
      
      <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent>
          {editingId && (
            <ShortletListingForm
              listingId={editingId}
              onSuccess={() => {
                setEditingId(null);
                // Reload listings
              }}
              onCancel={() => setEditingId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

### Example: Booking Page

```tsx
import { BookingFlow } from '@/components/shortlet';
import { useParams } from 'react-router-dom';

function BookingPage() {
  const { listingId } = useParams();
  
  if (!listingId) return <div>Listing not found</div>;
  
  return (
    <div className="container mx-auto py-8">
      <BookingFlow
        listingId={listingId}
        onBookingComplete={(bookingId) => {
          navigate(`/bookings/${bookingId}`);
        }}
      />
    </div>
  );
}
```

## Styling

All components use:
- **Tailwind CSS** for styling
- **shadcn/ui** components for UI elements
- **Lucide React** for icons
- Consistent color scheme from theme

## Dependencies

Required packages (already installed):
- `react-day-picker` - Calendar component
- `date-fns` - Date formatting
- `react-hook-form` - Form handling
- `zod` - Schema validation
- `lucide-react` - Icons

## Best Practices

1. **Always check authentication** before showing owner actions
2. **Handle loading states** with skeleton loaders
3. **Show error messages** using toast notifications
4. **Validate inputs** on both client and server
5. **Use TypeScript** for type safety
6. **Follow accessibility** guidelines (ARIA labels, keyboard navigation)

## Next Steps

1. Add booking list component
2. Add review/rating component
3. Add image gallery component
4. Add search and filter components
5. Add map integration for location display

