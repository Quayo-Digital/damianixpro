create extension if not exists "pg_cron" with schema "pg_catalog";

create extension if not exists "pgjwt" with schema "extensions";

drop extension if exists "pg_net";

create extension if not exists "pg_trgm" with schema "public";

create type "public"."notification_type" as enum ('payment', 'maintenance', 'lease', 'announcement', 'general', 'message');

create type "public"."screening_status" as enum ('pending', 'in_progress', 'completed', 'failed');

create type "public"."user_role" as enum ('super_admin', 'admin', 'owner', 'agent', 'tenant', 'vendor', 'user', 'manager');

create sequence "public"."nigerian_banks_id_seq";

revoke delete on table "public"."organizations" from "anon";

revoke insert on table "public"."organizations" from "anon";

revoke references on table "public"."organizations" from "anon";

revoke select on table "public"."organizations" from "anon";

revoke trigger on table "public"."organizations" from "anon";

revoke truncate on table "public"."organizations" from "anon";

revoke update on table "public"."organizations" from "anon";

revoke delete on table "public"."organizations" from "service_role";

revoke insert on table "public"."organizations" from "service_role";

revoke references on table "public"."organizations" from "service_role";

revoke select on table "public"."organizations" from "service_role";

revoke trigger on table "public"."organizations" from "service_role";

revoke truncate on table "public"."organizations" from "service_role";

