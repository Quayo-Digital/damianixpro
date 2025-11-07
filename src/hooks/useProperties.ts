
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { Property } from '@/services/property/types';
import { mapSupabaseToProperty } from '@/services/property/utils';

/**
 * Enhanced useProperties hook with proper role-based filtering
 * FIXES CRITICAL SECURITY ISSUE: Agents now only see assigned properties
 */
export const useProperties = () => {
  const { user, userRole } = useAuth();
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
        .select('*')
        .order('created_at', { ascending: false });

      // 🔒 SECURITY FIX: Apply role-based filtering
      switch (userRole) {
        case 'owner':
          // Owners see only their properties
          query = query.eq('owner_id', user.id);
          console.log('Fetching properties for owner:', user.id);
          break;

        case 'agent':
          // ✅ CRITICAL FIX: Agents see only properties they're assigned to
          query = query.eq('assigned_agent_id', user.id);
          console.log('Fetching properties assigned to agent:', user.id);
          break;

        case 'admin':
        case 'super_admin':
          // Admins can see all properties (legitimate access)
          console.log('Fetching all properties for admin');
          break;

        case 'tenant':
          // Tenants see only available properties or their rented property
          query = query.or(`status.eq.available,tenant_id.eq.${user.id}`);
          console.log('Fetching available properties for tenant:', user.id);
          break;

        case 'vendor':
          // Vendors see only properties they're assigned to for maintenance
          // For now, return empty - this needs proper maintenance assignment logic
          console.log('Vendor property access - returning empty for now');
          return [];

        case 'manager':
          // Managers see properties they're managing
          query = query.eq('manager_id', user.id);
          console.log('Fetching properties managed by:', user.id);
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
      
      console.log(`✅ SECURITY: User ${user.id} (${userRole}) has access to ${properties.length} properties`);
      return properties;
      
    } catch (error) {
      console.error('Error in fetchPropertiesSecurely:', error);
      return [];
    }
  };

  const { data: properties = [], isLoading, error } = useQuery<Property[]>({
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
    secureCount: properties.length
  };
};
