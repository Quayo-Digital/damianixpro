-- Add Agent Onboarding Fields Migration
-- Adds agent-specific fields to profiles table and creates dedicated agents table
-- Fixes WF-002: Agent Onboarding Form issue

-- Add agent-specific fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS license_number TEXT,
ADD COLUMN IF NOT EXISTS years_of_experience INTEGER,
ADD COLUMN IF NOT EXISTS specializations TEXT[],
ADD COLUMN IF NOT EXISTS working_areas TEXT[],
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS availability_hours TEXT DEFAULT 'business_hours',
ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT DEFAULT 'phone';

-- Create dedicated agents table for additional agent-specific data
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    license_number TEXT,
    years_of_experience INTEGER,
    specializations TEXT[],
    working_areas TEXT[],
    availability_hours TEXT DEFAULT 'business_hours',
    preferred_contact_method TEXT DEFAULT 'phone',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    properties_managed INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one agent record per user
    UNIQUE(user_id)
);

-- Add comments for documentation
COMMENT ON TABLE public.agents IS 'Agent-specific data and performance metrics';
COMMENT ON COLUMN public.agents.user_id IS 'References the user in auth.users and profiles tables';
COMMENT ON COLUMN public.agents.license_number IS 'Real estate license number (if applicable)';
COMMENT ON COLUMN public.agents.years_of_experience IS 'Years of experience in real estate';
COMMENT ON COLUMN public.agents.specializations IS 'Array of property specializations (e.g., residential, commercial)';
COMMENT ON COLUMN public.agents.working_areas IS 'Array of cities/areas where agent works';
COMMENT ON COLUMN public.agents.availability_hours IS 'Agent availability schedule';
COMMENT ON COLUMN public.agents.preferred_contact_method IS 'Preferred way for clients to contact agent';
COMMENT ON COLUMN public.agents.status IS 'Agent status: active, inactive, or pending approval';
COMMENT ON COLUMN public.agents.rating IS 'Average rating from client reviews (0.00 to 5.00)';
COMMENT ON COLUMN public.agents.total_reviews IS 'Total number of client reviews';
COMMENT ON COLUMN public.agents.properties_managed IS 'Number of properties currently managed';

-- Enable RLS on agents table
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agents table
-- 1. INSERT policy - Allow authenticated users to create their own agent record
CREATE POLICY "Users can create their own agent record"
ON public.agents
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. SELECT policy - Users can view their own record, admins can view all
CREATE POLICY "Users can view agent records"
ON public.agents
FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'super_admin')
    )
);

-- 3. UPDATE policy - Users can update their own record, admins can update all
CREATE POLICY "Users can update agent records"
ON public.agents
FOR UPDATE
TO authenticated
USING (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'super_admin')
    )
)
WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'super_admin')
    )
);

-- 4. DELETE policy - Only admins can delete agent records
CREATE POLICY "Admins can delete agent records"
ON public.agents
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'super_admin')
    )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON public.agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON public.agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_working_areas ON public.agents USING GIN(working_areas);
CREATE INDEX IF NOT EXISTS idx_agents_specializations ON public.agents USING GIN(specializations);
CREATE INDEX IF NOT EXISTS idx_agents_rating ON public.agents(rating DESC);

-- Create updated_at trigger for agents table
CREATE OR REPLACE FUNCTION public.update_agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON public.agents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_agents_updated_at();

-- Add comments on profiles table new columns
COMMENT ON COLUMN public.profiles.license_number IS 'Real estate license number (duplicated from agents table for easy access)';
COMMENT ON COLUMN public.profiles.years_of_experience IS 'Years of experience in real estate';
COMMENT ON COLUMN public.profiles.specializations IS 'Array of property specializations';
COMMENT ON COLUMN public.profiles.working_areas IS 'Array of cities/areas where user works';
COMMENT ON COLUMN public.profiles.bio IS 'Professional bio/description';
COMMENT ON COLUMN public.profiles.availability_hours IS 'Availability schedule';
COMMENT ON COLUMN public.profiles.preferred_contact_method IS 'Preferred contact method';

-- Verification query
DO $$
DECLARE
    profiles_columns_count INTEGER;
    agents_table_exists BOOLEAN;
    agents_policies_count INTEGER;
BEGIN
    -- Check profiles table columns
    SELECT COUNT(*) INTO profiles_columns_count
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND table_schema = 'public'
    AND column_name IN ('license_number', 'years_of_experience', 'specializations', 'working_areas', 'bio', 'availability_hours', 'preferred_contact_method');
    
    -- Check if agents table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'agents' AND table_schema = 'public'
    ) INTO agents_table_exists;
    
    -- Count agents table policies
    SELECT COUNT(*) INTO agents_policies_count
    FROM pg_policies 
    WHERE tablename = 'agents' AND schemaname = 'public';
    
    RAISE NOTICE 'Added % agent-specific columns to profiles table', profiles_columns_count;
    
    IF agents_table_exists THEN
        RAISE NOTICE 'Created agents table with % RLS policies', agents_policies_count;
    ELSE
        RAISE WARNING 'Failed to create agents table';
    END IF;
    
    IF profiles_columns_count >= 7 AND agents_table_exists AND agents_policies_count >= 4 THEN
        RAISE NOTICE '✅ Agent onboarding database schema successfully created';
    ELSE
        RAISE WARNING '⚠️ Agent onboarding schema may be incomplete';
    END IF;
END $$;
