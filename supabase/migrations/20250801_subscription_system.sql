-- Advanced Subscription Models and Monetization System Migration
-- Created: 2025-08-01
-- Description: Database schema for advanced subscription management, billing, and monetization

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'starter', 'professional', 'enterprise', 'white_label')),
    description TEXT NOT NULL,
    tagline TEXT,
    popular BOOLEAN DEFAULT FALSE,
    pricing JSONB NOT NULL DEFAULT '{}', -- {monthly, quarterly, yearly, currency, discounts}
    limits JSONB NOT NULL DEFAULT '{}', -- {properties, tenants, documents_per_month, etc.}
    features JSONB NOT NULL DEFAULT '[]', -- Array of feature objects
    add_ons JSONB DEFAULT '[]', -- Array of add-on options
    trial_days INTEGER DEFAULT 0,
    setup_fee INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    tier TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
        'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'trialing'
    )),
    billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    paystack_subscription_code TEXT,
    paystack_customer_code TEXT,
    add_ons JSONB DEFAULT '[]', -- Array of subscription add-ons
    usage_tracking JSONB NOT NULL DEFAULT '{}', -- Current usage tracking
    billing_address JSONB, -- Billing address information
    payment_method JSONB, -- Payment method details
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure one active subscription per user
    UNIQUE(user_id, status) WHERE status = 'active'
);

-- Usage history table for tracking historical usage
CREATE TABLE IF NOT EXISTS usage_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    usage_data JSONB NOT NULL DEFAULT '{}',
    overage_charges JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL UNIQUE,
    amount_due INTEGER NOT NULL, -- in kobo/cents
    amount_paid INTEGER DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'NGN',
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
    due_date TIMESTAMPTZ NOT NULL,
    paid_at TIMESTAMPTZ,
    line_items JSONB NOT NULL DEFAULT '[]',
    tax_amount INTEGER DEFAULT 0,
    discount_amount INTEGER DEFAULT 0,
    stripe_invoice_id TEXT,
    paystack_invoice_code TEXT,
    pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL, -- in kobo/cents
    currency TEXT NOT NULL DEFAULT 'NGN',
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
    gateway TEXT NOT NULL CHECK (gateway IN ('stripe', 'paystack')),
    gateway_transaction_id TEXT NOT NULL,
    gateway_reference TEXT,
    failure_reason TEXT,
    refund_amount INTEGER DEFAULT 0,
    refunded_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscription events table for audit trail
CREATE TABLE IF NOT EXISTS subscription_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'subscription_created', 'subscription_updated', 'subscription_canceled', 'subscription_reactivated',
        'trial_started', 'trial_ended', 'payment_succeeded', 'payment_failed',
        'invoice_created', 'invoice_paid', 'plan_upgraded', 'plan_downgraded',
        'add_on_added', 'add_on_removed', 'usage_limit_exceeded'
    )),
    event_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- White label configurations table
CREATE TABLE IF NOT EXISTS white_label_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL,
    domain TEXT NOT NULL,
    custom_domain TEXT,
    logo_url TEXT,
    primary_color TEXT NOT NULL DEFAULT '#3B82F6',
    secondary_color TEXT NOT NULL DEFAULT '#1F2937',
    custom_css TEXT,
    email_templates JSONB DEFAULT '[]',
    features_enabled JSONB DEFAULT '[]',
    api_access JSONB DEFAULT '{"enabled": false, "rate_limit": 1000}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, domain)
);

