
-- Create a custom type for screening status
CREATE TYPE screening_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');

-- Create the tenant_screenings table
CREATE TABLE public.tenant_screenings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  status screening_status NOT NULL DEFAULT 'pending',
  results jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add comments for clarity
COMMENT ON TABLE public.tenant_screenings IS 'Stores tenant screening requests and results.';
COMMENT ON COLUMN public.tenant_screenings.status IS 'The overall status of the screening process.';
COMMENT ON COLUMN public.tenant_screenings.results IS 'Detailed results of various checks (background, credit, etc.).';

-- Function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update 'updated_at' on row update for tenant_screenings
CREATE TRIGGER set_tenant_screenings_timestamp
BEFORE UPDATE ON public.tenant_screenings
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Enable Row Level Security
ALTER TABLE public.tenant_screenings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- This policy allows any authenticated user to manage screenings.
-- We can refine this later to be role-specific (e.g., admins or property owners).
CREATE POLICY "Allow authenticated users to manage screenings"
ON public.tenant_screenings
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
