/**
 * Calendar Integration Hook
 *
 * Provides a unified interface for calendar operations through the orchestrator service,
 * including event management, conflict detection, and synchronization.
 */

import { useState, useCallback } from 'react';
import { useAuthContext } from '@/lib/providers/auth-provider';

export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  attendees?: string[];
  is_all_day?: boolean;
  recurrence?: string;
  status?: string;
  visibility?: string;
}

export interface Conflict {
  id: string;
  type: string;
  severity: string;
  description: string;
  events: Array<{
    id: string;
    title: string;
    start_time: string;
    end_time: string;
  }>;
  suggested_resolution: string;
  resolution_options: string[];
  metadata: Record<string, any>;
}

export interface SyncResult {
  success: boolean;
  events_synced: number;
  conflicts_detected: number;
  conflicts_resolved: number;
  conflicts_unresolved: number;
  conflict_details: Record<string, any>;
  detected_conflicts: Conflict[];
  errors: string[];
  sync_duration_seconds: number;
}

export interface AuthStatus {
  authenticated: boolean;
  provider: string;
  email?: string;
  scopes?: string[];
}

export function useCalendar() {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const makeRequest = useCallback(async (
    endpoint: string,
    options: RequestInit = {}
  ) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const url = `${process.env.NEXT_PUBLIC_ORCHESTRATOR_API_URL}/api/v1/calendar-integration/calendar/${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `Request failed: ${response.status}`);
    }

    return response.json();
  }, [user?.id]);

  const getAuthStatus = useCallback(async (): Promise<AuthStatus> => {
    try {
      setLoading(true);
      setError(null);
      return await makeRequest(`auth/status/${user?.id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get auth status';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest, user?.id]);

  const syncCalendar = useCallback(async (
    calendarId: string = 'primary',
    startDate?: Date,
    endDate?: Date,
    conflictResolution?: string
  ): Promise<SyncResult> => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        calendar_id: calendarId,
        ...(startDate && { start_date: startDate.toISOString() }),
        ...(endDate && { end_date: endDate.toISOString() }),
        ...(conflictResolution && { conflict_resolution: conflictResolution }),
      });

      return await makeRequest(`sync/${user?.id}?${params}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync calendar';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest, user?.id]);

  const getCalendarEvents = useCallback(async (
    calendarId: string = 'primary',
    startDate?: Date,
    endDate?: Date,
    maxResults: number = 250
  ): Promise<CalendarEvent[]> => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        calendar_id: calendarId,
        max_results: maxResults.toString(),
        ...(startDate && { start_date: startDate.toISOString() }),
        ...(endDate && { end_date: endDate.toISOString() }),
      });

      const response = await makeRequest(`events/${user?.id}?${params}`);
      return response.events || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get calendar events';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest, user?.id]);

  const getConflicts = useCallback(async (
    calendarId: string = 'primary',
    startDate?: Date,
    endDate?: Date
  ): Promise<{ conflicts: Conflict[]; total: number }> => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        calendar_id: calendarId,
        ...(startDate && { start_date: startDate.toISOString() }),
        ...(endDate && { end_date: endDate.toISOString() }),
      });

      return await makeRequest(`conflicts/${user?.id}?${params}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get conflicts';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest, user?.id]);

  const resolveConflicts = useCallback(async (
    conflictResolutions: Array<{
      conflict_id: string;
      strategy: string;
      user_decision?: Record<string, any>;
    }>
  ): Promise<{ success: boolean; resolutions: any[]; total_resolved: number }> => {
    try {
      setLoading(true);
      setError(null);

      return await makeRequest(`conflicts/${user?.id}/resolve`, {
        method: 'POST',
        body: JSON.stringify(conflictResolutions),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve conflicts';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest, user?.id]);

  const createEvent = useCallback(async (
    event: CalendarEvent,
    calendarId: string = 'primary'
  ): Promise<CalendarEvent> => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        calendar_id: calendarId,
      });

      return await makeRequest(`events/${user?.id}?${params}`, {
        method: 'POST',
        body: JSON.stringify(event),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create event';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest, user?.id]);

  const updateEvent = useCallback(async (
    eventId: string,
    event: Partial<CalendarEvent>,
    calendarId: string = 'primary'
  ): Promise<CalendarEvent> => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        calendar_id: calendarId,
      });

      return await makeRequest(`events/${user?.id}/${eventId}?${params}`, {
        method: 'PUT',
        body: JSON.stringify(event),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update event';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest, user?.id]);

  const deleteEvent = useCallback(async (
    eventId: string,
    calendarId: string = 'primary'
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        calendar_id: calendarId,
      });

      await makeRequest(`events/${user?.id}/${eventId}?${params}`, {
        method: 'DELETE',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete event';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest, user?.id]);

  const listCalendars = useCallback(async (): Promise<any[]> => {
    try {
      setLoading(true);
      setError(null);

      return await makeRequest(`calendars/${user?.id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to list calendars';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest, user?.id]);

  return {
    // State
    loading,
    error,

    // Methods
    getAuthStatus,
    syncCalendar,
    getCalendarEvents,
    getConflicts,
    resolveConflicts,
    createEvent,
    updateEvent,
    deleteEvent,
    listCalendars,

    // Utilities
    clearError: () => setError(null),
  };
}
