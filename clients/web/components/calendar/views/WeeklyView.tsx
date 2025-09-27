/**
 * WeeklyView Component
 * 
 * Clean weekly calendar view matching the provided design
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
  endOfDay,
  parseISO,
  differenceInMinutes,
  addMinutes,
  
} from 'date-fns';

import {
  ScheduleObject,
} from '@/lib/calendar/types';

interface WeeklyViewProps {
  selectedDate: Date;
  events?: ScheduleObject[];
  timeSlotConfig?: any;
  compactMode?: boolean;
  showWeekends?: boolean;
  weekStartsOn?: 0 | 1; // 0 = Sunday, 1 = Monday
  onCellClick?: (cell: any) => void;
  onEventClick?: (event: ScheduleObject, cell?: any) => void;
  onDateChange?: (date: Date) => void;
  onDragStart?: (object: ScheduleObject) => void;
  onDragEnd?: (result: any) => void;
  onEventUpdate?: (event: ScheduleObject) => void;
  onTimeSlotClick?: (date: Date, time: string) => void;
  className?: string;
}

import {
  DEFAULT_TIME_SLOT_CONFIG,
  ANIMATIONS,
} from '@/lib/calendar/constants';

const HOUR_HEIGHT = 80; // Height per hour in pixels

// Generate time slots based on configuration
const generateTimeSlots = (config: any) => {
  const slots = [];
  const startHour = config?.startHour || 6;
  const endHour = config?.endHour || 22;
  
  for (let hour = startHour; hour <= endHour; hour++) {
    const time12 = hour === 0 ? '12:00 AM' 
      : hour < 12 ? `${hour}:00 AM`
      : hour === 12 ? '12:00 PM'
      : `${hour - 12}:00 PM`;
    slots.push(time12);
  }
  
  return slots;
};

export function WeeklyView({
  selectedDate,
  events = [],
  timeSlotConfig = DEFAULT_TIME_SLOT_CONFIG,
  compactMode = false,
  showWeekends = true,
  weekStartsOn = 1, // Monday
  onCellClick,
  onEventClick,
  onDateChange,
  onDragStart,
  onDragEnd,
  onEventUpdate,
  onTimeSlotClick,
  className = '',
}: WeeklyViewProps) {

  // Generate time slots based on configuration
  const timeSlots = useMemo(() => generateTimeSlots(timeSlotConfig), [timeSlotConfig]);

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

  // Get event color based on type or content
  const getEventColor = (event: ScheduleObject) => {
    if (event.type === 'brick') {
      return 'bg-gradient-to-r from-blue-400 to-blue-500';
    } else if (event.type === 'quanta') {
      return 'bg-gradient-to-r from-green-400 to-green-500';
    } else {
      // Color based on title/content
      const colors = [
        'bg-gradient-to-r from-pink-400 to-rose-500',
        'bg-gradient-to-r from-purple-400 to-purple-500',
        'bg-gradient-to-r from-indigo-400 to-indigo-500',
        'bg-gradient-to-r from-cyan-400 to-cyan-500',
        'bg-gradient-to-r from-teal-400 to-teal-500',
        'bg-gradient-to-r from-emerald-400 to-emerald-500',
        'bg-gradient-to-r from-yellow-400 to-yellow-500',
        'bg-gradient-to-r from-orange-400 to-orange-500',
      ];
      const hash = event.title.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      return colors[hash % colors.length];
    }
  };

  // Calculate event position and height
  const getEventStyle = (event: ScheduleObject, dayIndex: number) => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    const configStartHour = timeSlotConfig?.startHour || 6;
    
    // Calculate start time in minutes from config start hour
    const startHour = eventStart.getHours();
    const startMinute = eventStart.getMinutes();
    const startFromConfigStart = (startHour - configStartHour) * 60 + startMinute;
    
    // Calculate duration in minutes
    const durationMinutes = differenceInMinutes(eventEnd, eventStart);
    
    // Convert to pixels
    const top = Math.max(0, (startFromConfigStart / 60) * HOUR_HEIGHT);
    const height = Math.max(20, (durationMinutes / 60) * HOUR_HEIGHT);
    
    return {
      top: `${top}px`,
      height: `${height}px`,
      left: `${dayIndex * (100 / weekRange.days.length)}%`,
      width: `${100 / weekRange.days.length}%`,
    };
  };

  return (
    <div className={`weekly-view flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}>
      {/* Week Header */}
      <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        {/* Days Header */}
        <div className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700">
          {/* Empty cell for time column */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800"></div>
          
          {/* Day headers */}
          {weekRange.days.map((day, index) => (
            <div
              key={day.toISOString()}
              className={`p-4 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                isToday(day) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
              onClick={() => onDateChange?.(day)}
            >
              <div className={`text-xs font-medium uppercase tracking-wide mb-1 ${
                isToday(day) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {format(day, 'EEE')}
              </div>
              <div className={`text-lg font-semibold ${
                isToday(day) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
              }`}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Body */}
      <div className="flex-1 overflow-auto">
        <div className="relative">
          {/* Time slots and grid */}
          <div className="grid grid-cols-8">
            {/* Time column */}
            <div className="bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
              {timeSlots.map((time, index) => (
                <div
                  key={time}
                  className="h-20 flex items-start justify-end pr-4 pt-2 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700"
                >
                  {time}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekRange.days.map((day, dayIndex) => (
              <div
                key={day.toISOString()}
                className="relative border-r border-gray-200 dark:border-gray-700 last:border-r-0"
              >
                {/* Time slot grid */}
                {timeSlots.map((time, timeIndex) => (
                  <div
                    key={`${day.toISOString()}-${time}`}
                    className="h-20 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => {
                      onTimeSlotClick?.(day, time);
                      onCellClick?.({ date: day, time, dayIndex, timeIndex });
                    }}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Events overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="grid grid-cols-8 h-full">
              {/* Skip time column */}
              <div></div>
              
              {/* Event containers for each day */}
              {weekRange.days.map((day, dayIndex) => (
                <div key={day.toISOString()} className="relative">
                  {weekEvents
                    .filter(event => isSameDay(new Date(event.startTime), day))
                    .map((event, eventIndex) => {
                      const style = getEventStyle(event, 0); // dayIndex is 0 since we're in the day's container
                      return (
                        <div
                          key={`${event.id}-${eventIndex}`}
                          className={`absolute pointer-events-auto cursor-pointer rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-2 mx-1 ${getEventColor(event)} text-white`}
                          style={{
                            top: style.top,
                            height: style.height,
                            width: 'calc(100% - 8px)',
                          }}
                          onClick={() => onEventClick?.(event, { date: day, time: format(new Date(event.startTime), 'h:mm a') })}
                        >
                          <div className="text-xs font-medium mb-1 truncate">
                            {event.title}
                          </div>
                          <div className="text-xs opacity-90 truncate">
                            {format(new Date(event.startTime), 'h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}
                          </div>
                          {event.description && (
                            <div className="text-xs opacity-75 mt-1 truncate">
                              {event.description}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeeklyView;
