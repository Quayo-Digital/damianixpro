
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, BellOff } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export function NotificationCenter() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllAsRead, isLoading, error } = useNotifications();

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };
  
  const handleNotificationClick = (link?: string) => {
    if (link) {
      navigate(link);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">View notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
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
            <div className="p-2 space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
          )}
          {error && (
             <DropdownMenuItem disabled>
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-4 w-full">
                    <BellOff className="h-8 w-8 mb-2 text-destructive" />
                    <p className="text-sm">Could not load notifications</p>
                </div>
            </DropdownMenuItem>
          )}
          {!isLoading && !error && notifications.length === 0 && (
            <DropdownMenuItem disabled>
              <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-4 w-full">
                <Bell className="h-8 w-8 mb-2" />
                <p className="text-sm">You have no new notifications</p>
              </div>
            </DropdownMenuItem>
          )}
          {!isLoading && !error && notifications.map((notification) => (
             <DropdownMenuItem key={notification.id} onClick={() => handleNotificationClick(notification.link)} className={`cursor-pointer ${!notification.is_read ? 'bg-secondary' : ''}`}>
                <div className="flex flex-col space-y-1 leading-none w-full">
                  <p className="text-sm font-medium">{notification.title}</p>
                  {notification.description && (
                     <p className="text-xs text-muted-foreground">
                        {notification.description}
                     </p>
                  )}
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
