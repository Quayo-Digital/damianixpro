
-- This migration adds a one-time use invite code for the super admin.
-- The first user to redeem this code on the /super-admin-redeem page will become the super admin.
INSERT INTO public.super_admin_invite (code) VALUES ('f47ac10b-58cc-4372-a567-0e02b2c3d479');
