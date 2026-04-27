
-- Add a column to store agent commission rate on a per-property basis
ALTER TABLE public.properties
ADD COLUMN agent_commission_rate NUMERIC(5, 4) DEFAULT 0.03;

COMMENT ON COLUMN public.properties.agent_commission_rate IS 'The commission rate for the agent, e.g., 0.05 for 5%. Stored as a decimal.';
