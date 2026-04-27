import { supabase } from '@/integrations/supabase/client';
import { LeaseAgreement, RentalApplication } from '@/services/applications/types';
import {
  enrichRowsWithPropertiesAndTenants,
  fetchLeaseRows,
  normalizeLeaseAgreementStatus,
} from '@/services/leases/enrichLeaseAgreements';

export const fetchLeases = async (): Promise<LeaseAgreement[]> => {
  let rows: Record<string, unknown>[];
  try {
    const { rows: r } = await fetchLeaseRows({});
    rows = r;
  } catch (error) {
    console.error('Error fetching leases:', error);
    throw new Error('Failed to fetch leases');
  }

  if (!rows.length) return [];

  const enriched = await enrichRowsWithPropertiesAndTenants(rows, {
    propertyColumns: 'id, name',
    tenantColumns: 'id, first_name, last_name',
  });

  return enriched.map((lease) => ({
    ...lease,
    tenant_name: lease.tenants
      ? `${lease.tenants.first_name ?? ''} ${lease.tenants.last_name ?? ''}`.trim() || 'Unknown'
      : 'Unknown',
    property_name: (lease.properties?.name as string | undefined) || 'Unknown Property',
    status: normalizeLeaseAgreementStatus(lease.status),
  })) as LeaseAgreement[];
};

export const fetchApplications = async (): Promise<RentalApplication[]> => {
  const { data, error } = await supabase
    .from('rental_applications')
    .select('*, properties(name)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching applications:', error);
    throw new Error('Failed to fetch rental applications');
  }

  return (data || []).map((app) => ({
    ...app,
    property_name: app.properties?.name || 'N/A',
  })) as RentalApplication[];
};
