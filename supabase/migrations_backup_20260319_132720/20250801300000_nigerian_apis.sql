-- Nigerian API Integration System Migration
-- This migration creates tables and policies for Nigerian banking and government service integrations

-- Create kyc_profiles table for user verification profiles
CREATE TABLE IF NOT EXISTS kyc_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bvn_verified BOOLEAN DEFAULT false,
    nin_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    bank_account_verified BOOLEAN DEFAULT false,
    business_verified BOOLEAN DEFAULT false,
    credit_score INTEGER,
    verification_level VARCHAR(20) DEFAULT 'basic' CHECK (verification_level IN ('basic', 'intermediate', 'advanced', 'premium')),
    risk_score INTEGER DEFAULT 50 CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level VARCHAR(10) DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create verification_records table for tracking all verification attempts
CREATE TABLE IF NOT EXISTS verification_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    verification_type VARCHAR(20) NOT NULL CHECK (verification_type IN ('bvn', 'nin', 'cac', 'bank_account', 'phone', 'credit_report', 'land_registry')),
    request_data JSONB NOT NULL,
    response_data JSONB,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'expired')),
    provider VARCHAR(20) NOT NULL,
    cost DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'NGN',
    verification_id VARCHAR(100),
    confidence_score DECIMAL(3,2),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create api_provider_configs table for managing API configurations
CREATE TABLE IF NOT EXISTS api_provider_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider VARCHAR(20) NOT NULL,
    service_type VARCHAR(20) NOT NULL,
    api_key_encrypted TEXT,
    base_url VARCHAR(255) NOT NULL,
    sandbox_mode BOOLEAN DEFAULT true,
    rate_limit_per_minute INTEGER DEFAULT 60,
    rate_limit_per_hour INTEGER DEFAULT 1000,
    rate_limit_per_day INTEGER DEFAULT 10000,
    webhook_url VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider, service_type)
);

