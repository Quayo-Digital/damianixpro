import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { MaintenanceRequest } from '@/components/communication/maintenance/maintenance-data';
import { MaintenanceNotification } from './types';

// Function to get maintenance updates for a tenant
export async function getMaintenanceUpdates(tenantId: string): Promise<MaintenanceNotification[]> {
  try {
    // In a real implementation, this would query the database for recent maintenance updates
    // For now, using sample data for demonstration
    const mockUpdate: MaintenanceNotification = {
      id: '13579',
      request_id: 'request-1',
      tenant_id: tenantId,
      property_id: 'property-1',
      update_type: 'status_change',
      message: 'Your maintenance request for "AC Repair" has been updated to "In Progress".',
      is_acknowledged: false,
      created_at: new Date().toISOString(),
    };

    return [mockUpdate];
  } catch (error) {
    console.error('Error getting maintenance updates:', error);
    return [];
  }
}

// Function to send a notification about a maintenance request update
export async function sendMaintenanceUpdateNotification(
  request: MaintenanceRequest,
  updateMessage: string,
  updateType: 'status_change' | 'comment' | 'scheduled',
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      title: `Maintenance: ${request.title}`,
      description: updateMessage,
      type: 'maintenance',
      link: `/maintenance`,
      metadata: { request_id: request.id, update_type: updateType },
    });

    if (error) throw error;

    toast.info('Maintenance Update', {
      description: updateMessage,
    });

    return true;
  } catch (error) {
    console.error('Error sending maintenance update notification:', error);
    return false;
  }
}