revoke update on table "public"."organizations" from "service_role";


  create table "public"."accounting_config" (
    "id" uuid not null default gen_random_uuid(),
    "key" text not null,
    "value" jsonb not null,
    "description" text,
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."accounting_config" enable row level security;


  create table "public"."accounts" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "name" text not null,
    "type" text,
    "created_at" timestamp without time zone default CURRENT_TIMESTAMP
      );



  create table "public"."agents" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "license_number" text,
    "years_of_experience" integer,
    "specializations" text[],
    "working_areas" text[],
    "availability_hours" text default 'business_hours'::text,
    "preferred_contact_method" text default 'phone'::text,
    "status" text default 'active'::text,
    "rating" numeric(3,2) default 0.00,
    "total_reviews" integer default 0,
    "properties_managed" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."agents" enable row level security;


  create table "public"."api_provider_configs" (
    "id" uuid not null default gen_random_uuid(),
    "provider" character varying(20) not null,
    "service_type" character varying(20) not null,
    "api_key_encrypted" text,
    "base_url" character varying(255) not null,
    "sandbox_mode" boolean default true,
    "rate_limit_per_minute" integer default 60,
    "rate_limit_per_hour" integer default 1000,
    "rate_limit_per_day" integer default 10000,
    "webhook_url" character varying(255),
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."api_provider_configs" enable row level security;


  create table "public"."api_usage_logs" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "provider" character varying(20) not null,
    "service_type" character varying(20) not null,
    "endpoint" character varying(100),
    "request_method" character varying(10) default 'POST'::character varying,
    "request_size_bytes" integer,
    "response_size_bytes" integer,
    "response_time_ms" integer,
    "status_code" integer,
    "success" boolean default false,
    "cost" numeric(10,2) default 0.00,
    "currency" character varying(3) default 'NGN'::character varying,
    "ip_address" inet,
    "user_agent" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."api_usage_logs" enable row level security;


  create table "public"."blockchain_events" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "event_type" character varying(30) not null,
    "event_name" character varying(100) not null,
    "contract_address" character varying(42),
    "transaction_hash" character varying(66),
    "block_number" bigint,
    "network" character varying(20) not null,
    "event_data" jsonb not null,
    "processed" boolean default false,
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."blockchain_events" enable row level security;


  create table "public"."blockchain_payments" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "property_id" uuid,
    "lease_id" uuid,
    "payment_type" character varying(20) not null,
    "amount" numeric(20,8) not null,
    "currency" character varying(10) default 'ETH'::character varying,
    "token_address" character varying(42),
    "from_address" character varying(42) not null,
    "to_address" character varying(42) not null,
    "network" character varying(20) not null,
    "transaction_hash" character varying(66),
    "block_number" bigint,
    "gas_used" numeric(20,8),
    "gas_fee" numeric(20,8),
    "status" character varying(20) default 'pending'::character varying,
    "description" text,
    "metadata" jsonb,
    "due_date" date,
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."blockchain_payments" enable row level security;


  create table "public"."blockchain_transactions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "wallet_address" character varying(42) not null,
    "transaction_hash" character varying(66) not null,
    "from_address" character varying(42) not null,
    "to_address" character varying(42) not null,
    "value" numeric(20,8) not null,
    "gas_price" numeric(20,8),
    "gas_limit" numeric(20,8),
    "gas_used" numeric(20,8),
    "nonce" integer,
    "block_number" bigint,
    "block_hash" character varying(66),
    "transaction_index" integer,
    "network" character varying(20) not null,
    "status" character varying(20) default 'pending'::character varying,
    "transaction_type" character varying(30) default 'transfer'::character varying,
    "contract_address" character varying(42),
    "input_data" text,
    "logs" jsonb,
    "error_message" text,
    "created_at" timestamp with time zone default now(),
    "confirmed_at" timestamp with time zone,
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."blockchain_transactions" enable row level security;


  create table "public"."blockchain_wallets" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "wallet_address" character varying(42) not null,
    "wallet_type" character varying(20) not null,
    "chain_id" integer not null,
    "network" character varying(20) not null,
    "balance" numeric(20,8) default 0.00,
    "is_primary" boolean default false,
    "connected_at" timestamp with time zone default now(),
    "last_used_at" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."blockchain_wallets" enable row level security;


  create table "public"."bookings" (
    "id" uuid not null default gen_random_uuid(),
    "listing_id" uuid not null,
    "guest_id" uuid not null,
    "owner_id" uuid not null,
    "status" text not null default 'pending'::text,
    "checkin_date" date not null,
    "checkout_date" date not null,
    "nights" integer not null,
    "guests_count" integer not null default 1,
    "total_amount" numeric(12,2) not null,
    "payout_amount" numeric(12,2),
    "commission_amount" numeric(12,2),
    "currency" text default 'NGN'::text,
    "payment_reference" text,
    "deposit_amount" numeric(12,2) default 0,
    "cancellation_policy" jsonb,
    "metadata" jsonb default '{}'::jsonb,
    "cancellation_reason" text,
    "cancelled_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."bookings" enable row level security;


  create table "public"."channel_manager_integrations" (
    "id" uuid not null default gen_random_uuid(),
    "listing_id" uuid not null,
    "channel_name" text not null,
    "channel_listing_id" text not null,
    "sync_enabled" boolean default true,
    "sync_direction" text default 'bidirectional'::text,
    "last_sync_at" timestamp with time zone,
    "sync_status" text default 'active'::text,
    "credentials" jsonb,
    "settings" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."channel_manager_integrations" enable row level security;


  create table "public"."channel_sync_logs" (
    "id" uuid not null default gen_random_uuid(),
    "integration_id" uuid not null,
    "sync_type" text not null,
    "direction" text not null,
    "status" text not null,
    "items_synced" integer default 0,
    "items_failed" integer default 0,
    "error_message" text,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."channel_sync_logs" enable row level security;


  create table "public"."contact_submissions" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "email" text not null,
    "phone" text,
    "company" text,
    "subject" text not null,
    "message" text not null,
    "status" text default 'new'::text,
    "responded_at" timestamp with time zone,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."contact_submissions" enable row level security;


  create table "public"."document_classifications" (
    "id" uuid not null default gen_random_uuid(),
    "document_id" uuid not null,
    "predicted_type" text not null,
    "confidence_score" numeric(3,2) not null,
    "alternative_predictions" jsonb default '[]'::jsonb,
    "classification_features" jsonb default '[]'::jsonb,
    "manual_override" text,
    "verified_by" uuid,
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."document_classifications" enable row level security;


  create table "public"."document_extractions" (
    "id" uuid not null default gen_random_uuid(),
    "document_id" uuid not null,
    "extraction_method" text not null default 'ai_vision'::text,
    "extracted_text" text not null,
    "structured_data" jsonb not null default '[]'::jsonb,
    "key_value_pairs" jsonb not null default '{}'::jsonb,
    "tables" jsonb default '[]'::jsonb,
    "signatures" jsonb default '[]'::jsonb,
    "stamps" jsonb default '[]'::jsonb,
    "overall_confidence" numeric(3,2) default 0.0,
    "processing_time_ms" integer default 0,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."document_extractions" enable row level security;


  create table "public"."document_hashes" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "property_id" uuid,
    "document_type" character varying(30) not null,
    "file_hash" character varying(66) not null,
    "ipfs_hash" character varying(100),
    "filename" character varying(255) not null,
    "file_size" bigint,
    "mime_type" character varying(100),
    "metadata" jsonb,
    "verified" boolean default false,
    "verified_by" character varying(42),
    "verified_at" timestamp with time zone,
    "verification_transaction_hash" character varying(66),
    "signature" character varying(200),
    "public_access" boolean default false,
    "authorized_users" text[] default '{}'::text[],
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."document_hashes" enable row level security;


  create table "public"."document_insights" (
    "id" uuid not null default gen_random_uuid(),
    "insight_type" text not null,
    "title" text not null,
    "description" text not null,
    "metrics" jsonb not null default '{}'::jsonb,
    "recommendations" jsonb default '[]'::jsonb,
    "impact_level" text not null default 'medium'::text,
    "date_range" jsonb not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."document_insights" enable row level security;


  create table "public"."document_metadata" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "property_id" uuid,
    "tenant_id" uuid,
    "lease_id" uuid,
    "original_filename" text not null,
    "file_path" text not null,
    "file_size" bigint not null,
    "file_type" text not null,
    "upload_date" timestamp with time zone not null default now(),
    "document_type" text not null default 'other'::text,
    "status" text not null default 'uploaded'::text,
    "processing_stage" text not null default 'upload'::text,
    "confidence_score" numeric(3,2) default 0.0,
    "is_sensitive" boolean default false,
    "retention_period_days" integer default 2555,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."document_metadata" enable row level security;


  create table "public"."document_processing_settings" (
    "user_id" uuid not null,
    "auto_classification_enabled" boolean default true,
    "auto_extraction_enabled" boolean default true,
    "fraud_detection_enabled" boolean default true,
    "notification_preferences" jsonb default '{"fraud_detected": true, "workflow_updates": true, "validation_failed": true, "processing_complete": true}'::jsonb,
    "retention_policies" jsonb default '{"auto_archive_enabled": true, "default_retention_days": 2555, "secure_deletion_enabled": true}'::jsonb,
    "quality_thresholds" jsonb default '{"auto_approve_above": 0.9, "min_confidence_score": 0.5, "require_manual_review_below": 0.7}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."document_processing_settings" enable row level security;


  create table "public"."document_templates" (
    "id" uuid not null default gen_random_uuid(),
    "template_name" text not null,
    "document_type" text not null,
    "template_fields" jsonb not null default '[]'::jsonb,
    "validation_rules" jsonb not null default '[]'::jsonb,
    "auto_fill_mappings" jsonb default '{}'::jsonb,
    "is_active" boolean default true,
    "version" text not null default '1.0'::text,
    "created_by" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."document_templates" enable row level security;


  create table "public"."document_validations" (
    "id" uuid not null default gen_random_uuid(),
    "document_id" uuid not null,
    "validation_rules" jsonb not null default '[]'::jsonb,
    "validation_results" jsonb not null default '[]'::jsonb,
    "overall_status" text not null,
    "compliance_checks" jsonb default '[]'::jsonb,
    "fraud_detection" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."document_validations" enable row level security;


  create table "public"."document_workflows" (
    "id" uuid not null default gen_random_uuid(),
    "document_id" uuid not null,
    "workflow_type" text not null,
    "current_stage" text not null,
    "stages" jsonb not null default '[]'::jsonb,
    "assigned_to" uuid,
    "due_date" timestamp with time zone,
    "priority" text not null default 'medium'::text,
    "status" text not null default 'pending'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."document_workflows" enable row level security;


  create table "public"."equipment_data" (
    "id" uuid not null default gen_random_uuid(),
    "property_id" uuid not null,
    "equipment_type" text not null,
    "brand" text not null,
    "model" text not null,
    "installation_date" date not null,
    "last_service_date" date,
    "warranty_expiry" date,
    "expected_lifespan_years" integer not null default 10,
    "current_condition" text not null,
    "usage_intensity" text not null,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."equipment_data" enable row level security;


  create table "public"."escrow_conditions" (
    "id" uuid not null default gen_random_uuid(),
    "escrow_contract_id" uuid not null,
    "condition_id" character varying(50) not null,
    "description" text not null,
    "condition_type" character varying(20) not null,
    "required" boolean default true,
    "completed" boolean default false,
    "completed_by" character varying(42),
    "completed_at" timestamp with time zone,
    "evidence_hash" character varying(66),
    "evidence_ipfs_hash" character varying(100),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."escrow_conditions" enable row level security;


  create table "public"."escrow_contracts" (
    "id" uuid not null default gen_random_uuid(),
    "property_id" uuid,
    "property_token_id" uuid,
    "contract_address" character varying(42) not null,
    "network" character varying(20) not null,
    "buyer_address" character varying(42) not null,
    "seller_address" character varying(42) not null,
    "escrow_agent_address" character varying(42),
    "amount" numeric(20,8) not null,
    "currency" character varying(10) default 'ETH'::character varying,
    "status" character varying(20) default 'created'::character varying,
    "conditions" jsonb default '[]'::jsonb,
    "milestones" jsonb default '[]'::jsonb,
    "creation_transaction_hash" character varying(66),
    "funding_transaction_hash" character varying(66),
    "release_transaction_hash" character varying(66),
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "funded_at" timestamp with time zone,
    "released_at" timestamp with time zone,
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."escrow_contracts" enable row level security;


  create table "public"."escrow_milestones" (
    "id" uuid not null default gen_random_uuid(),
    "escrow_contract_id" uuid not null,
    "milestone_id" character varying(50) not null,
    "title" character varying(200) not null,
    "description" text,
    "percentage" integer not null,
    "required_conditions" text[] default '{}'::text[],
    "completed" boolean default false,
    "completed_at" timestamp with time zone,
    "transaction_hash" character varying(66),
    "amount_released" numeric(20,8),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."escrow_milestones" enable row level security;


  create table "public"."expenses" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "property_id" uuid,
    "amount" numeric not null,
    "category" text,
    "description" text,
    "created_at" timestamp without time zone default CURRENT_TIMESTAMP
      );



  create table "public"."feature_usage_tracking" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "subscription_id" uuid,
    "feature_key" text not null,
    "usage_count" integer default 1,
    "usage_date" date not null default CURRENT_DATE,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."feature_usage_tracking" enable row level security;


  create table "public"."guest_documents" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "booking_id" uuid,
    "document_type" text not null,
    "document_url" text not null,
    "verified" boolean default false,
    "verified_by" uuid,
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."guest_documents" enable row level security;


  create table "public"."identity_credentials" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "wallet_address" character varying(42) not null,
    "did" character varying(200),
    "credential_type" character varying(30) not null,
    "credential_hash" character varying(66) not null,
    "encrypted_data" text,
    "public_data" jsonb,
    "issuer" character varying(42) not null,
    "signature" character varying(200) not null,
    "issued_at" timestamp with time zone default now(),
    "expires_at" timestamp with time zone,
    "revoked" boolean default false,
    "revoked_at" timestamp with time zone,
    "revocation_reason" text,
    "verification_count" integer default 0,
    "last_verified_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."identity_credentials" enable row level security;


  create table "public"."invoices" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "subscription_id" uuid,
    "invoice_number" text not null,
    "amount_due" integer not null,
    "amount_paid" integer default 0,
    "currency" text not null default 'NGN'::text,
    "status" text not null default 'open'::text,
    "due_date" timestamp with time zone not null,
    "paid_at" timestamp with time zone,
    "line_items" jsonb not null default '[]'::jsonb,
    "tax_amount" integer default 0,
    "discount_amount" integer default 0,
    "stripe_invoice_id" text,
    "paystack_invoice_code" text,
    "pdf_url" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."invoices" enable row level security;


  create table "public"."journal_entries" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "reference" text,
    "description" text,
    "created_at" timestamp without time zone default CURRENT_TIMESTAMP,
    "journal_batch_id" uuid
      );


alter table "public"."journal_entries" enable row level security;


  create table "public"."journal_lines" (
    "id" uuid not null default gen_random_uuid(),
    "journal_entry_id" uuid not null,
    "account_id" uuid not null,
    "debit" numeric default 0,
    "credit" numeric default 0,
    "created_at" timestamp without time zone default CURRENT_TIMESTAMP
      );



  create table "public"."kyc_profiles" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "bvn_verified" boolean default false,
    "nin_verified" boolean default false,
    "phone_verified" boolean default false,
    "bank_account_verified" boolean default false,
    "business_verified" boolean default false,
    "credit_score" integer,
    "verification_level" character varying(20) default 'basic'::character varying,
    "risk_score" integer default 50,
    "risk_level" character varying(10) default 'medium'::character varying,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."kyc_profiles" enable row level security;


  create table "public"."leases" (
    "id" uuid not null default gen_random_uuid(),
    "property_id" uuid,
    "tenant_id" uuid,
    "start_date" date not null,
    "end_date" date not null,
    "monthly_rent" numeric(12,2) not null,
    "security_deposit" numeric(12,2),
    "status" text default 'ACTIVE'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."leases" enable row level security;


  create table "public"."listing_availabilities" (
    "id" uuid not null default gen_random_uuid(),
    "listing_id" uuid not null,
    "start_date" date not null,
    "end_date" date not null,
    "available" boolean default true,
    "source" text default 'manual'::text,
    "source_id" text,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "price_override" numeric(12,2),
    "min_nights" integer default 1,
    "max_nights" integer,
    "checkin_days" integer[],
    "checkout_days" integer[]
      );


alter table "public"."listing_availabilities" enable row level security;


  create table "public"."listing_pricing" (
    "id" uuid not null default gen_random_uuid(),
    "listing_id" uuid not null,
    "date" date not null,
    "price" numeric(12,2) not null,
    "min_nights" integer default 1,
    "max_nights" integer,
    "available" boolean default true,
    "source" text default 'manual'::text,
    "source_id" text,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."listing_pricing" enable row level security;


  create table "public"."listings" (
    "id" uuid not null default gen_random_uuid(),
    "property_id" uuid not null,
    "title" text not null,
    "description" text,
    "capacity" integer not null default 1,
    "amenities" jsonb default '[]'::jsonb,
    "base_price" numeric(12,2) not null,
    "cleaning_fee" numeric(12,2) default 0,
    "security_deposit" numeric(12,2) default 0,
    "timezone" text default 'Africa/Lagos'::text,
    "instant_book" boolean default false,
    "active" boolean default true,
    "cancellation_policy" jsonb default '{"policy_name": "Moderate", "no_refund_within_days": 2, "partial_refund_percent": 50, "full_refund_before_days": 7, "partial_refund_before_days": 2}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."listings" enable row level security;


  create table "public"."maintenance_budgets" (
    "id" uuid not null default gen_random_uuid(),
    "property_id" uuid not null,
    "year" integer not null,
    "quarter" integer,
    "category" text not null,
    "budgeted_amount" numeric(12,2) not null default 0,
    "spent_amount" numeric(12,2) not null default 0,
    "predicted_amount" numeric(12,2) not null default 0,
    "variance" numeric(12,2) generated always as ((spent_amount - budgeted_amount)) stored,
    "last_updated" timestamp with time zone default now()
      );


alter table "public"."maintenance_budgets" enable row level security;


  create table "public"."maintenance_insights" (
    "id" uuid not null default gen_random_uuid(),
    "property_id" uuid not null,
    "insight_type" text not null,
    "title" text not null,
    "description" text not null,
    "impact_score" integer not null,
    "potential_savings" numeric(12,2) not null default 0,
    "implementation_effort" text not null,
    "recommended_timeline" text not null,
    "supporting_data" jsonb default '{}'::jsonb,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."maintenance_insights" enable row level security;


  create table "public"."maintenance_records" (
    "id" uuid not null default gen_random_uuid(),
    "equipment_id" uuid,
    "property_id" uuid not null,
    "maintenance_type" text not null,
    "category" text not null,
    "description" text not null,
    "cost" numeric(12,2) not null default 0,
    "performed_date" date not null,
    "performed_by" text not null,
    "parts_replaced" text[],
    "notes" text,
    "before_photos" text[],
    "after_photos" text[],
    "created_at" timestamp with time zone default now()
      );


alter table "public"."maintenance_records" enable row level security;


  create table "public"."maintenance_requests" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid,
    "property_id" uuid,
    "issue" text,
    "status" text default 'pending'::text,
    "created_at" timestamp without time zone default CURRENT_TIMESTAMP,
    "user_id" uuid,
    "admin_notes" text,
    "category" text not null default 'maintenance'::text
      );


alter table "public"."maintenance_requests" enable row level security;


  create table "public"."maintenance_schedules" (
    "id" uuid not null default gen_random_uuid(),
    "property_id" uuid not null,
    "equipment_id" uuid,
    "category" text not null,
    "task_name" text not null,
    "description" text not null,
    "frequency_type" text not null,
    "frequency_value" integer not null default 1,
    "last_completed" timestamp with time zone,
    "next_due" timestamp with time zone not null,
    "estimated_duration" text not null,
    "estimated_cost" numeric(12,2) not null default 0,
    "assigned_to" text,
    "priority" text not null,
    "seasonal_adjustments" jsonb default '[]'::jsonb,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."maintenance_schedules" enable row level security;


  create table "public"."message_templates" (
    "id" uuid not null default gen_random_uuid(),
    "key" text not null,
    "category" text not null,
    "title" text,
    "description" text,
    "lang" text not null default 'en'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."message_templates" enable row level security;


  create table "public"."nigerian_banks" (
    "id" integer not null default nextval('public.nigerian_banks_id_seq'::regclass),
    "name" character varying(100) not null,
    "slug" character varying(100) not null,
    "code" character varying(10) not null,
    "longcode" character varying(20),
    "gateway" character varying(50),
    "pay_with_bank" boolean default false,
    "active" boolean default true,
    "country" character varying(50) default 'Nigeria'::character varying,
    "currency" character varying(3) default 'NGN'::character varying,
    "type" character varying(20) default 'nuban'::character varying,
    "logo_url" character varying(255),
    "is_deleted" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."nigerian_banks" enable row level security;


  create table "public"."notifications" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "type" text,
    "message" text,
    "status" text default 'sent'::text,
    "created_at" timestamp without time zone default CURRENT_TIMESTAMP
      );


alter table "public"."notifications" enable row level security;


  create table "public"."payment_transactions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "subscription_id" uuid,
    "invoice_id" uuid,
    "amount" integer not null,
    "currency" text not null default 'NGN'::text,
    "payment_method" text not null,
    "status" text not null default 'pending'::text,
    "gateway" text not null,
    "gateway_transaction_id" text not null,
    "gateway_reference" text,
    "failure_reason" text,
    "refund_amount" integer default 0,
    "refunded_at" timestamp with time zone,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."payment_transactions" enable row level security;


  create table "public"."payments" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid not null,
    "organization_id" uuid not null,
    "amount" numeric not null,
    "currency" text default 'NGN'::text,
    "status" text default 'pending'::text,
    "tx_ref" text,
    "flutterwave_tx_id" text,
    "payment_link" text,
    "paid_at" timestamp without time zone,
    "created_at" timestamp without time zone default CURRENT_TIMESTAMP
      );



  create table "public"."predictive_alerts" (
    "id" uuid not null default gen_random_uuid(),
    "property_id" uuid not null,
    "equipment_id" uuid,
    "category" text not null,
    "title" text not null,
    "description" text not null,
    "predicted_failure_date" timestamp with time zone not null,
    "confidence_score" numeric(3,2) not null,
    "risk_level" text not null,
    "priority" text not null,
    "estimated_cost" numeric(12,2) not null default 0,
    "potential_savings" numeric(12,2) not null default 0,
    "recommended_actions" jsonb not null default '[]'::jsonb,
    "factors" jsonb not null default '[]'::jsonb,
    "status" text not null default 'predicted'::text,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "resolved_at" timestamp with time zone
      );


alter table "public"."predictive_alerts" enable row level security;


  create table "public"."predictive_maintenance_settings" (
    "property_id" uuid not null,
    "prediction_horizon_days" integer default 90,
    "confidence_threshold" numeric(3,2) default 0.7,
    "alert_preferences" jsonb default '{"dashboard_alerts": true, "sms_notifications": false, "push_notifications": true, "email_notifications": true}'::jsonb,
    "budget_alert_threshold" numeric(3,2) default 0.8,
    "seasonal_adjustments_enabled" boolean default true,
    "sensor_integration_enabled" boolean default false,
    "auto_scheduling_enabled" boolean default false,
    "preferred_maintenance_window" jsonb default '{"end_time": "17:00", "start_time": "09:00", "preferred_days": ["monday", "tuesday", "wednesday", "thursday", "friday"]}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."predictive_maintenance_settings" enable row level security;


  create table "public"."pricing_experiments" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "status" text not null default 'draft'::text,
    "variants" jsonb not null default '[]'::jsonb,
    "traffic_allocation" integer default 100,
    "success_metrics" jsonb default '[]'::jsonb,
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "results" jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."pricing_experiments" enable row level security;


  create table "public"."pricing_rules" (
    "id" uuid not null default gen_random_uuid(),
    "listing_id" uuid not null,
    "rule_name" text not null,
    "rule_type" text not null,
    "rule_config" jsonb not null,
    "priority" integer default 0,
    "active" boolean default true,
    "start_date" date,
    "end_date" date,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."pricing_rules" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "first_name" text,
    "last_name" text,
    "email" text not null,
    "phone" text,
    "role" text default 'tenant'::text,
    "status" text default 'ACTIVE'::text,
    "avatar_url" text,
    "company" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "paystack_recipient_code" text,
    "paystack_recipient_data" jsonb,
    "onboarding_completed" boolean default false,
    "onboarding_data" jsonb default '{}'::jsonb,
    "recommended_settings" jsonb default '{}'::jsonb,
    "flutterwave_recipient_data" jsonb,
    "onboarding_tour_completed" boolean not null default false,
    "license_number" text,
    "years_of_experience" integer,
    "specializations" text[],
    "working_areas" text[],
    "bio" text,
    "availability_hours" text default 'business_hours'::text,
    "preferred_contact_method" text default 'phone'::text
      );


alter table "public"."profiles" enable row level security;


  create table "public"."properties" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
    "name" text,
    "address" text,
    "city" text,
    "state" text,
    "created_at" timestamp without time zone default CURRENT_TIMESTAMP,
    "is_shortlet" boolean default false,
    "shortlet_details" jsonb,
    "owner_id" uuid,
    "agent_id" uuid,
    "status" text default 'AVAILABLE'::text,
    "latitude" numeric,
    "longitude" numeric,
    "agent_commission_rate" numeric(5,4) default 0.03,
    "tour_url" text,
    "amenities" text[],
    "availability_date" text,
    "lease_terms" text,
    "features" text[]
      );


alter table "public"."properties" enable row level security;


  create table "public"."property_interactions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "property_id" uuid,
    "interaction_type" text not null,
    "duration_seconds" integer,
    "interaction_data" jsonb,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."property_interactions" enable row level security;


  create table "public"."property_maintenance_profiles" (
    "property_id" uuid not null,
    "property_age" integer not null default 0,
    "property_type" text not null,
    "square_footage" integer,
    "occupancy_rate" numeric(3,2) default 1.0,
    "climate_zone" text default 'tropical'::text,
    "maintenance_history_score" integer default 50,
    "equipment_condition_score" integer default 50,
    "risk_factors" text[] default '{}'::text[],
    "maintenance_complexity" text default 'medium'::text,
    "annual_maintenance_cost" numeric(12,2) default 0,
    "predictive_accuracy" integer default 50,
    "last_assessment" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."property_maintenance_profiles" enable row level security;


  create table "public"."property_tokens" (
    "id" uuid not null default gen_random_uuid(),
    "property_id" uuid not null,
    "token_id" character varying(100) not null,
    "contract_address" character varying(42) not null,
    "network" character varying(20) not null,
    "owner_address" character varying(42) not null,
    "metadata_uri" text,
    "metadata" jsonb,
    "price" numeric(20,8),
    "currency" character varying(10) default 'ETH'::character varying,
    "verified" boolean default false,
    "verification_transaction_hash" character varying(66),
    "minted_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."property_tokens" enable row level security;


  create table "public"."property_transfers" (
    "id" uuid not null default gen_random_uuid(),
    "property_token_id" uuid not null,
    "from_address" character varying(42) not null,
    "to_address" character varying(42) not null,
    "price" numeric(20,8),
    "currency" character varying(10) default 'ETH'::character varying,
    "transaction_hash" character varying(66) not null,
    "block_number" bigint,
    "escrow_used" boolean default false,
    "escrow_address" character varying(42),
    "transfer_type" character varying(20) default 'sale'::character varying,
    "created_at" timestamp with time zone default now(),
    "confirmed_at" timestamp with time zone
      );


alter table "public"."property_transfers" enable row level security;


  create table "public"."reconciliation_runs" (
    "id" uuid not null default gen_random_uuid(),
    "period_start" date not null,
    "period_end" date not null,
    "status" text default 'draft'::text,
    "total_revenue" numeric(14,2),
    "total_payouts" numeric(14,2),
    "discrepancy" numeric(14,2),
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "finalized_at" timestamp with time zone,
    "finalized_by" uuid
      );


alter table "public"."reconciliation_runs" enable row level security;


  create table "public"."recurring_availability_patterns" (
    "id" uuid not null default gen_random_uuid(),
    "listing_id" uuid not null,
    "pattern_type" text not null,
    "pattern_config" jsonb not null,
    "start_date" date not null,
    "end_date" date,
    "available" boolean default true,
    "price_override" numeric(12,2),
    "min_nights" integer default 1,
    "max_nights" integer,
    "checkin_days" integer[],
    "checkout_days" integer[],
    "active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."recurring_availability_patterns" enable row level security;


  create table "public"."recurring_payments" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "property_id" uuid,
    "lease_id" uuid,
    "payment_type" character varying(20) not null,
    "amount" numeric(20,8) not null,
    "currency" character varying(10) default 'ETH'::character varying,
    "from_address" character varying(42) not null,
    "to_address" character varying(42) not null,
    "network" character varying(20) not null,
    "frequency" character varying(20) not null,
    "next_payment_date" date not null,
    "auto_execute" boolean default false,
    "contract_address" character varying(42),
    "active" boolean default true,
    "total_payments" integer default 0,
    "successful_payments" integer default 0,
    "failed_payments" integer default 0,
    "last_payment_date" date,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."recurring_payments" enable row level security;


  create table "public"."rental_milestones" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid not null,
    "tenant_name" text not null,
    "property_id" uuid not null,
    "property_name" text not null,
    "milestone_type" text not null,
    "description" text not null,
    "date" date not null,
    "notification_sent" boolean not null default false,
    "status" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."rental_milestones" enable row level security;


  create table "public"."reviews" (
    "id" uuid not null default gen_random_uuid(),
    "booking_id" uuid not null,
    "reviewer_id" uuid not null,
    "reviewee_id" uuid not null,
    "review_type" text not null default 'guest'::text,
    "rating" integer not null,
    "comment" text,
    "response" text,
    "response_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."reviews" enable row level security;


  create table "public"."sensor_readings" (
    "id" uuid not null default gen_random_uuid(),
    "equipment_id" uuid not null,
    "sensor_type" text not null,
    "value" numeric(10,4) not null,
    "unit" text not null,
    "timestamp" timestamp with time zone not null,
    "is_anomaly" boolean default false,
    "threshold_min" numeric(10,4),
    "threshold_max" numeric(10,4),
    "created_at" timestamp with time zone default now()
      );


alter table "public"."sensor_readings" enable row level security;


  create table "public"."smart_recommendations" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "property_id" uuid,
    "overall_score" numeric(3,2) not null,
    "score_breakdown" jsonb not null,
    "confidence_level" text not null,
    "reasons" text[] default '{}'::text[],
    "recommendation_type" text default 'daily_picks'::text,
    "status" text default 'pending'::text,
    "created_at" timestamp with time zone default now(),
    "expires_at" timestamp with time zone
      );


alter table "public"."smart_recommendations" enable row level security;


  create table "public"."subscription_events" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "subscription_id" uuid,
    "event_type" text not null,
    "event_data" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."subscription_events" enable row level security;


  create table "public"."subscription_plans" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "tier" text not null,
    "description" text not null,
    "tagline" text,
    "popular" boolean default false,
    "pricing" jsonb not null default '{}'::jsonb,
    "limits" jsonb not null default '{}'::jsonb,
    "features" jsonb not null default '[]'::jsonb,
    "add_ons" jsonb default '[]'::jsonb,
    "trial_days" integer default 0,
    "setup_fee" integer default 0,
    "is_active" boolean default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."subscription_plans" enable row level security;


  create table "public"."subscriptions" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid,
    "plan" text,
    "status" text default 'active'::text,
    "started_at" timestamp without time zone default CURRENT_TIMESTAMP
      );


alter table "public"."subscriptions" enable row level security;


  create table "public"."tenancies" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid not null,
    "unit_id" uuid not null,
    "start_date" date,
    "end_date" date,
    "rent_amount" numeric,
    "deposit_amount" numeric,
    "status" text default 'active'::text,
    "created_at" timestamp without time zone default CURRENT_TIMESTAMP
      );



  create table "public"."tenant_screenings" (
    "id" uuid not null default gen_random_uuid(),
    "tenant_id" uuid not null,
    "status" public.screening_status not null default 'pending'::public.screening_status,
    "results" jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."tenant_screenings" enable row level security;


  create table "public"."tenants" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "first_name" text not null,
    "last_name" text not null,
    "email" text not null,
    "phone" text,
    "emergency_contact_name" text,
    "emergency_contact_phone" text,
    "employment_status" text,
    "monthly_income" numeric(12,2),
    "credit_score" integer,
    "status" text default 'ACTIVE'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "emergency_contact" jsonb default '{}'::jsonb,
    "employment_info" jsonb default '{}'::jsonb,
    "references" jsonb default '[]'::jsonb,
    "background_check" jsonb default '{}'::jsonb,
    "preferences" jsonb default '{}'::jsonb,
    "application_status" text default 'pending'::text,
    "lease_start_date" date,
    "lease_end_date" date,
    "monthly_rent" numeric(10,2),
    "security_deposit" numeric(10,2),
    "move_in_date" date,
    "move_out_date" date,
    "notes" text,
    "documents" jsonb default '[]'::jsonb
      );


alter table "public"."tenants" enable row level security;


  create table "public"."transactions" (
    "id" uuid not null default gen_random_uuid(),
    "booking_id" uuid,
    "user_id" uuid not null,
    "amount" numeric(12,2) not null,
    "type" text not null,
    "provider" text default 'paystack'::text,
    "provider_ref" text,
    "status" text not null default 'pending'::text,
    "description" text,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."transactions" enable row level security;


  create table "public"."units" (
    "id" uuid not null default gen_random_uuid(),
    "property_id" uuid not null,
    "unit_number" text,
    "rent_amount" numeric not null,
    "status" text default 'vacant'::text,
    "created_at" timestamp without time zone default CURRENT_TIMESTAMP
      );


alter table "public"."units" enable row level security;


  create table "public"."usage_history" (
    "id" uuid not null default gen_random_uuid(),
    "subscription_id" uuid not null,
    "period_start" timestamp with time zone not null,
    "period_end" timestamp with time zone not null,
    "usage_data" jsonb not null default '{}'::jsonb,
    "overage_charges" jsonb default '[]'::jsonb,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."usage_history" enable row level security;


  create table "public"."user_preferences" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "min_budget" bigint not null default 0,
    "max_budget" bigint not null default 10000000,
    "budget_flexibility" text default 'flexible'::text,
    "preferred_areas" text[] default '{}'::text[],
    "max_commute_time" integer,
    "commute_locations" text[] default '{}'::text[],
    "transportation_mode" text,
    "property_types" text[] default '{apartment}'::text[],
    "min_bedrooms" integer not null default 1,
    "max_bedrooms" integer,
    "min_bathrooms" integer not null default 1,
    "furnished_preference" text default 'either'::text,
    "amenity_preferences" jsonb default '{"gym": 3, "pool": 3, "garden": 3, "balcony": 4, "laundry": 5, "parking": 5, "elevator": 4, "internet": 6, "security": 8, "generator": 7, "pet_friendly": 2, "air_conditioning": 6}'::jsonb,
    "noise_tolerance" text default 'moderate'::text,
    "social_preference" text default 'private'::text,
    "work_from_home" boolean default false,
    "has_pets" boolean default false,
    "pet_types" text[] default '{}'::text[],
    "viewed_properties" uuid[] default '{}'::uuid[],
    "saved_properties" uuid[] default '{}'::uuid[],
    "applied_properties" uuid[] default '{}'::uuid[],
    "rejected_properties" uuid[] default '{}'::uuid[],
    "search_patterns" jsonb default '{"decision_speed": "moderate", "search_frequency": 3, "most_active_hours": [9, 10, 11, 18, 19, 20]}'::jsonb,
    "calculated_preferences" jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."user_preferences" enable row level security;


  create table "public"."user_roles" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "role" text not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."user_roles" enable row level security;


  create table "public"."user_subscriptions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "plan_id" uuid not null,
    "tier" text not null,
    "status" text not null default 'active'::text,
    "billing_cycle" text not null default 'monthly'::text,
    "current_period_start" timestamp with time zone not null,
    "current_period_end" timestamp with time zone not null,
    "trial_start" timestamp with time zone,
    "trial_end" timestamp with time zone,
    "cancel_at_period_end" boolean default false,
    "canceled_at" timestamp with time zone,
    "stripe_subscription_id" text,
    "stripe_customer_id" text,
    "paystack_subscription_code" text,
    "paystack_customer_code" text,
    "add_ons" jsonb default '[]'::jsonb,
    "usage_tracking" jsonb not null default '{}'::jsonb,
    "billing_address" jsonb,
    "payment_method" jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."user_subscriptions" enable row level security;


  create table "public"."users" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "full_name" text,
    "email" text,
    "phone" text,
    "role" text,
    "created_at" timestamp without time zone default CURRENT_TIMESTAMP
      );



  create table "public"."vendor_jobs" (
    "id" uuid not null default gen_random_uuid(),
    "vendor_id" uuid,
    "property_id" uuid,
    "maintenance_request_id" uuid,
    "title" text not null,
    "description" text not null,
    "category" text not null,
    "priority" text default 'medium'::text,
    "status" text default 'scheduled'::text,
    "scheduled_date" timestamp with time zone,
    "started_date" timestamp with time zone,
    "completed_date" timestamp with time zone,
    "estimated_cost" numeric(12,2),
    "actual_cost" numeric(12,2),
    "payment_status" text default 'pending'::text,
    "vendor_notes" text,
    "customer_feedback" text,
    "customer_rating" numeric(3,2),
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."vendor_jobs" enable row level security;


  create table "public"."vendors" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "name" text not null,
    "category" text not null,
    "email" text not null,
    "phone" text not null,
    "address" text not null,
    "specialties" text[] default '{}'::text[],
    "service_areas" text[] default '{}'::text[],
    "business_license" text,
    "insurance_provider" text,
    "insurance_policy_number" text,
    "years_of_experience" integer default 0,
    "hourly_rate" numeric(10,2) default 0.00,
    "emergency_rate" numeric(10,2) default 0.00,
    "available_weekdays" boolean default true,
    "available_weekends" boolean default false,
    "available_24_hours" boolean default false,
    "description" text,
    "certifications" text,
    "professional_references" text,
    "rating" numeric(3,2) default 0.00,
    "total_jobs" integer default 0,
    "completed_jobs" integer default 0,
    "response_time" text default 'Not specified'::text,
    "active" boolean default true,
    "verified" boolean default false,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."vendors" enable row level security;


  create table "public"."verification_records" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "verification_type" character varying(20) not null,
    "request_data" jsonb not null,
    "response_data" jsonb,
    "status" character varying(20) default 'pending'::character varying,
    "provider" character varying(20) not null,
    "cost" numeric(10,2) default 0.00,
    "currency" character varying(3) default 'NGN'::character varying,
    "verification_id" character varying(100),
    "confidence_score" numeric(3,2),
    "error_message" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "expires_at" timestamp with time zone
      );


alter table "public"."verification_records" enable row level security;


  create table "public"."viewings" (
    "id" uuid not null default gen_random_uuid(),
    "property_id" uuid,
    "user_id" uuid,
    "scheduled_date" date,
    "scheduled_time" time without time zone,
    "status" text default 'scheduled'::text,
    "created_at" timestamp without time zone default CURRENT_TIMESTAMP
      );



  create table "public"."voice_assistant_analytics" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "date" date not null default CURRENT_DATE,
    "total_commands" integer default 0,
    "successful_commands" integer default 0,
    "failed_commands" integer default 0,
    "average_confidence" numeric(3,2) default 0.0,
    "most_used_intent" character varying(50),
    "total_session_time_minutes" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."voice_assistant_analytics" enable row level security;


  create table "public"."voice_assistant_settings" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "enabled" boolean default true,
    "language" character varying(10) default 'en-NG'::character varying,
    "voice_type" character varying(10) default 'auto'::character varying,
    "speech_rate" numeric(3,1) default 1.0,
    "speech_pitch" numeric(3,1) default 1.0,
    "speech_volume" numeric(3,1) default 0.8,
    "wake_word_enabled" boolean default false,
    "wake_word" character varying(50) default 'Hey DamianixPro'::character varying,
    "continuous_listening" boolean default false,
    "auto_execute_commands" boolean default false,
    "confirmation_required" boolean default true,
    "privacy_mode" boolean default false,
    "noise_cancellation" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."voice_assistant_settings" enable row level security;


  create table "public"."voice_command_history" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "command" text not null,
    "intent" character varying(50) not null,
    "entities" jsonb default '[]'::jsonb,
    "confidence" numeric(3,2) not null,
    "success" boolean not null default false,
    "response" text,
    "action_taken" character varying(100),
    "processing_time_ms" integer,
    "error_message" text,
    "session_id" uuid,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."voice_command_history" enable row level security;


  create table "public"."voice_commands" (
    "id" uuid not null default gen_random_uuid(),
    "session_id" uuid,
    "intent" text,
    "transcript" text,
    "response" text,
    "created_at" timestamp without time zone default CURRENT_TIMESTAMP
      );



  create table "public"."voice_sessions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "channel" text,
    "start_time" timestamp without time zone,
    "end_time" timestamp without time zone
      );



  create table "public"."wallets" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "balance" numeric(14,2) default 0,
    "pending_balance" numeric(14,2) default 0,
    "total_earned" numeric(14,2) default 0,
    "total_paid_out" numeric(14,2) default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."wallets" enable row level security;


  create table "public"."webhook_events" (
    "id" uuid not null default gen_random_uuid(),
    "provider" character varying(20) not null,
    "event_type" character varying(50) not null,
    "event_data" jsonb not null,
    "signature" character varying(255),
    "processed" boolean default false,
    "verification_record_id" uuid,
    "created_at" timestamp with time zone default now(),
    "processed_at" timestamp with time zone
      );


alter table "public"."webhook_events" enable row level security;


  create table "public"."white_label_configs" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "subscription_id" uuid not null,
    "brand_name" text not null,
    "domain" text not null,
    "custom_domain" text,
    "logo_url" text,
    "primary_color" text not null default '#3B82F6'::text,
    "secondary_color" text not null default '#1F2937'::text,
    "custom_css" text,
    "email_templates" jsonb default '[]'::jsonb,
    "features_enabled" jsonb default '[]'::jsonb,
    "api_access" jsonb default '{"enabled": false, "rate_limit": 1000}'::jsonb,
    "is_active" boolean default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."white_label_configs" enable row level security;

alter table "public"."organizations" drop column "updated_at";

alter table "public"."organizations" add column "type" text default 'landlord'::text;

alter table "public"."organizations" alter column "created_at" set default CURRENT_TIMESTAMP;

alter table "public"."organizations" alter column "created_at" set data type timestamp without time zone using "created_at"::timestamp without time zone;

alter table "public"."organizations" alter column "name" drop default;

alter sequence "public"."nigerian_banks_id_seq" owned by "public"."nigerian_banks"."id";

CREATE UNIQUE INDEX accounting_config_key_key ON public.accounting_config USING btree (key);

CREATE UNIQUE INDEX accounting_config_pkey ON public.accounting_config USING btree (id);

CREATE UNIQUE INDEX accounts_pkey ON public.accounts USING btree (id);

CREATE UNIQUE INDEX agents_pkey ON public.agents USING btree (id);

CREATE UNIQUE INDEX agents_user_id_key ON public.agents USING btree (user_id);

CREATE UNIQUE INDEX api_provider_configs_pkey ON public.api_provider_configs USING btree (id);

CREATE UNIQUE INDEX api_provider_configs_provider_service_type_key ON public.api_provider_configs USING btree (provider, service_type);

CREATE UNIQUE INDEX api_usage_logs_pkey ON public.api_usage_logs USING btree (id);

CREATE UNIQUE INDEX blockchain_events_pkey ON public.blockchain_events USING btree (id);

CREATE UNIQUE INDEX blockchain_payments_pkey ON public.blockchain_payments USING btree (id);

CREATE UNIQUE INDEX blockchain_transactions_pkey ON public.blockchain_transactions USING btree (id);

CREATE UNIQUE INDEX blockchain_transactions_transaction_hash_key ON public.blockchain_transactions USING btree (transaction_hash);

CREATE UNIQUE INDEX blockchain_wallets_pkey ON public.blockchain_wallets USING btree (id);

CREATE UNIQUE INDEX blockchain_wallets_user_id_wallet_address_network_key ON public.blockchain_wallets USING btree (user_id, wallet_address, network);

CREATE UNIQUE INDEX bookings_pkey ON public.bookings USING btree (id);

CREATE UNIQUE INDEX channel_manager_integrations_listing_id_channel_name_channe_key ON public.channel_manager_integrations USING btree (listing_id, channel_name, channel_listing_id);

CREATE UNIQUE INDEX channel_manager_integrations_pkey ON public.channel_manager_integrations USING btree (id);

CREATE UNIQUE INDEX channel_sync_logs_pkey ON public.channel_sync_logs USING btree (id);

CREATE UNIQUE INDEX contact_submissions_pkey ON public.contact_submissions USING btree (id);

CREATE UNIQUE INDEX document_classifications_pkey ON public.document_classifications USING btree (id);

CREATE UNIQUE INDEX document_extractions_pkey ON public.document_extractions USING btree (id);

CREATE UNIQUE INDEX document_hashes_file_hash_key ON public.document_hashes USING btree (file_hash);

CREATE UNIQUE INDEX document_hashes_pkey ON public.document_hashes USING btree (id);

CREATE UNIQUE INDEX document_insights_pkey ON public.document_insights USING btree (id);

CREATE UNIQUE INDEX document_metadata_pkey ON public.document_metadata USING btree (id);

CREATE UNIQUE INDEX document_processing_settings_pkey ON public.document_processing_settings USING btree (user_id);

CREATE UNIQUE INDEX document_templates_pkey ON public.document_templates USING btree (id);

CREATE UNIQUE INDEX document_validations_pkey ON public.document_validations USING btree (id);

CREATE UNIQUE INDEX document_workflows_pkey ON public.document_workflows USING btree (id);

CREATE UNIQUE INDEX equipment_data_pkey ON public.equipment_data USING btree (id);

CREATE UNIQUE INDEX escrow_conditions_escrow_contract_id_condition_id_key ON public.escrow_conditions USING btree (escrow_contract_id, condition_id);

CREATE UNIQUE INDEX escrow_conditions_pkey ON public.escrow_conditions USING btree (id);

CREATE UNIQUE INDEX escrow_contracts_contract_address_key ON public.escrow_contracts USING btree (contract_address);

CREATE UNIQUE INDEX escrow_contracts_pkey ON public.escrow_contracts USING btree (id);

CREATE UNIQUE INDEX escrow_milestones_escrow_contract_id_milestone_id_key ON public.escrow_milestones USING btree (escrow_contract_id, milestone_id);

CREATE UNIQUE INDEX escrow_milestones_pkey ON public.escrow_milestones USING btree (id);

CREATE UNIQUE INDEX expenses_pkey ON public.expenses USING btree (id);

CREATE UNIQUE INDEX feature_usage_tracking_pkey ON public.feature_usage_tracking USING btree (id);

CREATE UNIQUE INDEX feature_usage_tracking_user_id_feature_key_usage_date_key ON public.feature_usage_tracking USING btree (user_id, feature_key, usage_date);

CREATE UNIQUE INDEX guest_documents_pkey ON public.guest_documents USING btree (id);

CREATE UNIQUE INDEX identity_credentials_did_key ON public.identity_credentials USING btree (did);

CREATE UNIQUE INDEX identity_credentials_pkey ON public.identity_credentials USING btree (id);

CREATE INDEX idx_agents_rating ON public.agents USING btree (rating DESC);

CREATE INDEX idx_agents_specializations ON public.agents USING gin (specializations);

CREATE INDEX idx_agents_status ON public.agents USING btree (status);

CREATE INDEX idx_agents_user_id ON public.agents USING btree (user_id);

CREATE INDEX idx_agents_working_areas ON public.agents USING gin (working_areas);

CREATE INDEX idx_api_provider_configs_active ON public.api_provider_configs USING btree (is_active);

CREATE INDEX idx_api_provider_configs_provider ON public.api_provider_configs USING btree (provider);

CREATE INDEX idx_api_provider_configs_service_type ON public.api_provider_configs USING btree (service_type);

CREATE INDEX idx_api_usage_logs_created_at ON public.api_usage_logs USING btree (created_at DESC);

CREATE INDEX idx_api_usage_logs_provider ON public.api_usage_logs USING btree (provider);

CREATE INDEX idx_api_usage_logs_user_id ON public.api_usage_logs USING btree (user_id);

CREATE INDEX idx_availabilities_available ON public.listing_availabilities USING btree (available) WHERE (available = true);

CREATE INDEX idx_availabilities_dates ON public.listing_availabilities USING btree (start_date, end_date);

CREATE INDEX idx_availabilities_listing_id ON public.listing_availabilities USING btree (listing_id);

CREATE INDEX idx_blockchain_events_created_at ON public.blockchain_events USING btree (created_at DESC);

CREATE INDEX idx_blockchain_events_processed ON public.blockchain_events USING btree (processed);

CREATE INDEX idx_blockchain_events_type ON public.blockchain_events USING btree (event_type);

CREATE INDEX idx_blockchain_events_user_id ON public.blockchain_events USING btree (user_id);

CREATE INDEX idx_blockchain_payments_property_id ON public.blockchain_payments USING btree (property_id);

CREATE INDEX idx_blockchain_payments_status ON public.blockchain_payments USING btree (status);

CREATE INDEX idx_blockchain_payments_type ON public.blockchain_payments USING btree (payment_type);

CREATE INDEX idx_blockchain_payments_user_id ON public.blockchain_payments USING btree (user_id);

CREATE INDEX idx_blockchain_transactions_created_at ON public.blockchain_transactions USING btree (created_at DESC);

CREATE INDEX idx_blockchain_transactions_hash ON public.blockchain_transactions USING btree (transaction_hash);

CREATE INDEX idx_blockchain_transactions_network ON public.blockchain_transactions USING btree (network);

CREATE INDEX idx_blockchain_transactions_status ON public.blockchain_transactions USING btree (status);

CREATE INDEX idx_blockchain_transactions_user_id ON public.blockchain_transactions USING btree (user_id);

CREATE INDEX idx_blockchain_wallets_address ON public.blockchain_wallets USING btree (wallet_address);

CREATE INDEX idx_blockchain_wallets_network ON public.blockchain_wallets USING btree (network);

CREATE INDEX idx_blockchain_wallets_user_id ON public.blockchain_wallets USING btree (user_id);

CREATE INDEX idx_bookings_dates ON public.bookings USING btree (checkin_date, checkout_date);

CREATE INDEX idx_bookings_guest_id ON public.bookings USING btree (guest_id);

CREATE INDEX idx_bookings_listing_id ON public.bookings USING btree (listing_id);

CREATE INDEX idx_bookings_owner_id ON public.bookings USING btree (owner_id);

CREATE INDEX idx_bookings_status ON public.bookings USING btree (status);

CREATE INDEX idx_channel_integrations_listing ON public.channel_manager_integrations USING btree (listing_id, sync_enabled);

CREATE INDEX idx_channel_sync_logs_integration ON public.channel_sync_logs USING btree (integration_id, created_at);

CREATE INDEX idx_contact_submissions_created_at ON public.contact_submissions USING btree (created_at DESC);

CREATE INDEX idx_contact_submissions_status ON public.contact_submissions USING btree (status);

CREATE INDEX idx_document_classifications_document_id ON public.document_classifications USING btree (document_id);

CREATE INDEX idx_document_classifications_type ON public.document_classifications USING btree (predicted_type);

CREATE INDEX idx_document_extractions_document_id ON public.document_extractions USING btree (document_id);

CREATE INDEX idx_document_extractions_key_value_pairs ON public.document_extractions USING gin (key_value_pairs);

CREATE INDEX idx_document_extractions_method ON public.document_extractions USING btree (extraction_method);

CREATE INDEX idx_document_extractions_structured_data ON public.document_extractions USING gin (structured_data);

CREATE INDEX idx_document_extractions_text_search ON public.document_extractions USING gin (to_tsvector('english'::regconfig, extracted_text));

CREATE INDEX idx_document_hashes_file_hash ON public.document_hashes USING btree (file_hash);

CREATE INDEX idx_document_hashes_property_id ON public.document_hashes USING btree (property_id);

CREATE INDEX idx_document_hashes_user_id ON public.document_hashes USING btree (user_id);

CREATE INDEX idx_document_hashes_verified ON public.document_hashes USING btree (verified);

CREATE INDEX idx_document_metadata_confidence ON public.document_metadata USING btree (confidence_score);

CREATE INDEX idx_document_metadata_document_type ON public.document_metadata USING btree (document_type);

CREATE INDEX idx_document_metadata_filename_search ON public.document_metadata USING gin (to_tsvector('english'::regconfig, original_filename));

CREATE INDEX idx_document_metadata_property_id ON public.document_metadata USING btree (property_id);

CREATE INDEX idx_document_metadata_property_type_date ON public.document_metadata USING btree (property_id, document_type, upload_date DESC);

CREATE INDEX idx_document_metadata_status ON public.document_metadata USING btree (status);

CREATE INDEX idx_document_metadata_upload_date ON public.document_metadata USING btree (upload_date DESC);

CREATE INDEX idx_document_metadata_user_id ON public.document_metadata USING btree (user_id);

CREATE INDEX idx_document_metadata_user_status_date ON public.document_metadata USING btree (user_id, status, upload_date DESC);

CREATE INDEX idx_document_validations_document_id ON public.document_validations USING btree (document_id);

CREATE INDEX idx_document_validations_fraud_detection ON public.document_validations USING gin (fraud_detection);

CREATE INDEX idx_document_validations_status ON public.document_validations USING btree (overall_status);

CREATE INDEX idx_document_workflows_assigned_to ON public.document_workflows USING btree (assigned_to);

CREATE INDEX idx_document_workflows_document_id ON public.document_workflows USING btree (document_id);

CREATE INDEX idx_document_workflows_status ON public.document_workflows USING btree (status);

CREATE INDEX idx_equipment_data_condition ON public.equipment_data USING btree (current_condition);

CREATE INDEX idx_equipment_data_property_id ON public.equipment_data USING btree (property_id);

CREATE INDEX idx_equipment_data_type ON public.equipment_data USING btree (equipment_type);

CREATE INDEX idx_escrow_contracts_buyer ON public.escrow_contracts USING btree (buyer_address);

CREATE INDEX idx_escrow_contracts_property_id ON public.escrow_contracts USING btree (property_id);

CREATE INDEX idx_escrow_contracts_seller ON public.escrow_contracts USING btree (seller_address);

CREATE INDEX idx_escrow_contracts_status ON public.escrow_contracts USING btree (status);

CREATE INDEX idx_feature_usage_feature_date ON public.feature_usage_tracking USING btree (feature_key, usage_date DESC);

CREATE INDEX idx_feature_usage_user_date ON public.feature_usage_tracking USING btree (user_id, usage_date DESC);

CREATE INDEX idx_guest_documents_booking_id ON public.guest_documents USING btree (booking_id);

CREATE INDEX idx_identity_credentials_type ON public.identity_credentials USING btree (credential_type);

CREATE INDEX idx_identity_credentials_user_id ON public.identity_credentials USING btree (user_id);

CREATE INDEX idx_identity_credentials_wallet ON public.identity_credentials USING btree (wallet_address);

CREATE INDEX idx_invoices_due_date ON public.invoices USING btree (due_date);

CREATE INDEX idx_invoices_number ON public.invoices USING btree (invoice_number);

CREATE INDEX idx_invoices_status ON public.invoices USING btree (status);

CREATE INDEX idx_invoices_subscription_id ON public.invoices USING btree (subscription_id);

CREATE INDEX idx_invoices_user_id ON public.invoices USING btree (user_id);

CREATE INDEX idx_journal_entries_batch ON public.journal_entries USING btree (journal_batch_id);

CREATE INDEX idx_journal_entries_org ON public.journal_entries USING btree (organization_id);

CREATE INDEX idx_kyc_profiles_risk_level ON public.kyc_profiles USING btree (risk_level);

CREATE INDEX idx_kyc_profiles_user_id ON public.kyc_profiles USING btree (user_id);

CREATE INDEX idx_kyc_profiles_verification_level ON public.kyc_profiles USING btree (verification_level);

CREATE INDEX idx_listing_pricing_date ON public.listing_pricing USING btree (date);

CREATE INDEX idx_listing_pricing_listing_date ON public.listing_pricing USING btree (listing_id, date);

CREATE INDEX idx_listings_active ON public.listings USING btree (active) WHERE (active = true);

CREATE INDEX idx_listings_property_id ON public.listings USING btree (property_id);

CREATE INDEX idx_maintenance_budgets_property_year ON public.maintenance_budgets USING btree (property_id, year);

CREATE INDEX idx_maintenance_records_date ON public.maintenance_records USING btree (performed_date);

CREATE INDEX idx_maintenance_records_equipment_id ON public.maintenance_records USING btree (equipment_id);

CREATE INDEX idx_maintenance_records_property_id ON public.maintenance_records USING btree (property_id);

CREATE INDEX idx_maintenance_records_type ON public.maintenance_records USING btree (maintenance_type);

CREATE INDEX idx_maintenance_schedules_active ON public.maintenance_schedules USING btree (is_active);

CREATE INDEX idx_maintenance_schedules_next_due ON public.maintenance_schedules USING btree (next_due);

CREATE INDEX idx_maintenance_schedules_property_id ON public.maintenance_schedules USING btree (property_id);

CREATE INDEX idx_nigerian_banks_active ON public.nigerian_banks USING btree (active);

CREATE INDEX idx_nigerian_banks_code ON public.nigerian_banks USING btree (code);

CREATE INDEX idx_nigerian_banks_name ON public.nigerian_banks USING btree (name);

CREATE INDEX idx_payment_transactions_gateway_id ON public.payment_transactions USING btree (gateway_transaction_id);

CREATE INDEX idx_payment_transactions_invoice_id ON public.payment_transactions USING btree (invoice_id);

CREATE INDEX idx_payment_transactions_status ON public.payment_transactions USING btree (status);

CREATE INDEX idx_payment_transactions_subscription_id ON public.payment_transactions USING btree (subscription_id);

CREATE INDEX idx_payment_transactions_user_id ON public.payment_transactions USING btree (user_id);

CREATE INDEX idx_payments_org ON public.payments USING btree (organization_id);

CREATE INDEX idx_payments_tenant ON public.payments USING btree (tenant_id);

CREATE INDEX idx_predictive_alerts_equipment_id ON public.predictive_alerts USING btree (equipment_id);

CREATE INDEX idx_predictive_alerts_failure_date ON public.predictive_alerts USING btree (predicted_failure_date);

CREATE INDEX idx_predictive_alerts_priority ON public.predictive_alerts USING btree (priority);

CREATE INDEX idx_predictive_alerts_property_id ON public.predictive_alerts USING btree (property_id);

CREATE INDEX idx_predictive_alerts_status ON public.predictive_alerts USING btree (status);

CREATE INDEX idx_pricing_rules_listing ON public.pricing_rules USING btree (listing_id, active);

CREATE INDEX idx_profiles_flutterwave_recipient ON public.profiles USING btree (flutterwave_recipient_data) WHERE (flutterwave_recipient_data IS NOT NULL);

CREATE INDEX idx_profiles_paystack_recipient ON public.profiles USING btree (paystack_recipient_code) WHERE (paystack_recipient_code IS NOT NULL);

CREATE INDEX idx_properties_org ON public.properties USING btree (organization_id);

CREATE INDEX idx_property_interactions_created_at ON public.property_interactions USING btree (created_at DESC);

CREATE INDEX idx_property_interactions_property_id ON public.property_interactions USING btree (property_id);

CREATE INDEX idx_property_interactions_type ON public.property_interactions USING btree (interaction_type);

CREATE INDEX idx_property_interactions_user_id ON public.property_interactions USING btree (user_id);

CREATE INDEX idx_property_tokens_network ON public.property_tokens USING btree (network);

CREATE INDEX idx_property_tokens_owner ON public.property_tokens USING btree (owner_address);

CREATE INDEX idx_property_tokens_property_id ON public.property_tokens USING btree (property_id);

CREATE INDEX idx_property_tokens_token_id ON public.property_tokens USING btree (token_id);

CREATE INDEX idx_recurring_patterns_listing ON public.recurring_availability_patterns USING btree (listing_id, active);

CREATE INDEX idx_reviews_booking_id ON public.reviews USING btree (booking_id);

CREATE INDEX idx_sensor_readings_anomaly ON public.sensor_readings USING btree (is_anomaly);

CREATE INDEX idx_sensor_readings_equipment_id ON public.sensor_readings USING btree (equipment_id);

CREATE INDEX idx_sensor_readings_timestamp ON public.sensor_readings USING btree ("timestamp");

CREATE INDEX idx_smart_recommendations_created_at ON public.smart_recommendations USING btree (created_at DESC);

CREATE INDEX idx_smart_recommendations_property_id ON public.smart_recommendations USING btree (property_id);

CREATE INDEX idx_smart_recommendations_score ON public.smart_recommendations USING btree (overall_score DESC);

CREATE INDEX idx_smart_recommendations_status ON public.smart_recommendations USING btree (status);

CREATE INDEX idx_smart_recommendations_type ON public.smart_recommendations USING btree (recommendation_type);

CREATE INDEX idx_smart_recommendations_user_id ON public.smart_recommendations USING btree (user_id);

CREATE INDEX idx_subscription_events_created_at ON public.subscription_events USING btree (created_at DESC);

CREATE INDEX idx_subscription_events_subscription_id ON public.subscription_events USING btree (subscription_id);

CREATE INDEX idx_subscription_events_type ON public.subscription_events USING btree (event_type);

CREATE INDEX idx_subscription_events_user_id ON public.subscription_events USING btree (user_id);

CREATE INDEX idx_subscription_plans_active ON public.subscription_plans USING btree (is_active);

CREATE INDEX idx_subscription_plans_tier ON public.subscription_plans USING btree (tier);

CREATE INDEX idx_tenants_application_status ON public.tenants USING btree (application_status);

CREATE INDEX idx_tenants_lease_dates ON public.tenants USING btree (lease_start_date, lease_end_date);

CREATE INDEX idx_tenants_move_dates ON public.tenants USING btree (move_in_date, move_out_date);

CREATE INDEX idx_tenants_user_id ON public.tenants USING btree (user_id);

CREATE INDEX idx_transactions_booking_id ON public.transactions USING btree (booking_id);

CREATE INDEX idx_transactions_status ON public.transactions USING btree (status);

CREATE INDEX idx_transactions_user_id ON public.transactions USING btree (user_id);

CREATE INDEX idx_units_property_id ON public.units USING btree (property_id);

CREATE INDEX idx_units_status ON public.units USING btree (status);

CREATE INDEX idx_usage_history_period ON public.usage_history USING btree (period_start, period_end);

CREATE INDEX idx_usage_history_subscription_id ON public.usage_history USING btree (subscription_id);

CREATE INDEX idx_user_preferences_user_id ON public.user_preferences USING btree (user_id);

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);

CREATE UNIQUE INDEX idx_user_subscriptions_one_active_per_user ON public.user_subscriptions USING btree (user_id) WHERE (status = 'active'::text);

CREATE INDEX idx_user_subscriptions_period_end ON public.user_subscriptions USING btree (current_period_end);

CREATE INDEX idx_user_subscriptions_plan_id ON public.user_subscriptions USING btree (plan_id);

CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions USING btree (status);

CREATE INDEX idx_user_subscriptions_tier ON public.user_subscriptions USING btree (tier);

CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions USING btree (user_id);

CREATE INDEX idx_users_org ON public.users USING btree (organization_id);

CREATE INDEX idx_verification_records_created_at ON public.verification_records USING btree (created_at DESC);

CREATE INDEX idx_verification_records_provider ON public.verification_records USING btree (provider);

CREATE INDEX idx_verification_records_status ON public.verification_records USING btree (status);

CREATE INDEX idx_verification_records_type ON public.verification_records USING btree (verification_type);

CREATE INDEX idx_verification_records_user_id ON public.verification_records USING btree (user_id);

CREATE INDEX idx_voice_assistant_analytics_user_date ON public.voice_assistant_analytics USING btree (user_id, date);

CREATE INDEX idx_voice_assistant_settings_user_id ON public.voice_assistant_settings USING btree (user_id);

CREATE INDEX idx_voice_command_history_created_at ON public.voice_command_history USING btree (created_at DESC);

CREATE INDEX idx_voice_command_history_intent ON public.voice_command_history USING btree (intent);

CREATE INDEX idx_voice_command_history_session_id ON public.voice_command_history USING btree (session_id);

CREATE INDEX idx_voice_command_history_user_id ON public.voice_command_history USING btree (user_id);

CREATE INDEX idx_voice_sessions_user ON public.voice_sessions USING btree (user_id);

CREATE INDEX idx_wallets_user_id ON public.wallets USING btree (user_id);

CREATE INDEX idx_webhook_events_created_at ON public.webhook_events USING btree (created_at DESC);

CREATE INDEX idx_webhook_events_processed ON public.webhook_events USING btree (processed);

CREATE INDEX idx_webhook_events_provider ON public.webhook_events USING btree (provider);

CREATE INDEX idx_white_label_configs_domain ON public.white_label_configs USING btree (domain);

CREATE INDEX idx_white_label_configs_user_id ON public.white_label_configs USING btree (user_id);

CREATE UNIQUE INDEX invoices_invoice_number_key ON public.invoices USING btree (invoice_number);

CREATE UNIQUE INDEX invoices_pkey ON public.invoices USING btree (id);

CREATE UNIQUE INDEX journal_entries_pkey ON public.journal_entries USING btree (id);

CREATE UNIQUE INDEX journal_lines_pkey ON public.journal_lines USING btree (id);

CREATE UNIQUE INDEX kyc_profiles_pkey ON public.kyc_profiles USING btree (id);

CREATE UNIQUE INDEX kyc_profiles_user_id_key ON public.kyc_profiles USING btree (user_id);

CREATE UNIQUE INDEX leases_pkey ON public.leases USING btree (id);

CREATE UNIQUE INDEX listing_availabilities_pkey ON public.listing_availabilities USING btree (id);

CREATE UNIQUE INDEX listing_pricing_listing_id_date_key ON public.listing_pricing USING btree (listing_id, date);

CREATE UNIQUE INDEX listing_pricing_pkey ON public.listing_pricing USING btree (id);

CREATE UNIQUE INDEX listings_pkey ON public.listings USING btree (id);

CREATE UNIQUE INDEX maintenance_budgets_pkey ON public.maintenance_budgets USING btree (id);

CREATE UNIQUE INDEX maintenance_budgets_property_id_year_quarter_category_key ON public.maintenance_budgets USING btree (property_id, year, quarter, category);

CREATE UNIQUE INDEX maintenance_insights_pkey ON public.maintenance_insights USING btree (id);

CREATE UNIQUE INDEX maintenance_records_pkey ON public.maintenance_records USING btree (id);

CREATE UNIQUE INDEX maintenance_requests_pkey ON public.maintenance_requests USING btree (id);

CREATE UNIQUE INDEX maintenance_schedules_pkey ON public.maintenance_schedules USING btree (id);

CREATE UNIQUE INDEX message_templates_key_key ON public.message_templates USING btree (key);

CREATE UNIQUE INDEX message_templates_pkey ON public.message_templates USING btree (id);

CREATE UNIQUE INDEX nigerian_banks_code_key ON public.nigerian_banks USING btree (code);

CREATE UNIQUE INDEX nigerian_banks_pkey ON public.nigerian_banks USING btree (id);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE UNIQUE INDEX payment_transactions_pkey ON public.payment_transactions USING btree (id);

CREATE UNIQUE INDEX payments_pkey ON public.payments USING btree (id);

CREATE UNIQUE INDEX payments_tx_ref_key ON public.payments USING btree (tx_ref);

CREATE UNIQUE INDEX predictive_alerts_pkey ON public.predictive_alerts USING btree (id);

CREATE UNIQUE INDEX predictive_maintenance_settings_pkey ON public.predictive_maintenance_settings USING btree (property_id);

CREATE UNIQUE INDEX pricing_experiments_pkey ON public.pricing_experiments USING btree (id);

CREATE UNIQUE INDEX pricing_rules_pkey ON public.pricing_rules USING btree (id);

CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX properties_pkey ON public.properties USING btree (id);

CREATE UNIQUE INDEX property_interactions_pkey ON public.property_interactions USING btree (id);

CREATE UNIQUE INDEX property_maintenance_profiles_pkey ON public.property_maintenance_profiles USING btree (property_id);

CREATE UNIQUE INDEX property_tokens_pkey ON public.property_tokens USING btree (id);

CREATE UNIQUE INDEX property_tokens_token_id_contract_address_network_key ON public.property_tokens USING btree (token_id, contract_address, network);

CREATE UNIQUE INDEX property_transfers_pkey ON public.property_transfers USING btree (id);

CREATE UNIQUE INDEX reconciliation_runs_pkey ON public.reconciliation_runs USING btree (id);

CREATE UNIQUE INDEX recurring_availability_patterns_pkey ON public.recurring_availability_patterns USING btree (id);

CREATE UNIQUE INDEX recurring_payments_pkey ON public.recurring_payments USING btree (id);

CREATE UNIQUE INDEX rental_milestones_pkey ON public.rental_milestones USING btree (id);

CREATE UNIQUE INDEX reviews_booking_id_key ON public.reviews USING btree (booking_id);

CREATE UNIQUE INDEX reviews_pkey ON public.reviews USING btree (id);

CREATE UNIQUE INDEX sensor_readings_pkey ON public.sensor_readings USING btree (id);

CREATE UNIQUE INDEX smart_recommendations_pkey ON public.smart_recommendations USING btree (id);

CREATE UNIQUE INDEX smart_recommendations_user_id_property_id_recommendation_ty_key ON public.smart_recommendations USING btree (user_id, property_id, recommendation_type);

CREATE UNIQUE INDEX subscription_events_pkey ON public.subscription_events USING btree (id);

CREATE UNIQUE INDEX subscription_plans_pkey ON public.subscription_plans USING btree (id);

CREATE UNIQUE INDEX subscription_plans_tier_key ON public.subscription_plans USING btree (tier);

CREATE UNIQUE INDEX subscriptions_pkey ON public.subscriptions USING btree (id);

CREATE UNIQUE INDEX tenancies_pkey ON public.tenancies USING btree (id);

CREATE UNIQUE INDEX tenant_screenings_pkey ON public.tenant_screenings USING btree (id);

CREATE UNIQUE INDEX tenants_pkey ON public.tenants USING btree (id);

CREATE UNIQUE INDEX tenants_user_id_unique ON public.tenants USING btree (user_id);

CREATE UNIQUE INDEX transactions_pkey ON public.transactions USING btree (id);

CREATE UNIQUE INDEX units_pkey ON public.units USING btree (id);

CREATE UNIQUE INDEX usage_history_pkey ON public.usage_history USING btree (id);

CREATE UNIQUE INDEX user_preferences_pkey ON public.user_preferences USING btree (id);

CREATE UNIQUE INDEX user_preferences_user_id_key ON public.user_preferences USING btree (user_id);

CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (id);

CREATE UNIQUE INDEX user_roles_user_id_key ON public.user_roles USING btree (user_id);

CREATE UNIQUE INDEX user_subscriptions_pkey ON public.user_subscriptions USING btree (id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

CREATE UNIQUE INDEX vendor_jobs_pkey ON public.vendor_jobs USING btree (id);

CREATE INDEX vendor_jobs_property_id_idx ON public.vendor_jobs USING btree (property_id);

CREATE INDEX vendor_jobs_scheduled_date_idx ON public.vendor_jobs USING btree (scheduled_date);

CREATE INDEX vendor_jobs_status_idx ON public.vendor_jobs USING btree (status);

CREATE INDEX vendor_jobs_vendor_id_idx ON public.vendor_jobs USING btree (vendor_id);

CREATE INDEX vendors_active_idx ON public.vendors USING btree (active);

CREATE INDEX vendors_category_idx ON public.vendors USING btree (category);

CREATE UNIQUE INDEX vendors_email_unique ON public.vendors USING btree (email);

CREATE UNIQUE INDEX vendors_pkey ON public.vendors USING btree (id);

CREATE INDEX vendors_rating_idx ON public.vendors USING btree (rating DESC);

CREATE INDEX vendors_service_areas_idx ON public.vendors USING gin (service_areas);

CREATE INDEX vendors_specialties_idx ON public.vendors USING gin (specialties);

CREATE INDEX vendors_user_id_idx ON public.vendors USING btree (user_id);

CREATE UNIQUE INDEX vendors_user_id_unique ON public.vendors USING btree (user_id);

CREATE UNIQUE INDEX verification_records_pkey ON public.verification_records USING btree (id);

CREATE UNIQUE INDEX viewings_pkey ON public.viewings USING btree (id);

CREATE UNIQUE INDEX voice_assistant_analytics_pkey ON public.voice_assistant_analytics USING btree (id);

CREATE UNIQUE INDEX voice_assistant_analytics_user_id_date_key ON public.voice_assistant_analytics USING btree (user_id, date);

CREATE UNIQUE INDEX voice_assistant_settings_pkey ON public.voice_assistant_settings USING btree (id);

CREATE UNIQUE INDEX voice_assistant_settings_user_id_key ON public.voice_assistant_settings USING btree (user_id);

CREATE UNIQUE INDEX voice_command_history_pkey ON public.voice_command_history USING btree (id);

CREATE UNIQUE INDEX voice_commands_pkey ON public.voice_commands USING btree (id);

CREATE UNIQUE INDEX voice_sessions_pkey ON public.voice_sessions USING btree (id);

CREATE UNIQUE INDEX wallets_pkey ON public.wallets USING btree (id);

CREATE UNIQUE INDEX wallets_user_id_key ON public.wallets USING btree (user_id);

CREATE UNIQUE INDEX webhook_events_pkey ON public.webhook_events USING btree (id);

CREATE UNIQUE INDEX white_label_configs_pkey ON public.white_label_configs USING btree (id);

CREATE UNIQUE INDEX white_label_configs_user_id_domain_key ON public.white_label_configs USING btree (user_id, domain);

alter table "public"."accounting_config" add constraint "accounting_config_pkey" PRIMARY KEY using index "accounting_config_pkey";

alter table "public"."accounts" add constraint "accounts_pkey" PRIMARY KEY using index "accounts_pkey";

alter table "public"."agents" add constraint "agents_pkey" PRIMARY KEY using index "agents_pkey";

alter table "public"."api_provider_configs" add constraint "api_provider_configs_pkey" PRIMARY KEY using index "api_provider_configs_pkey";

alter table "public"."api_usage_logs" add constraint "api_usage_logs_pkey" PRIMARY KEY using index "api_usage_logs_pkey";

alter table "public"."blockchain_events" add constraint "blockchain_events_pkey" PRIMARY KEY using index "blockchain_events_pkey";

alter table "public"."blockchain_payments" add constraint "blockchain_payments_pkey" PRIMARY KEY using index "blockchain_payments_pkey";

alter table "public"."blockchain_transactions" add constraint "blockchain_transactions_pkey" PRIMARY KEY using index "blockchain_transactions_pkey";

alter table "public"."blockchain_wallets" add constraint "blockchain_wallets_pkey" PRIMARY KEY using index "blockchain_wallets_pkey";

alter table "public"."bookings" add constraint "bookings_pkey" PRIMARY KEY using index "bookings_pkey";

alter table "public"."channel_manager_integrations" add constraint "channel_manager_integrations_pkey" PRIMARY KEY using index "channel_manager_integrations_pkey";

alter table "public"."channel_sync_logs" add constraint "channel_sync_logs_pkey" PRIMARY KEY using index "channel_sync_logs_pkey";

alter table "public"."contact_submissions" add constraint "contact_submissions_pkey" PRIMARY KEY using index "contact_submissions_pkey";

alter table "public"."document_classifications" add constraint "document_classifications_pkey" PRIMARY KEY using index "document_classifications_pkey";

alter table "public"."document_extractions" add constraint "document_extractions_pkey" PRIMARY KEY using index "document_extractions_pkey";

alter table "public"."document_hashes" add constraint "document_hashes_pkey" PRIMARY KEY using index "document_hashes_pkey";

alter table "public"."document_insights" add constraint "document_insights_pkey" PRIMARY KEY using index "document_insights_pkey";

alter table "public"."document_metadata" add constraint "document_metadata_pkey" PRIMARY KEY using index "document_metadata_pkey";

alter table "public"."document_processing_settings" add constraint "document_processing_settings_pkey" PRIMARY KEY using index "document_processing_settings_pkey";

alter table "public"."document_templates" add constraint "document_templates_pkey" PRIMARY KEY using index "document_templates_pkey";

alter table "public"."document_validations" add constraint "document_validations_pkey" PRIMARY KEY using index "document_validations_pkey";

alter table "public"."document_workflows" add constraint "document_workflows_pkey" PRIMARY KEY using index "document_workflows_pkey";

alter table "public"."equipment_data" add constraint "equipment_data_pkey" PRIMARY KEY using index "equipment_data_pkey";

alter table "public"."escrow_conditions" add constraint "escrow_conditions_pkey" PRIMARY KEY using index "escrow_conditions_pkey";

alter table "public"."escrow_contracts" add constraint "escrow_contracts_pkey" PRIMARY KEY using index "escrow_contracts_pkey";

alter table "public"."escrow_milestones" add constraint "escrow_milestones_pkey" PRIMARY KEY using index "escrow_milestones_pkey";

alter table "public"."expenses" add constraint "expenses_pkey" PRIMARY KEY using index "expenses_pkey";

alter table "public"."feature_usage_tracking" add constraint "feature_usage_tracking_pkey" PRIMARY KEY using index "feature_usage_tracking_pkey";

alter table "public"."guest_documents" add constraint "guest_documents_pkey" PRIMARY KEY using index "guest_documents_pkey";

alter table "public"."identity_credentials" add constraint "identity_credentials_pkey" PRIMARY KEY using index "identity_credentials_pkey";

alter table "public"."invoices" add constraint "invoices_pkey" PRIMARY KEY using index "invoices_pkey";

alter table "public"."journal_entries" add constraint "journal_entries_pkey" PRIMARY KEY using index "journal_entries_pkey";

alter table "public"."journal_lines" add constraint "journal_lines_pkey" PRIMARY KEY using index "journal_lines_pkey";

alter table "public"."kyc_profiles" add constraint "kyc_profiles_pkey" PRIMARY KEY using index "kyc_profiles_pkey";

alter table "public"."leases" add constraint "leases_pkey" PRIMARY KEY using index "leases_pkey";

alter table "public"."listing_availabilities" add constraint "listing_availabilities_pkey" PRIMARY KEY using index "listing_availabilities_pkey";

alter table "public"."listing_pricing" add constraint "listing_pricing_pkey" PRIMARY KEY using index "listing_pricing_pkey";

alter table "public"."listings" add constraint "listings_pkey" PRIMARY KEY using index "listings_pkey";

alter table "public"."maintenance_budgets" add constraint "maintenance_budgets_pkey" PRIMARY KEY using index "maintenance_budgets_pkey";

alter table "public"."maintenance_insights" add constraint "maintenance_insights_pkey" PRIMARY KEY using index "maintenance_insights_pkey";

alter table "public"."maintenance_records" add constraint "maintenance_records_pkey" PRIMARY KEY using index "maintenance_records_pkey";

alter table "public"."maintenance_requests" add constraint "maintenance_requests_pkey" PRIMARY KEY using index "maintenance_requests_pkey";

alter table "public"."maintenance_schedules" add constraint "maintenance_schedules_pkey" PRIMARY KEY using index "maintenance_schedules_pkey";

alter table "public"."message_templates" add constraint "message_templates_pkey" PRIMARY KEY using index "message_templates_pkey";

alter table "public"."nigerian_banks" add constraint "nigerian_banks_pkey" PRIMARY KEY using index "nigerian_banks_pkey";

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."payment_transactions" add constraint "payment_transactions_pkey" PRIMARY KEY using index "payment_transactions_pkey";

alter table "public"."payments" add constraint "payments_pkey" PRIMARY KEY using index "payments_pkey";

alter table "public"."predictive_alerts" add constraint "predictive_alerts_pkey" PRIMARY KEY using index "predictive_alerts_pkey";

alter table "public"."predictive_maintenance_settings" add constraint "predictive_maintenance_settings_pkey" PRIMARY KEY using index "predictive_maintenance_settings_pkey";

alter table "public"."pricing_experiments" add constraint "pricing_experiments_pkey" PRIMARY KEY using index "pricing_experiments_pkey";

alter table "public"."pricing_rules" add constraint "pricing_rules_pkey" PRIMARY KEY using index "pricing_rules_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."properties" add constraint "properties_pkey" PRIMARY KEY using index "properties_pkey";

alter table "public"."property_interactions" add constraint "property_interactions_pkey" PRIMARY KEY using index "property_interactions_pkey";

alter table "public"."property_maintenance_profiles" add constraint "property_maintenance_profiles_pkey" PRIMARY KEY using index "property_maintenance_profiles_pkey";

alter table "public"."property_tokens" add constraint "property_tokens_pkey" PRIMARY KEY using index "property_tokens_pkey";

alter table "public"."property_transfers" add constraint "property_transfers_pkey" PRIMARY KEY using index "property_transfers_pkey";

alter table "public"."reconciliation_runs" add constraint "reconciliation_runs_pkey" PRIMARY KEY using index "reconciliation_runs_pkey";

alter table "public"."recurring_availability_patterns" add constraint "recurring_availability_patterns_pkey" PRIMARY KEY using index "recurring_availability_patterns_pkey";

alter table "public"."recurring_payments" add constraint "recurring_payments_pkey" PRIMARY KEY using index "recurring_payments_pkey";

alter table "public"."rental_milestones" add constraint "rental_milestones_pkey" PRIMARY KEY using index "rental_milestones_pkey";

alter table "public"."reviews" add constraint "reviews_pkey" PRIMARY KEY using index "reviews_pkey";

alter table "public"."sensor_readings" add constraint "sensor_readings_pkey" PRIMARY KEY using index "sensor_readings_pkey";

alter table "public"."smart_recommendations" add constraint "smart_recommendations_pkey" PRIMARY KEY using index "smart_recommendations_pkey";

alter table "public"."subscription_events" add constraint "subscription_events_pkey" PRIMARY KEY using index "subscription_events_pkey";

alter table "public"."subscription_plans" add constraint "subscription_plans_pkey" PRIMARY KEY using index "subscription_plans_pkey";

alter table "public"."subscriptions" add constraint "subscriptions_pkey" PRIMARY KEY using index "subscriptions_pkey";

alter table "public"."tenancies" add constraint "tenancies_pkey" PRIMARY KEY using index "tenancies_pkey";

alter table "public"."tenant_screenings" add constraint "tenant_screenings_pkey" PRIMARY KEY using index "tenant_screenings_pkey";

alter table "public"."tenants" add constraint "tenants_pkey" PRIMARY KEY using index "tenants_pkey";

alter table "public"."transactions" add constraint "transactions_pkey" PRIMARY KEY using index "transactions_pkey";

alter table "public"."units" add constraint "units_pkey" PRIMARY KEY using index "units_pkey";

alter table "public"."usage_history" add constraint "usage_history_pkey" PRIMARY KEY using index "usage_history_pkey";

alter table "public"."user_preferences" add constraint "user_preferences_pkey" PRIMARY KEY using index "user_preferences_pkey";

alter table "public"."user_roles" add constraint "user_roles_pkey" PRIMARY KEY using index "user_roles_pkey";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_pkey" PRIMARY KEY using index "user_subscriptions_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."vendor_jobs" add constraint "vendor_jobs_pkey" PRIMARY KEY using index "vendor_jobs_pkey";

alter table "public"."vendors" add constraint "vendors_pkey" PRIMARY KEY using index "vendors_pkey";

alter table "public"."verification_records" add constraint "verification_records_pkey" PRIMARY KEY using index "verification_records_pkey";

alter table "public"."viewings" add constraint "viewings_pkey" PRIMARY KEY using index "viewings_pkey";

alter table "public"."voice_assistant_analytics" add constraint "voice_assistant_analytics_pkey" PRIMARY KEY using index "voice_assistant_analytics_pkey";

alter table "public"."voice_assistant_settings" add constraint "voice_assistant_settings_pkey" PRIMARY KEY using index "voice_assistant_settings_pkey";

alter table "public"."voice_command_history" add constraint "voice_command_history_pkey" PRIMARY KEY using index "voice_command_history_pkey";

alter table "public"."voice_commands" add constraint "voice_commands_pkey" PRIMARY KEY using index "voice_commands_pkey";

alter table "public"."voice_sessions" add constraint "voice_sessions_pkey" PRIMARY KEY using index "voice_sessions_pkey";

alter table "public"."wallets" add constraint "wallets_pkey" PRIMARY KEY using index "wallets_pkey";

alter table "public"."webhook_events" add constraint "webhook_events_pkey" PRIMARY KEY using index "webhook_events_pkey";

alter table "public"."white_label_configs" add constraint "white_label_configs_pkey" PRIMARY KEY using index "white_label_configs_pkey";

alter table "public"."accounting_config" add constraint "accounting_config_key_key" UNIQUE using index "accounting_config_key_key";

alter table "public"."accounts" add constraint "accounts_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."accounts" validate constraint "accounts_organization_id_fkey";

alter table "public"."accounts" add constraint "accounts_type_check" CHECK ((type = ANY (ARRAY['asset'::text, 'liability'::text, 'income'::text, 'expense'::text]))) not valid;

alter table "public"."accounts" validate constraint "accounts_type_check";

alter table "public"."agents" add constraint "agents_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'pending'::text]))) not valid;

alter table "public"."agents" validate constraint "agents_status_check";

alter table "public"."agents" add constraint "agents_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."agents" validate constraint "agents_user_id_fkey";

alter table "public"."agents" add constraint "agents_user_id_key" UNIQUE using index "agents_user_id_key";

alter table "public"."api_provider_configs" add constraint "api_provider_configs_provider_service_type_key" UNIQUE using index "api_provider_configs_provider_service_type_key";

alter table "public"."api_usage_logs" add constraint "api_usage_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."api_usage_logs" validate constraint "api_usage_logs_user_id_fkey";

alter table "public"."blockchain_events" add constraint "blockchain_events_event_type_check" CHECK (((event_type)::text = ANY ((ARRAY['transaction'::character varying, 'escrow'::character varying, 'property'::character varying, 'payment'::character varying, 'verification'::character varying, 'contract'::character varying])::text[]))) not valid;

alter table "public"."blockchain_events" validate constraint "blockchain_events_event_type_check";

alter table "public"."blockchain_events" add constraint "blockchain_events_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."blockchain_events" validate constraint "blockchain_events_user_id_fkey";

alter table "public"."blockchain_payments" add constraint "blockchain_payments_lease_id_fkey" FOREIGN KEY (lease_id) REFERENCES public.leases(id) ON DELETE SET NULL not valid;

alter table "public"."blockchain_payments" validate constraint "blockchain_payments_lease_id_fkey";

alter table "public"."blockchain_payments" add constraint "blockchain_payments_payment_type_check" CHECK (((payment_type)::text = ANY ((ARRAY['rent'::character varying, 'deposit'::character varying, 'purchase'::character varying, 'service_fee'::character varying, 'maintenance'::character varying, 'utilities'::character varying])::text[]))) not valid;

alter table "public"."blockchain_payments" validate constraint "blockchain_payments_payment_type_check";

alter table "public"."blockchain_payments" add constraint "blockchain_payments_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL not valid;

alter table "public"."blockchain_payments" validate constraint "blockchain_payments_property_id_fkey";

alter table "public"."blockchain_payments" add constraint "blockchain_payments_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'confirmed'::character varying, 'failed'::character varying, 'cancelled'::character varying])::text[]))) not valid;

alter table "public"."blockchain_payments" validate constraint "blockchain_payments_status_check";

alter table "public"."blockchain_payments" add constraint "blockchain_payments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."blockchain_payments" validate constraint "blockchain_payments_user_id_fkey";

alter table "public"."blockchain_transactions" add constraint "blockchain_transactions_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'confirmed'::character varying, 'failed'::character varying, 'cancelled'::character varying])::text[]))) not valid;

alter table "public"."blockchain_transactions" validate constraint "blockchain_transactions_status_check";

alter table "public"."blockchain_transactions" add constraint "blockchain_transactions_transaction_hash_key" UNIQUE using index "blockchain_transactions_transaction_hash_key";

alter table "public"."blockchain_transactions" add constraint "blockchain_transactions_transaction_type_check" CHECK (((transaction_type)::text = ANY ((ARRAY['transfer'::character varying, 'contract_call'::character varying, 'property_registration'::character varying, 'escrow_creation'::character varying, 'escrow_funding'::character varying, 'payment'::character varying])::text[]))) not valid;

alter table "public"."blockchain_transactions" validate constraint "blockchain_transactions_transaction_type_check";

alter table "public"."blockchain_transactions" add constraint "blockchain_transactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."blockchain_transactions" validate constraint "blockchain_transactions_user_id_fkey";

alter table "public"."blockchain_wallets" add constraint "blockchain_wallets_network_check" CHECK (((network)::text = ANY ((ARRAY['ethereum'::character varying, 'polygon'::character varying, 'bsc'::character varying, 'arbitrum'::character varying, 'optimism'::character varying])::text[]))) not valid;

alter table "public"."blockchain_wallets" validate constraint "blockchain_wallets_network_check";

alter table "public"."blockchain_wallets" add constraint "blockchain_wallets_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."blockchain_wallets" validate constraint "blockchain_wallets_user_id_fkey";

alter table "public"."blockchain_wallets" add constraint "blockchain_wallets_user_id_wallet_address_network_key" UNIQUE using index "blockchain_wallets_user_id_wallet_address_network_key";

alter table "public"."blockchain_wallets" add constraint "blockchain_wallets_wallet_type_check" CHECK (((wallet_type)::text = ANY ((ARRAY['metamask'::character varying, 'walletconnect'::character varying, 'coinbase'::character varying, 'trustwallet'::character varying])::text[]))) not valid;

alter table "public"."blockchain_wallets" validate constraint "blockchain_wallets_wallet_type_check";

alter table "public"."bookings" add constraint "bookings_guest_id_fkey" FOREIGN KEY (guest_id) REFERENCES auth.users(id) ON DELETE RESTRICT not valid;

alter table "public"."bookings" validate constraint "bookings_guest_id_fkey";

alter table "public"."bookings" add constraint "bookings_listing_id_fkey" FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE RESTRICT not valid;

alter table "public"."bookings" validate constraint "bookings_listing_id_fkey";

alter table "public"."bookings" add constraint "bookings_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE RESTRICT not valid;

alter table "public"."bookings" validate constraint "bookings_owner_id_fkey";

alter table "public"."bookings" add constraint "valid_booking_dates" CHECK ((checkout_date > checkin_date)) not valid;

alter table "public"."bookings" validate constraint "valid_booking_dates";

alter table "public"."bookings" add constraint "valid_booking_status" CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'cancelled'::text, 'completed'::text, 'refunded'::text]))) not valid;

alter table "public"."bookings" validate constraint "valid_booking_status";

alter table "public"."channel_manager_integrations" add constraint "channel_manager_integrations_listing_id_channel_name_channe_key" UNIQUE using index "channel_manager_integrations_listing_id_channel_name_channe_key";

alter table "public"."channel_manager_integrations" add constraint "channel_manager_integrations_listing_id_fkey" FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE not valid;

alter table "public"."channel_manager_integrations" validate constraint "channel_manager_integrations_listing_id_fkey";

alter table "public"."channel_sync_logs" add constraint "channel_sync_logs_integration_id_fkey" FOREIGN KEY (integration_id) REFERENCES public.channel_manager_integrations(id) ON DELETE CASCADE not valid;

alter table "public"."channel_sync_logs" validate constraint "channel_sync_logs_integration_id_fkey";

alter table "public"."contact_submissions" add constraint "contact_submissions_status_check" CHECK ((status = ANY (ARRAY['new'::text, 'in-progress'::text, 'responded'::text, 'closed'::text]))) not valid;

alter table "public"."contact_submissions" validate constraint "contact_submissions_status_check";

alter table "public"."contact_submissions" add constraint "contact_submissions_subject_check" CHECK ((subject = ANY (ARRAY['custom-solution'::text, 'enterprise-plan'::text, 'general-inquiry'::text, 'technical-support'::text, 'partnership'::text, 'other'::text]))) not valid;

alter table "public"."contact_submissions" validate constraint "contact_submissions_subject_check";

alter table "public"."document_classifications" add constraint "document_classifications_document_id_fkey" FOREIGN KEY (document_id) REFERENCES public.document_metadata(id) ON DELETE CASCADE not valid;

alter table "public"."document_classifications" validate constraint "document_classifications_document_id_fkey";

alter table "public"."document_classifications" add constraint "document_classifications_verified_by_fkey" FOREIGN KEY (verified_by) REFERENCES auth.users(id) not valid;

alter table "public"."document_classifications" validate constraint "document_classifications_verified_by_fkey";

alter table "public"."document_extractions" add constraint "document_extractions_document_id_fkey" FOREIGN KEY (document_id) REFERENCES public.document_metadata(id) ON DELETE CASCADE not valid;

alter table "public"."document_extractions" validate constraint "document_extractions_document_id_fkey";

alter table "public"."document_extractions" add constraint "document_extractions_extraction_method_check" CHECK ((extraction_method = ANY (ARRAY['ocr'::text, 'ai_vision'::text, 'manual'::text, 'hybrid'::text]))) not valid;

alter table "public"."document_extractions" validate constraint "document_extractions_extraction_method_check";

alter table "public"."document_hashes" add constraint "document_hashes_document_type_check" CHECK (((document_type)::text = ANY ((ARRAY['lease'::character varying, 'deed'::character varying, 'certificate'::character varying, 'inspection'::character varying, 'kyc'::character varying, 'identity'::character varying, 'contract'::character varying])::text[]))) not valid;

alter table "public"."document_hashes" validate constraint "document_hashes_document_type_check";

alter table "public"."document_hashes" add constraint "document_hashes_file_hash_key" UNIQUE using index "document_hashes_file_hash_key";

alter table "public"."document_hashes" add constraint "document_hashes_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE not valid;

alter table "public"."document_hashes" validate constraint "document_hashes_property_id_fkey";

alter table "public"."document_hashes" add constraint "document_hashes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."document_hashes" validate constraint "document_hashes_user_id_fkey";

alter table "public"."document_insights" add constraint "document_insights_impact_level_check" CHECK ((impact_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))) not valid;

alter table "public"."document_insights" validate constraint "document_insights_impact_level_check";

alter table "public"."document_insights" add constraint "document_insights_insight_type_check" CHECK ((insight_type = ANY (ARRAY['processing_efficiency'::text, 'error_patterns'::text, 'compliance_trends'::text, 'fraud_detection'::text, 'user_behavior'::text]))) not valid;

alter table "public"."document_insights" validate constraint "document_insights_insight_type_check";

alter table "public"."document_metadata" add constraint "document_metadata_confidence_score_check" CHECK (((confidence_score >= 0.0) AND (confidence_score <= 1.0))) not valid;

alter table "public"."document_metadata" validate constraint "document_metadata_confidence_score_check";

alter table "public"."document_metadata" add constraint "document_metadata_document_type_check" CHECK ((document_type = ANY (ARRAY['lease_agreement'::text, 'tenant_application'::text, 'id_card'::text, 'passport'::text, 'drivers_license'::text, 'bank_statement'::text, 'pay_slip'::text, 'utility_bill'::text, 'property_deed'::text, 'property_certificate'::text, 'tax_document'::text, 'insurance_document'::text, 'maintenance_receipt'::text, 'invoice'::text, 'contract'::text, 'other'::text]))) not valid;

alter table "public"."document_metadata" validate constraint "document_metadata_document_type_check";

alter table "public"."document_metadata" add constraint "document_metadata_lease_id_fkey" FOREIGN KEY (lease_id) REFERENCES public.leases(id) ON DELETE SET NULL not valid;

alter table "public"."document_metadata" validate constraint "document_metadata_lease_id_fkey";

alter table "public"."document_metadata" add constraint "document_metadata_processing_stage_check" CHECK ((processing_stage = ANY (ARRAY['upload'::text, 'classification'::text, 'ocr_extraction'::text, 'data_validation'::text, 'verification'::text, 'completion'::text]))) not valid;

alter table "public"."document_metadata" validate constraint "document_metadata_processing_stage_check";

alter table "public"."document_metadata" add constraint "document_metadata_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL not valid;

alter table "public"."document_metadata" validate constraint "document_metadata_property_id_fkey";

alter table "public"."document_metadata" add constraint "document_metadata_status_check" CHECK ((status = ANY (ARRAY['uploaded'::text, 'processing'::text, 'processed'::text, 'verified'::text, 'rejected'::text, 'expired'::text, 'archived'::text]))) not valid;

alter table "public"."document_metadata" validate constraint "document_metadata_status_check";

alter table "public"."document_metadata" add constraint "document_metadata_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE SET NULL not valid;

alter table "public"."document_metadata" validate constraint "document_metadata_tenant_id_fkey";

alter table "public"."document_metadata" add constraint "document_metadata_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."document_metadata" validate constraint "document_metadata_user_id_fkey";

alter table "public"."document_processing_settings" add constraint "document_processing_settings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."document_processing_settings" validate constraint "document_processing_settings_user_id_fkey";

alter table "public"."document_templates" add constraint "document_templates_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."document_templates" validate constraint "document_templates_created_by_fkey";

alter table "public"."document_validations" add constraint "document_validations_document_id_fkey" FOREIGN KEY (document_id) REFERENCES public.document_metadata(id) ON DELETE CASCADE not valid;

alter table "public"."document_validations" validate constraint "document_validations_document_id_fkey";

alter table "public"."document_validations" add constraint "document_validations_overall_status_check" CHECK ((overall_status = ANY (ARRAY['passed'::text, 'failed'::text, 'warning'::text]))) not valid;

alter table "public"."document_validations" validate constraint "document_validations_overall_status_check";

alter table "public"."document_workflows" add constraint "document_workflows_assigned_to_fkey" FOREIGN KEY (assigned_to) REFERENCES auth.users(id) not valid;

alter table "public"."document_workflows" validate constraint "document_workflows_assigned_to_fkey";

alter table "public"."document_workflows" add constraint "document_workflows_document_id_fkey" FOREIGN KEY (document_id) REFERENCES public.document_metadata(id) ON DELETE CASCADE not valid;

alter table "public"."document_workflows" validate constraint "document_workflows_document_id_fkey";

alter table "public"."document_workflows" add constraint "document_workflows_priority_check" CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]))) not valid;

alter table "public"."document_workflows" validate constraint "document_workflows_priority_check";

alter table "public"."document_workflows" add constraint "document_workflows_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'rejected'::text, 'on_hold'::text]))) not valid;

alter table "public"."document_workflows" validate constraint "document_workflows_status_check";

alter table "public"."document_workflows" add constraint "document_workflows_workflow_type_check" CHECK ((workflow_type = ANY (ARRAY['tenant_onboarding'::text, 'lease_processing'::text, 'kyc_verification'::text, 'maintenance_claim'::text, 'payment_verification'::text]))) not valid;

alter table "public"."document_workflows" validate constraint "document_workflows_workflow_type_check";

alter table "public"."equipment_data" add constraint "equipment_data_current_condition_check" CHECK ((current_condition = ANY (ARRAY['excellent'::text, 'good'::text, 'fair'::text, 'poor'::text, 'critical'::text]))) not valid;

alter table "public"."equipment_data" validate constraint "equipment_data_current_condition_check";

alter table "public"."equipment_data" add constraint "equipment_data_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE not valid;

alter table "public"."equipment_data" validate constraint "equipment_data_property_id_fkey";

alter table "public"."equipment_data" add constraint "equipment_data_usage_intensity_check" CHECK ((usage_intensity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))) not valid;

alter table "public"."equipment_data" validate constraint "equipment_data_usage_intensity_check";

alter table "public"."escrow_conditions" add constraint "escrow_conditions_condition_type_check" CHECK (((condition_type)::text = ANY ((ARRAY['inspection'::character varying, 'financing'::character varying, 'legal'::character varying, 'custom'::character varying])::text[]))) not valid;

alter table "public"."escrow_conditions" validate constraint "escrow_conditions_condition_type_check";

alter table "public"."escrow_conditions" add constraint "escrow_conditions_escrow_contract_id_condition_id_key" UNIQUE using index "escrow_conditions_escrow_contract_id_condition_id_key";

alter table "public"."escrow_conditions" add constraint "escrow_conditions_escrow_contract_id_fkey" FOREIGN KEY (escrow_contract_id) REFERENCES public.escrow_contracts(id) ON DELETE CASCADE not valid;

alter table "public"."escrow_conditions" validate constraint "escrow_conditions_escrow_contract_id_fkey";

alter table "public"."escrow_contracts" add constraint "escrow_contracts_contract_address_key" UNIQUE using index "escrow_contracts_contract_address_key";

alter table "public"."escrow_contracts" add constraint "escrow_contracts_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE not valid;

alter table "public"."escrow_contracts" validate constraint "escrow_contracts_property_id_fkey";

alter table "public"."escrow_contracts" add constraint "escrow_contracts_property_token_id_fkey" FOREIGN KEY (property_token_id) REFERENCES public.property_tokens(id) ON DELETE CASCADE not valid;

alter table "public"."escrow_contracts" validate constraint "escrow_contracts_property_token_id_fkey";

alter table "public"."escrow_contracts" add constraint "escrow_contracts_status_check" CHECK (((status)::text = ANY ((ARRAY['created'::character varying, 'funded'::character varying, 'pending_release'::character varying, 'released'::character varying, 'refunded'::character varying, 'disputed'::character varying, 'cancelled'::character varying])::text[]))) not valid;

alter table "public"."escrow_contracts" validate constraint "escrow_contracts_status_check";

alter table "public"."escrow_milestones" add constraint "escrow_milestones_escrow_contract_id_fkey" FOREIGN KEY (escrow_contract_id) REFERENCES public.escrow_contracts(id) ON DELETE CASCADE not valid;

alter table "public"."escrow_milestones" validate constraint "escrow_milestones_escrow_contract_id_fkey";

alter table "public"."escrow_milestones" add constraint "escrow_milestones_escrow_contract_id_milestone_id_key" UNIQUE using index "escrow_milestones_escrow_contract_id_milestone_id_key";

alter table "public"."escrow_milestones" add constraint "escrow_milestones_percentage_check" CHECK (((percentage > 0) AND (percentage <= 100))) not valid;

alter table "public"."escrow_milestones" validate constraint "escrow_milestones_percentage_check";

alter table "public"."expenses" add constraint "expenses_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."expenses" validate constraint "expenses_organization_id_fkey";

alter table "public"."expenses" add constraint "expenses_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL not valid;

alter table "public"."expenses" validate constraint "expenses_property_id_fkey";

alter table "public"."feature_usage_tracking" add constraint "feature_usage_tracking_subscription_id_fkey" FOREIGN KEY (subscription_id) REFERENCES public.user_subscriptions(id) ON DELETE SET NULL not valid;

alter table "public"."feature_usage_tracking" validate constraint "feature_usage_tracking_subscription_id_fkey";

alter table "public"."feature_usage_tracking" add constraint "feature_usage_tracking_user_id_feature_key_usage_date_key" UNIQUE using index "feature_usage_tracking_user_id_feature_key_usage_date_key";

alter table "public"."feature_usage_tracking" add constraint "feature_usage_tracking_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."feature_usage_tracking" validate constraint "feature_usage_tracking_user_id_fkey";

alter table "public"."guest_documents" add constraint "guest_documents_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE not valid;

alter table "public"."guest_documents" validate constraint "guest_documents_booking_id_fkey";

alter table "public"."guest_documents" add constraint "guest_documents_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."guest_documents" validate constraint "guest_documents_user_id_fkey";

alter table "public"."guest_documents" add constraint "guest_documents_verified_by_fkey" FOREIGN KEY (verified_by) REFERENCES auth.users(id) not valid;

alter table "public"."guest_documents" validate constraint "guest_documents_verified_by_fkey";

alter table "public"."identity_credentials" add constraint "identity_credentials_credential_type_check" CHECK (((credential_type)::text = ANY ((ARRAY['bvn'::character varying, 'nin'::character varying, 'cac'::character varying, 'bank_account'::character varying, 'address_proof'::character varying, 'kyc_profile'::character varying])::text[]))) not valid;

alter table "public"."identity_credentials" validate constraint "identity_credentials_credential_type_check";

alter table "public"."identity_credentials" add constraint "identity_credentials_did_key" UNIQUE using index "identity_credentials_did_key";

alter table "public"."identity_credentials" add constraint "identity_credentials_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."identity_credentials" validate constraint "identity_credentials_user_id_fkey";

alter table "public"."invoices" add constraint "invoices_invoice_number_key" UNIQUE using index "invoices_invoice_number_key";

alter table "public"."invoices" add constraint "invoices_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'open'::text, 'paid'::text, 'void'::text, 'uncollectible'::text]))) not valid;

alter table "public"."invoices" validate constraint "invoices_status_check";

alter table "public"."invoices" add constraint "invoices_subscription_id_fkey" FOREIGN KEY (subscription_id) REFERENCES public.user_subscriptions(id) ON DELETE SET NULL not valid;

alter table "public"."invoices" validate constraint "invoices_subscription_id_fkey";

alter table "public"."invoices" add constraint "invoices_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."invoices" validate constraint "invoices_user_id_fkey";

alter table "public"."journal_entries" add constraint "journal_entries_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."journal_entries" validate constraint "journal_entries_organization_id_fkey";

alter table "public"."journal_lines" add constraint "journal_lines_account_id_fkey" FOREIGN KEY (account_id) REFERENCES public.accounts(id) not valid;

alter table "public"."journal_lines" validate constraint "journal_lines_account_id_fkey";

alter table "public"."journal_lines" add constraint "journal_lines_journal_entry_id_fkey" FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id) ON DELETE CASCADE not valid;

alter table "public"."journal_lines" validate constraint "journal_lines_journal_entry_id_fkey";

alter table "public"."kyc_profiles" add constraint "kyc_profiles_risk_level_check" CHECK (((risk_level)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying])::text[]))) not valid;

alter table "public"."kyc_profiles" validate constraint "kyc_profiles_risk_level_check";

alter table "public"."kyc_profiles" add constraint "kyc_profiles_risk_score_check" CHECK (((risk_score >= 0) AND (risk_score <= 100))) not valid;

alter table "public"."kyc_profiles" validate constraint "kyc_profiles_risk_score_check";

alter table "public"."kyc_profiles" add constraint "kyc_profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."kyc_profiles" validate constraint "kyc_profiles_user_id_fkey";

alter table "public"."kyc_profiles" add constraint "kyc_profiles_user_id_key" UNIQUE using index "kyc_profiles_user_id_key";

alter table "public"."kyc_profiles" add constraint "kyc_profiles_verification_level_check" CHECK (((verification_level)::text = ANY ((ARRAY['basic'::character varying, 'intermediate'::character varying, 'advanced'::character varying, 'premium'::character varying])::text[]))) not valid;

alter table "public"."kyc_profiles" validate constraint "kyc_profiles_verification_level_check";

alter table "public"."leases" add constraint "leases_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE not valid;

alter table "public"."leases" validate constraint "leases_property_id_fkey";

alter table "public"."leases" add constraint "leases_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."leases" validate constraint "leases_tenant_id_fkey";

alter table "public"."listing_availabilities" add constraint "listing_availabilities_listing_id_fkey" FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE not valid;

alter table "public"."listing_availabilities" validate constraint "listing_availabilities_listing_id_fkey";

alter table "public"."listing_availabilities" add constraint "valid_date_range" CHECK ((end_date >= start_date)) not valid;

alter table "public"."listing_availabilities" validate constraint "valid_date_range";

alter table "public"."listing_pricing" add constraint "listing_pricing_listing_id_date_key" UNIQUE using index "listing_pricing_listing_id_date_key";

alter table "public"."listing_pricing" add constraint "listing_pricing_listing_id_fkey" FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE not valid;

alter table "public"."listing_pricing" validate constraint "listing_pricing_listing_id_fkey";

alter table "public"."listings" add constraint "listings_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE not valid;

alter table "public"."listings" validate constraint "listings_property_id_fkey";

alter table "public"."maintenance_budgets" add constraint "maintenance_budgets_category_check" CHECK ((category = ANY (ARRAY['plumbing'::text, 'electrical'::text, 'hvac'::text, 'structural'::text, 'appliances'::text, 'security'::text, 'exterior'::text, 'interior'::text, 'landscaping'::text]))) not valid;

alter table "public"."maintenance_budgets" validate constraint "maintenance_budgets_category_check";

alter table "public"."maintenance_budgets" add constraint "maintenance_budgets_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE not valid;

alter table "public"."maintenance_budgets" validate constraint "maintenance_budgets_property_id_fkey";

alter table "public"."maintenance_budgets" add constraint "maintenance_budgets_property_id_year_quarter_category_key" UNIQUE using index "maintenance_budgets_property_id_year_quarter_category_key";

alter table "public"."maintenance_budgets" add constraint "maintenance_budgets_quarter_check" CHECK (((quarter >= 1) AND (quarter <= 4))) not valid;

alter table "public"."maintenance_budgets" validate constraint "maintenance_budgets_quarter_check";

alter table "public"."maintenance_insights" add constraint "maintenance_insights_impact_score_check" CHECK (((impact_score >= 0) AND (impact_score <= 100))) not valid;

alter table "public"."maintenance_insights" validate constraint "maintenance_insights_impact_score_check";

alter table "public"."maintenance_insights" add constraint "maintenance_insights_implementation_effort_check" CHECK ((implementation_effort = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))) not valid;

alter table "public"."maintenance_insights" validate constraint "maintenance_insights_implementation_effort_check";

alter table "public"."maintenance_insights" add constraint "maintenance_insights_insight_type_check" CHECK ((insight_type = ANY (ARRAY['cost_optimization'::text, 'efficiency_improvement'::text, 'risk_mitigation'::text, 'trend_analysis'::text]))) not valid;

alter table "public"."maintenance_insights" validate constraint "maintenance_insights_insight_type_check";

alter table "public"."maintenance_insights" add constraint "maintenance_insights_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE not valid;

alter table "public"."maintenance_insights" validate constraint "maintenance_insights_property_id_fkey";

alter table "public"."maintenance_records" add constraint "maintenance_records_category_check" CHECK ((category = ANY (ARRAY['plumbing'::text, 'electrical'::text, 'hvac'::text, 'structural'::text, 'appliances'::text, 'security'::text, 'exterior'::text, 'interior'::text, 'landscaping'::text]))) not valid;

alter table "public"."maintenance_records" validate constraint "maintenance_records_category_check";

alter table "public"."maintenance_records" add constraint "maintenance_records_equipment_id_fkey" FOREIGN KEY (equipment_id) REFERENCES public.equipment_data(id) ON DELETE CASCADE not valid;

alter table "public"."maintenance_records" validate constraint "maintenance_records_equipment_id_fkey";

alter table "public"."maintenance_records" add constraint "maintenance_records_maintenance_type_check" CHECK ((maintenance_type = ANY (ARRAY['preventive'::text, 'corrective'::text, 'emergency'::text, 'inspection'::text]))) not valid;

alter table "public"."maintenance_records" validate constraint "maintenance_records_maintenance_type_check";

alter table "public"."maintenance_records" add constraint "maintenance_records_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE not valid;

alter table "public"."maintenance_records" validate constraint "maintenance_records_property_id_fkey";

alter table "public"."maintenance_requests" add constraint "fk_property" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL not valid;

alter table "public"."maintenance_requests" validate constraint "fk_property";

alter table "public"."maintenance_requests" add constraint "maintenance_requests_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL not valid;

alter table "public"."maintenance_requests" validate constraint "maintenance_requests_property_id_fkey";

alter table "public"."maintenance_requests" add constraint "maintenance_requests_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text]))) not valid;

alter table "public"."maintenance_requests" validate constraint "maintenance_requests_status_check";

alter table "public"."maintenance_requests" add constraint "maintenance_requests_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.users(id) ON DELETE SET NULL not valid;

alter table "public"."maintenance_requests" validate constraint "maintenance_requests_tenant_id_fkey";

alter table "public"."maintenance_requests" add constraint "maintenance_requests_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."maintenance_requests" validate constraint "maintenance_requests_user_id_fkey";

alter table "public"."maintenance_schedules" add constraint "maintenance_schedules_category_check" CHECK ((category = ANY (ARRAY['plumbing'::text, 'electrical'::text, 'hvac'::text, 'structural'::text, 'appliances'::text, 'security'::text, 'exterior'::text, 'interior'::text, 'landscaping'::text]))) not valid;

alter table "public"."maintenance_schedules" validate constraint "maintenance_schedules_category_check";

alter table "public"."maintenance_schedules" add constraint "maintenance_schedules_equipment_id_fkey" FOREIGN KEY (equipment_id) REFERENCES public.equipment_data(id) ON DELETE CASCADE not valid;

alter table "public"."maintenance_schedules" validate constraint "maintenance_schedules_equipment_id_fkey";

alter table "public"."maintenance_schedules" add constraint "maintenance_schedules_frequency_type_check" CHECK ((frequency_type = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text, 'quarterly'::text, 'semi_annual'::text, 'annual'::text, 'conditional'::text]))) not valid;

alter table "public"."maintenance_schedules" validate constraint "maintenance_schedules_frequency_type_check";

alter table "public"."maintenance_schedules" add constraint "maintenance_schedules_priority_check" CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))) not valid;

