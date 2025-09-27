'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { CalendarApp } from '@/components/calendar/CalendarApp';
import { DragStyleProvider } from '@/components/calendar';
import { Navigation } from '@/components/layout/navigation';
import { useAuthContext } from '@/lib/providers/auth-provider';
import { useDashboard } from '@/lib/hooks/use-dashboard';
import { useBricks } from '@/lib/hooks/use-bricks';
import { CalendarGridCell, ScheduleObject } from '@/lib/calendar/types';
import { SCHEDULE_OBJECT_COLORS, COMPACT_DAY_CONFIG } from '@/lib/calendar/constants';
import { addHours, setHours, setMinutes, addDays, startOfDay } from 'date-fns';

export default function CalendarPage() {
  const { user } = useAuthContext();
  const { todaySchedule, stats } = useDashboard();
  const { bricks, quantas } = useBricks();

  // Dynamic stats calculations
  const dynamicStats = useMemo(() => {
    const totalBricks = bricks.length;
    const totalQuantas = quantas.length;
    const completedBricks = bricks.filter(b => b.status === 'completed').length;
    const completedQuantas = quantas.filter(q => q.status === 'completed').length;
    const inProgressItems = bricks.filter(b => b.status === 'in_progress').length + 
                           quantas.filter(q => q.status === 'in_progress').length;
    
    return {
      totalEvents: totalBricks + totalQuantas,
      activeBricks: bricks.filter(b => b.status !== 'completed').length,
      activeQuantas: quantas.filter(q => q.status !== 'completed').length,
      completedToday: completedBricks + completedQuantas,
      inProgress: inProgressItems,
      completionRate: totalBricks + totalQuantas > 0 ? 
        Math.round(((completedBricks + completedQuantas) / (totalBricks + totalQuantas)) * 100) : 0
    };
  }, [bricks, quantas]);


  // State for dynamic interactions
  const [selectedEvent, setSelectedEvent] = useState<ScheduleObject | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  
  // Chat state
  type ChatMessage = {
    id: number;
    type: 'ai' | 'user';
    content: string;
    timestamp: Date;
  };

  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      type: 'ai',
      content: 'Hi! I can help you schedule tasks, optimize your calendar, and manage your bricks and quantas. What would you like to do?',
      timestamp: new Date()
    }
  ]);

  // Selection state
  const [selectedBricks, setSelectedBricks] = useState<Set<string>>(new Set());
  const [selectedQuantas, setSelectedQuantas] = useState<Set<string>>(new Set());
  const [showOptimizationMenu, setShowOptimizationMenu] = useState(false);
  
  // Track manually scheduled items (items that have been dragged to timeline)
  const [scheduledBricks, setScheduledBricks] = useState<Set<string>>(new Set());
  const [scheduledQuantas, setScheduledQuantas] = useState<Set<string>>(new Set());
  
  // Store manually scheduled events to display on timeline
  const [manuallyScheduledEvents, setManuallyScheduledEvents] = useState<ScheduleObject[]>([]);

  // Filter unscheduled items for left pane
  const unscheduledBricks = useMemo(() => {
    return bricks.filter(brick => !scheduledBricks.has(brick.id));
  }, [bricks, scheduledBricks]);

  const unscheduledQuantas = useMemo(() => {
    return quantas.filter(quanta => !scheduledQuantas.has(quanta.id));
  }, [quantas, scheduledQuantas]);

  // Convert bricks and quantas to dynamic schedule objects
  const scheduleObjects = useMemo((): ScheduleObject[] => {
    const objects: ScheduleObject[] = [];
    const now = new Date();
    
    // Only convert unscheduled bricks to schedule objects with intelligent scheduling
    unscheduledBricks.forEach((brick, index) => {
      // Distribute bricks across the current week with realistic timing
      const dayOffset = index % 7; // Spread across 7 days
      const baseDate = addDays(startOfDay(now), dayOffset);
      
      // Smart time allocation based on priority and type
      const priorityHours = brick.priority === 'urgent' ? 8 : brick.priority === 'high' ? 10 : 14;
      const startTime = setHours(setMinutes(baseDate, 0), priorityHours);
      
      // Dynamic duration based on estimated hours or default
      const estimatedHours = (brick as any).estimated_hours || 2;
      const duration = Math.min(estimatedHours, 4); // Cap at 4 hours
      
      objects.push({
        id: `brick-${brick.id}`,
        title: brick.title,
        description: brick.description || `Work on ${brick.title}`,
        startTime,
        endTime: addHours(startTime, duration),
        type: 'brick',
        status: brick.status === 'completed' ? 'completed' : 
               brick.status === 'in_progress' ? 'in_progress' : 'pending',
        color: SCHEDULE_OBJECT_COLORS.brick.primary,
        backgroundColor: SCHEDULE_OBJECT_COLORS.brick.background,
        borderColor: SCHEDULE_OBJECT_COLORS.brick.border,
        isAllDay: false,
        isRecurring: false,
        userId: user?.id || '',
        priority: (brick.priority === 'urgent' ? 'high' : brick.priority) || 'medium',
        estimatedHours: duration,
        progress: (brick as any).progress || 0,
        dependencies: [],
      });
    });

    // Convert unscheduled quantas to schedule objects with energy-based timing
    unscheduledQuantas.forEach((quanta, index) => {
      // Distribute quantas with energy-optimal timing
      const dayOffset = index % 5; // Weekdays only
      const baseDate = addDays(startOfDay(now), dayOffset);
      
      // Energy-based scheduling (high energy = morning, low = afternoon)
      const energyLevel = (quanta as any).energy_level || 'medium';
      const baseHour = energyLevel === 'high' ? 9 : energyLevel === 'medium' ? 13 : 16;
      const startTime = setHours(setMinutes(baseDate, 0), baseHour);
      
      // Shorter, focused time blocks for quantas
      const duration = (quanta as any).estimated_minutes ? 
        Math.min((quanta as any).estimated_minutes / 60, 2) : 1;
      
      objects.push({
        id: `quanta-${quanta.id}`,
        title: quanta.title,
        description: quanta.description || `Focus time: ${quanta.title}`,
        startTime,
        endTime: addHours(startTime, duration),
        type: 'quanta',
        status: quanta.status === 'completed' ? 'completed' : 
               quanta.status === 'in_progress' ? 'in_progress' : 'pending',
        color: SCHEDULE_OBJECT_COLORS.quanta.primary,
        backgroundColor: SCHEDULE_OBJECT_COLORS.quanta.background,
        borderColor: SCHEDULE_OBJECT_COLORS.quanta.border,
        isAllDay: false,
        isRecurring: false,
        userId: user?.id || '',
        category: (quanta as any).category || 'work',
        energy: energyLevel,
      });
    });

    // Add dynamic recurring events only if user has schedule data
    if (objects.length > 0) {
      const recurringEvents: ScheduleObject[] = [
        {
          id: `standup-${now.getTime()}`,
          title: 'Daily Standup',
          description: 'Team sync and planning session',
          startTime: setHours(setMinutes(now, 0), 9),
          endTime: setHours(setMinutes(now, 30), 9),
          type: 'meeting',
          status: 'upcoming',
          color: SCHEDULE_OBJECT_COLORS.meeting.primary,
          backgroundColor: SCHEDULE_OBJECT_COLORS.meeting.background,
          borderColor: SCHEDULE_OBJECT_COLORS.meeting.border,
          isAllDay: false,
          isRecurring: true,
          userId: user?.id || '',
          attendees: ['team'],
          organizer: user?.id || '',
          isRequired: false,
        }
      ];
      
      objects.push(...recurringEvents);
    }

    // Combine auto-generated objects with manually scheduled events
    return [...objects, ...manuallyScheduledEvents];
  }, [unscheduledBricks, unscheduledQuantas, manuallyScheduledEvents, user?.id]);

  // Selection handlers
  const handleBrickSelection = useCallback((brickId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const newSelectedBricks = new Set(selectedBricks);
    const newSelectedQuantas = new Set(selectedQuantas);
    
    if (selectedBricks.has(brickId)) {
      // Deselect brick and its quantas
      newSelectedBricks.delete(brickId);
      // Remove all quantas of this brick
      quantas.forEach(quanta => {
        if ((quanta as any).brick_id === brickId) {
          newSelectedQuantas.delete(quanta.id);
        }
      });
    } else {
      // Select brick and all its quantas
      newSelectedBricks.add(brickId);
      // Add all quantas of this brick
      quantas.forEach(quanta => {
        if ((quanta as any).brick_id === brickId) {
          newSelectedQuantas.add(quanta.id);
        }
      });
    }
    
    setSelectedBricks(newSelectedBricks);
    setSelectedQuantas(newSelectedQuantas);
  }, [selectedBricks, selectedQuantas, quantas]);

  const handleQuantaSelection = useCallback((quantaId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const newSelectedQuantas = new Set(selectedQuantas);
    
    if (selectedQuantas.has(quantaId)) {
      newSelectedQuantas.delete(quantaId);
    } else {
      newSelectedQuantas.add(quantaId);
    }
    
    setSelectedQuantas(newSelectedQuantas);
    
    // Check if we need to update brick selection
    const quanta = quantas.find(q => q.id === quantaId);
    if (quanta && (quanta as any).brick_id) {
      const brickId = (quanta as any).brick_id;
      const brickQuantas = quantas.filter(q => (q as any).brick_id === brickId);
      const selectedBrickQuantas = brickQuantas.filter(q => newSelectedQuantas.has(q.id));
      
      const newSelectedBricks = new Set(selectedBricks);
      if (selectedBrickQuantas.length === brickQuantas.length) {
        // All quantas of this brick are selected, select the brick
        newSelectedBricks.add(brickId);
      } else {
        // Not all quantas are selected, deselect the brick
        newSelectedBricks.delete(brickId);
      }
      setSelectedBricks(newSelectedBricks);
    }
  }, [selectedQuantas, selectedBricks, quantas]);

  // Optimization handlers
  const handleOptimizeAll = useCallback(() => {
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      type: 'ai',
      content: 'Optimizing all quantas in your task list... This will analyze all tasks and suggest the best scheduling based on priority, energy levels, and dependencies.',
      timestamp: new Date()
    }]);
    setShowOptimizationMenu(false);
    setIsChatOpen(true);
  }, []);

  const handleOptimizeSelected = useCallback(() => {
    const selectedCount = selectedQuantas.size;
    if (selectedCount === 0) {
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        type: 'ai',
        content: 'Please select some quantas first to optimize them.',
        timestamp: new Date()
      }]);
    } else {
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        type: 'ai',
        content: `Optimizing ${selectedCount} selected quanta${selectedCount > 1 ? 's' : ''}... I'll analyze their priorities, energy requirements, and find the optimal scheduling times.`,
        timestamp: new Date()
      }]);
    }
    setShowOptimizationMenu(false);
    setIsChatOpen(true);
  }, [selectedQuantas.size]);

  const handleOptimizeByCategory = useCallback((category: string) => {
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      type: 'ai',
      content: `Optimizing all quantas in the "${category}" category... I'll focus on tasks within this specific category and optimize their scheduling.`,
      timestamp: new Date()
    }]);
    setShowOptimizationMenu(false);
    setIsChatOpen(true);
  }, []);

  // Close optimization menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showOptimizationMenu) {
        const target = event.target as Element;
        if (!target.closest('.optimization-menu-container')) {
          setShowOptimizationMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showOptimizationMenu]);

  // Handle cell clicks (for creating new events)
  const handleCellClick = useCallback((cell: CalendarGridCell) => {
    if (cell.timeSlot) {
      setIsCreatingEvent(true);
      // Create a temporary event for preview
      const tempEvent: ScheduleObject = {
        id: `temp-${Date.now()}`,
        title: 'New Event',
        description: 'Click to edit details',
        startTime: cell.timeSlot.startTime,
        endTime: cell.timeSlot.endTime,
        type: 'event',
        status: 'pending',
        color: SCHEDULE_OBJECT_COLORS.event.primary,
        backgroundColor: SCHEDULE_OBJECT_COLORS.event.background,
        borderColor: SCHEDULE_OBJECT_COLORS.event.border,
        isAllDay: false,
        isRecurring: false,
        userId: user?.id || '',
        source: 'internal',
      };
      setSelectedEvent(tempEvent);
    }
  }, [user?.id]);

  // Handle event clicks (for editing events)
  const handleEventClick = useCallback((event: ScheduleObject, cell: CalendarGridCell) => {
    setSelectedEvent(event);
    setIsCreatingEvent(false);
  }, []);

  // Handle event creation
  const handleEventCreate = useCallback((cell: CalendarGridCell) => {
    const eventTime = cell.timeSlot ? 
      `at ${cell.timeSlot.startTime.toLocaleTimeString()}` : 
      'all day';
    
    // Show a more user-friendly creation interface
    const title = prompt(`Create new event on ${cell.date.toLocaleDateString()} ${eventTime}:`);
    if (title) {
      // In a real app, this would call an API
      console.log('Creating event:', { title, date: cell.date, timeSlot: cell.timeSlot });
      // Reset creation state
      setIsCreatingEvent(false);
      setSelectedEvent(null);
    }
  }, []);

  // Handle event updates
  const handleEventUpdate = useCallback((event: ScheduleObject) => {
    // In a real app, this would update the backend
    console.log('Updating event:', event);
    setSelectedEvent(event);
  }, []);

  // Handle event deletion
  const handleEventDelete = useCallback((event: ScheduleObject) => {
    if (confirm(`Delete "${event.title}"?`)) {
      // In a real app, this would call delete API
      console.log('Deleting event:', event);
      setSelectedEvent(null);
    }
  }, []);

  // Handle drag operations
  const handleDragStart = (object: ScheduleObject) => {
    console.log('Drag started:', object);
  };

  const handleDragEnd = (result: any) => {
    console.log('Drag ended:', result);
    if (result.success) {
      handleEventUpdate(result.updatedObject);
    }
  };

  // Chat handlers
  const handleChatSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now(),
      type: 'user',
      content: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);

    // Generate AI response based on input
    let aiResponse = '';
    const input = chatInput.toLowerCase();
    
    if (input.includes('schedule') || input.includes('add')) {
      aiResponse = `I can help you schedule that! Would you like me to add it as a brick (long-term task) or a quanta (focused work session)? Please specify the time and duration.`;
    } else if (input.includes('optimize') || input.includes('improve')) {
      aiResponse = `I can optimize your schedule! I see you have ${dynamicStats.totalEvents} events. I can suggest better time slots based on your energy levels and priorities.`;
    } else if (input.includes('brick') || input.includes('task')) {
      aiResponse = `I can help with your bricks! You currently have ${dynamicStats.activeBricks} active bricks. Would you like me to schedule one of them or create a new one?`;
    } else if (input.includes('quanta') || input.includes('focus')) {
      aiResponse = `Perfect for focused work! You have ${dynamicStats.activeQuantas} active quantas. I can help you find the best time slots for deep work based on your energy patterns.`;
    } else {
      aiResponse = `I understand you want help with "${chatInput}". I can assist with scheduling tasks, optimizing your calendar, managing bricks and quantas, or finding the best times for focused work. What specific action would you like to take?`;
    }

    // Add AI response after a short delay
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiMessage]);
    }, 1000);

    setChatInput('');
  }, [chatInput, dynamicStats]);

  const handleTaskClick = useCallback((task: any, type: 'brick' | 'quanta') => {
    const message: ChatMessage = {
      id: Date.now(),
      type: 'ai',
      content: `I see you clicked on "${task.title}" (${type}). Would you like me to schedule this for you? I can suggest optimal time slots based on its priority and your current calendar.`,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, message]);
  }, []);

  const handleTaskDrop = useCallback((dragData: { type: 'brick' | 'quanta', data: any }, event: React.DragEvent) => {
    const { type, data } = dragData;
    
    // Mark item as scheduled (remove from left pane)
    if (type === 'brick') {
      setScheduledBricks(prev => new Set([...prev, data.id]));
    } else if (type === 'quanta') {
      setScheduledQuantas(prev => new Set([...prev, data.id]));
    }
    
    // Get the drop position relative to the calendar
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Calculate approximate time based on drop position
    // Assuming calendar starts at 6 AM and each hour is roughly 60px
    const startHour = 6;
    const pixelsPerHour = 60;
    const dropHour = Math.max(startHour, Math.min(23, startHour + Math.floor(y / pixelsPerHour)));
    
    // Create a new schedule object from the dropped task
    const now = new Date();
    const dropDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), dropHour, 0);
    const duration = type === 'brick' ? ((data as any).estimated_hours || 2) : 
                    ((data as any).estimated_minutes ? (data as any).estimated_minutes / 60 : 1);
    
    const newScheduleObject: ScheduleObject = type === 'brick' ? {
      id: `brick-scheduled-${data.id}-${Date.now()}`,
      title: data.title,
      description: data.description || `Scheduled brick`,
      startTime: dropDate,
      endTime: addHours(dropDate, duration),
      type: 'brick',
      status: 'pending',
      color: SCHEDULE_OBJECT_COLORS.brick.primary,
      backgroundColor: SCHEDULE_OBJECT_COLORS.brick.background,
      borderColor: SCHEDULE_OBJECT_COLORS.brick.border,
      isAllDay: false,
      isRecurring: false,
      userId: user?.id || '',
      priority: data.priority || 'medium',
      estimatedHours: duration,
      progress: (data as any).progress || 0,
      dependencies: [],
    } : {
      id: `quanta-scheduled-${data.id}-${Date.now()}`,
      title: data.title,
      description: data.description || `Scheduled quanta`,
      startTime: dropDate,
      endTime: addHours(dropDate, duration),
      type: 'quanta',
      status: 'pending',
      color: SCHEDULE_OBJECT_COLORS.quanta.primary,
      backgroundColor: SCHEDULE_OBJECT_COLORS.quanta.background,
      borderColor: SCHEDULE_OBJECT_COLORS.quanta.border,
      isAllDay: false,
      isRecurring: false,
      userId: user?.id || '',
      category: (data as any).category || 'work',
      energy: (data as any).energy_level || 'medium',
    };

    // Add the scheduled event to the timeline
    setManuallyScheduledEvents(prev => [...prev, newScheduleObject]);

    // Add success message to chat
    const successMessage: ChatMessage = {
      id: Date.now(),
      type: 'ai',
      content: `Great! I've scheduled "${data.title}" (${type}) for ${dropDate.toLocaleTimeString()} today. The ${type} will run for ${duration} hour${duration !== 1 ? 's' : ''}. You can drag it to adjust the time or resize it to change the duration.`,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, successMessage]);

    // In a real app, this would save to the backend
    console.log('Scheduled task:', newScheduleObject);
  }, [user?.id, handleEventUpdate]);


  return (
    <>
      <DragStyleProvider />
      <Navigation />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
        <div className="flex h-[calc(100vh-4rem)]">
          {/* Left Sidebar - 30% width */}
          <div className="w-[30%] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col relative">
            {/* Tasks Section - Dynamic height based on chat visibility */}
            <div className={`${isChatOpen ? 'h-[60%]' : 'h-full'} p-4 ${isChatOpen ? 'border-b border-gray-200 dark:border-gray-700' : ''} transition-all duration-300`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Tasks & Quantas
                </h2>
                <div className="flex items-center gap-2">
                <button
                    onClick={() => {
                      // TODO: Open add task modal/form
                      console.log('Add new task manually');
                      const message: ChatMessage = {
                        id: Date.now(),
                        type: 'ai',
                        content: 'I can help you create a new task! Would you like to add a brick (long-term task) or a quanta (focused work session)? Please provide a title, description, and estimated duration.',
                        timestamp: new Date()
                      };
                      setChatMessages(prev => [...prev, message]);
                      setIsChatOpen(true);
                    }}
                    className="p-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    title="Add New Task"
                  >
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title={isChatOpen ? "Hide AI Chat" : "Show AI Chat"}
                  >
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {isChatOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13l-7 7-7-7m14-8l-7 7-7-7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      )}
                    </svg>
                  </button>
                  <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
                    View All
                  </button>
                </div>
                </div>
                
              {/* Drag Instructions */}
              <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                  </svg>
                  Drag tasks to the calendar to schedule them
                </p>
              </div>
              
              {/* Task Categories */}
              <div className={`space-y-4 overflow-y-auto ${isChatOpen ? 'h-[calc(100%-7rem)]' : 'h-[calc(100%-6rem)]'} transition-all duration-300`}>
                {/* Bricks Section */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    Unscheduled Bricks ({unscheduledBricks.length})
                  </h3>
                  <div className="space-y-2">
                    {unscheduledBricks.slice(0, isChatOpen ? 3 : 6).map((brick) => {
                      const isSelected = selectedBricks.has(brick.id);
                      return (
                      <div
                        key={brick.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/json', JSON.stringify({
                            type: 'brick',
                            data: brick
                          }));
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        onClick={(e) => {
                          if (e.ctrlKey || e.metaKey) {
                            handleBrickSelection(brick.id, e);
                          } else {
                            handleTaskClick(brick, 'brick');
                          }
                        }}
                        className={`relative p-3 rounded-lg border cursor-grab active:cursor-grabbing transition-all duration-200 ${
                          isSelected 
                            ? 'bg-blue-200 dark:bg-blue-800/50 border-blue-400 dark:border-blue-600 ring-2 ring-blue-400 dark:ring-blue-500' 
                            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                        }`}
                      >
                        {/* Selection checkbox */}
                        <div 
                          className="absolute top-2 right-2 w-5 h-5 rounded border-2 border-blue-400 dark:border-blue-500 bg-white dark:bg-gray-800 flex items-center justify-center cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                          onClick={(e) => handleBrickSelection(brick.id, e)}
                        >
                          {isSelected && (
                            <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="mb-1 pr-8">
                          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 truncate">
                            {brick.title}
                          </h4>
                        </div>
                        <p className="text-xs text-blue-700 dark:text-blue-300 truncate">
                          {brick.description || 'No description'}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              brick.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                              brick.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {brick.status.replace('_', ' ')}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              brick.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                              brick.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                              'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            }`}>
                              {brick.priority}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                            </svg>
                            {(brick as any).estimated_hours || 2}h
                          </div>
                        </div>
                      </div>
                      );
                    })}
                    {unscheduledBricks.length > (isChatOpen ? 3 : 6) && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                        +{unscheduledBricks.length - (isChatOpen ? 3 : 6)} more bricks
                            </div>
                          )}
                  </div>
                </div>

                {/* Quantas Section */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded"></div>
                    Unscheduled Quantas ({unscheduledQuantas.length})
                  </h3>
                  <div className="space-y-2">
                    {unscheduledQuantas.slice(0, isChatOpen ? 3 : 6).map((quanta) => {
                      const isSelected = selectedQuantas.has(quanta.id);
                      return (
                      <div
                        key={quanta.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/json', JSON.stringify({
                            type: 'quanta',
                            data: quanta
                          }));
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        onClick={(e) => {
                          if (e.ctrlKey || e.metaKey) {
                            handleQuantaSelection(quanta.id, e);
                          } else {
                            handleTaskClick(quanta, 'quanta');
                          }
                        }}
                        className={`relative p-3 rounded-lg border cursor-grab active:cursor-grabbing transition-all duration-200 ${
                          isSelected 
                            ? 'bg-purple-200 dark:bg-purple-800/50 border-purple-400 dark:border-purple-600 ring-2 ring-purple-400 dark:ring-purple-500' 
                            : 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                        }`}
                      >
                        {/* Selection checkbox */}
                        <div 
                          className="absolute top-2 right-2 w-5 h-5 rounded border-2 border-purple-400 dark:border-purple-500 bg-white dark:bg-gray-800 flex items-center justify-center cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                          onClick={(e) => handleQuantaSelection(quanta.id, e)}
                        >
                          {isSelected && (
                            <svg className="w-3 h-3 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="mb-1 pr-8">
                          <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100 truncate">
                            {quanta.title}
                          </h4>
                        </div>
                        <p className="text-xs text-purple-700 dark:text-purple-300 truncate">
                          {quanta.description || 'No description'}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              quanta.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                              quanta.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {quanta.status.replace('_', ' ')}
                            </span>
                            <div className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${
                                (quanta as any).energy_level === 'high' ? 'bg-green-500' :
                                (quanta as any).energy_level === 'medium' ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}></div>
                              <span className="text-xs text-purple-600 dark:text-purple-400 capitalize">
                                {(quanta as any).energy_level || 'medium'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                            </svg>
                            {Math.round(((quanta as any).estimated_minutes || 60) / 60 * 10) / 10}h
                          </div>
                        </div>
                      </div>
                      );
                    })}
                    {unscheduledQuantas.length > (isChatOpen ? 3 : 6) && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                        +{unscheduledQuantas.length - (isChatOpen ? 3 : 6)} more quantas
                      </div>
                    )}
        </div>
          </div>
        </div>
      </div>

            {/* Chat Section - Collapsible */}
            {isChatOpen && (
              <div className="h-[40%] p-4 flex flex-col animate-in slide-in-from-bottom duration-300">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    AI Assistant
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <button 
                      onClick={() => setIsChatOpen(false)}
                      className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Close AI Chat"
                    >
                      <svg className="w-3 h-3 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-3">
                {chatMessages.map((message) => (
                  <div key={message.id} className={`flex items-start gap-2 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user' 
                        ? 'bg-green-600' 
                        : 'bg-blue-600'
                    }`}>
                      {message.type === 'user' ? (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
                        </svg>
                      )}
                      </div>
                    <div className={`rounded-lg p-2 text-sm max-w-[80%] ${
                      message.type === 'user'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}>
                      {message.content}
                    </div>
                  </div>
                ))}
                
                {selectedEvent && (
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
                      </svg>
                      </div>
                    <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2 text-sm text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                      📅 Selected: "{selectedEvent.title}" - Would you like me to help reschedule it or modify its details?
                    </div>
                  </div>
                )}
                  </div>

              {/* Chat Input */}
              <form onSubmit={handleChatSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask me to schedule tasks, optimize time..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
                      </div>
            )}

            {/* Floating Chat Toggle when closed */}
            {!isChatOpen && (
              <div className="absolute bottom-4 right-4 z-10">
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-105"
                  title="Open AI Chat"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>
                    </div>
                  )}
                </div>

          {/* Main Calendar - 70% width */}
          <div className="w-[70%] flex flex-col relative">
            {/* Optimization Button */}
            <div className="absolute top-4 right-4 z-20">
              <div className="relative optimization-menu-container">
                <button
                  onClick={() => setShowOptimizationMenu(!showOptimizationMenu)}
                  className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-xl hover:scale-105 flex items-center justify-center"
                  title="Optimization Options"
                >
                  <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </button>

                {/* Optimization Dropdown Menu */}
                {showOptimizationMenu && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-30">
                    <div className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                      Optimization Options
                    </div>
                    
                    <button
                      onClick={handleOptimizeAll}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                    >
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7l2 2-2 2m-14 4l2-2-2-2" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Optimize All Quantas</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Optimize all tasks in your list</div>
                      </div>
                    </button>

                    <button
                      onClick={handleOptimizeSelected}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                      disabled={selectedQuantas.size === 0}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        selectedQuantas.size > 0 
                          ? 'bg-purple-100 dark:bg-purple-900/30' 
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        <svg className={`w-4 h-4 ${
                          selectedQuantas.size > 0 
                            ? 'text-purple-600 dark:text-purple-400' 
                            : 'text-gray-400 dark:text-gray-500'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className={`font-medium ${
                          selectedQuantas.size > 0 
                            ? 'text-gray-900 dark:text-white' 
                            : 'text-gray-400 dark:text-gray-500'
                        }`}>
                          Optimize Selected ({selectedQuantas.size})
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedQuantas.size > 0 ? 'Optimize selected quantas only' : 'Select quantas first'}
                        </div>
                      </div>
                    </button>

                    <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 mt-2">
                      By Category
                    </div>

                    {['Work', 'Personal', 'Health', 'Learning'].map((category) => (
                      <button
                        key={category}
                        onClick={() => handleOptimizeByCategory(category)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                      >
                        <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">{category}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Calendar Container - Full Height */}
            <div 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden h-full"
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
              }}
              onDrop={(e) => {
                e.preventDefault();
                try {
                  const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
                  handleTaskDrop(dragData, e);
                } catch (error) {
                  console.error('Error parsing drag data:', error);
                }
              }}
            >
              <CalendarApp
                initialView="daily"
                initialDate={new Date()}
                events={scheduleObjects}
                timeSlotConfig={COMPACT_DAY_CONFIG}
                showToolbar={true}
                showViewSwitcher={true}
                showNavigation={true}
                showQuickActions={false}
                allowViewChange={true}
                onCellClick={handleCellClick}
                onEventClick={handleEventClick}
                onEventCreate={handleEventCreate}
                onEventUpdate={handleEventUpdate}
                onEventDelete={handleEventDelete}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                className="h-full"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
