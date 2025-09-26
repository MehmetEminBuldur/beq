/**
 * WeeklyView Component
 * 
 * 7-day calendar view with time slots and full week navigation
 */

'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isToday, 
  isSameDay,
  getDay,
  addDays,
  startOfDay,
  endOfDay
} from 'date-fns';

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
  ANIMATIONS,
} from '@/lib/calendar/constants';

interface WeeklyViewProps {
  selectedDate: Date;
  events?: ScheduleObject[];
  timeSlotConfig?: TimeSlotConfig;
  compactMode?: boolean;
  showTimeIndicator?: boolean;
  showWeekends?: boolean;
  weekStartsOn?: 0 | 1; // 0 = Sunday, 1 = Monday
  onCellClick?: (cell: CalendarGridCell) => void;
  onEventClick?: (event: ScheduleObject, cell: CalendarGridCell) => void;
  onDateChange?: (date: Date) => void;
  onDragStart?: (object: ScheduleObject) => void;
  onDragEnd?: (result: any) => void;
  onEventUpdate?: (object: ScheduleObject) => void;
  className?: string;
}

export function WeeklyView({
  selectedDate,
  events = [],
  timeSlotConfig = DEFAULT_TIME_SLOT_CONFIG,
  compactMode = false,
  showTimeIndicator = true,
  showWeekends = true,
  weekStartsOn = 1, // Monday
  onCellClick,
  onEventClick,
  onDateChange,
  onDragStart,
  onDragEnd,
  onEventUpdate,
  className = '',
}: WeeklyViewProps) {

  // Create base configuration for weekly view
  const baseConfig: CalendarGridConfig = useMemo(() => ({
    view: 'weekly' as CalendarView,
    selectedDate,
    timeSlotConfig: {
      ...timeSlotConfig,
      firstDayOfWeek: weekStartsOn,
    },
    showWeekends,
    showCurrentTimeIndicator: showTimeIndicator,
    allowDragDrop: true,
    allowResize: true,
    compactMode,
  }), [selectedDate, timeSlotConfig, showTimeIndicator, showWeekends, weekStartsOn, compactMode]);

  // Use responsive calendar hook for adaptations
  const { adaptedConfig, responsiveState } = useResponsiveCalendar(baseConfig);

  // Calculate week range
  const weekRange = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn });
    const end = endOfWeek(selectedDate, { weekStartsOn });
    const days = eachDayOfInterval({ start, end });
    
    return {
      start,
      end,
      days: showWeekends ? days : days.filter(day => {
        const dayOfWeek = getDay(day);
        return dayOfWeek !== 0 && dayOfWeek !== 6; // Exclude Sunday (0) and Saturday (6)
      }),
    };
  }, [selectedDate, weekStartsOn, showWeekends]);

  // Filter events for the week
  const weekEvents = useMemo(() => {
    return events.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      
      // Include events that start, end, or span any day in the week
      return weekRange.days.some(day => {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);
        
        return (
          (eventStart >= dayStart && eventStart <= dayEnd) ||
          (eventEnd >= dayStart && eventEnd <= dayEnd) ||
          (eventStart <= dayStart && eventEnd >= dayEnd)
        );
      });
    });
  }, [events, weekRange.days]);

  // Week header information
  const weekInfo = useMemo(() => {
    const startMonth = format(weekRange.start, 'MMM');
    const endMonth = format(weekRange.end, 'MMM');
    const startYear = format(weekRange.start, 'yyyy');
    const endYear = format(weekRange.end, 'yyyy');
    
    const monthRange = startMonth === endMonth 
      ? startMonth 
      : `${startMonth} - ${endMonth}`;
    
    const yearRange = startYear === endYear 
      ? startYear 
      : `${startYear} - ${endYear}`;

    const weekNumber = Math.ceil(
      (weekRange.start.getTime() - new Date(weekRange.start.getFullYear(), 0, 1).getTime()) / 
      (7 * 24 * 60 * 60 * 1000)
    );

    return {
      monthRange,
      yearRange,
      weekNumber,
      dateRange: `${format(weekRange.start, 'MMM d')} - ${format(weekRange.end, 'MMM d, yyyy')}`,
    };
  }, [weekRange]);

  // Day statistics for each day of the week
  const dayStats = useMemo(() => {
    return weekRange.days.map(day => {
      const dayEvents = weekEvents.filter(event => {
        const eventStart = startOfDay(new Date(event.startTime));
        const eventEnd = endOfDay(new Date(event.endTime));
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);
        
        return (
          isSameDay(eventStart, day) ||
          isSameDay(eventEnd, day) ||
          (eventStart <= dayStart && eventEnd >= dayEnd)
        );
      });

      return {
        date: day,
        total: dayEvents.length,
        completed: dayEvents.filter(e => e.status === 'completed').length,
        inProgress: dayEvents.filter(e => e.status === 'in_progress').length,
        upcoming: dayEvents.filter(e => e.status === 'upcoming' || e.status === 'pending').length,
        isToday: isToday(day),
        isWeekend: [0, 6].includes(getDay(day)),
      };
    });
  }, [weekRange.days, weekEvents]);

  // Week overview stats
  const weekOverview = useMemo(() => {
    const totalEvents = weekEvents.length;
    const completed = weekEvents.filter(e => e.status === 'completed').length;
    const inProgress = weekEvents.filter(e => e.status === 'in_progress').length;
    const upcoming = weekEvents.filter(e => e.status === 'upcoming' || e.status === 'pending').length;

    return {
      total: totalEvents,
      completed,
      inProgress,
      upcoming,
      dailyAverage: Math.round(totalEvents / weekRange.days.length * 10) / 10,
    };
  }, [weekEvents, weekRange.days.length]);

  return (
    <motion.div
      className={`weekly-view flex flex-col h-full ${className}`}
      variants={ANIMATIONS.variants.fadeIn}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Week Header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Week Information */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {weekInfo.monthRange} {weekInfo.yearRange}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Week {weekInfo.weekNumber} • {weekInfo.dateRange}
              </p>
            </div>

            {/* Week Overview Statistics */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-600 dark:text-gray-300">
                    {weekOverview.completed}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-gray-600 dark:text-gray-300">
                    {weekOverview.inProgress}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-gray-600 dark:text-gray-300">
                    {weekOverview.upcoming}
                  </span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Total events
                </div>
                <div className="text-lg font-medium text-gray-900 dark:text-white">
                  {weekOverview.total}
                </div>
              </div>
            </div>
          </div>

          {/* Day headers with mini stats */}
          <div className="mt-4 grid grid-cols-7 gap-1">
            {dayStats.map((dayStat, index) => (
              <div
                key={dayStat.date.toISOString()}
                className={`
                  p-3 rounded-lg text-center cursor-pointer transition-colors
                  ${dayStat.isToday 
                    ? 'bg-primary-100 border-2 border-primary-500 dark:bg-primary-900 dark:border-primary-400' 
                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600'
                  }
                  ${dayStat.isWeekend ? 'opacity-75' : ''}
                `}
                onClick={() => onDateChange?.(dayStat.date)}
              >
                <div className={`
                  text-xs font-medium uppercase mb-1
                  ${dayStat.isToday ? 'text-primary-700 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400'}
                `}>
                  {format(dayStat.date, 'EEE')}
                </div>
                <div className={`
                  text-lg font-bold mb-1
                  ${dayStat.isToday ? 'text-primary-900 dark:text-primary-100' : 'text-gray-900 dark:text-white'}
                `}>
                  {format(dayStat.date, 'd')}
                </div>
                {dayStat.total > 0 && (
                  <div className="flex items-center justify-center gap-1">
                    {dayStat.completed > 0 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    )}
                    {dayStat.inProgress > 0 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                    )}
                    {dayStat.upcoming > 0 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick actions for mobile */}
          {responsiveState.screenSize === 'mobile' && (
            <div className="mt-4 flex gap-2 overflow-x-auto">
              <button
                onClick={() => onDateChange?.(new Date())}
                className="flex-shrink-0 px-3 py-1 text-xs bg-primary-100 text-primary-700 rounded-full hover:bg-primary-200 dark:bg-primary-900 dark:text-primary-300"
              >
                This Week
              </button>
              <button className="flex-shrink-0 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">
                Add Event
              </button>
              <button
                onClick={() => onDateChange?.(addDays(selectedDate, 7))}
                className="flex-shrink-0 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
              >
                Next Week
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-hidden">
        <CalendarGrid
          config={adaptedConfig}
          events={weekEvents}
          onCellClick={onCellClick}
          onEventClick={onEventClick}
          onDateChange={onDateChange}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onEventUpdate={onEventUpdate}
          className="h-full"
        />
      </div>

      {/* Week Summary Footer (mobile only) */}
      {responsiveState.screenSize === 'mobile' && (
        <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            {weekOverview.total === 0 ? (
              'No events scheduled this week'
            ) : (
              `${weekOverview.total} events this week • ${weekOverview.dailyAverage} avg/day • ${weekOverview.completed} completed`
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default WeeklyView;