alter table "public"."maintenance_schedules" validate constraint "maintenance_schedules_priority_check";

alter table "public"."maintenance_schedules" add constraint "maintenance_schedules_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE not valid;

alter table "public"."maintenance_schedules" validate constraint "maintenance_schedules_property_id_fkey";

alter table "public"."message_templates" add constraint "message_templates_key_key" UNIQUE using index "message_templates_key_key";

alter table "public"."nigerian_banks" add constraint "nigerian_banks_code_key" UNIQUE using index "nigerian_banks_code_key";

alter table "public"."notifications" add constraint "notifications_status_check" CHECK ((status = ANY (ARRAY['sent'::text, 'failed'::text]))) not valid;

alter table "public"."notifications" validate constraint "notifications_status_check";

alter table "public"."notifications" add constraint "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_user_id_fkey";

alter table "public"."organizations" add constraint "organizations_type_check" CHECK ((type = ANY (ARRAY['landlord'::text, 'agency'::text, 'admin'::text]))) not valid;

alter table "public"."organizations" validate constraint "organizations_type_check";

alter table "public"."payment_transactions" add constraint "payment_transactions_gateway_check" CHECK ((gateway = ANY (ARRAY['stripe'::text, 'paystack'::text]))) not valid;

alter table "public"."payment_transactions" validate constraint "payment_transactions_gateway_check";

