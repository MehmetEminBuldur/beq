/**
 * Calendar Accessibility Hook
 * 
 * Provides comprehensive accessibility features for the calendar grid
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';

import {
  AccessibilityConfig,
  AccessibilityState,
  CalendarGridCell,
  ScheduleObject,
  TimeSlot,
} from '@/lib/calendar/types';

import {
  KEYBOARD_SHORTCUTS,
  ARIA_LABELS,
  DEFAULT_ACCESSIBILITY_CONFIG,
} from '@/lib/calendar/constants';

import {
  getAccessibleCellLabel,
  getAccessibleEventLabel,
  formatTimeSlot,
} from '@/lib/calendar/utils';

interface UseCalendarAccessibilityProps {
  cells: CalendarGridCell[];
  config: AccessibilityConfig;
  gridColumns: number;
  onCellSelect?: (cell: CalendarGridCell) => void;
  onEventSelect?: (event: ScheduleObject) => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  onViewChange?: (view: 'daily' | 'weekly' | 'monthly') => void;
}

interface UseCalendarAccessibilityReturn {
  accessibilityState: AccessibilityState;
  actions: {
    setFocusedCell: (cellId: string | null) => void;
    selectObject: (objectId: string) => void;
    announceToScreenReader: (message: string) => void;
    handleKeyboardNavigation: (event: React.KeyboardEvent) => void;
    focusCell: (cellId: string) => void;
    clearFocus: () => void;
  };
  ariaProps: {
    gridProps: React.AriaAttributes;
    cellProps: (cell: CalendarGridCell) => React.AriaAttributes;
    eventProps: (event: ScheduleObject) => React.AriaAttributes;
  };
  announcements: string[];
}

/**
 * Hook for calendar accessibility features
 */
