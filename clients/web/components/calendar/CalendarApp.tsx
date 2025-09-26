/**
 * CalendarApp Component
 * 
 * Main calendar application with multiple views and navigation
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Settings, Download, Upload, Filter } from 'lucide-react';

import { DailyView } from './views/DailyView';
import { WeeklyView } from './views/WeeklyView';
import { MonthlyView } from './views/MonthlyView';
import { ViewSwitcher, CompactViewSwitcher, DropdownViewSwitcher } from './ViewSwitcher';
import { DateNavigation, CompactDateNavigation } from './DateNavigation';
import { useResponsiveCalendar } from './hooks/useResponsiveCalendar';
import { useCalendarAccessibility } from './hooks/useCalendarAccessibility';

import {
  CalendarView,
  CalendarGridConfig,
  ScheduleObject,
  CalendarGridCell,
  TimeSlotConfig,
} from '@/lib/calendar/types';

import {
  DEFAULT_TIME_SLOT_CONFIG,
  ANIMATIONS,
} from '@/lib/calendar/constants';

interface CalendarAppProps {
  initialView?: CalendarView;
  initialDate?: Date;
  events?: ScheduleObject[];
  timeSlotConfig?: TimeSlotConfig;
  showToolbar?: boolean;
  showViewSwitcher?: boolean;
  showNavigation?: boolean;
  showQuickActions?: boolean;
  allowViewChange?: boolean;
  onCellClick?: (cell: CalendarGridCell) => void;
  onEventClick?: (event: ScheduleObject, cell: CalendarGridCell) => void;
  onEventCreate?: (cell: CalendarGridCell) => void;
  onEventUpdate?: (event: ScheduleObject) => void;
  onEventDelete?: (event: ScheduleObject) => void;
  onDragStart?: (object: ScheduleObject) => void;
  onDragEnd?: (result: any) => void;
  className?: string;
}

export function CalendarApp({
  initialView = 'weekly',
  initialDate = new Date(),
  events = [],
  timeSlotConfig = DEFAULT_TIME_SLOT_CONFIG,
  showToolbar = true,
  showViewSwitcher = true,
  showNavigation = true,
  showQuickActions = true,
  allowViewChange = true,
  onCellClick,
  onEventClick,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  onDragStart,
  onDragEnd,
  className = '',
}: CalendarAppProps) {

  // State
  const [currentView, setCurrentView] = useState<CalendarView>(initialView);
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<string[]>([]);

  // Create base configuration
  const baseConfig: CalendarGridConfig = useMemo(() => ({
    view: currentView,
    selectedDate,
    timeSlotConfig,
    showWeekends: true,
    showCurrentTimeIndicator: true,
    allowDragDrop: true,
    allowResize: true,
    compactMode: false,
  }), [currentView, selectedDate, timeSlotConfig]);

  // Use responsive calendar hook
  const { adaptedConfig, responsiveState } = useResponsiveCalendar(baseConfig);

  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    if (filters.length === 0) return events;
    
    return events.filter(event => {
      // Apply type filters
      if (filters.includes('bricks') && event.type !== 'brick') return false;
      if (filters.includes('quantas') && event.type !== 'quanta') return false;
      if (filters.includes('events') && event.type !== 'event') return false;
      if (filters.includes('meetings') && event.type !== 'meeting') return false;
      
      // Apply status filters
      if (filters.includes('completed') && event.status !== 'completed') return false;
      if (filters.includes('in_progress') && event.status !== 'in_progress') return false;
      if (filters.includes('pending') && event.status !== 'pending') return false;
      
      return true;
    });
  }, [events, filters]);

  // Handle view change
  const handleViewChange = useCallback((view: CalendarView) => {
    if (!allowViewChange) return;
    setCurrentView(view);
  }, [allowViewChange]);

  // Handle date change
  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  // Enhanced cell click handler
  const handleCellClick = useCallback((cell: CalendarGridCell) => {
    onCellClick?.(cell);
    
    // If double-clicked or cell is empty, trigger event creation
    if (cell.events.length === 0) {
      onEventCreate?.(cell);
    }
  }, [onCellClick, onEventCreate]);

  // Enhanced event click handler
  const handleEventClick = useCallback((event: ScheduleObject, cell: CalendarGridCell) => {
    onEventClick?.(event, cell);
  }, [onEventClick]);

  // Handle drag operations
  const handleDragStart = useCallback((object: ScheduleObject) => {
    onDragStart?.(object);
  }, [onDragStart]);

  const handleDragEnd = useCallback((result: any) => {
    if (result.success) {
      onEventUpdate?.(result.updatedObject);
    }
    onDragEnd?.(result);
  }, [onDragEnd, onEventUpdate]);

  // Quick actions
  const handleAddEvent = useCallback(() => {
    const cell: CalendarGridCell = {
      id: `cell-${Date.now()}`,
      date: selectedDate,
      events: [],
      isToday: false,
      isSelected: true,
      isWeekend: false,
      isOutsideMonth: false,
      isDragTarget: false,
      isDroppable: true,
      row: 0,
      column: 0,
    };
    onEventCreate?.(cell);
  }, [selectedDate, onEventCreate]);

  // Filter toggle
  const toggleFilter = useCallback((filter: string) => {
    setFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  }, []);

  // Render appropriate view
  const renderCalendarView = () => {
    const commonProps = {
      selectedDate,
      events: filteredEvents,
      timeSlotConfig,
      compactMode: adaptedConfig.compactMode,
      onCellClick: handleCellClick,
      onEventClick: handleEventClick,
      onDateChange: handleDateChange,
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
      onEventUpdate,
    };

    switch (currentView) {
      case 'daily':
        return <DailyView {...commonProps} className="flex-1" />;
      case 'weekly':
        return <WeeklyView {...commonProps} className="flex-1" />;
      case 'monthly':
        return <MonthlyView {...commonProps} className="flex-1" />;
      default:
        return <WeeklyView {...commonProps} className="flex-1" />;
    }
  };

  return (
    <div className={`calendar-app flex flex-col h-full bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Toolbar */}
      {showToolbar && (
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Left section: View switcher and navigation */}
              <div className="flex items-center gap-4">
                {/* View switcher */}
                {showViewSwitcher && (
                  <>
                    {responsiveState.screenSize === 'mobile' ? (
                      <DropdownViewSwitcher
                        currentView={currentView}
                        onViewChange={handleViewChange}
                        disabled={!allowViewChange}
                      />
                    ) : responsiveState.screenSize === 'tablet' ? (
                      <CompactViewSwitcher
                        currentView={currentView}
                        onViewChange={handleViewChange}
                        disabled={!allowViewChange}
                      />
                    ) : (
                      <ViewSwitcher
                        currentView={currentView}
                        onViewChange={handleViewChange}
                        showKeyboardShortcuts={true}
                        disabled={!allowViewChange}
                      />
                    )}
                  </>
                )}

                {/* Navigation */}
                {showNavigation && (
                  <>
                    {responsiveState.screenSize === 'mobile' ? (
                      <CompactDateNavigation
                        currentDate={selectedDate}
                        view={currentView}
                        onDateChange={handleDateChange}
                        onViewChange={allowViewChange ? handleViewChange : undefined}
                      />
                    ) : (
                      <DateNavigation
                        currentDate={selectedDate}
                        view={currentView}
                        onDateChange={handleDateChange}
                        onViewChange={allowViewChange ? handleViewChange : undefined}
                        compact={responsiveState.screenSize === 'tablet'}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Right section: Quick actions */}
              {showQuickActions && (
                <div className="flex items-center gap-2">
                  {/* Filters */}
                  <div className="relative">
                    <button
                      className={`
                        p-2 rounded-lg transition-colors
                        ${filters.length > 0 
                          ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400' 
                          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }
                      `}
                      title="Filter events"
                    >
                      <Filter className="w-4 h-4" />
                    </button>
                    {filters.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                        {filters.length}
                      </span>
                    )}
                  </div>

                  {/* Add event */}
                  <button
                    onClick={handleAddEvent}
                    className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
                    title="Add new event"
                  >
                    <Plus className="w-4 h-4" />
                    {responsiveState.screenSize !== 'mobile' && (
                      <span className="text-sm font-medium">Add Event</span>
                    )}
                  </button>

                  {/* Settings (desktop only) */}
                  {responsiveState.screenSize === 'desktop' && (
                    <button
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Calendar settings"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Filter chips (when active) */}
            {filters.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {filters.map(filter => (
                  <button
                    key={filter}
                    onClick={() => toggleFilter(filter)}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 rounded-full text-xs font-medium hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
                  >
                    {filter}
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main calendar view */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentView}-${selectedDate.getMonth()}-${selectedDate.getFullYear()}`}
            variants={ANIMATIONS.variants.fadeIn}
            initial="initial"
            animate="animate"
            exit="exit"
            className="h-full"
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading calendar...</p>
                </div>
              </div>
            ) : (
              renderCalendarView()
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer with summary (mobile only) */}
      {responsiveState.screenSize === 'mobile' && (
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2">
          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            {filteredEvents.length} events
            {filters.length > 0 && ` • ${filters.length} filter${filters.length === 1 ? '' : 's'} active`}
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarApp;
