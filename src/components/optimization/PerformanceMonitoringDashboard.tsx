import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Clock, 
  Zap, 
  Database, 
  Wifi, 
  HardDrive,
  Cpu,
  MemoryStick,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  threshold: {
    good: number;
    warning: number;
  };
}

interface SystemHealth {
  overall: number;
  metrics: PerformanceMetric[];
  recommendations: string[];
}

export const PerformanceMonitoringDashboard: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [realTimeData, setRealTimeData] = useState<PerformanceMetric[]>([]);

  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(() => {
        updateRealTimeMetrics();
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isMonitoring]);

  const startPerformanceMonitoring = async () => {
    setIsMonitoring(true);
    
    // Initial system health assessment
    const health = await assessSystemHealth();
    setSystemHealth(health);
    
    // Start real-time monitoring
    updateRealTimeMetrics();
  };

  const stopPerformanceMonitoring = () => {
    setIsMonitoring(false);
    setRealTimeData([]);
  };

  const assessSystemHealth = async (): Promise<SystemHealth> => {
    // Simulate performance metrics collection
    const metrics: PerformanceMetric[] = [
      {
        name: 'Page Load Time',
        value: Math.random() * 2000 + 1000,
        unit: 'ms',
        status: 'good',
        trend: 'stable',
        threshold: { good: 2000, warning: 3000 }
      },
      {
        name: 'First Contentful Paint',
        value: Math.random() * 1500 + 800,
        unit: 'ms',
        status: 'good',
        trend: 'down',
        threshold: { good: 1500, warning: 2500 }
      },
      {
        name: 'Time to Interactive',
        value: Math.random() * 3000 + 2000,
        unit: 'ms',
        status: 'warning',
        trend: 'up',
        threshold: { good: 3000, warning: 5000 }
      },
      {
        name: 'Bundle Size',
        value: Math.random() * 1000 + 1500,
        unit: 'KB',
        status: 'good',
        trend: 'stable',
        threshold: { good: 2000, warning: 3000 }
      },
      {
        name: 'Memory Usage',
        value: Math.random() * 50 + 80,
        unit: 'MB',
        status: 'good',
        trend: 'stable',
        threshold: { good: 150, warning: 250 }
      },
      {
        name: 'API Response Time',
        value: Math.random() * 300 + 200,
        unit: 'ms',
        status: 'good',
        trend: 'down',
        threshold: { good: 500, warning: 1000 }
      },
      {
        name: 'Database Query Time',
        value: Math.random() * 100 + 50,
        unit: 'ms',
        status: 'good',
        trend: 'stable',
        threshold: { good: 100, warning: 200 }
      },
      {
        name: 'Error Rate',
        value: Math.random() * 2,
        unit: '%',
        status: 'good',
        trend: 'stable',
        threshold: { good: 1, warning: 5 }
      }
    ];

    // Update status based on thresholds
    metrics.forEach(metric => {
      if (metric.value <= metric.threshold.good) {
        metric.status = 'good';
      } else if (metric.value <= metric.threshold.warning) {
        metric.status = 'warning';
      } else {
        metric.status = 'critical';
      }
    });

    const overallScore = metrics.reduce((sum, metric) => {
      const score = metric.status === 'good' ? 100 : 
                   metric.status === 'warning' ? 70 : 40;
      return sum + score;
    }, 0) / metrics.length;

    const recommendations = generateRecommendations(metrics);

    return {
      overall: Math.round(overallScore),
      metrics,
      recommendations
    };
  };

  const updateRealTimeMetrics = () => {
    if (!systemHealth) return;

    const updatedMetrics = systemHealth.metrics.map(metric => ({
      ...metric,
      value: metric.value + (Math.random() - 0.5) * (metric.value * 0.1),
      trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable'
    }));

    setRealTimeData(updatedMetrics);
  };

  const generateRecommendations = (metrics: PerformanceMetric[]): string[] => {
    const recommendations: string[] = [];

    metrics.forEach(metric => {
      if (metric.status === 'critical' || metric.status === 'warning') {
        switch (metric.name) {
          case 'Page Load Time':
            recommendations.push('Implement code splitting and lazy loading for faster page loads');
            break;
          case 'First Contentful Paint':
            recommendations.push('Optimize critical rendering path and reduce render-blocking resources');
            break;
          case 'Time to Interactive':
            recommendations.push('Reduce JavaScript execution time and optimize third-party scripts');
            break;
          case 'Bundle Size':
            recommendations.push('Enable tree shaking and remove unused dependencies');
            break;
          case 'Memory Usage':
            recommendations.push('Implement memory leak detection and optimize component lifecycle');
            break;
          case 'API Response Time':
            recommendations.push('Implement API caching and optimize database queries');
            break;
          case 'Database Query Time':
            recommendations.push('Add database indexes and optimize complex queries');
            break;
          case 'Error Rate':
            recommendations.push('Implement comprehensive error handling and monitoring');
            break;
        }
      }
    });

    // General recommendations
    recommendations.push('Implement service worker for offline functionality');
    recommendations.push('Use CDN for static asset delivery');
    recommendations.push('Enable gzip compression for all text-based resources');

    return [...new Set(recommendations)]; // Remove duplicates
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-green-500" />;
      default:
        return <Activity className="h-3 w-3 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const currentMetrics = realTimeData.length > 0 ? realTimeData : systemHealth?.metrics || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Performance Monitoring Dashboard</h3>
          <p className="text-muted-foreground">
            Real-time performance metrics and system health monitoring
          </p>
        </div>
        <div className="flex gap-2">
          {!isMonitoring ? (
            <Button onClick={startPerformanceMonitoring}>
              <Activity className="mr-2 h-4 w-4" />
              Start Monitoring
            </Button>
          ) : (
            <Button variant="outline" onClick={stopPerformanceMonitoring}>
              <Activity className="mr-2 h-4 w-4" />
              Stop Monitoring
            </Button>
          )}
        </div>
      </div>

      {systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              System Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Progress value={systemHealth.overall} className="h-3" />
              </div>
              <div className="text-2xl font-bold">
                {systemHealth.overall}/100
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {systemHealth.overall >= 90 ? 'Excellent performance!' :
               systemHealth.overall >= 75 ? 'Good performance with room for improvement' :
               systemHealth.overall >= 60 ? 'Performance needs attention' :
               'Critical performance issues detected'}
            </p>
          </CardContent>
        </Card>
      )}

      {currentMetrics.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {currentMetrics.map((metric, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(metric.status)}
                    {getTrendIcon(metric.trend)}
                  </div>
                  <Badge className={getStatusColor(metric.status)}>
                    {metric.status}
                  </Badge>
                </div>
                <CardTitle className="text-sm">{metric.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metric.value.toFixed(0)}{metric.unit}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Target: ≤{metric.threshold.good}{metric.unit}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {systemHealth?.recommendations && systemHealth.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Recommendations
            </CardTitle>
            <CardDescription>
              Actionable steps to improve platform performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {systemHealth.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {isMonitoring && (
        <Alert>
          <Activity className="h-4 w-4 animate-pulse" />
          <AlertDescription>
            Real-time monitoring is active. Metrics are updated every 2 seconds.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default PerformanceMonitoringDashboard;
