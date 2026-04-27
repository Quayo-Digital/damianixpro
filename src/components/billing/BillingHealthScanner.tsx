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
  Activity,
  AlertTriangle,
  TrendingDown,
  Users,
  Building2,
  CreditCard,
  Lightbulb,
  CheckCircle,
  XCircle,
  BarChart3,
} from 'lucide-react';

interface TenantPaymentData {
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyName: string;
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  averageDaysLate: number;
  totalArrears: number;
  lastPaymentDate?: string;
  daysSinceLastPayment?: number;
  paymentHistory: {
    date: string;
    amount: number;
    status: 'success' | 'failed';
    daysLate: number;
  }[];
}

interface PropertyBillingData {
  propertyId: string;
  propertyName: string;
  ownerId: string;
  ownerName?: string;
  totalExpectedRent: number;
  totalCollectedRent: number;
  totalArrears: number;
  tenantCount: number;
  occupancyRate: number;
  collectionRate: number;
  averageDaysOverdue: number;
}

interface PaymentChannelData {
  channel: 'card' | 'bank_transfer' | 'ussd' | 'other';
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  successRate: number;
  totalAmount: number;
  averageAmount: number;
}

interface BillingHealthScan {
  summary: {
    totalTenants: number;
    totalProperties: number;
    totalRevenue: number;
    totalArrears: number;
    overallCollectionRate: number;
    overallFailureRate: number;
  };
  highFailureRates: {
    tenant?: TenantPaymentData;
    property?: PropertyBillingData;
    channel?: PaymentChannelData;
    failureRate: number;
    issue: string;
    severity: 'critical' | 'high' | 'medium';
  }[];
  chronicDelays: {
    tenant: TenantPaymentData;
    averageDaysLate: number;
    missedPayments: number;
    totalArrears: number;
    severity: 'critical' | 'high' | 'medium';
  }[];
  unusualArrears: {
    property: PropertyBillingData;
    arrearsAmount: number;
    arrearsPercentage: number;
    collectionRate: number;
    severity: 'critical' | 'high' | 'medium';
  }[];
  channelPerformance: {
    channel: PaymentChannelData;
    performance: 'excellent' | 'good' | 'poor' | 'critical';
    issues: string[];
  }[];
  correctiveActions: {
    action: string;
    priority: 'high' | 'medium' | 'low';
    target: string;
    description: string;
    expectedImpact: string;
  }[];
  narrative: string;
}

