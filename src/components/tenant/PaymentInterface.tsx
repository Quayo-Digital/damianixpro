import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Info
} from 'lucide-react';

interface PaymentInterfaceProps {
  tenantId?: string;
  propertyId?: string;
  onPaymentComplete?: (paymentId: string) => void;
}

export const PaymentInterface: React.FC<PaymentInterfaceProps> = ({
  tenantId,
  propertyId,
  onPaymentComplete
}) => {
  const {
    processPaymentWithMethod,
    verifyPayment,
    loadPaymentData,
    isLoading,
    paymentHistory,
    pendingPayments
  } = usePaymentProcessing();

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    category: 'rent' as PaymentCategory,
    description: '',
    paymentMethod: 'paystack' as 'paystack' | 'flutterwave' | 'bank_transfer' | 'ussd'
  });

  const [showBankDetails, setShowBankDetails] = useState(false);
  const [showUSSDCodes, setShowUSSDCodes] = useState(false);

  useEffect(() => {
    loadPaymentData();
  }, [loadPaymentData]);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      return;
    }

    const amount = parseFloat(paymentForm.amount);
    
    try {
      await processPaymentWithMethod(
        amount,
        paymentForm.category,
        paymentForm.description || `${paymentForm.category} payment`,
        paymentForm.paymentMethod,
        tenantId,
        propertyId
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
        paymentMethod: 'paystack'
      });

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
    accountName: 'Nigeria Homes Limited',
    accountNumber: '0123456789',
    bankName: 'First Bank of Nigeria',
    sortCode: '011151003'
  };

  const ussdCodes = {
    'GTBank': '*737*1*Amount*Reference#',
    'Access Bank': '*901*0*Amount*Reference#',
    'First Bank': '*894*0*Amount*Reference#',
    'UBA': '*919*0*Amount*Reference#',
    'Zenith Bank': '*966*0*Amount*Reference#',
    'Fidelity Bank': '*770*0*Amount*Reference#'
  };

  return (
    <div className="space-y-6">
      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Make Payment
          </CardTitle>
          <CardDescription>
            Choose your preferred payment method and complete your transaction securely.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₦)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                  min="1"
                  step="0.01"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Payment Category</Label>
                <Select 
                  value={paymentForm.category} 
                  onValueChange={(value) => setPaymentForm(prev => ({ ...prev, category: value as PaymentCategory }))}
                >
                  <SelectTrigger>
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
                placeholder="Add a note about this payment..."
                value={paymentForm.description}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { value: 'paystack', label: 'Paystack', icon: <CreditCard className="h-4 w-4" /> },
                  { value: 'flutterwave', label: 'Flutterwave', icon: <CreditCard className="h-4 w-4" /> },
                  { value: 'bank_transfer', label: 'Bank Transfer', icon: <Building2 className="h-4 w-4" /> },
                  { value: 'ussd', label: 'USSD', icon: <Smartphone className="h-4 w-4" /> }
                ].map((method) => (
                  <Button
                    key={method.value}
                    type="button"
                    variant={paymentForm.paymentMethod === method.value ? 'default' : 'outline'}
                    className="flex items-center gap-2 h-auto p-3"
                    onClick={() => setPaymentForm(prev => ({ ...prev, paymentMethod: method.value as any }))}
                  >
                    {method.icon}
                    <span className="text-xs">{method.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {getPaymentMethodIcon(paymentForm.paymentMethod)}
                  <span className="ml-2">
                    Pay ₦{paymentForm.amount ? parseFloat(paymentForm.amount).toLocaleString() : '0.00'}
                  </span>
                </>
              )}
            </Button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Please use your reference number as the payment description. Your payment will be verified within 24 hours.
              </AlertDescription>
            </Alert>
            <Button 
              variant="outline" 
              onClick={() => setShowBankDetails(false)}
              className="w-full"
            >
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(ussdCodes).map(([bank, code]) => (
                <div key={bank} className="p-3 border rounded-lg">
                  <div className="font-medium text-sm">{bank}</div>
                  <div className="text-xs text-muted-foreground mt-1">{code}</div>
                </div>
              ))}
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Replace "Amount" with your payment amount and "Reference" with your payment reference number.
              </AlertDescription>
            </Alert>
            <Button 
              variant="outline" 
              onClick={() => setShowUSSDCodes(false)}
              className="w-full"
            >
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
            <CardDescription>
              Payments awaiting confirmation or completion.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingPayments.map((payment, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
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
                    <div className="text-xs text-muted-foreground mt-1">
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
            <CardDescription>
              Your recent payment transactions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentHistory.slice(0, 5).map((payment, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
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
                    <div className="text-xs text-muted-foreground mt-1">
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