alter table "public"."payment_transactions" add constraint "payment_transactions_invoice_id_fkey" FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL not valid;

alter table "public"."payment_transactions" validate constraint "payment_transactions_invoice_id_fkey";

alter table "public"."payment_transactions" add constraint "payment_transactions_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'succeeded'::text, 'failed'::text, 'refunded'::text]))) not valid;

alter table "public"."payment_transactions" validate constraint "payment_transactions_status_check";

alter table "public"."payment_transactions" add constraint "payment_transactions_subscription_id_fkey" FOREIGN KEY (subscription_id) REFERENCES public.user_subscriptions(id) ON DELETE SET NULL not valid;

alter table "public"."payment_transactions" validate constraint "payment_transactions_subscription_id_fkey";

alter table "public"."payment_transactions" add constraint "payment_transactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."payment_transactions" validate constraint "payment_transactions_user_id_fkey";

alter table "public"."payments" add constraint "payments_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."payments" validate constraint "payments_organization_id_fkey";

alter table "public"."payments" add constraint "payments_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text]))) not valid;

alter table "public"."payments" validate constraint "payments_status_check";

alter table "public"."payments" add constraint "payments_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."payments" validate constraint "payments_tenant_id_fkey";

alter table "public"."payments" add constraint "payments_tx_ref_key" UNIQUE using index "payments_tx_ref_key";

alter table "public"."predictive_alerts" add constraint "predictive_alerts_category_check" CHECK ((category = ANY (ARRAY['plumbing'::text, 'electrical'::text, 'hvac'::text, 'structural'::text, 'appliances'::text, 'security'::text, 'exterior'::text, 'interior'::text, 'landscaping'::text]))) not valid;

alter table "public"."predictive_alerts" validate constraint "predictive_alerts_category_check";

alter table "public"."predictive_alerts" add constraint "predictive_alerts_confidence_score_check" CHECK (((confidence_score >= (0)::numeric) AND (confidence_score <= (1)::numeric))) not valid;

alter table "public"."predictive_alerts" validate constraint "predictive_alerts_confidence_score_check";

alter table "public"."predictive_alerts" add constraint "predictive_alerts_equipment_id_fkey" FOREIGN KEY (equipment_id) REFERENCES public.equipment_data(id) ON DELETE CASCADE not valid;

alter table "public"."predictive_alerts" validate constraint "predictive_alerts_equipment_id_fkey";

alter table "public"."predictive_alerts" add constraint "predictive_alerts_priority_check" CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))) not valid;

alter table "public"."predictive_alerts" validate constraint "predictive_alerts_priority_check";

alter table "public"."predictive_alerts" add constraint "predictive_alerts_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE not valid;

alter table "public"."predictive_alerts" validate constraint "predictive_alerts_property_id_fkey";

alter table "public"."predictive_alerts" add constraint "predictive_alerts_risk_level_check" CHECK ((risk_level = ANY (ARRAY['low'::text, 'moderate'::text, 'high'::text, 'critical'::text]))) not valid;

alter table "public"."predictive_alerts" validate constraint "predictive_alerts_risk_level_check";

alter table "public"."predictive_alerts" add constraint "predictive_alerts_status_check" CHECK ((status = ANY (ARRAY['predicted'::text, 'scheduled'::text, 'in_progress'::text, 'completed'::text, 'overdue'::text]))) not valid;

alter table "public"."predictive_alerts" validate constraint "predictive_alerts_status_check";

alter table "public"."predictive_maintenance_settings" add constraint "predictive_maintenance_settings_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE not valid;

alter table "public"."predictive_maintenance_settings" validate constraint "predictive_maintenance_settings_property_id_fkey";

alter table "public"."pricing_experiments" add constraint "pricing_experiments_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'paused'::text, 'completed'::text]))) not valid;

alter table "public"."pricing_experiments" validate constraint "pricing_experiments_status_check";

alter table "public"."pricing_experiments" add constraint "pricing_experiments_traffic_allocation_check" CHECK (((traffic_allocation >= 0) AND (traffic_allocation <= 100))) not valid;

alter table "public"."pricing_experiments" validate constraint "pricing_experiments_traffic_allocation_check";

alter table "public"."pricing_rules" add constraint "pricing_rules_listing_id_fkey" FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE not valid;

alter table "public"."pricing_rules" validate constraint "pricing_rules_listing_id_fkey";

alter table "public"."profiles" add constraint "profiles_email_key" UNIQUE using index "profiles_email_key";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."properties" add constraint "properties_agent_id_fkey" FOREIGN KEY (agent_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."properties" validate constraint "properties_agent_id_fkey";

alter table "public"."properties" add constraint "properties_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."properties" validate constraint "properties_organization_id_fkey";

alter table "public"."properties" add constraint "properties_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."properties" validate constraint "properties_owner_id_fkey";

alter table "public"."property_interactions" add constraint "property_interactions_interaction_type_check" CHECK ((interaction_type = ANY (ARRAY['view'::text, 'save'::text, 'apply'::text, 'reject'::text, 'contact'::text, 'share'::text]))) not valid;

alter table "public"."property_interactions" validate constraint "property_interactions_interaction_type_check";

alter table "public"."property_interactions" add constraint "property_interactions_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE not valid;

alter table "public"."property_interactions" validate constraint "property_interactions_property_id_fkey";

alter table "public"."property_interactions" add constraint "property_interactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."property_interactions" validate constraint "property_interactions_user_id_fkey";

alter table "public"."property_maintenance_profiles" add constraint "property_maintenance_profiles_equipment_condition_score_check" CHECK (((equipment_condition_score >= 0) AND (equipment_condition_score <= 100))) not valid;

alter table "public"."property_maintenance_profiles" validate constraint "property_maintenance_profiles_equipment_condition_score_check";

alter table "public"."property_maintenance_profiles" add constraint "property_maintenance_profiles_maintenance_complexity_check" CHECK ((maintenance_complexity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))) not valid;

alter table "public"."property_maintenance_profiles" validate constraint "property_maintenance_profiles_maintenance_complexity_check";

alter table "public"."property_maintenance_profiles" add constraint "property_maintenance_profiles_maintenance_history_score_check" CHECK (((maintenance_history_score >= 0) AND (maintenance_history_score <= 100))) not valid;

alter table "public"."property_maintenance_profiles" validate constraint "property_maintenance_profiles_maintenance_history_score_check";

alter table "public"."property_maintenance_profiles" add constraint "property_maintenance_profiles_predictive_accuracy_check" CHECK (((predictive_accuracy >= 0) AND (predictive_accuracy <= 100))) not valid;

alter table "public"."property_maintenance_profiles" validate constraint "property_maintenance_profiles_predictive_accuracy_check";

alter table "public"."property_maintenance_profiles" add constraint "property_maintenance_profiles_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE not valid;

alter table "public"."property_maintenance_profiles" validate constraint "property_maintenance_profiles_property_id_fkey";

alter table "public"."property_tokens" add constraint "property_tokens_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE not valid;

alter table "public"."property_tokens" validate constraint "property_tokens_property_id_fkey";

alter table "public"."property_tokens" add constraint "property_tokens_token_id_contract_address_network_key" UNIQUE using index "property_tokens_token_id_contract_address_network_key";

alter table "public"."property_transfers" add constraint "property_transfers_property_token_id_fkey" FOREIGN KEY (property_token_id) REFERENCES public.property_tokens(id) ON DELETE CASCADE not valid;

alter table "public"."property_transfers" validate constraint "property_transfers_property_token_id_fkey";

alter table "public"."property_transfers" add constraint "property_transfers_transfer_type_check" CHECK (((transfer_type)::text = ANY ((ARRAY['sale'::character varying, 'gift'::character varying, 'inheritance'::character varying, 'auction'::character varying])::text[]))) not valid;

alter table "public"."property_transfers" validate constraint "property_transfers_transfer_type_check";

alter table "public"."reconciliation_runs" add constraint "reconciliation_runs_finalized_by_fkey" FOREIGN KEY (finalized_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."reconciliation_runs" validate constraint "reconciliation_runs_finalized_by_fkey";

alter table "public"."reconciliation_runs" add constraint "reconciliation_runs_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'finalized'::text, 'locked'::text]))) not valid;

alter table "public"."reconciliation_runs" validate constraint "reconciliation_runs_status_check";

alter table "public"."recurring_availability_patterns" add constraint "recurring_availability_patterns_listing_id_fkey" FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE not valid;

alter table "public"."recurring_availability_patterns" validate constraint "recurring_availability_patterns_listing_id_fkey";

alter table "public"."recurring_payments" add constraint "recurring_payments_frequency_check" CHECK (((frequency)::text = ANY ((ARRAY['weekly'::character varying, 'monthly'::character varying, 'quarterly'::character varying, 'annually'::character varying])::text[]))) not valid;

alter table "public"."recurring_payments" validate constraint "recurring_payments_frequency_check";

alter table "public"."recurring_payments" add constraint "recurring_payments_lease_id_fkey" FOREIGN KEY (lease_id) REFERENCES public.leases(id) ON DELETE CASCADE not valid;

alter table "public"."recurring_payments" validate constraint "recurring_payments_lease_id_fkey";

alter table "public"."recurring_payments" add constraint "recurring_payments_payment_type_check" CHECK (((payment_type)::text = ANY ((ARRAY['rent'::character varying, 'service_fee'::character varying, 'utilities'::character varying])::text[]))) not valid;

alter table "public"."recurring_payments" validate constraint "recurring_payments_payment_type_check";

alter table "public"."recurring_payments" add constraint "recurring_payments_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE not valid;

alter table "public"."recurring_payments" validate constraint "recurring_payments_property_id_fkey";

alter table "public"."recurring_payments" add constraint "recurring_payments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."recurring_payments" validate constraint "recurring_payments_user_id_fkey";

alter table "public"."rental_milestones" add constraint "rental_milestones_milestone_type_check" CHECK ((milestone_type = ANY (ARRAY['lease_expiration'::text, 'rent_increase'::text, 'inspection'::text, 'maintenance'::text, 'other'::text]))) not valid;

alter table "public"."rental_milestones" validate constraint "rental_milestones_milestone_type_check";

alter table "public"."rental_milestones" add constraint "rental_milestones_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE not valid;

alter table "public"."rental_milestones" validate constraint "rental_milestones_property_id_fkey";

alter table "public"."rental_milestones" add constraint "rental_milestones_status_check" CHECK ((status = ANY (ARRAY['upcoming'::text, 'active'::text, 'completed'::text, 'overdue'::text]))) not valid;

alter table "public"."rental_milestones" validate constraint "rental_milestones_status_check";

alter table "public"."rental_milestones" add constraint "rental_milestones_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."rental_milestones" validate constraint "rental_milestones_tenant_id_fkey";

alter table "public"."reviews" add constraint "reviews_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE not valid;

alter table "public"."reviews" validate constraint "reviews_booking_id_fkey";

alter table "public"."reviews" add constraint "reviews_booking_id_key" UNIQUE using index "reviews_booking_id_key";

alter table "public"."reviews" add constraint "reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5))) not valid;

alter table "public"."reviews" validate constraint "reviews_rating_check";

alter table "public"."reviews" add constraint "reviews_reviewee_id_fkey" FOREIGN KEY (reviewee_id) REFERENCES auth.users(id) ON DELETE RESTRICT not valid;

alter table "public"."reviews" validate constraint "reviews_reviewee_id_fkey";

alter table "public"."reviews" add constraint "reviews_reviewer_id_fkey" FOREIGN KEY (reviewer_id) REFERENCES auth.users(id) ON DELETE RESTRICT not valid;

alter table "public"."reviews" validate constraint "reviews_reviewer_id_fkey";

alter table "public"."reviews" add constraint "valid_review_type" CHECK ((review_type = ANY (ARRAY['guest'::text, 'owner'::text]))) not valid;

alter table "public"."reviews" validate constraint "valid_review_type";

alter table "public"."sensor_readings" add constraint "sensor_readings_equipment_id_fkey" FOREIGN KEY (equipment_id) REFERENCES public.equipment_data(id) ON DELETE CASCADE not valid;

alter table "public"."sensor_readings" validate constraint "sensor_readings_equipment_id_fkey";

alter table "public"."sensor_readings" add constraint "sensor_readings_sensor_type_check" CHECK ((sensor_type = ANY (ARRAY['temperature'::text, 'humidity'::text, 'pressure'::text, 'vibration'::text, 'current'::text, 'voltage'::text, 'flow_rate'::text]))) not valid;

alter table "public"."sensor_readings" validate constraint "sensor_readings_sensor_type_check";

alter table "public"."smart_recommendations" add constraint "smart_recommendations_confidence_level_check" CHECK ((confidence_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))) not valid;

