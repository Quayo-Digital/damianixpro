// Nigerian API Integration Types
// Types for integrating with Nigerian banks, government services, and verification APIs

// ============================================================================
// BANK VERIFICATION NUMBER (BVN) TYPES
// ============================================================================

export interface BVNVerificationRequest {
  bvn: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  phone_number?: string;
}

export interface BVNVerificationResponse {
  status: 'success' | 'failed';
  message: string;
  data?: {
    bvn: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    date_of_birth: string;
    phone_number: string;
    gender: 'Male' | 'Female';
    email?: string;
    enrollment_bank: string;
    enrollment_branch: string;
    watch_listed: boolean;
    nationality: string;
    marital_status?: string;
    state_of_origin?: string;
    lga_of_origin?: string;
    state_of_residence?: string;
    lga_of_residence?: string;
    residential_address?: string;
    image_base64?: string;
  };
  confidence_score?: number;
  verification_id: string;
}

// ============================================================================
// NATIONAL IDENTIFICATION NUMBER (NIN) TYPES
// ============================================================================

export interface NINVerificationRequest {
  nin: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
}

export interface NINVerificationResponse {
  status: 'success' | 'failed';
  message: string;
  data?: {
    nin: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    date_of_birth: string;
    phone_number: string;
    gender: 'Male' | 'Female';
    email?: string;
    nationality: string;
    state_of_origin: string;
    lga_of_origin: string;
    state_of_residence: string;
    lga_of_residence: string;
    residential_address: string;
    profession?: string;
    religion?: string;
    marital_status?: string;
    educational_level?: string;
    employment_status?: string;
    image_base64?: string;
  };
  confidence_score?: number;
  verification_id: string;
}

// ============================================================================
// CORPORATE AFFAIRS COMMISSION (CAC) TYPES
// ============================================================================

export interface CACVerificationRequest {
  search_term: string; // RC number, BN number, etc.
  search_type: 'rc_number' | 'company_name' | 'business_name';
}

export interface CACVerificationResponse {
  status: 'success' | 'failed';
  message: string;
  data?: {
    company_id: string;
    company_name: string;
    company_status: 'ACTIVE' | 'INACTIVE' | 'STRUCK-OFF';
    company_registration: string;
    company_commencement_date: string;
    company_type_info: string;
    company_email?: string;
    company_address: string;
    directors?: Array<{
      name: string;
      appointment_date: string;
      nationality: string;
      occupation: string;
    }>;
    shareholders?: Array<{
      name: string;
      shares_held: number;
      share_type: string;
    }>;
    annual_returns_status?: 'UP_TO_DATE' | 'OVERDUE';
    last_annual_return_date?: string;
  };
  verification_id: string;
}

// ============================================================================
// BANK ACCOUNT VERIFICATION TYPES
// ============================================================================

export interface BankAccountVerificationRequest {
  account_number: string;
  bank_code: string;
  account_name?: string;
}

export interface BankAccountVerificationResponse {
  status: 'success' | 'failed';
  message: string;
  data?: {
    account_number: string;
    account_name: string;
    bank_name: string;
    bank_code: string;
    account_type: 'SAVINGS' | 'CURRENT' | 'DOMICILIARY';
    account_status: 'ACTIVE' | 'INACTIVE' | 'DORMANT';
    bvn?: string;
    currency: string;
  };
  verification_id: string;
}

// ============================================================================
// NIGERIAN BANKS DATA TYPES
// ============================================================================

export interface NigerianBank {
  id: number;
  name: string;
  slug: string;
  code: string;
  longcode: string;
  gateway: string;
  pay_with_bank: boolean;
  active: boolean;
  country: string;
  currency: string;
  type: string;
  is_deleted: boolean;
  logo_url?: string;
}

// ============================================================================
// PHONE NUMBER VERIFICATION TYPES
// ============================================================================

