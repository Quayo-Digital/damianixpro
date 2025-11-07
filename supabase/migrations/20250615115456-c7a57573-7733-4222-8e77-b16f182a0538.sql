
-- Create the user_role enum type if it doesn't already exist.
-- This type is required by the handle_new_user trigger for user signups.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM (
            'super_admin',
            'admin',
            'owner',
            'agent',
            'tenant',
            'vendor',
            'user',
            'manager'
        );
    END IF;
END
$$;
