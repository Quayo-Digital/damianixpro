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
  Calculator,
  Percent,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Calendar,
} from 'lucide-react';

interface CommissionRule {
  rate: number; // Percentage (e.g., 5 for 5%)
  timing: 'on-payment' | 'on-invoice'; // When commission is earned
  cap?: number; // Maximum commission amount
  minPaymentThreshold?: number; // Minimum payment amount to earn commission
  delayPenalty?: {
    enabled: boolean;
    daysThreshold: number; // Days after which penalty applies
    penaltyRate: number; // Percentage reduction (e.g., 10 for 10% reduction)
  };
  partialPaymentRule?: 'proportional' | 'full-on-threshold' | 'none';
  partialPaymentThreshold?: number; // Minimum percentage to earn commission on partial payments
}

interface PaymentDetails {
  invoiceAmount: number;
  paymentAmount: number;
  invoiceDate: string;
  dueDate: string;
  paymentDate: string;
  propertyId: string;
  propertyName?: string;
  agentId: string;
  agentName?: string;
}

interface CommissionCalculation {
  eligible: boolean;
  eligibilityReason: string;
  baseCommission: number;
  adjustedCommission: number;
  adjustments: {
    type: string;
    amount: number;
    description: string;
  }[];
  payoutTiming: {
    status: 'immediate' | 'delayed' | 'pending';
    date: string;
    reason: string;
  };
  finalCommission: number;
  breakdown: {
    item: string;
    amount: number;
    type: 'base' | 'adjustment' | 'cap' | 'penalty';
  }[];
}

