import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  TrendingUp,
  AlertTriangle,
  DollarSign,
  CheckCircle,
  Calendar,
  Building,
  Users,
  Target,
  ArrowRight,
} from 'lucide-react';

interface PortfolioData {
  totalProperties: number;
  occupiedProperties: number;
  vacantProperties: number;
  totalAnnualRent: number;
  collectedRent: number;
  outstandingRent: number;
  averageRent: number;
  maintenanceRequests: number;
  overdueMaintenance: number;
  tenantComplaints: number;
  leaseExpirationsThisMonth: number;
  averageVacancyDays: number;
  marketRentAverage: number;
}

interface PortfolioAnalysis {
  keyWins: {
    title: string;
    impact: string;
    value: string;
  }[];
  risks: {
    title: string;
    severity: 'Low' | 'Medium' | 'High';
    impact: string;
    urgency: string;
  }[];
  missedOpportunities: {
    title: string;
    potentialValue: string;
    impact: string;
    action: string;
  }[];
  suggestedActions: {
    priority: 'High' | 'Medium' | 'Low';
    action: string;
    impact: string;
    timeframe: string;
  }[];
  summary: {
    overallHealth: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    occupancyRate: number;
    collectionRate: number;
    healthScore: number;
  };
}

export function PortfolioAnalyzer() {
  const [portfolioData, setPortfolioData] = useState<PortfolioData>({
    totalProperties: 0,
    occupiedProperties: 0,
    vacantProperties: 0,
    totalAnnualRent: 0,
    collectedRent: 0,
    outstandingRent: 0,
    averageRent: 0,
    maintenanceRequests: 0,
    overdueMaintenance: 0,
    tenantComplaints: 0,
    leaseExpirationsThisMonth: 0,
    averageVacancyDays: 0,
    marketRentAverage: 0,
  });

  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const analyzePortfolio = (data: PortfolioData): PortfolioAnalysis => {
    const keyWins: PortfolioAnalysis['keyWins'] = [];
    const risks: PortfolioAnalysis['risks'] = [];
    const missedOpportunities: PortfolioAnalysis['missedOpportunities'] = [];
    const suggestedActions: PortfolioAnalysis['suggestedActions'] = [];

    // Calculate key metrics
    const occupancyRate =
      data.totalProperties > 0 ? (data.occupiedProperties / data.totalProperties) * 100 : 0;

    const collectionRate =
      data.totalAnnualRent > 0 ? (data.collectedRent / data.totalAnnualRent) * 100 : 0;

    const vacancyRate =
      data.totalProperties > 0 ? (data.vacantProperties / data.totalProperties) * 100 : 0;

    // KEY WINS
    if (occupancyRate >= 95) {
      keyWins.push({
        title: 'Excellent Occupancy Rate',
        impact: `You have ${occupancyRate.toFixed(1)}% of your properties occupied, which means you're maximizing your rental income.`,
        value: `This translates to approximately ${formatCurrency(data.occupiedProperties * data.averageRent)} in annual rental income.`,
      });
    } else if (occupancyRate >= 85) {
      keyWins.push({
        title: 'Strong Occupancy Rate',
        impact: `Your ${occupancyRate.toFixed(1)}% occupancy rate shows good property management and tenant retention.`,
        value: `You're earning ${formatCurrency(data.occupiedProperties * data.averageRent)} annually from occupied units.`,
      });
    }

    if (collectionRate >= 95) {
      keyWins.push({
        title: 'Outstanding Rent Collection',
        impact: `You're collecting ${collectionRate.toFixed(1)}% of your rent, which means tenants are paying on time.`,
        value: `You've collected ${formatCurrency(data.collectedRent)} out of ${formatCurrency(data.totalAnnualRent)} expected.`,
      });
    }

    if (data.overdueMaintenance === 0 && data.maintenanceRequests < 3) {
      keyWins.push({
        title: 'Well-Maintained Properties',
        impact:
          'You have minimal maintenance issues, which keeps tenants happy and reduces unexpected costs.',
        value: `Only ${data.maintenanceRequests} active maintenance requests with none overdue.`,
      });
    }

    if (data.tenantComplaints === 0) {
      keyWins.push({
        title: 'Happy Tenants',
        impact:
          'No tenant complaints means satisfied tenants who are more likely to renew their leases.',
        value: 'Zero complaints indicates strong tenant relationships.',
      });
    }

    // RISKS
    if (vacancyRate > 15) {
      risks.push({
        title: 'High Vacancy Rate',
        severity: 'High',
        impact: `You have ${data.vacantProperties} vacant properties (${vacancyRate.toFixed(1)}% vacancy rate), which means you're losing rental income every day.`,
        urgency: `At your average rent of ${formatCurrency(data.averageRent)}, you're losing approximately ${formatCurrency((data.averageRent / 365) * data.averageVacancyDays * data.vacantProperties)} per day in potential income.`,
      });
    } else if (vacancyRate > 10) {
      risks.push({
        title: 'Moderate Vacancy Rate',
        severity: 'Medium',
        impact: `You have ${data.vacantProperties} vacant properties. While manageable, this still represents lost income.`,
        urgency: `Each vacant property costs you approximately ${formatCurrency((data.averageRent / 365) * data.averageVacancyDays)} in lost rent.`,
      });
    }

    if (data.outstandingRent > data.totalAnnualRent * 0.1) {
      risks.push({
        title: 'Significant Outstanding Rent',
        severity: 'High',
        impact: `You have ${formatCurrency(data.outstandingRent)} in unpaid rent, which affects your cash flow.`,
        urgency: `This represents ${((data.outstandingRent / data.totalAnnualRent) * 100).toFixed(1)}% of your annual rent that hasn't been collected.`,
      });
    } else if (data.outstandingRent > 0) {
      risks.push({
        title: 'Some Outstanding Rent',
        severity: 'Medium',
        impact: `You have ${formatCurrency(data.outstandingRent)} in unpaid rent that needs attention.`,
        urgency: 'Follow up with tenants to ensure timely payment.',
      });
    }

    if (data.overdueMaintenance > 5) {
      risks.push({
        title: 'Backlog of Maintenance Issues',
        severity: 'High',
        impact: `You have ${data.overdueMaintenance} overdue maintenance requests, which could lead to tenant dissatisfaction and potential lease terminations.`,
        urgency:
          'Address these issues immediately to prevent tenant complaints and property damage.',
      });
    } else if (data.overdueMaintenance > 0) {
      risks.push({
        title: 'Some Overdue Maintenance',
        severity: 'Medium',
        impact: `You have ${data.overdueMaintenance} maintenance requests that are overdue.`,
        urgency: 'Schedule these repairs to maintain property condition and tenant satisfaction.',
      });
    }

    if (data.leaseExpirationsThisMonth > data.totalProperties * 0.2) {
      risks.push({
        title: 'Many Leases Expiring Soon',
        severity: 'High',
        impact: `You have ${data.leaseExpirationsThisMonth} leases expiring this month, which could lead to vacancies if tenants don't renew.`,
        urgency: 'Start renewal conversations now to retain good tenants and avoid vacancies.',
      });
    } else if (data.leaseExpirationsThisMonth > 0) {
      risks.push({
        title: 'Leases Expiring This Month',
        severity: 'Medium',
        impact: `You have ${data.leaseExpirationsThisMonth} lease(s) expiring this month.`,
        urgency: 'Contact tenants to discuss renewal options and avoid gaps in occupancy.',
      });
    }

    if (data.tenantComplaints > 5) {
      risks.push({
        title: 'High Number of Tenant Complaints',
        severity: 'High',
        impact: `You have ${data.tenantComplaints} tenant complaints, which indicates potential issues with property management or tenant satisfaction.`,
        urgency: 'Address complaints promptly to prevent tenant turnover and negative reviews.',
      });
    }

    // MISSED OPPORTUNITIES
    if (data.vacantProperties > 0) {
      const lostIncome = (data.averageRent / 365) * data.averageVacancyDays * data.vacantProperties;
      missedOpportunities.push({
        title: 'Income Lost from Vacancies',
        potentialValue: formatCurrency(lostIncome),
        impact: `Your ${data.vacantProperties} vacant property(ies) have been empty for an average of ${data.averageVacancyDays} days, resulting in lost income.`,
        action:
          'Focus on marketing and filling vacancies quickly. Consider reducing rent slightly or offering incentives to attract tenants faster.',
      });
    }

    if (data.marketRentAverage > data.averageRent * 1.1) {
      const potentialIncrease =
        (data.marketRentAverage - data.averageRent) * data.occupiedProperties;
      missedOpportunities.push({
        title: 'Below Market Rent Rates',
        potentialValue: formatCurrency(potentialIncrease),
        impact: `Your average rent of ${formatCurrency(data.averageRent)} is ${((1 - data.averageRent / data.marketRentAverage) * 100).toFixed(1)}% below market average of ${formatCurrency(data.marketRentAverage)}.`,
        action:
          'Consider gradual rent increases at lease renewal. Research local market rates and adjust accordingly.',
      });
    }

    if (data.outstandingRent > 0) {
      missedOpportunities.push({
        title: 'Uncollected Rent Income',
        potentialValue: formatCurrency(data.outstandingRent),
        impact: `You have ${formatCurrency(data.outstandingRent)} in outstanding rent that could improve your cash flow.`,
        action:
          'Implement a systematic follow-up process for late payments. Consider offering payment plans for tenants facing difficulties.',
      });
    }

    if (data.averageVacancyDays > 30) {
      missedOpportunities.push({
        title: 'Long Vacancy Periods',
        potentialValue: formatCurrency(
          (data.averageRent / 365) * (data.averageVacancyDays - 30) * data.vacantProperties
        ),
        impact: `Properties are taking an average of ${data.averageVacancyDays} days to fill, which is longer than ideal.`,
        action:
          'Improve property marketing, staging, and screening processes to reduce time-to-lease.',
      });
    }

    // SUGGESTED ACTIONS
    if (data.vacantProperties > 0) {
      suggestedActions.push({
        priority: 'High',
        action: `Fill ${data.vacantProperties} vacant property(ies)`,
        impact: `Will generate ${formatCurrency(data.averageRent * data.vacantProperties)} in additional annual income.`,
        timeframe: 'This week',
      });
    }

    if (data.outstandingRent > data.totalAnnualRent * 0.05) {
      suggestedActions.push({
        priority: 'High',
        action: 'Collect outstanding rent',
        impact: `Will recover ${formatCurrency(data.outstandingRent)} and improve cash flow.`,
        timeframe: 'This week',
      });
    }

    if (data.overdueMaintenance > 0) {
      suggestedActions.push({
        priority: 'High',
        action: `Address ${data.overdueMaintenance} overdue maintenance request(s)`,
        impact: 'Will improve tenant satisfaction and prevent further property damage.',
        timeframe: 'This week',
      });
    }

    if (data.leaseExpirationsThisMonth > 0) {
      suggestedActions.push({
        priority: 'High',
        action: `Contact ${data.leaseExpirationsThisMonth} tenant(s) with expiring leases`,
        impact: 'Will help retain good tenants and avoid vacancies.',
        timeframe: 'This week',
      });
    }

    if (data.tenantComplaints > 0) {
      suggestedActions.push({
        priority: 'Medium',
        action: `Resolve ${data.tenantComplaints} tenant complaint(s)`,
        impact: 'Will improve tenant satisfaction and reduce turnover risk.',
        timeframe: 'This week',
      });
    }

    if (data.marketRentAverage > data.averageRent * 1.1) {
      suggestedActions.push({
        priority: 'Medium',
        action: 'Review and adjust rent to market rates',
        impact: `Could increase annual income by ${formatCurrency((data.marketRentAverage - data.averageRent) * data.occupiedProperties)}.`,
        timeframe: 'Next month',
      });
    }

    if (data.averageVacancyDays > 30) {
      suggestedActions.push({
        priority: 'Medium',
        action: 'Improve vacancy turnaround time',
        impact: 'Will reduce lost income from extended vacancies.',
        timeframe: 'This month',
      });
    }

    if (data.maintenanceRequests > 10) {
      suggestedActions.push({
        priority: 'Low',
        action: 'Review maintenance request patterns',
        impact: 'Will help identify recurring issues and improve preventive maintenance.',
        timeframe: 'This month',
      });
    }

    // Calculate health score
    let healthScore = 100;
    healthScore -= vacancyRate * 2; // Penalize high vacancy
    healthScore -= (data.outstandingRent / data.totalAnnualRent) * 100 * 0.5; // Penalize outstanding rent
    healthScore -= data.overdueMaintenance * 2; // Penalize overdue maintenance
    healthScore -= data.tenantComplaints * 3; // Penalize complaints
    healthScore = Math.max(0, Math.min(100, healthScore));

    let overallHealth: 'Excellent' | 'Good' | 'Fair' | 'Poor' = 'Excellent';
    if (healthScore < 60) {
      overallHealth = 'Poor';
    } else if (healthScore < 75) {
      overallHealth = 'Fair';
    } else if (healthScore < 90) {
      overallHealth = 'Good';
    }

    return {
      keyWins,
      risks,
      missedOpportunities,
      suggestedActions,
      summary: {
        overallHealth,
        occupancyRate,
        collectionRate,
        healthScore: Math.round(healthScore),
      },
    };
  };

  const handleAnalyze = () => {
    if (portfolioData.totalProperties === 0) {
      return;
    }

    const result = analyzePortfolio(portfolioData);
    setAnalysis(result);
  };

  const updateField = (field: keyof PortfolioData, value: string) => {
    const numValue = parseFloat(value.replace(/,/g, '')) || 0;
    setPortfolioData((prev) => ({ ...prev, [field]: numValue }));
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'Excellent':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Good':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Fair':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Poor':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'text-red-600 font-bold';
      case 'Medium':
        return 'text-yellow-600 font-semibold';
      case 'Low':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Portfolio Analyzer
          </CardTitle>
          <CardDescription>
            Analyze your property portfolio and get actionable insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Portfolio Data Input */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Portfolio Data</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="totalProperties">Total Properties *</Label>
                <Input
                  id="totalProperties"
                  type="number"
                  value={portfolioData.totalProperties || ''}
                  onChange={(e) => updateField('totalProperties', e.target.value)}
                  placeholder="10"
                />
              </div>
              <div>
                <Label htmlFor="occupiedProperties">Occupied Properties</Label>
                <Input
                  id="occupiedProperties"
                  type="number"
                  value={portfolioData.occupiedProperties || ''}
                  onChange={(e) => updateField('occupiedProperties', e.target.value)}
                  placeholder="8"
                />
              </div>
              <div>
                <Label htmlFor="vacantProperties">Vacant Properties</Label>
                <Input
                  id="vacantProperties"
                  type="number"
                  value={portfolioData.vacantProperties || ''}
                  onChange={(e) => updateField('vacantProperties', e.target.value)}
                  placeholder="2"
                />
              </div>
              <div>
                <Label htmlFor="averageRent">Average Annual Rent (₦)</Label>
                <Input
                  id="averageRent"
                  type="number"
                  value={portfolioData.averageRent || ''}
                  onChange={(e) => updateField('averageRent', e.target.value)}
                  placeholder="6000000"
                />
              </div>
              <div>
                <Label htmlFor="totalAnnualRent">Total Annual Rent Expected (₦)</Label>
                <Input
                  id="totalAnnualRent"
                  type="number"
                  value={portfolioData.totalAnnualRent || ''}
                  onChange={(e) => updateField('totalAnnualRent', e.target.value)}
                  placeholder="48000000"
                />
              </div>
              <div>
                <Label htmlFor="collectedRent">Rent Collected So Far (₦)</Label>
                <Input
                  id="collectedRent"
                  type="number"
                  value={portfolioData.collectedRent || ''}
                  onChange={(e) => updateField('collectedRent', e.target.value)}
                  placeholder="40000000"
                />
              </div>
              <div>
                <Label htmlFor="outstandingRent">Outstanding Rent (₦)</Label>
                <Input
                  id="outstandingRent"
                  type="number"
                  value={portfolioData.outstandingRent || ''}
                  onChange={(e) => updateField('outstandingRent', e.target.value)}
                  placeholder="8000000"
                />
              </div>
              <div>
                <Label htmlFor="marketRentAverage">Market Average Rent (₦)</Label>
                <Input
                  id="marketRentAverage"
                  type="number"
                  value={portfolioData.marketRentAverage || ''}
                  onChange={(e) => updateField('marketRentAverage', e.target.value)}
                  placeholder="6500000"
                />
              </div>
              <div>
                <Label htmlFor="maintenanceRequests">Active Maintenance Requests</Label>
                <Input
                  id="maintenanceRequests"
                  type="number"
                  value={portfolioData.maintenanceRequests || ''}
                  onChange={(e) => updateField('maintenanceRequests', e.target.value)}
                  placeholder="5"
                />
              </div>
              <div>
                <Label htmlFor="overdueMaintenance">Overdue Maintenance</Label>
                <Input
                  id="overdueMaintenance"
                  type="number"
                  value={portfolioData.overdueMaintenance || ''}
                  onChange={(e) => updateField('overdueMaintenance', e.target.value)}
                  placeholder="2"
                />
              </div>
              <div>
                <Label htmlFor="tenantComplaints">Tenant Complaints</Label>
                <Input
                  id="tenantComplaints"
                  type="number"
                  value={portfolioData.tenantComplaints || ''}
                  onChange={(e) => updateField('tenantComplaints', e.target.value)}
                  placeholder="1"
                />
              </div>
              <div>
                <Label htmlFor="leaseExpirationsThisMonth">Leases Expiring This Month</Label>
                <Input
                  id="leaseExpirationsThisMonth"
                  type="number"
                  value={portfolioData.leaseExpirationsThisMonth || ''}
                  onChange={(e) => updateField('leaseExpirationsThisMonth', e.target.value)}
                  placeholder="2"
                />
              </div>
              <div>
                <Label htmlFor="averageVacancyDays">Average Days to Fill Vacancy</Label>
                <Input
                  id="averageVacancyDays"
                  type="number"
                  value={portfolioData.averageVacancyDays || ''}
                  onChange={(e) => updateField('averageVacancyDays', e.target.value)}
                  placeholder="45"
                />
              </div>
            </div>
          </div>

          <Button onClick={handleAnalyze} className="w-full" size="lg">
            <TrendingUp className="mr-2 h-4 w-4" />
            Analyze Portfolio
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <>
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Portfolio Health Summary</CardTitle>
                <Badge className={getHealthColor(analysis.summary.overallHealth)}>
                  {analysis.summary.overallHealth}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Building className="h-5 w-5 text-blue-500" />
                    <h3 className="font-semibold">Occupancy Rate</h3>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {analysis.summary.occupancyRate.toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    <h3 className="font-semibold">Collection Rate</h3>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {analysis.summary.collectionRate.toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-500" />
                    <h3 className="font-semibold">Health Score</h3>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    {analysis.summary.healthScore}/100
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-500" />
                    <h3 className="font-semibold">Properties</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-600">
                    {portfolioData.totalProperties}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Wins */}
          {analysis.keyWins.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Key Wins
                </CardTitle>
                <CardDescription>What's working well in your portfolio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.keyWins.map((win, index) => (
                    <Alert key={index} className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <AlertTitle className="text-green-800">{win.title}</AlertTitle>
                      <AlertDescription className="mt-2 text-gray-700">
                        {win.impact}
                      </AlertDescription>
                      <p className="mt-2 text-sm font-semibold text-green-700">{win.value}</p>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risks */}
          {analysis.risks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Risks to Address
                </CardTitle>
                <CardDescription>Issues that need your attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.risks.map((risk, index) => (
                    <Alert
                      key={index}
                      className={
                        risk.severity === 'High'
                          ? 'border-red-200 bg-red-50'
                          : risk.severity === 'Medium'
                            ? 'border-yellow-200 bg-yellow-50'
                            : 'border-blue-200 bg-blue-50'
                      }
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <AlertTitle className="text-gray-800">{risk.title}</AlertTitle>
                            <Badge className={getSeverityColor(risk.severity)}>
                              {risk.severity}
                            </Badge>
                          </div>
                          <AlertDescription className="mt-2 text-gray-700">
                            {risk.impact}
                          </AlertDescription>
                          <p className="mt-2 text-sm font-medium text-gray-600">{risk.urgency}</p>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Missed Opportunities */}
          {analysis.missedOpportunities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-yellow-500" />
                  Missed Income Opportunities
                </CardTitle>
                <CardDescription>Potential income you could be earning</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.missedOpportunities.map((opp, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-yellow-200 bg-yellow-50 p-4"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <h3 className="font-semibold text-gray-800">{opp.title}</h3>
                        <Badge className="border-yellow-300 bg-yellow-200 text-yellow-800">
                          {opp.potentialValue}
                        </Badge>
                      </div>
                      <p className="mb-2 text-sm text-gray-700">{opp.impact}</p>
                      <div className="mt-3 rounded border border-yellow-300 bg-card p-3 text-card-foreground dark:border-yellow-700/60 dark:bg-yellow-950/20">
                        <p className="text-sm font-medium text-gray-800">
                          <strong>Action:</strong> {opp.action}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suggested Actions */}
          {analysis.suggestedActions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  Suggested Actions for Next Week
                </CardTitle>
                <CardDescription>Prioritized actions to improve your portfolio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.suggestedActions
                    .sort((a, b) => {
                      const priorityOrder = { High: 3, Medium: 2, Low: 1 };
                      return priorityOrder[b.priority] - priorityOrder[a.priority];
                    })
                    .map((action, index) => (
                      <div key={index} className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <div className="mb-2 flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <ArrowRight className="h-5 w-5 text-blue-500" />
                            <h3 className={`font-semibold ${getPriorityColor(action.priority)}`}>
                              {action.action}
                            </h3>
                          </div>
                          <Badge
                            className={
                              action.priority === 'High'
                                ? 'border-red-300 bg-red-100 text-red-800'
                                : action.priority === 'Medium'
                                  ? 'border-yellow-300 bg-yellow-100 text-yellow-800'
                                  : 'border-blue-300 bg-blue-100 text-blue-800'
                            }
                          >
                            {action.priority} Priority
                          </Badge>
                        </div>
                        <p className="mb-2 text-sm text-gray-700">{action.impact}</p>
                        <p className="text-xs text-gray-600">
                          <strong>Timeframe:</strong> {action.timeframe}
                        </p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
