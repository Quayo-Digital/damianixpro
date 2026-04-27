-- Optional columns used by the app for annual rent and UI; safe if already present.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS lease_price numeric(15, 2);

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS property_type text;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS monthly_rent numeric(12, 2);

COMMENT ON COLUMN public.properties.lease_price IS 'Annual lease amount (NGN) when used by the app.';
