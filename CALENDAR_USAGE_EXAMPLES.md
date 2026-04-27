# 📅 Calendar System Usage Examples

## Quick Start

### 1. Basic Calendar Display (Public View)

```tsx
import { EnhancedCalendar } from '@/components/shortlet/EnhancedCalendar';

<EnhancedCalendar
  listingId="listing-123"
  listingTitle="Luxury Apartment"
  basePrice={50000}
  mode="view"
  onDateSelect={(date) => {
    console.log('Selected date:', date);
  }}
/>;
```

### 2. Calendar Management (Owner View)

```tsx
<EnhancedCalendar
  listingId={listing.id}
  listingTitle={listing.title}
  basePrice={Number(listing.base_price)}
  mode="manage"
  onPricingUpdate={(pricing) => {
    console.log('Pricing updated:', pricing);
    // Refresh listing data
  }}
/>
```

---

## Drag-and-Drop Date Selection

The calendar supports intuitive drag-and-drop:

1. **Click and Hold** on a date to start selection
2. **Drag** to select a date range
3. **Release** to open pricing dialog
4. **Set Price** and restrictions for selected dates

**Visual Feedback:**

- Selected dates are highlighted with a ring
- Hover shows date information
- Color coding indicates status

---

## Setting Dynamic Pricing

### Single Date Pricing

```typescript
import { setDatePrice } from '@/services/shortlet/api/pricing';

await setDatePrice({
  listing_id: 'listing-123',
  date: '2025-12-25',
  price: 75000,
  available: true,
  min_nights: 2,
  max_nights: 7,
});
```

### Bulk Pricing Update

```typescript
import { bulkSetDatePricing } from '@/services/shortlet/api/pricing';

await bulkSetDatePricing('listing-123', [
  { date: '2025-12-24', price: 80000, available: true },
  { date: '2025-12-25', price: 80000, available: true },
  { date: '2025-12-26', price: 80000, available: true },
]);
```

### Calculate Price with Rules

```typescript
import { calculateDynamicPrice } from '@/services/shortlet/api/pricing';

const breakdown = await calculateDynamicPrice(
  'listing-123',
  50000, // base price
  '2025-12-20', // checkin
  '2025-12-27', // checkout
  2 // guests
);

console.log(breakdown);
// {
//   totalPrice: 350000,
//   nightlyPrices: [
//     { date: '2025-12-20', price: 50000 },
//     { date: '2025-12-21', price: 50000 },
//     ...
//   ],
//   breakdown: {
//     basePrice: 350000,
//     customPricing: 0,
//     ruleAdjustments: 0,
//     total: 350000
//   }
// }
```

---

## Creating Recurring Patterns

### Weekly Pattern (Monday-Friday Available)

```typescript
import { createRecurringPattern } from '@/services/shortlet/api/recurringPatterns';

await createRecurringPattern({
  listing_id: 'listing-123',
  pattern_type: 'weekly',
  pattern_config: {
    daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
  },
  start_date: '2025-01-01',
  end_date: '2025-12-31',
  available: true,
  price_override: 55000, // Higher price for weekdays
  min_nights: 2,
});
```

### Monthly Pattern (First Monday of Each Month)

```typescript
await createRecurringPattern({
  listing_id: 'listing-123',
  pattern_type: 'monthly',
  pattern_config: {
    daysOfWeek: [1], // Monday
    weeksOfMonth: [1], // First week
  },
  start_date: '2025-01-01',
  available: true,
  price_override: 60000,
});
```

### Custom Pattern (Specific Dates)

```typescript
await createRecurringPattern({
  listing_id: 'listing-123',
  pattern_type: 'custom',
  pattern_config: {
    specificDates: ['2025-12-24', '2025-12-25', '2025-12-31', '2026-01-01'],
  },
  start_date: '2025-12-01',
  end_date: '2026-01-31',
  available: true,
  price_override: 100000, // Premium pricing for holidays
  min_nights: 3,
});
```

---

## Channel Manager Integration

### Add Airbnb Integration

```typescript
import { createChannelIntegration } from '@/services/shortlet/api/channelManager';

await createChannelIntegration({
  listing_id: 'listing-123',
  channel_name: 'airbnb',
  channel_listing_id: 'airbnb-12345',
  sync_enabled: true,
  sync_direction: 'bidirectional',
  credentials: {
    api_key: 'your-airbnb-api-key',
    api_secret: 'your-airbnb-api-secret',
  },
});
```

### Sync Availability to Channel

```typescript
import { syncAvailabilityToChannel } from '@/services/shortlet/api/channelManager';

const result = await syncAvailabilityToChannel('integration-id', '2025-01-01', '2025-12-31');

console.log(`Synced ${result.itemsSynced} dates`);
```

