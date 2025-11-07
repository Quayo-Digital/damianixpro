
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';

async function getOwnerDashboardData(userId: string) {
  // 1. Fetch properties owned by the user
  const { data: ownerProperties, error: propertiesError } = await supabase
    .from('properties')
    .select('id')
    .eq('owner_id', userId);

  if (propertiesError) throw propertiesError;

  const propertyIds = ownerProperties.map(p => p.id);
  const totalProperties = propertyIds.length;

  if (totalProperties === 0) {
    // If owner has no properties, return zeroed data to avoid unnecessary queries.
    return {
      totalProperties: 0,
      totalTenants: 0,
      totalRevenue: 0,
      pendingMaintenance: 0,
      pendingApplications: 0,
    };
  }

  // 2. Fetch aggregated data based on the owner's property IDs
  
  // First, get all tenant associations for the owner's properties
  const { data: propertyTenants, error: propertyTenantsError } = await supabase
    .from('property_tenants')
    .select('id')
    .in('property_id', propertyIds);
  
  if (propertyTenantsError) throw propertyTenantsError;

  const totalTenants = propertyTenants.length;
  const propertyTenantIds = propertyTenants.map(pt => pt.id);

  // Fetch total revenue using the property-tenant links
  let totalRevenue = 0;
  if (propertyTenantIds.length > 0) {
    const { data: revenueData, error: revenueError } = await supabase
      .from('rent_payments')
      .select('amount')
      .in('property_tenant_id', propertyTenantIds);

    if (revenueError) throw revenueError;
    totalRevenue = revenueData?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
  }
  
  // Fetch pending maintenance requests
  const { count: pendingMaintenance, error: maintenanceError } = await supabase
    .from('maintenance_requests')
    .select('id', { count: 'exact' })
    .in('property_id', propertyIds)
    .eq('status', 'pending');
  if (maintenanceError) throw maintenanceError;

  // Fetch pending rental applications
  const { count: pendingApplications, error: applicationsError } = await supabase
    .from('rental_applications')
    .select('id', { count: 'exact' })
    .in('property_id', propertyIds)
    .eq('status', 'pending');
  if (applicationsError) throw applicationsError;

  return {
    totalProperties: totalProperties ?? 0,
    totalTenants: totalTenants ?? 0,
    totalRevenue,
    pendingMaintenance: pendingMaintenance ?? 0,
    pendingApplications: pendingApplications ?? 0,
  };
}

export function useOwnerDashboardData() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['ownerDashboardData', user?.id],
    queryFn: () => {
      if (!user) throw new Error("User not authenticated");
      return getOwnerDashboardData(user.id)
    },
    enabled: !!user,
  });
}
