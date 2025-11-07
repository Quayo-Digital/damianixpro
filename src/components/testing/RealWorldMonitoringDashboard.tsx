import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Globe,
  Smartphone,
  TrendingUp,
  TrendingDown,
  Minus,
  Wifi,
  Users,
  BarChart3,
  Eye,
  Zap,
  Target,
  MapPin
} from 'lucide-react';
import { realWorldMonitor, useRealWorldPerformance } from '@/utils/real-world-monitor';

export const RealWorldMonitoringDashboard = () => {
  const { summary, trends, alerts, criticalAlerts } = useRealWorldPerformance();
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [activeTab, setActiveTab] = useState('overview');

  // Mock real-time data for demonstration
  const [liveMetrics, setLiveMetrics] = useState({
    activeUsers: 127,
    currentLocation: 'Lagos',
    networkType: '3G',
    avgLoadTime: 2.3,
    dataUsageToday: 45.2,
    conversionRate: 3.8
  });

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setLiveMetrics(prev => ({
        ...prev,
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 10 - 5),
        avgLoadTime: Math.max(1.0, prev.avgLoadTime + (Math.random() - 0.5) * 0.2),
        dataUsageToday: prev.dataUsageToday + Math.random() * 0.5,
        conversionRate: Math.max(0, prev.conversionRate + (Math.random() - 0.5) * 0.2)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { variant: 'default' as const, label: 'Excellent' };
    if (score >= 60) return { variant: 'secondary' as const, label: 'Good' };
    return { variant: 'destructive' as const, label: 'Poor' };
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'degrading': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Real-World Performance Monitoring
              </CardTitle>
              <CardDescription>
                Live performance metrics from Nigerian users across 2G/3G/4G networks
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600">Live Monitoring</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMonitoring(!isMonitoring)}
              >
                {isMonitoring ? 'Pause' : 'Resume'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Critical Performance Issues</AlertTitle>
          <AlertDescription className="text-red-700">
            {criticalAlerts.length} critical performance issue(s) detected. Immediate attention required.
          </AlertDescription>
        </Alert>
      )}

      {/* Live Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Active Users</span>
            </div>
            <div className="text-2xl font-bold mt-1">{liveMetrics.activeUsers}</div>
            <div className="text-xs text-gray-600">Nigerian users online</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Top Location</span>
            </div>
            <div className="text-lg font-bold mt-1">{liveMetrics.currentLocation}</div>
            <div className="text-xs text-gray-600">Most active city</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Network</span>
            </div>
            <div className="text-lg font-bold mt-1">{liveMetrics.networkType}</div>
            <div className="text-xs text-gray-600">Avg connection type</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Load Time</span>
            </div>
            <div className="text-lg font-bold mt-1">{liveMetrics.avgLoadTime.toFixed(1)}s</div>
            <div className="text-xs text-gray-600">Average page load</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium">Data Usage</span>
            </div>
            <div className="text-lg font-bold mt-1">{liveMetrics.dataUsageToday.toFixed(1)}MB</div>
            <div className="text-xs text-gray-600">Today's average</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-pink-600" />
              <span className="text-sm font-medium">Conversion</span>
            </div>
            <div className="text-lg font-bold mt-1">{liveMetrics.conversionRate.toFixed(1)}%</div>
            <div className="text-xs text-gray-600">Current rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Overall Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(summary.overall)}`}>
              {summary.overall}/100
            </div>
            <Badge variant={getScoreBadge(summary.overall).variant} className="mt-2">
              {getScoreBadge(summary.overall).label}
            </Badge>
            <div className="mt-3">
              <Progress value={summary.overall} className="w-full" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Core Web Vitals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>First Contentful Paint</span>
                <span className={getScoreColor(summary.coreWebVitals.fcp)}>
                  {summary.coreWebVitals.fcp}/100
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Largest Contentful Paint</span>
                <span className={getScoreColor(summary.coreWebVitals.lcp)}>
                  {summary.coreWebVitals.lcp}/100
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>First Input Delay</span>
                <span className={getScoreColor(summary.coreWebVitals.fid)}>
                  {summary.coreWebVitals.fid}/100
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Cumulative Layout Shift</span>
                <span className={getScoreColor(summary.coreWebVitals.cls)}>
                  {summary.coreWebVitals.cls}/100
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Nigerian Optimization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Page Load Time</span>
                <span className={getScoreColor(summary.nigerianOptimization.pageLoadTime)}>
                  {summary.nigerianOptimization.pageLoadTime}/100
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Data Usage</span>
                <span className={getScoreColor(summary.nigerianOptimization.dataUsage)}>
                  {summary.nigerianOptimization.dataUsage}/100
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Time to First Byte</span>
                <span className={getScoreColor(summary.nigerianOptimization.ttfb)}>
                  {summary.nigerianOptimization.ttfb}/100
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Trends (24h)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trends.map((trend) => (
                    <div key={trend.metric} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTrendIcon(trend.trend)}
                        <span className="font-medium capitalize">
                          {trend.metric.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${
                          trend.trend === 'improving' ? 'text-green-600' : 
                          trend.trend === 'degrading' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {trend.changePercent > 0 ? '+' : ''}{trend.changePercent}%
                        </div>
                        <div className="text-xs text-gray-600 capitalize">{trend.trend}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Recent Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary.alerts.length > 0 ? (
                    summary.alerts.map((alert) => (
                      <div key={alert.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <div className="font-medium">{alert.metric}</div>
                          <div className="text-sm text-gray-600">{alert.message}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {alert.location} • {alert.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                        {alert.actionRequired && (
                          <Badge variant="destructive" className="text-xs">Action Required</Badge>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600" />
                      <p>No recent alerts</p>
                      <p className="text-sm">Performance is stable</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Performance Trends Analysis</CardTitle>
                <div className="flex gap-2">
                  {(['1h', '24h', '7d', '30d'] as const).map((period) => (
                    <Button
                      key={period}
                      variant={selectedPeriod === period ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedPeriod(period)}
                    >
                      {period}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {trends.map((trend) => (
                  <div key={trend.metric} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium capitalize">
                        {trend.metric.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(trend.trend)}
                        <span className={`font-bold ${
                          trend.trend === 'improving' ? 'text-green-600' : 
                          trend.trend === 'degrading' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {trend.changePercent > 0 ? '+' : ''}{trend.changePercent}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      {trend.values.length} data points over {trend.period}
                    </div>
                    
                    {/* Simple trend visualization */}
                    <div className="h-16 bg-gray-50 rounded flex items-end justify-between px-2 py-2">
                      {trend.values.slice(-20).map((value, index) => {
                        const maxValue = Math.max(...trend.values.map(v => v.value));
                        const height = (value.value / maxValue) * 100;
                        return (
                          <div
                            key={index}
                            className={`w-1 rounded-t ${
                              trend.trend === 'improving' ? 'bg-green-500' :
                              trend.trend === 'degrading' ? 'bg-red-500' : 'bg-gray-400'
                            }`}
                            style={{ height: `${height}%` }}
                            title={`${value.value} at ${value.timestamp.toLocaleTimeString()}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="font-medium">Critical</span>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {alerts.filter(a => a.type === 'critical').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium">Warning</span>
                </div>
                <div className="text-2xl font-bold text-yellow-600">
                  {alerts.filter(a => a.type === 'warning').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Info</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {alerts.filter(a => a.type === 'info').length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Performance Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.length > 0 ? (
                  alerts.map((alert) => (
                    <div key={alert.id} className="flex items-start gap-3 p-4 border rounded-lg">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{alert.metric}</div>
                          <Badge variant={alert.type === 'critical' ? 'destructive' : alert.type === 'warning' ? 'secondary' : 'outline'}>
                            {alert.type}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{alert.message}</div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                          <span>📍 {alert.location}</span>
                          <span>⏰ {alert.timestamp.toLocaleString()}</span>
                          <span>📊 {alert.value} / {alert.threshold}</span>
                        </div>
                        {alert.actionRequired && (
                          <div className="mt-2">
                            <Badge variant="destructive" className="text-xs">Immediate Action Required</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-600" />
                    <h3 className="text-lg font-medium mb-2">No Active Alerts</h3>
                    <p>All performance metrics are within acceptable ranges</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Nigerian Location Performance
              </CardTitle>
              <CardDescription>
                Performance metrics across major Nigerian cities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { city: 'Lagos', users: 45, avgLoad: 2.1, network: '4G', score: 78 },
                  { city: 'Abuja', users: 23, avgLoad: 2.8, network: '3G', score: 72 },
                  { city: 'Port Harcourt', users: 18, avgLoad: 3.2, network: '3G', score: 68 },
                  { city: 'Kano', users: 15, avgLoad: 3.8, network: '3G', score: 62 },
                  { city: 'Ibadan', users: 12, avgLoad: 3.5, network: '3G', score: 65 },
                  { city: 'Other Cities', users: 14, avgLoad: 4.1, network: '2G/3G', score: 58 }
                ].map((location) => (
                  <Card key={location.city}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{location.city}</h4>
                        <Badge variant={location.score >= 70 ? 'default' : 'secondary'}>
                          {location.score}/100
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Active Users:</span>
                          <span>{location.users}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg Load Time:</span>
                          <span>{location.avgLoad}s</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Network:</span>
                          <span>{location.network}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Nigerian Market Insights */}
      <Alert>
        <Smartphone className="h-4 w-4" />
        <AlertTitle>Nigerian Market Performance Insights</AlertTitle>
        <AlertDescription>
          Real-time monitoring shows {liveMetrics.activeUsers} active users, primarily from {liveMetrics.currentLocation} on {liveMetrics.networkType} networks. 
          Average load time is {liveMetrics.avgLoadTime.toFixed(1)}s with {liveMetrics.dataUsageToday.toFixed(1)}MB data usage per session. 
          Current conversion rate is {liveMetrics.conversionRate.toFixed(1)}%.
        </AlertDescription>
      </Alert>
    </div>
  );
};
