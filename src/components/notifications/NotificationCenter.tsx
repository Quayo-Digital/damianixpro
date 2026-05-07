import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, BellOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationEngineHints } from '@/components/notifications/NotificationEngineHints';

export function NotificationCenter() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllAsRead, markOneAsRead, isLoading, error } =
    useNotifications();

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleOpen = (notification: {
    id: string;
    link?: string | null;
    is_read?: boolean | null;
  }) => {
    if (!notification.is_read) {
      markOneAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-11 w-11 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-[1.2rem] w-[1.2rem]" aria-hidden />
          {unreadCount > 0 && (
            <Badge
              variant="solid"
              className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full p-0 px-1 text-[10px]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">View notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="shadow-float w-80 rounded-xl" align="end" sideOffset={8}>
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {isLoading && (
            <div className="space-y-2 p-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}
          {error && (
            <DropdownMenuItem disabled>
              <div className="flex w-full flex-col items-center justify-center py-4 text-center text-muted-foreground">
                <BellOff className="mb-2 h-8 w-8 text-destructive" />
                <p className="text-sm">Could not load notifications</p>
              </div>
            </DropdownMenuItem>
          )}
          {!isLoading && !error && notifications.length === 0 && (
            <DropdownMenuItem disabled>
              <div className="flex w-full flex-col items-center justify-center py-4 text-center text-muted-foreground">
                <Bell className="mb-2 h-8 w-8" />
                <p className="text-sm">You have no new notifications</p>
              </div>
            </DropdownMenuItem>
          )}
          {!isLoading &&
            !error &&
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => handleOpen(notification)}
                className={`cursor-pointer flex-col items-stretch gap-0 py-2 ${
                  !notification.is_read ? 'bg-secondary' : ''
                }`}
              >
                <div className="flex w-full flex-col space-y-1 leading-none">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <span className="text-[10px] uppercase text-muted-foreground">
                      {notification.type}
                    </span>
                  </div>
                  {notification.description && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {notification.description}
                    </p>
                  )}
                  <NotificationEngineHints metadata={notification.metadata} />
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center" onClick={() => navigate('/notifications')}>
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
