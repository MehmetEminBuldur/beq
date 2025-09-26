/**
 * Time Snapping Utilities
 * 
 * Utilities for snapping times to intervals and handling time-based drag operations
 */

import { addMinutes, startOfHour, format, differenceInMinutes, isValid } from 'date-fns';

export interface TimeSnapConfig {
  interval: number; // minutes (5, 15, 30, 60)
  roundTo: 'nearest' | 'up' | 'down';
  respectHourBoundaries: boolean;
  workingHours?: {
    start: number; // hour (0-23)
    end: number;   // hour (0-23)
  };
  allowedDays?: number[]; // 0-6 (Sunday-Saturday)
}

export interface SnapResult {
  snappedTime: Date;
  originalTime: Date;
  difference: number; // minutes
  isWorkingHours: boolean;
  isAllowedDay: boolean;
  snapIntervals: Date[];
}

export interface TimeSlotBounds {
  startTime: Date;
  endTime: Date;
  availableSlots: Date[];
  occupiedSlots: Date[];
}

// Default snap configuration
export const DEFAULT_SNAP_CONFIG: TimeSnapConfig = {
  interval: 15,
  roundTo: 'nearest',
  respectHourBoundaries: false,
  workingHours: {
    start: 8,  // 8 AM
    end: 18,   // 6 PM
  },
};

/**
 * Snap a time to the nearest interval
 */
export function snapTimeToInterval(
  time: Date,
  config: TimeSnapConfig = DEFAULT_SNAP_CONFIG
): SnapResult {
  if (!isValid(time)) {
    throw new Error('Invalid date provided for time snapping');
  }

  const originalTime = new Date(time);
  
  // Get minute within the hour
  const minuteInHour = time.getMinutes();
  const hour = time.getHours();
  const day = time.getDay();
  
  // Calculate snap intervals for the hour
  const snapIntervals: Date[] = [];
  for (let minute = 0; minute < 60; minute += config.interval) {
    const snapTime = new Date(time);
    snapTime.setMinutes(minute, 0, 0);
    snapIntervals.push(snapTime);
  }
  
  // Add the next hour start if needed
  const nextHourStart = new Date(time);
  nextHourStart.setHours(hour + 1, 0, 0, 0);
  snapIntervals.push(nextHourStart);
  
  let snappedTime: Date;
  
  switch (config.roundTo) {
    case 'up':
      snappedTime = snapIntervals.find(interval => interval >= time) || snapIntervals[snapIntervals.length - 1];
      break;
      
    case 'down':
      snappedTime = snapIntervals.reverse().find(interval => interval <= time) || snapIntervals[0];
      break;
      
    case 'nearest':
    default:
      // Find the closest interval
      snappedTime = snapIntervals.reduce((closest, current) => {
        const currentDiff = Math.abs(current.getTime() - time.getTime());
        const closestDiff = Math.abs(closest.getTime() - time.getTime());
        return currentDiff < closestDiff ? current : closest;
      });
      break;
  }
  
  // Respect hour boundaries if configured
  if (config.respectHourBoundaries && snappedTime.getHours() !== hour) {
    // Snap to the end of current hour instead
    snappedTime = new Date(time);
    snappedTime.setMinutes(60 - config.interval, 0, 0);
  }
  
  // Check working hours
  const isWorkingHours = config.workingHours 
    ? hour >= config.workingHours.start && hour < config.workingHours.end
    : true;
  
  // Check allowed days
  const isAllowedDay = config.allowedDays 
    ? config.allowedDays.includes(day)
    : true;
  
  const difference = differenceInMinutes(snappedTime, originalTime);
  
  return {
    snappedTime,
    originalTime,
    difference,
    isWorkingHours,
    isAllowedDay,
    snapIntervals,
  };
}

/**
 * Generate snap points for a time range
 */
export function generateSnapPoints(
  startTime: Date,
  endTime: Date,
  interval: number = 15
): Date[] {
  const snapPoints: Date[] = [];
  let current = new Date(startTime);
  
  // Snap the start time to the nearest interval
  const startSnap = snapTimeToInterval(current, { 
    interval, 
    roundTo: 'down',
    respectHourBoundaries: false 
  });
  current = startSnap.snappedTime;
  
  while (current <= endTime) {
    snapPoints.push(new Date(current));
    current = addMinutes(current, interval);
  }
  
  return snapPoints;
}

/**
 * Check if a time slot is available (no conflicts)
 */
