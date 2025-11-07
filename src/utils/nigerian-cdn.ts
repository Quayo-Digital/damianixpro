// Nigerian CDN Implementation Strategy
// Optimized for Lagos, Abuja, and other major Nigerian cities

export interface CDNConfig {
  primaryNodes: string[];
  fallbackNodes: string[];
  geolocation: {
    lagos: string;
    abuja: string;
    portHarcourt: string;
    kano: string;
  };
  optimization: {
    compression: boolean;
    caching: boolean;
    preload: boolean;
  };
}

export interface CDNPerformanceMetrics {
  latency: number;
  throughput: number;
  availability: number;
  location: string;
  timestamp: Date;
}

export class NigerianCDN {
  private static instance: NigerianCDN;
  private config: CDNConfig;
  private performanceMetrics: CDNPerformanceMetrics[] = [];

  private constructor() {
    this.config = {
      primaryNodes: [
        'https://cdn-lagos.nigeriahomes.com',
        'https://cdn-abuja.nigeriahomes.com'
      ],
      fallbackNodes: [
        'https://cdn-west-africa.cloudfront.net',
        'https://cdn-africa.fastly.com'
      ],
      geolocation: {
        lagos: 'https://cdn-lagos.nigeriahomes.com',
        abuja: 'https://cdn-abuja.nigeriahomes.com',
        portHarcourt: 'https://cdn-ph.nigeriahomes.com',
        kano: 'https://cdn-kano.nigeriahomes.com'
      },
      optimization: {
        compression: true,
        caching: true,
        preload: true
      }
    };
  }

  static getInstance(): NigerianCDN {
    if (!NigerianCDN.instance) {
      NigerianCDN.instance = new NigerianCDN();
    }
    return NigerianCDN.instance;
  }

  // Get optimal CDN endpoint based on user location
  async getOptimalEndpoint(): Promise<string> {
    try {
      // Try to detect user location
      const location = await this.detectUserLocation();
      
      // Return location-specific CDN
      switch (location.city?.toLowerCase()) {
        case 'lagos':
          return this.config.geolocation.lagos;
        case 'abuja':
          return this.config.geolocation.abuja;
        case 'port harcourt':
          return this.config.geolocation.portHarcourt;
        case 'kano':
          return this.config.geolocation.kano;
        default:
          // Default to Lagos (largest market)
          return this.config.geolocation.lagos;
      }
    } catch (error) {
      console.warn('CDN location detection failed, using default:', error);
      return this.config.primaryNodes[0];
    }
  }

