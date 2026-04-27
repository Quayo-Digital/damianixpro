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
  AlertTriangle,
  Percent,
  Calendar,
  FileText,
  Info,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface PenaltyRule {
  type: 'percentage' | 'flat' | 'tiered';
  rate?: number; // Percentage rate (e.g., 5 for 5%)
  amount?: number; // Flat amount in Naira
  gracePeriod?: number; // Days before penalty applies
  maxPenalty?: number; // Maximum penalty cap
  tiers?: {
    daysFrom: number;
    daysTo?: number;
    rate: number;
  }[];
}

interface DiscountRule {
  type: 'early-payment' | 'loyalty' | 'promotional' | 'flat';
  rate?: number; // Percentage rate
  amount?: number; // Flat amount in Naira
  daysBeforeDue?: number; // Days before due date to qualify
  minAmount?: number; // Minimum payment amount to qualify
  applicableUntil?: string; // Date until which discount applies
}

interface BillDetails {
  baseAmount: number;
  dueDate: string;
  paymentDate?: string;
  daysOverdue: number;
}

interface PenaltyDiscountExplanation {
  billDetails: BillDetails;
  penalty: {
    applicable: boolean;
    amount: number;
    calculation: string;
    justification: string;
    applicableDates: {
      dueDate: string;
      gracePeriodEnd?: string;
      penaltyStartDate: string;
    };
  };
  discount: {
    applicable: boolean;
    amount: number;
    calculation: string;
    justification: string;
    applicableDates: {
      discountStartDate?: string;
      discountEndDate?: string;
    };
  };
  finalAmount: number;
  breakdown: {
    item: string;
    amount: number;
    type: 'base' | 'penalty' | 'discount';
  }[];
}

