import { supabase } from '@/integrations/supabase/client';
import { OccupancyReportData, OccupancyReportEntry } from '@/components/reports/types';

type LeaseRow = {
  property_id: string | null;
  start_date: string;
  end_date: string | null;
  rent_amount: number;
  tenants: { first_name: string; last_name: string } | null;
};

type PropertyRow = {
  id: string;
  name: string;
  location: string | null;
  status: string | null;
  monthly_rent: number | null;
};

const isLeaseActiveInRange = (lease: LeaseRow, startDate: string, endDate: string): boolean =>
  lease.start_date <= endDate && (!lease.end_date || lease.end_date >= startDate);

export const getOccupancyReport = async (
  startDate: string,
  endDate: string
): Promise<OccupancyReportData> => {
  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('id, name, location, status, monthly_rent');

  if (propertiesError) {
    console.error('Error fetching properties for occupancy report:', propertiesError);
    throw new Error('Failed to fetch occupancy data');
  }

  const { data: leases, error: leasesError } = await supabase
    .from('property_tenants')
    .select(
      `
      property_id,
      start_date,
      end_date,
      rent_amount,
      tenants(first_name, last_name)
    `
    )
    .lte('start_date', endDate)
    .or(`end_date.gte.${startDate},end_date.is.null`);

  if (leasesError) {
    console.error('Error fetching leases for occupancy report:', leasesError);
    throw new Error('Failed to fetch occupancy data');
  }

  const propertyRows = (properties || []) as PropertyRow[];
  const leaseRows = (leases || []) as LeaseRow[];
  const activeLeases = leaseRows.filter((lease) => isLeaseActiveInRange(lease, startDate, endDate));

  const activeLeaseByProperty = new Map<string, LeaseRow>();
  for (const lease of activeLeases) {
    if (!lease.property_id) continue;
    const existing = activeLeaseByProperty.get(lease.property_id);
    if (!existing || lease.start_date > existing.start_date) {
      activeLeaseByProperty.set(lease.property_id, lease);
    }
  }

  const entries: OccupancyReportEntry[] = propertyRows.map((property) => {
    const activeLease = activeLeaseByProperty.get(property.id);
    const normalizedStatus = String(property.status || '').toLowerCase();
    const occupied =
      !!activeLease || normalizedStatus === 'rented' || normalizedStatus === 'occupied';

    const tenantName = activeLease?.tenants
      ? `${activeLease.tenants.first_name} ${activeLease.tenants.last_name}`.trim()
      : null;

    return {
      propertyName: property.name,
      location: property.location,
      status: occupied ? 'Occupied' : 'Vacant',
      tenantName,
      leaseStartDate: activeLease?.start_date || null,
      leaseEndDate: activeLease?.end_date || null,
      monthlyRent: activeLease?.rent_amount ?? property.monthly_rent ?? null,
    };
  });

  const totalProperties = entries.length;
  const occupiedProperties = entries.filter((entry) => entry.status === 'Occupied').length;
  const vacantProperties = entries.filter((entry) => entry.status === 'Vacant').length;
  const occupancyRate = totalProperties === 0 ? 0 : (occupiedProperties / totalProperties) * 100;

  return {
    totalProperties,
    occupiedProperties,
    vacantProperties,
    occupancyRate,
    entries,
  };
};
