import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Info,
  Clock,
  FileText,
} from 'lucide-react';

interface PaymentRecord {
  date: string;
  amount: string;
  description: string;
  type: 'rent' | 'penalty' | 'adjustment' | 'deposit';
}

interface PaymentStatus {
  rentAmount: string;
  paymentsMade: PaymentRecord[];
  outstandingBalance: string;
  penalties: string;
  currentMonth: string;
  dueDate: string;
}

export function PaymentStatusExplainer() {
  const [rentAmount, setRentAmount] = useState('');
  const [outstandingBalance, setOutstandingBalance] = useState('');
  const [penalties, setPenalties] = useState('0');
  const [currentMonth, setCurrentMonth] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [paymentType, setPaymentType] = useState<'rent' | 'penalty' | 'adjustment' | 'deposit'>(
    'rent'
  );

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(num)) return amount;
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(num);
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

  const addPayment = () => {
    if (!paymentDate || !paymentAmount) {
      return;
    }
    const newPayment: PaymentRecord = {
      date: paymentDate,
      amount: paymentAmount,
      description: paymentDescription || `${paymentType} payment`,
      type: paymentType,
    };
    setPayments(
      [...payments, newPayment].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )
    );
    setPaymentDate('');
    setPaymentAmount('');
    setPaymentDescription('');
    setPaymentType('rent');
  };

  const removePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const calculateTotalPaid = (): number => {
    return payments.reduce((sum, payment) => {
      const amount = parseFloat(payment.amount.replace(/,/g, ''));
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  };

  const calculateTotalPenalties = (): number => {
    const penaltyAmount = parseFloat(penalties.replace(/,/g, ''));
    const penaltyPayments = payments
      .filter((p) => p.type === 'penalty')
      .reduce((sum, p) => {
        const amount = parseFloat(p.amount.replace(/,/g, ''));
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
    return (isNaN(penaltyAmount) ? 0 : penaltyAmount) - penaltyPayments;
  };

  const generateExplanation = (): {
    summary: string;
    status: 'current' | 'overdue' | 'partial' | 'paid';
    explanation: string;
    timeline: string[];
    nextAction: string;
    recommendations: string[];
  } => {
    const rent = parseFloat(rentAmount.replace(/,/g, '')) || 0;
    const totalPaid = calculateTotalPaid();
    const outstanding = parseFloat(outstandingBalance.replace(/,/g, '')) || 0;
    const totalPenalties = calculateTotalPenalties();
    const rentPayments = payments.filter((p) => p.type === 'rent');
    const penaltyPayments = payments.filter((p) => p.type === 'penalty');

    let status: 'current' | 'overdue' | 'partial' | 'paid' = 'current';
    let summary = '';
    let explanation = '';
    const timeline: string[] = [];
    let nextAction = '';
    const recommendations: string[] = [];

    // Calculate status
    if (outstanding === 0 && totalPenalties === 0) {
      status = 'paid';
      summary = 'Your annual rent is fully paid up!';
    } else if (outstanding > 0 && totalPaid >= rent * 0.5) {
      status = 'partial';
      summary = 'You have made a partial payment towards your annual rent.';
    } else if (outstanding > 0) {
      status = 'overdue';
      summary = 'Your annual rent has an outstanding balance.';
    } else {
      status = 'current';
      summary = 'Your annual rent account is current.';
    }

    // Generate explanation
    explanation = `Your annual rent is ${formatCurrency(rentAmount)}. `;

    if (rentPayments.length > 0) {
      explanation += `You have made ${rentPayments.length} rent payment${rentPayments.length > 1 ? 's' : ''} totaling ${formatCurrency(totalPaid.toString())}. `;
    } else {
      explanation += `No rent payments have been recorded yet. `;
    }

    if (outstanding > 0) {
      explanation += `You currently owe ${formatCurrency(outstandingBalance)} in outstanding rent. `;
    } else {
      explanation += `All rent payments are up to date. `;
    }

    if (totalPenalties > 0) {
      explanation += `Additionally, you have ${formatCurrency(totalPenalties.toString())} in penalties that need to be paid. `;
    } else if (penaltyPayments.length > 0) {
      explanation += `All penalties have been paid. `;
    }

    // Generate timeline
    if (currentMonth && dueDate) {
      timeline.push(`Annual rent due date for ${formatDate(currentMonth)}: ${formatDate(dueDate)}`);
    }

    payments.forEach((payment, index) => {
      const daysDiff = Math.floor(
        (new Date(payment.date).getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      let timing = '';
      if (daysDiff < 0) {
        timing = `${Math.abs(daysDiff)} days early`;
      } else if (daysDiff === 0) {
        timing = 'on time';
      } else {
        timing = `${daysDiff} days late`;
      }

      timeline.push(
        `${formatDate(payment.date)}: Paid ${formatCurrency(payment.amount)} for ${payment.description} (${timing})`
      );
    });

    if (outstanding > 0 && dueDate) {
      const today = new Date();
      const due = new Date(dueDate);
      const daysOverdue = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      if (daysOverdue > 0) {
        timeline.push(
          `Current status: ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue - ${formatCurrency(outstandingBalance)} still outstanding`
        );
      }
    }

    // Generate next action
    if (status === 'paid') {
      nextAction = 'No action needed. Your account is fully paid. Keep up the good work!';
    } else if (status === 'current') {
      if (dueDate) {
        const today = new Date();
        const due = new Date(dueDate);
        const daysUntilDue = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilDue > 0) {
          nextAction = `Your next payment of ${formatCurrency(rentAmount)} is due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''} (${formatDate(dueDate)}).`;
        } else {
          nextAction = `Please make your payment of ${formatCurrency(rentAmount)} as soon as possible.`;
        }
      } else {
        nextAction = `Please make your payment of ${formatCurrency(rentAmount)}.`;
      }
    } else if (status === 'partial') {
      nextAction = `Please pay the remaining balance of ${formatCurrency(outstandingBalance)} to bring your account current.`;
    } else {
      nextAction = `URGENT: Please pay ${formatCurrency(outstandingBalance)} immediately to avoid further penalties and potential legal action.`;
    }

    // Generate recommendations
    if (status === 'overdue' || status === 'partial') {
      recommendations.push('Contact your property manager immediately to discuss payment options.');
      if (totalPenalties > 0) {
        recommendations.push(
          `Pay penalties of ${formatCurrency(totalPenalties.toString())} to avoid additional charges.`
        );
      }
      recommendations.push(
        'Consider discussing a payment plan if you cannot pay the full annual amount at once.'
      );
    } else if (status === 'current') {
      recommendations.push('Ensure your annual rent payment is made on or before the due date.');
      recommendations.push('Keep records of all payment receipts for your annual rent.');
      recommendations.push("Plan ahead for next year's annual rent payment.");
    }

    if (penaltyPayments.length > 0 && totalPenalties === 0) {
      recommendations.push(
        'Great job paying off your penalties! Keep payments on time going forward.'
      );
    }

    return {
      summary,
      status,
      explanation,
      timeline,
      nextAction,
      recommendations,
    };
  };

  const result = rentAmount ? generateExplanation() : null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'current':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'current':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'partial':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'overdue':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-500" />
            Payment Status Explainer
          </CardTitle>
          <CardDescription>
            Understand your annual rental payment status in simple, clear language
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Account Information</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="rentAmount">Annual Rent Amount (₦) *</Label>
                <Input
                  id="rentAmount"
                  type="number"
                  value={rentAmount}
                  onChange={(e) => setRentAmount(e.target.value)}
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
                <Label htmlFor="penalties">Total Penalties (₦)</Label>
                <Input
                  id="penalties"
                  type="number"
                  value={penalties}
                  onChange={(e) => setPenalties(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="currentMonth">Rent Period Start Date</Label>
                <Input
                  id="currentMonth"
                  type="date"
                  value={currentMonth}
                  onChange={(e) => setCurrentMonth(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Annual Rent Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Records */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Payment History</h3>
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-5">
              <div>
                <Label htmlFor="paymentDate">Payment Date</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="paymentAmount">Amount (₦)</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="500000"
                />
              </div>
              <div>
                <Label htmlFor="paymentType">Type</Label>
                <Select value={paymentType} onValueChange={(value) => setPaymentType(value as any)}>
                  <SelectTrigger id="paymentType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rent">Rent</SelectItem>
                    <SelectItem value="penalty">Penalty</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                    <SelectItem value="deposit">Deposit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="paymentDescription">Description</Label>
                <Input
                  id="paymentDescription"
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={addPayment} className="w-full">
                  Add Payment
                </Button>
              </div>
            </div>

            {payments.length > 0 && (
              <div className="space-y-2 rounded-lg border p-4">
                <h4 className="mb-2 font-semibold">Recorded Payments:</h4>
                {payments.map((payment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded bg-gray-50 p-2"
                  >
                    <div className="flex-1">
                      <span className="font-medium">{formatDate(payment.date)}</span>
                      <span className="ml-2 text-gray-600">
                        - {formatCurrency(payment.amount)} ({payment.description})
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removePayment(index)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Explanation */}
      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Your Payment Status</CardTitle>
              <Badge className={getStatusColor(result.status)}>
                {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Alert */}
            <Alert
              className={
                result.status === 'paid'
                  ? 'border-green-200 bg-green-50'
                  : result.status === 'current'
                    ? 'border-blue-200 bg-blue-50'
                    : result.status === 'partial'
                      ? 'border-yellow-200 bg-yellow-50'
                      : 'border-red-200 bg-red-50'
              }
            >
              <div className="flex items-start gap-3">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <AlertTitle className="text-lg font-semibold">{result.summary}</AlertTitle>
                  <AlertDescription className="mt-2 text-base">
                    {result.explanation}
                  </AlertDescription>
                </div>
              </div>
            </Alert>

            {/* Timeline */}
            {result.timeline.length > 0 && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <Calendar className="h-5 w-5" />
                  Payment Timeline
                </h3>
                <div className="space-y-2">
                  {result.timeline.map((event, index) => (
                    <div key={index} className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
                      <Clock className="mt-0.5 h-4 w-4 text-gray-500" />
                      <span className="flex-1 text-sm">{event}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Next Action */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <TrendingUp className="h-5 w-5" />
                What You Need to Do Next
              </h3>
              <Alert className="border-blue-200 bg-blue-50">
                <FileText className="h-4 w-4 text-blue-500" />
                <AlertTitle>Next Action Required</AlertTitle>
                <AlertDescription className="mt-2">{result.nextAction}</AlertDescription>
              </Alert>
            </div>

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div>
                <h3 className="mb-3 font-semibold">Recommendations</h3>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Summary Box */}
            <div className="rounded-lg border bg-gray-50 p-4">
              <h3 className="mb-3 font-semibold">Quick Summary</h3>
              <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
                <div>
                  <span className="text-gray-600">Annual Rent:</span>
                  <span className="ml-2 font-semibold">{formatCurrency(rentAmount)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Paid:</span>
                  <span className="ml-2 font-semibold">
                    {formatCurrency(calculateTotalPaid().toString())}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Outstanding:</span>
                  <span className="ml-2 font-semibold">
                    {formatCurrency(outstandingBalance || '0')}
                  </span>
                </div>
                {calculateTotalPenalties() > 0 && (
                  <div>
                    <span className="text-gray-600">Penalties Due:</span>
                    <span className="ml-2 font-semibold text-red-600">
                      {formatCurrency(calculateTotalPenalties().toString())}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