alter table "public"."smart_recommendations" validate constraint "smart_recommendations_confidence_level_check";

alter table "public"."smart_recommendations" add constraint "smart_recommendations_overall_score_check" CHECK (((overall_score >= (0)::numeric) AND (overall_score <= (1)::numeric))) not valid;

alter table "public"."smart_recommendations" validate constraint "smart_recommendations_overall_score_check";

alter table "public"."smart_recommendations" add constraint "smart_recommendations_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE not valid;

alter table "public"."smart_recommendations" validate constraint "smart_recommendations_property_id_fkey";

alter table "public"."smart_recommendations" add constraint "smart_recommendations_recommendation_type_check" CHECK ((recommendation_type = ANY (ARRAY['daily_picks'::text, 'instant_match'::text, 'similar_to_saved'::text, 'price_drop'::text]))) not valid;

alter table "public"."smart_recommendations" validate constraint "smart_recommendations_recommendation_type_check";

alter table "public"."smart_recommendations" add constraint "smart_recommendations_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'viewed'::text, 'dismissed'::text, 'applied'::text]))) not valid;

alter table "public"."smart_recommendations" validate constraint "smart_recommendations_status_check";

alter table "public"."smart_recommendations" add constraint "smart_recommendations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."smart_recommendations" validate constraint "smart_recommendations_user_id_fkey";

alter table "public"."smart_recommendations" add constraint "smart_recommendations_user_id_property_id_recommendation_ty_key" UNIQUE using index "smart_recommendations_user_id_property_id_recommendation_ty_key";

alter table "public"."subscription_events" add constraint "subscription_events_event_type_check" CHECK ((event_type = ANY (ARRAY['subscription_created'::text, 'subscription_updated'::text, 'subscription_canceled'::text, 'subscription_reactivated'::text, 'trial_started'::text, 'trial_ended'::text, 'payment_succeeded'::text, 'payment_failed'::text, 'invoice_created'::text, 'invoice_paid'::text, 'plan_upgraded'::text, 'plan_downgraded'::text, 'add_on_added'::text, 'add_on_removed'::text, 'usage_limit_exceeded'::text]))) not valid;

alter table "public"."subscription_events" validate constraint "subscription_events_event_type_check";

alter table "public"."subscription_events" add constraint "subscription_events_subscription_id_fkey" FOREIGN KEY (subscription_id) REFERENCES public.user_subscriptions(id) ON DELETE SET NULL not valid;

alter table "public"."subscription_events" validate constraint "subscription_events_subscription_id_fkey";

alter table "public"."subscription_events" add constraint "subscription_events_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."subscription_events" validate constraint "subscription_events_user_id_fkey";

alter table "public"."subscription_plans" add constraint "subscription_plans_tier_check" CHECK ((tier = ANY (ARRAY['free'::text, 'starter'::text, 'professional'::text, 'enterprise'::text, 'white_label'::text]))) not valid;

alter table "public"."subscription_plans" validate constraint "subscription_plans_tier_check";

alter table "public"."subscription_plans" add constraint "subscription_plans_tier_key" UNIQUE using index "subscription_plans_tier_key";

alter table "public"."subscriptions" add constraint "subscriptions_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."subscriptions" validate constraint "subscriptions_organization_id_fkey";

alter table "public"."subscriptions" add constraint "subscriptions_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'cancelled'::text]))) not valid;

alter table "public"."subscriptions" validate constraint "subscriptions_status_check";

alter table "public"."tenancies" add constraint "tenancies_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'ended'::text]))) not valid;

alter table "public"."tenancies" validate constraint "tenancies_status_check";

alter table "public"."tenancies" add constraint "tenancies_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."tenancies" validate constraint "tenancies_tenant_id_fkey";

alter table "public"."tenancies" add constraint "tenancies_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE CASCADE not valid;

alter table "public"."tenancies" validate constraint "tenancies_unit_id_fkey";

alter table "public"."tenant_screenings" add constraint "tenant_screenings_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE not valid;

alter table "public"."tenant_screenings" validate constraint "tenant_screenings_tenant_id_fkey";

alter table "public"."tenants" add constraint "tenants_emergency_contact_check" CHECK (public.validate_emergency_contact(emergency_contact)) not valid;

alter table "public"."tenants" validate constraint "tenants_emergency_contact_check";

alter table "public"."tenants" add constraint "tenants_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."tenants" validate constraint "tenants_user_id_fkey";

alter table "public"."tenants" add constraint "tenants_user_id_unique" UNIQUE using index "tenants_user_id_unique";

alter table "public"."transactions" add constraint "transactions_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL not valid;

alter table "public"."transactions" validate constraint "transactions_booking_id_fkey";

alter table "public"."transactions" add constraint "transactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE RESTRICT not valid;

alter table "public"."transactions" validate constraint "transactions_user_id_fkey";

alter table "public"."transactions" add constraint "valid_transaction_status" CHECK ((status = ANY (ARRAY['pending'::text, 'success'::text, 'failed'::text, 'refunded'::text]))) not valid;

alter table "public"."transactions" validate constraint "valid_transaction_status";

alter table "public"."transactions" add constraint "valid_transaction_type" CHECK ((type = ANY (ARRAY['charge'::text, 'refund'::text, 'payout'::text, 'deposit'::text, 'commission'::text]))) not valid;

alter table "public"."transactions" validate constraint "valid_transaction_type";

alter table "public"."units" add constraint "units_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE not valid;

alter table "public"."units" validate constraint "units_property_id_fkey";

alter table "public"."units" add constraint "units_status_check" CHECK ((status = ANY (ARRAY['occupied'::text, 'vacant'::text]))) not valid;

alter table "public"."units" validate constraint "units_status_check";

alter table "public"."usage_history" add constraint "usage_history_subscription_id_fkey" FOREIGN KEY (subscription_id) REFERENCES public.user_subscriptions(id) ON DELETE CASCADE not valid;

alter table "public"."usage_history" validate constraint "usage_history_subscription_id_fkey";

alter table "public"."user_preferences" add constraint "user_preferences_budget_flexibility_check" CHECK ((budget_flexibility = ANY (ARRAY['strict'::text, 'flexible'::text, 'very_flexible'::text]))) not valid;

alter table "public"."user_preferences" validate constraint "user_preferences_budget_flexibility_check";

alter table "public"."user_preferences" add constraint "user_preferences_furnished_preference_check" CHECK ((furnished_preference = ANY (ARRAY['furnished'::text, 'unfurnished'::text, 'either'::text]))) not valid;

alter table "public"."user_preferences" validate constraint "user_preferences_furnished_preference_check";

alter table "public"."user_preferences" add constraint "user_preferences_noise_tolerance_check" CHECK ((noise_tolerance = ANY (ARRAY['quiet'::text, 'moderate'::text, 'lively'::text]))) not valid;

alter table "public"."user_preferences" validate constraint "user_preferences_noise_tolerance_check";

alter table "public"."user_preferences" add constraint "user_preferences_social_preference_check" CHECK ((social_preference = ANY (ARRAY['private'::text, 'community_oriented'::text]))) not valid;

alter table "public"."user_preferences" validate constraint "user_preferences_social_preference_check";

alter table "public"."user_preferences" add constraint "user_preferences_transportation_mode_check" CHECK ((transportation_mode = ANY (ARRAY['car'::text, 'public_transport'::text, 'walking'::text, 'mixed'::text]))) not valid;

alter table "public"."user_preferences" validate constraint "user_preferences_transportation_mode_check";

alter table "public"."user_preferences" add constraint "user_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_preferences" validate constraint "user_preferences_user_id_fkey";

alter table "public"."user_preferences" add constraint "user_preferences_user_id_key" UNIQUE using index "user_preferences_user_id_key";

alter table "public"."user_roles" add constraint "user_roles_role_check" CHECK ((role = ANY (ARRAY['owner'::text, 'tenant'::text, 'agent'::text, 'admin'::text, 'vendor'::text, 'manager'::text, 'super_admin'::text]))) not valid;

alter table "public"."user_roles" validate constraint "user_roles_role_check";

alter table "public"."user_roles" add constraint "user_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_roles" validate constraint "user_roles_user_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_user_id_key" UNIQUE using index "user_roles_user_id_key";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_billing_cycle_check" CHECK ((billing_cycle = ANY (ARRAY['monthly'::text, 'quarterly'::text, 'yearly'::text]))) not valid;

alter table "public"."user_subscriptions" validate constraint "user_subscriptions_billing_cycle_check";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id) not valid;

alter table "public"."user_subscriptions" validate constraint "user_subscriptions_plan_id_fkey";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'past_due'::text, 'canceled'::text, 'unpaid'::text, 'incomplete'::text, 'trialing'::text]))) not valid;

alter table "public"."user_subscriptions" validate constraint "user_subscriptions_status_check";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_subscriptions" validate constraint "user_subscriptions_user_id_fkey";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

alter table "public"."users" add constraint "users_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."users" validate constraint "users_organization_id_fkey";

alter table "public"."users" add constraint "users_role_check" CHECK ((role = ANY (ARRAY['admin'::text, 'landlord'::text, 'agent'::text, 'tenant'::text]))) not valid;

alter table "public"."users" validate constraint "users_role_check";

alter table "public"."vendor_jobs" add constraint "vendor_jobs_customer_rating_check" CHECK (((customer_rating >= 0.00) AND (customer_rating <= 5.00))) not valid;

alter table "public"."vendor_jobs" validate constraint "vendor_jobs_customer_rating_check";

alter table "public"."vendor_jobs" add constraint "vendor_jobs_payment_status_check" CHECK ((payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'overdue'::text]))) not valid;

alter table "public"."vendor_jobs" validate constraint "vendor_jobs_payment_status_check";

alter table "public"."vendor_jobs" add constraint "vendor_jobs_priority_check" CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'emergency'::text]))) not valid;

alter table "public"."vendor_jobs" validate constraint "vendor_jobs_priority_check";

alter table "public"."vendor_jobs" add constraint "vendor_jobs_status_check" CHECK ((status = ANY (ARRAY['scheduled'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text, 'on_hold'::text]))) not valid;

alter table "public"."vendor_jobs" validate constraint "vendor_jobs_status_check";

alter table "public"."vendor_jobs" add constraint "vendor_jobs_vendor_id_fkey" FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE not valid;

alter table "public"."vendor_jobs" validate constraint "vendor_jobs_vendor_id_fkey";

alter table "public"."vendors" add constraint "vendors_email_unique" UNIQUE using index "vendors_email_unique";

alter table "public"."vendors" add constraint "vendors_experience_check" CHECK (((years_of_experience >= 0) AND (years_of_experience <= 50))) not valid;

alter table "public"."vendors" validate constraint "vendors_experience_check";

alter table "public"."vendors" add constraint "vendors_rates_check" CHECK (((hourly_rate >= (0)::numeric) AND (emergency_rate >= (0)::numeric))) not valid;

alter table "public"."vendors" validate constraint "vendors_rates_check";

alter table "public"."vendors" add constraint "vendors_rating_check" CHECK (((rating >= 0.00) AND (rating <= 5.00))) not valid;

alter table "public"."vendors" validate constraint "vendors_rating_check";

alter table "public"."vendors" add constraint "vendors_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."vendors" validate constraint "vendors_user_id_fkey";

alter table "public"."vendors" add constraint "vendors_user_id_unique" UNIQUE using index "vendors_user_id_unique";

alter table "public"."verification_records" add constraint "verification_records_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'success'::character varying, 'failed'::character varying, 'expired'::character varying])::text[]))) not valid;

alter table "public"."verification_records" validate constraint "verification_records_status_check";

alter table "public"."verification_records" add constraint "verification_records_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."verification_records" validate constraint "verification_records_user_id_fkey";

alter table "public"."verification_records" add constraint "verification_records_verification_type_check" CHECK (((verification_type)::text = ANY ((ARRAY['bvn'::character varying, 'nin'::character varying, 'cac'::character varying, 'bank_account'::character varying, 'phone'::character varying, 'credit_report'::character varying, 'land_registry'::character varying])::text[]))) not valid;

alter table "public"."verification_records" validate constraint "verification_records_verification_type_check";

alter table "public"."viewings" add constraint "viewings_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE not valid;

alter table "public"."viewings" validate constraint "viewings_property_id_fkey";

alter table "public"."viewings" add constraint "viewings_status_check" CHECK ((status = ANY (ARRAY['scheduled'::text, 'completed'::text, 'cancelled'::text]))) not valid;

alter table "public"."viewings" validate constraint "viewings_status_check";

alter table "public"."viewings" add constraint "viewings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."viewings" validate constraint "viewings_user_id_fkey";

alter table "public"."voice_assistant_analytics" add constraint "voice_assistant_analytics_user_id_date_key" UNIQUE using index "voice_assistant_analytics_user_id_date_key";

alter table "public"."voice_assistant_analytics" add constraint "voice_assistant_analytics_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."voice_assistant_analytics" validate constraint "voice_assistant_analytics_user_id_fkey";

alter table "public"."voice_assistant_settings" add constraint "voice_assistant_settings_speech_pitch_check" CHECK (((speech_pitch >= 0.0) AND (speech_pitch <= 2.0))) not valid;

alter table "public"."voice_assistant_settings" validate constraint "voice_assistant_settings_speech_pitch_check";

alter table "public"."voice_assistant_settings" add constraint "voice_assistant_settings_speech_rate_check" CHECK (((speech_rate >= 0.5) AND (speech_rate <= 2.0))) not valid;

alter table "public"."voice_assistant_settings" validate constraint "voice_assistant_settings_speech_rate_check";

alter table "public"."voice_assistant_settings" add constraint "voice_assistant_settings_speech_volume_check" CHECK (((speech_volume >= 0.0) AND (speech_volume <= 1.0))) not valid;

alter table "public"."voice_assistant_settings" validate constraint "voice_assistant_settings_speech_volume_check";

alter table "public"."voice_assistant_settings" add constraint "voice_assistant_settings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."voice_assistant_settings" validate constraint "voice_assistant_settings_user_id_fkey";

alter table "public"."voice_assistant_settings" add constraint "voice_assistant_settings_user_id_key" UNIQUE using index "voice_assistant_settings_user_id_key";

alter table "public"."voice_assistant_settings" add constraint "voice_assistant_settings_voice_type_check" CHECK (((voice_type)::text = ANY ((ARRAY['auto'::character varying, 'male'::character varying, 'female'::character varying])::text[]))) not valid;

alter table "public"."voice_assistant_settings" validate constraint "voice_assistant_settings_voice_type_check";

alter table "public"."voice_command_history" add constraint "voice_command_history_confidence_check" CHECK (((confidence >= 0.0) AND (confidence <= 1.0))) not valid;

alter table "public"."voice_command_history" validate constraint "voice_command_history_confidence_check";

alter table "public"."voice_command_history" add constraint "voice_command_history_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."voice_command_history" validate constraint "voice_command_history_user_id_fkey";

alter table "public"."voice_commands" add constraint "voice_commands_session_id_fkey" FOREIGN KEY (session_id) REFERENCES public.voice_sessions(id) ON DELETE CASCADE not valid;

alter table "public"."voice_commands" validate constraint "voice_commands_session_id_fkey";

alter table "public"."voice_sessions" add constraint "voice_sessions_channel_check" CHECK ((channel = ANY (ARRAY['web'::text, 'phone'::text, 'whatsapp'::text]))) not valid;

alter table "public"."voice_sessions" validate constraint "voice_sessions_channel_check";

alter table "public"."voice_sessions" add constraint "voice_sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."voice_sessions" validate constraint "voice_sessions_user_id_fkey";

alter table "public"."wallets" add constraint "wallets_balance_check" CHECK ((balance >= (0)::numeric)) not valid;

alter table "public"."wallets" validate constraint "wallets_balance_check";

alter table "public"."wallets" add constraint "wallets_pending_balance_check" CHECK ((pending_balance >= (0)::numeric)) not valid;

alter table "public"."wallets" validate constraint "wallets_pending_balance_check";

alter table "public"."wallets" add constraint "wallets_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."wallets" validate constraint "wallets_user_id_fkey";

alter table "public"."wallets" add constraint "wallets_user_id_key" UNIQUE using index "wallets_user_id_key";

alter table "public"."webhook_events" add constraint "webhook_events_verification_record_id_fkey" FOREIGN KEY (verification_record_id) REFERENCES public.verification_records(id) not valid;

alter table "public"."webhook_events" validate constraint "webhook_events_verification_record_id_fkey";

alter table "public"."white_label_configs" add constraint "white_label_configs_subscription_id_fkey" FOREIGN KEY (subscription_id) REFERENCES public.user_subscriptions(id) ON DELETE CASCADE not valid;

alter table "public"."white_label_configs" validate constraint "white_label_configs_subscription_id_fkey";

alter table "public"."white_label_configs" add constraint "white_label_configs_user_id_domain_key" UNIQUE using index "white_label_configs_user_id_domain_key";

