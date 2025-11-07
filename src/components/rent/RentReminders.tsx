
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Mail, Clock } from "lucide-react";
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
  
  // Sample reminder data - in a real app, this would come from an API
  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: '1',
      tenantName: 'John Smith',
      propertyName: '123 Main St, Apt 4B',
      dueDate: '2023-06-01',
      amount: 1200,
      currency: 'USD',
      reminderDate: '2023-05-29', // 3 days before
      status: 'scheduled'
    },
    {
      id: '2',
      tenantName: 'Emily Johnson',
      propertyName: '456 Oak Ave, Unit 7',
      dueDate: '2023-06-01',
      amount: 1500,
      currency: 'USD',
      reminderDate: '2023-05-29',
      status: 'scheduled'
    },
    {
      id: '3',
      tenantName: 'Chioma Okafor',
      propertyName: '101 Victoria Island',
      dueDate: '2023-06-01',
      amount: 550000,
      currency: 'NGN',
      reminderDate: '2023-05-29',
      status: 'scheduled'
    },
    {
      id: '4',
      tenantName: 'Michael Brown',
      propertyName: '789 Pine Rd',
      dueDate: '2023-05-20',
      amount: 1800,
      currency: 'USD',
      reminderDate: '2023-05-17',
      status: 'sent'
    },
  ]);

  const formatCurrency = (amount: number, currency: string) => {
    const currencySymbol = currency === 'USD' ? '$' : '₦';
    return `${currencySymbol}${amount.toLocaleString()}`;
  };

  const handleSendNow = (id: string) => {
    // Update the reminder status
    setReminders(reminders.map(reminder => 
      reminder.id === id ? { ...reminder, status: 'sent' as const } : reminder
    ));
    
    toast({
      title: "Reminder sent",
      description: "The rent reminder has been sent successfully.",
    });
  };

  const handleSendAll = () => {
    // Send all scheduled reminders
    setReminders(reminders.map(reminder => 
      reminder.status === 'scheduled' ? { ...reminder, status: 'sent' as const } : reminder
    ));
    
    toast({
      title: "All reminders sent",
      description: "All scheduled rent reminders have been sent successfully.",
    });
  };

  // Group reminders by status
  const scheduledReminders = reminders.filter(r => r.status === 'scheduled');
  const sentReminders = reminders.filter(r => r.status === 'sent');

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Upcoming Rent Reminders
            </CardTitle>
            <CardDescription>
              Scheduled reminders for upcoming rent payments
            </CardDescription>
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
          <h3 className="font-medium text-sm">Scheduled Reminders ({scheduledReminders.length})</h3>
          {scheduledReminders.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">
              No scheduled reminders
            </p>
          ) : (
            <div className="rounded-md border overflow-hidden">
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
                          <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                          {format(new Date(reminder.reminderDate), 'MMM d, yyyy')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleSendNow(reminder.id)}>
                          <Mail className="h-4 w-4 mr-1" />
                          Send Now
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          <h3 className="font-medium text-sm pt-4">Recently Sent ({sentReminders.length})</h3>
          {sentReminders.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">
              No sent reminders
            </p>
          ) : (
            <div className="rounded-md border overflow-hidden">
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
                      <TableCell>{format(new Date(reminder.reminderDate), 'MMM d, yyyy')}</TableCell>
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
