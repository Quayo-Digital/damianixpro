import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  DollarSign, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Plus, 
  Download, 
  Receipt, 
  TrendingUp,
  PieChart,
  Calculator
} from 'lucide-react';
import { SalesTransaction, SalesPayment } from '@/services/property/types';

interface SalesPaymentSystemProps {
  userRole: 'admin' | 'owner' | 'agent';
  userId?: string;
}

interface PaymentMetrics {
  totalRevenue: number;
  pendingPayments: number;
  overduePayments: number;
  completedTransactions: number;
  commissionEarned: number;
  platformFees: number;
  monthlyRevenue: number;
}

export const SalesPaymentSystem: React.FC<SalesPaymentSystemProps> = ({ userRole, userId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [paymentMetrics, setPaymentMetrics] = useState<PaymentMetrics | null>(null);
  const [salesTransactions, setSalesTransactions] = useState<SalesTransaction[]>([]);
  const [salesPayments, setSalesPayments] = useState<SalesPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentData();
  }, [userId, userRole]);

  const loadPaymentData = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API calls
      const metrics: PaymentMetrics = {
        totalRevenue: 2450000000,
        pendingPayments: 45000000,
        overduePayments: 8500000,
        completedTransactions: 156,
        commissionEarned: 61250000,
        platformFees: 24500000,
        monthlyRevenue: 380000000
      };
      setPaymentMetrics(metrics);

      const transactions: SalesTransaction[] = [
        {
          id: '1',
          property_id: 'prop1',
          buyer_id: 'buyer1',
          seller_id: 'seller1',
          agent_id: 'agent1',
          transaction_type: 'SALE',
          sale_price: 25000000,
          down_payment: 7500000,
          payment_method: 'INSTALLMENT',
          agent_commission_amount: 625000,
          platform_fee_amount: 250000,
          status: 'PAYMENT_PARTIAL',
          created_at: '2025-08-01T10:00:00Z',
          property: {
            id: 'prop1',
            name: '4BR Duplex - Lekki',
            address: 'Lekki Phase 1, Lagos',
            transaction_type: 'SALE',
            property_category: 'RESIDENTIAL',
            price: '25000000',
            location: 'Lagos'
          },
          buyer: {
            id: 'buyer1',
            first_name: 'Michael',
            last_name: 'Adebayo',
            email: 'michael@example.com',
            status: 'QUALIFIED'
          }
        }
      ];
      setSalesTransactions(transactions);

      const payments: SalesPayment[] = [
        {
          id: '1',
          sales_transaction_id: '1',
          payment_number: 1,
          amount: 7500000,
          due_date: '2025-08-01',
          payment_date: '2025-08-01',
          payment_method: 'BANK_TRANSFER',
          reference_number: 'TXN001234567',
          status: 'PAID',
          created_at: '2025-08-01T10:00:00Z'
        },
        {
          id: '2',
          sales_transaction_id: '1',
          payment_number: 2,
          amount: 4375000,
          due_date: '2025-10-01',
          status: 'PENDING',
          created_at: '2025-08-01T10:00:00Z'
        }
      ];
      setSalesPayments(payments);
    } catch (error) {
      console.error('Error loading payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getPaymentStatusBadge = (status: SalesPayment['status']) => {
    const statusConfig = {
      'PENDING': { variant: 'secondary' as const, icon: <Clock className="h-3 w-3" /> },
      'PAID': { variant: 'default' as const, icon: <CheckCircle className="h-3 w-3" /> },
      'OVERDUE': { variant: 'destructive' as const, icon: <AlertCircle className="h-3 w-3" /> },
      'PARTIAL': { variant: 'destructive' as const, icon: <AlertCircle className="h-3 w-3" /> },
      'CANCELLED': { variant: 'destructive' as const, icon: <AlertCircle className="h-3 w-3" /> }
    };

    const config = statusConfig[status];
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status}
      </Badge>
    );
  };

  const getTransactionProgress = (transaction: SalesTransaction) => {
    const payments = salesPayments.filter(p => p.sales_transaction_id === transaction.id);
    const totalPaid = payments.reduce((sum, p) => sum + (p.status === 'PAID' ? p.amount : 0), 0);
    return (totalPaid / transaction.sale_price) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading payment system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sales Payment System</h2>
          <p className="text-gray-600">Manage sales transactions, payments, and commissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Payment Metrics */}
      {paymentMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(paymentMetrics.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                +{formatCurrency(paymentMetrics.monthlyRevenue)} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(paymentMetrics.pendingPayments)}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(paymentMetrics.overduePayments)} overdue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commission Earned</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(paymentMetrics.commissionEarned)}</div>
              <p className="text-xs text-muted-foreground">Agent commissions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(paymentMetrics.platformFees)}</div>
              <p className="text-xs text-muted-foreground">
                {paymentMetrics.completedTransactions} transactions
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest sales transactions and payment status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {salesTransactions.slice(0, 5).map((transaction) => {
                    const progress = getTransactionProgress(transaction);
                    return (
                      <div key={transaction.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{transaction.property?.name}</h4>
                            <p className="text-sm text-gray-600">{transaction.buyer?.first_name} {transaction.buyer?.last_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(transaction.sale_price)}</p>
                            <Badge variant={transaction.status === 'PAYMENT_COMPLETE' ? 'default' : 'secondary'}>
                              {transaction.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Payment Progress</span>
                            <span>{progress.toFixed(1)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Schedule</CardTitle>
                <CardDescription>Upcoming and overdue payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {salesPayments
                    .filter(p => p.status === 'PENDING' || p.status === 'OVERDUE')
                    .slice(0, 5)
                    .map((payment) => {
                      const transaction = salesTransactions.find(t => t.id === payment.sales_transaction_id);
                      const isOverdue = new Date(payment.due_date) < new Date();
                      
                      return (
                        <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{transaction?.property?.name}</p>
                            <p className="text-sm text-gray-600">Payment #{payment.payment_number}</p>
                            <p className="text-sm text-gray-600">Due: {new Date(payment.due_date).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(payment.amount)}</p>
                            {getPaymentStatusBadge(isOverdue ? 'OVERDUE' : payment.status)}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Transactions</CardTitle>
              <CardDescription>All sales transactions and their payment status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salesTransactions.map((transaction) => {
                  const progress = getTransactionProgress(transaction);
                  const totalPaid = salesPayments
                    .filter(p => p.sales_transaction_id === transaction.id && p.status === 'PAID')
                    .reduce((sum, p) => sum + p.amount, 0);
                  
                  return (
                    <div key={transaction.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium">{transaction.property?.name}</h4>
                          <p className="text-sm text-gray-600">{transaction.property?.address}</p>
                        </div>
                        <Badge variant={transaction.status === 'PAYMENT_COMPLETE' ? 'default' : 'secondary'}>
                          {transaction.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                        <div>
                          <p className="text-gray-600">Buyer</p>
                          <p className="font-medium">{transaction.buyer?.first_name} {transaction.buyer?.last_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Sale Price</p>
                          <p className="font-medium">{formatCurrency(transaction.sale_price)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Paid Amount</p>
                          <p className="font-medium">{formatCurrency(totalPaid)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Payment Method</p>
                          <p className="font-medium">{transaction.payment_method}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Payment Progress</span>
                          <span>{progress.toFixed(1)}% ({formatCurrency(totalPaid)} / {formatCurrency(transaction.sale_price)})</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      <div className="flex justify-between items-center mt-4 pt-4 border-t">
                        <div className="text-sm text-gray-600">
                          Commission: {formatCurrency(transaction.agent_commission_amount || 0)} | 
                          Platform Fee: {formatCurrency(transaction.platform_fee_amount || 0)}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Receipt className="h-3 w-3 mr-1" />
                            Receipt
                          </Button>
                          <Button size="sm">
                            <Plus className="h-3 w-3 mr-1" />
                            Record Payment
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>All recorded payments and their details</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <Calculator className="h-4 w-4" />
                <AlertDescription>
                  Track all payments including installments, down payments, and commission distributions.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                {salesPayments.map((payment) => {
                  const transaction = salesTransactions.find(t => t.id === payment.sales_transaction_id);
                  
                  return (
                    <div key={payment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{transaction?.property?.name}</h4>
                          <p className="text-sm text-gray-600">Payment #{payment.payment_number}</p>
                        </div>
                        {getPaymentStatusBadge(payment.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Amount</p>
                          <p className="font-medium">{formatCurrency(payment.amount)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Due Date</p>
                          <p className="font-medium">{new Date(payment.due_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Payment Date</p>
                          <p className="font-medium">
                            {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Method</p>
                          <p className="font-medium">{payment.payment_method || 'N/A'}</p>
                        </div>
                      </div>

                      {payment.reference_number && (
                        <div className="mt-3 p-3 bg-gray-50 rounded">
                          <p className="text-sm">
                            <span className="font-medium">Reference:</span> {payment.reference_number}
                            {payment.bank_name && (
                              <span className="ml-4">
                                <span className="font-medium">Bank:</span> {payment.bank_name}
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Commission Tracking</CardTitle>
              <CardDescription>Agent commissions and platform fees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salesTransactions.map((transaction) => (
                  <div key={transaction.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{transaction.property?.name}</h4>
                        <p className="text-sm text-gray-600">Sale Price: {formatCurrency(transaction.sale_price)}</p>
                      </div>
                      <Badge variant="outline">
                        {transaction.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Agent Commission</p>
                        <p className="font-medium text-green-600">
                          {formatCurrency(transaction.agent_commission_amount || 0)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {transaction.agent_commission_rate}% rate
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Platform Fee</p>
                        <p className="font-medium text-blue-600">
                          {formatCurrency(transaction.platform_fee_amount || 0)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {transaction.platform_fee_rate}% rate
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Net to Seller</p>
                        <p className="font-medium">
                          {formatCurrency(
                            transaction.sale_price - 
                            (transaction.agent_commission_amount || 0) - 
                            (transaction.platform_fee_amount || 0)
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
