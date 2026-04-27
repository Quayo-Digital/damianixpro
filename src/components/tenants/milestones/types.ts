export interface Milestone {
  id: string;
  tenant_id: string;
  tenant_name: string;
  property_id: string;
  property_name: string;
  milestone_type: 'lease_expiration' | 'rent_increase' | 'inspection' | 'maintenance' | 'other';
  description: string;
  date: string;
  notification_sent: boolean;
  status: 'upcoming' | 'active' | 'completed' | 'overdue';
}

export type MilestoneFilterType = 'all' | 'upcoming' | 'active' | 'completed' | 'overdue';
