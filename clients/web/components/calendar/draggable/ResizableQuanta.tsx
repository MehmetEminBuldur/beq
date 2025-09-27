/**
 * ResizableQuanta Component
 * 
 * Specialized resizable component for Quanta objects with API integration
 */

'use client';

import React, { useCallback } from 'react';
import { Zap, MapPin, Clock, Battery, BatteryLow, Gauge } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { QuantaObject, ScheduleObject } from '@/lib/calendar/types';
import { scheduleAPI } from '@/lib/api/schedule';
import { ResizableScheduleObject, ResizeResult } from './ResizableScheduleObject';
import { DragResult } from './DraggableScheduleObject';

interface ResizableQuantaProps {
  quanta: QuantaObject;
  onDragStart?: (object: ScheduleObject, event: MouseEvent | TouchEvent | PointerEvent) => void;
  onDragMove?: (object: ScheduleObject, position: { x: number; y: number }) => void;
  onDragEnd?: (object: ScheduleObject, result: DragResult) => void;
  onResizeComplete?: (updatedQuanta: QuantaObject) => void;
  enableResize?: boolean;
  minDurationMinutes?: number;
  maxDurationMinutes?: number;
  showDragHandle?: boolean;
  enableKeyboardDrag?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ResizableQuanta({
  quanta,
  onDragStart,
  onDragMove,
  onDragEnd,
  onResizeComplete,
  enableResize = true,
  minDurationMinutes = 15,
  maxDurationMinutes = 240, // 4 hours (quantas are typically shorter than bricks)
  showDragHandle = true,
  enableKeyboardDrag = true,
  disabled = false,
  className = '',
}: ResizableQuantaProps) {

  // Get energy-based styling and icons
  const getEnergyIcon = () => {
    switch (quanta.energy) {
      case 'high':
        return <Battery className="w-3 h-3 text-green-600" />;
      case 'medium':
        return <Gauge className="w-3 h-3 text-yellow-600" />;
      case 'low':
        return <BatteryLow className="w-3 h-3 text-red-600" />;
      default:
        return <Gauge className="w-3 h-3 text-gray-600" />;
    }
  };

  const getCategoryIcon = () => {
    switch (quanta.category) {
      case 'work':
        return <Zap className="w-3 h-3" />;
      case 'personal':
        return <Clock className="w-3 h-3" />;
      case 'health':
        return <Battery className="w-3 h-3" />;
      case 'learning':
        return <Gauge className="w-3 h-3" />;
      default:
        return <Zap className="w-3 h-3" />;
    }
  };

  const getEnergyColor = () => {
    switch (quanta.energy) {
      case 'high':
        return {
          color: '#059669',
          backgroundColor: '#f0fdf4',
          borderColor: '#059669',
        };
      case 'medium':
        return {
          color: '#d97706',
          backgroundColor: '#fffbeb',
          borderColor: '#d97706',
        };
      case 'low':
        return {
          color: '#dc2626',
          backgroundColor: '#fef2f2',
          borderColor: '#dc2626',
        };
      default:
        return {
          color: '#4b5563',
          backgroundColor: '#f9fafb',
          borderColor: '#4b5563',
        };
    }
  };

  const getCategoryBadgeColor = () => {
    switch (quanta.category) {
      case 'work':
        return 'bg-blue-100 text-blue-800';
      case 'personal':
        return 'bg-purple-100 text-purple-800';
      case 'health':
        return 'bg-green-100 text-green-800';
      case 'learning':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate duration in minutes for display
  const getDurationMinutes = useCallback(() => {
    const diffMs = quanta.endTime.getTime() - quanta.startTime.getTime();
    return Math.round(diffMs / (1000 * 60));
  }, [quanta.startTime, quanta.endTime]);

  // Format duration for display
  const formatDuration = useCallback((minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  }, []);

  // Handle resize end with API update
  const handleResizeEnd = useCallback(async (object: ScheduleObject, result: ResizeResult) => {
    if (!result.success || !result.newStartTime || !result.newEndTime) {
      toast.error('Failed to resize quanta');
      return;
    }

    try {
      // Show loading toast
      const loadingToast = toast.loading('Updating quanta duration...');

      // Update via API
      const apiResult = await scheduleAPI.updateScheduleTime(
        quanta.id,
        'quanta',
        result.newStartTime,
        result.newEndTime
      );

      toast.dismiss(loadingToast);

      if (apiResult.success) {
        // Create updated quanta object
        const updatedQuanta: QuantaObject = {
          ...quanta,
          startTime: result.newStartTime,
          endTime: result.newEndTime,
        };

        toast.success(`Quanta duration updated to ${formatDuration(result.newDuration!)}`);
        onResizeComplete?.(updatedQuanta);
      } else {
        throw new Error(apiResult.error || 'Failed to update quanta');
      }

    } catch (error) {
      console.error('Failed to update quanta duration:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update quanta duration');
    }
  }, [quanta, onResizeComplete, formatDuration]);

  // Enhanced styling based on energy and category
  const quantaColors = getEnergyColor();
  const enhancedQuanta = {
    ...quanta,
    ...quantaColors,
  };

  return (
    <ResizableScheduleObject
      object={enhancedQuanta}
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
      {/* Quanta-specific content */}
      <div className="p-3 h-full flex flex-col">
        {/* Header with category and energy */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            {getCategoryIcon()}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${getCategoryBadgeColor()}`}>
              {quanta.category}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {getEnergyIcon()}
            <span className="text-xs font-medium opacity-75">
              {quanta.energy.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm leading-tight mb-2 flex-1">
          {quanta.title}
        </h3>

        {/* Location (if specified) */}
        {quanta.location && (
          <div className="flex items-center gap-1 text-xs opacity-75 mb-2">
            <MapPin className="w-3 h-3" />
            <span>{quanta.location}</span>
          </div>
        )}

        {/* Footer with duration */}
        <div className="flex items-center justify-between text-xs opacity-75">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(getDurationMinutes())}
          </span>
          <span className="text-xs opacity-60">
            {quanta.status}
          </span>
        </div>

        {/* Brick relationship indicator */}
        {quanta.brickId && (
          <div className="mt-1 text-xs opacity-60">
            <span>Part of Brick</span>
          </div>
        )}

        {/* Energy level indicator bar */}
        <div className="mt-2 bg-white bg-opacity-30 rounded-full h-1">
          <div 
            className="bg-current h-1 rounded-full transition-all"
            style={{ 
              width: quanta.energy === 'high' ? '100%' : 
                     quanta.energy === 'medium' ? '66%' : '33%' 
            }}
          />
        </div>
      </div>
    </ResizableScheduleObject>
  );
}
