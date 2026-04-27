import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, BellRing, RefreshCw, CheckCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { toast } from '@/components/ui/sonner';
import { PaymentNotification } from '@/services/notifications/types';
import { checkUpcomingPayments, sendPaymentReminder } from '@/services/notifications/payment';
import { useAuthSession } from '@/contexts/auth';

interface RentalMilestoneNotifierProps {
  tenantId?: string; // Optional - if not provided, will use authenticated user
  showPaymentReminders?: boolean;
}

export function RentalMilestoneNotifier({
  tenantId,
  showPaymentReminders = true,
}: RentalMilestoneNotifierProps) {
  const { user } = useAuthSession();
  const [paymentNotifications, setPaymentNotifications] = useState<PaymentNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const effectiveTenantId = tenantId || user?.id || '';

  useEffect(() => {
    if (effectiveTenantId && showPaymentReminders) {
      loadNotifications();
    }
  }, [effectiveTenantId, showPaymentReminders]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      if (showPaymentReminders) {
        const upcomingPayments = await checkUpcomingPayments(effectiveTenantId);
        setPaymentNotifications(upcomingPayments);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Failed to load payment reminders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendNotification = async (id: string) => {
    try {
      const notification = paymentNotifications.find((n) => n.id === id);
      if (notification) {
        const daysRemaining = differenceInDays(new Date(notification.due_date), new Date());
        await sendPaymentReminder(
          notification.tenant_id,
          notification.amount,
          notification.due_date,
          daysRemaining
        );

        // Update local state to show notification as acknowledged
        setPaymentNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_acknowledged: true } : n))
        );

        toast.success('Payment reminder sent successfully');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    }
  };

  const hasNotifications = paymentNotifications.length > 0;

  if (!showPaymentReminders || (!hasNotifications && !isLoading)) {
    return null; // Don't render anything if there are no notifications
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Upcoming Payment Reminders</CardTitle>
            <CardDescription>Upcoming payment due dates</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadNotifications} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Payment Notifications */}
            {paymentNotifications.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Payment Reminders</h3>

                {paymentNotifications.map((notification) => {
                  const dueDate = new Date(notification.due_date);
                  const daysRemaining = differenceInDays(dueDate, new Date());

                  return (
                    <div
                      key={notification.id}
                      className="flex items-start justify-between rounded-md bg-muted p-3"
                    >
                      <div className="flex items-start gap-3">
                        <Calendar className="mt-1 h-5 w-5 text-green-500" />
                        <div>
                          <h4 className="text-sm font-medium">Payment Due</h4>
                          <p className="text-xs text-muted-foreground">
                            Rent payment of ₦{notification.amount.toLocaleString()} is due soon.
                          </p>
                          <div className="mt-1 flex items-center">
                            <Badge variant="outline" className="text-xs">
                              {format(dueDate, 'MMM d, yyyy')} ({daysRemaining} days remaining)
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div>
                        {notification.is_acknowledged ? (
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1 bg-green-100 text-green-700"
                          >
                            <CheckCircle className="h-3 w-3" />
                            <span>Notified</span>
                          </Badge>
                        ) : (
                          <Button size="sm" onClick={() => handleSendNotification(notification.id)}>
                            <BellRing className="mr-1 h-3 w-3" /> Notify
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
