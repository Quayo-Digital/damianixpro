import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  Zap,
  Globe,
  Users,
  BarChart3,
  Settings,
  Play,
  Pause,
  RotateCcw,
  MapPin,
  Smartphone,
  Wifi,
  DollarSign,
  Eye,
  Activity
} from 'lucide-react';
import { useIntelligentOptimizer, PerformanceInsight, OptimizationAction, AnalysisReport } from '@/utils/intelligent-optimizer';

export const IntelligentAnalyticsDashboard = () => {
  const {
    isAnalyzing,
    report,
    error,
    analyzePerformance,
    executeOptimization,
    generatePlan,
    optimizationHistory
  } = useIntelligentOptimizer();

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'immediate' | 'short' | 'medium' | 'long'>('immediate');
  const [optimizationPlan, setOptimizationPlan] = useState<any>(null);
  const [executingActions, setExecutingActions] = useState<Set<string>>(new Set());

  // Auto-analyze on component mount
  useEffect(() => {
    analyzePerformance();
  }, []);

  // Auto-refresh analysis every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAnalyzing) {
        analyzePerformance();
      }
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleGeneratePlan = async () => {
    const plan = await generatePlan(selectedTimeframe);
    setOptimizationPlan(plan);
  };

  const handleExecuteAction = async (actionId: string) => {
    setExecutingActions(prev => new Set(prev).add(actionId));
    try {
      const success = await executeOptimization(actionId);
      if (success) {
        // Refresh analysis after successful optimization
        setTimeout(() => analyzePerformance(), 2000);
      }
    } finally {
      setExecutingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionId);
        return newSet;
      });
    }
  };

  const getInsightIcon = (category: string) => {
    switch (category) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high': return <TrendingDown className="h-4 w-4 text-orange-600" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
    }
  };

  const getInsightBadge = (category: string) => {
    switch (category) {
      case 'critical': return { variant: 'destructive' as const, label: 'Critical' };
      case 'high': return { variant: 'secondary' as const, label: 'High Priority' };
      case 'medium': return { variant: 'outline' as const, label: 'Medium' };
      default: return { variant: 'default' as const, label: 'Low Priority' };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800">Analysis Error</AlertTitle>
        <AlertDescription className="text-red-700">
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                Intelligent Performance Analytics
              </CardTitle>
              <CardDescription>
                AI-powered performance analysis and optimization recommendations for Nigerian market
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={analyzePerformance}
                disabled={isAnalyzing}
                className="flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <Activity className="h-4 w-4 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4" />
                )}
                {isAnalyzing ? 'Analyzing...' : 'Analyze Now'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Analysis Overview */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Overall Score</span>
              </div>
              <div className={`text-2xl font-bold mt-1 ${getScoreColor(report.overallScore)}`}>
                {report.overallScore}/100
              </div>
              <div className="text-xs text-gray-600">
                Last updated: {report.timestamp.toLocaleTimeString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Critical Issues</span>
              </div>
              <div className="text-2xl font-bold mt-1 text-red-600">
                {report.insights.filter(i => i.category === 'critical').length}
              </div>
              <div className="text-xs text-gray-600">Require immediate attention</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Optimization Potential</span>
              </div>
              <div className="text-2xl font-bold mt-1 text-green-600">
                {report.recommendedActions.reduce((sum, action) => sum + action.expectedImprovement, 0)}%
              </div>
              <div className="text-xs text-gray-600">Estimated improvement</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Revenue Impact</span>
              </div>
              <div className="text-lg font-bold mt-1 text-green-600">
                ₦2.4M
              </div>
              <div className="text-xs text-gray-600">Potential monthly increase</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Nigerian Market Insights */}
      {report && (
        <Alert>
          <Globe className="h-4 w-4" />
          <AlertTitle>Nigerian Market Intelligence</AlertTitle>
          <AlertDescription>
            Serving {report.nigerianMarketAnalysis.topCities.reduce((sum, city) => sum + city.users, 0)} users across Nigeria. 
            Top performing city: {report.nigerianMarketAnalysis.topCities[0]?.city} ({report.nigerianMarketAnalysis.topCities[0]?.avgPerformance}% score). 
            Average data usage: {report.nigerianMarketAnalysis.dataUsageAnalysis.avgPerSession}MB per session. 
            Conversion rate: {report.businessImpact.conversionRate}%.
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">🔍 Insights</TabsTrigger>
          <TabsTrigger value="optimization">🚀 Optimization</TabsTrigger>
          <TabsTrigger value="market">🇳🇬 Market Analysis</TabsTrigger>
          <TabsTrigger value="history">📊 History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {report && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Insights Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Key Performance Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {report.insights.slice(0, 3).map((insight) => (
                      <div key={insight.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        {getInsightIcon(insight.category)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{insight.title}</h4>
                            <Badge variant={getInsightBadge(insight.category).variant}>
                              {getInsightBadge(insight.category).label}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                          <div className="text-xs text-green-600 mt-2">
                            +{insight.estimatedImprovement}% potential improvement
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Business Impact */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Business Impact Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Conversion Rate</span>
                      <div className="text-right">
                        <div className="font-bold">{report.businessImpact.conversionRate}%</div>
                        <div className="text-xs text-gray-600">Current rate</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Bounce Rate</span>
                      <div className="text-right">
                        <div className="font-bold">{report.businessImpact.bounceRate}%</div>
                        <div className="text-xs text-gray-600">Users leaving quickly</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>User Satisfaction</span>
                      <div className="text-right">
                        <div className="font-bold">{report.businessImpact.userSatisfaction}/10</div>
                        <div className="text-xs text-gray-600">Average rating</div>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="text-sm font-medium text-green-600">
                        {report.businessImpact.revenueImpact}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {report && (
            <div className="space-y-4">
              {report.insights.map((insight) => (
                <Card key={insight.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {getInsightIcon(insight.category)}
                        {insight.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={getInsightBadge(insight.category).variant}>
                          {getInsightBadge(insight.category).label}
                        </Badge>
                        {insight.nigerianSpecific && (
                          <Badge variant="outline">🇳🇬 Nigerian Optimized</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Description</h4>
                        <p className="text-gray-600">{insight.description}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Business Impact</h4>
                        <p className="text-gray-600">{insight.impact}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Recommendation</h4>
                        <p className="text-gray-600">{insight.recommendation}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                        <div>
                          <div className="text-sm font-medium">Expected Improvement</div>
                          <div className="text-lg font-bold text-green-600">+{insight.estimatedImprovement}%</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Timeframe</div>
                          <div className="text-sm text-gray-600">{insight.timeframe}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Priority</div>
                          <div className="text-sm text-gray-600">#{insight.priority}</div>
                        </div>
                      </div>
                      
                      {(insight.location || insight.networkType) && (
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {insight.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {insight.location}
                            </div>
                          )}
                          {insight.networkType && (
                            <div className="flex items-center gap-1">
                              <Wifi className="h-3 w-3" />
                              {insight.networkType.toUpperCase()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Optimization Plan Generator
                </CardTitle>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedTimeframe}
                    onChange={(e) => setSelectedTimeframe(e.target.value as any)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="immediate">Immediate (1-3 days)</option>
                    <option value="short">Short-term (1-2 weeks)</option>
                    <option value="medium">Medium-term (2-4 weeks)</option>
                    <option value="long">Long-term (1-3 months)</option>
                  </select>
                  <Button onClick={handleGeneratePlan}>Generate Plan</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {optimizationPlan && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {optimizationPlan.estimatedImprovement}%
                      </div>
                      <div className="text-sm text-gray-600">Estimated Improvement</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-lg font-bold">{optimizationPlan.timeline}</div>
                      <div className="text-sm text-gray-600">Implementation Time</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-sm font-bold">{optimizationPlan.riskAssessment.split(' - ')[0]}</div>
                      <div className="text-sm text-gray-600">Risk Level</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Recommended Actions</h4>
                    {optimizationPlan.actions.map((action: OptimizationAction) => (
                      <div key={action.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium">{action.name}</h5>
                            <Badge variant="outline">{action.category}</Badge>
                            {action.nigerianOptimized && (
                              <Badge variant="secondary">🇳🇬 Nigerian</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>+{action.expectedImprovement}% improvement</span>
                            <span>Risk: {action.riskLevel}</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleExecuteAction(action.id)}
                          disabled={executingActions.has(action.id)}
                          size="sm"
                          className="ml-4"
                        >
                          {executingActions.has(action.id) ? (
                            <Activity className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                          {executingActions.has(action.id) ? 'Executing...' : 'Execute'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="market" className="space-y-6">
          {report && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Nigerian Cities Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Nigerian Cities Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {report.nigerianMarketAnalysis.topCities.map((city) => (
                      <div key={city.city} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{city.city}</h4>
                          <Badge variant={city.avgPerformance >= 80 ? 'default' : 'secondary'}>
                            {city.avgPerformance}%
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {city.users} active users
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-medium">Key Issues:</div>
                          {city.issues.map((issue, index) => (
                            <div key={index} className="text-xs text-gray-600">• {issue}</div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Network Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wifi className="h-5 w-5" />
                    Network Performance Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(report.nigerianMarketAnalysis.networkAnalysis).map(([network, data]) => (
                      <div key={network} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{network.toUpperCase()}</h4>
                          <div className="text-sm text-gray-600">{data.users} users</div>
                        </div>
                        <div className="text-sm mb-2">
                          Avg Load Time: <span className="font-medium">{data.avgLoadTime}s</span>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-medium">Issues:</div>
                          {data.issues.map((issue, index) => (
                            <div key={index} className="text-xs text-gray-600">• {issue}</div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Optimization History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {optimizationHistory.length > 0 ? (
                <div className="space-y-4">
                  {optimizationHistory.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{entry.action.name}</h4>
                        <div className="text-sm text-gray-600">
                          {entry.timestamp.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.result ? (
                          <Badge variant="default">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Success (+{entry.improvement}%)
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-4" />
                  <p>No optimization history yet</p>
                  <p className="text-sm">Execute optimizations to see history here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
