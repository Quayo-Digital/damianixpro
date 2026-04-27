-- Fix User Signup Trigger
-- This migration ensures the handle_new_user trigger exists and handles errors gracefully

-- First, ensure the trigger function exists and handles errors
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Insert into public.profiles, now including the email
  -- Use ON CONFLICT to handle duplicate id gracefully (user might have been partially created)
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', ''), 
    new.email
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    email = COALESCE(EXCLUDED.email, profiles.email);
  
  -- Insert into public.user_roles using the role from signup metadata, with 'tenant' as a fallback
  -- Use ON CONFLICT to handle duplicate role assignments gracefully
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    new.id, 
    COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'tenant'::public.user_role)
  )
  ON CONFLICT (user_id) DO UPDATE
  SET role = COALESCE(EXCLUDED.role, user_roles.role);
  
  RETURN new;
EXCEPTION
  WHEN unique_violation THEN
    -- Handle email uniqueness constraint violation gracefully
    -- This can happen if email already exists for a different user
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Email already exists in profiles table, but user creation will proceed: %', SQLERRM;
    RETURN new;
  WHEN OTHERS THEN
    -- Log any other error but don't fail the user creation
    -- This ensures user signup succeeds even if profile creation has issues
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN new;
END;
$function$;

-- Drop the trigger if it exists to recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT ALL ON public.user_roles TO postgres, service_role;

-- Add comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function that creates profile and user_role records when a new user signs up. Handles errors gracefully to prevent signup failures.';
