
import { z } from "zod";

// Transaction types
export type TransactionType = 'SALE' | 'LEASE';
export type PropertyCategory = 'RESIDENTIAL' | 'COMMERCIAL' | 'LAND' | 'INDUSTRIAL';
export type DevelopmentStatus = 'RAW_LAND' | 'SURVEYED' | 'TITLED' | 'DEVELOPED' | 'UNDER_DEVELOPMENT';
export type FinancingMethod = 'CASH' | 'MORTGAGE' | 'INSTALLMENT' | 'MIXED';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'CARD' | 'MOBILE_MONEY';

// Schema for property form validation
export const propertyFormSchema = z.object({
  name: z.string().min(1, { message: "Property name is required" }),
  address: z.string().min(1, { message: "Address is required" }),
  type: z.string().default("residential"),
  transaction_type: z.enum(['SALE', 'LEASE']).default('LEASE'),
  property_category: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'LAND', 'INDUSTRIAL']).default('RESIDENTIAL'),
  price: z.string().min(1, { message: "Price is required" }),
  sale_price: z.string().optional(),
  lease_price: z.string().optional(),
  location: z.string().min(1, { message: "Location is required" }),
  bedrooms: z.coerce.number().optional(),
  bathrooms: z.coerce.number().optional(),
  squareFeet: z.coerce.number().optional(),
  land_size_sqft: z.string().optional(),
  land_size_acres: z.string().optional(),
  price_per_sqft: z.string().optional(),
  development_status: z.enum(['RAW_LAND', 'SURVEYED', 'TITLED', 'DEVELOPED', 'UNDER_DEVELOPMENT']).optional(),
  description: z.string().optional(),
  status: z.string().default("Available"),
  lease_terms: z.string().optional(),
  availability_date: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  agent_id: z.string().optional(),
  agent_commission_rate: z.string().optional(),
  imageUrl: z.string().optional(),
  features: z.array(z.string()).optional(),
  owner_id: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  tourUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  payment_plan_available: z.boolean().default(false),
  installment_months: z.string().optional(),
  down_payment_percentage: z.string().optional(),
  is_negotiable: z.boolean().default(true),
  market_value: z.string().optional(),
  zoning_type: z.string().optional(),
  title_document_url: z.string().optional(),
  survey_plan_url: z.string().optional(),
  c_of_o_url: z.string().optional(),
  deed_of_assignment_url: z.string().optional(),
  land_use_permit_url: z.string().optional(),
});

export type PropertyFormValues = z.infer<typeof propertyFormSchema>;

// Enhanced Property interface for sales and lease
export interface Property {
  id: string;
  name: string;
  address: string;
  type: string;
  transaction_type: TransactionType;
  property_category: PropertyCategory;
  price: string; // Legacy field for backward compatibility
  sale_price?: number;
  lease_price?: number;
  price_per_sqft?: number;
  location: string;
  bedrooms?: string;
  bathrooms?: string;
  squareFeet?: string;
  land_size_sqft?: number;
  land_size_acres?: number;
  development_status?: DevelopmentStatus;
  description?: string;
  status: "Available" | "Rented" | "Sold" | "Under Maintenance" | "Under Contract";
  imageUrl?: string;
  images?: string[];
  features?: string[];
  amenities?: string[];
  lease_terms?: string;
  availability_date?: string;
  agent_id?: string;
  agent_commission_rate?: number;
  owner_id?: string;
  latitude?: number;
  longitude?: number;
  tourUrl?: string;
  payment_plan_available?: boolean;
  installment_months?: number;
  down_payment_percentage?: number;
  is_negotiable?: boolean;
  market_value?: number;
  last_valuation_date?: string;
  zoning_type?: string;
  title_document_url?: string;
  survey_plan_url?: string;
  c_of_o_url?: string;
  deed_of_assignment_url?: string;
  land_use_permit_url?: string;
  created_at?: string;
  updated_at?: string;
}

// Schema for property status updates
export const propertyStatusSchema = z.object({
  status: z.enum(["Available", "Rented", "Sold", "Under Maintenance", "Under Contract"]),
});

export type PropertyStatus = z.infer<typeof propertyStatusSchema>;

