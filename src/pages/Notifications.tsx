import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, CreditCard } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useAuthSession } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';
import { fetchNotifications } from '@/hooks/useNotifications';
import { Notification } from '@/types/notification';
import { Skeleton } from '@/components/ui/skeleton';

const NOTIFICATION_PAGE_LIMIT = 100;

type TabValue = 'all' | 'unread' | Notification['type'];

const FILTER_TABS: { value: TabValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'payment', label: 'Payment' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'lease', label: 'Lease' },
  { value: 'announcement', label: 'Announcements' },
  { value: 'general', label: 'General' },
];

export default function Notifications() {
  const { user } = useAuthSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notificationsTab, setNotificationsTab] = useState<TabValue>('all');

  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notifications', user?.id, 'page'],
    queryFn: () => fetchNotifications(user!.id, NOTIFICATION_PAGE_LIMIT),
    enabled: !!user,
  });

  const markOneRead = useMutation({
    mutationFn: async (id: string) => {
      const { error: e } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', user!.id);
      if (e) throw e;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error: e } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user!.id)
        .eq('is_read', false);
      if (e) throw e;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const filteredNotifications = useMemo(() => {
    if (notificationsTab === 'all') return notifications;
    if (notificationsTab === 'unread') return notifications.filter((n) => !n.is_read);
    return notifications.filter((n) => n.type === notificationsTab);
  }, [notifications, notificationsTab]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <PageLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-4">
          <h1 className="text-3xl font-bold">Notifications</h1>

          {error && (
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : 'Could not load notifications.'}
              <Button variant="link" className="ml-2 h-auto p-0" onClick={() => refetch()}>
                Retry
              </Button>
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter notifications">
              {FILTER_TABS.map(({ value, label }) => (
                <Button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={notificationsTab === value}
                  variant={notificationsTab === value ? 'default' : 'outline'}
                  size="sm"
                  className="gap-2"
                  onClick={() => setNotificationsTab(value)}
                >
                  {label}
                  {value === 'all' && (
                    <Badge variant="secondary" className="tabular-nums">
                      {notifications.length}
                    </Badge>
                  )}
                  {value === 'unread' && (
                    <Badge variant="secondary" className="tabular-nums">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={unreadCount === 0 || markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              Mark all as read
            </Button>
          </div>

          <div className="mt-2">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : filteredNotifications.length > 0 ? (
              <div className="grid gap-4">
                {filteredNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    role="button"
                    tabIndex={0}
                    className={`cursor-pointer transition-colors hover:bg-muted/40 ${
                      !notification.is_read ? 'border-l-4 border-l-primary' : ''
                    }`}
                    onClick={() => {
                      if (!notification.is_read) {
                        markOneRead.mutate(notification.id);
                      }
                      if (notification.link) {
                        navigate(notification.link);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (!notification.is_read) {
                          markOneRead.mutate(notification.id);
                        }
                        if (notification.link) {
                          navigate(notification.link);
                        }
                      }
                    }}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="flex items-start gap-2 text-lg">
                          {!notification.is_read && (
                            <span
                              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
                              aria-hidden
                            />
                          )}
                          {notification.title}
                        </CardTitle>
                        <CardDescription className="shrink-0 text-right">
                          {notification.created_at
                            ? formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                              })
                            : ''}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {notification.description && <p>{notification.description}</p>}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3 pt-0 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex w-full flex-wrap items-center justify-between gap-2">
                        <Badge variant="outline">{notification.type}</Badge>
                        <div className="flex flex-wrap items-center gap-2">
                          {notification.link?.includes('tab=payments') && (
                            <Button
                              variant="default"
                              size="sm"
                              type="button"
                              className="gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!notification.is_read) {
                                  markOneRead.mutate(notification.id);
                                }
                                navigate(notification.link!);
                              }}
                            >
                              <CreditCard className="h-4 w-4" />
                              Pay now
                            </Button>
                          )}
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                markOneRead.mutate(notification.id);
                              }}
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No notifications</h3>
                <p className="text-muted-foreground">
                  {notificationsTab === 'unread'
                    ? 'You have no unread notifications.'
                    : "You're all caught up."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
