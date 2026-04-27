import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSession } from '@/contexts/auth';
import { Property } from '@/services/property/types';
import { mapSupabaseToProperty } from '@/services/property/utils';

/**
 * Enhanced property fetching with proper role-based filtering
 * Fixes the critical security issue where agents could see all properties
 */
export const usePropertiesWithRoleFiltering = () => {
  const { user, userRole } = useAuthSession();
  const queryClient = useQueryClient();

  const queryKey = ['properties-filtered', userRole, user?.id];

  const fetchPropertiesForRole = async (): Promise<Property[]> => {
    if (!user || !userRole) {
      console.warn('No user or role found, returning empty properties');
      return [];
    }

    try {
      let query = supabase.from('properties').select('*').order('created_at', { ascending: false });

      // Apply role-based filtering
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
          // Admins can see all properties (legitimate access)
          console.log('Fetching all properties for admin');
          break;

        case 'tenant':
          // Tenants see only available properties or their rented property
          query = query.eq('status', 'available');
          console.log('Fetching available properties for tenant:', user.id);
          break;

        case 'vendor':
          // Vendors see only properties they're assigned to for maintenance
          // For now, return empty - this needs proper maintenance assignment logic
          console.log('Vendor property access - returning empty for now');
          return [];

        case 'manager':
          // Property managers: properties where user is agent or owner
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

      console.log(`Fetched ${properties.length} properties for role: ${userRole}`);
      return properties;
    } catch (error) {
      console.error('Error in fetchPropertiesForRole:', error);
      return [];
    }
  };

  const {
    data: properties = [],
    isLoading,
    error,
  } = useQuery<Property[]>({
    queryKey,
    queryFn: fetchPropertiesForRole,
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
    filteredCount: properties.length,
  };
};

/**
 * Hook specifically for agent property access
 * Ensures agents only see their assigned properties
 */
export const useAgentProperties = () => {
  const { user, userRole } = useAuthSession();
  const queryClient = useQueryClient();

  const queryKey = ['agent-properties', user?.id];

  const fetchAgentProperties = async (): Promise<Property[]> => {
    if (!user || userRole !== 'agent') {
      console.warn('useAgentProperties called by non-agent user');
      return [];
    }

    try {
      console.log('Fetching properties specifically assigned to agent:', user.id);

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('assigned_agent_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching agent properties:', error);
        throw error;
      }

      const properties: Property[] = data?.map(mapSupabaseToProperty) || [];

      console.log(`Agent ${user.id} has access to ${properties.length} assigned properties`);
      return properties;
    } catch (error) {
      console.error('Error in fetchAgentProperties:', error);
      return [];
    }
  };

  const {
    data: properties = [],
    isLoading,
    error,
  } = useQuery<Property[]>({
    queryKey,
    queryFn: fetchAgentProperties,
    enabled: !!user && userRole === 'agent',
  });

  const refreshProperties = () => {
    queryClient.invalidateQueries({ queryKey });
  };

  return {
    properties,
    isLoading,
    error,
    refreshProperties,
    assignedCount: properties.length,
  };
};
