-- Fix: Add 'company' column to profiles table if it doesn't exist
-- Run this in your Supabase SQL Editor

DO $$
BEGIN
    -- Check if the 'company' column exists in the profiles table
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'company'
    ) THEN
        -- Add the company column
        ALTER TABLE public.profiles 
        ADD COLUMN company TEXT;
        
        RAISE NOTICE 'Added company column to profiles table';
    ELSE
        RAISE NOTICE 'Company column already exists in profiles table';
    END IF;
END $$;

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles' 
AND column_name = 'company';