### Sync from Channel

```typescript
import { syncAvailabilityFromChannel } from '@/services/shortlet/api/channelManager';

const result = await syncAvailabilityFromChannel('integration-id', '2025-01-01', '2025-12-31');

console.log(`Imported ${result.itemsSynced} dates from channel`);
```

---

## Using the Hook

```tsx
import { useEnhancedCalendar } from '@/hooks/useEnhancedCalendar';

function MyComponent({ listingId, basePrice }) {
  const { isLoading, calendarDates, loadCalendar, setPricing, calculatePrice, syncToChannel } =
    useEnhancedCalendar({
      listingId,
      basePrice,
    });

  useEffect(() => {
    const start = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + 3);
    loadCalendar(start, end);
  }, [loadCalendar]);

  const handleDateRangeSelect = async (dates: string[]) => {
    await setPricing(dates, 60000, {
      minNights: 2,
      available: true,
    });
  };

  return (
    <div>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div>
          {Array.from(calendarDates.values()).map((date) => (
            <div key={date.date}>
              {date.date}: ₦{date.price.toLocaleString()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Pricing Rules Examples

### Seasonal Pricing (December Premium)

```typescript
import { createPricingRule } from '@/services/shortlet/api/pricing';

await createPricingRule({
  listing_id: 'listing-123',
  rule_name: 'December Premium',
  rule_type: 'seasonal',
  rule_config: {
    start_month: 12,
    end_month: 12,
    price_multiplier: 1.5, // 50% increase
  },
  priority: 10,
  active: true,
});
```

### Weekend Pricing

```typescript
await createPricingRule({
  listing_id: 'listing-123',
  rule_name: 'Weekend Premium',
  rule_type: 'day_of_week',
  rule_config: {
    days_of_week: [0, 6], // Saturday, Sunday
    price_adjustment: 20, // 20% increase
  },
  priority: 5,
  active: true,
});
```

### Advance Booking Discount

```typescript
await createPricingRule({
  listing_id: 'listing-123',
  rule_name: 'Early Bird Discount',
  rule_type: 'advance_booking',
  rule_config: {
    days_in_advance: 30,
    discount_percent: 15, // 15% off
  },
  priority: 8,
  active: true,
});
```

### Length of Stay Discount

```typescript
await createPricingRule({
  listing_id: 'listing-123',
  rule_name: 'Extended Stay Discount',
  rule_type: 'length_of_stay',
  rule_config: {
    min_nights: 7,
    discount_per_night: 2000, // ₦2,000 off per night after 7 nights
  },
  priority: 7,
  active: true,
});
```

---

## Integration with Booking Flow

```tsx
import { EnhancedCalendar } from '@/components/shortlet/EnhancedCalendar';
import { calculateDynamicPrice } from '@/services/shortlet/api/pricing';

function BookingPage({ listingId, basePrice }) {
  const [selectedDates, setSelectedDates] = useState<[Date, Date] | null>(null);
  const [price, setPrice] = useState(0);

  const handleDateSelect = async (checkin: Date, checkout: Date) => {
    setSelectedDates([checkin, checkout]);

    // Calculate dynamic price
    const breakdown = await calculateDynamicPrice(
      listingId,
      basePrice,
      format(checkin, 'yyyy-MM-dd'),
      format(checkout, 'yyyy-MM-dd'),
      2
    );

    setPrice(breakdown.totalPrice);
  };

  return (
    <div>
      <EnhancedCalendar
        listingId={listingId}
        basePrice={basePrice}
        mode="view"
        onDateSelect={(date) => {
          // Handle date selection
        }}
      />

      {selectedDates && (
        <div>
          <p>Total Price: ₦{price.toLocaleString()}</p>
          <Button>Book Now</Button>
        </div>
      )}
    </div>
  );
}
```

---

## Best Practices

1. **Always use base price as fallback** - If no custom pricing is set, use base price
2. **Apply patterns first** - Recurring patterns should be applied before date-specific pricing
3. **Priority matters** - Higher priority pricing rules override lower priority ones
4. **Sync regularly** - Set up automatic sync for channel integrations
5. **Validate dates** - Always check availability before allowing bookings
6. **Cache pricing** - Cache calculated prices to improve performance

---

## Troubleshooting

### Dates not showing custom pricing

- Check if pricing was saved correctly
- Verify date format (YYYY-MM-DD)
- Check RLS policies

### Patterns not applying

- Ensure pattern is active
- Check date range (start_date to end_date)
- Verify pattern configuration

### Channel sync failing

- Check API credentials
- Verify sync direction
- Check sync logs for errors
- Ensure integration is enabled

---

**For more details, see:** `CALENDAR_IMPLEMENTATION.md`
