-- Intelligent Document Processing System Migration
-- Created: 2025-08-01
-- Description: Database schema for AI-powered document processing, extraction, classification, and validation

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Document metadata table
CREATE TABLE IF NOT EXISTS document_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    lease_id UUID REFERENCES leases(id) ON DELETE SET NULL,
    original_filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    upload_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    document_type TEXT NOT NULL DEFAULT 'other' CHECK (document_type IN (
        'lease_agreement', 'tenant_application', 'id_card', 'passport', 
        'drivers_license', 'bank_statement', 'pay_slip', 'utility_bill',
        'property_deed', 'property_certificate', 'tax_document', 
        'insurance_document', 'maintenance_receipt', 'invoice', 'contract', 'other'
    )),
    status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN (
        'uploaded', 'processing', 'processed', 'verified', 'rejected', 'expired', 'archived'
    )),
    processing_stage TEXT NOT NULL DEFAULT 'upload' CHECK (processing_stage IN (
        'upload', 'classification', 'ocr_extraction', 'data_validation', 'verification', 'completion'
    )),
    confidence_score DECIMAL(3,2) DEFAULT 0.0 CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    is_sensitive BOOLEAN DEFAULT FALSE,
    retention_period_days INTEGER DEFAULT 2555, -- 7 years default
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Document extractions table
CREATE TABLE IF NOT EXISTS document_extractions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES document_metadata(id) ON DELETE CASCADE,
    extraction_method TEXT NOT NULL DEFAULT 'ai_vision' CHECK (extraction_method IN (
        'ocr', 'ai_vision', 'manual', 'hybrid'
    )),
    extracted_text TEXT NOT NULL,
    structured_data JSONB NOT NULL DEFAULT '[]',
    key_value_pairs JSONB NOT NULL DEFAULT '{}',
    tables JSONB DEFAULT '[]',
    signatures JSONB DEFAULT '[]',
    stamps JSONB DEFAULT '[]',
    overall_confidence DECIMAL(3,2) DEFAULT 0.0,
    processing_time_ms INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Document classifications table
CREATE TABLE IF NOT EXISTS document_classifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES document_metadata(id) ON DELETE CASCADE,
    predicted_type TEXT NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL,
    alternative_predictions JSONB DEFAULT '[]',
    classification_features JSONB DEFAULT '[]',
    manual_override TEXT,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Document validations table
CREATE TABLE IF NOT EXISTS document_validations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES document_metadata(id) ON DELETE CASCADE,
    validation_rules JSONB NOT NULL DEFAULT '[]',
    validation_results JSONB NOT NULL DEFAULT '[]',
    overall_status TEXT NOT NULL CHECK (overall_status IN ('passed', 'failed', 'warning')),
    compliance_checks JSONB DEFAULT '[]',
    fraud_detection JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Document workflows table
CREATE TABLE IF NOT EXISTS document_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES document_metadata(id) ON DELETE CASCADE,
    workflow_type TEXT NOT NULL CHECK (workflow_type IN (
        'tenant_onboarding', 'lease_processing', 'kyc_verification', 
        'maintenance_claim', 'payment_verification'
    )),
    current_stage TEXT NOT NULL,
    stages JSONB NOT NULL DEFAULT '[]',
    assigned_to UUID REFERENCES auth.users(id),
    due_date TIMESTAMPTZ,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'in_progress', 'completed', 'rejected', 'on_hold'
    )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Document templates table
CREATE TABLE IF NOT EXISTS document_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name TEXT NOT NULL,
    document_type TEXT NOT NULL,
    template_fields JSONB NOT NULL DEFAULT '[]',
    validation_rules JSONB NOT NULL DEFAULT '[]',
    auto_fill_mappings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    version TEXT NOT NULL DEFAULT '1.0',
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Document processing settings table
CREATE TABLE IF NOT EXISTS document_processing_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    auto_classification_enabled BOOLEAN DEFAULT TRUE,
    auto_extraction_enabled BOOLEAN DEFAULT TRUE,
    fraud_detection_enabled BOOLEAN DEFAULT TRUE,
    notification_preferences JSONB DEFAULT '{
        "processing_complete": true,
        "validation_failed": true,
        "fraud_detected": true,
        "workflow_updates": true
    }',
    retention_policies JSONB DEFAULT '{
        "default_retention_days": 2555,
        "auto_archive_enabled": true,
        "secure_deletion_enabled": true
    }',
    quality_thresholds JSONB DEFAULT '{
        "min_confidence_score": 0.5,
        "require_manual_review_below": 0.7,
        "auto_approve_above": 0.9
    }',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Document insights table for analytics
