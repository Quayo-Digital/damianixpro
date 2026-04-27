import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  TrendingDown,
  AlertTriangle,
  BarChart3,
  Users,
  MousePointerClick,
  Clock,
  Lightbulb,
  Target,
  Zap,
} from 'lucide-react';

interface UsageData {
  totalUsers: number;
  activeUsers: number;
  featureUsage: {
    feature: string;
    totalClicks: number;
    uniqueUsers: number;
    completionRate: number;
    averageTimeSpent: number;
    errorRate: number;
  }[];
  dropOffPoints: {
    page: string;
    dropOffRate: number;
    usersAtPage: number;
    usersDropped: number;
  }[];
  userJourneys: {
    journey: string;
    startUsers: number;
    completionUsers: number;
    averageSteps: number;
  }[];
}

interface UsageAnalysis {
  strugglingFeatures: {
    feature: string;
    issue: string;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    impact: string;
    recommendation: string;
  }[];
  dropOffAnalysis: {
    page: string;
    dropOffRate: number;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    potentialCauses: string[];
    impact: string;
    recommendation: string;
  }[];
  underusedFeatures: {
    feature: string;
    usageRate: number;
    potential: string;
    recommendation: string;
  }[];
  uxImprovements: {
    priority: 'High' | 'Medium' | 'Low';
    improvement: string;
    impact: string;
    effort: 'Low' | 'Medium' | 'High';
    recommendation: string;
  }[];
  summary: {
    overallHealth: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    engagementScore: number;
    keyInsights: string[];
  };
}

