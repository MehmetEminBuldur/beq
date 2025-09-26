/**
 * DraggableBrick Component
 * 
 * Specialized draggable component for Brick objects with brick-specific styling and features
 */

'use client';

import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { 
  Building, 
  Clock, 
  Users, 
  Target, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Pause,
  Play
} from 'lucide-react';

import { DraggableScheduleObject, DragResult } from './DraggableScheduleObject';
import { ScheduleObject } from '@/lib/calendar/types';

interface DraggableBrickProps {
  brick: ScheduleObject;
  onDragStart?: (brick: ScheduleObject, event: MouseEvent | TouchEvent | PointerEvent) => void;
  onDragMove?: (brick: ScheduleObject, position: { x: number; y: number }) => void;
  onDragEnd?: (brick: ScheduleObject, result: DragResult) => void;
  showDetails?: boolean;
  showProgress?: boolean;
  showTime?: boolean;
  compact?: boolean;
  disabled?: boolean;
  className?: string;
}

export function DraggableBrick({
  brick,
  onDragStart,
  onDragMove,
  onDragEnd,
  showDetails = true,
  showProgress = true,
  showTime = true,
  compact = false,
  disabled = false,
  className = '',
}: DraggableBrickProps) {

  // Calculate brick metrics
  const brickMetrics = useMemo(() => {
    const duration = (new Date(brick.endTime).getTime() - new Date(brick.startTime).getTime()) / (1000 * 60 * 60);
    const progress = brick.progress || 0;
    const estimatedHours = brick.estimatedHours || duration;
    const priority = brick.priority || 'medium';

    return {
      duration,
      progress,
      estimatedHours,
      priority,
      isOverdue: brick.status === 'pending' && new Date(brick.endTime) < new Date(),
      timeRemaining: Math.max(0, (new Date(brick.endTime).getTime() - new Date().getTime()) / (1000 * 60 * 60)),
    };
  }, [brick]);

  // Get status icon
  const getStatusIcon = () => {
    switch (brick.status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Play className="w-4 h-4 text-yellow-600" />;
      case 'pending':
        return <Pause className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  // Get priority styling
  const getPriorityBorder = () => {
    switch (brickMetrics.priority) {
      case 'high':
        return 'border-l-4 border-l-red-500';
      case 'medium':
        return 'border-l-4 border-l-yellow-500';
      case 'low':
        return 'border-l-4 border-l-green-500';
      default:
        return 'border-l-4 border-l-gray-500';
    }
  };

  return (
    <DraggableScheduleObject
      object={brick}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      disabled={disabled}
      className={`
        brick-object rounded-lg border-2 p-3 min-w-[200px] max-w-[320px]
        ${getPriorityBorder()}
        ${brickMetrics.isOverdue ? 'ring-2 ring-red-400 ring-opacity-50' : ''}
        ${compact ? 'p-2 min-w-[150px]' : ''}
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-start gap-2 mb-2">
        <div className="flex-shrink-0 mt-0.5">
          <Building className="w-4 h-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold truncate ${compact ? 'text-sm' : 'text-base'}`}>
            {brick.title}
          </h3>
          
          {showTime && (
            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 mt-1">
              <Clock className="w-3 h-3" />
              <span>
                {format(new Date(brick.startTime), 'HH:mm')} - {format(new Date(brick.endTime), 'HH:mm')}
              </span>
              <span className="text-gray-400">
                ({Math.round(brickMetrics.duration * 10) / 10}h)
              </span>
            </div>
          )}
        </div>

        <div className="flex-shrink-0">
          {getStatusIcon()}
        </div>
      </div>

      {/* Description */}
      {showDetails && brick.description && !compact && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
          {brick.description}
        </p>
      )}

      {/* Progress bar */}
      {showProgress && brickMetrics.progress > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>Progress</span>
            <span>{Math.round(brickMetrics.progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                brickMetrics.progress >= 100 
                  ? 'bg-green-500' 
                  : brickMetrics.progress >= 50 
                    ? 'bg-yellow-500' 
                    : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, brickMetrics.progress)}%` }}
            />
          </div>
        </div>
      )}

      {/* Metadata */}
      {showDetails && !compact && (
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-3">
            {/* Priority indicator */}
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              <span className="capitalize">{brickMetrics.priority}</span>
            </div>

            {/* Estimated time */}
            {brickMetrics.estimatedHours && (
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>{Math.round(brickMetrics.estimatedHours * 10) / 10}h est.</span>
              </div>
            )}

            {/* Dependencies */}
            {brick.dependencies && brick.dependencies.length > 0 && (
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{brick.dependencies.length} deps</span>
              </div>
            )}
          </div>

          {/* Overdue indicator */}
          {brickMetrics.isOverdue && (
            <div className="flex items-center gap-1 text-red-500">
              <AlertCircle className="w-3 h-3" />
              <span>Overdue</span>
            </div>
          )}
        </div>
      )}

      {/* Compact view metadata */}
      {compact && (
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
          <span className="capitalize">{brickMetrics.priority}</span>
          {brickMetrics.progress > 0 && (
            <span>{Math.round(brickMetrics.progress)}%</span>
          )}
        </div>
      )}
    </DraggableScheduleObject>
  );
}

export default DraggableBrick;
