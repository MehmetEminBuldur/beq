/**
 * DraggableScheduleObject Component
 * 
 * Base draggable component for schedule objects with proper mouse/touch handling and accessibility
 */

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, useDragControls, PanInfo } from 'framer-motion';
import { GripVertical, Move } from 'lucide-react';

import { ScheduleObject } from '@/lib/calendar/types';
import { ANIMATIONS } from '@/lib/calendar/constants';

export interface DragState {
  isDragging: boolean;
  dragOffset: { x: number; y: number };
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  draggedObject: ScheduleObject | null;
}

export interface DragResult {
  success: boolean;
  updatedObject?: ScheduleObject;
  newPosition?: { x: number; y: number };
  newTimeSlot?: { startTime: Date; endTime: Date };
  error?: string;
}

interface DraggableScheduleObjectProps {
  object: ScheduleObject;
  onDragStart?: (object: ScheduleObject, event: MouseEvent | TouchEvent | PointerEvent) => void;
  onDragMove?: (object: ScheduleObject, position: { x: number; y: number }) => void;
  onDragEnd?: (object: ScheduleObject, result: DragResult) => void;
  showDragHandle?: boolean;
  enableKeyboardDrag?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function DraggableScheduleObject({
  object,
  onDragStart,
  onDragMove,
  onDragEnd,
  showDragHandle = true,
  enableKeyboardDrag = true,
  disabled = false,
  className = '',
  children,
}: DraggableScheduleObjectProps) {
  
  // State
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    draggedObject: null,
  });

  const [isKeyboardDragging, setIsKeyboardDragging] = useState(false);
  const [keyboardPosition, setKeyboardPosition] = useState({ x: 0, y: 0 });

  // Refs
  const objectRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  // Get status-based styling
  const getStatusStyling = useCallback(() => {
    const baseClasses = 'transition-all duration-200';
    
    switch (object.status) {
      case 'completed':
        return `${baseClasses} opacity-75 bg-green-50 border-green-200 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-200`;
      case 'in_progress':
        return `${baseClasses} bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-200`;
      case 'pending':
      case 'upcoming':
        return `${baseClasses} bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200`;
      default:
        return `${baseClasses} bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200`;
    }
  }, [object.status]);

  // Handle drag start
  const handleDragStart = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled) return;

    const rect = objectRef.current?.getBoundingClientRect();
    if (!rect) return;

    const newDragState: DragState = {
      isDragging: true,
      dragOffset: { 
        x: info.point.x - rect.left, 
        y: info.point.y - rect.top 
      },
      startPosition: { x: rect.left, y: rect.top },
      currentPosition: { x: rect.left, y: rect.top },
      draggedObject: object,
    };

    setDragState(newDragState);
    onDragStart?.(object, event);

    // Add drag feedback class to body
    document.body.classList.add('dragging-schedule-object');
  }, [disabled, object, onDragStart]);

  // Handle drag
  const handleDrag = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!dragState.isDragging || disabled) return;

    const newPosition = {
      x: dragState.startPosition.x + info.offset.x,
      y: dragState.startPosition.y + info.offset.y,
    };

    setDragState(prev => ({
      ...prev,
      currentPosition: newPosition,
    }));

    onDragMove?.(object, newPosition);
  }, [dragState.isDragging, dragState.startPosition, disabled, object, onDragMove]);

  // Handle drag end
  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!dragState.isDragging || disabled) return;

    // Remove drag feedback class from body
    document.body.classList.remove('dragging-schedule-object');

    // Calculate final position
    const finalPosition = {
      x: dragState.startPosition.x + info.offset.x,
      y: dragState.startPosition.y + info.offset.y,
    };

    // Create drag result (placeholder logic)
    const dragResult: DragResult = {
      success: true,
      updatedObject: object,
      newPosition: finalPosition,
      // TODO: Calculate new time slot based on drop position
    };

    // Reset drag state
    setDragState({
      isDragging: false,
      dragOffset: { x: 0, y: 0 },
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
      draggedObject: null,
    });

    onDragEnd?.(object, dragResult);
  }, [dragState.isDragging, dragState.startPosition, disabled, object, onDragEnd]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!enableKeyboardDrag || disabled) return;

    const step = 10; // pixels
    const shiftStep = 50; // pixels with shift

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!isKeyboardDragging) {
          setIsKeyboardDragging(true);
          setKeyboardPosition({ x: 0, y: 0 });
          onDragStart?.(object, event.nativeEvent);
        } else {
          // End keyboard drag
          const dragResult: DragResult = {
            success: true,
            updatedObject: object,
            newPosition: keyboardPosition,
          };
          setIsKeyboardDragging(false);
          setKeyboardPosition({ x: 0, y: 0 });
          onDragEnd?.(object, dragResult);
        }
        break;

      case 'Escape':
        if (isKeyboardDragging) {
          event.preventDefault();
          setIsKeyboardDragging(false);
          setKeyboardPosition({ x: 0, y: 0 });
          // Cancel drag
          const dragResult: DragResult = {
            success: false,
            error: 'Drag cancelled by user',
          };
          onDragEnd?.(object, dragResult);
        }
        break;

      case 'ArrowUp':
        if (isKeyboardDragging) {
          event.preventDefault();
          const moveStep = event.shiftKey ? shiftStep : step;
          const newPosition = {
            x: keyboardPosition.x,
            y: keyboardPosition.y - moveStep,
          };
          setKeyboardPosition(newPosition);
          onDragMove?.(object, newPosition);
        }
        break;

      case 'ArrowDown':
        if (isKeyboardDragging) {
          event.preventDefault();
          const moveStep = event.shiftKey ? shiftStep : step;
          const newPosition = {
            x: keyboardPosition.x,
            y: keyboardPosition.y + moveStep,
          };
          setKeyboardPosition(newPosition);
          onDragMove?.(object, newPosition);
        }
        break;

      case 'ArrowLeft':
        if (isKeyboardDragging) {
          event.preventDefault();
          const moveStep = event.shiftKey ? shiftStep : step;
          const newPosition = {
            x: keyboardPosition.x - moveStep,
            y: keyboardPosition.y,
          };
          setKeyboardPosition(newPosition);
          onDragMove?.(object, newPosition);
        }
        break;

      case 'ArrowRight':
        if (isKeyboardDragging) {
          event.preventDefault();
          const moveStep = event.shiftKey ? shiftStep : step;
          const newPosition = {
            x: keyboardPosition.x + moveStep,
            y: keyboardPosition.y,
          };
          setKeyboardPosition(newPosition);
          onDragMove?.(object, newPosition);
        }
        break;
    }
  }, [enableKeyboardDrag, disabled, isKeyboardDragging, keyboardPosition, object, onDragStart, onDragMove, onDragEnd]);

  // Add global styles for drag feedback
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .dragging-schedule-object {
        cursor: grabbing !important;
        user-select: none;
      }
      .dragging-schedule-object * {
        cursor: grabbing !important;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
      document.body.classList.remove('dragging-schedule-object');
    };
  }, []);

  // Handle HTML5 drag start
  const handleHTML5DragStart = useCallback((event: React.DragEvent) => {
    if (disabled) {
      event.preventDefault();
      return;
    }

    // Set drag data for drop targets
    event.dataTransfer.setData('application/json', JSON.stringify(object));
    event.dataTransfer.setData('text/plain', object.title);
    event.dataTransfer.effectAllowed = 'move';

    // Set drag image (optional custom drag preview)
    if (objectRef.current) {
      const dragImage = objectRef.current.cloneNode(true) as HTMLElement;
      dragImage.style.transform = 'scale(1.1)';
      dragImage.style.opacity = '0.8';
      event.dataTransfer.setDragImage(dragImage, 0, 0);
    }

    // Call existing drag start handler
    const mockMouseEvent = new MouseEvent('mousedown', {
      clientX: event.clientX,
      clientY: event.clientY,
    });
    onDragStart?.(object, mockMouseEvent);

    setDragState(prev => ({
      ...prev,
      isDragging: true,
      draggedObject: object,
    }));
  }, [disabled, object, onDragStart]);

  // Handle HTML5 drag end
  const handleHTML5DragEnd = useCallback((event: React.DragEvent) => {
    setDragState({
      isDragging: false,
      dragOffset: { x: 0, y: 0 },
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
      draggedObject: null,
    });

    // Call existing drag end handler if no drop occurred
    if (event.dataTransfer.dropEffect === 'none') {
      const result: DragResult = {
        success: false,
        error: 'Drop target not found',
      };
      onDragEnd?.(object, result);
    }
  }, [object, onDragEnd]);

  return (
    <motion.div
      ref={objectRef}
      draggable={!disabled}
      onDragStart={handleHTML5DragStart}
      onDragEnd={handleHTML5DragEnd}
      drag={!disabled}
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-label={`Draggable ${object.type}: ${object.title}`}
      aria-grabbed={dragState.isDragging || isKeyboardDragging}
      aria-describedby={`${object.id}-instructions`}
      className={`
        draggable-schedule-object relative group
        ${getStatusStyling()}
        ${dragState.isDragging || isKeyboardDragging 
          ? 'z-50 scale-105 shadow-2xl' 
          : 'hover:scale-102 hover:shadow-lg'
        }
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'cursor-grab active:cursor-grabbing'
        }
        ${className}
      `}
      style={{
        backgroundColor: object.backgroundColor,
        borderColor: object.borderColor,
        color: object.color,
        transform: isKeyboardDragging 
          ? `translate(${keyboardPosition.x}px, ${keyboardPosition.y}px)`
          : undefined,
      }}
      variants={ANIMATIONS.variants.scaleIn}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
    >
      {/* Drag handle */}
      {showDragHandle && !disabled && (
        <div 
          className="absolute left-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <GripVertical className="w-3 h-3 text-gray-400" />
        </div>
      )}

      {/* Content */}
      <div className={`${showDragHandle ? 'pl-5' : ''}`}>
        {children}
      </div>

      {/* Keyboard drag indicator */}
      {isKeyboardDragging && (
        <div className="absolute -top-8 left-0 right-0 text-center">
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary-600 text-white">
            <Move className="w-3 h-3 mr-1" />
            Use arrows to move • Enter to place • Esc to cancel
          </span>
        </div>
      )}

      {/* Accessibility instructions (screen reader only) */}
      <div id={`${object.id}-instructions`} className="sr-only">
        {enableKeyboardDrag && !disabled && (
          isKeyboardDragging
            ? 'Use arrow keys to move this object. Press Enter to place it, or Escape to cancel.'
            : 'Press Enter or Space to start dragging this object with the keyboard.'
        )}
      </div>

      {/* Status indicator */}
      <div className="absolute top-1 right-1">
        <div className={`
          w-2 h-2 rounded-full
          ${object.status === 'completed' ? 'bg-green-500' :
            object.status === 'in_progress' ? 'bg-yellow-500' :
            object.status === 'pending' ? 'bg-blue-500' : 'bg-gray-400'
          }
        `} />
      </div>
    </motion.div>
  );
}

export default DraggableScheduleObject;
