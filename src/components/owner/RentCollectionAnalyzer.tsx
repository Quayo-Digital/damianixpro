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
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Lightbulb,
  Info,
} from 'lucide-react';

interface PropertyRentData {
  propertyId: string;
  propertyName: string;
  expectedRent: number;
  collectedRent: number;
  tenantCount: number;
  occupancyRate?: number;
  lastPaymentDate?: string;
  daysSinceLastPayment?: number;
}

interface RentCollectionAnalysis {
  summary: {
    totalExpected: number;
    totalCollected: number;
    collectionRate: number;
    totalArrears: number;
    propertiesCount: number;
    occupiedProperties: number;
  };
  topPerformers: {
    property: PropertyRentData;
    collectionRate: number;
    rank: number;
  }[];
  underperformers: {
    property: PropertyRentData;
    collectionRate: number;
    arrears: number;
    issues: string[];
  }[];
  insights: {
    type: 'positive' | 'warning' | 'action';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  narrative: string;
}

export function RentCollectionAnalyzer() {
  const [propertiesJson, setPropertiesJson] = useState('');
  const [analysis, setAnalysis] = useState<RentCollectionAnalysis | null>(null);

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

  const parseProperties = (): PropertyRentData[] => {
    if (!propertiesJson.trim()) return [];
    try {
      const parsed = JSON.parse(propertiesJson);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  };

  const analyzeRentCollection = (): RentCollectionAnalysis | null => {
    const properties = parseProperties();
    if (properties.length === 0) {
      return null;
    }

    // Calculate summary
    const totalExpected = properties.reduce((sum, p) => sum + p.expectedRent, 0);
    const totalCollected = properties.reduce((sum, p) => sum + p.collectedRent, 0);
    const totalArrears = totalExpected - totalCollected;
    const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;
    const occupiedProperties = properties.filter((p) => p.tenantCount > 0).length;

    // Identify top performers (highest collection rate)
    const propertiesWithRates = properties.map((p) => ({
      property: p,
      collectionRate: p.expectedRent > 0 ? (p.collectedRent / p.expectedRent) * 100 : 0,
      arrears: p.expectedRent - p.collectedRent,
    }));

    const topPerformers = propertiesWithRates
      .filter((p) => p.collectionRate >= 80) // At least 80% collection
      .sort((a, b) => b.collectionRate - a.collectionRate)
      .slice(0, 5)
      .map((p, index) => ({
        ...p,
        rank: index + 1,
      }));

    // Identify underperformers (low collection rate or high arrears)
    const underperformers = propertiesWithRates
      .filter((p) => p.collectionRate < 80 || p.arrears > 0)
      .sort((a, b) => {
        // Sort by collection rate (lowest first), then by arrears (highest first)
        if (a.collectionRate !== b.collectionRate) {
          return a.collectionRate - b.collectionRate;
        }
        return b.arrears - a.arrears;
      })
      .map((p) => {
        const issues: string[] = [];
        if (p.collectionRate < 50) {
          issues.push('Less than half of expected rent collected');
        } else if (p.collectionRate < 80) {
          issues.push('Collection rate below target');
        }
        if (p.arrears > p.property.expectedRent * 0.2) {
          issues.push('Significant arrears accumulated');
        }
        if (p.property.daysSinceLastPayment && p.property.daysSinceLastPayment > 60) {
          issues.push('No payment received in over 60 days');
        }
        if (p.property.occupancyRate && p.property.occupancyRate < 0.5) {
          issues.push('Low occupancy rate');
        }

        return {
          property: p.property,
          collectionRate: p.collectionRate,
          arrears: p.arrears,
          issues,
        };
      });

    // Generate insights
    const insights: RentCollectionAnalysis['insights'] = [];

    // Positive insights
    if (collectionRate >= 90) {
      insights.push({
        type: 'positive',
        title: 'Excellent Collection Rate',
        description: `You're collecting ${formatPercentage(collectionRate)} of expected rent. This is above the industry average and shows strong tenant relationships.`,
        priority: 'low',
      });
    } else if (collectionRate >= 80) {
      insights.push({
        type: 'positive',
        title: 'Good Collection Rate',
        description: `You're collecting ${formatPercentage(collectionRate)} of expected rent. This is a solid performance, but there's room for improvement.`,
        priority: 'low',
      });
    }

    if (topPerformers.length > 0) {
      insights.push({
        type: 'positive',
        title: `${topPerformers.length} Top-Performing Properties`,
        description: `${topPerformers.length} of your properties are collecting 80% or more of expected rent. These properties are performing well.`,
        priority: 'low',
      });
    }

    // Warning insights
    if (collectionRate < 70) {
      insights.push({
        type: 'warning',
        title: 'Collection Rate Below Target',
        description: `Your collection rate of ${formatPercentage(collectionRate)} is below the recommended 80% target. This means you're missing out on ${formatCurrency(totalArrears)} in expected income.`,
        priority: 'high',
      });
    }

    if (totalArrears > totalExpected * 0.2) {
      insights.push({
        type: 'warning',
        title: 'Significant Arrears',
        description: `You have ${formatCurrency(totalArrears)} in unpaid rent. This represents ${formatPercentage((totalArrears / totalExpected) * 100)} of your expected income.`,
        priority: 'high',
      });
    }

    if (underperformers.length > properties.length * 0.3) {
      insights.push({
        type: 'warning',
        title: 'Multiple Properties Underperforming',
        description: `${underperformers.length} properties are collecting less than 80% of expected rent. This needs attention.`,
        priority: 'high',
      });
    }

    // Actionable insights
    if (underperformers.length > 0) {
      const topUnderperformer = underperformers[0];
      insights.push({
        type: 'action',
        title: `Focus on ${topUnderperformer.property.propertyName}`,
        description: `This property has the lowest collection rate (${formatPercentage(topUnderperformer.collectionRate)}) with ${formatCurrency(topUnderperformer.arrears)} in arrears. Consider reaching out to tenants or reviewing payment terms.`,
        priority: 'high',
      });
    }

    if (totalArrears > 0) {
      insights.push({
        type: 'action',
        title: 'Send Payment Reminders',
        description: `With ${formatCurrency(totalArrears)} in arrears, consider sending payment reminders to tenants who haven't paid. Early communication can help recover outstanding amounts.`,
        priority: 'medium',
      });
    }

    const propertiesWithNoPayment = properties.filter(
      (p) => p.daysSinceLastPayment && p.daysSinceLastPayment > 30
    );
    if (propertiesWithNoPayment.length > 0) {
      insights.push({
        type: 'action',
        title: 'Follow Up on Overdue Payments',
        description: `${propertiesWithNoPayment.length} property${propertiesWithNoPayment.length !== 1 ? 'ies' : ''} haven't received payment in over 30 days. These need immediate attention.`,
        priority: 'high',
      });
    }

    if (collectionRate < 80 && topPerformers.length > 0) {
      insights.push({
        type: 'action',
        title: 'Learn from Top Performers',
        description: `Your top-performing properties are collecting well. Review what makes them successful (tenant relationships, payment terms, property condition) and apply those practices to underperforming properties.`,
        priority: 'medium',
      });
    }

    // Generate narrative
    let narrative = `Rent Collection Analysis\n\n`;
    narrative += `Summary:\n`;
    narrative += `You have ${properties.length} property${properties.length !== 1 ? 'ies' : ''} with ${occupiedProperties} currently occupied.\n`;
    narrative += `Expected Rent: ${formatCurrency(totalExpected)}\n`;
    narrative += `Collected Rent: ${formatCurrency(totalCollected)}\n`;
    narrative += `Collection Rate: ${formatPercentage(collectionRate)}\n`;
    narrative += `Outstanding Amount: ${formatCurrency(totalArrears)}\n\n`;

    if (topPerformers.length > 0) {
      narrative += `Top-Performing Properties:\n`;
      topPerformers.forEach((p, index) => {
        narrative += `${index + 1}. ${p.property.propertyName}: Collecting ${formatPercentage(p.collectionRate)} of expected rent (${formatCurrency(p.property.collectedRent)} of ${formatCurrency(p.property.expectedRent)})\n`;
      });
      narrative += `\n`;
    }

    if (underperformers.length > 0) {
      narrative += `Properties Needing Attention:\n`;
      underperformers.slice(0, 5).forEach((p) => {
        narrative += `- ${p.property.propertyName}: Collecting ${formatPercentage(p.collectionRate)} of expected rent. Outstanding: ${formatCurrency(p.arrears)}`;
        if (p.issues.length > 0) {
          narrative += `. Issues: ${p.issues.join(', ')}`;
        }
        narrative += `\n`;
      });
      narrative += `\n`;
    }

    narrative += `Key Insights:\n`;
    insights.forEach((insight, index) => {
      narrative += `${index + 1}. ${insight.title}: ${insight.description}\n`;
    });

    return {
      summary: {
        totalExpected,
        totalCollected,
        collectionRate,
        totalArrears,
        propertiesCount: properties.length,
        occupiedProperties,
      },
      topPerformers,
      underperformers,
      insights,
      narrative,
    };
  };

  const handleAnalyze = () => {
    const result = analyzeRentCollection();
    if (result) {
      setAnalysis(result);
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'action':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'action':
        return <Lightbulb className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Rent Collection Analyzer
          </CardTitle>
          <CardDescription>
            Analyze rent collection performance, identify top performers, and get actionable
            insights in plain language
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="mb-4 text-lg font-semibold">Property Rent Data</h3>
            <Label htmlFor="propertiesJson">Properties JSON *</Label>
            <Textarea
              id="propertiesJson"
              value={propertiesJson}
              onChange={(e) => setPropertiesJson(e.target.value)}
              placeholder='[{"propertyId": "prop-1", "propertyName": "Lagos Apartment", "expectedRent": 6000000, "collectedRent": 5500000, "tenantCount": 1, "occupancyRate": 1.0, "daysSinceLastPayment": 5}, {"propertyId": "prop-2", "propertyName": "Abuja House", "expectedRent": 8000000, "collectedRent": 6000000, "tenantCount": 1, "occupancyRate": 1.0, "daysSinceLastPayment": 45}]'
              className="mt-2 font-mono text-sm"
              rows={8}
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter JSON array of properties with expected rent, collected rent, tenant count, and
              optional occupancy/days since last payment
            </p>
          </div>

          <Button onClick={handleAnalyze} className="w-full" size="lg">
            <BarChart3 className="mr-2 h-4 w-4" />
            Analyze Rent Collection
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <>
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Collection Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm text-gray-600">Expected Rent</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(analysis.summary.totalExpected)}
                  </p>
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <p className="text-sm text-gray-600">Collected Rent</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(analysis.summary.totalCollected)}
                  </p>
                </div>
                <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                  <p className="text-sm text-gray-600">Collection Rate</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatPercentage(analysis.summary.collectionRate)}
                  </p>
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-gray-600">Outstanding Amount</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(analysis.summary.totalArrears)}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm text-gray-600">Total Properties</p>
                  <p className="text-2xl font-bold">{analysis.summary.propertiesCount}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm text-gray-600">Occupied Properties</p>
                  <p className="text-2xl font-bold">{analysis.summary.occupiedProperties}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          {analysis.topPerformers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Top-Performing Properties
                </CardTitle>
                <CardDescription>
                  Properties collecting 80% or more of expected rent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.topPerformers.map((performer) => (
                    <div
                      key={performer.property.propertyId}
                      className="rounded-lg border border-green-200 bg-green-50 p-4"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-100">
                            #{performer.rank}
                          </Badge>
                          <h4 className="font-semibold">{performer.property.propertyName}</h4>
                        </div>
                        <Badge className="bg-green-600">
                          {formatPercentage(performer.collectionRate)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Expected</p>
                          <p className="font-semibold">
                            {formatCurrency(performer.property.expectedRent)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Collected</p>
                          <p className="font-semibold text-green-600">
                            {formatCurrency(performer.property.collectedRent)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Underperformers */}
          {analysis.underperformers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  Properties Needing Attention
                </CardTitle>
                <CardDescription>
                  Properties collecting less than 80% of expected rent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.underperformers.slice(0, 10).map((underperformer) => (
                    <div
                      key={underperformer.property.propertyId}
                      className="rounded-lg border border-red-200 bg-red-50 p-4"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="font-semibold">{underperformer.property.propertyName}</h4>
                        <Badge variant="destructive">
                          {formatPercentage(underperformer.collectionRate)}
                        </Badge>
                      </div>
                      <div className="mb-2 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Expected</p>
                          <p className="font-semibold">
                            {formatCurrency(underperformer.property.expectedRent)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Collected</p>
                          <p className="font-semibold text-green-600">
                            {formatCurrency(underperformer.property.collectedRent)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Outstanding</p>
                          <p className="font-semibold text-red-600">
                            {formatCurrency(underperformer.arrears)}
                          </p>
                        </div>
                        {underperformer.property.daysSinceLastPayment && (
                          <div>
                            <p className="text-gray-600">Days Since Payment</p>
                            <p className="font-semibold">
                              {underperformer.property.daysSinceLastPayment} days
                            </p>
                          </div>
                        )}
                      </div>
                      {underperformer.issues.length > 0 && (
                        <div className="mt-2 border-t border-red-200 pt-2">
                          <p className="mb-1 text-xs font-semibold text-gray-600">Issues:</p>
                          <ul className="space-y-1 text-xs">
                            {underperformer.issues.map((issue, index) => (
                              <li key={index} className="flex items-start gap-1">
                                <AlertTriangle className="mt-0.5 h-3 w-3 text-red-500" />
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-blue-500" />
                Actionable Insights
              </CardTitle>
              <CardDescription>
                Plain-language insights to help improve rent collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.insights.map((insight, index) => (
                  <Alert key={index} className={getInsightColor(insight.type)}>
                    <div className="flex items-start gap-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <AlertTitle className="flex items-center gap-2">
                          {insight.title}
                          <Badge
                            variant={
                              insight.priority === 'high'
                                ? 'destructive'
                                : insight.priority === 'medium'
                                  ? 'secondary'
                                  : 'outline'
                            }
                          >
                            {insight.priority.toUpperCase()}
                          </Badge>
                        </AlertTitle>
                        <AlertDescription className="mt-2">{insight.description}</AlertDescription>
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Narrative Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Complete Analysis Report</CardTitle>
              <CardDescription>Full narrative summary in plain text format</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={analysis.narrative}
                readOnly
                className="whitespace-pre-wrap font-mono text-sm"
                rows={20}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
