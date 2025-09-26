/**
 * Calendar Drop Hook
 * 
 * Centralized hook for handling drop operations on calendar with validation and API integration
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';

import { ScheduleObject } from '@/lib/calendar/types';
import { detectConflicts, ConflictResult, DEFAULT_CONFLICT_CONFIG } from '@/lib/calendar/conflict-detection';
import { snapTimeToInterval, DEFAULT_SNAP_CONFIG, calculateDropPosition } from '@/lib/calendar/time-snapping';
import { DropResult } from '@/components/calendar/DropEnabledTimeSlot';

export interface CalendarDropState {
  isDragOver: boolean;
  draggedObject: ScheduleObject | null;
  hoveredSlot: {
    startTime: Date;
    endTime: Date;
  } | null;
  previewTime: Date | null;
  conflictResult: ConflictResult | null;
  isProcessing: boolean;
}

export interface DropValidationResult {
  isValid: boolean;
  conflicts: ConflictResult;
  snappedTime: Date;
  canDrop: boolean;
  warnings: string[];
  suggestions: string[];
}

interface UseCalendarDropOptions {
  existingEvents: ScheduleObject[];
  onEventUpdate?: (object: ScheduleObject) => Promise<void>;
  onEventCreate?: (object: ScheduleObject) => Promise<void>;
  onEventMove?: (fromTime: Date, toTime: Date, object: ScheduleObject) => Promise<void>;
  allowConflicts?: boolean;
  snapInterval?: number; // minutes
  showConflictWarnings?: boolean;
  autoResolveConflicts?: boolean;
}

export function useCalendarDrop({
  existingEvents,
  onEventUpdate,
  onEventCreate,
  onEventMove,
  allowConflicts = false,
  snapInterval = 15,
  showConflictWarnings = true,
  autoResolveConflicts = false,
}: UseCalendarDropOptions) {

  // State
  const [dropState, setDropState] = useState<CalendarDropState>({
    isDragOver: false,
    draggedObject: null,
    hoveredSlot: null,
    previewTime: null,
    conflictResult: null,
    isProcessing: false,
  });

  // Refs
  const dropStateRef = useRef(dropState);
  dropStateRef.current = dropState;

  // Validate drop operation
  const validateDrop = useCallback((
    object: ScheduleObject,
    dropTime: Date
  ): DropValidationResult => {
    // Snap time to configured interval
    const snapResult = snapTimeToInterval(dropTime, {
      ...DEFAULT_SNAP_CONFIG,
      interval: snapInterval,
    });

    const snappedTime = snapResult.snappedTime;

    // Detect conflicts
    const conflictConfig = {
      ...DEFAULT_CONFLICT_CONFIG,
      allowOverlap: allowConflicts,
    };

    const conflicts = detectConflicts(object, snappedTime, existingEvents, conflictConfig);

    // Determine if drop is allowed
    const canDrop = conflicts.isDropAllowed || allowConflicts;

    // Generate warnings and suggestions
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (conflicts.hasConflicts) {
      warnings.push(conflicts.warningMessage || 'Conflicts detected');
      
      conflicts.resolutionSuggestions.forEach(suggestion => {
        suggestions.push(suggestion.description);
      });
    }

    if (!snapResult.isWorkingHours) {
      warnings.push('Outside working hours');
    }

    if (!snapResult.isAllowedDay) {
      warnings.push('Not an allowed day');
    }

    return {
      isValid: canDrop && warnings.length === 0,
      conflicts,
      snappedTime,
      canDrop,
      warnings,
      suggestions,
    };
  }, [existingEvents, allowConflicts, snapInterval]);

  // Handle drop preview (when dragging over)
  const handleDropPreview = useCallback((
    object: ScheduleObject,
    dropTime: Date,
    slotInfo: { startTime: Date; endTime: Date }
  ) => {
    const validation = validateDrop(object, dropTime);

    setDropState(prev => ({
      ...prev,
      draggedObject: object,
      hoveredSlot: slotInfo,
      previewTime: validation.snappedTime,
      conflictResult: validation.conflicts,
    }));
  }, [validateDrop]);

  // Handle entering a drop zone
  const handleDropEnter = useCallback((
    slotInfo: { startTime: Date; endTime: Date }
  ) => {
    setDropState(prev => ({
      ...prev,
      isDragOver: true,
      hoveredSlot: slotInfo,
    }));
  }, []);

  // Handle leaving a drop zone
  const handleDropLeave = useCallback(() => {
    setDropState(prev => ({
      ...prev,
      isDragOver: false,
      hoveredSlot: null,
      previewTime: null,
      conflictResult: null,
    }));
  }, []);

  // Handle actual drop
  const handleDrop = useCallback(async (
    dropResult: DropResult,
    droppedObject: ScheduleObject
  ): Promise<boolean> => {
    if (!dropResult.success) {
      if (showConflictWarnings) {
        toast.error(dropResult.error || 'Drop failed');
      }
      return false;
    }

    setDropState(prev => ({
      ...prev,
      isProcessing: true,
    }));

    try {
      // Validate the drop one more time
      const validation = validateDrop(droppedObject, dropResult.snappedTime);

      if (!validation.canDrop && !allowConflicts) {
        if (showConflictWarnings) {
          toast.error('Cannot drop here: ' + validation.warnings.join(', '));
        }
        return false;
      }

      // Show conflict warnings if enabled
      if (showConflictWarnings && validation.warnings.length > 0) {
        validation.warnings.forEach(warning => {
          toast.warning(warning);
        });
      }

      // Auto-resolve conflicts if enabled
      if (autoResolveConflicts && validation.conflicts.resolutionSuggestions.length > 0) {
        const bestSuggestion = validation.conflicts.resolutionSuggestions[0];
        
        if (bestSuggestion.type === 'reschedule' && bestSuggestion.suggestedTime) {
          dropResult.timeSlot.startTime = bestSuggestion.suggestedTime;
          dropResult.timeSlot.endTime = new Date(
            bestSuggestion.suggestedTime.getTime() + 
            (new Date(droppedObject.endTime).getTime() - new Date(droppedObject.startTime).getTime())
          );
          
          toast.success(`Rescheduled to ${bestSuggestion.suggestedTime.toLocaleTimeString()}`);
        }
      }

      // Create updated object with new time
      const updatedObject: ScheduleObject = {
        ...droppedObject,
        startTime: dropResult.timeSlot.startTime,
        endTime: dropResult.timeSlot.endTime,
      };

      // Determine if this is a new event or an update
      const existingEvent = existingEvents.find(e => e.id === droppedObject.id);
      
      if (existingEvent) {
        // Update existing event
        await onEventUpdate?.(updatedObject);
        
        if (onEventMove) {
          await onEventMove(
            new Date(existingEvent.startTime),
            dropResult.timeSlot.startTime,
            updatedObject
          );
        }
        
        toast.success(`Moved "${droppedObject.title}" to ${dropResult.timeSlot.startTime.toLocaleTimeString()}`);
      } else {
        // Create new event
        await onEventCreate?.(updatedObject);
        toast.success(`Scheduled "${droppedObject.title}" at ${dropResult.timeSlot.startTime.toLocaleTimeString()}`);
      }

      return true;

    } catch (error) {
      console.error('Drop operation failed:', error);
      
      if (showConflictWarnings) {
        toast.error('Failed to update schedule: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
      
      return false;

    } finally {
      setDropState(prev => ({
        ...prev,
        isProcessing: false,
        isDragOver: false,
        draggedObject: null,
        hoveredSlot: null,
        previewTime: null,
        conflictResult: null,
      }));
    }
  }, [
    validateDrop,
    allowConflicts,
    showConflictWarnings,
    autoResolveConflicts,
    existingEvents,
    onEventUpdate,
    onEventCreate,
    onEventMove,
  ]);

  // Get current drop feedback for UI
  const getDropFeedback = useCallback(() => {
    const { conflictResult, previewTime, isDragOver } = dropStateRef.current;

    if (!isDragOver || !previewTime) {
      return {
        isValid: false,
        message: '',
        severity: 'none' as const,
      };
    }

    if (!conflictResult) {
      return {
        isValid: true,
        message: `Drop at ${previewTime.toLocaleTimeString()}`,
        severity: 'none' as const,
      };
    }

    const message = conflictResult.warningMessage || 
      (conflictResult.hasConflicts 
        ? `${conflictResult.conflicts.length} conflict${conflictResult.conflicts.length === 1 ? '' : 's'}`
        : `Drop at ${previewTime.toLocaleTimeString()}`
      );

    return {
      isValid: conflictResult.isDropAllowed,
      message,
      severity: conflictResult.severity,
    };
  }, []);

  // Get conflict resolution suggestions for UI
  const getResolutionSuggestions = useCallback(() => {
    const { conflictResult } = dropStateRef.current;
    return conflictResult?.resolutionSuggestions || [];
  }, []);

  // Apply a resolution suggestion
  const applyResolution = useCallback(async (suggestionIndex: number) => {
    const { conflictResult, draggedObject } = dropStateRef.current;
    
    if (!conflictResult || !draggedObject || suggestionIndex >= conflictResult.resolutionSuggestions.length) {
      return false;
    }

    const suggestion = conflictResult.resolutionSuggestions[suggestionIndex];

    try {
      setDropState(prev => ({ ...prev, isProcessing: true }));

      switch (suggestion.type) {
        case 'reschedule':
          if (suggestion.suggestedTime) {
            const updatedObject = {
              ...draggedObject,
              startTime: suggestion.suggestedTime,
              endTime: new Date(
                suggestion.suggestedTime.getTime() + 
                (new Date(draggedObject.endTime).getTime() - new Date(draggedObject.startTime).getTime())
              ),
            };
            await onEventUpdate?.(updatedObject);
            toast.success('Event rescheduled successfully');
          }
          break;

        case 'shorten':
          if (suggestion.suggestedDuration) {
            const updatedObject = {
              ...draggedObject,
              endTime: new Date(
                new Date(draggedObject.startTime).getTime() + 
                (suggestion.suggestedDuration * 60 * 1000)
              ),
            };
            await onEventUpdate?.(updatedObject);
            toast.success('Event duration adjusted');
          }
          break;

        case 'ignore':
          // Allow the drop with conflicts
          toast.info('Conflicts ignored - events will overlap');
          break;

        default:
          toast.warning('Resolution type not implemented');
          return false;
      }

      return true;

    } catch (error) {
      toast.error('Failed to apply resolution');
      return false;

    } finally {
      setDropState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [onEventUpdate]);

  return {
    dropState,
    handleDropPreview,
    handleDropEnter,
    handleDropLeave,
    handleDrop,
    validateDrop,
    getDropFeedback,
    getResolutionSuggestions,
    applyResolution,
    isProcessing: dropState.isProcessing,
    hasConflicts: dropState.conflictResult?.hasConflicts || false,
  };
}
