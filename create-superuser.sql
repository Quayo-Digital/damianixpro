-- =====================================================
-- CREATE / RECREATE SUPERUSER (super_admin)
-- =====================================================
-- super_admin (and admin) bypass owner subscription checks in the app UI and
-- in assertOwnerSubscriptionForPaidFeatures (listing / property flows).
--
-- Run in Supabase Dashboard → SQL (as postgres / service role).
--
-- Account (no passwords in this file):
--   Name:  Motomboni
--   Email: delroydamian@outlook.com
--
-- Step 1 — Create or recreate the Auth user (password is set ONLY here):
--   Authentication → Users
--   - To recreate: delete the existing user with this email (if any), then Add user.
--   - Create new user → Email: delroydamian@outlook.com
--   - Password: (your chosen password; min length per project)
--   - Turn on "Auto Confirm Email" if you want immediate login.
--
-- Step 2 — Run the block below after the Auth user exists.
-- =====================================================

DO $$
DECLARE
    target_email TEXT := 'delroydamian@outlook.com';
    display_name TEXT := 'Motomboni';
    user_uuid UUID;
BEGIN
    SELECT id INTO user_uuid
    FROM auth.users
    WHERE lower(trim(email)) = lower(trim(target_email));

    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'User with email % not found. Create the user under Authentication → Users first.', target_email;
    END IF;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (user_uuid, 'super_admin')
    ON CONFLICT (user_id)
    DO UPDATE SET role = EXCLUDED.role;

    INSERT INTO public.profiles (id, email, first_name)
    VALUES (user_uuid, target_email, display_name)
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name;

    UPDATE auth.users
    SET raw_user_meta_data =
        COALESCE(raw_user_meta_data, '{}'::jsonb)
        || jsonb_build_object(
            'role', 'super_admin',
            'full_name', display_name
        )
    WHERE id = user_uuid;

    RAISE NOTICE 'super_admin assigned for %', target_email;
    RAISE NOTICE 'User ID: %', user_uuid;
END $$;

-- =====================================================
-- Verify
-- =====================================================

SELECT
    u.id AS user_id,
    u.email,
    u.created_at,
    ur.role,
    p.first_name,
    p.email AS profile_email
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.profiles p ON u.id = p.id
WHERE lower(u.email) = lower(trim('delroydamian@outlook.com'));
