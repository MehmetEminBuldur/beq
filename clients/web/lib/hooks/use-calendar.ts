/**
 * Calendar Integration Hook
 *
 * Provides a unified interface for calendar operations through the orchestrator service,
 * including event management, conflict detection, and synchronization.
 */

import { useState, useCallback } from 'react';
import { useAuthContext } from '@/lib/providers/auth-provider';
import { toast } from 'react-hot-toast';

declare global {
  interface Window {
    google?: any;
  }
}

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

export interface CalendarInfo {
  id: string;
  name: string;
  primary: boolean;
  access_role: string;
  background_color: string;
  foreground_color: string;
}

export interface GoogleCalendarSettings {
  syncEnabled: boolean;
  syncFrequency: 'manual' | 'hourly' | 'daily';
  conflictResolution: 'keep_existing' | 'replace_new' | 'user_decision';
  selectedCalendars: string[];
  lastSync: string | null;
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

    // For testing purposes, return mock data
    if (process.env.NODE_ENV === 'development' && endpoint.includes('test-user')) {
      return mockCalendarResponse(endpoint, options);
    }

    // Try calendar integration service first, fallback to orchestrator
    const calendarServiceUrl = process.env.NEXT_PUBLIC_CALENDAR_INTEGRATION_URL || 'http://localhost:8003';
    const orchestratorUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_API_URL || 'http://localhost:8000';

    let url = `${calendarServiceUrl}/api/v1/calendar/${endpoint}`;
    let response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    // If calendar service fails, try orchestrator service
    if (!response.ok) {
      url = `${orchestratorUrl}/api/v1/calendar/${endpoint}`;
      response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `Request failed: ${response.status}`);
    }

    return response.json();
  }, [user?.id]);

  // Mock data for testing
  const mockCalendarResponse = useCallback((endpoint: string, options: RequestInit = {}) => {
    if (endpoint.includes('events')) {
      return Promise.resolve({
        events: [
          {
            id: 'google_test_1',
            title: 'Team Standup',
            description: 'Daily team sync meeting',
            start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            end_time: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
            location: 'Conference Room A',
            attendees: ['team@example.com'],
            is_all_day: false,
            status: 'confirmed'
          },
          {
            id: 'google_test_2',
            title: 'Project Review',
            description: 'Weekly project review',
            start_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            end_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
            location: 'Virtual Meeting',
            attendees: ['manager@example.com', 'lead@example.com'],
            is_all_day: false,
            status: 'confirmed'
          }
        ]
      });
    }

    if (endpoint.includes('calendars')) {
      return Promise.resolve({
        calendars: [
          {
            id: 'primary',
            name: 'Primary Calendar',
            primary: true,
            access_role: 'owner',
            background_color: '#3788d8',
            foreground_color: '#ffffff'
          }
        ],
        total: 1
      });
    }

    if (endpoint.includes('conflicts')) {
      return Promise.resolve({
        conflicts: [],
        total: 0
      });
    }

    return Promise.resolve({ success: true });
  }, []);

  const getAuthStatus = useCallback(async (): Promise<AuthStatus> => {
    try {
      setLoading(true);
      setError(null);

      // For testing purposes, return mock authenticated status
      if (process.env.NODE_ENV === 'development') {
        return {
          authenticated: true,
          provider: 'google',
          email: 'test@example.com',
          scopes: ['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/calendar.events'],
        };
      }

      // Try calendar integration service first
      const calendarServiceUrl = process.env.NEXT_PUBLIC_CALENDAR_INTEGRATION_URL || 'http://localhost:8003';
      const response = await fetch(`${calendarServiceUrl}/api/v1/auth/google/status/${user?.id}`);

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        authenticated: data.authenticated,
        provider: data.provider,
        email: data.profile?.email,
        scopes: data.scopes,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get auth status';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

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

  const listCalendars = useCallback(async (): Promise<CalendarInfo[]> => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeRequest(`calendars/${user?.id}`);
      return response.calendars || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to list calendars';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest, user?.id]);

  const disconnectGoogleCalendar = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const calendarServiceUrl = process.env.NEXT_PUBLIC_CALENDAR_INTEGRATION_URL || 'http://localhost:8003';
      const response = await fetch(`${calendarServiceUrl}/api/v1/auth/google/disconnect/${user?.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to disconnect');
      }

      toast.success('Google Calendar disconnected successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect Google Calendar';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const connectGoogleCalendar = useCallback(async (): Promise<string> => {
    try {
      setLoading(true);
      setError(null);

      // For testing purposes, simulate OAuth flow
      if (process.env.NODE_ENV === 'development') {
        // Simulate OAuth success
        setTimeout(() => {
          toast.success('Google Calendar connected successfully! (Test mode)');
        }, 1000);
        return 'mock_oauth_url';
      }

      const calendarServiceUrl = process.env.NEXT_PUBLIC_CALENDAR_INTEGRATION_URL || 'http://localhost:8003';
      const response = await fetch(`${calendarServiceUrl}/api/v1/auth/google/login?user_id=${user?.id}`);

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();

      // Open the authorization URL in a popup window
      const authWindow = window.open(
        data.authorization_url,
        'google-calendar-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!authWindow) {
        throw new Error('Failed to open authorization window. Please allow popups for this site.');
      }

      toast.success('Google Calendar authorization opened. Please complete the authorization.');
      return data.authorization_url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate Google Calendar connection';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Advanced settings management
  const getCalendarSettings = useCallback(async (): Promise<GoogleCalendarSettings> => {
    try {
      setLoading(true);
      setError(null);

      // Try to get settings from localStorage first
      const stored = localStorage.getItem(`beq_calendar_settings_${user?.id}`);
      if (stored) {
        return JSON.parse(stored);
      }

      // Default settings
      const defaultSettings: GoogleCalendarSettings = {
        syncEnabled: true,
        syncFrequency: 'manual',
        conflictResolution: 'user_decision',
        selectedCalendars: ['primary'],
        lastSync: null,
      };

      return defaultSettings;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get calendar settings';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const updateCalendarSettings = useCallback(async (settings: Partial<GoogleCalendarSettings>): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Get current settings
      const currentSettings = await getCalendarSettings();

      // Merge with updates
      const updatedSettings = { ...currentSettings, ...settings };

      // Store in localStorage
      localStorage.setItem(`beq_calendar_settings_${user?.id}`, JSON.stringify(updatedSettings));

      toast.success('Calendar settings updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update calendar settings';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id, getCalendarSettings]);

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
    connectGoogleCalendar,
    disconnectGoogleCalendar,

    // Settings management
    getCalendarSettings,
    updateCalendarSettings,

    // Utilities
    clearError: () => setError(null),
  };
}
