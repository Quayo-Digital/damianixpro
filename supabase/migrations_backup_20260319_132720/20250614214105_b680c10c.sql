-- Step 1: Add an 'email' column to the 'profiles' table to store user emails.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Step 2: Backfill the new 'email' column for all existing users from the 'auth.users' table.
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- Step 3: Add 'NOT NULL' and 'UNIQUE' constraints (only if column exists and constraints not already present)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='email') THEN
    BEGIN
      ALTER TABLE public.profiles ALTER COLUMN email SET NOT NULL;
    EXCEPTION WHEN OTHERS THEN null;
    END;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_email_key') THEN
      ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
    END IF;
  END IF;
END $$;

-- Step 4: Update the 'handle_new_user' database function.
-- This function runs automatically for new sign-ups. It will now also save the user's email
-- and correctly assign the role they selected during registration.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Insert into public.profiles, now including the email
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', ''), new.email);
  
  -- Insert into public.user_roles using the role from signup metadata, with 'tenant' as a fallback.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, COALESCE((new.raw_user_meta_data->>'role')::user_role, 'tenant'));
  
  RETURN new;
END;
$function$