export function AgentCommissionCalculator() {
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [agentId, setAgentId] = useState('');
  const [agentName, setAgentName] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [commissionRate, setCommissionRate] = useState('5');
  const [commissionTiming, setCommissionTiming] = useState<'on-payment' | 'on-invoice'>(
    'on-payment'
  );
  const [commissionCap, setCommissionCap] = useState('');
  const [minPaymentThreshold, setMinPaymentThreshold] = useState('');
  const [delayPenaltyEnabled, setDelayPenaltyEnabled] = useState(false);
  const [delayDaysThreshold, setDelayDaysThreshold] = useState('30');
  const [delayPenaltyRate, setDelayPenaltyRate] = useState('10');
  const [partialPaymentRule, setPartialPaymentRule] = useState<
    'proportional' | 'full-on-threshold' | 'none'
  >('proportional');
  const [partialPaymentThreshold, setPartialPaymentThreshold] = useState('50');
  const [calculation, setCalculation] = useState<CommissionCalculation | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const calculateDaysDifference = (date1: string, date2: string): number => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  };

  const calculateCommission = (): CommissionCalculation | null => {
    if (!invoiceAmount || !paymentAmount || !invoiceDate || !dueDate || !paymentDate || !agentId) {
      return null;
    }

    const invoice = parseFloat(invoiceAmount);
    const payment = parseFloat(paymentAmount);
    const rate = parseFloat(commissionRate) / 100;

    if (isNaN(invoice) || isNaN(payment) || isNaN(rate) || invoice <= 0 || payment <= 0) {
      return null;
    }

    const isPartialPayment = payment < invoice;
    const paymentPercentage = (payment / invoice) * 100;
    const daysOverdue = calculateDaysDifference(dueDate, paymentDate);
    const isDelayed = daysOverdue > 0;

    // Check eligibility
    let eligible = true;
    let eligibilityReason = '';

    // Check minimum payment threshold
    if (minPaymentThreshold) {
      const minThreshold = parseFloat(minPaymentThreshold);
      if (payment < minThreshold) {
        eligible = false;
        eligibilityReason = `Payment amount (${formatCurrency(payment)}) is below the minimum threshold of ${formatCurrency(minThreshold)}.`;
      }
    }

    // Check partial payment rules
    if (isPartialPayment && partialPaymentRule === 'none') {
      eligible = false;
      eligibilityReason = 'Commission is not earned on partial payments.';
    } else if (isPartialPayment && partialPaymentRule === 'full-on-threshold') {
      const threshold = parseFloat(partialPaymentThreshold) || 50;
      if (paymentPercentage < threshold) {
        eligible = false;
        eligibilityReason = `Partial payment (${paymentPercentage.toFixed(1)}%) is below the threshold of ${threshold}% required to earn commission.`;
      }
    }

    if (!eligible) {
      return {
        eligible: false,
        eligibilityReason,
        baseCommission: 0,
        adjustedCommission: 0,
        adjustments: [],
        payoutTiming: {
          status: 'pending',
          date: paymentDate,
          reason: 'Not eligible for commission',
        },
        finalCommission: 0,
        breakdown: [],
      };
    }

    // Calculate base commission
    let baseCommission = 0;
    let commissionBase = 0;

    if (commissionTiming === 'on-payment') {
      // Commission based on payment amount
      commissionBase = payment;
    } else {
      // Commission based on invoice amount
      commissionBase = invoice;
    }

    if (isPartialPayment && partialPaymentRule === 'proportional') {
      // Proportional commission on partial payment
      baseCommission = commissionBase * rate;
    } else {
      // Full commission
      baseCommission = commissionBase * rate;
    }

    // Apply adjustments
    const adjustments: CommissionCalculation['adjustments'] = [];
    let adjustedCommission = baseCommission;

    // Apply delay penalty
    if (delayPenaltyEnabled && isDelayed && daysOverdue >= parseFloat(delayDaysThreshold)) {
      const penaltyRate = parseFloat(delayPenaltyRate) / 100;
      const penaltyAmount = baseCommission * penaltyRate;
      adjustedCommission -= penaltyAmount;
      adjustments.push({
        type: 'delay-penalty',
        amount: -penaltyAmount,
        description: `Late payment penalty: ${daysOverdue} days overdue (${(penaltyRate * 100).toFixed(1)}% reduction)`,
      });
    }

    // Apply commission cap
    let finalCommission = adjustedCommission;
    if (commissionCap) {
      const cap = parseFloat(commissionCap);
      if (finalCommission > cap) {
        const capReduction = finalCommission - cap;
        adjustments.push({
          type: 'cap',
          amount: -capReduction,
          description: `Commission capped at ${formatCurrency(cap)}`,
        });
        finalCommission = cap;
      }
    }

    // Determine payout timing
    let payoutTiming: CommissionCalculation['payoutTiming'];
    if (commissionTiming === 'on-payment') {
      payoutTiming = {
        status: 'immediate',
        date: paymentDate,
        reason: 'Commission is earned on payment receipt. Payout can be processed immediately.',
      };
    } else {
      // On invoice - check if payment is complete
      if (payment >= invoice) {
        payoutTiming = {
          status: 'immediate',
          date: paymentDate,
          reason:
            'Commission is earned on invoice and payment is complete. Payout can be processed immediately.',
        };
      } else {
        payoutTiming = {
          status: 'pending',
          date: paymentDate,
          reason:
            'Commission is earned on invoice, but payment is partial. Payout will be processed when full payment is received.',
        };
      }
    }

    // Build breakdown
    const breakdown: CommissionCalculation['breakdown'] = [
      {
        item: 'Base Commission',
        amount: baseCommission,
        type: 'base',
      },
    ];

    adjustments.forEach((adj) => {
      breakdown.push({
        item: adj.description,
        amount: adj.amount,
        type: adj.type === 'cap' ? 'cap' : adj.type === 'delay-penalty' ? 'penalty' : 'adjustment',
      });
    });

    breakdown.push({
      item: 'Final Commission',
      amount: finalCommission,
      type: 'base',
    });

    eligibilityReason = eligible
      ? `Agent is eligible for commission. ${isPartialPayment ? `Partial payment of ${paymentPercentage.toFixed(1)}% of invoice.` : 'Full payment received.'}`
      : eligibilityReason;

    return {
      eligible,
      eligibilityReason,
      baseCommission,
      adjustedCommission,
      adjustments,
      payoutTiming,
      finalCommission,
      breakdown,
    };
  };

  const handleCalculate = () => {
    const result = calculateCommission();
    if (result) {
      setCalculation(result);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-500" />
            Agent Commission Calculator
          </CardTitle>
          <CardDescription>
            Calculate agent commission with support for partial payments, delayed payments, caps,
            and timing rules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Details */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Payment Details</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="invoiceAmount">Invoice Amount (₦) *</Label>
                <Input
                  id="invoiceAmount"
                  type="number"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  placeholder="6000000"
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
              <div>
                <Label htmlFor="invoiceDate">Invoice Date *</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="paymentDate">Payment Date *</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="agentId">Agent ID *</Label>
                <Input
                  id="agentId"
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  placeholder="agent-123"
                />
              </div>
              <div>
                <Label htmlFor="agentName">Agent Name (Optional)</Label>
                <Input
                  id="agentName"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="propertyId">Property ID (Optional)</Label>
                <Input
                  id="propertyId"
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  placeholder="prop-123"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Commission Rules */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Commission Rules</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="commissionRate">Commission Rate (%) *</Label>
                <Input
                  id="commissionRate"
                  type="number"
                  step="0.1"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  placeholder="5"
                />
              </div>
              <div>
                <Label htmlFor="commissionTiming">Commission Timing *</Label>
                <Select value={commissionTiming} onValueChange={(v: any) => setCommissionTiming(v)}>
                  <SelectTrigger id="commissionTiming">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on-payment">On Payment</SelectItem>
                    <SelectItem value="on-invoice">On Invoice</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-gray-500">When commission is earned</p>
              </div>
              <div>
                <Label htmlFor="commissionCap">Commission Cap (₦) - Optional</Label>
                <Input
                  id="commissionCap"
                  type="number"
                  value={commissionCap}
                  onChange={(e) => setCommissionCap(e.target.value)}
                  placeholder="500000"
                />
                <p className="mt-1 text-xs text-gray-500">Maximum commission amount</p>
              </div>
              <div>
                <Label htmlFor="minPaymentThreshold">
                  Minimum Payment Threshold (₦) - Optional
                </Label>
                <Input
                  id="minPaymentThreshold"
                  type="number"
                  value={minPaymentThreshold}
                  onChange={(e) => setMinPaymentThreshold(e.target.value)}
                  placeholder="100000"
                />
                <p className="mt-1 text-xs text-gray-500">Minimum payment to earn commission</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Partial Payment Rules */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Partial Payment Rules</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="partialPaymentRule">Partial Payment Rule</Label>
                <Select
                  value={partialPaymentRule}
                  onValueChange={(v: any) => setPartialPaymentRule(v)}
                >
                  <SelectTrigger id="partialPaymentRule">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proportional">Proportional</SelectItem>
                    <SelectItem value="full-on-threshold">Full on Threshold</SelectItem>
                    <SelectItem value="none">No Commission</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-gray-500">How to handle partial payments</p>
              </div>
              {partialPaymentRule === 'full-on-threshold' && (
                <div>
                  <Label htmlFor="partialPaymentThreshold">Payment Threshold (%)</Label>
                  <Input
                    id="partialPaymentThreshold"
                    type="number"
                    value={partialPaymentThreshold}
                    onChange={(e) => setPartialPaymentThreshold(e.target.value)}
                    placeholder="50"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Minimum payment percentage to earn full commission
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Delay Penalty */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Delay Penalty (Optional)</h3>
            <div className="mb-4 flex items-center space-x-2">
              <input
                type="checkbox"
                id="delayPenaltyEnabled"
                checked={delayPenaltyEnabled}
                onChange={(e) => setDelayPenaltyEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="delayPenaltyEnabled" className="cursor-pointer font-normal">
                Apply delay penalty for late payments
              </Label>
            </div>
            {delayPenaltyEnabled && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="delayDaysThreshold">Days Threshold</Label>
                  <Input
                    id="delayDaysThreshold"
                    type="number"
                    value={delayDaysThreshold}
                    onChange={(e) => setDelayDaysThreshold(e.target.value)}
                    placeholder="30"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Days after due date before penalty applies
                  </p>
                </div>
                <div>
                  <Label htmlFor="delayPenaltyRate">Penalty Rate (%)</Label>
                  <Input
                    id="delayPenaltyRate"
                    type="number"
                    step="0.1"
                    value={delayPenaltyRate}
                    onChange={(e) => setDelayPenaltyRate(e.target.value)}
                    placeholder="10"
                  />
                  <p className="mt-1 text-xs text-gray-500">Percentage reduction in commission</p>
                </div>
              </div>
            )}
          </div>

          <Button onClick={handleCalculate} className="w-full" size="lg">
            <Calculator className="mr-2 h-4 w-4" />
            Calculate Commission
          </Button>
        </CardContent>
      </Card>

      {/* Calculation Results */}
      {calculation && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Commission Calculation</CardTitle>
              <Badge
                variant={calculation.eligible ? 'default' : 'destructive'}
                className={
                  calculation.eligible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }
              >
                {calculation.eligible ? 'Eligible' : 'Not Eligible'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Eligibility Status */}
            <Alert
              className={
                calculation.eligible ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }
            >
              {calculation.eligible ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <AlertTitle>Eligibility Status</AlertTitle>
              <AlertDescription className="mt-2">{calculation.eligibilityReason}</AlertDescription>
            </Alert>

            {calculation.eligible && (
              <>
                {/* Commission Amount */}
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Final Commission Amount</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {formatCurrency(calculation.finalCommission)}
                      </p>
                    </div>
                    <Percent className="h-12 w-12 text-blue-500" />
                  </div>
                </div>

                {/* Payout Timing */}
                <Alert
                  className={
                    calculation.payoutTiming.status === 'immediate'
                      ? 'border-green-200 bg-green-50'
                      : calculation.payoutTiming.status === 'delayed'
                        ? 'border-yellow-200 bg-yellow-50'
                        : 'border-gray-200 bg-gray-50'
                  }
                >
                  <Clock className="h-5 w-5 text-blue-500" />
                  <AlertTitle>Payout Timing</AlertTitle>
                  <AlertDescription className="mt-2">
                    <div className="space-y-1">
                      <p>
                        <strong>Status:</strong>{' '}
                        <Badge
                          variant={
                            calculation.payoutTiming.status === 'immediate'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {calculation.payoutTiming.status.toUpperCase()}
                        </Badge>
                      </p>
                      <p>
                        <strong>Date:</strong> {formatDate(calculation.payoutTiming.date)}
                      </p>
                      <p>
                        <strong>Reason:</strong> {calculation.payoutTiming.reason}
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>

                {/* Breakdown */}
                <div>
                  <h4 className="mb-3 flex items-center gap-2 font-semibold">
                    <Calculator className="h-5 w-5 text-blue-500" />
                    Commission Breakdown
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 p-2 text-left">Item</th>
                          <th className="border border-gray-300 p-2 text-right">Amount (₦)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calculation.breakdown.map((item, index) => (
                          <tr
                            key={index}
                            className={
                              item.type === 'penalty'
                                ? 'bg-red-50'
                                : item.type === 'cap'
                                  ? 'bg-yellow-50'
                                  : item.item === 'Final Commission'
                                    ? 'bg-blue-100 font-bold'
                                    : ''
                            }
                          >
                            <td className="border border-gray-300 p-2">{item.item}</td>
                            <td className="border border-gray-300 p-2 text-right">
                              {item.amount < 0 ? '-' : ''}
                              {formatCurrency(Math.abs(item.amount))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Adjustments */}
                {calculation.adjustments.length > 0 && (
                  <div>
                    <h4 className="mb-3 font-semibold">Adjustments Applied</h4>
                    <div className="space-y-2">
                      {calculation.adjustments.map((adj, index) => (
                        <div key={index} className="rounded-lg border bg-gray-50 p-3">
                          <p className="font-medium">{adj.type.replace('-', ' ').toUpperCase()}</p>
                          <p className="text-sm text-gray-600">{adj.description}</p>
                          <p className="mt-1 text-sm font-semibold">
                            {adj.amount < 0 ? '-' : '+'}
                            {formatCurrency(Math.abs(adj.amount))}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
