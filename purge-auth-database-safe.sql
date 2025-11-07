-- =====================================================
-- SAFE PURGE AUTHENTICATION DATABASE
-- This version preserves properties and other business data
-- =====================================================
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Step 1: Disable triggers temporarily
SET session_replication_role = 'replica';

-- Step 2: Delete user-related data but preserve business data
-- Using conditional deletes to handle tables that may not exist

-- Delete from user subscriptions (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_subscriptions') THEN
        DELETE FROM public.user_subscriptions;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'usage_history') THEN
        DELETE FROM public.usage_history;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices') THEN
        -- Check if user_id column exists before using it
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'user_id') THEN
            DELETE FROM public.invoices WHERE user_id IS NOT NULL;
        ELSE
            -- If no user_id column, delete all invoices
            DELETE FROM public.invoices;
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
        DELETE FROM public.subscriptions;
    END IF;
END $$;

-- Delete from KYC profiles and verification records
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'verification_records') THEN
        DELETE FROM public.verification_records;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'kyc_profiles') THEN
        DELETE FROM public.kyc_profiles;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'identity_credentials') THEN
        DELETE FROM public.identity_credentials;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'document_hashes') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'document_hashes' AND column_name = 'user_id') THEN
            DELETE FROM public.document_hashes WHERE user_id IS NOT NULL;
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'maintenance_requests') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance_requests' AND column_name = 'user_id') THEN
            DELETE FROM public.maintenance_requests WHERE user_id IS NOT NULL;
        END IF;
    END IF;
END $$;

-- Delete from tenants (preserve tenant records but clear user links)
-- Uncomment if you want to delete tenant records too:
-- DELETE FROM public.tenants WHERE user_id IS NOT NULL;

-- NOTE: Properties are preserved - only owner_id links are cleared
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'properties') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'owner_id') THEN
            UPDATE public.properties SET owner_id = NULL WHERE owner_id IS NOT NULL;
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'agent_id') THEN
            UPDATE public.properties SET agent_id = NULL WHERE agent_id IS NOT NULL;
        END IF;
    END IF;
END $$;

-- Delete from applications and other user-related tables
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rental_applications') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rental_applications' AND column_name = 'user_id') THEN
            DELETE FROM public.rental_applications WHERE user_id IS NOT NULL;
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'sender_id') THEN
            IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'recipient_id') THEN
                DELETE FROM public.messages WHERE sender_id IS NOT NULL OR recipient_id IS NOT NULL;
            ELSE
                DELETE FROM public.messages WHERE sender_id IS NOT NULL;
            END IF;
        ELSIF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'recipient_id') THEN
            DELETE FROM public.messages WHERE recipient_id IS NOT NULL;
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'user1_id') THEN
            IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'user2_id') THEN
                DELETE FROM public.conversations WHERE user1_id IS NOT NULL OR user2_id IS NOT NULL;
            ELSE
                DELETE FROM public.conversations WHERE user1_id IS NOT NULL;
            END IF;
        ELSIF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'user2_id') THEN
            DELETE FROM public.conversations WHERE user2_id IS NOT NULL;
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'user_id') THEN
            DELETE FROM public.notifications WHERE user_id IS NOT NULL;
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'user_id') THEN
            DELETE FROM public.documents WHERE user_id IS NOT NULL;
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inspections') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inspections' AND column_name = 'inspector_id') THEN
            IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inspections' AND column_name = 'tenant_id') THEN
                DELETE FROM public.inspections WHERE inspector_id IS NOT NULL OR tenant_id IS NOT NULL;
            ELSE
                DELETE FROM public.inspections WHERE inspector_id IS NOT NULL;
            END IF;
        ELSIF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inspections' AND column_name = 'tenant_id') THEN
            DELETE FROM public.inspections WHERE tenant_id IS NOT NULL;
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'user_id') THEN
            DELETE FROM public.transactions WHERE user_id IS NOT NULL;
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'user_id') THEN
            DELETE FROM public.payments WHERE user_id IS NOT NULL;
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_transactions') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payment_transactions' AND column_name = 'user_id') THEN
            DELETE FROM public.payment_transactions WHERE user_id IS NOT NULL;
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_profiles') THEN
        DELETE FROM public.agent_profiles;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'owner_profiles') THEN
        DELETE FROM public.owner_profiles;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vendor_profiles') THEN
        DELETE FROM public.vendor_profiles;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_profiles') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'company_profiles' AND column_name = 'owner_id') THEN
            DELETE FROM public.company_profiles WHERE owner_id IS NOT NULL;
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscription_events') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscription_events' AND column_name = 'user_id') THEN
            DELETE FROM public.subscription_events WHERE user_id IS NOT NULL;
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'white_label_configs') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'white_label_configs' AND column_name = 'user_id') THEN
            DELETE FROM public.white_label_configs WHERE user_id IS NOT NULL;
        END IF;
    END IF;
END $$;

-- Delete from user roles and profiles
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
        DELETE FROM public.user_roles;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        DELETE FROM public.profiles;
    END IF;
END $$;

-- Step 3: Delete all users from auth.users
DELETE FROM auth.users;

-- Step 4: Re-enable triggers
SET session_replication_role = 'origin';

-- Step 5: Verify deletion
DO $$
DECLARE
    user_count INTEGER;
    profile_count INTEGER;
    role_count INTEGER;
    property_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM auth.users;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        SELECT COUNT(*) INTO profile_count FROM public.profiles;
    ELSE
        profile_count := 0;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
        SELECT COUNT(*) INTO role_count FROM public.user_roles;
    ELSE
        role_count := 0;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'properties') THEN
        SELECT COUNT(*) INTO property_count FROM public.properties;
    ELSE
        property_count := 0;
    END IF;
    
    RAISE NOTICE 'Verification Results:';
    RAISE NOTICE '  Remaining users: %', user_count;
    RAISE NOTICE '  Remaining profiles: %', profile_count;
    RAISE NOTICE '  Remaining user_roles: %', role_count;
    RAISE NOTICE '  Remaining properties: %', property_count;
END $$;

-- =====================================================
-- RESET COMPLETE!
-- =====================================================
-- All users deleted. Properties and business data preserved.
-- =====================================================

