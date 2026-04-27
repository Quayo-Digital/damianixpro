import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/sonner';
import { usePaymentProcessing } from '@/hooks/usePaymentProcessing';
import { PaymentCategory } from '@/utils/PaymentTypes';
import {
  CreditCard,
  Building2,
  Smartphone,
  Receipt,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Info,
} from 'lucide-react';
import type { TenantLease } from '@/hooks/useEnhancedTenantData';
import { annualRentNgn } from '@/utils/nigeriaRent';
import { supabase } from '@/integrations/supabase/client';
import { annualRentNgnFromPropertyRow } from '@/services/property/utils';
import { formatTenantLeaseStatusLabel } from '@/services/leases/tenantLeasePresentation';

const formatNgn = (amount: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

interface PaymentInterfaceProps {
  tenantId?: string;
  propertyId?: string;
  /** Active lease + property; shown at top so the tenant knows what they are paying for. */
  lease?: TenantLease | null;
  /** When lease/scheduling data is available, pre-fill amount (NGN). Prefer annual rent (Nigeria default). */
  defaultAmount?: number;
  /** Next payment due date (ISO), e.g. from stats — shown next to lease rent when helpful. */
  nextPaymentDueIso?: string | null;
  onPaymentComplete?: (paymentId: string) => void;
}

export const PaymentInterface: React.FC<PaymentInterfaceProps> = ({
  tenantId,
  propertyId,
  lease,
  defaultAmount,
  nextPaymentDueIso,
  onPaymentComplete,
}) => {
  const {
    processPaymentWithMethod,
    verifyPayment,
    loadPaymentData,
    isLoading,
    paymentHistory,
    pendingPayments,
  } = usePaymentProcessing();

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    category: 'rent' as PaymentCategory,
    description: '',
    paymentMethod: 'flutterwave' as 'paystack' | 'flutterwave' | 'bank_transfer' | 'ussd',
  });

  const [showBankDetails, setShowBankDetails] = useState(false);
  const [showUSSDCodes, setShowUSSDCodes] = useState(false);
  const [saveCardForRecurring, setSaveCardForRecurring] = useState(false);
  /** When lease row omits rent but `properties` has lease_price / form_meta rent */
  const [propertyAnnualNgn, setPropertyAnnualNgn] = useState<number | null>(null);

  useEffect(() => {
    loadPaymentData();
  }, [loadPaymentData]);

  useEffect(() => {
    if (!propertyId) {
      setPropertyAnnualNgn(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('lease_price, monthly_rent, shortlet_details')
        .eq('id', propertyId)
        .maybeSingle();
      if (cancelled || error || !data) {
        if (!cancelled && error) console.warn('[PaymentInterface] property rent lookup:', error);
        if (!cancelled) setPropertyAnnualNgn(null);
        return;
      }
      const annual = annualRentNgnFromPropertyRow(data as Record<string, unknown>);
      if (!cancelled) setPropertyAnnualNgn(annual > 0 ? annual : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  useEffect(() => {
    const fromLease =
      lease && annualRentNgn(lease) > 0 && Number.isFinite(annualRentNgn(lease))
        ? annualRentNgn(lease)
        : null;
    const fromProperty =
      propertyAnnualNgn != null && propertyAnnualNgn > 0 ? propertyAnnualNgn : null;
    const fromScheduled =
      defaultAmount != null && Number.isFinite(Number(defaultAmount)) && Number(defaultAmount) > 0
        ? Number(defaultAmount)
        : null;
    // Prefer agreed lease/property annual rent over a scheduled line item (often partial or placeholder).
    const n = fromLease ?? fromProperty ?? fromScheduled;
    if (n != null && n > 0) {
      const rounded = Math.round(n * 100) / 100;
      setPaymentForm((prev) => ({ ...prev, amount: String(rounded) }));
    }
  }, [defaultAmount, lease?.id, lease?.monthly_rent, lease?.lease_price, propertyAnnualNgn]);

  const parsedAmount = parseFloat(paymentForm.amount);
  const amountValid =
    paymentForm.amount !== '' &&
    !Number.isNaN(parsedAmount) &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0;

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amountValid) {
      toast.error('Enter a valid amount', {
        description: 'Please enter an amount greater than zero (₦) before paying.',
      });
      return;
    }

    const amount = parsedAmount;

    try {
      await processPaymentWithMethod(
        amount,
        paymentForm.category,
        paymentForm.description || `${paymentForm.category} payment`,
        paymentForm.paymentMethod,
        tenantId,
        propertyId,
        {
          recurringOptIn:
            paymentForm.paymentMethod === 'flutterwave' && saveCardForRecurring === true,
        }
      );

      // Show additional UI for bank transfer or USSD
      if (paymentForm.paymentMethod === 'bank_transfer') {
        setShowBankDetails(true);
      } else if (paymentForm.paymentMethod === 'ussd') {
        setShowUSSDCodes(true);
      }

      // Reset form
      setPaymentForm({
        amount: '',
        category: 'rent',
        description: '',
        paymentMethod: 'flutterwave',
      });
      setSaveCardForRecurring(false);

      if (onPaymentComplete) {
        onPaymentComplete('payment-initiated');
      }
    } catch (error) {
      console.error('Payment submission error:', error);
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'paystack':
      case 'flutterwave':
        return <CreditCard className="h-4 w-4" />;
      case 'bank_transfer':
        return <Building2 className="h-4 w-4" />;
      case 'ussd':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
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

  const bankDetails = {
    accountName: 'Damianix Systems Limited',
    accountNumber: '0123456789',
    bankName: 'First Bank of Nigeria',
    sortCode: '011151003',
  };

  const ussdCodes = {
    GTBank: '*737*1*Amount*Reference#',
    'Access Bank': '*901*0*Amount*Reference#',
    'First Bank': '*894*0*Amount*Reference#',
    UBA: '*919*0*Amount*Reference#',
    'Zenith Bank': '*966*0*Amount*Reference#',
    'Fidelity Bank': '*770*0*Amount*Reference#',
  };

  const nextDueLabel = nextPaymentDueIso
    ? new Date(nextPaymentDueIso).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div className="space-y-6">
      {lease ? (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex gap-3">
            <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <p className="font-semibold leading-tight text-foreground">
                  {lease.property_title?.trim() || 'Your leased property'}
                </p>
                {lease.property_address ? (
                  <p className="text-sm text-muted-foreground">{lease.property_address}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {lease.property_type ? (
                  <span className="capitalize">{lease.property_type.replace(/_/g, ' ')}</span>
                ) : null}
                {lease.lease_status ? (
                  <Badge variant="secondary" className="text-xs font-normal">
                    {formatTenantLeaseStatusLabel(lease.lease_status)}
                  </Badge>
                ) : null}
              </div>
              <div className="grid gap-2 border-t border-border/80 pt-3 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Lease period</span>
                  <p className="font-medium">
                    {lease.start_date
                      ? new Date(lease.start_date).toLocaleDateString('en-NG')
                      : '—'}{' '}
                    – {lease.end_date ? new Date(lease.end_date).toLocaleDateString('en-NG') : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Agreed annual rent</span>
                  <p className="font-medium">{formatNgn(annualRentNgn(lease))}</p>
                </div>
                {lease.monthly_rent > 0 ? (
                  <div>
                    <span className="text-muted-foreground">Monthly equivalent (reference)</span>
                    <p className="font-medium">{formatNgn(lease.monthly_rent)}</p>
                  </div>
                ) : null}
                {lease.rent_due_date != null ? (
                  <div>
                    <span className="text-muted-foreground">Rent reminder (day of month)</span>
                    <p className="font-medium">{lease.rent_due_date}</p>
                  </div>
                ) : null}
                {nextDueLabel ? (
                  <div>
                    <span className="text-muted-foreground">Next payment date (scheduled)</span>
                    <p className="font-medium">{nextDueLabel}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Alert className="border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Lease or property details are not loaded. Enter the amount you intend to pay and confirm
            with your property manager if unsure.
          </AlertDescription>
        </Alert>
      )}

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Make Payment
          </CardTitle>
          <CardDescription>
            In Nigeria, rent is usually collected annually. We prefill your annual amount when we
            have it from your lease—you can change it before paying.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₦)</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  placeholder="0.00"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                  min="1"
                  step="0.01"
                  required
                />
                {lease && annualRentNgn(lease) > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Suggested annual rent: {formatNgn(annualRentNgn(lease))}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Payment Category</Label>
                <Select
                  name="category"
                  value={paymentForm.category}
                  onValueChange={(value) =>
                    setPaymentForm((prev) => ({ ...prev, category: value as PaymentCategory }))
                  }
                >
                  <SelectTrigger id="category" aria-label="Payment category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rent">Rent</SelectItem>
                    <SelectItem value="deposit">Security Deposit</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="late_fee">Late Fee</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Add a note about this payment..."
                value={paymentForm.description}
                onChange={(e) =>
                  setPaymentForm((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={2}
              />
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Payment Method
              </legend>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {[
                  {
                    value: 'flutterwave',
                    label: 'Card (Flutterwave)',
                    icon: <CreditCard className="h-4 w-4" />,
                  },
                  {
                    value: 'bank_transfer',
                    label: 'Bank Transfer',
                    icon: <Building2 className="h-4 w-4" />,
                  },
                  { value: 'ussd', label: 'USSD', icon: <Smartphone className="h-4 w-4" /> },
                ].map((method) => (
                  <Button
                    key={method.value}
                    type="button"
                    variant={paymentForm.paymentMethod === method.value ? 'default' : 'outline'}
                    className="flex h-auto items-center gap-2 p-3"
                    aria-pressed={paymentForm.paymentMethod === method.value}
                    aria-label={`Select ${method.label}`}
                    onClick={() =>
                      setPaymentForm((prev) => ({ ...prev, paymentMethod: method.value as any }))
                    }
                  >
                    {method.icon}
                    <span className="text-xs">{method.label}</span>
                  </Button>
                ))}
              </div>
            </fieldset>

            {paymentForm.paymentMethod === 'flutterwave' ? (
              <div className="flex items-start gap-2 rounded-md border border-border/80 bg-muted/20 p-3">
                <Checkbox
                  id="recurring-save"
                  checked={saveCardForRecurring}
                  onCheckedChange={(v) => setSaveCardForRecurring(v === true)}
                  className="mt-0.5"
                />
                <Label
                  htmlFor="recurring-save"
                  className="cursor-pointer text-sm font-normal leading-snug"
                >
                  Save this card authorization with Flutterwave after a successful payment so
                  monthly rent can be charged automatically. Requires card support and webhook
                  processing; pause anytime from your payments tab.
                </Label>
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={isLoading || !amountValid}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {getPaymentMethodIcon(paymentForm.paymentMethod)}
                  <span className="ml-2">
                    Pay ₦{amountValid ? parsedAmount.toLocaleString() : '0.00'}
                  </span>
                </>
              )}
            </Button>
            {!amountValid && !isLoading && (
              <p className="text-center text-sm text-muted-foreground">
                Enter an amount greater than zero to enable payment.
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Bank Transfer Details */}
      {showBankDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Bank Transfer Details
            </CardTitle>
            <CardDescription>
              Use the following details to complete your bank transfer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>Account Name</Label>
                <div className="font-medium">{bankDetails.accountName}</div>
              </div>
              <div>
                <Label>Account Number</Label>
                <div className="font-medium">{bankDetails.accountNumber}</div>
              </div>
              <div>
                <Label>Bank Name</Label>
                <div className="font-medium">{bankDetails.bankName}</div>
              </div>
              <div>
                <Label>Sort Code</Label>
                <div className="font-medium">{bankDetails.sortCode}</div>
              </div>
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Please use your reference number as the payment description. Your payment will be
                verified within 24 hours.
              </AlertDescription>
            </Alert>
            <Button variant="outline" onClick={() => setShowBankDetails(false)} className="w-full">
              Close
            </Button>
          </CardContent>
        </Card>
      )}

      {/* USSD Codes */}
      {showUSSDCodes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              USSD Payment Codes
            </CardTitle>
            <CardDescription>
              Dial any of the following codes on your mobile phone to complete payment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Object.entries(ussdCodes).map(([bank, code]) => (
                <div key={bank} className="rounded-lg border p-3">
                  <div className="text-sm font-medium">{bank}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{code}</div>
                </div>
              ))}
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Replace "Amount" with your payment amount and "Reference" with your payment
                reference number.
              </AlertDescription>
            </Alert>
            <Button variant="outline" onClick={() => setShowUSSDCodes(false)} className="w-full">
              Close
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pending Payments */}
      {pendingPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Payments
            </CardTitle>
            <CardDescription>Payments awaiting confirmation or completion.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingPayments.map((payment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(payment.payment_status)}
                    <div>
                      <div className="font-medium">₦{payment.amount?.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">{payment.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(payment.payment_status)}>
                      {payment.payment_status}
                    </Badge>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {payment.reference_number}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Payment History */}
      {paymentHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Recent Payments
            </CardTitle>
            <CardDescription>Your recent payment transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentHistory.slice(0, 5).map((payment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(payment.payment_status)}
                    <div>
                      <div className="font-medium">₦{payment.amount?.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">{payment.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(payment.payment_status)}>
                      {payment.payment_status}
                    </Badge>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
