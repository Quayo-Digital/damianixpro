-- Company Profiles Migration for Nigeria Homes Platform
-- This migration adds comprehensive company profile functionality for business users

-- Create company_profiles table
CREATE TABLE IF NOT EXISTS public.company_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic Company Information
    company_name TEXT NOT NULL,
    company_type TEXT CHECK (company_type IN ('REAL_ESTATE_AGENCY', 'PROPERTY_MANAGEMENT', 'CONSTRUCTION', 'MAINTENANCE_SERVICES', 'LEGAL_SERVICES', 'FINANCIAL_SERVICES', 'CONSULTING', 'DEVELOPMENT', 'OTHER')) DEFAULT 'REAL_ESTATE_AGENCY',
    business_registration_number TEXT UNIQUE,
    tax_identification_number TEXT,
    vat_number TEXT,
    
    -- Contact Information
    business_email TEXT,
    business_phone TEXT,
    website_url TEXT,
    
    -- Address Information
    business_address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'Nigeria',
    postal_code TEXT,
    
    -- Nigerian Business Registration
    cac_registration_number TEXT, -- Corporate Affairs Commission
    tin_number TEXT, -- Tax Identification Number
    business_permit_number TEXT,
    
    -- Company Details
    description TEXT,
    founded_year INTEGER,
    number_of_employees INTEGER,
    annual_revenue_range TEXT CHECK (annual_revenue_range IN ('UNDER_1M', '1M_5M', '5M_10M', '10M_50M', '50M_100M', 'OVER_100M')),
    
    -- Verification Status
    verification_status TEXT CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED')) DEFAULT 'PENDING',
    verification_date TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),
    verification_notes TEXT,
    
    -- Business License and Certifications
    business_license_url TEXT,
    insurance_certificate_url TEXT,
    professional_certifications JSONB DEFAULT '[]'::jsonb,
    
    -- Nigerian Regulatory Compliance
    real_estate_license_number TEXT, -- ESVARBON license
    professional_body_membership TEXT, -- NIESV, FIABCI Nigeria, etc.
    compliance_certificates JSONB DEFAULT '[]'::jsonb,
    
    -- Banking Information (for payments)
    bank_name TEXT,
    account_number TEXT,
    account_name TEXT,
    bank_code TEXT,
    
    -- Social Media and Marketing
    logo_url TEXT,
    social_media_links JSONB DEFAULT '{}'::jsonb,
    marketing_materials JSONB DEFAULT '[]'::jsonb,
    
    -- Performance Metrics
    total_properties_managed INTEGER DEFAULT 0,
    total_transactions_completed INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    
    -- Subscription and Plan Information
    subscription_plan TEXT DEFAULT 'FREE',
    subscription_status TEXT CHECK (subscription_status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'CANCELLED')) DEFAULT 'ACTIVE',
    subscription_start_date TIMESTAMPTZ,
    subscription_end_date TIMESTAMPTZ,
    
    -- Settings and Preferences
    business_hours JSONB DEFAULT '{
        "monday": {"open": "09:00", "close": "17:00", "closed": false},
        "tuesday": {"open": "09:00", "close": "17:00", "closed": false},
        "wednesday": {"open": "09:00", "close": "17:00", "closed": false},
        "thursday": {"open": "09:00", "close": "17:00", "closed": false},
        "friday": {"open": "09:00", "close": "17:00", "closed": false},
        "saturday": {"open": "09:00", "close": "13:00", "closed": false},
        "sunday": {"open": "09:00", "close": "13:00", "closed": true}
    }'::jsonb,
    notification_preferences JSONB DEFAULT '{
        "email_notifications": true,
        "sms_notifications": true,
        "push_notifications": true,
        "marketing_emails": false
    }'::jsonb,
    
    -- Audit Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create company_team_members table for multi-user companies
CREATE TABLE IF NOT EXISTS public.company_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Team Member Information
    role_title TEXT NOT NULL,
    department TEXT,
    permissions JSONB DEFAULT '[]'::jsonb,
    access_level TEXT CHECK (access_level IN ('ADMIN', 'MANAGER', 'AGENT', 'STAFF', 'VIEWER')) DEFAULT 'STAFF',
    
    -- Status
    status TEXT CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')) DEFAULT 'ACTIVE',
    join_date TIMESTAMPTZ DEFAULT NOW(),
    leave_date TIMESTAMPTZ,
    
    -- Audit Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(company_id, user_id)
);

