import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Wallet, Calendar, Circle, ArrowUpRight, Check, X, Clock, FileText, DollarSign, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RentRemindersSettings } from '@/components/rent/RentRemindersSettings';
import { RentReminders } from '@/components/rent/RentReminders';

interface RentPayment {
  id: string;
  propertyName: string;
  tenant: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  paymentDate?: string;
}

export default function Rent() {
  const [rentPayments, setRentPayments] = useState<RentPayment[]>([
    { id: '1', propertyName: '123 Main St, Apt 4B', tenant: 'John Smith', amount: 1200, currency: 'USD', dueDate: '2023-05-01', status: 'paid', paymentDate: '2023-05-01' },
    { id: '2', propertyName: '456 Oak Ave, Unit 7', tenant: 'Emily Johnson', amount: 1500, currency: 'USD', dueDate: '2023-05-01', status: 'paid', paymentDate: '2023-04-29' },
    { id: '3', propertyName: '789 Pine Rd', tenant: 'Michael Brown', amount: 1800, currency: 'USD', dueDate: '2023-05-01', status: 'pending' },
    { id: '4', propertyName: '234 Elm St, Suite 12', tenant: 'Sarah Davis', amount: 1350, currency: 'USD', dueDate: '2023-05-01', status: 'overdue' },
    { id: '5', propertyName: '567 Maple Lane', tenant: 'David Wilson', amount: 2000, currency: 'USD', dueDate: '2023-05-01', status: 'paid', paymentDate: '2023-04-30' },
    { id: '6', propertyName: '101 Victoria Island', tenant: 'Chioma Okafor', amount: 550000, currency: 'NGN', dueDate: '2023-05-01', status: 'paid', paymentDate: '2023-04-28' },
    { id: '7', propertyName: '45 Lekki Phase 1', tenant: 'Oluwaseun Adeyemi', amount: 780000, currency: 'NGN', dueDate: '2023-05-01', status: 'pending' },
  ]);

  const [propertyFilter, setPropertyFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all-statuses');
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({
    propertyName: '',
    tenant: '',
    amount: '',
    currency: 'USD',
    dueDate: '',
  });
  const [activeTab, setActiveTab] = useState('payments');

  // Calculate summary statistics by currency
  const usdPayments = rentPayments.filter(payment => payment.currency === 'USD');
  const ngnPayments = rentPayments.filter(payment => payment.currency === 'NGN');
  
  const totalUsdRent = usdPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const paidUsdRent = usdPayments.filter(payment => payment.status === 'paid').reduce((sum, payment) => sum + payment.amount, 0);
  const pendingUsdRent = usdPayments.filter(payment => payment.status === 'pending').reduce((sum, payment) => sum + payment.amount, 0);
  const overdueUsdRent = usdPayments.filter(payment => payment.status === 'overdue').reduce((sum, payment) => sum + payment.amount, 0);
  
  const totalNgnRent = ngnPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const paidNgnRent = ngnPayments.filter(payment => payment.status === 'paid').reduce((sum, payment) => sum + payment.amount, 0);
  const pendingNgnRent = ngnPayments.filter(payment => payment.status === 'pending').reduce((sum, payment) => sum + payment.amount, 0);
  const overdueNgnRent = ngnPayments.filter(payment => payment.status === 'overdue').reduce((sum, payment) => sum + payment.amount, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'overdue':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getBadgeColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'pending':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-100';
      case 'overdue':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      default:
        return '';
    }
  };

  const getCurrencySymbol = (currency: string) => {
    return currency === 'NGN' ? '₦' : '$';
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${getCurrencySymbol(currency)}${amount.toLocaleString()}`;
  };

  const filteredPayments = rentPayments.filter(payment => {
    return (
      (propertyFilter === '' || payment.propertyName.includes(propertyFilter)) &&
      (statusFilter === 'all-statuses' || payment.status === statusFilter)
    );
  });

  const handleAddPayment = () => {
    if (!newPayment.propertyName || !newPayment.tenant || !newPayment.amount || !newPayment.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const payment: RentPayment = {
      id: (rentPayments.length + 1).toString(),
      propertyName: newPayment.propertyName,
      tenant: newPayment.tenant,
      amount: parseFloat(newPayment.amount),
      currency: newPayment.currency,
      dueDate: newPayment.dueDate,
      status: 'pending',
    };

    setRentPayments([...rentPayments, payment]);
    setIsAddPaymentOpen(false);
    toast.success('Rent payment added successfully');
    setNewPayment({
      propertyName: '',
      tenant: '',
      amount: '',
      currency: 'USD',
      dueDate: '',
    });
  };

  const handleMarkAsPaid = (id: string) => {
    const updatedPayments = rentPayments.map(payment => {
      if (payment.id === id) {
        return {
          ...payment,
          status: 'paid',
          paymentDate: new Date().toISOString().split('T')[0]
        } as RentPayment;
      }
      return payment;
    });
    setRentPayments(updatedPayments);
    toast.success('Payment marked as paid');
  };

  return (
    <PageLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight">Rent Management</h1>
            <div className="flex gap-2 self-end md:self-auto">
              <Button onClick={() => setIsAddPaymentOpen(true)}>
                Add Rent Payment
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="payments">
                Payments
              </TabsTrigger>
              <TabsTrigger value="reminders">
                <Bell className="h-4 w-4 mr-2" /> Reminders
              </TabsTrigger>
              <TabsTrigger value="settings">
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="payments" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">USD Rent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">${totalUsdRent.toLocaleString()}</div>
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-1 text-xs">
                      <div className="flex items-center text-green-500">
                        <Check className="h-3 w-3 mr-1" /> ${paidUsdRent.toLocaleString()}
                      </div>
                      <div className="flex items-center text-amber-500">
                        <Clock className="h-3 w-3 mr-1" /> ${pendingUsdRent.toLocaleString()}
                      </div>
                      <div className="flex items-center text-red-500">
                        <X className="h-3 w-3 mr-1" /> ${overdueUsdRent.toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Naira (₦) Rent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">₦{totalNgnRent.toLocaleString()}</div>
                      <Wallet className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-1 text-xs">
                      <div className="flex items-center text-green-500">
                        <Check className="h-3 w-3 mr-1" /> ₦{paidNgnRent.toLocaleString()}
                      </div>
                      <div className="flex items-center text-amber-500">
                        <Clock className="h-3 w-3 mr-1" /> ₦{pendingNgnRent.toLocaleString()}
                      </div>
                      <div className="flex items-center text-red-500">
                        <X className="h-3 w-3 mr-1" /> ₦{overdueNgnRent.toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Paid</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-green-600">
                        ${paidUsdRent.toLocaleString()} / ₦{paidNgnRent.toLocaleString()}
                      </div>
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Pending/Overdue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-amber-600">
                        ${(pendingUsdRent + overdueUsdRent).toLocaleString()} / ₦{(pendingNgnRent + overdueNgnRent).toLocaleString()}
                      </div>
                      <Clock className="h-5 w-5 text-amber-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="w-full md:w-1/3">
                  <Input
                    placeholder="Filter by property..."
                    value={propertyFilter}
                    onChange={(e) => setPropertyFilter(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="w-full md:w-1/3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-statuses">All Statuses</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Rent Payments</CardTitle>
                  <CardDescription>Manage and track all property rent payments</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.propertyName}</TableCell>
                          <TableCell>{payment.tenant}</TableCell>
                          <TableCell>{formatAmount(payment.amount, payment.currency)}</TableCell>
                          <TableCell>{payment.dueDate}</TableCell>
                          <TableCell>
                            <Badge className={`flex items-center gap-1 ${getBadgeColor(payment.status)}`} variant="outline">
                              {getStatusIcon(payment.status)}
                              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>{payment.paymentDate || '-'}</TableCell>
                          <TableCell>
                            {payment.status !== 'paid' && (
                              <Button size="sm" variant="outline" onClick={() => handleMarkAsPaid(payment.id)}>
                                Mark as Paid
                              </Button>
                            )}
                            {payment.status === 'paid' && (
                              <Button size="sm" variant="outline">
                                <FileText className="h-4 w-4 mr-1" /> Receipt
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {filteredPayments.length === 0 && (
                    <div className="text-center py-10">
                      <p className="text-muted-foreground">No rent payments found matching your criteria.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reminders">
              <RentReminders />
            </TabsContent>

            <TabsContent value="settings">
              <RentRemindersSettings />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Rent Payment</DialogTitle>
            <DialogDescription>
              Create a new rent payment record for a property.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="property-name" className="text-right">
                Property
              </Label>
              <Input
                id="property-name"
                value={newPayment.propertyName}
                onChange={(e) => setNewPayment({...newPayment, propertyName: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tenant-name" className="text-right">
                Tenant
              </Label>
              <Input
                id="tenant-name"
                value={newPayment.tenant}
                onChange={(e) => setNewPayment({...newPayment, tenant: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currency" className="text-right">
                Currency
              </Label>
              <RadioGroup
                value={newPayment.currency}
                onValueChange={(value) => setNewPayment({...newPayment, currency: value})}
                className="flex flex-row gap-6 col-span-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="USD" id="usd" />
                  <Label htmlFor="usd" className="cursor-pointer">USD ($)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="NGN" id="ngn" />
                  <Label htmlFor="ngn" className="cursor-pointer">Naira (₦)</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <div className="col-span-3 relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  {newPayment.currency === 'USD' ? '$' : '₦'}
                </div>
                <Input
                  id="amount"
                  type="number"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="due-date" className="text-right">
                Due Date
              </Label>
              <Input
                id="due-date"
                type="date"
                value={newPayment.dueDate}
                onChange={(e) => setNewPayment({...newPayment, dueDate: e.target.value})}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAddPaymentOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleAddPayment}>Add Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
