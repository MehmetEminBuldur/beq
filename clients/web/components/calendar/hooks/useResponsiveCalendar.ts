/**
 * Responsive Calendar Hook
 * 
 * Handles responsive behavior and mobile adaptations for the calendar grid
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { CalendarView, CalendarGridConfig } from '@/lib/calendar/types';
import { GRID_DIMENSIONS } from '@/lib/calendar/constants';

interface ResponsiveState {
  screenSize: 'mobile' | 'tablet' | 'desktop';
  isTouchDevice: boolean;
  orientation: 'portrait' | 'landscape';
  availableWidth: number;
  availableHeight: number;
  compactMode: boolean;
}

interface ResponsiveCalendarConfig {
  autoSwitchView: boolean;
  preferredMobileView: CalendarView;
  compactThreshold: number;
  touchOptimizations: boolean;
}

interface UseResponsiveCalendarReturn {
  responsiveState: ResponsiveState;
  adaptedConfig: CalendarGridConfig;
  recommendedView: CalendarView;
  shouldUseCompactMode: boolean;
  touchHandlers: {
    onTouchStart: (e: TouchEvent) => void;
    onTouchMove: (e: TouchEvent) => void;
    onTouchEnd: (e: TouchEvent) => void;
  };
  adaptForMobile: (config: CalendarGridConfig) => CalendarGridConfig;
}

const DEFAULT_RESPONSIVE_CONFIG: ResponsiveCalendarConfig = {
  autoSwitchView: true,
  preferredMobileView: 'daily',
  compactThreshold: 768, // Tablet breakpoint
  touchOptimizations: true,
};

/**
 * Hook for handling responsive calendar behavior
 */
