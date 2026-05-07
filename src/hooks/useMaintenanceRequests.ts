import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { notifyError } from '@/utils/notify';
import {
  MaintenanceRequest,
  parseUpdatesFromJson,
} from '@/components/communication/maintenance/maintenance-data';

export const useMaintenanceRequests = () => {
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMaintenanceRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(
          'id, issue, category, status, priority, property_id, created_at, updates, image_url'
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const typedRequests: MaintenanceRequest[] = data.map((item) => {
          const row = item as Record<string, unknown>;
          const issue = typeof row.issue === 'string' ? row.issue : '';
          const category = typeof row.category === 'string' ? row.category : '';
          const title = issue.trim() || category || 'Maintenance';
          return {
            id: String(row.id),
            title,
            description: typeof row.description === 'string' ? row.description : issue || category,
            status: (row.status as 'pending' | 'in_progress' | 'completed') || 'pending',
            priority: (row.priority as 'low' | 'medium' | 'high') || 'medium',
            property_id: row.property_id as string | undefined,
            property_name: row.property_name as string | undefined,
            tenant_name: row.tenant_name as string | undefined,
            image_url: row.image_url as string | null | undefined,
            created_at: row.created_at as string | undefined,
            updates: parseUpdatesFromJson(row.updates),
            category,
          };
        });
        setMaintenanceRequests(typedRequests);
      }
    } catch (error) {
      console.error('Error fetching maintenance requests:', error);
      notifyError('Error', 'Failed to load maintenance requests');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaintenanceRequests();
  }, [fetchMaintenanceRequests]);

  return { maintenanceRequests, isLoading, refetch: fetchMaintenanceRequests };
};