-- Create nigerian_banks table for bank data
CREATE TABLE IF NOT EXISTS nigerian_banks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    longcode VARCHAR(20),
    gateway VARCHAR(50),
    pay_with_bank BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    country VARCHAR(50) DEFAULT 'Nigeria',
    currency VARCHAR(3) DEFAULT 'NGN',
    type VARCHAR(20) DEFAULT 'nuban',
    logo_url VARCHAR(255),
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create api_usage_logs table for tracking API usage
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL,
    service_type VARCHAR(20) NOT NULL,
    endpoint VARCHAR(100),
    request_method VARCHAR(10) DEFAULT 'POST',
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    response_time_ms INTEGER,
    status_code INTEGER,
    success BOOLEAN DEFAULT false,
    cost DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'NGN',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create webhook_events table for handling provider webhooks
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider VARCHAR(20) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB NOT NULL,
    signature VARCHAR(255),
    processed BOOLEAN DEFAULT false,
    verification_record_id UUID REFERENCES verification_records(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kyc_profiles_user_id ON kyc_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_profiles_verification_level ON kyc_profiles(verification_level);
CREATE INDEX IF NOT EXISTS idx_kyc_profiles_risk_level ON kyc_profiles(risk_level);

CREATE INDEX IF NOT EXISTS idx_verification_records_user_id ON verification_records(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_records_type ON verification_records(verification_type);
CREATE INDEX IF NOT EXISTS idx_verification_records_status ON verification_records(status);
CREATE INDEX IF NOT EXISTS idx_verification_records_created_at ON verification_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_records_provider ON verification_records(provider);

CREATE INDEX IF NOT EXISTS idx_api_provider_configs_provider ON api_provider_configs(provider);
CREATE INDEX IF NOT EXISTS idx_api_provider_configs_service_type ON api_provider_configs(service_type);
CREATE INDEX IF NOT EXISTS idx_api_provider_configs_active ON api_provider_configs(is_active);

CREATE INDEX IF NOT EXISTS idx_nigerian_banks_code ON nigerian_banks(code);
CREATE INDEX IF NOT EXISTS idx_nigerian_banks_active ON nigerian_banks(active);
CREATE INDEX IF NOT EXISTS idx_nigerian_banks_name ON nigerian_banks(name);

CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_id ON api_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_provider ON api_usage_logs(provider);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON api_usage_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider ON webhook_events(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at DESC);

-- Enable Row Level Security
ALTER TABLE kyc_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_provider_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nigerian_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for kyc_profiles
CREATE POLICY "Users can view their own KYC profile"
    ON kyc_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own KYC profile"
    ON kyc_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own KYC profile"
    ON kyc_profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for verification_records
CREATE POLICY "Users can view their own verification records"
    ON verification_records FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verification records"
    ON verification_records FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own verification records"
    ON verification_records FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for api_provider_configs (admin only)
CREATE POLICY "Only admins can manage API provider configs"
    ON api_provider_configs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create RLS policies for nigerian_banks (public read)
CREATE POLICY "Anyone can view Nigerian banks"
    ON nigerian_banks FOR SELECT
    USING (true);

CREATE POLICY "Only admins can manage Nigerian banks"
    ON nigerian_banks FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Only admins can update Nigerian banks"
    ON nigerian_banks FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create RLS policies for api_usage_logs
CREATE POLICY "Users can view their own API usage logs"
    ON api_usage_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert API usage logs"
    ON api_usage_logs FOR INSERT
    WITH CHECK (true);

-- Create RLS policies for webhook_events (system only)
CREATE POLICY "Only system can manage webhook events"
    ON webhook_events FOR ALL
    USING (true);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_nigerian_api_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_kyc_profiles_updated_at
    BEFORE UPDATE ON kyc_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_nigerian_api_updated_at();

CREATE TRIGGER update_verification_records_updated_at
    BEFORE UPDATE ON verification_records
    FOR EACH ROW
    EXECUTE FUNCTION update_nigerian_api_updated_at();

CREATE TRIGGER update_api_provider_configs_updated_at
    BEFORE UPDATE ON api_provider_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_nigerian_api_updated_at();

CREATE TRIGGER update_nigerian_banks_updated_at
    BEFORE UPDATE ON nigerian_banks
    FOR EACH ROW
    EXECUTE FUNCTION update_nigerian_api_updated_at();

-- Create function to calculate KYC verification level
CREATE OR REPLACE FUNCTION calculate_kyc_verification_level(
    p_bvn_verified BOOLEAN,
    p_nin_verified BOOLEAN,
    p_phone_verified BOOLEAN,
    p_bank_verified BOOLEAN,
    p_business_verified BOOLEAN
)
RETURNS VARCHAR(20) AS $$
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
$$ LANGUAGE plpgsql;

-- Create function to calculate risk score
CREATE OR REPLACE FUNCTION calculate_risk_score(
    p_bvn_verified BOOLEAN,
    p_nin_verified BOOLEAN,
    p_phone_verified BOOLEAN,
    p_bank_verified BOOLEAN,
    p_business_verified BOOLEAN
)
RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create function to update KYC profile
CREATE OR REPLACE FUNCTION update_kyc_profile_verification(
    p_user_id UUID,
    p_verification_type VARCHAR(20),
    p_verified BOOLEAN
)
RETURNS VOID AS $$
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
$$ LANGUAGE plpgsql;

-- Create function to log API usage
CREATE OR REPLACE FUNCTION log_api_usage(
    p_user_id UUID,
    p_provider VARCHAR(20),
    p_service_type VARCHAR(20),
    p_endpoint VARCHAR(100),
    p_request_method VARCHAR(10),
    p_response_time_ms INTEGER,
    p_status_code INTEGER,
    p_success BOOLEAN,
    p_cost DECIMAL(10,2) DEFAULT 0.00
)
RETURNS VOID AS $$
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
$$ LANGUAGE plpgsql;

-- Insert default Nigerian banks data
INSERT INTO nigerian_banks (name, slug, code, longcode, gateway, pay_with_bank, active, type) VALUES
('Access Bank', 'access-bank', '044', '044150149', 'emandate', true, true, 'nuban'),
('Guaranty Trust Bank', 'guaranty-trust-bank', '058', '058152036', 'emandate', true, true, 'nuban'),
('First Bank of Nigeria', 'first-bank-of-nigeria', '011', '011151003', 'emandate', true, true, 'nuban'),
('United Bank for Africa', 'united-bank-for-africa', '033', '033153513', 'emandate', true, true, 'nuban'),
('Zenith Bank', 'zenith-bank', '057', '057150013', 'emandate', true, true, 'nuban'),
('Fidelity Bank', 'fidelity-bank', '070', '070150003', 'emandate', true, true, 'nuban'),
('Union Bank of Nigeria', 'union-bank-of-nigeria', '032', '032080474', 'emandate', true, true, 'nuban'),
('Sterling Bank', 'sterling-bank', '232', '232150016', 'emandate', true, true, 'nuban'),
('Stanbic IBTC Bank', 'stanbic-ibtc-bank', '221', '221159522', 'emandate', true, true, 'nuban'),
('Ecobank Nigeria', 'ecobank-nigeria', '050', '050150010', 'emandate', true, true, 'nuban'),
('Wema Bank', 'wema-bank', '035', '035150103', 'emandate', true, true, 'nuban'),
('FCMB', 'fcmb', '214', '214150018', 'emandate', true, true, 'nuban'),
('Heritage Bank', 'heritage-bank', '030', '030159992', 'emandate', true, true, 'nuban'),
('Keystone Bank', 'keystone-bank', '082', '082150017', 'emandate', true, true, 'nuban'),
('Polaris Bank', 'polaris-bank', '076', '076151006', 'emandate', true, true, 'nuban')
ON CONFLICT (code) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON kyc_profiles TO authenticated;
GRANT ALL ON verification_records TO authenticated;
GRANT SELECT ON api_provider_configs TO authenticated;
GRANT SELECT ON nigerian_banks TO authenticated;
GRANT SELECT ON api_usage_logs TO authenticated;
GRANT SELECT ON webhook_events TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_kyc_verification_level TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_risk_score TO authenticated;
GRANT EXECUTE ON FUNCTION update_kyc_profile_verification TO authenticated;
GRANT EXECUTE ON FUNCTION log_api_usage TO authenticated;

-- Create default KYC profiles for existing users
INSERT INTO kyc_profiles (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM kyc_profiles)
ON CONFLICT (user_id) DO NOTHING;

COMMENT ON TABLE kyc_profiles IS 'User KYC verification profiles with risk assessment';
COMMENT ON TABLE verification_records IS 'Historical record of all verification attempts and results';
COMMENT ON TABLE api_provider_configs IS 'Configuration for Nigerian API service providers';
COMMENT ON TABLE nigerian_banks IS 'Nigerian bank data for verification and payments';
COMMENT ON TABLE api_usage_logs IS 'API usage tracking and analytics';
COMMENT ON TABLE webhook_events IS 'Webhook events from API providers';
COMMENT ON FUNCTION update_kyc_profile_verification IS 'Updates KYC profile when verification is completed';
COMMENT ON FUNCTION log_api_usage IS 'Logs API usage for analytics and billing';