-- Create company_documents table for document management
CREATE TABLE IF NOT EXISTS public.company_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
    
    -- Document Information
    document_name TEXT NOT NULL,
    document_type TEXT CHECK (document_type IN ('BUSINESS_LICENSE', 'TAX_CERTIFICATE', 'INSURANCE', 'CERTIFICATION', 'REGISTRATION', 'PERMIT', 'OTHER')) NOT NULL,
    document_url TEXT NOT NULL,
    file_size INTEGER,
    file_type TEXT,
    
    -- Verification
    verification_status TEXT CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')) DEFAULT 'PENDING',
    verification_date TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),
    verification_notes TEXT,
    
    -- Expiry Management
    expiry_date DATE,
    renewal_reminder_sent BOOLEAN DEFAULT false,
    
    -- Audit Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by UUID REFERENCES auth.users(id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_profiles_user_id ON public.company_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_company_profiles_company_name ON public.company_profiles(company_name);
CREATE INDEX IF NOT EXISTS idx_company_profiles_verification_status ON public.company_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_company_profiles_company_type ON public.company_profiles(company_type);
CREATE INDEX IF NOT EXISTS idx_company_profiles_cac_registration ON public.company_profiles(cac_registration_number);

CREATE INDEX IF NOT EXISTS idx_company_team_members_company_id ON public.company_team_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_team_members_user_id ON public.company_team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_team_members_status ON public.company_team_members(status);

CREATE INDEX IF NOT EXISTS idx_company_documents_company_id ON public.company_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_company_documents_type ON public.company_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_company_documents_verification ON public.company_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_company_documents_expiry ON public.company_documents(expiry_date);

-- Create search index for company names
CREATE INDEX IF NOT EXISTS idx_company_profiles_search 
ON public.company_profiles 
USING gin(to_tsvector('english', company_name || ' ' || COALESCE(description, '')));

-- Add RLS policies
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;

-- Company Profiles RLS Policies
CREATE POLICY "Users can view their own company profile" ON public.company_profiles
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'owner')
        ) OR
        EXISTS (
            SELECT 1 FROM public.company_team_members ctm
            WHERE ctm.company_id = id 
            AND ctm.user_id = auth.uid()
            AND ctm.status = 'ACTIVE'
        )
    );

CREATE POLICY "Users can create their own company profile" ON public.company_profiles
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'owner', 'agent', 'vendor')
        )
    );

CREATE POLICY "Users can update their own company profile" ON public.company_profiles
    FOR UPDATE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'owner')
        ) OR
        EXISTS (
            SELECT 1 FROM public.company_team_members ctm
            WHERE ctm.company_id = id 
            AND ctm.user_id = auth.uid()
            AND ctm.access_level IN ('ADMIN', 'MANAGER')
            AND ctm.status = 'ACTIVE'
        )
    );

-- Team Members RLS Policies
CREATE POLICY "Company team members can view team" ON public.company_team_members
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.company_profiles cp
            WHERE cp.id = company_id 
            AND cp.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.company_team_members ctm
            WHERE ctm.company_id = company_id 
            AND ctm.user_id = auth.uid()
            AND ctm.status = 'ACTIVE'
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'admin'
        )
    );

CREATE POLICY "Company admins can manage team members" ON public.company_team_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.company_profiles cp
            WHERE cp.id = company_id 
            AND cp.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.company_team_members ctm
            WHERE ctm.company_id = company_id 
            AND ctm.user_id = auth.uid()
            AND ctm.access_level = 'ADMIN'
            AND ctm.status = 'ACTIVE'
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'admin'
        )
    );

-- Company Documents RLS Policies
CREATE POLICY "Company members can view documents" ON public.company_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.company_profiles cp
            WHERE cp.id = company_id 
            AND cp.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.company_team_members ctm
            WHERE ctm.company_id = company_id 
            AND ctm.user_id = auth.uid()
            AND ctm.status = 'ACTIVE'
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'admin'
        )
    );

CREATE POLICY "Company admins can manage documents" ON public.company_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.company_profiles cp
            WHERE cp.id = company_id 
            AND cp.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.company_team_members ctm
            WHERE ctm.company_id = company_id 
            AND ctm.user_id = auth.uid()
            AND ctm.access_level IN ('ADMIN', 'MANAGER')
            AND ctm.status = 'ACTIVE'
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'admin'
        )
    );

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_company_profiles_updated_at 
    BEFORE UPDATE ON public.company_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_team_members_updated_at 
    BEFORE UPDATE ON public.company_team_members 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_documents_updated_at 
    BEFORE UPDATE ON public.company_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add helpful functions
CREATE OR REPLACE FUNCTION get_user_company_profile(user_uuid UUID)
RETURNS TABLE (
    company_id UUID,
    company_name TEXT,
    company_type TEXT,
    verification_status TEXT,
    is_owner BOOLEAN,
    access_level TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp.id as company_id,
        cp.company_name,
        cp.company_type,
        cp.verification_status,
        (cp.user_id = user_uuid) as is_owner,
        COALESCE(ctm.access_level, 'OWNER') as access_level
    FROM public.company_profiles cp
    LEFT JOIN public.company_team_members ctm ON cp.id = ctm.company_id AND ctm.user_id = user_uuid
    WHERE cp.user_id = user_uuid OR ctm.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE public.company_profiles IS 'Company profiles for business users including real estate agencies, property management companies, and service providers';
COMMENT ON TABLE public.company_team_members IS 'Team members associated with company profiles for multi-user business accounts';
COMMENT ON TABLE public.company_documents IS 'Document storage and verification for company compliance and certification';

COMMENT ON COLUMN public.company_profiles.cac_registration_number IS 'Corporate Affairs Commission registration number for Nigerian businesses';
COMMENT ON COLUMN public.company_profiles.tin_number IS 'Tax Identification Number for Nigerian tax compliance';
COMMENT ON COLUMN public.company_profiles.real_estate_license_number IS 'ESVARBON or other professional real estate license number';
COMMENT ON COLUMN public.company_profiles.professional_body_membership IS 'Membership in NIESV, FIABCI Nigeria, REDAN, or other professional bodies';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.company_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_team_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_documents TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_company_profile(UUID) TO authenticated;