export function useResponsiveCalendar(
  baseConfig: CalendarGridConfig,
  responsiveConfig: ResponsiveCalendarConfig = DEFAULT_RESPONSIVE_CONFIG
): UseResponsiveCalendarReturn {
  
  // State for responsive properties
  const [responsiveState, setResponsiveState] = useState<ResponsiveState>({
    screenSize: 'desktop',
    isTouchDevice: false,
    orientation: 'portrait',
    availableWidth: 1024,
    availableHeight: 768,
    compactMode: false,
  });

  // Touch gesture state
  const [touchState, setTouchState] = useState({
    isTouch: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    startTime: 0,
  });

  // Detect device capabilities and screen size
  const detectDeviceCapabilities = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const { breakpoints } = GRID_DIMENSIONS;

    // Determine screen size
    let screenSize: ResponsiveState['screenSize'] = 'desktop';
    if (width < breakpoints.md) {
      screenSize = 'mobile';
    } else if (width < breakpoints.lg) {
      screenSize = 'tablet';
    }

    // Detect touch capability
    const isTouchDevice = 'ontouchstart' in window || 
                         navigator.maxTouchPoints > 0 ||
                         // @ts-ignore - for older browsers
                         navigator.msMaxTouchPoints > 0;

    // Determine orientation
    const orientation = width > height ? 'landscape' : 'portrait';

    // Determine if compact mode should be used
    const compactMode = width < responsiveConfig.compactThreshold;

    setResponsiveState({
      screenSize,
      isTouchDevice,
      orientation,
      availableWidth: width,
      availableHeight: height,
      compactMode,
    });
  }, [responsiveConfig.compactThreshold]);

  // Set up resize listener
  useEffect(() => {
    detectDeviceCapabilities();
    
    const handleResize = () => {
      detectDeviceCapabilities();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [detectDeviceCapabilities]);

  // Calculate recommended view based on screen size
  const recommendedView = useMemo((): CalendarView => {
    if (!responsiveConfig.autoSwitchView) {
      return baseConfig.view;
    }

    const { screenSize, orientation } = responsiveState;

    switch (screenSize) {
      case 'mobile':
        // Mobile: prefer daily view, especially in portrait
        return orientation === 'portrait' 
          ? responsiveConfig.preferredMobileView 
          : 'weekly';

      case 'tablet':
        // Tablet: weekly view works well
        return orientation === 'landscape' ? 'weekly' : 'daily';

      case 'desktop':
      default:
        // Desktop: any view is fine, keep user preference
        return baseConfig.view;
    }
  }, [
    responsiveConfig.autoSwitchView,
    responsiveConfig.preferredMobileView,
    baseConfig.view,
    responsiveState.screenSize,
    responsiveState.orientation,
  ]);

  // Determine if compact mode should be used
  const shouldUseCompactMode = useMemo(() => {
    return responsiveState.compactMode || 
           (responsiveState.screenSize === 'mobile' && responsiveState.orientation === 'portrait');
  }, [responsiveState.compactMode, responsiveState.screenSize, responsiveState.orientation]);

  // Adapt configuration for current device
  const adaptedConfig = useMemo((): CalendarGridConfig => {
    const adapted = { ...baseConfig };

    // Auto-switch view if enabled
    if (responsiveConfig.autoSwitchView) {
      adapted.view = recommendedView;
    }

    // Enable compact mode when appropriate
    adapted.compactMode = shouldUseCompactMode;

    // Adjust time slot configuration for mobile
    if (responsiveState.screenSize === 'mobile') {
      // Increase slot duration for better touch targets
      adapted.timeSlotConfig = {
        ...adapted.timeSlotConfig,
        slotDuration: Math.max(adapted.timeSlotConfig.slotDuration, 30),
      };

      // Disable some features that don't work well on mobile
      if (responsiveState.orientation === 'portrait') {
        adapted.showWeekends = false; // Save space
      }
    }

    return adapted;
  }, [
    baseConfig,
    responsiveConfig.autoSwitchView,
    recommendedView,
    shouldUseCompactMode,
    responsiveState.screenSize,
    responsiveState.orientation,
  ]);

  // Touch gesture handlers
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!responsiveConfig.touchOptimizations) return;

    const touch = e.touches[0];
    setTouchState({
      isTouch: true,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      startTime: Date.now(),
    });
  }, [responsiveConfig.touchOptimizations]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!responsiveConfig.touchOptimizations || !touchState.isTouch) return;

    const touch = e.touches[0];
    setTouchState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
    }));

    // Prevent scrolling during potential gestures
    const deltaX = Math.abs(touch.clientX - touchState.startX);
    const deltaY = Math.abs(touch.clientY - touchState.startY);
    
    if (deltaX > 10 || deltaY > 10) {
      e.preventDefault();
    }
  }, [responsiveConfig.touchOptimizations, touchState.isTouch, touchState.startX, touchState.startY]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!responsiveConfig.touchOptimizations || !touchState.isTouch) return;

    const deltaX = touchState.currentX - touchState.startX;
    const deltaY = touchState.currentY - touchState.startY;
    const deltaTime = Date.now() - touchState.startTime;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Reset touch state
    setTouchState(prev => ({
      ...prev,
      isTouch: false,
    }));

    // Handle swipe gestures (if implemented in parent)
    if (distance > 50 && deltaTime < 300) {
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
      
      if (isHorizontal) {
        // Horizontal swipe - could be used for date navigation
        const direction = deltaX > 0 ? 'right' : 'left';
        
        // Dispatch custom event for parent to handle
        const swipeEvent = new CustomEvent('calendarSwipe', {
          detail: { direction, deltaX, deltaY }
        });
        document.dispatchEvent(swipeEvent);
      }
    }
  }, [
    responsiveConfig.touchOptimizations,
    touchState.isTouch,
    touchState.currentX,
    touchState.startX,
    touchState.currentY,
    touchState.startY,
    touchState.startTime,
  ]);

  // Mobile-specific config adaptation function
  const adaptForMobile = useCallback((config: CalendarGridConfig): CalendarGridConfig => {
    if (responsiveState.screenSize !== 'mobile') {
      return config;
    }

    return {
      ...config,
      compactMode: true,
      showCurrentTimeIndicator: config.view === 'daily', // Only show in daily view on mobile
      allowResize: false, // Disable resizing on mobile for better UX
      timeSlotConfig: {
        ...config.timeSlotConfig,
        slotDuration: Math.max(config.timeSlotConfig.slotDuration, 30), // Minimum 30min for touch
      },
    };
  }, [responsiveState.screenSize]);

  return {
    responsiveState,
    adaptedConfig,
    recommendedView,
    shouldUseCompactMode,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    adaptForMobile,
  };
}

// Utility hook for detecting mobile device
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < GRID_DIMENSIONS.breakpoints.md);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
}

// Utility hook for detecting touch capability
export function useIsTouchDevice(): boolean {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const hasTouch = 'ontouchstart' in window || 
                    navigator.maxTouchPoints > 0 ||
                    // @ts-ignore
                    navigator.msMaxTouchPoints > 0;
    
    setIsTouchDevice(hasTouch);
  }, []);

  return isTouchDevice;
}
