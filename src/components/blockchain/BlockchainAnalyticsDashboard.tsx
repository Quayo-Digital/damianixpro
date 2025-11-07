// Simplified Blockchain Analytics Dashboard
// Real-time analytics and AI-powered investment insights

import React, { useState, useMemo } from 'react';
import { useBlockchainAnalytics } from '@/hooks/useBlockchainAnalytics';
import { useBlockchain } from '@/hooks/useBlockchain';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { BlockchainPredictions } from './BlockchainPredictions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  TrendingDown,
  Brain,
  Target,
  Shield,
  AlertTriangle,
  Zap,
  BarChart3,
  Activity,
  Wallet,
  Globe,
  RefreshCw,
  Eye,
  Sparkles,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlockchainAnalyticsDashboardProps {
  className?: string;
  compact?: boolean;
  userId?: string;
}

export function BlockchainAnalyticsDashboard({ 
  className, 
  compact = false,
  userId 
}: BlockchainAnalyticsDashboardProps) {
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
    selectedTimeframe,
    selectedNetwork,
    canUseAnalytics,
    canUseAIInsights,
    canUseRealTime,
    generateMarketAnalysis,
    optimizePortfolio,
    assessRisks,
    detectOpportunities,
    updateTimeframe,
    updateNetwork,
    refreshAll,
    aiAnalysis
  } = useBlockchainAnalytics({
    userId,
    walletAddress: walletAddress || undefined,
    enableRealTime: true,
    autoRefresh: true
  });

  const [activeTab, setActiveTab] = useState('overview');

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Get trend info
  const getTrendInfo = (value: number) => {
    const isPositive = value >= 0;
    return {
      icon: isPositive ? TrendingUp : TrendingDown,
      color: isPositive ? 'text-green-600' : 'text-red-600'
    };
  };

  // Memoized calculations
  const topInsights = useMemo(() => 
    insights
      .filter(insight => insight.confidence > 70)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3)
  , [insights]);

  if (!canUseAnalytics) {
    return (
      <FeatureGate 
        feature="blockchain_analytics"
        fallback={
          <Card className={className}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Blockchain Analytics</span>
              </CardTitle>
              <CardDescription>
                Advanced analytics and AI insights for your blockchain investments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  Upgrade to access real-time blockchain analytics, AI-powered insights, and investment recommendations.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        }
      />
    );
  }

  if (compact) {
    return (
      <Card className={cn("border-purple-200", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <span>AI Analytics</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              {analyticsConnected && (
                <Badge variant="outline" className="text-green-600 border-green-200">
                  <Activity className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshAll}
                disabled={isLoading}
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Portfolio Value</p>
              <p className="text-lg font-semibold">
                {formatCurrency(analyticsSummary.totalValue)}
              </p>
              <p className={cn(
                "text-sm flex items-center",
                getTrendInfo(analyticsSummary.totalChangePercentage).color
              )}>
                {getTrendInfo(analyticsSummary.totalChangePercentage).icon && (
                  React.createElement(getTrendInfo(analyticsSummary.totalChangePercentage).icon, { className: "h-3 w-3 mr-1" })
                )}
                {formatPercentage(analyticsSummary.totalChangePercentage)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Performance Score</p>
              <div className="flex items-center space-x-2">
                <Progress value={analyticsSummary.performanceScore} className="flex-1" />
                <span className="text-sm font-medium">{analyticsSummary.performanceScore}/100</span>
              </div>
            </div>
          </div>

          {/* Top Insight */}
          {topInsights[0] && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-2">
                <Brain className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-900">{topInsights[0].title}</p>
                  <p className="text-xs text-blue-700 mt-1">{topInsights[0].description}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {topInsights[0].confidence}% confidence
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {topInsights[0].impact} impact
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={generateMarketAnalysis}
              disabled={!canUseAIInsights || aiAnalysis.isPending}
              className="flex-1"
            >
              <Brain className="h-3 w-3 mr-1" />
              AI Analysis
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('overview')}
              className="flex-1"
            >
              <Eye className="h-3 w-3 mr-1" />
              View Full
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Brain className="h-6 w-6 text-purple-600" />
            <span>Blockchain Analytics</span>
          </h2>
          <p className="text-muted-foreground">
            AI-powered insights and real-time analytics for your blockchain investments
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedTimeframe} onValueChange={updateTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 Hour</SelectItem>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedNetwork} onValueChange={updateNetwork}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ethereum">Ethereum</SelectItem>
              <SelectItem value="polygon">Polygon</SelectItem>
              <SelectItem value="bsc">BSC</SelectItem>
              <SelectItem value="arbitrum">Arbitrum</SelectItem>
              <SelectItem value="optimism">Optimism</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={refreshAll}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isConnected ? "bg-green-500" : "bg-red-500"
          )} />
          <span className="text-sm">
            Wallet {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            analyticsConnected ? "bg-green-500" : "bg-yellow-500"
          )} />
          <span className="text-sm">
            Analytics {analyticsConnected ? 'Live' : 'Offline'}
          </span>
        </div>
        {canUseRealTime && (
          <Badge variant="outline" className="text-green-600 border-green-200">
            <Zap className="h-3 w-3 mr-1" />
            Real-time Updates
          </Badge>
        )}
      </div>

      {/* Error State */}
      {hasError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load analytics data. Please try refreshing or check your connection.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="risks">Risk Analysis</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Portfolio Value</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(analyticsSummary.totalValue)}
                    </p>
                    <p className={cn(
                      "text-sm flex items-center mt-1",
                      getTrendInfo(analyticsSummary.totalChangePercentage).color
                    )}>
                      {getTrendInfo(analyticsSummary.totalChangePercentage).icon && (
                        React.createElement(getTrendInfo(analyticsSummary.totalChangePercentage).icon, { className: "h-3 w-3 mr-1" })
                      )}
                      {formatPercentage(analyticsSummary.totalChangePercentage)}
                    </p>
                  </div>
                  <Wallet className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Market Cap</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(analyticsSummary.marketCap)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Total market value
                    </p>
                  </div>
                  <Globe className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">24h Volume</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(analyticsSummary.volume24h)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Trading activity
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Sentiment</p>
                    <p className="text-2xl font-bold capitalize">
                      {analyticsSummary.sentiment}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Progress value={analyticsSummary.sentimentScore} className="flex-1" />
                      <span className="text-sm">{analyticsSummary.sentimentScore}/100</span>
                    </div>
                  </div>
                  <Activity className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Scores */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Performance Score</span>
                    <span className="text-sm text-muted-foreground">
                      {analyticsSummary.performanceScore}/100
                    </span>
                  </div>
                  <Progress value={analyticsSummary.performanceScore} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Risk Score</span>
                    <span className="text-sm text-muted-foreground">
                      {analyticsSummary.riskScore}/100
                    </span>
                  </div>
                  <Progress 
                    value={analyticsSummary.riskScore} 
                    className="[&>div]:bg-yellow-500"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Diversification</span>
                    <span className="text-sm text-muted-foreground">
                      {analyticsSummary.diversificationScore}/100
                    </span>
                  </div>
                  <Progress 
                    value={analyticsSummary.diversificationScore}
                    className="[&>div]:bg-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">AI-Powered Insights</h3>
            <div className="flex space-x-2">
              <Button
                onClick={generateMarketAnalysis}
                disabled={!canUseAIInsights || aiAnalysis.isPending}
              >
                <Brain className="h-4 w-4 mr-2" />
                Generate Analysis
              </Button>
              <Button
                variant="outline"
                onClick={optimizePortfolio}
                disabled={!canUseAIInsights || !walletAddress || aiAnalysis.isPending}
              >
                <Target className="h-4 w-4 mr-2" />
                Optimize Portfolio
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {insights.map((insight) => (
              <Card key={insight.id}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className={cn(
                      "p-2 rounded-full",
                      insight.type === 'bullish' && "bg-green-100 text-green-600",
                      insight.type === 'bearish' && "bg-red-100 text-red-600",
                      insight.type === 'opportunity' && "bg-blue-100 text-blue-600",
                      insight.type === 'warning' && "bg-yellow-100 text-yellow-600",
                      insight.type === 'neutral' && "bg-gray-100 text-gray-600"
                    )}>
                      {insight.type === 'bullish' && <TrendingUp className="h-4 w-4" />}
                      {insight.type === 'bearish' && <TrendingDown className="h-4 w-4" />}
                      {insight.type === 'opportunity' && <Target className="h-4 w-4" />}
                      {insight.type === 'warning' && <AlertTriangle className="h-4 w-4" />}
                      {insight.type === 'neutral' && <Brain className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{insight.title}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {insight.confidence}% confidence
                          </Badge>
                          <Badge variant={
                            insight.impact === 'high' ? 'destructive' :
                            insight.impact === 'medium' ? 'default' : 'secondary'
                          }>
                            {insight.impact} impact
                          </Badge>
                          {insight.aiGenerated && (
                            <Badge variant="outline" className="text-purple-600 border-purple-200">
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {insights.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Insights Available</h3>
                  <p className="text-muted-foreground mb-4">
                    Generate AI-powered insights to get personalized investment recommendations.
                  </p>
                  <Button
                    onClick={generateMarketAnalysis}
                    disabled={!canUseAIInsights || aiAnalysis.isPending}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Generate Insights
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Opportunities Tab */}
        <TabsContent value="opportunities" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Investment Opportunities</h3>
            <Button
              onClick={detectOpportunities}
              disabled={!canUseAIInsights || aiAnalysis.isPending}
            >
              <Target className="h-4 w-4 mr-2" />
              Detect Opportunities
            </Button>
          </div>

          <div className="grid gap-4">
            {opportunities.map((opportunity) => (
              <Card key={opportunity.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{opportunity.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {opportunity.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        +{opportunity.potentialReturn.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Potential Return
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 mb-3">
                    <Badge variant={
                      opportunity.riskLevel === 'low' ? 'secondary' :
                      opportunity.riskLevel === 'medium' ? 'default' : 'destructive'
                    }>
                      {opportunity.riskLevel} risk
                    </Badge>
                    <Badge variant="outline">
                      {opportunity.confidence}% confidence
                    </Badge>
                    <Badge variant="outline">
                      {opportunity.timeframe}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {opportunity.opportunityType}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium">Required Investment</div>
                      <div className="text-lg">{formatCurrency(opportunity.requiredInvestment)}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Timeframe</div>
                      <div className="text-lg">{opportunity.timeframe}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {opportunities.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Opportunities Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Use AI to detect investment opportunities based on market analysis.
                  </p>
                  <Button
                    onClick={detectOpportunities}
                    disabled={!canUseAIInsights || aiAnalysis.isPending}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Detect Opportunities
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Risk Analysis Tab */}
        <TabsContent value="risks" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Risk Analysis</h3>
            <Button
              onClick={assessRisks}
              disabled={!canUseAIInsights || aiAnalysis.isPending}
            >
              <Shield className="h-4 w-4 mr-2" />
              Assess Risks
            </Button>
          </div>

          <div className="grid gap-4">
            {risks.map((risk) => (
              <Card key={risk.id}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className={cn(
                      "p-2 rounded-full",
                      risk.severity === 'low' && "bg-green-100 text-green-600",
                      risk.severity === 'medium' && "bg-yellow-100 text-yellow-600",
                      risk.severity === 'high' && "bg-orange-100 text-orange-600",
                      risk.severity === 'critical' && "bg-red-100 text-red-600"
                    )}>
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{risk.title}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant={
                            risk.severity === 'critical' ? 'destructive' :
                            risk.severity === 'high' ? 'destructive' :
                            risk.severity === 'medium' ? 'default' : 'secondary'
                          }>
                            {risk.severity} severity
                          </Badge>
                          <Badge variant="outline">
                            {risk.probability}% probability
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {risk.description}
                      </p>
                      {risk.mitigation.length > 0 && (
                        <div>
                          <div className="text-sm font-medium mb-2">Mitigation Strategies:</div>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {risk.mitigation.map((strategy, index) => (
                              <li key={index} className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>{strategy}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {risks.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Risks Identified</h3>
                  <p className="text-muted-foreground mb-4">
                    Run AI risk assessment to identify potential threats to your investments.
                  </p>
                  <Button
                    onClick={assessRisks}
                    disabled={!canUseAIInsights || aiAnalysis.isPending}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Assess Risks
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Market Predictions</h3>
            <Badge variant="outline" className="text-purple-600 border-purple-200">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
          </div>

          <BlockchainPredictions
            predictions={predictions}
            onGenerateAnalysis={generateMarketAnalysis}
            canUseAIInsights={canUseAIInsights}
            isLoading={aiAnalysis.isPending}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
