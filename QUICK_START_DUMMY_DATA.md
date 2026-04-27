# Quick Start: Populate Dummy Data

## 🚀 Quick Steps

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to **SQL Editor**

2. **Run the Script**
   - Click **New Query**
   - Open `populate_dummy_data.sql`
   - Copy and paste the entire content
   - Click **Run** (or press `Ctrl+Enter`)

3. **Verify**
   - Check the output messages
   - You should see counts for properties, listings, bookings, etc.

## 📊 What You'll Get

- ✅ **8 Short-let Properties** in Lagos
- ✅ **8 Active Listings** with full details
- ✅ **15+ Bookings** (past, current, upcoming)
- ✅ **20+ Reviews** (guest and owner)
- ✅ **Owner Wallets** with balances
- ✅ **Availability Blocks** for calendar

## 🎯 Next Steps

After running the script:

1. **View Properties**: Navigate to `/properties`
2. **View Short-lets**: Navigate to `/shortlets`
3. **View Bookings**: Navigate to `/bookings` (as owner or guest)
4. **View Reviews**: Check listing pages for reviews

## ⚠️ Requirements

- At least **1 user** must exist in `auth.users`
- All migrations must be run first
- RLS policies must be set up

## 🔧 Troubleshooting

**No data appears?**

- Check that you're logged in
- Verify RLS policies allow viewing
- Check browser console for errors

**Script fails?**

- Ensure all migrations are applied
- Check that tables exist
- Verify user exists in auth.users
