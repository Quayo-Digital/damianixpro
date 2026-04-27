-- Vendor Onboarding Database Migration
-- Creates vendors table with comprehensive vendor-specific fields for onboarding

-- Drop vendors table if it exists (for clean migration)
DROP TABLE IF EXISTS public.vendors CASCADE;

-- Create vendors table
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    
    -- Service Information
    specialties TEXT[] DEFAULT '{}',
    service_areas TEXT[] DEFAULT '{}',
    
    -- Business Information
    business_license TEXT,
    insurance_provider TEXT,
    insurance_policy_number TEXT,
    years_of_experience INTEGER DEFAULT 0,
    
    -- Pricing and Availability
    hourly_rate DECIMAL(10,2) DEFAULT 0.00,
    emergency_rate DECIMAL(10,2) DEFAULT 0.00,
    available_weekdays BOOLEAN DEFAULT true,
    available_weekends BOOLEAN DEFAULT false,
    available_24_hours BOOLEAN DEFAULT false,
    
    -- Additional Information
    description TEXT,
    certifications TEXT,
    professional_references TEXT,
    
    -- Performance Metrics
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_jobs INTEGER DEFAULT 0,
    completed_jobs INTEGER DEFAULT 0,
    response_time TEXT DEFAULT 'Not specified',
    
    -- Status
    active BOOLEAN DEFAULT true,
    verified BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT vendors_user_id_unique UNIQUE(user_id),
    CONSTRAINT vendors_email_unique UNIQUE(email),
    CONSTRAINT vendors_rating_check CHECK (rating >= 0.00 AND rating <= 5.00),
    CONSTRAINT vendors_experience_check CHECK (years_of_experience >= 0 AND years_of_experience <= 50),
    CONSTRAINT vendors_rates_check CHECK (hourly_rate >= 0 AND emergency_rate >= 0)
);

-- Create indexes for better performance
CREATE INDEX vendors_user_id_idx ON public.vendors(user_id);
CREATE INDEX vendors_category_idx ON public.vendors(category);
CREATE INDEX vendors_active_idx ON public.vendors(active);
CREATE INDEX vendors_service_areas_idx ON public.vendors USING GIN(service_areas);
CREATE INDEX vendors_specialties_idx ON public.vendors USING GIN(specialties);
CREATE INDEX vendors_rating_idx ON public.vendors(rating DESC);

-- Enable Row Level Security
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendors table

-- 1. INSERT policy - Allow authenticated users to create their own vendor profile
CREATE POLICY "Users can create their own vendor profile"
ON public.vendors
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 2. SELECT policy - Users can view their own profile, others can view active vendors
CREATE POLICY "Vendor profiles visibility"
ON public.vendors
FOR SELECT
USING (
    auth.uid() = user_id OR  -- Users can view their own profile
    (active = true AND verified = true) OR  -- Everyone can view active verified vendors
    EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('admin', 'owner')
    )  -- Admins and owners can view all vendors
);

-- 3. UPDATE policy - Users can update their own profile, admins can update any
CREATE POLICY "Vendor profile updates"
ON public.vendors
FOR UPDATE
USING (
    auth.uid() = user_id OR  -- Users can update their own profile
    EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role = 'admin'
    )  -- Admins can update any vendor profile
);

-- 4. DELETE policy - Only admins can delete vendor profiles
CREATE POLICY "Admin vendor deletion"
ON public.vendors
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role = 'admin'
    )
);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER vendors_updated_at
    BEFORE UPDATE ON public.vendors
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.vendors IS 'Vendor profiles for service providers in the DamianixPro platform';
COMMENT ON COLUMN public.vendors.user_id IS 'References the user in auth.users table';
COMMENT ON COLUMN public.vendors.name IS 'Company or business name';
COMMENT ON COLUMN public.vendors.category IS 'Primary service category (Plumbing, Electrical, etc.)';
COMMENT ON COLUMN public.vendors.specialties IS 'Array of service specialties';
COMMENT ON COLUMN public.vendors.service_areas IS 'Array of states/areas where vendor operates';
COMMENT ON COLUMN public.vendors.business_license IS 'Business license number';
COMMENT ON COLUMN public.vendors.insurance_provider IS 'Insurance company name';
COMMENT ON COLUMN public.vendors.insurance_policy_number IS 'Insurance policy number';
COMMENT ON COLUMN public.vendors.years_of_experience IS 'Years of experience in the field';
COMMENT ON COLUMN public.vendors.hourly_rate IS 'Standard hourly rate in Naira';
COMMENT ON COLUMN public.vendors.emergency_rate IS 'Emergency service rate in Naira';
COMMENT ON COLUMN public.vendors.available_weekdays IS 'Available Monday-Friday';
COMMENT ON COLUMN public.vendors.available_weekends IS 'Available Saturday-Sunday';
COMMENT ON COLUMN public.vendors.available_24_hours IS 'Available 24/7 for emergencies';
COMMENT ON COLUMN public.vendors.description IS 'Detailed service description';
COMMENT ON COLUMN public.vendors.certifications IS 'Professional certifications and qualifications';
COMMENT ON COLUMN public.vendors.professional_references IS 'Professional references';
COMMENT ON COLUMN public.vendors.rating IS 'Average customer rating (0.00-5.00)';
COMMENT ON COLUMN public.vendors.total_jobs IS 'Total number of jobs assigned';
COMMENT ON COLUMN public.vendors.completed_jobs IS 'Number of completed jobs';
COMMENT ON COLUMN public.vendors.response_time IS 'Average response time description';
COMMENT ON COLUMN public.vendors.active IS 'Whether vendor is currently active';
COMMENT ON COLUMN public.vendors.verified IS 'Whether vendor has been verified by admin';

