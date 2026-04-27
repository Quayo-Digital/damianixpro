-- Add columns to support recurring payments and payment details (only if rent_payments exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='rent_payments') THEN
    ALTER TABLE public.rent_payments ADD COLUMN IF NOT EXISTS category TEXT;
    ALTER TABLE public.rent_payments ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE public.rent_payments ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
    ALTER TABLE public.rent_payments ADD COLUMN IF NOT EXISTS recurring_type TEXT;
    ALTER TABLE public.rent_payments ADD COLUMN IF NOT EXISTS next_payment_date DATE;
  END IF;
END $$;
