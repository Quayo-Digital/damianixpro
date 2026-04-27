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
  FileSearch,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Info,
  Receipt,
  CreditCard,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Charge {
  id: string;
  type: 'rent' | 'penalty' | 'fee' | 'discount' | 'adjustment';
  description: string;
  amount: number;
  timestamp: string;
  ruleApplied?: string;
  ruleDetails?: string;
  relatedInvoice?: string;
  relatedPeriod?: string;
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  reference: string;
  timestamp: string;
  status: 'success' | 'pending' | 'failed' | 'refunded';
  appliedTo?: {
    chargeId: string;
    amount: number;
  }[];
  description?: string;
}

interface RuleApplication {
  ruleId: string;
  ruleName: string;
  ruleType: 'penalty' | 'discount' | 'fee' | 'adjustment';
  appliedAt: string;
  appliedTo: string; // Charge ID or payment ID
  parameters: Record<string, any>;
  result: {
    amount: number;
    description: string;
  };
}

interface AuditEvent {
  timestamp: string;
  type: 'charge' | 'payment' | 'rule' | 'adjustment';
  event: Charge | Payment | RuleApplication;
  description: string;
  amount?: number;
}

interface BillingAuditSummary {
  tenantInfo: {
    tenantId: string;
    tenantName: string;
    propertyId: string;
    propertyName: string;
  };
  summary: {
    totalCharges: number;
    totalPayments: number;
    totalPenalties: number;
    totalDiscounts: number;
    currentBalance: number;
    periodStart: string;
    periodEnd: string;
  };
  timeline: AuditEvent[];
  charges: Charge[];
  payments: Payment[];
  ruleApplications: RuleApplication[];
  narrative: string;
}

