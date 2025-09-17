'use client';

import { useEffect } from 'react';
import { useOfflineDetection } from '@/lib/hooks/use-service-worker';
import { toast } from 'react-hot-toast';

interface ServiceWorkerProviderProps {
  children: React.ReactNode;
}

export function ServiceWorkerProvider({ children }: ServiceWorkerProviderProps) {
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

  return <>{children}</>;
}

export function OfflineIndicator() {
  const { isOffline } = useOfflineDetection();

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white px-4 py-2 text-center text-sm">
      You are currently offline. Some features may be limited.
    </div>
  );
}