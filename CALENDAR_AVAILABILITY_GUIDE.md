# Calendar & Availability Management Guide

Complete guide to managing listing availability and calendars in the short-let system.

## Overview

The calendar system manages listing availability, handles date blocking, detects conflicts, and supports external calendar synchronization.

## Core Concepts

### Availability States

- **Available**: Dates are open for booking
- **Blocked**: Dates are manually blocked (maintenance, owner use, etc.)
- **Booked**: Dates have confirmed bookings (automatically blocked)

### Date Ranges

Availability is stored as date ranges in the `listing_availabilities` table:
- Each entry has a `start_date` and `end_date`
- Can be marked as `available: true` or `available: false`
- Supports overlapping ranges with conflict resolution

## API Usage

### Get Calendar View

```typescript
import { getCalendarView } from '@/services/shortlet/api/calendar';

const calendar = await getCalendarView({
  listing_id: 'listing-uuid',
  start_date: '2025-02-01',
  end_date: '2025-02-28',
  include_bookings: true
});

// calendar.dates contains array of:
// {
//   date: '2025-02-01',
//   available: true,
//   blocked: false
// }
```

### Block Dates

```typescript
import { blockDates } from '@/services/shortlet/api/calendar';

await blockDates(
  'listing-uuid',
  '2025-02-10',
  '2025-02-15',
  'Maintenance period'
);
```

### Unblock Dates

```typescript
import { unblockDates } from '@/services/shortlet/api/calendar';

await unblockDates(
  'listing-uuid',
  '2025-02-10',
  '2025-02-15'
);
```

### Bulk Update Availability

```typescript
import { bulkUpdateAvailability } from '@/services/shortlet/api/calendar';

const result = await bulkUpdateAvailability({
  listing_id: 'listing-uuid',
  dates: [
    {
      start_date: '2025-02-01',
      end_date: '2025-02-05',
      available: false,
      source: 'manual',
      notes: 'Owner vacation'
    },
    {
      start_date: '2025-02-10',
      end_date: '2025-02-12',
      available: false,
      source: 'external',
      notes: 'Imported from Airbnb'
    }
  ]
});

console.log(`Created: ${result.created}, Updated: ${result.updated}`);
```

### Check for Conflicts

```typescript
import { getAvailabilityConflicts } from '@/services/shortlet/api/calendar';

const conflicts = await getAvailabilityConflicts(
  'listing-uuid',
  '2025-02-10',
  '2025-02-15'
);

if (conflicts.has_conflicts) {
  console.log('Conflicts found:', conflicts.conflicts);
  // conflicts.conflicts contains:
  // - type: 'booking' or 'blocked'
  // - start_date, end_date
  // - details: booking/availability info
}
```

### Find Next Available Dates

```typescript
import { getNextAvailableDates } from '@/services/shortlet/api/calendar';

// Find dates with 3 consecutive available nights starting from Feb 1
const availableDates = await getNextAvailableDates(
  'listing-uuid',
  '2025-02-01',
  3, // nights
  90 // max days to search
);

// Returns array of start dates where 3+ nights are available
console.log(availableDates); // ['2025-02-05', '2025-02-20', ...]
```

### Set Default Availability

```typescript
import { setDefaultAvailability } from '@/services/shortlet/api/calendar';

// Make listing available for entire period
await setDefaultAvailability(
  'listing-uuid',
  '2025-02-01',
  '2025-12-31'
);
```

## Using React Hook

```typescript
import { useShortletCalendar } from '@/hooks/useShortletCalendar';

function ListingCalendar({ listingId }: { listingId: string }) {
  const {
    calendar,
    availability,
    isLoading,
    refreshCalendar,
    blockDates,
    unblockDates,
    checkConflicts,
    getAvailableDates
  } = useShortletCalendar();

  useEffect(() => {
    const start = new Date().toISOString().split('T')[0];
    const end = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    refreshCalendar(listingId, start, end);
  }, [listingId]);

  const handleBlock = async () => {
    await blockDates(listingId, '2025-02-10', '2025-02-15', 'Maintenance');
  };

  return (
    <div>
      {calendar?.dates.map(date => (
        <div key={date.date}>
          {date.date}: {date.available ? 'Available' : 'Unavailable'}
        </div>
      ))}
    </div>
  );
}
```