export function BillingAuditSummary() {
  const [tenantId, setTenantId] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [chargesJson, setChargesJson] = useState('');
  const [paymentsJson, setPaymentsJson] = useState('');
  const [rulesJson, setRulesJson] = useState('');
  const [summary, setSummary] = useState<BillingAuditSummary | null>(null);
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-NG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
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

  const generateAuditSummary = (): BillingAuditSummary | null => {
    if (!tenantId || !tenantName || !propertyId || !propertyName) {
      return null;
    }

    const charges = parseJson<Charge>(chargesJson);
    const payments = parseJson<Payment>(paymentsJson);
    const rules = parseJson<RuleApplication>(rulesJson);

    // Create timeline
    const timeline: AuditEvent[] = [];

    // Add charges to timeline
    charges.forEach((charge) => {
      timeline.push({
        timestamp: charge.timestamp,
        type: 'charge',
        event: charge,
        description: `${charge.type.toUpperCase()}: ${charge.description} - ${formatCurrency(charge.amount)}`,
        amount: charge.amount,
      });
    });

    // Add payments to timeline
    payments.forEach((payment) => {
      timeline.push({
        timestamp: payment.timestamp,
        type: 'payment',
        event: payment,
        description: `PAYMENT: ${formatCurrency(payment.amount)} via ${payment.method} (${payment.status})`,
        amount: -payment.amount,
      });
    });

    // Add rule applications to timeline
    rules.forEach((rule) => {
      timeline.push({
        timestamp: rule.appliedAt,
        type: 'rule',
        event: rule,
        description: `RULE APPLIED: ${rule.ruleName} - ${rule.result.description} (${formatCurrency(rule.result.amount)})`,
        amount: rule.result.amount,
      });
    });

    // Sort timeline by timestamp
    timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Calculate summary
    const totalCharges = charges
      .filter((c) => c.type !== 'discount')
      .reduce((sum, c) => sum + c.amount, 0);
    const totalPayments = payments
      .filter((p) => p.status === 'success')
      .reduce((sum, p) => sum + p.amount, 0);
    const totalPenalties = charges
      .filter((c) => c.type === 'penalty')
      .reduce((sum, c) => sum + c.amount, 0);
    const totalDiscounts = charges
      .filter((c) => c.type === 'discount')
      .reduce((sum, c) => sum + c.amount, 0);
    const currentBalance = totalCharges - totalPayments - totalDiscounts;

    // Find period dates
    const allDates = [
      ...charges.map((c) => c.timestamp),
      ...payments.map((p) => p.timestamp),
      ...rules.map((r) => r.appliedAt),
    ].sort();
    const periodStart = allDates[0] || new Date().toISOString();
    const periodEnd = allDates[allDates.length - 1] || new Date().toISOString();

    // Generate narrative
    let narrative = `Billing Audit Summary\n\n`;
    narrative += `Tenant: ${tenantName} (ID: ${tenantId})\n`;
    narrative += `Property: ${propertyName} (ID: ${propertyId})\n`;
    narrative += `Audit Period: ${formatDateTime(periodStart)} to ${formatDateTime(periodEnd)}\n\n`;

    narrative += `SUMMARY:\n`;
    narrative += `Total Charges: ${formatCurrency(totalCharges)}\n`;
    narrative += `Total Payments: ${formatCurrency(totalPayments)}\n`;
    narrative += `Total Penalties: ${formatCurrency(totalPenalties)}\n`;
    narrative += `Total Discounts: ${formatCurrency(totalDiscounts)}\n`;
    narrative += `Current Balance: ${formatCurrency(currentBalance)}\n\n`;

    narrative += `TIMELINE OF EVENTS:\n\n`;
    let runningBalance = 0;
    timeline.forEach((event, index) => {
      const eventTime = formatDateTime(event.timestamp);
      narrative += `${index + 1}. ${eventTime}\n`;
      narrative += `   ${event.description}\n`;

      if (event.type === 'charge') {
        const charge = event.event as Charge;
        runningBalance += charge.amount;
        narrative += `   Charge ID: ${charge.id}\n`;
        if (charge.ruleApplied) {
          narrative += `   Rule Applied: ${charge.ruleApplied}\n`;
          if (charge.ruleDetails) {
            narrative += `   Rule Details: ${charge.ruleDetails}\n`;
          }
        }
        if (charge.relatedInvoice) {
          narrative += `   Related Invoice: ${charge.relatedInvoice}\n`;
        }
        if (charge.relatedPeriod) {
          narrative += `   Period: ${charge.relatedPeriod}\n`;
        }
      } else if (event.type === 'payment') {
        const payment = event.event as Payment;
        runningBalance -= payment.amount;
        narrative += `   Payment ID: ${payment.id}\n`;
        narrative += `   Reference: ${payment.reference}\n`;
        narrative += `   Method: ${payment.method}\n`;
        narrative += `   Status: ${payment.status.toUpperCase()}\n`;
        if (payment.appliedTo && payment.appliedTo.length > 0) {
          narrative += `   Applied To:\n`;
          payment.appliedTo.forEach((app) => {
            narrative += `     - Charge ${app.chargeId}: ${formatCurrency(app.amount)}\n`;
          });
        }
      } else if (event.type === 'rule') {
        const rule = event.event as RuleApplication;
        narrative += `   Rule ID: ${rule.ruleId}\n`;
        narrative += `   Rule Type: ${rule.ruleType.toUpperCase()}\n`;
        narrative += `   Applied To: ${rule.appliedTo}\n`;
        narrative += `   Parameters: ${JSON.stringify(rule.parameters)}\n`;
        narrative += `   Result: ${rule.result.description}\n`;
      }

      narrative += `   Balance After Event: ${formatCurrency(runningBalance)}\n\n`;
    });

    narrative += `\nDETAILED BREAKDOWN:\n\n`;

    narrative += `CHARGES:\n`;
    charges.forEach((charge, index) => {
      narrative += `${index + 1}. ${charge.type.toUpperCase()}: ${charge.description}\n`;
      narrative += `   Amount: ${formatCurrency(charge.amount)}\n`;
      narrative += `   Timestamp: ${formatDateTime(charge.timestamp)}\n`;
      narrative += `   Charge ID: ${charge.id}\n`;
      if (charge.ruleApplied) {
        narrative += `   Rule: ${charge.ruleApplied}\n`;
      }
      narrative += `\n`;
    });

    narrative += `PAYMENTS:\n`;
    payments.forEach((payment, index) => {
      narrative += `${index + 1}. Payment ${payment.id}\n`;
      narrative += `   Amount: ${formatCurrency(payment.amount)}\n`;
      narrative += `   Method: ${payment.method}\n`;
      narrative += `   Reference: ${payment.reference}\n`;
      narrative += `   Status: ${payment.status.toUpperCase()}\n`;
      narrative += `   Timestamp: ${formatDateTime(payment.timestamp)}\n`;
      if (payment.appliedTo && payment.appliedTo.length > 0) {
        narrative += `   Applied To Charges:\n`;
        payment.appliedTo.forEach((app) => {
          narrative += `     - ${app.chargeId}: ${formatCurrency(app.amount)}\n`;
        });
      }
      narrative += `\n`;
    });

    narrative += `RULE APPLICATIONS:\n`;
    rules.forEach((rule, index) => {
      narrative += `${index + 1}. ${rule.ruleName}\n`;
      narrative += `   Type: ${rule.ruleType.toUpperCase()}\n`;
      narrative += `   Applied At: ${formatDateTime(rule.appliedAt)}\n`;
      narrative += `   Applied To: ${rule.appliedTo}\n`;
      narrative += `   Result: ${rule.result.description} (${formatCurrency(rule.result.amount)})\n`;
      narrative += `   Parameters: ${JSON.stringify(rule.parameters, null, 2)}\n`;
      narrative += `\n`;
    });

    return {
      tenantInfo: {
        tenantId,
        tenantName,
        propertyId,
        propertyName,
      },
      summary: {
        totalCharges,
        totalPayments,
        totalPenalties,
        totalDiscounts,
        currentBalance,
        periodStart,
        periodEnd,
      },
      timeline,
      charges,
      payments,
      ruleApplications: rules,
      narrative,
    };
  };

  const handleGenerate = () => {
    const result = generateAuditSummary();
    if (result) {
      setSummary(result);
      toast({
        title: 'Audit Summary Generated',
        description: 'Complete billing audit summary has been generated.',
      });
    } else {
      toast({
        title: 'Missing Information',
        description: 'Please fill in tenant and property information.',
        variant: 'destructive',
      });
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'charge':
        return <Receipt className="h-4 w-4 text-blue-500" />;
      case 'payment':
        return <CreditCard className="h-4 w-4 text-green-500" />;
      case 'rule':
        return <Info className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'charge':
        return 'bg-blue-50 border-blue-200';
      case 'payment':
        return 'bg-green-50 border-green-200';
      case 'rule':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getChargeTypeColor = (type: string) => {
    switch (type) {
      case 'rent':
        return 'bg-blue-100 text-blue-800';
      case 'penalty':
        return 'bg-red-100 text-red-800';
      case 'fee':
        return 'bg-yellow-100 text-yellow-800';
      case 'discount':
        return 'bg-green-100 text-green-800';
      case 'adjustment':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSearch className="h-5 w-5 text-blue-500" />
            Billing Audit Summary
          </CardTitle>
          <CardDescription>
            Generate a comprehensive billing audit summary with all charges, payments, rule
            applications, and timestamps to resolve disputes quickly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tenant Information */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Tenant & Property Information</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="tenantId">Tenant ID *</Label>
                <Input
                  id="tenantId"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  placeholder="tenant-123"
                />
              </div>
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
                <Label htmlFor="propertyId">Property ID *</Label>
                <Input
                  id="propertyId"
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  placeholder="prop-123"
                />
              </div>
              <div>
                <Label htmlFor="propertyName">Property Name *</Label>
                <Input
                  id="propertyName"
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  placeholder="123 Main Street, Lagos"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Charges */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Charges</h3>
            <Label htmlFor="chargesJson">Charges JSON *</Label>
            <Textarea
              id="chargesJson"
              value={chargesJson}
              onChange={(e) => setChargesJson(e.target.value)}
              placeholder='[{"id": "charge-1", "type": "rent", "description": "Annual rent 2024", "amount": 6000000, "timestamp": "2024-01-01T00:00:00Z", "ruleApplied": "Annual Rent Rule", "relatedPeriod": "2024"}, {"id": "charge-2", "type": "penalty", "description": "Late payment penalty", "amount": 300000, "timestamp": "2024-01-20T00:00:00Z", "ruleApplied": "Late Payment Penalty Rule", "ruleDetails": "5% penalty for 30+ days overdue"}]'
              className="mt-2 font-mono text-sm"
              rows={6}
            />
          </div>

          <Separator />

          {/* Payments */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Payments</h3>
            <Label htmlFor="paymentsJson">Payments JSON *</Label>
            <Textarea
              id="paymentsJson"
              value={paymentsJson}
              onChange={(e) => setPaymentsJson(e.target.value)}
              placeholder='[{"id": "pay-1", "amount": 3000000, "method": "Bank Transfer", "reference": "T123456", "timestamp": "2024-01-05T10:30:00Z", "status": "success", "appliedTo": [{"chargeId": "charge-1", "amount": 3000000}]}, {"id": "pay-2", "amount": 3300000, "method": "Flutterwave", "reference": "T789012", "timestamp": "2024-01-25T14:20:00Z", "status": "success", "appliedTo": [{"chargeId": "charge-1", "amount": 3000000}, {"chargeId": "charge-2", "amount": 300000}]}]'
              className="mt-2 font-mono text-sm"
              rows={6}
            />
          </div>

          <Separator />

          {/* Rule Applications */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Rule Applications (Optional)</h3>
            <Label htmlFor="rulesJson">Rule Applications JSON</Label>
            <Textarea
              id="rulesJson"
              value={rulesJson}
              onChange={(e) => setRulesJson(e.target.value)}
              placeholder='[{"ruleId": "rule-1", "ruleName": "Late Payment Penalty", "ruleType": "penalty", "appliedAt": "2024-01-20T00:00:00Z", "appliedTo": "charge-1", "parameters": {"daysOverdue": 30, "rate": 0.05}, "result": {"amount": 300000, "description": "5% penalty applied for 30 days overdue"}}]'
              className="mt-2 font-mono text-sm"
              rows={6}
            />
          </div>

          <Button onClick={handleGenerate} className="w-full" size="lg">
            <FileSearch className="mr-2 h-4 w-4" />
            Generate Audit Summary
          </Button>
        </CardContent>
      </Card>

      {/* Audit Summary Results */}
      {summary && (
        <>
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Audit Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm text-gray-600">Total Charges</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(summary.summary.totalCharges)}
                  </p>
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <p className="text-sm text-gray-600">Total Payments</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(summary.summary.totalPayments)}
                  </p>
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-gray-600">Total Penalties</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(summary.summary.totalPenalties)}
                  </p>
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <p className="text-sm text-gray-600">Total Discounts</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(summary.summary.totalDiscounts)}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm text-gray-600">Current Balance</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(summary.summary.currentBalance)}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm text-gray-600">Audit Period</p>
                  <p className="text-sm font-semibold">
                    {formatDateTime(summary.summary.periodStart)}
                  </p>
                  <p className="text-sm font-semibold">
                    to {formatDateTime(summary.summary.periodEnd)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Complete Timeline</CardTitle>
              <CardDescription>Chronological audit trail of all billing events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary.timeline.map((event, index) => {
                  const eventData = event.event;
                  return (
                    <div
                      key={index}
                      className={`rounded-lg border p-4 ${getEventColor(event.type)}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">{getEventIcon(event.type)}</div>
                        <div className="flex-1">
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{formatDateTime(event.timestamp)}</Badge>
                              <Badge
                                variant={
                                  event.type === 'payment'
                                    ? 'default'
                                    : event.type === 'charge'
                                      ? 'secondary'
                                      : 'outline'
                                }
                              >
                                {event.type.toUpperCase()}
                              </Badge>
                            </div>
                            {event.amount !== undefined && (
                              <p
                                className={`font-semibold ${
                                  event.amount < 0 ? 'text-green-600' : 'text-blue-600'
                                }`}
                              >
                                {event.amount < 0 ? '-' : '+'}
                                {formatCurrency(Math.abs(event.amount))}
                              </p>
                            )}
                          </div>
                          <p className="mb-2 font-medium">{event.description}</p>

                          {event.type === 'charge' && (
                            <div className="mt-2 space-y-1 text-sm">
                              <p>
                                <strong>Charge ID:</strong> {(eventData as Charge).id}
                              </p>
                              <p>
                                <strong>Type:</strong>{' '}
                                <Badge className={getChargeTypeColor((eventData as Charge).type)}>
                                  {(eventData as Charge).type.toUpperCase()}
                                </Badge>
                              </p>
                              {(eventData as Charge).ruleApplied && (
                                <p>
                                  <strong>Rule Applied:</strong> {(eventData as Charge).ruleApplied}
                                </p>
                              )}
                              {(eventData as Charge).ruleDetails && (
                                <p>
                                  <strong>Rule Details:</strong> {(eventData as Charge).ruleDetails}
                                </p>
                              )}
                              {(eventData as Charge).relatedPeriod && (
                                <p>
                                  <strong>Period:</strong> {(eventData as Charge).relatedPeriod}
                                </p>
                              )}
                            </div>
                          )}

                          {event.type === 'payment' && (
                            <div className="mt-2 space-y-1 text-sm">
                              <p>
                                <strong>Payment ID:</strong> {(eventData as Payment).id}
                              </p>
                              <p>
                                <strong>Reference:</strong> {(eventData as Payment).reference}
                              </p>
                              <p>
                                <strong>Method:</strong> {(eventData as Payment).method}
                              </p>
                              <p>
                                <strong>Status:</strong>{' '}
                                <Badge
                                  className={getPaymentStatusColor((eventData as Payment).status)}
                                >
                                  {(eventData as Payment).status.toUpperCase()}
                                </Badge>
                              </p>
                              {(eventData as Payment).appliedTo &&
                                (eventData as Payment).appliedTo!.length > 0 && (
                                  <div className="mt-2">
                                    <p className="font-semibold">Applied To Charges:</p>
                                    <ul className="list-inside list-disc space-y-1">
                                      {(eventData as Payment).appliedTo!.map((app, idx) => (
                                        <li key={idx}>
                                          Charge {app.chargeId}: {formatCurrency(app.amount)}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                            </div>
                          )}

                          {event.type === 'rule' && (
                            <div className="mt-2 space-y-1 text-sm">
                              <p>
                                <strong>Rule ID:</strong> {(eventData as RuleApplication).ruleId}
                              </p>
                              <p>
                                <strong>Rule Name:</strong>{' '}
                                {(eventData as RuleApplication).ruleName}
                              </p>
                              <p>
                                <strong>Rule Type:</strong>{' '}
                                {(eventData as RuleApplication).ruleType.toUpperCase()}
                              </p>
                              <p>
                                <strong>Applied To:</strong>{' '}
                                {(eventData as RuleApplication).appliedTo}
                              </p>
                              <p>
                                <strong>Result:</strong>{' '}
                                {(eventData as RuleApplication).result.description}
                              </p>
                              <details className="mt-2">
                                <summary className="cursor-pointer font-semibold">
                                  Rule Parameters
                                </summary>
                                <pre className="mt-2 overflow-auto rounded bg-gray-100 p-2 text-xs">
                                  {JSON.stringify(
                                    (eventData as RuleApplication).parameters,
                                    null,
                                    2
                                  )}
                                </pre>
                              </details>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Charges */}
              {summary.charges.length > 0 && (
                <div>
                  <h4 className="mb-3 font-semibold">All Charges</h4>
                  <div className="space-y-2">
                    {summary.charges.map((charge) => (
                      <div key={charge.id} className="rounded-lg border bg-gray-50 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={getChargeTypeColor(charge.type)}>
                              {charge.type.toUpperCase()}
                            </Badge>
                            <span className="font-semibold">{charge.description}</span>
                          </div>
                          <span className="font-bold">{formatCurrency(charge.amount)}</span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>
                            <strong>Timestamp:</strong> {formatDateTime(charge.timestamp)}
                          </p>
                          <p>
                            <strong>Charge ID:</strong> {charge.id}
                          </p>
                          {charge.ruleApplied && (
                            <p>
                              <strong>Rule:</strong> {charge.ruleApplied}
                            </p>
                          )}
                          {charge.relatedPeriod && (
                            <p>
                              <strong>Period:</strong> {charge.relatedPeriod}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payments */}
              {summary.payments.length > 0 && (
                <div>
                  <h4 className="mb-3 font-semibold">All Payments</h4>
                  <div className="space-y-2">
                    {summary.payments.map((payment) => (
                      <div key={payment.id} className="rounded-lg border bg-gray-50 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={getPaymentStatusColor(payment.status)}>
                              {payment.status.toUpperCase()}
                            </Badge>
                            <span className="font-semibold">
                              {payment.method} - {payment.reference}
                            </span>
                          </div>
                          <span className="font-bold text-green-600">
                            {formatCurrency(payment.amount)}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>
                            <strong>Timestamp:</strong> {formatDateTime(payment.timestamp)}
                          </p>
                          <p>
                            <strong>Payment ID:</strong> {payment.id}
                          </p>
                          {payment.appliedTo && payment.appliedTo.length > 0 && (
                            <div className="mt-2">
                              <p className="font-semibold">Applied To:</p>
                              <ul className="list-inside list-disc">
                                {payment.appliedTo.map((app, idx) => (
                                  <li key={idx}>
                                    Charge {app.chargeId}: {formatCurrency(app.amount)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rule Applications */}
              {summary.ruleApplications.length > 0 && (
                <div>
                  <h4 className="mb-3 font-semibold">All Rule Applications</h4>
                  <div className="space-y-2">
                    {summary.ruleApplications.map((rule) => (
                      <div key={rule.ruleId} className="rounded-lg border bg-gray-50 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <div>
                            <span className="font-semibold">{rule.ruleName}</span>
                            <Badge variant="outline" className="ml-2">
                              {rule.ruleType.toUpperCase()}
                            </Badge>
                          </div>
                          <span className="font-bold">{formatCurrency(rule.result.amount)}</span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>
                            <strong>Applied At:</strong> {formatDateTime(rule.appliedAt)}
                          </p>
                          <p>
                            <strong>Applied To:</strong> {rule.appliedTo}
                          </p>
                          <p>
                            <strong>Result:</strong> {rule.result.description}
                          </p>
                          <details className="mt-2">
                            <summary className="cursor-pointer font-semibold">Parameters</summary>
                            <pre className="mt-2 overflow-auto rounded bg-gray-100 p-2 text-xs">
                              {JSON.stringify(rule.parameters, null, 2)}
                            </pre>
                          </details>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Narrative Report */}
          <Card>
            <CardHeader>
              <CardTitle>Complete Audit Report</CardTitle>
              <CardDescription>
                Full narrative report in text format for dispute resolution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={summary.narrative}
                readOnly
                className="whitespace-pre-wrap font-mono text-sm"
                rows={40}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
