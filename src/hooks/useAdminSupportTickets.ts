import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MaintenanceRequest } from '@/components/communication/maintenance/maintenance-data';
import { parseUpdatesFromJson } from '@/components/communication/maintenance/maintenance-data';

export interface AdminMaintenanceRequest extends Omit<MaintenanceRequest, 'updates'> {
  admin_notes: string | null;
  updates: any; // Keep updates flexible for now
}

const fetchSupportTickets = async (category?: string): Promise<AdminMaintenanceRequest[]> => {
  let query = supabase
    .from('maintenance_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return [];

  // Transform the data to match our AdminMaintenanceRequest type
  const formattedRequests: AdminMaintenanceRequest[] = data.map((item) => ({
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
    admin_notes: item.admin_notes,
    updates: parseUpdatesFromJson(item.updates),
    category: item.category,
  }));

  return formattedRequests;
};

export const useAdminSupportTickets = ({ category }: { category?: string } = {}) => {
  return useQuery<AdminMaintenanceRequest[]>({
    queryKey: ['admin-support-tickets', category],
    queryFn: () => fetchSupportTickets(category),
  });
};
