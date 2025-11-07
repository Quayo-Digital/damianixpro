
-- Add columns to support recurring payments and payment details
ALTER TABLE public.rent_payments
ADD COLUMN category TEXT,
ADD COLUMN description TEXT,
ADD COLUMN is_recurring BOOLEAN DEFAULT false,
ADD COLUMN recurring_type TEXT,
ADD COLUMN next_payment_date DATE;
