import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Bell, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface ReminderSettings {
  enabled: boolean;
  daysBefore: number;
  reminderMethod: 'email' | 'sms' | 'both';
  reminderTemplate: string;
}

const defaultSettings: ReminderSettings = {
  enabled: true,
  daysBefore: 3,
  reminderMethod: 'email',
  reminderTemplate:
    'Your rent payment of [AMOUNT] is due on [DATE]. Please ensure your payment is made on time to avoid late fees.',
};

export function RentRemindersSettings() {
  const [settings, setSettings] = useState<ReminderSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSaveSettings = () => {
    setIsSaving(true);
    // Simulate API call to save settings
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: 'Settings saved',
        description: 'Rent reminder settings have been updated successfully.',
      });
    }, 800);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="mr-2 h-5 w-5" />
          Rent Reminder Settings
        </CardTitle>
        <CardDescription>
          Configure automated reminders to notify tenants before rent is due
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Enable Automated Reminders</h3>
            <p className="text-sm text-muted-foreground">
              Send automatic reminders to tenants before rent is due
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
          />
        </div>

        {settings.enabled && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="days-before">Days Before Due Date</Label>
                <Select
                  value={settings.daysBefore.toString()}
                  onValueChange={(value) =>
                    setSettings({ ...settings, daysBefore: parseInt(value) })
                  }
                >
                  <SelectTrigger id="days-before">
                    <SelectValue placeholder="Select days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day before</SelectItem>
                    <SelectItem value="2">2 days before</SelectItem>
                    <SelectItem value="3">3 days before</SelectItem>
                    <SelectItem value="5">5 days before</SelectItem>
                    <SelectItem value="7">7 days before</SelectItem>
                    <SelectItem value="10">10 days before</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminder-method">Reminder Method</Label>
                <Select
                  value={settings.reminderMethod}
                  onValueChange={(value) =>
                    setSettings({
                      ...settings,
                      reminderMethod: value as 'email' | 'sms' | 'both',
                    })
                  }
                >
                  <SelectTrigger id="reminder-method">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email only</SelectItem>
                    <SelectItem value="sms">SMS only</SelectItem>
                    <SelectItem value="both">Email and SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminder-template">Reminder Template</Label>
              <div className="space-y-1">
                <Textarea
                  id="reminder-template"
                  value={settings.reminderTemplate}
                  onChange={(e) => setSettings({ ...settings, reminderTemplate: e.target.value })}
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground">
                  Use [AMOUNT], [DATE], and [TENANT] placeholders that will be replaced with actual
                  values
                </p>
              </div>
            </div>

            <div className="rounded-md bg-muted p-3 text-sm">
              <div className="flex">
                <AlertCircle className="mr-2 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Preview</p>
                  <p className="mt-1 text-muted-foreground">
                    {settings.reminderTemplate
                      .replace('[AMOUNT]', '$1,200.00')
                      .replace('[DATE]', '1st May 2023')
                      .replace('[TENANT]', 'John Smith')}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveSettings} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardFooter>
    </Card>
  );
}
