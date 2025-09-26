/**
 * Calendar Grid Foundation - Utilities
 * 
 * Core utility functions for calendar grid operations
 */

import { 
  format, 
  startOfDay, 
  endOfDay, 
  addMinutes, 
  isSameDay, 
  isToday,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addDays,
  getDay,
  getHours,
  getMinutes,
  setHours,
  setMinutes,
  differenceInMinutes,
  isWithinInterval,
  max,
  min,
} from 'date-fns';

import {
  TimeSlot,
  TimeSlotConfig,
  CalendarView,
  CalendarGridCell,
  CalendarGridData,
  ScheduleObject,
  ConflictInfo,
  EventPosition,
  GridLayout,
} from './types';

import {
  DEFAULT_TIME_SLOT_CONFIG,
  VIEW_CONFIGS,
  VALIDATION_RULES,
  GRID_DIMENSIONS,
} from './constants';

// ===============================================
// TIME SLOT GENERATION
// ===============================================

/**
 * Generate time slots for a given date and configuration
 */
export function generateTimeSlots(
  config: TimeSlotConfig = DEFAULT_TIME_SLOT_CONFIG,
  date: Date = new Date()
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const baseDate = startOfDay(date);
  const currentTime = new Date();
  
  // Calculate total slots needed
  const totalMinutes = (config.endHour - config.startHour) * 60;
  const slotCount = Math.floor(totalMinutes / config.slotDuration);
  
  for (let i = 0; i < slotCount; i++) {
    const startMinutes = config.startHour * 60 + (i * config.slotDuration);
    const startTime = addMinutes(baseDate, startMinutes);
    const endTime = addMinutes(startTime, config.slotDuration);
    
    const slot: TimeSlot = {
      id: `slot-${format(date, 'yyyy-MM-dd')}-${i}`,
      startTime,
      endTime,
      duration: config.slotDuration,
      isAvailable: true,
      isCurrentTime: isWithinInterval(currentTime, { start: startTime, end: endTime }),
      conflicts: [],
      row: i,
      column: 0, // Will be updated based on view
    };
    
    slots.push(slot);
  }
  
  return slots;
}

/**
 * Generate time slots for a date range (weekly/monthly views)
 */
export function generateTimeSlotsForRange(
  startDate: Date,
  endDate: Date,
  config: TimeSlotConfig = DEFAULT_TIME_SLOT_CONFIG
): Map<string, TimeSlot[]> {
  const slotsMap = new Map<string, TimeSlot[]>();
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  days.forEach((day, dayIndex) => {
    const slots = generateTimeSlots(config, day).map(slot => ({
      ...slot,
      column: dayIndex,
    }));
    
    const dateKey = format(day, 'yyyy-MM-dd');
    slotsMap.set(dateKey, slots);
  });
  
  return slotsMap;
}

// ===============================================
// DATE RANGE CALCULATION
// ===============================================

/**
 * Calculate the date range for a given view and selected date
 */
export function calculateDateRange(view: CalendarView, selectedDate: Date): { start: Date; end: Date } {
  switch (view) {
    case 'daily':
      return {
        start: startOfDay(selectedDate),
        end: endOfDay(selectedDate),
      };
      
    case 'weekly':
      return {
        start: startOfWeek(selectedDate, { weekStartsOn: 1 }), // Monday
        end: endOfWeek(selectedDate, { weekStartsOn: 1 }),
      };
      
    case 'monthly':
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      
      // Extend to show complete weeks
      return {
        start: startOfWeek(monthStart, { weekStartsOn: 1 }),
        end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
      };
      
    default:
      throw new Error(`Unsupported calendar view: ${view}`);
  }
}

// ===============================================
// GRID CELL GENERATION
// ===============================================

/**
 * Generate calendar grid cells for a given view
 */
