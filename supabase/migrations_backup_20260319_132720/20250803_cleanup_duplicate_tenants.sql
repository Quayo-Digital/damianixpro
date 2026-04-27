-- Cleanup Duplicate Tenant Records and Add Unique Constraint
-- This migration removes duplicate tenant records and prevents future duplicates

-- Step 1: Identify and remove duplicate tenant records, keeping the most recent one
DO $$
DECLARE
    duplicate_count INTEGER;
    cleanup_count INTEGER := 0;
BEGIN
    -- Count existing duplicates
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT user_id, COUNT(*) as record_count
        FROM public.tenants
        WHERE user_id IS NOT NULL
        GROUP BY user_id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    RAISE NOTICE 'Found % user_ids with duplicate tenant records', duplicate_count;
    
    -- Remove duplicate records, keeping the most recent one (highest id)
    WITH duplicates_to_remove AS (
        SELECT id
        FROM (
            SELECT id, user_id,
                   ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC, id DESC) as rn
            FROM public.tenants
            WHERE user_id IS NOT NULL
        ) ranked
        WHERE rn > 1
    )
    DELETE FROM public.tenants
    WHERE id IN (SELECT id FROM duplicates_to_remove);
    
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    RAISE NOTICE 'Removed % duplicate tenant records', cleanup_count;
    
    -- Verify no duplicates remain
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT user_id, COUNT(*) as record_count
        FROM public.tenants
        WHERE user_id IS NOT NULL
        GROUP BY user_id
        HAVING COUNT(*) > 1
    ) remaining_duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE EXCEPTION 'Still have % user_ids with duplicate records after cleanup', duplicate_count;
    ELSE
        RAISE NOTICE 'Successfully cleaned up all duplicate tenant records';
    END IF;
END $$;

-- Step 2: Add unique constraint to prevent future duplicates
DO $$
BEGIN
    -- Check if unique constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'tenants_user_id_unique'
    ) THEN
        -- Add unique constraint on user_id
        ALTER TABLE public.tenants 
        ADD CONSTRAINT tenants_user_id_unique UNIQUE (user_id);
        
        RAISE NOTICE 'Added unique constraint on tenants.user_id';
    ELSE
        RAISE NOTICE 'Unique constraint on tenants.user_id already exists';
    END IF;
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Cannot add unique constraint: duplicate user_id values still exist in tenants table';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error adding unique constraint: %', SQLERRM;
END $$;

-- Step 3: Update the tenant creation function to handle unique constraint
CREATE OR REPLACE FUNCTION public.create_tenant_profile(
    p_user_id UUID DEFAULT NULL,
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    tenant_id UUID;
    target_user_id UUID;
BEGIN
    -- Determine the user_id to use
    target_user_id := COALESCE(p_user_id, auth.uid());
    
    -- Check if tenant already exists for this user_id
    SELECT id INTO tenant_id
    FROM public.tenants
    WHERE user_id = target_user_id;
    
    -- If tenant already exists, return existing id
    IF tenant_id IS NOT NULL THEN
        RAISE NOTICE 'Tenant profile already exists for user_id: %, returning existing tenant_id: %', target_user_id, tenant_id;
        RETURN tenant_id;
    END IF;
    
    -- Insert new tenant record
    INSERT INTO public.tenants (
        user_id,
        first_name,
        last_name,
        email,
        phone,
        status
    ) VALUES (
        target_user_id,
        p_first_name,
        p_last_name,
        p_email,
        p_phone,
        'active'
    ) RETURNING id INTO tenant_id;
    
    RAISE NOTICE 'Created new tenant profile for user_id: %, tenant_id: %', target_user_id, tenant_id;
    RETURN tenant_id;
    
EXCEPTION
    WHEN unique_violation THEN
        -- Handle race condition where another process created the tenant
        SELECT id INTO tenant_id
        FROM public.tenants
        WHERE user_id = target_user_id;
        
        IF tenant_id IS NOT NULL THEN
            RAISE NOTICE 'Tenant profile created by another process for user_id: %, returning tenant_id: %', target_user_id, tenant_id;
            RETURN tenant_id;
        ELSE
            RAISE EXCEPTION 'Unique constraint violation but no existing tenant found for user_id: %', target_user_id;
        END IF;
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error creating tenant profile: %', SQLERRM;
END $$;

-- Step 4: Add helpful indexes for performance
DO $$
BEGIN
    -- Index on user_id for fast lookups (if not already exists)
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'tenants' 
        AND indexname = 'idx_tenants_user_id'
    ) THEN
        CREATE INDEX idx_tenants_user_id ON public.tenants(user_id);
        RAISE NOTICE 'Created index on tenants.user_id';
    ELSE
        RAISE NOTICE 'Index on tenants.user_id already exists';
    END IF;
END $$;

-- Step 5: Final verification and summary
DO $$
DECLARE
    total_tenants INTEGER;
    unique_users INTEGER;
    constraint_exists BOOLEAN;
BEGIN
    -- Count total tenant records
    SELECT COUNT(*) INTO total_tenants FROM public.tenants;
    
    -- Count unique user_ids
    SELECT COUNT(DISTINCT user_id) INTO unique_users 
    FROM public.tenants 
    WHERE user_id IS NOT NULL;
    
    -- Check if unique constraint exists
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'tenants_user_id_unique'
    ) INTO constraint_exists;
    
    RAISE NOTICE '=== TENANT CLEANUP SUMMARY ===';
    RAISE NOTICE 'Total tenant records: %', total_tenants;
    RAISE NOTICE 'Unique user_ids: %', unique_users;
    RAISE NOTICE 'Unique constraint exists: %', constraint_exists;
    
    IF total_tenants = unique_users AND constraint_exists THEN
        RAISE NOTICE 'SUCCESS: Tenant table cleanup completed successfully!';
        RAISE NOTICE 'All duplicate records removed and unique constraint added.';
        RAISE NOTICE 'Database queries using .single() should now work correctly.';
    ELSE
        RAISE WARNING 'ISSUE: Cleanup may not be complete. Please review the results.';
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON CONSTRAINT tenants_user_id_unique ON public.tenants IS 
'Ensures each user can have only one tenant profile, preventing duplicate records that cause PGRST116 errors';
