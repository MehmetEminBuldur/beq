/**
 * DraggableObjectsDemo Component
 * 
 * Demo component showcasing draggable bricks and quantas with the calendar
 */

'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { addHours, setHours, setMinutes, addDays, startOfDay } from 'date-fns';

import { 
  DraggableBrick, 
  DraggableQuanta, 
  DragStyleProvider,
  useDragSystem,
  type DragResult
} from '@/components/calendar';

import { ScheduleObject } from '@/lib/calendar/types';
import { SCHEDULE_OBJECT_COLORS } from '@/lib/calendar/constants';

interface DraggableObjectsDemoProps {
  bricks?: any[];
  quantas?: any[];
  onObjectUpdate?: (object: ScheduleObject) => void;
  className?: string;
}

export function DraggableObjectsDemo({
  bricks = [],
  quantas = [],
  onObjectUpdate,
  className = '',
}: DraggableObjectsDemoProps) {

  // Convert bricks and quantas to schedule objects
  const scheduleObjects = useMemo((): ScheduleObject[] => {
    const objects: ScheduleObject[] = [];
    
    // Convert bricks
    bricks.forEach((brick, index) => {
      const baseDate = addDays(new Date(), Math.floor(index / 2));
      const startTime = addHours(setMinutes(setHours(startOfDay(baseDate), 9), 0), (index % 2) * 4);
      const duration = Math.random() * 2 + 2; // 2-4 hours
      
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
        userId: 'user-1',
        priority: brick.priority || 'medium',
        estimatedHours: duration,
        progress: brick.progress || 0,
        dependencies: [],
      });
    });

    // Convert quantas
    quantas.forEach((quanta, index) => {
      const baseDate = addDays(new Date(), Math.floor(index / 3));
      const startTime = addHours(setMinutes(setHours(startOfDay(baseDate), 10), 30), (index % 3) * 2);
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
        userId: 'user-1',
        category: 'work',
        energy: 'medium',
      });
    });

    return objects;
  }, [bricks, quantas]);

  // Drag system integration
  const { dragState, isDragging } = useDragSystem({
    onDragStart: (object) => {
      console.log('Drag started:', object.title);
    },
    onDragMove: (object, position) => {
      console.log('Dragging:', object.title, 'to', position);
    },
    onDragEnd: (result: DragResult) => {
      console.log('Drag ended:', result);
      if (result.success && result.updatedObject) {
        onObjectUpdate?.(result.updatedObject);
      }
    },
    createGhost: true,
    enableSnapToGrid: true,
  });

  // Sample drop zones
  const dropZones = [
    { id: 'today', label: 'Today', timeSlot: { startTime: new Date(), endTime: addHours(new Date(), 1) } },
    { id: 'tomorrow', label: 'Tomorrow', timeSlot: { startTime: addDays(new Date(), 1), endTime: addHours(addDays(new Date(), 1), 1) } },
    { id: 'later', label: 'Later this week', timeSlot: { startTime: addDays(new Date(), 3), endTime: addHours(addDays(new Date(), 3), 1) } },
  ];

  return (
    <>
      <DragStyleProvider />
      
      <div className={`draggable-objects-demo p-6 bg-gray-50 dark:bg-gray-900 ${className}`}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Draggable Schedule Objects Demo
          </h2>
          
          {isDragging && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm font-medium">
                Dragging: {dragState.draggedObject?.title}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Bricks Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Bricks ({scheduleObjects.filter(o => o.type === 'brick').length})
              </h3>
              <div className="space-y-3">
                {scheduleObjects
                  .filter(obj => obj.type === 'brick')
                  .map(brick => (
                    <DraggableBrick
                      key={brick.id}
                      brick={brick}
                      showDetails={true}
                      showProgress={true}
                      showTime={true}
                      className="w-full"
                    />
                  ))}
                
                {scheduleObjects.filter(o => o.type === 'brick').length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>No bricks available</p>
                    <p className="text-sm mt-1">Create some bricks to see them here</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quantas Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Quantas ({scheduleObjects.filter(o => o.type === 'quanta').length})
              </h3>
              <div className="space-y-3">
                {scheduleObjects
                  .filter(obj => obj.type === 'quanta')
                  .map(quanta => (
                    <DraggableQuanta
                      key={quanta.id}
                      quanta={quanta}
                      showDetails={true}
                      showEnergy={true}
                      showTime={true}
                      className="w-full"
                    />
                  ))}
                
                {scheduleObjects.filter(o => o.type === 'quanta').length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>No quantas available</p>
                    <p className="text-sm mt-1">Create some quantas to see them here</p>
                  </div>
                )}
              </div>
            </div>

            {/* Drop Zones Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Drop Zones
              </h3>
              <div className="space-y-3">
                {dropZones.map(zone => (
                  <motion.div
                    key={zone.id}
                    data-drop-target
                    data-time-slot={JSON.stringify(zone.timeSlot)}
                    data-drop-label={zone.label}
                    className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:border-primary-400 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="text-center">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        {zone.label}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Drop objects here to schedule them
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Instructions */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  How to Use
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Drag bricks and quantas to the drop zones</li>
                  <li>• Use keyboard: Tab to focus, Enter/Space to start dragging</li>
                  <li>• Arrow keys to move, Enter to place, Escape to cancel</li>
                  <li>• Ghost preview shows during drag operations</li>
                  <li>• Visual feedback indicates valid/invalid drop targets</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <div>
                Total objects: {scheduleObjects.length} 
                ({scheduleObjects.filter(o => o.type === 'brick').length} bricks, {scheduleObjects.filter(o => o.type === 'quanta').length} quantas)
              </div>
              {isDragging && (
                <div className="text-blue-600 dark:text-blue-400 font-medium">
                  Dragging in progress...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default DraggableObjectsDemo;
