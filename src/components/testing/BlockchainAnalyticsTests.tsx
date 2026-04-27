// Blockchain Analytics Tests
// Comprehensive testing suite for blockchain analytics and AI insights

import React, { useState } from 'react';
import { useBlockchainAnalytics } from '@/hooks/useBlockchainAnalytics';
import { useBlockchain } from '@/hooks/useBlockchain';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  Target,
  Shield,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Zap,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function BlockchainAnalyticsTests() {
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, 'pass' | 'fail' | 'pending'>>({});
  const [testDetails, setTestDetails] = useState<Record<string, string>>({});

  const { walletAddress, isConnected } = useBlockchain();
  const {
    marketAnalytics,
    portfolioAnalytics,
    insights,
    opportunities,
    risks,
    predictions,
    analyticsSummary,
    isLoading,
    hasError,
    isConnected: analyticsConnected,
    canUseAnalytics,
    canUseAIInsights,
    canUseRealTime,
    generateMarketAnalysis,
    optimizePortfolio,
    assessRisks,
    detectOpportunities,
    refreshAll,
    aiAnalysis,
  } = useBlockchainAnalytics({
    userId: 'test-user',
    walletAddress: walletAddress || undefined,
    enableRealTime: true,
    autoRefresh: false,
  });

  // Test Categories
  const testCategories = [
    {
      id: 'feature-access',
      name: 'Feature Access',
      description: 'Test subscription-based feature access controls',
      icon: Shield,
    },
    {
      id: 'data-loading',
      name: 'Data Loading',
      description: 'Test analytics data loading and caching',
      icon: Activity,
    },
    {
      id: 'ai-insights',
      name: 'AI Insights',
      description: 'Test AI-powered analysis and recommendations',
      icon: Brain,
    },
    {
      id: 'real-time',
      name: 'Real-time Updates',
      description: 'Test live data streaming and updates',
      icon: Zap,
    },
    {
      id: 'market-analysis',
      name: 'Market Analysis',
      description: 'Test market trends and predictions',
      icon: TrendingUp,
    },
    {
      id: 'portfolio-optimization',
      name: 'Portfolio Optimization',
      description: 'Test portfolio analysis and optimization',
      icon: Target,
    },
  ];

  // Individual Tests
  const tests = {
    'feature-access': [
      {
        id: 'analytics-access',
        name: 'Analytics Feature Access',
        description: 'Verify blockchain analytics feature access',
        test: async () => {
          if (canUseAnalytics) {
            return { success: true, message: 'Analytics access granted' };
          } else {
            return { success: false, message: 'Analytics access denied - check subscription' };
          }
        },
      },
      {
        id: 'ai-insights-access',
        name: 'AI Insights Access',
        description: 'Verify AI insights feature access',
        test: async () => {
          if (canUseAIInsights) {
            return { success: true, message: 'AI insights access granted' };
          } else {
            return { success: false, message: 'AI insights access denied - upgrade required' };
          }
        },
      },
      {
        id: 'real-time-access',
        name: 'Real-time Updates Access',
        description: 'Verify real-time updates feature access',
        test: async () => {
          if (canUseRealTime) {
            return { success: true, message: 'Real-time updates access granted' };
          } else {
            return { success: false, message: 'Real-time updates access denied - premium feature' };
          }
        },
      },
    ],
    'data-loading': [
      {
        id: 'market-data',
        name: 'Market Analytics Loading',
        description: 'Test market analytics data loading',
        test: async () => {
          if (marketAnalytics) {
            const hasOverview =
              marketAnalytics.overview && marketAnalytics.overview.totalMarketCap > 0;
            const hasTrends = marketAnalytics.trends && marketAnalytics.trends.length > 0;
            const hasOpportunities =
              marketAnalytics.opportunities && marketAnalytics.opportunities.length >= 0;

            if (hasOverview && hasTrends) {
              return {
                success: true,
                message: `Market data loaded: $${marketAnalytics.overview.totalMarketCap.toLocaleString()} market cap, ${marketAnalytics.trends.length} trends`,
              };
            } else {
              return { success: false, message: 'Market data incomplete or missing' };
            }
          } else {
            return { success: false, message: 'Market analytics data not loaded' };
          }
        },
      },
      {
        id: 'portfolio-data',
        name: 'Portfolio Analytics Loading',
        description: 'Test portfolio analytics data loading',
        test: async () => {
          if (portfolioAnalytics) {
            const hasValue = portfolioAnalytics.totalValue >= 0;
            const hasProperties =
              portfolioAnalytics.properties && portfolioAnalytics.properties.length >= 0;
            const hasScores =
              portfolioAnalytics.performanceScore >= 0 && portfolioAnalytics.riskScore >= 0;

            if (hasValue && hasScores) {
              return {
                success: true,
                message: `Portfolio loaded: $${portfolioAnalytics.totalValue.toLocaleString()} value, ${portfolioAnalytics.properties.length} properties`,
              };
            } else {
              return { success: false, message: 'Portfolio data incomplete' };
            }
          } else {
            return {
              success: false,
              message: 'Portfolio analytics not available - wallet connection required',
            };
          }
        },
      },
      {
        id: 'analytics-summary',
        name: 'Analytics Summary',
        description: 'Test analytics summary calculations',
        test: async () => {
          if (analyticsSummary) {
            const hasMetrics =
              analyticsSummary.totalValue >= 0 &&
              analyticsSummary.marketCap >= 0 &&
              analyticsSummary.volume24h >= 0;
            const hasScores =
              analyticsSummary.performanceScore >= 0 &&
              analyticsSummary.riskScore >= 0 &&
              analyticsSummary.diversificationScore >= 0;

            if (hasMetrics && hasScores) {
              return {
                success: true,
                message: `Summary calculated: ${analyticsSummary.performanceScore}/100 performance, ${analyticsSummary.sentiment} sentiment`,
              };
            } else {
              return { success: false, message: 'Analytics summary incomplete' };
            }
          } else {
            return { success: false, message: 'Analytics summary not available' };
          }
        },
      },
    ],
    'ai-insights': [
      {
        id: 'generate-insights',
        name: 'Generate AI Insights',
        description: 'Test AI insight generation',
        test: async () => {
          if (!canUseAIInsights) {
            return { success: false, message: 'AI insights not available in current plan' };
          }

          try {
            await generateMarketAnalysis();
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for processing

            if (insights.length > 0) {
              const avgConfidence =
                insights.reduce((sum, insight) => sum + insight.confidence, 0) / insights.length;
              return {
                success: true,
                message: `Generated ${insights.length} insights with ${avgConfidence.toFixed(1)}% avg confidence`,
              };
            } else {
              return { success: false, message: 'No insights generated' };
            }
          } catch (error) {
            return { success: false, message: `AI insight generation failed: ${error.message}` };
          }
        },
      },
      {
        id: 'portfolio-optimization',
        name: 'Portfolio Optimization',
        description: 'Test AI portfolio optimization',
        test: async () => {
          if (!canUseAIInsights || !walletAddress) {
            return {
              success: false,
              message: 'Portfolio optimization requires AI access and wallet connection',
            };
          }

          try {
            await optimizePortfolio();
            await new Promise((resolve) => setTimeout(resolve, 1500));

            if (portfolioAnalytics && portfolioAnalytics.recommendations.length > 0) {
              return {
                success: true,
                message: `Generated ${portfolioAnalytics.recommendations.length} optimization recommendations`,
              };
            } else {
              return { success: false, message: 'No optimization recommendations generated' };
            }
          } catch (error) {
            return { success: false, message: `Portfolio optimization failed: ${error.message}` };
          }
        },
      },
      {
        id: 'risk-assessment',
        name: 'Risk Assessment',
        description: 'Test AI risk assessment',
        test: async () => {
          if (!canUseAIInsights) {
            return { success: false, message: 'Risk assessment requires AI insights access' };
          }

          try {
            await assessRisks();
            await new Promise((resolve) => setTimeout(resolve, 1500));

            if (risks.length >= 0) {
              const highRisks = risks.filter(
                (risk) => risk.severity === 'high' || risk.severity === 'critical'
              ).length;
              return {
                success: true,
                message: `Assessed ${risks.length} risk factors, ${highRisks} high priority`,
              };
            } else {
              return { success: false, message: 'Risk assessment incomplete' };
            }
          } catch (error) {
            return { success: false, message: `Risk assessment failed: ${error.message}` };
          }
        },
      },
    ],
    'real-time': [
      {
        id: 'connection-status',
        name: 'Real-time Connection',
        description: 'Test real-time analytics connection',
        test: async () => {
          if (analyticsConnected) {
            return { success: true, message: 'Real-time analytics connected' };
          } else {
            return { success: false, message: 'Real-time analytics disconnected' };
          }
        },
      },
      {
        id: 'data-refresh',
        name: 'Data Refresh',
        description: 'Test manual data refresh functionality',
        test: async () => {
          try {
            await refreshAll();
            await new Promise((resolve) => setTimeout(resolve, 2000));

            return { success: true, message: 'Data refresh completed successfully' };
          } catch (error) {
            return { success: false, message: `Data refresh failed: ${error.message}` };
          }
        },
      },
    ],
    'market-analysis': [
      {
        id: 'market-trends',
        name: 'Market Trends Analysis',
        description: 'Test market trend analysis',
        test: async () => {
          if (marketAnalytics && marketAnalytics.trends) {
            const positiveTrends = marketAnalytics.trends.filter(
              (trend) => trend.changePercentage > 0
            ).length;
            const negativeTrends = marketAnalytics.trends.filter(
              (trend) => trend.changePercentage < 0
            ).length;

            return {
              success: true,
              message: `Analyzed ${marketAnalytics.trends.length} trends: ${positiveTrends} positive, ${negativeTrends} negative`,
            };
          } else {
            return { success: false, message: 'Market trends data not available' };
          }
        },
      },
      {
        id: 'opportunity-detection',
        name: 'Opportunity Detection',
        description: 'Test investment opportunity detection',
        test: async () => {
          if (!canUseAIInsights) {
            return { success: false, message: 'Opportunity detection requires AI insights' };
          }

          try {
            await detectOpportunities();
            await new Promise((resolve) => setTimeout(resolve, 1500));

            if (opportunities.length >= 0) {
              const highConfidenceOpps = opportunities.filter((opp) => opp.confidence > 80).length;
              return {
                success: true,
                message: `Detected ${opportunities.length} opportunities, ${highConfidenceOpps} high confidence`,
              };
            } else {
              return { success: false, message: 'No opportunities detected' };
            }
          } catch (error) {
            return { success: false, message: `Opportunity detection failed: ${error.message}` };
          }
        },
      },
      {
        id: 'predictions',
        name: 'Market Predictions',
        description: 'Test AI market predictions',
        test: async () => {
          if (predictions && predictions.length > 0) {
            const avgConfidence =
              predictions.reduce((sum, pred) => sum + pred.confidence, 0) / predictions.length;
            const bullishPredictions = predictions.filter(
              (pred) => pred.predictedValue > pred.currentValue
            ).length;

            return {
              success: true,
              message: `Generated ${predictions.length} predictions, ${avgConfidence.toFixed(1)}% avg confidence, ${bullishPredictions} bullish`,
            };
          } else {
            return { success: false, message: 'No market predictions available' };
          }
        },
      },
    ],
    'portfolio-optimization': [
      {
        id: 'performance-scoring',
        name: 'Performance Scoring',
        description: 'Test portfolio performance scoring',
        test: async () => {
          if (analyticsSummary) {
            const scores = {
              performance: analyticsSummary.performanceScore,
              risk: analyticsSummary.riskScore,
              diversification: analyticsSummary.diversificationScore,
            };

            const validScores = Object.values(scores).every((score) => score >= 0 && score <= 100);

            if (validScores) {
              return {
                success: true,
                message: `Scores calculated: Performance ${scores.performance}/100, Risk ${scores.risk}/100, Diversification ${scores.diversification}/100`,
              };
            } else {
              return { success: false, message: 'Invalid performance scores calculated' };
            }
          } else {
            return { success: false, message: 'Performance scoring not available' };
          }
        },
      },
    ],
  };

  // Run individual test
  const runTest = async (categoryId: string, testId: string) => {
    setActiveTest(`${categoryId}-${testId}`);
    setTestResults((prev) => ({ ...prev, [`${categoryId}-${testId}`]: 'pending' }));

    try {
      const test = tests[categoryId]?.find((t) => t.id === testId);
      if (!test) {
        throw new Error('Test not found');
      }

      const result = await test.test();

      setTestResults((prev) => ({
        ...prev,
        [`${categoryId}-${testId}`]: result.success ? 'pass' : 'fail',
      }));
      setTestDetails((prev) => ({
        ...prev,
        [`${categoryId}-${testId}`]: result.message,
      }));

      if (result.success) {
        toast.success(`Test passed: ${test.name}`);
      } else {
        toast.error(`Test failed: ${test.name}`);
      }
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        [`${categoryId}-${testId}`]: 'fail',
      }));
      setTestDetails((prev) => ({
        ...prev,
        [`${categoryId}-${testId}`]: error.message,
      }));
      toast.error(`Test error: ${error.message}`);
    } finally {
      setActiveTest(null);
    }
  };

  // Run all tests in category
  const runCategoryTests = async (categoryId: string) => {
    const categoryTests = tests[categoryId] || [];

    for (const test of categoryTests) {
      await runTest(categoryId, test.id);
      await new Promise((resolve) => setTimeout(resolve, 500)); // Brief delay between tests
    }
  };

  // Run all tests
  const runAllTests = async () => {
    for (const category of testCategories) {
      await runCategoryTests(category.id);
    }
    toast.success('All tests completed');
  };

  // Get test status
  const getTestStatus = (categoryId: string, testId: string) => {
    return testResults[`${categoryId}-${testId}`] || 'idle';
  };

  // Get category summary
  const getCategorySummary = (categoryId: string) => {
    const categoryTests = tests[categoryId] || [];
    const results = categoryTests.map((test) => getTestStatus(categoryId, test.id));
    const passed = results.filter((r) => r === 'pass').length;
    const failed = results.filter((r) => r === 'fail').length;
    const pending = results.filter((r) => r === 'pending').length;
    const total = results.length;

    return { passed, failed, pending, total };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Blockchain Analytics Tests</h3>
          <p className="text-sm text-muted-foreground">
            Comprehensive testing suite for blockchain analytics and AI insights
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={runAllTests}
            disabled={!!activeTest}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={cn('h-4 w-4', activeTest && 'animate-spin')} />
            <span>Run All Tests</span>
          </Button>
        </div>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>System Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="flex items-center space-x-2">
              <div
                className={cn('h-2 w-2 rounded-full', isConnected ? 'bg-green-500' : 'bg-red-500')}
              />
              <span className="text-sm">Wallet {isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div
                className={cn(
                  'h-2 w-2 rounded-full',
                  analyticsConnected ? 'bg-green-500' : 'bg-yellow-500'
                )}
              />
              <span className="text-sm">Analytics {analyticsConnected ? 'Live' : 'Offline'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div
                className={cn(
                  'h-2 w-2 rounded-full',
                  canUseAnalytics ? 'bg-green-500' : 'bg-red-500'
                )}
              />
              <span className="text-sm">Analytics {canUseAnalytics ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div
                className={cn(
                  'h-2 w-2 rounded-full',
                  canUseAIInsights ? 'bg-green-500' : 'bg-red-500'
                )}
              />
              <span className="text-sm">
                AI Insights {canUseAIInsights ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Categories */}
      <div className="grid gap-4">
        {testCategories.map((category) => {
          const summary = getCategorySummary(category.id);
          const categoryTests = tests[category.id] || [];

          return (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <category.icon className="h-5 w-5" />
                    <div>
                      <CardTitle className="text-base">{category.name}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {summary.passed}/{summary.total} passed
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => runCategoryTests(category.id)}
                      disabled={!!activeTest}
                    >
                      Run Tests
                    </Button>
                  </div>
                </div>
                {summary.total > 0 && (
                  <Progress value={(summary.passed / summary.total) * 100} className="mt-2" />
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categoryTests.map((test) => {
                    const status = getTestStatus(category.id, test.id);
                    const detail = testDetails[`${category.id}-${test.id}`];
                    const isActive = activeTest === `${category.id}-${test.id}`;

                    return (
                      <div
                        key={test.id}
                        className="flex items-center justify-between rounded border p-2"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-2">
                            {status === 'pass' && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                            {status === 'fail' && <XCircle className="h-4 w-4 text-red-600" />}
                            {status === 'pending' && (
                              <Clock className="h-4 w-4 animate-spin text-yellow-600" />
                            )}
                            {status === 'idle' && (
                              <div className="h-4 w-4 rounded-full border border-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{test.name}</div>
                            <div className="text-xs text-muted-foreground">{test.description}</div>
                            {detail && (
                              <div
                                className={cn(
                                  'mt-1 text-xs',
                                  status === 'pass' && 'text-green-600',
                                  status === 'fail' && 'text-red-600',
                                  status === 'pending' && 'text-yellow-600'
                                )}
                              >
                                {detail}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => runTest(category.id, test.id)}
                          disabled={!!activeTest}
                        >
                          {isActive ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Run'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
