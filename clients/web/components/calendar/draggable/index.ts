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

// Resizable components (extends draggable with resize functionality)
export { 
  ResizableScheduleObject,
  type ResizeState,
  type ResizeResult
} from './ResizableScheduleObject';
export { ResizableBrick } from './ResizableBrick';
export { ResizableQuanta } from './ResizableQuanta';

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
