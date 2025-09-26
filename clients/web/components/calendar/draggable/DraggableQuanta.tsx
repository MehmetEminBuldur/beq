/**
 * DraggableQuanta Component
 * 
 * Specialized draggable component for Quanta objects with quanta-specific styling and features
 */

'use client';

import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { 
  Zap, 
  Clock, 
  Battery, 
  Focus, 
  Workflow, 
  CheckCircle2,
  Pause,
  Play,
  Timer
} from 'lucide-react';

import { DraggableScheduleObject, DragResult } from './DraggableScheduleObject';
import { ScheduleObject } from '@/lib/calendar/types';

interface DraggableQuantaProps {
  quanta: ScheduleObject;
  onDragStart?: (quanta: ScheduleObject, event: MouseEvent | TouchEvent | PointerEvent) => void;
  onDragMove?: (quanta: ScheduleObject, position: { x: number; y: number }) => void;
  onDragEnd?: (quanta: ScheduleObject, result: DragResult) => void;
  showDetails?: boolean;
  showEnergy?: boolean;
  showTime?: boolean;
  compact?: boolean;
  disabled?: boolean;
  className?: string;
}

export function DraggableQuanta({
  quanta,
  onDragStart,
  onDragMove,
  onDragEnd,
  showDetails = true,
  showEnergy = true,
  showTime = true,
  compact = false,
  disabled = false,
  className = '',
}: DraggableQuantaProps) {

  // Calculate quanta metrics
  const quantaMetrics = useMemo(() => {
    const duration = (new Date(quanta.endTime).getTime() - new Date(quanta.startTime).getTime()) / (1000 * 60);
    const energy = quanta.energy || 'medium';
    const category = quanta.category || 'work';
    
    return {
      duration, // in minutes
      energy,
      category,
      isQuickTask: duration <= 30,
      isFocusTime: duration >= 90,
      timeOfDay: new Date(quanta.startTime).getHours(),
    };
  }, [quanta]);

  // Get status icon
  const getStatusIcon = () => {
    switch (quanta.status) {
      case 'completed':
        return <CheckCircle2 className="w-3 h-3 text-green-600" />;
      case 'in_progress':
        return <Play className="w-3 h-3 text-yellow-600" />;
      case 'pending':
        return <Pause className="w-3 h-3 text-blue-600" />;
      default:
        return <Timer className="w-3 h-3 text-gray-600" />;
    }
  };

  // Get energy level styling and icon
  const getEnergyInfo = () => {
    switch (quantaMetrics.energy) {
      case 'high':
        return {
          icon: <Battery className="w-3 h-3 text-red-500" />,
          color: 'text-red-600',
          bg: 'bg-red-50 border-red-200',
          label: 'High Energy',
        };
      case 'medium':
        return {
          icon: <Battery className="w-3 h-3 text-yellow-500" />,
          color: 'text-yellow-600',
          bg: 'bg-yellow-50 border-yellow-200',
          label: 'Medium Energy',
        };
      case 'low':
        return {
          icon: <Battery className="w-3 h-3 text-green-500" />,
          color: 'text-green-600',
          bg: 'bg-green-50 border-green-200',
          label: 'Low Energy',
        };
      default:
        return {
          icon: <Battery className="w-3 h-3 text-gray-500" />,
          color: 'text-gray-600',
          bg: 'bg-gray-50 border-gray-200',
          label: 'Unknown Energy',
        };
    }
  };

  // Get category icon
  const getCategoryIcon = () => {
    switch (quantaMetrics.category) {
      case 'work':
        return <Workflow className="w-3 h-3" />;
      case 'personal':
        return <Focus className="w-3 h-3" />;
      case 'learning':
        return <Focus className="w-3 h-3" />;
      default:
        return <Zap className="w-3 h-3" />;
    }
  };

  // Get duration display
  const getDurationDisplay = () => {
    if (quantaMetrics.duration < 60) {
      return `${Math.round(quantaMetrics.duration)}m`;
    } else {
      const hours = Math.floor(quantaMetrics.duration / 60);
      const minutes = Math.round(quantaMetrics.duration % 60);
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  };

  // Get time-of-day indicator
  const getTimeIndicator = () => {
    const hour = quantaMetrics.timeOfDay;
    if (hour >= 6 && hour < 12) return { label: 'Morning', color: 'text-orange-600' };
    if (hour >= 12 && hour < 17) return { label: 'Afternoon', color: 'text-blue-600' };
    if (hour >= 17 && hour < 21) return { label: 'Evening', color: 'text-purple-600' };
    return { label: 'Night', color: 'text-indigo-600' };
  };

  const energyInfo = getEnergyInfo();
  const timeIndicator = getTimeIndicator();

  return (
    <DraggableScheduleObject
      object={quanta}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      disabled={disabled}
      className={`
        quanta-object rounded-lg border-2 p-2.5 min-w-[180px] max-w-[280px]
        ${quantaMetrics.isQuickTask ? 'border-dashed' : 'border-solid'}
        ${quantaMetrics.isFocusTime ? 'ring-2 ring-purple-300 ring-opacity-50' : ''}
        ${compact ? 'p-2 min-w-[140px]' : ''}
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-start gap-2 mb-2">
        <div className="flex-shrink-0 mt-0.5">
          <Zap className="w-4 h-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium truncate ${compact ? 'text-sm' : 'text-base'}`}>
            {quanta.title}
          </h3>
          
          {showTime && (
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-1">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>
                  {format(new Date(quanta.startTime), 'HH:mm')} - {format(new Date(quanta.endTime), 'HH:mm')}
                </span>
              </div>
              <span className="text-gray-400">
                ({getDurationDisplay()})
              </span>
            </div>
          )}
        </div>

        <div className="flex-shrink-0">
          {getStatusIcon()}
        </div>
      </div>

      {/* Description */}
      {showDetails && quanta.description && !compact && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
          {quanta.description}
        </p>
      )}

      {/* Task type indicators */}
      {!compact && (
        <div className="flex items-center gap-2 mb-2">
          {quantaMetrics.isQuickTask && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Quick Task
            </span>
          )}
          {quantaMetrics.isFocusTime && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              Focus Time
            </span>
          )}
        </div>
      )}

      {/* Metadata */}
      {showDetails && (
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-3">
            {/* Category */}
            <div className="flex items-center gap-1">
              {getCategoryIcon()}
              <span className="capitalize">{quantaMetrics.category}</span>
            </div>

            {/* Energy level */}
            {showEnergy && (
              <div className="flex items-center gap-1">
                {energyInfo.icon}
                <span className={compact ? 'sr-only' : ''}>{energyInfo.label}</span>
              </div>
            )}

            {/* Time of day */}
            {!compact && (
              <div className={`flex items-center gap-1 ${timeIndicator.color}`}>
                <span>{timeIndicator.label}</span>
              </div>
            )}
          </div>

          {/* Duration emphasis for compact view */}
          {compact && (
            <span className="font-medium">{getDurationDisplay()}</span>
          )}
        </div>
      )}

      {/* Energy bar visualization */}
      {showEnergy && !compact && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>Energy Level</span>
            <span className="capitalize">{quantaMetrics.energy}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                quantaMetrics.energy === 'high' 
                  ? 'bg-red-500 w-full' 
                  : quantaMetrics.energy === 'medium' 
                    ? 'bg-yellow-500 w-2/3' 
                    : 'bg-green-500 w-1/3'
              }`}
            />
          </div>
        </div>
      )}

      {/* Compact view simplified display */}
      {compact && (
        <div className="flex items-center justify-between text-xs mt-1">
          <div className="flex items-center gap-1">
            {energyInfo.icon}
            {getCategoryIcon()}
          </div>
          <span className={timeIndicator.color}>{timeIndicator.label}</span>
        </div>
      )}
    </DraggableScheduleObject>
  );
}

export default DraggableQuanta;
