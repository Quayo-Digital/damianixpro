export type DocumentCategory =
  | 'Contract'
  | 'Inspection'
  | 'Policy'
  | 'Insurance'
  | 'Form'
  | 'Legal'
  | 'Financial'
  | 'Maintenance';

export const documentCategories: DocumentCategory[] = [
  'Contract',
  'Inspection',
  'Policy',
  'Insurance',
  'Form',
  'Legal',
  'Financial',
  'Maintenance',
];

export interface Document {
  id: string;
  name: string;
  category: string;
  property_id?: string;
  property_name?: string;
  description?: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_by?: string;
  upload_date?: string;
  created_at?: string;
  user_id?: string;
  tenant_id?: string;
  tags?: string[];
}
