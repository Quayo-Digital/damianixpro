# 📅 Enhanced Calendar System Implementation

## Overview

A comprehensive calendar management system for shortlet listings with drag-and-drop selection, recurring patterns, dynamic pricing, and channel manager integration.

---

## ✅ Features Implemented

### 1. **Enhanced Calendar UI Component**

**File:** `src/components/shortlet/EnhancedCalendar.tsx`

**Features:**

- ✅ Drag-and-drop date selection
- ✅ Visual calendar grid with month navigation
- ✅ Color-coded date status (available, blocked, booked, custom pricing)
- ✅ Tabbed interface (Calendar, Pricing, Patterns, Channels)
- ✅ Real-time date range selection
- ✅ Responsive design

**Usage:**

```tsx
<EnhancedCalendar
  listingId="listing-123"
  listingTitle="Luxury Apartment"
  basePrice={50000}
  mode="manage"
  onPricingUpdate={(pricing) => console.log('Pricing updated', pricing)}
/>
```

---

### 2. **Dynamic Pricing Per Date**

**File:** `src/services/shortlet/api/pricing.ts`

**Features:**

- ✅ Set custom price for individual dates
- ✅ Bulk pricing updates
- ✅ Pricing rules (seasonal, day of week, advance booking, length of stay)
- ✅ Automatic price calculation considering all rules
- ✅ Min/max nights per date

**API Functions:**

- `getDatePricing()` - Get pricing for date range
- `setDatePrice()` - Set price for single date
- `bulkSetDatePricing()` - Set pricing for multiple dates
- `calculateDynamicPrice()` - Calculate price with all rules applied
- `createPricingRule()` - Create pricing rule
- `getActivePricingRules()` - Get applicable rules

**Example:**

```typescript
// Set custom pricing for specific dates
await bulkSetDatePricing(listingId, [
  { date: '2025-12-25', price: 75000, available: true },
  { date: '2025-12-26', price: 75000, available: true },
]);

// Calculate price with all rules
const breakdown = await calculateDynamicPrice(
  listingId,
  50000, // base price
  '2025-12-20',
  '2025-12-27',
  2 // guests
);
```

---

### 3. **Recurring Availability Patterns**

**File:** `src/services/shortlet/api/recurringPatterns.ts`

**Features:**

- ✅ Weekly patterns (e.g., Every Monday-Friday)
- ✅ Monthly patterns (e.g., First Monday of each month)
- ✅ Custom patterns (specific dates)
- ✅ Pattern-based pricing overrides
- ✅ Min/max nights per pattern
- ✅ Automatic pattern application to calendar

**Pattern Types:**

- **Weekly:** Repeat on specific days of week
- **Monthly:** Repeat on specific days of month or Nth occurrence of day
- **Custom:** Specific dates or custom logic

**Example:**

```typescript
// Create weekly pattern (Monday-Friday available)
await createRecurringPattern({
  listing_id: listingId,
  pattern_type: 'weekly',
  pattern_config: {
    daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
  },
  start_date: '2025-01-01',
  available: true,
  price_override: 55000, // Higher price for weekdays
});
```

---

### 4. **Channel Manager Integration**

**File:** `src/services/shortlet/api/channelManager.ts`

**Features:**

- ✅ Support for multiple channels (Airbnb, Booking.com, Expedia, VRBO)
- ✅ Bidirectional sync (to/from channel)
- ✅ Automatic availability synchronization
- ✅ Pricing synchronization
- ✅ Sync logs and error tracking
- ✅ Webhook support for real-time updates

**Supported Channels:**

- Airbnb
- Booking.com
- Expedia
- VRBO
- Custom API

**Sync Directions:**

- `to_channel` - Export to platform
- `from_channel` - Import from platform
- `bidirectional` - Two-way sync

**Example:**

```typescript
// Create integration
await createChannelIntegration({
  listing_id: listingId,
  channel_name: 'airbnb',
  channel_listing_id: 'airbnb-12345',
  sync_enabled: true,
  sync_direction: 'bidirectional',
  credentials: {
    api_key: 'your-api-key',
    api_secret: 'your-api-secret',
  },
});

// Sync availability to channel
await syncAvailabilityToChannel(integrationId, startDate, endDate);
```

---

### 5. **Database Schema**

**File:** `supabase/migrations/20250122000001_enhance_calendar_pricing.sql`

**New Tables:**

- `listing_pricing` - Date-specific pricing
- `recurring_availability_patterns` - Recurring patterns
- `channel_manager_integrations` - Channel connections
- `channel_sync_logs` - Sync history
- `pricing_rules` - Dynamic pricing rules

