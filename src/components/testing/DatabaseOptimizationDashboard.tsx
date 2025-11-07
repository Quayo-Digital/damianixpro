import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database,
  Activity,
  Zap,
  Settings,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Eye,
  Globe,
  Wifi,
  Server,
  HardDrive,
  Network,
  Target
} from 'lucide-react';
import { 
  useDatabaseOptimization,
  DatabaseMetrics,
  QueryAnalysis,
  IndexRecommendation
} from '@/utils/database-optimization-system';

export const DatabaseOptimizationDashboard = () => {
  const {
    metrics,
    loading,
    error,
    analyzeQuery,
    optimizeConnectionPool,
    createIndexes,
    runAnalysis,
    healthCheck,
    getIndexRecommendations,
    getNigerianConfig
  } = useDatabaseOptimization();

  const [activeTab, setActiveTab] = useState('overview');
  const [queryToAnalyze, setQueryToAnalyze] = useState('');
  const [queryAnalysis, setQueryAnalysis] = useState<QueryAnalysis | null>(null);
  const [indexRecommendations, setIndexRecommendations] = useState<IndexRecommendation[]>([]);
  const [optimizationResults, setOptimizationResults] = useState<any>(null);
  const [healthResults, setHealthResults] = useState<any>(null);
  const [performanceResults, setPerformanceResults] = useState<any>(null);

  useEffect(() => {
    setIndexRecommendations(getIndexRecommendations());
  }, []);

  const handleAnalyzeQuery = () => {
    if (!queryToAnalyze.trim()) return;
    const analysis = analyzeQuery(queryToAnalyze);
    setQueryAnalysis(analysis);
  };

  const handleOptimizeConnectionPool = async () => {
    const result = await optimizeConnectionPool();
    setOptimizationResults(result);
  };

  const handleCreateIndexes = async () => {
    const result = await createIndexes(indexRecommendations.slice(0, 3)); // Create top 3
    setOptimizationResults(result);
  };

  const handleRunAnalysis = async () => {
    const result = await runAnalysis();
    setPerformanceResults(result);
  };

  const handleHealthCheck = async () => {
    const result = await healthCheck();
    setHealthResults(result);
  };

  const getHealthBadgeVariant = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 75) return 'secondary';
    if (score >= 60) return 'outline';
    return 'destructive';
  };

  const getHealthStatus = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Attention';
  };

  if (!metrics) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading database metrics...</span>
      </div>
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
                <Database className="h-5 w-5 text-blue-600" />
                Database Optimization System
              </CardTitle>
              <CardDescription>
                Comprehensive database performance optimization for Nigerian market scalability
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Monitoring Active
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                Nigerian Optimized
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Database Error</AlertTitle>
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {optimizationResults?.success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Optimization Successful!</AlertTitle>
          <AlertDescription className="text-green-700">
            Database optimization completed with {optimizationResults.estimatedImprovement || optimizationResults.totalImprovement}% estimated improvement.
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Active Connections</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {metrics.connectionPool.active}/{metrics.connectionPool.maxConnections}
            </div>
            <div className="text-xs text-gray-600">
              {metrics.connectionPool.utilization.toFixed(1)}% utilization
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Avg Response</span>
            </div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {metrics.queryPerformance.averageResponseTime.toFixed(0)}ms
            </div>
            <div className="text-xs text-gray-600">Query response time</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Cache Hit Rate</span>
            </div>
            <div className="text-2xl font-bold text-purple-600 mt-1">
              {metrics.queryPerformance.cacheHitRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-600">Query cache efficiency</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Queries/sec</span>
            </div>
            <div className="text-2xl font-bold text-orange-600 mt-1">
              {metrics.queryPerformance.queriesPerSecond.toFixed(1)}
            </div>
            <div className="text-xs text-gray-600">Current throughput</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analysis">Query Analysis</TabsTrigger>
          <TabsTrigger value="indexes">Index Optimization</TabsTrigger>
          <TabsTrigger value="connections">Connection Pool</TabsTrigger>
          <TabsTrigger value="health">Nigerian Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Connection Pool Utilization</span>
                    <span className="font-medium">{metrics.connectionPool.utilization.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.connectionPool.utilization} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Cache Hit Rate</span>
                    <span className="font-medium">{metrics.queryPerformance.cacheHitRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.queryPerformance.cacheHitRate} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Index Efficiency</span>
                    <span className="font-medium">{metrics.indexUsage.indexEfficiency.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.indexUsage.indexEfficiency} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Nigerian Optimizations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Nigerian Network Optimizations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Connection Retries</span>
                  <span className="font-medium">{metrics.nigerianOptimizations.connectionRetries}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Timeout Adjustments</span>
                  <span className="font-medium">{metrics.nigerianOptimizations.timeoutAdjustments}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Latency Compensation</span>
                  <span className="font-medium">{metrics.nigerianOptimizations.networkLatencyCompensation.toFixed(0)}ms</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Data Compression</span>
                  <span className="font-medium text-green-600">{metrics.nigerianOptimizations.dataCompressionRatio.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Quick Optimizations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <Button 
                  onClick={handleRunAnalysis} 
                  variant="outline" 
                  className="flex items-center gap-2"
                  disabled={loading}
                >
                  <Search className="h-4 w-4" />
                  Run Analysis
                </Button>
                <Button 
                  onClick={handleOptimizeConnectionPool} 
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={loading}
                >
                  <Network className="h-4 w-4" />
                  Optimize Pool
                </Button>
                <Button 
                  onClick={handleCreateIndexes} 
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={loading}
                >
                  <Database className="h-4 w-4" />
                  Create Indexes
                </Button>
                <Button 
                  onClick={handleHealthCheck} 
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={loading}
                >
                  <Activity className="h-4 w-4" />
                  Health Check
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Query Performance Analysis
              </CardTitle>
              <CardDescription>
                Analyze individual queries for performance optimization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <textarea
                  value={queryToAnalyze}
                  onChange={(e) => setQueryToAnalyze(e.target.value)}
                  placeholder="Enter SQL query to analyze..."
                  className="flex-1 p-2 border rounded-md font-mono text-sm"
                  rows={3}
                />
                <Button onClick={handleAnalyzeQuery} disabled={!queryToAnalyze.trim()}>
                  Analyze
                </Button>
              </div>

              {queryAnalysis && (
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Analysis Results</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant={queryAnalysis.priority === 'critical' ? 'destructive' : 'default'}>
                        {queryAnalysis.priority}
                      </Badge>
                      <Badge variant="outline">
                        Nigerian Impact: {queryAnalysis.nigerianImpact}/10
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Execution Time:</span> {queryAnalysis.executionTime.toFixed(2)}ms
                    </div>
                    <div>
                      <span className="font-medium">Frequency:</span> {queryAnalysis.frequency} times
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-2">Index Usage:</h5>
                    <div className="flex flex-wrap gap-1">
                      {queryAnalysis.indexUsage.map((index, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {index}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-2">Optimization Suggestions:</h5>
                    <ul className="space-y-1 text-sm">
                      {queryAnalysis.suggestions.map((suggestion, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Target className="h-3 w-3 text-blue-600 mt-1 flex-shrink-0" />
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {performanceResults && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Performance Analysis Results</h4>
                    <Badge variant="default">
                      Score: {performanceResults.overallScore}/100
                    </Badge>
                  </div>
                  
                  {performanceResults.slowQueries.length > 0 && (
                    <div>
                      <h5 className="font-medium mb-2">Slow Queries Detected:</h5>
                      <div className="space-y-2">
                        {performanceResults.slowQueries.map((query: QueryAnalysis, i: number) => (
                          <div key={i} className="p-3 border rounded-lg">
                            <div className="font-mono text-xs mb-2 text-gray-600">
                              {query.query.substring(0, 100)}...
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span>Time: {query.executionTime.toFixed(2)}ms</span>
                              <span>Frequency: {query.frequency}</span>
                              <Badge variant="outline">
                                Nigerian Impact: {query.nigerianImpact}/10
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="indexes" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Index Recommendations
                  </CardTitle>
                  <CardDescription>
                    Recommended indexes for Nigerian market optimization
                  </CardDescription>
                </div>
                <Button onClick={handleCreateIndexes} disabled={loading}>
                  Create Top Indexes
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {indexRecommendations.map((recommendation, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">
                        {recommendation.table}({recommendation.columns.join(', ')})
                      </h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">
                          +{recommendation.estimatedImprovement}% faster
                        </Badge>
                        <Badge variant="outline">
                          Priority: {recommendation.priority}/10
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      🇳🇬 {recommendation.nigerianBenefit}
                    </p>
                    
                    <div className="bg-gray-100 p-2 rounded font-mono text-xs">
                      {recommendation.creationQuery}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Connection Pool Management
              </CardTitle>
              <CardDescription>
                Nigerian network-optimized connection pool configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Current Pool Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Active Connections</span>
                      <span className="font-medium">{metrics.connectionPool.active}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Idle Connections</span>
                      <span className="font-medium">{metrics.connectionPool.idle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Waiting Requests</span>
                      <span className="font-medium">{metrics.connectionPool.waiting}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Pool Utilization</span>
                      <span className="font-medium">{metrics.connectionPool.utilization.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Nigerian Optimized Config</h4>
                  <div className="space-y-2">
                    {(() => {
                      const config = getNigerianConfig();
                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="text-sm">Max Connections</span>
                            <span className="font-medium">{config.maxConnections}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Acquire Timeout</span>
                            <span className="font-medium">{config.acquireTimeoutMillis / 1000}s</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Idle Timeout</span>
                            <span className="font-medium">{config.idleTimeoutMillis / 1000 / 60}min</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Nigerian Optimized</span>
                            <Badge variant="default">
                              {config.nigerianNetworkOptimized ? 'Yes' : 'No'}
                            </Badge>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
              
              <Button onClick={handleOptimizeConnectionPool} disabled={loading} className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Optimize Connection Pool for Nigerian Networks
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Nigerian Database Health Check
                  </CardTitle>
                  <CardDescription>
                    Comprehensive health assessment for Nigerian market conditions
                  </CardDescription>
                </div>
                <Button onClick={handleHealthCheck} disabled={loading}>
                  Run Health Check
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {healthResults ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">
                      <span className={
                        healthResults.overallHealth >= 90 ? 'text-green-600' :
                        healthResults.overallHealth >= 75 ? 'text-blue-600' :
                        healthResults.overallHealth >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }>
                        {healthResults.overallHealth}/100
                      </span>
                    </div>
                    <div className="text-gray-600">Overall Database Health</div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Connection Stability</span>
                          <Badge variant={getHealthBadgeVariant(healthResults.connectionStability)}>
                            {getHealthStatus(healthResults.connectionStability)}
                          </Badge>
                        </div>
                        <Progress value={healthResults.connectionStability} className="h-2" />
                        <div className="text-xs text-gray-600 mt-1">
                          {healthResults.connectionStability}/100
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Network Resilience</span>
                          <Badge variant={getHealthBadgeVariant(healthResults.networkResilience)}>
                            {getHealthStatus(healthResults.networkResilience)}
                          </Badge>
                        </div>
                        <Progress value={healthResults.networkResilience} className="h-2" />
                        <div className="text-xs text-gray-600 mt-1">
                          {healthResults.networkResilience}/100
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Payment Gateway Optimization</span>
                          <Badge variant={getHealthBadgeVariant(healthResults.paymentGatewayOptimization)}>
                            {getHealthStatus(healthResults.paymentGatewayOptimization)}
                          </Badge>
                        </div>
                        <Progress value={healthResults.paymentGatewayOptimization} className="h-2" />
                        <div className="text-xs text-gray-600 mt-1">
                          {healthResults.paymentGatewayOptimization}/100
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Data Integrity</span>
                          <Badge variant={getHealthBadgeVariant(healthResults.dataIntegrity)}>
                            {getHealthStatus(healthResults.dataIntegrity)}
                          </Badge>
                        </div>
                        <Progress value={healthResults.dataIntegrity} className="h-2" />
                        <div className="text-xs text-gray-600 mt-1">
                          {healthResults.dataIntegrity}/100
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Nigerian Market Recommendations</h4>
                    <div className="space-y-2">
                      {healthResults.recommendations.map((rec: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Activity className="h-16 w-16 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Database Health Check</h3>
                  <p>Run a comprehensive health check to assess database performance for Nigerian market conditions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
