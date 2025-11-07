-- Migration for AI Smart Matching System
-- Creates tables for user preferences, property interactions, and smart recommendations

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Budget preferences
    min_budget BIGINT NOT NULL DEFAULT 0,
    max_budget BIGINT NOT NULL DEFAULT 10000000,
    budget_flexibility TEXT CHECK (budget_flexibility IN ('strict', 'flexible', 'very_flexible')) DEFAULT 'flexible',
    
    -- Location preferences
    preferred_areas TEXT[] DEFAULT '{}',
    max_commute_time INTEGER,
    commute_locations TEXT[] DEFAULT '{}',
    transportation_mode TEXT CHECK (transportation_mode IN ('car', 'public_transport', 'walking', 'mixed')),
    
    -- Property preferences
    property_types TEXT[] DEFAULT '{"apartment"}',
    min_bedrooms INTEGER NOT NULL DEFAULT 1,
    max_bedrooms INTEGER,
    min_bathrooms INTEGER NOT NULL DEFAULT 1,
    furnished_preference TEXT CHECK (furnished_preference IN ('furnished', 'unfurnished', 'either')) DEFAULT 'either',
    
    -- Amenity preferences (0-10 importance scale)
    amenity_preferences JSONB DEFAULT '{
        "parking": 5,
        "gym": 3,
        "pool": 3,
        "security": 8,
        "generator": 7,
        "internet": 6,
        "air_conditioning": 6,
        "balcony": 4,
        "garden": 3,
        "elevator": 4,
        "laundry": 5,
        "pet_friendly": 2
    }',
    
    -- Lifestyle preferences
    noise_tolerance TEXT CHECK (noise_tolerance IN ('quiet', 'moderate', 'lively')) DEFAULT 'moderate',
    social_preference TEXT CHECK (social_preference IN ('private', 'community_oriented')) DEFAULT 'private',
    work_from_home BOOLEAN DEFAULT FALSE,
    has_pets BOOLEAN DEFAULT FALSE,
    pet_types TEXT[] DEFAULT '{}',
    
    -- Learning data
    viewed_properties UUID[] DEFAULT '{}',
    saved_properties UUID[] DEFAULT '{}',
    applied_properties UUID[] DEFAULT '{}',
    rejected_properties UUID[] DEFAULT '{}',
    
    -- Behavioral patterns
    search_patterns JSONB DEFAULT '{
        "most_active_hours": [9, 10, 11, 18, 19, 20],
        "search_frequency": 3,
        "decision_speed": "moderate"
    }',
    
    -- Calculated preferences (ML-derived)
    calculated_preferences JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Property Interactions Table
CREATE TABLE IF NOT EXISTS property_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    interaction_type TEXT CHECK (interaction_type IN ('view', 'save', 'apply', 'reject', 'contact', 'share')) NOT NULL,
    duration_seconds INTEGER,
    interaction_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Smart Recommendations Table
CREATE TABLE IF NOT EXISTS smart_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    
    -- Matching score details
    overall_score DECIMAL(3,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 1),
    score_breakdown JSONB NOT NULL,
    confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high')) NOT NULL,
    reasons TEXT[] DEFAULT '{}',
    
    recommendation_type TEXT CHECK (recommendation_type IN ('daily_picks', 'instant_match', 'similar_to_saved', 'price_drop')) DEFAULT 'daily_picks',
    status TEXT CHECK (status IN ('pending', 'viewed', 'dismissed', 'applied')) DEFAULT 'pending',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(user_id, property_id, recommendation_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_property_interactions_user_id ON property_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_property_interactions_property_id ON property_interactions(property_id);
CREATE INDEX IF NOT EXISTS idx_property_interactions_type ON property_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_property_interactions_created_at ON property_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_smart_recommendations_user_id ON smart_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_recommendations_property_id ON smart_recommendations(property_id);
CREATE INDEX IF NOT EXISTS idx_smart_recommendations_score ON smart_recommendations(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_smart_recommendations_status ON smart_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_smart_recommendations_type ON smart_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_smart_recommendations_created_at ON smart_recommendations(created_at DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_recommendations ENABLE ROW LEVEL SECURITY;

-- User Preferences Policies
CREATE POLICY "Users can view their own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" ON user_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Property Interactions Policies
CREATE POLICY "Users can view their own interactions" ON property_interactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions" ON property_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Property owners and admins can view interactions on their properties
CREATE POLICY "Property owners can view interactions on their properties" ON property_interactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = property_interactions.property_id
            AND p.owner_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'manager')
        )
    );

-- Smart Recommendations Policies
CREATE POLICY "Users can view their own recommendations" ON smart_recommendations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations" ON smart_recommendations
    FOR UPDATE USING (auth.uid() = user_id);

-- System can insert recommendations (for background jobs)
CREATE POLICY "System can insert recommendations" ON smart_recommendations
    FOR INSERT WITH CHECK (true);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for user_preferences updated_at
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate property compatibility score
CREATE OR REPLACE FUNCTION calculate_property_compatibility(
    user_prefs JSONB,
    property_data JSONB
)
RETURNS DECIMAL AS $$
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
$$ LANGUAGE plpgsql;

-- Function to generate daily recommendations (to be called by cron job)
CREATE OR REPLACE FUNCTION generate_daily_recommendations()
RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_preferences TO authenticated;
GRANT ALL ON property_interactions TO authenticated;
GRANT ALL ON smart_recommendations TO authenticated;

-- Insert sample data for testing (optional)
-- This would be removed in production
/*
INSERT INTO user_preferences (
    user_id,
    min_budget,
    max_budget,
    preferred_areas,
    property_types,
    min_bedrooms,
    min_bathrooms
) VALUES (
    '00000000-0000-0000-0000-000000000001', -- Replace with actual user ID
    1000000,
    5000000,
    ARRAY['Victoria Island', 'Lekki'],
    ARRAY['apartment', 'duplex'],
    2,
    2
) ON CONFLICT (user_id) DO NOTHING;
*/
