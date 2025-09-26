/**
 * Calendar Grid Demo Component
 * 
 * Demonstration and testing component for the calendar grid foundation
 */

'use client';

import React, { useState, useMemo } from 'react';
import { addDays, addHours, setHours, setMinutes } from 'date-fns';

import { CalendarGrid } from './CalendarGrid';
import { useResponsiveCalendar } from './hooks/useResponsiveCalendar';
import { useCalendarAccessibility } from './hooks/useCalendarAccessibility';

import {
  CalendarView,
  CalendarGridConfig,
  ScheduleObject,
  CalendarGridCell,
} from '@/lib/calendar/types';

import {
  DEFAULT_TIME_SLOT_CONFIG,
  SCHEDULE_OBJECT_COLORS,
} from '@/lib/calendar/constants';

interface CalendarGridDemoProps {
  className?: string;
}

export function CalendarGridDemo({ className = '' }: CalendarGridDemoProps) {
  // State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<CalendarView>('weekly');
  const [showDemo, setShowDemo] = useState(true);

  // Base configuration
  const baseConfig: CalendarGridConfig = {
    view: currentView,
    selectedDate,
    timeSlotConfig: DEFAULT_TIME_SLOT_CONFIG,
    showWeekends: true,
    showCurrentTimeIndicator: true,
    allowDragDrop: true,
    allowResize: true,
    compactMode: false,
  };

  // Sample events for demonstration
  const sampleEvents = useMemo((): ScheduleObject[] => {
    const today = new Date();
    const startOfToday = setMinutes(setHours(today, 9), 0); // 9:00 AM

    return [
      {
        id: 'brick-1',
        title: 'Complete Project Alpha',
        description: 'Finish the main components for Project Alpha',
        startTime: startOfToday,
        endTime: addHours(startOfToday, 2),
        type: 'brick',
        status: 'in_progress',
        color: SCHEDULE_OBJECT_COLORS.brick.primary,
        backgroundColor: SCHEDULE_OBJECT_COLORS.brick.background,
        borderColor: SCHEDULE_OBJECT_COLORS.brick.border,
        isAllDay: false,
        isRecurring: false,
        userId: 'user-1',
        priority: 'high',
        estimatedHours: 2,
        progress: 45,
        dependencies: [],
      },
      {
        id: 'quanta-1',
        title: 'Review PRs',
        description: 'Review pending pull requests',
        startTime: addHours(startOfToday, 3),
        endTime: addHours(startOfToday, 3.5),
        type: 'quanta',
        status: 'pending',
        color: SCHEDULE_OBJECT_COLORS.quanta.primary,
        backgroundColor: SCHEDULE_OBJECT_COLORS.quanta.background,
        borderColor: SCHEDULE_OBJECT_COLORS.quanta.border,
        isAllDay: false,
        isRecurring: false,
        userId: 'user-1',
        category: 'work',
        energy: 'medium',
      },
      {
        id: 'meeting-1',
        title: 'Team Standup',
        description: 'Daily team standup meeting',
        startTime: addHours(startOfToday, 4),
        endTime: addHours(startOfToday, 4.5),
        type: 'meeting',
        status: 'upcoming',
        color: SCHEDULE_OBJECT_COLORS.meeting.primary,
        backgroundColor: SCHEDULE_OBJECT_COLORS.meeting.background,
        borderColor: SCHEDULE_OBJECT_COLORS.meeting.border,
        isAllDay: false,
        isRecurring: true,
        userId: 'user-1',
        attendees: ['user-1', 'user-2', 'user-3'],
        organizer: 'user-2',
        isRequired: true,
      },
      {
        id: 'event-1',
        title: 'Lunch Break',
        description: 'Lunch with the team',
        startTime: addHours(startOfToday, 5),
        endTime: addHours(startOfToday, 6),
        type: 'event',
        status: 'upcoming',
        color: SCHEDULE_OBJECT_COLORS.event.primary,
        backgroundColor: SCHEDULE_OBJECT_COLORS.event.background,
        borderColor: SCHEDULE_OBJECT_COLORS.event.border,
        isAllDay: false,
        isRecurring: false,
        userId: 'user-1',
        source: 'internal',
      },
      // Tomorrow's events
      {
        id: 'brick-2',
        title: 'Design System Updates',
        description: 'Update the design system components',
        startTime: addHours(addDays(startOfToday, 1), 2),
        endTime: addHours(addDays(startOfToday, 1), 5),
        type: 'brick',
        status: 'pending',
        color: SCHEDULE_OBJECT_COLORS.brick.primary,
        backgroundColor: SCHEDULE_OBJECT_COLORS.brick.background,
        borderColor: SCHEDULE_OBJECT_COLORS.brick.border,
        isAllDay: false,
        isRecurring: false,
        userId: 'user-1',
        priority: 'medium',
        estimatedHours: 3,
        progress: 0,
        dependencies: ['brick-1'],
      },
    ] as ScheduleObject[];
  }, []);

  // Use responsive calendar hook
  const { adaptedConfig, responsiveState } = useResponsiveCalendar(baseConfig);

  // Handle interactions
  const handleCellClick = (cell: CalendarGridCell) => {
    console.log('Cell clicked:', cell);
  };

  const handleEventClick = (event: ScheduleObject, cell: CalendarGridCell) => {
    console.log('Event clicked:', event, 'in cell:', cell);
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleViewChange = (view: CalendarView) => {
    setCurrentView(view);
  };

  const handleDragStart = (object: ScheduleObject) => {
    console.log('Drag started:', object);
  };

  const handleDragEnd = (result: any) => {
    console.log('Drag ended:', result);
  };

  const handleEventUpdate = (object: ScheduleObject) => {
    console.log('Event updated:', object);
  };

  if (!showDemo) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Calendar Grid Foundation</h2>
        <p className="text-gray-600 mb-4">Demo is hidden. Click to show.</p>
        <button
          onClick={() => setShowDemo(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
        >
          Show Demo
        </button>
      </div>
    );
  }

  return (
    <div className={`calendar-grid-demo ${className}`}>
      {/* Demo Header */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Calendar Grid Foundation Demo
          </h2>
          <button
            onClick={() => setShowDemo(false)}
            className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Hide Demo
          </button>
        </div>
        
        {/* Controls */}
        <div className="mt-4 flex flex-wrap gap-4 items-center">
          {/* View Switcher */}
          <div className="flex gap-1 bg-white dark:bg-gray-700 rounded-lg p-1">
            {(['daily', 'weekly', 'monthly'] as CalendarView[]).map((view) => (
              <button
                key={view}
                onClick={() => handleViewChange(view)}
                className={`px-3 py-1 text-sm rounded ${
                  currentView === view
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>

          {/* Date Navigation */}
          <div className="flex gap-2 items-center">
            <button
              onClick={() => handleDateChange(addDays(selectedDate, -1))}
              className="px-2 py-1 text-sm bg-white dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              ← Prev
            </button>
            <span className="text-sm font-medium px-3">
              {selectedDate.toLocaleDateString()}
            </span>
            <button
              onClick={() => handleDateChange(addDays(selectedDate, 1))}
              className="px-2 py-1 text-sm bg-white dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Next →
            </button>
          </div>

          {/* Today Button */}
          <button
            onClick={() => handleDateChange(new Date())}
            className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            Today
          </button>
        </div>

        {/* Responsive State Info */}
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          <span>Screen: {responsiveState.screenSize}</span>
          <span className="mx-2">•</span>
          <span>Touch: {responsiveState.isTouchDevice ? 'Yes' : 'No'}</span>
          <span className="mx-2">•</span>
          <span>Compact: {adaptedConfig.compactMode ? 'Yes' : 'No'}</span>
          <span className="mx-2">•</span>
          <span>Size: {responsiveState.availableWidth}×{responsiveState.availableHeight}</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
        <CalendarGrid
          config={adaptedConfig}
          events={sampleEvents}
          onCellClick={handleCellClick}
          onEventClick={handleEventClick}
          onDateChange={handleDateChange}
          onViewChange={handleViewChange}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onEventUpdate={handleEventUpdate}
          className="min-h-[500px]"
        />
      </div>

      {/* Event Legend */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">
          Event Types Legend
        </h3>
        <div className="flex flex-wrap gap-4 text-xs">
          {Object.entries(SCHEDULE_OBJECT_COLORS).map(([type, colors]) => (
            <div key={type} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: colors.primary }}
              />
              <span className="text-gray-700 dark:text-gray-300 capitalize">
                {type}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Instructions */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-sm font-semibold mb-2 text-blue-900 dark:text-blue-100">
          Demo Instructions
        </h3>
        <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Switch between daily, weekly, and monthly views</li>
          <li>• Navigate dates using the prev/next buttons or keyboard arrows</li>
          <li>• Click on time slots and events to interact</li>
          <li>• Resize your browser window to test responsive behavior</li>
          <li>• Use keyboard navigation: Arrow keys to move, Enter to select</li>
          <li>• Press 'd', 'w', 'm' to switch views, 't' to go to today</li>
        </ul>
      </div>
    </div>
  );
}

export default CalendarGridDemo;
