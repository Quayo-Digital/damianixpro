import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSession } from '@/contexts/auth';
import { Property } from '@/services/property/types';
import { mapSupabaseToProperty } from '@/services/property/utils';

/**
 * Enhanced useProperties hook with proper role-based filtering
 * FIXES CRITICAL SECURITY ISSUE: Agents now only see assigned properties
 */
export const useProperties = () => {
  const { user, userRole } = useAuthSession();
  const queryClient = useQueryClient();

  const queryKey = ['properties-secure', userRole, user?.id];

  const fetchPropertiesSecurely = async (): Promise<Property[]> => {
    if (!user || !userRole) {
      console.warn('No user or role found, returning empty properties');
      return [];
    }

    try {
      let query = supabase
        .from('properties')
        .select(
          'id,name,address,status,owner_id,agent_id,organization_id,created_at,amenities,features,shortlet_details,lease_terms,availability_date,latitude,longitude,tour_url,agent_commission_rate'
        )
        .order('created_at', { ascending: false });

      // 🔒 SECURITY FIX: Apply role-based filtering
      switch (userRole) {
        case 'owner':
          // Owners see only their properties
          query = query.eq('owner_id', user.id);
          console.log('Fetching properties for owner:', user.id);
          break;

        case 'agent':
          // Agents see only properties they're assigned to (agent_id in schema)
          query = query.eq('agent_id', user.id);
          console.log('Fetching properties assigned to agent:', user.id);
          break;

        case 'admin':
        case 'super_admin':
        case 'accountant':
        case 'facility_manager':
          // Staff roles: rely on RLS (migration extends SELECT for accountants / facility managers).
          console.log('Fetching properties for staff role:', userRole);
          break;

        case 'tenant':
          // Tenants see:
          // 1. Properties they're linked to via property_tenants
          // 2. Properties they have active leases for
          // 3. Available properties for browsing
          // Note: RLS policies handle the filtering, so we fetch all and let RLS filter
          // For better performance, we can add explicit filtering here
          console.log('Fetching properties for tenant:', user.id);
          // RLS will filter to show only tenant's properties + available properties
          break;

        case 'vendor':
          // Vendors see only properties they're assigned to for maintenance
          // For now, return empty - this needs proper maintenance assignment logic
          console.log('Vendor property access - returning empty for now');
          return [];

        case 'manager':
          // Property managers: use agent_id (managers may be assigned like agents) or owner_id for owned
          // If no manager_id column, show properties where user is agent
          query = query.or(`agent_id.eq.${user.id},owner_id.eq.${user.id}`);
          console.log('Fetching properties for manager:', user.id);
          break;

        default:
          // Default: no properties for unknown roles
          console.warn('Unknown role, returning empty properties:', userRole);
          return [];
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching properties:', error);
        throw error;
      }

      const properties: Property[] = data?.map(mapSupabaseToProperty) || [];

      console.log(
        `✅ SECURITY: User ${user.id} (${userRole}) has access to ${properties.length} properties`
      );
      return properties;
    } catch (error) {
      console.error('Error in fetchPropertiesSecurely:', error);
      return [];
    }
  };

  const {
    data: properties = [],
    isLoading,
    error,
  } = useQuery<Property[]>({
    queryKey,
    queryFn: fetchPropertiesSecurely,
    enabled: !!user && !!userRole,
  });

  const refreshProperties = () => {
    queryClient.invalidateQueries({ queryKey });
  };

  return {
    properties,
    isLoading,
    error,
    refreshProperties,
    userRole,
    secureCount: properties.length,
  };
};
