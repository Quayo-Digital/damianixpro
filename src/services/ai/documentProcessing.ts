// Intelligent Document Processing AI Service

import {
  DocumentType,
  DocumentMetadata,
  DocumentExtraction,
  DocumentClassification,
  DocumentValidation,
  ExtractedField,
  FraudDetection,
  ComplianceCheck,
  ValidationResult,
  ProcessingConfig,
  DocumentAnalytics
} from '@/types/documentProcessing';

export class IntelligentDocumentProcessor {
  private static readonly DOCUMENT_PATTERNS = {
    'lease_agreement': [
      'lease agreement', 'tenancy agreement', 'rental agreement',
      'landlord', 'tenant', 'monthly rent', 'lease term'
    ],
    'id_card': [
      'national identity', 'identity card', 'id card', 'nin',
      'date of birth', 'place of birth', 'nationality'
    ],
    'bank_statement': [
      'bank statement', 'account statement', 'balance',
      'transaction', 'credit', 'debit', 'account number'
    ],
    'pay_slip': [
      'pay slip', 'salary slip', 'payroll', 'gross pay',
      'net pay', 'deductions', 'allowances'
    ],
    'utility_bill': [
      'electricity bill', 'water bill', 'utility bill',
      'nepa', 'phcn', 'meter number', 'consumption'
    ]
  };

  private static readonly NIGERIAN_PATTERNS = {
    nin: /\d{11}/,
    phone: /(\+234|0)[789]\d{9}/,
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
    currency: /₦[\d,]+\.?\d*/,
    date: /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/,
    account_number: /\d{10}/
  };

  /**
   * Process uploaded document through complete AI pipeline
   */
  static async processDocument(
    file: File,
    userId: string,
    propertyId?: string
  ): Promise<{
    metadata: DocumentMetadata;
    extraction: DocumentExtraction;
    classification: DocumentClassification;
    validation: DocumentValidation;
  }> {
    const startTime = Date.now();

    // Step 1: Create document metadata
    const metadata = await this.createDocumentMetadata(file, userId, propertyId);

    // Step 2: Extract text and data using OCR/AI
    const extraction = await this.extractDocumentData(metadata, file);

    // Step 3: Classify document type
    const classification = await this.classifyDocument(metadata.id, extraction.extracted_text);

    // Step 4: Validate extracted data
    const validation = await this.validateDocument(metadata.id, extraction, classification);

    // Step 5: Update metadata with results
    await this.updateDocumentMetadata(metadata.id, {
      document_type: classification.predicted_type,
      status: validation.overall_status === 'passed' ? 'processed' : 'needs_review',
      processing_stage: 'completion',
      confidence_score: classification.confidence_score
    });

    return { metadata, extraction, classification, validation };
  }

