import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database,
  Zap,
  Wifi,
  WifiOff,
  Gauge,
  HardDrive,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  Smartphone,
  Globe,
  RefreshCw,
  Trash2,
  Download,
  Upload,
  Signal,
  AlertTriangle,
  CheckCircle2,
  BarChart3
} from 'lucide-react';
import { nigerianCache, CacheMetrics } from '@/utils/advanced-caching-system';

export const CachingMonitoringDashboard = () => {
  const [metrics, setMetrics] = useState<CacheMetrics | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkType, setNetworkType] = useState<string>('unknown');
  const [cacheEntries, setCacheEntries] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Update metrics every 5 seconds
    const updateMetrics = () => {
      const currentMetrics = nigerianCache.getCacheMetrics();
      setMetrics(currentMetrics);
      
      // Get cache entries for debugging
      const entries = Object.entries(nigerianCache.exportCache()).map(([key, entry]) => ({
        key,
        ...entry
      }));
      setCacheEntries(entries);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);

    // Monitor network status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Monitor network type
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setNetworkType(connection.effectiveType || 'unknown');
      
      const handleConnectionChange = () => {
        setNetworkType(connection.effectiveType || 'unknown');
      };
      
      connection.addEventListener('change', handleConnectionChange);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', handleConnectionChange);
      };
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleClearCache = () => {
    nigerianCache.clear();
  };

  const handleInvalidateEntry = (key: string) => {
    nigerianCache.invalidate(key);
  };

  const getNetworkIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4 text-red-600" />;
    
    switch (networkType) {
      case '2g': return <Signal className="h-4 w-4 text-red-600" />;
      case '3g': return <Signal className="h-4 w-4 text-yellow-600" />;
      case '4g': return <Signal className="h-4 w-4 text-green-600" />;
      default: return <Wifi className="h-4 w-4 text-blue-600" />;
    }
  };

  const getNetworkBadgeVariant = () => {
    if (!isOnline) return 'destructive';
    switch (networkType) {
      case '2g': return 'destructive';
      case '3g': return 'secondary';
      case '4g': return 'default';
      default: return 'outline';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getCacheHealthStatus = () => {
    if (!metrics) return { status: 'unknown', color: 'gray' };
    
    const hitRate = metrics.hitRate / (metrics.hitRate + metrics.missRate) * 100;
    
    if (hitRate >= 80) return { status: 'excellent', color: 'green' };
    if (hitRate >= 60) return { status: 'good', color: 'blue' };
    if (hitRate >= 40) return { status: 'fair', color: 'yellow' };
    return { status: 'poor', color: 'red' };
  };

  if (!metrics) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading cache metrics...</span>
      </div>
    );
  }

  const hitRate = metrics.hitRate / (metrics.hitRate + metrics.missRate) * 100 || 0;
  const cacheHealth = getCacheHealthStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                Advanced Caching System
              </CardTitle>
              <CardDescription>
                Multi-layer caching optimized for Nigerian network conditions with offline support
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getNetworkBadgeVariant()} className="flex items-center gap-1">
                {getNetworkIcon()}
                {isOnline ? networkType.toUpperCase() : 'Offline'}
              </Badge>
              <Badge variant={cacheHealth.color === 'green' ? 'default' : 'secondary'}>
                Cache: {cacheHealth.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Hit Rate</span>
            </div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {formatPercentage(hitRate)}
            </div>
            <div className="text-xs text-gray-600">Cache efficiency</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Cache Size</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {formatBytes(metrics.totalSize * 1024 * 1024)}
            </div>
            <div className="text-xs text-gray-600">{metrics.entryCount} entries</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Data Savings</span>
            </div>
            <div className="text-2xl font-bold text-purple-600 mt-1">
              {formatPercentage(metrics.dataSavings)}
            </div>
            <div className="text-xs text-gray-600">Compression ratio</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <WifiOff className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Offline Hits</span>
            </div>
            <div className="text-2xl font-bold text-orange-600 mt-1">
              {metrics.offlineHits}
            </div>
            <div className="text-xs text-gray-600">Offline requests served</div>
          </CardContent>
        </Card>
      </div>

      {/* Network Status Alert */}
      {!isOnline && (
        <Alert className="border-orange-200 bg-orange-50">
          <WifiOff className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">Offline Mode Active</AlertTitle>
          <AlertDescription className="text-orange-700">
            You're currently offline. The app is serving cached content and queuing changes for sync when connection is restored.
          </AlertDescription>
        </Alert>
      )}

      {/* Nigerian Network Optimization Alert */}
      {networkType === '2g' && (
        <Alert className="border-blue-200 bg-blue-50">
          <Smartphone className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">2G Network Detected</AlertTitle>
          <AlertDescription className="text-blue-700">
            Nigerian network optimization active: Extended cache TTL (30 min), maximum compression enabled, 
            and data-conscious loading strategies applied.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="entries">Cache Entries</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cache Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5" />
                  Cache Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Hit Rate</span>
                    <span className="font-medium">{formatPercentage(hitRate)}</span>
                  </div>
                  <Progress value={hitRate} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Cache Utilization</span>
                    <span className="font-medium">{formatPercentage((metrics.totalSize / 100) * 100)}</span>
                  </div>
                  <Progress value={(metrics.totalSize / 100) * 100} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Compression Efficiency</span>
                    <span className="font-medium">{formatPercentage(metrics.dataSavings)}</span>
                  </div>
                  <Progress value={metrics.dataSavings} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Nigerian Network Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Nigerian Network Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Current Network</span>
                  <Badge variant={getNetworkBadgeVariant()}>
                    {networkType.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Connection Status</span>
                  <Badge variant={isOnline ? 'default' : 'destructive'}>
                    {isOnline ? 'Online' : 'Offline'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Data Savings</span>
                  <span className="font-medium text-green-600">
                    {formatBytes(metrics.dataSavings * metrics.totalSize * 1024 * 1024 / 100)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Offline Requests Served</span>
                  <span className="font-medium">{metrics.offlineHits}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={handleClearCache} 
                  variant="outline" 
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear All Cache
                </Button>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Metrics
                </Button>
                <Button 
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={!isOnline}
                >
                  <Upload className="h-4 w-4" />
                  Sync Offline Queue
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entries" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Cache Entries
                  </CardTitle>
                  <CardDescription>
                    View and manage individual cache entries
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {cacheEntries.length} entries
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {cacheEntries.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {cacheEntries.slice(0, 20).map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-mono text-sm">{entry.key}</div>
                        <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                          <span>Size: {formatBytes(entry.size * 1024 * 1024)}</span>
                          <span>Hits: {entry.accessCount}</span>
                          <span>Age: {Math.round((Date.now() - entry.timestamp) / 1000)}s</span>
                          {entry.compressed && <Badge variant="outline" className="text-xs">Compressed</Badge>}
                          {entry.priority === 'critical' && <Badge variant="default" className="text-xs">Critical</Badge>}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleInvalidateEntry(entry.key)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {cacheEntries.length > 20 && (
                    <div className="text-center text-sm text-gray-600 py-2">
                      ... and {cacheEntries.length - 20} more entries
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Database className="h-12 w-12 mx-auto mb-4" />
                  <p>No cache entries found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Cache Statistics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Hits</span>
                      <span className="font-medium">{metrics.hitRate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total Misses</span>
                      <span className="font-medium">{metrics.missRate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Hit Ratio</span>
                      <span className="font-medium">{formatPercentage(hitRate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Compression Ratio</span>
                      <span className="font-medium">{metrics.compressionRatio.toFixed(2)}:1</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Nigerian Optimizations</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Network Type</span>
                      <span className="font-medium">{networkType.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Data Saved</span>
                      <span className="font-medium text-green-600">
                        {formatBytes(metrics.dataSavings * metrics.totalSize * 1024 * 1024 / 100)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Offline Hits</span>
                      <span className="font-medium">{metrics.offlineHits}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Cache Health</span>
                      <Badge variant={cacheHealth.color === 'green' ? 'default' : 'secondary'}>
                        {cacheHealth.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Cache Configuration
              </CardTitle>
              <CardDescription>
                Current cache settings optimized for Nigerian networks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Nigerian Optimizations Active</AlertTitle>
                  <AlertDescription>
                    Cache settings are automatically adjusted based on network conditions:
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• 2G Networks: 30-minute TTL, maximum compression</li>
                      <li>• 3G Networks: 15-minute TTL, high compression</li>
                      <li>• 4G Networks: 5-minute TTL, standard compression</li>
                      <li>• Offline mode with sync queue enabled</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Max Cache Size</label>
                    <div className="p-2 bg-gray-100 rounded text-sm">100 MB</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Default TTL</label>
                    <div className="p-2 bg-gray-100 rounded text-sm">
                      {networkType === '2g' ? '30 minutes' : 
                       networkType === '3g' ? '15 minutes' : 
                       networkType === '4g' ? '5 minutes' : '10 minutes'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Compression</label>
                    <div className="p-2 bg-gray-100 rounded text-sm">Enabled</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Offline Mode</label>
                    <div className="p-2 bg-gray-100 rounded text-sm">Enabled</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
