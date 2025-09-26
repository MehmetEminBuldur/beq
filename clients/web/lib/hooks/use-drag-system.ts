/**
 * Drag System Hook
 * 
 * Centralized drag state management and event handling for calendar drag operations
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ScheduleObject } from '@/lib/calendar/types';

export interface DragState {
  isDragging: boolean;
  draggedObject: ScheduleObject | null;
  dragOffset: { x: number; y: number };
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  dropTarget: HTMLElement | null;
  isValidDrop: boolean;
  ghostElement: HTMLElement | null;
}

export interface DropTarget {
  element: HTMLElement;
  timeSlot?: {
    startTime: Date;
    endTime: Date;
  };
  position?: {
    x: number;
    y: number;
  };
  isValid: boolean;
  feedback?: string;
}

export interface DragResult {
  success: boolean;
  originalObject: ScheduleObject;
  updatedObject?: ScheduleObject;
  newTimeSlot?: {
    startTime: Date;
    endTime: Date;
  };
  newPosition?: {
    x: number;
    y: number;
  };
  dropTarget?: DropTarget;
  error?: string;
}

interface UseDragSystemOptions {
  onDragStart?: (object: ScheduleObject, event: MouseEvent | TouchEvent | PointerEvent) => void;
  onDragMove?: (object: ScheduleObject, position: { x: number; y: number }) => void;
  onDragEnd?: (result: DragResult) => void;
  onDragCancel?: (object: ScheduleObject) => void;
  dropTargetSelector?: string;
  createGhost?: boolean;
  enableSnapToGrid?: boolean;
  gridSize?: { width: number; height: number };
}

export function useDragSystem({
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragCancel,
  dropTargetSelector = '[data-drop-target]',
  createGhost = true,
  enableSnapToGrid = false,
  gridSize = { width: 20, height: 20 },
}: UseDragSystemOptions = {}) {

  // Drag state
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedObject: null,
    dragOffset: { x: 0, y: 0 },
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    dropTarget: null,
    isValidDrop: false,
    ghostElement: null,
  });

  // Refs
  const dragStateRef = useRef(dragState);
  const dropTargetsRef = useRef<HTMLElement[]>([]);
  const animationFrameRef = useRef<number>();

  // Update ref when state changes
  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  // Snap to grid function
  const snapToGrid = useCallback((position: { x: number; y: number }) => {
    if (!enableSnapToGrid) return position;
    
    return {
      x: Math.round(position.x / gridSize.width) * gridSize.width,
      y: Math.round(position.y / gridSize.height) * gridSize.height,
    };
  }, [enableSnapToGrid, gridSize]);

  // Find drop targets
  const updateDropTargets = useCallback(() => {
    const targets = Array.from(document.querySelectorAll(dropTargetSelector)) as HTMLElement[];
    dropTargetsRef.current = targets;
  }, [dropTargetSelector]);

  // Find current drop target
  const findDropTarget = useCallback((x: number, y: number): DropTarget | null => {
    const element = document.elementFromPoint(x, y) as HTMLElement;
    if (!element) return null;

    // Find the closest drop target
    const dropTarget = element.closest(dropTargetSelector) as HTMLElement;
    if (!dropTarget) return null;

    // Check if this is a valid drop target
    const isValid = !dropTarget.hasAttribute('data-drop-disabled');
    
    // Extract time slot information if available
    const timeSlotData = dropTarget.dataset.timeSlot;
    let timeSlot: { startTime: Date; endTime: Date } | undefined;
    
    if (timeSlotData) {
      try {
        const parsed = JSON.parse(timeSlotData);
        timeSlot = {
          startTime: new Date(parsed.startTime),
          endTime: new Date(parsed.endTime),
        };
      } catch (error) {
        console.warn('Failed to parse time slot data:', error);
      }
    }

    const rect = dropTarget.getBoundingClientRect();
    
    return {
      element: dropTarget,
      timeSlot,
      position: {
        x: rect.left,
        y: rect.top,
      },
      isValid,
      feedback: dropTarget.dataset.dropFeedback,
    };
  }, [dropTargetSelector]);

  // Create ghost element
  const createGhostElement = useCallback((originalElement: HTMLElement, object: ScheduleObject) => {
    if (!createGhost) return null;

    const ghost = originalElement.cloneNode(true) as HTMLElement;
    
    // Style the ghost element
    ghost.style.position = 'fixed';
    ghost.style.pointerEvents = 'none';
    ghost.style.zIndex = '9999';
    ghost.style.opacity = '0.8';
    ghost.style.transform = 'scale(1.05)';
    ghost.style.transition = 'none';
    ghost.style.filter = 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3))';
    
    // Add dragging class
    ghost.classList.add('dragging-ghost');
    
    // Remove any existing IDs to avoid conflicts
    ghost.removeAttribute('id');
    const elementsWithIds = ghost.querySelectorAll('[id]');
    elementsWithIds.forEach(el => el.removeAttribute('id'));

    document.body.appendChild(ghost);
    return ghost;
  }, [createGhost]);

  // Update ghost position
  const updateGhostPosition = useCallback((x: number, y: number) => {
    const { ghostElement, dragOffset } = dragStateRef.current;
    if (!ghostElement) return;

    const ghostX = x - dragOffset.x;
    const ghostY = y - dragOffset.y;
    
    const snappedPosition = snapToGrid({ x: ghostX, y: ghostY });
    
    ghostElement.style.left = `${snappedPosition.x}px`;
    ghostElement.style.top = `${snappedPosition.y}px`;
  }, [snapToGrid]);

  // Add drop target visual feedback
  const updateDropTargetFeedback = useCallback((dropTarget: DropTarget | null) => {
    // Remove previous feedback
    document.querySelectorAll('.drop-target-highlight').forEach(el => {
      el.classList.remove('drop-target-highlight', 'drop-target-valid', 'drop-target-invalid');
    });

    if (dropTarget) {
      dropTarget.element.classList.add(
        'drop-target-highlight',
        dropTarget.isValid ? 'drop-target-valid' : 'drop-target-invalid'
      );
    }
  }, []);

  // Start drag operation
  const startDrag = useCallback((
    object: ScheduleObject, 
    event: MouseEvent | TouchEvent | PointerEvent,
    sourceElement?: HTMLElement
  ) => {
    const clientX = 'clientX' in event ? event.clientX : event.touches[0].clientX;
    const clientY = 'clientY' in event ? event.clientY : event.touches[0].clientY;

    updateDropTargets();

    let ghostElement: HTMLElement | null = null;
    let dragOffset = { x: 0, y: 0 };

    // Create ghost element if source element is provided
    if (sourceElement) {
      const rect = sourceElement.getBoundingClientRect();
      dragOffset = {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
      ghostElement = createGhostElement(sourceElement, object);
    }

    const newDragState: DragState = {
      isDragging: true,
      draggedObject: object,
      dragOffset,
      startPosition: { x: clientX, y: clientY },
      currentPosition: { x: clientX, y: clientY },
      dropTarget: null,
      isValidDrop: false,
      ghostElement,
    };

    setDragState(newDragState);
    onDragStart?.(object, event);

    // Add global drag styles
    document.body.classList.add('dragging-in-progress');
    
    // Prevent default behavior
    event.preventDefault();
  }, [updateDropTargets, createGhostElement, onDragStart]);

  // Update drag position
  const updateDrag = useCallback((event: MouseEvent | TouchEvent | PointerEvent) => {
    if (!dragStateRef.current.isDragging) return;

    const clientX = 'clientX' in event ? event.clientX : event.touches[0].clientX;
    const clientY = 'clientY' in event ? event.clientY : event.touches[0].clientY;

    const snappedPosition = snapToGrid({ x: clientX, y: clientY });
    const dropTarget = findDropTarget(clientX, clientY);

    // Update ghost position
    updateGhostPosition(clientX, clientY);
    
    // Update drop target feedback
    updateDropTargetFeedback(dropTarget);

    setDragState(prev => ({
      ...prev,
      currentPosition: snappedPosition,
      dropTarget: dropTarget?.element || null,
      isValidDrop: dropTarget?.isValid || false,
    }));

    onDragMove?.(dragStateRef.current.draggedObject!, snappedPosition);

    event.preventDefault();
  }, [snapToGrid, findDropTarget, updateGhostPosition, updateDropTargetFeedback, onDragMove]);

  // End drag operation
  const endDrag = useCallback((event: MouseEvent | TouchEvent | PointerEvent) => {
    const currentState = dragStateRef.current;
    if (!currentState.isDragging || !currentState.draggedObject) return;

    const clientX = 'clientX' in event ? event.clientX : event.touches[0].clientX;
    const clientY = 'clientY' in event ? event.clientY : event.touches[0].clientY;

    const dropTarget = findDropTarget(clientX, clientY);
    
    // Create drag result
    const result: DragResult = {
      success: dropTarget?.isValid || false,
      originalObject: currentState.draggedObject,
      dropTarget: dropTarget || undefined,
    };

    if (result.success && dropTarget) {
      // Calculate updated object with new time slot or position
      result.newPosition = snapToGrid({ x: clientX, y: clientY });
      result.newTimeSlot = dropTarget.timeSlot;
      
      // Create updated object (basic implementation)
      result.updatedObject = {
        ...currentState.draggedObject,
        startTime: dropTarget.timeSlot?.startTime || currentState.draggedObject.startTime,
        endTime: dropTarget.timeSlot?.endTime || currentState.draggedObject.endTime,
      };
    } else {
      result.error = dropTarget ? 'Invalid drop target' : 'No drop target found';
    }

    // Cleanup
    if (currentState.ghostElement) {
      currentState.ghostElement.remove();
    }

    // Remove visual feedback
    updateDropTargetFeedback(null);
    document.body.classList.remove('dragging-in-progress');

    // Reset state
    setDragState({
      isDragging: false,
      draggedObject: null,
      dragOffset: { x: 0, y: 0 },
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
      dropTarget: null,
      isValidDrop: false,
      ghostElement: null,
    });

    onDragEnd?.(result);

    event.preventDefault();
  }, [findDropTarget, snapToGrid, updateDropTargetFeedback, onDragEnd]);

  // Cancel drag operation
  const cancelDrag = useCallback(() => {
    const currentState = dragStateRef.current;
    if (!currentState.isDragging || !currentState.draggedObject) return;

    // Cleanup
    if (currentState.ghostElement) {
      currentState.ghostElement.remove();
    }

    updateDropTargetFeedback(null);
    document.body.classList.remove('dragging-in-progress');

    const draggedObject = currentState.draggedObject;

    // Reset state
    setDragState({
      isDragging: false,
      draggedObject: null,
      dragOffset: { x: 0, y: 0 },
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
      dropTarget: null,
      isValidDrop: false,
      ghostElement: null,
    });

    onDragCancel?.(draggedObject);
  }, [updateDropTargetFeedback, onDragCancel]);

  // Global event listeners for drag operations
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(() => {
        updateDrag(event);
      });
    };

    const handleMouseUp = (event: MouseEvent) => {
      endDrag(event);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(() => {
        updateDrag(event);
      });
    };

    const handleTouchEnd = (event: TouchEvent) => {
      endDrag(event);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dragState.isDragging) {
        cancelDrag();
      }
    };

    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        document.removeEventListener('keydown', handleKeyDown);
        
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [dragState.isDragging, updateDrag, endDrag, cancelDrag]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dragState.ghostElement) {
        dragState.ghostElement.remove();
      }
      document.body.classList.remove('dragging-in-progress');
      updateDropTargetFeedback(null);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [dragState.ghostElement, updateDropTargetFeedback]);

  return {
    dragState,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    isDragging: dragState.isDragging,
    draggedObject: dragState.draggedObject,
    isValidDrop: dragState.isValidDrop,
  };
}