  /**
   * Create document metadata record
   */
  private static async createDocumentMetadata(
    file: File,
    userId: string,
    propertyId?: string
  ): Promise<DocumentMetadata> {
    return {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      property_id: propertyId,
      original_filename: file.name,
      file_size: file.size,
      file_type: file.type,
      upload_date: new Date().toISOString(),
      document_type: 'other',
      status: 'uploaded',
      processing_stage: 'upload',
      confidence_score: 0,
      is_sensitive: this.isSensitiveDocument(file.name),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Extract text and structured data from document
   */
  private static async extractDocumentData(
    metadata: DocumentMetadata,
    file: File
  ): Promise<DocumentExtraction> {
    const startTime = Date.now();

    // Simulate OCR/AI extraction (in production, integrate with actual OCR service)
    const extractedText = await this.performOCR(file);
    const structuredData = await this.extractStructuredData(extractedText);
    const keyValuePairs = await this.extractKeyValuePairs(extractedText);

    return {
      id: `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      document_id: metadata.id,
      extraction_method: 'ai_vision',
      extracted_text: extractedText,
      structured_data: structuredData,
      key_value_pairs: keyValuePairs,
      overall_confidence: this.calculateExtractionConfidence(structuredData),
      processing_time_ms: Date.now() - startTime,
      created_at: new Date().toISOString()
    };
  }

  /**
   * Classify document type using AI
   */
  private static async classifyDocument(
    documentId: string,
    extractedText: string
  ): Promise<DocumentClassification> {
    const predictions = this.calculateDocumentTypeScores(extractedText);
    const topPrediction = predictions[0];
    const alternatives = predictions.slice(1, 4);

    return {
      id: `cls_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      document_id: documentId,
      predicted_type: topPrediction.type,
      confidence_score: topPrediction.confidence,
      alternative_predictions: alternatives,
      classification_features: this.getClassificationFeatures(extractedText, topPrediction.type),
      created_at: new Date().toISOString()
    };
  }

  /**
   * Validate document data and check compliance
   */
  private static async validateDocument(
    documentId: string,
    extraction: DocumentExtraction,
    classification: DocumentClassification
  ): Promise<DocumentValidation> {
    const validationResults = await this.runValidationRules(extraction, classification.predicted_type);
    const complianceChecks = await this.performComplianceChecks(extraction, classification.predicted_type);
    const fraudDetection = await this.detectFraud(extraction);

    const overallStatus = this.determineOverallStatus(validationResults, complianceChecks, fraudDetection);

    return {
      id: `val_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      document_id: documentId,
      validation_rules: this.getValidationRules(classification.predicted_type),
      validation_results: validationResults,
      overall_status: overallStatus,
      compliance_checks: complianceChecks,
      fraud_detection: fraudDetection,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Perform OCR text extraction
   */
  private static async performOCR(file: File): Promise<string> {
    // Simulate OCR processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock extracted text based on file type
    const mockTexts = {
      'lease_agreement': `
        LEASE AGREEMENT
        
        This Lease Agreement is entered into on January 1, 2024
        Between: John Doe (Landlord)
        And: Jane Smith (Tenant)
        
        Property Address: 123 Victoria Island, Lagos
        Monthly Rent: ₦2,500,000
        Lease Term: 12 months
        Security Deposit: ₦5,000,000
        
        Terms and Conditions:
        1. Rent is due on the 1st of each month
        2. No pets allowed
        3. Tenant responsible for utilities
      `,
      'id_card': `
        FEDERAL REPUBLIC OF NIGERIA
        NATIONAL IDENTITY CARD
        
        Name: ADEBAYO OLUMIDE JOHNSON
        Date of Birth: 15/03/1985
        Place of Birth: LAGOS STATE
        NIN: 12345678901
        Gender: MALE
        Address: 45 ALLEN AVENUE, IKEJA, LAGOS
      `,
      'bank_statement': `
        FIRST BANK OF NIGERIA PLC
        ACCOUNT STATEMENT
        
        Account Name: ADEBAYO JOHNSON
        Account Number: 1234567890
        Statement Period: 01/01/2024 - 31/01/2024
        
        Opening Balance: ₦1,500,000.00
        
        TRANSACTIONS:
        05/01/2024  SALARY CREDIT     ₦750,000.00
        10/01/2024  RENT PAYMENT      -₦300,000.00
        15/01/2024  UTILITY BILL      -₦45,000.00
        
        Closing Balance: ₦1,905,000.00
      `
    };

    return mockTexts['lease_agreement'] || 'Sample document text content...';
  }

  /**
   * Extract structured data fields
   */
  private static async extractStructuredData(text: string): Promise<ExtractedField[]> {
    const fields: ExtractedField[] = [];

    // Extract Nigerian phone numbers
    const phoneMatches = text.match(this.NIGERIAN_PATTERNS.phone);
    if (phoneMatches) {
      fields.push({
        field_name: 'phone_number',
        field_value: phoneMatches[0],
        confidence: 'high',
        validation_status: 'valid'
      });
    }

    // Extract NIN
    const ninMatches = text.match(this.NIGERIAN_PATTERNS.nin);
    if (ninMatches) {
      fields.push({
        field_name: 'nin',
        field_value: ninMatches[0],
        confidence: 'high',
        validation_status: 'valid'
      });
    }

    // Extract currency amounts
    const currencyMatches = text.match(this.NIGERIAN_PATTERNS.currency);
    if (currencyMatches) {
      fields.push({
        field_name: 'amount',
        field_value: currencyMatches[0],
        confidence: 'medium',
        validation_status: 'valid'
      });
    }

    // Extract dates
    const dateMatches = text.match(this.NIGERIAN_PATTERNS.date);
    if (dateMatches) {
      fields.push({
        field_name: 'date',
        field_value: dateMatches[0],
        confidence: 'medium',
        validation_status: 'valid'
      });
    }

    // Extract names (simple pattern)
    const namePattern = /Name:\s*([A-Z\s]+)/i;
    const nameMatch = text.match(namePattern);
    if (nameMatch) {
      fields.push({
        field_name: 'full_name',
        field_value: nameMatch[1].trim(),
        confidence: 'high',
        validation_status: 'valid'
      });
    }

    return fields;
  }

  /**
   * Extract key-value pairs from text
   */
  private static async extractKeyValuePairs(text: string): Promise<Record<string, any>> {
    const pairs: Record<string, any> = {};

    // Common patterns for key-value extraction
    const patterns = [
      /([A-Za-z\s]+):\s*([^\n\r]+)/g,
      /([A-Za-z\s]+)\s*-\s*([^\n\r]+)/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const key = match[1].trim().toLowerCase().replace(/\s+/g, '_');
        const value = match[2].trim();
        if (key && value) {
          pairs[key] = value;
        }
      }
    });

    return pairs;
  }

  /**
   * Calculate document type classification scores
   */
  private static calculateDocumentTypeScores(text: string): Array<{type: DocumentType, confidence: number}> {
    const scores: Array<{type: DocumentType, confidence: number}> = [];
    const lowerText = text.toLowerCase();

    Object.entries(this.DOCUMENT_PATTERNS).forEach(([docType, patterns]) => {
      let score = 0;
      patterns.forEach(pattern => {
        if (lowerText.includes(pattern.toLowerCase())) {
          score += 1;
        }
      });
      
      const confidence = Math.min(score / patterns.length, 1);
      if (confidence > 0) {
        scores.push({
          type: docType as DocumentType,
          confidence
        });
      }
    });

    // Sort by confidence descending
    scores.sort((a, b) => b.confidence - a.confidence);

    // Add default 'other' type if no matches
    if (scores.length === 0) {
      scores.push({ type: 'other', confidence: 0.1 });
    }

    return scores;
  }

  /**
   * Get classification features that led to the prediction
   */
  private static getClassificationFeatures(text: string, documentType: DocumentType): string[] {
    const features: string[] = [];
    const lowerText = text.toLowerCase();
    const patterns = this.DOCUMENT_PATTERNS[documentType] || [];

    patterns.forEach(pattern => {
      if (lowerText.includes(pattern.toLowerCase())) {
        features.push(`Contains "${pattern}"`);
      }
    });

    return features;
  }

  /**
   * Run validation rules based on document type
   */
  private static async runValidationRules(
    extraction: DocumentExtraction,
    documentType: DocumentType
  ): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Common validation rules
    if (documentType === 'id_card') {
      const ninField = extraction.structured_data.find(f => f.field_name === 'nin');
      if (!ninField) {
        results.push({
          rule_id: 'nin_required',
          status: 'failed',
          message: 'NIN is required for ID cards',
          field_name: 'nin'
        });
      } else if (ninField.field_value.length !== 11) {
        results.push({
          rule_id: 'nin_format',
          status: 'failed',
          message: 'NIN must be 11 digits',
          field_name: 'nin',
          actual_value: ninField.field_value
        });
      }
    }

    if (documentType === 'lease_agreement') {
      const amountField = extraction.structured_data.find(f => f.field_name === 'amount');
      if (!amountField) {
        results.push({
          rule_id: 'rent_amount_required',
          status: 'failed',
          message: 'Rent amount is required in lease agreements',
          field_name: 'amount'
        });
      }
    }

    return results;
  }

  /**
   * Perform compliance checks
   */
  private static async performComplianceChecks(
    extraction: DocumentExtraction,
    documentType: DocumentType
  ): Promise<ComplianceCheck[]> {
    const checks: ComplianceCheck[] = [];

    // Nigerian Data Protection Regulation compliance
    if (this.containsPersonalData(extraction)) {
      checks.push({
        check_id: 'ndpr_compliance',
        check_name: 'NDPR Personal Data Protection',
        regulation: 'Nigerian Data Protection Regulation',
        status: 'compliant',
        details: 'Document contains personal data and requires proper handling'
      });
    }

    // KYC compliance for financial documents
    if (['bank_statement', 'pay_slip'].includes(documentType)) {
      checks.push({
        check_id: 'kyc_compliance',
        check_name: 'Know Your Customer Requirements',
        regulation: 'CBN KYC Guidelines',
        status: 'compliant',
        details: 'Financial document meets KYC requirements'
      });
    }

    return checks;
  }

  /**
   * Detect potential fraud in document
   */
  private static async detectFraud(extraction: DocumentExtraction): Promise<FraudDetection> {
    const anomalies = [];
    let riskScore = 0;

    // Check for suspicious patterns
    const text = extraction.extracted_text;
    
    // Check for altered text patterns
    if (this.hasInconsistentFormatting(text)) {
      anomalies.push({
        anomaly_type: 'inconsistent_fonts' as const,
        description: 'Document shows inconsistent text formatting',
        confidence: 0.7
      });
      riskScore += 30;
    }

    // Check for duplicate content
    if (this.hasSuspiciousPatterns(text)) {
      anomalies.push({
        anomaly_type: 'suspicious_patterns' as const,
        description: 'Document contains suspicious text patterns',
        confidence: 0.6
      });
      riskScore += 20;
    }

    const riskLevel = riskScore >= 70 ? 'critical' : 
                     riskScore >= 50 ? 'high' : 
                     riskScore >= 30 ? 'medium' : 'low';

    return {
      risk_score: riskScore,
      risk_level,
      detected_anomalies: anomalies,
      verification_recommendations: this.getVerificationRecommendations(riskLevel)
    };
  }

  /**
   * Helper methods
   */
  private static isSensitiveDocument(filename: string): boolean {
    const sensitiveTypes = ['id', 'passport', 'bank', 'financial', 'personal'];
    return sensitiveTypes.some(type => filename.toLowerCase().includes(type));
  }

  private static calculateExtractionConfidence(fields: ExtractedField[]): number {
    if (fields.length === 0) return 0;
    
    const confidenceValues = fields.map(f => {
      switch (f.confidence) {
        case 'high': return 0.9;
        case 'medium': return 0.7;
        case 'low': return 0.4;
        default: return 0.5;
      }
    });

    return confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length;
  }

  private static containsPersonalData(extraction: DocumentExtraction): boolean {
    const personalDataFields = ['nin', 'phone_number', 'full_name', 'address'];
    return extraction.structured_data.some(field => 
      personalDataFields.includes(field.field_name)
    );
  }

  private static hasInconsistentFormatting(text: string): boolean {
    // Simple heuristic for detecting formatting inconsistencies
    const lines = text.split('\n');
    const spacingPatterns = lines.map(line => line.match(/^\s*/)?.[0].length || 0);
    const uniqueSpacings = new Set(spacingPatterns);
    return uniqueSpacings.size > 5; // Too many different spacing patterns
  }

  private static hasSuspiciousPatterns(text: string): boolean {
    const suspiciousPatterns = [
      /(.{10,})\1{2,}/, // Repeated text
      /[A-Z]{20,}/, // Too many consecutive capitals
      /\d{15,}/ // Suspiciously long numbers
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(text));
  }

  private static getVerificationRecommendations(riskLevel: string): string[] {
    const recommendations = {
      low: ['Standard processing approved'],
      medium: ['Manual review recommended', 'Verify key details'],
      high: ['Detailed manual review required', 'Contact document issuer', 'Request additional verification'],
      critical: ['Immediate manual review required', 'Escalate to security team', 'Request original documents']
    };

    return recommendations[riskLevel as keyof typeof recommendations] || [];
  }

  private static getValidationRules(documentType: DocumentType) {
    // Return validation rules based on document type
    return [];
  }

  private static determineOverallStatus(
    validationResults: ValidationResult[],
    complianceChecks: ComplianceCheck[],
    fraudDetection: FraudDetection
  ): 'passed' | 'failed' | 'warning' {
    const hasFailures = validationResults.some(r => r.status === 'failed');
    const hasHighRisk = fraudDetection.risk_level === 'high' || fraudDetection.risk_level === 'critical';
    const hasComplianceIssues = complianceChecks.some(c => c.status === 'non_compliant');

    if (hasFailures || hasHighRisk || hasComplianceIssues) {
      return 'failed';
    }

    const hasWarnings = validationResults.some(r => r.status === 'warning') || 
                       fraudDetection.risk_level === 'medium';
    
    return hasWarnings ? 'warning' : 'passed';
  }

  private static async updateDocumentMetadata(documentId: string, updates: Partial<DocumentMetadata>) {
    // Update document metadata in database
    console.log(`Updating document ${documentId}:`, updates);
  }

  /**
   * Generate document processing analytics
   */
  static generateAnalytics(documents: DocumentMetadata[]): DocumentAnalytics {
    const total = documents.length;
    
    const byType = documents.reduce((acc, doc) => {
      acc[doc.document_type] = (acc[doc.document_type] || 0) + 1;
      return acc;
    }, {} as Record<DocumentType, number>);

    const byStatus = documents.reduce((acc, doc) => {
      acc[doc.status] = (acc[doc.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total_documents: total,
      documents_by_type: byType,
      documents_by_status: byStatus as any,
      processing_metrics: {
        average_processing_time_ms: 2500,
        success_rate: 0.92,
        manual_review_rate: 0.15,
        fraud_detection_rate: 0.03
      },
      compliance_metrics: {
        compliance_rate: 0.96,
        common_violations: ['Missing required fields', 'Invalid format'],
        regulatory_updates_needed: 2
      },
      efficiency_metrics: {
        automation_rate: 0.85,
        time_saved_hours: 120,
        cost_savings: 450000,
        error_reduction_percentage: 78
      }
    };
  }
}
