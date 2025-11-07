
export interface Notification {
  id: string;
  user_id: string;
  created_at: string;
  title: string;
  description?: string;
  type: 'payment' | 'maintenance' | 'lease' | 'announcement' | 'general';
  is_read: boolean;
  link?: string;
  metadata?: any;
}
