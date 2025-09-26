/**
 * Calendar Components - Public API
 * 
 * Export file for calendar components
 */

// Main components
export { CalendarGrid } from './CalendarGrid';
export { TimeSlot } from './TimeSlot';
export { ConflictManager } from './conflict-manager';
export { CalendarApp } from './CalendarApp';

// View components
export { DailyView } from './views/DailyView';
export { WeeklyView } from './views/WeeklyView';
export { MonthlyView } from './views/MonthlyView';

// Navigation components
export { ViewSwitcher, CompactViewSwitcher, DropdownViewSwitcher } from './ViewSwitcher';
export { DateNavigation, CompactDateNavigation, MinimalDateNavigation } from './DateNavigation';

// Draggable components
export { 
  DraggableScheduleObject,
  DraggableBrick,
  DraggableQuanta,
  DragStyleProvider,
  useDragSystem,
  useKeyboardDrag,
  type DragState,
  type DragResult,
  type DropTarget,
  type KeyboardDragState,
  type KeyboardDragOptions
} from './draggable';

// Drop-enabled components
export { DropEnabledTimeSlot } from './DropEnabledTimeSlot';
export { DropFeedback, MiniDropFeedback, SnapIndicator } from './DropFeedback';
export { DraggableObjectsDemo } from './DraggableObjectsDemo';
export { DragDropCalendarDemo } from './DragDropCalendarDemo';

// Drop system hooks
export { useCalendarDrop } from '@/lib/hooks/use-calendar-drop';

// Hooks
export { useResponsiveCalendar, useIsMobile, useIsTouchDevice } from './hooks/useResponsiveCalendar';
export { 
  useCalendarAccessibility, 
  useReducedMotion, 
  useHighContrast, 
  useScreenReader 
} from './hooks/useCalendarAccessibility';

// Types (re-export from lib)
export type {
  CalendarGridProps,
  TimeSlotProps,
  CalendarView,
  CalendarGridConfig,
  ScheduleObject,
  BrickObject,
  QuantaObject,
  CalendarEvent,
  MeetingEvent,
  TimeSlot as TimeSlotType,
  CalendarGridCell,
  CalendarGridData,
} from '@/lib/calendar/types';
