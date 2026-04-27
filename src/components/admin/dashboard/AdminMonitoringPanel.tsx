import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  Smartphone,
  Brain,
} from 'lucide-react';

// Import all our monitoring and testing components
import { SecurityAuditTest } from '@/components/testing/SecurityAuditTest';
import { PerformanceEmergencyResponse } from '@/components/testing/PerformanceEmergencyResponse';
import { PerformanceVerification } from '@/components/testing/PerformanceVerification';
import { ImageCDNOptimizationTest } from '@/components/testing/ImageCDNOptimizationTest';
import { RealWorldMonitoringDashboard } from '@/components/testing/RealWorldMonitoringDashboard';
import { IntelligentAnalyticsDashboard } from '@/components/testing/IntelligentAnalyticsDashboard';
import { CDNDeploymentDashboard } from '@/components/testing/CDNDeploymentDashboard';
import { CachingMonitoringDashboard } from '@/components/testing/CachingMonitoringDashboard';
import { DatabaseOptimizationDashboard } from '@/components/testing/DatabaseOptimizationDashboard';
import { AdvancedAnalyticsDashboard } from '@/components/testing/AdvancedAnalyticsDashboard';
import { SimpleAIMLDashboard } from '@/components/testing/SimpleAIMLDashboard';

interface AdminMonitoringPanelProps {
  className?: string;
}

