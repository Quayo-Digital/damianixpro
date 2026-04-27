// Performance optimization utilities for DamianixPro
import React from 'react';
import { toast } from '@/components/ui/use-toast';

// CDN Configuration
export const CDN_CONFIG = {
  // Primary CDN for static assets
  PRIMARY_CDN: 'https://cdn.nigeriahomes.com',

  // Image CDN with optimization
  IMAGE_CDN: 'https://images.nigeriahomes.com',

  // Video CDN
  VIDEO_CDN: 'https://videos.nigeriahomes.com',

  // Font CDN
  FONT_CDN: 'https://fonts.nigeriahomes.com',

  // Fallback CDNs
  FALLBACK_CDNS: ['https://cdn-backup.nigeriahomes.com', 'https://assets.nigeriahomes.com'],

  // Regional CDN endpoints for Nigeria
  REGIONAL_CDNS: {
    lagos: 'https://lagos-cdn.nigeriahomes.com',
    abuja: 'https://abuja-cdn.nigeriahomes.com',
    kano: 'https://kano-cdn.nigeriahomes.com',
  },
};

// Performance monitoring class
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  constructor() {
    this.initializeObservers();
    this.startMonitoring();
  }

  private initializeObservers() {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    // Monitor Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry;
        this.recordMetric('LCP', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (error) {
      console.warn('LCP observer not supported:', error);
    }

    // Monitor First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const fid = entry.processingStart - entry.startTime;
          this.recordMetric('FID', fid);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (error) {
      console.warn('FID observer not supported:', error);
    }

    // Monitor Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.recordMetric('CLS', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (error) {
      console.warn('CLS observer not supported:', error);
    }

    // Monitor resource loading times
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: PerformanceResourceTiming) => {
          const loadTime = entry.responseEnd - entry.requestStart;
          this.recordMetric(`resource-${entry.initiatorType}`, loadTime);
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (error) {
      console.warn('Resource observer not supported:', error);
    }
  }

  private recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    const values = this.metrics.get(name)!;
    values.push(value);

    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  private startMonitoring() {
    if (typeof window === 'undefined') return;

    // Monitor page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.measurePageLoadMetrics();
      }, 0);
    });

    // Monitor memory usage (if available)
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.recordMetric('memory-used', memory.usedJSHeapSize);
        this.recordMetric('memory-total', memory.totalJSHeapSize);
      }, 30000); // Every 30 seconds
    }

    // Monitor connection quality
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.recordMetric('connection-downlink', connection.downlink);
      this.recordMetric('connection-rtt', connection.rtt);
    }
  }

  private measurePageLoadMetrics() {
    if (typeof window === 'undefined' || !window.performance) return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (navigation) {
      // Time to First Byte
      const ttfb = navigation.responseStart - navigation.requestStart;
      this.recordMetric('TTFB', ttfb);

      // DOM Content Loaded
      const dcl = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
      this.recordMetric('DCL', dcl);

      // Full Load Time
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
      this.recordMetric('LoadTime', loadTime);

      // DNS Lookup Time
      const dnsTime = navigation.domainLookupEnd - navigation.domainLookupStart;
      this.recordMetric('DNS', dnsTime);

      // TCP Connection Time
      const tcpTime = navigation.connectEnd - navigation.connectStart;
      this.recordMetric('TCP', tcpTime);
    }

    // First Paint and First Contentful Paint
    const paintEntries = performance.getEntriesByType('paint');
    paintEntries.forEach((entry) => {
      if (entry.name === 'first-paint') {
        this.recordMetric('FP', entry.startTime);
      } else if (entry.name === 'first-contentful-paint') {
        this.recordMetric('FCP', entry.startTime);
      }
    });
  }

  getMetrics(): Record<string, { avg: number; min: number; max: number; latest: number }> {
    const result: Record<string, { avg: number; min: number; max: number; latest: number }> = {};

    this.metrics.forEach((values, name) => {
      if (values.length === 0) return;

      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      const latest = values[values.length - 1];

      result[name] = { avg, min, max, latest };
    });

    return result;
  }

  getPerformanceScore(): number {
    const metrics = this.getMetrics();
    let score = 100;

    // Penalize based on Core Web Vitals
    if (metrics.LCP?.latest > 2500)
      score -= 20; // Poor LCP
    else if (metrics.LCP?.latest > 1200) score -= 10; // Needs improvement

    if (metrics.FID?.latest > 100)
      score -= 20; // Poor FID
    else if (metrics.FID?.latest > 25) score -= 10; // Needs improvement

    if (metrics.CLS?.latest > 0.25)
      score -= 20; // Poor CLS
    else if (metrics.CLS?.latest > 0.1) score -= 10; // Needs improvement

    // Penalize slow loading times
    if (metrics.LoadTime?.latest > 3000) score -= 15;
    else if (metrics.LoadTime?.latest > 1500) score -= 5;

    return Math.max(0, score);
  }

  reportToAnalytics() {
    const metrics = this.getMetrics();
    const score = this.getPerformanceScore();

    // Send to analytics service (implement based on your analytics provider)
    console.log('Performance Report:', { metrics, score });

    // Show warning if performance is poor
    if (score < 60) {
      toast({
        title: 'Performance Warning',
        description: 'Page performance is below optimal. Some features may be slow.',
        variant: 'destructive',
      });
    }
  }

  cleanup() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