export function PenaltyDiscountExplainer() {
  const [baseAmount, setBaseAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [daysOverdue, setDaysOverdue] = useState('');
  const [penaltyType, setPenaltyType] = useState<'percentage' | 'flat' | 'tiered'>('percentage');
  const [penaltyRate, setPenaltyRate] = useState('');
  const [penaltyAmount, setPenaltyAmount] = useState('');
  const [gracePeriod, setGracePeriod] = useState('');
  const [maxPenalty, setMaxPenalty] = useState('');
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountType, setDiscountType] = useState<
    'early-payment' | 'loyalty' | 'promotional' | 'flat'
  >('early-payment');
  const [discountRate, setDiscountRate] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountDaysBefore, setDiscountDaysBefore] = useState('');
  const [discountUntil, setDiscountUntil] = useState('');
  const [explanation, setExplanation] = useState<PenaltyDiscountExplanation | null>(null);

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

  const calculateExplanation = (): PenaltyDiscountExplanation | null => {
    if (!baseAmount || !dueDate) {
      return null;
    }

    const base = parseFloat(baseAmount);
    if (isNaN(base) || base <= 0) {
      return null;
    }

    // Calculate days overdue
    let daysOverdueValue = 0;
    if (daysOverdue) {
      daysOverdueValue = parseInt(daysOverdue) || 0;
    } else if (paymentDate) {
      const due = new Date(dueDate);
      const payment = new Date(paymentDate);
      daysOverdueValue = Math.max(
        0,
        Math.floor((payment.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
      );
    }

    const gracePeriodDays = parseInt(gracePeriod) || 0;
    const effectiveDaysOverdue = Math.max(0, daysOverdueValue - gracePeriodDays);
    const penaltyStartDate = new Date(dueDate);
    penaltyStartDate.setDate(penaltyStartDate.getDate() + gracePeriodDays);

    // Calculate penalty
    let penaltyAmount = 0;
    let penaltyCalculation = '';
    let penaltyJustification = '';

    if (effectiveDaysOverdue > 0) {
      if (penaltyType === 'percentage') {
        const rate = parseFloat(penaltyRate) || 0;
        penaltyAmount = (base * rate) / 100;
        if (maxPenalty) {
          const max = parseFloat(maxPenalty);
          penaltyAmount = Math.min(penaltyAmount, max);
        }
        penaltyCalculation = `${formatCurrency(base)} × ${rate}% = ${formatCurrency(penaltyAmount)}`;
        penaltyJustification = `A late payment penalty of ${rate}% is applied to the base amount of ${formatCurrency(base)} for payment made ${effectiveDaysOverdue} day${effectiveDaysOverdue !== 1 ? 's' : ''} after the grace period ended.`;
      } else if (penaltyType === 'flat') {
        penaltyAmount = parseFloat(penaltyAmount) || 0;
        if (maxPenalty) {
          const max = parseFloat(maxPenalty);
          penaltyAmount = Math.min(penaltyAmount, max);
        }
        penaltyCalculation = `Flat penalty: ${formatCurrency(penaltyAmount)}`;
        penaltyJustification = `A flat late payment penalty of ${formatCurrency(penaltyAmount)} is applied for payment made ${effectiveDaysOverdue} day${effectiveDaysOverdue !== 1 ? 's' : ''} after the grace period ended.`;
      } else if (penaltyType === 'tiered') {
        // For tiered, we'd need tier definitions - simplified for now
        const rate = parseFloat(penaltyRate) || 0;
        penaltyAmount = (base * rate) / 100;
        penaltyCalculation = `Tiered penalty calculation: ${formatCurrency(base)} × ${rate}% = ${formatCurrency(penaltyAmount)}`;
        penaltyJustification = `A tiered late payment penalty is applied based on ${effectiveDaysOverdue} day${effectiveDaysOverdue !== 1 ? 's' : ''} overdue. The applicable rate is ${rate}% of the base amount.`;
      }
    }

    // Calculate discount
    let discountAmount = 0;
    let discountCalculation = '';
    let discountJustification = '';
    let discountStartDate = '';
    let discountEndDate = '';

    if (hasDiscount) {
      const today = new Date();
      const due = new Date(dueDate);
      const daysBeforeDue = discountDaysBefore ? parseInt(discountDaysBefore) : 0;
      const isEarlyPayment = daysOverdueValue <= 0 && daysBeforeDue > 0;

      if (discountType === 'early-payment' && isEarlyPayment) {
        if (discountRate) {
          const rate = parseFloat(discountRate);
          discountAmount = (base * rate) / 100;
          discountCalculation = `${formatCurrency(base)} × ${rate}% = ${formatCurrency(discountAmount)}`;
          discountJustification = `An early payment discount of ${rate}% is applied for payment made before the due date.`;
        } else if (discountAmount) {
          const amount = parseFloat(discountAmount);
          discountAmount = amount;
          discountCalculation = `Flat discount: ${formatCurrency(discountAmount)}`;
          discountJustification = `A flat early payment discount of ${formatCurrency(discountAmount)} is applied for payment made before the due date.`;
        }
        discountStartDate = formatDate(dueDate);
        const discountStart = new Date(dueDate);
        discountStart.setDate(discountStart.getDate() - daysBeforeDue);
        discountStartDate = formatDate(discountStart.toISOString().split('T')[0]);
      } else if (discountType === 'loyalty') {
        if (discountRate) {
          const rate = parseFloat(discountRate);
          discountAmount = (base * rate) / 100;
          discountCalculation = `${formatCurrency(base)} × ${rate}% = ${formatCurrency(discountAmount)}`;
          discountJustification = `A loyalty discount of ${rate}% is applied based on your payment history.`;
        } else if (discountAmount) {
          const amount = parseFloat(discountAmount);
          discountAmount = amount;
          discountCalculation = `Flat discount: ${formatCurrency(discountAmount)}`;
          discountJustification = `A flat loyalty discount of ${formatCurrency(discountAmount)} is applied based on your payment history.`;
        }
      } else if (discountType === 'promotional') {
        if (discountRate) {
          const rate = parseFloat(discountRate);
          discountAmount = (base * rate) / 100;
          discountCalculation = `${formatCurrency(base)} × ${rate}% = ${formatCurrency(discountAmount)}`;
          discountJustification = `A promotional discount of ${rate}% is applied as part of a limited-time offer.`;
        } else if (discountAmount) {
          const amount = parseFloat(discountAmount);
          discountAmount = amount;
          discountCalculation = `Flat discount: ${formatCurrency(discountAmount)}`;
          discountJustification = `A flat promotional discount of ${formatCurrency(discountAmount)} is applied as part of a limited-time offer.`;
        }
        if (discountUntil) {
          discountEndDate = formatDate(discountUntil);
        }
      } else if (discountType === 'flat') {
        const amount = parseFloat(discountAmount) || 0;
        discountAmount = amount;
        discountCalculation = `Flat discount: ${formatCurrency(discountAmount)}`;
        discountJustification = `A flat discount of ${formatCurrency(discountAmount)} is applied.`;
      }
    }

    // Calculate final amount
    const finalAmount = base + penaltyAmount - discountAmount;

    // Build breakdown
    const breakdown: PenaltyDiscountExplanation['breakdown'] = [
      {
        item: 'Base Amount',
        amount: base,
        type: 'base',
      },
    ];

    if (penaltyAmount > 0) {
      breakdown.push({
        item: 'Late Payment Penalty',
        amount: penaltyAmount,
        type: 'penalty',
      });
    }

    if (discountAmount > 0) {
      breakdown.push({
        item: 'Discount',
        amount: -discountAmount,
        type: 'discount',
      });
    }

    breakdown.push({
      item: 'Total Amount Due',
      amount: finalAmount,
      type: 'base',
    });

    return {
      billDetails: {
        baseAmount: base,
        dueDate,
        paymentDate: paymentDate || undefined,
        daysOverdue: daysOverdueValue,
      },
      penalty: {
        applicable: penaltyAmount > 0,
        amount: penaltyAmount,
        calculation: penaltyCalculation,
        justification: penaltyJustification,
        applicableDates: {
          dueDate: formatDate(dueDate),
          gracePeriodEnd:
            gracePeriodDays > 0
              ? formatDate(penaltyStartDate.toISOString().split('T')[0])
              : undefined,
          penaltyStartDate: formatDate(penaltyStartDate.toISOString().split('T')[0]),
        },
      },
      discount: {
        applicable: discountAmount > 0,
        amount: discountAmount,
        calculation: discountCalculation,
        justification: discountJustification,
        applicableDates: {
          discountStartDate: discountStartDate || undefined,
          discountEndDate: discountEndDate || undefined,
        },
      },
      finalAmount,
      breakdown,
    };
  };

  const handleExplain = () => {
    const result = calculateExplanation();
    if (result) {
      setExplanation(result);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-500" />
            Penalty & Discount Explainer
          </CardTitle>
          <CardDescription>
            Explain penalties and discounts applied to bills with clear calculations and factual
            justifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Bill Details */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Bill Details</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="baseAmount">Base Amount (₦) *</Label>
                <Input
                  id="baseAmount"
                  type="number"
                  value={baseAmount}
                  onChange={(e) => setBaseAmount(e.target.value)}
                  placeholder="6000000"
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
                <Label htmlFor="paymentDate">Payment Date (Optional)</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="daysOverdue">Days Overdue (Optional)</Label>
                <Input
                  id="daysOverdue"
                  type="number"
                  value={daysOverdue}
                  onChange={(e) => setDaysOverdue(e.target.value)}
                  placeholder="0"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty if payment date is provided
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Penalty Rules */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Penalty Rules</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="penaltyType">Penalty Type</Label>
                <Select value={penaltyType} onValueChange={(v: any) => setPenaltyType(v)}>
                  <SelectTrigger id="penaltyType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="flat">Flat Amount</SelectItem>
                    <SelectItem value="tiered">Tiered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {penaltyType === 'percentage' && (
                <div>
                  <Label htmlFor="penaltyRate">Penalty Rate (%)</Label>
                  <Input
                    id="penaltyRate"
                    type="number"
                    step="0.1"
                    value={penaltyRate}
                    onChange={(e) => setPenaltyRate(e.target.value)}
                    placeholder="5"
                  />
                </div>
              )}
              {penaltyType === 'flat' && (
                <div>
                  <Label htmlFor="penaltyAmount">Penalty Amount (₦)</Label>
                  <Input
                    id="penaltyAmount"
                    type="number"
                    value={penaltyAmount}
                    onChange={(e) => setPenaltyAmount(e.target.value)}
                    placeholder="50000"
                  />
                </div>
              )}
              {penaltyType === 'tiered' && (
                <div>
                  <Label htmlFor="penaltyRate">Default Rate (%)</Label>
                  <Input
                    id="penaltyRate"
                    type="number"
                    step="0.1"
                    value={penaltyRate}
                    onChange={(e) => setPenaltyRate(e.target.value)}
                    placeholder="5"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="gracePeriod">Grace Period (Days)</Label>
                <Input
                  id="gracePeriod"
                  type="number"
                  value={gracePeriod}
                  onChange={(e) => setGracePeriod(e.target.value)}
                  placeholder="0"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Days after due date before penalty applies
                </p>
              </div>
              <div>
                <Label htmlFor="maxPenalty">Maximum Penalty (₦) - Optional</Label>
                <Input
                  id="maxPenalty"
                  type="number"
                  value={maxPenalty}
                  onChange={(e) => setMaxPenalty(e.target.value)}
                  placeholder="100000"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Discount Rules */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Discount Rules (Optional)</h3>
            <div className="mb-4 flex items-center space-x-2">
              <input
                type="checkbox"
                id="hasDiscount"
                checked={hasDiscount}
                onChange={(e) => setHasDiscount(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="hasDiscount" className="cursor-pointer font-normal">
                Apply discount
              </Label>
            </div>
            {hasDiscount && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="discountType">Discount Type</Label>
                  <Select value={discountType} onValueChange={(v: any) => setDiscountType(v)}>
                    <SelectTrigger id="discountType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="early-payment">Early Payment</SelectItem>
                      <SelectItem value="loyalty">Loyalty</SelectItem>
                      <SelectItem value="promotional">Promotional</SelectItem>
                      <SelectItem value="flat">Flat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="discountRate">Discount Rate (%)</Label>
                  <Input
                    id="discountRate"
                    type="number"
                    step="0.1"
                    value={discountRate}
                    onChange={(e) => setDiscountRate(e.target.value)}
                    placeholder="5"
                  />
                </div>
                <div>
                  <Label htmlFor="discountAmount">Or Flat Discount Amount (₦)</Label>
                  <Input
                    id="discountAmount"
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    placeholder="50000"
                  />
                </div>
                {discountType === 'early-payment' && (
                  <div>
                    <Label htmlFor="discountDaysBefore">Days Before Due Date</Label>
                    <Input
                      id="discountDaysBefore"
                      type="number"
                      value={discountDaysBefore}
                      onChange={(e) => setDiscountDaysBefore(e.target.value)}
                      placeholder="7"
                    />
                  </div>
                )}
                {discountType === 'promotional' && (
                  <div>
                    <Label htmlFor="discountUntil">Valid Until</Label>
                    <Input
                      id="discountUntil"
                      type="date"
                      value={discountUntil}
                      onChange={(e) => setDiscountUntil(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <Button onClick={handleExplain} className="w-full" size="lg">
            <Calculator className="mr-2 h-4 w-4" />
            Generate Explanation
          </Button>
        </CardContent>
      </Card>

      {/* Explanation Results */}
      {explanation && (
        <Card>
          <CardHeader>
            <CardTitle>Penalty & Discount Explanation</CardTitle>
            <CardDescription>
              Factual breakdown of all charges and discounts applied
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <Alert>
              <Info className="h-5 w-5 text-blue-500" />
              <AlertTitle>Bill Summary</AlertTitle>
              <AlertDescription className="mt-2">
                <div className="space-y-2">
                  <p>
                    <strong>Base Amount:</strong>{' '}
                    {formatCurrency(explanation.billDetails.baseAmount)}
                  </p>
                  {explanation.penalty.applicable && (
                    <p>
                      <strong>Penalty Applied:</strong>{' '}
                      <span className="text-red-600">
                        +{formatCurrency(explanation.penalty.amount)}
                      </span>
                    </p>
                  )}
                  {explanation.discount.applicable && (
                    <p>
                      <strong>Discount Applied:</strong>{' '}
                      <span className="text-green-600">
                        -{formatCurrency(explanation.discount.amount)}
                      </span>
                    </p>
                  )}
                  <p className="text-lg font-bold">
                    <strong>Total Amount Due:</strong> {formatCurrency(explanation.finalAmount)}
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            {/* Penalty Explanation */}
            {explanation.penalty.applicable && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <h4 className="font-semibold">Late Payment Penalty</h4>
                </div>
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>Amount:</strong> {formatCurrency(explanation.penalty.amount)}
                  </p>
                  <p className="text-sm">
                    <strong>Calculation:</strong> {explanation.penalty.calculation}
                  </p>
                  <p className="text-sm">
                    <strong>Justification:</strong> {explanation.penalty.justification}
                  </p>
                  <div className="mt-3 border-t border-red-200 pt-3">
                    <p className="mb-2 text-sm font-semibold">Applicable Dates:</p>
                    <ul className="space-y-1 text-sm">
                      <li>
                        <strong>Due Date:</strong> {explanation.penalty.applicableDates.dueDate}
                      </li>
                      {explanation.penalty.applicableDates.gracePeriodEnd && (
                        <li>
                          <strong>Grace Period End:</strong>{' '}
                          {explanation.penalty.applicableDates.gracePeriodEnd}
                        </li>
                      )}
                      <li>
                        <strong>Penalty Start Date:</strong>{' '}
                        {explanation.penalty.applicableDates.penaltyStartDate}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Discount Explanation */}
            {explanation.discount.applicable && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <h4 className="font-semibold">Discount Applied</h4>
                </div>
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>Amount:</strong> {formatCurrency(explanation.discount.amount)}
                  </p>
                  <p className="text-sm">
                    <strong>Calculation:</strong> {explanation.discount.calculation}
                  </p>
                  <p className="text-sm">
                    <strong>Justification:</strong> {explanation.discount.justification}
                  </p>
                  {(explanation.discount.applicableDates.discountStartDate ||
                    explanation.discount.applicableDates.discountEndDate) && (
                    <div className="mt-3 border-t border-green-200 pt-3">
                      <p className="mb-2 text-sm font-semibold">Applicable Dates:</p>
                      <ul className="space-y-1 text-sm">
                        {explanation.discount.applicableDates.discountStartDate && (
                          <li>
                            <strong>Discount Start:</strong>{' '}
                            {explanation.discount.applicableDates.discountStartDate}
                          </li>
                        )}
                        {explanation.discount.applicableDates.discountEndDate && (
                          <li>
                            <strong>Discount End:</strong>{' '}
                            {explanation.discount.applicableDates.discountEndDate}
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Breakdown Table */}
            <div>
              <h4 className="mb-3 flex items-center gap-2 font-semibold">
                <FileText className="h-5 w-5 text-blue-500" />
                Detailed Breakdown
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
                    {explanation.breakdown.map((item, index) => (
                      <tr
                        key={index}
                        className={
                          item.type === 'penalty'
                            ? 'bg-red-50'
                            : item.type === 'discount'
                              ? 'bg-green-50'
                              : item.item === 'Total Amount Due'
                                ? 'bg-gray-100 font-bold'
                                : ''
                        }
                      >
                        <td className="border border-gray-300 p-2">{item.item}</td>
                        <td className="border border-gray-300 p-2 text-right">
                          {item.type === 'discount' ? '-' : ''}
                          {formatCurrency(Math.abs(item.amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