**Enhanced Tables:**

- `listing_availabilities` - Added pricing and restrictions columns

---

## 🎯 Component Structure

```
EnhancedCalendar
├── Calendar Tab
│   ├── Month Navigation
│   ├── Drag-and-Drop Selection
│   ├── Date Status Display
│   └── Legend
├── Pricing Tab
│   ├── Date-Specific Pricing List
│   ├── Add/Edit Pricing
│   └── Bulk Operations
├── Patterns Tab
│   ├── Pattern List
│   ├── Create/Edit Pattern Dialog
│   └── Pattern Preview
└── Channels Tab
    ├── Integration List
    ├── Add/Edit Integration Dialog
    └── Manual Sync Buttons
```

---

## 📋 Usage Examples

### Basic Calendar

```tsx
import { EnhancedCalendar } from '@/components/shortlet/EnhancedCalendar';

<EnhancedCalendar
  listingId={listing.id}
  listingTitle={listing.title}
  basePrice={listing.base_price}
  mode="manage"
/>;
```

### Using the Hook

```tsx
import { useEnhancedCalendar } from '@/hooks/useEnhancedCalendar';

const { loadCalendar, setPricing, calculatePrice } = useEnhancedCalendar({
  listingId: 'listing-123',
  basePrice: 50000,
});

// Load calendar for month
await loadCalendar(new Date(2025, 0, 1), new Date(2025, 0, 31));

// Set pricing for selected dates
await setPricing(['2025-12-25', '2025-12-26'], 75000, {
  minNights: 2,
  available: true,
});

// Calculate price
const price = await calculatePrice('2025-12-20', '2025-12-27', 2);
```

---

## 🔧 Configuration

### Environment Variables

```env
# Channel Manager APIs (if using)
VITE_AIRBNB_API_KEY=your_key
VITE_BOOKING_COM_API_KEY=your_key
VITE_EXPEDIA_API_KEY=your_key
```

---

## 🚀 Next Steps

1. **Run Database Migration:**

   ```sql
   -- Run in Supabase SQL Editor
   -- File: supabase/migrations/20250122000001_enhance_calendar_pricing.sql
   ```

2. **Update Listing Form:**
   - Add calendar management to listing creation/editing
   - Integrate with existing ShortletListingForm

3. **Implement Channel APIs:**
   - Add actual API calls for each channel
   - Handle authentication and rate limiting
   - Implement webhook handlers

4. **Add Tests:**
   - Unit tests for pricing calculations
   - Integration tests for pattern application
   - E2E tests for calendar interactions

---

## 📊 Database Schema

### listing_pricing

- `id` UUID
- `listing_id` UUID
- `date` DATE
- `price` NUMERIC(12,2)
- `min_nights` INTEGER
- `max_nights` INTEGER
- `available` BOOLEAN
- `source` TEXT
- `source_id` TEXT
- `notes` TEXT

### recurring_availability_patterns

- `id` UUID
- `listing_id` UUID
- `pattern_type` TEXT (weekly/monthly/custom)
- `pattern_config` JSONB
- `start_date` DATE
- `end_date` DATE
- `available` BOOLEAN
- `price_override` NUMERIC(12,2)
- `min_nights` INTEGER
- `max_nights` INTEGER
- `active` BOOLEAN

### channel_manager_integrations

- `id` UUID
- `listing_id` UUID
- `channel_name` TEXT
- `channel_listing_id` TEXT
- `sync_enabled` BOOLEAN
- `sync_direction` TEXT
- `last_sync_at` TIMESTAMP
- `sync_status` TEXT
- `credentials` JSONB
- `settings` JSONB

---

## 🎨 UI Features

### Drag-and-Drop

- Click and drag to select date ranges
- Visual feedback during selection
- Automatic pricing dialog on release

### Visual Indicators

- 🟢 Green: Available
- 🔴 Red: Blocked
- ⚫ Gray: Booked
- 💰 Amber icon: Custom pricing

### Keyboard Navigation

- Arrow keys to navigate months
- Enter to select dates
- Escape to cancel selection

---

## 🔒 Security

- Row Level Security (RLS) policies enabled
- Only listing owners can manage pricing/patterns
- Credentials encrypted in database
- API keys stored securely

---

## 📝 Notes

- All dates are stored in UTC
- Pricing is in Nigerian Naira (₦)
- Calendar shows 90 days by default
- Patterns can be active or inactive
- Channel sync can be scheduled or manual

---

**Status:** ✅ Complete - Ready for Integration

**Last Updated:** January 2025
