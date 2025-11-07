
import { supabase } from '@/integrations/supabase/client';
import { LeaseAgreement, RentalApplication } from '@/services/applications/types';

export const fetchLeases = async (): Promise<LeaseAgreement[]> => {
  const { data, error } = await supabase.from('lease_agreements').select(`
    *,
    properties:property_id (name),
    tenants:tenant_id (first_name, last_name)
  `).order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching leases:', error);
    throw new Error('Failed to fetch leases');
  }
  
  if (data) {
    const formattedLeases = data.map(lease => ({
      ...lease,
      tenant_name: lease.tenants ? `${lease.tenants.first_name} ${lease.tenants.last_name}` : 'Unknown',
      property_name: lease.properties?.name || 'Unknown Property',
      status: lease.status as 'draft' | 'sent' | 'signed' | 'active' | 'expired'
    }));
    return formattedLeases as LeaseAgreement[];
  }
  return [];
};

export const fetchApplications = async (): Promise<RentalApplication[]> => {
  const { data, error } = await supabase
    .from('rental_applications')
    .select('*, properties:property_id(name)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching applications:', error);
    throw new Error('Failed to fetch rental applications');
  }
  
  return (data || []).map(app => ({
    ...app,
    property_name: app.properties?.name || 'N/A',
  })) as RentalApplication[];
};
