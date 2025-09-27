/**
 * Calendar Grid Foundation - Constants
 * 
 * Configuration constants for the calendar grid system
 */

import { CalendarView, TimeSlotConfig, ViewConfig, AccessibilityConfig } from './types';

// ===============================================
// VIEW CONFIGURATIONS
// ===============================================

export const VIEW_CONFIGS: Record<CalendarView, ViewConfig> = {
  daily: {
    view: 'daily',
    daysVisible: 1,
    timeSlotDuration: 30, // 30-minute slots
    showTimeSlots: true,
    gridColumns: 1,
  },
  weekly: {
    view: 'weekly',
    daysVisible: 7,
    timeSlotDuration: 30, // 30-minute slots
    showTimeSlots: true,
    gridColumns: 7,
  },
  monthly: {
    view: 'monthly',
    daysVisible: 35, // 5 weeks × 7 days
    timeSlotDuration: 1440, // Full day (24 hours × 60 minutes)
    showTimeSlots: false,
    gridColumns: 7,
  },
};

// ===============================================
// TIME SLOT CONFIGURATIONS
// ===============================================

export const DEFAULT_TIME_SLOT_CONFIG: TimeSlotConfig = {
  startHour: 7, // 7 AM
  endHour: 20, // 8 PM
  slotDuration: 30, // 30 minutes
  firstDayOfWeek: 1, // Monday
};

export const TIME_SLOT_DURATIONS = [15, 30, 60] as const; // minutes

export const WORK_HOURS_CONFIG: TimeSlotConfig = {
  startHour: 9, // 9 AM
  endHour: 17, // 5 PM
  slotDuration: 30,
  firstDayOfWeek: 1,
};

export const FULL_DAY_CONFIG: TimeSlotConfig = {
  startHour: 0, // 12 AM
  endHour: 23, // 11 PM
  slotDuration: 60,
  firstDayOfWeek: 1,
};

export const COMPACT_DAY_CONFIG: TimeSlotConfig = {
  startHour: 6, // 6 AM
  endHour: 22, // 10 PM
  slotDuration: 30, // 30 minutes
  firstDayOfWeek: 1, // Monday
};

// ===============================================
// COLORS & STYLING
// ===============================================

export const SCHEDULE_OBJECT_COLORS = {
  brick: {
    primary: '#f97316', // orange-500
    background: '#fed7aa', // orange-200
    border: '#ea580c', // orange-600
    text: '#9a3412', // orange-800
  },
  quanta: {
    primary: '#3b82f6', // blue-500
    background: '#bfdbfe', // blue-200
    border: '#2563eb', // blue-600
    text: '#1e40af', // blue-800
  },
  event: {
    primary: '#8b5cf6', // violet-500
    background: '#ddd6fe', // violet-200
    border: '#7c3aed', // violet-600
    text: '#5b21b6', // violet-800
  },
  meeting: {
    primary: '#06b6d4', // cyan-500
    background: '#a5f3fc', // cyan-200
    border: '#0891b2', // cyan-600
    text: '#164e63', // cyan-900
  },
} as const;

export const STATUS_COLORS = {
  pending: {
    background: '#f3f4f6', // gray-100
    border: '#d1d5db', // gray-300
    text: '#6b7280', // gray-500
  },
  in_progress: {
    background: '#fef3c7', // yellow-100
    border: '#f59e0b', // yellow-500
    text: '#92400e', // yellow-800
  },
  completed: {
    background: '#d1fae5', // green-100
    border: '#10b981', // green-500
    text: '#065f46', // green-800
  },
  cancelled: {
    background: '#fee2e2', // red-100
    border: '#ef4444', // red-500
    text: '#991b1b', // red-800
  },
  upcoming: {
    background: '#e0e7ff', // indigo-100
    border: '#6366f1', // indigo-500
    text: '#3730a3', // indigo-800
  },
} as const;

// ===============================================
// GRID DIMENSIONS
// ===============================================

export const GRID_DIMENSIONS = {
  // Time slot heights (in pixels)
  timeSlotHeight: {
    compact: 40,
    normal: 60,
    expanded: 80,
  },
  
  // Column widths (minimum in pixels)
  columnWidth: {
    mobile: 280,
    tablet: 160,
    desktop: 200,
  },
  
  // Header heights
  headerHeight: {
    timeColumn: 60,
    dayHeader: 80,
    monthHeader: 40,
  },
  
  // Margins and padding
  cellPadding: 4,
  eventMargin: 2,
  eventMinHeight: 20,
  
  // Responsive breakpoints (matches Tailwind)
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
} as const;

// ===============================================
// Z-INDEX LAYERS
// ===============================================

