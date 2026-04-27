export interface PaymentBreakdown {
  paymentId: string;
  totalAmount: number;
  platformFee: number;
  agentCommission: number;
  ownerAmount: number;
  taxAmount: number;
  taxRate: number;
  paid_to_owner?: boolean;
}

export interface InvoiceItem {
  description: string;
  category: string;
  amount: number;
  quantity: number;
  total: number;
}

export interface Invoice {
  id: string;
  date: string;
  dueDate: string;
  tenantId: string;
  propertyId: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  notes?: string;
}

export interface AccountingSummary {
  totalRevenue: number;
  platformFees: number;
  agentCommissions: number;
  ownerPayouts: number;
  taxes: number;
  pendingPayouts: number;
}

export interface PaymentFilter {
  startDate?: string;
  endDate?: string;
  propertyId?: string;
}

// --- New types for Payment Accounting UI ---
export interface PaymentBreakdownUI {
  platform_fee: number;
  agent_commission: number;
  owner_amount: number;
  tax_amount: number;
  paid_to_owner: boolean;
}

export interface Payment {
  id: string;
  payment_date: string;
  reference: string;
  amount: number;
  status: string;
  property_tenants: {
    property_id: string;
    tenant_id: string;
    properties: {
      name: string;
      id: string;
      owner_id?: string;
    };
    tenants: {
      first_name: string;
      last_name: string;
    };
  };
  breakdown?: PaymentBreakdownUI;
}

export interface OwnerPayout {
  id: string;
  amount: number;
  owner_id: string;
  payout_date: string;
  status: string;
  payment_ids: string[];
  profiles?: {
    full_name: string;
  };
}

export interface OwnerPaymentGroup {
  owner: {
    id: string;
    name: string;
  };
  payments: Payment[];
  total: number;
}
// --- End of new types ---

// Import and re-export maintenance types from the maintenance-data.ts file
import {
  MaintenanceRequest,
  MaintenanceUpdate,
  parseUpdatesFromJson,
  updatesToJson,
} from '../components/communication/maintenance/maintenance-data';

export type { MaintenanceRequest, MaintenanceUpdate };
export { parseUpdatesFromJson, updatesToJson };

export interface MaintenanceVendor {
  id: string;
  name: string;
  category: string;
  phone: string;
  email: string;
  address?: string;
  rating?: number;
}
