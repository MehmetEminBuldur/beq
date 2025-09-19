'use client'

import { useState } from 'react'

interface Theme {
  id: string
  name: string
  color?: string
  gradient?: string
  pattern?: string
}

interface NotificationSetting {
  id: string
  title: string
  description: string
  icon: string
  enabled: boolean
}

export default function SettingsPage() {
  const [selectedTheme, setSelectedTheme] = useState('default')
  const [workStart, setWorkStart] = useState('09:00')
  const [workEnd, setWorkEnd] = useState('17:00')
  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    {
      id: 'events',
      title: 'Event Reminders',
      description: 'Receive reminders for upcoming events and tasks.',
      icon: 'notifications',
      enabled: true
    },
    {
      id: 'tasks',
      title: 'Task Reminders',
      description: 'Get notified when tasks are due or overdue.',
      icon: 'task_alt',
      enabled: false
    }
  ])

  const themes: Theme[] = [
    { id: 'default', name: 'Default', color: 'bg-gray-100' },
    { id: 'dark', name: 'Dark Mode', color: 'bg-gray-800' },
    { id: 'rose', name: 'Rose', color: 'bg-rose-100' },
    { id: 'mint', name: 'Mint', color: 'bg-teal-100' },
    { id: 'metallic', name: 'Metallic', color: 'bg-gray-500', gradient: 'bg-gradient-to-br from-gray-400 to-gray-600' },
    { id: 'bricks', name: 'Bricks', color: 'bg-orange-400', pattern: 'brick-pattern' },
    { id: 'wooden', name: 'Wooden', color: 'bg-amber-600' }
  ]

  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId)
    localStorage.setItem('beq-theme', themeId)
  }

  const handleNotificationToggle = (notificationId: string) => {
    setNotifications(prev => prev.map(notif =>
      notif.id === notificationId
        ? { ...notif, enabled: !notif.enabled }
        : notif
    ))
  }

  const handleCalendarConnect = () => {
    console.log('Opening calendar connection dialog')
    // This would typically open a calendar integration modal
  }

  const handleSaveChanges = () => {
    const settings = {
      theme: selectedTheme,
      workHours: { start: workStart, end: workEnd },
      notifications: notifications.reduce((acc, notif) => ({
        ...acc,
        [notif.id]: notif.enabled
      }), {})
    }
    localStorage.setItem('beq-settings', JSON.stringify(settings))
    console.log('Settings saved:', settings)
  }

  const renderThemePreview = (theme: Theme) => {
    if (theme.gradient) {
      return <div className={`mx-auto h-16 w-full rounded-md shadow-inner ${theme.gradient}`}></div>
    }
    if (theme.pattern === 'brick-pattern') {
      return (
        <div 
          className="mx-auto h-16 w-full rounded-md"
          style={{
            backgroundImage: `linear-gradient(45deg, #b04332 25%, transparent 25%), 
                             linear-gradient(-45deg, #b04332 25%, transparent 25%), 
                             linear-gradient(45deg, transparent 75%, #b04332 75%), 
                             linear-gradient(-45deg, transparent 75%, #b04332 75%)`,
            backgroundColor: '#c45747',
            backgroundSize: '20px 20px'
          }}
        ></div>
      )
    }
    return <div className={`mx-auto h-16 w-full rounded-md ${theme.color}`}></div>
  }

  return (
    <div className="relative flex size-full min-h-screen flex-col group/design-root overflow-x-hidden">
      <div className="flex h-full grow flex-col">
        <div className="flex flex-1">
          {/* Sidebar */}
          <div className="w-80 border-r border-gray-200 bg-white">
            <div className="flex h-full flex-col p-4">
              <div className="flex items-center gap-3 p-2">
                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDQwLNLcdwl1Lji2jXFmdBL6N8GV0GYYvp8nPWTW0jtQSP_x9NmtjbMCzJ86lecJlbuRsiOjpu2q7NOX8ti87Se1pBqO1W67y0r3axjDopzp6KJBpnQmcCUSsjnSX6cSyXyu4LWv0m0EbxFH0ZFZrWaBO0b-_5OzpQlurgSyPx9NJw8buv5MAxwkpm6FtfMoJeu9YHoBYekULJXG_-RBuBM30rEFS8WVgY2dpcnGFoRyjYlcXwvWtXkcP0w62tQImiVznHfemayP55R")'}}></div>
                <h1 className="text-[#111418] text-base font-medium leading-normal">Sophia Carter</h1>
              </div>
              <div className="flex flex-col gap-1 mt-4">
                <a className="flex items-center gap-3 rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100" href="/dashboard">
                  <span className="material-symbols-outlined text-gray-600">home</span>
                  <p className="text-sm font-medium">Dashboard</p>
                </a>
                <a className="flex items-center gap-3 rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100" href="/calendar">
                  <span className="material-symbols-outlined text-gray-600">calendar_today</span>
                  <p className="text-sm font-medium">Calendar</p>
                </a>
                <a className="flex items-center gap-3 rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100" href="/dashboard">
                  <span className="material-symbols-outlined text-gray-600">check_box</span>
                  <p className="text-sm font-medium">Tasks</p>
                </a>
                <a className="flex items-center gap-3 rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100" href="/chat">
                  <span className="material-symbols-outlined text-gray-600">chat</span>
                  <p className="text-sm font-medium">Chat</p>
                </a>
                <a className="flex items-center gap-3 rounded-md px-3 py-2 bg-gray-100 text-blue-600" href="/settings">
                  <span className="material-symbols-outlined">settings</span>
                  <p className="text-sm font-medium">Settings</p>
                </a>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="p-8">
              <h1 className="text-4xl font-bold text-gray-800">Settings</h1>
              
              {/* Theme Selection */}
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-800">Choose Theme</h2>
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-4">
                  {themes.map((theme) => (
                    <div
                      key={theme.id}
                      onClick={() => handleThemeSelect(theme.id)}
                      className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all hover:border-blue-500 ${
                        selectedTheme === theme.id
                          ? 'border-blue-500'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      {renderThemePreview(theme)}
                      <p className="mt-2 text-sm font-medium text-gray-800">{theme.name}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calendar Integrations */}
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-800">Calendar Integrations</h2>
                <div className="mt-4 rounded-lg border border-gray-200 bg-white">
                  <div className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex size-12 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                        <span className="material-symbols-outlined">calendar_month</span>
                      </div>
                      <div>
                        <p className="text-base font-medium text-gray-800">Connect Calendars</p>
                        <p className="text-sm text-gray-600">Connect your external calendars to sync events and avoid scheduling conflicts.</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleCalendarConnect}
                      className="h-10 rounded-md bg-gray-100 px-4 text-sm font-medium text-gray-800 hover:bg-gray-200 transition-colors"
                    >
                      Connect
                    </button>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
                <div className="mt-4 space-y-4 rounded-lg border border-gray-200 bg-white">
                  {notifications.map((notification, index) => (
                    <div key={notification.id}>
                      <div className="flex items-center justify-between p-6">
                        <div className="flex items-center gap-4">
                          <div className="flex size-12 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                            <span className="material-symbols-outlined">{notification.icon}</span>
                          </div>
                          <div>
                            <p className="text-base font-medium text-gray-800">{notification.title}</p>
                            <p className="text-sm text-gray-600">{notification.description}</p>
                          </div>
                        </div>
                        <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full bg-gray-200 p-0.5 has-[:checked]:bg-blue-600 has-[:checked]:justify-end">
                          <div className="h-full w-[27px] rounded-full bg-white shadow-md transition-transform"></div>
                          <input
                            checked={notification.enabled}
                            onChange={() => handleNotificationToggle(notification.id)}
                            className="invisible absolute"
                            type="checkbox"
                          />
                        </label>
                      </div>
                      {index < notifications.length - 1 && <hr className="border-gray-200"/>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Personal Information */}
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-800">Personal Information</h2>
                <div className="mt-4 rounded-lg border border-gray-200 bg-white p-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="text-base font-medium text-gray-800" htmlFor="work-start">
                        Work Hours Start
                      </label>
                      <input
                        className="form-input mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        id="work-start"
                        type="time"
                        value={workStart}
                        onChange={(e) => setWorkStart(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-base font-medium text-gray-800" htmlFor="work-end">
                        Work Hours End
                      </label>
                      <input
                        className="form-input mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        id="work-end"
                        type="time"
                        value={workEnd}
                        onChange={(e) => setWorkEnd(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-8 flex justify-end">
                <button 
                  onClick={handleSaveChanges}
                  className="h-10 rounded-md bg-blue-600 px-6 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}