CREATE TABLE IF NOT EXISTS document_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    insight_type TEXT NOT NULL CHECK (insight_type IN (
        'processing_efficiency', 'error_patterns', 'compliance_trends', 
        'fraud_detection', 'user_behavior'
    )),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    metrics JSONB NOT NULL DEFAULT '{}',
    recommendations JSONB DEFAULT '[]',
    impact_level TEXT NOT NULL DEFAULT 'medium' CHECK (impact_level IN ('low', 'medium', 'high')),
    date_range JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_metadata_user_id ON document_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_document_metadata_property_id ON document_metadata(property_id);
CREATE INDEX IF NOT EXISTS idx_document_metadata_document_type ON document_metadata(document_type);
CREATE INDEX IF NOT EXISTS idx_document_metadata_status ON document_metadata(status);
CREATE INDEX IF NOT EXISTS idx_document_metadata_upload_date ON document_metadata(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_document_metadata_confidence ON document_metadata(confidence_score);

CREATE INDEX IF NOT EXISTS idx_document_extractions_document_id ON document_extractions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_extractions_method ON document_extractions(extraction_method);

CREATE INDEX IF NOT EXISTS idx_document_classifications_document_id ON document_classifications(document_id);
CREATE INDEX IF NOT EXISTS idx_document_classifications_type ON document_classifications(predicted_type);

CREATE INDEX IF NOT EXISTS idx_document_validations_document_id ON document_validations(document_id);
CREATE INDEX IF NOT EXISTS idx_document_validations_status ON document_validations(overall_status);

CREATE INDEX IF NOT EXISTS idx_document_workflows_document_id ON document_workflows(document_id);
CREATE INDEX IF NOT EXISTS idx_document_workflows_assigned_to ON document_workflows(assigned_to);
CREATE INDEX IF NOT EXISTS idx_document_workflows_status ON document_workflows(status);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_document_extractions_text_search 
ON document_extractions USING gin(to_tsvector('english', extracted_text));

CREATE INDEX IF NOT EXISTS idx_document_metadata_filename_search 
ON document_metadata USING gin(to_tsvector('english', original_filename));

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_document_metadata_user_status_date 
ON document_metadata(user_id, status, upload_date DESC);

CREATE INDEX IF NOT EXISTS idx_document_metadata_property_type_date 
ON document_metadata(property_id, document_type, upload_date DESC);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_document_metadata_updated_at 
    BEFORE UPDATE ON document_metadata 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_validations_updated_at 
    BEFORE UPDATE ON document_validations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_workflows_updated_at 
    BEFORE UPDATE ON document_workflows 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_templates_updated_at 
    BEFORE UPDATE ON document_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_processing_settings_updated_at 
    BEFORE UPDATE ON document_processing_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically set document expiration
CREATE OR REPLACE FUNCTION set_document_expiration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.retention_period_days IS NOT NULL THEN
        NEW.expires_at = NEW.created_at + (NEW.retention_period_days || ' days')::INTERVAL;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_document_expiration_trigger
    BEFORE INSERT OR UPDATE ON document_metadata
    FOR EACH ROW EXECUTE FUNCTION set_document_expiration();

-- Function to clean up expired documents
CREATE OR REPLACE FUNCTION cleanup_expired_documents()
RETURNS INTEGER AS $$
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
$$ language 'plpgsql';

-- Row Level Security (RLS) Policies
ALTER TABLE document_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_processing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_insights ENABLE ROW LEVEL SECURITY;

-- Policies for document_metadata
CREATE POLICY "Users can view their own documents" ON document_metadata
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" ON document_metadata
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" ON document_metadata
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" ON document_metadata
    FOR DELETE USING (auth.uid() = user_id);

-- Property owners can view documents related to their properties
CREATE POLICY "Property owners can view property documents" ON document_metadata
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM properties WHERE owner_id = auth.uid()
        )
    );

