/**
 * Calendar Grid Foundation - Public API
 * 
 * Main export file for calendar grid components and utilities
 */

// Types
export * from './types';

// Constants
export * from './constants';

// Utilities
export * from './utils';

// Main components
export { CalendarGrid } from '../components/calendar/CalendarGrid';
export { TimeSlot } from '../components/calendar/TimeSlot';

// Hooks
export { useResponsiveCalendar, useIsMobile, useIsTouchDevice } from '../components/calendar/hooks/useResponsiveCalendar';
export { 
  useCalendarAccessibility, 
  useReducedMotion, 
  useHighContrast, 
  useScreenReader 
} from '../components/calendar/hooks/useCalendarAccessibility';

// Re-export commonly used date-fns functions for convenience
export { 
  format, 
  startOfDay, 
  endOfDay, 
  addDays, 
  subDays, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  isSameDay,
  isToday,
  addMinutes,
  differenceInMinutes,
} from 'date-fns';
