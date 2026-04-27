# 📅 Calendar System Migration Guide

## Overview

The enhanced calendar system has been implemented and integrated. This guide helps you understand the changes and how to use the new features.

---

## 🆕 What's New

### Enhanced Calendar Component

- **File:** `src/components/shortlet/EnhancedCalendar.tsx`
- **Replaces:** Basic `ShortletCalendar` for advanced management
- **Features:**
  - Drag-and-drop date selection
  - Dynamic pricing per date
  - Recurring availability patterns
  - Channel manager integration

### New Services

- `src/services/shortlet/api/pricing.ts` - Dynamic pricing
- `src/services/shortlet/api/recurringPatterns.ts` - Pattern management
- `src/services/shortlet/api/channelManager.ts` - Channel sync

### New Hook

- `src/hooks/useEnhancedCalendar.ts` - Calendar management hook

---

## 🔄 Migration Steps

### 1. Run Database Migration

**Critical:** Run this migration before using the new features.

**📖 Detailed Instructions:** See `RUN_CALENDAR_MIGRATION.md` for step-by-step guide.

**Quick Steps:**

1. Open Supabase Dashboard → SQL Editor
2. Open file: `supabase/migrations/20250122000001_enhance_calendar_pricing.sql`
3. Copy all SQL content
4. Paste into SQL Editor
5. Click "Run"
6. Verify success (see verification queries in `RUN_CALENDAR_MIGRATION.md`)

This creates:

- `listing_pricing` table
- `recurring_availability_patterns` table
- `channel_manager_integrations` table
- `channel_sync_logs` table
- `pricing_rules` table

### 2. Update Component Imports

**Before:**

```tsx
import { ShortletCalendar } from '@/components/shortlet/ShortletCalendar';
```

**After (for management):**

```tsx
import { EnhancedCalendar } from '@/components/shortlet/EnhancedCalendar';

<EnhancedCalendar
  listingId={listing.id}
  listingTitle={listing.title}
  basePrice={Number(listing.base_price)}
  mode="manage"
/>;
```

**For public view (simple calendar):**

```tsx
// Keep using ShortletCalendar for simple view-only calendars
import { ShortletCalendar } from '@/components/shortlet/ShortletCalendar';
```

### 3. Update Pricing Calculations

**Before:**

```tsx
import { calculatePriceBreakdown } from '@/services/shortlet/utils/priceCalculator';

const breakdown = calculatePriceBreakdown({
  listing,
  checkin_date,
  checkout_date,
  guests_count,
});
```

**After (with dynamic pricing):**

```tsx
import { calculateDynamicPrice } from '@/services/shortlet/api/pricing';

const breakdown = await calculateDynamicPrice(
  listingId,
  basePrice,
  checkin_date,
  checkout_date,
  guests_count
);
```

---

## 📍 Current Integration Status

### ✅ Already Integrated

- **ShortletListingPage** - Uses `EnhancedCalendar` in manage mode for owners

### 🔄 Can Be Enhanced

- **BookingFlow** - Could use `calculateDynamicPrice` instead of `calculatePriceBreakdown`
- **Public Listing Pages** - Could show enhanced calendar in view mode

---

## 🎯 Component Usage

### For Listing Owners (Management)

```tsx
import { EnhancedCalendar } from '@/components/shortlet/EnhancedCalendar';

<EnhancedCalendar
  listingId={listing.id}
  listingTitle={listing.title}
  basePrice={Number(listing.base_price)}
  mode="manage"
  onPricingUpdate={(pricing) => {
    // Handle pricing updates
    console.log('Pricing updated:', pricing);
  }}
/>;
```

### For Public View (Simple)

```tsx
import { ShortletCalendar } from '@/components/shortlet/ShortletCalendar';

<ShortletCalendar
  listingId={listing.id}
  listingTitle={listing.title}
  mode="view"
  onDateSelect={(date) => {
    // Handle date selection
  }}
/>;
```

### Using the Hook

