import { useNotificationRealtimeSubscription } from '@/hooks/useNotifications';

/**
 * Mount once under the app shell so INSERTs on `notifications` invalidate the list
 * and show a toast even when the bell (NotificationCenter) is not rendered.
 */
export function NotificationRealtimeSubscriber() {
  useNotificationRealtimeSubscription();
  return null;
}