export const Z_INDEX = {
  base: 1,
  timeSlots: 10,
  events: 20,
  dragGhost: 30,
  dropTarget: 40,
  currentTimeIndicator: 50,
  modal: 1000,
  tooltip: 1010,
} as const;

// ===============================================
// ACCESSIBILITY
// ===============================================

export const DEFAULT_ACCESSIBILITY_CONFIG: AccessibilityConfig = {
  enableKeyboardNavigation: true,
  enableScreenReader: true,
  announceTimeChanges: true,
  focusManagement: 'auto',
  reducedMotion: false,
};

export const KEYBOARD_SHORTCUTS = {
  navigation: {
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight',
    home: 'Home',
    end: 'End',
    pageUp: 'PageUp',
    pageDown: 'PageDown',
  },
  actions: {
    select: 'Enter',
    escape: 'Escape',
    delete: 'Delete',
    edit: 'F2',
    copy: 'Ctrl+c',
    paste: 'Ctrl+v',
  },
  views: {
    daily: 'd',
    weekly: 'w',
    monthly: 'm',
    today: 't',
  },
} as const;

export const ARIA_LABELS = {
  calendarGrid: 'Calendar grid',
  timeSlot: 'Time slot',
  dateCell: 'Date cell',
  event: 'Calendar event',
  currentTime: 'Current time indicator',
  dragTarget: 'Drop target for calendar events',
  navigationButton: 'Navigate calendar',
  viewSwitcher: 'Change calendar view',
  eventDetails: 'Event details',
} as const;

// ===============================================
// ANIMATION SETTINGS
// ===============================================

export const ANIMATIONS = {
  // Durations in milliseconds
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  
  // Easing functions (CSS)
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },
  
  // Framer Motion variants
  variants: {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
    },
    scale: {
      initial: { scale: 0.95, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.95, opacity: 0 },
    },
  },
} as const;

// ===============================================
// DRAG & DROP
// ===============================================

export const DRAG_DROP = {
  // Types for HTML5 drag API
  dataTypes: {
    scheduleObject: 'application/x-schedule-object',
    timeSlot: 'application/x-time-slot',
  },
  
  // Visual feedback
  ghostOpacity: 0.6,
  dropTargetOpacity: 0.8,
  
  // Snap settings
  snapToGrid: true,
  snapThreshold: 10, // pixels
  
  // Touch settings
  touchStartDelay: 150, // milliseconds
  longPressThreshold: 500, // milliseconds
} as const;

// ===============================================
// CURRENT TIME INDICATOR
// ===============================================

export const CURRENT_TIME_INDICATOR = {
  updateInterval: 60000, // 1 minute in milliseconds
  lineColor: '#ef4444', // red-500
  lineWidth: 2,
  dotRadius: 6,
  zIndex: Z_INDEX.currentTimeIndicator,
} as const;

// ===============================================
// VALIDATION RULES
// ===============================================

export const VALIDATION_RULES = {
  // Event duration limits
  minEventDuration: 15, // minutes
  maxEventDuration: 1440, // 24 hours
  
  // Time slot validation
  minTimeSlotDuration: 15, // minutes
  maxTimeSlotDuration: 60, // minutes
  
  // Calendar range limits
  maxFutureMonths: 12,
  maxPastMonths: 12,
  
  // Performance limits
  maxEventsPerView: 1000,
  maxTimeSlots: 500,
} as const;

// ===============================================
// ERROR MESSAGES
// ===============================================

export const ERROR_MESSAGES = {
  dragDrop: {
    invalidTarget: 'Cannot drop event on this time slot',
    timeConflict: 'This time slot conflicts with an existing event',
    outOfBounds: 'Cannot place event outside of calendar bounds',
  },
  
  validation: {
    eventTooShort: `Event duration must be at least ${VALIDATION_RULES.minEventDuration} minutes`,
    eventTooLong: `Event duration cannot exceed ${VALIDATION_RULES.maxEventDuration} minutes`,
    invalidTimeSlot: 'Invalid time slot configuration',
    dateOutOfRange: 'Date is outside of allowed range',
  },
  
  accessibility: {
    focusLost: 'Calendar focus has been lost',
    navigationDisabled: 'Keyboard navigation is disabled',
    screenReaderUnavailable: 'Screen reader support is not available',
  },
} as const;

// ===============================================
// FEATURE FLAGS
// ===============================================

export const FEATURE_FLAGS = {
  enableDragDrop: true,
  enableResize: true,
  enableKeyboardNavigation: true,
  enableTouchGestures: true,
  enableAnimations: true,
  enableConflictDetection: true,
  enableAutoSave: true,
  enableOfflineMode: false, // For future implementation
} as const;
