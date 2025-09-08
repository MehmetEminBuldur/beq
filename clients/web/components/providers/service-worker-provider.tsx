'use client';

import { useEffect } from 'react';
import { useServiceWorker, useOfflineDetection } from '@/lib/hooks/use-service-worker';
import { toast } from 'react-hot-toast';

interface ServiceWorkerProviderProps {
  children: React.ReactNode;
}

export function ServiceWorkerProvider({ children }: ServiceWorkerProviderProps) {
  const {
    isSupported,
    isRegistered,
    isUpdateAvailable,
    updateServiceWorker,
    error,
  } = useServiceWorker();

  const { isOnline, isOffline } = useOfflineDetection();

  // Handle online/offline status
  useEffect(() => {
    if (isOffline) {
      toast('You are offline. Using cached data.', {
        icon: '📱',
        duration: 3000,
      });
    } else if (isOnline) {
      toast.success('You are back online!', {
        duration: 2000,
      });
    }
  }, [isOnline, isOffline]);

  // Handle service worker updates
  useEffect(() => {
    if (isUpdateAvailable) {
      toast(
        (t) => (
          <div className="flex flex-col space-y-2">
            <span>A new version of BeQ is available!</span>
            <div className="flex space-x-2">
              <button
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                onClick={() => {
                  updateServiceWorker();
                  toast.dismiss(t.id);
                }}
              >
                Update
              </button>
              <button
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm"
                onClick={() => toast.dismiss(t.id)}
              >
                Later
              </button>
            </div>
          </div>
        ),
        {
          duration: 10000,
          icon: '🔄',
        }
      );
    }
  }, [isUpdateAvailable, updateServiceWorker]);

  // Handle service worker errors
  useEffect(() => {
    if (error) {
      console.error('Service Worker error:', error);
      // Don't show error toast as it might be annoying
    }
  }, [error]);

  // Log service worker status for debugging
  useEffect(() => {
    if (isSupported && isRegistered) {
      console.log('✅ Service Worker registered successfully');
    } else if (!isSupported) {
      console.log('❌ Service Worker not supported');
    }
  }, [isSupported, isRegistered]);

  return <>{children}</>;
}

/**
 * Offline indicator component
 */
export function OfflineIndicator() {
  const { isOffline } = useOfflineDetection();

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black px-4 py-2 text-center text-sm font-medium">
      <div className="flex items-center justify-center space-x-2">
        <span className="animate-pulse">📱</span>
        <span>You're offline - using cached data</span>
      </div>
    </div>
  );
}

/**
 * Cache management component for debugging
 */
export function CacheDebugPanel() {
  const {
    isRegistered,
    clearCache,
    getCacheStats,
    updateCache,
  } = useServiceWorker();

  const handleClearCache = async () => {
    if (await clearCache()) {
      toast.success('Cache cleared successfully');
      window.location.reload();
    } else {
      toast.error('Failed to clear cache');
    }
  };

  const handleGetStats = async () => {
    const stats = await getCacheStats();
    console.log('Cache stats:', stats);
    toast.success('Cache stats logged to console');
  };

  const handleUpdateCache = async () => {
    const urls = [
      '/',
      '/api/user',
      '/api/bricks',
      '/api/events',
    ];
    
    if (await updateCache(urls)) {
      toast.success('Cache updated successfully');
    } else {
      toast.error('Failed to update cache');
    }
  };

  if (!isRegistered) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white border rounded-lg shadow-lg p-4 space-y-2 z-50">
      <h3 className="text-sm font-semibold">Cache Debug</h3>
      <div className="flex flex-col space-y-1">
        <button
          onClick={handleGetStats}
          className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
        >
          Get Stats
        </button>
        <button
          onClick={handleUpdateCache}
          className="px-2 py-1 bg-green-500 text-white rounded text-xs"
        >
          Update Cache
        </button>
        <button
          onClick={handleClearCache}
          className="px-2 py-1 bg-red-500 text-white rounded text-xs"
        >
          Clear Cache
        </button>
      </div>
    </div>
  );
}

export default ServiceWorkerProvider;
