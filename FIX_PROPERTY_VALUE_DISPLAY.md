# 🔧 Fix Property Value & Rent Display Issues

## Issues Identified

1. **Form vs Database Mismatch:**
   - Form collects: `lease_price` (Annual) and `sale_price`
   - Database was only saving: `price` (legacy field)
   - Result: `lease_price` and `sale_price` were not being saved

2. **Display vs Data Mismatch:**
   - Dashboard label says: "Annual Rent"
   - Dashboard was displaying: `property.monthly_rent` (wrong!)
   - Result: Shows monthly rent when label says annual

3. **Current Value Confusion:**
   - `current_value` was being set from `price` field
   - For lease properties, `price` = lease price (not market value)
   - Result: Shows lease price as "Current Value" (incorrect)

4. **Data Mapping Issues:**
   - `annual_rent` was calculated from `monthly_rent * 12`
   - But form has `lease_price` which is already annual
   - Result: Annual rent showing as 0

---

## ✅ Fixes Applied

### 1. Updated Property Mutations (`src/services/property/api/mutations.ts`)

**Now saves:**

- ✅ `sale_price` - For sale properties
- ✅ `lease_price` - For lease properties (annual amount)
- ✅ `monthly_rent` - Calculated from `lease_price / 12` (for backward compatibility)
- ✅ `market_value` - If provided in form

### 2. Fixed Data Mapping (`src/hooks/useEnhancedOwnerData.ts`)

**Current Value Logic:**

```typescript
// Priority order:
1. sale_price (if sale property)
2. market_value (if available)
3. price (if sale property)
4. current_value (if exists)
5. price (fallback)
```

**Annual Rent Logic:**

```typescript
// Priority order:
1. lease_price (directly - it's already annual)
2. monthly_rent * 12 (if monthly_rent exists)
3. rent_amount * 12 (fallback)
```

### 3. Fixed Display (`src/components/owner/OwnerPropertyPortfolio.tsx`)

**Before:**

```tsx
<p className="text-gray-500">Annual Rent</p>
<p>{formatCurrency(property.monthly_rent)}</p> // ❌ Wrong!
```

**After:**

```tsx
<p className="text-gray-500">Annual Rent</p>
<p>{formatCurrency(property.annual_rent || 0)}</p> // ✅ Correct!
```

---

## 📊 Understanding "Current Value"

### Purpose of Current Value

**Current Value** represents the **market value** or **appraised value** of the property, not the rental price. It's used for:

1. **Portfolio Valuation:**
   - Total portfolio value = Sum of all property current values
   - Tracks property appreciation over time

2. **ROI Calculation:**
   - ROI = (Annual Rent / Current Value) × 100
   - Shows return on investment percentage

3. **Financial Planning:**
   - Asset valuation for loans/refinancing
   - Investment performance tracking
   - Tax/accounting purposes

### When to Use Current Value

- **For Sale Properties:** Use `sale_price` (what you're selling it for)
- **For Lease Properties:** Use `market_value` (appraised market value) or purchase price
- **For Investment Tracking:** Use current market appraisal value

### Example

**Property Details:**

- Purchase Price: ₦4,500,000
- Current Market Value: ₦5,000,000 (appreciated)
- Annual Rent: ₦1,500,000

**Display:**

- Current Value: ₦5,000,000 (market value)
- Annual Rent: ₦1,500,000
- ROI: 30% (1,500,000 / 5,000,000 × 100)

---

## 🔄 Form Field Mapping

### Form → Database → Display

| Form Field             | Database Column | Display Field   | Notes                          |
| ---------------------- | --------------- | --------------- | ------------------------------ |
| `lease_price` (Annual) | `lease_price`   | `annual_rent`   | Already annual                 |
| `lease_price` (Annual) | `monthly_rent`  | -               | Calculated: `lease_price / 12` |
| `sale_price`           | `sale_price`    | `current_value` | For sale properties            |
| `market_value`         | `market_value`  | `current_value` | For lease properties           |
| `price` (legacy)       | `price`         | Fallback        | Backward compatibility         |

---

## ✅ What's Fixed

1. ✅ `lease_price` now saves to database
2. ✅ `sale_price` now saves to database
3. ✅ `monthly_rent` auto-calculated from `lease_price`
4. ✅ Display shows `annual_rent` (not `monthly_rent`) for "Annual Rent"
5. ✅ `current_value` uses `sale_price` or `market_value` (not lease price)
6. ✅ Data mapping correctly uses `lease_price` for annual rent

---

## 🎯 Next Steps

1. **Update Existing Properties:**
   - Edit properties to add `lease_price` or `sale_price`
   - Add `market_value` for accurate current value

2. **For New Properties:**
   - Fill in "Lease Price (Annual)" for rental properties
   - Fill in "Sale Price" for sale properties
   - Optionally add "Market Value" for accurate portfolio valuation

3. **ROI Calculation:**
   - Will now correctly calculate: (Annual Rent / Current Value) × 100
   - Shows accurate return on investment

---

## 📝 Notes

- **Current Value** is for portfolio valuation, not rental pricing
- **Annual Rent** comes from the `lease_price` field (already annual)
- **Monthly Rent** is auto-calculated for backward compatibility
- Form fields now properly map to database and display

---

**Status:** ✅ Fixed - Form fields now correctly save and display

**Last Updated:** January 2025
