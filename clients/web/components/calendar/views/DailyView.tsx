/**
 * DailyView Component
 * 
 * Single day calendar view with hourly breakdown
 */

'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, startOfDay, endOfDay, addMinutes, getHours, getMinutes } from 'date-fns';

import { CalendarGrid } from '../CalendarGrid';
import { useResponsiveCalendar } from '../hooks/useResponsiveCalendar';

import {
  CalendarView,
  CalendarGridConfig,
  ScheduleObject,
  CalendarGridCell,
  TimeSlotConfig,
} from '@/lib/calendar/types';

import {
  DEFAULT_TIME_SLOT_CONFIG,
  GRID_DIMENSIONS,
  ANIMATIONS,
} from '@/lib/calendar/constants';

interface DailyViewProps {
  selectedDate: Date;
  events?: ScheduleObject[];
  timeSlotConfig?: TimeSlotConfig;
  compactMode?: boolean;
  showTimeIndicator?: boolean;
  onCellClick?: (cell: CalendarGridCell) => void;
  onEventClick?: (event: ScheduleObject, cell: CalendarGridCell) => void;
  onDateChange?: (date: Date) => void;
  onDragStart?: (object: ScheduleObject) => void;
  onDragEnd?: (result: any) => void;
  onEventUpdate?: (object: ScheduleObject) => void;
  className?: string;
}