export function BillingHealthScanner() {
  const [tenantsJson, setTenantsJson] = useState('');
  const [propertiesJson, setPropertiesJson] = useState('');
  const [channelsJson, setChannelsJson] = useState('');
  const [scan, setScan] = useState<BillingHealthScan | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
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

  const scanBillingHealth = (): BillingHealthScan | null => {
    const tenants = parseJson<TenantPaymentData>(tenantsJson);
    const properties = parseJson<PropertyBillingData>(propertiesJson);
    const channels = parseJson<PaymentChannelData>(channelsJson);

    if (tenants.length === 0 && properties.length === 0 && channels.length === 0) {
      return null;
    }

    // Calculate summary
    const totalTenants = tenants.length;
    const totalProperties = properties.length;
    const totalRevenue = properties.reduce((sum, p) => sum + p.totalCollectedRent, 0);
    const totalArrears = properties.reduce((sum, p) => sum + p.totalArrears, 0);
    const totalExpected = properties.reduce((sum, p) => sum + p.totalExpectedRent, 0);
    const overallCollectionRate = totalExpected > 0 ? (totalRevenue / totalExpected) * 100 : 0;

    // Calculate overall failure rate
    const totalPaymentAttempts = tenants.reduce((sum, t) => sum + t.totalPayments, 0);
    const totalFailedPayments = tenants.reduce((sum, t) => sum + t.failedPayments, 0);
    const overallFailureRate =
      totalPaymentAttempts > 0 ? (totalFailedPayments / totalPaymentAttempts) * 100 : 0;

    // Identify high failure rates
    const highFailureRates: BillingHealthScan['highFailureRates'] = [];

    // Tenant failure rates
    tenants.forEach((tenant) => {
      if (tenant.totalPayments > 0) {
        const failureRate = (tenant.failedPayments / tenant.totalPayments) * 100;
        if (failureRate > 30) {
          let severity: 'critical' | 'high' | 'medium' = 'medium';
          if (failureRate > 60) severity = 'critical';
          else if (failureRate > 40) severity = 'high';

          highFailureRates.push({
            tenant,
            failureRate,
            issue: `Tenant has ${formatPercentage(failureRate)} payment failure rate (${tenant.failedPayments} of ${tenant.totalPayments} payments failed)`,
            severity,
          });
        }
      }
    });

    // Property failure rates (based on collection rate)
    properties.forEach((property) => {
      const failureRate = 100 - property.collectionRate;
      if (failureRate > 30) {
        let severity: 'critical' | 'high' | 'medium' = 'medium';
        if (failureRate > 60) severity = 'critical';
        else if (failureRate > 40) severity = 'high';

        highFailureRates.push({
          property,
          failureRate,
          issue: `Property has ${formatPercentage(failureRate)} collection failure rate (only ${formatPercentage(property.collectionRate)} collected)`,
          severity,
        });
      }
    });

    // Channel failure rates
    channels.forEach((channel) => {
      const failureRate = 100 - channel.successRate;
      if (failureRate > 20) {
        let severity: 'critical' | 'high' | 'medium' = 'medium';
        if (failureRate > 40) severity = 'critical';
        else if (failureRate > 30) severity = 'high';

        highFailureRates.push({
          channel,
          failureRate,
          issue: `${channel.channel} payment channel has ${formatPercentage(failureRate)} failure rate (${channel.failedAttempts} of ${channel.totalAttempts} attempts failed)`,
          severity,
        });
      }
    });

    // Identify chronic delays
    const chronicDelays: BillingHealthScan['chronicDelays'] = [];
    tenants.forEach((tenant) => {
      if (tenant.averageDaysLate > 15 || tenant.totalArrears > 0) {
        const missedPayments = tenant.paymentHistory.filter(
          (p) => p.status === 'failed' || p.daysLate > 30
        ).length;

        let severity: 'critical' | 'high' | 'medium' = 'medium';
        if (tenant.averageDaysLate > 60 || tenant.totalArrears > 1000000) {
          severity = 'critical';
        } else if (tenant.averageDaysLate > 30 || tenant.totalArrears > 500000) {
          severity = 'high';
        }

        chronicDelays.push({
          tenant,
          averageDaysLate: tenant.averageDaysLate,
          missedPayments,
          totalArrears: tenant.totalArrears,
          severity,
        });
      }
    });

    // Identify unusual arrears
    const unusualArrears: BillingHealthScan['unusualArrears'] = [];
    properties.forEach((property) => {
      if (property.totalArrears > 0) {
        const arrearsPercentage = (property.totalArrears / property.totalExpectedRent) * 100;

        let severity: 'critical' | 'high' | 'medium' = 'medium';
        if (
          arrearsPercentage > 50 ||
          property.totalArrears > 5000000 ||
          property.collectionRate < 50
        ) {
          severity = 'critical';
        } else if (
          arrearsPercentage > 30 ||
          property.totalArrears > 2000000 ||
          property.collectionRate < 70
        ) {
          severity = 'high';
        }

        unusualArrears.push({
          property,
          arrearsAmount: property.totalArrears,
          arrearsPercentage,
          collectionRate: property.collectionRate,
          severity,
        });
      }
    });

    // Analyze channel performance
    const channelPerformance: BillingHealthScan['channelPerformance'] = channels.map((channel) => {
      let performance: 'excellent' | 'good' | 'poor' | 'critical' = 'good';
      const issues: string[] = [];

      if (channel.successRate >= 95) {
        performance = 'excellent';
      } else if (channel.successRate >= 85) {
        performance = 'good';
      } else if (channel.successRate >= 70) {
        performance = 'poor';
        issues.push(`Success rate of ${formatPercentage(channel.successRate)} is below target`);
      } else {
        performance = 'critical';
        issues.push(
          `Critical: Success rate of ${formatPercentage(channel.successRate)} needs immediate attention`
        );
      }

      if (channel.failedAttempts > channel.successfulAttempts) {
        issues.push('More failures than successes - investigate channel issues');
      }

      if (channel.totalAttempts < 10 && channel.failedAttempts > 0) {
        issues.push('Low sample size but failures detected - monitor closely');
      }

      return {
        channel,
        performance,
        issues,
      };
    });

    // Generate corrective actions
    const correctiveActions: BillingHealthScan['correctiveActions'] = [];

    // Actions for high failure rates
    highFailureRates.forEach((issue) => {
      if (issue.tenant) {
        correctiveActions.push({
          action: `Contact ${issue.tenant.tenantName} about payment issues`,
          priority: issue.severity === 'critical' ? 'high' : 'medium',
          target: `Tenant: ${issue.tenant.tenantName}`,
          description: `Tenant has ${formatPercentage(issue.failureRate)} payment failure rate. Review payment method, verify account details, and offer alternative payment options.`,
          expectedImpact: 'Reduce payment failures and improve collection rate',
        });
      } else if (issue.property) {
        correctiveActions.push({
          action: `Review payment collection process for ${issue.property.propertyName}`,
          priority: issue.severity === 'critical' ? 'high' : 'medium',
          target: `Property: ${issue.property.propertyName}`,
          description: `Property has low collection rate. Review tenant payment terms, consider payment plans, and improve communication.`,
          expectedImpact: 'Increase collection rate and reduce arrears',
        });
      } else if (issue.channel) {
        correctiveActions.push({
          action: `Investigate ${issue.channel.channel} payment channel issues`,
          priority: issue.severity === 'critical' ? 'high' : 'medium',
          target: `Payment Channel: ${issue.channel.channel}`,
          description: `Payment channel has high failure rate. Check integration status, verify API credentials, and review error logs.`,
          expectedImpact: 'Improve payment success rate and user experience',
        });
      }
    });

    // Actions for chronic delays
    chronicDelays.forEach((delay) => {
      correctiveActions.push({
        action: `Implement payment plan for ${delay.tenant.tenantName}`,
        priority: delay.severity === 'critical' ? 'high' : 'medium',
        target: `Tenant: ${delay.tenant.tenantName}`,
        description: `Tenant has chronic payment delays (average ${delay.averageDaysLate.toFixed(0)} days late) with ${formatCurrency(delay.totalArrears)} in arrears. Consider payment plan or early intervention.`,
        expectedImpact: 'Reduce arrears and improve payment consistency',
      });
    });

    // Actions for unusual arrears
    unusualArrears.forEach((arrears) => {
      correctiveActions.push({
        action: `Urgent collection action for ${arrears.property.propertyName}`,
        priority: arrears.severity === 'critical' ? 'high' : 'medium',
        target: `Property: ${arrears.property.propertyName}`,
        description: `Property has ${formatCurrency(arrears.arrearsAmount)} in arrears (${formatPercentage(arrears.arrearsPercentage)} of expected rent). Collection rate is ${formatPercentage(arrears.collectionRate)}. Immediate action required.`,
        expectedImpact: 'Recover outstanding amounts and improve cash flow',
      });
    });

    // Actions for poor channel performance
    channelPerformance
      .filter((cp) => cp.performance === 'poor' || cp.performance === 'critical')
      .forEach((cp) => {
        correctiveActions.push({
          action: `Fix ${cp.channel.channel} payment channel`,
          priority: cp.performance === 'critical' ? 'high' : 'medium',
          target: `Payment Channel: ${cp.channel.channel}`,
          description: `${cp.channel.channel} channel has ${formatPercentage(cp.channel.successRate)} success rate. ${cp.issues.join(' ')}`,
          expectedImpact: 'Improve payment success rate and reduce customer frustration',
        });
      });

    // General recommendations
    if (overallCollectionRate < 80) {
      correctiveActions.push({
        action: 'System-wide collection improvement initiative',
        priority: 'high',
        target: 'All Properties',
        description: `Overall collection rate is ${formatPercentage(overallCollectionRate)}, below the 80% target. Implement system-wide payment reminders, review payment terms, and improve tenant communication.`,
        expectedImpact: 'Increase overall collection rate and reduce arrears',
      });
    }

    if (overallFailureRate > 15) {
      correctiveActions.push({
        action: 'Review payment processing system',
        priority: 'high',
        target: 'Payment System',
        description: `Overall payment failure rate is ${formatPercentage(overallFailureRate)}, which is high. Review payment gateway integration, verify account details, and improve error handling.`,
        expectedImpact: 'Reduce payment failures and improve user experience',
      });
    }

    // Generate narrative
    let narrative = `Billing Health Scan Report\n\n`;
    narrative += `SUMMARY:\n`;
    narrative += `Total Tenants: ${totalTenants}\n`;
    narrative += `Total Properties: ${totalProperties}\n`;
    narrative += `Total Revenue Collected: ${formatCurrency(totalRevenue)}\n`;
    narrative += `Total Arrears: ${formatCurrency(totalArrears)}\n`;
    narrative += `Overall Collection Rate: ${formatPercentage(overallCollectionRate)}\n`;
    narrative += `Overall Payment Failure Rate: ${formatPercentage(overallFailureRate)}\n\n`;

    if (highFailureRates.length > 0) {
      narrative += `HIGH FAILURE RATES DETECTED:\n\n`;
      highFailureRates.forEach((issue, index) => {
        narrative += `${index + 1}. ${issue.issue}\n`;
        narrative += `   Severity: ${issue.severity.toUpperCase()}\n`;
        narrative += `   Failure Rate: ${formatPercentage(issue.failureRate)}\n\n`;
      });
    }

    if (chronicDelays.length > 0) {
      narrative += `TENANTS WITH CHRONIC DELAYS:\n\n`;
      chronicDelays.forEach((delay, index) => {
        narrative += `${index + 1}. ${delay.tenant.tenantName} (${delay.tenant.propertyName})\n`;
        narrative += `   Average Days Late: ${delay.averageDaysLate.toFixed(0)} days\n`;
        narrative += `   Total Arrears: ${formatCurrency(delay.totalArrears)}\n`;
        narrative += `   Missed Payments: ${delay.missedPayments}\n`;
        narrative += `   Severity: ${delay.severity.toUpperCase()}\n\n`;
      });
    }

    if (unusualArrears.length > 0) {
      narrative += `PROPERTIES WITH UNUSUAL ARREARS:\n\n`;
      unusualArrears.forEach((arrears, index) => {
        narrative += `${index + 1}. ${arrears.property.propertyName}\n`;
        narrative += `   Arrears Amount: ${formatCurrency(arrears.arrearsAmount)}\n`;
        narrative += `   Arrears Percentage: ${formatPercentage(arrears.arrearsPercentage)}\n`;
        narrative += `   Collection Rate: ${formatPercentage(arrears.collectionRate)}\n`;
        narrative += `   Severity: ${arrears.severity.toUpperCase()}\n\n`;
      });
    }

    if (channelPerformance.length > 0) {
      narrative += `PAYMENT CHANNEL PERFORMANCE:\n\n`;
      channelPerformance.forEach((cp, index) => {
        narrative += `${index + 1}. ${cp.channel.channel.toUpperCase()}\n`;
        narrative += `   Success Rate: ${formatPercentage(cp.channel.successRate)}\n`;
        narrative += `   Performance: ${cp.performance.toUpperCase()}\n`;
        narrative += `   Total Attempts: ${cp.channel.totalAttempts}\n`;
        narrative += `   Successful: ${cp.channel.successfulAttempts}\n`;
        narrative += `   Failed: ${cp.channel.failedAttempts}\n`;
        if (cp.issues.length > 0) {
          narrative += `   Issues: ${cp.issues.join(', ')}\n`;
        }
        narrative += `\n`;
      });
    }

    narrative += `CORRECTIVE ACTIONS:\n\n`;
    correctiveActions.forEach((action, index) => {
      narrative += `${index + 1}. [${action.priority.toUpperCase()}] ${action.action}\n`;
      narrative += `   Target: ${action.target}\n`;
      narrative += `   Description: ${action.description}\n`;
      narrative += `   Expected Impact: ${action.expectedImpact}\n\n`;
    });

    return {
      summary: {
        totalTenants,
        totalProperties,
        totalRevenue,
        totalArrears,
        overallCollectionRate,
        overallFailureRate,
      },
      highFailureRates,
      chronicDelays,
      unusualArrears,
      channelPerformance,
      correctiveActions,
      narrative,
    };
  };

  const handleScan = () => {
    const result = scanBillingHealth();
    if (result) {
      setScan(result);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'poor':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Billing Health Scanner
          </CardTitle>
          <CardDescription>
            Scan system-wide billing data to identify high failure rates, chronic delays, unusual
            arrears, and payment channel performance issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tenant Data */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Tenant Payment Data</h3>
            <Label htmlFor="tenantsJson">Tenants JSON *</Label>
            <Textarea
              id="tenantsJson"
              value={tenantsJson}
              onChange={(e) => setTenantsJson(e.target.value)}
              placeholder='[{"tenantId": "t-1", "tenantName": "John Doe", "propertyId": "p-1", "propertyName": "Lagos Apartment", "totalPayments": 10, "successfulPayments": 7, "failedPayments": 3, "averageDaysLate": 25, "totalArrears": 500000, "paymentHistory": [{"date": "2024-01-05", "amount": 500000, "status": "success", "daysLate": 5}]}]'
              className="mt-2 font-mono text-sm"
              rows={6}
            />
          </div>

          <Separator />

          {/* Property Data */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Property Billing Data</h3>
            <Label htmlFor="propertiesJson">Properties JSON *</Label>
            <Textarea
              id="propertiesJson"
              value={propertiesJson}
              onChange={(e) => setPropertiesJson(e.target.value)}
              placeholder='[{"propertyId": "p-1", "propertyName": "Lagos Apartment", "ownerId": "o-1", "totalExpectedRent": 6000000, "totalCollectedRent": 4500000, "totalArrears": 1500000, "tenantCount": 1, "occupancyRate": 1.0, "collectionRate": 75, "averageDaysOverdue": 30}]'
              className="mt-2 font-mono text-sm"
              rows={6}
            />
          </div>

          <Separator />

          {/* Channel Data */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Payment Channel Data</h3>
            <Label htmlFor="channelsJson">Channels JSON</Label>
            <Textarea
              id="channelsJson"
              value={channelsJson}
              onChange={(e) => setChannelsJson(e.target.value)}
              placeholder='[{"channel": "card", "totalAttempts": 100, "successfulAttempts": 85, "failedAttempts": 15, "successRate": 85, "totalAmount": 50000000, "averageAmount": 500000}, {"channel": "ussd", "totalAttempts": 50, "successfulAttempts": 45, "failedAttempts": 5, "successRate": 90, "totalAmount": 25000000, "averageAmount": 500000}]'
              className="mt-2 font-mono text-sm"
              rows={6}
            />
          </div>

          <Button onClick={handleScan} className="w-full" size="lg">
            <Activity className="mr-2 h-4 w-4" />
            Scan Billing Health
          </Button>
        </CardContent>
      </Card>

      {/* Scan Results */}
      {scan && (
        <>
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>System-Wide Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm text-gray-600">Total Tenants</p>
                  <p className="text-2xl font-bold text-blue-600">{scan.summary.totalTenants}</p>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm text-gray-600">Total Properties</p>
                  <p className="text-2xl font-bold text-blue-600">{scan.summary.totalProperties}</p>
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(scan.summary.totalRevenue)}
                  </p>
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-gray-600">Total Arrears</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(scan.summary.totalArrears)}
                  </p>
                </div>
                <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                  <p className="text-sm text-gray-600">Collection Rate</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatPercentage(scan.summary.overallCollectionRate)}
                  </p>
                </div>
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                  <p className="text-sm text-gray-600">Failure Rate</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatPercentage(scan.summary.overallFailureRate)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* High Failure Rates */}
          {scan.highFailureRates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  High Failure Rates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {scan.highFailureRates.map((issue, index) => (
                    <Alert key={index} className={getSeverityColor(issue.severity)}>
                      <AlertTriangle className="h-5 w-5" />
                      <AlertTitle className="flex items-center gap-2">
                        {issue.issue}
                        <Badge variant="outline">{issue.severity.toUpperCase()}</Badge>
                      </AlertTitle>
                      <AlertDescription className="mt-2">
                        <p>
                          <strong>Failure Rate:</strong> {formatPercentage(issue.failureRate)}
                        </p>
                        {issue.tenant && (
                          <div className="mt-2 space-y-1 text-sm">
                            <p>
                              <strong>Tenant:</strong> {issue.tenant.tenantName}
                            </p>
                            <p>
                              <strong>Property:</strong> {issue.tenant.propertyName}
                            </p>
                            <p>
                              <strong>Failed Payments:</strong> {issue.tenant.failedPayments} of{' '}
                              {issue.tenant.totalPayments}
                            </p>
                          </div>
                        )}
                        {issue.property && (
                          <div className="mt-2 space-y-1 text-sm">
                            <p>
                              <strong>Property:</strong> {issue.property.propertyName}
                            </p>
                            <p>
                              <strong>Collection Rate:</strong>{' '}
                              {formatPercentage(issue.property.collectionRate)}
                            </p>
                            <p>
                              <strong>Arrears:</strong>{' '}
                              {formatCurrency(issue.property.totalArrears)}
                            </p>
                          </div>
                        )}
                        {issue.channel && (
                          <div className="mt-2 space-y-1 text-sm">
                            <p>
                              <strong>Channel:</strong> {issue.channel.channel}
                            </p>
                            <p>
                              <strong>Failed Attempts:</strong> {issue.channel.failedAttempts} of{' '}
                              {issue.channel.totalAttempts}
                            </p>
                            <p>
                              <strong>Success Rate:</strong>{' '}
                              {formatPercentage(issue.channel.successRate)}
                            </p>
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chronic Delays */}
          {scan.chronicDelays.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-orange-500" />
                  Tenants with Chronic Delays
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {scan.chronicDelays.map((delay, index) => (
                    <div
                      key={index}
                      className={`rounded-lg border p-4 ${getSeverityColor(delay.severity)}`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{delay.tenant.tenantName}</h4>
                          <p className="text-sm text-gray-600">{delay.tenant.propertyName}</p>
                        </div>
                        <Badge variant="outline">{delay.severity.toUpperCase()}</Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Average Days Late</p>
                          <p className="font-semibold">{delay.averageDaysLate.toFixed(0)} days</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Arrears</p>
                          <p className="font-semibold text-red-600">
                            {formatCurrency(delay.totalArrears)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Missed Payments</p>
                          <p className="font-semibold">{delay.missedPayments}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Success Rate</p>
                          <p className="font-semibold">
                            {formatPercentage(
                              (delay.tenant.successfulPayments / delay.tenant.totalPayments) * 100
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Unusual Arrears */}
          {scan.unusualArrears.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-red-500" />
                  Properties with Unusual Arrears
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {scan.unusualArrears.map((arrears, index) => (
                    <div
                      key={index}
                      className={`rounded-lg border p-4 ${getSeverityColor(arrears.severity)}`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{arrears.property.propertyName}</h4>
                          <p className="text-sm text-gray-600">
                            {arrears.property.tenantCount} tenant(s)
                          </p>
                        </div>
                        <Badge variant="outline">{arrears.severity.toUpperCase()}</Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Arrears Amount</p>
                          <p className="font-semibold text-red-600">
                            {formatCurrency(arrears.arrearsAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Arrears Percentage</p>
                          <p className="font-semibold">
                            {formatPercentage(arrears.arrearsPercentage)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Collection Rate</p>
                          <p className="font-semibold">
                            {formatPercentage(arrears.collectionRate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Expected Rent</p>
                          <p className="font-semibold">
                            {formatCurrency(arrears.property.totalExpectedRent)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Channel Performance */}
          {scan.channelPerformance.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-500" />
                  Payment Channel Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {scan.channelPerformance.map((cp, index) => (
                    <div key={index} className="rounded-lg border bg-gray-50 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-semibold">
                            {cp.channel.channel.toUpperCase()}
                          </h4>
                          <Badge className={getPerformanceColor(cp.performance)}>
                            {cp.performance.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-2xl font-bold">
                          {formatPercentage(cp.channel.successRate)}
                        </p>
                      </div>
                      <div className="mb-3 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Total Attempts</p>
                          <p className="font-semibold">{cp.channel.totalAttempts}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Successful</p>
                          <p className="font-semibold text-green-600">
                            {cp.channel.successfulAttempts}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Failed</p>
                          <p className="font-semibold text-red-600">{cp.channel.failedAttempts}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Amount</p>
                          <p className="font-semibold">{formatCurrency(cp.channel.totalAmount)}</p>
                        </div>
                      </div>
                      {cp.issues.length > 0 && (
                        <Alert className="border-yellow-200 bg-yellow-50">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          <AlertTitle>Issues Detected</AlertTitle>
                          <AlertDescription className="mt-2">
                            <ul className="list-inside list-disc space-y-1">
                              {cp.issues.map((issue, idx) => (
                                <li key={idx}>{issue}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Corrective Actions */}
          {scan.correctiveActions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-blue-500" />
                  Corrective Actions
                </CardTitle>
                <CardDescription>Prioritized actions to improve billing health</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {scan.correctiveActions.map((action, index) => (
                    <div key={index} className="rounded-lg border bg-gray-50 p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <h4 className="font-semibold">{action.action}</h4>
                            <Badge
                              variant={
                                action.priority === 'high'
                                  ? 'destructive'
                                  : action.priority === 'medium'
                                    ? 'secondary'
                                    : 'outline'
                              }
                            >
                              {action.priority.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="mb-2 text-sm text-gray-600">
                            <strong>Target:</strong> {action.target}
                          </p>
                          <p className="mb-2 text-sm">{action.description}</p>
                          <p className="text-sm font-medium text-blue-600">
                            <strong>Expected Impact:</strong> {action.expectedImpact}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Narrative Report */}
          <Card>
            <CardHeader>
              <CardTitle>Complete Health Scan Report</CardTitle>
              <CardDescription>Full narrative report in text format</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={scan.narrative}
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
