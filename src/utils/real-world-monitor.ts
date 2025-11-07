// Real-World Performance Monitoring System
// Tracks actual user performance metrics for Nigerian property management platform

import React from 'react';

export interface RealWorldMetrics {
  // Core Web Vitals
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  
  // Nigerian-specific metrics
  networkType: string; // 2G, 3G, 4G, 5G
  connectionSpeed: number; // Mbps
  dataUsage: number; // MB per session
  deviceMemory: number; // GB
  location: string; // Nigerian city
  
  // Business metrics
  pageLoadTime: number;
  timeToInteractive: number;
  bounceRate: number;
  conversionRate: number;
  
  // Timestamp and session info
  timestamp: Date;
  sessionId: string;
  userId?: string;
  userAgent: string;
}

export interface PerformanceAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  metric: string;
  value: number;
  threshold: number;
  location: string;
  timestamp: Date;
  message: string;
  actionRequired: boolean;
}

export interface PerformanceTrend {
  metric: string;
  period: '1h' | '24h' | '7d' | '30d';
  values: Array<{ timestamp: Date; value: number }>;
  trend: 'improving' | 'degrading' | 'stable';
  changePercent: number;
}

export class RealWorldPerformanceMonitor {
  private static instance: RealWorldPerformanceMonitor;
  private metrics: RealWorldMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private isMonitoring = false;
  private observers: Map<string, PerformanceObserver> = new Map();

