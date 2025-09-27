/**
 * ResizableObjectsDemo Component
 * 
 * Demo component to showcase resizable schedule objects functionality
 */

'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Maximize2, MinusCircle, PlusCircle, RotateCcw } from 'lucide-react';

import { BrickObject, QuantaObject } from '@/lib/calendar/types';
import { ResizableBrick, ResizableQuanta } from './draggable';
import { DragResult } from './draggable/DraggableScheduleObject';
import { ResizeResult } from './draggable/ResizableScheduleObject';

export function ResizableObjectsDemo() {
  // Sample brick data
  const [sampleBrick, setSampleBrick] = useState<BrickObject>({
    id: 'resize-demo-brick-1',
    title: 'Learn React Hooks',
    description: 'Deep dive into useState, useEffect, and custom hooks',
    startTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    endTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
    type: 'brick',
    status: 'in_progress',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
    isAllDay: false,
    isRecurring: false,
    userId: 'demo-user',
    priority: 'high',
    estimatedHours: 4,
    actualHours: 1.5,
    progress: 37,
    dependencies: [],
    goalId: 'learn-react-goal',
  });

  // Sample quanta data
  const [sampleQuanta, setSampleQuanta] = useState<QuantaObject>({
    id: 'resize-demo-quanta-1',
    title: 'Daily Standup Meeting',
    description: 'Team sync and progress update',
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    endTime: new Date(Date.now() + 2.5 * 60 * 60 * 1000), // 2.5 hours from now
    type: 'quanta',
    status: 'pending',
    color: '#059669',
    backgroundColor: '#f0fdf4',
    borderColor: '#059669',
    isAllDay: false,
    isRecurring: true,
    userId: 'demo-user',
    category: 'work',
    energy: 'medium',
    location: 'Conference Room A',
    brickId: 'related-brick-id',
  });

  // State for demo controls
  const [enableResize, setEnableResize] = useState(true);
  const [minDuration, setMinDuration] = useState(15);
  const [maxDuration, setMaxDuration] = useState(480);
  const [showDragHandle, setShowDragHandle] = useState(true);

  // Event handlers
  const handleBrickResize = useCallback((updatedBrick: BrickObject) => {
    setSampleBrick(updatedBrick);
    console.log('Brick resized:', updatedBrick);
  }, []);

  const handleQuantaResize = useCallback((updatedQuanta: QuantaObject) => {
    setSampleQuanta(updatedQuanta);
    console.log('Quanta resized:', updatedQuanta);
  }, []);

  const handleDragEnd = useCallback((object: any, result: DragResult) => {
    if (result.success) {
      console.log('Drag completed for:', object.title, result);
    } else {
      console.warn('Drag failed for:', object.title, result.error);
    }
  }, []);

  const resetToDefaults = () => {
    setSampleBrick(prev => ({
      ...prev,
      startTime: new Date(Date.now() + 60 * 60 * 1000),
      endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
    }));
    
    setSampleQuanta(prev => ({
      ...prev,
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 2.5 * 60 * 60 * 1000),
    }));
  };

  // Format duration for display
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const getBrickDuration = () => {
    const diffMs = sampleBrick.endTime.getTime() - sampleBrick.startTime.getTime();
    return Math.round(diffMs / (1000 * 60));
  };

  const getQuantaDuration = () => {
    const diffMs = sampleQuanta.endTime.getTime() - sampleQuanta.startTime.getTime();
    return Math.round(diffMs / (1000 * 60));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Maximize2 className="w-6 h-6 text-blue-600" />
          Resizable Schedule Objects
        </h2>
        <p className="text-gray-600">
          Drag the top/bottom edges of objects to resize their duration
        </p>
      </div>

      {/* Demo Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-50 rounded-lg p-4 space-y-4"
      >
        <h3 className="font-semibold text-gray-800 mb-3">Demo Controls</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Enable Resize Toggle */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={enableResize}
                onChange={(e) => setEnableResize(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Enable Resize</span>
            </label>
          </div>

          {/* Show Drag Handle Toggle */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showDragHandle}
                onChange={(e) => setShowDragHandle(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Show Drag Handle</span>
            </label>
          </div>

          {/* Min Duration */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Min Duration</label>
            <select
              value={minDuration}
              onChange={(e) => setMinDuration(Number(e.target.value))}
              className="w-full px-2 py-1 border rounded text-sm"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
            </select>
          </div>

          {/* Max Duration */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Max Duration</label>
            <select
              value={maxDuration}
              onChange={(e) => setMaxDuration(Number(e.target.value))}
              className="w-full px-2 py-1 border rounded text-sm"
            >
              <option value={120}>2 hours</option>
              <option value={240}>4 hours</option>
              <option value={480}>8 hours</option>
            </select>
          </div>
        </div>

        {/* Reset Button */}
        <div className="flex justify-center">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>
        </div>
      </motion.div>

      {/* Current Durations Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">Brick Duration</h4>
          <p className="text-2xl font-bold text-blue-600">
            {formatDuration(getBrickDuration())}
          </p>
          <p className="text-sm text-blue-600 mt-1">
            {sampleBrick.startTime.toLocaleTimeString()} - {sampleBrick.endTime.toLocaleTimeString()}
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2">Quanta Duration</h4>
          <p className="text-2xl font-bold text-green-600">
            {formatDuration(getQuantaDuration())}
          </p>
          <p className="text-sm text-green-600 mt-1">
            {sampleQuanta.startTime.toLocaleTimeString()} - {sampleQuanta.endTime.toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Demo Objects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Resizable Brick */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Resizable Brick</h3>
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-lg p-8 min-h-[200px] flex items-center justify-center">
            <div className="w-full max-w-sm">
              <ResizableBrick
                brick={sampleBrick}
                onResizeComplete={handleBrickResize}
                onDragEnd={handleDragEnd}
                enableResize={enableResize}
                minDurationMinutes={minDuration}
                maxDurationMinutes={maxDuration}
                showDragHandle={showDragHandle}
                className="transform"
              />
            </div>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Drag top/bottom edges to resize</p>
            <p>• Minimum: {formatDuration(minDuration)}</p>
            <p>• Maximum: {formatDuration(maxDuration)}</p>
            <p>• Snaps to 15-minute intervals</p>
          </div>
        </div>

        {/* Resizable Quanta */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Resizable Quanta</h3>
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-lg p-8 min-h-[200px] flex items-center justify-center">
            <div className="w-full max-w-sm">
              <ResizableQuanta
                quanta={sampleQuanta}
                onResizeComplete={handleQuantaResize}
                onDragEnd={handleDragEnd}
                enableResize={enableResize}
                minDurationMinutes={minDuration}
                maxDurationMinutes={Math.min(maxDuration, 240)} // Quantas max at 4h
                showDragHandle={showDragHandle}
                className="transform"
              />
            </div>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Drag top/bottom edges to resize</p>
            <p>• Minimum: {formatDuration(minDuration)}</p>
            <p>• Maximum: {formatDuration(Math.min(maxDuration, 240))}</p>
            <p>• Snaps to 15-minute intervals</p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-amber-50 border border-amber-200 rounded-lg p-4"
      >
        <h4 className="font-semibold text-amber-800 mb-2">How to Use</h4>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• <strong>Resize:</strong> Hover over the top or bottom edge of an object and drag to resize</li>
          <li>• <strong>Drag:</strong> Click and drag the main body to move the object</li>
          <li>• <strong>Constraints:</strong> Resizing respects minimum and maximum duration limits</li>
          <li>• <strong>Snapping:</strong> Duration automatically snaps to 15-minute intervals</li>
          <li>• <strong>Visual Feedback:</strong> See real-time duration updates while resizing</li>
          <li>• <strong>API Integration:</strong> Changes are automatically saved via the schedule API</li>
        </ul>
      </motion.div>
    </div>
  );
}
