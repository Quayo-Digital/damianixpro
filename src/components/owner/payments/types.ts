
import { DateRange } from 'react-day-picker';

export type OwnerPayment = {
  id: string;
  date: string;
  property_name: string;
  tenant_name: string;
  total_amount: number;
  platform_fee: number;
  agent_commission: number;
  owner_amount: number;
  tax_amount: number;
  status: string;
  reference: string;
};

export type UseOwnerPaymentsReturn = {
  payments: OwnerPayment[];
  loading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  dateRange: DateRange | undefined;
  setDateRange: (dateRange: DateRange | undefined) => void;
  loadPayments: () => void;
  getTotalAmount: () => number;
  getTotalPlatformFees: () => number;
  getTotalAgentCommissions: () => number;
};
