export interface RentRollEntry {
  propertyName: string;
  unit: string;
  tenantName: string;
  leaseStartDate: string;
  leaseEndDate: string | null;
  monthlyRent: number;
  lastPaymentDate: string | null;
  lastPaymentAmount: number | null;
  status: 'Paid' | 'Due' | 'Overdue' | 'Unknown';
}

export type RentRoll = RentRollEntry[];

export interface OccupancyReportEntry {
  propertyName: string;
  location: string | null;
  status: 'Occupied' | 'Vacant' | 'Unknown';
  tenantName: string | null;
  leaseStartDate: string | null;
  leaseEndDate: string | null;
  monthlyRent: number | null;
}

export interface OccupancyReportData {
  totalProperties: number;
  occupiedProperties: number;
  vacantProperties: number;
  occupancyRate: number;
  entries: OccupancyReportEntry[];
}

export interface MaintenanceCostEntry {
  date: string;
  propertyName: string;
  category: string;
  description: string | null;
  amount: number;
}

export interface MaintenanceCostsReportData {
  totalCost: number;
  transactionCount: number;
  averageCost: number;
  byCategory: Array<{
    category: string;
    total: number;
    count: number;
  }>;
  entries: MaintenanceCostEntry[];
}
