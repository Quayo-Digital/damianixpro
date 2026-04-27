// Intelligent Document Processing System Types

export type DocumentType =
  | 'lease_agreement'
  | 'tenant_application'
  | 'id_card'
  | 'passport'
  | 'drivers_license'
  | 'bank_statement'
  | 'pay_slip'
  | 'utility_bill'
  | 'property_deed'
  | 'property_certificate'
  | 'tax_document'
  | 'insurance_document'
  | 'maintenance_receipt'
  | 'invoice'
  | 'contract'
  | 'other';

export type DocumentStatus =
  | 'uploaded'
  | 'processing'
  | 'processed'
  | 'verified'
  | 'rejected'
  | 'expired'
  | 'archived';

export type ExtractionConfidence = 'high' | 'medium' | 'low';

export type ProcessingStage =
  | 'upload'
  | 'classification'
  | 'ocr_extraction'
  | 'data_validation'
  | 'verification'
  | 'completion';

export interface DocumentMetadata {
  id: string;
  user_id: string;
  property_id?: string;
  tenant_id?: string;
  lease_id?: string;
  original_filename: string;
  file_size: number;
  file_type: string;
  upload_date: string;
  document_type: DocumentType;
  status: DocumentStatus;
  processing_stage: ProcessingStage;
  confidence_score: number; // 0-1
  is_sensitive: boolean;
  retention_period_days?: number;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ExtractedField {
  field_name: string;
  field_value: string;
  confidence: ExtractionConfidence;
  bounding_box?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  validation_status: 'valid' | 'invalid' | 'needs_review';
  validation_message?: string;
}

export interface DocumentExtraction {
  id: string;
  document_id: string;
  extraction_method: 'ocr' | 'ai_vision' | 'manual' | 'hybrid';
  extracted_text: string;
  structured_data: ExtractedField[];
  key_value_pairs: Record<string, any>;
  tables?: TableExtraction[];
  signatures?: SignatureDetection[];
  stamps?: StampDetection[];
  overall_confidence: number;
  processing_time_ms: number;
  created_at: string;
}

export interface TableExtraction {
  table_id: string;
  rows: number;
  columns: number;
  headers: string[];
  data: string[][];
  confidence: number;
  bounding_box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface SignatureDetection {
  signature_id: string;
  detected: boolean;
  confidence: number;
  signer_name?: string;
  signature_date?: string;
  bounding_box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface StampDetection {
  stamp_id: string;
  stamp_type: 'official' | 'notary' | 'company' | 'date' | 'other';
  detected: boolean;
  confidence: number;
  stamp_text?: string;
  stamp_date?: string;
  bounding_box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface DocumentClassification {
  id: string;
  document_id: string;
  predicted_type: DocumentType;
  confidence_score: number;
  alternative_predictions: {
    type: DocumentType;
    confidence: number;
  }[];
  classification_features: string[];
  manual_override?: DocumentType;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
}

export interface DocumentValidation {
  id: string;
  document_id: string;
  validation_rules: ValidationRule[];
  validation_results: ValidationResult[];
  overall_status: 'passed' | 'failed' | 'warning';
  compliance_checks: ComplianceCheck[];
  fraud_detection: FraudDetection;
  created_at: string;
  updated_at: string;
}

export interface ValidationRule {
  rule_id: string;
  rule_name: string;
  rule_type:
    | 'required_field'
    | 'format_check'
    | 'date_validation'
    | 'amount_validation'
    | 'cross_reference';
  rule_description: string;
  is_critical: boolean;
}

export interface ValidationResult {
  rule_id: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
  field_name?: string;
  expected_value?: string;
  actual_value?: string;
  suggestions?: string[];
}

export interface ComplianceCheck {
  check_id: string;
  check_name: string;
  regulation: string; // e.g., "Nigerian Data Protection Regulation", "KYC Requirements"
  status: 'compliant' | 'non_compliant' | 'partial';
  details: string;
  required_actions?: string[];
}

export interface FraudDetection {
  risk_score: number; // 0-100
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  detected_anomalies: FraudAnomaly[];
  verification_recommendations: string[];
}

export interface FraudAnomaly {
  anomaly_type:
    | 'altered_text'
    | 'inconsistent_fonts'
    | 'suspicious_patterns'
    | 'duplicate_document'
    | 'invalid_format';
  description: string;
  confidence: number;
  location?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface DocumentWorkflow {
  id: string;
  document_id: string;
  workflow_type:
    | 'tenant_onboarding'
    | 'lease_processing'
    | 'kyc_verification'
    | 'maintenance_claim'
    | 'payment_verification';
  current_stage: string;
  stages: WorkflowStage[];
  assigned_to?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'on_hold';
  created_at: string;
  updated_at: string;
}

export interface WorkflowStage {
  stage_id: string;
  stage_name: string;
  stage_type: 'automated' | 'manual_review' | 'approval' | 'notification';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  assigned_to?: string;
  completed_by?: string;
  completed_at?: string;
  notes?: string;
  required_actions?: string[];
}

export interface DocumentTemplate {
  id: string;
  template_name: string;
  document_type: DocumentType;
  template_fields: TemplateField[];
  validation_rules: ValidationRule[];
  auto_fill_mappings: Record<string, string>;
  is_active: boolean;
  version: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateField {
  field_id: string;
  field_name: string;
  field_type: 'text' | 'number' | 'date' | 'currency' | 'boolean' | 'select' | 'signature';
  is_required: boolean;
  validation_pattern?: string;
  default_value?: string;
  options?: string[]; // for select fields
  extraction_hints: string[]; // keywords to help with extraction
}

export interface DocumentInsight {
  id: string;
  insight_type:
    | 'processing_efficiency'
    | 'error_patterns'
    | 'compliance_trends'
    | 'fraud_detection'
    | 'user_behavior';
  title: string;
  description: string;
  metrics: Record<string, number>;
  recommendations: string[];
  impact_level: 'low' | 'medium' | 'high';
  date_range: {
    start: string;
    end: string;
  };
  created_at: string;
}

export interface DocumentProcessingSettings {
  user_id: string;
  auto_classification_enabled: boolean;
  auto_extraction_enabled: boolean;
  fraud_detection_enabled: boolean;
  notification_preferences: {
    processing_complete: boolean;
    validation_failed: boolean;
    fraud_detected: boolean;
    workflow_updates: boolean;
  };
  retention_policies: {
    default_retention_days: number;
    auto_archive_enabled: boolean;
    secure_deletion_enabled: boolean;
  };
  quality_thresholds: {
    min_confidence_score: number;
    require_manual_review_below: number;
    auto_approve_above: number;
  };
  created_at: string;
  updated_at: string;
}

// API Response Types
export interface DocumentProcessingResponse {
  document: DocumentMetadata;
  extraction: DocumentExtraction;
  classification: DocumentClassification;
  validation: DocumentValidation;
  workflow?: DocumentWorkflow;
}

export interface DocumentAnalytics {
  total_documents: number;
  documents_by_type: Record<DocumentType, number>;
  documents_by_status: Record<DocumentStatus, number>;
  processing_metrics: {
    average_processing_time_ms: number;
    success_rate: number;
    manual_review_rate: number;
    fraud_detection_rate: number;
  };
  compliance_metrics: {
    compliance_rate: number;
    common_violations: string[];
    regulatory_updates_needed: number;
  };
  efficiency_metrics: {
    automation_rate: number;
    time_saved_hours: number;
    cost_savings: number;
    error_reduction_percentage: number;
  };
}

// Utility Types
export interface DocumentFilters {
  document_types?: DocumentType[];
  statuses?: DocumentStatus[];
  date_range?: {
    start: string;
    end: string;
  };
  confidence_range?: {
    min: number;
    max: number;
  };
  user_ids?: string[];
  property_ids?: string[];
  has_fraud_alerts?: boolean;
  needs_review?: boolean;
}

export interface DocumentSortOptions {
  field: 'upload_date' | 'processing_time' | 'confidence_score' | 'file_size' | 'status';
  direction: 'asc' | 'desc';
}

// Processing Configuration
export interface ProcessingConfig {
  ocr_engine: 'tesseract' | 'google_vision' | 'azure_cognitive' | 'aws_textract';
  language_codes: string[]; // e.g., ['en', 'yo', 'ig', 'ha'] for Nigerian languages
  enable_handwriting_recognition: boolean;
  enable_table_extraction: boolean;
  enable_signature_detection: boolean;
  enable_fraud_detection: boolean;
  quality_enhancement: boolean;
  parallel_processing: boolean;
  max_file_size_mb: number;
  supported_formats: string[];
}

// Error Types
export interface ProcessingError {
  error_code: string;
  error_message: string;
  error_type: 'upload_error' | 'processing_error' | 'validation_error' | 'system_error';
  field_name?: string;
  suggestions?: string[];
  retry_possible: boolean;
  timestamp: string;
}