-- Policies for document_extractions
CREATE POLICY "Users can view extractions of their documents" ON document_extractions
    FOR SELECT USING (
        document_id IN (
            SELECT id FROM document_metadata WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert extractions for their documents" ON document_extractions
    FOR INSERT WITH CHECK (
        document_id IN (
            SELECT id FROM document_metadata WHERE user_id = auth.uid()
        )
    );

-- Policies for document_classifications
CREATE POLICY "Users can view classifications of their documents" ON document_classifications
    FOR SELECT USING (
        document_id IN (
            SELECT id FROM document_metadata WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert classifications for their documents" ON document_classifications
    FOR INSERT WITH CHECK (
        document_id IN (
            SELECT id FROM document_metadata WHERE user_id = auth.uid()
        )
    );

-- Policies for document_validations
CREATE POLICY "Users can view validations of their documents" ON document_validations
    FOR SELECT USING (
        document_id IN (
            SELECT id FROM document_metadata WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert validations for their documents" ON document_validations
    FOR INSERT WITH CHECK (
        document_id IN (
            SELECT id FROM document_metadata WHERE user_id = auth.uid()
        )
    );

-- Policies for document_workflows
CREATE POLICY "Users can view workflows of their documents" ON document_workflows
    FOR SELECT USING (
        document_id IN (
            SELECT id FROM document_metadata WHERE user_id = auth.uid()
        ) OR assigned_to = auth.uid()
    );

CREATE POLICY "Users can manage workflows for their documents" ON document_workflows
    FOR ALL USING (
        document_id IN (
            SELECT id FROM document_metadata WHERE user_id = auth.uid()
        ) OR assigned_to = auth.uid()
    );

-- Policies for document_templates
CREATE POLICY "Users can view public templates" ON document_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage their own templates" ON document_templates
    FOR ALL USING (created_by = auth.uid());

-- Policies for document_processing_settings
CREATE POLICY "Users can manage their own settings" ON document_processing_settings
    FOR ALL USING (user_id = auth.uid());

-- Policies for document_insights (admin only for now)
CREATE POLICY "Admin can view all insights" ON document_insights
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload their own documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'documents' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'documents' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own documents" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'documents' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'documents' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Create default processing settings for existing users
INSERT INTO document_processing_settings (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Create function to initialize settings for new users
CREATE OR REPLACE FUNCTION create_default_document_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO document_processing_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create default settings for new users
CREATE TRIGGER create_document_settings_for_new_user
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_default_document_settings();

-- Create sample document templates
INSERT INTO document_templates (template_name, document_type, template_fields, validation_rules, created_by) VALUES
(
    'Nigerian Lease Agreement Template',
    'lease_agreement',
    '[
        {"field_id": "landlord_name", "field_name": "Landlord Name", "field_type": "text", "is_required": true},
        {"field_id": "tenant_name", "field_name": "Tenant Name", "field_type": "text", "is_required": true},
        {"field_id": "property_address", "field_name": "Property Address", "field_type": "text", "is_required": true},
        {"field_id": "monthly_rent", "field_name": "Monthly Rent", "field_type": "currency", "is_required": true},
        {"field_id": "lease_start", "field_name": "Lease Start Date", "field_type": "date", "is_required": true},
        {"field_id": "lease_end", "field_name": "Lease End Date", "field_type": "date", "is_required": true},
        {"field_id": "security_deposit", "field_name": "Security Deposit", "field_type": "currency", "is_required": true}
    ]',
    '[
        {"rule_id": "rent_required", "rule_name": "Rent Amount Required", "rule_type": "required_field", "is_critical": true},
        {"rule_id": "date_validation", "rule_name": "Valid Date Range", "rule_type": "date_validation", "is_critical": true}
    ]',
    (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin' LIMIT 1)
),
(
    'Nigerian ID Card Template',
    'id_card',
    '[
        {"field_id": "full_name", "field_name": "Full Name", "field_type": "text", "is_required": true},
        {"field_id": "nin", "field_name": "National Identification Number", "field_type": "text", "is_required": true, "validation_pattern": "^\\d{11}$"},
        {"field_id": "date_of_birth", "field_name": "Date of Birth", "field_type": "date", "is_required": true},
        {"field_id": "place_of_birth", "field_name": "Place of Birth", "field_type": "text", "is_required": true},
        {"field_id": "gender", "field_name": "Gender", "field_type": "select", "options": ["Male", "Female"], "is_required": true},
        {"field_id": "address", "field_name": "Address", "field_type": "text", "is_required": true}
    ]',
    '[
        {"rule_id": "nin_format", "rule_name": "Valid NIN Format", "rule_type": "format_check", "is_critical": true},
        {"rule_id": "name_required", "rule_name": "Full Name Required", "rule_type": "required_field", "is_critical": true}
    ]',
    (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin' LIMIT 1)
)
ON CONFLICT DO NOTHING;

-- Create indexes for JSONB fields
CREATE INDEX IF NOT EXISTS idx_document_extractions_structured_data 
ON document_extractions USING gin(structured_data);

CREATE INDEX IF NOT EXISTS idx_document_extractions_key_value_pairs 
ON document_extractions USING gin(key_value_pairs);

CREATE INDEX IF NOT EXISTS idx_document_validations_fraud_detection 
ON document_validations USING gin(fraud_detection);

-- Comments for documentation
COMMENT ON TABLE document_metadata IS 'Core document metadata and file information';
COMMENT ON TABLE document_extractions IS 'AI-extracted text and structured data from documents';
COMMENT ON TABLE document_classifications IS 'AI-powered document type classification results';
COMMENT ON TABLE document_validations IS 'Document validation results including compliance and fraud detection';
COMMENT ON TABLE document_workflows IS 'Document processing workflows and approval chains';
COMMENT ON TABLE document_templates IS 'Predefined document templates for extraction and validation';
COMMENT ON TABLE document_processing_settings IS 'User-specific document processing preferences';
COMMENT ON TABLE document_insights IS 'Analytics and insights about document processing performance';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
