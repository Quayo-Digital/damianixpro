DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
    BEGIN ALTER TYPE public.user_role ADD VALUE 'owner'; EXCEPTION WHEN duplicate_object THEN null; END;
    BEGIN ALTER TYPE public.user_role ADD VALUE 'agent'; EXCEPTION WHEN duplicate_object THEN null; END;
    BEGIN ALTER TYPE public.user_role ADD VALUE 'tenant'; EXCEPTION WHEN duplicate_object THEN null; END;
    BEGIN ALTER TYPE public.user_role ADD VALUE 'vendor'; EXCEPTION WHEN duplicate_object THEN null; END;
  END IF;
END $$;
