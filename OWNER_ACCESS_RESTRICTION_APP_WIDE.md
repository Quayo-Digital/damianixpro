# 🔒 Owner Access Restriction - App-Wide Implementation

## Overview

This migration ensures that **property owners can ONLY access their own properties** across the entire application, including both shortlet and longterm rental features.

---

## 🎯 Scope

This restriction applies to:

- ✅ **Properties** table
- ✅ **Listings** table (shortlet)
- ✅ **Listing Availabilities** table
- ✅ **Calendar & Pricing** tables (from previous migration)
- ✅ **All related features** (bookings, transactions, etc.)

---

## 📋 Migration File

**File:** `supabase/migrations/20250122000002_restrict_owner_access_app_wide.sql`

---

## 🔐 Changes Made

### 1. Properties Table

**Before:**

- `"Properties are viewable by everyone"` - Allowed anyone to see all properties
- `"Authenticated users can view properties"` - Allowed any authenticated user to see all properties

**After:**

- `"Owners can view their own properties"` - Owners can only see their own properties
- `"Public can view properties"` - Public/non-owners can view properties, but owners are excluded

### 2. Listings Table

**Before:**

- `"Public can view active listings"` - Allowed anyone (including owners) to see all active listings

**After:**

- `"Owners can view their own listings"` - Owners can only see their own listings (recreated for clarity)
- `"Public can view active listings"` - Public/non-owners can view active listings, but owners are excluded

### 3. Listing Availabilities Table

**Before:**

- `"Public can view availabilities for active listings"` - Allowed anyone (including owners) to see all availabilities

**After:**

- `"Owners can view their own availabilities"` - Explicit SELECT policy for owners
- `"Public can view availabilities for active listings"` - Public/non-owners can view, but owners are excluded

---

## 🛡️ Security Pattern

### Owner Policies

```sql
-- Pattern: Check if property belongs to owner
USING (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = [table].property_id
    AND properties.owner_id = auth.uid()
  )
)
```

### Public Policies

```sql
-- Pattern: Exclude property owners
USING (
  [conditions]
  AND (
    auth.uid() IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM properties
      WHERE owner_id = auth.uid()
    )
  )
)
```

---

## 📊 Policy Summary

| Table                             | Owner Policy               | Public Policy      | Restriction          |
| --------------------------------- | -------------------------- | ------------------ | -------------------- |
| `properties`                      | ✅ Own properties only     | ✅ Excludes owners | ✅ Owners restricted |
| `listings`                        | ✅ Own listings only       | ✅ Excludes owners | ✅ Owners restricted |
| `listing_availabilities`          | ✅ Own availabilities only | ✅ Excludes owners | ✅ Owners restricted |
| `listing_pricing`                 | ✅ Own pricing only        | ✅ Excludes owners | ✅ Already fixed     |
| `recurring_availability_patterns` | ✅ Own patterns only       | ✅ Excludes owners | ✅ Already fixed     |
| `pricing_rules`                   | ✅ Own rules only          | ✅ Excludes owners | ✅ Already fixed     |

---

## ✅ What This Achieves

1. **Property Owners:**
   - Can ONLY see their own properties
   - Can ONLY see their own listings
   - Can ONLY see their own availabilities
   - Cannot view other owners' data, even if listings are active

2. **Public Users:**
   - Can still view active properties/listings
   - Can still browse available properties
   - No change in functionality

3. **Authenticated Non-Owners:**
   - Can still view active properties/listings
   - Can still browse and book
   - No change in functionality

---

## 🚀 Running the Migration

1. **Open Supabase Dashboard** → SQL Editor
2. **Copy** the migration file content
3. **Paste** and **Run**
4. **Verify** policies are updated

---

## 🔍 Verification Queries

### Test Owner Restriction

```sql
-- As Owner A, try to query all properties
-- Should only return Owner A's properties
SELECT * FROM properties;

-- As Owner A, try to query all listings
-- Should only return Owner A's listings
SELECT * FROM listings;

-- As Owner A, try to query all availabilities
-- Should only return Owner A's availabilities
SELECT * FROM listing_availabilities;
```

### Test Public Access

```sql
-- As unauthenticated user, query active listings
-- Should return all active listings
SELECT * FROM listings WHERE active = TRUE;

-- As authenticated non-owner, query active listings
-- Should return all active listings
SELECT * FROM listings WHERE active = TRUE;
```

---

## 📝 Notes

1. **Idempotent Migration:**
   - Uses `DROP POLICY IF EXISTS` before creating
   - Safe to run multiple times

2. **Backward Compatible:**
   - Public users still have access
   - Non-owners still have access
   - Only owners are restricted

3. **Admin Access:**
   - Admin policies remain unchanged
   - Admins can still view all data (if admin policies exist)

4. **Agent Access:**
   - Agent policies remain unchanged
   - Agents can still access assigned properties

---

## ⚠️ Important

- **This migration should be run AFTER** `20250122000001_enhance_calendar_pricing.sql`
- **Test thoroughly** before deploying to production
- **Backup database** before running migration

---

## 🎯 Result

**Property owners are now restricted to accessing only their own properties across the entire application (shortlet and longterm).**

---

**Status:** ✅ Ready to Deploy

**Last Updated:** January 2025
