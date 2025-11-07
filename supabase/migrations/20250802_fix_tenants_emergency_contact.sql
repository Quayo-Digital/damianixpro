-- Fix Tenants Table Schema - Add Missing Emergency Contact Column
-- Migration to resolve "Could not find the 'emergency_contact' column of 'tenants' in the schema cache" error

-- Add emergency_contact column to tenants table if it doesn't exist
DO $$ 
BEGIN
    -- Check if emergency_contact column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'emergency_contact'
    ) THEN
        ALTER TABLE public.tenants 
        ADD COLUMN emergency_contact JSONB DEFAULT '{}';
        
        -- Add comment to describe the column
        COMMENT ON COLUMN public.tenants.emergency_contact IS 'Emergency contact information for tenant including name, phone, email, and relationship';
    END IF;
END $$;

-- Add other commonly missing tenant columns that might be referenced in the application
DO $$ 
BEGIN
    -- Add employment_info column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'employment_info'
    ) THEN
        ALTER TABLE public.tenants 
        ADD COLUMN employment_info JSONB DEFAULT '{}';
        
        COMMENT ON COLUMN public.tenants.employment_info IS 'Employment information including employer, position, salary, and employment history';
    END IF;
    
    -- Add references column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'references'
    ) THEN
        ALTER TABLE public.tenants 
        ADD COLUMN references JSONB DEFAULT '[]';
        
        COMMENT ON COLUMN public.tenants.references IS 'Array of references including previous landlords, employers, and personal references';
    END IF;
    
    -- Add background_check column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'background_check'
    ) THEN
        ALTER TABLE public.tenants 
        ADD COLUMN background_check JSONB DEFAULT '{}';
        
        COMMENT ON COLUMN public.tenants.background_check IS 'Background check information including status, date, and results';
    END IF;
    
    -- Add preferences column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'preferences'
    ) THEN
        ALTER TABLE public.tenants 
        ADD COLUMN preferences JSONB DEFAULT '{}';
        
        COMMENT ON COLUMN public.tenants.preferences IS 'Tenant preferences for property features, location, and amenities';
    END IF;
    
    -- Add application_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'application_status'
    ) THEN
        ALTER TABLE public.tenants 
        ADD COLUMN application_status TEXT DEFAULT 'pending';
        
        COMMENT ON COLUMN public.tenants.application_status IS 'Current application status: pending, approved, rejected, active, inactive';
    END IF;
    
    -- Add lease_start_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'lease_start_date'
    ) THEN
        ALTER TABLE public.tenants 
        ADD COLUMN lease_start_date DATE;
        
        COMMENT ON COLUMN public.tenants.lease_start_date IS 'Start date of the current lease agreement';
    END IF;
    
    -- Add lease_end_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'lease_end_date'
    ) THEN
        ALTER TABLE public.tenants 
        ADD COLUMN lease_end_date DATE;
        
        COMMENT ON COLUMN public.tenants.lease_end_date IS 'End date of the current lease agreement';
    END IF;
    
    -- Add monthly_rent column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'monthly_rent'
    ) THEN
        ALTER TABLE public.tenants 
        ADD COLUMN monthly_rent DECIMAL(10,2);
        
        COMMENT ON COLUMN public.tenants.monthly_rent IS 'Monthly rent amount for the tenant';
    END IF;
    
    -- Add security_deposit column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'security_deposit'
    ) THEN
        ALTER TABLE public.tenants 
        ADD COLUMN security_deposit DECIMAL(10,2);
        
        COMMENT ON COLUMN public.tenants.security_deposit IS 'Security deposit amount paid by the tenant';
    END IF;
    
    -- Add move_in_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'move_in_date'
    ) THEN
        ALTER TABLE public.tenants 
        ADD COLUMN move_in_date DATE;
        
        COMMENT ON COLUMN public.tenants.move_in_date IS 'Actual move-in date of the tenant';
    END IF;
    
    -- Add move_out_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'move_out_date'
    ) THEN
        ALTER TABLE public.tenants 
        ADD COLUMN move_out_date DATE;
        
        COMMENT ON COLUMN public.tenants.move_out_date IS 'Actual move-out date of the tenant';
    END IF;
    
    -- Add notes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE public.tenants 
        ADD COLUMN notes TEXT;
        
        COMMENT ON COLUMN public.tenants.notes IS 'Additional notes about the tenant';
    END IF;
    
    -- Add documents column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'documents'
    ) THEN
        ALTER TABLE public.tenants 
        ADD COLUMN documents JSONB DEFAULT '[]';
        
        COMMENT ON COLUMN public.tenants.documents IS 'Array of document references and metadata for tenant documents';
    END IF;
END $$;

-- Create indexes for better performance on commonly queried columns
CREATE INDEX IF NOT EXISTS idx_tenants_application_status ON public.tenants(application_status);
CREATE INDEX IF NOT EXISTS idx_tenants_lease_dates ON public.tenants(lease_start_date, lease_end_date);
CREATE INDEX IF NOT EXISTS idx_tenants_move_dates ON public.tenants(move_in_date, move_out_date);

-- Create a function to validate emergency contact data
CREATE OR REPLACE FUNCTION validate_emergency_contact(contact_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if required fields are present
    IF contact_data IS NULL OR contact_data = '{}' THEN
        RETURN TRUE; -- Allow empty emergency contact
    END IF;
    
    -- Validate that if emergency contact is provided, it has required fields
    IF contact_data ? 'name' AND contact_data ? 'phone' THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Add check constraint for emergency contact validation
DO $$
BEGIN
    -- Only add constraint if it doesn't already exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND constraint_name = 'tenants_emergency_contact_check'
    ) THEN
        ALTER TABLE public.tenants 
        ADD CONSTRAINT tenants_emergency_contact_check 
        CHECK (validate_emergency_contact(emergency_contact));
    END IF;
END $$;

-- Update RLS policies to include new columns if needed
-- This ensures that tenants can still access their own data with the new columns

-- Refresh the schema cache to ensure the new columns are recognized
NOTIFY pgrst, 'reload schema';

-- Add sample data structure comments for developers
COMMENT ON TABLE public.tenants IS 'Tenant information and application data. Emergency contact format: {"name": "John Doe", "phone": "+234-xxx-xxxx", "email": "john@example.com", "relationship": "Father"}';

-- Log the migration completion
DO $$
BEGIN
    RAISE NOTICE 'Tenants table schema fix completed. Added emergency_contact and other missing columns.';
END $$;
