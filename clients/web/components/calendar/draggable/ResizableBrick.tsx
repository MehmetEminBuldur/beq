/**
 * ResizableBrick Component
 * 
 * Specialized resizable component for Brick objects with API integration
 */

'use client';

import React, { useCallback } from 'react';
import { Target, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { BrickObject, ScheduleObject } from '@/lib/calendar/types';
import { scheduleAPI } from '@/lib/api/schedule';
import { ResizableScheduleObject, ResizeResult } from './ResizableScheduleObject';
import { DragResult } from './DraggableScheduleObject';

interface ResizableBrickProps {
  brick: BrickObject;
  onDragStart?: (object: ScheduleObject, event: MouseEvent | TouchEvent | PointerEvent) => void;
  onDragMove?: (object: ScheduleObject, position: { x: number; y: number }) => void;
  onDragEnd?: (object: ScheduleObject, result: DragResult) => void;
  onResizeComplete?: (updatedBrick: BrickObject) => void;
  enableResize?: boolean;
  minDurationMinutes?: number;
  maxDurationMinutes?: number;
  showDragHandle?: boolean;
  enableKeyboardDrag?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ResizableBrick({
  brick,
  onDragStart,
  onDragMove,
  onDragEnd,
  onResizeComplete,
  enableResize = true,
  minDurationMinutes = 15,
  maxDurationMinutes = 480, // 8 hours
  showDragHandle = true,
  enableKeyboardDrag = true,
  disabled = false,
  className = '',
}: ResizableBrickProps) {

  // Get priority-based styling
  const getPriorityIcon = () => {
    switch (brick.priority) {
      case 'high':
        return <AlertCircle className="w-3 h-3 text-red-600" />;
      case 'medium':
        return <Target className="w-3 h-3 text-yellow-600" />;
      case 'low':
        return <Clock className="w-3 h-3 text-blue-600" />;
      default:
        return <Target className="w-3 h-3 text-gray-600" />;
    }
  };

  const getPriorityColor = () => {
    switch (brick.priority) {
      case 'high':
        return {
          color: '#dc2626',
          backgroundColor: '#fef2f2',
          borderColor: '#dc2626',
        };
      case 'medium':
        return {
          color: '#d97706',
          backgroundColor: '#fffbeb',
          borderColor: '#d97706',
        };
      case 'low':
        return {
          color: '#2563eb',
          backgroundColor: '#eff6ff',
          borderColor: '#2563eb',
        };
      default:
        return {
          color: '#4b5563',
          backgroundColor: '#f9fafb',
          borderColor: '#4b5563',
        };
    }
  };

  const getStatusIcon = () => {
    switch (brick.status) {
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-3 h-3 text-blue-600" />;
      case 'pending':
        return <Target className="w-3 h-3 text-gray-600" />;
      default:
        return null;
    }
  };

  // Calculate duration in hours for display
  const getDurationHours = useCallback(() => {
    const diffMs = brick.endTime.getTime() - brick.startTime.getTime();
    const hours = diffMs / (1000 * 60 * 60);
    return Math.round(hours * 10) / 10; // Round to 1 decimal place
  }, [brick.startTime, brick.endTime]);

  // Handle resize end with API update
  const handleResizeEnd = useCallback(async (object: ScheduleObject, result: ResizeResult) => {
    if (!result.success || !result.newStartTime || !result.newEndTime) {
      toast.error('Failed to resize brick');
      return;
    }

    try {
      // Show loading toast
      const loadingToast = toast.loading('Updating brick duration...');

      // Update via API
      const apiResult = await scheduleAPI.updateScheduleTime(
        brick.id,
        'brick',
        result.newStartTime,
        result.newEndTime
      );

      toast.dismiss(loadingToast);

      if (apiResult.success) {
        // Create updated brick object
        const updatedBrick: BrickObject = {
          ...brick,
          startTime: result.newStartTime,
          endTime: result.newEndTime,
        };

        toast.success(`Brick duration updated to ${Math.round(result.newDuration! / 60 * 10) / 10}h`);
        onResizeComplete?.(updatedBrick);
      } else {
        throw new Error(apiResult.error || 'Failed to update brick');
      }

    } catch (error) {
      console.error('Failed to update brick duration:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update brick duration');
    }
  }, [brick, onResizeComplete]);

  // Enhanced styling based on priority and status
  const brickColors = getPriorityColor();
  const enhancedBrick = {
    ...brick,
    ...brickColors,
  };

  return (
    <ResizableScheduleObject
      object={enhancedBrick}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onResizeEnd={handleResizeEnd}
      enableResize={enableResize}
      minDurationMinutes={minDurationMinutes}
      maxDurationMinutes={maxDurationMinutes}
      snapToMinutes={15} // Snap to 15-minute intervals
      showDragHandle={showDragHandle}
      enableKeyboardDrag={enableKeyboardDrag}
      disabled={disabled}
      className={className}
    >
      {/* Brick-specific content */}
      <div className="p-3 h-full flex flex-col">
        {/* Header with priority and status */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            {getPriorityIcon()}
            <span className="text-xs font-medium opacity-75">
              {brick.priority.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {getStatusIcon()}
            <span className="text-xs opacity-75">
              {Math.round(brick.progress)}%
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm leading-tight mb-2 flex-1">
          {brick.title}
        </h3>

        {/* Footer with duration and estimated hours */}
        <div className="flex items-center justify-between text-xs opacity-75">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {getDurationHours()}h
          </span>
          {brick.estimatedHours && (
            <span title={`Estimated: ${brick.estimatedHours}h`}>
              Est: {brick.estimatedHours}h
            </span>
          )}
        </div>

        {/* Progress bar */}
        {brick.progress > 0 && (
          <div className="mt-2 bg-white bg-opacity-30 rounded-full h-1">
            <div 
              className="bg-current h-1 rounded-full transition-all"
              style={{ width: `${Math.min(brick.progress, 100)}%` }}
            />
          </div>
        )}

        {/* Dependencies indicator */}
        {brick.dependencies && brick.dependencies.length > 0 && (
          <div className="mt-1 text-xs opacity-60">
            <span>Depends on {brick.dependencies.length} task{brick.dependencies.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </ResizableScheduleObject>
  );
}
