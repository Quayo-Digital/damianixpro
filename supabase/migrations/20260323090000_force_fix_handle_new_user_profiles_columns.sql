-- Force fix: ensure the auth user trigger writes to profiles (first_name/last_name/email),
-- not to a non-existent `full_name` column.

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
  role_enum public.user_role := 'tenant'::public.user_role;
  role_text text;
BEGIN
  full_nm := trim(COALESCE(meta->>'full_name', meta->>'name', ''));

  IF full_nm <> '' THEN
    fn := split_part(full_nm, ' ', 1);
    ln := nullif(trim(substring(full_nm from length(fn) + 2)), '');
  ELSE
    fn := nullif(trim(COALESCE(meta->>'first_name', '')), '');
    ln := nullif(trim(COALESCE(meta->>'last_name', '')), '');
  END IF;

  em := nullif(trim(COALESCE(new.email, '')), '');
  IF em IS NULL THEN
    em := new.id::text || '@users.noreply.supabase';
  END IF;

  role_text := trim(COALESCE(meta->>'role', ''));
  IF role_text <> '' THEN
    BEGIN
      role_enum := role_text::public.user_role;
    EXCEPTION WHEN others THEN
      role_enum := 'tenant'::public.user_role;
    END;
  END IF;

  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (new.id, fn, ln, em)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, role_enum)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$function$;

