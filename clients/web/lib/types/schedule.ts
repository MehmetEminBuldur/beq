/**
 * TypeScript types for Schedule API endpoints
 * Matches the Pydantic models defined in the orchestrator service
 */

export interface TaskInput {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: string;
  estimated_duration_minutes: number;
  deadline?: string;
  preferred_time?: string;
  dependencies: string[];
}

export interface EventInput {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  is_moveable: boolean;
}

export interface UserPreferences {
  timezone: string;
  work_start_time: string;
  work_end_time: string;
  break_frequency_minutes: number;
  break_duration_minutes: number;
  lunch_time: string;
  lunch_duration_minutes: number;
  preferred_task_duration_minutes: number;
  energy_peak_hours: string[];
  avoid_scheduling_after: string;
}

export interface ConstraintInput {
  type: string;
  start_time?: string;
  end_time?: string;
  description: string;
  is_hard_constraint: boolean;
}

export interface ScheduleOptimizeRequest {
  user_id: string;
  start_date: string;
  end_date: string;
  brick_ids?: string[];
}

export interface ScheduleGenerateRequest {
  user_id: string;
  tasks: TaskInput[];
  existing_events: EventInput[];
  user_preferences: UserPreferences;
  constraints: ConstraintInput[];
  planning_horizon_days: number;
}

export interface ScheduledEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  type: string;
  priority?: string;
  category?: string;
}

export interface ScheduleGenerateResponse {
  success: boolean;
  scheduled_events: ScheduledEvent[];
  reasoning: string;
  confidence_score: number;
  alternative_suggestions: string[];
  warnings: string[];
  unscheduled_tasks: string[];
  processing_time_seconds: number;
  error?: string;
}

export interface ScheduleOptimizeResponse {
  success: boolean;
  optimized_schedule: ScheduledEvent[];
  improvements: string[];
  confidence_score: number;
  processing_time_seconds: number;
  error?: string;
}

export interface UserSchedule {
  user_id: string;
  events: ScheduledEvent[];
  last_updated: string;
}

// Hook return types
export interface UseScheduleReturn {
  schedule: UserSchedule | null;
  isLoading: boolean;
  error: string | null;
  generateSchedule: (request: ScheduleGenerateRequest) => Promise<ScheduleGenerateResponse>;
  optimizeSchedule: (request: ScheduleOptimizeRequest) => Promise<ScheduleOptimizeResponse>;
  getUserSchedule: (userId: string, startDate?: string, endDate?: string) => Promise<UserSchedule>;
  refreshSchedule: () => Promise<void>;
}

// Component props types
export interface ScheduleDisplayProps {
  schedule: UserSchedule;
  onEventClick?: (event: ScheduledEvent) => void;
  onOptimize?: () => void;
  isOptimizing?: boolean;
}

export interface ScheduleOptimizationProps {
  userId: string;
  onOptimizationComplete?: (response: ScheduleOptimizeResponse) => void;
  onError?: (error: string) => void;
}
