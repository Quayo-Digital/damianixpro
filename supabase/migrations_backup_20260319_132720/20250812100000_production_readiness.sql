-- Production Readiness Migration
-- Optimizes database for production deployment with live data integration
-- Date: 2025-08-12

-- Enable necessary extensions for production
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create indexes for performance optimization
-- Properties table indexes
CREATE INDEX IF NOT EXISTS idx_properties_location_type ON properties(location, property_type);
CREATE INDEX IF NOT EXISTS idx_properties_price_range ON properties(price) WHERE price IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);

-- Sales transactions indexes
CREATE INDEX IF NOT EXISTS idx_sales_transactions_property_id ON sales_transactions(property_id);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_buyer_id ON sales_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_status ON sales_transactions(status);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_date ON sales_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_amount ON sales_transactions(sale_amount);

-- Buyers table indexes
CREATE INDEX IF NOT EXISTS idx_buyers_agent_id ON buyers(agent_id);
CREATE INDEX IF NOT EXISTS idx_buyers_status ON buyers(status);
CREATE INDEX IF NOT EXISTS idx_buyers_budget_range ON buyers(budget_min, budget_max);
CREATE INDEX IF NOT EXISTS idx_buyers_created_at ON buyers(created_at);

-- Property inquiries indexes
CREATE INDEX IF NOT EXISTS idx_property_inquiries_property_id ON property_inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_property_inquiries_buyer_id ON property_inquiries(buyer_id);
CREATE INDEX IF NOT EXISTS idx_property_inquiries_status ON property_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_property_inquiries_date ON property_inquiries(inquiry_date);

-- Leases table indexes
CREATE INDEX IF NOT EXISTS idx_leases_property_id ON leases(property_id);
CREATE INDEX IF NOT EXISTS idx_leases_tenant_id ON leases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leases_status ON leases(status);
CREATE INDEX IF NOT EXISTS idx_leases_start_date ON leases(start_date);
CREATE INDEX IF NOT EXISTS idx_leases_end_date ON leases(end_date);

-- Payments table indexes
CREATE INDEX IF NOT EXISTS idx_payments_lease_id ON payments(lease_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_amount ON payments(amount);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_properties_search ON properties USING gin(to_tsvector('english', title || ' ' || description));
CREATE INDEX IF NOT EXISTS idx_buyers_search ON buyers USING gin(to_tsvector('english', first_name || ' ' || last_name || ' ' || COALESCE(company, '')));

-- Create live data integration tables
CREATE TABLE IF NOT EXISTS live_market_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location VARCHAR(100) NOT NULL,
    property_type VARCHAR(50) NOT NULL,
    average_price DECIMAL(15,2),
    median_price DECIMAL(15,2),
    price_per_sqm DECIMAL(10,2),
    total_listings INTEGER DEFAULT 0,
    new_listings INTEGER DEFAULT 0,
    sold_listings INTEGER DEFAULT 0,
    average_days_on_market INTEGER DEFAULT 0,
    price_change_30_days DECIMAL(5,4) DEFAULT 0,
    price_change_90_days DECIMAL(5,4) DEFAULT 0,
    price_change_1_year DECIMAL(5,4) DEFAULT 0,
    data_source VARCHAR(100),
    confidence_score INTEGER DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Economic indicators table
CREATE TABLE IF NOT EXISTS economic_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    indicator_name VARCHAR(100) NOT NULL,
    value DECIMAL(10,4) NOT NULL,
    unit VARCHAR(20),
    trend VARCHAR(10) CHECK (trend IN ('UP', 'DOWN', 'STABLE')),
    source VARCHAR(100),
    date_recorded TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Municipal data table
CREATE TABLE IF NOT EXISTS municipal_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    population BIGINT,
    gdp_per_capita DECIMAL(10,2),
    unemployment_rate DECIMAL(5,2),
    infrastructure_score INTEGER CHECK (infrastructure_score >= 0 AND infrastructure_score <= 100),
    development_projects JSONB DEFAULT '[]',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Property listings cache table for live data
CREATE TABLE IF NOT EXISTS property_listings_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255),
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(15,2) NOT NULL,
    location_state VARCHAR(100),
    location_city VARCHAR(100),
    location_area VARCHAR(100),
    coordinates POINT,
    property_type VARCHAR(50) NOT NULL,
    category VARCHAR(10) CHECK (category IN ('SALE', 'RENT')),
    bedrooms INTEGER,
    bathrooms INTEGER,
    size_sqm DECIMAL(10,2),
    features JSONB DEFAULT '[]',
    images JSONB DEFAULT '[]',
    agent_info JSONB,
    date_posted TIMESTAMP WITH TIME ZONE,
    source VARCHAR(100) NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market alerts table
