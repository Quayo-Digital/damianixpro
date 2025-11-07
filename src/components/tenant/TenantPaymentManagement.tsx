import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Calendar, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  DollarSign,
  TrendingUp,
  FileText,
  Search,
  Filter,
  Eye,
  Smartphone,
  Building2
} from 'lucide-react';
import { useEnhancedTenantData } from '@/hooks/useEnhancedTenantData';
import { PaymentInterface } from './PaymentInterface';

// Nigerian currency formatter
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function TenantPaymentManagement() {
  const { payments, stats, analytics, lease, loading, error } = useEnhancedTenantData();
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [makePaymentOpen, setMakePaymentOpen] = useState(false);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats || !analytics) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Error loading payment data</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredPayments = payments.filter(payment => {
    const matchesFilter = paymentFilter === 'all' || payment.payment_status === paymentFilter;
    const matchesSearch = payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.reference_number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const nextPaymentDate = new Date(stats.nextPaymentDue);
  const daysUntilPayment = Math.ceil((nextPaymentDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isPaymentDueSoon = daysUntilPayment <= 5;

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'bank_transfer': return <Building2 className="h-4 w-4" />;
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'mobile_money': return <Smartphone className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Payment Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className={isPaymentDueSoon ? 'border-orange-200 bg-orange-50' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Next Payment</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.nextPaymentAmount)}
                </p>
                <p className={`text-sm ${isPaymentDueSoon ? 'text-orange-600' : 'text-gray-500'}`}>
                  Due {nextPaymentDate.toLocaleDateString('en-NG')}
                </p>
              </div>
              <div className={`p-3 rounded-full ${isPaymentDueSoon ? 'bg-orange-100' : 'bg-blue-100'}`}>
                <Calendar className={`h-6 w-6 ${isPaymentDueSoon ? 'text-orange-600' : 'text-blue-600'}`} />
              </div>
            </div>
            <Button 
              className="w-full mt-4" 
              onClick={() => setMakePaymentOpen(true)}
              variant={isPaymentDueSoon ? "default" : "outline"}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Make Payment
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Payment Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.onTimePaymentRate.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500">On-time payments</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <Progress value={stats.onTimePaymentRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Paid (YTD)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalAmountPaid)}
                </p>
                <p className="text-sm text-gray-500">{stats.totalPayments} payments</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Analytics */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Analytics</CardTitle>
            <CardDescription>Your payment history and trends</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
                <TabsTrigger value="methods">Methods</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {formatCurrency(analytics.paymentHistory.paymentTrends.averageMonthlyPayment)}
                    </div>
                    <p className="text-xs text-gray-600">Avg Monthly Payment</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {analytics.paymentHistory.paymentTrends.paymentConsistency.toFixed(1)}%
                    </div>
                    <p className="text-xs text-gray-600">Payment Consistency</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {formatCurrency(analytics.paymentHistory.paymentTrends.totalPaidYTD)}
                    </div>
                    <p className="text-xs text-gray-600">Total Paid YTD</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 mb-1">
                      {formatCurrency(stats.totalLateFees)}
                    </div>
                    <p className="text-xs text-gray-600">Late Fees Paid</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="trends" className="space-y-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Monthly Payment History</h4>
                  <div className="space-y-2">
                    {analytics.paymentHistory.monthlyPayments.map((payment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Badge variant={payment.onTime ? 'default' : 'destructive'}>
                            {payment.month}
                          </Badge>
                          <span className="text-sm">
                            {payment.onTime ? 'On Time' : 'Late'}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(payment.amount)}</div>
                          {payment.lateFee > 0 && (
                            <div className="text-sm text-red-600">+{formatCurrency(payment.lateFee)} late fee</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="methods" className="space-y-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Preferred Payment Method</h4>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {getPaymentMethodIcon(analytics.paymentHistory.paymentTrends.preferredPaymentMethod)}
                      <span className="font-medium capitalize">
                        {analytics.paymentHistory.paymentTrends.preferredPaymentMethod.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Most frequently used payment method
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Payment History</span>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {new Date(payment.payment_date).toLocaleDateString('en-NG')}
                      </div>
                      <div className="text-sm text-gray-500">
                        Due: {new Date(payment.due_date).toLocaleDateString('en-NG')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{payment.description}</div>
                      <div className="text-sm text-gray-500">{payment.reference_number}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getPaymentMethodIcon(payment.payment_method)}
                      <span className="capitalize">
                        {payment.payment_method.replace('_', ' ')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{formatCurrency(payment.amount)}</div>
                      {payment.late_fee_applied > 0 && (
                        <div className="text-sm text-red-600">
                          +{formatCurrency(payment.late_fee_applied)} late fee
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPaymentStatusColor(payment.payment_status)}>
                      {payment.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPayment(payment)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {payment.receipt_url && (
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredPayments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No payments found matching your criteria
            </div>
          )}
        </CardContent>
      </Card>

      {/* Make Payment Dialog */}
      <Dialog open={makePaymentOpen} onOpenChange={setMakePaymentOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
            <DialogDescription>
              Complete your payment securely using multiple payment options
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <PaymentInterface 
              onPaymentComplete={(paymentId) => {
                console.log('Payment completed:', paymentId);
                setMakePaymentOpen(false);
                // Optionally refresh payment data here
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Detail Dialog */}
      {selectedPayment && (
        <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Payment Details</DialogTitle>
              <DialogDescription>
                Reference: {selectedPayment.reference_number}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Payment Date</Label>
                  <p className="font-medium">
                    {new Date(selectedPayment.payment_date).toLocaleDateString('en-NG')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Due Date</Label>
                  <p className="font-medium">
                    {new Date(selectedPayment.due_date).toLocaleDateString('en-NG')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Amount</Label>
                  <p className="font-medium">{formatCurrency(selectedPayment.amount)}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Method</Label>
                  <p className="font-medium capitalize">
                    {selectedPayment.payment_method.replace('_', ' ')}
                  </p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm text-gray-600">Description</Label>
                <p className="font-medium">{selectedPayment.description}</p>
              </div>
              
              {selectedPayment.late_fee_applied > 0 && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-800">
                    Late fee applied: {formatCurrency(selectedPayment.late_fee_applied)}
                  </p>
                </div>
              )}
              
              <div className="flex space-x-2">
                {selectedPayment.receipt_url && (
                  <Button variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download Receipt
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedPayment(null)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
