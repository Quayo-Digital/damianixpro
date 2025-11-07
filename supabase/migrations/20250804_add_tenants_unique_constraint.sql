-- Clean up duplicate tenant records and add unique constraint
-- This ensures each user can only have one tenant record

-- Step 1: Identify and clean up duplicate tenant records
DO $$ 
DECLARE
    duplicate_count INTEGER;
    cleaned_count INTEGER := 0;
BEGIN
    -- Check for duplicates first
    SELECT COUNT(*) - COUNT(DISTINCT user_id) INTO duplicate_count
    FROM tenants
    WHERE user_id IS NOT NULL;
    
    RAISE NOTICE 'Found % duplicate tenant records to clean up', duplicate_count;
    
    -- Remove duplicates, keeping only the most recent record for each user_id
    WITH duplicates_to_remove AS (
        SELECT id
        FROM (
            SELECT id, user_id,
                   ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC, id DESC) as rn
            FROM tenants
            WHERE user_id IS NOT NULL
        ) ranked
        WHERE rn > 1
    )
    DELETE FROM tenants
    WHERE id IN (SELECT id FROM duplicates_to_remove);
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    RAISE NOTICE 'Cleaned up % duplicate tenant records', cleaned_count;
    
    -- Step 2: Add unique constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tenants_user_id_unique' 
        AND table_name = 'tenants'
    ) THEN
        ALTER TABLE tenants ADD CONSTRAINT tenants_user_id_unique UNIQUE (user_id);
        RAISE NOTICE 'Added unique constraint tenants_user_id_unique to tenants table';
    ELSE
        RAISE NOTICE 'Unique constraint tenants_user_id_unique already exists';
    END IF;
END $$;

-- Add index for better performance on user_id lookups
CREATE INDEX IF NOT EXISTS idx_tenants_user_id ON tenants(user_id);

-- Update the tenant creation function to handle unique constraint gracefully
CREATE OR REPLACE FUNCTION create_tenant_record(
    p_user_id uuid,
    p_first_name text,
    p_last_name text,
    p_email text,
    p_phone text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    tenant_id uuid;
    existing_tenant_id uuid;
BEGIN
    -- Check if tenant already exists for this user
    SELECT id INTO existing_tenant_id
    FROM tenants
    WHERE user_id = p_user_id;
    
    -- If tenant exists, return existing ID
    IF existing_tenant_id IS NOT NULL THEN
        RAISE NOTICE 'Tenant already exists for user %, returning existing ID', p_user_id;
        RETURN existing_tenant_id;
    END IF;
    
    -- Create new tenant record
    INSERT INTO tenants (
        user_id,
        first_name,
        last_name,
        email,
        phone,
        status,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_first_name,
        p_last_name,
        p_email,
        p_phone,
        'active',
        NOW(),
        NOW()
    )
    RETURNING id INTO tenant_id;
    
    RAISE NOTICE 'Created new tenant record with ID % for user %', tenant_id, p_user_id;
    RETURN tenant_id;
    
EXCEPTION
    WHEN unique_violation THEN
        -- Handle race condition where another process created the tenant
        SELECT id INTO existing_tenant_id
        FROM tenants
        WHERE user_id = p_user_id;
        
        IF existing_tenant_id IS NOT NULL THEN
            RAISE NOTICE 'Tenant created by another process for user %, returning existing ID', p_user_id;
            RETURN existing_tenant_id;
        ELSE
            RAISE EXCEPTION 'Unique constraint violation but no existing tenant found for user %', p_user_id;
        END IF;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_tenant_record TO authenticated;

COMMENT ON CONSTRAINT tenants_user_id_unique ON tenants IS 'Ensures each user can only have one tenant record';
COMMENT ON FUNCTION create_tenant_record IS 'Creates tenant record with duplicate prevention and graceful error handling';
