/**
 * Conflict Detection System
 * 
 * Comprehensive conflict detection and resolution for calendar events
 */

import { addMinutes, isWithinInterval, isBefore, isAfter, format, differenceInMinutes } from 'date-fns';
import { ScheduleObject } from '@/lib/calendar/types';

export interface ConflictDetectionConfig {
  allowOverlap: boolean;
  bufferMinutes: number; // minimum time between events
  maxConflictsAllowed: number;
  priorityLevels: {
    high: number;
    medium: number;
    low: number;
  };
  conflictTypes: {
    hardConflict: boolean; // complete overlap
    softConflict: boolean; // partial overlap
    bufferConflict: boolean; // within buffer time
  };
}

export interface ConflictResult {
  hasConflicts: boolean;
  conflicts: ConflictInfo[];
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  resolutionSuggestions: ResolutionSuggestion[];
  isDropAllowed: boolean;
  warningMessage?: string;
}

export interface ConflictInfo {
  type: 'hard' | 'soft' | 'buffer';
  conflictingEvent: ScheduleObject;
  overlapStart: Date;
  overlapEnd: Date;
  overlapDuration: number; // minutes
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface ResolutionSuggestion {
  type: 'reschedule' | 'shorten' | 'split' | 'replace' | 'ignore';
  description: string;
  suggestedTime?: Date;
  suggestedDuration?: number;
  affectedEvents: string[]; // event IDs
  confidence: number; // 0-1
}

// Default configuration
export const DEFAULT_CONFLICT_CONFIG: ConflictDetectionConfig = {
  allowOverlap: false,
  bufferMinutes: 0,
  maxConflictsAllowed: 0,
  priorityLevels: {
    high: 3,
    medium: 2,
    low: 1,
  },
  conflictTypes: {
    hardConflict: true,
    softConflict: true,
    bufferConflict: false,
  },
};

/**
 * Detect conflicts when dropping an object at a specific time
 */
export function detectConflicts(
  droppedObject: ScheduleObject,
  dropTime: Date,
  existingEvents: ScheduleObject[],
  config: ConflictDetectionConfig = DEFAULT_CONFLICT_CONFIG
): ConflictResult {
  // Calculate drop time range
  const objectDuration = differenceInMinutes(
    new Date(droppedObject.endTime), 
    new Date(droppedObject.startTime)
  );
  const dropEndTime = addMinutes(dropTime, objectDuration);
  
  const conflicts: ConflictInfo[] = [];
  const resolutionSuggestions: ResolutionSuggestion[] = [];
  
  // Check each existing event for conflicts
  existingEvents.forEach(event => {
    // Don't conflict with self if updating
    if (event.id === droppedObject.id) return;
    
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    
    // Check for different types of conflicts
    const conflictInfo = analyzeConflict(
      dropTime,
      dropEndTime,
      eventStart,
      eventEnd,
      event,
      config
    );
    
    if (conflictInfo) {
      conflicts.push(conflictInfo);
    }
  });
  
  // Calculate severity
  const severity = calculateSeverity(conflicts, droppedObject, config);
  
  // Generate resolution suggestions
  if (conflicts.length > 0) {
    resolutionSuggestions.push(
      ...generateResolutionSuggestions(
        droppedObject,
        dropTime,
        conflicts,
        existingEvents,
        config
      )
    );
  }
  
  // Determine if drop is allowed
  const isDropAllowed = shouldAllowDrop(conflicts, severity, config);
  
  // Generate warning message
  const warningMessage = generateWarningMessage(conflicts, severity);
  
  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    severity,
    resolutionSuggestions,
    isDropAllowed,
    warningMessage,
  };
}

/**
 * Analyze conflict between two time ranges
 */
