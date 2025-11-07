-- Voice Assistant System Migration
-- This migration creates tables and policies for voice assistant functionality

-- Create voice_assistant_settings table
CREATE TABLE IF NOT EXISTS voice_assistant_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT true,
    language VARCHAR(10) DEFAULT 'en-NG',
    voice_type VARCHAR(10) DEFAULT 'auto' CHECK (voice_type IN ('auto', 'male', 'female')),
    speech_rate DECIMAL(3,1) DEFAULT 1.0 CHECK (speech_rate >= 0.5 AND speech_rate <= 2.0),
    speech_pitch DECIMAL(3,1) DEFAULT 1.0 CHECK (speech_pitch >= 0.0 AND speech_pitch <= 2.0),
    speech_volume DECIMAL(3,1) DEFAULT 0.8 CHECK (speech_volume >= 0.0 AND speech_volume <= 1.0),
    wake_word_enabled BOOLEAN DEFAULT false,
    wake_word VARCHAR(50) DEFAULT 'Hey Nigeria Homes',
    continuous_listening BOOLEAN DEFAULT false,
    auto_execute_commands BOOLEAN DEFAULT false,
    confirmation_required BOOLEAN DEFAULT true,
    privacy_mode BOOLEAN DEFAULT false,
    noise_cancellation BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create voice_command_history table
CREATE TABLE IF NOT EXISTS voice_command_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    command TEXT NOT NULL,
    intent VARCHAR(50) NOT NULL,
    entities JSONB DEFAULT '[]'::jsonb,
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
    success BOOLEAN NOT NULL DEFAULT false,
    response TEXT,
    action_taken VARCHAR(100),
    processing_time_ms INTEGER,
    error_message TEXT,
    session_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create voice_assistant_analytics table for usage tracking
CREATE TABLE IF NOT EXISTS voice_assistant_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_commands INTEGER DEFAULT 0,
    successful_commands INTEGER DEFAULT 0,
    failed_commands INTEGER DEFAULT 0,
    average_confidence DECIMAL(3,2) DEFAULT 0.0,
    most_used_intent VARCHAR(50),
    total_session_time_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_voice_assistant_settings_user_id ON voice_assistant_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_command_history_user_id ON voice_command_history(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_command_history_created_at ON voice_command_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_command_history_intent ON voice_command_history(intent);
CREATE INDEX IF NOT EXISTS idx_voice_command_history_session_id ON voice_command_history(session_id);
CREATE INDEX IF NOT EXISTS idx_voice_assistant_analytics_user_date ON voice_assistant_analytics(user_id, date);

-- Enable Row Level Security
ALTER TABLE voice_assistant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_command_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_assistant_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for voice_assistant_settings
CREATE POLICY "Users can view their own voice assistant settings"
    ON voice_assistant_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice assistant settings"
    ON voice_assistant_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice assistant settings"
    ON voice_assistant_settings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice assistant settings"
    ON voice_assistant_settings FOR DELETE
    USING (auth.uid() = user_id);

-- Create RLS policies for voice_command_history
CREATE POLICY "Users can view their own voice command history"
    ON voice_command_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice command history"
    ON voice_command_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice command history"
    ON voice_command_history FOR DELETE
    USING (auth.uid() = user_id);

-- Create RLS policies for voice_assistant_analytics
CREATE POLICY "Users can view their own voice assistant analytics"
    ON voice_assistant_analytics FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice assistant analytics"
    ON voice_assistant_analytics FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice assistant analytics"
    ON voice_assistant_analytics FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_voice_assistant_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_voice_assistant_settings_updated_at
    BEFORE UPDATE ON voice_assistant_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_voice_assistant_updated_at();

CREATE TRIGGER update_voice_assistant_analytics_updated_at
    BEFORE UPDATE ON voice_assistant_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_voice_assistant_updated_at();

-- Create function to clean up old command history (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_voice_commands()
RETURNS void AS $$
BEGIN
    DELETE FROM voice_command_history 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create function to update daily analytics
CREATE OR REPLACE FUNCTION update_voice_analytics(
    p_user_id UUID,
    p_command_success BOOLEAN,
    p_confidence DECIMAL,
    p_intent VARCHAR,
    p_session_time_minutes INTEGER DEFAULT 0
)
RETURNS void AS $$
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
$$ LANGUAGE plpgsql;

-- Create function to get voice assistant statistics
CREATE OR REPLACE FUNCTION get_voice_assistant_stats(p_user_id UUID)
RETURNS TABLE (
    total_commands BIGINT,
    successful_commands BIGINT,
    success_rate DECIMAL,
    average_confidence DECIMAL,
    most_used_intent VARCHAR,
    commands_today INTEGER,
    commands_this_week INTEGER,
    commands_this_month INTEGER
) AS $$
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
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON voice_assistant_settings TO authenticated;
GRANT ALL ON voice_command_history TO authenticated;
GRANT ALL ON voice_assistant_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION update_voice_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_voice_assistant_stats TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_voice_commands TO authenticated;

-- Insert default voice assistant settings for existing users
INSERT INTO voice_assistant_settings (user_id, enabled, language)
SELECT id, true, 'en-NG'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM voice_assistant_settings)
ON CONFLICT (user_id) DO NOTHING;

-- Create a scheduled job to clean up old command history (if pg_cron is available)
-- This would typically be set up separately in production
-- SELECT cron.schedule('cleanup-voice-commands', '0 2 * * *', 'SELECT cleanup_old_voice_commands();');

COMMENT ON TABLE voice_assistant_settings IS 'User-specific voice assistant configuration and preferences';
COMMENT ON TABLE voice_command_history IS 'Historical record of voice commands and their processing results';
COMMENT ON TABLE voice_assistant_analytics IS 'Daily aggregated analytics for voice assistant usage';
COMMENT ON FUNCTION update_voice_analytics IS 'Updates daily voice assistant analytics when commands are processed';
COMMENT ON FUNCTION get_voice_assistant_stats IS 'Retrieves comprehensive voice assistant statistics for a user';
COMMENT ON FUNCTION cleanup_old_voice_commands IS 'Removes voice command history older than 30 days to maintain performance';
