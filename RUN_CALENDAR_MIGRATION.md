# 🚀 Run Calendar System Database Migration

## Quick Start Guide

This guide will help you run the database migration for the enhanced calendar system.

---

## 📋 Prerequisites

- Access to your Supabase project dashboard
- Admin or database owner permissions
- The migration file: `supabase/migrations/20250122000001_enhance_calendar_pricing.sql`

---

## 🎯 Method 1: Supabase Dashboard (Recommended)

### Step 1: Open Supabase Dashboard

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your project

### Step 2: Open SQL Editor

1. In the left sidebar, click **"SQL Editor"**
2. Click **"New Query"** or the **"+"** button

### Step 3: Copy Migration SQL

1. Open the migration file: `supabase/migrations/20250122000001_enhance_calendar_pricing.sql`
2. Copy **ALL** the SQL content (Ctrl+A, Ctrl+C)

### Step 4: Paste and Run

1. Paste the SQL into the SQL Editor
2. Click **"Run"** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
3. Wait for the execution to complete

### Step 5: Verify Success

You should see:

- ✅ **Success** message
- ✅ All tables created
- ✅ All indexes created
- ✅ All RLS policies created

---

## 🔍 Method 2: Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Navigate to project root
cd /path/to/your/project

# Link to your Supabase project (if not already linked)
supabase link --project-ref your-project-ref

# Run the migration
supabase db push

# Or apply specific migration
supabase migration up
```

---

## ✅ Verification Steps

After running the migration, verify the following:

### 1. Check Tables Created

Run this query in SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'listing_pricing',
  'recurring_availability_patterns',
  'channel_manager_integrations',
  'channel_sync_logs',
  'pricing_rules'
)
ORDER BY table_name;
```

**Expected Result:** 5 tables should be listed

### 2. Check Columns Added

Run this query:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'listing_availabilities'
AND column_name IN (
  'price_override',
  'min_nights',
  'max_nights',
  'checkin_days',
  'checkout_days'
)
ORDER BY column_name;
```

**Expected Result:** 5 columns should be listed

### 3. Check Indexes

Run this query:

```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
AND tablename IN (
  'listing_pricing',
  'recurring_availability_patterns',
  'channel_manager_integrations',
  'channel_sync_logs',
  'pricing_rules'
)
ORDER BY tablename, indexname;
```

**Expected Result:** 5 indexes should be listed

### 4. Check RLS Policies

Run this query:

```sql
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'listing_pricing',
  'recurring_availability_patterns',
  'channel_manager_integrations',
  'channel_sync_logs',
  'pricing_rules'
)
ORDER BY tablename, policyname;
```

**Expected Result:** 8 policies should be listed (5 owner policies + 3 public read policies)

---

## 🐛 Troubleshooting

### Error: "relation already exists"

**Cause:** Tables already exist from a previous migration attempt.

**Solution:**

```sql
-- The migration uses "CREATE TABLE IF NOT EXISTS"
-- so this shouldn't happen, but if it does:
-- Check if tables exist and drop them if needed (CAREFUL!)
DROP TABLE IF EXISTS channel_sync_logs CASCADE;
DROP TABLE IF EXISTS pricing_rules CASCADE;
DROP TABLE IF EXISTS channel_manager_integrations CASCADE;
DROP TABLE IF EXISTS recurring_availability_patterns CASCADE;
DROP TABLE IF EXISTS listing_pricing CASCADE;
-- Then re-run the migration
```

### Error: "column already exists"

**Cause:** Columns already added to `listing_availabilities`.

**Solution:**

```sql
-- The migration uses "ADD COLUMN IF NOT EXISTS"
-- This should be safe, but if you get errors:
-- Check existing columns first
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'listing_availabilities';
```

### Error: "permission denied"

**Cause:** Insufficient database permissions.

**Solution:**

- Ensure you're logged in as a database owner/admin
- Check your Supabase project role
- Contact your project administrator

### Error: "foreign key constraint"

**Cause:** Referenced tables don't exist.

**Solution:**

- Ensure `listings` table exists
- Check that `properties` table exists
- Verify the database schema is complete

---

## 📊 What Gets Created

### Tables (5)

1. **listing_pricing** - Date-specific pricing
2. **recurring_availability_patterns** - Recurring patterns
3. **channel_manager_integrations** - Channel connections
4. **channel_sync_logs** - Sync history
5. **pricing_rules** - Dynamic pricing rules

### Enhanced Tables (1)

- **listing_availabilities** - Added 5 new columns

### Indexes (5)

- Performance indexes on all new tables

### RLS Policies (8)

- 5 owner management policies
- 3 public read policies (for calendar viewing)

---

## 🎯 Post-Migration Checklist

After successful migration:

- [ ] All 5 tables created
- [ ] All 5 columns added to `listing_availabilities`
- [ ] All 5 indexes created
- [ ] All 8 RLS policies created (5 owner + 3 public)
- [ ] Test calendar component loads
- [ ] Test setting custom pricing
- [ ] Test creating recurring patterns
- [ ] Test channel integration (if applicable)

---

## 🚀 Next Steps

After migration is complete:

1. **Test the Calendar**
   - Navigate to a shortlet listing
   - Click "Calendar" or "Availability" tab
   - Try setting custom pricing
   - Create a recurring pattern

2. **Set Up Pricing Rules** (Optional)
   - Create seasonal pricing
   - Set weekend premiums
   - Configure discounts

3. **Configure Channels** (Optional)
   - Add Airbnb integration
   - Add Booking.com integration
   - Test sync functionality

---

## 📝 Migration File Location

```
supabase/migrations/20250122000001_enhance_calendar_pricing.sql
```

---

## ⚠️ Important Notes

1. **Backup First** (Recommended)
   - Export your database before running migration
   - Supabase Dashboard → Settings → Database → Backups

2. **Test Environment First**
   - Run migration on a test/staging database first
   - Verify everything works before production

3. **No Data Loss**
   - This migration only adds new tables and columns
   - Existing data is not modified
   - Safe to run on production

4. **Rollback**
   - If needed, you can drop the new tables
   - Existing functionality will continue to work
   - The old calendar system remains functional

---

## 🆘 Need Help?

If you encounter issues:

1. Check the error message in Supabase SQL Editor
2. Verify all prerequisites are met
3. Check Supabase logs for detailed errors
4. Review the migration file for syntax errors
5. Contact support if needed

---

## ✅ Success Indicators

You'll know the migration succeeded when:

- ✅ No errors in SQL Editor
- ✅ All verification queries return expected results
- ✅ Calendar component loads without errors
- ✅ You can set custom pricing
- ✅ You can create recurring patterns

---

**Ready to migrate?** Follow Method 1 above! 🚀

**Last Updated:** January 2025
