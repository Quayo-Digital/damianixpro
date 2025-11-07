-- =====================================================
-- PURGE AUTHENTICATION DATABASE - RESET ALL USERS
-- =====================================================
-- WARNING: This script will DELETE ALL users and their data!
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Step 1: Disable triggers temporarily to avoid issues
SET session_replication_role = 'replica';

-- Step 2: Delete all user-related data from public tables
-- (Most tables have ON DELETE CASCADE, but we'll be explicit)

-- Delete from user subscriptions
DELETE FROM public.user_subscriptions;
DELETE FROM public.usage_history;
DELETE FROM public.invoices WHERE user_id IS NOT NULL;

-- Delete from subscriptions (if exists)
DELETE FROM public.subscriptions;

-- Delete from KYC profiles and verification records
DELETE FROM public.verification_records;
DELETE FROM public.kyc_profiles;

-- Delete from blockchain-related tables
DELETE FROM public.identity_credentials;
DELETE FROM public.document_hashes WHERE user_id IS NOT NULL;

-- Delete from maintenance requests
DELETE FROM public.maintenance_requests WHERE user_id IS NOT NULL;

-- Delete from tenants (if user_id column exists)
DELETE FROM public.tenants WHERE user_id IS NOT NULL;

-- Delete from properties (if owner_id references users)
-- Note: This will delete ALL properties. Comment out if you want to keep properties.
-- DELETE FROM public.properties WHERE owner_id IS NOT NULL;

-- Delete from applications (if user_id exists)
DELETE FROM public.rental_applications WHERE user_id IS NOT NULL;

-- Delete from lease agreements (if tenant_id references users)
-- DELETE FROM public.lease_agreements WHERE tenant_id IS NOT NULL;

-- Delete from messages/communications
DELETE FROM public.messages WHERE sender_id IS NOT NULL OR recipient_id IS NOT NULL;
DELETE FROM public.conversations WHERE user1_id IS NOT NULL OR user2_id IS NOT NULL;

-- Delete from notifications
DELETE FROM public.notifications WHERE user_id IS NOT NULL;

-- Delete from documents
DELETE FROM public.documents WHERE user_id IS NOT NULL;

-- Delete from inspections
DELETE FROM public.inspections WHERE inspector_id IS NOT NULL OR tenant_id IS NOT NULL;

-- Delete from payments/transactions (if user_id exists)
DELETE FROM public.transactions WHERE user_id IS NOT NULL;
DELETE FROM public.payments WHERE user_id IS NOT NULL;

-- Delete from agent/owner/vendor specific tables
DELETE FROM public.agent_profiles;
DELETE FROM public.owner_profiles;
DELETE FROM public.vendor_profiles;

-- Delete from company profiles
DELETE FROM public.company_profiles WHERE owner_id IS NOT NULL;

-- Delete from user roles
DELETE FROM public.user_roles;

-- Delete from profiles
DELETE FROM public.profiles;

-- Step 3: Delete all users from auth.users
-- This is the main authentication table
DELETE FROM auth.users;

-- Step 4: Clean up any remaining auth-related data
-- Delete from auth.sessions (if accessible)
-- Note: Some auth tables may not be directly accessible, but CASCADE should handle it

-- Step 5: Re-enable triggers
SET session_replication_role = 'origin';

-- Step 6: Verify deletion
-- Check that all users are gone
SELECT COUNT(*) as remaining_users FROM auth.users;
SELECT COUNT(*) as remaining_profiles FROM public.profiles;
SELECT COUNT(*) as remaining_user_roles FROM public.user_roles;

-- =====================================================
-- RESET COMPLETE!
-- =====================================================
-- All users have been deleted. You can now:
-- 1. Create new users through the Supabase Auth dashboard
-- 2. Or use the sign-up flow in your application
-- =====================================================

