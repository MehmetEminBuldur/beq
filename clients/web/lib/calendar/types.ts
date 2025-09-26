/**
 * Calendar Grid Foundation - Type Definitions
 * 
 * Core type definitions for the calendar grid system
 */

import { ReactNode } from 'react';

// ===============================================
// CALENDAR VIEWS
// ===============================================

export type CalendarView = 'daily' | 'weekly' | 'monthly';

export interface ViewConfig {
  view: CalendarView;
  daysVisible: number;
  timeSlotDuration: number; // minutes
  showTimeSlots: boolean;
  gridColumns: number;
}

// ===============================================
// TIME SLOTS
// ===============================================

export interface TimeSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  isAvailable: boolean;
  isCurrentTime: boolean;
  conflicts: string[]; // IDs of conflicting events
  row: number;
  column: number;
}

export interface TimeSlotConfig {
  startHour: number; // 0-23
  endHour: number; // 0-23
  slotDuration: number; // minutes (15, 30, 60)
  firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
}

// ===============================================
// CALENDAR EVENTS & OBJECTS
// ===============================================

export type ScheduleObjectType = 'brick' | 'quanta' | 'event' | 'meeting';
export type ScheduleObjectStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'upcoming';

export interface BaseScheduleObject {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  type: ScheduleObjectType;
  status: ScheduleObjectStatus;
  color: string;
  backgroundColor: string;
  borderColor: string;
  isAllDay: boolean;
  isRecurring: boolean;
  userId: string;
  metadata?: Record<string, any>;
}

export interface BrickObject extends BaseScheduleObject {
  type: 'brick';
  goalId?: string;
  priority: 'low' | 'medium' | 'high';
  estimatedHours: number;
  actualHours?: number;
  progress: number; // 0-100
  dependencies: string[];
}

export interface QuantaObject extends BaseScheduleObject {
  type: 'quanta';
  brickId?: string;
  category: 'work' | 'personal' | 'health' | 'learning';
  energy: 'low' | 'medium' | 'high';
  location?: string;
}

export interface CalendarEvent extends BaseScheduleObject {
  type: 'event';
  location?: string;
  attendees?: string[];
  externalId?: string; // For Google Calendar sync
  source: 'internal' | 'google' | 'outlook';
}

export interface MeetingEvent extends BaseScheduleObject {
  type: 'meeting';
  meetingUrl?: string;
  attendees: string[];
  organizer: string;
  isRequired: boolean;
}

export type ScheduleObject = BrickObject | QuantaObject | CalendarEvent | MeetingEvent;

// ===============================================
// CALENDAR GRID
// ===============================================

export interface CalendarGridConfig {
  view: CalendarView;
  selectedDate: Date;
  timeSlotConfig: TimeSlotConfig;
  showWeekends: boolean;
  showCurrentTimeIndicator: boolean;
  allowDragDrop: boolean;
  allowResize: boolean;
  compactMode: boolean;
}

export interface CalendarGridCell {
  id: string;
  date: Date;
  timeSlot?: TimeSlot;
  events: ScheduleObject[];
  isToday: boolean;
  isSelected: boolean;
  isWeekend: boolean;
  isOutsideMonth: boolean;
  isDragTarget: boolean;
  isDroppable: boolean;
  row: number;
  column: number;
}

export interface CalendarGridData {
  cells: CalendarGridCell[];
  timeSlots: TimeSlot[];
  dateRange: {
    start: Date;
    end: Date;
  };
  totalRows: number;
  totalColumns: number;
}

// ===============================================
// DRAG & DROP
// ===============================================

export interface DragState {
  isDragging: boolean;
  draggedObject: ScheduleObject | null;
  dragType: 'move' | 'resize' | null;
  dropTarget: CalendarGridCell | null;
  ghostPosition: { x: number; y: number } | null;
  allowDrop: boolean;
}

