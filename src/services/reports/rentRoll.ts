
import { supabase } from '@/integrations/supabase/client';
import { RentRollEntry } from '@/components/reports/types';

export const getRentRoll = async (startDate: string, endDate: string): Promise<RentRollEntry[]> => {
    const { data: leases, error: leasesError } = await supabase
        .from('property_tenants')
        .select(`
            start_date,
            end_date,
            rent_amount,
            properties (name),
            tenants (first_name, last_name, id),
            rent_payments (payment_date, amount, status, due_date)
        `)
        .lte('start_date', endDate)
        .or(`end_date.gte.${startDate},end_date.is.null`);

    if (leasesError) {
        console.error('Error fetching rent roll data:', leasesError);
        throw new Error('Failed to fetch rent roll data');
    }
    
    if (!leases) return [];

    const rentRollData: RentRollEntry[] = (leases as any[]).map((lease) => {
        const successfulPayments = lease.rent_payments.filter((p: any) => p.status === 'successful');
        const lastPayment = successfulPayments.length > 0 
            ? successfulPayments.sort((a: any, b: any) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())[0]
            : null;

        let status: 'Paid' | 'Due' | 'Overdue' | 'Unknown' = 'Unknown';
        if (lease.rent_payments.length > 0) {
            const dueDates = lease.rent_payments.map((p: any) => new Date(p.due_date)).filter((d: Date) => d <= new Date(endDate));
            if (dueDates.length > 0) {
                const lastDueDate = new Date(Math.max.apply(null, dueDates.map(d => d.getTime())));

                if (lastPayment && new Date(lastPayment.payment_date) >= lastDueDate) {
                    status = 'Paid';
                } else if (new Date() > lastDueDate) {
                    status = 'Overdue';
                } else {
                    status = 'Due';
                }
            }
        } else {
            const leaseStartDate = new Date(lease.start_date);
            if (new Date() > leaseStartDate) {
                status = 'Due';
            }
        }

        return {
            propertyName: lease.properties.name,
            unit: 'N/A',
            tenantName: `${lease.tenants.first_name} ${lease.tenants.last_name}`,
            leaseStartDate: new Date(lease.start_date).toLocaleDateString('en-US'),
            leaseEndDate: lease.end_date ? new Date(lease.end_date).toLocaleDateString('en-US') : 'Month-to-month',
            monthlyRent: lease.rent_amount,
            lastPaymentDate: lastPayment ? new Date(lastPayment.payment_date).toLocaleDateString('en-US') : null,
            lastPaymentAmount: lastPayment ? lastPayment.amount : null,
            status,
        };
    });

    return rentRollData;
};
