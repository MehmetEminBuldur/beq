/**
 * Unit tests for schedule API client functions
 */

import { jest } from '@jest/globals';
import {
  generateSchedule,
  optimizeSchedule,
  getUserSchedule,
  createSampleScheduleRequest,
  createSampleOptimizationRequest,
} from '@/lib/api/schedule';
import {
  ScheduleGenerateRequest,
  ScheduleOptimizeRequest,
} from '@/lib/types/schedule';

// Mock fetch globally
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('Schedule API Client', () => {
  const mockApiUrl = 'http://localhost:8000';

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment
    process.env.NEXT_PUBLIC_ORCHESTRATOR_API_URL = mockApiUrl;
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_ORCHESTRATOR_API_URL;
  });

  describe('generateSchedule', () => {
    const mockRequest: ScheduleGenerateRequest = {
      user_id: 'user-123',
      tasks: [
        {
          id: 'task-1',
          title: 'Test Task',
          category: 'work',
          priority: 'medium',
          estimated_duration_minutes: 60,
          dependencies: [],
        },
      ],
      existing_events: [],
      user_preferences: {
        timezone: 'UTC',
        work_start_time: '09:00',
        work_end_time: '17:00',
        break_frequency_minutes: 90,
        break_duration_minutes: 15,
        lunch_time: '12:00',
        lunch_duration_minutes: 60,
        preferred_task_duration_minutes: 90,
        energy_peak_hours: ['09:00-11:00'],
        avoid_scheduling_after: '18:00',
      },
      constraints: [],
      planning_horizon_days: 7,
    };

    const mockResponse = {
      success: true,
      scheduled_events: [
        {
          id: 'task-1',
          title: 'Test Task',
          start_time: '2024-01-15T10:00:00Z',
          end_time: '2024-01-15T11:00:00Z',
          type: 'task',
          priority: 'medium',
        },
      ],
      reasoning: 'Scheduled during peak hours',
      confidence_score: 0.85,
      alternative_suggestions: [],
      warnings: [],
      unscheduled_tasks: [],
      processing_time_seconds: 1.2,
    };

    it('should successfully generate a schedule', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      } as any);

      const result = await generateSchedule(mockRequest);

      expect(mockFetch).toHaveBeenCalledWith(`${mockApiUrl}/api/v1/schedule/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockRequest),
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const errorResponse = {
        detail: 'Invalid request data',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue(errorResponse),
      } as any);

      await expect(generateSchedule(mockRequest)).rejects.toThrow('Invalid request data');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(generateSchedule(mockRequest)).rejects.toThrow('Network error');
    });
  });

  describe('optimizeSchedule', () => {
    const mockRequest: ScheduleOptimizeRequest = {
      user_id: 'user-123',
      start_date: '2024-01-15T00:00:00Z',
      end_date: '2024-01-22T00:00:00Z',
      brick_ids: ['brick-1'],
    };

    const mockResponse = {
      success: true,
      optimized_schedule: [
        {
          id: 'task-1',
          title: 'Optimized Task',
          start_time: '2024-01-15T14:00:00Z',
          end_time: '2024-01-15T15:30:00Z',
          type: 'task',
        },
      ],
      improvements: ['Reduced overlap by 30 minutes'],
      confidence_score: 0.92,
      processing_time_seconds: 0.8,
    };

    it('should successfully optimize a schedule', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      } as any);

      const result = await optimizeSchedule(mockRequest);

      expect(mockFetch).toHaveBeenCalledWith(`${mockApiUrl}/api/v1/schedule/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockRequest),
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle optimization errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({ detail: 'Optimization failed' }),
      } as any);

      await expect(optimizeSchedule(mockRequest)).rejects.toThrow('Optimization failed');
    });
  });

  describe('getUserSchedule', () => {
    const mockUserId = 'user-123';
    const mockResponse = {
      events: [
        {
          id: 'event-1',
          title: 'Meeting',
          start_time: '2024-01-15T10:00:00Z',
          end_time: '2024-01-15T11:00:00Z',
          type: 'meeting',
        },
      ],
      last_updated: '2024-01-15T09:00:00Z',
    };

    it('should fetch user schedule without date filters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      } as any);

      const result = await getUserSchedule(mockUserId);

      expect(mockFetch).toHaveBeenCalledWith(`${mockApiUrl}/api/v1/schedule/${mockUserId}`, {
        method: 'GET',
      });

      expect(result).toEqual({
        user_id: mockUserId,
        ...mockResponse,
      });
    });

    it('should fetch user schedule with date filters', async () => {
      const startDate = '2024-01-15T00:00:00Z';
      const endDate = '2024-01-22T00:00:00Z';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      } as any);

      const result = await getUserSchedule(mockUserId, startDate, endDate);

      expect(mockFetch).toHaveBeenCalledWith(
        `${mockApiUrl}/api/v1/schedule/${mockUserId}?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`,
        { method: 'GET' }
      );

      expect(result).toEqual({
        user_id: mockUserId,
        ...mockResponse,
      });
    });

    it('should handle schedule fetch errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({ detail: 'User not found' }),
      } as any);

      await expect(getUserSchedule(mockUserId)).rejects.toThrow('User not found');
    });
  });

  describe('createSampleScheduleRequest', () => {
    it('should create a valid sample schedule request', () => {
      const userId = 'test-user';
      const request = createSampleScheduleRequest(userId);

      expect(request.user_id).toBe(userId);
      expect(request.tasks).toHaveLength(2);
      expect(request.existing_events).toHaveLength(1);
      expect(request.constraints).toHaveLength(1);
      expect(request.planning_horizon_days).toBe(7);

      // Validate task structure
      expect(request.tasks[0]).toHaveProperty('id');
      expect(request.tasks[0]).toHaveProperty('title');
      expect(request.tasks[0]).toHaveProperty('estimated_duration_minutes');

      // Validate user preferences
      expect(request.user_preferences).toHaveProperty('timezone');
      expect(request.user_preferences).toHaveProperty('work_start_time');
      expect(request.user_preferences).toHaveProperty('energy_peak_hours');
    });
  });

  describe('createSampleOptimizationRequest', () => {
    it('should create a valid sample optimization request', () => {
      const userId = 'test-user';
      const request = createSampleOptimizationRequest(userId);

      expect(request.user_id).toBe(userId);
      expect(request).toHaveProperty('start_date');
      expect(request).toHaveProperty('end_date');
      expect(request.brick_ids).toEqual(['brick-1', 'brick-2']);

      // Validate dates are valid ISO strings
      expect(() => new Date(request.start_date)).not.toThrow();
      expect(() => new Date(request.end_date)).not.toThrow();
    });
  });
});
