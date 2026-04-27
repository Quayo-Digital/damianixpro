-- Fix properties.organization_id - ensures default organization exists
-- Run in Supabase SQL Editor: Project > SQL Editor > New query > paste and run

-- 1. Create organizations table if it doesn't exist (skip if table has different structure)
DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'Default Organization',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. Insert default organization
INSERT INTO public.organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'Default Organization')
ON CONFLICT (id) DO NOTHING;

-- 3. Set default for properties.organization_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.properties 
      ALTER COLUMN organization_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
    UPDATE public.properties SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE organization_id IS NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