alter table "public"."white_label_configs" add constraint "white_label_configs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."white_label_configs" validate constraint "white_label_configs_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.apply_recurring_patterns()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- This will be called to generate availability from patterns
  -- Implementation can be done in application layer for flexibility
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_equipment_age(installation_date date)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN EXTRACT(YEAR FROM AGE(CURRENT_DATE, installation_date));
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_escrow_completion(escrow_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
    total_conditions INTEGER;
    completed_conditions INTEGER;
BEGIN
    SELECT COUNT(*), COUNT(*) FILTER (WHERE completed = true)
    INTO total_conditions, completed_conditions
    FROM escrow_conditions
    WHERE escrow_contract_id = escrow_id AND required = true;
    
    IF total_conditions = 0 THEN
        RETURN 100;
    END IF;
    
    RETURN (completed_conditions * 100 / total_conditions);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_kyc_verification_level(p_bvn_verified boolean, p_nin_verified boolean, p_phone_verified boolean, p_bank_verified boolean, p_business_verified boolean)
 RETURNS character varying
 LANGUAGE plpgsql
AS $function$
DECLARE
    score INTEGER := 0;
BEGIN
    IF p_bvn_verified THEN score := score + 25; END IF;
    IF p_nin_verified THEN score := score + 25; END IF;
    IF p_phone_verified THEN score := score + 15; END IF;
    IF p_bank_verified THEN score := score + 20; END IF;
    IF p_business_verified THEN score := score + 15; END IF;
    
    IF score >= 80 THEN RETURN 'premium';
    ELSIF score >= 60 THEN RETURN 'advanced';
    ELSIF score >= 40 THEN RETURN 'intermediate';
    ELSE RETURN 'basic';
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_property_compatibility(user_prefs jsonb, property_data jsonb)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
DECLARE
    budget_score DECIMAL := 0;
    location_score DECIMAL := 0;
    amenity_score DECIMAL := 0;
    lifestyle_score DECIMAL := 0;
    overall_score DECIMAL := 0;
BEGIN
    -- Budget score calculation
    IF (property_data->>'rent_amount')::BIGINT BETWEEN 
       (user_prefs->>'min_budget')::BIGINT AND 
       (user_prefs->>'max_budget')::BIGINT THEN
        budget_score := 1.0;
    END IF;
    
    -- Location score (simplified)
    IF user_prefs->'preferred_areas' ? (property_data->>'location') THEN
        location_score := 1.0;
    ELSE
        location_score := 0.5;
    END IF;
    
    -- Amenity score (simplified)
    amenity_score := 0.7; -- Placeholder
    
    -- Lifestyle score (simplified)
    IF user_prefs->'property_types' ? (property_data->>'property_type') THEN
        lifestyle_score := 0.8;
    ELSE
        lifestyle_score := 0.3;
    END IF;
    
    -- Weighted overall score
    overall_score := (budget_score * 0.3) + (location_score * 0.25) + 
                    (amenity_score * 0.2) + (lifestyle_score * 0.25);
    
    RETURN LEAST(overall_score, 1.0);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_risk_score(p_bvn_verified boolean, p_nin_verified boolean, p_phone_verified boolean, p_bank_verified boolean, p_business_verified boolean)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
    risk INTEGER := 100;
BEGIN
    IF p_bvn_verified THEN risk := risk - 30; END IF;
    IF p_nin_verified THEN risk := risk - 25; END IF;
    IF p_phone_verified THEN risk := risk - 15; END IF;
    IF p_bank_verified THEN risk := risk - 20; END IF;
    IF p_business_verified THEN risk := risk - 10; END IF;
    
    RETURN GREATEST(0, LEAST(100, risk));
END;
$function$
;

CREATE OR REPLACE FUNCTION public.can_create_tenant_profile(target_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Check if user already has a tenant profile
    IF EXISTS (SELECT 1 FROM public.tenants WHERE user_id = target_user_id) THEN
        RETURN FALSE;
    END IF;
    
    -- Allow if user is creating their own profile or if user is admin
    RETURN (auth.uid() = target_user_id OR public.is_admin(auth.uid()));
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_feature_limit(p_user_id uuid, p_feature_key text, p_requested_usage integer DEFAULT 1)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    subscription_record RECORD;
    plan_record RECORD;
    current_usage INTEGER;
    feature_limit INTEGER;
    result JSONB;
BEGIN
    -- Get user's active subscription
    SELECT * INTO subscription_record
    FROM user_subscriptions
    WHERE user_id = p_user_id AND status = 'active'
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'No active subscription',
            'current_usage', 0,
            'limit', 0
        );
    END IF;
    
    -- Get subscription plan
    SELECT * INTO plan_record
    FROM subscription_plans
    WHERE id = subscription_record.plan_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'Invalid subscription plan',
            'current_usage', 0,
            'limit', 0
        );
    END IF;
    
    -- Get current usage for this period
    SELECT COALESCE(SUM(usage_count), 0) INTO current_usage
    FROM feature_usage_tracking
    WHERE user_id = p_user_id 
    AND feature_key = p_feature_key
    AND usage_date >= DATE_TRUNC('month', NOW())::DATE;
    
    -- Get feature limit from plan
    feature_limit := COALESCE((plan_record.limits->p_feature_key)::INTEGER, 0);
    
    -- Check if unlimited
    IF (plan_record.limits->p_feature_key)::TEXT = 'unlimited' THEN
        RETURN jsonb_build_object(
            'allowed', true,
            'reason', 'Unlimited usage',
            'current_usage', current_usage,
            'limit', 'unlimited'
        );
    END IF;
    
    -- Check if usage would exceed limit
    IF current_usage + p_requested_usage > feature_limit THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'Feature limit exceeded',
            'current_usage', current_usage,
            'limit', feature_limit,
            'overage_allowed', plan_record.tier IN ('professional', 'enterprise')
        );
    END IF;
    
    RETURN jsonb_build_object(
        'allowed', true,
        'reason', 'Within limits',
        'current_usage', current_usage,
        'limit', feature_limit
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_property_access(p_property_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='properties' AND column_name='agent_id') THEN
    RETURN EXISTS (SELECT 1 FROM public.properties WHERE id = p_property_id AND (owner_id = p_user_id OR agent_id = p_user_id));
  ELSE
    RETURN EXISTS (SELECT 1 FROM public.properties WHERE id = p_property_id AND owner_id = p_user_id);
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_expired_documents()
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Archive expired documents
    UPDATE document_metadata 
    SET status = 'archived', updated_at = NOW()
    WHERE expires_at < NOW() AND status != 'archived';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log cleanup activity
    INSERT INTO document_insights (
        insight_type, title, description, metrics, impact_level, date_range
    ) VALUES (
        'processing_efficiency',
        'Document Cleanup',
        'Automated cleanup of expired documents',
        jsonb_build_object('documents_archived', deleted_count),
        'low',
        jsonb_build_object('start', NOW()::text, 'end', NOW()::text)
    );
    
    RETURN deleted_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_old_voice_commands()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    DELETE FROM voice_command_history 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_default_document_settings()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO document_processing_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_journal_entries_from_rent_payment(p_payment_id uuid, p_entry_date date DEFAULT CURRENT_DATE, p_property_id uuid DEFAULT NULL::uuid, p_tenant_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_batch_id UUID := gen_random_uuid();
  v_breakdown RECORD;
  v_ref TEXT;
BEGIN
  SELECT * INTO v_breakdown
  FROM public.payment_breakdowns
  WHERE payment_id = p_payment_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment breakdown not found for payment_id %', p_payment_id;
  END IF;

  v_ref := p_payment_id::TEXT;

  -- Debit: Cash/Bank Account
  INSERT INTO public.journal_entries (journal_batch_id, entry_date, account, debit, credit, description, reference, source_type, source_id, property_id, tenant_id)
  VALUES (v_batch_id, p_entry_date, 'Cash/Bank Account', v_breakdown.total_amount, 0, 'Payment received', v_ref, 'rent_payment', p_payment_id, p_property_id, p_tenant_id);

  -- Credit: Platform Revenue
  IF v_breakdown.platform_fee > 0 THEN
    INSERT INTO public.journal_entries (journal_batch_id, entry_date, account, debit, credit, description, reference, source_type, source_id, property_id, tenant_id)
    VALUES (v_batch_id, p_entry_date, 'Platform Revenue', 0, v_breakdown.platform_fee, 'Platform service fee', v_ref, 'rent_payment', p_payment_id, p_property_id, p_tenant_id);
  END IF;

  -- Credit: Agent Commission Payable
  IF v_breakdown.agent_commission > 0 THEN
    INSERT INTO public.journal_entries (journal_batch_id, entry_date, account, debit, credit, description, reference, source_type, source_id, property_id, tenant_id)
    VALUES (v_batch_id, p_entry_date, 'Agent Commission Payable', 0, v_breakdown.agent_commission, 'Agent commission', v_ref, 'rent_payment', p_payment_id, p_property_id, p_tenant_id);
  END IF;

  -- Credit: Tax Payable
  IF v_breakdown.tax_amount > 0 THEN
    INSERT INTO public.journal_entries (journal_batch_id, entry_date, account, debit, credit, description, reference, source_type, source_id, property_id, tenant_id)
    VALUES (v_batch_id, p_entry_date, 'Tax Payable', 0, v_breakdown.tax_amount, 'VAT/Tax', v_ref, 'rent_payment', p_payment_id, p_property_id, p_tenant_id);
  END IF;

  -- Credit: Owner Payout Payable
  IF v_breakdown.owner_amount > 0 THEN
    INSERT INTO public.journal_entries (journal_batch_id, entry_date, account, debit, credit, description, reference, source_type, source_id, property_id, tenant_id)
    VALUES (v_batch_id, p_entry_date, 'Owner Payout Payable', 0, v_breakdown.owner_amount, 'Amount due to property owner', v_ref, 'rent_payment', p_payment_id, p_property_id, p_tenant_id);
  END IF;

  RETURN v_batch_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_maintenance_notification_for_owner()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  property_record public.properties;
BEGIN
  -- Find the property and its owner
  SELECT * INTO property_record FROM public.properties WHERE id = NEW.property_id;

  -- If an owner is found and the owner is not the one creating the request, create a notification
  IF property_record.owner_id IS NOT NULL AND property_record.owner_id <> NEW.user_id THEN
    INSERT INTO public.notifications(user_id, type, title, description, link, metadata)
    VALUES (
      property_record.owner_id,
      'maintenance',
      'New Maintenance Request: ' || NEW.title,
      'A new request for "' || property_record.name || '" has been submitted.',
      '/maintenance', -- Links to the maintenance page
      jsonb_build_object('request_id', NEW.id, 'property_id', NEW.property_id)
    );
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_message_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  sender_profile public.profiles;
  sender_name TEXT;
BEGIN
  -- Get sender's profile
  SELECT * INTO sender_profile FROM public.profiles WHERE id = NEW.sender_id;
  
  -- Determine sender name
  IF sender_profile.full_name IS NOT NULL AND sender_profile.full_name <> '' THEN
    sender_name := sender_profile.full_name;
  ELSE
    sender_name := sender_profile.email;
  END IF;

  -- Insert a notification for the recipient
  INSERT INTO public.notifications(user_id, type, title, description, link, metadata)
  VALUES (
    NEW.recipient_id,
    'message',
    'New Message from ' || sender_name,
    LEFT(NEW.content, 100) || CASE WHEN LENGTH(NEW.content) > 100 THEN '...' ELSE '' END,
    '/messages',
    jsonb_build_object('message_id', NEW.id, 'sender_id', NEW.sender_id)
  );
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_tenant_profile(p_first_name text, p_last_name text, p_email text, p_phone text DEFAULT NULL::text, p_user_id uuid DEFAULT auth.uid())
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    tenant_id UUID;
BEGIN
    -- Insert tenant record with explicit user_id
    INSERT INTO public.tenants (
        user_id,
        first_name,
        last_name,
        email,
        phone,
        status
    ) VALUES (
        COALESCE(p_user_id, auth.uid()),
        p_first_name,
        p_last_name,
        p_email,
        p_phone,
        'active'
    ) RETURNING id INTO tenant_id;
    
    RETURN tenant_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_tenant_profile(p_user_id uuid DEFAULT NULL::uuid, p_first_name text DEFAULT NULL::text, p_last_name text DEFAULT NULL::text, p_email text DEFAULT NULL::text, p_phone text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    tenant_id UUID;
    target_user_id UUID;
BEGIN
    -- Determine the user_id to use
    target_user_id := COALESCE(p_user_id, auth.uid());
    
    -- Check if tenant already exists for this user_id
    SELECT id INTO tenant_id
    FROM public.tenants
    WHERE user_id = target_user_id;
    
    -- If tenant already exists, return existing id
    IF tenant_id IS NOT NULL THEN
        RAISE NOTICE 'Tenant profile already exists for user_id: %, returning existing tenant_id: %', target_user_id, tenant_id;
        RETURN tenant_id;
    END IF;
    
    -- Insert new tenant record
    INSERT INTO public.tenants (
        user_id,
        first_name,
        last_name,
        email,
        phone,
        status
    ) VALUES (
        target_user_id,
        p_first_name,
        p_last_name,
        p_email,
        p_phone,
        'active'
    ) RETURNING id INTO tenant_id;
    
    RAISE NOTICE 'Created new tenant profile for user_id: %, tenant_id: %', target_user_id, tenant_id;
    RETURN tenant_id;
    
EXCEPTION
    WHEN unique_violation THEN
        -- Handle race condition where another process created the tenant
        SELECT id INTO tenant_id
        FROM public.tenants
        WHERE user_id = target_user_id;
        
        IF tenant_id IS NOT NULL THEN
            RAISE NOTICE 'Tenant profile created by another process for user_id: %, returning tenant_id: %', target_user_id, tenant_id;
            RETURN tenant_id;
        ELSE
            RAISE EXCEPTION 'Unique constraint violation but no existing tenant found for user_id: %', target_user_id;
        END IF;
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error creating tenant profile: %', SQLERRM;
END $function$
;

CREATE OR REPLACE FUNCTION public.create_tenant_record(p_user_id uuid, p_first_name text, p_last_name text, p_email text, p_phone text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    tenant_id uuid;
    existing_tenant_id uuid;
BEGIN
    -- Check if tenant already exists for this user
    SELECT id INTO existing_tenant_id
    FROM tenants
    WHERE user_id = p_user_id;
    
    -- If tenant exists, return existing ID
    IF existing_tenant_id IS NOT NULL THEN
        RAISE NOTICE 'Tenant already exists for user %, returning existing ID', p_user_id;
        RETURN existing_tenant_id;
    END IF;
    
    -- Create new tenant record
    INSERT INTO tenants (
        user_id,
        first_name,
        last_name,
        email,
        phone,
        status,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_first_name,
        p_last_name,
        p_email,
        p_phone,
        'active',
        NOW(),
        NOW()
    )
    RETURNING id INTO tenant_id;
    
    RAISE NOTICE 'Created new tenant record with ID % for user %', tenant_id, p_user_id;
    RETURN tenant_id;
    
EXCEPTION
    WHEN unique_violation THEN
        -- Handle race condition where another process created the tenant
        SELECT id INTO existing_tenant_id
        FROM tenants
        WHERE user_id = p_user_id;
        
        IF existing_tenant_id IS NOT NULL THEN
            RAISE NOTICE 'Tenant created by another process for user %, returning existing ID', p_user_id;
            RETURN existing_tenant_id;
        ELSE
            RAISE EXCEPTION 'Unique constraint violation but no existing tenant found for user %', p_user_id;
        END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_daily_maintenance_recommendations()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    property_record RECORD;
BEGIN
    -- This function would be called daily by a cron job
    -- It would analyze equipment data and generate new predictive alerts
    
    FOR property_record IN 
        SELECT DISTINCT property_id FROM equipment_data
    LOOP
        -- Logic to generate recommendations would go here
        -- This is a placeholder for the actual AI prediction logic
        RAISE NOTICE 'Generating recommendations for property: %', property_record.property_id;
    END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_daily_recommendations()
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
    user_record RECORD;
    property_record RECORD;
    compatibility_score DECIMAL;
    recommendations_count INTEGER := 0;
BEGIN
    -- Clear old recommendations
    DELETE FROM smart_recommendations 
    WHERE recommendation_type = 'daily_picks' 
    AND created_at < NOW() - INTERVAL '7 days';
    
    -- Generate new recommendations for each user with preferences
    FOR user_record IN 
        SELECT user_id, 
               row_to_json(user_preferences.*) as prefs
        FROM user_preferences 
        WHERE updated_at > NOW() - INTERVAL '30 days'
    LOOP
        -- Find compatible properties for this user
        FOR property_record IN
            SELECT id, 
                   row_to_json(properties.*) as property_data
            FROM properties 
            WHERE status = 'available'
            AND id NOT IN (
                SELECT property_id 
                FROM smart_recommendations 
                WHERE user_id = user_record.user_id 
                AND created_at > NOW() - INTERVAL '1 day'
            )
            LIMIT 20
        LOOP
            -- Calculate compatibility
            compatibility_score := calculate_property_compatibility(
                user_record.prefs::JSONB, 
                property_record.property_data::JSONB
            );
            
            -- Insert recommendation if score is above threshold
            IF compatibility_score > 0.3 THEN
                INSERT INTO smart_recommendations (
                    user_id,
                    property_id,
                    overall_score,
                    score_breakdown,
                    confidence_level,
                    reasons,
                    recommendation_type,
                    expires_at
                ) VALUES (
                    user_record.user_id,
                    property_record.id,
                    compatibility_score,
                    jsonb_build_object(
                        'budget_score', 0.8,
                        'location_score', 0.7,
                        'amenity_score', 0.6,
                        'lifestyle_score', 0.8,
                        'behavioral_score', 0.5
                    ),
                    CASE 
                        WHEN compatibility_score > 0.7 THEN 'high'
                        WHEN compatibility_score > 0.5 THEN 'medium'
                        ELSE 'low'
                    END,
                    ARRAY['Good overall match for your preferences'],
                    'daily_picks',
                    NOW() + INTERVAL '7 days'
                )
                ON CONFLICT (user_id, property_id, recommendation_type) 
                DO NOTHING;
                
                recommendations_count := recommendations_count + 1;
            END IF;
        END LOOP;
    END LOOP;
    
    RETURN recommendations_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
    year_month TEXT;
    sequence_num INTEGER;
    invoice_num TEXT;
BEGIN
    year_month := TO_CHAR(NOW(), 'YYYYMM');
    
    -- Get the next sequence number for this month
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 8) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM invoices
    WHERE invoice_number LIKE 'INV-' || year_month || '%';
    
    invoice_num := 'INV-' || year_month || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN invoice_num;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_blockchain_portfolio_value(user_wallet_address character varying)
 RETURNS TABLE(total_property_value numeric, total_escrow_value numeric, total_payments_sent numeric, total_payments_received numeric)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(pt.price), 0) as total_property_value,
        COALESCE(SUM(ec.amount) FILTER (WHERE ec.buyer_address = user_wallet_address), 0) as total_escrow_value,
        COALESCE(SUM(bp.amount) FILTER (WHERE bp.from_address = user_wallet_address AND bp.status = 'confirmed'), 0) as total_payments_sent,
        COALESCE(SUM(bp.amount) FILTER (WHERE bp.to_address = user_wallet_address AND bp.status = 'confirmed'), 0) as total_payments_received
    FROM property_tokens pt
    FULL OUTER JOIN escrow_contracts ec ON pt.id = ec.property_token_id
    FULL OUTER JOIN blockchain_payments bp ON pt.property_id = bp.property_id
    WHERE pt.owner_address = user_wallet_address 
       OR ec.buyer_address = user_wallet_address 
       OR ec.seller_address = user_wallet_address
       OR bp.from_address = user_wallet_address 
       OR bp.to_address = user_wallet_address;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_equipment_health_score(condition text)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
BEGIN
    CASE condition
        WHEN 'excellent' THEN RETURN 95;
        WHEN 'good' THEN RETURN 80;
        WHEN 'fair' THEN RETURN 60;
        WHEN 'poor' THEN RETURN 40;
        WHEN 'critical' THEN RETURN 20;
        ELSE RETURN 50;
    END CASE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_voice_assistant_stats(p_user_id uuid)
 RETURNS TABLE(total_commands bigint, successful_commands bigint, success_rate numeric, average_confidence numeric, most_used_intent character varying, commands_today integer, commands_this_week integer, commands_this_month integer)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) as total_cmds,
            COUNT(*) FILTER (WHERE success = true) as success_cmds,
            AVG(confidence) as avg_conf,
            MODE() WITHIN GROUP (ORDER BY intent) as popular_intent
        FROM voice_command_history 
        WHERE user_id = p_user_id
    ),
    recent_stats AS (
        SELECT
            COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today_cmds,
            COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('week', NOW())) as week_cmds,
            COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW())) as month_cmds
        FROM voice_command_history 
        WHERE user_id = p_user_id
    )
    SELECT 
        s.total_cmds,
        s.success_cmds,
        CASE 
            WHEN s.total_cmds > 0 THEN (s.success_cmds::DECIMAL / s.total_cmds * 100)
            ELSE 0 
        END,
        COALESCE(s.avg_conf, 0),
        s.popular_intent,
        r.today_cmds::INTEGER,
        r.week_cmds::INTEGER,
        r.month_cmds::INTEGER
    FROM stats s, recent_stats r;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Insert into public.profiles, now including the email
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', ''), new.email);
  
  -- Insert into public.user_roles using the role from signup metadata, with 'tenant' as a fallback.
  -- We now explicitly cast to public.user_role to avoid any search_path issues.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'tenant'::public.user_role));
  
  RETURN new;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.has_active_lease_for_property(p_property_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='lease_agreements') THEN
    RETURN EXISTS (
      SELECT 1 FROM public.lease_agreements la
      INNER JOIN public.tenants t ON t.id = la.tenant_id
      WHERE la.property_id = p_property_id AND t.user_id = p_user_id
      AND (UPPER(la.status) = 'ACTIVE' OR (la.end_date IS NULL OR la.end_date >= CURRENT_DATE))
    );
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='leases') THEN
    RETURN EXISTS (
      SELECT 1 FROM public.leases l
      INNER JOIN public.tenants t ON t.id = l.tenant_id
      WHERE l.property_id = p_property_id AND t.user_id = p_user_id
      AND (UPPER(l.status) = 'ACTIVE' OR (l.end_date IS NULL OR l.end_date >= CURRENT_DATE))
    );
  END IF;
  RETURN FALSE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = check_user_id
        AND ur.role IN ('admin', 'super_admin')
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_agent(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = $1
        AND ur.role = 'agent'
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_owner(user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = $1
        AND ur.role = 'owner'
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_api_usage(p_user_id uuid, p_provider character varying, p_service_type character varying, p_endpoint character varying, p_request_method character varying, p_response_time_ms integer, p_status_code integer, p_success boolean, p_cost numeric DEFAULT 0.00)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO api_usage_logs (
        user_id,
        provider,
        service_type,
        endpoint,
        request_method,
        response_time_ms,
        status_code,
        success,
        cost
    ) VALUES (
        p_user_id,
        p_provider,
        p_service_type,
        p_endpoint,
        p_request_method,
        p_response_time_ms,
        p_status_code,
        p_success,
        p_cost
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_blockchain_event(p_user_id uuid, p_event_type character varying, p_event_name character varying, p_contract_address character varying, p_transaction_hash character varying, p_block_number bigint, p_network character varying, p_event_data jsonb)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO blockchain_events (
        user_id,
        event_type,
        event_name,
        contract_address,
        transaction_hash,
        block_number,
        network,
        event_data
    ) VALUES (
        p_user_id,
        p_event_type,
        p_event_name,
        p_contract_address,
        p_transaction_hash,
        p_block_number,
        p_network,
        p_event_data
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_document_expiration()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.retention_period_days IS NOT NULL THEN
        NEW.expires_at = NEW.created_at + (NEW.retention_period_days || ' days')::INTERVAL;
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_invoice_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := generate_invoice_number();
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_tenant_user_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Always set user_id to current authenticated user if not provided
    IF NEW.user_id IS NULL THEN
        NEW.user_id := auth.uid();
    END IF;
    
    -- Set email from auth if not provided and user_id matches current user
    IF NEW.email IS NULL AND NEW.user_id = auth.uid() THEN
        NEW.email := (SELECT email FROM auth.users WHERE id = auth.uid());
    END IF;
    
    -- Ensure status is set
    IF NEW.status IS NULL THEN
        NEW.status := 'active';
    END IF;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.test_tenant_policies()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    result TEXT := 'RLS Policies Status: ';
    policy_count INTEGER;
BEGIN
    -- Count policies on tenants table
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'tenants' AND schemaname = 'public';
    
    result := result || 'Found ' || policy_count || ' policies on tenants table. ';
    
    -- Check if RLS is enabled
    IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'tenants' 
        AND n.nspname = 'public' 
        AND c.relrowsecurity = true
    ) THEN
        result := result || 'RLS is enabled. ';
    ELSE
        result := result || 'RLS is NOT enabled. ';
    END IF;
    
    RETURN result || 'Policies should now allow tenant creation.';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.test_tenant_rls()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    result TEXT := 'Tenant RLS Status: ';
    policy_count INTEGER;
BEGIN
    -- Count policies on tenants table
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'tenants' AND schemaname = 'public';
    
    result := result || 'Found ' || policy_count || ' policies. ';
    
    -- Check if RLS is enabled
    IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'tenants' 
        AND n.nspname = 'public' 
        AND c.relrowsecurity = true
    ) THEN
        result := result || 'RLS enabled. ';
    ELSE
        result := result || 'RLS disabled. ';
    END IF;
    
    RETURN result || 'Tenant creation should now work.';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.track_feature_usage(p_user_id uuid, p_feature_key text, p_usage_count integer DEFAULT 1, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO feature_usage_tracking (user_id, feature_key, usage_count, metadata)
    VALUES (p_user_id, p_feature_key, p_usage_count, p_metadata)
    ON CONFLICT (user_id, feature_key, usage_date)
    DO UPDATE SET 
        usage_count = feature_usage_tracking.usage_count + p_usage_count,
        metadata = p_metadata;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_agents_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_blockchain_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_contact_submissions_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_kyc_profile_verification(p_user_id uuid, p_verification_type character varying, p_verified boolean)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    current_profile kyc_profiles%ROWTYPE;
    new_level VARCHAR(20);
    new_risk_score INTEGER;
    new_risk_level VARCHAR(10);
BEGIN
    -- Get or create KYC profile
    SELECT * INTO current_profile FROM kyc_profiles WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        INSERT INTO kyc_profiles (user_id) VALUES (p_user_id);
        SELECT * INTO current_profile FROM kyc_profiles WHERE user_id = p_user_id;
    END IF;
    
    -- Update specific verification
    CASE p_verification_type
        WHEN 'bvn' THEN
            UPDATE kyc_profiles SET bvn_verified = p_verified WHERE user_id = p_user_id;
            current_profile.bvn_verified := p_verified;
        WHEN 'nin' THEN
            UPDATE kyc_profiles SET nin_verified = p_verified WHERE user_id = p_user_id;
            current_profile.nin_verified := p_verified;
        WHEN 'phone' THEN
            UPDATE kyc_profiles SET phone_verified = p_verified WHERE user_id = p_user_id;
            current_profile.phone_verified := p_verified;
        WHEN 'bank_account' THEN
            UPDATE kyc_profiles SET bank_account_verified = p_verified WHERE user_id = p_user_id;
            current_profile.bank_account_verified := p_verified;
        WHEN 'cac' THEN
            UPDATE kyc_profiles SET business_verified = p_verified WHERE user_id = p_user_id;
            current_profile.business_verified := p_verified;
    END CASE;
    
    -- Calculate new verification level and risk
    new_level := calculate_kyc_verification_level(
        current_profile.bvn_verified,
        current_profile.nin_verified,
        current_profile.phone_verified,
        current_profile.bank_account_verified,
        current_profile.business_verified
    );
    
    new_risk_score := calculate_risk_score(
        current_profile.bvn_verified,
        current_profile.nin_verified,
        current_profile.phone_verified,
        current_profile.bank_account_verified,
        current_profile.business_verified
    );
    
    IF new_risk_score <= 30 THEN new_risk_level := 'low';
    ELSIF new_risk_score <= 70 THEN new_risk_level := 'medium';
    ELSE new_risk_level := 'high';
    END IF;
    
    -- Update calculated fields
    UPDATE kyc_profiles SET
        verification_level = new_level,
        risk_score = new_risk_score,
        risk_level = new_risk_level,
        updated_at = NOW()
    WHERE user_id = p_user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_maintenance_budget_spent()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO maintenance_budgets (property_id, year, quarter, category, spent_amount)
    VALUES (
        NEW.property_id,
        EXTRACT(YEAR FROM NEW.performed_date),
        EXTRACT(QUARTER FROM NEW.performed_date),
        NEW.category,
        NEW.cost
    )
    ON CONFLICT (property_id, year, quarter, category)
    DO UPDATE SET 
        spent_amount = maintenance_budgets.spent_amount + NEW.cost,
        last_updated = NOW();
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_nigerian_api_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_voice_analytics(p_user_id uuid, p_command_success boolean, p_confidence numeric, p_intent character varying, p_session_time_minutes integer DEFAULT 0)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    current_date DATE := CURRENT_DATE;
    current_analytics voice_assistant_analytics%ROWTYPE;
BEGIN
    -- Get or create today's analytics record
    SELECT * INTO current_analytics
    FROM voice_assistant_analytics
    WHERE user_id = p_user_id AND date = current_date;
    
    IF NOT FOUND THEN
        -- Create new analytics record
        INSERT INTO voice_assistant_analytics (
            user_id, 
            date, 
            total_commands, 
            successful_commands, 
            failed_commands,
            average_confidence,
            most_used_intent,
            total_session_time_minutes
        ) VALUES (
            p_user_id,
            current_date,
            1,
            CASE WHEN p_command_success THEN 1 ELSE 0 END,
            CASE WHEN NOT p_command_success THEN 1 ELSE 0 END,
            p_confidence,
            p_intent,
            p_session_time_minutes
        );
    ELSE
        -- Update existing analytics record
        UPDATE voice_assistant_analytics SET
            total_commands = current_analytics.total_commands + 1,
            successful_commands = current_analytics.successful_commands + 
                CASE WHEN p_command_success THEN 1 ELSE 0 END,
            failed_commands = current_analytics.failed_commands + 
                CASE WHEN NOT p_command_success THEN 1 ELSE 0 END,
            average_confidence = (
                (current_analytics.average_confidence * current_analytics.total_commands + p_confidence) / 
                (current_analytics.total_commands + 1)
            ),
            total_session_time_minutes = current_analytics.total_session_time_minutes + p_session_time_minutes,
            updated_at = NOW()
        WHERE user_id = p_user_id AND date = current_date;
        
        -- Update most used intent if this intent is now more frequent
        UPDATE voice_assistant_analytics SET
            most_used_intent = p_intent
        WHERE user_id = p_user_id 
            AND date = current_date
            AND (
                most_used_intent IS NULL OR
                (
                    SELECT COUNT(*) FROM voice_command_history 
                    WHERE user_id = p_user_id 
                        AND DATE(created_at) = current_date 
                        AND intent = p_intent
                ) > (
                    SELECT COUNT(*) FROM voice_command_history 
                    WHERE user_id = p_user_id 
                        AND DATE(created_at) = current_date 
                        AND intent = most_used_intent
                )
            );
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_voice_assistant_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_emergency_contact(contact_data jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Check if required fields are present
    IF contact_data IS NULL OR contact_data = '{}' THEN
        RETURN TRUE; -- Allow empty emergency contact
    END IF;
    
    -- Validate that if emergency contact is provided, it has required fields
    IF contact_data ? 'name' AND contact_data ? 'phone' THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$function$
;

grant delete on table "public"."accounting_config" to "authenticated";

grant insert on table "public"."accounting_config" to "authenticated";

grant references on table "public"."accounting_config" to "authenticated";

grant select on table "public"."accounting_config" to "authenticated";

grant trigger on table "public"."accounting_config" to "authenticated";

grant truncate on table "public"."accounting_config" to "authenticated";

grant update on table "public"."accounting_config" to "authenticated";

grant delete on table "public"."accounts" to "authenticated";

grant insert on table "public"."accounts" to "authenticated";

grant references on table "public"."accounts" to "authenticated";

grant select on table "public"."accounts" to "authenticated";

grant trigger on table "public"."accounts" to "authenticated";

grant truncate on table "public"."accounts" to "authenticated";

grant update on table "public"."accounts" to "authenticated";

grant delete on table "public"."api_provider_configs" to "authenticated";

grant insert on table "public"."api_provider_configs" to "authenticated";

grant references on table "public"."api_provider_configs" to "authenticated";

grant select on table "public"."api_provider_configs" to "authenticated";

grant trigger on table "public"."api_provider_configs" to "authenticated";

grant truncate on table "public"."api_provider_configs" to "authenticated";

grant update on table "public"."api_provider_configs" to "authenticated";

grant delete on table "public"."api_usage_logs" to "authenticated";

grant insert on table "public"."api_usage_logs" to "authenticated";

grant references on table "public"."api_usage_logs" to "authenticated";

grant select on table "public"."api_usage_logs" to "authenticated";

grant trigger on table "public"."api_usage_logs" to "authenticated";

grant truncate on table "public"."api_usage_logs" to "authenticated";

grant update on table "public"."api_usage_logs" to "authenticated";

grant delete on table "public"."blockchain_events" to "authenticated";

grant insert on table "public"."blockchain_events" to "authenticated";

grant references on table "public"."blockchain_events" to "authenticated";

grant select on table "public"."blockchain_events" to "authenticated";

grant trigger on table "public"."blockchain_events" to "authenticated";

grant truncate on table "public"."blockchain_events" to "authenticated";

grant update on table "public"."blockchain_events" to "authenticated";

grant delete on table "public"."blockchain_payments" to "authenticated";

grant insert on table "public"."blockchain_payments" to "authenticated";

grant references on table "public"."blockchain_payments" to "authenticated";

grant select on table "public"."blockchain_payments" to "authenticated";

grant trigger on table "public"."blockchain_payments" to "authenticated";

grant truncate on table "public"."blockchain_payments" to "authenticated";

grant update on table "public"."blockchain_payments" to "authenticated";

grant delete on table "public"."blockchain_transactions" to "authenticated";

grant insert on table "public"."blockchain_transactions" to "authenticated";

grant references on table "public"."blockchain_transactions" to "authenticated";

grant select on table "public"."blockchain_transactions" to "authenticated";

grant trigger on table "public"."blockchain_transactions" to "authenticated";

grant truncate on table "public"."blockchain_transactions" to "authenticated";

grant update on table "public"."blockchain_transactions" to "authenticated";

grant delete on table "public"."blockchain_wallets" to "authenticated";

grant insert on table "public"."blockchain_wallets" to "authenticated";

grant references on table "public"."blockchain_wallets" to "authenticated";

grant select on table "public"."blockchain_wallets" to "authenticated";

grant trigger on table "public"."blockchain_wallets" to "authenticated";

grant truncate on table "public"."blockchain_wallets" to "authenticated";

grant update on table "public"."blockchain_wallets" to "authenticated";

grant delete on table "public"."bookings" to "authenticated";

grant insert on table "public"."bookings" to "authenticated";

grant references on table "public"."bookings" to "authenticated";

grant select on table "public"."bookings" to "authenticated";

grant trigger on table "public"."bookings" to "authenticated";

grant truncate on table "public"."bookings" to "authenticated";

grant update on table "public"."bookings" to "authenticated";

grant delete on table "public"."channel_manager_integrations" to "authenticated";

grant insert on table "public"."channel_manager_integrations" to "authenticated";

grant references on table "public"."channel_manager_integrations" to "authenticated";

grant select on table "public"."channel_manager_integrations" to "authenticated";

grant trigger on table "public"."channel_manager_integrations" to "authenticated";

grant truncate on table "public"."channel_manager_integrations" to "authenticated";

grant update on table "public"."channel_manager_integrations" to "authenticated";

grant delete on table "public"."channel_sync_logs" to "authenticated";

grant insert on table "public"."channel_sync_logs" to "authenticated";

grant references on table "public"."channel_sync_logs" to "authenticated";

grant select on table "public"."channel_sync_logs" to "authenticated";

grant trigger on table "public"."channel_sync_logs" to "authenticated";

grant truncate on table "public"."channel_sync_logs" to "authenticated";

grant update on table "public"."channel_sync_logs" to "authenticated";

grant delete on table "public"."contact_submissions" to "authenticated";

grant insert on table "public"."contact_submissions" to "authenticated";

grant references on table "public"."contact_submissions" to "authenticated";

grant select on table "public"."contact_submissions" to "authenticated";

grant trigger on table "public"."contact_submissions" to "authenticated";

grant truncate on table "public"."contact_submissions" to "authenticated";

grant update on table "public"."contact_submissions" to "authenticated";

grant delete on table "public"."document_classifications" to "authenticated";

grant insert on table "public"."document_classifications" to "authenticated";

grant references on table "public"."document_classifications" to "authenticated";

grant select on table "public"."document_classifications" to "authenticated";

grant trigger on table "public"."document_classifications" to "authenticated";

grant truncate on table "public"."document_classifications" to "authenticated";

grant update on table "public"."document_classifications" to "authenticated";

grant delete on table "public"."document_extractions" to "authenticated";

grant insert on table "public"."document_extractions" to "authenticated";

grant references on table "public"."document_extractions" to "authenticated";

grant select on table "public"."document_extractions" to "authenticated";

grant trigger on table "public"."document_extractions" to "authenticated";

grant truncate on table "public"."document_extractions" to "authenticated";

grant update on table "public"."document_extractions" to "authenticated";

grant delete on table "public"."document_hashes" to "authenticated";

grant insert on table "public"."document_hashes" to "authenticated";

grant references on table "public"."document_hashes" to "authenticated";

grant select on table "public"."document_hashes" to "authenticated";

grant trigger on table "public"."document_hashes" to "authenticated";

grant truncate on table "public"."document_hashes" to "authenticated";

grant update on table "public"."document_hashes" to "authenticated";

grant delete on table "public"."document_insights" to "authenticated";

grant insert on table "public"."document_insights" to "authenticated";

grant references on table "public"."document_insights" to "authenticated";

grant select on table "public"."document_insights" to "authenticated";

grant trigger on table "public"."document_insights" to "authenticated";

grant truncate on table "public"."document_insights" to "authenticated";

grant update on table "public"."document_insights" to "authenticated";

grant delete on table "public"."document_metadata" to "authenticated";

grant insert on table "public"."document_metadata" to "authenticated";

grant references on table "public"."document_metadata" to "authenticated";

grant select on table "public"."document_metadata" to "authenticated";

grant trigger on table "public"."document_metadata" to "authenticated";

grant truncate on table "public"."document_metadata" to "authenticated";

grant update on table "public"."document_metadata" to "authenticated";

grant delete on table "public"."document_processing_settings" to "authenticated";

grant insert on table "public"."document_processing_settings" to "authenticated";

grant references on table "public"."document_processing_settings" to "authenticated";

grant select on table "public"."document_processing_settings" to "authenticated";

grant trigger on table "public"."document_processing_settings" to "authenticated";

grant truncate on table "public"."document_processing_settings" to "authenticated";

grant update on table "public"."document_processing_settings" to "authenticated";

grant delete on table "public"."document_templates" to "authenticated";

grant insert on table "public"."document_templates" to "authenticated";

grant references on table "public"."document_templates" to "authenticated";

grant select on table "public"."document_templates" to "authenticated";

grant trigger on table "public"."document_templates" to "authenticated";

grant truncate on table "public"."document_templates" to "authenticated";

grant update on table "public"."document_templates" to "authenticated";

grant delete on table "public"."document_validations" to "authenticated";

grant insert on table "public"."document_validations" to "authenticated";

grant references on table "public"."document_validations" to "authenticated";

grant select on table "public"."document_validations" to "authenticated";

grant trigger on table "public"."document_validations" to "authenticated";

grant truncate on table "public"."document_validations" to "authenticated";

grant update on table "public"."document_validations" to "authenticated";

grant delete on table "public"."document_workflows" to "authenticated";

grant insert on table "public"."document_workflows" to "authenticated";

grant references on table "public"."document_workflows" to "authenticated";

grant select on table "public"."document_workflows" to "authenticated";

grant trigger on table "public"."document_workflows" to "authenticated";

grant truncate on table "public"."document_workflows" to "authenticated";

grant update on table "public"."document_workflows" to "authenticated";

grant delete on table "public"."equipment_data" to "authenticated";

grant insert on table "public"."equipment_data" to "authenticated";

grant references on table "public"."equipment_data" to "authenticated";

grant select on table "public"."equipment_data" to "authenticated";

grant trigger on table "public"."equipment_data" to "authenticated";

grant truncate on table "public"."equipment_data" to "authenticated";

grant update on table "public"."equipment_data" to "authenticated";

grant delete on table "public"."escrow_conditions" to "authenticated";

grant insert on table "public"."escrow_conditions" to "authenticated";

grant references on table "public"."escrow_conditions" to "authenticated";

grant select on table "public"."escrow_conditions" to "authenticated";

grant trigger on table "public"."escrow_conditions" to "authenticated";

grant truncate on table "public"."escrow_conditions" to "authenticated";

grant update on table "public"."escrow_conditions" to "authenticated";

grant delete on table "public"."escrow_contracts" to "authenticated";

grant insert on table "public"."escrow_contracts" to "authenticated";

grant references on table "public"."escrow_contracts" to "authenticated";

grant select on table "public"."escrow_contracts" to "authenticated";

grant trigger on table "public"."escrow_contracts" to "authenticated";

grant truncate on table "public"."escrow_contracts" to "authenticated";

grant update on table "public"."escrow_contracts" to "authenticated";

grant delete on table "public"."escrow_milestones" to "authenticated";

grant insert on table "public"."escrow_milestones" to "authenticated";

grant references on table "public"."escrow_milestones" to "authenticated";

grant select on table "public"."escrow_milestones" to "authenticated";

grant trigger on table "public"."escrow_milestones" to "authenticated";

grant truncate on table "public"."escrow_milestones" to "authenticated";

grant update on table "public"."escrow_milestones" to "authenticated";

grant delete on table "public"."expenses" to "authenticated";

grant insert on table "public"."expenses" to "authenticated";

grant references on table "public"."expenses" to "authenticated";

grant select on table "public"."expenses" to "authenticated";

grant trigger on table "public"."expenses" to "authenticated";

grant truncate on table "public"."expenses" to "authenticated";

grant update on table "public"."expenses" to "authenticated";

grant delete on table "public"."feature_usage_tracking" to "authenticated";

grant insert on table "public"."feature_usage_tracking" to "authenticated";

grant references on table "public"."feature_usage_tracking" to "authenticated";

grant select on table "public"."feature_usage_tracking" to "authenticated";

grant trigger on table "public"."feature_usage_tracking" to "authenticated";

grant truncate on table "public"."feature_usage_tracking" to "authenticated";

grant update on table "public"."feature_usage_tracking" to "authenticated";

grant delete on table "public"."guest_documents" to "authenticated";

grant insert on table "public"."guest_documents" to "authenticated";

grant references on table "public"."guest_documents" to "authenticated";

grant select on table "public"."guest_documents" to "authenticated";

grant trigger on table "public"."guest_documents" to "authenticated";

grant truncate on table "public"."guest_documents" to "authenticated";

grant update on table "public"."guest_documents" to "authenticated";

grant delete on table "public"."identity_credentials" to "authenticated";

grant insert on table "public"."identity_credentials" to "authenticated";

grant references on table "public"."identity_credentials" to "authenticated";

grant select on table "public"."identity_credentials" to "authenticated";

grant trigger on table "public"."identity_credentials" to "authenticated";

grant truncate on table "public"."identity_credentials" to "authenticated";

grant update on table "public"."identity_credentials" to "authenticated";

grant delete on table "public"."invoices" to "authenticated";

grant insert on table "public"."invoices" to "authenticated";

grant references on table "public"."invoices" to "authenticated";

grant select on table "public"."invoices" to "authenticated";

grant trigger on table "public"."invoices" to "authenticated";

grant truncate on table "public"."invoices" to "authenticated";

grant update on table "public"."invoices" to "authenticated";

grant delete on table "public"."journal_entries" to "authenticated";

grant insert on table "public"."journal_entries" to "authenticated";

grant references on table "public"."journal_entries" to "authenticated";

grant select on table "public"."journal_entries" to "authenticated";

grant trigger on table "public"."journal_entries" to "authenticated";

grant truncate on table "public"."journal_entries" to "authenticated";

grant update on table "public"."journal_entries" to "authenticated";

grant delete on table "public"."journal_lines" to "authenticated";

grant insert on table "public"."journal_lines" to "authenticated";

grant references on table "public"."journal_lines" to "authenticated";

grant select on table "public"."journal_lines" to "authenticated";

grant trigger on table "public"."journal_lines" to "authenticated";

grant truncate on table "public"."journal_lines" to "authenticated";

grant update on table "public"."journal_lines" to "authenticated";

grant delete on table "public"."kyc_profiles" to "authenticated";

grant insert on table "public"."kyc_profiles" to "authenticated";

grant references on table "public"."kyc_profiles" to "authenticated";

grant select on table "public"."kyc_profiles" to "authenticated";

grant trigger on table "public"."kyc_profiles" to "authenticated";

grant truncate on table "public"."kyc_profiles" to "authenticated";

grant update on table "public"."kyc_profiles" to "authenticated";

grant delete on table "public"."leases" to "authenticated";

grant insert on table "public"."leases" to "authenticated";

grant references on table "public"."leases" to "authenticated";

grant select on table "public"."leases" to "authenticated";

grant trigger on table "public"."leases" to "authenticated";

grant truncate on table "public"."leases" to "authenticated";

grant update on table "public"."leases" to "authenticated";

grant delete on table "public"."listing_availabilities" to "authenticated";

grant insert on table "public"."listing_availabilities" to "authenticated";

grant references on table "public"."listing_availabilities" to "authenticated";

grant select on table "public"."listing_availabilities" to "authenticated";

grant trigger on table "public"."listing_availabilities" to "authenticated";

grant truncate on table "public"."listing_availabilities" to "authenticated";

grant update on table "public"."listing_availabilities" to "authenticated";

grant delete on table "public"."listing_pricing" to "authenticated";

grant insert on table "public"."listing_pricing" to "authenticated";

grant references on table "public"."listing_pricing" to "authenticated";

grant select on table "public"."listing_pricing" to "authenticated";

grant trigger on table "public"."listing_pricing" to "authenticated";

grant truncate on table "public"."listing_pricing" to "authenticated";

grant update on table "public"."listing_pricing" to "authenticated";

grant delete on table "public"."listings" to "authenticated";

grant insert on table "public"."listings" to "authenticated";

grant references on table "public"."listings" to "authenticated";

grant select on table "public"."listings" to "authenticated";

grant trigger on table "public"."listings" to "authenticated";

grant truncate on table "public"."listings" to "authenticated";

grant update on table "public"."listings" to "authenticated";

grant delete on table "public"."maintenance_budgets" to "authenticated";

grant insert on table "public"."maintenance_budgets" to "authenticated";

grant references on table "public"."maintenance_budgets" to "authenticated";

grant select on table "public"."maintenance_budgets" to "authenticated";

grant trigger on table "public"."maintenance_budgets" to "authenticated";

grant truncate on table "public"."maintenance_budgets" to "authenticated";

grant update on table "public"."maintenance_budgets" to "authenticated";

grant delete on table "public"."maintenance_insights" to "authenticated";

grant insert on table "public"."maintenance_insights" to "authenticated";

grant references on table "public"."maintenance_insights" to "authenticated";

grant select on table "public"."maintenance_insights" to "authenticated";

grant trigger on table "public"."maintenance_insights" to "authenticated";

grant truncate on table "public"."maintenance_insights" to "authenticated";

grant update on table "public"."maintenance_insights" to "authenticated";

grant delete on table "public"."maintenance_records" to "authenticated";

grant insert on table "public"."maintenance_records" to "authenticated";

grant references on table "public"."maintenance_records" to "authenticated";

grant select on table "public"."maintenance_records" to "authenticated";

grant trigger on table "public"."maintenance_records" to "authenticated";

grant truncate on table "public"."maintenance_records" to "authenticated";

grant update on table "public"."maintenance_records" to "authenticated";

grant delete on table "public"."maintenance_requests" to "authenticated";

grant insert on table "public"."maintenance_requests" to "authenticated";

grant references on table "public"."maintenance_requests" to "authenticated";

grant select on table "public"."maintenance_requests" to "authenticated";

grant trigger on table "public"."maintenance_requests" to "authenticated";

grant truncate on table "public"."maintenance_requests" to "authenticated";

grant update on table "public"."maintenance_requests" to "authenticated";

grant delete on table "public"."maintenance_schedules" to "authenticated";

grant insert on table "public"."maintenance_schedules" to "authenticated";

grant references on table "public"."maintenance_schedules" to "authenticated";

grant select on table "public"."maintenance_schedules" to "authenticated";

grant trigger on table "public"."maintenance_schedules" to "authenticated";

grant truncate on table "public"."maintenance_schedules" to "authenticated";

grant update on table "public"."maintenance_schedules" to "authenticated";

grant delete on table "public"."message_templates" to "authenticated";

grant insert on table "public"."message_templates" to "authenticated";

grant references on table "public"."message_templates" to "authenticated";

grant select on table "public"."message_templates" to "authenticated";

grant trigger on table "public"."message_templates" to "authenticated";

grant truncate on table "public"."message_templates" to "authenticated";

grant update on table "public"."message_templates" to "authenticated";

grant delete on table "public"."nigerian_banks" to "authenticated";

grant insert on table "public"."nigerian_banks" to "authenticated";

grant references on table "public"."nigerian_banks" to "authenticated";

grant select on table "public"."nigerian_banks" to "authenticated";

grant trigger on table "public"."nigerian_banks" to "authenticated";

grant truncate on table "public"."nigerian_banks" to "authenticated";

grant update on table "public"."nigerian_banks" to "authenticated";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."payment_transactions" to "authenticated";

grant insert on table "public"."payment_transactions" to "authenticated";

grant references on table "public"."payment_transactions" to "authenticated";

grant select on table "public"."payment_transactions" to "authenticated";

grant trigger on table "public"."payment_transactions" to "authenticated";

grant truncate on table "public"."payment_transactions" to "authenticated";

grant update on table "public"."payment_transactions" to "authenticated";

grant delete on table "public"."payments" to "authenticated";

grant insert on table "public"."payments" to "authenticated";

grant references on table "public"."payments" to "authenticated";

grant select on table "public"."payments" to "authenticated";

grant trigger on table "public"."payments" to "authenticated";

grant truncate on table "public"."payments" to "authenticated";

grant update on table "public"."payments" to "authenticated";

grant delete on table "public"."predictive_alerts" to "authenticated";

grant insert on table "public"."predictive_alerts" to "authenticated";

grant references on table "public"."predictive_alerts" to "authenticated";

grant select on table "public"."predictive_alerts" to "authenticated";

grant trigger on table "public"."predictive_alerts" to "authenticated";

grant truncate on table "public"."predictive_alerts" to "authenticated";

grant update on table "public"."predictive_alerts" to "authenticated";

grant delete on table "public"."predictive_maintenance_settings" to "authenticated";

grant insert on table "public"."predictive_maintenance_settings" to "authenticated";

grant references on table "public"."predictive_maintenance_settings" to "authenticated";

grant select on table "public"."predictive_maintenance_settings" to "authenticated";

grant trigger on table "public"."predictive_maintenance_settings" to "authenticated";

grant truncate on table "public"."predictive_maintenance_settings" to "authenticated";

grant update on table "public"."predictive_maintenance_settings" to "authenticated";

grant delete on table "public"."pricing_experiments" to "authenticated";

grant insert on table "public"."pricing_experiments" to "authenticated";

grant references on table "public"."pricing_experiments" to "authenticated";

grant select on table "public"."pricing_experiments" to "authenticated";

grant trigger on table "public"."pricing_experiments" to "authenticated";

grant truncate on table "public"."pricing_experiments" to "authenticated";

grant update on table "public"."pricing_experiments" to "authenticated";

grant delete on table "public"."pricing_rules" to "authenticated";

grant insert on table "public"."pricing_rules" to "authenticated";

grant references on table "public"."pricing_rules" to "authenticated";

grant select on table "public"."pricing_rules" to "authenticated";

grant trigger on table "public"."pricing_rules" to "authenticated";

grant truncate on table "public"."pricing_rules" to "authenticated";

grant update on table "public"."pricing_rules" to "authenticated";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."properties" to "authenticated";

grant insert on table "public"."properties" to "authenticated";

grant references on table "public"."properties" to "authenticated";

grant select on table "public"."properties" to "authenticated";

grant trigger on table "public"."properties" to "authenticated";

grant truncate on table "public"."properties" to "authenticated";

grant update on table "public"."properties" to "authenticated";

grant delete on table "public"."property_interactions" to "authenticated";

grant insert on table "public"."property_interactions" to "authenticated";

grant references on table "public"."property_interactions" to "authenticated";

grant select on table "public"."property_interactions" to "authenticated";

grant trigger on table "public"."property_interactions" to "authenticated";

grant truncate on table "public"."property_interactions" to "authenticated";

grant update on table "public"."property_interactions" to "authenticated";

grant delete on table "public"."property_maintenance_profiles" to "authenticated";

grant insert on table "public"."property_maintenance_profiles" to "authenticated";

grant references on table "public"."property_maintenance_profiles" to "authenticated";

grant select on table "public"."property_maintenance_profiles" to "authenticated";

grant trigger on table "public"."property_maintenance_profiles" to "authenticated";

grant truncate on table "public"."property_maintenance_profiles" to "authenticated";

grant update on table "public"."property_maintenance_profiles" to "authenticated";

grant delete on table "public"."property_tokens" to "authenticated";

grant insert on table "public"."property_tokens" to "authenticated";

grant references on table "public"."property_tokens" to "authenticated";

grant select on table "public"."property_tokens" to "authenticated";

grant trigger on table "public"."property_tokens" to "authenticated";

grant truncate on table "public"."property_tokens" to "authenticated";

grant update on table "public"."property_tokens" to "authenticated";

grant delete on table "public"."property_transfers" to "authenticated";

grant insert on table "public"."property_transfers" to "authenticated";

grant references on table "public"."property_transfers" to "authenticated";

grant select on table "public"."property_transfers" to "authenticated";

grant trigger on table "public"."property_transfers" to "authenticated";

grant truncate on table "public"."property_transfers" to "authenticated";

grant update on table "public"."property_transfers" to "authenticated";

grant delete on table "public"."reconciliation_runs" to "authenticated";

grant insert on table "public"."reconciliation_runs" to "authenticated";

grant references on table "public"."reconciliation_runs" to "authenticated";

grant select on table "public"."reconciliation_runs" to "authenticated";

grant trigger on table "public"."reconciliation_runs" to "authenticated";

grant truncate on table "public"."reconciliation_runs" to "authenticated";

grant update on table "public"."reconciliation_runs" to "authenticated";

grant delete on table "public"."recurring_availability_patterns" to "authenticated";

grant insert on table "public"."recurring_availability_patterns" to "authenticated";

grant references on table "public"."recurring_availability_patterns" to "authenticated";

grant select on table "public"."recurring_availability_patterns" to "authenticated";

grant trigger on table "public"."recurring_availability_patterns" to "authenticated";

grant truncate on table "public"."recurring_availability_patterns" to "authenticated";

grant update on table "public"."recurring_availability_patterns" to "authenticated";

grant delete on table "public"."recurring_payments" to "authenticated";

grant insert on table "public"."recurring_payments" to "authenticated";

grant references on table "public"."recurring_payments" to "authenticated";

grant select on table "public"."recurring_payments" to "authenticated";

grant trigger on table "public"."recurring_payments" to "authenticated";

grant truncate on table "public"."recurring_payments" to "authenticated";

grant update on table "public"."recurring_payments" to "authenticated";

grant delete on table "public"."rental_milestones" to "authenticated";

grant insert on table "public"."rental_milestones" to "authenticated";

grant references on table "public"."rental_milestones" to "authenticated";

grant select on table "public"."rental_milestones" to "authenticated";

grant trigger on table "public"."rental_milestones" to "authenticated";

grant truncate on table "public"."rental_milestones" to "authenticated";

grant update on table "public"."rental_milestones" to "authenticated";

grant delete on table "public"."reviews" to "authenticated";

grant insert on table "public"."reviews" to "authenticated";

grant references on table "public"."reviews" to "authenticated";

grant select on table "public"."reviews" to "authenticated";

grant trigger on table "public"."reviews" to "authenticated";

grant truncate on table "public"."reviews" to "authenticated";

grant update on table "public"."reviews" to "authenticated";

grant delete on table "public"."sensor_readings" to "authenticated";

grant insert on table "public"."sensor_readings" to "authenticated";

grant references on table "public"."sensor_readings" to "authenticated";

grant select on table "public"."sensor_readings" to "authenticated";

grant trigger on table "public"."sensor_readings" to "authenticated";

grant truncate on table "public"."sensor_readings" to "authenticated";

grant update on table "public"."sensor_readings" to "authenticated";

grant delete on table "public"."smart_recommendations" to "authenticated";

grant insert on table "public"."smart_recommendations" to "authenticated";

grant references on table "public"."smart_recommendations" to "authenticated";

grant select on table "public"."smart_recommendations" to "authenticated";

grant trigger on table "public"."smart_recommendations" to "authenticated";

grant truncate on table "public"."smart_recommendations" to "authenticated";

grant update on table "public"."smart_recommendations" to "authenticated";

grant delete on table "public"."subscription_events" to "authenticated";

grant insert on table "public"."subscription_events" to "authenticated";

grant references on table "public"."subscription_events" to "authenticated";

grant select on table "public"."subscription_events" to "authenticated";

grant trigger on table "public"."subscription_events" to "authenticated";

grant truncate on table "public"."subscription_events" to "authenticated";

grant update on table "public"."subscription_events" to "authenticated";

grant delete on table "public"."subscription_plans" to "authenticated";

grant insert on table "public"."subscription_plans" to "authenticated";

grant references on table "public"."subscription_plans" to "authenticated";

grant select on table "public"."subscription_plans" to "authenticated";

grant trigger on table "public"."subscription_plans" to "authenticated";

grant truncate on table "public"."subscription_plans" to "authenticated";

grant update on table "public"."subscription_plans" to "authenticated";

grant delete on table "public"."subscriptions" to "authenticated";

grant insert on table "public"."subscriptions" to "authenticated";

grant references on table "public"."subscriptions" to "authenticated";

grant select on table "public"."subscriptions" to "authenticated";

grant trigger on table "public"."subscriptions" to "authenticated";

grant truncate on table "public"."subscriptions" to "authenticated";

grant update on table "public"."subscriptions" to "authenticated";

grant delete on table "public"."tenancies" to "authenticated";

grant insert on table "public"."tenancies" to "authenticated";

grant references on table "public"."tenancies" to "authenticated";

grant select on table "public"."tenancies" to "authenticated";

grant trigger on table "public"."tenancies" to "authenticated";

grant truncate on table "public"."tenancies" to "authenticated";

grant update on table "public"."tenancies" to "authenticated";

grant delete on table "public"."tenant_screenings" to "authenticated";

grant insert on table "public"."tenant_screenings" to "authenticated";

grant references on table "public"."tenant_screenings" to "authenticated";

grant select on table "public"."tenant_screenings" to "authenticated";

grant trigger on table "public"."tenant_screenings" to "authenticated";

grant truncate on table "public"."tenant_screenings" to "authenticated";

grant update on table "public"."tenant_screenings" to "authenticated";

grant delete on table "public"."tenants" to "authenticated";

grant insert on table "public"."tenants" to "authenticated";

grant references on table "public"."tenants" to "authenticated";

grant select on table "public"."tenants" to "authenticated";

grant trigger on table "public"."tenants" to "authenticated";

grant truncate on table "public"."tenants" to "authenticated";

grant update on table "public"."tenants" to "authenticated";

grant delete on table "public"."transactions" to "authenticated";

grant insert on table "public"."transactions" to "authenticated";

grant references on table "public"."transactions" to "authenticated";

grant select on table "public"."transactions" to "authenticated";

grant trigger on table "public"."transactions" to "authenticated";

grant truncate on table "public"."transactions" to "authenticated";

grant update on table "public"."transactions" to "authenticated";

grant delete on table "public"."units" to "authenticated";

grant insert on table "public"."units" to "authenticated";

grant references on table "public"."units" to "authenticated";

grant select on table "public"."units" to "authenticated";

grant trigger on table "public"."units" to "authenticated";

grant truncate on table "public"."units" to "authenticated";

grant update on table "public"."units" to "authenticated";

grant delete on table "public"."usage_history" to "authenticated";

grant insert on table "public"."usage_history" to "authenticated";

grant references on table "public"."usage_history" to "authenticated";

grant select on table "public"."usage_history" to "authenticated";

grant trigger on table "public"."usage_history" to "authenticated";

grant truncate on table "public"."usage_history" to "authenticated";

grant update on table "public"."usage_history" to "authenticated";

grant delete on table "public"."user_preferences" to "authenticated";

grant insert on table "public"."user_preferences" to "authenticated";

grant references on table "public"."user_preferences" to "authenticated";

grant select on table "public"."user_preferences" to "authenticated";

grant trigger on table "public"."user_preferences" to "authenticated";

grant truncate on table "public"."user_preferences" to "authenticated";

grant update on table "public"."user_preferences" to "authenticated";

grant delete on table "public"."user_roles" to "authenticated";

grant insert on table "public"."user_roles" to "authenticated";

grant references on table "public"."user_roles" to "authenticated";

grant select on table "public"."user_roles" to "authenticated";

grant trigger on table "public"."user_roles" to "authenticated";

grant truncate on table "public"."user_roles" to "authenticated";

grant update on table "public"."user_roles" to "authenticated";

grant delete on table "public"."user_roles" to "service_role";

grant insert on table "public"."user_roles" to "service_role";

grant references on table "public"."user_roles" to "service_role";

grant select on table "public"."user_roles" to "service_role";

grant trigger on table "public"."user_roles" to "service_role";

grant truncate on table "public"."user_roles" to "service_role";

grant update on table "public"."user_roles" to "service_role";

grant delete on table "public"."user_subscriptions" to "authenticated";

grant insert on table "public"."user_subscriptions" to "authenticated";

grant references on table "public"."user_subscriptions" to "authenticated";

grant select on table "public"."user_subscriptions" to "authenticated";

grant trigger on table "public"."user_subscriptions" to "authenticated";

grant truncate on table "public"."user_subscriptions" to "authenticated";

grant update on table "public"."user_subscriptions" to "authenticated";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."verification_records" to "authenticated";

grant insert on table "public"."verification_records" to "authenticated";

grant references on table "public"."verification_records" to "authenticated";

grant select on table "public"."verification_records" to "authenticated";

grant trigger on table "public"."verification_records" to "authenticated";

grant truncate on table "public"."verification_records" to "authenticated";

grant update on table "public"."verification_records" to "authenticated";

grant delete on table "public"."viewings" to "authenticated";

grant insert on table "public"."viewings" to "authenticated";

grant references on table "public"."viewings" to "authenticated";

grant select on table "public"."viewings" to "authenticated";

grant trigger on table "public"."viewings" to "authenticated";

grant truncate on table "public"."viewings" to "authenticated";

grant update on table "public"."viewings" to "authenticated";

grant delete on table "public"."voice_assistant_analytics" to "authenticated";

grant insert on table "public"."voice_assistant_analytics" to "authenticated";

grant references on table "public"."voice_assistant_analytics" to "authenticated";

grant select on table "public"."voice_assistant_analytics" to "authenticated";

grant trigger on table "public"."voice_assistant_analytics" to "authenticated";

grant truncate on table "public"."voice_assistant_analytics" to "authenticated";

grant update on table "public"."voice_assistant_analytics" to "authenticated";

grant delete on table "public"."voice_assistant_settings" to "authenticated";

grant insert on table "public"."voice_assistant_settings" to "authenticated";

grant references on table "public"."voice_assistant_settings" to "authenticated";

grant select on table "public"."voice_assistant_settings" to "authenticated";

grant trigger on table "public"."voice_assistant_settings" to "authenticated";

grant truncate on table "public"."voice_assistant_settings" to "authenticated";

grant update on table "public"."voice_assistant_settings" to "authenticated";

grant delete on table "public"."voice_command_history" to "authenticated";

grant insert on table "public"."voice_command_history" to "authenticated";

grant references on table "public"."voice_command_history" to "authenticated";

grant select on table "public"."voice_command_history" to "authenticated";

grant trigger on table "public"."voice_command_history" to "authenticated";

grant truncate on table "public"."voice_command_history" to "authenticated";

grant update on table "public"."voice_command_history" to "authenticated";

grant delete on table "public"."voice_commands" to "authenticated";

grant insert on table "public"."voice_commands" to "authenticated";

grant references on table "public"."voice_commands" to "authenticated";

grant select on table "public"."voice_commands" to "authenticated";

grant trigger on table "public"."voice_commands" to "authenticated";

grant truncate on table "public"."voice_commands" to "authenticated";

grant update on table "public"."voice_commands" to "authenticated";

grant delete on table "public"."voice_sessions" to "authenticated";

grant insert on table "public"."voice_sessions" to "authenticated";

grant references on table "public"."voice_sessions" to "authenticated";

grant select on table "public"."voice_sessions" to "authenticated";

grant trigger on table "public"."voice_sessions" to "authenticated";

grant truncate on table "public"."voice_sessions" to "authenticated";

grant update on table "public"."voice_sessions" to "authenticated";

grant delete on table "public"."wallets" to "authenticated";

grant insert on table "public"."wallets" to "authenticated";

grant references on table "public"."wallets" to "authenticated";

grant select on table "public"."wallets" to "authenticated";

grant trigger on table "public"."wallets" to "authenticated";

grant truncate on table "public"."wallets" to "authenticated";

grant update on table "public"."wallets" to "authenticated";

grant delete on table "public"."webhook_events" to "authenticated";

grant insert on table "public"."webhook_events" to "authenticated";

grant references on table "public"."webhook_events" to "authenticated";

grant select on table "public"."webhook_events" to "authenticated";

grant trigger on table "public"."webhook_events" to "authenticated";

grant truncate on table "public"."webhook_events" to "authenticated";

grant update on table "public"."webhook_events" to "authenticated";

grant delete on table "public"."white_label_configs" to "authenticated";

grant insert on table "public"."white_label_configs" to "authenticated";

grant references on table "public"."white_label_configs" to "authenticated";

grant select on table "public"."white_label_configs" to "authenticated";

grant trigger on table "public"."white_label_configs" to "authenticated";

grant truncate on table "public"."white_label_configs" to "authenticated";

grant update on table "public"."white_label_configs" to "authenticated";


  create policy "Admins can manage accounting config"
  on "public"."accounting_config"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['super_admin'::text, 'admin'::text]))))));



  create policy "Authenticated can read accounting config"
  on "public"."accounting_config"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Admins can delete agent records"
  on "public"."agents"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));



  create policy "Users can create their own agent record"
  on "public"."agents"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "Users can update agent records"
  on "public"."agents"
  as permissive
  for update
  to authenticated
