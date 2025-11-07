
-- Create a table to store user subscriptions
CREATE TABLE public.subscriptions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id text NOT NULL, -- e.g. 'basic-monthly', 'professional-yearly'
    status text NOT NULL, -- e.g. 'active', 'incomplete', 'cancelled'
    paystack_plan_code text,
    paystack_subscription_code text UNIQUE,
    paystack_customer_code text,
    current_period_end timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row-Level Security on the new table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Add a policy to allow users to view their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Create a trigger to automatically update the 'updated_at' column
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

