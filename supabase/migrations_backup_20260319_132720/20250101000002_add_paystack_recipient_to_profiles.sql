-- Add Paystack recipient information to profiles table
-- This stores the Paystack recipient code for faster payout processing

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS paystack_recipient_code TEXT,
ADD COLUMN IF NOT EXISTS paystack_recipient_data JSONB;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_paystack_recipient ON profiles(paystack_recipient_code) 
WHERE paystack_recipient_code IS NOT NULL;

-- Add comment
COMMENT ON COLUMN profiles.paystack_recipient_code IS 'Paystack transfer recipient code for payouts';
COMMENT ON COLUMN profiles.paystack_recipient_data IS 'Paystack recipient details (account number, bank name, etc.)';

