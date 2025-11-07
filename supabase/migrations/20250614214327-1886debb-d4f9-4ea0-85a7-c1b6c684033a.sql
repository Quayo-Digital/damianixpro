
-- Add 'owner' role to the user_role enum
ALTER TYPE public.user_role ADD VALUE 'owner';

-- Add 'agent' role to the user_role enum
ALTER TYPE public.user_role ADD VALUE 'agent';

-- Add 'tenant' role to the user_role enum
ALTER TYPE public.user_role ADD VALUE 'tenant';

-- Add 'vendor' role to the user_role enum
ALTER TYPE public.user_role ADD VALUE 'vendor';
