
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MaintenanceRequest, parseUpdatesFromJson } from '@/components/communication/maintenance/maintenance-data';

export const useMaintenanceRequests = () => {
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchMaintenanceRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        const typedRequests: MaintenanceRequest[] = data.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          status: item.status as 'pending' | 'in_progress' | 'completed',
          priority: item.priority as 'low' | 'medium' | 'high',
          property_id: item.property_id,
          property_name: item.property_name,
          tenant_name: item.tenant_name,
          image_url: item.image_url,
          created_at: item.created_at,
          updates: parseUpdatesFromJson(item.updates),
          category: item.category,
        }));
        setMaintenanceRequests(typedRequests);
      }
    } catch (error) {
      console.error('Error fetching maintenance requests:', error);
      toast({
        title: "Error",
        description: "Failed to load maintenance requests",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMaintenanceRequests();
  }, [fetchMaintenanceRequests]);

  return { maintenanceRequests, isLoading, refetch: fetchMaintenanceRequests };
};
