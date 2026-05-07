import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  Calendar,
  DollarSign,
  Wallet,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
} from 'lucide-react';

interface RentBilling {
  date: string;
  amount: number;
  period: string;
  description?: string;
}

interface Payment {
  date: string;
  amount: number;
  method: string;
  reference: string;
  description?: string;
}

interface WalletTransaction {
  date: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
}

interface Penalty {
  date: string;
  amount: number;
  reason: string;
  relatedPeriod?: string;
}

interface PaymentActivity {
  tenantName: string;
  propertyAddress: string;
  rentBillings: RentBilling[];
  payments: Payment[];
  walletTransactions: WalletTransaction[];
  penalties: Penalty[];
  currentBalance: number;
}

interface TimelineEvent {
  date: string;
  type: 'billing' | 'payment' | 'wallet' | 'penalty';
  amount: number;
  description: string;
  narrative: string;
}

interface PaymentSummary {
  timeline: TimelineEvent[];
  summary: {
    totalRentBilled: number;
    totalPayments: number;
    totalWalletCredits: number;
    totalWalletDebits: number;
    totalPenalties: number;
    currentBalance: number;
    netAmount: number;
  };
  narrative: string;
}

export function PaymentActivitySummary() {
  const [tenantName, setTenantName] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [rentBillingsJson, setRentBillingsJson] = useState('');
  const [paymentsJson, setPaymentsJson] = useState('');
  const [walletTransactionsJson, setWalletTransactionsJson] = useState('');
  const [penaltiesJson, setPenaltiesJson] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  const [summary, setSummary] = useState<PaymentSummary | null>(null);

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

  const parseJson = <T,>(jsonString: string, defaultArray: T[] = []): T[] => {
    if (!jsonString.trim()) return defaultArray;
    try {
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return defaultArray;
    }
  };

  const generateSummary = (): PaymentSummary | null => {
    if (!tenantName || !propertyAddress) {
      return null;
    }

    const rentBillings = parseJson<RentBilling>(rentBillingsJson);
    const payments = parseJson<Payment>(paymentsJson);
    const walletTransactions = parseJson<WalletTransaction>(walletTransactionsJson);
    const penalties = parseJson<Penalty>(penaltiesJson);
    const balance = parseFloat(currentBalance) || 0;

    // Create timeline events
    const timeline: TimelineEvent[] = [];

    // Add rent billings
    rentBillings.forEach((billing) => {
      timeline.push({
        date: billing.date,
        type: 'billing',
        amount: billing.amount,
        description: billing.description || `Rent for ${billing.period}`,
        narrative: `Rent of ${formatCurrency(billing.amount)} was billed for ${billing.period}${billing.description ? ` (${billing.description})` : ''}.`,
      });
    });

    // Add payments
    payments.forEach((payment) => {
      timeline.push({
        date: payment.date,
        type: 'payment',
        amount: payment.amount,
        description: payment.description || `Payment via ${payment.method}`,
        narrative: `Payment of ${formatCurrency(payment.amount)} was made via ${payment.method}${payment.reference ? ` (Reference: ${payment.reference})` : ''}${payment.description ? `. ${payment.description}` : ''}.`,
      });
    });

    // Add wallet transactions
    walletTransactions.forEach((transaction) => {
      timeline.push({
        date: transaction.date,
        type: 'wallet',
        amount: transaction.amount,
        description: transaction.description,
        narrative:
          transaction.type === 'credit'
            ? `${formatCurrency(transaction.amount)} was credited to your wallet. ${transaction.description}`
            : `${formatCurrency(transaction.amount)} was debited from your wallet. ${transaction.description}`,
      });
    });

    // Add penalties
    penalties.forEach((penalty) => {
      timeline.push({
        date: penalty.date,
        type: 'penalty',
        amount: penalty.amount,
        description: penalty.reason,
        narrative: `A penalty of ${formatCurrency(penalty.amount)} was applied${penalty.relatedPeriod ? ` for ${penalty.relatedPeriod}` : ''}. Reason: ${penalty.reason}.`,
      });
    });

    // Sort timeline by date
    timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate summary
    const totalRentBilled = rentBillings.reduce((sum, b) => sum + b.amount, 0);
    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalWalletCredits = walletTransactions
      .filter((t) => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalWalletDebits = walletTransactions
      .filter((t) => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalPenalties = penalties.reduce((sum, p) => sum + p.amount, 0);
    const netAmount =
      totalRentBilled + totalPenalties - totalPayments - totalWalletCredits + totalWalletDebits;

    // Generate narrative
    let narrative = `Payment Activity Summary for ${tenantName}\n\n`;
    narrative += `Property: ${propertyAddress}\n\n`;

    if (timeline.length === 0) {
      narrative += `No payment activity recorded.\n\n`;
    } else {
      narrative += `Timeline of Payment Activity:\n\n`;

      let runningBalance = 0;
      timeline.forEach((event, index) => {
        const eventDate = formatDate(event.date);
        narrative += `${index + 1}. ${eventDate} - `;

        if (event.type === 'billing') {
          runningBalance += event.amount;
          narrative += `Rent Billed: ${formatCurrency(event.amount)}\n`;
          narrative += `   ${event.narrative}\n`;
        } else if (event.type === 'payment') {
          runningBalance -= event.amount;
          narrative += `Payment Received: ${formatCurrency(event.amount)}\n`;
          narrative += `   ${event.narrative}\n`;
        } else if (event.type === 'wallet') {
          if (event.amount > 0) {
            // Credit
            runningBalance -= event.amount;
            narrative += `Wallet Credit: ${formatCurrency(event.amount)}\n`;
          } else {
            // Debit
            runningBalance += Math.abs(event.amount);
            narrative += `Wallet Debit: ${formatCurrency(Math.abs(event.amount))}\n`;
          }
          narrative += `   ${event.narrative}\n`;
        } else if (event.type === 'penalty') {
          runningBalance += event.amount;
          narrative += `Penalty Applied: ${formatCurrency(event.amount)}\n`;
          narrative += `   ${event.narrative}\n`;
        }

        narrative += `   Balance after this event: ${formatCurrency(runningBalance)}\n\n`;
      });

      narrative += `\nSummary:\n\n`;
      narrative += `Total Rent Billed: ${formatCurrency(totalRentBilled)}\n`;
      narrative += `Total Payments Made: ${formatCurrency(totalPayments)}\n`;
      if (totalWalletCredits > 0) {
        narrative += `Total Wallet Credits: ${formatCurrency(totalWalletCredits)}\n`;
      }
      if (totalWalletDebits > 0) {
        narrative += `Total Wallet Debits: ${formatCurrency(totalWalletDebits)}\n`;
      }
      if (totalPenalties > 0) {
        narrative += `Total Penalties: ${formatCurrency(totalPenalties)}\n`;
      }
      narrative += `\nCurrent Balance: ${formatCurrency(balance)}\n`;
      narrative += `Calculated Net Amount: ${formatCurrency(netAmount)}\n`;

      if (balance !== netAmount) {
        narrative += `\nNote: There may be a discrepancy between the current balance and calculated net amount. Please verify all transactions.`;
      }
    }

    return {
      timeline,
      summary: {
        totalRentBilled,
        totalPayments,
        totalWalletCredits,
        totalWalletDebits,
        totalPenalties,
        currentBalance: balance,
        netAmount,
      },
      narrative,
    };
  };

  const handleGenerate = () => {
    const result = generateSummary();
    if (result) {
      setSummary(result);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'billing':
        return <FileText className="h-4 w-4 text-primary" />;
      case 'payment':
        return <CheckCircle className="h-4 w-4 text-primary" />;
      case 'wallet':
        return <Wallet className="h-4 w-4 text-secondary-foreground" />;
      case 'penalty':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'billing':
        return 'bg-primary/10 border-border';
      case 'payment':
        return 'bg-primary/10 border-border';
      case 'wallet':
        return 'bg-secondary/40 border-border';
      case 'penalty':
        return 'bg-destructive/10 border-destructive/40';
      default:
        return 'bg-muted/40 border-border';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Payment Activity Summary
          </CardTitle>
          <CardDescription>
            Generate a timeline narrative of tenant payment activity including rent, payments,
            wallet usage, and penalties
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Tenant Information</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="tenantName">Tenant Name *</Label>
                <Input
                  id="tenantName"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="propertyAddress">Property Address *</Label>
                <Input
                  id="propertyAddress"
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  placeholder="123 Main Street, Lagos"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Rent Billings */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Rent Billings</h3>
            <Label htmlFor="rentBillingsJson">Rent Billings JSON</Label>
            <Textarea
              id="rentBillingsJson"
              value={rentBillingsJson}
              onChange={(e) => setRentBillingsJson(e.target.value)}
              placeholder='[{"date": "2024-01-01", "amount": 6000000, "period": "2024 Annual Rent", "description": "Annual rent payment"}]'
              className="mt-2 font-mono text-sm"
              rows={4}
            />
          </div>

          <Separator />

          {/* Payments */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Payments Made</h3>
            <Label htmlFor="paymentsJson">Payments JSON</Label>
            <Textarea
              id="paymentsJson"
              value={paymentsJson}
              onChange={(e) => setPaymentsJson(e.target.value)}
              placeholder='[{"date": "2024-01-05", "amount": 3000000, "method": "Bank Transfer", "reference": "T123456", "description": "Partial payment"}]'
              className="mt-2 font-mono text-sm"
              rows={4}
            />
          </div>

          <Separator />

          {/* Wallet Transactions */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Wallet Transactions</h3>
            <Label htmlFor="walletTransactionsJson">Wallet Transactions JSON</Label>
            <Textarea
              id="walletTransactionsJson"
              value={walletTransactionsJson}
              onChange={(e) => setWalletTransactionsJson(e.target.value)}
              placeholder='[{"date": "2024-01-10", "amount": 500000, "type": "credit", "description": "Refund from previous payment"}, {"date": "2024-01-15", "amount": 500000, "type": "debit", "description": "Applied to rent payment"}]'
              className="mt-2 font-mono text-sm"
              rows={4}
            />
          </div>

          <Separator />

          {/* Penalties */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Penalties</h3>
            <Label htmlFor="penaltiesJson">Penalties JSON</Label>
            <Textarea
              id="penaltiesJson"
              value={penaltiesJson}
              onChange={(e) => setPenaltiesJson(e.target.value)}
              placeholder='[{"date": "2024-01-20", "amount": 300000, "reason": "Late payment penalty", "relatedPeriod": "2024 Annual Rent"}]'
              className="mt-2 font-mono text-sm"
              rows={4}
            />
          </div>

          <Separator />

          {/* Current Balance */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Current Balance</h3>
            <div>
              <Label htmlFor="currentBalance">Current Balance (₦)</Label>
              <Input
                id="currentBalance"
                type="number"
                value={currentBalance}
                onChange={(e) => setCurrentBalance(e.target.value)}
                placeholder="3500000"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Enter the current outstanding balance
              </p>
            </div>
          </div>

          <Button onClick={handleGenerate} className="w-full" size="lg">
            <FileText className="mr-2 h-4 w-4" />
            Generate Summary
          </Button>
        </CardContent>
      </Card>

      {/* Summary Results */}
      {summary && (
        <>
          {/* Summary Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-border bg-primary/10 p-4">
                  <p className="text-sm text-muted-foreground">Total Rent Billed</p>
                  <p className="text-xl font-bold text-primary">
                    {formatCurrency(summary.summary.totalRentBilled)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-primary/10 p-4">
                  <p className="text-sm text-muted-foreground">Total Payments</p>
                  <p className="text-xl font-bold text-primary">
                    {formatCurrency(summary.summary.totalPayments)}
                  </p>
                </div>
                {summary.summary.totalWalletCredits > 0 && (
                  <div className="rounded-lg border border-border bg-secondary/40 p-4">
                    <p className="text-sm text-muted-foreground">Wallet Credits</p>
                    <p className="text-xl font-bold text-secondary-foreground">
                      {formatCurrency(summary.summary.totalWalletCredits)}
                    </p>
                  </div>
                )}
                {summary.summary.totalWalletDebits > 0 && (
                  <div className="rounded-lg border border-border bg-secondary/40 p-4">
                    <p className="text-sm text-muted-foreground">Wallet Debits</p>
                    <p className="text-xl font-bold text-secondary-foreground">
                      {formatCurrency(summary.summary.totalWalletDebits)}
                    </p>
                  </div>
                )}
                {summary.summary.totalPenalties > 0 && (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4">
                    <p className="text-sm text-muted-foreground">Total Penalties</p>
                    <p className="text-xl font-bold text-destructive">
                      {formatCurrency(summary.summary.totalPenalties)}
                    </p>
                  </div>
                )}
                <div className="rounded-lg border border-border bg-muted/40 p-4">
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(summary.summary.currentBalance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Activity Timeline</CardTitle>
              <CardDescription>
                Chronological narrative of all payment-related events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary.timeline.map((event, index) => (
                  <div key={index} className={`rounded-lg border p-4 ${getEventColor(event.type)}`}>
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{getEventIcon(event.type)}</div>
                      <div className="flex-1">
                        <div className="mb-2 flex items-center justify-between">
                          <div>
                            <Badge variant="outline" className="mr-2">
                              {formatDate(event.date)}
                            </Badge>
                            <Badge
                              variant={
                                event.type === 'payment'
                                  ? 'default'
                                  : event.type === 'penalty'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                            >
                              {event.type.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="font-semibold">
                            {event.type === 'payment' || event.type === 'wallet' ? '-' : '+'}
                            {formatCurrency(Math.abs(event.amount))}
                          </p>
                        </div>
                        <p className="mb-1 font-medium">{event.description}</p>
                        <p className="text-sm text-muted-foreground">{event.narrative}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Narrative Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Narrative Summary</CardTitle>
              <CardDescription>Complete timeline narrative in text format</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={summary.narrative}
                readOnly
                className="whitespace-pre-wrap font-mono text-sm"
                rows={30}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
