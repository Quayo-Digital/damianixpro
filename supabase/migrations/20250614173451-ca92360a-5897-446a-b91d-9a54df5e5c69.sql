
ALTER TABLE public.payment_breakdowns
ADD CONSTRAINT payment_breakdowns_payment_id_fkey
FOREIGN KEY (payment_id) REFERENCES public.rent_payments(id)
ON DELETE CASCADE;
