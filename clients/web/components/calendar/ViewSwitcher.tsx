/**
 * ViewSwitcher Component
 * 
 * Component for switching between different calendar views (daily, weekly, monthly)
 */

'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CalendarDays, CalendarRange, LayoutGrid } from 'lucide-react';

import { CalendarView } from '@/lib/calendar/types';
import { ANIMATIONS } from '@/lib/calendar/constants';

interface ViewOption {
  value: CalendarView;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface ViewSwitcherProps {
  currentView: CalendarView;
  onViewChange: (view: CalendarView) => void;
  compact?: boolean;
  showLabels?: boolean;
  showKeyboardShortcuts?: boolean;
  disabled?: boolean;
  className?: string;
}

const VIEW_OPTIONS: ViewOption[] = [
  {
    value: 'daily',
    label: 'Daily',
    shortLabel: 'Day',
    icon: Calendar,
    description: 'Single day with hourly breakdown',
  },
  {
    value: 'weekly',
    label: 'Weekly',
    shortLabel: 'Week',
    icon: CalendarDays,
    description: '7-day grid with time slots',
  },
  {
    value: 'monthly',
    label: 'Monthly',
    shortLabel: 'Month',
    icon: LayoutGrid,
    description: 'Traditional calendar grid',
  },
];

export function ViewSwitcher({
  currentView,
  onViewChange,
  compact = false,
  showLabels = true,
  showKeyboardShortcuts = false,
  disabled = false,
  className = '',
}: ViewSwitcherProps) {

  // Keyboard shortcuts disabled - letters removed

  // Determine sizing classes
  const sizeClasses = useMemo(() => {
    if (compact) {
      return {
        container: 'p-1',
        button: 'px-2 py-1 text-xs',
        icon: 'w-3 h-3',
      };
    }
    return {
      container: 'p-1',
      button: 'px-3 py-2 text-sm',
      icon: 'w-4 h-4',
    };
  }, [compact]);

  return (
    <div 
      className={`
        view-switcher inline-flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg ${sizeClasses.container} ${className}
        ${disabled ? 'opacity-50 pointer-events-none' : ''}
      `}
      role="tablist"
      aria-label="Calendar view switcher"
    >
      {VIEW_OPTIONS.map((option) => {
        const isActive = currentView === option.value;
        const IconComponent = option.icon;

        return (
          <motion.button
            key={option.value}
            role="tab"
            tabIndex={isActive ? 0 : -1}
            aria-selected={isActive}
            aria-controls={`calendar-${option.value}-view`}
            className={`
              relative flex items-center gap-2 font-medium transition-all duration-200 rounded-md
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50
              ${sizeClasses.button}
              ${isActive
                ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
              }
            `}
            onClick={() => onViewChange(option.value)}
            title={option.description}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Icon */}
            <IconComponent className={sizeClasses.icon} />
            
            {/* Label */}
            {showLabels && (
              <span className={compact ? 'hidden sm:inline' : ''}>
                {compact ? option.shortLabel : option.label}
              </span>
            )}

            {/* Keyboard shortcut indicator - removed letters */}

            {/* Active indicator */}
            {isActive && (
              <motion.div
                className="absolute inset-0 bg-white dark:bg-gray-800 rounded-md -z-10"
                layoutId="activeViewTab"
                transition={{
                  type: "spring",
                  bounce: 0.2,
                  duration: 0.6
                }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

/**
 * Compact view switcher for mobile/tight spaces
 */
export function CompactViewSwitcher(props: Omit<ViewSwitcherProps, 'compact' | 'showLabels'>) {
  return (
    <ViewSwitcher
      {...props}
      compact={true}
      showLabels={false}
    />
  );
}

/**
 * Dropdown view switcher for very limited space
 */
interface DropdownViewSwitcherProps extends Omit<ViewSwitcherProps, 'compact' | 'showLabels'> {
  buttonClassName?: string;
}

export function DropdownViewSwitcher({
  currentView,
  onViewChange,
  disabled = false,
  className = '',
  buttonClassName = '',
}: DropdownViewSwitcherProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const currentOption = VIEW_OPTIONS.find(opt => opt.value === currentView);

  const handleOptionClick = (view: CalendarView) => {
    onViewChange(view);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        className={`
          flex items-center gap-2 px-3 py-2 text-sm font-medium bg-white dark:bg-gray-800 
          border border-gray-300 dark:border-gray-600 rounded-lg
          hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50
          ${disabled ? 'opacity-50 pointer-events-none' : ''}
          ${buttonClassName}
        `}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {currentOption && (
          <>
            <currentOption.icon className="w-4 h-4" />
            <span>{currentOption.label}</span>
          </>
        )}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <motion.div
          className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
          variants={ANIMATIONS.variants.slideUp}
          initial="initial"
          animate="animate"
          exit="exit"
          role="listbox"
        >
          {VIEW_OPTIONS.map((option) => {
            const isActive = currentView === option.value;
            const IconComponent = option.icon;

            return (
              <button
                key={option.value}
                role="option"
                aria-selected={isActive}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors
                  hover:bg-gray-50 dark:hover:bg-gray-700
                  ${isActive ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}
                  first:rounded-t-lg last:rounded-b-lg
                `}
                onClick={() => handleOptionClick(option.value)}
              >
                <IconComponent className="w-4 h-4" />
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {option.description}
                  </div>
                </div>
                {isActive && (
                  <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </motion.div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export default ViewSwitcher;
