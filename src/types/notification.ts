export type NotificationEngineMetadata = {
  notification_engine?: boolean;
  trigger_key?: string;
  /** Parallel outbox channels for this event (email / SMS / WhatsApp) when contact details exist. */
  engine_fanout_channels?: string[];
  channel?: string;
  outbox_id?: string;
  template_id?: string;
};

export interface Notification {
  id: string;
  user_id: string;
  created_at: string;
  title: string;
  description?: string;
  type: 'payment' | 'maintenance' | 'lease' | 'announcement' | 'general';
  is_read: boolean;
  link?: string;
  metadata?: NotificationEngineMetadata & Record<string, unknown>;
}