export interface PhoneVerificationRequest {
  phone_number: string;
  country_code?: string;
}

export interface PhoneVerificationResponse {
  status: 'success' | 'failed';
  message: string;
  data?: {
    phone_number: string;
    network_provider: string;
    line_type: 'MOBILE' | 'LANDLINE';
    status: 'ACTIVE' | 'INACTIVE';
    ported: boolean;
    dnd_status: boolean;
    state_of_registration?: string;
    lga_of_registration?: string;
  };
  verification_id: string;
}

// ============================================================================
// CREDIT REPORT TYPES
// ============================================================================

export interface CreditReportRequest {
  bvn: string;
  first_name: string;
  last_name: string;
  phone_number: string;
}

export interface CreditReportResponse {
  status: 'success' | 'failed';
  message: string;
  data?: {
    bvn: string;
    full_name: string;
    credit_score: number;
    credit_grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
    total_credit_facilities: number;
    total_outstanding_amount: number;
    performing_facilities: number;
    non_performing_facilities: number;
    credit_history: Array<{
      institution: string;
      facility_type: string;
      amount_granted: number;
      outstanding_balance: number;
      status: 'PERFORMING' | 'NON_PERFORMING' | 'CLOSED';
      date_granted: string;
      maturity_date: string;
    }>;
    enquiry_history: Array<{
      enquiring_institution: string;
      enquiry_date: string;
      enquiry_reason: string;
    }>;
  };
  verification_id: string;
}

// ============================================================================
// LAND REGISTRY TYPES (Conceptual - varies by state)
// ============================================================================

export interface LandRegistryRequest {
  state: string;
  property_id?: string;
  survey_number?: string;
  plot_number?: string;
  certificate_of_occupancy?: string;
  owner_name?: string;
}

export interface LandRegistryResponse {
  status: 'success' | 'failed';
  message: string;
  data?: {
    property_id: string;
    title_number: string;
    survey_number: string;
    plot_number: string;
    location: string;
    state: string;
    lga: string;
    land_use: string;
    size_sqm: number;
    owner_name: string;
    owner_address: string;
    title_type: 'CERTIFICATE_OF_OCCUPANCY' | 'DEED_OF_ASSIGNMENT' | 'GOVERNORS_CONSENT';
    registration_date: string;
    expiry_date?: string;
    encumbrances: Array<{
      type: string;
      description: string;
      amount?: number;
      date_registered: string;
    }>;
    survey_plan_available: boolean;
    building_plan_approved: boolean;
  };
  verification_id: string;
}

// ============================================================================
// PAYMENT INTEGRATION TYPES
// ============================================================================

export interface PaystackTransferRequest {
  source: 'balance';
  amount: number; // in kobo
  recipient: string; // recipient code
  reason?: string;
  currency?: 'NGN';
  reference?: string;
}

export interface PaystackTransferResponse {
  status: boolean;
  message: string;
  data?: {
    reference: string;
    integration: number;
    domain: string;
    amount: number;
    currency: string;
    source: string;
    reason: string;
    recipient: number;
    status: 'pending' | 'success' | 'failed';
    transfer_code: string;
    id: number;
    createdAt: string;
    updatedAt: string;
  };
}

export interface FlutterwaveTransferRequest {
  account_bank: string;
  account_number: string;
  amount: number;
  narration: string;
  currency: 'NGN';
  reference?: string;
  callback_url?: string;
  debit_currency?: 'NGN';
  beneficiary_name?: string;
}

export interface FlutterwaveTransferResponse {
  status: 'success' | 'error';
  message: string;
  data?: {
    id: number;
    account_number: string;
    bank_code: string;
    full_name: string;
    created_at: string;
    currency: string;
    debit_currency: string;
    amount: number;
    fee: number;
    status: 'NEW' | 'PENDING' | 'SUCCESSFUL' | 'FAILED';
    reference: string;
    meta: any;
    narration: string;
    complete_message: string;
    requires_approval: number;
    is_approved: number;
    bank_name: string;
  };
}

