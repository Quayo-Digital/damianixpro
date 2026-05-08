import { supabase } from '@/integrations/supabase/client';
import { OfflineQueueFatalError, type OfflineQueueHandler } from '../types';

export interface MarkNotificationReadPayload {
  user_id: string;
  notification_id: string;
}

/**
 * Marks one notification as read. The operation is naturally idempotent: a
 * second `UPDATE … SET is_read = true WHERE id = ?` is a no-op.
 */
async function markRead(payload: MarkNotificationReadPayload): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', payload.notification_id)
    .eq('user_id', payload.user_id);

  if (!error) return;

  const code = (error as { code?: string | null }).code ?? '';
  // 42 = syntax/missing column, 22 = data exception. Don't retry these.
  if (/^(42|22)/.test(code)) {
    throw new OfflineQueueFatalError(`Cannot mark notification read: ${error.message}`, error);
  }

  throw error;
}

export const markNotificationReadHandler: OfflineQueueHandler<MarkNotificationReadPayload> = {
  name: 'mark-notification-read',
  label: () => 'Mark notification as read',
  execute: markRead,
};