  // Detect user location (simplified for demo)
  private async detectUserLocation(): Promise<{ city?: string; state?: string }> {
    // In production, this would use:
    // 1. IP geolocation service
    // 2. Browser geolocation API (with permission)
    // 3. User profile data
    
    // For demo, simulate location detection
    const nigerianCities = ['lagos', 'abuja', 'port harcourt', 'kano', 'ibadan'];
    const randomCity = nigerianCities[Math.floor(Math.random() * nigerianCities.length)];
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ city: randomCity });
      }, 100);
    });
  }

  // Generate CDN-optimized URL
  generateCDNUrl(assetPath: string, options?: {
    compression?: boolean;
    caching?: boolean;
    version?: string;
  }): string {
    const endpoint = this.config.primaryNodes[0]; // Will be dynamic in production
    const params = new URLSearchParams();
    
    if (options?.compression !== false) {
      params.set('compress', '1');
    }
    
    if (options?.caching !== false) {
      params.set('cache', '7d'); // 7 days cache for Nigerian networks
    }
    
    if (options?.version) {
      params.set('v', options.version);
    }
    
    // Add Nigerian network optimization flag
    params.set('ng-opt', '1');
    
    const queryString = params.toString();
    return `${endpoint}${assetPath}${queryString ? `?${queryString}` : ''}`;
  }

  // Test CDN performance across Nigerian locations
  async testCDNPerformance(): Promise<CDNPerformanceMetrics[]> {
    const testResults: CDNPerformanceMetrics[] = [];
    
    for (const [location, endpoint] of Object.entries(this.config.geolocation)) {
      try {
        const startTime = performance.now();
        
        // Test with a small image
        const testUrl = `${endpoint}/test/performance.jpg?t=${Date.now()}`;
        const response = await fetch(testUrl, { method: 'HEAD' });
        
        const endTime = performance.now();
        const latency = endTime - startTime;
        
        const metrics: CDNPerformanceMetrics = {
          latency,
          throughput: response.ok ? 100 : 0, // Simplified throughput
          availability: response.ok ? 100 : 0,
          location,
          timestamp: new Date()
        };
        
        testResults.push(metrics);
        this.performanceMetrics.push(metrics);
        
      } catch (error) {
        console.error(`CDN test failed for ${location}:`, error);
        testResults.push({
          latency: 9999,
          throughput: 0,
          availability: 0,
          location,
          timestamp: new Date()
        });
      }
    }
    
    return testResults;
  }

  // Get CDN recommendations for Nigerian deployment
  getCDNRecommendations(): {
    providers: string[];
    configuration: Record<string, any>;
    estimatedCost: string;
    implementation: string[];
  } {
    return {
      providers: [
        'Cloudflare (with Lagos edge server)',
        'AWS CloudFront (with Africa region)',
        'Fastly (with West Africa POP)',
        'KeyCDN (with Nigerian presence)',
        'Local Nigerian CDN providers'
      ],
      configuration: {
        caching: {
          static_assets: '30 days',
          images: '7 days',
          api_responses: '5 minutes',
          html: '1 hour'
        },
        compression: {
          gzip: true,
          brotli: true,
          image_compression: 'aggressive'
        },
        optimization: {
          http2: true,
          http3: true,
          early_hints: true,
          preload: true
        }
      },
      estimatedCost: '$50-200/month for Nigerian traffic',
      implementation: [
        '1. Set up CDN account with African presence',
        '2. Configure origin server in Nigeria or nearby',
        '3. Set up edge locations in Lagos and Abuja',
        '4. Configure caching rules for Nigerian networks',
        '5. Implement failover to global CDN',
        '6. Set up monitoring and analytics',
        '7. Test performance across Nigerian cities',
        '8. Optimize based on real user metrics'
      ]
    };
  }

  // Monitor CDN performance in real-time
  startPerformanceMonitoring(): void {
    // Monitor every 5 minutes
    setInterval(async () => {
      try {
        const metrics = await this.testCDNPerformance();
        
        // Alert if performance degrades
        metrics.forEach(metric => {
          if (metric.latency > 2000) { // 2 seconds threshold for Nigerian networks
            console.warn(`High CDN latency detected in ${metric.location}: ${metric.latency}ms`);
          }
          
          if (metric.availability < 95) {
            console.error(`CDN availability issue in ${metric.location}: ${metric.availability}%`);
          }
        });
        
        // Keep only last 100 metrics
        this.performanceMetrics = this.performanceMetrics.slice(-100);
        
      } catch (error) {
        console.error('CDN monitoring failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  // Get performance analytics
  getPerformanceAnalytics(): {
    averageLatency: number;
    bestPerformingLocation: string;
    worstPerformingLocation: string;
    overallAvailability: number;
    recommendations: string[];
  } {
    if (this.performanceMetrics.length === 0) {
      return {
        averageLatency: 0,
        bestPerformingLocation: 'unknown',
        worstPerformingLocation: 'unknown',
        overallAvailability: 0,
        recommendations: ['No performance data available']
      };
    }

    const avgLatency = this.performanceMetrics.reduce((sum, m) => sum + m.latency, 0) / this.performanceMetrics.length;
    
    const locationStats = this.performanceMetrics.reduce((acc, metric) => {
      if (!acc[metric.location]) {
        acc[metric.location] = { totalLatency: 0, count: 0 };
      }
      acc[metric.location].totalLatency += metric.latency;
      acc[metric.location].count += 1;
      return acc;
    }, {} as Record<string, { totalLatency: number; count: number }>);

    const locationAverages = Object.entries(locationStats).map(([location, stats]) => ({
      location,
      avgLatency: stats.totalLatency / stats.count
    }));

    const bestLocation = locationAverages.reduce((best, current) => 
      current.avgLatency < best.avgLatency ? current : best
    );

    const worstLocation = locationAverages.reduce((worst, current) => 
      current.avgLatency > worst.avgLatency ? current : worst
    );

    const avgAvailability = this.performanceMetrics.reduce((sum, m) => sum + m.availability, 0) / this.performanceMetrics.length;

    const recommendations: string[] = [];
    
    if (avgLatency > 1500) {
      recommendations.push('Consider adding more edge locations in Nigeria');
    }
    
    if (avgAvailability < 99) {
      recommendations.push('Implement redundant CDN providers');
    }
    
    if (worstLocation.avgLatency > bestLocation.avgLatency * 2) {
      recommendations.push(`Optimize CDN configuration for ${worstLocation.location}`);
    }

    return {
      averageLatency: avgLatency,
      bestPerformingLocation: bestLocation.location,
      worstPerformingLocation: worstLocation.location,
      overallAvailability: avgAvailability,
      recommendations
    };
  }
}

// Export singleton instance
export const nigerianCDN = NigerianCDN.getInstance();

// Utility functions for React components
export const useCDNOptimizedUrl = (assetPath: string) => {
  const [cdnUrl, setCdnUrl] = React.useState<string>(assetPath);
  
  React.useEffect(() => {
    const optimizeUrl = async () => {
      try {
        const optimizedUrl = nigerianCDN.generateCDNUrl(assetPath, {
          compression: true,
          caching: true,
          version: '1.0'
        });
        setCdnUrl(optimizedUrl);
      } catch (error) {
        console.error('CDN optimization failed:', error);
        setCdnUrl(assetPath); // Fallback to original
      }
    };
    
    optimizeUrl();
  }, [assetPath]);
  
  return cdnUrl;
};

export default NigerianCDN;
