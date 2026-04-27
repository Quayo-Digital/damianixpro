import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  TrendingDown,
  DollarSign,
  Calendar,
  Building,
  Activity,
  Info,
  CheckCircle,
} from 'lucide-react';

interface PropertyData {
  propertyId: string;
  propertyName: string;
  annualRent: number;
  paymentHistory: {
    month: string;
    paid: boolean;
    daysLate: number;
    amount: number;
  }[];
  maintenanceHistory: {
    month: string;
    cost: number;
    type: string;
  }[];
  vacancyHistory: {
    month: string;
    vacant: boolean;
    daysVacant: number;
  }[];
}

interface Anomaly {
  type: 'Rent Delay' | 'Maintenance Spike' | 'Vacancy Anomaly';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  title: string;
  description: string;
  whyItMatters: string;
  impact: string;
  recommendation: string;
  detectedValue: string;
  expectedValue: string;
}

export function PropertyAnomalyDetector() {
  const [propertyName, setPropertyName] = useState('');
  const [annualRent, setAnnualRent] = useState('');
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [paymentData, setPaymentData] = useState('');
  const [maintenanceData, setMaintenanceData] = useState('');
  const [vacancyData, setVacancyData] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const detectAnomalies = (): Anomaly[] => {
    const detected: Anomaly[] = [];

    // Parse payment history
    let payments: { month: string; paid: boolean; daysLate: number; amount: number }[] = [];
    try {
      if (paymentData) {
        payments = JSON.parse(paymentData);
      }
    } catch (e) {
      // If not JSON, try to parse as simple format
      // For now, we'll work with empty array
    }

    // Parse maintenance history
    let maintenance: { month: string; cost: number; type: string }[] = [];
    try {
      if (maintenanceData) {
        maintenance = JSON.parse(maintenanceData);
      }
    } catch (e) {
      // If not JSON, try to parse as simple format
    }

    // Parse vacancy history
    let vacancies: { month: string; vacant: boolean; daysVacant: number }[] = [];
    try {
      if (vacancyData) {
        vacancies = JSON.parse(vacancyData);
      }
    } catch (e) {
      // If not JSON, try to parse as simple format
    }

    const annualRentValue = parseFloat(annualRent.replace(/,/g, '')) || 0;
    const monthlyRentEquivalent = annualRentValue / 12;
    const dailyRentEquivalent = annualRentValue / 365;

    // DETECT RENT DELAY ANOMALIES
    if (payments.length > 0) {
      // Calculate average days late
      const latePayments = payments.filter((p) => p.daysLate > 0);
      const avgDaysLate =
        latePayments.length > 0
          ? latePayments.reduce((sum, p) => sum + p.daysLate, 0) / latePayments.length
          : 0;

      // Check for sudden increase in late payments
      const recentPayments = payments.slice(-3);
      const olderPayments = payments.slice(0, -3);

      const recentLateCount = recentPayments.filter((p) => p.daysLate > 7).length;
      const olderLateCount =
        olderPayments.length > 0
          ? olderPayments.filter((p) => p.daysLate > 7).length / olderPayments.length
          : 0;

      if (recentLateCount > 0 && recentLateCount > olderLateCount * 2) {
        detected.push({
          type: 'Rent Delay',
          severity: 'High',
          title: 'Sudden Increase in Late Rent Payments',
          description: `This property has had ${recentLateCount} late payment(s) in the last 3 months, which is significantly higher than the historical average.`,
          whyItMatters:
            'Late payments indicate tenant financial stress, potential cash flow problems, or dissatisfaction with the property. If this pattern continues, you may face difficulty collecting rent or need to find new tenants.',
          impact: `Each late payment delays your income by the number of days late. If annual rent payments are consistently 15 days late, you're effectively losing ${formatCurrency(dailyRentEquivalent * 15)} in time value of money.`,
          recommendation:
            "Contact the tenant immediately to understand the situation. Consider offering a payment plan if they're facing temporary financial difficulties, or start preparing for potential eviction if the issue persists.",
          detectedValue: `${recentLateCount} late payment(s) in recent months`,
          expectedValue: 'Minimal or no late payments',
        });
      }

      // Check for extremely late payments
      const veryLatePayments = payments.filter((p) => p.daysLate > 30);
      if (veryLatePayments.length > 0) {
        detected.push({
          type: 'Rent Delay',
          severity: 'Critical',
          title: 'Extremely Late Rent Payments (30+ Days)',
          description: `This property has ${veryLatePayments.length} payment(s) that are more than 30 days late.`,
          whyItMatters:
            'Payments over 30 days late are a serious red flag. The tenant may be unable to pay, which could lead to eviction and loss of rental income. You may also need to write off this debt as uncollectible.',
          impact: `You're missing ${formatCurrency(annualRentValue * veryLatePayments.length)} in rent, which directly affects your cash flow and ability to cover property expenses.`,
          recommendation:
            'Take immediate action. Send a formal notice, consider legal proceedings if necessary, and start preparing the property for a new tenant if eviction is likely.',
          detectedValue: `${veryLatePayments.length} payment(s) over 30 days late`,
          expectedValue: 'All payments within 7 days of due date',
        });
      }

      // Check for pattern of increasing lateness
      if (payments.length >= 6) {
        const firstHalf = payments.slice(0, Math.floor(payments.length / 2));
        const secondHalf = payments.slice(Math.floor(payments.length / 2));

        const firstHalfAvg = firstHalf.reduce((sum, p) => sum + p.daysLate, 0) / firstHalf.length;
        const secondHalfAvg =
          secondHalf.reduce((sum, p) => sum + p.daysLate, 0) / secondHalf.length;

        if (secondHalfAvg > firstHalfAvg * 1.5 && secondHalfAvg > 5) {
          detected.push({
            type: 'Rent Delay',
            severity: 'Medium',
            title: 'Worsening Payment Pattern',
            description: `The average days late has increased from ${firstHalfAvg.toFixed(1)} days to ${secondHalfAvg.toFixed(1)} days, showing a deteriorating payment pattern.`,
            whyItMatters:
              'A worsening payment pattern suggests the tenant may be struggling financially or losing interest in maintaining the lease. This often precedes complete payment failure or early lease termination.',
            impact: `The increasing delay means you're waiting longer for your annual rent payment, which affects your cash flow planning and ability to cover expenses.`,
            recommendation:
              'Schedule a meeting with the tenant to discuss the payment pattern. Review the lease terms and consider whether to offer assistance or prepare for lease termination.',
            detectedValue: `Average ${secondHalfAvg.toFixed(1)} days late (increasing)`,
            expectedValue: `Average ${firstHalfAvg.toFixed(1)} days late or less`,
          });
        }
      }
    }

    // DETECT MAINTENANCE COST SPIKES
    if (maintenance.length > 0) {
      // Calculate average maintenance cost
      const avgMaintenance = maintenance.reduce((sum, m) => sum + m.cost, 0) / maintenance.length;

      // Check for recent spikes
      const recentMaintenance = maintenance.slice(-3);
      const olderMaintenance = maintenance.slice(0, -3);

      if (recentMaintenance.length > 0 && olderMaintenance.length > 0) {
        const recentAvg =
          recentMaintenance.reduce((sum, m) => sum + m.cost, 0) / recentMaintenance.length;
        const olderAvg =
          olderMaintenance.reduce((sum, m) => sum + m.cost, 0) / olderMaintenance.length;

        if (recentAvg > olderAvg * 2 && recentAvg > avgMaintenance * 1.5) {
          const spikeAmount = recentAvg - olderAvg;
          detected.push({
            type: 'Maintenance Spike',
            severity: 'High',
            title: 'Sudden Maintenance Cost Increase',
            description: `Maintenance costs have spiked from an average of ${formatCurrency(olderAvg)} to ${formatCurrency(recentAvg)} per month - a ${((recentAvg / olderAvg - 1) * 100).toFixed(0)}% increase.`,
            whyItMatters:
              'Sudden maintenance spikes can indicate serious property issues like structural problems, aging systems, or deferred maintenance catching up. This reduces your net income and may signal larger problems ahead.',
            impact: `This spike costs you an extra ${formatCurrency(spikeAmount)} per month, which directly reduces your profit. If this continues, it could significantly impact your annual returns.`,
            recommendation:
              'Investigate the cause of the spike immediately. Review maintenance records to identify recurring issues. Consider a property inspection to catch problems early and prevent further cost escalation.',
            detectedValue: `${formatCurrency(recentAvg)} average (recent months)`,
            expectedValue: `${formatCurrency(olderAvg)} average (historical)`,
          });
        }
      }

      // Check for single month extreme spike
      if (maintenance.length > 1) {
        const sortedByCost = [...maintenance].sort((a, b) => b.cost - a.cost);
        const highestCost = sortedByCost[0];
        const secondHighest = sortedByCost[1] || { cost: avgMaintenance };

        if (highestCost.cost > secondHighest.cost * 3 && highestCost.cost > avgMaintenance * 2) {
          detected.push({
            type: 'Maintenance Spike',
            severity: 'High',
            title: 'Extreme Single-Month Maintenance Cost',
            description: `One month had maintenance costs of ${formatCurrency(highestCost.cost)}, which is ${((highestCost.cost / avgMaintenance - 1) * 100).toFixed(0)}% above the average.`,
            whyItMatters:
              'Extreme single-month spikes often indicate emergency repairs, major system failures, or significant property damage. This could be a one-time event or the start of a pattern of expensive repairs.',
            impact: `This single month cost ${formatCurrency(highestCost.cost - avgMaintenance)} more than average, which significantly impacts that month's profitability.`,
            recommendation:
              "Review what caused this spike. If it was an emergency, ensure it's been properly resolved. If it's a recurring issue, address the root cause to prevent future spikes.",
            detectedValue: `${formatCurrency(highestCost.cost)} in ${highestCost.month}`,
            expectedValue: `Around ${formatCurrency(avgMaintenance)} per month`,
          });
        }
      }
    }

    // DETECT VACANCY ANOMALIES
    if (vacancies.length > 0) {
      // Check for unexpected vacancies
      const recentVacancies = vacancies.slice(-6);
      const vacantMonths = recentVacancies.filter((v) => v.vacant).length;

      if (vacantMonths > 2) {
        const avgDaysVacant =
          recentVacancies.filter((v) => v.vacant).reduce((sum, v) => sum + v.daysVacant, 0) /
          vacantMonths;

        detected.push({
          type: 'Vacancy Anomaly',
          severity: 'High',
          title: 'High Vacancy Rate',
          description: `This property has been vacant for ${vacantMonths} out of the last 6 months, with an average of ${avgDaysVacant.toFixed(0)} days per vacancy.`,
          whyItMatters:
            "High vacancy rates mean you're losing rental income every day the property sits empty. This could indicate pricing issues, property condition problems, location challenges, or ineffective marketing.",
          impact: `At ${formatCurrency(monthlyRentEquivalent)}/month equivalent, you're losing approximately ${formatCurrency(dailyRentEquivalent * avgDaysVacant * vacantMonths)} in potential income from these vacancies.`,
          recommendation:
            'Review your pricing strategy, property condition, and marketing approach. Consider reducing rent slightly, improving the property, or enhancing your listing to attract tenants faster.',
          detectedValue: `${vacantMonths} vacant months in last 6 months`,
          expectedValue: 'Minimal or no vacancies',
        });
      }

      // Check for unusually long vacancy periods
      const longVacancies = vacancies.filter((v) => v.vacant && v.daysVacant > 60);
      if (longVacancies.length > 0) {
        const longestVacancy = longVacancies.sort((a, b) => b.daysVacant - a.daysVacant)[0];

        detected.push({
          type: 'Vacancy Anomaly',
          severity: 'Critical',
          title: 'Unusually Long Vacancy Period',
          description: `This property had a vacancy lasting ${longestVacancy.daysVacant} days, which is significantly longer than the typical 30-45 day turnaround.`,
          whyItMatters:
            'Properties that take more than 60 days to fill suggest serious issues with pricing, condition, or marketability. This represents significant lost income and may indicate deeper problems that need addressing.',
          impact: `A ${longestVacancy.daysVacant}-day vacancy means you lost ${formatCurrency(dailyRentEquivalent * longestVacancy.daysVacant)} in rental income during that period alone.`,
          recommendation:
            'Immediately review why the property took so long to fill. Check if rent is too high, if the property needs updates, or if there are issues with the location or marketing. Take corrective action before the next vacancy.',
          detectedValue: `${longestVacancy.daysVacant} days vacant`,
          expectedValue: '30-45 days to fill',
        });
      }

      // Check for frequent short vacancies (churn)
      if (vacancies.length >= 12) {
        const vacantCount = vacancies.filter((v) => v.vacant).length;
        if (vacantCount > 4) {
          detected.push({
            type: 'Vacancy Anomaly',
            severity: 'Medium',
            title: 'High Tenant Turnover (Frequent Vacancies)',
            description: `This property has been vacant ${vacantCount} times in the last 12 months, indicating high tenant turnover.`,
            whyItMatters:
              'Frequent vacancies suggest tenants are leaving quickly, which could indicate property issues, poor tenant screening, or problems with tenant relations. Each turnover costs money in cleaning, repairs, and lost rent.',
            impact: `Each vacancy costs you approximately ${formatCurrency(monthlyRentEquivalent * 2)} in lost rent, cleaning, and turnover expenses. With ${vacantCount} vacancies, this significantly impacts your annual income.`,
            recommendation:
              'Investigate why tenants are leaving. Conduct exit interviews, review property condition, check if rent is appropriate, and improve tenant screening to find longer-term tenants.',
            detectedValue: `${vacantCount} vacancies in 12 months`,
            expectedValue: '1-2 vacancies per year',
          });
        }
      }
    }

    return detected.sort((a, b) => {
      const severityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  };

  const handleAnalyze = () => {
    if (!propertyName || !annualRent) {
      return;
    }

    const detected = detectAnomalies();
    setAnomalies(detected);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case 'Rent Delay':
        return <DollarSign className="h-5 w-5 text-red-500" />;
      case 'Maintenance Spike':
        return <TrendingDown className="h-5 w-5 text-orange-500" />;
      case 'Vacancy Anomaly':
        return <Building className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Property Anomaly Detector
          </CardTitle>
          <CardDescription>
            Scan property data to detect unusual patterns and explain why they matter
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Property Information */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Property Information</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="propertyName">Property Name/ID *</Label>
                <Input
                  id="propertyName"
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  placeholder="Property A, Unit 5B, etc."
                />
              </div>
              <div>
                <Label htmlFor="annualRent">Annual Rent (₦) *</Label>
                <Input
                  id="annualRent"
                  type="number"
                  value={annualRent}
                  onChange={(e) => setAnnualRent(e.target.value)}
                  placeholder="6000000"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Data Input */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Historical Data</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="paymentData">Payment History (JSON)</Label>
                <textarea
                  id="paymentData"
                  value={paymentData}
                  onChange={(e) => setPaymentData(e.target.value)}
                  placeholder='[{"month": "2024-01", "paid": true, "daysLate": 0, "amount": 500000}, {"month": "2024-02", "paid": true, "daysLate": 5, "amount": 500000}]'
                  className="min-h-[100px] w-full rounded-md border p-3 font-mono text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Format: Array of objects with month, paid (boolean), daysLate (number), amount
                  (number)
                </p>
              </div>

              <div>
                <Label htmlFor="maintenanceData">Maintenance History (JSON)</Label>
                <textarea
                  id="maintenanceData"
                  value={maintenanceData}
                  onChange={(e) => setMaintenanceData(e.target.value)}
                  placeholder='[{"month": "2024-01", "cost": 50000, "type": "Plumbing"}, {"month": "2024-02", "cost": 200000, "type": "Electrical"}]'
                  className="min-h-[100px] w-full rounded-md border p-3 font-mono text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Format: Array of objects with month, cost (number), type (string)
                </p>
              </div>

              <div>
                <Label htmlFor="vacancyData">Vacancy History (JSON)</Label>
                <textarea
                  id="vacancyData"
                  value={vacancyData}
                  onChange={(e) => setVacancyData(e.target.value)}
                  placeholder='[{"month": "2024-01", "vacant": false, "daysVacant": 0}, {"month": "2024-02", "vacant": true, "daysVacant": 45}]'
                  className="min-h-[100px] w-full rounded-md border p-3 font-mono text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Format: Array of objects with month, vacant (boolean), daysVacant (number)
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-5 w-5 text-blue-500" />
              <div className="text-sm text-gray-700">
                <p className="mb-1 font-semibold">Quick Start:</p>
                <p>
                  You can leave the data fields empty and the system will still analyze based on
                  property name and rent. For more accurate detection, provide historical data in
                  JSON format.
                </p>
              </div>
            </div>
          </div>

          <Button onClick={handleAnalyze} className="w-full" size="lg">
            <Activity className="mr-2 h-4 w-4" />
            Scan for Anomalies
          </Button>
        </CardContent>
      </Card>

      {/* Anomaly Results */}
      {anomalies.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Detected Anomalies</CardTitle>
              <Badge variant="destructive">{anomalies.length} Found</Badge>
            </div>
            <CardDescription>Review each anomaly and understand why it matters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {anomalies.map((anomaly, index) => (
                <Alert
                  key={index}
                  className={
                    anomaly.severity === 'Critical'
                      ? 'border-red-300 bg-red-50'
                      : anomaly.severity === 'High'
                        ? 'border-orange-300 bg-orange-50'
                        : anomaly.severity === 'Medium'
                          ? 'border-yellow-300 bg-yellow-50'
                          : 'border-blue-300 bg-blue-50'
                  }
                >
                  <div className="flex items-start gap-3">
                    {getAnomalyIcon(anomaly.type)}
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <AlertTitle className="text-lg font-semibold">{anomaly.title}</AlertTitle>
                        <Badge className={getSeverityColor(anomaly.severity)}>
                          {anomaly.severity}
                        </Badge>
                        <Badge variant="outline">{anomaly.type}</Badge>
                      </div>

                      <AlertDescription className="mt-2 space-y-3">
                        <div>
                          <p className="mb-1 font-medium text-gray-800">What We Found:</p>
                          <p className="text-gray-700">{anomaly.description}</p>
                        </div>

                        <div className="grid grid-cols-1 gap-2 rounded border border-border bg-card p-3 text-card-foreground md:grid-cols-2">
                          <div>
                            <p className="text-xs text-gray-500">Detected Value:</p>
                            <p className="font-semibold text-red-600">{anomaly.detectedValue}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Expected Value:</p>
                            <p className="font-semibold text-green-600">{anomaly.expectedValue}</p>
                          </div>
                        </div>

                        <div className="rounded border border-yellow-200 bg-yellow-50 p-3">
                          <p className="mb-1 font-semibold text-gray-800">Why This Matters:</p>
                          <p className="text-sm text-gray-700">{anomaly.whyItMatters}</p>
                        </div>

                        <div className="rounded border border-red-200 bg-red-50 p-3">
                          <p className="mb-1 font-semibold text-gray-800">Financial Impact:</p>
                          <p className="text-sm text-gray-700">{anomaly.impact}</p>
                        </div>

                        <div className="rounded border border-blue-200 bg-blue-50 p-3">
                          <p className="mb-1 font-semibold text-gray-800">Recommended Action:</p>
                          <p className="text-sm text-gray-700">{anomaly.recommendation}</p>
                        </div>
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {anomalies.length === 0 && propertyName && annualRent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              No Anomalies Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>All Clear!</AlertTitle>
              <AlertDescription>
                No unusual patterns detected in the property data. Continue monitoring regularly to
                catch issues early.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
