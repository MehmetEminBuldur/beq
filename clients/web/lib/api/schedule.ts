/**
 * Schedule API client for interacting with the BeQ Orchestrator schedule endpoints
 */

import {
  ScheduleGenerateRequest,
  ScheduleGenerateResponse,
  ScheduleOptimizeRequest,
  ScheduleOptimizeResponse,
  UserSchedule,
} from '../types/schedule';

const API_BASE_URL = process.env.NEXT_PUBLIC_ORCHESTRATOR_API_URL || 'http://localhost:8000';

/**
 * Generate a new optimized schedule
 */
export async function generateSchedule(
  request: ScheduleGenerateRequest
): Promise<ScheduleGenerateResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/schedule/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to generate schedule:', error);
    throw error;
  }
}

/**
 * Optimize an existing schedule
 */
export async function optimizeSchedule(
  request: ScheduleOptimizeRequest
): Promise<ScheduleOptimizeResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/schedule/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to optimize schedule:', error);
    throw error;
  }
}

/**
 * Get user's current schedule
 */
export async function getUserSchedule(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<UserSchedule> {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/api/v1/schedule/${userId}${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform the response to match our UserSchedule interface
    return {
      user_id: userId,
      events: data.events || [],
      last_updated: data.last_updated || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to get user schedule:', error);
    throw error;
  }
}

/**
 * Reschedule specific tasks
 */
export async function rescheduleTasks(
  userId: string,
  updates: Record<string, any>
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/schedule/${userId}/reschedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to reschedule tasks:', error);
    throw error;
  }
}

/**
 * Utility function to create a sample schedule request for testing
 */
export function createSampleScheduleRequest(userId: string): ScheduleGenerateRequest {
  return {
    user_id: userId,
    tasks: [
      {
        id: 'task-1',
        title: 'Complete project proposal',
        description: 'Write and review the Q1 project proposal document',
        category: 'work',
        priority: 'high',
        estimated_duration_minutes: 120,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        preferred_time: 'morning',
        dependencies: [],
      },
      {
        id: 'task-2',
        title: 'Review team performance',
        description: 'Analyze team metrics and prepare feedback',
        category: 'work',
        priority: 'medium',
        estimated_duration_minutes: 60,
        dependencies: ['task-1'],
      },
    ],
    existing_events: [
      {
        id: 'meeting-1',
        title: 'Team Standup',
        start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace('T', 'T').replace(/\.\d{3}Z$/, 'T09:00:00Z'), // Tomorrow 9 AM
        end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace('T', 'T').replace(/\.\d{3}Z$/, 'T09:30:00Z'), // Tomorrow 9:30 AM
        is_moveable: false,
      },
    ],
    user_preferences: {
      timezone: 'America/New_York',
      work_start_time: '09:00',
      work_end_time: '17:00',
      break_frequency_minutes: 90,
      break_duration_minutes: 15,
      lunch_time: '12:00',
      lunch_duration_minutes: 60,
      preferred_task_duration_minutes: 90,
      energy_peak_hours: ['09:00-11:00', '14:00-16:00'],
      avoid_scheduling_after: '18:00',
    },
    constraints: [
      {
        type: 'focus_time',
        start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace('T', 'T').replace(/\.\d{3}Z$/, 'T10:00:00Z'), // Tomorrow 10 AM
        end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace('T', 'T').replace(/\.\d{3}Z$/, 'T12:00:00Z'), // Tomorrow 12 PM
        description: 'Deep work block for important project',
        is_hard_constraint: true,
      },
    ],
    planning_horizon_days: 7,
  };
}

/**
 * Utility function to create a sample optimization request for testing
 */
export function createSampleOptimizationRequest(userId: string): ScheduleOptimizeRequest {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return {
    user_id: userId,
    start_date: tomorrow.toISOString(),
    end_date: nextWeek.toISOString(),
    brick_ids: ['brick-1', 'brick-2'],
  };
}