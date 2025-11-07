-- Fix Agent Test Schema Issues Migration
-- Addresses missing columns identified by ComprehensiveAgentWorkflowTest
-- Fixes: phone column in profiles, title column in properties

-- Add missing phone column to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add missing title column to properties table if it doesn't exist
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS title TEXT;

-- Add missing name column to properties table if it doesn't exist (common field)
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Add missing description column to properties table if it doesn't exist
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add missing address column to properties table if it doesn't exist
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add missing price column to properties table if it doesn't exist
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS price DECIMAL(12,2);

-- Add missing property_type column to properties table if it doesn't exist
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS property_type TEXT;

-- Add missing status column to properties table if it doesn't exist
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available';

-- Add missing assigned_agent_id column to properties table if it doesn't exist
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS assigned_agent_id UUID REFERENCES auth.users(id);

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.phone IS 'User phone number for contact';
COMMENT ON COLUMN public.properties.title IS 'Property title/name for display';
COMMENT ON COLUMN public.properties.name IS 'Property name (alternative to title)';
COMMENT ON COLUMN public.properties.description IS 'Property description';
COMMENT ON COLUMN public.properties.address IS 'Property address';
COMMENT ON COLUMN public.properties.price IS 'Property price in Naira';
COMMENT ON COLUMN public.properties.property_type IS 'Type of property (apartment, house, etc.)';
COMMENT ON COLUMN public.properties.status IS 'Property status (available, rented, etc.)';
COMMENT ON COLUMN public.properties.assigned_agent_id IS 'ID of agent assigned to manage this property';

-- Verification function to check if all required columns exist
DO $$
DECLARE
    profiles_phone_exists BOOLEAN;
    properties_title_exists BOOLEAN;
    properties_columns_count INTEGER;
BEGIN
    -- Check if phone column exists in profiles
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'phone'
        AND table_schema = 'public'
    ) INTO profiles_phone_exists;
    
    -- Check if title column exists in properties
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'title'
        AND table_schema = 'public'
    ) INTO properties_title_exists;
    
    -- Count properties table columns
    SELECT COUNT(*) INTO properties_columns_count
    FROM information_schema.columns 
    WHERE table_name = 'properties' 
    AND table_schema = 'public';
    
    -- Report results
    RAISE NOTICE 'Schema fix verification:';
    RAISE NOTICE '- profiles.phone exists: %', profiles_phone_exists;
    RAISE NOTICE '- properties.title exists: %', properties_title_exists;
    RAISE NOTICE '- properties table has % columns', properties_columns_count;
    
    IF profiles_phone_exists AND properties_title_exists THEN
        RAISE NOTICE 'SUCCESS: All required columns are now present';
    ELSE
        RAISE WARNING 'Some required columns are still missing';
    END IF;
END $$;
