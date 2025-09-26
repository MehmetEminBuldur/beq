/**
 * DropEnabledTimeSlot Component
 * 
 * Enhanced time slot component with comprehensive drop target capabilities
 */

'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, addMinutes, isWithinInterval, isBefore, isAfter } from 'date-fns';

import { TimeSlot } from './TimeSlot';
import { ScheduleObject, TimeSlotConfig, CalendarGridCell } from '@/lib/calendar/types';
import { GRID_DIMENSIONS } from '@/lib/calendar/constants';

export interface DropSlotConfig {
  snapInterval: number; // minutes
  minDuration: number; // minutes
  maxDuration: number; // minutes
  allowOverlap: boolean;
  allowConflicts: boolean;
  requireFullSlot: boolean;
}

export interface DropResult {
  success: boolean;
  timeSlot: {
    startTime: Date;
    endTime: Date;
  };
  position: {
    x: number;
    y: number;
  };
  conflicts: ScheduleObject[];
  snappedTime: Date;
  error?: string;
}

interface DropEnabledTimeSlotProps {
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  events?: ScheduleObject[];
  gridCell?: CalendarGridCell;
  timeSlotConfig?: TimeSlotConfig;
  dropConfig?: DropSlotConfig;
  isHighlighted?: boolean;
  isCurrentTime?: boolean;
  onDrop?: (result: DropResult, droppedObject: ScheduleObject) => void;
  onDropHover?: (isHovering: boolean, timeSlot: { startTime: Date; endTime: Date }) => void;
  onDropPreview?: (previewTime: Date, droppedObject: ScheduleObject) => void;
  className?: string;
  children?: React.ReactNode;
}

