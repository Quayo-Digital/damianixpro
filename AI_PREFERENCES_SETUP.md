# AI Preferences Setup Guide

The AI Preferences feature powers personalized property recommendations. For it to work, the database must have the `user_preferences` table.

## Quick Setup

### 1. Apply the migration

```bash
# If using Supabase CLI locally
supabase db push

# Or run the migration manually in Supabase Dashboard → SQL Editor:
# Copy and run: supabase/migrations/20250801_ai_smart_matching.sql
```

### 2. Verify the table exists

In Supabase Dashboard → Table Editor, you should see `user_preferences` with columns:

- user_id, min_budget, max_budget, preferred_areas, property_types, etc.

### 3. Check RLS policies

The migration creates policies so users can:

- SELECT, INSERT, UPDATE, DELETE their own preferences (auth.uid() = user_id)

## If Save Preferences still fails

1. **Check browser console** – Look for `[user_preferences] Save failed:` with error details
2. **Verify migration ran** – Table must exist; run the migration if needed
3. **Check auth** – User must be logged in (auth.uid() is set)

## Feature overview

- **Tenant onboarding**: Users set budget, areas, property types, amenities
- **Smart matching**: Properties are scored against these preferences
- **Differentiator**: Personalized recommendations set this app apart
