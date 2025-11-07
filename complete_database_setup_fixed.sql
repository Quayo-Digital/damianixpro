-- Complete Database Setup for Nigeria Homes (Fixed Version)
-- This script creates all tables expected by the application
-- Handles existing types and tables gracefully

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create custom types (only if they don't exist)
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('super_admin', 'admin', 'manager', 'user', 'owner', 'agent', 'tenant', 'vendor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.application_status AS ENUM ('pending', 'approved', 'rejected', 'more_info');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.screening_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Activities table
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    amount TEXT,
    date TEXT NOT NULL,
    location TEXT,
    property TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_global BOOLEAN DEFAULT false,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Application documents table
CREATE TABLE IF NOT EXISTS public.application_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID,
    document_id UUID,
    document_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rental applications table
CREATE TABLE IF NOT EXISTS public.rental_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    current_address TEXT,
    employment_status TEXT,
    employer_name TEXT,
    employer_contact TEXT,
    monthly_income NUMERIC,
    occupation TEXT,
    num_occupants INTEGER,
    has_pets BOOLEAN,
    pets_details TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    move_in_date DATE,
    tenancy_period INTEGER,
    status public.application_status DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update profiles table to use the new user_role enum
DO $$ BEGIN
    ALTER TABLE public.profiles ALTER COLUMN role TYPE public.user_role USING role::public.user_role;
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

-- Update notifications table to use the existing notification_type enum
DO $$ BEGIN
    ALTER TABLE public.notifications ALTER COLUMN type TYPE public.notification_type USING type::public.notification_type;
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

-- Enable RLS on new tables
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_applications ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies for new tables
CREATE POLICY "Users can view their own activities" ON public.activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own activities" ON public.activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own activities" ON public.activities FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view global announcements" ON public.announcements FOR SELECT USING (is_global = true);
CREATE POLICY "Property owners can view property announcements" ON public.announcements FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND owner_id = auth.uid())
);
CREATE POLICY "Users can create announcements" ON public.announcements FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own applications" ON public.rental_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own applications" ON public.rental_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Property owners can view applications for their properties" ON public.rental_applications FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND owner_id = auth.uid())
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_date ON public.activities(date);

CREATE INDEX IF NOT EXISTS idx_announcements_global ON public.announcements(is_global);
CREATE INDEX IF NOT EXISTS idx_announcements_property ON public.announcements(property_id);
CREATE INDEX IF NOT EXISTS idx_announcements_expires ON public.announcements(expires_at);

CREATE INDEX IF NOT EXISTS idx_rental_applications_user ON public.rental_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_rental_applications_property ON public.rental_applications(property_id);
CREATE INDEX IF NOT EXISTS idx_rental_applications_status ON public.rental_applications(status);

-- Add updated_at triggers to new tables
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rental_applications_updated_at BEFORE UPDATE ON public.rental_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper functions for role checking (only create if they don't exist)
CREATE OR REPLACE FUNCTION public.has_role(uid UUID, requested_role public.user_role)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = uid AND role = requested_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = uid AND role IN ('super_admin', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for new tables
ALTER TABLE public.rental_applications REPLICA IDENTITY FULL;

-- Add new tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.rental_applications;
