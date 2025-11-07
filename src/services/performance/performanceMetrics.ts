/**
 * Real Performance Metrics Service
 * Fetches actual performance data from the database
 */

import { supabase } from '@/integrations/supabase/client';
import { CacheOptimizer } from './performanceOptimizer';

export interface RealPerformanceMetrics {
  memoryUsage: {
    used: number;
    total: number;
    limit: number;
  };
  cacheStats: {
    size: number;
    hitRate: number;
    totalRequests: number;
    cacheHits: number;
  };
  queryPerformance: {
    averageTime: number;
    slowQueries: number;
    totalQueries: number;
    queryStats: Array<{
      table: string;
      avgTime: number;
      count: number;
    }>;
  };
  imageOptimization: {
    totalImages: number;
    optimizedImages: number;
    totalImageSize: number;
    optimizedImageSize: number;
  };
  databaseStats: {
    totalProperties: number;
    totalUsers: number;
    totalLeases: number;
    totalDocuments: number;
    activeConnections: number;
  };
}

// Performance tracking storage
class PerformanceTracker {
  private static queryTimes: Array<{ table: string; time: number; timestamp: number }> = [];
  private static cacheRequests = 0;
  private static cacheHits = 0;

  static trackQuery(table: string, time: number) {
    this.queryTimes.push({
      table,
      time,
      timestamp: Date.now(),
    });

    // Keep only last 100 queries
    if (this.queryTimes.length > 100) {
      this.queryTimes = this.queryTimes.slice(-100);
    }
  }

  static trackCacheRequest(isHit: boolean) {
    this.cacheRequests++;
    if (isHit) {
      this.cacheHits++;
    }
  }

  static getQueryStats() {
    const recentQueries = this.queryTimes.filter(
      q => Date.now() - q.timestamp < 5 * 60 * 1000 // Last 5 minutes
    );

    const tableStats = recentQueries.reduce((acc, query) => {
      if (!acc[query.table]) {
        acc[query.table] = { times: [], count: 0 };
      }
      acc[query.table].times.push(query.time);
      acc[query.table].count++;
      return acc;
    }, {} as Record<string, { times: number[]; count: number }>);

    const queryStats = Object.entries(tableStats).map(([table, stats]) => ({
      table,
      avgTime: Math.round(stats.times.reduce((a, b) => a + b, 0) / stats.times.length),
      count: stats.count,
    }));

    const averageTime = recentQueries.length > 0
      ? Math.round(recentQueries.reduce((sum, q) => sum + q.time, 0) / recentQueries.length)
      : 0;

    const slowQueries = recentQueries.filter(q => q.time > 1000).length;

    return {
      averageTime,
      slowQueries,
      totalQueries: recentQueries.length,
      queryStats,
    };
  }

  static getCacheStats() {
    const hitRate = this.cacheRequests > 0 
      ? Math.round((this.cacheHits / this.cacheRequests) * 100)
      : 0;

    return {
      hitRate,
      totalRequests: this.cacheRequests,
      cacheHits: this.cacheHits,
    };
  }

  static reset() {
    this.queryTimes = [];
    this.cacheRequests = 0;
    this.cacheHits = 0;
  }
}

export class RealPerformanceMetricsService {
  /**
   * Fetch comprehensive performance metrics from the database
   */
  static async getPerformanceMetrics(): Promise<RealPerformanceMetrics> {
    const startTime = performance.now();

    try {
      // Get memory usage
      const memoryUsage = this.getMemoryUsage();

      // Get database statistics
      const databaseStats = await this.getDatabaseStats();

      // Get query performance from tracker
      const queryPerformance = PerformanceTracker.getQueryStats();

      // Get cache statistics
      const cacheStats = {
        ...PerformanceTracker.getCacheStats(),
        size: this.getCacheSize(),
      };

      // Get image optimization stats
      const imageOptimization = this.getImageOptimizationStats();

      const totalTime = performance.now() - startTime;
      PerformanceTracker.trackQuery('performance_metrics', totalTime);

      return {
        memoryUsage,
        cacheStats,
        queryPerformance,
        imageOptimization,
        databaseStats,
      };
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      
      // Return fallback metrics
      return {
        memoryUsage: this.getMemoryUsage(),
        cacheStats: { size: 0, hitRate: 0, totalRequests: 0, cacheHits: 0 },
        queryPerformance: { averageTime: 0, slowQueries: 0, totalQueries: 0, queryStats: [] },
        imageOptimization: { totalImages: 0, optimizedImages: 0, totalImageSize: 0, optimizedImageSize: 0 },
        databaseStats: { totalProperties: 0, totalUsers: 0, totalLeases: 0, totalDocuments: 0, activeConnections: 0 },
      };
    }
  }

