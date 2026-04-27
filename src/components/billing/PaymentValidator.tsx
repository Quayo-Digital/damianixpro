import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Wallet,
  CreditCard,
  Info,
  Calculator,
} from 'lucide-react';

interface PaymentValidation {
  isValid: boolean;
  paymentType: 'full' | 'partial' | 'overpayment';
  approvedAmount: number;
  breakdown: {
    category: 'Rent' | 'Penalty' | 'Discount' | 'Wallet' | 'Adjustment';
    amount: number;
    description: string;
  }[];
  warnings: {
    type:
      | 'overpayment'
      | 'underpayment'
      | 'wallet-available'
      | 'penalty-applied'
      | 'discount-applied'
      | 'due-date'
      | 'amount-mismatch';
    severity: 'info' | 'warning' | 'error';
    message: string;
  }[];
  recommendations: string[];
  shouldAutoApplyWallet: boolean;
  paymentInstructions: {
    type: 'full' | 'partial' | 'overpayment';
    remainingBalance?: number;
    excessAmount?: number;
    nextPaymentDate?: string;
    excessAllocation?: 'wallet' | 'future-rent' | 'pending';
    requiresConfirmation: boolean;
    instructions: string[];
  };
}

export function PaymentValidator() {
  const [tenantId, setTenantId] = useState('');
  const [rentAmountDue, setRentAmountDue] = useState('');
  const [outstandingBalance, setOutstandingBalance] = useState('');
  const [walletBalance, setWalletBalance] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [penaltyAmount, setPenaltyAmount] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [useWallet, setUseWallet] = useState(false);
  const [validation, setValidation] = useState<PaymentValidation | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const validatePayment = (): PaymentValidation => {
    const rent = parseFloat(rentAmountDue.replace(/,/g, '')) || 0;
    const outstanding = parseFloat(outstandingBalance.replace(/,/g, '')) || 0;
    const wallet = parseFloat(walletBalance.replace(/,/g, '')) || 0;
    const payment = parseFloat(paymentAmount.replace(/,/g, '')) || 0;
    const penalty = parseFloat(penaltyAmount.replace(/,/g, '')) || 0;
    const discount = parseFloat(discountAmount.replace(/,/g, '')) || 0;

    const breakdown: PaymentValidation['breakdown'] = [];
    const warnings: PaymentValidation['warnings'] = [];
    const recommendations: string[] = [];
    let shouldAutoApplyWallet = false;

    // Calculate total amount due
    let totalDue = rent + outstanding;
    if (penalty > 0) {
      totalDue += penalty;
    }
    if (discount > 0) {
      totalDue -= discount;
    }

    // Add breakdown items
    if (rent > 0) {
      breakdown.push({
        category: 'Rent',
        amount: rent,
        description: 'Annual rent amount due',
      });
    }

    if (outstanding > 0) {
      breakdown.push({
        category: 'Rent',
        amount: outstanding,
        description: 'Outstanding rent balance',
      });
    }

    if (penalty > 0) {
      breakdown.push({
        category: 'Penalty',
        amount: penalty,
        description: 'Late payment penalty',
      });
      warnings.push({
        type: 'penalty-applied',
        severity: 'warning',
        message: `A penalty of ${formatCurrency(penalty)} has been applied. This is likely due to payment after the due date.`,
      });
    }

    if (discount > 0) {
      breakdown.push({
        category: 'Discount',
        amount: -discount,
        description: 'Discount applied',
      });
      warnings.push({
        type: 'discount-applied',
        severity: 'info',
        message: `A discount of ${formatCurrency(discount)} has been applied to your payment.`,
      });
    }

    // Check due date
    if (dueDate) {
      const due = new Date(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysOverdue = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));

      if (daysOverdue > 0 && penalty === 0) {
        warnings.push({
          type: 'due-date',
          severity: 'warning',
          message: `Payment is ${daysOverdue} day(s) overdue. A penalty may apply - verify with property manager.`,
        });
      }
    }

    // Wallet auto-apply logic
    if (wallet > 0) {
      if (wallet >= totalDue) {
        shouldAutoApplyWallet = true;
        warnings.push({
          type: 'wallet-available',
          severity: 'info',
          message: `Your wallet balance (${formatCurrency(wallet)}) is sufficient to cover the full amount. Consider using it for faster payment.`,
        });
        recommendations.push(
          "Use wallet balance to pay - it's faster and you don't need to enter payment details"
        );
      } else if (wallet > 0 && wallet < totalDue) {
        shouldAutoApplyWallet = true;
        warnings.push({
          type: 'wallet-available',
          severity: 'info',
          message: `You have ${formatCurrency(wallet)} in your wallet. This can be applied to reduce the payment amount.`,
        });
        recommendations.push(
          `Apply wallet balance of ${formatCurrency(wallet)} to reduce payment to ${formatCurrency(totalDue - wallet)}`
        );
      }
    }

    // Calculate amount after wallet
    let amountAfterWallet = totalDue;
    if (useWallet && wallet > 0) {
      const walletToApply = Math.min(wallet, totalDue);
      amountAfterWallet = totalDue - walletToApply;
      breakdown.push({
        category: 'Wallet',
        amount: -walletToApply,
        description: `Wallet balance applied (${formatCurrency(walletToApply)})`,
      });
    }

    // Validate payment amount and determine payment type
    const approvedAmount = payment;
    let isValid = true;
    let paymentType: 'full' | 'partial' | 'overpayment' = 'full';
    const paymentInstructions: PaymentValidation['paymentInstructions'] = {
      type: 'full',
      requiresConfirmation: false,
      instructions: [],
    };

    if (payment === 0) {
      isValid = false;
      warnings.push({
        type: 'amount-mismatch',
        severity: 'error',
        message: 'Payment amount is required. Please enter the amount you want to pay.',
      });
      paymentInstructions.instructions.push('Enter a payment amount to proceed');
    } else if (payment < amountAfterWallet) {
      // PARTIAL PAYMENT
      paymentType = 'partial';
      isValid = true; // Partial payments are valid
      const shortfall = amountAfterWallet - payment;
      const remainingBalance = shortfall;

      paymentInstructions.type = 'partial';
      paymentInstructions.remainingBalance = remainingBalance;

      // Calculate next payment date (suggest 30 days from now or based on agreement)
      const nextPaymentDate = new Date();
      nextPaymentDate.setDate(nextPaymentDate.getDate() + 30);
      paymentInstructions.nextPaymentDate = nextPaymentDate.toISOString().split('T')[0];

      warnings.push({
        type: 'underpayment',
        severity: 'info',
        message: `This is a partial payment of ${formatCurrency(payment)}. Remaining balance: ${formatCurrency(remainingBalance)}.`,
      });

      paymentInstructions.instructions.push(
        `Process partial payment of ${formatCurrency(payment)}`
      );
      paymentInstructions.instructions.push(
        `Record remaining balance of ${formatCurrency(remainingBalance)}`
      );
      paymentInstructions.instructions.push(
        `Update tenant account to show ${formatCurrency(remainingBalance)} outstanding`
      );
      paymentInstructions.instructions.push(
        `Schedule next payment for ${formatDate(paymentInstructions.nextPaymentDate)} (or as agreed)`
      );
      paymentInstructions.instructions.push('Send payment reminder for remaining balance');

      recommendations.push(
        `Remaining balance of ${formatCurrency(remainingBalance)} should be paid by ${formatDate(paymentInstructions.nextPaymentDate)}`
      );
      recommendations.push('Confirm payment schedule with tenant');
    } else if (payment > amountAfterWallet * 1.1) {
      // SIGNIFICANT OVERPAYMENT (>10%)
      paymentType = 'overpayment';
      const excess = payment - amountAfterWallet;
      paymentInstructions.type = 'overpayment';
      paymentInstructions.excessAmount = excess;
      paymentInstructions.excessAllocation = 'pending';
      paymentInstructions.requiresConfirmation = true;

      warnings.push({
        type: 'overpayment',
        severity: 'warning',
        message: `Payment amount (${formatCurrency(payment)}) exceeds the total due (${formatCurrency(amountAfterWallet)}) by ${formatCurrency(excess)}. Confirmation required for excess allocation.`,
      });

      paymentInstructions.instructions.push(`Process payment of ${formatCurrency(payment)}`);
      paymentInstructions.instructions.push(
        `Apply ${formatCurrency(amountAfterWallet)} to current charges`
      );
      paymentInstructions.instructions.push(
        `Excess of ${formatCurrency(excess)} requires allocation decision`
      );
      paymentInstructions.instructions.push('Choose: Apply to wallet OR Credit to future rent');
      paymentInstructions.instructions.push('Get tenant confirmation before processing');

      recommendations.push('Confirm with tenant how to handle excess amount');
      recommendations.push('Options: Add to wallet balance OR Credit to next rent period');
    } else if (payment > amountAfterWallet) {
      // SMALL OVERPAYMENT (within 10%)
      paymentType = 'overpayment';
      const excess = payment - amountAfterWallet;
      paymentInstructions.type = 'overpayment';
      paymentInstructions.excessAmount = excess;
      paymentInstructions.excessAllocation = 'wallet'; // Default to wallet for small overpayments
      paymentInstructions.requiresConfirmation = false;

      warnings.push({
        type: 'overpayment',
        severity: 'info',
        message: `Payment amount (${formatCurrency(payment)}) is slightly higher than due (${formatCurrency(amountAfterWallet)}). Excess of ${formatCurrency(excess)} will be added to wallet balance.`,
      });

      paymentInstructions.instructions.push(`Process payment of ${formatCurrency(payment)}`);
      paymentInstructions.instructions.push(
        `Apply ${formatCurrency(amountAfterWallet)} to current charges`
      );
      paymentInstructions.instructions.push(
        `Add excess ${formatCurrency(excess)} to tenant wallet balance`
      );
      paymentInstructions.instructions.push('Wallet balance can be used for future payments');

      recommendations.push(
        `Excess amount (${formatCurrency(excess)}) will be automatically added to wallet`
      );
    } else {
      // EXACT PAYMENT
      paymentType = 'full';
      paymentInstructions.type = 'full';
      paymentInstructions.instructions.push(`Process full payment of ${formatCurrency(payment)}`);
      paymentInstructions.instructions.push('Mark all charges as paid');
      paymentInstructions.instructions.push('Update tenant account status');
    }

    // Additional recommendations
    if (penalty > 0) {
      recommendations.push('Pay on time in the future to avoid penalties');
    }

    if (outstanding > 0 && payment < totalDue) {
      recommendations.push(
        'Consider paying the full outstanding balance to avoid further penalties'
      );
    }

    return {
      isValid,
      paymentType,
      approvedAmount,
      breakdown,
      warnings,
      recommendations,
      shouldAutoApplyWallet,
      paymentInstructions,
    };
  };

  const handleValidate = () => {
    if (!tenantId || !rentAmountDue || !paymentAmount) {
      return;
    }

    const result = validatePayment();
    setValidation(result);
  };

  const getWarningColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getWarningIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Payment Validator
          </CardTitle>
          <CardDescription>
            Validate payment attempts and get detailed breakdowns before processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Details */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Payment Details</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="tenantId">Tenant ID *</Label>
                <Input
                  id="tenantId"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  placeholder="Tenant ID or name"
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="rentAmountDue">Annual Rent Amount Due (₦) *</Label>
                <Input
                  id="rentAmountDue"
                  type="number"
                  value={rentAmountDue}
                  onChange={(e) => setRentAmountDue(e.target.value)}
                  placeholder="6000000"
                />
              </div>
              <div>
                <Label htmlFor="outstandingBalance">Outstanding Balance (₦)</Label>
                <Input
                  id="outstandingBalance"
                  type="number"
                  value={outstandingBalance}
                  onChange={(e) => setOutstandingBalance(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="walletBalance">Wallet Balance (₦)</Label>
                <Input
                  id="walletBalance"
                  type="number"
                  value={walletBalance}
                  onChange={(e) => setWalletBalance(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="selectedPaymentMethod">Payment Method</Label>
                <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                  <SelectTrigger id="selectedPaymentMethod">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Card (Flutterwave)</SelectItem>
                    <SelectItem value="bank-transfer">Bank Transfer (Flutterwave)</SelectItem>
                    <SelectItem value="ussd">USSD (Flutterwave)</SelectItem>
                    <SelectItem value="wallet">Wallet Balance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="penaltyAmount">Penalty Amount (₦)</Label>
                <Input
                  id="penaltyAmount"
                  type="number"
                  value={penaltyAmount}
                  onChange={(e) => setPenaltyAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="discountAmount">Discount Amount (₦)</Label>
                <Input
                  id="discountAmount"
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="paymentAmount">Payment Amount (₦) *</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="6000000"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="useWallet"
                  checked={useWallet}
                  onChange={(e) => setUseWallet(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="useWallet" className="cursor-pointer font-normal">
                  Apply wallet balance to this payment
                </Label>
              </div>
            </div>
          </div>

          <Button onClick={handleValidate} className="w-full" size="lg">
            <Shield className="mr-2 h-4 w-4" />
            Validate Payment
          </Button>
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validation && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Validation Results</CardTitle>
              <Badge
                variant={validation.isValid ? 'default' : 'destructive'}
                className={validation.isValid ? 'bg-green-100 text-green-800' : ''}
              >
                {validation.isValid ? 'Valid' : 'Invalid'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Approved Amount */}
            <Alert
              className={
                validation.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }
            >
              <div className="flex items-start gap-3">
                {validation.isValid ? (
                  <CheckCircle className="mt-0.5 h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-red-500" />
                )}
                <div className="flex-1">
                  <AlertTitle className="text-lg font-semibold">
                    Approved Amount to Charge
                  </AlertTitle>
                  <AlertDescription className="mt-2">
                    <p className="text-2xl font-bold">
                      {formatCurrency(validation.approvedAmount)}
                    </p>
                    <p className="mt-2 text-sm">
                      {validation.isValid
                        ? 'This payment can be processed.'
                        : 'Please review the warnings and adjust the payment amount.'}
                    </p>
                  </AlertDescription>
                </div>
              </div>
            </Alert>

            {/* Breakdown */}
            {validation.breakdown.length > 0 && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <Calculator className="h-5 w-5" />
                  Payment Breakdown
                </h3>
                <div className="space-y-2">
                  {validation.breakdown.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border bg-gray-50 p-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{item.category}</p>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                      <p
                        className={`font-bold ${
                          item.amount < 0 ? 'text-green-600' : 'text-gray-800'
                        }`}
                      >
                        {item.amount < 0 ? '-' : '+'}
                        {formatCurrency(Math.abs(item.amount))}
                      </p>
                    </div>
                  ))}
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                    <p className="text-lg font-bold text-gray-800">Total Amount</p>
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(validation.approvedAmount)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Wallet Auto-Apply Recommendation */}
            {validation.shouldAutoApplyWallet && !useWallet && (
              <Alert className="border-blue-200 bg-blue-50">
                <Wallet className="h-4 w-4 text-blue-500" />
                <AlertTitle>Wallet Auto-Apply Recommended</AlertTitle>
                <AlertDescription className="mt-2">
                  <p>
                    You have a wallet balance available. Consider applying it to reduce the payment
                    amount.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => setUseWallet(true)}
                  >
                    Apply Wallet Balance
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Warnings */}
            {validation.warnings.length > 0 && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Warnings & Notices
                </h3>
                <div className="space-y-3">
                  {validation.warnings.map((warning, index) => (
                    <Alert key={index} className={getWarningColor(warning.severity)}>
                      {getWarningIcon(warning.severity)}
                      <AlertTitle className="capitalize">
                        {warning.type.replace(/-/g, ' ')}
                      </AlertTitle>
                      <AlertDescription className="mt-2">{warning.message}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {validation.recommendations.length > 0 && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <Info className="h-5 w-5 text-blue-500" />
                  Recommendations
                </h3>
                <ol className="space-y-2">
                  {validation.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 font-semibold text-blue-600">{index + 1}.</span>
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Payment Instructions */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Payment Instructions
              </h3>
              <div className="space-y-4">
                {/* Payment Type Badge */}
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      validation.paymentType === 'full'
                        ? 'default'
                        : validation.paymentType === 'partial'
                          ? 'secondary'
                          : 'outline'
                    }
                    className={
                      validation.paymentType === 'full'
                        ? 'bg-green-100 text-green-800'
                        : validation.paymentType === 'partial'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                    }
                  >
                    {validation.paymentType === 'full'
                      ? 'Full Payment'
                      : validation.paymentType === 'partial'
                        ? 'Partial Payment'
                        : 'Overpayment'}
                  </Badge>
                  {validation.paymentInstructions.requiresConfirmation && (
                    <Badge variant="destructive">Confirmation Required</Badge>
                  )}
                </div>

                {/* Partial Payment Details */}
                {validation.paymentType === 'partial' &&
                  validation.paymentInstructions.remainingBalance !== undefined && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <AlertTitle>Partial Payment Details</AlertTitle>
                      <AlertDescription className="mt-2 space-y-2">
                        <p>
                          <strong>Payment Amount:</strong>{' '}
                          {formatCurrency(validation.approvedAmount)}
                        </p>
                        <p>
                          <strong>Remaining Balance:</strong>{' '}
                          <span className="font-bold text-red-600">
                            {formatCurrency(validation.paymentInstructions.remainingBalance)}
                          </span>
                        </p>
                        {validation.paymentInstructions.nextPaymentDate && (
                          <p>
                            <strong>Suggested Next Payment Date:</strong>{' '}
                            {formatDate(validation.paymentInstructions.nextPaymentDate)}
                          </p>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                {/* Overpayment Details */}
                {validation.paymentType === 'overpayment' &&
                  validation.paymentInstructions.excessAmount !== undefined && (
                    <Alert className="border-blue-200 bg-blue-50">
                      <Info className="h-4 w-4 text-blue-500" />
                      <AlertTitle>Overpayment Details</AlertTitle>
                      <AlertDescription className="mt-2 space-y-2">
                        <p>
                          <strong>Payment Amount:</strong>{' '}
                          {formatCurrency(validation.approvedAmount)}
                        </p>
                        <p>
                          <strong>Amount Due:</strong>{' '}
                          {formatCurrency(
                            validation.approvedAmount - validation.paymentInstructions.excessAmount
                          )}
                        </p>
                        <p>
                          <strong>Excess Amount:</strong>{' '}
                          <span className="font-bold text-blue-600">
                            {formatCurrency(validation.paymentInstructions.excessAmount)}
                          </span>
                        </p>
                        {validation.paymentInstructions.excessAllocation && (
                          <p>
                            <strong>Allocation:</strong>{' '}
                            {validation.paymentInstructions.excessAllocation === 'wallet'
                              ? 'Add to wallet balance'
                              : validation.paymentInstructions.excessAllocation === 'future-rent'
                                ? 'Credit to future rent'
                                : 'Pending confirmation'}
                          </p>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                {/* Structured Instructions */}
                <div className="rounded-lg border bg-gray-50 p-4">
                  <h4 className="mb-3 font-semibold">Processing Instructions</h4>
                  <ol className="space-y-2">
                    {validation.paymentInstructions.instructions.map((instruction, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="mt-0.5 font-semibold text-blue-600">{index + 1}.</span>
                        <span className="text-gray-700">{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Confirmation Required */}
                {validation.paymentInstructions.requiresConfirmation && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <AlertTitle>Confirmation Required</AlertTitle>
                    <AlertDescription className="mt-2">
                      <p className="mb-3">
                        This payment requires confirmation before processing due to excess amount
                        allocation.
                      </p>
                      <div className="space-y-2">
                        <p className="font-medium">
                          Choose how to handle excess of{' '}
                          {validation.paymentInstructions.excessAmount
                            ? formatCurrency(validation.paymentInstructions.excessAmount)
                            : ''}
                          :
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={excessAllocation === 'wallet' ? 'default' : 'outline'}
                            onClick={() => {
                              setExcessAllocation('wallet');
                              // Re-validate with wallet allocation
                              const updatedValidation = { ...validation };
                              updatedValidation.paymentInstructions.excessAllocation = 'wallet';
                              updatedValidation.paymentInstructions.requiresConfirmation = false;
                              updatedValidation.paymentInstructions.instructions = [
                                ...validation.paymentInstructions.instructions.filter(
                                  (i) => !i.includes('requires allocation')
                                ),
                                `Add excess ${formatCurrency(validation.paymentInstructions.excessAmount || 0)} to tenant wallet balance`,
                              ];
                              setValidation(updatedValidation);
                            }}
                          >
                            Add to Wallet
                          </Button>
                          <Button
                            size="sm"
                            variant={excessAllocation === 'future-rent' ? 'default' : 'outline'}
                            onClick={() => {
                              setExcessAllocation('future-rent');
                              // Re-validate with future rent allocation
                              const updatedValidation = { ...validation };
                              updatedValidation.paymentInstructions.excessAllocation =
                                'future-rent';
                              updatedValidation.paymentInstructions.requiresConfirmation = false;
                              updatedValidation.paymentInstructions.instructions = [
                                ...validation.paymentInstructions.instructions.filter(
                                  (i) => !i.includes('requires allocation')
                                ),
                                `Credit excess ${formatCurrency(validation.paymentInstructions.excessAmount || 0)} to next rent period`,
                              ];
                              setValidation(updatedValidation);
                            }}
                          >
                            Credit Future Rent
                          </Button>
                        </div>
                        {excessAllocation && (
                          <p className="mt-2 text-sm text-green-600">
                            ✓ Excess will be{' '}
                            {excessAllocation === 'wallet'
                              ? 'added to wallet'
                              : 'credited to future rent'}
                          </p>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-lg border bg-gray-50 p-4">
              <h3 className="mb-2 font-semibold">Validation Summary</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Payment Status:</strong>{' '}
                  {validation.isValid ? (
                    <span className="text-green-600">Ready to process</span>
                  ) : (
                    <span className="text-red-600">Needs adjustment</span>
                  )}
                </p>
                <p>
                  <strong>Payment Type:</strong>{' '}
                  {validation.paymentType === 'full'
                    ? 'Full Payment'
                    : validation.paymentType === 'partial'
                      ? 'Partial Payment'
                      : 'Overpayment'}
                </p>
                <p>
                  <strong>Amount to Charge:</strong> {formatCurrency(validation.approvedAmount)}
                </p>
                {validation.paymentType === 'partial' &&
                  validation.paymentInstructions.remainingBalance !== undefined && (
                    <p>
                      <strong>Remaining Balance:</strong>{' '}
                      <span className="text-red-600">
                        {formatCurrency(validation.paymentInstructions.remainingBalance)}
                      </span>
                    </p>
                  )}
                {validation.paymentType === 'overpayment' &&
                  validation.paymentInstructions.excessAmount !== undefined && (
                    <p>
                      <strong>Excess Amount:</strong>{' '}
                      <span className="text-blue-600">
                        {formatCurrency(validation.paymentInstructions.excessAmount)}
                      </span>
                    </p>
                  )}
                {validation.shouldAutoApplyWallet && (
                  <p>
                    <strong>Wallet Available:</strong> Consider applying wallet balance
                  </p>
                )}
                <p>
                  <strong>Warnings:</strong> {validation.warnings.length} notice(s)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