function analyzeConflict(
  dropStart: Date,
  dropEnd: Date,
  eventStart: Date,
  eventEnd: Date,
  event: ScheduleObject,
  config: ConflictDetectionConfig
): ConflictInfo | null {
  // Check for time overlap
  const overlapStart = new Date(Math.max(dropStart.getTime(), eventStart.getTime()));
  const overlapEnd = new Date(Math.min(dropEnd.getTime(), eventEnd.getTime()));
  
  if (overlapStart >= overlapEnd) {
    // No overlap, check buffer conflict
    if (config.conflictTypes.bufferConflict && config.bufferMinutes > 0) {
      const gapBefore = differenceInMinutes(dropStart, eventEnd);
      const gapAfter = differenceInMinutes(eventStart, dropEnd);
      
      if ((gapBefore >= 0 && gapBefore < config.bufferMinutes) ||
          (gapAfter >= 0 && gapAfter < config.bufferMinutes)) {
        return {
          type: 'buffer',
          conflictingEvent: event,
          overlapStart: gapBefore >= 0 ? eventEnd : dropEnd,
          overlapEnd: gapBefore >= 0 ? dropStart : eventStart,
          overlapDuration: Math.min(gapBefore >= 0 ? gapBefore : gapAfter, config.bufferMinutes),
          severity: 'low',
          description: `Too close to "${event.title}" (${config.bufferMinutes}min buffer needed)`,
        };
      }
    }
    return null; // No conflict
  }
  
  const overlapDuration = differenceInMinutes(overlapEnd, overlapStart);
  const dropDuration = differenceInMinutes(dropEnd, dropStart);
  const eventDuration = differenceInMinutes(eventEnd, eventStart);
  
  // Determine conflict type
  let conflictType: 'hard' | 'soft';
  if ((overlapStart.getTime() === dropStart.getTime() && overlapEnd.getTime() === dropEnd.getTime()) ||
      (overlapStart.getTime() === eventStart.getTime() && overlapEnd.getTime() === eventEnd.getTime())) {
    conflictType = 'hard'; // Complete overlap
  } else {
    conflictType = 'soft'; // Partial overlap
  }
  
  // Check if this conflict type is enabled
  if ((conflictType === 'hard' && !config.conflictTypes.hardConflict) ||
      (conflictType === 'soft' && !config.conflictTypes.softConflict)) {
    return null;
  }
  
  // Calculate severity based on overlap percentage and priority
  const overlapPercentage = Math.max(
    overlapDuration / dropDuration,
    overlapDuration / eventDuration
  );
  
  let severity: 'low' | 'medium' | 'high';
  if (overlapPercentage >= 0.75 || conflictType === 'hard') {
    severity = 'high';
  } else if (overlapPercentage >= 0.25) {
    severity = 'medium';
  } else {
    severity = 'low';
  }
  
  // Adjust severity based on event priority
  const eventPriority = getEventPriority(event, config);
  if (eventPriority >= config.priorityLevels.high && severity === 'low') {
    severity = 'medium';
  }
  
  return {
    type: conflictType,
    conflictingEvent: event,
    overlapStart,
    overlapEnd,
    overlapDuration,
    severity,
    description: generateConflictDescription(conflictType, event, overlapDuration),
  };
}

/**
 * Calculate overall conflict severity
 */
