-- Predictive Maintenance System Database Migration
-- This migration creates all necessary tables and functions for AI-powered predictive maintenance

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Equipment Data Table
CREATE TABLE IF NOT EXISTS equipment_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    equipment_type TEXT NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    installation_date DATE NOT NULL,
    last_service_date DATE,
    warranty_expiry DATE,
    expected_lifespan_years INTEGER NOT NULL DEFAULT 10,
    current_condition TEXT NOT NULL CHECK (current_condition IN ('excellent', 'good', 'fair', 'poor', 'critical')),
    usage_intensity TEXT NOT NULL CHECK (usage_intensity IN ('low', 'medium', 'high')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance Records Table
CREATE TABLE IF NOT EXISTS maintenance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID REFERENCES equipment_data(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('preventive', 'corrective', 'emergency', 'inspection')),
    category TEXT NOT NULL CHECK (category IN ('plumbing', 'electrical', 'hvac', 'structural', 'appliances', 'security', 'exterior', 'interior', 'landscaping')),
    description TEXT NOT NULL,
    cost DECIMAL(12,2) NOT NULL DEFAULT 0,
    performed_date DATE NOT NULL,
    performed_by TEXT NOT NULL,
    parts_replaced TEXT[],
    notes TEXT,
    before_photos TEXT[],
    after_photos TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sensor Readings Table
CREATE TABLE IF NOT EXISTS sensor_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES equipment_data(id) ON DELETE CASCADE,
    sensor_type TEXT NOT NULL CHECK (sensor_type IN ('temperature', 'humidity', 'pressure', 'vibration', 'current', 'voltage', 'flow_rate')),
    value DECIMAL(10,4) NOT NULL,
    unit TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    is_anomaly BOOLEAN DEFAULT FALSE,
    threshold_min DECIMAL(10,4),
    threshold_max DECIMAL(10,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Predictive Alerts Table
CREATE TABLE IF NOT EXISTS predictive_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    equipment_id UUID REFERENCES equipment_data(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('plumbing', 'electrical', 'hvac', 'structural', 'appliances', 'security', 'exterior', 'interior', 'landscaping')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    predicted_failure_date TIMESTAMP WITH TIME ZONE NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high', 'critical')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    estimated_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
    potential_savings DECIMAL(12,2) NOT NULL DEFAULT 0,
    recommended_actions JSONB NOT NULL DEFAULT '[]',
    factors JSONB NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'predicted' CHECK (status IN ('predicted', 'scheduled', 'in_progress', 'completed', 'overdue')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Maintenance Schedules Table
CREATE TABLE IF NOT EXISTS maintenance_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    equipment_id UUID REFERENCES equipment_data(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('plumbing', 'electrical', 'hvac', 'structural', 'appliances', 'security', 'exterior', 'interior', 'landscaping')),
    task_name TEXT NOT NULL,
    description TEXT NOT NULL,
    frequency_type TEXT NOT NULL CHECK (frequency_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'semi_annual', 'annual', 'conditional')),
    frequency_value INTEGER NOT NULL DEFAULT 1,
    last_completed TIMESTAMP WITH TIME ZONE,
    next_due TIMESTAMP WITH TIME ZONE NOT NULL,
    estimated_duration TEXT NOT NULL,
    estimated_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
    assigned_to TEXT,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    seasonal_adjustments JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance Budgets Table
CREATE TABLE IF NOT EXISTS maintenance_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    quarter INTEGER CHECK (quarter >= 1 AND quarter <= 4),
    category TEXT NOT NULL CHECK (category IN ('plumbing', 'electrical', 'hvac', 'structural', 'appliances', 'security', 'exterior', 'interior', 'landscaping')),
    budgeted_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    spent_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    predicted_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    variance DECIMAL(12,2) GENERATED ALWAYS AS (spent_amount - budgeted_amount) STORED,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id, year, quarter, category)
);

-- Property Maintenance Profiles Table
CREATE TABLE IF NOT EXISTS property_maintenance_profiles (
    property_id UUID PRIMARY KEY REFERENCES properties(id) ON DELETE CASCADE,
    property_age INTEGER NOT NULL DEFAULT 0,
    property_type TEXT NOT NULL,
    square_footage INTEGER,
    occupancy_rate DECIMAL(3,2) DEFAULT 1.0,
    climate_zone TEXT DEFAULT 'tropical',
    maintenance_history_score INTEGER DEFAULT 50 CHECK (maintenance_history_score >= 0 AND maintenance_history_score <= 100),
    equipment_condition_score INTEGER DEFAULT 50 CHECK (equipment_condition_score >= 0 AND equipment_condition_score <= 100),
    risk_factors TEXT[] DEFAULT '{}',
    maintenance_complexity TEXT DEFAULT 'medium' CHECK (maintenance_complexity IN ('low', 'medium', 'high')),
    annual_maintenance_cost DECIMAL(12,2) DEFAULT 0,
    predictive_accuracy INTEGER DEFAULT 50 CHECK (predictive_accuracy >= 0 AND predictive_accuracy <= 100),
    last_assessment TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance Insights Table
CREATE TABLE IF NOT EXISTS maintenance_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL CHECK (insight_type IN ('cost_optimization', 'efficiency_improvement', 'risk_mitigation', 'trend_analysis')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    impact_score INTEGER NOT NULL CHECK (impact_score >= 0 AND impact_score <= 100),
    potential_savings DECIMAL(12,2) NOT NULL DEFAULT 0,
    implementation_effort TEXT NOT NULL CHECK (implementation_effort IN ('low', 'medium', 'high')),
    recommended_timeline TEXT NOT NULL,
    supporting_data JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Predictive Maintenance Settings Table
CREATE TABLE IF NOT EXISTS predictive_maintenance_settings (
    property_id UUID PRIMARY KEY REFERENCES properties(id) ON DELETE CASCADE,
    prediction_horizon_days INTEGER DEFAULT 90,
    confidence_threshold DECIMAL(3,2) DEFAULT 0.7,
    alert_preferences JSONB DEFAULT '{
        "email_notifications": true,
        "sms_notifications": false,
        "push_notifications": true,
        "dashboard_alerts": true
    }',
    budget_alert_threshold DECIMAL(3,2) DEFAULT 0.8,
    seasonal_adjustments_enabled BOOLEAN DEFAULT TRUE,
    sensor_integration_enabled BOOLEAN DEFAULT FALSE,
    auto_scheduling_enabled BOOLEAN DEFAULT FALSE,
    preferred_maintenance_window JSONB DEFAULT '{
        "start_time": "09:00",
        "end_time": "17:00",
        "preferred_days": ["monday", "tuesday", "wednesday", "thursday", "friday"]
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_equipment_data_property_id ON equipment_data(property_id);
CREATE INDEX IF NOT EXISTS idx_equipment_data_type ON equipment_data(equipment_type);
CREATE INDEX IF NOT EXISTS idx_equipment_data_condition ON equipment_data(current_condition);

CREATE INDEX IF NOT EXISTS idx_maintenance_records_property_id ON maintenance_records(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_equipment_id ON maintenance_records(equipment_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_date ON maintenance_records(performed_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_type ON maintenance_records(maintenance_type);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_equipment_id ON sensor_readings(equipment_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp ON sensor_readings(timestamp);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_anomaly ON sensor_readings(is_anomaly);

CREATE INDEX IF NOT EXISTS idx_predictive_alerts_property_id ON predictive_alerts(property_id);
CREATE INDEX IF NOT EXISTS idx_predictive_alerts_equipment_id ON predictive_alerts(equipment_id);
CREATE INDEX IF NOT EXISTS idx_predictive_alerts_priority ON predictive_alerts(priority);
CREATE INDEX IF NOT EXISTS idx_predictive_alerts_status ON predictive_alerts(status);
CREATE INDEX IF NOT EXISTS idx_predictive_alerts_failure_date ON predictive_alerts(predicted_failure_date);

CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_property_id ON maintenance_schedules(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_next_due ON maintenance_schedules(next_due);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_active ON maintenance_schedules(is_active);

CREATE INDEX IF NOT EXISTS idx_maintenance_budgets_property_year ON maintenance_budgets(property_id, year);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_equipment_data_updated_at BEFORE UPDATE ON equipment_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_predictive_alerts_updated_at BEFORE UPDATE ON predictive_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maintenance_schedules_updated_at BEFORE UPDATE ON maintenance_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_property_maintenance_profiles_updated_at BEFORE UPDATE ON property_maintenance_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_predictive_maintenance_settings_updated_at BEFORE UPDATE ON predictive_maintenance_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Equipment Data RLS
ALTER TABLE equipment_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view equipment for their properties" ON equipment_data
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM properties 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert equipment for their properties" ON equipment_data
    FOR INSERT WITH CHECK (
        property_id IN (
            SELECT id FROM properties 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update equipment for their properties" ON equipment_data
    FOR UPDATE USING (
        property_id IN (
            SELECT id FROM properties 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete equipment for their properties" ON equipment_data
    FOR DELETE USING (
        property_id IN (
            SELECT id FROM properties 
            WHERE owner_id = auth.uid()
        )
    );

-- Maintenance Records RLS
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view maintenance records for their properties" ON maintenance_records
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM properties 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert maintenance records for their properties" ON maintenance_records
    FOR INSERT WITH CHECK (
        property_id IN (
            SELECT id FROM properties 
            WHERE owner_id = auth.uid()
        )
    );

-- Sensor Readings RLS
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sensor readings for their equipment" ON sensor_readings
    FOR SELECT USING (
        equipment_id IN (
            SELECT ed.id FROM equipment_data ed
            JOIN properties p ON ed.property_id = p.id
            WHERE p.owner_id = auth.uid()
        )
    );

-- Predictive Alerts RLS
ALTER TABLE predictive_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view predictive alerts for their properties" ON predictive_alerts
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM properties 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update predictive alerts for their properties" ON predictive_alerts
    FOR UPDATE USING (
        property_id IN (
            SELECT id FROM properties 
            WHERE owner_id = auth.uid()
        )
    );

-- Maintenance Schedules RLS
ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage maintenance schedules for their properties" ON maintenance_schedules
    FOR ALL USING (
        property_id IN (
            SELECT id FROM properties 
            WHERE owner_id = auth.uid()
        )
    );

-- Maintenance Budgets RLS
ALTER TABLE maintenance_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage maintenance budgets for their properties" ON maintenance_budgets
    FOR ALL USING (
        property_id IN (
            SELECT id FROM properties 
            WHERE owner_id = auth.uid()
        )
    );

-- Property Maintenance Profiles RLS
ALTER TABLE property_maintenance_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage maintenance profiles for their properties" ON property_maintenance_profiles
    FOR ALL USING (
        property_id IN (
            SELECT id FROM properties 
            WHERE owner_id = auth.uid()
        )
    );

-- Maintenance Insights RLS
ALTER TABLE maintenance_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view maintenance insights for their properties" ON maintenance_insights
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM properties 
            WHERE owner_id = auth.uid()
        )
    );

-- Predictive Maintenance Settings RLS
ALTER TABLE predictive_maintenance_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage predictive maintenance settings for their properties" ON predictive_maintenance_settings
    FOR ALL USING (
        property_id IN (
            SELECT id FROM properties 
            WHERE owner_id = auth.uid()
        )
    );

-- Utility Functions

-- Function to calculate equipment age in years
CREATE OR REPLACE FUNCTION calculate_equipment_age(installation_date DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM AGE(CURRENT_DATE, installation_date));
END;
$$ LANGUAGE plpgsql;

-- Function to get equipment health score
CREATE OR REPLACE FUNCTION get_equipment_health_score(condition TEXT)
RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql;

-- Function to update maintenance budget spent amount
CREATE OR REPLACE FUNCTION update_maintenance_budget_spent()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Trigger to automatically update budget when maintenance is performed
CREATE TRIGGER update_budget_on_maintenance
    AFTER INSERT ON maintenance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_maintenance_budget_spent();

-- Function to generate daily maintenance recommendations (for cron job)
CREATE OR REPLACE FUNCTION generate_daily_maintenance_recommendations()
RETURNS void AS $$
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
$$ LANGUAGE plpgsql;

-- Insert default maintenance profiles for existing properties
INSERT INTO property_maintenance_profiles (property_id, property_type, property_age)
SELECT id, 'residential', 0 FROM properties
ON CONFLICT (property_id) DO NOTHING;

-- Insert default predictive maintenance settings for existing properties
INSERT INTO predictive_maintenance_settings (property_id)
SELECT id FROM properties
ON CONFLICT (property_id) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

COMMENT ON TABLE equipment_data IS 'Stores information about property equipment for predictive maintenance';
COMMENT ON TABLE maintenance_records IS 'Historical maintenance records for equipment and properties';
COMMENT ON TABLE sensor_readings IS 'IoT sensor data for equipment monitoring';
COMMENT ON TABLE predictive_alerts IS 'AI-generated maintenance alerts and predictions';
COMMENT ON TABLE maintenance_schedules IS 'Scheduled maintenance tasks and their frequencies';
COMMENT ON TABLE maintenance_budgets IS 'Maintenance budget tracking by property and category';
COMMENT ON TABLE property_maintenance_profiles IS 'Property-specific maintenance profiles and risk assessments';
COMMENT ON TABLE maintenance_insights IS 'AI-generated insights and recommendations for maintenance optimization';
COMMENT ON TABLE predictive_maintenance_settings IS 'User preferences and settings for predictive maintenance system';
