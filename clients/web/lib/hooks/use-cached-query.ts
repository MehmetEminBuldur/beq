'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocalCache } from '@/lib/cache/local-storage-cache';
import { useOfflineDetection } from './use-service-worker';

export interface CachedQueryOptions {
  cacheTTL?: number; // Cache time to live in milliseconds
  refreshInterval?: number; // How often to refresh from network
  enableOffline?: boolean; // Use cached data when offline
  cacheKey?: string; // Custom cache key
  version?: string; // Cache version for invalidation
  compress?: boolean; // Enable compression for large data
}

export interface CachedQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  isOffline: boolean;
  isStale: boolean;
  lastFetched: number | null;
  refresh: () => Promise<void>;
  invalidate: () => void;
}

export function useCachedQuery<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  options: CachedQueryOptions = {}
): CachedQueryResult<T> {
  const {
    cacheTTL = 5 * 60 * 1000, // 5 minutes default
    refreshInterval,
    enableOffline = true,
    version,
    compress = false,
  } = options;

  const { cache } = useLocalCache();
  const { isOffline } = useOfflineDetection();

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  const fetcherRef = useRef(fetcher);
  const optionsRef = useRef(options);
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  const lastFetchTimeRef = useRef<number>(0);

  // Update refs when dependencies change
  useEffect(() => {
    fetcherRef.current = fetcher;
    optionsRef.current = options;
  }, [fetcher, options]);

  const actualCacheKey = options.cacheKey || cacheKey;

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to get from cache first (unless forcing refresh)
      if (!forceRefresh) {
        const cachedData = cache.get<T>(actualCacheKey, version);
        if (cachedData !== null) {
          setData(cachedData);
          setLastFetched(cache.get(`${actualCacheKey}_timestamp`, version) as number || Date.now());
          setIsStale(false);
        }
      }

      // If offline and we have cached data, don't fetch
      if (isOffline && enableOffline && data !== null) {
        setIsStale(true);
        return;
      }

      // Fetch fresh data
      const freshData = await fetcherRef.current();
      const now = Date.now();

      // Cache the data
      cache.set(actualCacheKey, freshData, {
        ttl: cacheTTL,
        compress,
        version,
      });

      // Cache timestamp separately for easier access
      cache.set(`${actualCacheKey}_timestamp`, now, {
        ttl: cacheTTL,
        version,
      });

      setData(freshData);
      setLastFetched(now);
      setIsStale(false);

    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('useCachedQuery fetch error:', error);

      // If we have cached data and are offline, keep showing it
      if (isOffline && enableOffline && data !== null) {
        setIsStale(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [cache, actualCacheKey, version, cacheTTL, compress, isOffline, enableOffline, data]);

  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  const invalidate = useCallback(() => {
    cache.delete(actualCacheKey);
    cache.delete(`${actualCacheKey}_timestamp`);
    setData(null);
    setLastFetched(null);
    setIsStale(false);
  }, [cache, actualCacheKey]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, []); // Only run once on mount

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      refreshTimeoutRef.current = setInterval(() => {
        fetchData(true);
      }, refreshInterval);

      return () => {
        if (refreshTimeoutRef.current) {
          clearInterval(refreshTimeoutRef.current);
        }
      };
    }
  }, [refreshInterval, fetchData]);

  // Handle online/offline changes
  useEffect(() => {
    if (!isOffline && isStale && data !== null) {
      // Came back online and data is stale, refresh
      fetchData(true);
    }
  }, [isOffline, isStale, data, fetchData]);

  return {
    data,
    isLoading,
    error,
    isOffline,
    isStale,
    lastFetched,
    refresh,
    invalidate,
  };
}

// Specialized hooks for different data types

export function useApiCache<T>(
  endpoint: string,
  fetcher: () => Promise<T>,
  options: CachedQueryOptions = {}
): CachedQueryResult<T> {
  const cacheKey = `api_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
  return useCachedQuery(cacheKey, fetcher, {
    cacheTTL: 15 * 60 * 1000, // 15 minutes for API data
    enableOffline: true,
    ...options,
  });
}

export function useUserDataCache<T>(
  dataType: string,
  userId: string,
  fetcher: () => Promise<T>,
  options: CachedQueryOptions = {}
): CachedQueryResult<T> {
  const cacheKey = `user_${userId}_${dataType}`;
  return useCachedQuery(cacheKey, fetcher, {
    cacheTTL: 30 * 60 * 1000, // 30 minutes for user data
    enableOffline: true,
    version: 'v1', // Version for schema changes
    ...options,
  });
}

export function useStaticDataCache<T>(
  dataType: string,
  fetcher: () => Promise<T>,
  options: CachedQueryOptions = {}
): CachedQueryResult<T> {
  const cacheKey = `static_${dataType}`;
  return useCachedQuery(cacheKey, fetcher, {
    cacheTTL: 24 * 60 * 60 * 1000, // 24 hours for static data
    enableOffline: false, // Static data doesn't need offline support
    compress: true, // Compress static data
    ...options,
  });
}

// Cache management hook
export function useCacheManager() {
  const { cache } = useLocalCache();

  const clearAllCache = useCallback(() => {
    cache.clear();
  }, [cache]);

  const clearCachePattern = useCallback((pattern: string) => {
    cache.clearPattern(pattern);
  }, [cache]);

  const getCacheStats = useCallback(() => {
    return cache.getStats();
  }, [cache]);

  const cleanup = useCallback(() => {
    // Trigger cleanup by getting stats (cleanup happens automatically)
    cache.getStats();
  }, [cache]);

  const healthCheck = useCallback(() => {
    const stats = cache.getStats();
    const isHealthy = stats.expiredItems === 0 && stats.usagePercentage < 90;
    return {
      isHealthy,
      stats,
      issues: isHealthy ? [] : [
        stats.expiredItems > 0 ? 'Expired items need cleanup' : '',
        stats.usagePercentage >= 90 ? 'Cache usage is high' : '',
      ].filter(Boolean),
    };
  }, [cache]);

  return {
    clearAllCache,
    clearCachePattern,
    getCacheStats,
    cleanup,
    healthCheck,
  };
}
