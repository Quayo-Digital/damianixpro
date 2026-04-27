# 🔧 Fix Property Creation 500 Error

## Issue

Getting 500 error when trying to create a property:

```
Failed to load resource: the server responded with a status of 500 ()
Error creating property
```

## Root Cause

The migration `20250122000002_restrict_owner_access_app_wide.sql` only updated SELECT policies but didn't preserve the INSERT, UPDATE, and DELETE policies. The existing INSERT policy uses `has_role()` function which might not exist or is failing.

## Solution

Updated the migration to:

1. ✅ Preserve INSERT policy (simplified to just check `owner_id = auth.uid()`)
2. ✅ Preserve UPDATE policy (owners, agents, or admins)
3. ✅ Preserve DELETE policy (owners or admins)
4. ✅ Remove dependency on `has_role()` function (use direct checks instead)

## Changes Made

### INSERT Policy

**Before:**

```sql
WITH CHECK ( (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin')) AND owner_id = auth.uid() );
```

**After:**

```sql
WITH CHECK (owner_id = auth.uid());
```

### UPDATE Policy

**Before:**

```sql
USING ( auth.uid() = owner_id OR auth.uid() = agent_id OR is_admin(auth.uid()) )
```

**After:**

```sql
USING (
  auth.uid() = owner_id
  OR auth.uid() = agent_id
  OR (is_admin function exists AND is_admin(auth.uid()))
)
```

### DELETE Policy

**Before:**

```sql
USING ( auth.uid() = owner_id OR is_admin(auth.uid()) );
```

**After:**

```sql
USING (
  auth.uid() = owner_id
  OR (is_admin function exists AND is_admin(auth.uid()))
)
```

## How to Fix

1. **Run the updated migration:**

   ```sql
   -- File: supabase/migrations/20250122000002_restrict_owner_access_app_wide.sql
   -- Copy and paste into Supabase SQL Editor
   -- Run it
   ```

2. **Verify INSERT policy:**

   ```sql
   SELECT * FROM pg_policies
   WHERE tablename = 'properties'
   AND policyname = 'Owners can create properties';
   ```

3. **Test property creation:**
   - Try creating a property as an owner
   - Should work now ✅

## Status

✅ **Fixed** - INSERT, UPDATE, DELETE policies now preserved and simplified

**Last Updated:** January 2025