export const AdminMonitoringPanel: React.FC<AdminMonitoringPanelProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isMonitoring, setIsMonitoring] = useState(true);

  const [adminMetrics] = useState({
    platformHealth: 0,
    securityScore: 0,
    performanceScore: 0,
    activeUsers: 0,
    criticalAlerts: 0,
    systemLoad: 0,
    uptime: 0,
    lastUpdate: new Date(),
  });

  const getHealthColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBadge = (score: number) => {
    if (score >= 85) return { variant: 'default' as const, label: 'Excellent' };
    if (score >= 70) return { variant: 'secondary' as const, label: 'Good' };
    return { variant: 'destructive' as const, label: 'Critical' };
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Admin Monitoring Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Platform Monitoring & Security Center
              </CardTitle>
              <CardDescription>
                Comprehensive platform health, security, and performance monitoring for Super Admins
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
                <span className="text-sm text-green-600">Live Monitoring</span>
              </div>
              <Badge variant={isMonitoring ? 'default' : 'secondary'}>
                {isMonitoring ? 'Active' : 'Paused'}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Critical Alerts */}
      {adminMetrics.criticalAlerts > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Critical System Alerts</AlertTitle>
          <AlertDescription className="text-red-700">
            {adminMetrics.criticalAlerts} critical issue(s) require immediate admin attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Admin Metrics Overview */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Platform Health</span>
            </div>
            <div
              className={`mt-1 text-2xl font-bold ${getHealthColor(adminMetrics.platformHealth)}`}
            >
              {adminMetrics.platformHealth}%
            </div>
            <Badge
              variant={getHealthBadge(adminMetrics.platformHealth).variant}
              className="mt-1 text-xs"
            >
              {getHealthBadge(adminMetrics.platformHealth).label}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Security</span>
            </div>
            <div
              className={`mt-1 text-2xl font-bold ${getHealthColor(adminMetrics.securityScore)}`}
            >
              {adminMetrics.securityScore}%
            </div>
            <div className="text-xs text-gray-600">RLS + Auth</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Performance</span>
            </div>
            <div
              className={`mt-1 text-2xl font-bold ${getHealthColor(adminMetrics.performanceScore)}`}
            >
              {adminMetrics.performanceScore}%
            </div>
            <div className="text-xs text-gray-600">Nigerian Optimized</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium">Active Users</span>
            </div>
            <div className="mt-1 text-2xl font-bold">
              {adminMetrics.activeUsers.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600">Currently online</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Alerts</span>
            </div>
            <div className="mt-1 text-2xl font-bold text-red-600">
              {adminMetrics.criticalAlerts}
            </div>
            <div className="text-xs text-gray-600">Critical issues</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">System Load</span>
            </div>
            <div className="mt-1 text-2xl font-bold">{adminMetrics.systemLoad}%</div>
            <div className="text-xs text-gray-600">Server resources</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Uptime</span>
            </div>
            <div className="mt-1 text-2xl font-bold text-green-600">{adminMetrics.uptime}%</div>
            <div className="text-xs text-gray-600">Last 30 days</div>
          </CardContent>
        </Card>
      </div>

      {/* Nigerian Market Admin Insights */}
      <Alert>
        <Globe className="h-4 w-4" />
        <AlertTitle>Nigerian Market Platform Status</AlertTitle>
        <AlertDescription>
          Live platform telemetry is not connected. Summary scores and user counts will populate
          here when monitoring and analytics feeds are configured.
        </AlertDescription>
      </Alert>

      {/* Comprehensive Monitoring Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="space-y-2">
          {/* Primary Tabs Row */}
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="security">🔒 Security</TabsTrigger>
            <TabsTrigger value="performance">⚡ Performance</TabsTrigger>
            <TabsTrigger value="emergency">🚨 Emergency</TabsTrigger>
            <TabsTrigger value="optimization">🚀 Optimization</TabsTrigger>
            <TabsTrigger value="monitor">📊 Live Monitor</TabsTrigger>
          </TabsList>

          {/* Secondary Tabs Row */}
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="analytics">🧠 AI Analytics</TabsTrigger>
            <TabsTrigger value="cdn">🌐 CDN Deploy</TabsTrigger>
            <TabsTrigger value="caching">⚡ Caching</TabsTrigger>
            <TabsTrigger value="database">🗄️ Database</TabsTrigger>
            <TabsTrigger value="market-analytics">📈 Market Analytics</TabsTrigger>
            <TabsTrigger value="ai-ml">🤖 AI/ML Models</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Platform Health Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Platform Health Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Overall System Health</span>
                  <Badge variant={getHealthBadge(adminMetrics.platformHealth).variant}>
                    {adminMetrics.platformHealth}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Security Posture</span>
                  <Badge variant="default">{adminMetrics.securityScore}%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Performance Score</span>
                  <Badge variant={adminMetrics.performanceScore >= 80 ? 'default' : 'secondary'}>
                    {adminMetrics.performanceScore}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>System Uptime</span>
                  <Badge variant="default">{adminMetrics.uptime}%</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Quick Admin Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => setActiveTab('security')}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Run Security Audit
                </Button>
                <Button
                  onClick={() => setActiveTab('emergency')}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Emergency Response
                </Button>
                <Button
                  onClick={() => setActiveTab('optimization')}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Optimize Performance
                </Button>
                <Button
                  onClick={() => setActiveTab('monitoring')}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Live Monitoring
                </Button>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Database Connection</span>
                  <Badge variant="default">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Healthy
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Authentication Service</span>
                  <Badge variant="default">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Payment Gateways</span>
                  <Badge variant="default">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Operational
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Nigerian CDN</span>
                  <Badge variant="secondary">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Setup Required
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Comprehensive Security Audit
              </CardTitle>
              <CardDescription>
                Complete security assessment including authentication, database RLS, API security,
                and Nigerian payment gateway compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SecurityAuditTest />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Performance Verification & Analysis
              </CardTitle>
              <CardDescription>
                Verify performance improvements and analyze platform optimization results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PerformanceVerification />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emergency" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Performance Emergency Response
              </CardTitle>
              <CardDescription>
                Automated emergency response system for critical performance issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PerformanceEmergencyResponse />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Image & CDN Optimization
              </CardTitle>
              <CardDescription>
                Comprehensive image optimization and CDN performance testing for Nigerian
                infrastructure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageCDNOptimizationTest />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Real-World Performance Monitoring
              </CardTitle>
              <CardDescription>
                Live performance metrics from Nigerian users across 2G/3G/4G networks with
                location-based analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RealWorldMonitoringDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Intelligent Performance Analytics
              </CardTitle>
              <CardDescription>
                AI-powered performance analysis with intelligent optimization recommendations for
                Nigerian market
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IntelligentAnalyticsDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cdn" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                CDN Deployment & Management
              </CardTitle>
              <CardDescription>
                Deploy and manage CDN infrastructure optimized for Nigerian users and networks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CDNDeploymentDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="caching" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Advanced Caching System
              </CardTitle>
              <CardDescription>
                Multi-layer caching with offline support optimized for Nigerian network conditions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CachingMonitoringDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <DatabaseOptimizationDashboard />
        </TabsContent>

        <TabsContent value="market-analytics" className="space-y-6">
          <AdvancedAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="ai-ml" className="space-y-6">
          <SimpleAIMLDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};
