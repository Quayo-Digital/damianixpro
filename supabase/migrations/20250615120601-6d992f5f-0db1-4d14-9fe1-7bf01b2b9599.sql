
-- This migration updates the handle_new_user function to be more robust.
-- It explicitly specifies the schema for the 'user_role' type to avoid any
-- potential search path issues within the trigger.

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
  -- We now explicitly cast to public.user_role to avoid any search_path issues.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'tenant'::public.user_role));
  
  RETURN new;
END;
$function$