CREATE TABLE IF NOT EXISTS market_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    location VARCHAR(100),
    property_type VARCHAR(50),
    alert_data JSONB,
    action_required BOOLEAN DEFAULT FALSE,
    recommendations JSONB DEFAULT '[]',
    user_id UUID REFERENCES auth.users(id),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for live data tables
CREATE INDEX IF NOT EXISTS idx_live_market_data_location_type ON live_market_data(location, property_type);
CREATE INDEX IF NOT EXISTS idx_live_market_data_updated ON live_market_data(last_updated);
CREATE INDEX IF NOT EXISTS idx_economic_indicators_name ON economic_indicators(indicator_name);
CREATE INDEX IF NOT EXISTS idx_economic_indicators_date ON economic_indicators(date_recorded);
CREATE INDEX IF NOT EXISTS idx_municipal_data_city ON municipal_data(city);
CREATE INDEX IF NOT EXISTS idx_property_listings_cache_location ON property_listings_cache(location_city, property_type);
CREATE INDEX IF NOT EXISTS idx_property_listings_cache_price ON property_listings_cache(price);
CREATE INDEX IF NOT EXISTS idx_property_listings_cache_source ON property_listings_cache(source);
CREATE INDEX IF NOT EXISTS idx_property_listings_cache_updated ON property_listings_cache(last_updated);
CREATE INDEX IF NOT EXISTS idx_market_alerts_user_id ON market_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_market_alerts_type ON market_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_market_alerts_severity ON market_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_market_alerts_read ON market_alerts(is_read);

-- Enable Row Level Security on new tables
ALTER TABLE live_market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE economic_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE municipal_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_listings_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for live data tables

-- Live market data - readable by all authenticated users
CREATE POLICY "live_market_data_read" ON live_market_data
    FOR SELECT TO authenticated
    USING (true);

-- Live market data - writable by admin and system
CREATE POLICY "live_market_data_write" ON live_market_data
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'system')
        )
    );

-- Economic indicators - readable by all authenticated users
CREATE POLICY "economic_indicators_read" ON economic_indicators
    FOR SELECT TO authenticated
    USING (true);

-- Economic indicators - writable by admin and system
CREATE POLICY "economic_indicators_write" ON economic_indicators
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'system')
        )
    );

-- Municipal data - readable by all authenticated users
CREATE POLICY "municipal_data_read" ON municipal_data
    FOR SELECT TO authenticated
    USING (true);

-- Municipal data - writable by admin and system
CREATE POLICY "municipal_data_write" ON municipal_data
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'system')
        )
    );

-- Property listings cache - readable by all authenticated users
CREATE POLICY "property_listings_cache_read" ON property_listings_cache
    FOR SELECT TO authenticated
    USING (true);

-- Property listings cache - writable by admin and system
CREATE POLICY "property_listings_cache_write" ON property_listings_cache
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'system')
        )
    );

-- Market alerts - users can only see their own alerts
CREATE POLICY "market_alerts_read" ON market_alerts
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin')
        )
    );

-- Market alerts - writable by admin and system
CREATE POLICY "market_alerts_write" ON market_alerts
    FOR ALL TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'system')
        )
    );

-- Create functions for data management

-- Function to update market data
CREATE OR REPLACE FUNCTION update_market_data(
    p_location VARCHAR(100),
    p_property_type VARCHAR(50),
    p_average_price DECIMAL(15,2),
    p_median_price DECIMAL(15,2),
    p_price_per_sqm DECIMAL(10,2),
    p_total_listings INTEGER,
    p_new_listings INTEGER,
    p_sold_listings INTEGER,
    p_average_days_on_market INTEGER,
    p_price_change_30_days DECIMAL(5,4),
    p_price_change_90_days DECIMAL(5,4),
    p_price_change_1_year DECIMAL(5,4),
    p_data_source VARCHAR(100),
    p_confidence_score INTEGER
) RETURNS UUID AS $$
DECLARE
    result_id UUID;
