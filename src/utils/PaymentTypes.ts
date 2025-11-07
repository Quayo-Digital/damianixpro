export interface Payment {
  id: string;
  date: string;
  amount: number;
  status: 'successful' | 'pending' | 'failed' | 'active';
  reference: string;
  property_tenant_id?: string;
  description?: string;
  category?: string;
  is_recurring?: boolean;
  recurring_type?: RecurringPaymentType;
  next_payment_date?: string;
}

export interface PaymentFormData {
  amount: number;
  description: string;
  propertyId?: string;
  category: string;
  isRecurring?: boolean;
  recurringType?: RecurringPaymentType;
}

export type PaymentCategory = 'rent' | 'deposit' | 'maintenance' | 'utilities' | 'fees' | 'repairs' | 'insurance' | 'taxes' | 'other';

export type RecurringPaymentType = 'monthly' | 'quarterly' | 'annually';

export const PAYMENT_CATEGORIES: { value: PaymentCategory; label: string }[] = [
  { value: 'rent', label: 'Rent Payment' },
  { value: 'deposit', label: 'Security Deposit' },
  { value: 'maintenance', label: 'Maintenance Fee' },
  { value: 'utilities', label: 'Utility Payment' },
  { value: 'fees', label: 'Late Fees/Penalties' },
  { value: 'repairs', label: 'Repair Costs' },
  { value: 'insurance', label: 'Insurance Premium' },
  { value: 'taxes', label: 'Property Tax' },
  { value: 'other', label: 'Other Payment' }
];

export const RECURRING_PAYMENT_OPTIONS: { value: RecurringPaymentType; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' }
];
