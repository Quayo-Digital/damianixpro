DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='payment_breakdowns')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='rent_payments') THEN
    ALTER TABLE public.payment_breakdowns DROP CONSTRAINT IF EXISTS payment_breakdowns_payment_id_fkey;
    ALTER TABLE public.payment_breakdowns ADD CONSTRAINT payment_breakdowns_payment_id_fkey
      FOREIGN KEY (payment_id) REFERENCES public.rent_payments(id) ON DELETE CASCADE;
  END IF;
END $$;