export function isTimeSlotAvailable(
  startTime: Date,
  endTime: Date,
  existingEvents: Array<{ startTime: Date | string; endTime: Date | string }>,
  excludeEventId?: string
): boolean {
  return !existingEvents.some(event => {
    // Skip if this is the event being moved
    if (excludeEventId && (event as any).id === excludeEventId) {
      return false;
    }
    
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    
    // Check for overlap
    return (
      (startTime >= eventStart && startTime < eventEnd) ||
      (endTime > eventStart && endTime <= eventEnd) ||
      (startTime <= eventStart && endTime >= eventEnd)
    );
  });
}

/**
 * Find the next available time slot of a given duration
 */
export function findNextAvailableSlot(
  preferredStart: Date,
  duration: number, // minutes
  existingEvents: Array<{ startTime: Date | string; endTime: Date | string }>,
  config: TimeSnapConfig = DEFAULT_SNAP_CONFIG
): Date | null {
  const maxSearchHours = 24; // Search up to 24 hours ahead
  const searchEnd = addMinutes(preferredStart, maxSearchHours * 60);
  
  let current = snapTimeToInterval(preferredStart, config).snappedTime;
  
  while (current <= searchEnd) {
    const slotEnd = addMinutes(current, duration);
    
    // Check working hours if configured
    if (config.workingHours) {
      const hour = current.getHours();
      if (hour < config.workingHours.start || hour >= config.workingHours.end) {
        current = addMinutes(current, config.interval);
        continue;
      }
    }
    
    // Check allowed days if configured
    if (config.allowedDays && !config.allowedDays.includes(current.getDay())) {
      current = addMinutes(current, config.interval);
      continue;
    }
    
    // Check if slot is available
    if (isTimeSlotAvailable(current, slotEnd, existingEvents)) {
      return current;
    }
    
    current = addMinutes(current, config.interval);
  }
  
  return null; // No available slot found
}

/**
 * Calculate optimal drop position within a time slot
 */
export function calculateDropPosition(
  mouseY: number,
  slotRect: DOMRect,
  slotStartTime: Date,
  slotDuration: number, // minutes
  objectDuration: number, // minutes
  snapInterval: number = 15
): {
  dropTime: Date;
  relativePosition: number; // 0-1
  canFitInSlot: boolean;
} {
  // Calculate relative position within the slot (0-1)
  const relativeY = Math.max(0, Math.min(1, (mouseY - slotRect.top) / slotRect.height));
  
  // Convert to minutes from slot start
  const positionMinutes = relativeY * slotDuration;
  
  // Snap to nearest interval
  const snappedMinutes = Math.round(positionMinutes / snapInterval) * snapInterval;
  
  // Calculate drop time
  const dropTime = addMinutes(slotStartTime, snappedMinutes);
  
  // Check if object fits in remaining slot time
  const remainingSlotTime = slotDuration - snappedMinutes;
  const canFitInSlot = objectDuration <= remainingSlotTime;
  
  return {
    dropTime,
    relativePosition: snappedMinutes / slotDuration,
    canFitInSlot,
  };
}

/**
 * Format time snap for display
 */
export function formatTimeSnap(time: Date): string {
  return format(time, 'HH:mm');
}

/**
 * Get snap interval options for UI
 */
export function getSnapIntervalOptions(): Array<{
  value: number;
  label: string;
  description: string;
}> {
  return [
    { value: 5, label: '5 minutes', description: 'Very precise scheduling' },
    { value: 15, label: '15 minutes', description: 'Standard scheduling (recommended)' },
    { value: 30, label: '30 minutes', description: 'Half-hour blocks' },
    { value: 60, label: '1 hour', description: 'Hour blocks only' },
  ];
}

/**
 * Validate time snap configuration
 */
export function validateSnapConfig(config: TimeSnapConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (config.interval <= 0 || config.interval > 1440) {
    errors.push('Interval must be between 1 and 1440 minutes');
  }
  
  if (config.interval > 60 && 60 % config.interval !== 0) {
    errors.push('Intervals greater than 60 minutes must be divisors of 60');
  }
  
  if (config.workingHours) {
    if (config.workingHours.start < 0 || config.workingHours.start > 23) {
      errors.push('Working hours start must be between 0 and 23');
    }
    if (config.workingHours.end < 0 || config.workingHours.end > 23) {
      errors.push('Working hours end must be between 0 and 23');
    }
    if (config.workingHours.start >= config.workingHours.end) {
      errors.push('Working hours start must be before end');
    }
  }
  
  if (config.allowedDays) {
    if (config.allowedDays.some(day => day < 0 || day > 6)) {
      errors.push('Allowed days must be between 0 (Sunday) and 6 (Saturday)');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export default {
  snapTimeToInterval,
  generateSnapPoints,
  isTimeSlotAvailable,
  findNextAvailableSlot,
  calculateDropPosition,
  formatTimeSnap,
  getSnapIntervalOptions,
  validateSnapConfig,
  DEFAULT_SNAP_CONFIG,
};
