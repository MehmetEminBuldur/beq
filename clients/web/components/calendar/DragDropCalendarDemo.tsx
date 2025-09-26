/**
 * DragDropCalendarDemo Component
 * 
 * Complete drag-and-drop calendar demonstration with all features integrated
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { addHours, addMinutes, startOfHour, format, addDays } from 'date-fns';
import { toast } from 'react-hot-toast';

import { 
  DraggableBrick, 
  DraggableQuanta,
  DragStyleProvider,
  CalendarGrid,
  useCalendarDrop
} from '@/components/calendar';
import { DropEnabledTimeSlot } from '@/components/calendar/DropEnabledTimeSlot';
import { DropFeedback, MiniDropFeedback, SnapIndicator } from '@/components/calendar/DropFeedback';
import { ScheduleObject, CalendarGridCell } from '@/lib/calendar/types';
import { SCHEDULE_OBJECT_COLORS } from '@/lib/calendar/constants';
import { scheduleAPI } from '@/lib/api/schedule';

interface DragDropCalendarDemoProps {
  bricks?: any[];
  quantas?: any[];
  existingEvents?: ScheduleObject[];
  onEventUpdate?: (event: ScheduleObject) => void;
  className?: string;
}

export function DragDropCalendarDemo({
  bricks = [],
  quantas = [],
  existingEvents = [],
  onEventUpdate,
  className = '',
}: DragDropCalendarDemoProps) {

  // State
  const [calendarEvents, setCalendarEvents] = useState<ScheduleObject[]>(existingEvents);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showSnapGrid, setShowSnapGrid] = useState(true);
  const [snapInterval, setSnapInterval] = useState(15);
  const [allowConflicts, setAllowConflicts] = useState(false);
  const [feedbackPosition, setFeedbackPosition] = useState<{ x: number; y: number } | null>(null);

  // Convert bricks and quantas to draggable objects
  const draggableObjects = useMemo((): ScheduleObject[] => {
    const objects: ScheduleObject[] = [];
    
    // Convert bricks
    bricks.forEach((brick, index) => {
      const startTime = addHours(new Date(), index * 2);
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
        userId: 'demo-user',
        priority: (brick.priority === 'urgent' ? 'high' : brick.priority) || 'medium',
        estimatedHours: duration,
        progress: (brick as any).progress || 0,
        dependencies: [],
      });
    });

    // Convert quantas
    quantas.forEach((quanta, index) => {
      const startTime = addMinutes(addHours(new Date(), index), 30);
      const duration = Math.random() * 90 + 30; // 30-120 minutes
      
      objects.push({
        id: `quanta-${quanta.id}`,
        title: quanta.title,
        description: quanta.description || '',
        startTime,
        endTime: addMinutes(startTime, duration),
        type: 'quanta',
        status: quanta.status === 'completed' ? 'completed' : 
               quanta.status === 'in_progress' ? 'in_progress' : 'pending',
        color: SCHEDULE_OBJECT_COLORS.quanta.primary,
        backgroundColor: SCHEDULE_OBJECT_COLORS.quanta.background,
        borderColor: SCHEDULE_OBJECT_COLORS.quanta.border,
        isAllDay: false,
        isRecurring: false,
        userId: 'demo-user',
        category: 'work',
        energy: 'medium',
      });
    });

    return objects;
  }, [bricks, quantas]);

  // Generate time slots for the demo calendar
  const timeSlots = useMemo(() => {
    const slots: Array<{
      startTime: Date;
      endTime: Date;
      events: ScheduleObject[];
    }> = [];
    
    const startHour = 8; // 8 AM
    const endHour = 20;  // 8 PM
    const slotDuration = 60; // 1 hour slots
    
    for (let hour = startHour; hour < endHour; hour++) {
      const startTime = new Date(selectedDate);
      startTime.setHours(hour, 0, 0, 0);
      const endTime = addHours(startTime, 1);
      
      // Find events in this slot
      const slotEvents = calendarEvents.filter(event => {
        const eventStart = new Date(event.startTime);
        const eventEnd = new Date(event.endTime);
        return (
          (eventStart >= startTime && eventStart < endTime) ||
          (eventEnd > startTime && eventEnd <= endTime) ||
          (eventStart <= startTime && eventEnd >= endTime)
        );
      });
      
      slots.push({
        startTime,
        endTime,
        events: slotEvents,
      });
    }
    
    return slots;
  }, [selectedDate, calendarEvents]);

  // Calendar drop handler
  const {
    dropState,
    handleDropPreview,
    handleDropEnter,
    handleDropLeave,
    handleDrop,
    getDropFeedback,
    hasConflicts,
  } = useCalendarDrop({
    existingEvents: calendarEvents,
    allowConflicts,
    snapInterval,
    showConflictWarnings: true,
    autoResolveConflicts: false,
    onEventUpdate: async (object) => {
      // Update calendar events
      setCalendarEvents(prev => 
        prev.map(event => event.id === object.id ? object : event)
      );
      onEventUpdate?.(object);
      
      // Simulate API call
      await scheduleAPI.updateScheduleTime(
        object.id,
        object.type as 'brick' | 'quanta' | 'event',
        new Date(object.startTime),
        new Date(object.endTime)
      );
    },
    onEventCreate: async (object) => {
      // Add new event to calendar
      setCalendarEvents(prev => [...prev, object]);
      onEventUpdate?.(object);
      
      // Simulate API call
      await scheduleAPI.createScheduledEvent(object);
    },
  });

  // Handle mouse move for feedback positioning
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (dropState.isDragOver) {
      setFeedbackPosition({ x: event.clientX, y: event.clientY });
    }
  }, [dropState.isDragOver]);

  // Remove event from calendar
  const handleRemoveEvent = useCallback(async (eventId: string) => {
    setCalendarEvents(prev => prev.filter(event => event.id !== eventId));
    
    // Simulate API call
    const event = calendarEvents.find(e => e.id === eventId);
    if (event) {
      await scheduleAPI.removeFromCalendar(eventId, event.type as 'brick' | 'quanta' | 'event');
      toast.success('Event removed from calendar');
    }
  }, [calendarEvents]);

  const dropFeedback = getDropFeedback();

  return (
    <>
      <DragStyleProvider />
      
      <div className={`drag-drop-calendar-demo bg-gray-50 dark:bg-gray-900 ${className}`} onMouseMove={handleMouseMove}>
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Drag-and-Drop Calendar Demo
            </h2>
            
            {/* Controls */}
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Snap Interval:
                </label>
                <select
                  value={snapInterval}
                  onChange={(e) => setSnapInterval(Number(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value={5}>5 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                </select>
              </div>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allowConflicts}
                  onChange={(e) => setAllowConflicts(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Allow Conflicts
                </span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showSnapGrid}
                  onChange={(e) => setShowSnapGrid(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Show Snap Grid
                </span>
              </label>
            </div>

            {/* Status */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {calendarEvents.length} scheduled events
              {hasConflicts && <span className="text-orange-500 ml-2">• Has conflicts</span>}
              {dropState.isDragOver && <span className="text-blue-500 ml-2">• Drop zone active</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Draggable Objects Panel */}
            <div className="lg:col-span-1 space-y-6">
              {/* Bricks */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  Bricks ({draggableObjects.filter(o => o.type === 'brick').length})
                </h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {draggableObjects
                    .filter(obj => obj.type === 'brick')
                    .map(brick => (
                      <DraggableBrick
                        key={brick.id}
                        brick={brick}
                        compact={true}
                        showDetails={false}
                        showTime={false}
                        className="w-full cursor-grab"
                      />
                    ))}
                </div>
              </div>

              {/* Quantas */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  Quantas ({draggableObjects.filter(o => o.type === 'quanta').length})
                </h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {draggableObjects
                    .filter(obj => obj.type === 'quanta')
                    .map(quanta => (
                      <DraggableQuanta
                        key={quanta.id}
                        quanta={quanta}
                        compact={true}
                        showDetails={false}
                        showTime={false}
                        className="w-full cursor-grab"
                      />
                    ))}
                </div>
              </div>
            </div>

            {/* Calendar */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                {/* Calendar Header */}
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                        className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setSelectedDate(new Date())}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Today
                      </button>
                      <button
                        onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                        className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>

                {/* Time Slots */}
                <div className="p-4">
                  <div className="space-y-1">
                    {timeSlots.map((slot, index) => (
                      <DropEnabledTimeSlot
                        key={index}
                        startTime={slot.startTime}
                        endTime={slot.endTime}
                        duration={60} // 1 hour
                        events={slot.events}
                        dropConfig={{
                          snapInterval,
                          minDuration: 15,
                          maxDuration: 480,
                          allowOverlap: allowConflicts,
                          allowConflicts,
                          requireFullSlot: false,
                        }}
                        onDrop={(result, object) => handleDrop(result, object)}
                        onDropHover={(isHovering, timeSlot) => {
                          if (isHovering) {
                            handleDropEnter(timeSlot);
                          } else {
                            handleDropLeave();
                          }
                        }}
                        onDropPreview={(previewTime, object) => {
                          handleDropPreview(object, previewTime, slot);
                        }}
                        className="min-h-[60px] border border-gray-200 dark:border-gray-600 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {/* Time label */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {format(slot.startTime, 'HH:mm')} - {format(slot.endTime, 'HH:mm')}
                          </span>
                          {slot.events.length > 0 && (
                            <span className="text-xs text-gray-500">
                              {slot.events.length} event{slot.events.length === 1 ? '' : 's'}
                            </span>
                          )}
                        </div>

                        {/* Events in this slot */}
                        <div className="space-y-1">
                          {slot.events.map(event => (
                            <div
                              key={event.id}
                              className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  event.type === 'brick' ? 'bg-orange-500' : 'bg-purple-500'
                                }`} />
                                <span className="font-medium truncate">{event.title}</span>
                                <span className="text-xs text-gray-500">
                                  {format(new Date(event.startTime), 'HH:mm')}
                                </span>
                              </div>
                              <button
                                onClick={() => handleRemoveEvent(event.id)}
                                className="text-red-500 hover:text-red-700 text-xs ml-2"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </DropEnabledTimeSlot>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              How to Use:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
              <div>
                <h5 className="font-medium mb-1">Drag & Drop:</h5>
                <ul className="space-y-1">
                  <li>• Drag bricks/quantas to calendar slots</li>
                  <li>• Visual feedback shows valid/invalid drops</li>
                  <li>• Automatic time snapping to intervals</li>
                  <li>• Conflict detection and warnings</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium mb-1">Features:</h5>
                <ul className="space-y-1">
                  <li>• Adjust snap intervals (5min to 1hour)</li>
                  <li>• Toggle conflict detection</li>
                  <li>• Visual snap grid overlay</li>
                  <li>• API integration simulation</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Drop Feedback */}
        <DropFeedback
          isVisible={dropState.isDragOver}
          draggedObject={dropState.draggedObject}
          targetTime={dropState.previewTime}
          conflictResult={dropState.conflictResult}
          isValid={dropFeedback.isValid}
          position={feedbackPosition}
          severity={dropFeedback.severity}
          message={dropFeedback.message}
        />

        {/* Mini feedback for quick validation */}
        <MiniDropFeedback
          isVisible={dropState.isDragOver && !feedbackPosition}
          isValid={dropFeedback.isValid}
          message={dropFeedback.message}
        />
      </div>
    </>
  );
}

export default DragDropCalendarDemo;
