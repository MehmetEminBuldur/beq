'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocalCache } from '@/lib/cache/local-storage-cache';

export function useServiceWorker() {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      setIsSupported(true);
    }
  }, []);

  const register = async (swUrl: string = '/sw.js') => {
    if (!isSupported) return;

    try {
      const reg = await navigator.serviceWorker.register(swUrl, {
        updateViaCache: 'none' // Force network-first for service worker updates
      });
      setRegistration(reg);
      setIsRegistered(true);

      // Listen for updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available, notify user to refresh
              console.log('New service worker available, refreshing caches...');
              // Force page reload to get new chunks
              window.location.reload();
            }
          });
        }
      });

      return reg;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      throw error;
    }
  };

  const unregister = async () => {
    if (registration) {
      await registration.unregister();
      setIsRegistered(false);
      setRegistration(null);
    }
  };

  return {
    isSupported,
    isRegistered,
    registration,
    register,
    unregister,
  };
}

export function useOfflineDetection() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
  };
}

export function useOfflineFirst<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  options: {
    fallbackData?: T;
    enableBackground?: boolean;
    cacheTTL?: number;
  } = {}
) {
  const { fallbackData, enableBackground = true, cacheTTL = 30 * 60 * 1000 } = options;
  const { cache } = useLocalCache();
  const { isOffline } = useOfflineDetection();

  const [data, setData] = useState<T | null>(fallbackData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const freshData = await fetcher();
      cache.set(cacheKey, freshData, { ttl: cacheTTL });
      setData(freshData);
      setIsStale(false);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [fetcher, cache, cacheKey, cacheTTL]);

  useEffect(() => {
    // Try cache first
    const cachedData = cache.get<T>(cacheKey);
    if (cachedData !== null) {
      setData(cachedData);
      setIsStale(false);
    }

    // If online or no cached data, fetch
    if (!isOffline || cachedData === null) {
      refresh();
    } else {
      setIsStale(true);
    }
  }, [cache, cacheKey, isOffline, refresh]);

  // Background refresh when coming back online
  useEffect(() => {
    if (!isOffline && isStale && enableBackground) {
      refresh();
    }
  }, [isOffline, isStale, enableBackground, refresh]);

  return {
    data,
    isLoading,
    error,
    refresh,
    isStale,
  };
}