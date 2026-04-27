-- Add AI Onboarding Assistant columns to profiles table
-- These columns store onboarding completion status and user preferences from the AI onboarding flow

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS recommended_settings JSONB DEFAULT '{}';

COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Whether user completed the AI onboarding assistant flow';
COMMENT ON COLUMN public.profiles.onboarding_data IS 'Stores AI onboarding answers: userType, propertyCount, propertyTypes, locations, paymentPreference, staffSize';
COMMENT ON COLUMN public.profiles.recommended_settings IS 'AI-generated recommended settings: paymentFrequency, defaultLocations, etc.';
