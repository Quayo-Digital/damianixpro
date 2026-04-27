-- Prevent signup 500 by making handle_new_user() non-fatal.
-- It tolerates different `profiles` schemas (full_name vs first_name/last_name),
-- and it avoids ON CONFLICT requirements that can break at runtime.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  meta jsonb := COALESCE(new.raw_user_meta_data, '{}'::jsonb);
  full_nm text;
  fn text;
  ln text;
  em text;
  role_text text;

  has_full_name boolean := false;
  has_first_last boolean := false;
BEGIN
  -- Any failure in this trigger should NOT block auth signup.
  BEGIN
    full_nm := trim(COALESCE(meta->>'full_name', meta->>'name', ''));

    IF full_nm <> '' THEN
      fn := split_part(full_nm, ' ', 1);
      ln := nullif(trim(substring(full_nm from length(fn) + 2)), '');
    ELSE
      fn := nullif(trim(COALESCE(meta->>'first_name', '')), '');
      ln := nullif(trim(COALESCE(meta->>'last_name', '')), '');
    END IF;

    em := nullif(trim(COALESCE(new.email, meta->>'email', '')), '');
    IF em IS NULL THEN
      em := new.id::text || '@users.noreply.supabase';
    END IF;

    role_text := trim(COALESCE(meta->>'role', ''));
    IF role_text = '' THEN
      role_text := 'tenant';
    END IF;

    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'full_name'
    )
    INTO has_full_name;

    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'first_name'
    )
    INTO has_first_last;

    -- Insert into profiles if a row doesn't exist yet.
    IF has_first_last THEN
      IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = new.id) THEN
        INSERT INTO public.profiles (id, first_name, last_name, email)
        VALUES (new.id, fn, ln, em);
      END IF;
    ELSIF has_full_name THEN
      IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = new.id) THEN
        INSERT INTO public.profiles (id, full_name, email)
        VALUES (new.id, COALESCE(full_nm, ''), em);
      END IF;
    END IF;

    -- Insert into user_roles if a row doesn't exist yet.
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='user_roles') THEN
      IF NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = new.id) THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (new.id, role_text);
      END IF;
    END IF;
  EXCEPTION WHEN others THEN
    -- Log and continue: we don't want auth signup to fail.
    RAISE NOTICE 'handle_new_user nonfatal trigger error: %', SQLERRM;
  END;

  RETURN new;
END;
$function$;

