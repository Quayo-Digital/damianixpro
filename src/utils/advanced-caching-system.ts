import React from 'react';

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum cache size in MB
  compressionEnabled: boolean;
  offlineMode: boolean;
  nigerianOptimizations: boolean;
}

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number;
  compressed: boolean;
  size: number;
  accessCount: number;
  lastAccessed: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  networkType?: '2g' | '3g' | '4g' | 'wifi';
}

export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  totalSize: number;
  entryCount: number;
  compressionRatio: number;
  dataSavings: number;
  offlineHits: number;
  networkTypeDistribution: Record<string, number>;
}

export interface OfflineSyncQueue {
  id: string;
  action: 'create' | 'update' | 'delete';
  resource: string;
  data: any;
  timestamp: number;
  priority: number;
  retryCount: number;
  maxRetries: number;
}

class AdvancedCachingSystem {
  private cache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private metrics: CacheMetrics;
  private offlineQueue: OfflineSyncQueue[] = [];
  private isOnline = navigator.onLine;
  private networkType: string = 'unknown';

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      ttl: 5 * 60 * 1000, // 5 minutes default
      maxSize: 50, // 50MB default
      compressionEnabled: true,
      offlineMode: true,
      nigerianOptimizations: true,
      ...config,
    };

    this.metrics = {
      hitRate: 0,
      missRate: 0,
      totalSize: 0,
      entryCount: 0,
      compressionRatio: 0,
      dataSavings: 0,
      offlineHits: 0,
      networkTypeDistribution: {},
    };

    this.initializeNetworkMonitoring();
    this.initializeOfflineSupport();
    this.startCleanupInterval();
  }

  private initializeNetworkMonitoring(): void {
    // Monitor network connection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Detect network type for Nigerian optimization
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.networkType = connection.effectiveType || 'unknown';

      connection.addEventListener('change', () => {
        this.networkType = connection.effectiveType || 'unknown';
        this.adjustCachingStrategy();
      });
    }
  }

  private initializeOfflineSupport(): void {
    // Never register legacy sw.js in Vite dev — it intercepts navigations and breaks SPA / lazy chunks.
    if (!import.meta.env.PROD) return;
    if ('serviceWorker' in navigator && this.config.offlineMode) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  }

  private adjustCachingStrategy(): void {
    if (!this.config.nigerianOptimizations) return;

    // Adjust TTL based on network type (Nigerian network conditions)
    switch (this.networkType) {
      case '2g':
        this.config.ttl = 30 * 60 * 1000; // 30 minutes for 2G
        this.config.compressionEnabled = true;
        break;
      case '3g':
        this.config.ttl = 15 * 60 * 1000; // 15 minutes for 3G
        this.config.compressionEnabled = true;
        break;
      case '4g':
        this.config.ttl = 5 * 60 * 1000; // 5 minutes for 4G
        break;
      default:
        this.config.ttl = 10 * 60 * 1000; // 10 minutes default
    }
  }

  private compressData(data: any): { compressed: string; ratio: number } {
    if (!this.config.compressionEnabled) {
      return { compressed: JSON.stringify(data), ratio: 1 };
    }

    try {
      const original = JSON.stringify(data);
      // Simple compression simulation (in production, use actual compression library)
      const compressed = this.simpleCompress(original);
      const ratio = original.length / compressed.length;

      return { compressed, ratio };
    } catch (error) {
      console.warn('Compression failed:', error);
      return { compressed: JSON.stringify(data), ratio: 1 };
    }
  }

  private simpleCompress(data: string): string {
    // Simplified compression simulation
    // In production, use libraries like pako or lz-string
    return data.replace(/\s+/g, ' ').trim();
  }

  private decompressData(compressed: string): any {
    try {
      return JSON.parse(compressed);
    } catch (error) {
      console.warn('Decompression failed:', error);
      return null;
    }
  }

  private calculateSize(data: any): number {
    return new Blob([JSON.stringify(data)]).size / (1024 * 1024); // Size in MB
  }

  private evictLRU(): void {
    if (this.cache.size === 0) return;

    // Find least recently used entry
    let lruKey = '';
    let lruTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime && entry.priority !== 'critical') {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      this.updateMetrics();
    }
  }

  private updateMetrics(): void {
    const totalEntries = this.cache.size;
    let totalSize = 0;
    let totalCompressionRatio = 0;
    let compressedEntries = 0;

    for (const entry of this.cache.values()) {
      totalSize += entry.size;
      if (entry.compressed) {
        totalCompressionRatio += 1; // Simplified ratio calculation
        compressedEntries++;
      }
    }

    this.metrics.totalSize = totalSize;
    this.metrics.entryCount = totalEntries;
    this.metrics.compressionRatio =
      compressedEntries > 0 ? totalCompressionRatio / compressedEntries : 1;
    this.metrics.dataSavings = (1 - 1 / this.metrics.compressionRatio) * 100;
  }

  set<T>(
    key: string,
    data: T,
    options: Partial<{
      ttl: number;
      priority: 'low' | 'medium' | 'high' | 'critical';
      compress: boolean;
    }> = {}
  ): void {
    const now = Date.now();
    const ttl = options.ttl || this.config.ttl;
    const priority = options.priority || 'medium';
    const shouldCompress = options.compress !== false && this.config.compressionEnabled;

    // Check cache size limit
    while (this.metrics.totalSize > this.config.maxSize && this.cache.size > 0) {
      this.evictLRU();
    }

    const { compressed, ratio } = shouldCompress
      ? this.compressData(data)
      : { compressed: JSON.stringify(data), ratio: 1 };

    const entry: CacheEntry<T> = {
      key,
      data: shouldCompress ? (compressed as any) : data,
      timestamp: now,
      ttl,
      compressed: shouldCompress,
      size: this.calculateSize(data),
      accessCount: 0,
      lastAccessed: now,
      priority,
      networkType: this.networkType as any,
    };

    this.cache.set(key, entry);
    this.updateMetrics();
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T>;

    if (!entry) {
      this.metrics.missRate++;
      return null;
    }

    const now = Date.now();

    // Check if entry has expired
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.metrics.missRate++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;
    this.metrics.hitRate++;

    // Track offline hits
    if (!this.isOnline) {
      this.metrics.offlineHits++;
    }

    // Return decompressed data if needed
    if (entry.compressed) {
      return this.decompressData(entry.data as string);
    }

    return entry.data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
    this.updateMetrics();
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
    this.updateMetrics();
  }

  clear(): void {
    this.cache.clear();
    this.updateMetrics();
  }

  // Nigerian-specific: Offline queue management
  addToOfflineQueue(action: Omit<OfflineSyncQueue, 'id' | 'timestamp' | 'retryCount'>): void {
    const queueItem: OfflineSyncQueue = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      ...action,
    };

    this.offlineQueue.push(queueItem);
    this.persistOfflineQueue();
  }

  private async syncOfflineQueue(): Promise<void> {
    if (!this.isOnline || this.offlineQueue.length === 0) return;

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const item of queue) {
      try {
        await this.processOfflineItem(item);
      } catch (error) {
        console.warn('Failed to sync offline item:', error);

        if (item.retryCount < item.maxRetries) {
          item.retryCount++;
          this.offlineQueue.push(item);
        }
      }
    }

    this.persistOfflineQueue();
  }

  private async processOfflineItem(item: OfflineSyncQueue): Promise<void> {
    // This would integrate with your API layer
    console.log('Processing offline item:', item);
    // Implementation would depend on your specific API structure
  }

  private persistOfflineQueue(): void {
    try {
      localStorage.setItem('nigeriaHomes_offlineQueue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.warn('Failed to persist offline queue:', error);
    }
  }

  private loadOfflineQueue(): void {
    try {
      const stored = localStorage.getItem('nigeriaHomes_offlineQueue');
      if (stored) {
        this.offlineQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load offline queue:', error);
      this.offlineQueue = [];
    }
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
        }
      }
      this.updateMetrics();
    }, 60000); // Cleanup every minute
  }

  // Nigerian-specific: Data-conscious caching
  getCacheMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  getNetworkOptimizedData<T>(key: string, fallback: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key);

    if (cached) {
      return Promise.resolve(cached);
    }

    // If offline, return null or cached fallback
    if (!this.isOnline) {
      return Promise.reject(new Error('Offline: No cached data available'));
    }

    // Fetch with network-aware timeout
    const timeout = this.getNetworkTimeout();

    return Promise.race([
      fallback(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Network timeout')), timeout)
      ),
    ]).then((data) => {
      this.set(key, data);
      return data;
    });
  }

  private getNetworkTimeout(): number {
    switch (this.networkType) {
      case '2g':
        return 30000; // 30 seconds for 2G
      case '3g':
        return 15000; // 15 seconds for 3G
      case '4g':
        return 5000; // 5 seconds for 4G
      default:
        return 10000; // 10 seconds default
    }
  }

  // Export cache for debugging
  exportCache(): Record<string, any> {
    const exported: Record<string, any> = {};
    for (const [key, entry] of this.cache.entries()) {
      exported[key] = {
        ...entry,
        data: entry.compressed ? this.decompressData(entry.data as string) : entry.data,
      };
    }
    return exported;
  }
}

