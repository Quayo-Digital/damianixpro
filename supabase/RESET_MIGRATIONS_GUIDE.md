# Supabase Migration Reset Guide

This guide resets the migration history so you can start fresh.

**Done:**

- Backed up migrations to `supabase/migrations_backup_*`
- Cleared `supabase/migrations` folder

## Step 1: Clear Remote Migration History

1. Go to your **Supabase Dashboard** → **SQL Editor**
2. Copy the contents of `supabase/clear_migration_history.sql` (or run):

```sql
TRUNCATE supabase_migrations.schema_migrations;
```

3. Click **Run**

## Step 2: Pull Fresh Schema

Run in your project directory:

```powershell
supabase db pull
```

This creates a **single new migration** containing your current remote schema. From here, all future changes go through new migrations.

---

## If You Need to Restore the Backup

```powershell
# List backups
Get-ChildItem supabase -Filter "migrations_backup_*"

# Restore (replace TIMESTAMP with your backup folder name)
Remove-Item supabase\migrations\* -Recurse -Force
Copy-Item supabase\migrations_backup_TIMESTAMP\* supabase\migrations\ -Recurse
```
