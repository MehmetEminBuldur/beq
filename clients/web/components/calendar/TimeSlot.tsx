/**
 * TimeSlot Component
 * 
 * Individual time slot component with drag & drop support
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Clock, Plus } from 'lucide-react';

import { TimeSlot as TimeSlotType, ScheduleObject, TimeSlotProps } from '@/lib/calendar/types';
import { 
  formatTimeSlot, 
  getAccessibleCellLabel,
  isValidDrop 
} from '@/lib/calendar/utils';
import { 
  GRID_DIMENSIONS, 
  Z_INDEX, 
  CURRENT_TIME_INDICATOR,
  ANIMATIONS 
} from '@/lib/calendar/constants';

interface TimeSlotComponentProps extends TimeSlotProps {
  view: 'daily' | 'weekly' | 'monthly';
  compactMode?: boolean;
  showTimeLabel?: boolean;
  allowDrop?: boolean;
  isSelected?: boolean;
  isHovered?: boolean;
  onHover?: (timeSlot: TimeSlotType | null) => void;
  onAddEvent?: (timeSlot: TimeSlotType) => void;
}

export function TimeSlot({
  timeSlot,
  events = [],
  isDropTarget = false,
  view,
  compactMode = false,
  showTimeLabel = true,
  allowDrop = true,
  isSelected = false,
  isHovered = false,
  onClick,
  onDrop,
  onHover,
  onAddEvent,
  className = '',
}: TimeSlotComponentProps) {
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const [showAddButton, setShowAddButton] = useState(false);

  // Calculate height based on view and mode
  const slotHeight = useMemo(() => {
    const { timeSlotHeight } = GRID_DIMENSIONS;
    
    if (compactMode) return timeSlotHeight.compact;
    if (view === 'daily') return timeSlotHeight.expanded;
    return timeSlotHeight.normal;
  }, [view, compactMode]);

  // Handle click events
  const handleClick = useCallback(() => {
    onClick?.(timeSlot);
  }, [onClick, timeSlot]);

  // Handle mouse events
  const handleMouseEnter = useCallback(() => {
    setShowAddButton(true);
    onHover?.(timeSlot);
  }, [onHover, timeSlot]);

  const handleMouseLeave = useCallback(() => {
    setShowAddButton(false);
    onHover?.(null);
  }, [onHover]);

  // Handle drag & drop events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!allowDrop) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDraggedOver(true);
  }, [allowDrop]);

  const handleDragLeave = useCallback(() => {
    setIsDraggedOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggedOver(false);
    
    if (!allowDrop || !onDrop) return;

    try {
      const objectData = e.dataTransfer.getData('application/x-schedule-object');
      if (objectData) {
        const scheduleObject: ScheduleObject = JSON.parse(objectData);
        
        // Validate the drop
        if (isValidDrop(scheduleObject, { 
          timeSlot, 
          events, 
          date: timeSlot.startTime,
          isToday: false,
          isSelected: false,
          isWeekend: false,
          isOutsideMonth: false,
          isDragTarget: false,
          isDroppable: true,
          id: timeSlot.id,
          row: timeSlot.row,
          column: timeSlot.column,
        }, events)) {
          onDrop(timeSlot, scheduleObject);
        }
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  }, [allowDrop, onDrop, timeSlot, events]);

  // Handle add event button
  const handleAddEvent = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onAddEvent?.(timeSlot);
  }, [onAddEvent, timeSlot]);

  // Generate CSS classes
  const baseClasses = [
    'relative',
    'border-b border-gray-100 dark:border-gray-700',
    'transition-all duration-200',
    'group',
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50',
  ];

  const stateClasses = [
    // Current time highlighting
    timeSlot.isCurrentTime && 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800',
    
    // Selection state
    isSelected && 'bg-primary-100 dark:bg-primary-900/30',
    
    // Hover state
    isHovered && 'bg-gray-50 dark:bg-gray-800',
    
    // Drag states
    isDraggedOver && allowDrop && 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
    isDropTarget && 'ring-2 ring-primary-300 ring-opacity-50',
    
    // Availability
    !timeSlot.isAvailable && 'bg-gray-100 dark:bg-gray-800 opacity-50',
    
    // Conflicts
    timeSlot.conflicts.length > 0 && 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  ].filter(Boolean);

  const combinedClasses = [
    ...baseClasses,
    ...stateClasses,
    className,
  ].join(' ');

  // Time label component
  const TimeLabel = useMemo(() => {
    if (!showTimeLabel || view === 'monthly') return null;

    const isHourMark = timeSlot.startTime.getMinutes() === 0;
    const timeFormat = compactMode ? 'HH:mm' : 'h:mm a';

    return (
      <div className={`
        absolute left-0 top-0 px-2 py-1 text-xs font-medium
        ${isHourMark 
          ? 'text-gray-900 dark:text-white font-semibold' 
          : 'text-gray-500 dark:text-gray-400'
        }
        ${compactMode ? 'text-xs' : 'text-sm'}
      `}>
        {format(timeSlot.startTime, timeFormat)}
      </div>
    );
  }, [showTimeLabel, view, timeSlot.startTime, compactMode]);

  // Current time indicator
  const CurrentTimeIndicator = useMemo(() => {
    if (!timeSlot.isCurrentTime) return null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute left-0 top-1/2 w-full flex items-center"
        style={{ zIndex: Z_INDEX.currentTimeIndicator }}
      >
        <div 
          className="w-2 h-2 rounded-full bg-red-500"
          style={{ marginLeft: '-4px' }}
        />
        <div 
          className="flex-1 h-0.5 bg-red-500"
          style={{ 
            background: `linear-gradient(to right, ${CURRENT_TIME_INDICATOR.lineColor}, transparent)`
          }}
        />
      </motion.div>
    );
  }, [timeSlot.isCurrentTime]);

  // Add event button
  const AddEventButton = useMemo(() => {
    if (!onAddEvent || !showAddButton || events.length > 0) return null;

    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        onClick={handleAddEvent}
        className="
          absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
          w-6 h-6 rounded-full bg-primary-600 text-white
          flex items-center justify-center
          hover:bg-primary-700 transition-colors
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50
          z-30
        "
        title="Add event to this time slot"
        aria-label={`Add event to ${formatTimeSlot(timeSlot)}`}
      >
        <Plus className="w-3 h-3" />
      </motion.button>
    );
  }, [onAddEvent, showAddButton, events.length, handleAddEvent, timeSlot]);

  // Events preview (for compact view)
  const EventsPreview = useMemo(() => {
    if (events.length === 0 || !compactMode) return null;

    return (
      <div className="absolute right-1 top-1 flex gap-1">
        {events.slice(0, 3).map((event, index) => (
          <div
            key={event.id}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: event.color }}
            title={event.title}
          />
        ))}
        {events.length > 3 && (
          <div className="w-2 h-2 rounded-full bg-gray-400 text-xs flex items-center justify-center text-white">
            +
          </div>
        )}
      </div>
    );
  }, [events, compactMode]);

  return (
    <motion.div
      layout
      className={combinedClasses}
      style={{ 
        height: `${slotHeight}px`,
        minHeight: `${slotHeight}px`,
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="gridcell"
      tabIndex={0}
      aria-label={getAccessibleCellLabel({
        id: timeSlot.id,
        date: timeSlot.startTime,
        timeSlot,
        events,
        isToday: timeSlot.isCurrentTime,
        isSelected,
        isWeekend: false,
        isOutsideMonth: false,
        isDragTarget: isDropTarget,
        isDroppable: allowDrop,
        row: timeSlot.row,
        column: timeSlot.column,
      })}
      aria-selected={isSelected}
      data-testid={`time-slot-${timeSlot.id}`}
    >
      {/* Time label */}
      {TimeLabel}
      
      {/* Current time indicator */}
      {CurrentTimeIndicator}
      
      {/* Events preview (compact mode) */}
      {EventsPreview}
      
      {/* Add event button */}
      {AddEventButton}
      
      {/* Conflict indicator */}
      {timeSlot.conflicts.length > 0 && (
        <div className="absolute top-1 right-1">
          <div className="w-2 h-2 rounded-full bg-red-500" title="Time conflict" />
        </div>
      )}
      
      {/* Drop target overlay */}
      {isDraggedOver && allowDrop && (
        <div className="absolute inset-0 border-2 border-dashed border-green-400 bg-green-50 dark:bg-green-900/20 rounded flex items-center justify-center">
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
            Drop here
          </span>
        </div>
      )}
    </motion.div>
  );
}

// Export types for external use
export type { TimeSlotComponentProps };
