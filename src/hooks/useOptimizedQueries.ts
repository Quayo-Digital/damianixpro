/**
 * Optimized React Query hooks for better performance
 * Implements caching, pagination, and efficient data fetching
 */

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DatabaseOptimizer, CacheOptimizer, PerformanceMonitor } from '@/services/performance/performanceOptimizer';
import { supabase } from '@/integrations/supabase/client';
import { Property, User, Lease, MaintenanceRequest } from '@/integrations/supabase/types';

// Query keys for consistent caching
export const QUERY_KEYS = {
  PROPERTIES: 'properties',
  PROPERTY_DETAIL: 'property-detail',
  USERS: 'users',
  LEASES: 'leases',
  MAINTENANCE: 'maintenance',
  DASHBOARD_STATS: 'dashboard-stats',
  SEARCH_RESULTS: 'search-results',
} as const;

/**
 * Optimized properties query with caching and pagination
 */
export const useOptimizedProperties = (filters: {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  bedrooms?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.PROPERTIES, filters],
    queryFn: async () => {
      // Check cache first
      const cacheKey = `properties-${JSON.stringify(filters)}`;
      const cached = CacheOptimizer.get<Property[]>(cacheKey);
      if (cached) {
        return cached;
      }

      // Fetch with performance monitoring
      const result = await PerformanceMonitor.measurePerformance(
        'Properties Query',
        async () => {
          const { data, error } = await DatabaseOptimizer.searchPropertiesOptimized(filters);
          if (error) throw error;
          return data;
        }
      );

      // Cache the result
      CacheOptimizer.set(cacheKey, result, 5); // 5 minutes cache
      return result;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Infinite scroll properties query for better UX
 */
export const useInfiniteProperties = (filters: {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  bedrooms?: number;
}) => {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.PROPERTIES, 'infinite', filters],
    queryFn: async ({ pageParam = 0 }) => {
      const limit = 20;
      const offset = pageParam * limit;

      const { data, error } = await DatabaseOptimizer.searchPropertiesOptimized({
        ...filters,
        limit,
        offset,
      });

      if (error) throw error;

      return {
        data: data || [],
        nextPage: data && data.length === limit ? pageParam + 1 : undefined,
        hasMore: data && data.length === limit,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Optimized property detail query with relations
 */
export const useOptimizedPropertyDetail = (propertyId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.PROPERTY_DETAIL, propertyId],
    queryFn: async () => {
      const cacheKey = `property-detail-${propertyId}`;
      const cached = CacheOptimizer.get(cacheKey);
      if (cached) return cached;

      const result = await PerformanceMonitor.measurePerformance(
        'Property Detail Query',
        async () => {
          const { data, error } = await DatabaseOptimizer.getPropertyWithRelations(propertyId);
          if (error) throw error;
          return data;
        }
      );

      CacheOptimizer.set(cacheKey, result, 10); // 10 minutes cache
      return result;
    },
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

/**
 * Optimized dashboard statistics query
 */
export const useOptimizedDashboardStats = (userId: string, userRole: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.DASHBOARD_STATS, userId, userRole],
    queryFn: async () => {
      const cacheKey = `dashboard-stats-${userId}-${userRole}`;
      const cached = CacheOptimizer.get(cacheKey);
      if (cached) return cached;

      const result = await PerformanceMonitor.measurePerformance(
        'Dashboard Stats Query',
        async () => {
          // Batch multiple queries for efficiency
          const operations = [];

          if (userRole === 'owner') {
            operations.push(
              () => supabase.from('properties').select('id').eq('owner_id', userId),
              () => supabase.from('leases').select('id, monthly_rent').eq('property.owner_id', userId),
              () => supabase.from('maintenance_requests').select('id, status').eq('property.owner_id', userId)
            );
          } else if (userRole === 'tenant') {
            operations.push(
              () => supabase.from('leases').select('id, monthly_rent').eq('tenant_id', userId),
              () => supabase.from('maintenance_requests').select('id, status').eq('tenant_id', userId)
            );
          }

          const results = await DatabaseOptimizer.batchOperations(operations);
          
          // Process results into dashboard stats
          const stats = {
            totalProperties: results[0]?.data?.length || 0,
            totalRevenue: results[1]?.data?.reduce((sum: number, lease: any) => sum + (lease.monthly_rent || 0), 0) || 0,
            activeLeases: results[1]?.data?.length || 0,
            maintenanceRequests: results[2]?.data?.length || 0,
            pendingMaintenance: results[2]?.data?.filter((req: any) => req.status === 'pending').length || 0,
          };

          return stats;
        }
      );

      CacheOptimizer.set(cacheKey, result, 15); // 15 minutes cache for stats
      return result;
    },
    enabled: !!userId && !!userRole,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Optimized search query with debouncing
 */
export const useOptimizedSearch = (searchTerm: string, filters: any) => {
  return useQuery({
    queryKey: [QUERY_KEYS.SEARCH_RESULTS, searchTerm, filters],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];

      const cacheKey = `search-${searchTerm}-${JSON.stringify(filters)}`;
      const cached = CacheOptimizer.get(cacheKey);
      if (cached) return cached;

      const result = await PerformanceMonitor.measurePerformance(
        'Search Query',
        async () => {
          const { data, error } = await supabase
            .from('properties')
            .select(`
              id,
              name,
              description,
              location,
              price,
              property_type,
              bedrooms,
              bathrooms,
              images
            `)
            .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`)
            .eq('status', 'available')
            .limit(20);

          if (error) throw error;
          return data || [];
        }
      );

      CacheOptimizer.set(cacheKey, result, 5); // 5 minutes cache
      return result;
    },
    enabled: !!searchTerm && searchTerm.length >= 2,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * Optimized mutation with cache invalidation
 */
export const useOptimizedPropertyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (propertyData: Partial<Property>) => {
      return PerformanceMonitor.measurePerformance(
        'Property Mutation',
        async () => {
          const { data, error } = await supabase
            .from('properties')
            .insert(propertyData)
            .select()
            .single();

          if (error) throw error;
          return data;
        }
      );
    },
    onSuccess: (data) => {
      // Invalidate related queries efficiently
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROPERTIES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] });
      
      // Clear related cache entries
      CacheOptimizer.clear();
      
      // Optionally update the cache directly for immediate UI update
      queryClient.setQueryData([QUERY_KEYS.PROPERTY_DETAIL, data.id], data);
    },
    onError: (error) => {
      console.error('Property mutation failed:', error);
    },
  });
};

/**
 * Prefetch related data for better UX
 */
export const usePrefetchRelatedData = () => {
  const queryClient = useQueryClient();

  const prefetchPropertyDetails = async (propertyId: string) => {
    await queryClient.prefetchQuery({
      queryKey: [QUERY_KEYS.PROPERTY_DETAIL, propertyId],
      queryFn: () => DatabaseOptimizer.getPropertyWithRelations(propertyId),
      staleTime: 5 * 60 * 1000,
    });
  };

  const prefetchUserProperties = async (userId: string) => {
    await queryClient.prefetchQuery({
      queryKey: [QUERY_KEYS.PROPERTIES, { owner_id: userId }],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('owner_id', userId);
        
        if (error) throw error;
        return data;
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  return {
    prefetchPropertyDetails,
    prefetchUserProperties,
  };
};

/**
 * Hook for optimized background data sync
 */
export const useBackgroundSync = (userId: string) => {
  const queryClient = useQueryClient();

  // Sync critical data in the background
  const syncData = async () => {
    const criticalQueries = [
      [QUERY_KEYS.DASHBOARD_STATS, userId],
      [QUERY_KEYS.PROPERTIES, { owner_id: userId }],
    ];

    await Promise.allSettled(
      criticalQueries.map(queryKey =>
        queryClient.refetchQueries({ queryKey })
      )
    );
  };

  // Auto-sync every 5 minutes
  React.useEffect(() => {
    const interval = setInterval(syncData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId]);

  return { syncData };
};
