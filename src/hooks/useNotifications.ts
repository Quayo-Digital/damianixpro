import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSession } from '@/contexts/auth';
import { Notification } from '@/types/notification';
import { toast } from '@/components/ui/sonner';
import { tryOnlineThenEnqueue } from '@/lib/offlineQueue';

export const NOTIFICATION_DROPDOWN_LIMIT = 20;

export function invalidateNotificationQueries(queryClient: QueryClient, userId: string) {
  queryClient.invalidateQueries({
    predicate: (q) =>
      Array.isArray(q.queryKey) && q.queryKey[0] === 'notifications' && q.queryKey[1] === userId,
  });
}

/**
 * Marks one notification as read. Routed through the offline write queue —
 * the operation is naturally idempotent (UPDATE … SET is_read = true), so a
 * replayed request is a no-op.
 */
export async function markNotificationAsRead(
  userId: string,
  notificationId: string
): Promise<void> {
  await tryOnlineThenEnqueue('mark-notification-read', {
    user_id: userId,
    notification_id: notificationId,
  });
}

/** Keep first occurrence per id (defensive: duplicate rows or client quirks). */
function dedupeNotificationsById(rows: Notification[]): Notification[] {
  const seen = new Set<string>();
  const out: Notification[] = [];
  for (const n of rows) {
    if (!n.id || seen.has(n.id)) continue;
    seen.add(n.id);
    out.push(n);
  }
  return out;
}

export async function fetchNotifications(userId: string, limit = 10): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return dedupeNotificationsById((data ?? []) as Notification[]);
}

async function markAllNotificationsAsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    throw new Error(error.message);
  }
}

/** Single global subscription (mount via NotificationRealtimeSubscriber in AppContent). */
export function useNotificationRealtimeSubscription() {
  const { user } = useAuthSession();
  const queryClient = useQueryClient();
  const lastEventRef = useRef<{ id: string; at: number } | null>(null);

  useEffect(() => {
    if (!user) return;

    let channel: Parameters<typeof supabase.removeChannel>[0] | null = null;
    const timeoutId = setTimeout(() => {
      // Per-user channel name avoids collisions; scoped filter already applies.
      channel = supabase
        .channel(`realtime-notifications:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            invalidateNotificationQueries(queryClient, user.id);

            const row = payload.new as {
              id?: string;
              title?: string | null;
              description?: string | null;
            };
            const title = row?.title;
            const description = row?.description;
            const notifId = row?.id;

            // Supabase / dev can occasionally deliver the same INSERT twice; skip duplicate UX.
            if (notifId) {
              const now = Date.now();
              const last = lastEventRef.current;
              if (last && last.id === notifId && now - last.at < 3000) {
                return;
              }
              lastEventRef.current = { id: notifId, at: now };
            }

            toast.info(title || 'Notification', {
              id: notifId ? `db-notification:${notifId}` : undefined,
              description: description ?? undefined,
            });
          }
        )
        .subscribe();
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id, queryClient]);
}

export function useNotifications() {
  const { user } = useAuthSession();
  const queryClient = useQueryClient();

  const {
    data: notifications = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['notifications', user?.id, 'dropdown'],
    queryFn: () => fetchNotifications(user!.id, NOTIFICATION_DROPDOWN_LIMIT),
    enabled: !!user,
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllAsReadMutation = useMutation({
    mutationFn: () => markAllNotificationsAsRead(user!.id),
    onSuccess: () => {
      if (user?.id) invalidateNotificationQueries(queryClient, user.id);
    },
    onError: (e) => {
      toast.error('Failed to mark notifications as read');
      console.error(e);
    },
  });

  const markOneAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => markNotificationAsRead(user!.id, notificationId),
    onSuccess: () => {
      if (user?.id) invalidateNotificationQueries(queryClient, user.id);
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAllAsRead: markAllAsReadMutation.mutate,
    markOneAsRead: markOneAsReadMutation.mutate,
    isMarkingOne: markOneAsReadMutation.isPending,
  };
}
