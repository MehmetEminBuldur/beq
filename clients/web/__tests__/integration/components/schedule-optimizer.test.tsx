/**
 * Integration tests for ScheduleOptimizer component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { ScheduleOptimizer } from '@/components/schedule/schedule-optimizer';
import { Providers } from '@/components/providers/providers';
import { useAuthContext } from '@/lib/providers/auth-provider';
import { useSchedule } from '@/lib/hooks/use-schedule';
import {
  ScheduleGenerateResponse,
  ScheduleOptimizeResponse,
  ScheduledEvent,
} from '@/lib/types/schedule';

// Mock the hooks and providers
jest.mock('@/lib/providers/auth-provider', () => ({
  useAuthContext: jest.fn(),
}));

jest.mock('@/lib/hooks/use-schedule', () => ({
  useSchedule: jest.fn(),
}));

// Mock next/dynamic to avoid issues with dynamic imports in tests
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: jest.fn(() => ({ __esModule: true, default: jest.fn(() => <div>Mocked Component</div>) })),
}));

const mockUseAuthContext = useAuthContext as jest.MockedFunction<typeof useAuthContext>;
const mockUseSchedule = useSchedule as jest.MockedFunction<typeof useSchedule>;

const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
};

const mockSchedule = {
  user_id: mockUser.id,
  events: [
    {
      id: 'event-1',
      title: 'Test Meeting',
      start_time: '2024-01-15T10:00:00Z',
      end_time: '2024-01-15T11:00:00Z',
      type: 'meeting',
      priority: 'medium',
    },
  ] as ScheduledEvent[],
  last_updated: '2024-01-15T09:00:00Z',
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(<Providers>{component}</Providers>);
};

describe('ScheduleOptimizer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockUseAuthContext.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      session: {},
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updateProfile: jest.fn(),
    });

    mockUseSchedule.mockReturnValue({
      schedule: null,
      isLoading: false,
      error: null,
      generateSchedule: jest.fn(),
      optimizeSchedule: jest.fn(),
      getUserSchedule: jest.fn(),
      refreshSchedule: jest.fn(),
    });
  });

  describe('Authentication State', () => {
    it('should show login prompt when user is not authenticated', () => {
      mockUseAuthContext.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        session: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        updateProfile: jest.fn(),
      });

      renderWithProviders(<ScheduleOptimizer />);

      expect(screen.getByText(/Please log in to use schedule optimization/i)).toBeInTheDocument();
    });

    it('should render controls when user is authenticated', () => {
      renderWithProviders(<ScheduleOptimizer />);

      expect(screen.getByText('AI-Powered Schedule Optimization')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Generate Schedule/i })).toBeInTheDocument();
    });
  });

  describe('Schedule Generation', () => {
    it('should call generateSchedule when Generate Schedule button is clicked', async () => {
      const mockGenerateSchedule = jest.fn().mockResolvedValue({
        success: true,
        scheduled_events: mockSchedule.events,
        reasoning: 'Generated optimal schedule',
        confidence_score: 0.85,
        alternative_suggestions: [],
        warnings: [],
        unscheduled_tasks: [],
        processing_time_seconds: 1.2,
      } as ScheduleGenerateResponse);

      mockUseSchedule.mockReturnValue({
        schedule: null,
        isLoading: false,
        error: null,
        generateSchedule: mockGenerateSchedule,
        optimizeSchedule: jest.fn(),
        getUserSchedule: jest.fn(),
        refreshSchedule: jest.fn(),
      });

      renderWithProviders(<ScheduleOptimizer />);

      const generateButton = screen.getByRole('button', { name: /Generate Schedule/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(mockGenerateSchedule).toHaveBeenCalledTimes(1);
      });

      // Check that the function was called with expected structure
      const callArgs = mockGenerateSchedule.mock.calls[0][0];
      expect(callArgs.user_id).toBe(mockUser.id);
      expect(callArgs.tasks).toBeDefined();
      expect(callArgs.user_preferences).toBeDefined();
      expect(callArgs.planning_horizon_days).toBe(7);
    });

    it('should show loading state during schedule generation', async () => {
      let resolveGenerate: (value: ScheduleGenerateResponse) => void;
      const generatePromise = new Promise<ScheduleGenerateResponse>((resolve) => {
        resolveGenerate = resolve;
      });

      const mockGenerateSchedule = jest.fn().mockReturnValue(generatePromise);

      mockUseSchedule.mockReturnValue({
        schedule: null,
        isLoading: true, // Initially loading
        error: null,
        generateSchedule: mockGenerateSchedule,
        optimizeSchedule: jest.fn(),
        getUserSchedule: jest.fn(),
        refreshSchedule: jest.fn(),
      });

      const { rerender } = renderWithProviders(<ScheduleOptimizer />);

      // Initially should show loading
      expect(screen.getByText('Loading schedule...')).toBeInTheDocument();

      // Resolve the promise
      resolveGenerate!({
        success: true,
        scheduled_events: mockSchedule.events,
        reasoning: 'Generated optimal schedule',
        confidence_score: 0.85,
        alternative_suggestions: [],
        warnings: [],
        unscheduled_tasks: [],
        processing_time_seconds: 1.2,
      });

      // Update the hook to reflect completion
      mockUseSchedule.mockReturnValue({
        schedule: mockSchedule,
        isLoading: false,
        error: null,
        generateSchedule: mockGenerateSchedule,
        optimizeSchedule: jest.fn(),
        getUserSchedule: jest.fn(),
        refreshSchedule: jest.fn(),
      });

      rerender(<Providers><ScheduleOptimizer /></Providers>);

      await waitFor(() => {
        expect(screen.queryByText('Loading schedule...')).not.toBeInTheDocument();
      });
    });

    it('should display error message when generation fails', async () => {
      const mockGenerateSchedule = jest.fn().mockRejectedValue(new Error('Generation failed'));
      const mockOnError = jest.fn();

      mockUseSchedule.mockReturnValue({
        schedule: null,
        isLoading: false,
        error: 'Generation failed',
        generateSchedule: mockGenerateSchedule,
        optimizeSchedule: jest.fn(),
        getUserSchedule: jest.fn(),
        refreshSchedule: jest.fn(),
      });

      renderWithProviders(<ScheduleOptimizer />);

      // Trigger generation to set error
      const generateButton = screen.getByRole('button', { name: /Generate Schedule/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Generation failed')).toBeInTheDocument();
      });
    });
  });

  describe('Schedule Optimization', () => {
    beforeEach(() => {
      // Set up component with existing schedule
      mockUseSchedule.mockReturnValue({
        schedule: mockSchedule,
        isLoading: false,
        error: null,
        generateSchedule: jest.fn(),
        optimizeSchedule: jest.fn(),
        getUserSchedule: jest.fn(),
        refreshSchedule: jest.fn(),
      });
    });

    it('should enable Optimize Schedule button when schedule exists', () => {
      renderWithProviders(<ScheduleOptimizer />);

      const optimizeButton = screen.getByRole('button', { name: /Optimize Schedule/i });
      expect(optimizeButton).not.toBeDisabled();
    });

    it('should call optimizeSchedule when Optimize Schedule button is clicked', async () => {
      const mockOptimizeSchedule = jest.fn().mockResolvedValue({
        success: true,
        optimized_schedule: [
          {
            ...mockSchedule.events[0],
            title: 'Optimized Meeting',
          },
        ],
        improvements: ['Reduced overlap by 30 minutes'],
        confidence_score: 0.91,
        processing_time_seconds: 0.8,
      } as ScheduleOptimizeResponse);

      mockUseSchedule.mockReturnValue({
        schedule: mockSchedule,
        isLoading: false,
        error: null,
        generateSchedule: jest.fn(),
        optimizeSchedule: mockOptimizeSchedule,
        getUserSchedule: jest.fn(),
        refreshSchedule: jest.fn(),
      });

      renderWithProviders(<ScheduleOptimizer />);

      const optimizeButton = screen.getByRole('button', { name: /Optimize Schedule/i });
      fireEvent.click(optimizeButton);

      await waitFor(() => {
        expect(mockOptimizeSchedule).toHaveBeenCalledTimes(1);
      });

      const callArgs = mockOptimizeSchedule.mock.calls[0][0];
      expect(callArgs.user_id).toBe(mockUser.id);
      expect(callArgs.start_date).toBeDefined();
      expect(callArgs.end_date).toBeDefined();
    });

    it('should disable Optimize Schedule button when no schedule exists', () => {
      mockUseSchedule.mockReturnValue({
        schedule: null,
        isLoading: false,
        error: null,
        generateSchedule: jest.fn(),
        optimizeSchedule: jest.fn(),
        getUserSchedule: jest.fn(),
        refreshSchedule: jest.fn(),
      });

      renderWithProviders(<ScheduleOptimizer />);

      const optimizeButton = screen.getByRole('button', { name: /Optimize Schedule/i });
      expect(optimizeButton).toBeDisabled();
    });
  });

  describe('Schedule Display', () => {
    it('should display schedule when available', () => {
      renderWithProviders(<ScheduleOptimizer />);

      expect(screen.getByText('Your Schedule')).toBeInTheDocument();
      expect(screen.getByText('Test Meeting')).toBeInTheDocument();
      expect(screen.getByText('1 scheduled events')).toBeInTheDocument();
    });

    it('should show empty state when no schedule exists', () => {
      mockUseSchedule.mockReturnValue({
        schedule: null,
        isLoading: false,
        error: null,
        generateSchedule: jest.fn(),
        optimizeSchedule: jest.fn(),
        getUserSchedule: jest.fn(),
        refreshSchedule: jest.fn(),
      });

      renderWithProviders(<ScheduleOptimizer />);

      expect(screen.getByText(/No scheduled events yet/i)).toBeInTheDocument();
      expect(screen.getByText(/Generate a schedule to get started/i)).toBeInTheDocument();
    });

    it('should format event times correctly', () => {
      renderWithProviders(<ScheduleOptimizer />);

      // Check that date and time are displayed
      expect(screen.getByText(/Jan \d+, \d+ • \d+:\d+ [AP]M - \d+:\d+ [AP]M/)).toBeInTheDocument();
    });
  });

  describe('Event Callbacks', () => {
    it('should call onScheduleGenerated when schedule is generated', async () => {
      const mockOnScheduleGenerated = jest.fn();
      const mockGenerateSchedule = jest.fn().mockResolvedValue({
        success: true,
        scheduled_events: mockSchedule.events,
        reasoning: 'Generated optimal schedule',
        confidence_score: 0.85,
        alternative_suggestions: [],
        warnings: [],
        unscheduled_tasks: [],
        processing_time_seconds: 1.2,
      });

      mockUseSchedule.mockReturnValue({
        schedule: null,
        isLoading: false,
        error: null,
        generateSchedule: mockGenerateSchedule,
        optimizeSchedule: jest.fn(),
        getUserSchedule: jest.fn(),
        refreshSchedule: jest.fn(),
      });

      renderWithProviders(
        <ScheduleOptimizer onScheduleGenerated={mockOnScheduleGenerated} />
      );

      const generateButton = screen.getByRole('button', { name: /Generate Schedule/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(mockOnScheduleGenerated).toHaveBeenCalledWith(mockSchedule.events);
      });
    });

    it('should call onOptimizationComplete when schedule is optimized', async () => {
      const mockOnOptimizationComplete = jest.fn();
      const optimizedEvents = [{ ...mockSchedule.events[0], title: 'Optimized Meeting' }];
      const mockOptimizeSchedule = jest.fn().mockResolvedValue({
        success: true,
        optimized_schedule: optimizedEvents,
        improvements: ['Reduced overlap'],
        confidence_score: 0.91,
        processing_time_seconds: 0.8,
      });

      mockUseSchedule.mockReturnValue({
        schedule: mockSchedule,
        isLoading: false,
        error: null,
        generateSchedule: jest.fn(),
        optimizeSchedule: mockOptimizeSchedule,
        getUserSchedule: jest.fn(),
        refreshSchedule: jest.fn(),
      });

      renderWithProviders(
        <ScheduleOptimizer onOptimizationComplete={mockOnOptimizationComplete} />
      );

      const optimizeButton = screen.getByRole('button', { name: /Optimize Schedule/i });
      fireEvent.click(optimizeButton);

      await waitFor(() => {
        expect(mockOnOptimizationComplete).toHaveBeenCalledWith(optimizedEvents);
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('should call refreshSchedule when Refresh button is clicked', async () => {
      const mockRefreshSchedule = jest.fn().mockResolvedValue(undefined);

      mockUseSchedule.mockReturnValue({
        schedule: mockSchedule,
        isLoading: false,
        error: null,
        generateSchedule: jest.fn(),
        optimizeSchedule: jest.fn(),
        getUserSchedule: jest.fn(),
        refreshSchedule: mockRefreshSchedule,
      });

      renderWithProviders(<ScheduleOptimizer />);

      const refreshButton = screen.getByRole('button', { name: /Refresh/i });
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockRefreshSchedule).toHaveBeenCalledTimes(1);
      });
    });
  });
});
