/**
 * TimeColumn Component
 * 
 * Modern, compact time column for calendar views
 */

'use client';

import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { TimeSlotConfig } from '@/lib/calendar/types';

interface TimeColumnProps {
  timeSlotConfig: TimeSlotConfig;
  className?: string;
  compactMode?: boolean;
}

export function TimeColumn({
  timeSlotConfig,
  className = '',
  compactMode = false,
}: TimeColumnProps) {
  
  // Generate time slots for the column
  const timeSlots = useMemo(() => {
    const slots = [];
    const { startHour, endHour, slotDuration } = timeSlotConfig;
    
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        // Only show hour marks (00 minutes) in the time column
        if (minute === 0) {
          // Use a consistent date to avoid hydration mismatches
          const time = new Date(2024, 0, 1); // January 1, 2024
          time.setHours(hour, minute, 0, 0);
          
          slots.push({
            time,
            isHourMark: true,
            label: format(time, compactMode ? 'HH:mm' : 'h a'),
            shortLabel: format(time, 'HH:mm'),
          });
        }
      }
    }
    
    return slots;
  }, [timeSlotConfig, compactMode]);

  // Calculate slot height to match calendar grid
  const slotHeight = compactMode ? 40 : 60;
  const slotsPerHour = 60 / timeSlotConfig.slotDuration;
  const hourHeight = slotHeight * slotsPerHour;

  return (
    <div className={`time-column flex flex-col h-full ${className}`}>
      {/* Header spacer to align with calendar header */}
      <div className="h-16 flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="h-full flex items-center justify-center">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Time
          </span>
        </div>
      </div>

      {/* Time slots - Scrollable content */}
      <div className="flex-1 relative overflow-hidden">
        <div className="time-column-content absolute inset-0">
          {timeSlots.map((slot, index) => (
            <div
              key={index}
              className="relative border-b border-gray-100 dark:border-gray-700"
              style={{ height: `${hourHeight}px` }}
            >
              {/* Hour label */}
              <div className="absolute -top-3 left-0 right-0 flex items-center justify-center">
                <div className="bg-white dark:bg-gray-900 px-2 py-1 rounded-md shadow-sm border border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {slot.label}
                  </span>
                </div>
              </div>

            {/* Half-hour mark (if 30-minute slots) */}
            {timeSlotConfig.slotDuration === 30 && (
              <div 
                className="absolute left-1/2 transform -translate-x-1/2 w-2 h-px bg-gray-300 dark:bg-gray-600"
                style={{ top: `${hourHeight / 2}px` }}
              />
            )}

            {/* Quarter-hour marks (if 15-minute slots) */}
            {timeSlotConfig.slotDuration === 15 && (
              <>
                <div 
                  className="absolute left-1/2 transform -translate-x-1/2 w-1 h-px bg-gray-300 dark:bg-gray-600"
                  style={{ top: `${hourHeight / 4}px` }}
                />
                <div 
                  className="absolute left-1/2 transform -translate-x-1/2 w-2 h-px bg-gray-300 dark:bg-gray-600"
                  style={{ top: `${hourHeight / 2}px` }}
                />
                <div 
                  className="absolute left-1/2 transform -translate-x-1/2 w-1 h-px bg-gray-300 dark:bg-gray-600"
                  style={{ top: `${(hourHeight * 3) / 4}px` }}
                />
              </>
            )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TimeColumn;
