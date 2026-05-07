export type MaintenanceTicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type MaintenanceTicketStatus = 'pending' | 'in_progress' | 'resolved' | 'cancelled';

export interface MaintenanceTicket {
  id: string;
  ticket_number: string;
  tenant_id: string;
  property_id: string;
  unit_id: string | null;
  title: string;
  description: string;
  priority: MaintenanceTicketPriority;
  status: MaintenanceTicketStatus;
  assigned_to: string | null;
  created_by: string;
  cost_estimate: number;
  actual_cost: number | null;
  sla_deadline: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  is_overdue?: boolean;
}

export interface MaintenanceComment {
  id: string;
  ticket_id: string;
  user_id: string;
  comment: string;
  created_at: string;
}

export interface MaintenanceAttachment {
  id: string;
  ticket_id: string;
  file_url: string;
  file_type: string | null;
  created_at: string;
}

export interface MaintenanceHistoryRow {
  id: string;
  ticket_id: string;
  action: string;
  performed_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface MaintenanceTicketBundle {
  ticket: MaintenanceTicket;
  comments: MaintenanceComment[];
  attachments: MaintenanceAttachment[];
  history: MaintenanceHistoryRow[];
}