function calculateSeverity(
  conflicts: ConflictInfo[],
  droppedObject: ScheduleObject,
  config: ConflictDetectionConfig
): 'none' | 'low' | 'medium' | 'high' | 'critical' {
  if (conflicts.length === 0) return 'none';
  
  const highConflicts = conflicts.filter(c => c.severity === 'high').length;
  const mediumConflicts = conflicts.filter(c => c.severity === 'medium').length;
  const hardConflicts = conflicts.filter(c => c.type === 'hard').length;
  
  if (hardConflicts > 0 || highConflicts >= 2) {
    return 'critical';
  } else if (highConflicts > 0 || conflicts.length > config.maxConflictsAllowed + 2) {
    return 'high';
  } else if (mediumConflicts > 0 || conflicts.length > config.maxConflictsAllowed) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Generate resolution suggestions
 */
function generateResolutionSuggestions(
  droppedObject: ScheduleObject,
  dropTime: Date,
  conflicts: ConflictInfo[],
  existingEvents: ScheduleObject[],
  config: ConflictDetectionConfig
): ResolutionSuggestion[] {
  const suggestions: ResolutionSuggestion[] = [];
  const objectDuration = differenceInMinutes(
    new Date(droppedObject.endTime), 
    new Date(droppedObject.startTime)
  );
  
  // Suggestion 1: Find next available time slot
  const nextAvailable = findNextAvailableTime(
    dropTime,
    objectDuration,
    existingEvents,
    droppedObject.id
  );
  
  if (nextAvailable) {
    suggestions.push({
      type: 'reschedule',
      description: `Reschedule to ${format(nextAvailable, 'HH:mm')} (next available slot)`,
      suggestedTime: nextAvailable,
      affectedEvents: [droppedObject.id],
      confidence: 0.9,
    });
  }
  
  // Suggestion 2: Shorten the event to fit
  const availableTime = findAvailableTimeInSlot(dropTime, conflicts);
  if (availableTime > 15) { // At least 15 minutes
    suggestions.push({
      type: 'shorten',
      description: `Shorten to ${availableTime} minutes to avoid conflicts`,
      suggestedDuration: availableTime,
      affectedEvents: [droppedObject.id],
      confidence: 0.7,
    });
  }
  
  // Suggestion 3: Move conflicting events (if low priority)
  const lowPriorityConflicts = conflicts.filter(c => 
    getEventPriority(c.conflictingEvent, config) < getEventPriority(droppedObject, config)
  );
  
  if (lowPriorityConflicts.length > 0) {
    suggestions.push({
      type: 'replace',
      description: `Move ${lowPriorityConflicts.length} lower priority event${lowPriorityConflicts.length === 1 ? '' : 's'}`,
      affectedEvents: lowPriorityConflicts.map(c => c.conflictingEvent.id),
      confidence: 0.6,
    });
  }
  
  // Suggestion 4: Allow overlap (if soft conflicts only)
  const hasHardConflicts = conflicts.some(c => c.type === 'hard');
  if (!hasHardConflicts && config.allowOverlap) {
    suggestions.push({
      type: 'ignore',
      description: 'Allow overlap (events can run simultaneously)',
      affectedEvents: [droppedObject.id],
      confidence: 0.5,
    });
  }
  
  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Determine if drop should be allowed despite conflicts
 */
function shouldAllowDrop(
  conflicts: ConflictInfo[],
  severity: string,
  config: ConflictDetectionConfig
): boolean {
  if (conflicts.length === 0) return true;
  if (!config.allowOverlap && conflicts.some(c => c.type === 'hard')) return false;
  if (conflicts.length > config.maxConflictsAllowed && config.maxConflictsAllowed > 0) return false;
  if (severity === 'critical') return false;
  
  return true;
}

/**
 * Get event priority value
 */
function getEventPriority(event: ScheduleObject, config: ConflictDetectionConfig): number {
  const priority = event.priority || 'medium';
  return config.priorityLevels[priority as keyof typeof config.priorityLevels] || config.priorityLevels.medium;
}

/**
 * Generate warning message
 */
function generateWarningMessage(conflicts: ConflictInfo[], severity: string): string | undefined {
  if (conflicts.length === 0) return undefined;
  
  const conflictCount = conflicts.length;
  const hardConflicts = conflicts.filter(c => c.type === 'hard').length;
  
  if (severity === 'critical') {
    return `Critical conflicts detected with ${conflictCount} event${conflictCount === 1 ? '' : 's'}. Drop not allowed.`;
  } else if (severity === 'high') {
    return `High conflict risk with ${conflictCount} event${conflictCount === 1 ? '' : 's'}. Consider rescheduling.`;
  } else if (hardConflicts > 0) {
    return `Complete overlap with ${hardConflicts} event${hardConflicts === 1 ? '' : 's'}.`;
  } else {
    return `Partial overlap with ${conflictCount} event${conflictCount === 1 ? '' : 's'}.`;
  }
}

/**
 * Generate conflict description
 */
function generateConflictDescription(type: string, event: ScheduleObject, duration: number): string {
  const eventTitle = event.title || 'Untitled event';
  const durationText = duration > 60 
    ? `${Math.round(duration / 60 * 10) / 10}h` 
    : `${duration}m`;
  
  switch (type) {
    case 'hard':
      return `Complete overlap with "${eventTitle}"`;
    case 'soft':
      return `${durationText} overlap with "${eventTitle}"`;
    case 'buffer':
      return `Too close to "${eventTitle}" (buffer needed)`;
    default:
      return `Conflicts with "${eventTitle}"`;
  }
}

/**
 * Find next available time slot
 */
function findNextAvailableTime(
  preferredStart: Date,
  duration: number,
  existingEvents: ScheduleObject[],
  excludeEventId?: string,
  maxSearchHours: number = 24
): Date | null {
  const searchEnd = addMinutes(preferredStart, maxSearchHours * 60);
  let current = new Date(preferredStart);
  
  while (current <= searchEnd) {
    const slotEnd = addMinutes(current, duration);
    
    const hasConflict = existingEvents.some(event => {
      if (excludeEventId && event.id === excludeEventId) return false;
      
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      
      return (
        (current >= eventStart && current < eventEnd) ||
        (slotEnd > eventStart && slotEnd <= eventEnd) ||
        (current <= eventStart && slotEnd >= eventEnd)
      );
    });
    
    if (!hasConflict) {
      return current;
    }
    
    current = addMinutes(current, 15); // Check every 15 minutes
  }
  
  return null;
}

/**
 * Find available time within a slot considering conflicts
 */
function findAvailableTimeInSlot(startTime: Date, conflicts: ConflictInfo[]): number {
  if (conflicts.length === 0) return 480; // 8 hours max
  
  // Find the earliest conflict
  const earliestConflict = conflicts.reduce((earliest, conflict) => 
    conflict.overlapStart < earliest.overlapStart ? conflict : earliest
  );
  
  const availableMinutes = differenceInMinutes(earliestConflict.overlapStart, startTime);
  return Math.max(0, availableMinutes);
}

export default {
  detectConflicts,
  DEFAULT_CONFLICT_CONFIG,
};
