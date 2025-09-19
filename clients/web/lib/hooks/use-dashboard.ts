/**
 * Dashboard Hook
 *
 * Provides dashboard statistics and dynamic data from Supabase
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/lib/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';

export interface DashboardStats {
  activeBricks: number;
  completedToday: number;
  focusTime: number; // in hours
  aiConversations: number;
  pendingBricks: number;
  totalBricks: number;
  completedThisWeek: number;
  averageSessionTime: number; // in minutes
}

export interface TodayScheduleItem {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: 'completed' | 'in_progress' | 'upcoming';
  type: 'brick' | 'quanta' | 'event' | 'meeting';
}

export interface AIInsight {
  id: string;
  type: 'productivity_pattern' | 'break_recommendation' | 'goal_progress' | 'learning_suggestion';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
}

export function useDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();
  const [stats, setStats] = useState<DashboardStats>({
    activeBricks: 0,
    completedToday: 0,
    focusTime: 0,
    aiConversations: 0,
    pendingBricks: 0,
    totalBricks: 0,
    completedThisWeek: 0,
    averageSessionTime: 0,
  });
  const [todaySchedule, setTodaySchedule] = useState<TodayScheduleItem[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Start as false to avoid hydration mismatch
  const [error, setError] = useState<string | null>(null);

  // Calculate today's date range (hydration-safe)
  const getTodayRange = useCallback(() => {
    // Use a fixed date calculation to avoid hydration mismatch
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();

    const startOfDay = new Date(year, month, date, 0, 0, 0, 0);
    const endOfDay = new Date(year, month, date, 23, 59, 59, 999);

    return { startOfDay, endOfDay };
  }, []);

  // Calculate this week's date range (hydration-safe)
  const getThisWeekRange = useCallback(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();

    // Calculate start of week (Sunday)
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const startDate = date - currentDay;

    const startOfWeek = new Date(year, month, startDate, 0, 0, 0, 0);
    const endOfWeek = new Date(year, month, startDate + 6, 23, 59, 59, 999);

    return { startOfWeek, endOfWeek };
  }, []);

  // Fetch dashboard statistics
  const fetchDashboardStats = useCallback(async () => {
    if (!user?.id || !isAuthenticated) {
      // Reset stats if not authenticated
      setStats({
        activeBricks: 0,
        completedToday: 0,
        focusTime: 0,
        aiConversations: 0,
        pendingBricks: 0,
        totalBricks: 0,
        completedThisWeek: 0,
        averageSessionTime: 0,
      });
      return;
    }

    try {
      const { startOfDay, endOfDay } = getTodayRange();
      const { startOfWeek, endOfWeek } = getThisWeekRange();

      // Fetch all bricks for the user
      const { data: bricks, error: bricksError } = await supabase
        .from('bricks')
        .select('*')
        .eq('user_id', user.id);

      if (bricksError) throw bricksError;

      // Fetch completed quantas for today
      const { data: completedQuantasToday, error: quantasError } = await supabase
        .from('quantas')
        .select('actual_duration_minutes, updated_at')
        .eq('status', 'completed')
        .gte('updated_at', startOfDay.toISOString())
        .lte('updated_at', endOfDay.toISOString());

      if (quantasError) throw quantasError;

      // Fetch conversations count
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user.id);

      if (convError) throw convError;

      // Fetch messages count
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('id')
        .eq('user_id', user.id);

      if (msgError) throw msgError;

      // Calculate statistics
      const activeBricks = bricks?.filter(b => b.status === 'in_progress').length || 0;
      const pendingBricks = bricks?.filter(b => b.status === 'pending').length || 0;
      const totalBricks = bricks?.length || 0;

      const completedToday = completedQuantasToday?.length || 0;
      const focusTime = completedQuantasToday?.reduce((total, q) => total + (q.actual_duration_minutes || 0), 0) / 60 || 0; // Convert to hours
      const aiConversations = messages?.length || 0;

      // Calculate completed this week
      const { data: completedThisWeek, error: weekError } = await supabase
        .from('quantas')
        .select('id')
        .eq('status', 'completed')
        .gte('updated_at', startOfWeek.toISOString())
        .lte('updated_at', endOfWeek.toISOString());

      if (weekError) throw weekError;

      // Calculate average session time
      const totalSessions = completedQuantasToday?.length || 0;
      const averageSessionTime = totalSessions > 0
        ? completedQuantasToday.reduce((total, q) => total + (q.actual_duration_minutes || 0), 0) / totalSessions
        : 0;

      setStats({
        activeBricks,
        completedToday,
        focusTime: Math.round(focusTime * 10) / 10, // Round to 1 decimal place
        aiConversations,
        pendingBricks,
        totalBricks,
        completedThisWeek: completedThisWeek?.length || 0,
        averageSessionTime: Math.round(averageSessionTime),
      });

    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    }
  }, [user?.id, getTodayRange, getThisWeekRange]);

  // Fetch today's schedule
  const fetchTodaySchedule = useCallback(async () => {
    if (!user?.id || !isAuthenticated) {
      // Reset schedule if not authenticated
      setTodaySchedule([]);
      return;
    }

    try {
      const { startOfDay, endOfDay } = getTodayRange();

      // Fetch today's calendar events
      const { data: events, error: eventsError } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
        .order('start_time', { ascending: true });

      if (eventsError) throw eventsError;

      // Transform calendar events to schedule items
      const scheduleItems: TodayScheduleItem[] = events?.map(event => {
        // Determine status based on current time
        const now = new Date();
        const startTime = new Date(event.start_time);
        const endTime = new Date(event.end_time);

        let status: 'completed' | 'in_progress' | 'upcoming' = 'upcoming';
        if (now >= endTime) {
          status = 'completed';
        } else if (now >= startTime) {
          status = 'in_progress';
        }

        // Map calendar_source to type
        let type: 'brick' | 'quanta' | 'event' | 'meeting' = 'event';
        if (event.calendar_source === 'beq') {
          type = 'brick'; // BeQ-managed events are typically bricks
        } else if (event.calendar_source === 'google') {
          type = 'meeting'; // Google events are typically meetings
        }

        return {
          id: event.id,
          title: event.title,
          start_time: event.start_time,
          end_time: event.end_time,
          status,
          type,
        };
      }) || [];

      // If no events, add some default schedule items based on user preferences
      if (scheduleItems.length === 0) {
        // Fetch user preferences
        const { data: preferences, error: prefError } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!prefError && preferences) {
          // Add workout if user has workout frequency
          if (preferences.workout_frequency_per_week > 0) {
            const workoutTime = new Date();
            workoutTime.setHours(7, 0, 0, 0); // 7 AM

            scheduleItems.push({
              id: 'workout-default',
              title: 'Morning Workout',
              start_time: workoutTime.toISOString(),
              end_time: new Date(workoutTime.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour
              status: now >= workoutTime ? 'completed' : 'upcoming',
              type: 'brick',
            });
          }

          // Add learning session
          if (preferences.daily_learning_minutes > 0) {
            const learningTime = new Date();
            learningTime.setHours(19, 30, 0, 0); // 7:30 PM

            scheduleItems.push({
              id: 'learning-default',
              title: 'Daily Learning',
              start_time: learningTime.toISOString(),
              end_time: new Date(learningTime.getTime() + preferences.daily_learning_minutes * 60 * 1000).toISOString(),
              status: now >= learningTime ? 'in_progress' : 'upcoming',
              type: 'brick',
            });
          }
        }
      }

      setTodaySchedule(scheduleItems);

    } catch (err) {
      console.error('Error fetching today schedule:', err);
    }
  }, [user?.id, getTodayRange]);

  // Generate AI insights based on user data
  const generateAIInsights = useCallback(async () => {
    if (!user?.id || !isAuthenticated) {
      // Reset insights if not authenticated
      setAiInsights([]);
      return;
    }

    try {
      const insights: AIInsight[] = [];

      // Fetch user preferences and recent activity
      const { data: preferences, error: prefError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const { data: recentBricks, error: bricksError } = await supabase
        .from('bricks')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(5);

      if (!prefError && preferences && !bricksError && recentBricks) {
        // Productivity pattern insight
        const now = new Date();
        const hour = now.getHours();
        let productivityMessage = '';

        if (hour >= 9 && hour <= 11) {
          productivityMessage = 'You\'re most productive between 9 AM - 11 AM. Consider scheduling your most important tasks during this time.';
        } else if (hour >= 14 && hour <= 16) {
          productivityMessage = 'This is typically a good time for focused work. Consider tackling complex tasks now.';
        } else {
          productivityMessage = 'Consider planning your day around your natural energy peaks for optimal productivity.';
        }

        insights.push({
          id: 'productivity-pattern',
          type: 'productivity_pattern',
          title: 'Productivity Pattern',
          description: productivityMessage,
          priority: 'medium',
          actionable: true,
        });

        // Break recommendation
        if (preferences.break_frequency_minutes > 0) {
          const lastBreakTime = localStorage.getItem('lastBreakTime');
          const lastBreak = lastBreakTime ? new Date(lastBreakTime) : null;
          const minutesSinceLastBreak = lastBreak
            ? (now.getTime() - lastBreak.getTime()) / (1000 * 60)
            : preferences.break_frequency_minutes + 1;

          if (minutesSinceLastBreak >= preferences.break_frequency_minutes) {
            insights.push({
              id: 'break-recommendation',
              type: 'break_recommendation',
              title: 'Break Recommendation',
              description: `It's been ${Math.round(minutesSinceLastBreak)} minutes since your last break. A ${preferences.break_duration_minutes}-minute break would help maintain your focus and energy levels.`,
              priority: 'high',
              actionable: true,
            });
          }
        }

        // Learning progress insight
        if (preferences.daily_learning_minutes > 0) {
          const { data: todayLearning, error: learningError } = await supabase
            .from('quantas')
            .select('actual_duration_minutes')
            .eq('status', 'completed')
            .gte('updated_at', getTodayRange().startOfDay.toISOString())
            .like('title', '%learn%');

          if (!learningError && todayLearning) {
            const totalLearningMinutes = todayLearning.reduce((total, q) =>
              total + (q.actual_duration_minutes || 0), 0
            );

            if (totalLearningMinutes < preferences.daily_learning_minutes) {
              insights.push({
                id: 'learning-progress',
                type: 'learning_suggestion',
                title: 'Learning Progress',
                description: `You've completed ${totalLearningMinutes} minutes of learning today. You have ${preferences.daily_learning_minutes - totalLearningMinutes} minutes remaining to reach your daily goal.`,
                priority: 'medium',
                actionable: true,
              });
            }
          }
        }

        // Goal progress insight
        const activeGoals = recentBricks?.filter(b => b.status === 'in_progress') || [];
        if (activeGoals.length > 0) {
          const goal = activeGoals[0];
          const progressPercent = goal.completion_percentage;

          if (progressPercent > 75) {
            insights.push({
              id: 'goal-progress',
              type: 'goal_progress',
              title: 'Goal Progress',
              description: `"${goal.title}" is ${progressPercent}% complete! You're making excellent progress.`,
              priority: 'low',
              actionable: false,
            });
          } else if (progressPercent < 25) {
            insights.push({
              id: 'goal-encouragement',
              type: 'goal_progress',
              title: 'Goal Encouragement',
              description: `Remember to work on "${goal.title}". Small consistent steps add up to big results.`,
              priority: 'medium',
              actionable: true,
            });
          }
        }
      }

      setAiInsights(insights);

    } catch (err) {
      console.error('Error generating AI insights:', err);
    }
  }, [user?.id, getTodayRange]);

  // Load all dashboard data
  const loadDashboardData = useCallback(async () => {
    if (!user?.id || !isAuthenticated) {
      // Reset all data if not authenticated
      setStats({
        activeBricks: 0,
        completedToday: 0,
        focusTime: 0,
        aiConversations: 0,
        pendingBricks: 0,
        totalBricks: 0,
        completedThisWeek: 0,
        averageSessionTime: 0,
      });
      setTodaySchedule([]);
      setAiInsights([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchDashboardStats(),
        fetchTodaySchedule(),
        generateAIInsights(),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, fetchDashboardStats, fetchTodaySchedule, generateAIInsights]);

  // Refresh dashboard data
  const refreshDashboard = useCallback(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    // Only load data on client side and when authentication is complete
    if (typeof window !== 'undefined' && !authLoading) {
      loadDashboardData();
    }
  }, [loadDashboardData, authLoading]);

  // Reload data when user authentication state changes
  useEffect(() => {
    if (typeof window !== 'undefined' && !authLoading) {
      loadDashboardData();
    }
  }, [user?.id, isAuthenticated, loadDashboardData]);

  return {
    // Data
    stats,
    todaySchedule,
    aiInsights,

    // State
    isLoading,
    error,

    // Actions
    refreshDashboard,
    loadDashboardData,
  };
}