// ============================================================================
// API CONFIGURATION TYPES
// ============================================================================

export interface APIConfiguration {
  provider: 'youverify' | 'appruve' | 'paystack' | 'flutterwave' | 'nibss' | 'custom';
  api_key: string;
  secret_key?: string;
  base_url: string;
  sandbox_mode: boolean;
  webhook_url?: string;
  rate_limit?: {
    requests_per_minute: number;
    requests_per_hour: number;
    requests_per_day: number;
  };
}

export interface APIProviderConfig {
  bvn_verification?: APIConfiguration;
  nin_verification?: APIConfiguration;
  cac_verification?: APIConfiguration;
  bank_verification?: APIConfiguration;
  phone_verification?: APIConfiguration;
  credit_report?: APIConfiguration;
  land_registry?: APIConfiguration;
  payment_transfer?: APIConfiguration;
}

// ============================================================================
// VERIFICATION HISTORY TYPES
// ============================================================================

export interface VerificationRecord {
  id: string;
  user_id: string;
  verification_type:
    | 'bvn'
    | 'nin'
    | 'cac'
    | 'bank_account'
    | 'phone'
    | 'credit_report'
    | 'land_registry';
  request_data: any;
  response_data: any;
  status: 'pending' | 'success' | 'failed' | 'expired';
  provider: string;
  cost: number;
  currency: 'NGN' | 'USD';
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

// ============================================================================
// KYC INTEGRATION TYPES
// ============================================================================

export interface KYCProfile {
  user_id: string;
  bvn_verified: boolean;
  nin_verified: boolean;
  phone_verified: boolean;
  bank_account_verified: boolean;
  business_verified: boolean;
  credit_score?: number;
  verification_level: 'basic' | 'intermediate' | 'advanced' | 'premium';
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high';
  last_updated: string;
  verification_records: VerificationRecord[];
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class APIError extends Error {
  code: string;
  details?: any;
  provider: string;
  timestamp: string;
  request_id?: string;

  constructor(params: {
    code: string;
    message: string;
    details?: any;
    provider: string;
    timestamp?: string;
    request_id?: string;
  }) {
    super(params.message);
    this.name = 'APIError';
    this.code = params.code;
    this.details = params.details;
    this.provider = params.provider;
    this.timestamp = params.timestamp || new Date().toISOString();
    this.request_id = params.request_id;
  }
}

export class VerificationError extends APIError {
  verification_type: string;
  recoverable: boolean;
  retry_after?: number;

  constructor(params: {
    code: string;
    message: string;
    details?: any;
    provider: string;
    verification_type: string;
    recoverable: boolean;
    retry_after?: number;
    timestamp?: string;
    request_id?: string;
  }) {
    super(params);
    this.name = 'VerificationError';
    this.verification_type = params.verification_type;
    this.recoverable = params.recoverable;
    this.retry_after = params.retry_after;
  }
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

export interface WebhookPayload {
  event: string;
  data: any;
  signature: string;
  timestamp: string;
  provider: string;
}

export interface VerificationWebhook extends WebhookPayload {
  event: 'verification.completed' | 'verification.failed' | 'verification.expired';
  data: {
    verification_id: string;
    verification_type: string;
    status: string;
    result: any;
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type VerificationType =
  | 'bvn'
  | 'nin'
  | 'cac'
  | 'bank_account'
  | 'phone'
  | 'credit_report'
  | 'land_registry';

export type APIProvider = 'youverify' | 'appruve' | 'paystack' | 'flutterwave' | 'nibss' | 'custom';

export type VerificationStatus = 'pending' | 'success' | 'failed' | 'expired';

export type RiskLevel = 'low' | 'medium' | 'high';

export type VerificationLevel = 'basic' | 'intermediate' | 'advanced' | 'premium';
