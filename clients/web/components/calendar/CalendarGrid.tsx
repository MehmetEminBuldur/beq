/**
 * CalendarGrid Component
 * 
 * Main calendar grid component with responsive design and accessibility
 */

'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, getDay } from 'date-fns';

import { 
  CalendarGridProps, 
  CalendarGridData, 
  CalendarGridCell,
  TimeSlot as TimeSlotType,
  ScheduleObject,
  CalendarView,
  AccessibilityState,
} from '@/lib/calendar/types';

import { 
  generateCalendarGrid,
  calculateEventPositions,
  detectConflicts,
  getAccessibleCellLabel,
  isValidDrop,
} from '@/lib/calendar/utils';

import {
  VIEW_CONFIGS,
  GRID_DIMENSIONS,
  KEYBOARD_SHORTCUTS,
  ANIMATIONS,
  DEFAULT_ACCESSIBILITY_CONFIG,
} from '@/lib/calendar/constants';

import { TimeSlot } from './TimeSlot';

export function CalendarGrid({
  config,
  events = [],
  onCellClick,
  onEventClick,
  onDateChange,
  onViewChange,
  onDragStart,
  onDragEnd,
  onEventUpdate,
  className = '',
  accessibilityConfig = DEFAULT_ACCESSIBILITY_CONFIG,
  children,
}: CalendarGridProps) {
  // Refs
  const gridRef = useRef<HTMLDivElement>(null);
  const announcementRef = useRef<HTMLDivElement>(null);

  // State
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [draggedObject, setDraggedObject] = useState<ScheduleObject | null>(null);
  const [accessibilityState, setAccessibilityState] = useState<AccessibilityState>({
    focusedCell: null,
    selectedObjects: [],
    announcements: [],
    keyboardNavigationEnabled: accessibilityConfig.enableKeyboardNavigation,
  });

  // Generate grid data
  const gridData = useMemo((): CalendarGridData => {
    return generateCalendarGrid(
      config.view,
      config.selectedDate,
      events,
      config.timeSlotConfig
    );
  }, [config.view, config.selectedDate, events, config.timeSlotConfig]);

  // Calculate event positions
  const eventLayout = useMemo(() => {
    return calculateEventPositions(events, config.view, gridData);
  }, [events, config.view, gridData]);

  // Detect conflicts
  const conflicts = useMemo(() => {
    return detectConflicts(events);
  }, [events]);

  // Get view configuration
  const viewConfig = useMemo(() => {
    return VIEW_CONFIGS[config.view];
  }, [config.view]);

  // Responsive grid dimensions
  const gridDimensions = useMemo(() => {
    const { columnWidth, timeSlotHeight } = GRID_DIMENSIONS;
    
    return {
      columnMinWidth: config.compactMode ? columnWidth.mobile : columnWidth.desktop,
      slotHeight: config.compactMode ? timeSlotHeight.compact : timeSlotHeight.normal,
      totalColumns: viewConfig.gridColumns,
      totalRows: gridData.totalRows,
    };
  }, [config.compactMode, viewConfig.gridColumns, gridData.totalRows]);

  // Announce to screen reader
  const announceToScreenReader = useCallback((message: string) => {
    if (!accessibilityConfig.enableScreenReader) return;
    
    setAccessibilityState(prev => ({
      ...prev,
      announcements: [...prev.announcements.slice(-2), message],
    }));

    // Clear announcement after a delay
    setTimeout(() => {
      setAccessibilityState(prev => ({
        ...prev,
        announcements: prev.announcements.filter(a => a !== message),
      }));
    }, 3000);
  }, [accessibilityConfig.enableScreenReader]);

  // Handle cell interactions
  const handleCellClick = useCallback((cell: CalendarGridCell) => {
    setSelectedCell(cell.id);
    setAccessibilityState(prev => ({ ...prev, focusedCell: cell.id }));
    
    onCellClick?.(cell);
    
    if (accessibilityConfig.announceTimeChanges) {
      announceToScreenReader(getAccessibleCellLabel(cell));
    }
  }, [onCellClick, accessibilityConfig.announceTimeChanges, announceToScreenReader]);

  const handleCellHover = useCallback((cellId: string | null) => {
    setHoveredCell(cellId);
  }, []);

  // Handle event interactions
  const handleEventClick = useCallback((event: ScheduleObject, cell: CalendarGridCell) => {
    onEventClick?.(event, cell);
    announceToScreenReader(`Selected ${event.title}`);
  }, [onEventClick, announceToScreenReader]);

  // Handle drag & drop
  const handleDragStart = useCallback((object: ScheduleObject) => {
    setDraggedObject(object);
    onDragStart?.(object);
    announceToScreenReader(`Started dragging ${object.title}`);
  }, [onDragStart, announceToScreenReader]);

  const handleDrop = useCallback((timeSlot: TimeSlotType, object: ScheduleObject) => {
    if (!onDragEnd) return;

    const targetCell = gridData.cells.find(cell => 
      cell.timeSlot?.id === timeSlot.id
    );

    if (!targetCell) return;

    const result = {
      success: isValidDrop(object, targetCell, events),
      targetCell,
      updatedObject: {
        ...object,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
      },
      conflicts: [],
    };

    onDragEnd(result);
    setDraggedObject(null);
    
    if (result.success) {
      announceToScreenReader(`Moved ${object.title} to ${format(timeSlot.startTime, 'h:mm a')}`);
    } else {
      announceToScreenReader(`Cannot move ${object.title} to this time slot`);
    }
  }, [onDragEnd, gridData.cells, events, announceToScreenReader]);

  // Keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!accessibilityConfig.enableKeyboardNavigation) return;

    const { key } = event;
    const { navigation, actions } = KEYBOARD_SHORTCUTS;

    // Find currently focused cell
    const focusedIndex = gridData.cells.findIndex(cell => 
      cell.id === accessibilityState.focusedCell
    );

    let newFocusIndex = focusedIndex;

    switch (key) {
      case navigation.up:
        event.preventDefault();
        newFocusIndex = Math.max(0, focusedIndex - viewConfig.gridColumns);
        break;
        
      case navigation.down:
        event.preventDefault();
        newFocusIndex = Math.min(
          gridData.cells.length - 1, 
          focusedIndex + viewConfig.gridColumns
        );
        break;
        
      case navigation.left:
        event.preventDefault();
        newFocusIndex = Math.max(0, focusedIndex - 1);
        break;
        
      case navigation.right:
        event.preventDefault();
        newFocusIndex = Math.min(gridData.cells.length - 1, focusedIndex + 1);
        break;
        
      case navigation.home:
        event.preventDefault();
        newFocusIndex = 0;
        break;
        
      case navigation.end:
        event.preventDefault();
        newFocusIndex = gridData.cells.length - 1;
        break;
        
      case actions.select:
        event.preventDefault();
        if (focusedIndex >= 0) {
          handleCellClick(gridData.cells[focusedIndex]);
        }
        break;
        
      default:
        return;
    }

    if (newFocusIndex !== focusedIndex && newFocusIndex >= 0) {
      const newCell = gridData.cells[newFocusIndex];
      setAccessibilityState(prev => ({ ...prev, focusedCell: newCell.id }));
      announceToScreenReader(getAccessibleCellLabel(newCell));
    }
  }, [
    accessibilityConfig.enableKeyboardNavigation,
    accessibilityState.focusedCell,
    gridData.cells,
    viewConfig.gridColumns,
    handleCellClick,
    announceToScreenReader,
  ]);

  // Focus management
  useEffect(() => {
    if (accessibilityConfig.focusManagement === 'auto' && gridRef.current) {
      gridRef.current.focus();
    }
  }, [accessibilityConfig.focusManagement]);

  // Generate grid styles
  const gridStyles = useMemo(() => {
    const { totalColumns } = gridDimensions;
    
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${totalColumns}, minmax(${gridDimensions.columnMinWidth}px, 1fr))`,
      gap: '1px',
      backgroundColor: 'rgb(229 231 235)', // gray-200
    };
  }, [gridDimensions]);

  // Render day headers (for weekly/monthly views)
  const DayHeaders = useMemo(() => {
    if (config.view === 'daily') return null;

    const headers = [];
    const daysToShow = config.view === 'weekly' ? 7 : 7; // Monthly also shows 7 day columns
    
    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(gridData.dateRange.start);
      date.setDate(date.getDate() + i);
      
      const isWeekend = [0, 6].includes(getDay(date));
      
      headers.push(
        <div
          key={`header-${i}`}
          className={`
            p-3 text-center font-medium border-b-2 bg-white dark:bg-gray-800
            ${isToday(date) 
              ? 'text-primary-600 dark:text-primary-400 border-primary-500' 
              : 'text-gray-900 dark:text-white border-gray-200 dark:border-gray-700'
            }
            ${isWeekend ? 'bg-gray-50 dark:bg-gray-750' : ''}
          `}
        >
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {format(date, 'EEE')}
          </div>
          <div className={`text-lg ${isToday(date) ? 'font-bold' : ''}`}>
            {format(date, 'd')}
          </div>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-600">
        {headers}
      </div>
    );
  }, [config.view, gridData.dateRange.start]);

  // Render time slots
  const TimeSlots = useMemo(() => {
    return gridData.cells.map((cell) => {
      if (!cell.timeSlot) return null;

      const isSelected = selectedCell === cell.id;
      const isHovered = hoveredCell === cell.id;
      const isFocused = accessibilityState.focusedCell === cell.id;

      return (
        <TimeSlot
          key={cell.id}
          timeSlot={cell.timeSlot}
          events={cell.events}
          view={config.view}
          compactMode={config.compactMode}
          showTimeLabel={config.view !== 'monthly'}
          allowDrop={config.allowDragDrop}
          isSelected={isSelected || isFocused}
          isHovered={isHovered}
          isDropTarget={!!draggedObject}
          onClick={() => handleCellClick(cell)}
          onDrop={handleDrop}
          onHover={(timeSlot) => handleCellHover(timeSlot ? cell.id : null)}
          className={`
            ${isFocused ? 'ring-2 ring-primary-500 ring-opacity-50' : ''}
            ${cell.isWeekend ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}
          `}
        />
      );
    });
  }, [
    gridData.cells,
    selectedCell,
    hoveredCell,
    accessibilityState.focusedCell,
    config.view,
    config.compactMode,
    config.allowDragDrop,
    draggedObject,
    handleCellClick,
    handleDrop,
    handleCellHover,
  ]);

  // Generate CSS classes
  const containerClasses = [
    'calendar-grid relative w-full',
    'focus:outline-none',
    accessibilityConfig.reducedMotion && 'motion-reduce:transition-none',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {/* Screen reader announcements */}
      <div
        ref={announcementRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {accessibilityState.announcements.map((announcement, index) => (
          <div key={index}>{announcement}</div>
        ))}
      </div>

      {/* Day headers */}
      {DayHeaders}

      {/* Main grid */}
      <div
        ref={gridRef}
        className="calendar-grid-content relative overflow-auto"
        style={gridStyles}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="grid"
        aria-label={`${config.view} calendar view for ${format(config.selectedDate, 'MMMM yyyy')}`}
        data-testid="calendar-grid"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${config.view}-${format(config.selectedDate, 'yyyy-MM')}`}
            variants={ANIMATIONS.variants.fadeIn}
            initial="initial"
            animate="animate"
            exit="exit"
            className="contents"
          >
            {TimeSlots}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Children (overlays, modals, etc.) */}
      {children}

      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 text-xs text-gray-500 bg-white p-2 rounded shadow">
          <div>View: {config.view}</div>
          <div>Cells: {gridData.cells.length}</div>
          <div>Events: {events.length}</div>
          <div>Conflicts: {conflicts.length}</div>
          {accessibilityState.focusedCell && (
            <div>Focused: {accessibilityState.focusedCell}</div>
          )}
        </div>
      )}
    </div>
  );
}

// Export types for external use
export type { CalendarGridProps };
