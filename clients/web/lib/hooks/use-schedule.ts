/**
 * React hook for managing schedule state and API interactions
 */

import { useState, useCallback, useEffect } from 'react';
import {
  ScheduleGenerateRequest,
  ScheduleGenerateResponse,
  ScheduleOptimizeRequest,
  ScheduleOptimizeResponse,
  UserSchedule,
  UseScheduleReturn,
} from '../types/schedule';
import {
  generateSchedule as apiGenerateSchedule,
  optimizeSchedule as apiOptimizeSchedule,
  getUserSchedule as apiGetUserSchedule,
} from '../api/schedule';

export function useSchedule(userId?: string): UseScheduleReturn {
  const [schedule, setSchedule] = useState<UserSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset error when userId changes
  useEffect(() => {
    setError(null);
  }, [userId]);

  const generateSchedule = useCallback(async (
    request: ScheduleGenerateRequest
  ): Promise<ScheduleGenerateResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiGenerateSchedule(request);

      if (response.success && response.scheduled_events.length > 0) {
        // Update local schedule state
        setSchedule({
          user_id: request.user_id,
          events: response.scheduled_events,
          last_updated: new Date().toISOString(),
        });
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate schedule';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const optimizeSchedule = useCallback(async (
    request: ScheduleOptimizeRequest
  ): Promise<ScheduleOptimizeResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiOptimizeSchedule(request);

      if (response.success && response.optimized_schedule.length > 0) {
        // Update local schedule state
        setSchedule({
          user_id: request.user_id,
          events: response.optimized_schedule,
          last_updated: new Date().toISOString(),
        });
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to optimize schedule';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getUserSchedule = useCallback(async (
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<UserSchedule> => {
    setIsLoading(true);
    setError(null);

    try {
      const userSchedule = await apiGetUserSchedule(userId, startDate, endDate);
      setSchedule(userSchedule);
      return userSchedule;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get user schedule';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshSchedule = useCallback(async (): Promise<void> => {
    if (!schedule?.user_id) {
      return;
    }

    try {
      await getUserSchedule(schedule.user_id);
    } catch (err) {
      // Error is already handled in getUserSchedule
    }
  }, [schedule?.user_id, getUserSchedule]);

  // Auto-load schedule if userId is provided
  useEffect(() => {
    if (userId && !schedule) {
      getUserSchedule(userId).catch(() => {
        // Silently fail on initial load
      });
    }
  }, [userId, schedule, getUserSchedule]);

  return {
    schedule,
    isLoading,
    error,
    generateSchedule,
    optimizeSchedule,
    getUserSchedule,
    refreshSchedule,
  };
}