export function generateCalendarGrid(
  view: CalendarView,
  selectedDate: Date,
  events: ScheduleObject[] = [],
  timeSlotConfig: TimeSlotConfig = DEFAULT_TIME_SLOT_CONFIG
): CalendarGridData {
  const dateRange = calculateDateRange(view, selectedDate);
  const viewConfig = VIEW_CONFIGS[view];
  
  const cells: CalendarGridCell[] = [];
  const timeSlots: TimeSlot[] = [];
  
  if (view === 'monthly') {
    // Monthly view: one cell per day
    const days = eachDayOfInterval(dateRange);
    
    days.forEach((day, index) => {
      const row = Math.floor(index / 7);
      const column = index % 7;
      
      const dayEvents = events.filter(event => 
        isSameDay(event.startTime, day)
      );
      
      const cell: CalendarGridCell = {
        id: `cell-${format(day, 'yyyy-MM-dd')}`,
        date: day,
        events: dayEvents,
        isToday: isToday(day),
        isSelected: isSameDay(day, selectedDate),
        isWeekend: [0, 6].includes(getDay(day)), // Sunday = 0, Saturday = 6
        isOutsideMonth: day < startOfMonth(selectedDate) || day > endOfMonth(selectedDate),
        isDragTarget: false,
        isDroppable: true,
        row,
        column,
      };
      
      cells.push(cell);
    });
    
  } else {
    // Daily/Weekly view: cells with time slots
    const days = eachDayOfInterval(dateRange);
    const slotsMap = generateTimeSlotsForRange(dateRange.start, dateRange.end, timeSlotConfig);
    
    days.forEach((day, dayIndex) => {
      const daySlots = slotsMap.get(format(day, 'yyyy-MM-dd')) || [];
      timeSlots.push(...daySlots);
      
      daySlots.forEach((slot, slotIndex) => {
        const dayEvents = events.filter(event => 
          isWithinInterval(event.startTime, { start: slot.startTime, end: slot.endTime }) ||
          isWithinInterval(event.endTime, { start: slot.startTime, end: slot.endTime }) ||
          (event.startTime <= slot.startTime && event.endTime >= slot.endTime)
        );
        
        const cell: CalendarGridCell = {
          id: `cell-${format(day, 'yyyy-MM-dd')}-${slotIndex}`,
          date: day,
          timeSlot: slot,
          events: dayEvents,
          isToday: isToday(day),
          isSelected: isSameDay(day, selectedDate),
          isWeekend: [0, 6].includes(getDay(day)),
          isOutsideMonth: false,
          isDragTarget: false,
          isDroppable: true,
          row: slotIndex,
          column: dayIndex,
        };
        
        cells.push(cell);
      });
    });
  }
  
  const totalRows = view === 'monthly' ? 6 : Math.max(...cells.map(c => c.row)) + 1;
  const totalColumns = view === 'daily' ? 1 : 7;
  
  return {
    cells,
    timeSlots,
    dateRange,
    totalRows,
    totalColumns,
  };
}

// ===============================================
// EVENT POSITIONING
// ===============================================

/**
 * Calculate positions for events in the grid
 */
export function calculateEventPositions(
  events: ScheduleObject[],
  view: CalendarView,
  gridData: CalendarGridData
): GridLayout {
  const positions = new Map<string, EventPosition>();
  const conflicts: ConflictInfo[] = [];
  
  // Group events by day for positioning
  const eventsByDay = new Map<string, ScheduleObject[]>();
  
  events.forEach(event => {
    const dayKey = format(event.startTime, 'yyyy-MM-dd');
    if (!eventsByDay.has(dayKey)) {
      eventsByDay.set(dayKey, []);
    }
    eventsByDay.get(dayKey)!.push(event);
  });
  
  // Calculate positions for each day
  eventsByDay.forEach((dayEvents, dayKey) => {
    const dayPositions = calculateDayEventPositions(dayEvents, view, gridData);
    dayPositions.forEach((position, eventId) => {
      positions.set(eventId, position);
    });
  });
  
  return {
    positions,
    conflicts,
    maxOverlaps: Math.max(...Array.from(positions.values()).map(p => p.overlaps.length), 0),
  };
}

/**
 * Calculate event positions for a single day
 */
function calculateDayEventPositions(
  events: ScheduleObject[],
  view: CalendarView,
  gridData: CalendarGridData
): Map<string, EventPosition> {
  const positions = new Map<string, EventPosition>();
  
  // Sort events by start time
  const sortedEvents = [...events].sort((a, b) => 
    a.startTime.getTime() - b.startTime.getTime()
  );
  
  // Detect overlapping events
  const overlappingGroups = findOverlappingGroups(sortedEvents);
  
  overlappingGroups.forEach(group => {
    const groupPositions = calculateOverlappingEventPositions(group, view, gridData);
    groupPositions.forEach((position, eventId) => {
      positions.set(eventId, position);
    });
  });
  
  return positions;
}

/**
 * Find groups of overlapping events
 */
function findOverlappingGroups(events: ScheduleObject[]): ScheduleObject[][] {
  const groups: ScheduleObject[][] = [];
  const processed = new Set<string>();
  
  events.forEach(event => {
    if (processed.has(event.id)) return;
    
    const group = [event];
    processed.add(event.id);
    
    // Find all events that overlap with this event or any event in the group
    let foundOverlap = true;
    while (foundOverlap) {
      foundOverlap = false;
      
      for (const otherEvent of events) {
        if (processed.has(otherEvent.id)) continue;
        
        // Check if otherEvent overlaps with any event in the current group
        const overlaps = group.some(groupEvent => 
          eventsOverlap(groupEvent, otherEvent)
        );
        
        if (overlaps) {
          group.push(otherEvent);
          processed.add(otherEvent.id);
          foundOverlap = true;
        }
      }
    }
    
    groups.push(group);
  });
  
  return groups;
}

/**
 * Check if two events overlap in time
 */
function eventsOverlap(event1: ScheduleObject, event2: ScheduleObject): boolean {
  return event1.startTime < event2.endTime && event2.startTime < event1.endTime;
}

/**
 * Calculate positions for overlapping events
 */