```tsx
import { useEnhancedCalendar } from '@/hooks/useEnhancedCalendar';

const { isLoading, calendarDates, loadCalendar, setPricing, calculatePrice } = useEnhancedCalendar({
  listingId: listing.id,
  basePrice: Number(listing.base_price),
});

// Load calendar for next 3 months
useEffect(() => {
  const start = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + 3);
  loadCalendar(start, end);
}, [loadCalendar]);
```

---

## 🔧 API Migration

### Pricing

**Old (Simple):**

```typescript
import { calculatePriceBreakdown } from '@/services/shortlet/utils/priceCalculator';
```

**New (Dynamic):**

```typescript
import { calculateDynamicPrice } from '@/services/shortlet/api/pricing';

// Includes:
// - Date-specific pricing
// - Pricing rules
// - Pattern-based pricing
```

### Availability

**Old:**

```typescript
import { getCalendarView } from '@/services/shortlet/api/calendar';
```

**New (Enhanced):**

```typescript
import { useEnhancedCalendar } from '@/hooks/useEnhancedCalendar';

// Includes:
// - Pattern application
// - Dynamic pricing
// - Channel sync status
```

---

## 📊 Feature Comparison

| Feature             | ShortletCalendar | EnhancedCalendar |
| ------------------- | ---------------- | ---------------- |
| Basic calendar view | ✅               | ✅               |
| Date blocking       | ✅               | ✅               |
| Drag-and-drop       | ❌               | ✅               |
| Dynamic pricing     | ❌               | ✅               |
| Recurring patterns  | ❌               | ✅               |
| Channel sync        | ❌               | ✅               |
| Pricing rules       | ❌               | ✅               |
| Bulk operations     | ❌               | ✅               |

---

## 🚀 Recommended Enhancements

### 1. Update BookingFlow to Use Dynamic Pricing

**File:** `src/components/shortlet/BookingFlow.tsx`

**Change:**

```tsx
// Replace calculatePriceBreakdown with calculateDynamicPrice
import { calculateDynamicPrice } from '@/services/shortlet/api/pricing';

// In the component:
const breakdown = await calculateDynamicPrice(
  listingId,
  listing.base_price,
  checkin_date,
  checkout_date,
  guestsCount
);
```

### 2. Add Calendar to Public Listing View

**File:** `src/pages/PublicPropertyDetail.tsx` or similar

```tsx
import { EnhancedCalendar } from '@/components/shortlet/EnhancedCalendar';

<EnhancedCalendar
  listingId={listing.id}
  listingTitle={listing.title}
  basePrice={Number(listing.base_price)}
  mode="view"
  onDateSelect={(date) => {
    // Navigate to booking or set dates
  }}
/>;
```

---

## ⚠️ Breaking Changes

### None!

- `ShortletCalendar` still works as before
- `EnhancedCalendar` is additive, not a replacement
- Both components can coexist
- Gradual migration is supported

---

## 🐛 Troubleshooting

### Calendar not showing pricing

- **Check:** Database migration completed
- **Check:** RLS policies allow access
- **Check:** Base price is set correctly

### Patterns not applying

- **Check:** Pattern is active
- **Check:** Date range is correct
- **Check:** Pattern configuration is valid

### Channel sync failing

- **Check:** API credentials are correct
- **Check:** Integration is enabled
- **Check:** Sync logs for errors

---

## 📚 Documentation

- **Implementation Details:** `CALENDAR_IMPLEMENTATION.md`
- **Usage Examples:** `CALENDAR_USAGE_EXAMPLES.md`
- **Features Summary:** `CALENDAR_FEATURES_SUMMARY.md`

---

## 🎉 Next Steps

1. ✅ Run database migration
2. ✅ Test enhanced calendar in listing page
3. 🔄 Update BookingFlow to use dynamic pricing (optional)
4. 🔄 Add calendar to public views (optional)
5. 🔄 Set up channel integrations (optional)

---

**Status:** Ready for Production Use

**Last Updated:** January 2025
