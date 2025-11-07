
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from '@/hooks/use-toast';

export const NotificationSettings = () => {
  const [emailNotifications, setEmailNotifications] = useState(
    localStorage.getItem('email-notifications') !== 'false'
  );
  const [pushNotifications, setPushNotifications] = useState(
    localStorage.getItem('push-notifications') === 'true'
  );
  
  const handleEmailNotificationsChange = (checked: boolean) => {
    setEmailNotifications(checked);
    localStorage.setItem('email-notifications', checked.toString());
    toast({
      title: "Notification preferences updated",
      description: `Email notifications ${checked ? 'enabled' : 'disabled'}.`,
    });
  };

  const handlePushNotificationsChange = (checked: boolean) => {
    setPushNotifications(checked);
    localStorage.setItem('push-notifications', checked.toString());
    toast({
      title: "Notification preferences updated",
      description: `Push notifications ${checked ? 'enabled' : 'disabled'}.`,
    });
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
            <p className="text-sm text-muted-foreground">
              Receive notifications via email
            </p>
          </div>
          <Switch 
            id="email-notifications" 
            checked={emailNotifications}
            onCheckedChange={handleEmailNotificationsChange}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="push-notifications">Push notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive push notifications
            </p>
          </div>
          <Switch 
            id="push-notifications" 
            checked={pushNotifications}
            onCheckedChange={handlePushNotificationsChange}
          />
        </div>
      </CardContent>
    </Card>
  );
};
