/**
 * MonthlyView Component
 * 
 * Clean, modern monthly calendar view
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

import {
  ScheduleObject,
} from '@/lib/calendar/types';

interface MonthlyViewProps {
  selectedDate: Date;
  events?: ScheduleObject[];
  timeSlotConfig?: any;
  compactMode?: boolean;
  showWeekNumbers?: boolean;
  weekStartsOn?: 0 | 1; // 0 = Sunday, 1 = Monday
  onCellClick?: (cell: any) => void;
  onEventClick?: (event: ScheduleObject, cell?: any) => void;
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
  timeSlotConfig,
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

  // Get event color based on type or content
  const getEventColor = (event: ScheduleObject) => {
    if (event.type === 'brick') {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else if (event.type === 'quanta') {
      return 'bg-green-100 text-green-800 border-green-200';
    } else {
      // Color based on title/content
      const colors = [
        'bg-pink-100 text-pink-800 border-pink-200',
        'bg-purple-100 text-purple-800 border-purple-200',
        'bg-indigo-100 text-indigo-800 border-indigo-200',
        'bg-cyan-100 text-cyan-800 border-cyan-200',
        'bg-teal-100 text-teal-800 border-teal-200',
        'bg-emerald-100 text-emerald-800 border-emerald-200',
        'bg-yellow-100 text-yellow-800 border-yellow-200',
        'bg-orange-100 text-orange-800 border-orange-200',
      ];
      const hash = event.title.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      return colors[hash % colors.length];
    }
  };

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
    onCellClick?.({ date: day.date, events: day.events });
    onDateChange?.(day.date);
  };

  // Handle event click
  const handleEventClick = (event: ScheduleObject, day: MonthDay, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventClick?.(event, { date: day.date, events: day.events });
  };

  return (
    <div className={`monthly-view flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}>
      {/* Month Header */}
      <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="p-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {monthInfo.displayText}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {monthStats.total} events • {monthStats.busyDays} busy days
          </p>
        </div>
      </div>

      {/* Week day headers */}
      <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-7">
          {weekDays.map((day, index) => (
            <div
              key={index}
              className="p-3 text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0"
            >
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {day.short}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar days */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-7">
          {monthData.weeks.map((week, weekIndex) => 
            week.map((day, dayIndex) => (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className={`
                  relative border-r border-b border-gray-200 dark:border-gray-700 last:border-r-0 p-2 cursor-pointer transition-colors min-h-[120px]
                  hover:bg-gray-50 dark:hover:bg-gray-800
                  ${!day.isCurrentMonth ? 'bg-gray-25 dark:bg-gray-850 opacity-60' : 'bg-white dark:bg-gray-900'}
                  ${day.isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                `}
                onClick={() => handleDayClick(day)}
              >
                {/* Day number */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`
                    text-sm font-semibold
                    ${day.isToday 
                      ? 'flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full' 
                      : day.isCurrentMonth 
                        ? 'text-gray-900 dark:text-white' 
                        : 'text-gray-400 dark:text-gray-500'
                    }
                  `}>
                    {format(day.date, 'd')}
                  </span>
                  
                  {/* Event count indicator */}
                  {day.eventCount > 0 && (
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded-full">
                      {day.eventCount}
                    </span>
                  )}
                </div>

                {/* Events preview */}
                <div className="space-y-1">
                  {day.events.slice(0, 3).map((event, eventIndex) => (
                    <div
                      key={`${event.id}-${eventIndex}`}
                      className={`
                        text-xs px-2 py-1 rounded border cursor-pointer truncate
                        hover:shadow-sm transition-all duration-200
                        ${getEventColor(event)}
                      `}
                      onClick={(e) => handleEventClick(event, day, e)}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  
                  {/* More events indicator */}
                  {day.eventCount > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                      +{day.eventCount - 3} more
                    </div>
                  )}
                </div>

                {/* Progress indicator */}
                {day.completedCount > 0 && (
                  <div className="absolute bottom-2 right-2">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {day.completedCount}
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
  );
}

export default MonthlyView;