function calculateOverlappingEventPositions(
  events: ScheduleObject[],
  view: CalendarView,
  gridData: CalendarGridData
): Map<string, EventPosition> {
  const positions = new Map<string, EventPosition>();
  
  if (events.length === 0) return positions;
  
  // For single events, use full width
  if (events.length === 1) {
    const event = events[0];
    const position: EventPosition = {
      objectId: event.id,
      startRow: 0, // Will be calculated based on time
      endRow: 0,
      column: 0,
      width: 100,
      left: 0,
      zIndex: 20,
      overlaps: [],
    };
    positions.set(event.id, position);
    return positions;
  }
  
  // For multiple overlapping events, distribute width
  const eventWidth = 100 / events.length;
  
  events.forEach((event, index) => {
    const position: EventPosition = {
      objectId: event.id,
      startRow: 0, // Will be calculated based on time
      endRow: 0,
      column: 0,
      width: eventWidth - 1, // Small margin between events
      left: index * eventWidth,
      zIndex: 20 + index,
      overlaps: events.filter(e => e.id !== event.id).map(e => e.id),
    };
    positions.set(event.id, position);
  });
  
  return positions;
}

// ===============================================
// CONFLICT DETECTION
// ===============================================

/**
 * Detect conflicts between events
 */
export function detectConflicts(events: ScheduleObject[]): ConflictInfo[] {
  const conflicts: ConflictInfo[] = [];
  
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const event1 = events[i];
      const event2 = events[j];
      
      if (eventsOverlap(event1, event2)) {
        const conflict: ConflictInfo = {
          id: `conflict-${event1.id}-${event2.id}`,
          type: 'time_overlap',
          severity: 'medium',
          conflictingObjects: [event1, event2],
          description: `${event1.title} overlaps with ${event2.title}`,
          suggestedResolution: 'reschedule_second',
        };
        conflicts.push(conflict);
      }
    }
  }
  
  return conflicts;
}

// ===============================================
// VALIDATION
// ===============================================

/**
 * Validate if an event can be dropped on a target cell
 */
export function isValidDrop(
  event: ScheduleObject,
  targetCell: CalendarGridCell,
  existingEvents: ScheduleObject[] = []
): boolean {
  // Check if the target cell has a time slot (required for timed events)
  if (!targetCell.timeSlot && !event.isAllDay) {
    return false;
  }
  
  // Check if the event duration fits in the time slot
  if (targetCell.timeSlot) {
    const eventDuration = differenceInMinutes(event.endTime, event.startTime);
    if (eventDuration < VALIDATION_RULES.minEventDuration) {
      return false;
    }
  }
  
  // Check for conflicts with existing events
  const wouldConflict = existingEvents.some(existing => {
    if (existing.id === event.id) return false; // Don't conflict with self
    
    // Create hypothetical moved event
    const movedEvent = {
      ...event,
      startTime: targetCell.timeSlot?.startTime || targetCell.date,
      endTime: targetCell.timeSlot?.endTime || targetCell.date,
    };
    
    return eventsOverlap(existing, movedEvent);
  });
  
  return !wouldConflict;
}

// ===============================================
// FORMATTING UTILITIES
// ===============================================

/**
 * Format time slot for display
 */
export function formatTimeSlot(timeSlot: TimeSlot): string {
  return `${format(timeSlot.startTime, 'HH:mm')} - ${format(timeSlot.endTime, 'HH:mm')}`;
}

/**
 * Format event duration
 */
export function formatEventDuration(event: ScheduleObject): string {
  const duration = differenceInMinutes(event.endTime, event.startTime);
  
  if (duration < 60) {
    return `${duration}m`;
  }
  
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  
  if (minutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${minutes}m`;
}

/**
 * Get readable time range for an event
 */
export function getEventTimeRange(event: ScheduleObject): string {
  if (event.isAllDay) {
    return 'All day';
  }
  
  const start = format(event.startTime, 'HH:mm');
  const end = format(event.endTime, 'HH:mm');
  
  return `${start} - ${end}`;
}

// ===============================================
// ACCESSIBILITY UTILITIES
// ===============================================

/**
 * Generate accessible label for a calendar cell
 */
export function getAccessibleCellLabel(cell: CalendarGridCell): string {
  const dateLabel = format(cell.date, 'EEEE, MMMM d, yyyy');
  const timeLabel = cell.timeSlot ? formatTimeSlot(cell.timeSlot) : '';
  const eventCount = cell.events.length;
  
  let label = timeLabel ? `${dateLabel}, ${timeLabel}` : dateLabel;
  
  if (cell.isToday) {
    label += ', today';
  }
  
  if (eventCount > 0) {
    label += `, ${eventCount} event${eventCount === 1 ? '' : 's'}`;
  }
  
  return label;
}

/**
 * Generate accessible label for an event
 */
export function getAccessibleEventLabel(event: ScheduleObject): string {
  const timeRange = getEventTimeRange(event);
  const duration = formatEventDuration(event);
  
  return `${event.title}, ${timeRange}, ${duration}, ${event.type}, ${event.status}`;
}