export function useCalendarAccessibility({
  cells,
  config = DEFAULT_ACCESSIBILITY_CONFIG,
  gridColumns,
  onCellSelect,
  onEventSelect,
  onNavigate,
  onViewChange,
}: UseCalendarAccessibilityProps): UseCalendarAccessibilityReturn {

  // Accessibility state
  const [accessibilityState, setAccessibilityState] = useState<AccessibilityState>({
    focusedCell: null,
    selectedObjects: [],
    announcements: [],
    keyboardNavigationEnabled: config.enableKeyboardNavigation,
  });

  // Refs for managing focus
  const announcementTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const lastAnnouncementRef = useRef<string>('');

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      announcementTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
      announcementTimeoutRef.current.clear();
    };
  }, []);

  // Screen reader announcements
  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!config.enableScreenReader || !message.trim()) return;

    // Prevent duplicate announcements
    if (message === lastAnnouncementRef.current) return;
    lastAnnouncementRef.current = message;

    const announcementId = `announcement-${Date.now()}`;
    
    setAccessibilityState(prev => ({
      ...prev,
      announcements: [...prev.announcements.slice(-4), message], // Keep last 5 announcements
    }));

    // Clear announcement after delay
    const timeout = setTimeout(() => {
      setAccessibilityState(prev => ({
        ...prev,
        announcements: prev.announcements.filter(a => a !== message),
      }));
      announcementTimeoutRef.current.delete(announcementId);
    }, priority === 'assertive' ? 5000 : 3000);

    announcementTimeoutRef.current.set(announcementId, timeout);
  }, [config.enableScreenReader]);

  // Focus management
  const setFocusedCell = useCallback((cellId: string | null) => {
    setAccessibilityState(prev => ({
      ...prev,
      focusedCell: cellId,
    }));

    if (cellId && config.announceTimeChanges) {
      const cell = cells.find(c => c.id === cellId);
      if (cell) {
        announceToScreenReader(getAccessibleCellLabel(cell));
      }
    }
  }, [cells, config.announceTimeChanges, announceToScreenReader]);

  const selectObject = useCallback((objectId: string) => {
    setAccessibilityState(prev => {
      const isSelected = prev.selectedObjects.includes(objectId);
      const newSelection = isSelected
        ? prev.selectedObjects.filter(id => id !== objectId)
        : [...prev.selectedObjects, objectId];

      return {
        ...prev,
        selectedObjects: newSelection,
      };
    });

    // Find and announce the selected object
    const selectedEvent = cells
      .flatMap(cell => cell.events)
      .find(event => event.id === objectId);

    if (selectedEvent) {
      const action = accessibilityState.selectedObjects.includes(objectId) ? 'Deselected' : 'Selected';
      announceToScreenReader(`${action} ${selectedEvent.title}`);
    }
  }, [cells, accessibilityState.selectedObjects, announceToScreenReader]);

  const focusCell = useCallback((cellId: string) => {
    setFocusedCell(cellId);
    
    // Focus the actual DOM element if focus management is enabled
    if (config.focusManagement === 'auto') {
      requestAnimationFrame(() => {
        const element = document.querySelector(`[data-cell-id="${cellId}"]`) as HTMLElement;
        if (element) {
          element.focus();
        }
      });
    }
  }, [setFocusedCell, config.focusManagement]);

  const clearFocus = useCallback(() => {
    setAccessibilityState(prev => ({
      ...prev,
      focusedCell: null,
      selectedObjects: [],
    }));
  }, []);

  // Keyboard navigation
  const handleKeyboardNavigation = useCallback((event: React.KeyboardEvent) => {
    if (!config.enableKeyboardNavigation) return;

    const { key, ctrlKey, shiftKey, metaKey } = event;
    const modifierPressed = ctrlKey || shiftKey || metaKey;

    // Find currently focused cell
    const focusedIndex = cells.findIndex(cell => cell.id === accessibilityState.focusedCell);
    const currentCell = focusedIndex >= 0 ? cells[focusedIndex] : null;

    // Navigation shortcuts
    const { navigation, actions, views } = KEYBOARD_SHORTCUTS;

    switch (key) {
      // Arrow navigation
      case navigation.up:
        event.preventDefault();
        if (focusedIndex >= gridColumns) {
          const newIndex = focusedIndex - gridColumns;
          focusCell(cells[newIndex].id);
        }
        break;

      case navigation.down:
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex + gridColumns < cells.length) {
          const newIndex = focusedIndex + gridColumns;
          focusCell(cells[newIndex].id);
        }
        break;

      case navigation.left:
        event.preventDefault();
        if (focusedIndex > 0) {
          focusCell(cells[focusedIndex - 1].id);
        }
        break;

      case navigation.right:
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < cells.length - 1) {
          focusCell(cells[focusedIndex + 1].id);
        }
        break;

      // Jump navigation
      case navigation.home:
        event.preventDefault();
        if (modifierPressed) {
          // Go to first cell
          focusCell(cells[0].id);
        } else {
          // Go to first cell in current row
          const rowStart = Math.floor(focusedIndex / gridColumns) * gridColumns;
          focusCell(cells[rowStart].id);
        }
        break;

      case navigation.end:
        event.preventDefault();
        if (modifierPressed) {
          // Go to last cell
          focusCell(cells[cells.length - 1].id);
        } else {
          // Go to last cell in current row
          const rowStart = Math.floor(focusedIndex / gridColumns) * gridColumns;
          const rowEnd = Math.min(rowStart + gridColumns - 1, cells.length - 1);
          focusCell(cells[rowEnd].id);
        }
        break;

      case navigation.pageUp:
        event.preventDefault();
        onNavigate?.('prev');
        announceToScreenReader('Navigated to previous period');
        break;

      case navigation.pageDown:
        event.preventDefault();
        onNavigate?.('next');
        announceToScreenReader('Navigated to next period');
        break;

      // Action shortcuts
      case actions.select:
        event.preventDefault();
        if (currentCell) {
          onCellSelect?.(currentCell);
          announceToScreenReader(`Selected ${getAccessibleCellLabel(currentCell)}`);
        }
        break;

      case actions.escape:
        event.preventDefault();
        clearFocus();
        announceToScreenReader('Cleared selection');
        break;

      case actions.delete:
        event.preventDefault();
        if (accessibilityState.selectedObjects.length > 0) {
          announceToScreenReader(`Delete ${accessibilityState.selectedObjects.length} selected items`);
          // Delegate to parent component for actual deletion
        }
        break;

      // View shortcuts
      case views.daily:
        if (!modifierPressed) {
          event.preventDefault();
          onViewChange?.('daily');
          announceToScreenReader('Switched to daily view');
        }
        break;

      case views.weekly:
        if (!modifierPressed) {
          event.preventDefault();
          onViewChange?.('weekly');
          announceToScreenReader('Switched to weekly view');
        }
        break;

      case views.monthly:
        if (!modifierPressed) {
          event.preventDefault();
          onViewChange?.('monthly');
          announceToScreenReader('Switched to monthly view');
        }
        break;

      case views.today:
        if (!modifierPressed) {
          event.preventDefault();
          announceToScreenReader('Navigated to today');
          // Delegate to parent component for date change
        }
        break;

      // Event selection within cell
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
        if (currentCell && !modifierPressed) {
          const eventIndex = parseInt(key) - 1;
          const targetEvent = currentCell.events[eventIndex];
          if (targetEvent) {
            event.preventDefault();
            selectObject(targetEvent.id);
            onEventSelect?.(targetEvent);
          }
        }
        break;

      default:
        // No action needed for other keys
        break;
    }
  }, [
    config.enableKeyboardNavigation,
    cells,
    accessibilityState.focusedCell,
    accessibilityState.selectedObjects,
    gridColumns,
    focusCell,
    clearFocus,
    onCellSelect,
    onEventSelect,
    onNavigate,
    onViewChange,
    selectObject,
    announceToScreenReader,
  ]);

  // ARIA properties for grid
  const gridProps: React.AriaAttributes = {
    'aria-label': ARIA_LABELS.calendarGrid,
    'aria-multiselectable': true,
    'aria-readonly': false,
    role: 'grid',
  };

  // ARIA properties for individual cells
  const cellProps = useCallback((cell: CalendarGridCell): React.AriaAttributes => {
    const isFocused = accessibilityState.focusedCell === cell.id;
    const hasEvents = cell.events.length > 0;

    return {
      'aria-label': getAccessibleCellLabel(cell),
      'aria-selected': isFocused,
      'aria-describedby': hasEvents ? `${cell.id}-events` : undefined,
      role: 'gridcell',
      tabIndex: isFocused ? 0 : -1,
      'data-cell-id': cell.id,
    };
  }, [accessibilityState.focusedCell]);

  // ARIA properties for events
  const eventProps = useCallback((event: ScheduleObject): React.AriaAttributes => {
    const isSelected = accessibilityState.selectedObjects.includes(event.id);

    return {
      'aria-label': getAccessibleEventLabel(event),
      'aria-selected': isSelected,
      'aria-describedby': `${event.id}-details`,
      role: 'button',
      tabIndex: 0,
    };
  }, [accessibilityState.selectedObjects]);

  return {
    accessibilityState,
    actions: {
      setFocusedCell,
      selectObject,
      announceToScreenReader,
      handleKeyboardNavigation,
      focusCell,
      clearFocus,
    },
    ariaProps: {
      gridProps,
      cellProps,
      eventProps,
    },
    announcements: accessibilityState.announcements,
  };
}