export function UsageAnalytics() {
  const [totalUsers, setTotalUsers] = useState('');
  const [activeUsers, setActiveUsers] = useState('');
  const [usageData, setUsageData] = useState('');
  const [analysis, setAnalysis] = useState<UsageAnalysis | null>(null);

  const analyzeUsage = (data: UsageData): UsageAnalysis => {
    const strugglingFeatures: UsageAnalysis['strugglingFeatures'] = [];
    const dropOffAnalysis: UsageAnalysis['dropOffAnalysis'] = [];
    const underusedFeatures: UsageAnalysis['underusedFeatures'] = [];
    const uxImprovements: UsageAnalysis['uxImprovements'] = [];
    const keyInsights: string[] = [];

    const totalUsersNum = parseInt(totalUsers) || 0;
    const activeUsersNum = parseInt(activeUsers) || 0;
    const engagementRate = totalUsersNum > 0 ? (activeUsersNum / totalUsersNum) * 100 : 0;

    // ANALYZE STRUGGLING FEATURES
    data.featureUsage.forEach((feature) => {
      const adoptionRate = totalUsersNum > 0 ? (feature.uniqueUsers / totalUsersNum) * 100 : 0;
      const completionRate = feature.completionRate;
      const errorRate = feature.errorRate;

      // High error rate indicates struggle
      if (errorRate > 15) {
        strugglingFeatures.push({
          feature: feature.feature,
          issue: `High error rate (${errorRate.toFixed(1)}%) suggests users are encountering problems`,
          severity: errorRate > 30 ? 'Critical' : errorRate > 20 ? 'High' : 'Medium',
          impact: `${feature.uniqueUsers} users affected. High error rates indicate usability issues or bugs that need immediate attention.`,
          recommendation:
            'Review error logs, conduct user testing, and simplify the feature flow. Consider adding tooltips or help text.',
        });
      }

      // Low completion rate indicates struggle
      if (completionRate < 50 && feature.totalClicks > 10) {
        strugglingFeatures.push({
          feature: feature.feature,
          issue: `Low completion rate (${completionRate.toFixed(1)}%) - users start but don't finish`,
          severity: completionRate < 30 ? 'High' : 'Medium',
          impact: `Only ${completionRate.toFixed(1)}% of users who start this feature complete it. This suggests the process is too complex or confusing.`,
          recommendation:
            'Simplify the workflow, reduce steps, add progress indicators, and provide clear guidance at each step.',
        });
      }

      // Low adoption with high clicks suggests confusion
      if (adoptionRate < 20 && feature.totalClicks > 50) {
        strugglingFeatures.push({
          feature: feature.feature,
          issue: `Low adoption (${adoptionRate.toFixed(1)}%) but high clicks - users are trying but giving up`,
          severity: 'Medium',
          impact: `Only ${adoptionRate.toFixed(1)}% of users use this feature, but those who try click many times, suggesting confusion.`,
          recommendation:
            'Improve discoverability and make the feature more intuitive. Consider in-app tutorials or better placement.',
        });
      }

      // Very long time spent suggests struggle
      if (feature.averageTimeSpent > 300 && completionRate < 70) {
        strugglingFeatures.push({
          feature: feature.feature,
          issue: `Users spend too long (${(feature.averageTimeSpent / 60).toFixed(1)} minutes) with low completion`,
          severity: 'Medium',
          impact:
            'Users are spending excessive time trying to complete tasks, indicating complexity or confusion.',
          recommendation:
            'Streamline the process, add auto-save, and provide better guidance. Consider breaking into smaller steps.',
        });
      }
    });

    // ANALYZE DROP-OFF POINTS
    data.dropOffPoints.forEach((point) => {
      if (point.dropOffRate > 0) {
        let severity: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
        if (point.dropOffRate > 50) {
          severity = 'Critical';
        } else if (point.dropOffRate > 30) {
          severity = 'High';
        } else if (point.dropOffRate > 15) {
          severity = 'Medium';
        }

        const potentialCauses: string[] = [];
        if (point.dropOffRate > 30) {
          potentialCauses.push('Complex form or process');
          potentialCauses.push('Unclear value proposition');
          potentialCauses.push('Technical issues or slow loading');
        }
        if (point.dropOffRate > 15) {
          potentialCauses.push('Lack of guidance or help');
          potentialCauses.push('Unexpected requirements or friction');
        }

        dropOffAnalysis.push({
          page: point.page,
          dropOffRate: point.dropOffRate,
          severity,
          potentialCauses,
          impact: `${point.usersDropped} users (${point.dropOffRate.toFixed(1)}%) abandon at this point. This represents a significant conversion loss.`,
          recommendation: `Analyze user behavior at "${point.page}". Consider simplifying the process, adding progress indicators, or providing exit-intent help.`,
        });
      }
    });

    // ANALYZE UNDERUSED FEATURES
    data.featureUsage.forEach((feature) => {
      const adoptionRate = totalUsersNum > 0 ? (feature.uniqueUsers / totalUsersNum) * 100 : 0;

      if (adoptionRate < 10 && feature.totalClicks < 20) {
        underusedFeatures.push({
          feature: feature.feature,
          usageRate: adoptionRate,
          potential: `This feature could benefit ${totalUsersNum - feature.uniqueUsers} additional users if properly promoted and made more discoverable.`,
          recommendation:
            'Improve feature discoverability through better navigation, onboarding highlights, or contextual prompts. Consider if the feature solves a real user need.',
        });
      } else if (adoptionRate < 30 && feature.completionRate > 80) {
        underusedFeatures.push({
          feature: feature.feature,
          usageRate: adoptionRate,
          potential: `High completion rate (${feature.completionRate.toFixed(1)}%) suggests the feature works well, but low adoption (${adoptionRate.toFixed(1)}%) means users don't know about it.`,
          recommendation:
            'Feature is valuable but hidden. Promote it in onboarding, add to main navigation, or use contextual hints when relevant.',
        });
      }
    });

    // GENERATE UX IMPROVEMENTS
    // Based on struggling features
    strugglingFeatures.forEach((struggling) => {
      if (struggling.severity === 'Critical' || struggling.severity === 'High') {
        uxImprovements.push({
          priority: 'High',
          improvement: `Fix usability issues in "${struggling.feature}"`,
          impact: `Will improve experience for ${data.featureUsage.find((f) => f.feature === struggling.feature)?.uniqueUsers || 0} users and reduce support burden.`,
          effort: 'Medium',
          recommendation: struggling.recommendation,
        });
      }
    });

    // Based on drop-off points
    dropOffAnalysis.forEach((dropOff) => {
      if (dropOff.severity === 'Critical' || dropOff.severity === 'High') {
        uxImprovements.push({
          priority: 'High',
          improvement: `Reduce drop-off at "${dropOff.page}"`,
          impact: `Could recover ${dropOff.usersDropped} users and improve conversion rate by ${(dropOff.dropOffRate * 0.5).toFixed(1)}%.`,
          effort: 'Medium',
          recommendation: dropOff.recommendation,
        });
      }
    });

    // Based on underused features
    underusedFeatures.forEach((underused) => {
      if (underused.usageRate < 5) {
        uxImprovements.push({
          priority: 'Medium',
          improvement: `Improve discoverability of "${underused.feature}"`,
          impact: `Could increase adoption from ${underused.usageRate.toFixed(1)}% to 20-30% with better promotion.`,
          effort: 'Low',
          recommendation: underused.recommendation,
        });
      }
    });

    // General improvements
    if (engagementRate < 30) {
      uxImprovements.push({
        priority: 'High',
        improvement: 'Improve overall user engagement',
        impact: `Only ${engagementRate.toFixed(1)}% of users are active. Improving onboarding and feature discoverability could significantly increase engagement.`,
        effort: 'High',
        recommendation:
          'Review onboarding flow, add feature highlights, implement progressive disclosure, and create in-app guidance.',
      });
    }

    // Calculate overall health
    let engagementScore = 0;
    engagementScore += engagementRate * 0.4; // 40% weight on engagement
    const avgCompletionRate =
      data.featureUsage.reduce((sum, f) => sum + f.completionRate, 0) /
      Math.max(1, data.featureUsage.length);
    engagementScore += avgCompletionRate * 0.3; // 30% weight on completion
    const avgErrorRate =
      data.featureUsage.reduce((sum, f) => sum + f.errorRate, 0) /
      Math.max(1, data.featureUsage.length);
    engagementScore += (100 - avgErrorRate) * 0.3; // 30% weight on low errors

    let overallHealth: 'Excellent' | 'Good' | 'Fair' | 'Poor' = 'Excellent';
    if (engagementScore < 50) {
      overallHealth = 'Poor';
    } else if (engagementScore < 70) {
      overallHealth = 'Fair';
    } else if (engagementScore < 85) {
      overallHealth = 'Good';
    }

    // Key insights
    if (engagementRate < 40) {
      keyInsights.push(
        `Low engagement: Only ${engagementRate.toFixed(1)}% of users are active. Focus on onboarding and feature discovery.`
      );
    }
    if (strugglingFeatures.length > 5) {
      keyInsights.push(
        `Multiple struggling features (${strugglingFeatures.length}) indicate systemic UX issues that need attention.`
      );
    }
    if (
      dropOffAnalysis.filter((d) => d.severity === 'Critical' || d.severity === 'High').length > 0
    ) {
      keyInsights.push(
        'Critical drop-off points identified - addressing these will have the highest impact on conversion.'
      );
    }
    if (underusedFeatures.length > 3) {
      keyInsights.push(
        `${underusedFeatures.length} features are underused - improving discoverability could unlock significant value.`
      );
    }

    // Sort improvements by priority
    uxImprovements.sort((a, b) => {
      const priorityOrder = { High: 3, Medium: 2, Low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    return {
      strugglingFeatures,
      dropOffAnalysis,
      underusedFeatures,
      uxImprovements,
      summary: {
        overallHealth,
        engagementScore: Math.round(engagementScore),
        keyInsights,
      },
    };
  };

  const handleAnalyze = () => {
    if (!totalUsers || !activeUsers || !usageData) {
      return;
    }

    try {
      const parsedData: UsageData = JSON.parse(usageData);
      parsedData.totalUsers = parseInt(totalUsers) || 0;
      parsedData.activeUsers = parseInt(activeUsers) || 0;

      const result = analyzeUsage(parsedData);
      setAnalysis(result);
    } catch (error) {
      console.error('Error parsing usage data:', error);
    }
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Usage Analytics
          </CardTitle>
          <CardDescription>
            Analyze platform usage data to identify UX issues and improvement opportunities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Metrics */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Basic Metrics</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="totalUsers">Total Users *</Label>
                <Input
                  id="totalUsers"
                  type="number"
                  value={totalUsers}
                  onChange={(e) => setTotalUsers(e.target.value)}
                  placeholder="1000"
                />
              </div>
              <div>
                <Label htmlFor="activeUsers">Active Users (Last 30 Days) *</Label>
                <Input
                  id="activeUsers"
                  type="number"
                  value={activeUsers}
                  onChange={(e) => setActiveUsers(e.target.value)}
                  placeholder="300"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Usage Data Input */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Usage Data (JSON)</h3>
            <div>
              <Label htmlFor="usageData">Feature Usage, Drop-offs, and Journey Data *</Label>
              <textarea
                id="usageData"
                value={usageData}
                onChange={(e) => setUsageData(e.target.value)}
                placeholder={`{
  "featureUsage": [
    {
      "feature": "Add Property",
      "totalClicks": 150,
      "uniqueUsers": 80,
      "completionRate": 65,
      "averageTimeSpent": 180,
      "errorRate": 12
    }
  ],
  "dropOffPoints": [
    {
      "page": "Property Form Step 2",
      "dropOffRate": 25,
      "usersAtPage": 100,
      "usersDropped": 25
    }
  ],
  "userJourneys": [
    {
      "journey": "Property Onboarding",
      "startUsers": 200,
      "completionUsers": 120,
      "averageSteps": 5
    }
  ]
}`}
                className="min-h-[300px] w-full rounded-md border p-3 font-mono text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter JSON data with featureUsage, dropOffPoints, and userJourneys arrays
              </p>
            </div>
          </div>

          <Button onClick={handleAnalyze} className="w-full" size="lg">
            <BarChart3 className="mr-2 h-4 w-4" />
            Analyze Usage Data
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <>
          {/* Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Platform Health Summary</CardTitle>
                <Badge className={getHealthColor(analysis.summary.overallHealth)}>
                  {analysis.summary.overallHealth}
                </Badge>
              </div>
              <CardDescription>
                Engagement Score: {analysis.summary.engagementScore}/100
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.summary.keyInsights.map((insight, index) => (
                  <Alert key={index} className="border-blue-200 bg-blue-50">
                    <Lightbulb className="h-4 w-4 text-blue-500" />
                    <AlertDescription>{insight}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Struggling Features */}
          {analysis.strugglingFeatures.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Features Users Struggle With
                </CardTitle>
                <CardDescription>
                  Features with high error rates, low completion, or usability issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.strugglingFeatures.map((feature, index) => (
                    <Alert
                      key={index}
                      className={
                        feature.severity === 'Critical'
                          ? 'border-red-200 bg-red-50'
                          : feature.severity === 'High'
                            ? 'border-orange-200 bg-orange-50'
                            : feature.severity === 'Medium'
                              ? 'border-yellow-200 bg-yellow-50'
                              : 'border-blue-200 bg-blue-50'
                      }
                    >
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <AlertTitle className="flex items-center gap-2">
                        {feature.feature}
                        <Badge className={getSeverityColor(feature.severity)}>
                          {feature.severity}
                        </Badge>
                      </AlertTitle>
                      <AlertDescription className="mt-2 space-y-2">
                        <p className="font-medium">{feature.issue}</p>
                        <p className="text-sm">{feature.impact}</p>
                        <div className="mt-2 rounded border border-border bg-card p-3 text-card-foreground">
                          <p className="text-sm font-medium text-gray-800">
                            <strong>Recommendation:</strong> {feature.recommendation}
                          </p>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Drop-off Points */}
          {analysis.dropOffAnalysis.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-orange-500" />
                  Drop-off Points
                </CardTitle>
                <CardDescription>Pages or steps where users abandon the process</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.dropOffAnalysis.map((dropOff, index) => (
                    <div
                      key={index}
                      className={`rounded-lg border p-4 ${
                        dropOff.severity === 'Critical'
                          ? 'border-red-200 bg-red-50'
                          : dropOff.severity === 'High'
                            ? 'border-orange-200 bg-orange-50'
                            : dropOff.severity === 'Medium'
                              ? 'border-yellow-200 bg-yellow-50'
                              : 'border-blue-200 bg-blue-50'
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800">{dropOff.page}</h3>
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(dropOff.severity)}>
                            {dropOff.severity}
                          </Badge>
                          <Badge variant="outline">
                            {dropOff.dropOffRate.toFixed(1)}% drop-off
                          </Badge>
                        </div>
                      </div>
                      <p className="mb-2 text-sm text-gray-700">{dropOff.impact}</p>
                      <div className="mb-2">
                        <p className="mb-1 text-xs font-medium text-gray-600">Potential Causes:</p>
                        <ul className="list-inside list-disc text-xs text-gray-600">
                          {dropOff.potentialCauses.map((cause, i) => (
                            <li key={i}>{cause}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-2 rounded border border-border bg-card p-3 text-card-foreground">
                        <p className="text-sm font-medium text-gray-800">
                          <strong>Recommendation:</strong> {dropOff.recommendation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Underused Features */}
          {analysis.underusedFeatures.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-yellow-500" />
                  Underused Features
                </CardTitle>
                <CardDescription>Features with low adoption but high potential</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.underusedFeatures.map((feature, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-yellow-200 bg-yellow-50 p-4"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800">{feature.feature}</h3>
                        <Badge variant="outline">{feature.usageRate.toFixed(1)}% adoption</Badge>
                      </div>
                      <p className="mb-2 text-sm text-gray-700">{feature.potential}</p>
                      <div className="rounded border border-border bg-card p-3 text-card-foreground">
                        <p className="text-sm font-medium text-gray-800">
                          <strong>Recommendation:</strong> {feature.recommendation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* UX Improvements */}
          {analysis.uxImprovements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-green-500" />
                  Suggested UX Improvements
                </CardTitle>
                <CardDescription>
                  Prioritized recommendations for improving user experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.uxImprovements.map((improvement, index) => (
                    <div
                      key={index}
                      className={`rounded-lg border p-4 ${
                        improvement.priority === 'High'
                          ? 'border-red-200 bg-red-50'
                          : improvement.priority === 'Medium'
                            ? 'border-yellow-200 bg-yellow-50'
                            : 'border-blue-200 bg-blue-50'
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800">{improvement.improvement}</h3>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              improvement.priority === 'High'
                                ? 'bg-red-100 text-red-800'
                                : improvement.priority === 'Medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-blue-100 text-blue-800'
                            }
                          >
                            {improvement.priority} Priority
                          </Badge>
                          <Badge variant="outline">{improvement.effort} Effort</Badge>
                        </div>
                      </div>
                      <p className="mb-2 text-sm text-gray-700">{improvement.impact}</p>
                      <div className="rounded border border-border bg-card p-3 text-card-foreground">
                        <p className="text-sm font-medium text-gray-800">
                          <strong>Action:</strong> {improvement.recommendation}
                        </p>
                      </div>
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