// Buyer interface
export interface Buyer {
  id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  date_of_birth?: string;
  occupation?: string;
  employer?: string;
  monthly_income?: number;
  preferred_budget_min?: number;
  preferred_budget_max?: number;
  preferred_locations?: string[];
  preferred_property_types?: string[];
  financing_method?: FinancingMethod;
  pre_approved_amount?: number;
  bank_name?: string;
  loan_officer_contact?: string;
  identification_type?: 'NIN' | 'PASSPORT' | 'DRIVERS_LICENSE' | 'VOTERS_CARD';
  identification_number?: string;
  identification_document_url?: string;
  proof_of_income_url?: string;
  bank_statement_url?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'QUALIFIED' | 'UNQUALIFIED';
  lead_source?: string;
  assigned_agent_id?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Sales Transaction interface
export interface SalesTransaction {
  id: string;
  property_id: string;
  buyer_id: string;
  seller_id: string;
  agent_id?: string;
  transaction_type: 'SALE' | 'LEASE_TO_OWN';
  sale_price: number;
  down_payment?: number;
  financing_amount?: number;
  payment_method?: PaymentMethod;
  installment_plan?: any; // JSON object
  agent_commission_rate?: number;
  agent_commission_amount?: number;
  platform_fee_rate?: number;
  platform_fee_amount?: number;
  legal_fee?: number;
  survey_fee?: number;
  registration_fee?: number;
  other_fees?: any; // JSON object
  total_transaction_cost?: number;
  contract_start_date?: string;
  expected_completion_date?: string;
  actual_completion_date?: string;
  contract_document_url?: string;
  deed_of_assignment_url?: string;
  receipt_of_payment_url?: string;
  status: 'INITIATED' | 'UNDER_NEGOTIATION' | 'CONTRACT_SIGNED' | 'PAYMENT_PENDING' | 'PAYMENT_PARTIAL' | 'PAYMENT_COMPLETE' | 'TITLE_TRANSFER_PENDING' | 'COMPLETED' | 'CANCELLED';
  cancellation_reason?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // Related data
  property?: Property;
  buyer?: Buyer;
  seller?: any;
  agent?: any;
}

// Sales Payment interface
export interface SalesPayment {
  id: string;
  sales_transaction_id: string;
  payment_number: number;
  amount: number;
  due_date: string;
  payment_date?: string;
  payment_method?: PaymentMethod;
  reference_number?: string;
  bank_name?: string;
  receipt_url?: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL' | 'CANCELLED';
  late_fee?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Property Inquiry interface
export interface PropertyInquiry {
  id: string;
  property_id: string;
  inquirer_type: 'BUYER' | 'TENANT' | 'INVESTOR';
  buyer_id?: string;
  tenant_id?: string;
  inquirer_name: string;
  inquirer_email: string;
  inquirer_phone?: string;
  inquiry_type: 'VIEWING_REQUEST' | 'PRICE_INQUIRY' | 'AVAILABILITY_CHECK' | 'NEGOTIATION' | 'GENERAL_INFO';
  message?: string;
  preferred_viewing_date?: string;
  preferred_viewing_time?: string;
  budget_range?: string;
  financing_ready?: boolean;
  agent_id?: string;
  status: 'NEW' | 'CONTACTED' | 'SCHEDULED' | 'VIEWED' | 'INTERESTED' | 'NEGOTIATING' | 'CONVERTED' | 'CLOSED';
  response_notes?: string;
  follow_up_date?: string;
  created_at?: string;
  updated_at?: string;
  // Related data
  property?: Property;
  buyer?: Buyer;
  agent?: any;
}

// Land Development interface
export interface LandDevelopment {
  id: string;
  property_id: string;
  development_phase: 'PLANNING' | 'SURVEYING' | 'APPROVAL' | 'INFRASTRUCTURE' | 'CONSTRUCTION' | 'COMPLETED';
  phase_status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
  start_date?: string;
  expected_completion_date?: string;
  actual_completion_date?: string;
  contractor_name?: string;
  contractor_contact?: string;
  estimated_cost?: number;
  actual_cost?: number;
  permits_obtained?: boolean;
  environmental_clearance?: boolean;
  infrastructure_ready?: boolean;
  utilities_connected?: boolean;
  road_access_completed?: boolean;
  drainage_completed?: boolean;
  progress_percentage?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Form schemas for new entities
export const buyerFormSchema = z.object({
  first_name: z.string().min(1, { message: "First name is required" }),
  last_name: z.string().min(1, { message: "Last name is required" }),
  email: z.string().email({ message: "Valid email is required" }),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().default('Lagos'),
  country: z.string().default('Nigeria'),
  date_of_birth: z.string().optional(),
  occupation: z.string().optional(),
  employer: z.string().optional(),
  monthly_income: z.string().optional(),
  preferred_budget_min: z.string().optional(),
  preferred_budget_max: z.string().optional(),
  preferred_locations: z.array(z.string()).optional(),
  preferred_property_types: z.array(z.string()).optional(),
  financing_method: z.enum(['CASH', 'MORTGAGE', 'INSTALLMENT', 'MIXED']).optional(),
  pre_approved_amount: z.string().optional(),
  bank_name: z.string().optional(),
  loan_officer_contact: z.string().optional(),
  identification_type: z.enum(['NIN', 'PASSPORT', 'DRIVERS_LICENSE', 'VOTERS_CARD']).optional(),
  identification_number: z.string().optional(),
  lead_source: z.string().optional(),
  assigned_agent_id: z.string().optional(),
  notes: z.string().optional(),
});

export type BuyerFormValues = z.infer<typeof buyerFormSchema>;

export const salesTransactionFormSchema = z.object({
  property_id: z.string().min(1, { message: "Property is required" }),
  buyer_id: z.string().min(1, { message: "Buyer is required" }),
  seller_id: z.string().min(1, { message: "Seller is required" }),
  agent_id: z.string().optional(),
  transaction_type: z.enum(['SALE', 'LEASE_TO_OWN']).default('SALE'),
  sale_price: z.string().min(1, { message: "Sale price is required" }),
  down_payment: z.string().optional(),
  financing_amount: z.string().optional(),
  payment_method: z.enum(['CASH', 'MORTGAGE', 'INSTALLMENT', 'BANK_TRANSFER']).optional(),
  agent_commission_rate: z.string().optional(),
  legal_fee: z.string().optional(),
  survey_fee: z.string().optional(),
  registration_fee: z.string().optional(),
  contract_start_date: z.string().optional(),
  expected_completion_date: z.string().optional(),
  notes: z.string().optional(),
});

export type SalesTransactionFormValues = z.infer<typeof salesTransactionFormSchema>;
