# Populate Dummy Data Guide

This guide explains how to populate your application with realistic dummy content.

## 📋 Overview

The `populate_dummy_data.sql` script creates:

- **8 Short-let Properties** in various Lagos locations
- **8 Listings** with detailed descriptions and amenities
- **15+ Bookings** (past, current, and upcoming)
- **20+ Reviews** (guest and owner reviews)
- **Owner Wallets** with balances
- **Availability Blocks** for calendar management

## 🚀 How to Run

### Option 1: Supabase SQL Editor (Recommended)

1. Open your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `populate_dummy_data.sql`
5. Click **Run** (or press `Ctrl+Enter`)

### Option 2: Command Line

```bash
# Using Supabase CLI
supabase db execute -f populate_dummy_data.sql

# Or using psql
psql -h your-db-host -U postgres -d postgres -f populate_dummy_data.sql
```

## 📊 What Gets Created

### Properties Created

1. **Luxury 3BR Apartment in Victoria Island** - ₦150,000/month
2. **Cozy 2BR Studio in Lekki Phase 1** - ₦85,000/month
3. **Spacious 4BR Villa in Ikoyi** - ₦250,000/month
4. **Modern 1BR Apartment in Ikeja** - ₦65,000/month
5. **Beachfront 3BR Condo in Tarkwa Bay** - ₦200,000/month
6. **Luxury Penthouse in Banana Island** - ₦500,000/month
7. **Cozy 2BR Cottage in Surulere** - ₦75,000/month
8. **Modern Studio in Yaba** - ₦55,000/month

### Listings Features

- **Realistic Descriptions**: Each listing has a unique, detailed description
- **Proper Amenities**: WiFi, AC, Kitchen, Parking, etc.
- **Pricing**: Base price, cleaning fees, security deposits
- **Capacity**: Based on bedroom count
- **Instant Book**: Enabled for luxury properties

### Bookings Created

- **Past Bookings**: Completed bookings from 30 days ago
- **Current Bookings**: Active bookings (check-in 2 days ago, check-out in 2 days)
- **Upcoming Bookings**: Pending bookings starting in 7 days

### Reviews Created

- **Guest Reviews**: 5-star ratings with detailed comments
- **Owner Reviews**: Reviews of guests by property owners
- **Realistic Comments**: Varied, authentic-sounding reviews

### Wallets

- **Owner Balances**: Calculated from completed bookings
- **Pending Balances**: From confirmed but not yet completed bookings

## 🖼️ Images

All properties use Unsplash placeholder images:

- High-quality, realistic property photos
- Different images based on property type
- Proper aspect ratios for display

## ⚠️ Important Notes

1. **User Requirements**:
   - You need at least one user in `auth.users`
   - The script uses the first available user as owner
   - If you have multiple users, it will use the second as guest

2. **Data Safety**:
   - The script uses `ON CONFLICT DO NOTHING` to avoid duplicates
   - Safe to run multiple times
   - Won't overwrite existing data

3. **Customization**:
   - Adjust prices, locations, and descriptions as needed
   - Add more properties by duplicating the INSERT statements
   - Modify amenities arrays to match your needs

## 🔄 After Running

After running the script:

1. **Check Properties**: Navigate to `/properties` to see the new properties
2. **Check Short-lets**: Navigate to `/shortlets` to see listings
3. **Check Bookings**: Navigate to `/bookings` to see bookings
4. **Check Reviews**: View reviews on listing pages

## 📝 Customization Tips

### Add More Properties

```sql
INSERT INTO public.properties (
  id, name, address, location, ...
) VALUES (
  gen_random_uuid(),
  'Your Property Name',
  'Your Address',
  'Lagos, Nigeria',
  ...
);
```

### Add More Bookings

```sql
INSERT INTO public.bookings (
  listing_id, guest_id, owner_id, ...
) VALUES (
  'your-listing-id',
  'your-guest-id',
  'your-owner-id',
  ...
);
```

### Update Images

Replace Unsplash URLs with your own image URLs or upload to Supabase Storage.

## 🐛 Troubleshooting

### Error: "relation does not exist"

- Make sure you've run all migrations first
- Check that tables exist in your database

### Error: "user does not exist"

- Create at least one user through the app signup
- Or manually insert into `auth.users` (not recommended)

### No data appears

- Check that `is_shortlet = true` for properties
- Verify listings are `active = true`
- Check RLS policies allow viewing

## ✅ Verification

After running, verify with:

```sql
-- Check properties
SELECT COUNT(*) FROM public.properties WHERE is_shortlet = true;

-- Check listings
SELECT COUNT(*) FROM public.listings;

-- Check bookings
SELECT COUNT(*), status FROM public.bookings GROUP BY status;

-- Check reviews
SELECT COUNT(*) FROM public.reviews;
```

## 🎨 Next Steps

1. **Add More Images**: Upload property images to Supabase Storage
2. **Create More Listings**: Add listings for existing properties
3. **Add More Bookings**: Create bookings for different date ranges
4. **Customize Content**: Update descriptions and details to match your brand
