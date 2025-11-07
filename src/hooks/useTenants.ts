import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';

export interface Tenant {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'pending' | 'terminated';
  created_at: string;
  updated_at: string;
  // Joined data
  property?: {
    id: string;
    title: string;
    address: string;
    type: string;
  };
  lease?: {
    id: string;
    start_date: string;
    end_date: string;
    monthly_rent: number;
    status: string;
  };
  user?: {
    id: string;
    email: string;
    avatar_url?: string;
  };
}

export interface TenantApplication {
  id: string;
  tenant_id: string;
  property_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  application_date: string;
  notes?: string;
  tenant?: Tenant;
  property?: {
    id: string;
    title: string;
    address: string;
    type: string;
  };
}

export interface TenantScreening {
  id: string;
  tenant_id: string;
  credit_score?: number;
  employment_status: string;
  monthly_income?: number;
  previous_landlord_reference?: string;
  background_check_status: 'pending' | 'passed' | 'failed';
  created_at: string;
  tenant?: Tenant;
}

export const useTenants = () => {
  const { user, isOwner, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all tenants with property and lease information
  const {
    data: tenants = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      if (!user || (!isOwner() && !isAdmin())) {
        throw new Error('Unauthorized access');
      }

      const { data, error } = await supabase
        .from('tenants')
        .select(`
          *,
          user:users(id, email, avatar_url),
          property_tenants(
            property:properties(id, title, address, type)
          ),
          leases(
            id,
            start_date,
            end_date,
            monthly_rent,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to flatten relationships
      return data.map((tenant: any) => ({
        ...tenant,
        property: tenant.property_tenants?.[0]?.property || null,
        lease: tenant.leases?.[0] || null,
      }));
    },
    enabled: !!user && (isOwner() || isAdmin()),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch tenant applications
  const {
    data: applications = [],
    isLoading: applicationsLoading,
    refetch: refetchApplications
  } = useQuery({
    queryKey: ['tenant-applications'],
    queryFn: async () => {
      if (!user || (!isOwner() && !isAdmin())) {
        throw new Error('Unauthorized access');
      }

      const { data, error } = await supabase
        .from('tenant_applications')
        .select(`
          *,
          tenant:tenants(*),
          property:properties(id, title, address, type)
        `)
        .order('application_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user && (isOwner() || isAdmin()),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch tenant screenings
  const {
    data: screenings = [],
    isLoading: screeningsLoading,
    refetch: refetchScreenings
  } = useQuery({
    queryKey: ['tenant-screenings'],
    queryFn: async () => {
      if (!user || (!isOwner() && !isAdmin())) {
        throw new Error('Unauthorized access');
      }

      const { data, error } = await supabase
        .from('tenant_screenings')
        .select(`
          *,
          tenant:tenants(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user && (isOwner() || isAdmin()),
    staleTime: 1000 * 60 * 5,
  });

  // Create tenant mutation
  const createTenantMutation = useMutation({
    mutationFn: async (tenantData: {
      user_id: string;
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
      status?: string;
    }) => {
      const { data, error } = await supabase
        .from('tenants')
        .insert([{
          ...tenantData,
          status: tenantData.status || 'active'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Tenant created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create tenant: ${error.message}`);
    },
  });

  // Update tenant mutation
  const updateTenantMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Tenant> }) => {
      const { data, error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Tenant updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update tenant: ${error.message}`);
    },
  });

  // Delete tenant mutation
  const deleteTenantMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Tenant deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete tenant: ${error.message}`);
    },
  });

  // Update application status mutation
  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('tenant_applications')
        .update({ status, notes })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-applications'] });
      toast.success('Application status updated');
    },
    onError: (error: any) => {
      toast.error(`Failed to update application: ${error.message}`);
    },
  });

  return {
    // Data
    tenants,
    applications,
    screenings,
    
    // Loading states
    isLoading,
    applicationsLoading,
    screeningsLoading,
    
    // Error states
    error,
    
    // Refetch functions
    refetch,
    refetchApplications,
    refetchScreenings,
    
    // Mutations
    createTenant: createTenantMutation.mutate,
    updateTenant: updateTenantMutation.mutate,
    deleteTenant: deleteTenantMutation.mutate,
    updateApplication: updateApplicationMutation.mutate,
    
    // Mutation states
    isCreating: createTenantMutation.isPending,
    isUpdating: updateTenantMutation.isPending,
    isDeleting: deleteTenantMutation.isPending,
    isUpdatingApplication: updateApplicationMutation.isPending,
  };
};

// Hook for tenant statistics
export const useTenantStats = () => {
  const { user, isOwner, isAdmin } = useAuth();

  return useQuery({
    queryKey: ['tenant-stats'],
    queryFn: async () => {
      if (!user || (!isOwner() && !isAdmin())) {
        throw new Error('Unauthorized access');
      }

      const [tenantsRes, applicationsRes, screeningsRes] = await Promise.all([
        supabase.from('tenants').select('status', { count: 'exact' }),
        supabase.from('tenant_applications').select('status', { count: 'exact' }),
        supabase.from('tenant_screenings').select('background_check_status', { count: 'exact' })
      ]);

      if (tenantsRes.error) throw tenantsRes.error;
      if (applicationsRes.error) throw applicationsRes.error;
      if (screeningsRes.error) throw screeningsRes.error;

      const tenantsByStatus = tenantsRes.data?.reduce((acc: any, tenant: any) => {
        acc[tenant.status] = (acc[tenant.status] || 0) + 1;
        return acc;
      }, {}) || {};

      const applicationsByStatus = applicationsRes.data?.reduce((acc: any, app: any) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {}) || {};

      return {
        totalTenants: tenantsRes.count || 0,
        activeTenants: tenantsByStatus.active || 0,
        pendingTenants: tenantsByStatus.pending || 0,
        totalApplications: applicationsRes.count || 0,
        pendingApplications: applicationsByStatus.pending || 0,
        approvedApplications: applicationsByStatus.approved || 0,
        rejectedApplications: applicationsByStatus.rejected || 0,
        totalScreenings: screeningsRes.count || 0,
      };
    },
    enabled: !!user && (isOwner() || isAdmin()),
    staleTime: 1000 * 60 * 5,
  });
};
