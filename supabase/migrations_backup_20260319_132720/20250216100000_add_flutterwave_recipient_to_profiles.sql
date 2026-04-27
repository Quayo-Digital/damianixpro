-- Add Flutterwave recipient information to profiles table
-- Flutterwave uses inline bank details (no recipient code) - we store verified account data

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS flutterwave_recipient_data JSONB;

CREATE INDEX IF NOT EXISTS idx_profiles_flutterwave_recipient ON public.profiles(flutterwave_recipient_data)
WHERE flutterwave_recipient_data IS NOT NULL;

COMMENT ON COLUMN public.profiles.flutterwave_recipient_data IS 'Flutterwave payout recipient details (account_number, bank_code, account_name, bank_name) - used for inline transfers';
