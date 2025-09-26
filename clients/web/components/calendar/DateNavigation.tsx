/**
 * DateNavigation Component
 * 
 * Navigation controls for date traversal in calendar views
 */

'use client';

import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Home,
  RotateCcw,
  FastForward,
  Rewind
} from 'lucide-react';

import { 
  format, 
  addDays, 
  subDays, 
  addWeeks, 
  subWeeks, 
  addMonths, 
  subMonths,
  startOfDay,
  startOfWeek,
  startOfMonth,
  endOfWeek,
  endOfMonth,
  isToday,
  isSameDay,
  isSameWeek,
  isSameMonth
} from 'date-fns';

import { CalendarView } from '@/lib/calendar/types';
import { ANIMATIONS } from '@/lib/calendar/constants';

interface DateNavigationProps {
  currentDate: Date;
  view: CalendarView;
  onDateChange: (date: Date) => void;
  onViewChange?: (view: CalendarView) => void;
  showJumpButtons?: boolean;
  showTodayButton?: boolean;
  showDatePicker?: boolean;
  compact?: boolean;
  disabled?: boolean;
  className?: string;
}

interface NavigationConfig {
  label: string;
  shortLabel: string;
  prev: () => Date;
  next: () => Date;
  jumpPrev: () => Date;
  jumpNext: () => Date;
  formatCurrent: (date: Date) => string;
  formatShort: (date: Date) => string;
  isCurrentPeriod: (date: Date) => boolean;
}

