import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Building2,
} from 'lucide-react';
import { useEnhancedTenantData } from '@/hooks/useEnhancedTenantData';
import { annualRentNgn } from '@/utils/nigeriaRent';
import { PaymentInterface } from './PaymentInterface';
import { useTenantPrimaryPropertyId } from '@/hooks/useTenantPrimaryPropertyId';
import { toast } from 'sonner';
import {
  fetchActiveRentRecurrenceMandate,
  updateRentRecurrenceStatus,
  type RentRecurrenceMandate,
} from '@/services/resident/rentRecurrenceApi';

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
  const { payments, stats, analytics, lease, tenantRecordId, loading, error } =
    useEnhancedTenantData();
  const fallbackPropertyId = useTenantPrimaryPropertyId();
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [makePaymentOpen, setMakePaymentOpen] = useState(false);
  const [paymentModalSession, setPaymentModalSession] = useState(0);
  const [rentMandate, setRentMandate] = useState<RentRecurrenceMandate | null>(null);

  const mandatePropertyId = lease?.property_id ?? fallbackPropertyId ?? null;

  useEffect(() => {
    if (!tenantRecordId || !mandatePropertyId) {
      setRentMandate(null);
      return;
    }
    let cancelled = false;
    void fetchActiveRentRecurrenceMandate(tenantRecordId, mandatePropertyId).then((m) => {
      if (!cancelled) setRentMandate(m);
    });
    return () => {
      cancelled = true;
    };
  }, [tenantRecordId, mandatePropertyId, payments.length]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
                <div className="h-8 w-1/2 rounded bg-gray-200"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats || !analytics) {
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

  const filteredPayments = payments.filter((payment) => {
    const matchesFilter = paymentFilter === 'all' || payment.payment_status === paymentFilter;
    const matchesSearch =
      payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference_number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Calculate next payment date and days until payment
  const nextPaymentDate = stats?.nextPaymentDue ? new Date(stats.nextPaymentDue) : null;
  const daysUntilPayment = nextPaymentDate
    ? Math.ceil((nextPaymentDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const isPaymentDueSoon =
    daysUntilPayment !== null && daysUntilPayment <= 5 && daysUntilPayment >= 0;
  const hasValidPaymentDue =
    nextPaymentDate && stats?.nextPaymentAmount && stats.nextPaymentAmount > 0;

  /** Prefill: next scheduled/pending amount from stats, else annual rent from lease (Nigeria default). */
  const toPositiveNgn = (v: unknown): number | undefined => {
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n) || n <= 0) return undefined;
    return n;
  };
  const nextScheduledAmount = toPositiveNgn(stats?.nextPaymentAmount);
  const annualFromLease = lease ? toPositiveNgn(annualRentNgn(lease)) : undefined;
  const suggestedPaymentAmount = nextScheduledAmount ?? annualFromLease;

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'none':
        return <CreditCard className="h-4 w-4 opacity-50" aria-hidden />;
      case 'bank_transfer':
        return <Building2 className="h-4 w-4" />;
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'mobile_money':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          Some data could not be refreshed fully. Payments and lease details below use the latest
          information we could load.
        </div>
      )}

      {rentMandate && rentMandate.status === 'active' ? (
        <Card className="border-green-200 bg-green-50/80 dark:border-green-900 dark:bg-green-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Monthly auto-pay (Flutterwave)</CardTitle>
            <CardDescription>
              A card authorization is on file for approximately{' '}
              <strong>{formatCurrency(Number(rentMandate.amount_ngn))}</strong> per cycle. Automated
              charges still require a server or cron job calling Flutterwave — this row records
              consent and the authorization code from your last successful payment.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2 text-sm">
            {rentMandate.card_last4 ? (
              <Badge variant="secondary">Card •••• {rentMandate.card_last4}</Badge>
            ) : null}
            {rentMandate.next_charge_due_date ? (
              <Badge variant="outline">Next target: {rentMandate.next_charge_due_date}</Badge>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                const r = await updateRentRecurrenceStatus(rentMandate.id, 'paused');
                if (r.ok) {
                  toast.success('Auto-pay paused');
                  setRentMandate(null);
                } else {
                  toast.error(r.error || 'Could not pause');
                }
              }}
            >
              Pause auto-pay
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Payment Overview */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className={isPaymentDueSoon ? 'border-orange-200 bg-orange-50' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Next rent payment</p>
                <p className="text-2xl font-bold text-gray-900">
                  {hasValidPaymentDue ? formatCurrency(stats.nextPaymentAmount) : 'N/A'}
                </p>
                <p className={`text-sm ${isPaymentDueSoon ? 'text-orange-600' : 'text-gray-500'}`}>
                  {nextPaymentDate
                    ? `Due ${nextPaymentDate.toLocaleDateString('en-NG')}${daysUntilPayment !== null ? ` (${daysUntilPayment >= 0 ? daysUntilPayment : Math.abs(daysUntilPayment)} ${Math.abs(daysUntilPayment) === 1 ? 'day' : 'days'} ${daysUntilPayment < 0 ? 'overdue' : ''})` : ''}`
                    : 'No payment scheduled'}
                </p>
              </div>
              <div
                className={`rounded-full p-3 ${isPaymentDueSoon ? 'bg-orange-100' : 'bg-blue-100'}`}
              >
                <Calendar
                  className={`h-6 w-6 ${isPaymentDueSoon ? 'text-orange-600' : 'text-blue-600'}`}
                />
              </div>
            </div>
            <Button
              className="mt-4 w-full"
              onClick={() => {
                setMakePaymentOpen(true);
              }}
              variant={isPaymentDueSoon ? 'default' : 'outline'}
            >
              <CreditCard className="mr-2 h-4 w-4" />
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
              <div className="rounded-full bg-green-100 p-3">
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
              <div className="rounded-full bg-purple-100 p-3">
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
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="rounded-lg bg-blue-50 p-4 text-center">
                    <div className="mb-1 text-2xl font-bold text-blue-600">
                      {formatCurrency(analytics.paymentHistory.paymentTrends.averageMonthlyPayment)}
                    </div>
                    <p className="text-xs text-gray-600">Avg payment (per transaction)</p>
                  </div>
                  <div className="rounded-lg bg-green-50 p-4 text-center">
                    <div className="mb-1 text-2xl font-bold text-green-600">
                      {analytics.paymentHistory.paymentTrends.paymentConsistency.toFixed(1)}%
                    </div>
                    <p className="text-xs text-gray-600">Payment Consistency</p>
                  </div>
                  <div className="rounded-lg bg-purple-50 p-4 text-center">
                    <div className="mb-1 text-2xl font-bold text-purple-600">
                      {formatCurrency(analytics.paymentHistory.paymentTrends.totalPaidYTD)}
                    </div>
                    <p className="text-xs text-gray-600">Total Paid YTD</p>
                  </div>
                  <div className="rounded-lg bg-orange-50 p-4 text-center">
                    <div className="mb-1 text-2xl font-bold text-orange-600">
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
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                      >
                        <div className="flex items-center space-x-3">
                          <Badge variant={payment.onTime ? 'default' : 'destructive'}>
                            {payment.month}
                          </Badge>
                          <span className="text-sm">{payment.onTime ? 'On Time' : 'Late'}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(payment.amount)}</div>
                          {payment.lateFee > 0 && (
                            <div className="text-sm text-red-600">
                              +{formatCurrency(payment.lateFee)} late fee
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="methods" className="space-y-4">
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Preferred Payment Method</h4>
                  <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-slate-900 dark:border-blue-800/60 dark:bg-blue-950/45 dark:text-blue-50">
                    <div className="flex items-center space-x-2">
                      {getPaymentMethodIcon(
                        analytics.paymentHistory.paymentTrends.preferredPaymentMethod
                      )}
                      <span className="font-medium capitalize">
                        {analytics.paymentHistory.paymentTrends.preferredPaymentMethod === 'none'
                          ? 'No completed payments yet'
                          : analytics.paymentHistory.paymentTrends.preferredPaymentMethod.replace(
                              '_',
                              ' '
                            )}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-blue-200/90">
                      {analytics.paymentHistory.paymentTrends.preferredPaymentMethod === 'none'
                        ? 'Your most-used method appears after you have completed payment history.'
                        : 'Most frequently used among your completed payments.'}
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
                <Label htmlFor="payment-search" className="sr-only">
                  Search payments
                </Label>
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  id="payment-search"
                  name="paymentSearch"
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-10"
                />
              </div>
              <Label htmlFor="payment-filter" className="sr-only">
                Filter payments by status
              </Label>
              <Select name="paymentFilter" value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger id="payment-filter" className="w-32" aria-label="Filter payments">
                  <Filter className="mr-2 h-4 w-4" />
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
                      <span className="capitalize">{payment.payment_method.replace('_', ' ')}</span>
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
            <div className="py-8 text-center text-gray-500">
              No payments found matching your criteria
            </div>
          )}
        </CardContent>
      </Card>

      {/* Make Payment Dialog */}
      <Dialog
        open={makePaymentOpen}
        onOpenChange={(open) => {
          setMakePaymentOpen(open);
          // Remount PaymentInterface once per open so amount prefill runs with fresh lease/stats.
          if (open) setPaymentModalSession((s) => s + 1);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
            <DialogDescription asChild>
              <div className="text-left text-sm text-muted-foreground">
                {lease?.property_title ? (
                  <>
                    <span className="font-medium text-foreground">{lease.property_title}</span>
                    <span className="block pt-1">
                      Complete your payment securely. Details below match your current lease.
                    </span>
                  </>
                ) : (
                  <span>Complete your payment securely using your chosen method.</span>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {makePaymentOpen && (
              <PaymentInterface
                key={paymentModalSession}
                tenantId={tenantRecordId ?? undefined}
                propertyId={lease?.property_id}
                lease={lease}
                defaultAmount={suggestedPaymentAmount}
                nextPaymentDueIso={stats?.nextPaymentDue ?? null}
                onPaymentComplete={() => {
                  setMakePaymentOpen(false);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Detail Dialog */}
      {selectedPayment && (
        <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Payment Details</DialogTitle>
              <DialogDescription>Reference: {selectedPayment.reference_number}</DialogDescription>
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
                <div className="rounded-lg bg-red-50 p-3">
                  <p className="text-sm text-red-800">
                    Late fee applied: {formatCurrency(selectedPayment.late_fee_applied)}
                  </p>
                </div>
              )}

              <div className="flex space-x-2">
                {selectedPayment.receipt_url && (
                  <Button variant="outline" className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
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
