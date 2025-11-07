/**
 * Performance Monitoring Dashboard
 * Real-time performance metrics and optimization insights
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { PerformanceMonitor, CacheOptimizer } from '@/services/performance/performanceOptimizer';
import { RealPerformanceMetricsService, RealPerformanceMetrics } from '@/services/performance/performanceMetrics';
import { Activity, Database, Image, Zap, Clock, MemoryStick } from 'lucide-react';

export const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<RealPerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [isMonitoring, setIsMonitoring] = useState(false);

  // Collect real performance metrics from database
  const collectMetrics = async () => {
    setIsLoading(true);
    try {
      const realMetrics = await RealPerformanceMetricsService.getPerformanceMetrics();
      setMetrics(realMetrics);
    } catch (error) {
      console.error('Error collecting performance metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Start/stop monitoring
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isMonitoring) {
      collectMetrics(); // Initial collection
      interval = setInterval(() => {
        collectMetrics();
      }, 5000); // Update every 5 seconds (reduced frequency for database calls)
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring]);

  // Load initial metrics on component mount
  useEffect(() => {
    collectMetrics();
  }, []);

  const getMemoryUsagePercentage = () => {
    if (!metrics) return 0;
    return metrics.memoryUsage.limit > 0 
      ? (metrics.memoryUsage.used / metrics.memoryUsage.limit) * 100 
      : 0;
  };

  const getOptimizationScore = () => {
    if (!metrics) return 0;
    
    const memoryScore = Math.max(0, 100 - getMemoryUsagePercentage());
    const cacheScore = metrics.cacheStats.hitRate;
    const queryScore = Math.max(0, 100 - (metrics.queryPerformance.averageTime / 10));
    const imageScore = metrics.imageOptimization.totalImages > 0 
      ? (metrics.imageOptimization.optimizedImages / metrics.imageOptimization.totalImages) * 100 
      : 100;

    return Math.round((memoryScore + cacheScore + queryScore + imageScore) / 4);
  };

  const clearCache = () => {
    CacheOptimizer.clear();
    collectMetrics();
  };

  const runPerformanceTest = async () => {
    setIsLoading(true);
    try {
      // Test real database operations
      await PerformanceMonitor.measurePerformance('Property Metrics Test', async () => {
        return await RealPerformanceMetricsService.getPropertyMetrics();
      });
      
      await PerformanceMonitor.measurePerformance('User Activity Test', async () => {
        return await RealPerformanceMetricsService.getUserActivityMetrics();
      });
      
      await PerformanceMonitor.measurePerformance('Full Metrics Test', async () => {
        return await RealPerformanceMetricsService.getPerformanceMetrics();
      });
      
      // Refresh metrics after test
      await collectMetrics();
    } catch (error) {
      console.error('Performance test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor and optimize your application performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={isMonitoring ? "destructive" : "default"}
            onClick={() => setIsMonitoring(!isMonitoring)}
            disabled={isLoading}
          >
            {isMonitoring ? "Stop Monitoring" : "Start Monitoring"}
          </Button>
          <Button variant="outline" onClick={clearCache} disabled={isLoading}>
            Clear Cache
          </Button>
          <Button variant="outline" onClick={runPerformanceTest} disabled={isLoading}>
            {isLoading ? "Running..." : "Run Test"}
          </Button>
          <Button variant="outline" onClick={collectMetrics} disabled={isLoading}>
            {isLoading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Overall Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Overall Performance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold">
              {getOptimizationScore()}
            </div>
            <div className="flex-1">
              <Progress value={getOptimizationScore()} className="h-3" />
            </div>
            <Badge 
              variant={getOptimizationScore() > 80 ? "default" : 
                      getOptimizationScore() > 60 ? "secondary" : "destructive"}
            >
              {getOptimizationScore() > 80 ? "Excellent" : 
               getOptimizationScore() > 60 ? "Good" : "Needs Improvement"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="memory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="queries">Queries</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
        </TabsList>

        <TabsContent value="memory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MemoryStick className="h-5 w-5" />
                Memory Usage
              </CardTitle>
              <CardDescription>
                JavaScript heap memory consumption
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : metrics ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span>Used Memory</span>
                      <span className="font-mono">{metrics.memoryUsage.used} MB</span>
                    </div>
                    <Progress value={getMemoryUsagePercentage()} />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total: </span>
                        <span className="font-mono">{metrics.memoryUsage.total} MB</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Limit: </span>
                        <span className="font-mono">{metrics.memoryUsage.limit} MB</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No memory data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Cache Performance
              </CardTitle>
              <CardDescription>
                In-memory cache statistics and hit rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : metrics ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{metrics.cacheStats.size}</div>
                        <div className="text-sm text-muted-foreground">Cache Entries</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{metrics.cacheStats.hitRate}%</div>
                        <div className="text-sm text-muted-foreground">Hit Rate</div>
                      </div>
                    </div>
                    <Progress value={metrics.cacheStats.hitRate} />
                    <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                      <div className="text-center">
                        <div className="font-semibold">{metrics.cacheStats.totalRequests}</div>
                        <div className="text-muted-foreground">Total Requests</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-600">{metrics.cacheStats.cacheHits}</div>
                        <div className="text-muted-foreground">Cache Hits</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No cache data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Query Performance
              </CardTitle>
              <CardDescription>
                Database query execution times and optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : metrics ? (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{metrics.queryPerformance.averageTime}ms</div>
                        <div className="text-sm text-muted-foreground">Average Query Time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-500">
                          {metrics.queryPerformance.slowQueries}
                        </div>
                        <div className="text-sm text-muted-foreground">Slow Queries</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-500">
                          {metrics.queryPerformance.totalQueries}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Queries</div>
                      </div>
                    </div>
                    
                    {/* Database Statistics */}
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-2">Database Statistics</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span>Properties:</span>
                          <span className="font-mono">{metrics.databaseStats.totalProperties}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Users:</span>
                          <span className="font-mono">{metrics.databaseStats.totalUsers}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Leases:</span>
                          <span className="font-mono">{metrics.databaseStats.totalLeases}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Documents:</span>
                          <span className="font-mono">{metrics.databaseStats.totalDocuments}</span>
                        </div>
                      </div>
                    </div>

                    {/* Query Performance by Table */}
                    {metrics.queryPerformance.queryStats.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="font-semibold mb-2">Query Performance by Table</h4>
                        <div className="space-y-2">
                          {metrics.queryPerformance.queryStats.map((stat, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span className="capitalize">{stat.table}</span>
                              <div className="flex gap-2">
                                <span className="text-muted-foreground">{stat.count} queries</span>
                                <span className={`font-mono ${stat.avgTime > 500 ? 'text-red-500' : stat.avgTime > 200 ? 'text-yellow-500' : 'text-green-500'}`}>
                                  {stat.avgTime}ms
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {metrics.queryPerformance.slowQueries > 0 && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-800">
                          ⚠️ {metrics.queryPerformance.slowQueries} slow queries detected. 
                          Consider optimizing database indexes or query structure.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No query data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Image Optimization
              </CardTitle>
              <CardDescription>
                Image loading and optimization statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : metrics ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{metrics.imageOptimization.totalImages}</div>
                        <div className="text-sm text-muted-foreground">Total Images</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-500">
                          {metrics.imageOptimization.optimizedImages}
                        </div>
                        <div className="text-sm text-muted-foreground">Optimized Images</div>
                      </div>
                    </div>
                    <Progress 
                      value={
                        metrics.imageOptimization.totalImages > 0 
                          ? (metrics.imageOptimization.optimizedImages / metrics.imageOptimization.totalImages) * 100 
                          : 0
                      } 
                    />
                    
                    {/* Image Size Statistics */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold">{Math.round(metrics.imageOptimization.totalImageSize)} KB</div>
                        <div className="text-muted-foreground">Total Size</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-600">{Math.round(metrics.imageOptimization.optimizedImageSize)} KB</div>
                        <div className="text-muted-foreground">Optimized Size</div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground text-center">
                      {metrics.imageOptimization.totalImages > 0 ? (
                        <>
                          {Math.round((metrics.imageOptimization.optimizedImages / metrics.imageOptimization.totalImages) * 100)}% 
                          of images are using optimization techniques
                          {metrics.imageOptimization.totalImageSize > 0 && (
                            <div className="mt-1">
                              Potential savings: {Math.round(((metrics.imageOptimization.totalImageSize - metrics.imageOptimization.optimizedImageSize) / metrics.imageOptimization.totalImageSize) * 100)}%
                            </div>
                          )}
                        </>
                      ) : (
                        "No images detected on current page"
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No image data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              <span>Use React Query for efficient data caching</span>
            </div>
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-blue-500" />
              <span>Implement lazy loading for images</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-purple-500" />
              <span>Optimize database queries with proper indexing</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span>Use code splitting for better bundle sizes</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceDashboard;
