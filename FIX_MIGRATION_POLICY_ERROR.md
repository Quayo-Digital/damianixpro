# 🔧 Fix Migration Policy Error

## Error Message

```
ERROR: 42710: policy "Owners can manage pricing" for table "listing_pricing" already exists
```

## Cause

The migration has been partially run before, and some RLS policies already exist in the database.

## ✅ Solution Applied

The migration file has been updated to be **idempotent** (safe to run multiple times). It now:

1. **Drops existing policies** before creating them
2. Uses `DROP POLICY IF EXISTS` to avoid errors
3. Then creates the policies fresh

## 🔄 Updated Migration

The migration now includes:

```sql
-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Owners can manage pricing" ON listing_pricing;
DROP POLICY IF EXISTS "Owners can manage patterns" ON recurring_availability_patterns;
DROP POLICY IF EXISTS "Owners can manage channel integrations" ON channel_manager_integrations;
DROP POLICY IF EXISTS "Owners can view sync logs" ON channel_sync_logs;
DROP POLICY IF EXISTS "Owners can manage pricing rules" ON pricing_rules;

-- Then create policies
CREATE POLICY "Owners can manage pricing" ON listing_pricing ...
```

## 🚀 How to Fix

### Option 1: Re-run Updated Migration (Recommended)

1. **Open Supabase SQL Editor**
2. **Copy the updated migration file** (`supabase/migrations/20250122000001_enhance_calendar_pricing.sql`)
3. **Paste and run** - It will now handle existing policies gracefully

### Option 2: Manual Fix (If Needed)

If you prefer to manually fix just the policies:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Owners can manage pricing" ON listing_pricing;
DROP POLICY IF EXISTS "Owners can manage patterns" ON recurring_availability_patterns;
DROP POLICY IF EXISTS "Owners can manage channel integrations" ON channel_manager_integrations;
DROP POLICY IF EXISTS "Owners can view sync logs" ON channel_sync_logs;
DROP POLICY IF EXISTS "Owners can manage pricing rules" ON pricing_rules;

-- Then re-run the CREATE POLICY statements from the migration file
```

## ✅ Verification

After fixing, verify policies exist:

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

**Expected:** 5 policies should be listed

## 📝 Notes

- The migration is now **idempotent** - safe to run multiple times
- Existing policies will be dropped and recreated
- No data loss - only policy definitions are updated
- All other migration steps remain unchanged

---

**Status:** ✅ Fixed - Migration updated to handle existing policies

**Last Updated:** January 2025