// Global cache instance optimized for Nigerian conditions
export const nigerianCache = new AdvancedCachingSystem({
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 100, // 100MB
  compressionEnabled: true,
  offlineMode: true,
  nigerianOptimizations: true,
});

// React hook for advanced caching
export const useAdvancedCache = <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    enabled?: boolean;
  } = {}
) => {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [fromCache, setFromCache] = React.useState(false);

  const { enabled = true } = options;

  React.useEffect(() => {
    if (!enabled) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Try cache first
        const cached = nigerianCache.get<T>(key);
        if (cached) {
          setData(cached);
          setFromCache(true);
          setLoading(false);
          return;
        }

        // Fetch fresh data
        setFromCache(false);
        const freshData = await nigerianCache.getNetworkOptimizedData(key, fetcher);
        setData(freshData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [key, enabled]);

  const invalidate = React.useCallback(() => {
    nigerianCache.invalidate(key);
    setData(null);
    setFromCache(false);
  }, [key]);

  const refresh = React.useCallback(async () => {
    nigerianCache.invalidate(key);
    setLoading(true);
    try {
      const freshData = await fetcher();
      nigerianCache.set(key, freshData, options);
      setData(freshData);
      setFromCache(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, options]);

  return {
    data,
    loading,
    error,
    fromCache,
    invalidate,
    refresh,
    metrics: nigerianCache.getCacheMetrics(),
  };
};
