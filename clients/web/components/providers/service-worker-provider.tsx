'use client';

import { useEffect, useRef } from 'react';
import { useServiceWorker, useOfflineDetection } from '@/lib/hooks/use-service-worker';
import { toast } from 'react-hot-toast';

interface ServiceWorkerProviderProps {
  children: React.ReactNode;
}

export function ServiceWorkerProvider({ children }: ServiceWorkerProviderProps) {
  const { register, isSupported, isRegistered } = useServiceWorker();
  const { isOnline, isOffline } = useOfflineDetection();
  const hasInitialized = useRef(false);
  const wasOffline = useRef(false);

  // Register service worker on mount
  useEffect(() => {
    if (isSupported && !isRegistered && typeof window !== 'undefined') {
      register('/sw.js').then(() => {
        console.log('Service worker registered successfully');
      }).catch((error) => {
        console.error('Service worker registration failed:', error);
      });
    }
  }, [isSupported, isRegistered, register]);

  // Handle online/offline status with proper initialization tracking
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!hasInitialized.current) {
      // First time - just track the initial state without showing toast
      hasInitialized.current = true;
      wasOffline.current = isOffline;
      return;
    }

    // Only show toasts for actual state changes
    if (isOffline && !wasOffline.current) {
      // Went offline
      toast('You are offline. Using cached data.', {
        icon: '📱',
        duration: 3000,
      });
      wasOffline.current = true;
    } else if (isOnline && wasOffline.current) {
      // Came back online
      toast.success('You are back online!', {
        duration: 2000,
      });
      wasOffline.current = false;
    }
  }, [isOnline, isOffline]);

  return (
    <>
      <OfflineIndicator isOffline={isOffline} />
      {children}
    </>
  );
}

interface OfflineIndicatorProps {
  isOffline: boolean;
}

export function OfflineIndicator({ isOffline }: OfflineIndicatorProps) {
  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white px-4 py-2 text-center text-sm">
      You are currently offline. Some features may be limited.
    </div>
  );
}