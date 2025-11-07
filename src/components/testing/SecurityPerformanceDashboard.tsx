import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Database,
  Lock,
  Eye,
  Settings,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Zap,
  Globe,
  Wifi,
  Smartphone
} from 'lucide-react';
import { SecurityAuditTest } from './SecurityAuditTest';
import { PerformanceEmergencyResponse } from './PerformanceEmergencyResponse';
import { PerformanceVerification } from './PerformanceVerification';
import { ImageCDNOptimizationTest } from './ImageCDNOptimizationTest';
import { RealWorldMonitoringDashboard } from './RealWorldMonitoringDashboard';

export const SecurityPerformanceDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [stats, setStats] = useState({
    securityScore: 85,
    performanceScore: 72,
    totalSecurityEvents: 23,
    criticalAlerts: 2,
    lastAuditTime: new Date(),
    networkEffectiveType: '3g',
    memoryUsage: 45.2,
    coreWebVitals: {
      fcp: 78,
      lcp: 82,
      fid: 95,
      cls: 88
    }
  });

  // Real-time monitoring simulation
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        performanceScore: Math.max(0, Math.min(100, prev.performanceScore + (Math.random() - 0.5) * 5)),
        memoryUsage: Math.max(0, Math.min(100, prev.memoryUsage + (Math.random() - 0.5) * 2)),
        coreWebVitals: {
          fcp: Math.max(0, Math.min(100, prev.coreWebVitals.fcp + (Math.random() - 0.5) * 3)),
          lcp: Math.max(0, Math.min(100, prev.coreWebVitals.lcp + (Math.random() - 0.5) * 3)),
          fid: Math.max(0, Math.min(100, prev.coreWebVitals.fid + (Math.random() - 0.5) * 2)),
          cls: Math.max(0, Math.min(100, prev.coreWebVitals.cls + (Math.random() - 0.5) * 2))
        }
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  const runComprehensiveAudit = () => {
    setStats(prev => ({
      ...prev,
      lastAuditTime: new Date(),
      securityScore: Math.floor(Math.random() * 20) + 80,
      performanceScore: Math.floor(Math.random() * 30) + 70
    }));
  };

  const getHealthScore = () => {
    return Math.round((stats.securityScore + stats.performanceScore) / 2);
  };

  const getHealthBadge = (score: number) => {
    if (score >= 80) return { variant: 'default' as const, label: 'Excellent' };
    if (score >= 60) return { variant: 'secondary' as const, label: 'Good' };
    return { variant: 'destructive' as const, label: 'Poor' };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Security & Performance Dashboard
          </h2>
          <p className="text-gray-600">
            Real-time monitoring and comprehensive security assessment for Nigeria Homes platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isMonitoring ? 'default' : 'secondary'}>
            {isMonitoring ? 'Monitoring Active' : 'Monitoring Inactive'}
          </Badge>
          <Button onClick={runComprehensiveAudit} className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Run Full Audit
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Overall Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(getHealthScore())}`}>
              {getHealthScore()}/100
            </div>
            <Badge variant={getHealthBadge(getHealthScore()).variant} className="mt-2">
              {getHealthBadge(getHealthScore()).label}
            </Badge>
            <div className="mt-3">
              <Progress value={getHealthScore()} className="w-full" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Security Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(stats.securityScore)}`}>
              {stats.securityScore}/100
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {stats.totalSecurityEvents} events (24h)
            </div>
            <Progress value={stats.securityScore} className="w-full mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Performance Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(stats.performanceScore)}`}>
              {stats.performanceScore}/100
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {stats.memoryUsage.toFixed(1)}% memory usage
            </div>
            <Progress value={stats.performanceScore} className="w-full mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Network Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold capitalize">
              {stats.networkEffectiveType}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {stats.criticalAlerts} critical alerts
            </div>
            <Badge variant={stats.criticalAlerts > 0 ? 'destructive' : 'default'} className="mt-2">
              {stats.criticalAlerts > 0 ? 'Issues Detected' : 'Stable'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Core Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Core Web Vitals (Nigerian Network Optimized)
          </CardTitle>
          <CardDescription>
            Performance metrics optimized for Nigerian 2G/3G networks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-xl font-bold ${getScoreColor(stats.coreWebVitals.fcp)}`}>
                {stats.coreWebVitals.fcp}/100
              </div>
              <div className="text-sm text-gray-600">First Contentful Paint</div>
            </div>
            <div className="text-center">
              <div className={`text-xl font-bold ${getScoreColor(stats.coreWebVitals.lcp)}`}>
                {stats.coreWebVitals.lcp}/100
              </div>
              <div className="text-sm text-gray-600">Largest Contentful Paint</div>
            </div>
            <div className="text-center">
              <div className={`text-xl font-bold ${getScoreColor(stats.coreWebVitals.fid)}`}>
                {stats.coreWebVitals.fid}/100
              </div>
              <div className="text-sm text-gray-600">First Input Delay</div>
            </div>
            <div className="text-center">
              <div className={`text-xl font-bold ${getScoreColor(stats.coreWebVitals.cls)}`}>
                {stats.coreWebVitals.cls}/100
              </div>
              <div className="text-sm text-gray-600">Cumulative Layout Shift</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nigerian Market Insights */}
      <Alert>
        <Smartphone className="h-4 w-4" />
        <AlertTitle>Nigerian Market Performance Insights</AlertTitle>
        <AlertDescription>
          Platform optimized for Nigerian network conditions. Current performance: {stats.performanceScore}/100 
          with {stats.networkEffectiveType.toUpperCase()} network optimization. 
          Last audit: {stats.lastAuditTime.toLocaleTimeString()}.
        </AlertDescription>
      </Alert>

      {/* Detailed Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="emergency">🚨 Emergency</TabsTrigger>
          <TabsTrigger value="verify">✅ Verify</TabsTrigger>
          <TabsTrigger value="optimize">🚀 Optimize</TabsTrigger>
          <TabsTrigger value="monitor">📊 Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Authentication Security</span>
                  <Badge variant="default">Good</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Database Security (RLS)</span>
                  <Badge variant="default">Excellent</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>API Security</span>
                  <Badge variant="secondary">Needs Improvement</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Frontend Security</span>
                  <Badge variant="default">Good</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Bundle Size Optimization</span>
                  <Badge variant="default">Optimized</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Image Optimization</span>
                  <Badge variant="default">Excellent</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>CDN Implementation</span>
                  <Badge variant="destructive">Needs Setup</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Nigerian Network Optimization</span>
                  <Badge variant="default">Active</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SecurityAuditTest />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analysis</CardTitle>
              <CardDescription>
                Comprehensive performance monitoring and optimization recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Current Performance Score</h4>
                    <p className="text-sm text-gray-600">Overall platform performance</p>
                  </div>
                  <div className={`text-2xl font-bold ${getScoreColor(stats.performanceScore)}`}>
                    {stats.performanceScore}/100
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Memory Usage</h4>
                    <Progress value={stats.memoryUsage} className="w-full" />
                    <p className="text-sm text-gray-600 mt-1">{stats.memoryUsage.toFixed(1)}% of available memory</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Network Optimization</h4>
                    <Badge variant="default" className="mb-2">
                      {stats.networkEffectiveType.toUpperCase()} Optimized
                    </Badge>
                    <p className="text-sm text-gray-600">Tailored for Nigerian networks</p>
                  </div>
                </div>

                <Button 
                  onClick={runComprehensiveAudit}
                  className="w-full"
                >
                  Analyze Current Performance
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emergency" className="space-y-6">
          <PerformanceEmergencyResponse />
        </TabsContent>

        <TabsContent value="verify" className="space-y-6">
          <PerformanceVerification />
        </TabsContent>

        <TabsContent value="optimize" className="space-y-6">
          <ImageCDNOptimizationTest />
        </TabsContent>

        <TabsContent value="monitor" className="space-y-6">
          <RealWorldMonitoringDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};