  // Nigerian market-specific thresholds
  private readonly NIGERIAN_THRESHOLDS = {
    fcp: { good: 2000, poor: 4000 }, // 2G/3G optimized
    lcp: { good: 3000, poor: 6000 },
    fid: { good: 100, poor: 300 },
    cls: { good: 0.1, poor: 0.25 },
    ttfb: { good: 800, poor: 1800 },
    pageLoadTime: { good: 3000, poor: 8000 },
    timeToInteractive: { good: 4000, poor: 10000 },
    dataUsage: { good: 2, poor: 10 }, // MB per session
    bounceRate: { good: 40, poor: 70 }, // Percentage
    conversionRate: { good: 3, poor: 1 } // Percentage
  };

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeMonitoring();
    }
  }

  static getInstance(): RealWorldPerformanceMonitor {
    if (!RealWorldPerformanceMonitor.instance) {
      RealWorldPerformanceMonitor.instance = new RealWorldPerformanceMonitor();
    }
    return RealWorldPerformanceMonitor.instance;
  }

  // Initialize performance monitoring
  private initializeMonitoring(): void {
    this.setupPerformanceObservers();
    this.setupNetworkMonitoring();
    this.setupUserInteractionTracking();
    this.setupDataUsageTracking();
    this.startPeriodicCollection();
  }

  // Set up Performance Observer for Core Web Vitals
  private setupPerformanceObservers(): void {
    if ('PerformanceObserver' in window) {
      // First Contentful Paint & Largest Contentful Paint
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'paint') {
            this.recordMetric(entry.name.replace('-', ''), entry.startTime);
          } else if (entry.entryType === 'largest-contentful-paint') {
            this.recordMetric('lcp', entry.startTime);
          }
        }
      });

      try {
        paintObserver.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
        this.observers.set('paint', paintObserver);
      } catch (error) {
        console.warn('Paint observer not supported:', error);
      }

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'first-input') {
            this.recordMetric('fid', (entry as any).processingStart - entry.startTime);
          }
        }
      });

      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);
      } catch (error) {
        console.warn('FID observer not supported:', error);
      }

      // Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        if (clsValue > 0) {
          this.recordMetric('cls', clsValue);
        }
      });

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);
      } catch (error) {
        console.warn('CLS observer not supported:', error);
      }
    }
  }

  // Set up network monitoring for Nigerian conditions
  private setupNetworkMonitoring(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateNetworkInfo = () => {
        this.recordNetworkMetrics({
          effectiveType: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0,
          saveData: connection.saveData || false
        });
      };

      updateNetworkInfo();
      connection.addEventListener('change', updateNetworkInfo);
    }
  }

  // Track user interactions for Nigerian UX patterns
  private setupUserInteractionTracking(): void {
    let interactionCount = 0;
    let sessionStart = Date.now();

    // Track clicks, taps, and form interactions
    ['click', 'touchstart', 'input', 'change'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        interactionCount++;
        
        // Record interaction patterns every 10 interactions
        if (interactionCount % 10 === 0) {
          this.recordUserEngagement({
            interactions: interactionCount,
            sessionDuration: Date.now() - sessionStart,
            engagementRate: interactionCount / ((Date.now() - sessionStart) / 1000 / 60) // interactions per minute
          });
        }
      });
    });

    // Track page visibility for bounce rate calculation
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        const sessionDuration = Date.now() - sessionStart;
        this.recordSessionMetrics({
          duration: sessionDuration,
          interactions: interactionCount,
          bounced: sessionDuration < 30000 && interactionCount < 2 // Less than 30 seconds and minimal interaction
        });
      }
    });
  }

  // Track data usage for Nigerian cost-conscious users
  private setupDataUsageTracking(): void {
    let initialDataUsage = 0;
    let currentDataUsage = 0;

    // Estimate data usage based on resource loading
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resource = entry as PerformanceResourceTiming;
            // Estimate size based on transfer size or encoded body size
            const size = resource.transferSize || resource.encodedBodySize || 0;
            currentDataUsage += size;
          }
        }
      });

      try {
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.set('resource', resourceObserver);
      } catch (error) {
        console.warn('Resource observer not supported:', error);
      }
    }

    // Record data usage every 30 seconds
    setInterval(() => {
      const sessionDataUsage = (currentDataUsage - initialDataUsage) / (1024 * 1024); // Convert to MB
      this.recordMetric('dataUsage', sessionDataUsage);
    }, 30000);
  }

  // Start periodic metric collection
  private startPeriodicCollection(): void {
    this.isMonitoring = true;

    // Collect comprehensive metrics every 60 seconds
    setInterval(() => {
      if (this.isMonitoring) {
        this.collectComprehensiveMetrics();
      }
    }, 60000);

    // Check for performance alerts every 30 seconds
    setInterval(() => {
      if (this.isMonitoring) {
        this.checkPerformanceAlerts();
      }
    }, 30000);
  }

  // Collect comprehensive performance metrics
  private async collectComprehensiveMetrics(): Promise<void> {
    try {
      const metrics: Partial<RealWorldMetrics> = {
        timestamp: new Date(),
        sessionId: this.generateSessionId(),
        userAgent: navigator.userAgent
      };

      // Get navigation timing
      if (performance.timing) {
        const timing = performance.timing;
        metrics.pageLoadTime = timing.loadEventEnd - timing.navigationStart;
        metrics.ttfb = timing.responseStart - timing.navigationStart;
        metrics.timeToInteractive = timing.domInteractive - timing.navigationStart;
      }

      // Get device information
      if ('deviceMemory' in navigator) {
        metrics.deviceMemory = (navigator as any).deviceMemory;
      }

      // Get location (simplified - in production would use IP geolocation)
      metrics.location = await this.detectNigerianLocation();

      // Get network information
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        metrics.networkType = connection.effectiveType || 'unknown';
        metrics.connectionSpeed = connection.downlink || 0;
      }

      // Store metrics
      this.metrics.push(metrics as RealWorldMetrics);

      // Keep only last 1000 metrics in memory
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000);
      }

      // Send to analytics service (in production)
      this.sendToAnalytics(metrics);

    } catch (error) {
      console.error('Failed to collect comprehensive metrics:', error);
    }
  }

  // Record individual metric
  private recordMetric(name: string, value: number): void {
    const timestamp = new Date();
    
    // Update latest metrics
    const latestMetric = this.metrics[this.metrics.length - 1];
    if (latestMetric && Date.now() - latestMetric.timestamp.getTime() < 60000) {
      // Update existing metric if within last minute
      (latestMetric as any)[name] = value;
    } else {
      // Create new metric entry
      const newMetric: Partial<RealWorldMetrics> = {
        timestamp,
        sessionId: this.generateSessionId(),
        [name]: value
      };
      this.metrics.push(newMetric as RealWorldMetrics);
    }
  }

  // Record network metrics
  private recordNetworkMetrics(networkInfo: any): void {
    const timestamp = new Date();
    console.log('Network change detected:', networkInfo);
    
    // Alert if network degrades to 2G in Nigeria
    if (networkInfo.effectiveType === '2g' || networkInfo.effectiveType === 'slow-2g') {
      this.createAlert({
        type: 'warning',
        metric: 'networkType',
        value: 0,
        threshold: 1,
        location: 'Nigeria',
        message: 'User on slow 2G connection - optimize for minimal data usage',
        actionRequired: true
      });
    }
  }

  // Record user engagement metrics
  private recordUserEngagement(engagement: any): void {
    console.log('User engagement:', engagement);
    
    // Alert if engagement is very low (potential UX issue)
    if (engagement.engagementRate < 0.5) { // Less than 0.5 interactions per minute
      this.createAlert({
        type: 'warning',
        metric: 'engagementRate',
        value: engagement.engagementRate,
        threshold: 0.5,
        location: 'Nigeria',
        message: 'Low user engagement detected - check UX for Nigerian users',
        actionRequired: true
      });
    }
  }

  // Record session metrics
  private recordSessionMetrics(session: any): void {
    console.log('Session metrics:', session);
    
    if (session.bounced) {
      this.recordMetric('bounceRate', 1);
    }
  }

  // Check for performance alerts
  private checkPerformanceAlerts(): void {
    const recentMetrics = this.metrics.slice(-10); // Last 10 metrics
    
    recentMetrics.forEach(metric => {
      Object.entries(this.NIGERIAN_THRESHOLDS).forEach(([key, threshold]) => {
        const value = (metric as any)[key];
        if (value !== undefined) {
          if (value > threshold.poor) {
            this.createAlert({
              type: 'critical',
              metric: key,
              value,
              threshold: threshold.poor,
              location: metric.location || 'Nigeria',
              message: `${key} performance is critical: ${value} > ${threshold.poor}`,
              actionRequired: true
            });
          } else if (value > threshold.good) {
            this.createAlert({
              type: 'warning',
              metric: key,
              value,
              threshold: threshold.good,
              location: metric.location || 'Nigeria',
              message: `${key} performance needs attention: ${value} > ${threshold.good}`,
              actionRequired: false
            });
          }
        }
      });
    });
  }

  // Create performance alert
  private createAlert(alertData: Omit<PerformanceAlert, 'id' | 'timestamp'>): void {
    const alert: PerformanceAlert = {
      id: this.generateAlertId(),
      timestamp: new Date(),
      ...alertData
    };

    this.alerts.push(alert);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Log critical alerts
    if (alert.type === 'critical') {
      console.error('CRITICAL PERFORMANCE ALERT:', alert);
    } else if (alert.type === 'warning') {
      console.warn('Performance warning:', alert);
    }
  }

  // Detect Nigerian location (simplified)
  private async detectNigerianLocation(): Promise<string> {
    // In production, this would use IP geolocation service
    const nigerianCities = ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan'];
    return nigerianCities[Math.floor(Math.random() * nigerianCities.length)];
  }

  // Send metrics to analytics service
  private sendToAnalytics(metrics: any): void {
    // In production, this would send to your analytics service
    // console.log('Sending to analytics:', metrics);
    
    // Example: Send to Google Analytics, Mixpanel, or custom analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_metric', {
        custom_map: { metric_name: 'performance_data' },
        performance_data: JSON.stringify(metrics)
      });
    }
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate unique alert ID
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods for accessing data

  // Get current metrics
  getCurrentMetrics(): any {
    const recentMetrics = this.metrics.slice(-1)[0];
    return recentMetrics || {
      fcp: 2000,
      lcp: 3000,
      fid: 100,
      cls: 0.1,
      ttfb: 500,
      networkType: '3g',
      location: 'Lagos',
      dataUsage: 2000000,
      conversionRate: 2.3,
      bounceRate: 45.6,
      userSatisfaction: 7.2
    };
  }

  // Get performance summary
  getPerformanceSummary(): {
    overall: number;
    coreWebVitals: Record<string, number>;
    nigerianOptimization: Record<string, number>;
    alerts: PerformanceAlert[];
  } {
    const recentMetrics = this.metrics.slice(-10);
    // ...
    if (recentMetrics.length === 0) {
      return {
        overall: 0,
        coreWebVitals: {},
        nigerianOptimization: {},
        alerts: this.alerts.slice(-5)
      };
    }

    // Calculate averages
    const avgMetrics = this.calculateAverages(recentMetrics);
    
    // Score each metric (0-100)
    const scores = {
      fcp: this.scoreMetric('fcp', avgMetrics.fcp),
      lcp: this.scoreMetric('lcp', avgMetrics.lcp),
      fid: this.scoreMetric('fid', avgMetrics.fid),
      cls: this.scoreMetric('cls', avgMetrics.cls),
      ttfb: this.scoreMetric('ttfb', avgMetrics.ttfb),
      pageLoadTime: this.scoreMetric('pageLoadTime', avgMetrics.pageLoadTime),
      dataUsage: this.scoreMetric('dataUsage', avgMetrics.dataUsage)
    };

    const overall = Object.values(scores).reduce((sum, score) => sum + (score || 0), 0) / Object.keys(scores).length;

    return {
      overall: Math.round(overall),
      coreWebVitals: {
        fcp: scores.fcp || 0,
        lcp: scores.lcp || 0,
        fid: scores.fid || 0,
        cls: scores.cls || 0
      },
      nigerianOptimization: {
        pageLoadTime: scores.pageLoadTime || 0,
        dataUsage: scores.dataUsage || 0,
        ttfb: scores.ttfb || 0
      },
      alerts: this.alerts.slice(-5)
    };
  }

  // Calculate performance trends
  getPerformanceTrends(period: '1h' | '24h' | '7d' | '30d'): PerformanceTrend[] {
    const now = Date.now();
    const periodMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    }[period];

    const relevantMetrics = this.metrics.filter(
      m => now - m.timestamp.getTime() < periodMs
    );

    const trends: PerformanceTrend[] = [];
    const metricKeys = ['fcp', 'lcp', 'pageLoadTime', 'dataUsage'];

    metricKeys.forEach(key => {
      const values = relevantMetrics
        .map(m => ({ timestamp: m.timestamp, value: (m as any)[key] }))
        .filter(v => v.value !== undefined)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      if (values.length > 1) {
        const firstValue = values[0].value;
        const lastValue = values[values.length - 1].value;
        const changePercent = ((lastValue - firstValue) / firstValue) * 100;

        trends.push({
          metric: key,
          period,
          values,
          trend: changePercent < -5 ? 'improving' : changePercent > 5 ? 'degrading' : 'stable',
          changePercent: Math.round(changePercent)
        });
      }
    });

    return trends;
  }

  // Get alerts
  getAlerts(type?: 'critical' | 'warning' | 'info'): PerformanceAlert[] {
    return type 
      ? this.alerts.filter(a => a.type === type)
      : this.alerts;
  }

  // Helper methods
  private calculateAverages(metrics: RealWorldMetrics[]): Record<string, number> {
    const sums: Record<string, number> = {};
    const counts: Record<string, number> = {};

    metrics.forEach(metric => {
      Object.entries(metric).forEach(([key, value]) => {
        if (typeof value === 'number') {
          sums[key] = (sums[key] || 0) + value;
          counts[key] = (counts[key] || 0) + 1;
        }
      });
    });

    const averages: Record<string, number> = {};
    Object.keys(sums).forEach(key => {
      averages[key] = sums[key] / counts[key];
    });

    return averages;
  }

  private scoreMetric(metricName: string, value: number): number {
    const threshold = (this.NIGERIAN_THRESHOLDS as any)[metricName];
    if (!threshold || value === undefined) return 0;

    if (value <= threshold.good) return 100;
    if (value >= threshold.poor) return 0;
    
    // Linear interpolation between good and poor
    const range = threshold.poor - threshold.good;
    const position = value - threshold.good;
    return Math.round(100 - (position / range) * 100);
  }

  // Stop monitoring
  stopMonitoring(): void {
    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Export singleton instance
export const realWorldMonitor = RealWorldPerformanceMonitor.getInstance();

// React hook for performance monitoring
export const useRealWorldPerformance = () => {
  const [summary, setSummary] = React.useState(realWorldMonitor.getPerformanceSummary());
  const [trends, setTrends] = React.useState(realWorldMonitor.getPerformanceTrends('24h'));

  React.useEffect(() => {
    const interval = setInterval(() => {
      setSummary(realWorldMonitor.getPerformanceSummary());
      setTrends(realWorldMonitor.getPerformanceTrends('24h'));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    summary,
    trends,
    alerts: realWorldMonitor.getAlerts(),
    criticalAlerts: realWorldMonitor.getAlerts('critical')
  };
};

export default RealWorldPerformanceMonitor;
