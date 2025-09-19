/**
 * React hook for checking feature flag status
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/lib/providers/auth-provider';

export interface FeatureFlags {
  schedule_optimization: boolean;
  ai_chat: boolean;
  calendar_sync: boolean;
  brick_management: boolean;
  advanced_analytics: boolean;
}

export interface FeatureStatus {
  enabled: boolean;
  user_specific: boolean;
  description: string;
}

export interface FeatureFlagsResponse {
  features: Record<string, FeatureStatus>;
  user_id?: string;
}

export interface UseFeatureFlagsReturn {
  flags: FeatureFlags | null;
  isLoading: boolean;
  error: string | null;
  refreshFlags: () => Promise<void>;
  isEnabled: (feature: keyof FeatureFlags) => boolean;
}

/**
 * Hook for checking feature flag availability
 */
export function useFeatureFlags(): UseFeatureFlagsReturn {
  const { user } = useAuthContext();
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeatureFlags = useCallback(async () => {
    if (!user?.id) {
      setFlags(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ORCHESTRATOR_API_URL}/api/v1/features/status?user_id=${user.id}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch feature flags: ${response.status}`);
      }

      const data: FeatureFlagsResponse = await response.json();

      // Convert to typed FeatureFlags
      const typedFlags: FeatureFlags = {
        schedule_optimization: data.features.schedule_optimization?.enabled ?? false,
        ai_chat: data.features.ai_chat?.enabled ?? false,
        calendar_sync: data.features.calendar_sync?.enabled ?? false,
        brick_management: data.features.brick_management?.enabled ?? false,
        advanced_analytics: data.features.advanced_analytics?.enabled ?? false,
      };

      setFlags(typedFlags);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load feature flags';
      setError(errorMessage);
      console.error('Feature flags fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const refreshFlags = useCallback(async () => {
    await fetchFeatureFlags();
  }, [fetchFeatureFlags]);

  const isEnabled = useCallback((feature: keyof FeatureFlags): boolean => {
    return flags?.[feature] ?? false;
  }, [flags]);

  // Auto-fetch flags when user changes
  useEffect(() => {
    fetchFeatureFlags();
  }, [fetchFeatureFlags]);

  return {
    flags,
    isLoading,
    error,
    refreshFlags,
    isEnabled,
  };
}

/**
 * Hook for checking a specific feature flag
 */
export function useFeatureFlag(feature: keyof FeatureFlags): boolean {
  const { isEnabled } = useFeatureFlags();
  return isEnabled(feature);
}