## iCal Import/Export

### Export Calendar

```typescript
import { exportListingCalendar } from '@/services/shortlet/utils/ical';

const icalString = await exportListingCalendar('listing-uuid');

// Download as file
const blob = new Blob([icalString], { type: 'text/calendar' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'listing-calendar.ics';
a.click();
```

### Import Calendar

```typescript
import { importICalToAvailability } from '@/services/shortlet/utils/ical';

// Read iCal file
const file = event.target.files[0];
const icalString = await file.text();

const result = await importICalToAvailability(
  'listing-uuid',
  icalString,
  'airbnb' // source
);

console.log(`Imported ${result.imported} blocked dates`);
```

## Conflict Resolution

The system automatically handles conflicts:

1. **Booking Conflicts**: Bookings take priority - dates are automatically unavailable
2. **Blocked Date Conflicts**: Manual blocks override default availability
3. **Overlapping Ranges**: System merges or splits ranges intelligently

### Conflict Detection Flow

```
1. Guest selects dates → checkAvailability()
2. System checks:
   - Existing bookings (confirmed/pending)
   - Blocked availability entries
   - Date range validity
3. Returns conflicts if any
4. Prevents double-booking
```

## Best Practices

### 1. Set Default Availability

When creating a listing, set default availability:

```typescript
await setDefaultAvailability(
  listingId,
  new Date().toISOString().split('T')[0],
  new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
);
```

### 2. Block Maintenance Periods

Block dates for maintenance well in advance:

```typescript
await blockDates(
  listingId,
  '2025-03-01',
  '2025-03-05',
  'Annual maintenance and deep cleaning'
);
```

### 3. Sync External Calendars

Import blocked dates from external platforms:

```typescript
// After importing from Airbnb/Booking.com
await importICalToAvailability(listingId, icalData, 'airbnb');
```

### 4. Check Conflicts Before Blocking

Always check for conflicts before blocking dates:

```typescript
const conflicts = await getAvailabilityConflicts(listingId, startDate, endDate);
if (conflicts.has_conflicts) {
  // Warn user about existing bookings
  console.warn('Blocking dates with existing bookings:', conflicts.conflicts);
}
```

## Calendar View Structure

```typescript
interface AvailabilityCalendar {
  listing_id: string;
  dates: {
    date: string;           // YYYY-MM-DD
    available: boolean;     // Is date available?
    blocked?: boolean;      // Is date manually blocked?
    price?: number;         // Optional: dynamic pricing
  }[];
}
```

## Integration with Bookings

The calendar automatically reflects bookings:

- **Pending bookings**: Dates shown as unavailable
- **Confirmed bookings**: Dates shown as unavailable
- **Completed bookings**: Dates become available after checkout
- **Cancelled bookings**: Dates become available immediately

## Performance Considerations

1. **Cache calendar views** for frequently accessed listings
2. **Limit date ranges** in queries (e.g., 90 days max)
3. **Use indexes** on `start_date` and `end_date` columns
4. **Batch operations** for bulk updates

## Error Handling

All calendar functions return structured responses:

```typescript
// Success
await blockDates(...); // No error thrown

// Conflict error
try {
  await createBooking(...);
} catch (error) {
  if (error.message.includes('not available')) {
    // Handle conflict
  }
}
```

## Testing

### Test Date Blocking

```typescript
// Block dates
await blockDates(listingId, '2025-02-10', '2025-02-15');

// Try to book - should fail
try {
  await createBooking({
    listing_id: listingId,
    checkin_date: '2025-02-12',
    checkout_date: '2025-02-14',
    guests_count: 2
  }, guestId);
} catch (error) {
  console.log('Booking blocked as expected');
}
```

### Test Conflict Detection

```typescript
const conflicts = await getAvailabilityConflicts(
  listingId,
  '2025-02-10',
  '2025-02-15'
);

expect(conflicts.has_conflicts).toBe(true);
expect(conflicts.conflicts.length).toBeGreaterThan(0);
```

## Next Steps

1. Build calendar UI component
2. Add drag-and-drop date selection
3. Implement recurring availability patterns
4. Add dynamic pricing per date
5. Channel manager integration (Phase 2)

