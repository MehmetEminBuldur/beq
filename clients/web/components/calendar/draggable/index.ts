/**
 * Draggable Calendar Components - Public API
 * 
 * Export file for draggable calendar components
 */

// Base draggable component
export { 
  DraggableScheduleObject,
  type DragState as BaseDragState,
  type DragResult
} from './DraggableScheduleObject';

// Specialized draggable components
export { DraggableBrick } from './DraggableBrick';
export { DraggableQuanta } from './DraggableQuanta';

// Drag system hook
export { 
  useDragSystem,
  type DragState,
  type DropTarget,
  type DragResult as SystemDragResult
} from '@/lib/hooks/use-drag-system';

// Keyboard drag accessibility
export { 
  useKeyboardDrag,
  type KeyboardDragState,
  type KeyboardDragOptions
} from '@/lib/hooks/use-keyboard-drag';

// Style provider
export { DragStyleProvider } from './DragStyleProvider';