using (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))))
with check (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))));



  create policy "Users can view agent records"
  on "public"."agents"
  as permissive
  for select
  to authenticated
using (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))));



  create policy "Only admins can manage API provider configs"
  on "public"."api_provider_configs"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "System can insert API usage logs"
  on "public"."api_usage_logs"
  as permissive
  for insert
  to public
with check (true);



  create policy "Users can view their own API usage logs"
  on "public"."api_usage_logs"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert their own payments"
  on "public"."blockchain_payments"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can view their own payments"
  on "public"."blockchain_payments"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert their own transactions"
  on "public"."blockchain_transactions"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update their own transactions"
  on "public"."blockchain_transactions"
  as permissive
  for update
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Users can view their own transactions"
  on "public"."blockchain_transactions"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert their own wallets"
  on "public"."blockchain_wallets"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update their own wallets"
  on "public"."blockchain_wallets"
  as permissive
  for update
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Users can view their own wallets"
  on "public"."blockchain_wallets"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Admins can manage all bookings"
  on "public"."bookings"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::text)))));



  create policy "Guests can cancel their own bookings"
  on "public"."bookings"
  as permissive
  for update
  to public
using (((guest_id = auth.uid()) AND (status = ANY (ARRAY['pending'::text, 'confirmed'::text]))))
with check ((status = 'cancelled'::text));



  create policy "Guests can create bookings"
  on "public"."bookings"
  as permissive
  for insert
  to public
with check ((guest_id = auth.uid()));



  create policy "Guests can view their bookings"
  on "public"."bookings"
  as permissive
  for select
  to public
using ((((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = bookings.guest_id) AND (p.id = auth.uid()))))) OR ((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM (public.listings l
     JOIN public.properties prop ON ((prop.id = l.property_id)))
  WHERE ((l.id = bookings.listing_id) AND (prop.owner_id = auth.uid()))))) OR ((EXISTS ( SELECT 1
   FROM information_schema.routines
  WHERE (((routines.routine_schema)::name = 'public'::name) AND ((routines.routine_name)::name = 'is_admin'::name)))) AND public.is_admin(auth.uid()))));



  create policy "Guests can view their own bookings"
  on "public"."bookings"
  as permissive
  for select
  to public
using ((guest_id = auth.uid()));



  create policy "Owners can update bookings for their listings"
  on "public"."bookings"
  as permissive
  for update
  to public
using ((owner_id = auth.uid()));



  create policy "Owners can view bookings for their listings"
  on "public"."bookings"
  as permissive
  for select
  to public
using ((owner_id = auth.uid()));



  create policy "Owners can manage channel integrations"
  on "public"."channel_manager_integrations"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM (public.listings l
     JOIN public.properties p ON ((l.property_id = p.id)))
  WHERE ((l.id = channel_manager_integrations.listing_id) AND (p.owner_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM (public.listings l
     JOIN public.properties p ON ((l.property_id = p.id)))
  WHERE ((l.id = channel_manager_integrations.listing_id) AND (p.owner_id = auth.uid())))));



  create policy "Owners can view sync logs"
  on "public"."channel_sync_logs"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM ((public.channel_manager_integrations ci
     JOIN public.listings l ON ((ci.listing_id = l.id)))
     JOIN public.properties p ON ((l.property_id = p.id)))
  WHERE ((ci.id = channel_sync_logs.integration_id) AND (p.owner_id = auth.uid())))));



  create policy "Admins can update contact submissions"
  on "public"."contact_submissions"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));



  create policy "Anyone can submit contact forms"
  on "public"."contact_submissions"
  as permissive
  for insert
  to authenticated, anon
with check (true);



  create policy "Authenticated users can view contact submissions"
  on "public"."contact_submissions"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Users can insert classifications for their documents"
  on "public"."document_classifications"
  as permissive
  for insert
  to public
with check ((document_id IN ( SELECT document_metadata.id
   FROM public.document_metadata
  WHERE (document_metadata.user_id = auth.uid()))));



  create policy "Users can view classifications of their documents"
  on "public"."document_classifications"
  as permissive
  for select
  to public
using ((document_id IN ( SELECT document_metadata.id
   FROM public.document_metadata
  WHERE (document_metadata.user_id = auth.uid()))));



  create policy "Users can insert extractions for their documents"
  on "public"."document_extractions"
  as permissive
  for insert
  to public
with check ((document_id IN ( SELECT document_metadata.id
   FROM public.document_metadata
  WHERE (document_metadata.user_id = auth.uid()))));



  create policy "Users can view extractions of their documents"
  on "public"."document_extractions"
  as permissive
  for select
  to public
using ((document_id IN ( SELECT document_metadata.id
   FROM public.document_metadata
  WHERE (document_metadata.user_id = auth.uid()))));



  create policy "Users can insert their own documents"
  on "public"."document_hashes"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can view their own documents"
  on "public"."document_hashes"
  as permissive
  for select
  to public
using (((auth.uid() = user_id) OR (public_access = true) OR ((auth.uid())::text = ANY (authorized_users))));



  create policy "Admin can view all insights"
  on "public"."document_insights"
  as permissive
  for select
  to public
using ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.raw_user_meta_data ->> 'role'::text) = 'admin'::text))));



  create policy "Property owners can view property documents"
  on "public"."document_metadata"
  as permissive
  for select
  to public
using ((property_id IN ( SELECT properties.id
   FROM public.properties
  WHERE (properties.owner_id = auth.uid()))));



  create policy "Users can delete their own documents"
  on "public"."document_metadata"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert their own documents"
  on "public"."document_metadata"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update their own documents"
  on "public"."document_metadata"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view their own documents"
  on "public"."document_metadata"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can manage their own settings"
  on "public"."document_processing_settings"
  as permissive
  for all
  to public
using ((user_id = auth.uid()));



  create policy "Users can manage their own templates"
  on "public"."document_templates"
  as permissive
  for all
  to public
using ((created_by = auth.uid()));



  create policy "Users can view public templates"
  on "public"."document_templates"
  as permissive
  for select
  to public
using ((is_active = true));



  create policy "Users can insert validations for their documents"
  on "public"."document_validations"
  as permissive
  for insert
  to public
with check ((document_id IN ( SELECT document_metadata.id
   FROM public.document_metadata
  WHERE (document_metadata.user_id = auth.uid()))));



  create policy "Users can view validations of their documents"
  on "public"."document_validations"
  as permissive
  for select
  to public
using ((document_id IN ( SELECT document_metadata.id
   FROM public.document_metadata
  WHERE (document_metadata.user_id = auth.uid()))));



  create policy "Users can manage workflows for their documents"
  on "public"."document_workflows"
  as permissive
  for all
  to public
using (((document_id IN ( SELECT document_metadata.id
   FROM public.document_metadata
  WHERE (document_metadata.user_id = auth.uid()))) OR (assigned_to = auth.uid())));



  create policy "Users can view workflows of their documents"
  on "public"."document_workflows"
  as permissive
  for select
  to public
using (((document_id IN ( SELECT document_metadata.id
   FROM public.document_metadata
  WHERE (document_metadata.user_id = auth.uid()))) OR (assigned_to = auth.uid())));



  create policy "Users can delete equipment for their properties"
  on "public"."equipment_data"
  as permissive
  for delete
  to public
using ((property_id IN ( SELECT properties.id
   FROM public.properties
  WHERE (properties.owner_id = auth.uid()))));



  create policy "Users can insert equipment for their properties"
  on "public"."equipment_data"
  as permissive
  for insert
  to public
with check ((property_id IN ( SELECT properties.id
   FROM public.properties
  WHERE (properties.owner_id = auth.uid()))));



  create policy "Users can update equipment for their properties"
  on "public"."equipment_data"
  as permissive
  for update
  to public
using ((property_id IN ( SELECT properties.id
   FROM public.properties
  WHERE (properties.owner_id = auth.uid()))));



  create policy "Users can view equipment for their properties"
  on "public"."equipment_data"
  as permissive
  for select
  to public
using ((property_id IN ( SELECT properties.id
   FROM public.properties
  WHERE (properties.owner_id = auth.uid()))));



  create policy "Escrow participants can view contracts"
  on "public"."escrow_contracts"
  as permissive
  for select
  to public
using ((((buyer_address)::text IN ( SELECT blockchain_wallets.wallet_address
   FROM public.blockchain_wallets
  WHERE (blockchain_wallets.user_id = auth.uid()))) OR ((seller_address)::text IN ( SELECT blockchain_wallets.wallet_address
   FROM public.blockchain_wallets
  WHERE (blockchain_wallets.user_id = auth.uid()))) OR (property_id IN ( SELECT properties.id
   FROM public.properties
  WHERE (properties.owner_id = auth.uid())))));



  create policy "System can track feature usage"
  on "public"."feature_usage_tracking"
  as permissive
  for insert
  to public
with check (true);



  create policy "System can update feature usage"
  on "public"."feature_usage_tracking"
  as permissive
  for update
  to public
using (true);



  create policy "Users can view their own feature usage"
  on "public"."feature_usage_tracking"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Owners can view documents for their bookings"
  on "public"."guest_documents"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.bookings
  WHERE ((bookings.id = guest_documents.booking_id) AND (bookings.owner_id = auth.uid())))));



  create policy "Users can upload their own documents"
  on "public"."guest_documents"
  as permissive
  for insert
  to public
with check ((user_id = auth.uid()));



  create policy "Users can view their own documents"
  on "public"."guest_documents"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "Users can insert their own credentials"
  on "public"."identity_credentials"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can view their own credentials"
  on "public"."identity_credentials"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "System can create invoices"
  on "public"."invoices"
  as permissive
  for insert
  to public
with check (true);



  create policy "System can update invoices"
  on "public"."invoices"
  as permissive
  for update
  to public
using (true);



  create policy "Users can view their own invoices"
  on "public"."invoices"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Admins can manage journal entries"
  on "public"."journal_entries"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['super_admin'::text, 'admin'::text]))))));



  create policy "Users can insert their own KYC profile"
  on "public"."kyc_profiles"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update their own KYC profile"
  on "public"."kyc_profiles"
  as permissive
  for update
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Users can view their own KYC profile"
  on "public"."kyc_profiles"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Tenants can view their leases"
  on "public"."leases"
  as permissive
  for select
  to public
