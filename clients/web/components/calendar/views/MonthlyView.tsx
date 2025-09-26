/**
 * MonthlyView Component
 * 
 * Traditional calendar grid view showing a full month
 */

'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isToday, 
  isSameMonth,
  isSameDay,
  getDay,
  startOfDay,
  endOfDay,
  addDays,
  subDays
} from 'date-fns';

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
  SCHEDULE_OBJECT_COLORS,
} from '@/lib/calendar/constants';

interface MonthlyViewProps {
  selectedDate: Date;
  events?: ScheduleObject[];
  timeSlotConfig?: TimeSlotConfig;
  compactMode?: boolean;
  showWeekNumbers?: boolean;
  weekStartsOn?: 0 | 1; // 0 = Sunday, 1 = Monday
  onCellClick?: (cell: CalendarGridCell) => void;
  onEventClick?: (event: ScheduleObject, cell: CalendarGridCell) => void;
  onDateChange?: (date: Date) => void;
  onDragStart?: (object: ScheduleObject) => void;
  onDragEnd?: (result: any) => void;
  onEventUpdate?: (object: ScheduleObject) => void;
  className?: string;
}

interface MonthDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  events: ScheduleObject[];
  eventCount: number;
  completedCount: number;
  weekNumber?: number;
}

export function MonthlyView({
  selectedDate,
  events = [],
  timeSlotConfig = DEFAULT_TIME_SLOT_CONFIG,
  compactMode = false,
  showWeekNumbers = false,
  weekStartsOn = 1, // Monday
  onCellClick,
  onEventClick,
  onDateChange,
  onDragStart,
  onDragEnd,
  onEventUpdate,
  className = '',
}: MonthlyViewProps) {

  // Create base configuration for monthly view
  const baseConfig: CalendarGridConfig = useMemo(() => ({
    view: 'monthly' as CalendarView,
    selectedDate,
    timeSlotConfig: {
      ...timeSlotConfig,
      firstDayOfWeek: weekStartsOn,
    },
    showWeekends: true,
    showCurrentTimeIndicator: false, // Not relevant for monthly view
    allowDragDrop: true,
    allowResize: false, // Events in monthly view are typically all-day
    compactMode,
  }), [selectedDate, timeSlotConfig, weekStartsOn, compactMode]);

  // Use responsive calendar hook for adaptations
  const { adaptedConfig, responsiveState } = useResponsiveCalendar(baseConfig);

  // Calculate month range and days
  const monthData = useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    
    // Get the calendar grid (6 weeks starting from the week containing the 1st)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn });
    
    // Ensure we have exactly 6 weeks (42 days) for consistent layout
    const sixWeeksEnd = addDays(calendarStart, 41);
    const gridEnd = calendarEnd > sixWeeksEnd ? calendarEnd : sixWeeksEnd;
    
    const allDays = eachDayOfInterval({ start: calendarStart, end: gridEnd });

    // Group days into weeks
    const weeks: MonthDay[][] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      const week = allDays.slice(i, i + 7).map((date, dayIndex) => {
        const dayEvents = events.filter(event => {
          return isSameDay(new Date(event.startTime), date) || 
                 isSameDay(new Date(event.endTime), date);
        });

        const weekNumber = showWeekNumbers ? Math.ceil((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)) : undefined;

        return {
          date,
          isCurrentMonth: isSameMonth(date, selectedDate),
          isToday: isToday(date),
          isWeekend: [0, 6].includes(getDay(date)),
          events: dayEvents,
          eventCount: dayEvents.length,
          completedCount: dayEvents.filter(e => e.status === 'completed').length,
          weekNumber: dayIndex === 0 ? weekNumber : undefined, // Only first day of week gets week number
        };
      });
      weeks.push(week);
    }

    return {
      monthStart,
      monthEnd,
      calendarStart,
      calendarEnd: gridEnd,
      weeks,
      totalDays: allDays.length,
    };
  }, [selectedDate, events, weekStartsOn, showWeekNumbers]);

  // Month header information
  const monthInfo = useMemo(() => {
    const monthName = format(selectedDate, 'MMMM');
    const year = format(selectedDate, 'yyyy');
    const monthNumber = format(selectedDate, 'M');
    const isCurrentMonth = isSameMonth(selectedDate, new Date());

    return {
      monthName,
      year,
      monthNumber,
      isCurrentMonth,
      displayText: `${monthName} ${year}`,
    };
  }, [selectedDate]);

  // Month statistics
  const monthStats = useMemo(() => {
    const monthEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return isSameMonth(eventDate, selectedDate);
    });

    const totalEvents = monthEvents.length;
    const completed = monthEvents.filter(e => e.status === 'completed').length;
    const inProgress = monthEvents.filter(e => e.status === 'in_progress').length;
    const upcoming = monthEvents.filter(e => e.status === 'upcoming' || e.status === 'pending').length;

    const busyDays = monthData.weeks
      .flat()
      .filter(day => day.isCurrentMonth && day.eventCount > 0).length;

    return {
      total: totalEvents,
      completed,
      inProgress,
      upcoming,
      busyDays,
      averagePerDay: monthData.weeks.flat().filter(d => d.isCurrentMonth).length > 0 
        ? Math.round(totalEvents / monthData.weeks.flat().filter(d => d.isCurrentMonth).length * 10) / 10 
        : 0,
    };
  }, [events, selectedDate, monthData.weeks]);

  // Week day headers
  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn });
    return eachDayOfInterval({ start, end: addDays(start, 6) }).map(day => ({
      short: format(day, 'E'), // Mon, Tue, etc.
      long: format(day, 'EEEE'), // Monday, Tuesday, etc.
    }));
  }, [weekStartsOn]);

  // Handle day click
  const handleDayClick = (day: MonthDay) => {
    const cell: CalendarGridCell = {
      id: `cell-${format(day.date, 'yyyy-MM-dd')}`,
      date: day.date,
      events: day.events,
      isToday: day.isToday,
      isSelected: isSameDay(day.date, selectedDate),
      isWeekend: day.isWeekend,
      isOutsideMonth: !day.isCurrentMonth,
      isDragTarget: false,
      isDroppable: true,
      row: 0,
      column: 0,
    };

    onCellClick?.(cell);
    onDateChange?.(day.date);
  };

  // Handle event click
  const handleEventClick = (event: ScheduleObject, day: MonthDay, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const cell: CalendarGridCell = {
      id: `cell-${format(day.date, 'yyyy-MM-dd')}`,
      date: day.date,
      events: day.events,
      isToday: day.isToday,
      isSelected: isSameDay(day.date, selectedDate),
      isWeekend: day.isWeekend,
      isOutsideMonth: !day.isCurrentMonth,
      isDragTarget: false,
      isDroppable: true,
      row: 0,
      column: 0,
    };

    onEventClick?.(event, cell);
  };

  return (
    <motion.div
      className={`monthly-view flex flex-col h-full ${className}`}
      variants={ANIMATIONS.variants.fadeIn}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Month Header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Month Information */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {monthInfo.displayText}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {monthStats.busyDays} busy days • {monthStats.total} events
                {monthInfo.isCurrentMonth && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                    Current month
                  </span>
                )}
              </p>
            </div>

            {/* Month Statistics */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-600 dark:text-gray-300">
                    {monthStats.completed}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-gray-600 dark:text-gray-300">
                    {monthStats.inProgress}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-gray-600 dark:text-gray-300">
                    {monthStats.upcoming}
                  </span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Daily average
                </div>
                <div className="text-lg font-medium text-gray-900 dark:text-white">
                  {monthStats.averagePerDay}
                </div>
              </div>
            </div>
          </div>

          {/* Quick actions for mobile */}
          {responsiveState.screenSize === 'mobile' && (
            <div className="mt-4 flex gap-2 overflow-x-auto">
              <button
                onClick={() => onDateChange?.(new Date())}
                className="flex-shrink-0 px-3 py-1 text-xs bg-primary-100 text-primary-700 rounded-full hover:bg-primary-200 dark:bg-primary-900 dark:text-primary-300"
              >
                This Month
              </button>
              <button className="flex-shrink-0 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">
                Add Event
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Week day headers */}
        <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-600">
            {showWeekNumbers && (
              <div className="bg-gray-100 dark:bg-gray-700 p-2 text-xs font-medium text-gray-500 dark:text-gray-400 text-center">
                Week
              </div>
            )}
            {weekDays.map((day, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-750 p-3 text-center"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {responsiveState.screenSize === 'mobile' ? day.short : day.long}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar days */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-600 h-full">
            {monthData.weeks.map((week, weekIndex) => 
              week.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`
                    bg-white dark:bg-gray-800 p-2 cursor-pointer transition-colors min-h-[120px]
                    hover:bg-gray-50 dark:hover:bg-gray-750
                    ${!day.isCurrentMonth ? 'opacity-40' : ''}
                    ${day.isToday ? 'ring-2 ring-primary-500 ring-inset' : ''}
                    ${day.isWeekend ? 'bg-gray-25 dark:bg-gray-825' : ''}
                  `}
                  onClick={() => handleDayClick(day)}
                >
                  {/* Week number (first day of week only) */}
                  {showWeekNumbers && day.weekNumber && dayIndex === 0 && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                      W{day.weekNumber}
                    </div>
                  )}

                  {/* Day number */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`
                      text-sm font-medium
                      ${day.isToday 
                        ? 'flex items-center justify-center w-6 h-6 bg-primary-600 text-white rounded-full' 
                        : day.isCurrentMonth 
                          ? 'text-gray-900 dark:text-white' 
                          : 'text-gray-400 dark:text-gray-500'
                      }
                    `}>
                      {format(day.date, 'd')}
                    </span>
                    
                    {/* Event count indicator */}
                    {day.eventCount > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {day.eventCount}
                      </span>
                    )}
                  </div>

                  {/* Events preview */}
                  <div className="space-y-1">
                    {day.events.slice(0, compactMode ? 2 : 3).map((event, eventIndex) => (
                      <div
                        key={`${event.id}-${eventIndex}`}
                        className={`
                          text-xs p-1 rounded truncate cursor-pointer
                          hover:opacity-80 transition-opacity
                        `}
                        style={{ 
                          backgroundColor: event.backgroundColor,
                          color: event.color,
                        }}
                        onClick={(e) => handleEventClick(event, day, e)}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    
                    {/* More events indicator */}
                    {day.eventCount > (compactMode ? 2 : 3) && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 px-1">
                        +{day.eventCount - (compactMode ? 2 : 3)} more
                      </div>
                    )}
                  </div>

                  {/* Progress indicators */}
                  {day.completedCount > 0 && (
                    <div className="mt-2 flex justify-end">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {day.completedCount}/{day.eventCount}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Month Summary Footer (mobile only) */}
      {responsiveState.screenSize === 'mobile' && (
        <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            {monthStats.total === 0 ? (
              'No events this month'
            ) : (
              `${monthStats.total} events • ${monthStats.busyDays} busy days • ${monthStats.completed} completed`
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default MonthlyView;
