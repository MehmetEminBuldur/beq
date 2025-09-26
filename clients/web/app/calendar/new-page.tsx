'use client';

import React, { useState, useMemo } from 'react';
import { CalendarApp } from '@/components/calendar/CalendarApp';
import { DraggableObjectsDemo } from '@/components/calendar/DraggableObjectsDemo';
import { DragDropCalendarDemo } from '@/components/calendar/DragDropCalendarDemo';
import { DragStyleProvider } from '@/components/calendar';
import { useAuthContext } from '@/lib/providers/auth-provider';
import { useDashboard } from '@/lib/hooks/use-dashboard';
import { useBricks } from '@/lib/hooks/use-bricks';
import { CalendarGridCell, ScheduleObject } from '@/lib/calendar/types';
import { SCHEDULE_OBJECT_COLORS } from '@/lib/calendar/constants';
import { addHours, setHours, setMinutes, addDays, startOfDay } from 'date-fns';

export default function NewCalendarPage() {
  const { user } = useAuthContext();
  const { todaySchedule, stats } = useDashboard();
  const { bricks, quantas } = useBricks();

  // Convert bricks and quantas to schedule objects
  const scheduleObjects = useMemo((): ScheduleObject[] => {
    const objects: ScheduleObject[] = [];
    
    // Convert bricks to schedule objects
    bricks.forEach((brick, index) => {
      // For demo purposes, distribute bricks across the next few days
      const baseDate = addDays(new Date(), Math.floor(index / 3)); // 3 bricks per day
      const startTime = addHours(setMinutes(setHours(startOfDay(baseDate), 9), 0), (index % 3) * 3); // 9am, 12pm, 3pm
      const duration = Math.random() * 2 + 1; // 1-3 hours
      
      objects.push({
        id: `brick-${brick.id}`,
        title: brick.title,
        description: brick.description || '',
        startTime,
        endTime: addHours(startTime, duration),
        type: 'brick',
        status: brick.status === 'completed' ? 'completed' : 
               brick.status === 'in_progress' ? 'in_progress' : 'pending',
        color: SCHEDULE_OBJECT_COLORS.brick.primary,
        backgroundColor: SCHEDULE_OBJECT_COLORS.brick.background,
        borderColor: SCHEDULE_OBJECT_COLORS.brick.border,
        isAllDay: false,
        isRecurring: false,
        userId: user?.id || '',
        priority: (brick.priority === 'urgent' ? 'high' : brick.priority) || 'medium',
        estimatedHours: duration,
        progress: (brick as any).progress || 0,
        dependencies: [],
      });
    });

    // Convert quantas to schedule objects
    quantas.forEach((quanta, index) => {
      // For demo purposes, create shorter time blocks for quantas
      const baseDate = addDays(new Date(), Math.floor(index / 4)); // 4 quantas per day
      const startTime = addHours(setMinutes(setHours(startOfDay(baseDate), 10), 30), (index % 4) * 2); // 10:30am, 12:30pm, 2:30pm, 4:30pm
      const duration = Math.random() * 1.5 + 0.5; // 0.5-2 hours
      
      objects.push({
        id: `quanta-${quanta.id}`,
        title: quanta.title,
        description: quanta.description || '',
        startTime,
        endTime: addHours(startTime, duration),
        type: 'quanta',
        status: quanta.status === 'completed' ? 'completed' : 
               quanta.status === 'in_progress' ? 'in_progress' : 'pending',
        color: SCHEDULE_OBJECT_COLORS.quanta.primary,
        backgroundColor: SCHEDULE_OBJECT_COLORS.quanta.background,
        borderColor: SCHEDULE_OBJECT_COLORS.quanta.border,
        isAllDay: false,
        isRecurring: false,
        userId: user?.id || '',
        category: 'work',
        energy: 'medium',
      });
    });

    // Add some sample events for demonstration
    const sampleEvents: ScheduleObject[] = [
      {
        id: 'sample-meeting-1',
        title: 'Team Standup',
        description: 'Daily team sync meeting',
        startTime: setHours(setMinutes(new Date(), 0), 9),
        endTime: setHours(setMinutes(new Date(), 30), 9),
        type: 'meeting',
        status: 'upcoming',
        color: SCHEDULE_OBJECT_COLORS.meeting.primary,
        backgroundColor: SCHEDULE_OBJECT_COLORS.meeting.background,
        borderColor: SCHEDULE_OBJECT_COLORS.meeting.border,
        isAllDay: false,
        isRecurring: true,
        userId: user?.id || '',
        attendees: ['user-1', 'user-2', 'user-3'],
        organizer: 'user-2',
        isRequired: true,
      },
      {
        id: 'sample-event-1',
        title: 'Lunch Break',
        description: 'Team lunch at the new cafe',
        startTime: setHours(setMinutes(addDays(new Date(), 1), 0), 12),
        endTime: setHours(setMinutes(addDays(new Date(), 1), 0), 13),
        type: 'event',
        status: 'upcoming',
        color: SCHEDULE_OBJECT_COLORS.event.primary,
        backgroundColor: SCHEDULE_OBJECT_COLORS.event.background,
        borderColor: SCHEDULE_OBJECT_COLORS.event.border,
        isAllDay: false,
        isRecurring: false,
        userId: user?.id || '',
        source: 'internal',
      },
    ];

    return [...objects, ...sampleEvents];
  }, [bricks, quantas, user?.id]);

  // Handle cell clicks (for creating new events)
  const handleCellClick = (cell: CalendarGridCell) => {
    console.log('Cell clicked:', cell);
  };

  // Handle event clicks (for editing events)
  const handleEventClick = (event: ScheduleObject, cell: CalendarGridCell) => {
    console.log('Event clicked:', event, 'in cell:', cell);
    // TODO: Show event details modal
  };

  // Handle event creation
  const handleEventCreate = (cell: CalendarGridCell) => {
    console.log('Create event in cell:', cell);
    // TODO: Open event creation modal/form
    alert(`Create new event on ${cell.date.toLocaleDateString()} ${cell.timeSlot ? 'at ' + cell.timeSlot.startTime.toLocaleTimeString() : ''}`);
  };

  // Handle event updates
  const handleEventUpdate = (event: ScheduleObject) => {
    console.log('Update event:', event);
    // TODO: Save event changes to backend
  };

  // Handle event deletion
  const handleEventDelete = (event: ScheduleObject) => {
    console.log('Delete event:', event);
    // TODO: Delete event from backend
  };

  // Handle drag operations
  const handleDragStart = (object: ScheduleObject) => {
    console.log('Drag started:', object);
  };

  const handleDragEnd = (result: any) => {
    console.log('Drag ended:', result);
    if (result.success) {
      handleEventUpdate(result.updatedObject);
    }
  };

  const [showDragDemo, setShowDragDemo] = useState(false);
  const [showFullDemo, setShowFullDemo] = useState(false);

  return (
    <>
      <DragStyleProvider />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Toggle buttons */}
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <button
            onClick={() => {
              setShowDragDemo(!showDragDemo);
              setShowFullDemo(false);
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg shadow-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            {showDragDemo ? 'Hide' : 'Show'} Drag Objects
          </button>
          <button
            onClick={() => {
              setShowFullDemo(!showFullDemo);
              setShowDragDemo(false);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            {showFullDemo ? 'Hide' : 'Show'} Full Demo
          </button>
        </div>

        {/* Drag Demo Overlay */}
        {showDragDemo && (
          <div className="fixed inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Draggable Objects Demo
                </h2>
                <button
                  onClick={() => setShowDragDemo(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <DraggableObjectsDemo
                bricks={bricks}
                quantas={quantas}
                onObjectUpdate={handleEventUpdate}
              />
            </div>
          </div>
        )}

        {/* Full Drag-and-Drop Demo */}
        {showFullDemo && (
          <div className="fixed inset-0 z-40 bg-white dark:bg-gray-900">
            <div className="h-full flex flex-col">
              <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Complete Drag-and-Drop Calendar Demo
                </h2>
                <button
                  onClick={() => setShowFullDemo(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-auto">
                <DragDropCalendarDemo
                  bricks={bricks}
                  quantas={quantas}
                  existingEvents={scheduleObjects}
                  onEventUpdate={handleEventUpdate}
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Calendar */}
        <CalendarApp
          initialView="weekly"
          initialDate={new Date()}
          events={scheduleObjects}
          showToolbar={true}
          showViewSwitcher={true}
          showNavigation={true}
          showQuickActions={true}
          allowViewChange={true}
          onCellClick={handleCellClick}
          onEventClick={handleEventClick}
          onEventCreate={handleEventCreate}
          onEventUpdate={handleEventUpdate}
          onEventDelete={handleEventDelete}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          className="h-screen"
        />
      </div>
    </>
  );
}
