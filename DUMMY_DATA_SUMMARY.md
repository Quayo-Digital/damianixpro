# Dummy Data Population Summary

## ✅ What's Been Created

I've created a comprehensive SQL script (`populate_dummy_data.sql`) that populates your application with realistic dummy content.

## 📦 Files Created

1. **`populate_dummy_data.sql`** (664 lines)
   - Main SQL script with all dummy data
   - Ready to run in Supabase SQL Editor

2. **`POPULATE_DUMMY_DATA_GUIDE.md`**
   - Detailed guide on how to use the script
   - Troubleshooting tips
   - Customization instructions

3. **`QUICK_START_DUMMY_DATA.md`**
   - Quick reference for running the script
   - Fast setup instructions

4. **`scripts/populate-dummy-data.js`**
   - JavaScript reference for property data structure
   - Can be used for programmatic population

## 🎯 What Gets Populated

### Properties (11 total)

- **8 Short-let Properties** in Lagos:
  - Luxury 3BR Apartment in Victoria Island (₦150,000/month)
  - Cozy 2BR Studio in Lekki Phase 1 (₦85,000/month)
  - Spacious 4BR Villa in Ikoyi (₦250,000/month)
  - Modern 1BR Apartment in Ikeja (₦65,000/month)
  - Beachfront 3BR Condo in Tarkwa Bay (₦200,000/month)
  - Luxury Penthouse in Banana Island (₦500,000/month)
  - Cozy 2BR Cottage in Surulere (₦75,000/month)
  - Modern Studio in Yaba (₦55,000/month)
- **3 Regular Properties**:
  - Family Home in GRA Port Harcourt
  - Office Space in Wuse 2, Abuja
  - 3BR Apartment in Bodija, Ibadan

### Listings (8)

- One listing per short-let property
- Detailed descriptions
- Amenities (WiFi, AC, Kitchen, Parking, etc.)
- Pricing (base price, cleaning fees, security deposits)
- Cancellation policies

### Bookings (15+)

- **Past Bookings**: Completed bookings from 30 days ago
- **Current Bookings**: Active bookings (check-in 2 days ago)
- **Upcoming Bookings**: Pending bookings starting in 7 days

### Reviews (20+)

- Guest reviews (reviewing properties/owners)
- Owner reviews (reviewing guests)
- 4-5 star ratings
- Realistic comments

### Wallets

- Owner wallets with balances
- Pending balances from confirmed bookings
- Calculated from booking payouts

### Availability Blocks

- Random date blocks for maintenance
- Calendar management examples

## 🖼️ Images

All properties use high-quality Unsplash placeholder images:

- Different images based on property type
- Proper aspect ratios (800x600)
- Realistic property photos

## 🚀 How to Use

1. **Open Supabase Dashboard** → SQL Editor
2. **Copy** `populate_dummy_data.sql` content
3. **Paste** into SQL Editor
4. **Run** the script
5. **Verify** the success messages

## ⚠️ Requirements

- At least 1 user in `auth.users`
- All migrations applied
- RLS policies configured

## 📊 Expected Output

After running, you should see:

```
✅ Dummy data populated successfully!
   - Short-let Properties: 8
   - Regular Properties: 3
   - Listings: 8
   - Bookings: 15+
   - Reviews: 20+
   - Wallets: 1+
```

## 🎨 Next Steps

1. **Run the script** in Supabase SQL Editor
2. **View properties** at `/properties`
3. **View short-lets** at `/shortlets`
4. **View bookings** at `/bookings`
5. **Check reviews** on listing pages

## 🔧 Customization

The script is designed to be:

- **Safe to run multiple times** (uses `ON CONFLICT DO NOTHING`)
- **Easy to customize** (clear structure, well-commented)
- **Extensible** (add more properties by duplicating INSERT statements)

## 📝 Notes

- All data uses realistic Nigerian locations and prices
- Images are from Unsplash (free, high-quality)
- Script handles edge cases (missing users, existing data)
- Safe for production (won't overwrite existing data)