export function DailyView({
  selectedDate,
  events = [],
  timeSlotConfig = DEFAULT_TIME_SLOT_CONFIG,
  compactMode = false,
  showTimeIndicator = true,
  onCellClick,
  onEventClick,
  onDateChange,
  onDragStart,
  onDragEnd,
  onEventUpdate,
  className = '',
}: DailyViewProps) {

  // Create base configuration for daily view
  const baseConfig: CalendarGridConfig = useMemo(() => ({
    view: 'daily' as CalendarView,
    selectedDate,
    timeSlotConfig,
    showWeekends: true,
    showCurrentTimeIndicator: showTimeIndicator,
    allowDragDrop: true,
    allowResize: true,
    compactMode,
  }), [selectedDate, timeSlotConfig, showTimeIndicator, compactMode]);

  // Use responsive calendar hook for adaptations
  const { adaptedConfig, responsiveState } = useResponsiveCalendar(baseConfig);

  // Filter events for the selected day
  const dayEvents = useMemo(() => {
    const dayStart = startOfDay(selectedDate);
    const dayEnd = endOfDay(selectedDate);
    
    return events.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      
      // Include events that start, end, or span the selected day
      return (
        (eventStart >= dayStart && eventStart <= dayEnd) ||
        (eventEnd >= dayStart && eventEnd <= dayEnd) ||
        (eventStart <= dayStart && eventEnd >= dayEnd)
      );
    });
  }, [events, selectedDate]);

  // Get current time indicator position (for today only)
  const currentTimePosition = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const selectedDay = startOfDay(selectedDate);
    
    // Only show current time indicator for today
    if (today.getTime() !== selectedDay.getTime()) {
      return null;
    }

    const currentHour = getHours(now);
    const currentMinute = getMinutes(now);
    
    // Calculate position based on time slot configuration
    const startHour = timeSlotConfig.startHour;
    const slotDuration = timeSlotConfig.slotDuration;
    
    if (currentHour < startHour || currentHour > timeSlotConfig.endHour) {
      return null;
    }

    // Calculate the slot index and position within the slot
    const minutesFromStart = (currentHour - startHour) * 60 + currentMinute;
    const slotIndex = Math.floor(minutesFromStart / slotDuration);
    const positionInSlot = (minutesFromStart % slotDuration) / slotDuration;
    
    return {
      slotIndex,
      positionInSlot,
      time: format(now, 'HH:mm'),
    };
  }, [selectedDate, timeSlotConfig]);

  // Day header information
  const dayInfo = useMemo(() => {
    const isToday = startOfDay(new Date()).getTime() === startOfDay(selectedDate).getTime();
    const dayName = format(selectedDate, 'EEEE');
    const dateString = format(selectedDate, 'MMMM d, yyyy');
    const dayNumber = format(selectedDate, 'd');
    const monthName = format(selectedDate, 'MMM');

    return {
      isToday,
      dayName,
      dateString,
      dayNumber,
      monthName,
    };
  }, [selectedDate]);

  // Event statistics for the day
  const dayStats = useMemo(() => {
    const totalEvents = dayEvents.length;
    const completedEvents = dayEvents.filter(e => e.status === 'completed').length;
    const inProgressEvents = dayEvents.filter(e => e.status === 'in_progress').length;
    const upcomingEvents = dayEvents.filter(e => e.status === 'upcoming' || e.status === 'pending').length;

    return {
      total: totalEvents,
      completed: completedEvents,
      inProgress: inProgressEvents,
      upcoming: upcomingEvents,
    };
  }, [dayEvents]);

  return (
    <motion.div
      className={`daily-view flex flex-col h-full ${className}`}
      variants={ANIMATIONS.variants.fadeIn}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Day Header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Date Information */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className={`
                  flex flex-col items-center justify-center w-16 h-16 rounded-lg
                  ${dayInfo.isToday 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }
                `}>
                  <span className="text-xs font-medium uppercase">
                    {dayInfo.monthName}
                  </span>
                  <span className="text-xl font-bold">
                    {dayInfo.dayNumber}
                  </span>
                </div>
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {dayInfo.dayName}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {dayInfo.dateString}
                  </p>
                  {dayInfo.isToday && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                      Today
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Day Statistics */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-600 dark:text-gray-300">
                    {dayStats.completed} completed
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-gray-600 dark:text-gray-300">
                    {dayStats.inProgress} in progress
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-gray-600 dark:text-gray-300">
                    {dayStats.upcoming} upcoming
                  </span>
                </div>
              </div>
              
              {/* Current time display for today */}
              {dayInfo.isToday && (
                <div className="text-right">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Current time
                  </div>
                  <div className="text-lg font-mono font-medium text-gray-900 dark:text-white">
                    {format(new Date(), 'HH:mm')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick actions for mobile */}
          {responsiveState.screenSize === 'mobile' && (
            <div className="mt-4 flex gap-2 overflow-x-auto">
              <button
                onClick={() => onDateChange?.(new Date())}
                className="flex-shrink-0 px-3 py-1 text-xs bg-primary-100 text-primary-700 rounded-full hover:bg-primary-200 dark:bg-primary-900 dark:text-primary-300"
              >
                Go to Today
              </button>
              <button className="flex-shrink-0 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">
                Add Event
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Time slots and events */}
      <div className="flex-1 overflow-hidden">
        <CalendarGrid
          config={adaptedConfig}
          events={dayEvents}
          onCellClick={onCellClick}
          onEventClick={onEventClick}
          onDateChange={onDateChange}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onEventUpdate={onEventUpdate}
          className="h-full"
        >
          {/* Current time indicator overlay */}
          {currentTimePosition && (
            <div 
              className="absolute left-0 right-0 z-50 pointer-events-none"
              style={{
                top: `${(currentTimePosition.slotIndex + currentTimePosition.positionInSlot) * GRID_DIMENSIONS.timeSlotHeight.normal}px`,
              }}
            >
              <div className="flex items-center">
                <div className="flex items-center justify-center w-12 h-6 bg-red-500 text-white text-xs font-medium rounded-full">
                  {currentTimePosition.time}
                </div>
                <div className="flex-1 h-0.5 bg-red-500"></div>
              </div>
            </div>
          )}
        </CalendarGrid>
      </div>

      {/* Footer with summary (mobile only) */}
      {responsiveState.screenSize === 'mobile' && (
        <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            {dayStats.total === 0 ? (
              'No events scheduled for this day'
            ) : (
              `${dayStats.total} event${dayStats.total === 1 ? '' : 's'} • ${dayStats.completed} completed`
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default DailyView;