-- Create vendor_jobs table for tracking vendor work assignments
-- Note: property_id will be a simple UUID field without foreign key constraint
-- to avoid dependency issues. Foreign key can be added later if needed.

-- Drop vendor_jobs table if it exists (for clean migration)
DROP TABLE IF EXISTS public.vendor_jobs CASCADE;

-- Create vendor_jobs table
CREATE TABLE IF NOT EXISTS public.vendor_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    property_id UUID, -- Property reference (no FK constraint to avoid dependency issues)
    maintenance_request_id UUID, -- References maintenance requests if applicable
    
    -- Job Details
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'emergency')),
    
    -- Scheduling
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'on_hold')),
    scheduled_date TIMESTAMP WITH TIME ZONE,
    started_date TIMESTAMP WITH TIME ZONE,
    completed_date TIMESTAMP WITH TIME ZONE,
    
    -- Financial
    estimated_cost DECIMAL(12,2),
    actual_cost DECIMAL(12,2),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue')),
    
    -- Feedback
    vendor_notes TEXT,
    customer_feedback TEXT,
    customer_rating DECIMAL(3,2) CHECK (customer_rating >= 0.00 AND customer_rating <= 5.00),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for vendor_jobs
CREATE INDEX IF NOT EXISTS vendor_jobs_vendor_id_idx ON public.vendor_jobs(vendor_id);
CREATE INDEX IF NOT EXISTS vendor_jobs_property_id_idx ON public.vendor_jobs(property_id);
CREATE INDEX IF NOT EXISTS vendor_jobs_status_idx ON public.vendor_jobs(status);
CREATE INDEX IF NOT EXISTS vendor_jobs_scheduled_date_idx ON public.vendor_jobs(scheduled_date);

-- Enable RLS for vendor_jobs
ALTER TABLE public.vendor_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendor_jobs table
CREATE POLICY "Vendor jobs visibility"
ON public.vendor_jobs
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.vendors v 
        WHERE v.id = vendor_id AND v.user_id = auth.uid()
    ) OR  -- Vendors can see their own jobs
    -- Note: Property owner check removed to avoid dependency on properties table structure
    -- This can be added back later when properties table schema is stable
    EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('admin', 'agent', 'owner')
    )  -- Admins, agents, and owners can see all jobs
);

CREATE POLICY "Vendor jobs management"
ON public.vendor_jobs
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('admin', 'owner', 'agent')
    )  -- Admins, owners, and agents can manage jobs
);

-- Add updated_at trigger for vendor_jobs
CREATE TRIGGER vendor_jobs_updated_at
    BEFORE UPDATE ON public.vendor_jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Add comments for vendor_jobs table
COMMENT ON TABLE public.vendor_jobs IS 'Job assignments and tracking for vendors';
COMMENT ON COLUMN public.vendor_jobs.vendor_id IS 'References the assigned vendor';
COMMENT ON COLUMN public.vendor_jobs.property_id IS 'UUID reference to property (no FK constraint to avoid dependencies)';
COMMENT ON COLUMN public.vendor_jobs.maintenance_request_id IS 'Optional reference to maintenance request';

-- Verification function to check migration success
DO $$
DECLARE
    vendors_table_exists BOOLEAN;
    vendor_jobs_table_exists BOOLEAN;
    vendors_policies_count INTEGER;
    vendor_jobs_policies_count INTEGER;
BEGIN
    -- Check if vendors table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'vendors' 
        AND table_schema = 'public'
    ) INTO vendors_table_exists;
    
    -- Check if vendor_jobs table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'vendor_jobs' 
        AND table_schema = 'public'
    ) INTO vendor_jobs_table_exists;
    
    -- Count RLS policies for vendors
    SELECT COUNT(*) INTO vendors_policies_count
    FROM pg_policies 
    WHERE tablename = 'vendors' AND schemaname = 'public';
    
    -- Count RLS policies for vendor_jobs
    SELECT COUNT(*) INTO vendor_jobs_policies_count
    FROM pg_policies 
    WHERE tablename = 'vendor_jobs' AND schemaname = 'public';
    
    -- Report results
    RAISE NOTICE 'Vendor onboarding migration verification:';
    RAISE NOTICE '- vendors table exists: %', vendors_table_exists;
    RAISE NOTICE '- vendor_jobs table exists: %', vendor_jobs_table_exists;
    RAISE NOTICE '- vendors RLS policies: %', vendors_policies_count;
    RAISE NOTICE '- vendor_jobs RLS policies: %', vendor_jobs_policies_count;
    
    IF vendors_table_exists AND vendor_jobs_table_exists AND 
       vendors_policies_count >= 4 AND vendor_jobs_policies_count >= 2 THEN
        RAISE NOTICE 'SUCCESS: Vendor onboarding migration completed successfully';
    ELSE
        RAISE WARNING 'Some components of the vendor onboarding migration may not have been created properly';
    END IF;
END $$;
