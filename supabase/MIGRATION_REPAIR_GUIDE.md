# Supabase Migration Repair Guide

## What Was Fixed

1. **Filename format** – 28 migration files used UUID-style names (`20250614141755-ebc66425-....sql`) that Supabase skips. They were renamed to the required format: `20250614141755_ebc66425.sql`.

## Current Issue: Remote vs Local Mismatch

The remote database has migration history entries that don't exist in your local migrations folder. This often happens when:

- The project was set up from another source
- Migrations were applied via the Supabase dashboard
- The repo was cloned without the original migration files

## Option A: Repair Migration History (Recommended)

Mark the remote-only migrations as reverted so local migrations can be applied:

```bash
supabase migration repair --status reverted 20250614021749 20250614031646 20250614043149 20250614051344 20250614053442 20250614054948 20250614064214 20250614094058 20250614094321 20250614100512 20250614103919 20250614105950 20250615011001 20250615011710 20250615015940 20250615030837 20250615051428 20250615052928 20250615061721 20250615090432 20250615091631 20250615091928 20250615092847 20250615105940 20250615114704 20250615115400 20250615120216 20250615120451
```

Then run:

```bash
supabase db push
```

**Note:** Repair only updates the migration history table. Existing schema changes stay in the database. Your local migrations use `IF NOT EXISTS` where possible, so re-running them should be safe.

## Option B: Pull Remote Schema

If you prefer to align local with the current remote schema:

```bash
supabase db pull
```

This creates a new migration file from the remote schema. Use this if you want the remote database to be the source of truth.
