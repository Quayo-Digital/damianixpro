
-- This migration fixes table relationships and constraints for user profiles and roles.

-- Step 1: Add a foreign key from 'profiles.id' to 'auth.users.id'
-- This ensures that a profile is deleted when the corresponding user is deleted from Supabase auth.
-- We will only add it if it doesn't exist.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_id_fkey' AND conrelid = 'public.profiles'::regclass
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_id_fkey 
        FOREIGN KEY (id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
    END IF;
END;
$$;

-- Step 2: Add a foreign key from 'user_roles.user_id' to 'auth.users.id'
-- This ensures that user roles are deleted when the corresponding user is deleted.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_roles_user_id_fkey' AND conrelid = 'public.user_roles'::regclass
    ) THEN
        ALTER TABLE public.user_roles 
        ADD CONSTRAINT user_roles_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
    END IF;
END;
$$;

-- Step 3: Add a unique constraint to 'user_roles.user_id'
-- This ensures that each user has only one role, which matches the application logic.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_roles_user_id_key' AND conrelid = 'public.user_roles'::regclass
    ) THEN
        ALTER TABLE public.user_roles 
        ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);
    END IF;
END;
$$;
