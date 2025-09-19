/**
 * Unit tests for useSchedule hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { useSchedule } from '@/lib/hooks/use-schedule';
import {
  ScheduleGenerateRequest,
  ScheduleGenerateResponse,
  ScheduleOptimizeRequest,
  ScheduleOptimizeResponse,
  UserSchedule,
} from '@/lib/types/schedule';

// Mock the API functions
jest.mock('@/lib/api/schedule', () => ({
  generateSchedule: jest.fn(),
  optimizeSchedule: jest.fn(),
  getUserSchedule: jest.fn(),
}));

import {
  generateSchedule as mockGenerateSchedule,
  optimizeSchedule as mockOptimizeSchedule,
  getUserSchedule as mockGetUserSchedule,
} from '@/lib/api/schedule';

const mockedGenerateSchedule = mockGenerateSchedule as jest.MockedFunction<typeof mockGenerateSchedule>;
const mockedOptimizeSchedule = mockOptimizeSchedule as jest.MockedFunction<typeof mockOptimizeSchedule>;
const mockedGetUserSchedule = mockGetUserSchedule as jest.MockedFunction<typeof mockGetUserSchedule>;

describe('useSchedule Hook', () => {
  const mockUserId = 'user-123';
  const mockSchedule: UserSchedule = {
    user_id: mockUserId,
    events: [
      {
        id: 'event-1',
        title: 'Test Event',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        type: 'task',
        priority: 'medium',
      },
    ],
    last_updated: '2024-01-15T09:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useSchedule());

      expect(result.current.schedule).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.generateSchedule).toBe('function');
      expect(typeof result.current.optimizeSchedule).toBe('function');
      expect(typeof result.current.getUserSchedule).toBe('function');
      expect(typeof result.current.refreshSchedule).toBe('function');
    });

    it('should auto-load schedule when userId is provided', async () => {
      mockedGetUserSchedule.mockResolvedValueOnce(mockSchedule);

      const { result } = renderHook(() => useSchedule(mockUserId));

      await waitFor(() => {
        expect(mockedGetUserSchedule).toHaveBeenCalledWith(mockUserId, undefined, undefined);
        expect(result.current.schedule).toEqual(mockSchedule);
      });
    });
  });

  describe('generateSchedule', () => {
    const mockRequest: ScheduleGenerateRequest = {
      user_id: mockUserId,
      tasks: [],
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

    const mockResponse: ScheduleGenerateResponse = {
      success: true,
      scheduled_events: mockSchedule.events,
      reasoning: 'Generated optimal schedule',
      confidence_score: 0.85,
      alternative_suggestions: [],
      warnings: [],
      unscheduled_tasks: [],
      processing_time_seconds: 1.2,
    };

    it('should successfully generate a schedule', async () => {
      mockedGenerateSchedule.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useSchedule());

      let response: ScheduleGenerateResponse;
      await act(async () => {
        response = await result.current.generateSchedule(mockRequest);
      });

      expect(mockedGenerateSchedule).toHaveBeenCalledWith(mockRequest);
      expect(response!).toEqual(mockResponse);
      expect(result.current.schedule).toEqual({
        user_id: mockUserId,
        events: mockSchedule.events,
        last_updated: expect.any(String),
      });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle generation errors', async () => {
      const mockError = new Error('Generation failed');
      mockedGenerateSchedule.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useSchedule());

      await act(async () => {
        try {
          await result.current.generateSchedule(mockRequest);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Generation failed');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.schedule).toBeNull();
    });

    it('should set loading state during generation', async () => {
      let resolvePromise: (value: ScheduleGenerateResponse) => void;
      const promise = new Promise<ScheduleGenerateResponse>((resolve) => {
        resolvePromise = resolve;
      });

      mockedGenerateSchedule.mockReturnValueOnce(promise);

      const { result } = renderHook(() => useSchedule());

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.generateSchedule(mockRequest);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        resolvePromise!(mockResponse);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('optimizeSchedule', () => {
    const mockRequest: ScheduleOptimizeRequest = {
      user_id: mockUserId,
      start_date: '2024-01-15T00:00:00Z',
      end_date: '2024-01-22T00:00:00Z',
    };

    const mockResponse: ScheduleOptimizeResponse = {
      success: true,
      optimized_schedule: [
        {
          id: 'event-1',
          title: 'Optimized Event',
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
      mockedOptimizeSchedule.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useSchedule());

      let response: ScheduleOptimizeResponse;
      await act(async () => {
        response = await result.current.optimizeSchedule(mockRequest);
      });

      expect(mockedOptimizeSchedule).toHaveBeenCalledWith(mockRequest);
      expect(response!).toEqual(mockResponse);
      expect(result.current.schedule).toEqual({
        user_id: mockUserId,
        events: mockResponse.optimized_schedule,
        last_updated: expect.any(String),
      });
    });

    it('should handle optimization errors', async () => {
      const mockError = new Error('Optimization failed');
      mockedOptimizeSchedule.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useSchedule());

      await act(async () => {
        try {
          await result.current.optimizeSchedule(mockRequest);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Optimization failed');
    });
  });

  describe('getUserSchedule', () => {
    it('should fetch user schedule successfully', async () => {
      mockedGetUserSchedule.mockResolvedValueOnce(mockSchedule);

      const { result } = renderHook(() => useSchedule());

      let schedule: UserSchedule;
      await act(async () => {
        schedule = await result.current.getUserSchedule(mockUserId);
      });

      expect(mockedGetUserSchedule).toHaveBeenCalledWith(mockUserId, undefined, undefined);
      expect(schedule!).toEqual(mockSchedule);
      expect(result.current.schedule).toEqual(mockSchedule);
    });

    it('should fetch user schedule with date filters', async () => {
      const startDate = '2024-01-15T00:00:00Z';
      const endDate = '2024-01-22T00:00:00Z';

      mockedGetUserSchedule.mockResolvedValueOnce(mockSchedule);

      const { result } = renderHook(() => useSchedule());

      await act(async () => {
        await result.current.getUserSchedule(mockUserId, startDate, endDate);
      });

      expect(mockedGetUserSchedule).toHaveBeenCalledWith(mockUserId, startDate, endDate);
    });

    it('should handle fetch errors', async () => {
      const mockError = new Error('Fetch failed');
      mockedGetUserSchedule.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useSchedule());

      await act(async () => {
        try {
          await result.current.getUserSchedule(mockUserId);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Fetch failed');
    });
  });

  describe('refreshSchedule', () => {
    it('should refresh the current schedule', async () => {
      const { result } = renderHook(() => useSchedule());

      // Set initial schedule
      act(() => {
        result.current.schedule = mockSchedule;
      });

      mockedGetUserSchedule.mockResolvedValueOnce(mockSchedule);

      await act(async () => {
        await result.current.refreshSchedule();
      });

      expect(mockedGetUserSchedule).toHaveBeenCalledWith(mockUserId);
    });

    it('should not refresh if no schedule exists', async () => {
      const { result } = renderHook(() => useSchedule());

      await act(async () => {
        await result.current.refreshSchedule();
      });

      expect(mockedGetUserSchedule).not.toHaveBeenCalled();
    });
  });
});
