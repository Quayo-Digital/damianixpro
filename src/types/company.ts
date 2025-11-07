import { z } from 'zod';

// Company Profile Types
export type CompanyType = 
  | 'REAL_ESTATE_AGENCY'
  | 'PROPERTY_MANAGEMENT'
  | 'CONSTRUCTION'
  | 'MAINTENANCE_SERVICES'
  | 'LEGAL_SERVICES'
  | 'FINANCIAL_SERVICES'
  | 'CONSULTING'
  | 'DEVELOPMENT'
  | 'OTHER';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
export type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CANCELLED';
export type AccessLevel = 'ADMIN' | 'MANAGER' | 'AGENT' | 'STAFF' | 'VIEWER';
export type TeamMemberStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type DocumentType = 'BUSINESS_LICENSE' | 'TAX_CERTIFICATE' | 'INSURANCE' | 'CERTIFICATION' | 'REGISTRATION' | 'PERMIT' | 'OTHER';
export type DocumentVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type AnnualRevenueRange = 'UNDER_1M' | '1M_5M' | '5M_10M' | '10M_50M' | '50M_100M' | 'OVER_100M';

export interface BusinessHours {
  monday: { open: string; close: string; closed: boolean };
  tuesday: { open: string; close: string; closed: boolean };
  wednesday: { open: string; close: string; closed: boolean };
  thursday: { open: string; close: string; closed: boolean };
  friday: { open: string; close: string; closed: boolean };
  saturday: { open: string; close: string; closed: boolean };
  sunday: { open: string; close: string; closed: boolean };
}

export interface NotificationPreferences {
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  marketing_emails: boolean;
}

export interface SocialMediaLinks {
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  youtube?: string;
  website?: string;
}

export interface ProfessionalCertification {
  name: string;
  issuer: string;
  issue_date: string;
  expiry_date?: string;
  certificate_url?: string;
  verified: boolean;
}

export interface ComplianceCertificate {
  type: string;
  certificate_number: string;
  issuing_authority: string;
  issue_date: string;
  expiry_date?: string;
  certificate_url?: string;
  status: 'VALID' | 'EXPIRED' | 'SUSPENDED';
}

export interface CompanyProfile {
  id: string;
  user_id: string;
  
  // Basic Company Information
  company_name: string;
  company_type: CompanyType;
  business_registration_number?: string;
  tax_identification_number?: string;
  vat_number?: string;
  
  // Contact Information
  business_email?: string;
  business_phone?: string;
  website_url?: string;
  
  // Address Information
  business_address?: string;
  city?: string;
  state?: string;
  country: string;
  postal_code?: string;
  
  // Nigerian Business Registration
  cac_registration_number?: string;
  tin_number?: string;
  business_permit_number?: string;
  
  // Company Details
  description?: string;
  founded_year?: number;
  number_of_employees?: number;
  annual_revenue_range?: AnnualRevenueRange;
  
  // Verification Status
  verification_status: VerificationStatus;
  verification_date?: string;
  verified_by?: string;
  verification_notes?: string;
  
  // Business License and Certifications
  business_license_url?: string;
  insurance_certificate_url?: string;
  professional_certifications: ProfessionalCertification[];
  
  // Nigerian Regulatory Compliance
  real_estate_license_number?: string;
  professional_body_membership?: string;
  compliance_certificates: ComplianceCertificate[];
  
  // Banking Information
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  bank_code?: string;
  
  // Social Media and Marketing
  logo_url?: string;
  social_media_links: SocialMediaLinks;
  marketing_materials: string[];
  
  // Performance Metrics
  total_properties_managed: number;
  total_transactions_completed: number;
  average_rating: number;
  total_reviews: number;
  
  // Subscription and Plan Information
  subscription_plan: string;
  subscription_status: SubscriptionStatus;
  subscription_start_date?: string;
  subscription_end_date?: string;
  
  // Settings and Preferences
  business_hours: BusinessHours;
  notification_preferences: NotificationPreferences;
  
  // Audit Fields
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CompanyTeamMember {
  id: string;
  company_id: string;
  user_id: string;
  
  // Team Member Information
  role_title: string;
  department?: string;
  permissions: string[];
  access_level: AccessLevel;
  
  // Status
  status: TeamMemberStatus;
  join_date: string;
  leave_date?: string;
  
  // Audit Fields
  created_at: string;
  updated_at: string;
  
  // Related data
  user?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}

export interface CompanyDocument {
  id: string;
  company_id: string;
  
  // Document Information
  document_name: string;
  document_type: DocumentType;
  document_url: string;
  file_size?: number;
  file_type?: string;
  
  // Verification
  verification_status: DocumentVerificationStatus;
  verification_date?: string;
  verified_by?: string;
  verification_notes?: string;
  
  // Expiry Management
  expiry_date?: string;
  renewal_reminder_sent: boolean;
  