// CDN utilities
export class CDNManager {
  private static instance: CDNManager;
  private activeCDN: string = CDN_CONFIG.PRIMARY_CDN;
  private failedCDNs: Set<string> = new Set();

  static getInstance(): CDNManager {
    if (!CDNManager.instance) {
      CDNManager.instance = new CDNManager();
    }
    return CDNManager.instance;
  }

  // Get optimized URL for asset
  getAssetUrl(path: string, type: 'image' | 'video' | 'font' | 'static' = 'static'): string {
    const cdnMap = {
      image: CDN_CONFIG.IMAGE_CDN,
      video: CDN_CONFIG.VIDEO_CDN,
      font: CDN_CONFIG.FONT_CDN,
      static: this.activeCDN,
    };

    const baseCDN = cdnMap[type];

    // Add regional optimization for Nigerian users
    const regionalCDN = this.getRegionalCDN();
    const finalCDN = regionalCDN || baseCDN;

    return `${finalCDN}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  // Get regional CDN based on user location
  private getRegionalCDN(): string | null {
    if (typeof window === 'undefined') return null;

    // Try to detect user's location (simplified)
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (timezone === 'Africa/Lagos') {
      return CDN_CONFIG.REGIONAL_CDNS.lagos;
    }

    // Default to primary CDN
    return null;
  }

  // Test CDN availability and switch if needed
  async testAndSwitchCDN(): Promise<void> {
    const testUrl = `${this.activeCDN}/health-check.json`;

    try {
      const response = await fetch(testUrl, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        throw new Error('CDN health check failed');
      }
    } catch (error) {
      console.warn('Primary CDN failed, switching to fallback:', error);
      this.failedCDNs.add(this.activeCDN);
      this.switchToFallbackCDN();
    }
  }

  private switchToFallbackCDN(): void {
    const availableCDNs = CDN_CONFIG.FALLBACK_CDNS.filter((cdn) => !this.failedCDNs.has(cdn));

    if (availableCDNs.length > 0) {
      this.activeCDN = availableCDNs[0];
      console.log('Switched to fallback CDN:', this.activeCDN);
    } else {
      console.error('All CDNs failed, using original URLs');
      this.activeCDN = '';
    }
  }

  // Preload critical assets
  preloadAssets(assets: Array<{ url: string; type: 'image' | 'script' | 'style' | 'font' }>): void {
    if (typeof window === 'undefined') return;

    assets.forEach(({ url, type }) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = this.getAssetUrl(url);

      switch (type) {
        case 'image':
          link.as = 'image';
          break;
        case 'script':
          link.as = 'script';
          break;
        case 'style':
          link.as = 'style';
          break;
        case 'font':
          link.as = 'font';
          link.crossOrigin = 'anonymous';
          break;
      }

      document.head.appendChild(link);
    });
  }
}

// Bundle analyzer utilities
export const BundleAnalyzer = {
  // Analyze current bundle size
  analyzeBundleSize: async (): Promise<{
    totalSize: number;
    gzipSize: number;
    chunks: Array<{ name: string; size: number }>;
  }> => {
    if (typeof window === 'undefined') {
      return { totalSize: 0, gzipSize: 0, chunks: [] };
    }

    try {
      // Get all script tags
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      const chunks: Array<{ name: string; size: number }> = [];
      let totalSize = 0;

      for (const script of scripts) {
        const src = (script as HTMLScriptElement).src;
        if (src && !src.startsWith('http')) continue;

        try {
          const response = await fetch(src, { method: 'HEAD' });
          const size = parseInt(response.headers.get('content-length') || '0');
          const name = src.split('/').pop() || 'unknown';

          chunks.push({ name, size });
          totalSize += size;
        } catch (error) {
          console.warn('Failed to get size for:', src);
        }
      }

      // Estimate gzip size (typically 70% smaller)
      const gzipSize = Math.round(totalSize * 0.3);

      return { totalSize, gzipSize, chunks };
    } catch (error) {
      console.error('Bundle analysis failed:', error);
      return { totalSize: 0, gzipSize: 0, chunks: [] };
    }
  },

  // Check if bundle size exceeds threshold
  checkBundleSize: async (maxSizeMB: number = 2): Promise<boolean> => {
    const analysis = await BundleAnalyzer.analyzeBundleSize();
    const sizeMB = analysis.totalSize / (1024 * 1024);

    if (sizeMB > maxSizeMB) {
      console.warn(`Bundle size (${sizeMB.toFixed(2)}MB) exceeds threshold (${maxSizeMB}MB)`);
      return false;
    }

    return true;
  },
};

// Performance optimization hooks
export const usePerformanceMonitoring = () => {
  const monitor = React.useRef<PerformanceMonitor>();
  const [metrics, setMetrics] = React.useState<Record<string, any>>({});
  const [score, setScore] = React.useState<number>(100);

  React.useEffect(() => {
    monitor.current = PerformanceMonitor.getInstance();

    const interval = setInterval(() => {
      if (monitor.current) {
        setMetrics(monitor.current.getMetrics());
        setScore(monitor.current.getPerformanceScore());
      }
    }, 5000); // Update every 5 seconds

    return () => {
      clearInterval(interval);
      monitor.current?.cleanup();
    };
  }, []);

  const reportMetrics = React.useCallback(() => {
    monitor.current?.reportToAnalytics();
  }, []);

  return { metrics, score, reportMetrics };
};

// Lazy loading utilities
export const LazyComponentLoader = {
  // Create lazy-loaded component with loading fallback
  createLazyComponent<T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    fallback?: React.ComponentType
  ) {
    const LazyComponent = React.lazy(importFn);

    return React.forwardRef<any, React.ComponentProps<T>>((props, ref) => {
      const FallbackComponent = fallback || (() => React.createElement('div', null, 'Loading...'));
      return React.createElement(
        React.Suspense,
        { fallback: React.createElement(FallbackComponent) },
        React.createElement(LazyComponent, { ...props, ref })
      );
    });
  },

  // Preload component for better UX
  preloadComponent: (importFn: () => Promise<any>) => {
    // Start loading the component
    importFn().catch((error) => {
      console.warn('Component preload failed:', error);
    });
  },
};

// Initialize performance monitoring
export const initializePerformanceOptimization = () => {
  if (typeof window === 'undefined') return;

  // Initialize performance monitoring
  const monitor = PerformanceMonitor.getInstance();

  // Initialize CDN manager
  const cdnManager = CDNManager.getInstance();

  // Test CDN availability
  cdnManager.testAndSwitchCDN();

  // Preload critical assets
  cdnManager.preloadAssets([
    { url: '/fonts/inter-var.woff2', type: 'font' },
    { url: '/images/logo.webp', type: 'image' },
    { url: '/css/critical.css', type: 'style' },
  ]);

  // Check bundle size
  BundleAnalyzer.checkBundleSize(2); // 2MB threshold

  // Report metrics after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      monitor.reportToAnalytics();
    }, 2000);
  });

  console.log('Performance optimization initialized');
};

// Export singleton instances
export const performanceMonitor = PerformanceMonitor.getInstance();
export const cdnManager = CDNManager.getInstance();

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  initializePerformanceOptimization();
}
