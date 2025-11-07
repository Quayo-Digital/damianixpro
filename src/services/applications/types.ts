
export interface RentalApplication {
  id: string;
  property_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  monthly_income?: number;
  occupation?: string;
  current_address?: string;
  move_in_date?: string;
  tenancy_period?: number;
  num_occupants?: number;
  has_pets: boolean;
  pets_details?: string;
  employment_status?: string;
  employer_name?: string;
  employer_contact?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  status: 'pending' | 'approved' | 'rejected' | 'more_info';
  admin_notes?: string;
  created_at?: string;
  updated_at?: string;
  // Calculated fields
  property_name?: string;
  applicant_name?: string;
}

export interface ApplicationDocument {
  id: string;
  application_id: string;
  document_id: string;
  document_type: string;
  created_at?: string;
  // Additional fields from documents table
  name?: string;
  file_path?: string;
}

export interface LeaseAgreement {
  id: string;
  property_id: string;
  tenant_id: string;
  application_id?: string;
  status: 'draft' | 'sent' | 'signed' | 'active' | 'expired';
  start_date?: string;
  end_date?: string;
  monthly_rent?: number;
  security_deposit?: number;
  document_id?: string;
  signed_date?: string;
  created_at?: string;
  updated_at?: string;
  // Calculated fields
  property_name?: string;
  tenant_name?: string;
}

export interface ApplicationFormValues {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  monthly_income?: number;
  occupation?: string;
  current_address?: string;
  move_in_date?: string;
  tenancy_period?: number;
  num_occupants?: number;
  has_pets: boolean;
  pets_details?: string;
  employment_status?: string;
  employer_name?: string;
  employer_contact?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}
