/**
 * ResizableScheduleObject Component
 * 
 * Extends DraggableScheduleObject with resizing capabilities for duration adjustment
 */

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, GripVertical, MoreVertical } from 'lucide-react';

import { ScheduleObject } from '@/lib/calendar/types';
import { DraggableScheduleObject, DragResult } from './DraggableScheduleObject';

export interface ResizeState {
  isResizing: boolean;
  resizeDirection: 'top' | 'bottom' | null;
  originalDuration: number; // minutes
  startTime: Date;
  endTime: Date;
  minDuration: number;
  maxDuration: number;
}

export interface ResizeResult {
  success: boolean;
  updatedObject?: ScheduleObject;
  newStartTime?: Date;
  newEndTime?: Date;
  newDuration?: number; // minutes
  error?: string;
}

interface ResizableScheduleObjectProps {
  object: ScheduleObject;
  onDragStart?: (object: ScheduleObject, event: MouseEvent | TouchEvent | PointerEvent) => void;
  onDragMove?: (object: ScheduleObject, position: { x: number; y: number }) => void;
  onDragEnd?: (object: ScheduleObject, result: DragResult) => void;
  onResizeStart?: (object: ScheduleObject, direction: 'top' | 'bottom') => void;
  onResizeMove?: (object: ScheduleObject, newDuration: number, newStartTime: Date, newEndTime: Date) => void;
  onResizeEnd?: (object: ScheduleObject, result: ResizeResult) => void;
  enableResize?: boolean;
  minDurationMinutes?: number;
  maxDurationMinutes?: number;
  snapToMinutes?: number; // Snap resize to intervals (15, 30, etc.)
  showDragHandle?: boolean;
  enableKeyboardDrag?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function ResizableScheduleObject({
  object,
  onDragStart,
  onDragMove,
  onDragEnd,
  onResizeStart,
  onResizeMove,
  onResizeEnd,
  enableResize = true,
  minDurationMinutes = 15,
  maxDurationMinutes = 480, // 8 hours
  snapToMinutes = 15,
  showDragHandle = true,
  enableKeyboardDrag = true,
  disabled = false,
  className = '',
  children
}: ResizableScheduleObjectProps) {
  
  // State
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    resizeDirection: null,
    originalDuration: 0,
    startTime: object.startTime,
    endTime: object.endTime,
    minDuration: minDurationMinutes,
    maxDuration: maxDurationMinutes,
  });
  
  const [showDurationPreview, setShowDurationPreview] = useState(false);
  const [previewDuration, setPreviewDuration] = useState(0);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const topResizeHandleRef = useRef<HTMLDivElement>(null);
  const bottomResizeHandleRef = useRef<HTMLDivElement>(null);

  // Calculate current duration in minutes
  const getCurrentDuration = useCallback(() => {
    const diffMs = resizeState.endTime.getTime() - resizeState.startTime.getTime();
    return Math.round(diffMs / (1000 * 60));
  }, [resizeState.startTime, resizeState.endTime]);

  // Format duration for display
  const formatDuration = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  }, []);

  // Snap time to interval
  const snapTimeToInterval = useCallback((time: Date, intervalMinutes: number): Date => {
    const minutes = time.getMinutes();
    const snappedMinutes = Math.round(minutes / intervalMinutes) * intervalMinutes;
    const snappedTime = new Date(time);
    snappedTime.setMinutes(snappedMinutes, 0, 0);
    return snappedTime;
  }, []);

  // Handle resize start
  const handleResizeStart = useCallback((direction: 'top' | 'bottom', event: MouseEvent | TouchEvent) => {
    if (disabled || !enableResize) return;

    event.stopPropagation(); // Prevent drag from starting

    const currentDuration = getCurrentDuration();
    
    setResizeState({
      isResizing: true,
      resizeDirection: direction,
      originalDuration: currentDuration,
      startTime: object.startTime,
      endTime: object.endTime,
      minDuration: minDurationMinutes,
      maxDuration: maxDurationMinutes,
    });

    setShowDurationPreview(true);
    setPreviewDuration(currentDuration);
    
    onResizeStart?.(object, direction);

    // Add resize feedback class to body
    document.body.classList.add('resizing-schedule-object');
    document.body.style.cursor = 'ns-resize';
  }, [disabled, enableResize, getCurrentDuration, object, onResizeStart, minDurationMinutes, maxDurationMinutes]);

  // Handle resize move
  const handleResizeMove = useCallback((event: MouseEvent | TouchEvent) => {
    if (!resizeState.isResizing || disabled) return;

    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    // Get pointer position
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    // Calculate how many pixels moved from container top
    const pixelsFromTop = clientY - containerRect.top;
    
    // Convert pixels to time (assuming each hour is ~60px in the calendar grid)
    // This is a rough calculation - in a real implementation, you'd get this from the calendar grid
    const pixelsPerHour = 60;
    const hoursFromTop = pixelsFromTop / pixelsPerHour;
    
    let newStartTime = new Date(resizeState.startTime);
    let newEndTime = new Date(resizeState.endTime);

    if (resizeState.resizeDirection === 'top') {
      // Resize from top - adjust start time
      const baseTime = new Date(resizeState.endTime.getTime() - resizeState.originalDuration * 60 * 1000);
      newStartTime = new Date(baseTime.getTime() + hoursFromTop * 60 * 60 * 1000);
      
      // Snap to interval
      newStartTime = snapTimeToInterval(newStartTime, snapToMinutes);
      
      // Ensure minimum duration
      const newDuration = (newEndTime.getTime() - newStartTime.getTime()) / (1000 * 60);
      if (newDuration < minDurationMinutes) {
        newStartTime = new Date(newEndTime.getTime() - minDurationMinutes * 60 * 1000);
      } else if (newDuration > maxDurationMinutes) {
        newStartTime = new Date(newEndTime.getTime() - maxDurationMinutes * 60 * 1000);
      }
    } else if (resizeState.resizeDirection === 'bottom') {
      // Resize from bottom - adjust end time
      const baseTime = new Date(resizeState.startTime.getTime() + resizeState.originalDuration * 60 * 1000);
      newEndTime = new Date(baseTime.getTime() + hoursFromTop * 60 * 60 * 1000);
      
      // Snap to interval
      newEndTime = snapTimeToInterval(newEndTime, snapToMinutes);
      
      // Ensure minimum duration
      const newDuration = (newEndTime.getTime() - newStartTime.getTime()) / (1000 * 60);
      if (newDuration < minDurationMinutes) {
        newEndTime = new Date(newStartTime.getTime() + minDurationMinutes * 60 * 1000);
      } else if (newDuration > maxDurationMinutes) {
        newEndTime = new Date(newStartTime.getTime() + maxDurationMinutes * 60 * 1000);
      }
    }

    const finalDuration = (newEndTime.getTime() - newStartTime.getTime()) / (1000 * 60);
    
    setResizeState(prev => ({
      ...prev,
      startTime: newStartTime,
      endTime: newEndTime,
    }));

    setPreviewDuration(finalDuration);
    onResizeMove?.(object, finalDuration, newStartTime, newEndTime);
  }, [resizeState, disabled, snapTimeToInterval, snapToMinutes, minDurationMinutes, maxDurationMinutes, object, onResizeMove]);

  // Handle resize end
  const handleResizeEnd = useCallback(() => {
    if (!resizeState.isResizing) return;

    // Remove resize feedback
    document.body.classList.remove('resizing-schedule-object');
    document.body.style.cursor = '';
    setShowDurationPreview(false);

    const newDuration = getCurrentDuration();
    const resizeResult: ResizeResult = {
      success: true,
      updatedObject: {
        ...object,
        startTime: resizeState.startTime,
        endTime: resizeState.endTime,
      },
      newStartTime: resizeState.startTime,
      newEndTime: resizeState.endTime,
      newDuration,
    };

    setResizeState(prev => ({
      ...prev,
      isResizing: false,
      resizeDirection: null,
    }));

    onResizeEnd?.(object, resizeResult);
  }, [resizeState, getCurrentDuration, object, onResizeEnd]);

  // Global mouse/touch event handlers
  useEffect(() => {
    if (!resizeState.isResizing) return;

    const handleGlobalMouseMove = (e: MouseEvent) => handleResizeMove(e);
    const handleGlobalTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // Prevent scrolling
      handleResizeMove(e);
    };
    const handleGlobalEnd = () => handleResizeEnd();

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    document.addEventListener('mouseup', handleGlobalEnd);
    document.addEventListener('touchend', handleGlobalEnd);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('mouseup', handleGlobalEnd);
      document.removeEventListener('touchend', handleGlobalEnd);
    };
  }, [resizeState.isResizing, handleResizeMove, handleResizeEnd]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove('resizing-schedule-object');
      document.body.style.cursor = '';
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Duration preview overlay */}
      {showDurationPreview && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1 z-50"
        >
          <Clock className="w-3 h-3" />
          {formatDuration(previewDuration)}
        </motion.div>
      )}

      {/* Top resize handle */}
      {enableResize && !disabled && (
        <div
          ref={topResizeHandleRef}
          className="absolute -top-1 left-0 right-0 h-2 cursor-ns-resize opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center z-10"
          onMouseDown={(e) => handleResizeStart('top', e.nativeEvent)}
          onTouchStart={(e) => handleResizeStart('top', e.nativeEvent)}
        >
          <div className="bg-blue-500 h-1 w-8 rounded-full" />
        </div>
      )}

      {/* Main draggable component */}
      <DraggableScheduleObject
        object={object}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        showDragHandle={showDragHandle}
        enableKeyboardDrag={enableKeyboardDrag}
        disabled={disabled || resizeState.isResizing}
        className={`${resizeState.isResizing ? 'ring-2 ring-blue-500' : ''}`}
      >
        {children}
      </DraggableScheduleObject>

      {/* Bottom resize handle */}
      {enableResize && !disabled && (
        <div
          ref={bottomResizeHandleRef}
          className="absolute -bottom-1 left-0 right-0 h-2 cursor-ns-resize opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center z-10"
          onMouseDown={(e) => handleResizeStart('bottom', e.nativeEvent)}
          onTouchStart={(e) => handleResizeStart('bottom', e.nativeEvent)}
        >
          <div className="bg-blue-500 h-1 w-8 rounded-full" />
        </div>
      )}

      {/* Hidden instructions for screen readers */}
      <div id={`${object.id}-resize-instructions`} className="sr-only">
        Press and hold on the top or bottom edge to resize this {object.type}. 
        Minimum duration: {formatDuration(minDurationMinutes)}, 
        Maximum duration: {formatDuration(maxDurationMinutes)}.
      </div>
    </div>
  );
}