export interface DropResult {
  success: boolean;
  targetCell: CalendarGridCell;
  updatedObject: ScheduleObject;
  conflicts: ConflictInfo[];
}

// ===============================================
// CONFLICTS
// ===============================================

export interface ConflictInfo {
  id: string;
  type: 'time_overlap' | 'double_booking' | 'resource_conflict';
  severity: 'low' | 'medium' | 'high' | 'critical';
  conflictingObjects: ScheduleObject[];
  description: string;
  suggestedResolution: string;
  metadata?: Record<string, any>;
}

// ===============================================
// POSITIONING
// ===============================================

export interface EventPosition {
  objectId: string;
  startRow: number;
  endRow: number;
  column: number;
  width: number; // percentage of column width
  left: number; // offset from column start (percentage)
  zIndex: number;
  overlaps: string[]; // IDs of overlapping events
}

export interface GridLayout {
  positions: Map<string, EventPosition>;
  conflicts: ConflictInfo[];
  maxOverlaps: number;
}

// ===============================================
// ACCESSIBILITY
// ===============================================

export interface AccessibilityConfig {
  enableKeyboardNavigation: boolean;
  enableScreenReader: boolean;
  announceTimeChanges: boolean;
  focusManagement: 'auto' | 'manual';
  reducedMotion: boolean;
}

export interface AccessibilityState {
  focusedCell: string | null;
  selectedObjects: string[];
  announcements: string[];
  keyboardNavigationEnabled: boolean;
}

// ===============================================
// COMPONENT PROPS
// ===============================================

export interface CalendarGridProps {
  config: CalendarGridConfig;
  events: ScheduleObject[];
  onCellClick?: (cell: CalendarGridCell) => void;
  onEventClick?: (event: ScheduleObject, cell: CalendarGridCell) => void;
  onDateChange?: (date: Date) => void;
  onViewChange?: (view: CalendarView) => void;
  onDragStart?: (object: ScheduleObject) => void;
  onDragEnd?: (result: DropResult) => void;
  onEventUpdate?: (object: ScheduleObject) => void;
  className?: string;
  accessibilityConfig?: AccessibilityConfig;
  children?: ReactNode;
}

export interface TimeSlotProps {
  timeSlot: TimeSlot;
  events: ScheduleObject[];
  isDropTarget: boolean;
  onClick?: (timeSlot: TimeSlot) => void;
  onDrop?: (timeSlot: TimeSlot, object: ScheduleObject) => void;
  className?: string;
}

export interface GridCellProps {
  cell: CalendarGridCell;
  onClick?: (cell: CalendarGridCell) => void;
  onDoubleClick?: (cell: CalendarGridCell) => void;
  onDrop?: (cell: CalendarGridCell, object: ScheduleObject) => void;
  className?: string;
  children?: ReactNode;
}

// ===============================================
// UTILITIES
// ===============================================

export interface CalendarUtilities {
  generateTimeSlots: (config: TimeSlotConfig, date: Date) => TimeSlot[];
  calculateEventPositions: (events: ScheduleObject[], view: CalendarView) => GridLayout;
  detectConflicts: (events: ScheduleObject[]) => ConflictInfo[];
  formatTimeSlot: (timeSlot: TimeSlot) => string;
  isValidDrop: (object: ScheduleObject, target: CalendarGridCell) => boolean;
}

// ===============================================
// HOOKS RETURN TYPES
// ===============================================

export interface UseCalendarGridReturn {
  gridData: CalendarGridData;
  dragState: DragState;
  accessibilityState: AccessibilityState;
  actions: {
    updateConfig: (config: Partial<CalendarGridConfig>) => void;
    selectCell: (cellId: string) => void;
    startDrag: (object: ScheduleObject) => void;
    endDrag: (target: CalendarGridCell) => void;
    handleKeyboardNavigation: (key: string) => void;
    announceToScreenReader: (message: string) => void;
  };
  utilities: CalendarUtilities;
}