export function DateNavigation({
  currentDate,
  view,
  onDateChange,
  onViewChange,
  showJumpButtons = true,
  showTodayButton = true,
  showDatePicker = true,
  compact = false,
  disabled = false,
  className = '',
}: DateNavigationProps) {

  // Navigation configuration for each view
  const navigationConfig: NavigationConfig = useMemo(() => {
    const configs: Record<CalendarView, NavigationConfig> = {
      daily: {
        label: 'Day',
        shortLabel: 'Day',
        prev: () => subDays(currentDate, 1),
        next: () => addDays(currentDate, 1),
        jumpPrev: () => subWeeks(currentDate, 1),
        jumpNext: () => addWeeks(currentDate, 1),
        formatCurrent: (date: Date) => format(date, 'EEEE, MMMM d, yyyy'),
        formatShort: (date: Date) => format(date, 'MMM d'),
        isCurrentPeriod: (date: Date) => isSameDay(date, new Date()),
      },
      weekly: {
        label: 'Week',
        shortLabel: 'Week',
        prev: () => subWeeks(currentDate, 1),
        next: () => addWeeks(currentDate, 1),
        jumpPrev: () => subMonths(currentDate, 1),
        jumpNext: () => addMonths(currentDate, 1),
        formatCurrent: (date: Date) => {
          const start = startOfWeek(date, { weekStartsOn: 1 });
          const end = endOfWeek(date, { weekStartsOn: 1 });
          return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
        },
        formatShort: (date: Date) => {
          const start = startOfWeek(date, { weekStartsOn: 1 });
          return `Week of ${format(start, 'MMM d')}`;
        },
        isCurrentPeriod: (date: Date) => isSameWeek(date, new Date(), { weekStartsOn: 1 }),
      },
      monthly: {
        label: 'Month',
        shortLabel: 'Month',
        prev: () => subMonths(currentDate, 1),
        next: () => addMonths(currentDate, 1),
        jumpPrev: () => subMonths(currentDate, 6),
        jumpNext: () => addMonths(currentDate, 6),
        formatCurrent: (date: Date) => format(date, 'MMMM yyyy'),
        formatShort: (date: Date) => format(date, 'MMM yyyy'),
        isCurrentPeriod: (date: Date) => isSameMonth(date, new Date()),
      },
    };

    return configs[view];
  }, [view, currentDate]);

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (disabled || event.target !== document.body) return;

      switch (event.key) {
        case 'ArrowLeft':
          if (event.shiftKey) {
            onDateChange(navigationConfig.jumpPrev());
          } else {
            onDateChange(navigationConfig.prev());
          }
          event.preventDefault();
          break;
        case 'ArrowRight':
          if (event.shiftKey) {
            onDateChange(navigationConfig.jumpNext());
          } else {
            onDateChange(navigationConfig.next());
          }
          event.preventDefault();
          break;
        case 'Home':
          onDateChange(new Date());
          event.preventDefault();
          break;
        case 't':
          if (!event.ctrlKey && !event.metaKey && !event.altKey) {
            onDateChange(new Date());
            event.preventDefault();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentDate, view, navigationConfig, onDateChange, disabled]);

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    onDateChange(navigationConfig.prev());
  }, [navigationConfig, onDateChange]);

  const handleNext = useCallback(() => {
    onDateChange(navigationConfig.next());
  }, [navigationConfig, onDateChange]);

  const handleJumpPrevious = useCallback(() => {
    onDateChange(navigationConfig.jumpPrev());
  }, [navigationConfig, onDateChange]);

  const handleJumpNext = useCallback(() => {
    onDateChange(navigationConfig.jumpNext());
  }, [navigationConfig, onDateChange]);

  const handleToday = useCallback(() => {
    onDateChange(new Date());
  }, [onDateChange]);

  // Date picker handler
  const handleDatePickerChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(event.target.value);
    if (!isNaN(newDate.getTime())) {
      onDateChange(newDate);
    }
  }, [onDateChange]);

  // Current date formatting
  const currentDateString = useMemo(() => {
    return compact ? navigationConfig.formatShort(currentDate) : navigationConfig.formatCurrent(currentDate);
  }, [currentDate, navigationConfig, compact]);

  const isCurrentPeriod = navigationConfig.isCurrentPeriod(currentDate);

  return (
    <div className={`date-navigation flex items-center gap-2 ${className} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Jump previous button */}
      {showJumpButtons && !compact && (
        <motion.button
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
          onClick={handleJumpPrevious}
          title={`Previous ${navigationConfig.label.toLowerCase()}s (Shift + ←)`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Rewind className="w-4 h-4" />
        </motion.button>
      )}

      {/* Previous button */}
      <motion.button
        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
        onClick={handlePrevious}
        title={`Previous ${navigationConfig.label.toLowerCase()} (←)`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChevronLeft className="w-5 h-5" />
      </motion.button>

      {/* Current date display */}
      <div className="flex items-center gap-3 px-3 py-2 min-w-0">
        {/* Date text */}
        <div className="flex flex-col min-w-0">
          <h2 className={`
            font-semibold text-gray-900 dark:text-white truncate
            ${compact ? 'text-sm' : 'text-lg'}
          `}>
            {currentDateString}
          </h2>
          {!compact && isCurrentPeriod && (
            <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">
              Current {navigationConfig.label.toLowerCase()}
            </span>
          )}
        </div>

        {/* Date picker */}
        {showDatePicker && !compact && (
          <div className="relative">
            <input
              type="date"
              value={format(currentDate, 'yyyy-MM-dd')}
              onChange={handleDatePickerChange}
              className="absolute inset-0 w-8 h-8 opacity-0 cursor-pointer"
              title="Jump to date"
            />
            <Calendar className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer" />
          </div>
        )}
      </div>

      {/* Next button */}
      <motion.button
        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
        onClick={handleNext}
        title={`Next ${navigationConfig.label.toLowerCase()} (→)`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChevronRight className="w-5 h-5" />
      </motion.button>

      {/* Jump next button */}
      {showJumpButtons && !compact && (
        <motion.button
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
          onClick={handleJumpNext}
          title={`Next ${navigationConfig.label.toLowerCase()}s (Shift + →)`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FastForward className="w-4 h-4" />
        </motion.button>
      )}

      {/* Today button */}
      {showTodayButton && (
        <motion.button
          className={`
            px-3 py-2 text-sm font-medium rounded-lg transition-colors
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50
            ${isCurrentPeriod
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }
          `}
          onClick={handleToday}
          title="Go to today (T or Home)"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isCurrentPeriod}
        >
          {compact ? (
            <Home className="w-4 h-4" />
          ) : (
            <>
              <Home className="w-4 h-4 mr-2 inline" />
              Today
            </>
          )}
        </motion.button>
      )}

      {/* Reset button (for debugging/testing) */}
      {process.env.NODE_ENV === 'development' && (
        <motion.button
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          onClick={() => onDateChange(new Date())}
          title="Reset to today"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <RotateCcw className="w-4 h-4" />
        </motion.button>
      )}
    </div>
  );
}

/**
 * Compact date navigation for mobile/tight spaces
 */
export function CompactDateNavigation(props: Omit<DateNavigationProps, 'compact' | 'showJumpButtons' | 'showDatePicker'>) {
  return (
    <DateNavigation
      {...props}
      compact={true}
      showJumpButtons={false}
      showDatePicker={false}
    />
  );
}

/**
 * Minimal date navigation with just arrows and today
 */
export function MinimalDateNavigation({ 
  currentDate, 
  view, 
  onDateChange, 
  className = '' 
}: Pick<DateNavigationProps, 'currentDate' | 'view' | 'onDateChange' | 'className'>) {
  return (
    <DateNavigation
      currentDate={currentDate}
      view={view}
      onDateChange={onDateChange}
      showJumpButtons={false}
      showTodayButton={true}
      showDatePicker={false}
      compact={true}
      className={className}
    />
  );
}

export default DateNavigation;
