// Performance monitoring utilities for Nigeria Homes platform
// Optimized for Nigerian network conditions and devices

export interface PerformanceMetrics {
  // Core Web Vitals
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  
  // Custom metrics
  pageLoadTime: number;
  domContentLoaded: number;
  resourceLoadTime: number;
  apiResponseTime: number;
  
  // Network metrics
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  
  // Device metrics
  deviceMemory: number;
  hardwareConcurrency: number;
  
  // Bundle metrics
  jsHeapSizeUsed: number;
  jsHeapSizeLimit: number;
  
  timestamp: Date;
}

export interface PerformanceThresholds {
  fcp: { good: number; poor: number };
  lcp: { good: number; poor: number };
  fid: { good: number; poor: number };
  cls: { good: number; poor: number };
  ttfb: { good: number; poor: number };
  pageLoadTime: { good: number; poor: number };
}

// Nigerian market-specific performance thresholds
// Adjusted for slower network conditions and lower-end devices
export const NIGERIAN_PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  fcp: { good: 2000, poor: 4000 }, // More lenient for Nigerian networks
  lcp: { good: 3000, poor: 6000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 },
  ttfb: { good: 800, poor: 1800 }, // Account for international server latency
  pageLoadTime: { good: 4000, poor: 8000 }
};

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private thresholds: PerformanceThresholds;
  private observers: PerformanceObserver[] = [];

  private constructor(thresholds: PerformanceThresholds = NIGERIAN_PERFORMANCE_THRESHOLDS) {
    this.thresholds = thresholds;
    this.initializeObservers();
  }

  static getInstance(thresholds?: PerformanceThresholds): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor(thresholds);
    }
    return PerformanceMonitor.instance;
  }

  private initializeObservers(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      // Observe Core Web Vitals
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handlePerformanceEntry(entry);
        }
      });

      // Observe different entry types
      const entryTypes = ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift'];
      
      entryTypes.forEach(type => {
        try {
          observer.observe({ type, buffered: true });
        } catch (error) {
          console.warn(`Performance observer for ${type} not supported:`, error);
        }
      });

      this.observers.push(observer);
    } catch (error) {
      console.warn('Performance monitoring not fully supported:', error);
    }
  }

  private handlePerformanceEntry(entry: PerformanceEntry): void {
    // Store performance entries for analysis
    const timestamp = new Date();
    
    // Log significant performance events
    if (entry.entryType === 'largest-contentful-paint') {
      console.log(`LCP: ${entry.startTime}ms at ${timestamp.toISOString()}`);
    }
    
    if (entry.entryType === 'first-input') {
      const fidEntry = entry as PerformanceEventTiming;
      console.log(`FID: ${fidEntry.processingStart - fidEntry.startTime}ms`);
    }
  }

  // Collect comprehensive performance metrics
  async collectMetrics(): Promise<PerformanceMetrics> {
    const metrics: Partial<PerformanceMetrics> = {
      timestamp: new Date()
    };

    // Navigation timing
    if ('performance' in window && performance.getEntriesByType) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
        metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
        metrics.ttfb = navigation.responseStart - navigation.requestStart;
        metrics.resourceLoadTime = navigation.loadEventEnd - navigation.domContentLoadedEventEnd;
      }
    }

    // Paint timing
    if ('performance' in window) {
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        metrics.fcp = fcpEntry.startTime;
      }
    }

    // LCP
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      const lastLCP = lcpEntries[lcpEntries.length - 1] as any;
      metrics.lcp = lastLCP.startTime;
    }

    // CLS
    let clsValue = 0;
    const clsEntries = performance.getEntriesByType('layout-shift');
    for (const entry of clsEntries) {
      const layoutShift = entry as any;
      if (!layoutShift.hadRecentInput) {
        clsValue += layoutShift.value;
      }
    }
    metrics.cls = clsValue;

    // FID (approximation)
    const fidEntries = performance.getEntriesByType('first-input');
    if (fidEntries.length > 0) {
      const fidEntry = fidEntries[0] as any;
      metrics.fid = fidEntry.processingStart - fidEntry.startTime;
    } else {
      metrics.fid = 0; // No user interaction yet
    }

    // Network information
    if ('navigator' in window && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      metrics.connectionType = connection.type || 'unknown';
      metrics.effectiveType = connection.effectiveType || 'unknown';
      metrics.downlink = connection.downlink || 0;
      metrics.rtt = connection.rtt || 0;
    } else {
      metrics.connectionType = 'unknown';
      metrics.effectiveType = 'unknown';
      metrics.downlink = 0;
      metrics.rtt = 0;
    }

    // Device information
    if ('navigator' in window) {
      metrics.deviceMemory = (navigator as any).deviceMemory || 0;
      metrics.hardwareConcurrency = navigator.hardwareConcurrency || 0;
    } else {
      metrics.deviceMemory = 0;
      metrics.hardwareConcurrency = 0;
    }

    // Memory usage
    if ('performance' in window && 'memory' in performance) {
      const memory = (performance as any).memory;
      metrics.jsHeapSizeUsed = memory.usedJSHeapSize || 0;
      metrics.jsHeapSizeLimit = memory.jsHeapSizeLimit || 0;
    } else {
      metrics.jsHeapSizeUsed = 0;
      metrics.jsHeapSizeLimit = 0;
    }

    const completeMetrics = metrics as PerformanceMetrics;
    this.metrics.push(completeMetrics);
    
    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    return completeMetrics;
  }

  // Analyze performance against thresholds
  analyzePerformance(metrics: PerformanceMetrics): {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let totalScore = 0;
    let testCount = 0;

    // Analyze each metric
    const tests = [
      {
        name: 'First Contentful Paint',
        value: metrics.fcp,
        threshold: this.thresholds.fcp,
        weight: 20
      },
      {
        name: 'Largest Contentful Paint',
        value: metrics.lcp,
        threshold: this.thresholds.lcp,
        weight: 25
      },
      {
        name: 'First Input Delay',
        value: metrics.fid,
        threshold: this.thresholds.fid,
        weight: 20
      },
      {
        name: 'Cumulative Layout Shift',
        value: metrics.cls,
        threshold: this.thresholds.cls,
        weight: 15
      },
      {
        name: 'Time to First Byte',
        value: metrics.ttfb,
        threshold: this.thresholds.ttfb,
        weight: 10
      },
      {
        name: 'Page Load Time',
        value: metrics.pageLoadTime,
        threshold: this.thresholds.pageLoadTime,
        weight: 10
      }
    ];

    for (const test of tests) {
      testCount++;
      let score = 100;

      if (test.value > test.threshold.poor) {
        score = 0;
        issues.push(`${test.name} is poor (${test.value}ms > ${test.threshold.poor}ms)`);
        recommendations.push(`Optimize ${test.name.toLowerCase()}`);
      } else if (test.value > test.threshold.good) {
        score = 50;
        issues.push(`${test.name} needs improvement (${test.value}ms > ${test.threshold.good}ms)`);
      }

      totalScore += (score * test.weight) / 100;
    }

    const finalScore = Math.round(totalScore / testCount);
    let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F';

    if (finalScore >= 90) grade = 'A';
    else if (finalScore >= 80) grade = 'B';
    else if (finalScore >= 70) grade = 'C';
    else if (finalScore >= 60) grade = 'D';

    // Add Nigerian-specific recommendations
    if (metrics.connectionType === '2g' || metrics.effectiveType === 'slow-2g') {
      recommendations.push('Optimize for slow networks - implement aggressive caching');
      recommendations.push('Consider offline-first approach for critical features');
    }

    if (metrics.deviceMemory > 0 && metrics.deviceMemory < 2) {
      recommendations.push('Optimize for low-memory devices - reduce bundle size');
      recommendations.push('Implement lazy loading for non-critical components');
    }

    return {
      score: finalScore,
      grade,
      issues,
      recommendations
    };
  }

  // Get historical metrics
  getMetrics(limit?: number): PerformanceMetrics[] {
    return limit ? this.metrics.slice(-limit) : [...this.metrics];
  }

  // Monitor API performance
  async measureApiCall<T>(
    apiCall: () => Promise<T>,
    endpoint: string
  ): Promise<{ result: T; duration: number }> {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      
      // Log slow API calls
      if (duration > 2000) {
        console.warn(`Slow API call detected: ${endpoint} took ${duration}ms`);
      }
      
      return { result, duration };
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`API call failed: ${endpoint} after ${duration}ms`, error);
      throw error;
    }
  }

  // Performance optimization suggestions for Nigerian market
  getNigerianOptimizationSuggestions(): string[] {
    return [
      'Implement aggressive caching for static assets',
      'Use WebP images with JPEG fallbacks',
      'Minimize JavaScript bundle size',
      'Implement service worker for offline functionality',
      'Optimize for 2G/3G networks',
      'Use CDN with Nigerian edge locations',
      'Implement progressive loading',
      'Optimize database queries',
      'Use compression (gzip/brotli)',
      'Minimize third-party scripts',
      'Implement critical CSS inlining',
      'Use resource hints (preload, prefetch)',
      'Optimize font loading',
      'Implement lazy loading for images',
      'Use efficient data formats (JSON over XML)'
    ];
  }

  // Cleanup observers
  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Performance utilities for React components
export class ReactPerformanceUtils {
  // Measure component render time
  static measureRender<T extends React.ComponentType<any>>(
    Component: T,
    displayName?: string
  ): T {
    const WrappedComponent = (props: any) => {
      const startTime = performance.now();
      
      React.useEffect(() => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        if (renderTime > 16) { // Longer than one frame
          console.warn(`Slow render detected in ${displayName || Component.name}: ${renderTime}ms`);
        }
      });

      return React.createElement(Component, props);
    };

    WrappedComponent.displayName = `PerformanceMonitor(${displayName || Component.name})`;
    return WrappedComponent as T;
  }

  // Debounce function for performance optimization
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(null, args), wait);
    };
  }

  // Throttle function for performance optimization
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(null, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Auto-start monitoring when module loads
if (typeof window !== 'undefined') {
  // Start collecting metrics after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      performanceMonitor.collectMetrics().then(metrics => {
        console.log('Initial performance metrics collected:', metrics);
      });
    }, 1000);
  });
}