  /**
   * Get real database statistics
   */
  private static async getDatabaseStats() {
    const startTime = performance.now();

    try {
      // Run multiple queries in parallel for efficiency
      const [
        propertiesResult,
        usersResult,
        leasesResult,
        documentsResult,
      ] = await Promise.all([
        supabase.from('properties').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('leases').select('id', { count: 'exact', head: true }),
        supabase.from('documents').select('id', { count: 'exact', head: true }),
      ]);

      const queryTime = performance.now() - startTime;
      PerformanceTracker.trackQuery('database_stats', queryTime);

      return {
        totalProperties: propertiesResult.count || 0,
        totalUsers: usersResult.count || 0,
        totalLeases: leasesResult.count || 0,
        totalDocuments: documentsResult.count || 0,
        activeConnections: 1, // Current connection
      };
    } catch (error) {
      console.error('Error fetching database stats:', error);
      return {
        totalProperties: 0,
        totalUsers: 0,
        totalLeases: 0,
        totalDocuments: 0,
        activeConnections: 0,
      };
    }
  }

  /**
   * Get memory usage from Performance API
   */
  private static getMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
      };
    }

    return { used: 0, total: 0, limit: 0 };
  }

  /**
   * Get cache size from CacheOptimizer
   */
  private static getCacheSize(): number {
    // Access private cache through reflection (for monitoring purposes)
    try {
      const cache = (CacheOptimizer as any).cache;
      return cache instanceof Map ? cache.size : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get image optimization statistics from DOM
   */
  private static getImageOptimizationStats() {
    const allImages = document.querySelectorAll('img');
    const lazyImages = document.querySelectorAll('img[data-src], img[loading="lazy"]');
    const optimizedImages = document.querySelectorAll('img.optimized, img[srcset]');

    // Calculate approximate image sizes
    let totalImageSize = 0;
    let optimizedImageSize = 0;

    allImages.forEach((img) => {
      // Estimate size based on dimensions (rough approximation)
      const size = (img.naturalWidth || img.width || 0) * (img.naturalHeight || img.height || 0) * 0.5; // Rough bytes estimate
      totalImageSize += size;

      if (img.hasAttribute('data-src') || img.hasAttribute('srcset') || img.classList.contains('optimized')) {
        optimizedImageSize += size;
      }
    });

    return {
      totalImages: allImages.length,
      optimizedImages: Math.max(lazyImages.length, optimizedImages.length),
      totalImageSize: Math.round(totalImageSize / 1024), // KB
      optimizedImageSize: Math.round(optimizedImageSize / 1024), // KB
    };
  }

  /**
   * Get detailed property performance metrics
   */
  static async getPropertyMetrics(userId?: string) {
    const startTime = performance.now();

    try {
      let query = supabase
        .from('properties')
        .select(`
          id,
          name,
          status,
          created_at,
          updated_at,
          images
        `);

      if (userId) {
        query = query.eq('owner_id', userId);
      }

      const { data, error } = await query.limit(100);

      const queryTime = performance.now() - startTime;
      PerformanceTracker.trackQuery('properties', queryTime);

      if (error) throw error;

      // Analyze property data
      const totalProperties = data?.length || 0;
      const propertiesWithImages = data?.filter(p => p.images && p.images.length > 0).length || 0;
      const recentProperties = data?.filter(p => {
        const createdAt = new Date(p.created_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return createdAt > thirtyDaysAgo;
      }).length || 0;

      return {
        totalProperties,
        propertiesWithImages,
        recentProperties,
        imageOptimizationRate: totalProperties > 0 ? Math.round((propertiesWithImages / totalProperties) * 100) : 0,
        queryTime: Math.round(queryTime),
      };
    } catch (error) {
      console.error('Error fetching property metrics:', error);
      return {
        totalProperties: 0,
        propertiesWithImages: 0,
        recentProperties: 0,
        imageOptimizationRate: 0,
        queryTime: 0,
      };
    }
  }

  /**
   * Get user activity metrics
   */
  static async getUserActivityMetrics() {
    const startTime = performance.now();

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, created_at, last_sign_in_at')
        .limit(1000);

      const queryTime = performance.now() - startTime;
      PerformanceTracker.trackQuery('users', queryTime);

      if (error) throw error;

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const activeToday = data?.filter(u => 
        u.last_sign_in_at && new Date(u.last_sign_in_at) > oneDayAgo
      ).length || 0;

      const activeThisWeek = data?.filter(u => 
        u.last_sign_in_at && new Date(u.last_sign_in_at) > oneWeekAgo
      ).length || 0;

      const newUsersThisMonth = data?.filter(u => 
        new Date(u.created_at) > oneMonthAgo
      ).length || 0;

      return {
        totalUsers: data?.length || 0,
        activeToday,
        activeThisWeek,
        newUsersThisMonth,
        queryTime: Math.round(queryTime),
      };
    } catch (error) {
      console.error('Error fetching user activity metrics:', error);
      return {
        totalUsers: 0,
        activeToday: 0,
        activeThisWeek: 0,
        newUsersThisMonth: 0,
        queryTime: 0,
      };
    }
  }
}

// Export the tracker for use in other services
export { PerformanceTracker };
