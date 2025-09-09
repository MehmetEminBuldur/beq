'use client'

import { useState } from 'react'

interface CalendarEvent {
  id: string
  title: string
  time: string
  icon: string
  color: string
  source?: string
}

interface DateEvents {
  [key: number]: CalendarEvent[]
}

export default function SmartCalendar() {
  const [currentMonth, setCurrentMonth] = useState(9) // October (0-indexed)
  const [currentYear, setCurrentYear] = useState(2024)
  const [selectedDate, setSelectedDate] = useState(24)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeView, setActiveView] = useState('Month')

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  // Sample events data
  const events: DateEvents = {
    4: [{ id: '1', title: 'Morning Workout', time: '7:00 AM', icon: 'fitness_center', color: 'green' }],
    5: [{ id: '2', title: 'Doctor Appointment', time: '2:00 PM', icon: 'local_hospital', color: 'blue' }],
    7: [{ id: '3', title: 'Team Retreat', time: 'All Day', icon: 'groups', color: 'red' }],
    17: [
      { id: '4', title: 'Presentation', time: '9:00 AM', icon: 'presentation', color: 'yellow' },
      { id: '5', title: 'Client Meeting', time: '3:00 PM', icon: 'business', color: 'purple' }
    ],
    24: [
      { id: '6', title: 'Team Meeting', time: '10:00 AM - 11:00 AM', icon: 'groups', color: 'blue', source: 'GCal' },
      { id: '7', title: 'Project Review', time: '11:30 AM - 12:30 PM', icon: 'work', color: 'green' },
      { id: '8', title: 'Client Call', time: '2:00 PM - 3:00 PM', icon: 'call', color: 'purple', source: 'Outlook' },
      { id: '9', title: 'Workout', time: '4:00 PM - 5:00 PM', icon: 'fitness_center', color: 'yellow' }
    ]
  }

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
      const hasEvents = events[day]
      const isSelected = day === selectedDate
      const isToday = day === 24 // Simulated current day
      
      let dayClass = "relative bg-white p-2 text-right cursor-pointer hover:bg-gray-50"
      
      if (day >= 8 && day <= 11) {
        dayClass = "relative bg-primary-50 p-2 text-right cursor-pointer hover:bg-primary-100"
      }

      calendarDays.push(
        <div 
          key={day} 
          className={dayClass}
          onClick={() => setSelectedDate(day)}
        >
          {isToday ? (
            <span className="font-semibold text-white flex items-center justify-center size-6 rounded-full bg-primary-600">
              {day}
            </span>
          ) : (
            <span className={`text-sm font-medium ${day >= 8 && day <= 11 ? 'text-primary-800' : 'text-gray-900'}`}>
              {day}
            </span>
          )}
          
          {hasEvents && (
            <div className="mt-1 flex flex-col gap-1">
              {hasEvents.length === 1 && day === 7 ? (
                <div className="h-8 rounded-md bg-primary-200 p-1 text-left text-xs text-primary-900">
                  {hasEvents[0].title}
                </div>
              ) : (
                hasEvents.slice(0, 2).map((event, idx) => (
                  <div 
                    key={event.id} 
                    className={`h-2 rounded-md bg-${event.color}-200`}
                  />
                ))
              )}
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

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root">
      <div className="layout-container flex h-full grow flex-col">
        <header className="flex items-center justify-between whitespace-nowrap border-b border-gray-200 px-10 py-3">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 text-gray-900">
              <div className="size-8 text-primary-600">
                <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z" fill="currentColor"></path>
                </svg>
              </div>
              <h2 className="text-gray-900 text-xl font-bold leading-tight tracking-[-0.015em]">BeQ</h2>
            </div>
            <nav className="flex items-center gap-6">
              <a className="text-gray-600 hover:text-gray-900 text-sm font-medium leading-normal" href="/">Dashboard</a>
              <a className="text-primary-600 text-sm font-semibold leading-normal" href="/calendar">Calendar</a>
              <a className="text-gray-600 hover:text-gray-900 text-sm font-medium leading-normal" href="#">Tasks</a>
              <a className="text-gray-600 hover:text-gray-900 text-sm font-medium leading-normal" href="/chat">Chat</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <label className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">search</span>
              <input 
                className="form-input w-full rounded-lg border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-500 focus:border-primary-500 focus:ring-primary-500" 
                placeholder="Search" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </label>
            <button className="relative flex size-10 cursor-pointer items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900">
              <span className="material-symbols-outlined">notifications</span>
              <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary-600"></div>
            </button>
            <button>
              <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-white shadow-sm" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuARdVFdzXdRjZUm59BdigcO3szpYWuGDMFsaVP11v0Jk6Uim_OW5_pZwiYGBp15DUK8v1-9hbbK9WfyRraSq6OPS2f5yik0ZPGPFWZSXnzLNYMOnkCFwxzoj7X1ika74GFbUu96ih9VvsSWMFtVqpLBAJzjx5TQ6UTfh0L6LdVYdpOEQGusD3hIJ_ibUdt2cKZjiiKwYn-0DFXllFCW5Cvn96Qq8TOTnbS7WA-e29UiYhFwV_mSHG3D5UiufwhHKHmRACYdms1b4RuP")'}}></div>
            </button>
          </div>
        </header>
        
        <main className="flex-1 bg-gray-50 p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <h1 className="text-gray-900 text-3xl font-bold leading-tight">Smart Calendar</h1>
              <button className="flex cursor-pointer items-center justify-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700">
                <span className="material-symbols-outlined">add</span>
                <span className="truncate">New Event</span>
              </button>
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
                  Upcoming on {monthNames[currentMonth]} {selectedDate}
                </h2>
                <div className="space-y-4">
                  {events[selectedDate]?.map((event) => (
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
                  )) || (
                    <div className="text-center text-gray-500 py-8">
                      <span className="material-symbols-outlined text-4xl mb-2 block">event</span>
                      <p>No events scheduled for this date</p>
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