/**
 * Hook for managing reduced motion preferences
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook for managing high contrast preferences
 */
export function useHighContrast(): boolean {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersHighContrast(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersHighContrast;
}

/**
 * Custom hook for screen reader detection
 */
export function useScreenReader(): { isScreenReader: boolean; screenReaderType: string | null } {
  const [screenReaderInfo, setScreenReaderInfo] = useState({
    isScreenReader: false,
    screenReaderType: null as string | null,
  });

  useEffect(() => {
    // Check for common screen reader indicators
    const userAgent = navigator.userAgent.toLowerCase();
    const hasScreenReader = 
      // NVDA
      userAgent.includes('nvda') ||
      // JAWS
      userAgent.includes('jaws') ||
      // VoiceOver (limited detection)
      userAgent.includes('voiceover') ||
      // Check for accessibility APIs
      'speechSynthesis' in window ||
      // Check for high contrast (often indicates screen reader use)
      window.matchMedia('(prefers-contrast: high)').matches;

    let screenReaderType = null;
    if (userAgent.includes('nvda')) screenReaderType = 'NVDA';
    else if (userAgent.includes('jaws')) screenReaderType = 'JAWS';
    else if (userAgent.includes('voiceover')) screenReaderType = 'VoiceOver';

    setScreenReaderInfo({
      isScreenReader: hasScreenReader,
      screenReaderType,
    });
  }, []);

  return screenReaderInfo;
}
