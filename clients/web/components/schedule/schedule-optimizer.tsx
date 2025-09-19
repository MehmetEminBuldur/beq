/**
 * Schedule Optimizer Component
 *
 * Provides a user interface for schedule generation and optimization
 */

'use client';

import React, { useState } from 'react';
import { useSchedule } from '@/lib/hooks/use-schedule';
import { useAuthContext } from '@/lib/providers/auth-provider';
import { useFeatureFlags } from '@/lib/hooks/use-feature-flags';
import {
  ScheduleGenerateRequest,
  ScheduleOptimizeRequest,
  ScheduledEvent,
} from '@/lib/types/schedule';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Zap, RefreshCw } from 'lucide-react';

interface ScheduleOptimizerProps {
  onScheduleGenerated?: (events: ScheduledEvent[]) => void;
  onOptimizationComplete?: (events: ScheduledEvent[]) => void;
}

export function ScheduleOptimizer({
  onScheduleGenerated,
  onOptimizationComplete,
}: ScheduleOptimizerProps) {
  const { user } = useAuthContext();
  const { isEnabled } = useFeatureFlags();
  const {
    schedule,
    isLoading,
    error,
    generateSchedule,
    optimizeSchedule,
    refreshSchedule,
  } = useSchedule(user?.id);

  const isScheduleOptimizationEnabled = isEnabled('schedule_optimization');

  const [isGenerating, setIsGenerating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleGenerateSchedule = async () => {
    if (!user?.id) return;

    setIsGenerating(true);
    try {
      // Create a sample schedule request for demonstration
      const request: ScheduleGenerateRequest = {
        user_id: user.id,
        tasks: [
          {
            id: 'sample-task-1',
            title: 'Complete project review',
            description: 'Review and finalize the quarterly project documentation',
            category: 'work',
            priority: 'high',
            estimated_duration_minutes: 90,
            preferred_time: 'morning',
            dependencies: [],
          },
          {
            id: 'sample-task-2',
            title: 'Team meeting preparation',
            description: 'Prepare agenda and materials for weekly team meeting',
            category: 'work',
            priority: 'medium',
            estimated_duration_minutes: 45,
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
          energy_peak_hours: ['09:00-11:00', '14:00-16:00'],
          avoid_scheduling_after: '18:00',
        },
        constraints: [],
        planning_horizon_days: 7,
      };

      const response = await generateSchedule(request);

      if (response.success && response.scheduled_events.length > 0) {
        onScheduleGenerated?.(response.scheduled_events);
      }
    } catch (err) {
      console.error('Failed to generate schedule:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptimizeSchedule = async () => {
    if (!user?.id) return;

    setIsOptimizing(true);
    try {
      const request: ScheduleOptimizeRequest = {
        user_id: user.id,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await optimizeSchedule(request);

      if (response.success && response.optimized_schedule.length > 0) {
        onOptimizationComplete?.(response.optimized_schedule);
      }
    } catch (err) {
      console.error('Failed to optimize schedule:', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Please log in to use schedule optimization.</p>
        </CardContent>
      </Card>
    );
  }

  if (!isScheduleOptimizationEnabled) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Feature Not Available</h3>
            <p className="text-muted-foreground">
              Schedule optimization is currently disabled for your account.
              This feature may be in development or limited to specific users.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Optimization
          </CardTitle>
          <CardDescription>
            Generate and optimize your daily schedule using AI-powered algorithms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={handleGenerateSchedule}
              disabled={isGenerating || isLoading}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4" />
              )}
              Generate Schedule
            </Button>

            <Button
              onClick={handleOptimizeSchedule}
              disabled={isOptimizing || isLoading || !schedule}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isOptimizing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Optimize Schedule
            </Button>

            <Button
              onClick={refreshSchedule}
              disabled={isLoading}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Display */}
      {schedule && (
        <Card>
          <CardHeader>
            <CardTitle>Your Schedule</CardTitle>
            <CardDescription>
              {schedule.events.length} scheduled events
              {schedule.last_updated && (
                <span className="text-xs text-muted-foreground ml-2">
                  • Updated {new Date(schedule.last_updated).toLocaleString()}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {schedule.events.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No scheduled events yet. Generate a schedule to get started.
              </p>
            ) : (
              <div className="space-y-3">
                {schedule.events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{event.title}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {event.priority || 'medium'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {event.category || 'task'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(event.start_time)} • {formatTime(event.start_time)} - {formatTime(event.end_time)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading schedule...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