-- Pricing experiments table for A/B testing
CREATE TABLE IF NOT EXISTS pricing_experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
    variants JSONB NOT NULL DEFAULT '[]',
    traffic_allocation INTEGER DEFAULT 100 CHECK (traffic_allocation >= 0 AND traffic_allocation <= 100),
    success_metrics JSONB DEFAULT '[]',
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    results JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Feature usage tracking table
CREATE TABLE IF NOT EXISTS feature_usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    feature_key TEXT NOT NULL,
    usage_count INTEGER DEFAULT 1,
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate daily entries
    UNIQUE(user_id, feature_key, usage_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscription_plans_tier ON subscription_plans(tier);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier ON user_subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_period_end ON user_subscriptions(current_period_end);

CREATE INDEX IF NOT EXISTS idx_usage_history_subscription_id ON usage_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_history_period ON usage_history(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_subscription_id ON payment_transactions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_invoice_id ON payment_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_gateway_id ON payment_transactions(gateway_transaction_id);

CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_subscription_id ON subscription_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON subscription_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_white_label_configs_user_id ON white_label_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_white_label_configs_domain ON white_label_configs(domain);

CREATE INDEX IF NOT EXISTS idx_feature_usage_user_date ON feature_usage_tracking(user_id, usage_date DESC);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature_date ON feature_usage_tracking(feature_key, usage_date DESC);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscription_plans_updated_at 
    BEFORE UPDATE ON subscription_plans 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at 
    BEFORE UPDATE ON user_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON invoices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at 
    BEFORE UPDATE ON payment_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_white_label_configs_updated_at 
    BEFORE UPDATE ON white_label_configs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_experiments_updated_at 
    BEFORE UPDATE ON pricing_experiments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
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
$$ language 'plpgsql';

-- Function to automatically generate invoice numbers
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := generate_invoice_number();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_invoice_number_trigger
    BEFORE INSERT ON invoices
    FOR EACH ROW EXECUTE FUNCTION set_invoice_number();

-- Function to track feature usage
CREATE OR REPLACE FUNCTION track_feature_usage(
    p_user_id UUID,
    p_feature_key TEXT,
    p_usage_count INTEGER DEFAULT 1,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO feature_usage_tracking (user_id, feature_key, usage_count, metadata)
    VALUES (p_user_id, p_feature_key, p_usage_count, p_metadata)
    ON CONFLICT (user_id, feature_key, usage_date)
    DO UPDATE SET 
        usage_count = feature_usage_tracking.usage_count + p_usage_count,
        metadata = p_metadata;
END;
$$ language 'plpgsql';

-- Function to check feature limits
CREATE OR REPLACE FUNCTION check_feature_limit(
    p_user_id UUID,
    p_feature_key TEXT,
    p_requested_usage INTEGER DEFAULT 1
)
RETURNS JSONB AS $$
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
$$ language 'plpgsql';

-- Row Level Security (RLS) Policies
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE white_label_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage_tracking ENABLE ROW LEVEL SECURITY;

-- Policies for subscription_plans (public read, admin write)
CREATE POLICY "Anyone can view active subscription plans" ON subscription_plans
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage subscription plans" ON subscription_plans
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create subscriptions" ON user_subscriptions
    FOR INSERT WITH CHECK (true); -- Handled by application logic

CREATE POLICY "Admins can view all subscriptions" ON user_subscriptions
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Policies for usage_history
CREATE POLICY "Users can view their own usage history" ON usage_history
    FOR SELECT USING (
        subscription_id IN (
            SELECT id FROM user_subscriptions WHERE user_id = auth.uid()
        )
    );

-- Policies for invoices
CREATE POLICY "Users can view their own invoices" ON invoices
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create invoices" ON invoices
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update invoices" ON invoices
    FOR UPDATE USING (true);

-- Policies for payment_transactions
CREATE POLICY "Users can view their own transactions" ON payment_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage transactions" ON payment_transactions
    FOR ALL USING (true);

-- Policies for subscription_events
CREATE POLICY "Users can view their own subscription events" ON subscription_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create subscription events" ON subscription_events
    FOR INSERT WITH CHECK (true);

-- Policies for white_label_configs
CREATE POLICY "Users can manage their own white label configs" ON white_label_configs
    FOR ALL USING (auth.uid() = user_id);

-- Policies for pricing_experiments (admin only)
CREATE POLICY "Admins can manage pricing experiments" ON pricing_experiments
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Policies for feature_usage_tracking
CREATE POLICY "Users can view their own feature usage" ON feature_usage_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can track feature usage" ON feature_usage_tracking
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update feature usage" ON feature_usage_tracking
    FOR UPDATE USING (true);

-- Insert default subscription plans
INSERT INTO subscription_plans (id, name, tier, description, tagline, popular, pricing, limits, features, trial_days) VALUES
(
    'free-tier',
    'Free',
    'free',
    'Perfect for individual landlords getting started',
    'Start managing your first property',
    false,
    '{"monthly": 0, "quarterly": 0, "yearly": 0, "currency": "NGN"}',
    '{"properties": 1, "tenants": 3, "documents_per_month": 10, "ai_recommendations_per_month": 5, "maintenance_alerts": 10, "storage_gb": 1, "api_calls_per_month": 0, "team_members": 1}',
    '[
        {"category": "properties", "feature_key": "basic_property_management", "feature_name": "Basic Property Management", "description": "Add and manage up to 1 property", "enabled": true},
        {"category": "tenants", "feature_key": "tenant_management", "feature_name": "Tenant Management", "description": "Manage up to 3 tenants", "enabled": true},
        {"category": "ai_features", "feature_key": "basic_ai_matching", "feature_name": "Basic AI Property Matching", "description": "Limited AI-powered tenant recommendations", "enabled": true, "usage_limit": 5},
        {"category": "documents", "feature_key": "document_processing", "feature_name": "Document Processing", "description": "Process up to 10 documents per month", "enabled": true, "usage_limit": 10},
        {"category": "support", "feature_key": "community_support", "feature_name": "Community Support", "description": "Access to community forums", "enabled": true}
    ]',
    0
),
(
    'starter-plan',
    'Starter',
    'starter',
    'Ideal for small-scale landlords and property managers',
    'Scale your property business',
    true,
    '{"monthly": 15000, "quarterly": 40500, "yearly": 162000, "currency": "NGN", "discount_quarterly": 10, "discount_yearly": 15}',
    '{"properties": 5, "tenants": 25, "documents_per_month": 100, "ai_recommendations_per_month": 50, "maintenance_alerts": 100, "storage_gb": 10, "api_calls_per_month": 1000, "team_members": 3}',
    '[
        {"category": "properties", "feature_key": "advanced_property_management", "feature_name": "Advanced Property Management", "description": "Manage up to 5 properties with detailed analytics", "enabled": true},
        {"category": "ai_features", "feature_key": "smart_matching", "feature_name": "Smart Property Matching", "description": "AI-powered tenant recommendations with behavioral learning", "enabled": true, "usage_limit": 50},
        {"category": "ai_features", "feature_key": "predictive_maintenance", "feature_name": "Predictive Maintenance", "description": "AI-powered maintenance alerts and scheduling", "enabled": true},
        {"category": "documents", "feature_key": "intelligent_document_processing", "feature_name": "Intelligent Document Processing", "description": "AI-powered document analysis and extraction", "enabled": true, "usage_limit": 100},
        {"category": "analytics", "feature_key": "basic_analytics", "feature_name": "Basic Analytics", "description": "Property performance and financial reports", "enabled": true},
        {"category": "support", "feature_key": "email_support", "feature_name": "Email Support", "description": "24/7 email support with 24-hour response time", "enabled": true}
    ]',
    14
),
(
    'professional-plan',
    'Professional',
    'professional',
    'Perfect for growing property management companies',
    'Professional property management at scale',
    false,
    '{"monthly": 45000, "quarterly": 121500, "yearly": 459000, "currency": "NGN", "discount_quarterly": 10, "discount_yearly": 15}',
    '{"properties": 25, "tenants": 150, "documents_per_month": 500, "ai_recommendations_per_month": 200, "maintenance_alerts": 500, "storage_gb": 50, "api_calls_per_month": 10000, "team_members": 10}',
    '[
        {"category": "properties", "feature_key": "unlimited_property_features", "feature_name": "Advanced Property Features", "description": "Full property management suite with custom fields", "enabled": true},
        {"category": "ai_features", "feature_key": "advanced_ai_suite", "feature_name": "Complete AI Suite", "description": "All AI features with priority processing", "enabled": true},
        {"category": "analytics", "feature_key": "advanced_analytics", "feature_name": "Advanced Analytics & Reporting", "description": "Comprehensive business intelligence and custom reports", "enabled": true},
        {"category": "integrations", "feature_key": "api_access", "feature_name": "API Access", "description": "Full API access for custom integrations", "enabled": true},
        {"category": "support", "feature_key": "priority_support", "feature_name": "Priority Support", "description": "Priority phone and email support with 4-hour response", "enabled": true}
    ]',
    30
),
(
    'enterprise-plan',
    'Enterprise',
    'enterprise',
    'For large property management companies and enterprises',
    'Enterprise-grade property management',
    false,
    '{"monthly": 150000, "quarterly": 405000, "yearly": 1530000, "currency": "NGN", "discount_quarterly": 10, "discount_yearly": 15}',
    '{"properties": "unlimited", "tenants": "unlimited", "documents_per_month": "unlimited", "ai_recommendations_per_month": "unlimited", "maintenance_alerts": "unlimited", "storage_gb": "unlimited", "api_calls_per_month": "unlimited", "team_members": "unlimited"}',
    '[
        {"category": "properties", "feature_key": "enterprise_property_management", "feature_name": "Enterprise Property Management", "description": "Unlimited properties with advanced workflows", "enabled": true},
        {"category": "ai_features", "feature_key": "enterprise_ai_suite", "feature_name": "Enterprise AI Suite", "description": "All AI features with custom model training", "enabled": true},
        {"category": "analytics", "feature_key": "enterprise_analytics", "feature_name": "Enterprise Analytics", "description": "Custom dashboards and advanced business intelligence", "enabled": true},
        {"category": "integrations", "feature_key": "enterprise_integrations", "feature_name": "Enterprise Integrations", "description": "Custom integrations and dedicated API support", "enabled": true},
        {"category": "support", "feature_key": "dedicated_support", "feature_name": "Dedicated Account Manager", "description": "Dedicated account manager and 24/7 phone support", "enabled": true}
    ]',
    30
)
ON CONFLICT (id) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE subscription_plans IS 'Available subscription plans with pricing and features';
COMMENT ON TABLE user_subscriptions IS 'User subscription records with billing and usage tracking';
COMMENT ON TABLE usage_history IS 'Historical usage data for billing and analytics';
COMMENT ON TABLE invoices IS 'Billing invoices for subscriptions and add-ons';
COMMENT ON TABLE payment_transactions IS 'Payment transaction records from various gateways';
COMMENT ON TABLE subscription_events IS 'Audit trail of subscription-related events';
COMMENT ON TABLE white_label_configs IS 'White label branding configurations for enterprise clients';
COMMENT ON TABLE pricing_experiments IS 'A/B testing configurations for pricing optimization';
COMMENT ON TABLE feature_usage_tracking IS 'Daily feature usage tracking for billing and analytics';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
