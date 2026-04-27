-- Seed subscription_plans so Flutterwave webhook can resolve plan UUID by tier (required for live checkout).
-- Safe to run multiple times.

INSERT INTO public.subscription_plans (name, tier, description, tagline, popular, pricing, limits, features, trial_days)
VALUES
(
    'Free',
    'free',
    'Perfect for individual landlords getting started',
    'Start managing your first property',
    false,
    '{"monthly": 0, "quarterly": 0, "yearly": 0, "currency": "NGN"}'::jsonb,
    '{"properties": 1, "tenants": 3, "documents_per_month": 10, "ai_recommendations_per_month": 5, "maintenance_alerts": 10, "storage_gb": 1, "api_calls_per_month": 0, "team_members": 1}'::jsonb,
    '[
        {"category": "properties", "feature_key": "basic_property_management", "feature_name": "Basic Property Management", "description": "Add and manage up to 1 property", "enabled": true},
        {"category": "tenants", "feature_key": "tenant_management", "feature_name": "Tenant Management", "description": "Manage up to 3 tenants", "enabled": true},
        {"category": "ai_features", "feature_key": "basic_ai_matching", "feature_name": "Basic AI Property Matching", "description": "Limited AI-powered tenant recommendations", "enabled": true, "usage_limit": 5},
        {"category": "documents", "feature_key": "document_processing", "feature_name": "Document Processing", "description": "Process up to 10 documents per month", "enabled": true, "usage_limit": 10},
        {"category": "support", "feature_key": "community_support", "feature_name": "Community Support", "description": "Access to community forums", "enabled": true}
    ]'::jsonb,
    0
),
(
    'Starter',
    'starter',
    'Ideal for small-scale landlords and property managers',
    'Scale your property business',
    true,
    '{"monthly": 15000, "quarterly": 40500, "yearly": 162000, "currency": "NGN", "discount_quarterly": 10, "discount_yearly": 15}'::jsonb,
    '{"properties": 5, "tenants": 25, "documents_per_month": 100, "ai_recommendations_per_month": 50, "maintenance_alerts": 100, "storage_gb": 10, "api_calls_per_month": 1000, "team_members": 3}'::jsonb,
    '[
        {"category": "properties", "feature_key": "advanced_property_management", "feature_name": "Advanced Property Management", "description": "Manage up to 5 properties with detailed analytics", "enabled": true},
        {"category": "ai_features", "feature_key": "smart_matching", "feature_name": "Smart Property Matching", "description": "AI-powered tenant recommendations with behavioral learning", "enabled": true, "usage_limit": 50},
        {"category": "ai_features", "feature_key": "predictive_maintenance", "feature_name": "Predictive Maintenance", "description": "AI-powered maintenance alerts and scheduling", "enabled": true},
        {"category": "documents", "feature_key": "intelligent_document_processing", "feature_name": "Intelligent Document Processing", "description": "AI-powered document analysis and extraction", "enabled": true, "usage_limit": 100},
        {"category": "analytics", "feature_key": "basic_analytics", "feature_name": "Basic Analytics", "description": "Property performance and financial reports", "enabled": true},
        {"category": "support", "feature_key": "email_support", "feature_name": "Email Support", "description": "24/7 email support with 24-hour response time", "enabled": true}
    ]'::jsonb,
    14
),
(
    'Professional',
    'professional',
    'Perfect for growing property management companies',
    'Professional property management at scale',
    false,
    '{"monthly": 45000, "quarterly": 121500, "yearly": 459000, "currency": "NGN", "discount_quarterly": 10, "discount_yearly": 15}'::jsonb,
    '{"properties": 25, "tenants": 150, "documents_per_month": 500, "ai_recommendations_per_month": 200, "maintenance_alerts": 500, "storage_gb": 50, "api_calls_per_month": 10000, "team_members": 10}'::jsonb,
    '[
        {"category": "properties", "feature_key": "unlimited_property_features", "feature_name": "Advanced Property Features", "description": "Full property management suite with custom fields", "enabled": true},
        {"category": "ai_features", "feature_key": "advanced_ai_suite", "feature_name": "Complete AI Suite", "description": "All AI features with priority processing", "enabled": true},
        {"category": "analytics", "feature_key": "advanced_analytics", "feature_name": "Advanced Analytics & Reporting", "description": "Comprehensive business intelligence and custom reports", "enabled": true},
        {"category": "integrations", "feature_key": "api_access", "feature_name": "API Access", "description": "Full API access for custom integrations", "enabled": true},
        {"category": "support", "feature_key": "priority_support", "feature_name": "Priority Support", "description": "Priority phone and email support with 4-hour response", "enabled": true}
    ]'::jsonb,
    30
),
(
    'Enterprise',
    'enterprise',
    'For large property management companies and enterprises',
    'Enterprise-grade property management',
    false,
    '{"monthly": 150000, "quarterly": 405000, "yearly": 1530000, "currency": "NGN", "discount_quarterly": 10, "discount_yearly": 15}'::jsonb,
    '{"properties": "unlimited", "tenants": "unlimited", "documents_per_month": "unlimited", "ai_recommendations_per_month": "unlimited", "maintenance_alerts": "unlimited", "storage_gb": "unlimited", "api_calls_per_month": "unlimited", "team_members": "unlimited"}'::jsonb,
    '[
        {"category": "properties", "feature_key": "enterprise_property_management", "feature_name": "Enterprise Property Management", "description": "Unlimited properties with advanced workflows", "enabled": true},
        {"category": "ai_features", "feature_key": "enterprise_ai_suite", "feature_name": "Enterprise AI Suite", "description": "All AI features with custom model training", "enabled": true},
        {"category": "analytics", "feature_key": "enterprise_analytics", "feature_name": "Enterprise Analytics", "description": "Custom dashboards and advanced business intelligence", "enabled": true},
        {"category": "integrations", "feature_key": "enterprise_integrations", "feature_name": "Enterprise Integrations", "description": "Custom integrations and dedicated API support", "enabled": true},
        {"category": "support", "feature_key": "dedicated_support", "feature_name": "Dedicated Account Manager", "description": "Dedicated account manager and 24/7 phone support", "enabled": true}
    ]'::jsonb,
    30
)
ON CONFLICT (tier) DO NOTHING;
