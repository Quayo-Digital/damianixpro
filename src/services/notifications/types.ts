import { MaintenanceRequest } from '@/components/communication/maintenance/maintenance-data';

export interface PaymentNotification {
  id: string;
  tenant_id: string;
  payment_id?: string;
  amount: number;
  due_date: string;
  type: 'upcoming' | 'overdue' | 'received' | 'receipt';
  is_acknowledged: boolean;
  created_at: string;
}

export interface MaintenanceNotification {
  id: string;
  request_id: string;
  tenant_id: string;
  property_id: string;
  update_type: 'status_change' | 'comment' | 'scheduled';
  message: string;
  is_acknowledged: boolean;
  created_at: string;
}

export interface AnnouncementNotification {
  id: string;
  announcement_id: string;
  tenant_id: string;
  property_id: string;
  title: string;
  message: string;
  is_acknowledged: boolean;
  created_at: string;
}