using ((public.is_admin(auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.tenants t
  WHERE ((t.id = leases.tenant_id) AND (t.user_id = auth.uid()))))));



  create policy "Owners can manage availabilities for their listings"
  on "public"."listing_availabilities"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM (public.listings
     JOIN public.properties ON ((properties.id = listings.property_id)))
  WHERE ((listings.id = listing_availabilities.listing_id) AND (properties.owner_id = auth.uid())))));



  create policy "Owners can view their own availabilities"
  on "public"."listing_availabilities"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM (public.listings
     JOIN public.properties ON ((properties.id = listings.property_id)))
  WHERE ((listings.id = listing_availabilities.listing_id) AND (properties.owner_id = auth.uid())))));



  create policy "Public can view availabilities for active listings"
  on "public"."listing_availabilities"
  as permissive
  for select
  to public
using (((EXISTS ( SELECT 1
   FROM public.listings
  WHERE ((listings.id = listing_availabilities.listing_id) AND (listings.active = true)))) AND ((auth.uid() IS NULL) OR (NOT (EXISTS ( SELECT 1
   FROM public.properties
  WHERE (properties.owner_id = auth.uid())))))));



  create policy "Owners can manage pricing"
  on "public"."listing_pricing"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM (public.listings l
     JOIN public.properties p ON ((l.property_id = p.id)))
  WHERE ((l.id = listing_pricing.listing_id) AND (p.owner_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM (public.listings l
     JOIN public.properties p ON ((l.property_id = p.id)))
  WHERE ((l.id = listing_pricing.listing_id) AND (p.owner_id = auth.uid())))));



  create policy "Owners can view their own pricing"
  on "public"."listing_pricing"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM (public.listings l
     JOIN public.properties p ON ((l.property_id = p.id)))
  WHERE ((l.id = listing_pricing.listing_id) AND (p.owner_id = auth.uid())))));



  create policy "Public can view pricing for active listings"
  on "public"."listing_pricing"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.listings l
  WHERE ((l.id = listing_pricing.listing_id) AND (l.active = true) AND ((auth.uid() IS NULL) OR (NOT (EXISTS ( SELECT 1
           FROM public.properties
          WHERE (properties.owner_id = auth.uid())))))))));



  create policy "Admins can view all listings"
  on "public"."listings"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::text)))));



  create policy "Owners can create listings for their properties"
  on "public"."listings"
  as permissive
  for insert
  to public
with check (((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'owner'::text)))) AND (EXISTS ( SELECT 1
   FROM public.properties p
  WHERE ((p.id = listings.property_id) AND (p.owner_id = auth.uid()))))));



  create policy "Owners can delete their own listings"
  on "public"."listings"
  as permissive
  for delete
  to public
using (((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'owner'::text)))) AND (EXISTS ( SELECT 1
   FROM public.properties p
  WHERE ((p.id = listings.property_id) AND (p.owner_id = auth.uid()))))));



  create policy "Owners can update their own listings"
  on "public"."listings"
  as permissive
  for update
  to public
using (((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'owner'::text)))) AND (EXISTS ( SELECT 1
   FROM public.properties p
  WHERE ((p.id = listings.property_id) AND (p.owner_id = auth.uid()))))))
with check (((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'owner'::text)))) AND (EXISTS ( SELECT 1
   FROM public.properties p
  WHERE ((p.id = listings.property_id) AND (p.owner_id = auth.uid()))))));



  create policy "Owners can view their own listings"
  on "public"."listings"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = listings.property_id) AND (properties.owner_id = auth.uid())))));



  create policy "Public can view active listings"
  on "public"."listings"
  as permissive
  for select
  to public
using (((active = true) AND ((auth.uid() IS NULL) OR (NOT (EXISTS ( SELECT 1
   FROM public.properties
  WHERE (properties.owner_id = auth.uid())))))));



  create policy "Tenants can view listings and their bookings"
  on "public"."listings"
  as permissive
  for select
  to public
using ((((auth.uid() IS NULL) AND (active = true)) OR ((auth.uid() IS NOT NULL) AND (active = true)) OR ((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM (public.bookings b
     JOIN public.profiles p ON ((p.id = b.guest_id)))
  WHERE ((b.listing_id = listings.id) AND (p.id = auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM public.properties prop
  WHERE ((prop.id = listings.property_id) AND (prop.owner_id = auth.uid())))) OR ((EXISTS ( SELECT 1
   FROM information_schema.routines
  WHERE (((routines.routine_schema)::name = 'public'::name) AND ((routines.routine_name)::name = 'is_admin'::name)))) AND public.is_admin(auth.uid()))));



  create policy "Users can manage maintenance budgets for their properties"
  on "public"."maintenance_budgets"
  as permissive
  for all
  to public
using ((property_id IN ( SELECT properties.id
   FROM public.properties
  WHERE (properties.owner_id = auth.uid()))));



  create policy "Users can view maintenance insights for their properties"
  on "public"."maintenance_insights"
  as permissive
  for select
  to public
using ((property_id IN ( SELECT properties.id
   FROM public.properties
  WHERE (properties.owner_id = auth.uid()))));



  create policy "Users can insert maintenance records for their properties"
  on "public"."maintenance_records"
  as permissive
  for insert
  to public
with check ((property_id IN ( SELECT properties.id
   FROM public.properties
  WHERE (properties.owner_id = auth.uid()))));



  create policy "Users can view maintenance records for their properties"
  on "public"."maintenance_records"
  as permissive
  for select
  to public
using ((property_id IN ( SELECT properties.id
   FROM public.properties
  WHERE (properties.owner_id = auth.uid()))));



  create policy "Admins can delete maintenance requests"
  on "public"."maintenance_requests"
  as permissive
  for delete
  to public
using (public.is_admin(auth.uid()));



  create policy "Owners, agents, and admins can update requests"
  on "public"."maintenance_requests"
  as permissive
  for update
  to public
using ((public.is_admin(auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = maintenance_requests.property_id) AND ((properties.owner_id = auth.uid()) OR (properties.agent_id = auth.uid())))))));



  create policy "Tenants can create their own maintenance requests"
  on "public"."maintenance_requests"
  as permissive
  for insert
  to public
with check (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'tenant'::text))))));



  create policy "Users can view maintenance requests based on their role"
  on "public"."maintenance_requests"
  as permissive
  for select
  to public
using ((public.is_admin(auth.uid()) OR (user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = maintenance_requests.property_id) AND (properties.owner_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = maintenance_requests.property_id) AND (properties.agent_id = auth.uid()))))));



  create policy "Users can manage maintenance schedules for their properties"
  on "public"."maintenance_schedules"
  as permissive
  for all
  to public
using ((property_id IN ( SELECT properties.id
   FROM public.properties
  WHERE (properties.owner_id = auth.uid()))));



  create policy "Allow admin to manage message templates"
  on "public"."message_templates"
  as permissive
  for all
  to public
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));



  create policy "Allow public read access to message templates"
  on "public"."message_templates"
  as permissive
  for select
  to public
using (true);



  create policy "Anyone can view Nigerian banks"
  on "public"."nigerian_banks"
  as permissive
  for select
  to public
using (true);



  create policy "Only admins can manage Nigerian banks"
  on "public"."nigerian_banks"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Only admins can update Nigerian banks"
  on "public"."nigerian_banks"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Allow service roles to insert notifications"
  on "public"."notifications"
  as permissive
  for insert
  to public
with check (true);



  create policy "Users can update their own notifications"
  on "public"."notifications"
  as permissive
  for update
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Users can view their own notifications"
  on "public"."notifications"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "System can manage transactions"
  on "public"."payment_transactions"
  as permissive
  for all
  to public
using (true);



  create policy "Users can view their own transactions"
  on "public"."payment_transactions"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can update predictive alerts for their properties"
  on "public"."predictive_alerts"
  as permissive
  for update
  to public
using ((property_id IN ( SELECT properties.id
   FROM public.properties
  WHERE (properties.owner_id = auth.uid()))));



  create policy "Users can view predictive alerts for their properties"
  on "public"."predictive_alerts"
  as permissive
  for select
  to public
using ((property_id IN ( SELECT properties.id
   FROM public.properties
  WHERE (properties.owner_id = auth.uid()))));



  create policy "Users can manage predictive maintenance settings for their prop"
  on "public"."predictive_maintenance_settings"
  as permissive
  for all
  to public
using ((property_id IN ( SELECT properties.id
   FROM public.properties
  WHERE (properties.owner_id = auth.uid()))));



  create policy "Admins can manage pricing experiments"
  on "public"."pricing_experiments"
  as permissive
  for all
  to public
using ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.raw_user_meta_data ->> 'role'::text) = 'admin'::text))));



  create policy "Owners can manage pricing rules"
  on "public"."pricing_rules"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM (public.listings l
     JOIN public.properties p ON ((l.property_id = p.id)))
  WHERE ((l.id = pricing_rules.listing_id) AND (p.owner_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM (public.listings l
     JOIN public.properties p ON ((l.property_id = p.id)))
  WHERE ((l.id = pricing_rules.listing_id) AND (p.owner_id = auth.uid())))));



  create policy "Owners can view their own pricing rules"
  on "public"."pricing_rules"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM (public.listings l
     JOIN public.properties p ON ((l.property_id = p.id)))
  WHERE ((l.id = pricing_rules.listing_id) AND (p.owner_id = auth.uid())))));



  create policy "Public can view pricing rules for active listings"
  on "public"."pricing_rules"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.listings l
  WHERE ((l.id = pricing_rules.listing_id) AND (l.active = true) AND (pricing_rules.active = true) AND ((auth.uid() IS NULL) OR (NOT (EXISTS ( SELECT 1
           FROM public.properties
          WHERE (properties.owner_id = auth.uid())))))))));



  create policy "Admins can delete profiles"
  on "public"."profiles"
  as permissive
  for delete
  to authenticated
using (public.is_admin(auth.uid()));



  create policy "Authenticated users can create profiles"
  on "public"."profiles"
  as permissive
  for insert
  to authenticated
with check ((public.is_admin(auth.uid()) OR (auth.uid() = id)));



  create policy "Users can update profiles"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using (((auth.uid() = id) OR public.is_admin(auth.uid())))
with check (((auth.uid() = id) OR public.is_admin(auth.uid())));



  create policy "Users can view profiles"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using (((auth.uid() = id) OR public.is_admin(auth.uid())));



  create policy "Users, owners, and admins can view profiles"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using (((auth.uid() = id) OR public.is_admin(auth.uid()) OR (public.is_owner() AND public.is_agent(id))));



  create policy "Authenticated users can view properties"
  on "public"."properties"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Owners can create properties"
  on "public"."properties"
  as permissive
  for insert
  to public
with check (((owner_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['owner'::text, 'admin'::text])))))));



  create policy "Owners can view their own properties"
  on "public"."properties"
  as permissive
  for select
  to public
using ((owner_id = auth.uid()));



  create policy "Owners or admins can delete properties"
  on "public"."properties"
  as permissive
  for delete
  to public
using (((auth.uid() = owner_id) OR public.is_admin(auth.uid())));



  create policy "Owners or assigned agents can update properties"
  on "public"."properties"
  as permissive
  for update
  to public
using (((auth.uid() = owner_id) OR (auth.uid() = agent_id) OR public.is_admin(auth.uid())))
with check (((auth.uid() = owner_id) OR (auth.uid() = agent_id) OR public.is_admin(auth.uid())));



  create policy "Properties are viewable by everyone"
  on "public"."properties"
  as permissive
  for select
  to public
using (true);



  create policy "Public can view properties"
  on "public"."properties"
  as permissive
  for select
  to public
using (((auth.uid() IS NULL) OR ((auth.uid() IS NOT NULL) AND ((owner_id IS NULL) OR (owner_id <> auth.uid())))));



  create policy "Tenants can view their properties and available properties"
  on "public"."properties"
  as permissive
  for select
  to public
using ((((auth.uid() IS NULL) AND ((status IS NULL) OR (lower(status) = 'available'::text))) OR ((auth.uid() IS NOT NULL) AND ((status IS NULL) OR (lower(status) = 'available'::text)) AND ((owner_id IS NULL) OR (owner_id <> auth.uid()))) OR ((auth.uid() IS NOT NULL) AND public.has_active_lease_for_property(id, auth.uid())) OR ((EXISTS ( SELECT 1
   FROM information_schema.routines
  WHERE (((routines.routine_schema)::name = 'public'::name) AND ((routines.routine_name)::name = 'is_admin'::name)))) AND public.is_admin(auth.uid()))));



  create policy "Property owners can view interactions on their properties"
  on "public"."property_interactions"
  as permissive
  for select
  to public
using (((EXISTS ( SELECT 1
   FROM public.properties p
  WHERE ((p.id = property_interactions.property_id) AND (p.owner_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::text, 'manager'::text])))))));



  create policy "Users can insert their own interactions"
  on "public"."property_interactions"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can view their own interactions"
  on "public"."property_interactions"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can manage maintenance profiles for their properties"
  on "public"."property_maintenance_profiles"
  as permissive
  for all
  to public
using ((property_id IN ( SELECT properties.id
   FROM public.properties
  WHERE (properties.owner_id = auth.uid()))));



  create policy "Property owners can insert tokens for their properties"
  on "public"."property_tokens"
  as permissive
  for insert
  to public
with check ((property_id IN ( SELECT properties.id
   FROM public.properties
  WHERE (properties.owner_id = auth.uid()))));



  create policy "Property owners can view their tokens"
  on "public"."property_tokens"
  as permissive
  for select
  to public
using ((property_id IN ( SELECT properties.id
   FROM public.properties
  WHERE (properties.owner_id = auth.uid()))));



  create policy "Admins can manage reconciliation runs"
  on "public"."reconciliation_runs"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['super_admin'::text, 'admin'::text]))))));



  create policy "Owners can manage patterns"
  on "public"."recurring_availability_patterns"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM (public.listings l
     JOIN public.properties p ON ((l.property_id = p.id)))
  WHERE ((l.id = recurring_availability_patterns.listing_id) AND (p.owner_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM (public.listings l
     JOIN public.properties p ON ((l.property_id = p.id)))
  WHERE ((l.id = recurring_availability_patterns.listing_id) AND (p.owner_id = auth.uid())))));



  create policy "Owners can view their own patterns"
  on "public"."recurring_availability_patterns"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM (public.listings l
     JOIN public.properties p ON ((l.property_id = p.id)))
  WHERE ((l.id = recurring_availability_patterns.listing_id) AND (p.owner_id = auth.uid())))));



  create policy "Public can view patterns for active listings"
  on "public"."recurring_availability_patterns"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.listings l
  WHERE ((l.id = recurring_availability_patterns.listing_id) AND (l.active = true) AND (recurring_availability_patterns.active = true) AND ((auth.uid() IS NULL) OR (NOT (EXISTS ( SELECT 1
           FROM public.properties
          WHERE (properties.owner_id = auth.uid())))))))));



  create policy "Allow admins and owners to manage milestones"
  on "public"."rental_milestones"
  as permissive
  for all
  to public
using ((public.is_admin(auth.uid()) OR (auth.uid() = ( SELECT properties.owner_id
   FROM public.properties
  WHERE (properties.id = rental_milestones.property_id)))))
with check ((public.is_admin(auth.uid()) OR (auth.uid() = ( SELECT properties.owner_id
   FROM public.properties
  WHERE (properties.id = rental_milestones.property_id)))));



  create policy "Allow admins to see all milestones"
  on "public"."rental_milestones"
  as permissive
  for select
  to public
using (public.is_admin(auth.uid()));



  create policy "Allow property owners to see milestones for their properties"
  on "public"."rental_milestones"
  as permissive
  for select
  to public
using ((auth.uid() = ( SELECT properties.owner_id
   FROM public.properties
  WHERE (properties.id = rental_milestones.property_id))));



  create policy "Allow tenants to see their own milestones"
  on "public"."rental_milestones"
  as permissive
  for select
  to public
using ((auth.uid() = ( SELECT tenants.user_id
   FROM public.tenants
  WHERE (tenants.id = rental_milestones.tenant_id))));



  create policy "Public can view reviews"
  on "public"."reviews"
  as permissive
  for select
  to public
using (true);



  create policy "Reviewers can update their own reviews"
  on "public"."reviews"
  as permissive
  for update
  to public
using ((reviewer_id = auth.uid()));



  create policy "Users can create reviews for their bookings"
  on "public"."reviews"
  as permissive
  for insert
  to public
with check (((reviewer_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.bookings
  WHERE ((bookings.id = reviews.booking_id) AND ((bookings.guest_id = auth.uid()) OR (bookings.owner_id = auth.uid())) AND (bookings.status = 'completed'::text))))));



  create policy "Users can view sensor readings for their equipment"
  on "public"."sensor_readings"
  as permissive
  for select
  to public
using ((equipment_id IN ( SELECT ed.id
   FROM (public.equipment_data ed
     JOIN public.properties p ON ((ed.property_id = p.id)))
  WHERE (p.owner_id = auth.uid()))));



  create policy "System can insert recommendations"
  on "public"."smart_recommendations"
  as permissive
  for insert
  to public
with check (true);



  create policy "Users can update their own recommendations"
  on "public"."smart_recommendations"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view their own recommendations"
  on "public"."smart_recommendations"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "System can create subscription events"
  on "public"."subscription_events"
  as permissive
  for insert
  to public
with check (true);



  create policy "Users can view their own subscription events"
  on "public"."subscription_events"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Admins can manage subscription plans"
  on "public"."subscription_plans"
  as permissive
  for all
  to public
using ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.raw_user_meta_data ->> 'role'::text) = 'admin'::text))));



  create policy "Anyone can view active subscription plans"
  on "public"."subscription_plans"
  as permissive
  for select
  to public
using ((is_active = true));



  create policy "Allow authenticated users to manage screenings"
  on "public"."tenant_screenings"
  as permissive
  for all
  to public
using ((auth.role() = 'authenticated'::text))
with check ((auth.role() = 'authenticated'::text));



  create policy "Admins can delete tenant profiles"
  on "public"."tenants"
  as permissive
  for delete
  to authenticated
using (public.is_admin(auth.uid()));



  create policy "Authenticated users can create tenant profiles"
  on "public"."tenants"
  as permissive
  for insert
  to authenticated
with check (((auth.uid() = user_id) OR public.is_admin(auth.uid()) OR (user_id IS NULL)));



  create policy "Users can update tenant profiles"
  on "public"."tenants"
  as permissive
  for update
  to authenticated
using (((auth.uid() = user_id) OR public.is_admin(auth.uid())))
with check (((auth.uid() = user_id) OR public.is_admin(auth.uid())));



  create policy "Users can view tenant profiles"
  on "public"."tenants"
  as permissive
  for select
  to authenticated
using (((auth.uid() = user_id) OR public.is_admin(auth.uid())));



  create policy "Admins can view all transactions"
  on "public"."transactions"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::text)))));



  create policy "System can create transactions"
  on "public"."transactions"
  as permissive
  for insert
  to public
with check (true);



  create policy "Users can view their own transactions"
  on "public"."transactions"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "Owners and agents can manage units"
  on "public"."units"
  as permissive
  for all
  to public
using (((EXISTS ( SELECT 1
   FROM public.properties p
  WHERE ((p.id = units.property_id) AND ((p.owner_id = auth.uid()) OR (p.agent_id = auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM public.profiles pr
  WHERE ((pr.id = auth.uid()) AND (lower(pr.role) = ANY (ARRAY['admin'::text, 'super_admin'::text])))))))
with check (((EXISTS ( SELECT 1
   FROM public.properties p
  WHERE ((p.id = units.property_id) AND ((p.owner_id = auth.uid()) OR (p.agent_id = auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM public.profiles pr
  WHERE ((pr.id = auth.uid()) AND (lower(pr.role) = ANY (ARRAY['admin'::text, 'super_admin'::text])))))));



  create policy "Users can view units for accessible properties"
  on "public"."units"
  as permissive
  for select
  to public
using (((EXISTS ( SELECT 1
   FROM public.properties p
  WHERE ((p.id = units.property_id) AND ((p.owner_id = auth.uid()) OR (p.agent_id = auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM public.profiles pr
  WHERE ((pr.id = auth.uid()) AND (lower(pr.role) = ANY (ARRAY['admin'::text, 'super_admin'::text])))))));



  create policy "Users can view their own usage history"
  on "public"."usage_history"
  as permissive
  for select
  to public
using ((subscription_id IN ( SELECT user_subscriptions.id
   FROM public.user_subscriptions
  WHERE (user_subscriptions.user_id = auth.uid()))));



  create policy "Users can delete their own preferences"
  on "public"."user_preferences"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert their own preferences"
  on "public"."user_preferences"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update their own preferences"
  on "public"."user_preferences"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view their own preferences"
  on "public"."user_preferences"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Authenticated users can view user roles"
  on "public"."user_roles"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Users can insert own role"
  on "public"."user_roles"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update own role"
  on "public"."user_roles"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view own role"
  on "public"."user_roles"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Admins can view all subscriptions"
  on "public"."user_subscriptions"
  as permissive
  for select
  to public
using ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.raw_user_meta_data ->> 'role'::text) = 'admin'::text))));



  create policy "System can create subscriptions"
  on "public"."user_subscriptions"
  as permissive
  for insert
  to public
with check (true);



  create policy "Users can update their own subscriptions"
  on "public"."user_subscriptions"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view their own subscriptions"
  on "public"."user_subscriptions"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Vendor jobs management"
  on "public"."vendor_jobs"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::text, 'owner'::text, 'agent'::text]))))));



  create policy "Vendor jobs visibility"
  on "public"."vendor_jobs"
  as permissive
  for select
  to public
using (((EXISTS ( SELECT 1
   FROM public.vendors v
  WHERE ((v.id = vendor_jobs.vendor_id) AND (v.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::text, 'agent'::text, 'owner'::text])))))));



  create policy "Admin vendor deletion"
  on "public"."vendors"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::text)))));



  create policy "Users can create their own vendor profile"
  on "public"."vendors"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Vendor profile updates"
  on "public"."vendors"
  as permissive
  for update
  to public
using (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::text))))));



  create policy "Vendor profiles visibility"
  on "public"."vendors"
  as permissive
  for select
  to public
using (((auth.uid() = user_id) OR ((active = true) AND (verified = true)) OR (EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['admin'::text, 'owner'::text])))))));



  create policy "Users can insert their own verification records"
  on "public"."verification_records"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update their own verification records"
  on "public"."verification_records"
  as permissive
  for update
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Users can view their own verification records"
  on "public"."verification_records"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert their own voice assistant analytics"
  on "public"."voice_assistant_analytics"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update their own voice assistant analytics"
  on "public"."voice_assistant_analytics"
  as permissive
  for update
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Users can view their own voice assistant analytics"
  on "public"."voice_assistant_analytics"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can delete their own voice assistant settings"
  on "public"."voice_assistant_settings"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert their own voice assistant settings"
  on "public"."voice_assistant_settings"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update their own voice assistant settings"
  on "public"."voice_assistant_settings"
  as permissive
  for update
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Users can view their own voice assistant settings"
  on "public"."voice_assistant_settings"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can delete their own voice command history"
  on "public"."voice_command_history"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert their own voice command history"
  on "public"."voice_command_history"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can view their own voice command history"
  on "public"."voice_command_history"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Admins can view all wallets"
  on "public"."wallets"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::text)))));



  create policy "System can update wallets"
  on "public"."wallets"
  as permissive
  for update
  to public
using (true);



  create policy "Users can view their own wallet"
  on "public"."wallets"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "Only system can manage webhook events"
  on "public"."webhook_events"
  as permissive
  for all
  to public
using (true);



  create policy "Users can manage their own white label configs"
  on "public"."white_label_configs"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));


CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents FOR EACH ROW EXECUTE FUNCTION public.update_agents_updated_at();

CREATE TRIGGER update_api_provider_configs_updated_at BEFORE UPDATE ON public.api_provider_configs FOR EACH ROW EXECUTE FUNCTION public.update_nigerian_api_updated_at();

CREATE TRIGGER update_blockchain_payments_updated_at BEFORE UPDATE ON public.blockchain_payments FOR EACH ROW EXECUTE FUNCTION public.update_blockchain_updated_at();

CREATE TRIGGER update_blockchain_transactions_updated_at BEFORE UPDATE ON public.blockchain_transactions FOR EACH ROW EXECUTE FUNCTION public.update_blockchain_updated_at();

CREATE TRIGGER update_blockchain_wallets_updated_at BEFORE UPDATE ON public.blockchain_wallets FOR EACH ROW EXECUTE FUNCTION public.update_blockchain_updated_at();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contact_submissions_updated_at BEFORE UPDATE ON public.contact_submissions FOR EACH ROW EXECUTE FUNCTION public.update_contact_submissions_updated_at();

CREATE TRIGGER update_document_hashes_updated_at BEFORE UPDATE ON public.document_hashes FOR EACH ROW EXECUTE FUNCTION public.update_blockchain_updated_at();

CREATE TRIGGER set_document_expiration_trigger BEFORE INSERT OR UPDATE ON public.document_metadata FOR EACH ROW EXECUTE FUNCTION public.set_document_expiration();

CREATE TRIGGER update_document_metadata_updated_at BEFORE UPDATE ON public.document_metadata FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_document_processing_settings_updated_at BEFORE UPDATE ON public.document_processing_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_document_templates_updated_at BEFORE UPDATE ON public.document_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_document_validations_updated_at BEFORE UPDATE ON public.document_validations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_document_workflows_updated_at BEFORE UPDATE ON public.document_workflows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_equipment_data_updated_at BEFORE UPDATE ON public.equipment_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_escrow_conditions_updated_at BEFORE UPDATE ON public.escrow_conditions FOR EACH ROW EXECUTE FUNCTION public.update_blockchain_updated_at();

CREATE TRIGGER update_escrow_contracts_updated_at BEFORE UPDATE ON public.escrow_contracts FOR EACH ROW EXECUTE FUNCTION public.update_blockchain_updated_at();

CREATE TRIGGER update_escrow_milestones_updated_at BEFORE UPDATE ON public.escrow_milestones FOR EACH ROW EXECUTE FUNCTION public.update_blockchain_updated_at();

CREATE TRIGGER update_guest_documents_updated_at BEFORE UPDATE ON public.guest_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_identity_credentials_updated_at BEFORE UPDATE ON public.identity_credentials FOR EACH ROW EXECUTE FUNCTION public.update_blockchain_updated_at();

CREATE TRIGGER set_invoice_number_trigger BEFORE INSERT ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.set_invoice_number();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kyc_profiles_updated_at BEFORE UPDATE ON public.kyc_profiles FOR EACH ROW EXECUTE FUNCTION public.update_nigerian_api_updated_at();

CREATE TRIGGER update_listing_availabilities_updated_at BEFORE UPDATE ON public.listing_availabilities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budget_on_maintenance AFTER INSERT ON public.maintenance_records FOR EACH ROW EXECUTE FUNCTION public.update_maintenance_budget_spent();

CREATE TRIGGER on_new_maintenance_request_notify_owner AFTER INSERT ON public.maintenance_requests FOR EACH ROW EXECUTE FUNCTION public.create_maintenance_notification_for_owner();

CREATE TRIGGER update_maintenance_schedules_updated_at BEFORE UPDATE ON public.maintenance_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_message_templates_updated_at BEFORE UPDATE ON public.message_templates FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER update_nigerian_banks_updated_at BEFORE UPDATE ON public.nigerian_banks FOR EACH ROW EXECUTE FUNCTION public.update_nigerian_api_updated_at();

CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON public.payment_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_predictive_alerts_updated_at BEFORE UPDATE ON public.predictive_alerts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_predictive_maintenance_settings_updated_at BEFORE UPDATE ON public.predictive_maintenance_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_experiments_updated_at BEFORE UPDATE ON public.pricing_experiments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_property_maintenance_profiles_updated_at BEFORE UPDATE ON public.property_maintenance_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_property_tokens_updated_at BEFORE UPDATE ON public.property_tokens FOR EACH ROW EXECUTE FUNCTION public.update_blockchain_updated_at();

CREATE TRIGGER update_recurring_payments_updated_at BEFORE UPDATE ON public.recurring_payments FOR EACH ROW EXECUTE FUNCTION public.update_blockchain_updated_at();

CREATE TRIGGER set_rental_milestones_updated_at BEFORE UPDATE ON public.rental_milestones FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_tenant_screenings_timestamp BEFORE UPDATE ON public.tenant_screenings FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_tenant_user_id_trigger BEFORE INSERT ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.set_tenant_user_id();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER vendor_jobs_updated_at BEFORE UPDATE ON public.vendor_jobs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER vendors_updated_at BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_verification_records_updated_at BEFORE UPDATE ON public.verification_records FOR EACH ROW EXECUTE FUNCTION public.update_nigerian_api_updated_at();

CREATE TRIGGER update_voice_assistant_analytics_updated_at BEFORE UPDATE ON public.voice_assistant_analytics FOR EACH ROW EXECUTE FUNCTION public.update_voice_assistant_updated_at();

CREATE TRIGGER update_voice_assistant_settings_updated_at BEFORE UPDATE ON public.voice_assistant_settings FOR EACH ROW EXECUTE FUNCTION public.update_voice_assistant_updated_at();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_white_label_configs_updated_at BEFORE UPDATE ON public.white_label_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER create_document_settings_for_new_user AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_default_document_settings();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Allow users to upload their own application documents"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'application-documents'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Allow users to view their own application documents"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'application-documents'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Auth delete documents"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'documents'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Auth delete property-images"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'property-images'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Auth delete property_documents"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'property_documents'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Auth read documents"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'documents'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Auth read property_documents"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'property_documents'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Auth update documents"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'documents'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Auth update property-images"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'property-images'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Auth update property_documents"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'property_documents'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Auth upload documents"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'documents'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Auth upload property-images"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'property-images'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Auth upload property_documents"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'property_documents'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Authenticated Access for Property Documents"
  on "storage"."objects"
  as permissive
  for all
  to authenticated
using ((bucket_id = 'property_documents'::text));



  create policy "Authenticated Access for application-documents"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'application-documents'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Authenticated Access for documents"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'documents'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Authenticated Access for property_documents"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'property_documents'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Authenticated Access"
  on "storage"."objects"
  as permissive
  for all
  to authenticated
using ((bucket_id = 'documents'::text));



  create policy "Authenticated Delete for application-documents"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'application-documents'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Authenticated Delete for documents"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'documents'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Authenticated Delete for property-images"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'property-images'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Authenticated Delete for property_documents"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'property_documents'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Authenticated Delete"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((bucket_id = 'property-images'::text));



  create policy "Authenticated Update for application-documents"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'application-documents'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Authenticated Update for documents"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'documents'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Authenticated Update for property-images"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'property-images'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Authenticated Update for property_documents"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'property_documents'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Authenticated Update"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'property-images'::text));



  create policy "Authenticated Upload for application-documents"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'application-documents'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Authenticated Upload for documents"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'documents'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Authenticated Upload for property-images"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'property-images'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Authenticated Upload for property_documents"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'property_documents'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Authenticated Upload"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'property-images'::text));



  create policy "Authenticated users can upload property images"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'property-images'::text));



  create policy "Authenticated users can upload"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "Public Access for property-images"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'property-images'::text));



  create policy "Public Access"
  on "storage"."objects"
  as permissive
  for select
  to public
using (true);



  create policy "Public Read Access"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'property-images'::text));



  create policy "Public read access for property images 107eh68_0"
  on "storage"."objects"
  as permissive
  for select
  to public
using (true);



  create policy "Public read access for property images"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'property-images'::text));



  create policy "Public read property-images"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'property-images'::text));



  create policy "Users can delete own files"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((auth.uid())::text = (storage.foldername(name))[1]));



  create policy "Users can delete their own documents"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'documents'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can delete their own property images"
  on "storage"."objects"
  as permissive
  for delete
  to public
using ((auth.uid() = owner));



  create policy "Users can update own files"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((auth.uid())::text = (storage.foldername(name))[1]));



  create policy "Users can update their own documents"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'documents'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can update their own property images"
  on "storage"."objects"
  as permissive
  for update
  to public
using ((auth.uid() = owner))
with check ((bucket_id = 'property-images'::text));



  create policy "Users can upload their own documents"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'documents'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can view their own documents"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'documents'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