  // Audit Fields
  created_at: string;
  updated_at: string;
  uploaded_by?: string;
}

export interface UserCompanyProfile {
  company_id: string;
  company_name: string;
  company_type: CompanyType;
  verification_status: VerificationStatus;
  is_owner: boolean;
  access_level: AccessLevel;
}

// Form Schemas
export const companyProfileFormSchema = z.object({
  company_name: z.string().min(2, 'Company name must be at least 2 characters'),
  company_type: z.enum([
    'REAL_ESTATE_AGENCY',
    'PROPERTY_MANAGEMENT',
    'CONSTRUCTION',
    'MAINTENANCE_SERVICES',
    'LEGAL_SERVICES',
    'FINANCIAL_SERVICES',
    'CONSULTING',
    'DEVELOPMENT',
    'OTHER'
  ]),
  business_registration_number: z.string().optional(),
  tax_identification_number: z.string().optional(),
  vat_number: z.string().optional(),
  
  business_email: z.string().email('Invalid email address').optional().or(z.literal('')),
  business_phone: z.string().optional(),
  website_url: z.string().url('Invalid website URL').optional().or(z.literal('')),
  
  business_address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default('Nigeria'),
  postal_code: z.string().optional(),
  
  cac_registration_number: z.string().optional(),
  tin_number: z.string().optional(),
  business_permit_number: z.string().optional(),
  
  description: z.string().optional(),
  founded_year: z.number().min(1900).max(new Date().getFullYear()).optional(),
  number_of_employees: z.number().min(1).optional(),
  annual_revenue_range: z.enum(['UNDER_1M', '1M_5M', '5M_10M', '10M_50M', '50M_100M', 'OVER_100M']).optional(),
  
  real_estate_license_number: z.string().optional(),
  professional_body_membership: z.string().optional(),
  
  bank_name: z.string().optional(),
  account_number: z.string().optional(),
  account_name: z.string().optional(),
  bank_code: z.string().optional(),
});

export const teamMemberFormSchema = z.object({
  user_id: z.string().min(1, 'User is required'),
  role_title: z.string().min(2, 'Role title is required'),
  department: z.string().optional(),
  access_level: z.enum(['ADMIN', 'MANAGER', 'AGENT', 'STAFF', 'VIEWER']),
  permissions: z.array(z.string()).default([]),
});

export const companyDocumentFormSchema = z.object({
  document_name: z.string().min(1, 'Document name is required'),
  document_type: z.enum(['BUSINESS_LICENSE', 'TAX_CERTIFICATE', 'INSURANCE', 'CERTIFICATION', 'REGISTRATION', 'PERMIT', 'OTHER']),
  document_url: z.string().url('Invalid document URL'),
  expiry_date: z.string().optional(),
});

export type CompanyProfileFormValues = z.infer<typeof companyProfileFormSchema>;
export type TeamMemberFormValues = z.infer<typeof teamMemberFormSchema>;
export type CompanyDocumentFormValues = z.infer<typeof companyDocumentFormSchema>;

// Constants
export const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  REAL_ESTATE_AGENCY: 'Real Estate Agency',
  PROPERTY_MANAGEMENT: 'Property Management',
  CONSTRUCTION: 'Construction Company',
  MAINTENANCE_SERVICES: 'Maintenance Services',
  LEGAL_SERVICES: 'Legal Services',
  FINANCIAL_SERVICES: 'Financial Services',
  CONSULTING: 'Consulting',
  DEVELOPMENT: 'Development Company',
  OTHER: 'Other'
};

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  PENDING: 'Pending Verification',
  VERIFIED: 'Verified',
  REJECTED: 'Verification Rejected',
  SUSPENDED: 'Suspended'
};

export const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  ADMIN: 'Administrator',
  MANAGER: 'Manager',
  AGENT: 'Agent',
  STAFF: 'Staff Member',
  VIEWER: 'Viewer'
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  BUSINESS_LICENSE: 'Business License',
  TAX_CERTIFICATE: 'Tax Certificate',
  INSURANCE: 'Insurance Certificate',
  CERTIFICATION: 'Professional Certification',
  REGISTRATION: 'Registration Document',
  PERMIT: 'Business Permit',
  OTHER: 'Other Document'
};

export const ANNUAL_REVENUE_LABELS: Record<AnnualRevenueRange, string> = {
  UNDER_1M: 'Under ₦1M',
  '1M_5M': '₦1M - ₦5M',
  '5M_10M': '₦5M - ₦10M',
  '10M_50M': '₦10M - ₦50M',
  '50M_100M': '₦50M - ₦100M',
  OVER_100M: 'Over ₦100M'
};

export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

export const NIGERIAN_BANKS = [
  { name: 'Access Bank', code: '044' },
  { name: 'Citibank Nigeria', code: '023' },
  { name: 'Ecobank Nigeria', code: '050' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'First City Monument Bank', code: '214' },
  { name: 'Guaranty Trust Bank', code: '058' },
  { name: 'Heritage Banking Company', code: '030' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Providus Bank', code: '101' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Standard Chartered Bank', code: '068' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Union Bank of Nigeria', code: '032' },
  { name: 'United Bank For Africa', code: '033' },
  { name: 'Unity Bank', code: '215' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Zenith Bank', code: '057' }
];

export const NIGERIAN_PROFESSIONAL_BODIES = [
  { name: 'NIESV', fullName: 'Nigerian Institution of Estate Surveyors and Valuers' },
  { name: 'FIABCI Nigeria', fullName: 'International Real Estate Federation - Nigeria Chapter' },
  { name: 'REDAN', fullName: 'Real Estate Developers Association of Nigeria' },
  { name: 'ESVARBON', fullName: 'Estate Surveyors and Valuers Registration Board of Nigeria' },
  { name: 'NIOB', fullName: 'Nigerian Institute of Building' },
  { name: 'NSE', fullName: 'Nigerian Society of Engineers' },
  { name: 'NITP', fullName: 'Nigerian Institute of Town Planners' },
  { name: 'RICS Nigeria', fullName: 'Royal Institution of Chartered Surveyors - Nigeria' }
];
