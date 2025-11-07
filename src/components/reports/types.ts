
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