export function DropEnabledTimeSlot({
  startTime,
  endTime,
  duration,
  events = [],
  gridCell,
  timeSlotConfig,
  dropConfig = {
    snapInterval: 15,
    minDuration: 15,
    maxDuration: 480, // 8 hours
    allowOverlap: false,
    allowConflicts: false,
    requireFullSlot: false,
  },
  isHighlighted = false,
  isCurrentTime = false,
  onDrop,
  onDropHover,
  onDropPreview,
  className = '',
  children,
}: DropEnabledTimeSlotProps) {

  // State
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [previewTime, setPreviewTime] = useState<Date | null>(null);
  const [dropValidation, setDropValidation] = useState<{
    isValid: boolean;
    reason?: string;
    conflicts: ScheduleObject[];
  }>({ isValid: true, conflicts: [] });

  // Refs
  const slotRef = useRef<HTMLDivElement>(null);

  // Calculate snap times within this slot
  const snapTimes = useMemo(() => {
    const times: Date[] = [];
    let currentTime = new Date(startTime);
    
    while (currentTime < endTime) {
      times.push(new Date(currentTime));
      currentTime = addMinutes(currentTime, dropConfig.snapInterval);
    }
    
    return times;
  }, [startTime, endTime, dropConfig.snapInterval]);

  // Find the closest snap time to a given position
  const getSnapTimeFromPosition = useCallback((clientY: number): Date => {
    if (!slotRef.current) return startTime;
    
    const rect = slotRef.current.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    const slotHeight = rect.height;
    
    // Calculate percentage within the slot
    const percentage = Math.max(0, Math.min(1, relativeY / slotHeight));
    
    // Find closest snap time
    const totalSlotMinutes = duration;
    const positionMinutes = percentage * totalSlotMinutes;
    const snapIndex = Math.round(positionMinutes / dropConfig.snapInterval);
    const clampedIndex = Math.max(0, Math.min(snapTimes.length - 1, snapIndex));
    
    return snapTimes[clampedIndex] || startTime;
  }, [startTime, duration, dropConfig.snapInterval, snapTimes]);

  // Detect conflicts with existing events
  const detectConflicts = useCallback((
    dropStartTime: Date, 
    dropEndTime: Date, 
    droppedObject?: ScheduleObject
  ): ScheduleObject[] => {
    return events.filter(event => {
      // Don't conflict with self if updating
      if (droppedObject && event.id === droppedObject.id) {
        return false;
      }
      
      // Check for time overlap
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      
      return (
        (dropStartTime >= eventStart && dropStartTime < eventEnd) ||
        (dropEndTime > eventStart && dropEndTime <= eventEnd) ||
        (dropStartTime <= eventStart && dropEndTime >= eventEnd)
      );
    });
  }, [events]);

  // Validate drop operation
  const validateDrop = useCallback((
    dropTime: Date,
    droppedObject: ScheduleObject
  ): { isValid: boolean; reason?: string; conflicts: ScheduleObject[] } => {
    // Calculate object duration
    const objectDuration = (new Date(droppedObject.endTime).getTime() - new Date(droppedObject.startTime).getTime()) / (1000 * 60);
    const dropEndTime = addMinutes(dropTime, objectDuration);
    
    // Check if duration is within limits
    if (objectDuration < dropConfig.minDuration) {
      return { 
        isValid: false, 
        reason: `Duration too short (${objectDuration}min < ${dropConfig.minDuration}min)`,
        conflicts: []
      };
    }
    
    if (objectDuration > dropConfig.maxDuration) {
      return { 
        isValid: false, 
        reason: `Duration too long (${objectDuration}min > ${dropConfig.maxDuration}min)`,
        conflicts: []
      };
    }
    
    // Check if it fits within the slot
    if (dropConfig.requireFullSlot && (dropTime < startTime || dropEndTime > endTime)) {
      return { 
        isValid: false, 
        reason: 'Object must fit entirely within time slot',
        conflicts: []
      };
    }
    
    // Check for conflicts
    const conflicts = detectConflicts(dropTime, dropEndTime, droppedObject);
    
    if (!dropConfig.allowConflicts && conflicts.length > 0) {
      return { 
        isValid: false, 
        reason: `Conflicts with ${conflicts.length} existing event${conflicts.length === 1 ? '' : 's'}`,
        conflicts
      };
    }
    
    return { isValid: true, conflicts };
  }, [
    startTime, 
    endTime, 
    dropConfig.minDuration, 
    dropConfig.maxDuration, 
    dropConfig.requireFullSlot, 
    dropConfig.allowConflicts, 
    detectConflicts
  ]);

  // Handle drag enter
  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
    onDropHover?.(true, { startTime, endTime });
  }, [startTime, endTime, onDropHover]);

  // Handle drag over
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    
    const snapTime = getSnapTimeFromPosition(event.clientY);
    const position = { x: event.clientX, y: event.clientY };
    
    setDragPosition(position);
    setPreviewTime(snapTime);
    
    // Get dragged object from dataTransfer (if available)
    try {
      const dragData = event.dataTransfer.getData('application/json');
      if (dragData) {
        const droppedObject = JSON.parse(dragData) as ScheduleObject;
        const validation = validateDrop(snapTime, droppedObject);
        setDropValidation(validation);
        onDropPreview?.(snapTime, droppedObject);
      }
    } catch (error) {
      // Fallback validation without object data
      setDropValidation({ isValid: true, conflicts: [] });
    }
  }, [getSnapTimeFromPosition, validateDrop, onDropPreview]);

  // Handle drag leave
  const handleDragLeave = useCallback((event: React.DragEvent) => {
    // Only trigger if leaving the slot completely
    if (!slotRef.current?.contains(event.relatedTarget as Node)) {
      setIsDragOver(false);
      setDragPosition(null);
      setPreviewTime(null);
      setDropValidation({ isValid: true, conflicts: [] });
      onDropHover?.(false, { startTime, endTime });
    }
  }, [startTime, endTime, onDropHover]);

  // Handle drop
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    
    setIsDragOver(false);
    setDragPosition(null);
    setPreviewTime(null);
    
    try {
      const dragData = event.dataTransfer.getData('application/json');
      if (!dragData) {
        console.warn('No drag data available');
        return;
      }
      
      const droppedObject = JSON.parse(dragData) as ScheduleObject;
      const snapTime = getSnapTimeFromPosition(event.clientY);
      const objectDuration = (new Date(droppedObject.endTime).getTime() - new Date(droppedObject.startTime).getTime()) / (1000 * 60);
      const dropEndTime = addMinutes(snapTime, objectDuration);
      
      const validation = validateDrop(snapTime, droppedObject);
      
      const result: DropResult = {
        success: validation.isValid,
        timeSlot: {
          startTime: snapTime,
          endTime: dropEndTime,
        },
        position: { x: event.clientX, y: event.clientY },
        conflicts: validation.conflicts,
        snappedTime: snapTime,
        error: validation.reason,
      };
      
      onDrop?.(result, droppedObject);
      
    } catch (error) {
      console.error('Error handling drop:', error);
      
      const errorResult: DropResult = {
        success: false,
        timeSlot: { startTime, endTime },
        position: { x: event.clientX, y: event.clientY },
        conflicts: [],
        snappedTime: startTime,
        error: 'Failed to process dropped object',
      };
      
      onDrop?.(errorResult, {} as ScheduleObject);
    }
    
    setDropValidation({ isValid: true, conflicts: [] });
    onDropHover?.(false, { startTime, endTime });
  }, [startTime, endTime, getSnapTimeFromPosition, validateDrop, onDrop, onDropHover]);

  // Get drop target styling
  const getDropTargetClasses = () => {
    const baseClasses = 'transition-all duration-200';
    
    if (!isDragOver) return baseClasses;
    
    if (dropValidation.isValid) {
      return `${baseClasses} bg-green-50 border-green-300 border-2 border-dashed shadow-lg`;
    } else {
      return `${baseClasses} bg-red-50 border-red-300 border-2 border-dashed shadow-lg`;
    }
  };

  return (
    <div
      ref={slotRef}
      data-drop-target
      data-time-slot={JSON.stringify({ startTime, endTime })}
      data-drop-label={`Time slot ${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`}
      data-drop-disabled={!dropValidation.isValid}
      className={`
        drop-enabled-time-slot relative
        ${getDropTargetClasses()}
        ${isHighlighted ? 'ring-2 ring-primary-300' : ''}
        ${className}
      `}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Base TimeSlot component */}
      <TimeSlot
        startTime={startTime}
        endTime={endTime}
        events={events}
        isHighlighted={isHighlighted || isDragOver}
        isCurrentTime={isCurrentTime}
        className="pointer-events-none"
      >
        {children}
      </TimeSlot>

      {/* Drop preview indicator */}
      {isDragOver && previewTime && (
        <motion.div
          className="absolute left-0 right-0 z-20 pointer-events-none"
          style={{
            top: `${((previewTime.getTime() - startTime.getTime()) / (endTime.getTime() - startTime.getTime())) * 100}%`,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          <div className={`
            h-1 rounded-full
            ${dropValidation.isValid ? 'bg-green-500' : 'bg-red-500'}
          `} />
          <div className={`
            text-xs font-medium px-2 py-1 rounded mt-1
            ${dropValidation.isValid 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
            }
          `}>
            {dropValidation.isValid 
              ? `Drop at ${format(previewTime, 'HH:mm')}` 
              : dropValidation.reason || 'Invalid drop'
            }
          </div>
        </motion.div>
      )}

      {/* Snap indicators (show on hover) */}
      {isDragOver && (
        <div className="absolute inset-0 pointer-events-none">
          {snapTimes.map((snapTime, index) => (
            <div
              key={index}
              className="absolute left-0 right-0 h-px bg-gray-300 opacity-50"
              style={{
                top: `${((snapTime.getTime() - startTime.getTime()) / (endTime.getTime() - startTime.getTime())) * 100}%`,
              }}
            />
          ))}
        </div>
      )}

      {/* Conflict indicators */}
      {isDragOver && dropValidation.conflicts.length > 0 && (
        <div className="absolute top-2 right-2 z-30">
          <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
            {dropValidation.conflicts.length} conflict{dropValidation.conflicts.length === 1 ? '' : 's'}
          </div>
        </div>
      )}
    </div>
  );
}

export default DropEnabledTimeSlot;
