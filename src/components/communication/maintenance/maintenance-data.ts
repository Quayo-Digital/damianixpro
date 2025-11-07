export interface MaintenanceUpdate {
  message: string;
  date: string;
  created_by?: string;
}

export interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  property_id?: string;
  property_name?: string;
  tenant_name?: string;
  image_url?: string | null;
  created_at?: string;
  updates: MaintenanceUpdate[];
  category: string;
}

// Helper function to ensure updates are properly typed
export function parseUpdatesFromJson(updates: any): MaintenanceUpdate[] {
  if (!updates) return [];
  
  if (Array.isArray(updates)) {
    return updates.map(update => ({
      message: update.message || '',
      date: update.date || new Date().toISOString(),
      created_by: update.created_by
    }));
  }
  
  return [];
}

// Helper function to convert MaintenanceUpdate[] to a valid JSON object for Supabase
export function updatesToJson(updates: MaintenanceUpdate[]): any {
  return updates || [];
}
