/**
 * DropFeedback Component
 * 
 * Visual feedback system for drag-and-drop operations
 */

'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Calendar,
  Target,
  Zap,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';

import { ConflictResult } from '@/lib/calendar/conflict-detection';
import { ScheduleObject } from '@/lib/calendar/types';

interface DropFeedbackProps {
  isVisible: boolean;
  draggedObject: ScheduleObject | null;
  targetTime?: Date;
  conflictResult?: ConflictResult;
  isValid: boolean;
  position?: { x: number; y: number };
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  message?: string;
  className?: string;
}

export function DropFeedback({
  isVisible,
  draggedObject,
  targetTime,
  conflictResult,
  isValid,
  position,
  severity,
  message,
  className = '',
}: DropFeedbackProps) {

  // Get feedback styling based on validity and severity
  const feedbackStyle = useMemo(() => {
    if (isValid) {
      return {
        bgColor: 'bg-green-500',
        borderColor: 'border-green-400',
        textColor: 'text-white',
        icon: CheckCircle,
        glowColor: 'shadow-green-500/30',
      };
    }

    switch (severity) {
      case 'critical':
        return {
          bgColor: 'bg-red-500',
          borderColor: 'border-red-400',
          textColor: 'text-white',
          icon: XCircle,
          glowColor: 'shadow-red-500/30',
        };
      case 'high':
        return {
          bgColor: 'bg-orange-500',
          borderColor: 'border-orange-400',
          textColor: 'text-white',
          icon: AlertTriangle,
          glowColor: 'shadow-orange-500/30',
        };
      case 'medium':
        return {
          bgColor: 'bg-yellow-500',
          borderColor: 'border-yellow-400',
          textColor: 'text-white',
          icon: AlertTriangle,
          glowColor: 'shadow-yellow-500/30',
        };
      case 'low':
        return {
          bgColor: 'bg-blue-500',
          borderColor: 'border-blue-400',
          textColor: 'text-white',
          icon: Clock,
          glowColor: 'shadow-blue-500/30',
        };
      default:
        return {
          bgColor: 'bg-gray-500',
          borderColor: 'border-gray-400',
          textColor: 'text-white',
          icon: Calendar,
          glowColor: 'shadow-gray-500/30',
        };
    }
  }, [isValid, severity]);

  // Get object type icon
  const getObjectIcon = () => {
    if (!draggedObject) return null;
    
    switch (draggedObject.type) {
      case 'brick':
        return <Target className="w-4 h-4" />;
      case 'quanta':
        return <Zap className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  // Format conflict information
  const formatConflictInfo = () => {
    if (!conflictResult || !conflictResult.hasConflicts) return null;

    const conflictCount = conflictResult.conflicts.length;
    const hardConflicts = conflictResult.conflicts.filter(c => c.type === 'hard').length;
    
    return {
      count: conflictCount,
      hasHardConflicts: hardConflicts > 0,
      summary: hardConflicts > 0 
        ? `${hardConflicts} complete overlap${hardConflicts === 1 ? '' : 's'}`
        : `${conflictCount} partial overlap${conflictCount === 1 ? '' : 's'}`,
    };
  };

  const conflictInfo = formatConflictInfo();
  const IconComponent = feedbackStyle.icon;

  if (!isVisible || !draggedObject) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={`
          fixed pointer-events-none z-[9999] select-none
          ${className}
        `}
        style={{
          left: position?.x ? position.x + 10 : '50%',
          top: position?.y ? position.y - 60 : '50%',
          transform: position ? 'none' : 'translate(-50%, -50%)',
        }}
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {/* Main feedback card */}
        <div className={`
          relative rounded-lg border-2 shadow-2xl backdrop-blur-sm
          ${feedbackStyle.bgColor} ${feedbackStyle.borderColor} ${feedbackStyle.glowColor}
          ${feedbackStyle.textColor}
          min-w-[200px] max-w-[300px]
        `}>
          {/* Header with object info */}
          <div className="flex items-center gap-2 p-3 border-b border-white/20">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {getObjectIcon()}
              <span className="font-medium truncate text-sm">
                {draggedObject.title}
              </span>
            </div>
            <IconComponent className="w-5 h-5 flex-shrink-0" />
          </div>

          {/* Target time */}
          {targetTime && (
            <div className="flex items-center gap-2 px-3 py-2 bg-white/10">
              <ArrowRight className="w-4 h-4" />
              <span className="text-sm font-medium">
                {format(targetTime, 'HH:mm')}
              </span>
              <span className="text-xs opacity-75">
                {format(targetTime, 'EEE, MMM d')}
              </span>
            </div>
          )}

          {/* Main message */}
          <div className="p-3">
            <p className="text-sm font-medium">
              {message || (isValid ? 'Ready to drop' : 'Cannot drop here')}
            </p>

            {/* Conflict details */}
            {conflictInfo && (
              <div className="mt-2 text-xs opacity-90">
                <p>{conflictInfo.summary}</p>
                {conflictResult && conflictResult.conflicts.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {conflictResult.conflicts.slice(0, 2).map((conflict, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          conflict.type === 'hard' ? 'bg-red-300' : 'bg-yellow-300'
                        }`} />
                        <span className="truncate">
                          {conflict.conflictingEvent.title}
                        </span>
                      </div>
                    ))}
                    {conflictResult.conflicts.length > 2 && (
                      <p className="text-xs opacity-75">
                        +{conflictResult.conflicts.length - 2} more conflicts
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Suggestions */}
            {conflictResult && conflictResult.resolutionSuggestions.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/20">
                <p className="text-xs font-medium mb-1">Suggestions:</p>
                <div className="space-y-1">
                  {conflictResult.resolutionSuggestions.slice(0, 2).map((suggestion, index) => (
                    <p key={index} className="text-xs opacity-90">
                      • {suggestion.description}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Animated pulse for invalid drops */}
          {!isValid && (
            <motion.div
              className="absolute inset-0 rounded-lg border-2 border-white/30"
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </div>

        {/* Drop zone indicator arrow */}
        {position && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1">
            <div className={`
              w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent
              ${feedbackStyle.bgColor.replace('bg-', 'border-t-')}
            `} />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Mini feedback tooltip for quick feedback
 */
export function MiniDropFeedback({
  isVisible,
  isValid,
  message,
  position,
}: {
  isVisible: boolean;
  isValid: boolean;
  message?: string;
  position?: { x: number; y: number };
}) {
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed pointer-events-none z-[9998] select-none"
        style={{
          left: position?.x ? position.x + 10 : '50%',
          top: position?.y ? position.y - 30 : '50%',
          transform: position ? 'none' : 'translate(-50%, -50%)',
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.15 }}
      >
        <div className={`
          px-2 py-1 rounded text-xs font-medium shadow-lg
          ${isValid 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
          }
        `}>
          {message || (isValid ? '✓' : '✗')}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Snap indicator showing grid alignment
 */
export function SnapIndicator({
  isVisible,
  snapTimes,
  currentSnapTime,
  slotBounds,
}: {
  isVisible: boolean;
  snapTimes: Date[];
  currentSnapTime?: Date;
  slotBounds?: DOMRect;
}) {
  if (!isVisible || !slotBounds) return null;

  return (
    <div 
      className="absolute inset-0 pointer-events-none z-10"
      style={{
        left: slotBounds.left,
        top: slotBounds.top,
        width: slotBounds.width,
        height: slotBounds.height,
      }}
    >
      {/* Snap grid lines */}
      {snapTimes.map((snapTime, index) => {
        const percentage = index / (snapTimes.length - 1) * 100;
        const isCurrentSnap = currentSnapTime && 
          Math.abs(snapTime.getTime() - currentSnapTime.getTime()) < 60000; // Within 1 minute
        
        return (
          <div
            key={index}
            className={`
              absolute left-0 right-0 h-px transition-opacity
              ${isCurrentSnap 
                ? 'bg-blue-500 opacity-100 shadow-sm' 
                : 'bg-gray-300 opacity-30'
              }
            `}
            style={{ top: `${percentage}%` }}
          />
        );
      })}

      {/* Current snap highlight */}
      {currentSnapTime && (
        <motion.div
          className="absolute left-0 right-0 h-0.5 bg-blue-500 shadow-lg"
          style={{
            top: `${snapTimes.findIndex(t => 
              Math.abs(t.getTime() - currentSnapTime.getTime()) < 60000
            ) / (snapTimes.length - 1) * 100}%`,
          }}
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </div>
  );
}

export default DropFeedback;
