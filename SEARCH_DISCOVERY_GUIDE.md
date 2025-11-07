# Search & Discovery Features Guide

Complete guide to the short-let search and discovery system.

## Overview

The search and discovery system allows guests to find and explore short-let listings with advanced filtering, sorting, and personalized recommendations.

## Components

### 1. SearchFilters
**Location:** `src/components/shortlet/SearchFilters.tsx`

Advanced filtering component with:
- Date range selection (check-in/check-out)
- Guest count
- Price range slider
- Amenities selection
- Location search
- Instant book filter
- Sort options

**Usage:**
```tsx
import { SearchFiltersComponent, SearchFilters } from '@/components/shortlet';

const [filters, setFilters] = useState<SearchFilters>({});

<SearchFiltersComponent
  filters={filters}
  onFiltersChange={setFilters}
  onReset={() => setFilters({})}
/>
```

### 2. SearchResults
**Location:** `src/components/shortlet/SearchResults.tsx`

Complete search results display with:
- Search bar
- Filter integration
- Grid/list view toggle
- Pagination (load more)
- Results count
- Empty state handling

**Usage:**
```tsx
import { SearchResults } from '@/components/shortlet';

<SearchResults
  initialFilters={{
    location: 'Lekki',
    guests: 2,
    min_price: 10000,
    max_price: 50000
  }}
  onListingClick={(id) => navigate(`/shortlets/${id}`)}
/>
```

### 3. DiscoverySection
**Location:** `src/components/shortlet/DiscoverySection.tsx`

Discovery features showing:
- Featured listings
- Popular listings
- Recommended listings (personalized)
- Location-based suggestions

**Usage:**
```tsx
import { DiscoverySection } from '@/components/shortlet';

<DiscoverySection
  userId={user?.id}
  location="Lagos"
/>
```

## Search API

### Search Parameters

```typescript
interface SearchListingsRequest {
  query?: string;              // Text search
  location?: string;           // Location filter
  checkin_date?: string;       // Check-in date (YYYY-MM-DD)
  checkout_date?: string;      // Check-out date (YYYY-MM-DD)
  guests?: number;             // Number of guests
  min_price?: number;         // Minimum price per night
  max_price?: number;         // Maximum price per night
  amenities?: string[];        // Required amenities
  instant_book?: boolean;       // Instant book only
  sort_by?: 'price_low' | 'price_high' | 'newest' | 'popular';
  page?: number;               // Page number
  page_size?: number;          // Results per page
}
```

### Example Search

```typescript
import { searchListings } from '@/services/shortlet/api/listings';

const results = await searchListings({
  location: 'Lekki',
  checkin_date: '2025-03-01',
  checkout_date: '2025-03-05',
  guests: 2,
  min_price: 10000,
  max_price: 50000,
  amenities: ['wifi', 'parking'],
  instant_book: true,
  sort_by: 'price_low',
  page: 1,
  page_size: 12
});

console.log(results.listings); // Array of listings
console.log(results.total);    // Total count
```

## Filter Features

### Date Selection
- Calendar popover for check-in/check-out
- Prevents past dates
- Validates date ranges
- Shows selected dates as badges

### Price Range
- Slider for visual selection
- Min/max input fields
- Real-time filtering
- Currency formatting (₦)

### Amenities
- Checkbox selection
- Icons for each amenity
- Multiple selection
- Visual feedback

### Location
- Text input search
- Partial matching
- Searches property location field

## Sorting Options

1. **Popular** (default)
   - Most booked listings
   - Based on booking count

2. **Price: Low to High**
   - Ascending price order
   - Best for budget travelers

3. **Price: High to Low**
   - Descending price order
   - Premium listings first

4. **Newest First**
   - Recently added listings
   - Latest properties

## Discovery Features

### Featured Listings
- Handpicked properties
- Instant book enabled
- High quality properties
- Curated selection

### Popular Listings
- Most booked this month
- Trending properties
- High demand areas

### Recommended
- Personalized suggestions
- Based on user preferences
- Location-aware
- Booking history (future)

## Pages

### ShortletSearchPage
**Location:** `src/pages/ShortletSearchPage.tsx`

Main search and discovery page with:
- Tabbed interface (Search/Discover)
- URL parameter support
- Auto-switch between search/discovery
- Integrated components

**Route:**
```tsx
<Route path="/shortlets" element={<ShortletSearchPage />} />
```

**URL Parameters:**
- `?location=Lekki` - Filter by location
- `?checkin_date=2025-03-01` - Check-in date
- `?checkout_date=2025-03-05` - Check-out date
- `?guests=2` - Number of guests
- `?min_price=10000` - Minimum price
- `?max_price=50000` - Maximum price
- `?sort_by=price_low` - Sort option

## Best Practices

### 1. URL State Management
Use URL parameters for shareable search results:
```tsx
const [searchParams, setSearchParams] = useSearchParams();
setSearchParams({ location: 'Lekki', guests: '2' });
```

### 2. Debounce Search
Debounce text search for better performance:
```tsx
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    performSearch(query);
  }, 300),
  []
);
```

### 3. Cache Results
Cache search results for better UX:
```tsx
const [cache, setCache] = useState<Map<string, any>>(new Map());
```

### 4. Loading States
Show loading indicators during search:
```tsx
{isLoading ? <Loader /> : <Results />}
```

### 5. Empty States
Provide helpful empty states:
```tsx
{results.length === 0 && (
  <EmptyState
    title="No listings found"
    description="Try adjusting your filters"
    action={<Button onClick={clearFilters}>Clear Filters</Button>}
  />
)}
```

## Performance Optimization

1. **Pagination**: Load results in pages (12-20 per page)
2. **Lazy Loading**: Load more on scroll/click
3. **Client-side Filtering**: Filter amenities client-side
4. **Debouncing**: Debounce text search input
5. **Caching**: Cache search results

## Future Enhancements

1. **Map View**: Show listings on map
2. **Saved Searches**: Save favorite search criteria
3. **Search History**: Remember recent searches
4. **Smart Recommendations**: AI-powered suggestions
5. **Price Alerts**: Notify when prices drop
6. **Wishlist**: Save favorite listings
7. **Comparison**: Compare multiple listings
8. **Reviews Integration**: Filter by ratings

## Integration Example

```tsx
import { ShortletSearchPage } from '@/pages/ShortletSearchPage';

// In your router
<Route path="/shortlets" element={<ShortletSearchPage />} />
<Route path="/shortlets/:listingId" element={<ShortletListingPage />} />

// Navigation
navigate('/shortlets?location=Lekki&guests=2');
```

## Testing

### Test Search Filters
```typescript
// Test location filter
await searchListings({ location: 'Lagos' });

// Test price range
await searchListings({ min_price: 10000, max_price: 50000 });

// Test amenities
await searchListings({ amenities: ['wifi', 'parking'] });
```

### Test Sorting
```typescript
// Test price sorting
await searchListings({ sort_by: 'price_low' });
await searchListings({ sort_by: 'price_high' });

// Test date sorting
await searchListings({ sort_by: 'newest' });
```

## Accessibility

- Keyboard navigation for filters
- ARIA labels for screen readers
- Focus management
- Clear visual feedback
- Error messages

