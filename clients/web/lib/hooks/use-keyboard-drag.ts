/**
 * Keyboard Drag Hook
 * 
 * Provides comprehensive keyboard accessibility for drag operations
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ScheduleObject } from '@/lib/calendar/types';

export interface KeyboardDragState {
  isActive: boolean;
  draggedObject: ScheduleObject | null;
  position: { x: number; y: number };
  startPosition: { x: number; y: number };
  currentDropTarget: HTMLElement | null;
  instructions: string;
  moveStep: number;
}

export interface KeyboardDragOptions {
  stepSize?: number;
  fastStepSize?: number;
  announcePosition?: boolean;
  announceDropTargets?: boolean;
  onDragStart?: (object: ScheduleObject) => void;
  onDragMove?: (object: ScheduleObject, position: { x: number; y: number }) => void;
  onDragEnd?: (object: ScheduleObject, result: { success: boolean; dropTarget?: HTMLElement }) => void;
  onDragCancel?: (object: ScheduleObject) => void;
}

export function useKeyboardDrag({
  stepSize = 10,
  fastStepSize = 50,
  announcePosition = true,
  announceDropTargets = true,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragCancel,
}: KeyboardDragOptions = {}) {

  // State
  const [dragState, setDragState] = useState<KeyboardDragState>({
    isActive: false,
    draggedObject: null,
    position: { x: 0, y: 0 },
    startPosition: { x: 0, y: 0 },
    currentDropTarget: null,
    instructions: '',
    moveStep: stepSize,
  });

  // Refs
  const dragStateRef = useRef(dragState);
  const sourceElementRef = useRef<HTMLElement | null>(null);
  const liveRegionRef = useRef<HTMLElement | null>(null);

  // Update ref when state changes
  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  // Create live region for screen reader announcements
  useEffect(() => {
    if (!liveRegionRef.current) {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.id = 'keyboard-drag-announcements';
      document.body.appendChild(liveRegion);
      liveRegionRef.current = liveRegion;
    }

    return () => {
      if (liveRegionRef.current) {
        document.body.removeChild(liveRegionRef.current);
        liveRegionRef.current = null;
      }
    };
  }, []);

  // Announce to screen readers
  const announce = useCallback((message: string) => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = message;
      
      // Clear after a delay to ensure it can be announced again
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = '';
        }
      }, 1000);
    }
  }, []);

  // Find drop target at position
  const findDropTargetAt = useCallback((x: number, y: number): HTMLElement | null => {
    const elements = document.elementsFromPoint(x, y);
    for (const element of elements) {
      const dropTarget = element.closest('[data-drop-target]') as HTMLElement;
      if (dropTarget && !dropTarget.hasAttribute('data-drop-disabled')) {
        return dropTarget;
      }
    }
    return null;
  }, []);

  // Get position description for announcements
  const getPositionDescription = useCallback((x: number, y: number) => {
    const dropTarget = findDropTargetAt(x, y);
    if (dropTarget) {
      const label = dropTarget.getAttribute('aria-label') || 
                   dropTarget.getAttribute('data-drop-label') ||
                   'drop zone';
      return `Over ${label}`;
    }
    return `Position ${Math.round(x)}, ${Math.round(y)}`;
  }, [findDropTargetAt]);

  // Start keyboard drag
  const startKeyboardDrag = useCallback((object: ScheduleObject, sourceElement?: HTMLElement) => {
    if (dragState.isActive) return false;

    const rect = sourceElement?.getBoundingClientRect();
    const startPos = rect ? { x: rect.left, y: rect.top } : { x: 0, y: 0 };

    setDragState({
      isActive: true,
      draggedObject: object,
      position: startPos,
      startPosition: startPos,
      currentDropTarget: null,
      instructions: 'Use arrow keys to move, Enter to place, Escape to cancel',
      moveStep: stepSize,
    });

    sourceElementRef.current = sourceElement || null;

    // Add keyboard drag class to source element
    if (sourceElement) {
      sourceElement.classList.add('keyboard-dragging');
      sourceElement.setAttribute('aria-grabbed', 'true');
    }

    announce(`Started dragging ${object.title}. ${dragState.instructions}`);
    onDragStart?.(object);

    return true;
  }, [dragState.isActive, dragState.instructions, stepSize, announce, onDragStart]);

  // Move in direction
  const moveInDirection = useCallback((direction: 'up' | 'down' | 'left' | 'right', fast = false) => {
    if (!dragState.isActive || !dragState.draggedObject) return false;

    const step = fast ? fastStepSize : stepSize;
    let newPosition = { ...dragState.position };

    switch (direction) {
      case 'up':
        newPosition.y -= step;
        break;
      case 'down':
        newPosition.y += step;
        break;
      case 'left':
        newPosition.x -= step;
        break;
      case 'right':
        newPosition.x += step;
        break;
    }

    // Keep within viewport bounds
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    newPosition.x = Math.max(0, Math.min(viewport.width - 100, newPosition.x));
    newPosition.y = Math.max(0, Math.min(viewport.height - 100, newPosition.y));

    const dropTarget = findDropTargetAt(newPosition.x + 50, newPosition.y + 50);
    const dropTargetChanged = dropTarget !== dragState.currentDropTarget;

    setDragState(prev => ({
      ...prev,
      position: newPosition,
      currentDropTarget: dropTarget,
    }));

    onDragMove?.(dragState.draggedObject, newPosition);

    // Announce position changes
    if (announcePosition) {
      const positionDesc = getPositionDescription(newPosition.x, newPosition.y);
      if (dropTargetChanged) {
        announce(positionDesc);
      }
    }

    // Announce drop target changes
    if (announceDropTargets && dropTargetChanged) {
      if (dropTarget) {
        const label = dropTarget.getAttribute('aria-label') || 
                     dropTarget.getAttribute('data-drop-label') ||
                     'drop zone';
        const isValid = !dropTarget.hasAttribute('data-drop-disabled');
        announce(`${isValid ? 'Valid' : 'Invalid'} drop target: ${label}`);
      } else {
        announce('No drop target');
      }
    }

    return true;
  }, [
    dragState.isActive, 
    dragState.draggedObject, 
    dragState.position, 
    dragState.currentDropTarget,
    stepSize, 
    fastStepSize, 
    findDropTargetAt, 
    onDragMove, 
    announcePosition, 
    announceDropTargets, 
    getPositionDescription, 
    announce
  ]);

  // End keyboard drag
  const endKeyboardDrag = useCallback((place = true) => {
    if (!dragState.isActive || !dragState.draggedObject) return false;

    const draggedObject = dragState.draggedObject;
    const dropTarget = dragState.currentDropTarget;
    const success = place && dropTarget && !dropTarget.hasAttribute('data-drop-disabled');

    // Remove keyboard drag styling
    if (sourceElementRef.current) {
      sourceElementRef.current.classList.remove('keyboard-dragging');
      sourceElementRef.current.setAttribute('aria-grabbed', 'false');
    }

    // Reset state
    setDragState({
      isActive: false,
      draggedObject: null,
      position: { x: 0, y: 0 },
      startPosition: { x: 0, y: 0 },
      currentDropTarget: null,
      instructions: '',
      moveStep: stepSize,
    });

    sourceElementRef.current = null;

    if (place) {
      if (success) {
        const label = dropTarget?.getAttribute('aria-label') || 
                     dropTarget?.getAttribute('data-drop-label') ||
                     'drop zone';
        announce(`Placed ${draggedObject.title} in ${label}`);
        onDragEnd?.(draggedObject, { success: true, dropTarget });
      } else {
        announce(`Cannot place ${draggedObject.title} here. Returning to original position.`);
        onDragEnd?.(draggedObject, { success: false });
      }
    } else {
      announce(`Cancelled dragging ${draggedObject.title}`);
      onDragCancel?.(draggedObject);
    }

    return true;
  }, [
    dragState.isActive, 
    dragState.draggedObject, 
    dragState.currentDropTarget,
    stepSize, 
    announce, 
    onDragEnd, 
    onDragCancel
  ]);

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!dragState.isActive) return false;

    const isShift = event.shiftKey;
    let handled = false;

    switch (event.key) {
      case 'ArrowUp':
        handled = moveInDirection('up', isShift);
        break;
      case 'ArrowDown':
        handled = moveInDirection('down', isShift);
        break;
      case 'ArrowLeft':
        handled = moveInDirection('left', isShift);
        break;
      case 'ArrowRight':
        handled = moveInDirection('right', isShift);
        break;
      case 'Enter':
      case ' ':
        handled = endKeyboardDrag(true);
        break;
      case 'Escape':
        handled = endKeyboardDrag(false);
        break;
      case '?':
        if (!event.ctrlKey && !event.metaKey && !event.altKey) {
          announce(dragState.instructions);
          handled = true;
        }
        break;
    }

    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }

    return handled;
  }, [dragState.isActive, dragState.instructions, moveInDirection, endKeyboardDrag, announce]);

  // Global keyboard event listener
  useEffect(() => {
    if (dragState.isActive) {
      document.addEventListener('keydown', handleKeyDown, true);
      return () => {
        document.removeEventListener('keydown', handleKeyDown, true);
      };
    }
  }, [dragState.isActive, handleKeyDown]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dragState.isActive) {
        endKeyboardDrag(false);
      }
    };
  }, [dragState.isActive, endKeyboardDrag]);

  return {
    dragState,
    isKeyboardDragging: dragState.isActive,
    draggedObject: dragState.draggedObject,
    currentPosition: dragState.position,
    currentDropTarget: dragState.currentDropTarget,
    startKeyboardDrag,
    moveInDirection,
    endKeyboardDrag,
    announce,
  };
}
