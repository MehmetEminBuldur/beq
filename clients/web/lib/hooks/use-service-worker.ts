'use client';

import { useState, useEffect } from 'react';

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
      const reg = await navigator.serviceWorker.register(swUrl);
      setRegistration(reg);
      setIsRegistered(true);
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