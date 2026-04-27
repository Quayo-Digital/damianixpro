-- Add Bank Account to chart of accounts for Flutterwave payment integration
INSERT INTO public.chart_of_accounts (account_name, account_type) VALUES
  ('Bank Account', 'asset')
ON CONFLICT (account_name) DO NOTHING;
