/**
 * Performance Optimization Service
 * Handles various performance improvements for the Nigeria Homes platform
 */

import { supabase } from '@/integrations/supabase/client';

// Image optimization utilities
export class ImageOptimizer {
  /**
   * Compress and optimize images before upload
   */
  static async compressImage(file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        const newWidth = img.width * ratio;
        const newHeight = img.height * ratio;

        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, newWidth, newHeight);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Fallback to original
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Generate multiple image sizes for responsive loading
   */
  static async generateResponsiveImages(file: File): Promise<{
    thumbnail: File;
    medium: File;
    large: File;
  }> {
    const [thumbnail, medium, large] = await Promise.all([
      this.compressImage(file, 300, 0.7),
      this.compressImage(file, 800, 0.8),
      this.compressImage(file, 1920, 0.85),
    ]);

    return { thumbnail, medium, large };
  }
}

// Database query optimization
export class DatabaseOptimizer {
  /**
   * Batch multiple database operations
   */
  static async batchOperations<T>(
    operations: (() => Promise<T>)[],
    batchSize: number = 5
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(op => op()));
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Optimized property search with proper indexing
   */
  static async searchPropertiesOptimized(filters: {
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    propertyType?: string;
    bedrooms?: number;
    limit?: number;
    offset?: number;
  }) {
    const { location, minPrice, maxPrice, propertyType, bedrooms, limit = 20, offset = 0 } = filters;

    let query = supabase
      .from('properties')
      .select(`
        id,
        name,
        description,
        price,
        location,
        property_type,
        bedrooms,
        bathrooms,
        square_feet,
        status,
        images,
        created_at
      `)
      .eq('status', 'available')
      .range(offset, offset + limit - 1);

    // Apply filters efficiently
    if (location) {
      query = query.ilike('location', `%${location}%`);
    }
    if (minPrice) {
      query = query.gte('price', minPrice);
    }
    if (maxPrice) {
      query = query.lte('price', maxPrice);
    }
    if (propertyType) {
      query = query.eq('property_type', propertyType);
    }
    if (bedrooms) {
      query = query.eq('bedrooms', bedrooms);
    }

    // Order by created_at for consistent pagination
    query = query.order('created_at', { ascending: false });

    return query;
  }

  /**
   * Preload related data to reduce N+1 queries
   */
  static async getPropertyWithRelations(propertyId: string) {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        owner:users!properties_owner_id_fkey(id, first_name, last_name, email),
        leases(
          id,
          start_date,
          end_date,
          monthly_rent,
          status,
          tenant:users!leases_tenant_id_fkey(id, first_name, last_name)
        ),
        maintenance_requests(
          id,
          title,
          description,
          status,
          priority,
          created_at
        )
      `)
      .eq('id', propertyId)
      .single();

    return { data, error };
  }
}

// Memory and cache optimization
export class CacheOptimizer {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  /**
   * Simple in-memory cache with TTL
   */
  static set(key: string, data: any, ttlMinutes: number = 5): void {
    const ttl = ttlMinutes * 60 * 1000; // Convert to milliseconds
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Get cached data if not expired
   */
  static get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Clear expired cache entries
   */
  static cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  static clear(): void {
    this.cache.clear();
  }
}

// Bundle and asset optimization
export class AssetOptimizer {
  /**
   * Lazy load images with intersection observer
   */
  static setupLazyLoading(): void {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            if (src) {
              img.src = src;
              img.classList.remove('lazy');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      // Observe all lazy images
      document.querySelectorAll('img[data-src]').forEach((img) => {
        imageObserver.observe(img);
      });
    }
  }

  /**
   * Preload critical resources
   */
  static preloadCriticalResources(urls: string[]): void {
    urls.forEach((url) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      
      // Determine resource type
      if (url.match(/\.(woff2?|ttf|eot)$/)) {
        link.as = 'font';
        link.crossOrigin = 'anonymous';
      } else if (url.match(/\.(jpg|jpeg|png|webp|svg)$/)) {
        link.as = 'image';
      } else if (url.match(/\.css$/)) {
        link.as = 'style';
      } else if (url.match(/\.js$/)) {
        link.as = 'script';
      }
      
      document.head.appendChild(link);
    });
  }
}

// Performance monitoring
export class PerformanceMonitor {
  /**
   * Measure and log performance metrics
   */
  static measurePerformance(name: string, fn: () => Promise<any>): Promise<any> {
    const start = performance.now();
    
    return fn().finally(() => {
      const end = performance.now();
      const duration = end - start;
      
      console.log(`⚡ Performance: ${name} took ${duration.toFixed(2)}ms`);
      
      // Log slow operations (>1000ms)
      if (duration > 1000) {
        console.warn(`🐌 Slow operation detected: ${name} (${duration.toFixed(2)}ms)`);
      }
    });
  }

  /**
   * Monitor memory usage
   */
  static logMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.log('📊 Memory Usage:', {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
      });
    }
  }

  /**
   * Setup performance observer for monitoring
   */
  static setupPerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            console.log('🚀 Navigation Performance:', {
              domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
              loadComplete: entry.loadEventEnd - entry.loadEventStart,
              totalTime: entry.loadEventEnd - entry.fetchStart,
            });
          }
        });
      });

      observer.observe({ entryTypes: ['navigation', 'measure'] });
    }
  }
}

// Initialize performance optimizations
export const initializePerformanceOptimizations = () => {
  // Setup lazy loading
  AssetOptimizer.setupLazyLoading();
  
  // Setup performance monitoring
  PerformanceMonitor.setupPerformanceObserver();
  
  // Cleanup cache every 10 minutes
  setInterval(() => {
    CacheOptimizer.cleanup();
  }, 10 * 60 * 1000);
  
  // Log memory usage every 5 minutes in development
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      PerformanceMonitor.logMemoryUsage();
    }, 5 * 60 * 1000);
  }
};
