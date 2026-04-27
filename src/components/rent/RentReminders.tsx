import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Mail, Clock } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Reminder {
  id: string;
  tenantName: string;
  propertyName: string;
  dueDate: string;
  amount: number;
  currency: string;
  reminderDate: string;
  status: 'scheduled' | 'sent' | 'failed';
}

export function RentReminders() {
  const { toast } = useToast();

  const [reminders, setReminders] = useState<Reminder[]>([]);

  const formatCurrency = (amount: number, currency: string) => {
    const currencySymbol = currency === 'USD' ? '$' : '₦';
    return `${currencySymbol}${amount.toLocaleString()}`;
  };

  const handleSendNow = (id: string) => {
    // Update the reminder status
    setReminders(
      reminders.map((reminder) =>
        reminder.id === id ? { ...reminder, status: 'sent' as const } : reminder
      )
    );

    toast({
      title: 'Reminder sent',
      description: 'The rent reminder has been sent successfully.',
    });
  };

  const handleSendAll = () => {
    // Send all scheduled reminders
    setReminders(
      reminders.map((reminder) =>
        reminder.status === 'scheduled' ? { ...reminder, status: 'sent' as const } : reminder
      )
    );

    toast({
      title: 'All reminders sent',
      description: 'All scheduled rent reminders have been sent successfully.',
    });
  };

  // Group reminders by status
  const scheduledReminders = reminders.filter((r) => r.status === 'scheduled');
  const sentReminders = reminders.filter((r) => r.status === 'sent');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Upcoming Rent Reminders
            </CardTitle>
            <CardDescription>Scheduled reminders for upcoming rent payments</CardDescription>
          </div>
          {scheduledReminders.length > 0 && (
            <Button onClick={handleSendAll} size="sm">
              Send All Reminders
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Scheduled Reminders ({scheduledReminders.length})</h3>
          {scheduledReminders.length === 0 ? (
            <p className="py-4 text-center text-muted-foreground">No scheduled reminders</p>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reminder Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduledReminders.map((reminder) => (
                    <TableRow key={reminder.id}>
                      <TableCell className="font-medium">{reminder.tenantName}</TableCell>
                      <TableCell>{reminder.propertyName}</TableCell>
                      <TableCell>{format(new Date(reminder.dueDate), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{formatCurrency(reminder.amount, reminder.currency)}</TableCell>
                      <TableCell>
                        <span className="flex items-center">
                          <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                          {format(new Date(reminder.reminderDate), 'MMM d, yyyy')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendNow(reminder.id)}
                        >
                          <Mail className="mr-1 h-4 w-4" />
                          Send Now
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <h3 className="pt-4 text-sm font-medium">Recently Sent ({sentReminders.length})</h3>
          {sentReminders.length === 0 ? (
            <p className="py-4 text-center text-muted-foreground">No sent reminders</p>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Sent Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sentReminders.map((reminder) => (
                    <TableRow key={reminder.id}>
                      <TableCell className="font-medium">{reminder.tenantName}</TableCell>
                      <TableCell>{reminder.propertyName}</TableCell>
                      <TableCell>{format(new Date(reminder.dueDate), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{formatCurrency(reminder.amount, reminder.currency)}</TableCell>
                      <TableCell>
                        {format(new Date(reminder.reminderDate), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          Sent
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
