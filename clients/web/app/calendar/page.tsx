'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { useDashboard } from '@/lib/hooks/use-dashboard'
import { format, startOfDay, endOfDay, isSameDay, isToday } from 'date-fns'
import Link from 'next/link'
import { Navigation } from '@/components/layout/navigation'

interface CalendarEvent {
  id: string
  title: string
  time: string
  duration?: string
  icon: string
  color: string
  source?: string
  type: 'brick' | 'quanta' | 'event' | 'meeting'
  status: 'pending' | 'in_progress' | 'completed' | 'upcoming'
}

interface DateEvents {
  [key: string]: CalendarEvent[]
}

export default function SmartCalendar() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext()
  const { stats, todaySchedule, aiInsights, isLoading: dashboardLoading, refreshDashboard } = useDashboard()

  const [isClient, setIsClient] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeView, setActiveView] = useState('Month')

  // Redirect to homepage if not authenticated
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user)) {
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  }, [isAuthenticated, user, authLoading]);

  // Prevent hydration mismatch by ensuring we only render dynamic content on client
  useEffect(() => {
    setIsClient(true)
  }, [])

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  // Show loading state while authentication is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your calendar...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, show loading while redirecting
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting to homepage...</p>
        </div>
      </div>
    );
  }

  // Transform dashboard data into calendar events
  const getCalendarEvents = (): DateEvents => {
    const events: DateEvents = {}

    // Add today's schedule events
    if (todaySchedule && todaySchedule.length > 0) {
      const today = new Date()
      const dateKey = format(today, 'yyyy-MM-dd')

      events[dateKey] = todaySchedule.map((item): CalendarEvent => {
        const start = new Date(item.start_time)
        const end = new Date(item.end_time)

        return {
          id: item.id,
          title: item.title,
          time: format(start, 'HH:mm'),
          duration: `${Math.floor((end.getTime() - start.getTime()) / (1000 * 60))}m`,
          icon: item.type === 'brick' ? 'work' :
                item.type === 'quanta' ? 'task' :
                item.type === 'event' ? 'event' : 'schedule',
          color: item.status === 'completed' ? 'green' :
                 item.status === 'in_progress' ? 'blue' : 'gray',
          type: item.type,
          status: item.status
        }
      })
    }

    // Add sample future events based on user's activity patterns
    if (stats.activeBricks > 0) {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 2)
      const futureKey = format(futureDate, 'yyyy-MM-dd')

      events[futureKey] = [
        {
          id: 'future-1',
          title: 'Continue Active Projects',
          time: '09:00',
          duration: '120m',
          icon: 'work',
          color: 'blue',
          type: 'brick',
          status: 'pending'
        }
      ]
    }

    return events
  }

  const events = getCalendarEvents()

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay()
  }

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear)
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
    const daysInPrevMonth = getDaysInMonth(currentMonth - 1, currentYear)

    const calendarDays = []

    // Previous month's trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i
      calendarDays.push(
        <div key={`prev-${day}`} className="relative bg-gray-50 p-2 text-right">
          <span className="text-sm text-gray-400">{day}</span>
        </div>
      )
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(currentYear, currentMonth, day)
      const dateKey = format(currentDate, 'yyyy-MM-dd')
      const hasEvents = events[dateKey]
      const isSelected = isSameDay(currentDate, selectedDate)
      const isTodayDate = isToday(currentDate)

      let dayClass = "relative bg-white p-2 text-right cursor-pointer hover:bg-gray-50"

      // Highlight days with events
      if (hasEvents && hasEvents.length > 0) {
        dayClass = "relative bg-primary-50 p-2 text-right cursor-pointer hover:bg-primary-100"
      }

      calendarDays.push(
        <div
          key={day}
          className={dayClass}
          onClick={() => setSelectedDate(currentDate)}
        >
          {isTodayDate ? (
            <span className="font-semibold text-white flex items-center justify-center size-6 rounded-full bg-primary-600">
              {day}
            </span>
          ) : (
            <span className={`text-sm font-medium ${hasEvents ? 'text-primary-800' : 'text-gray-900'}`}>
              {day}
            </span>
          )}

          {hasEvents && (
            <div className="mt-1 flex flex-col gap-1">
              {hasEvents.slice(0, 2).map((event, idx) => (
                <div
                  key={event.id}
                  className={`h-2 rounded-md ${
                    event.color === 'blue' ? 'bg-blue-200' :
                    event.color === 'green' ? 'bg-green-200' :
                    event.color === 'purple' ? 'bg-purple-200' :
                    event.color === 'yellow' ? 'bg-yellow-200' :
                    event.color === 'red' ? 'bg-red-200' :
                    'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )
    }

    // Next month's leading days
    const totalCells = 42 // 6 rows × 7 days
    const remainingCells = totalCells - calendarDays.length
    for (let day = 1; day <= remainingCells; day++) {
      calendarDays.push(
        <div key={`next-${day}`} className="relative bg-gray-50 p-2 text-right">
          <span className="text-sm text-gray-400">{day}</span>
        </div>
      )
    }

    return calendarDays
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear(currentYear - 1)
      } else {
        setCurrentMonth(currentMonth - 1)
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear(currentYear + 1)
      } else {
        setCurrentMonth(currentMonth + 1)
      }
    }
  }

  const getEventColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      red: 'bg-red-100 text-red-600'
    }
    return colors[color as keyof typeof colors] || 'bg-gray-100 text-gray-600'
  }

  // Show loading state during SSR and initial hydration
  if (!isClient) {
    return (
      <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse text-center">
            <div className="w-8 h-8 bg-primary-600 rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading Calendar...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">

        {/* Loading overlay */}
        {dashboardLoading && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-lg flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              <span className="text-gray-700">Refreshing calendar data...</span>
            </div>
          </div>
        )}

        <main className="flex-1 bg-gray-50 p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-gray-900 text-3xl font-bold leading-tight">Smart Calendar</h1>
                <p className="text-muted-foreground mt-2">
                  Welcome back, {user?.full_name || user?.email?.split('@')[0] || 'User'}! Here's your schedule overview.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={refreshDashboard}
                  disabled={dashboardLoading}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined">refresh</span>
                  <span className="truncate">{dashboardLoading ? 'Refreshing...' : 'Refresh'}</span>
                </button>
                <Link href="/bricks" className="flex cursor-pointer items-center justify-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700">
                  <span className="material-symbols-outlined">add</span>
                  <span className="truncate">Add Task</span>
                </Link>
              </div>
            </div>
            
            <div className="mb-4 border-b border-gray-200">
              <div className="flex gap-8 px-4">
                {['Day', 'Week', 'Month'].map((view) => (
                  <button
                    key={view}
                    onClick={() => setActiveView(view)}
                    className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                      activeView === view
                        ? 'border-primary-600 font-semibold text-primary-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {view}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between pb-4">
                  <button 
                    className="rounded-full p-2 hover:bg-gray-100"
                    onClick={() => navigateMonth('prev')}
                  >
                    <span className="material-symbols-outlined text-gray-600">chevron_left</span>
                  </button>
                  <h3 className="text-gray-900 text-lg font-semibold">
                    {monthNames[currentMonth]} {currentYear}
                  </h3>
                  <button 
                    className="rounded-full p-2 hover:bg-gray-100"
                    onClick={() => navigateMonth('next')}
                  >
                    <span className="material-symbols-outlined text-gray-600">chevron_right</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-7 gap-px border-l border-t border-gray-200 bg-gray-200">
                  {dayNames.map((day) => (
                    <div key={day} className="bg-white py-2 text-center text-xs font-semibold text-gray-500">
                      {day}
                    </div>
                  ))}
                  {renderCalendarGrid()}
                </div>
              </div>
              
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Events on {format(selectedDate, 'EEEE, MMMM d')}
                </h2>
                <div className="space-y-4">
                  {(() => {
                    const dateKey = format(selectedDate, 'yyyy-MM-dd')
                    const dayEvents = events[dateKey] || []
                    return dayEvents.map((event) => (
                    <div key={event.id} className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                      <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${getEventColor(event.color)}`}>
                        <span className="material-symbols-outlined">{event.icon}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-gray-900 text-sm font-semibold leading-normal">{event.title}</p>
                          {event.source && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <span className="material-symbols-outlined text-base">link</span>
                              <span>{event.source}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-gray-500 text-sm leading-normal">{event.time}</p>
                      </div>
                    </div>
                  ))
                  })()}

                  {(() => {
                    const dateKey = format(selectedDate, 'yyyy-MM-dd')
                    const dayEvents = events[dateKey] || []
                    return dayEvents.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <span className="material-symbols-outlined text-4xl mb-2 block">event</span>
                        <p>No events scheduled for this date</p>
                        {isSameDay(selectedDate, new Date()) && todaySchedule.length === 0 && (
                          <p className="text-sm mt-2">Add some bricks or tasks to see them here!</p>
                        )}
                      </div>
                    ) : null
                  })()}
                </div>

                {/* Calendar Stats */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Calendar Overview</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-2xl font-bold text-primary-600">
                        {stats.activeBricks}
                      </div>
                      <div className="text-gray-500">Active Projects</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {stats.completedToday}
                      </div>
                      <div className="text-gray-500">Completed Today</div>
                    </div>
                  </div>

                  {aiInsights.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-primary-600">lightbulb</span>
                        <span className="text-sm font-medium text-gray-900">AI Insight</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {aiInsights[0]?.title}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}