BEGIN
    INSERT INTO live_market_data (
        location, property_type, average_price, median_price, price_per_sqm,
        total_listings, new_listings, sold_listings, average_days_on_market,
        price_change_30_days, price_change_90_days, price_change_1_year,
        data_source, confidence_score
    ) VALUES (
        p_location, p_property_type, p_average_price, p_median_price, p_price_per_sqm,
        p_total_listings, p_new_listings, p_sold_listings, p_average_days_on_market,
        p_price_change_30_days, p_price_change_90_days, p_price_change_1_year,
        p_data_source, p_confidence_score
    )
    ON CONFLICT (location, property_type) 
    DO UPDATE SET
        average_price = EXCLUDED.average_price,
        median_price = EXCLUDED.median_price,
        price_per_sqm = EXCLUDED.price_per_sqm,
        total_listings = EXCLUDED.total_listings,
        new_listings = EXCLUDED.new_listings,
        sold_listings = EXCLUDED.sold_listings,
        average_days_on_market = EXCLUDED.average_days_on_market,
        price_change_30_days = EXCLUDED.price_change_30_days,
        price_change_90_days = EXCLUDED.price_change_90_days,
        price_change_1_year = EXCLUDED.price_change_1_year,
        data_source = EXCLUDED.data_source,
        confidence_score = EXCLUDED.confidence_score,
        last_updated = NOW()
    RETURNING id INTO result_id;
    
    RETURN result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to insert economic indicator
CREATE OR REPLACE FUNCTION insert_economic_indicator(
    p_indicator_name VARCHAR(100),
    p_value DECIMAL(10,4),
    p_unit VARCHAR(20),
    p_trend VARCHAR(10),
    p_source VARCHAR(100)
) RETURNS UUID AS $$
DECLARE
    result_id UUID;
BEGIN
    INSERT INTO economic_indicators (
        indicator_name, value, unit, trend, source
    ) VALUES (
        p_indicator_name, p_value, p_unit, p_trend, p_source
    ) RETURNING id INTO result_id;
    
    RETURN result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update municipal data
CREATE OR REPLACE FUNCTION update_municipal_data(
    p_city VARCHAR(100),
    p_state VARCHAR(100),
    p_population BIGINT,
    p_gdp_per_capita DECIMAL(10,2),
    p_unemployment_rate DECIMAL(5,2),
    p_infrastructure_score INTEGER,
    p_development_projects JSONB
) RETURNS UUID AS $$
DECLARE
    result_id UUID;
BEGIN
    INSERT INTO municipal_data (
        city, state, population, gdp_per_capita, unemployment_rate,
        infrastructure_score, development_projects
    ) VALUES (
        p_city, p_state, p_population, p_gdp_per_capita, p_unemployment_rate,
        p_infrastructure_score, p_development_projects
    )
    ON CONFLICT (city, state) 
    DO UPDATE SET
        population = EXCLUDED.population,
        gdp_per_capita = EXCLUDED.gdp_per_capita,
        unemployment_rate = EXCLUDED.unemployment_rate,
        infrastructure_score = EXCLUDED.infrastructure_score,
        development_projects = EXCLUDED.development_projects,
        last_updated = NOW()
    RETURNING id INTO result_id;
    
    RETURN result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create market alert
CREATE OR REPLACE FUNCTION create_market_alert(
    p_alert_type VARCHAR(50),
    p_severity VARCHAR(20),
    p_title VARCHAR(255),
    p_message TEXT,
    p_location VARCHAR(100),
    p_property_type VARCHAR(50),
    p_alert_data JSONB,
    p_action_required BOOLEAN,
    p_recommendations JSONB,
    p_user_id UUID
) RETURNS UUID AS $$
DECLARE
    result_id UUID;
BEGIN
    INSERT INTO market_alerts (
        alert_type, severity, title, message, location, property_type,
        alert_data, action_required, recommendations, user_id
    ) VALUES (
        p_alert_type, p_severity, p_title, p_message, p_location, p_property_type,
        p_alert_data, p_action_required, p_recommendations, p_user_id
    ) RETURNING id INTO result_id;
    
    RETURN result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create unique constraints for data integrity
