/**
 * SynchronizedScrollLayout Component
 * 
 * Layout that synchronizes scrolling between time column and calendar
 */

'use client';

import React, { useRef, useCallback, useEffect } from 'react';

interface SynchronizedScrollLayoutProps {
  timeColumn: React.ReactNode;
  calendar: React.ReactNode;
  className?: string;
}

export function SynchronizedScrollLayout({
  timeColumn,
  calendar,
  className = '',
}: SynchronizedScrollLayoutProps) {
  const timeColumnRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Synchronize scroll between time column and calendar
  const handleCalendarScroll = useCallback(() => {
    if (calendarRef.current && timeColumnRef.current) {
      const calendarScrollTop = calendarRef.current.scrollTop;
      
      // Find the time column scrollable content
      const timeColumnContent = timeColumnRef.current.querySelector('.time-column-content');
      if (timeColumnContent) {
        (timeColumnContent as HTMLElement).style.transform = `translateY(-${calendarScrollTop}px)`;
      }
    }
  }, []);

  // Set up scroll listener
  useEffect(() => {
    const calendarElement = calendarRef.current;
    if (calendarElement) {
      calendarElement.addEventListener('scroll', handleCalendarScroll, { passive: true });
      
      return () => {
        calendarElement.removeEventListener('scroll', handleCalendarScroll);
      };
    }
  }, [handleCalendarScroll]);

  return (
    <div className={`synchronized-scroll-layout flex h-full ${className}`}>
      {/* Time Column - Fixed width */}
      <div 
        ref={timeColumnRef}
        className="w-20 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 overflow-hidden relative"
      >
        {timeColumn}
      </div>

      {/* Main Calendar Area - Scrollable */}
      <div 
        ref={calendarRef}
        className="flex-1 relative overflow-y-auto overflow-x-hidden"
        style={{ 
          maxHeight: '100%',
          scrollBehavior: 'smooth'
        }}
      >
        {calendar}
      </div>
    </div>
  );
}

export default SynchronizedScrollLayout;
