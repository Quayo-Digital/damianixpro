import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { useAuthSession } from '@/contexts/auth';
import {
  getVapidPublicKey,
  isPushSupported,
  subscribeWebPush,
  unsubscribeWebPush,
} from '@/lib/webPush';

export const NotificationSettings = () => {
  const { user } = useAuthSession();
  const [emailNotifications, setEmailNotifications] = useState(
    () => localStorage.getItem('email-notifications') !== 'false'
  );
  const [pushNotifications, setPushNotifications] = useState(
    () => localStorage.getItem('push-notifications') === 'true'
  );
  const [pushBusy, setPushBusy] = useState(false);

  const vapidConfigured = !!getVapidPublicKey();
  const pushAvailable = isPushSupported() && vapidConfigured && !!user;

  const handleEmailNotificationsChange = (checked: boolean) => {
    setEmailNotifications(checked);
    localStorage.setItem('email-notifications', checked.toString());
    toast({
      title: 'Notification preferences updated',
      description: `Email notifications ${checked ? 'enabled' : 'disabled'}.`,
    });
  };

  const handlePushNotificationsChange = async (checked: boolean) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Log in to manage push notifications.',
        variant: 'destructive',
      });
      return;
    }
    if (!vapidConfigured) {
      toast({
        title: 'Push not configured',
        description:
          'Add VITE_VAPID_PUBLIC_KEY to your environment and deploy the web_push_subscriptions migration.',
        variant: 'destructive',
      });
      return;
    }
    if (!isPushSupported()) {
      toast({
        title: 'Not supported',
        description: 'This browser does not support web push.',
        variant: 'destructive',
      });
      return;
    }

    setPushBusy(true);
    try {
      if (checked) {
        const result = await subscribeWebPush(user.id);
        if (result.ok) {
          setPushNotifications(true);
          toast({
            title: 'Push notifications enabled',
            description: 'You will receive alerts when the app is in the background.',
          });
        } else {
          setPushNotifications(false);
          localStorage.setItem('push-notifications', 'false');
          toast({
            title: 'Could not enable push',
            description: result.message || 'Try again or check browser permissions.',
            variant: 'destructive',
          });
        }
      } else {
        await unsubscribeWebPush(user.id);
        setPushNotifications(false);
        toast({
          title: 'Push notifications disabled',
          description: 'We will no longer send browser push alerts.',
        });
      }
    } finally {
      setPushBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>
          Configure how you receive notifications. Changes are saved automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="email-notifications">Email notifications</Label>
            <p className="text-sm text-muted-foreground">Receive notifications via email</p>
          </div>
          <Switch
            id="email-notifications"
            checked={emailNotifications}
            onCheckedChange={handleEmailNotificationsChange}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="push-notifications">Browser push notifications</Label>
            <p className="text-sm text-muted-foreground">
              {pushAvailable
                ? 'Alerts when the tab is closed or in the background (requires permission).'
                : !user
                  ? 'Sign in to enable push.'
                  : !vapidConfigured
                    ? 'Not configured: set VITE_VAPID_PUBLIC_KEY and run the DB migration.'
                    : 'Web push is not available in this browser.'}
            </p>
          </div>
          <Switch
            id="push-notifications"
            checked={pushNotifications}
            disabled={!pushAvailable || pushBusy}
            onCheckedChange={handlePushNotificationsChange}
          />
        </div>
      </CardContent>
    </Card>
  );
};