ALTER TABLE live_market_data ADD CONSTRAINT unique_location_property_type UNIQUE (location, property_type);
ALTER TABLE municipal_data ADD CONSTRAINT unique_city_state UNIQUE (city, state);
ALTER TABLE property_listings_cache ADD CONSTRAINT unique_external_id_source UNIQUE (external_id, source);

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to relevant tables
CREATE TRIGGER update_live_market_data_updated_at
    BEFORE UPDATE ON live_market_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_municipal_data_updated_at
    BEFORE UPDATE ON municipal_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_listings_cache_updated_at
    BEFORE UPDATE ON property_listings_cache
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for analytics
CREATE OR REPLACE VIEW market_summary AS
SELECT 
    location,
    property_type,
    average_price,
    price_change_1_year,
    total_listings,
    confidence_score,
    last_updated
FROM live_market_data
WHERE last_updated > NOW() - INTERVAL '24 hours'
ORDER BY location, property_type;

CREATE OR REPLACE VIEW economic_summary AS
SELECT 
    indicator_name,
    value,
    unit,
    trend,
    date_recorded
FROM economic_indicators
WHERE date_recorded > NOW() - INTERVAL '7 days'
ORDER BY indicator_name, date_recorded DESC;

-- Grant necessary permissions
GRANT SELECT ON market_summary TO authenticated;
GRANT SELECT ON economic_summary TO authenticated;

-- Insert initial sample data for testing
INSERT INTO live_market_data (location, property_type, average_price, median_price, price_per_sqm, total_listings, new_listings, sold_listings, average_days_on_market, data_source, confidence_score)
VALUES 
    ('Lagos', 'RESIDENTIAL', 25000000, 22000000, 125000, 150, 25, 12, 45, 'System', 85),
    ('Abuja', 'RESIDENTIAL', 22000000, 20000000, 110000, 120, 20, 8, 38, 'System', 80),
    ('Port Harcourt', 'RESIDENTIAL', 18000000, 16000000, 90000, 80, 15, 6, 52, 'System', 75),
    ('Lagos', 'COMMERCIAL', 45000000, 40000000, 225000, 75, 12, 5, 65, 'System', 82),
    ('Abuja', 'COMMERCIAL', 38000000, 35000000, 190000, 60, 10, 4, 58, 'System', 78);

INSERT INTO economic_indicators (indicator_name, value, unit, trend, source)
VALUES 
    ('Inflation Rate', 18.5, '%', 'UP', 'Central Bank of Nigeria'),
    ('Monetary Policy Rate', 16.5, '%', 'STABLE', 'Central Bank of Nigeria'),
    ('GDP Growth Rate', 3.2, '%', 'UP', 'Central Bank of Nigeria'),
    ('USD/NGN Exchange Rate', 750.25, 'NGN', 'DOWN', 'Central Bank of Nigeria');

INSERT INTO municipal_data (city, state, population, gdp_per_capita, unemployment_rate, infrastructure_score, development_projects)
VALUES 
    ('Lagos', 'Lagos', 15000000, 4500, 22.0, 75, '[{"name": "Fourth Mainland Bridge", "type": "Infrastructure", "status": "ONGOING"}]'),
    ('Abuja', 'FCT', 3500000, 5200, 18.0, 82, '[{"name": "Abuja Light Rail Extension", "type": "Transportation", "status": "ONGOING"}]'),
    ('Port Harcourt', 'Rivers', 2500000, 3800, 28.0, 65, '[{"name": "Port Expansion Project", "type": "Infrastructure", "status": "ONGOING"}]');

-- Add comments for documentation
COMMENT ON TABLE live_market_data IS 'Real-time market data aggregated from multiple Nigerian property sources';
COMMENT ON TABLE economic_indicators IS 'Economic indicators from Central Bank of Nigeria and other official sources';
COMMENT ON TABLE municipal_data IS 'Municipal and demographic data for Nigerian cities';
COMMENT ON TABLE property_listings_cache IS 'Cached property listings from external APIs for performance';
COMMENT ON TABLE market_alerts IS 'Real-time market alerts and notifications for users';

-- Performance optimization settings
-- These would be applied by database administrator
-- ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
-- ALTER SYSTEM SET track_activity_query_size = 2048;
-- ALTER SYSTEM SET pg_stat_statements.track = 'all';

COMMIT;
