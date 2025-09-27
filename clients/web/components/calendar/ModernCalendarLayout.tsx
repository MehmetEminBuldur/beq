/**
 * ModernCalendarLayout Component
 * 
 * Modern, compact calendar layout with proper time column
 */

'use client';

import React, { useMemo, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { format, startOfDay, endOfDay, addMinutes, getHours, getMinutes } from 'date-fns';
import { TimeColumn } from './TimeColumn';
import { EventCard } from './EventCard';
import { SynchronizedScrollLayout } from './SynchronizedScrollLayout';

import {
  ScheduleObject,
  TimeSlotConfig,
  CalendarGridCell,
} from '@/lib/calendar/types';

import {
  DEFAULT_TIME_SLOT_CONFIG,
} from '@/lib/calendar/constants';

interface ModernCalendarLayoutProps {
  selectedDate: Date;
  events?: ScheduleObject[];
  timeSlotConfig?: TimeSlotConfig;
  compactMode?: boolean;
  showTimeIndicator?: boolean;
  onCellClick?: (cell: CalendarGridCell) => void;
  onEventClick?: (event: ScheduleObject, cell: CalendarGridCell) => void;
  onEventUpdate?: (event: ScheduleObject) => void;
  className?: string;
}

export function ModernCalendarLayout({
  selectedDate,
  events = [],
  timeSlotConfig = DEFAULT_TIME_SLOT_CONFIG,
  compactMode = false,
  showTimeIndicator = true,
  onCellClick,
  onEventClick,
  onEventUpdate,
  className = '',
}: ModernCalendarLayoutProps) {

  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<number | null>(null);

  // Generate time slots for the day
  const timeSlots = useMemo(() => {
    const slots = [];
    const { startHour, endHour, slotDuration } = timeSlotConfig;
    
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const time = new Date(selectedDate);
        time.setHours(hour, minute, 0, 0);
        
        const endTime = new Date(time);
        endTime.setMinutes(endTime.getMinutes() + slotDuration);
        
        slots.push({
          id: `${hour}-${minute}`,
          startTime: time,
          endTime: endTime,
          isHourMark: minute === 0,
          hour,
          minute,
        });
      }
    }
    
    return slots;
  }, [selectedDate, timeSlotConfig]);

  // Filter events for the selected day
  const dayEvents = useMemo(() => {
    const dayStart = startOfDay(selectedDate);
    const dayEnd = endOfDay(selectedDate);
    
    return events.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      
      return (
        (eventStart >= dayStart && eventStart <= dayEnd) ||
        (eventEnd >= dayStart && eventEnd <= dayEnd) ||
        (eventStart <= dayStart && eventEnd >= dayEnd)
      );
    });
  }, [events, selectedDate]);

  // Calculate current time position
  const currentTimePosition = useMemo(() => {
    if (!showTimeIndicator) return null;
    
    const now = new Date();
    const today = startOfDay(now);
    const selectedDay = startOfDay(selectedDate);
    
    // Only show for today
    if (today.getTime() !== selectedDay.getTime()) {
      return null;
    }

    const currentHour = getHours(now);
    const currentMinute = getMinutes(now);
    
    if (currentHour < timeSlotConfig.startHour || currentHour > timeSlotConfig.endHour) {
      return null;
    }

    // Calculate position
    const minutesFromStart = (currentHour - timeSlotConfig.startHour) * 60 + currentMinute;
    const slotHeight = compactMode ? 40 : 60;
    const totalMinutesPerSlot = timeSlotConfig.slotDuration;
    const position = (minutesFromStart / totalMinutesPerSlot) * slotHeight;
    
    return {
      position,
      time: format(now, 'HH:mm'),
    };
  }, [selectedDate, timeSlotConfig, showTimeIndicator, compactMode]);

  // Handle slot click
  const handleSlotClick = useCallback((slot: any) => {
    if (!onCellClick) return;
    
    const cell: CalendarGridCell = {
      id: slot.id,
      date: slot.startTime,
      timeSlot: {
        id: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        duration: timeSlotConfig.slotDuration,
        isAvailable: true,
        isCurrentTime: false,
        conflicts: [],
        row: 0,
        column: 0,
      },
      events: dayEvents.filter(event => {
        const eventStart = new Date(event.startTime);
        return eventStart >= slot.startTime && eventStart < slot.endTime;
      }),
      isToday: false,
      isSelected: false,
      isWeekend: false,
      isOutsideMonth: false,
      isDragTarget: false,
      isDroppable: true,
      row: 0,
      column: 0,
    };
    
    onCellClick(cell);
  }, [onCellClick, dayEvents]);

  // Handle event click
  const handleEventClick = useCallback((event: ScheduleObject) => {
    if (!onEventClick) return;
    
    const eventStart = new Date(event.startTime);
    const slot = timeSlots.find(s => 
      eventStart >= s.startTime && eventStart < s.endTime
    );
    
    if (slot) {
      const cell: CalendarGridCell = {
        id: slot.id,
        date: slot.startTime,
        timeSlot: {
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          duration: timeSlotConfig.slotDuration,
          isAvailable: true,
          isCurrentTime: false,
          conflicts: [],
          row: 0,
          column: 0,
        },
        events: [event],
        isToday: false,
        isSelected: false,
        isWeekend: false,
        isOutsideMonth: false,
        isDragTarget: false,
        isDroppable: true,
        row: 0,
        column: 0,
      };
      
      onEventClick(event, cell);
    }
  }, [onEventClick, timeSlots]);

  // Handle dropping anywhere on the timeline
  const handleTimelineDropAnywhere = useCallback((e: React.DragEvent) => {
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
      if (!dragData || !onEventUpdate) return;

      // Get the drop position relative to the timeline
      const timelineContainer = e.currentTarget as HTMLElement;
      const rect = timelineContainer.getBoundingClientRect();
      const dropY = e.clientY - rect.top - 64; // Subtract header height
      
      // Calculate which time slot this corresponds to
      const slotHeight = compactMode ? 40 : 60;
      const slotIndex = Math.floor(Math.max(0, dropY) / slotHeight);
      const targetSlot = timeSlots[Math.min(slotIndex, timeSlots.length - 1)];
      
      if (!targetSlot) return;

      if (dragData.type === 'event') {
        // Handle event repositioning
        const originalEvent = dragData.data;
        const duration = new Date(originalEvent.endTime).getTime() - new Date(originalEvent.startTime).getTime();
        const newEndTime = new Date(targetSlot.startTime.getTime() + duration);
        
        const updatedEvent = {
          ...originalEvent,
          startTime: targetSlot.startTime.toISOString(),
          endTime: newEndTime.toISOString(),
        };
        onEventUpdate(updatedEvent);
        console.log('Event dropped anywhere on timeline at:', targetSlot.startTime);
      } else {
        // Handle brick/quanta scheduling
        const updatedEvent = {
          ...dragData.data,
          startTime: targetSlot.startTime.toISOString(),
          endTime: targetSlot.endTime.toISOString(),
        };
        onEventUpdate(updatedEvent);
      }
    } catch (error) {
      console.error('Error handling timeline drop:', error);
    }
  }, [timeSlots, onEventUpdate, compactMode]);

  const slotHeight = compactMode ? 40 : 60;

  // Create time column component
  const timeColumnComponent = (
    <TimeColumn 
      timeSlotConfig={timeSlotConfig}
      compactMode={compactMode}
      className="h-full"
    />
  );

  // Create calendar component
  const calendarComponent = (
    <>
      {/* Day Header */}
      <div className="h-16 flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-10">
        <div className="h-full flex items-center justify-center px-4">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {format(selectedDate, 'EEEE')}
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {format(selectedDate, 'MMM d')}
            </div>
          </div>
        </div>
      </div>

      {/* Time Slots */}
      <div 
        className="relative"
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          
          // Show drop indicator
          const rect = e.currentTarget.getBoundingClientRect();
          const dropY = e.clientY - rect.top;
          setDragOverPosition(dropY);
        }}
        onDragLeave={() => {
          setDragOverPosition(null);
        }}
        onDrop={(e) => {
          setDragOverPosition(null);
          handleTimelineDropAnywhere(e);
        }}
      >
          {timeSlots.map((slot) => {
            const slotEvents = dayEvents.filter(event => {
              const eventStart = new Date(event.startTime);
              return eventStart >= slot.startTime && eventStart < slot.endTime;
            });

            return (
              <div
                key={slot.id}
                className={`
                  relative border-b border-gray-100 dark:border-gray-700 
                  hover:bg-gray-50 dark:hover:bg-gray-800 
                  cursor-pointer transition-colors duration-150
                  ${hoveredSlot === slot.id ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}
                  ${slot.isHourMark ? 'border-b-gray-200 dark:border-b-gray-600' : ''}
                `}
                style={{ height: `${slotHeight}px` }}
                onClick={() => handleSlotClick(slot)}
                onMouseEnter={() => setHoveredSlot(slot.id)}
                onMouseLeave={() => setHoveredSlot(null)}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'copy';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  try {
                    const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
                    if (dragData && onEventUpdate) {
                      if (dragData.type === 'event') {
                        // Handle event repositioning
                        const originalEvent = dragData.data;
                        const duration = new Date(originalEvent.endTime).getTime() - new Date(originalEvent.startTime).getTime();
                        const newEndTime = new Date(slot.startTime.getTime() + duration);
                        
                        const updatedEvent = {
                          ...originalEvent,
                          startTime: slot.startTime.toISOString(),
                          endTime: newEndTime.toISOString(),
                        };
                        onEventUpdate(updatedEvent);
                        console.log('Event moved to:', slot.startTime);
                      } else {
                        // Handle brick/quanta scheduling
                        const updatedEvent = {
                          ...dragData.data,
                          startTime: slot.startTime.toISOString(),
                          endTime: slot.endTime.toISOString(),
                        };
                        onEventUpdate(updatedEvent);
                      }
                    }
                  } catch (error) {
                    console.error('Error handling drop:', error);
                  }
                }}
              >
                {/* Events in this slot */}
                {slotEvents.length > 0 && (
                  <div className="absolute inset-1 flex flex-col gap-1 overflow-hidden">
                    {slotEvents.slice(0, 2).map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onClick={() => handleEventClick(event)}
                        onDragStart={(draggedEvent) => {
                          console.log('Event drag started:', draggedEvent.title);
                        }}
                        onDragEnd={(draggedEvent) => {
                          console.log('Event drag ended:', draggedEvent.title);
                        }}
                        compactMode={true}
                        draggable={true}
                        className="text-xs hover:shadow-md transition-shadow"
                      />
                    ))}
                    {slotEvents.length > 2 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center bg-white/70 dark:bg-gray-800/70 rounded-lg py-1">
                        +{slotEvents.length - 2} more
                      </div>
                    )}
                  </div>
                )}

                {/* Add event hint on hover */}
                {hoveredSlot === slot.id && slotEvents.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                      Click to add event
                    </div>
                  </div>
                )}
              </div>
            );
          })}

        {/* Drop indicator */}
        {dragOverPosition !== null && (
          <div 
            className="absolute left-0 right-0 z-30 pointer-events-none"
            style={{ top: `${dragOverPosition}px` }}
          >
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full -ml-1.5"></div>
              <div className="flex-1 h-0.5 bg-blue-500"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full -mr-1.5"></div>
            </div>
            <div className="absolute -top-6 left-4 bg-blue-500 text-white text-xs px-2 py-1 rounded">
              Drop here
            </div>
          </div>
        )}

        {/* Current time indicator */}
        {currentTimePosition && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute left-0 right-0 z-20 pointer-events-none"
              style={{ top: `${64 + currentTimePosition.position}px` }} // 64px for header
            >
              <div className="flex items-center">
                <div className="flex items-center justify-center w-16 h-6 bg-red-500 text-white text-xs font-medium rounded-r-full -ml-2">
                  {currentTimePosition.time}
                </div>
                <div className="flex-1 h-0.5 bg-red-500"></div>
              </div>
            </motion.div>
          )}
        </div>
    </>
  );

  return (
    <SynchronizedScrollLayout
      timeColumn={timeColumnComponent}
      calendar={calendarComponent}
      className={className}
    />
  );
}

export default ModernCalendarLayout;
