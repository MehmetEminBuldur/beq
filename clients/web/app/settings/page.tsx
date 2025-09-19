'use client'

import { useState, useEffect } from 'react'
import { getUserSettings, updateUserSettings, UserSettings } from '../../lib/default-settings'

interface Theme {
  id: string
  name: string
  color?: string
  gradient?: string
  pattern?: string
}

interface NotificationSetting {
  id: keyof UserSettings['notifications']
  title: string
  description: string
  icon: string
  enabled: boolean
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [notifications, setNotifications] = useState<NotificationSetting[]>([])

  useEffect(() => {
    const userSettings = getUserSettings()
    setSettings(userSettings)
    setNotifications([
      {
        id: 'events',
        title: 'Event Reminders',
        description: 'Receive reminders for upcoming events and tasks.',
        icon: 'notifications',
        enabled: userSettings.notifications.events
      },
      {
        id: 'tasks',
        title: 'Task Reminders',
        description: 'Get notified when tasks are due or overdue.',
        icon: 'task_alt',
        enabled: userSettings.notifications.tasks
      },
      {
        id: 'breaks',
        title: 'Break Reminders',
        description: 'Get reminders to take breaks during work hours.',
        icon: 'coffee',
        enabled: userSettings.notifications.breaks
      },
      {
        id: 'weeklyReview',
        title: 'Weekly Review',
        description: 'Weekly summary of your productivity and goals.',
        icon: 'analytics',
        enabled: userSettings.notifications.weeklyReview
      }
    ])
  }, [])

  if (!settings) return null

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
    const updated = { ...settings, theme: themeId }
    setSettings(updated)
    updateUserSettings(updated)
  }

  const handleWorkHoursChange = (type: 'start' | 'end', value: string) => {
    const updated = {
      ...settings,
      workHours: {
        ...settings.workHours,
        [type]: value
      }
    }
    setSettings(updated)
    updateUserSettings(updated)
  }

  const handleNotificationToggle = (notificationId: keyof UserSettings['notifications']) => {
    const updated = {
      ...settings,
      notifications: {
        ...settings.notifications,
        [notificationId]: !settings.notifications[notificationId]
      }
    }
    setSettings(updated)
    updateUserSettings(updated)

    setNotifications(prev => prev.map(notif =>
      notif.id === notificationId
        ? { ...notif, enabled: !notif.enabled }
        : notif
    ))
  }

  const handleCalendarConnect = () => {
    console.log('Opening calendar connection dialog')
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
                        settings.theme === theme.id
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
                        value={settings.workHours.start}
                        onChange={(e) => handleWorkHoursChange('start', e.target.value)}
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
                        value={settings.workHours.end}
                        onChange={(e) => handleWorkHoursChange('end', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Preferences */}
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-800">AI Assistance</h2>
                <div className="mt-4 space-y-4 rounded-lg border border-gray-200 bg-white">
                  <div className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex size-12 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                        <span className="material-symbols-outlined">psychology</span>
                      </div>
                      <div>
                        <p className="text-base font-medium text-gray-800">Smart Suggestions</p>
                        <p className="text-sm text-gray-600">Let BeQ provide intelligent task and scheduling suggestions.</p>
                      </div>
                    </div>
                    <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full bg-gray-200 p-0.5 has-[:checked]:bg-blue-600 has-[:checked]:justify-end">
                      <div className="h-full w-[27px] rounded-full bg-white shadow-md transition-transform"></div>
                      <input
                        checked={settings.ai.suggestionsEnabled}
                        onChange={() => {
                          const updated = {
                            ...settings,
                            ai: { ...settings.ai, suggestionsEnabled: !settings.ai.suggestionsEnabled }
                          }
                          setSettings(updated)
                          updateUserSettings(updated)
                        }}
                        className="invisible absolute"
                        type="checkbox"
                      />
                    </label>
                  </div>
                  <hr className="border-gray-200"/>
                  <div className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex size-12 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                        <span className="material-symbols-outlined">smart_toy</span>
                      </div>
                      <div>
                        <p className="text-base font-medium text-gray-800">Smart Prioritization</p>
                        <p className="text-sm text-gray-600">Automatically prioritize tasks based on deadlines and importance.</p>
                      </div>
                    </div>
                    <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full bg-gray-200 p-0.5 has-[:checked]:bg-blue-600 has-[:checked]:justify-end">
                      <div className="h-full w-[27px] rounded-full bg-white shadow-md transition-transform"></div>
                      <input
                        checked={settings.ai.smartPrioritization}
                        onChange={() => {
                          const updated = {
                            ...settings,
                            ai: { ...settings.ai, smartPrioritization: !settings.ai.smartPrioritization }
                          }
                          setSettings(updated)
                          updateUserSettings(updated)
                        }}
                        className="invisible absolute"
                        type="checkbox"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-800">Privacy & Data</h2>
                <div className="mt-4 space-y-4 rounded-lg border border-gray-200 bg-white">
                  <div className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex size-12 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                        <span className="material-symbols-outlined">analytics</span>
                      </div>
                      <div>
                        <p className="text-base font-medium text-gray-800">Analytics</p>
                        <p className="text-sm text-gray-600">Help improve BeQ by sharing anonymous usage data.</p>
                      </div>
                    </div>
                    <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full bg-gray-200 p-0.5 has-[:checked]:bg-blue-600 has-[:checked]:justify-end">
                      <div className="h-full w-[27px] rounded-full bg-white shadow-md transition-transform"></div>
                      <input
                        checked={settings.privacy.analyticsEnabled}
                        onChange={() => {
                          const updated = {
                            ...settings,
                            privacy: { ...settings.privacy, analyticsEnabled: !settings.privacy.analyticsEnabled }
                          }
                          setSettings(updated)
                          updateUserSettings(updated)
                        }}
                        className="invisible absolute"
                        type="checkbox"
                      />
                    </label>
                  </div>
                  <hr className="border-gray-200"/>
                  <div className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex size-12 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                        <span className="material-symbols-outlined">database</span>
                      </div>
                      <div>
                        <p className="text-base font-medium text-gray-800">Data Collection</p>
                        <p className="text-sm text-gray-600">Allow BeQ to collect data to personalize your experience.</p>
                      </div>
                    </div>
                    <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full bg-gray-200 p-0.5 has-[:checked]:bg-blue-600 has-[:checked]:justify-end">
                      <div className="h-full w-[27px] rounded-full bg-white shadow-md transition-transform"></div>
                      <input
                        checked={settings.privacy.dataCollection}
                        onChange={() => {
                          const updated = {
                            ...settings,
                            privacy: { ...settings.privacy, dataCollection: !settings.privacy.dataCollection }
                          }
                          setSettings(updated)
                          updateUserSettings(updated)
                        }}
                        className="invisible absolute"
                        type="checkbox"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Account Management */}
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-800">Account Management</h2>
                <div className="mt-4 space-y-4 rounded-lg border border-gray-200 bg-white">
                  <div className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex size-12 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                        <span className="material-symbols-outlined">person</span>
                      </div>
                      <div>
                        <p className="text-base font-medium text-gray-800">Profile Settings</p>
                        <p className="text-sm text-gray-600">Update your name, email, and profile picture.</p>
                      </div>
                    </div>
                    <button className="h-10 rounded-md bg-gray-100 px-4 text-sm font-medium text-gray-800 hover:bg-gray-200 transition-colors">
                      Edit Profile
                    </button>
                  </div>
                  <hr className="border-gray-200"/>
                  <div className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex size-12 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                        <span className="material-symbols-outlined">key</span>
                      </div>
                      <div>
                        <p className="text-base font-medium text-gray-800">Change Password</p>
                        <p className="text-sm text-gray-600">Update your account password for security.</p>
                      </div>
                    </div>
                    <button className="h-10 rounded-md bg-gray-100 px-4 text-sm font-medium text-gray-800 hover:bg-gray-200 transition-colors">
                      Change
                    </button>
                  </div>
                  <hr className="border-gray-200"/>
                  <div className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex size-12 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                        <span className="material-symbols-outlined">download</span>
                      </div>
                      <div>
                        <p className="text-base font-medium text-gray-800">Export Data</p>
                        <p className="text-sm text-gray-600">Download a copy of all your BeQ data.</p>
                      </div>
                    </div>
                    <button className="h-10 rounded-md bg-gray-100 px-4 text-sm font-medium text-gray-800 hover:bg-gray-200 transition-colors">
                      Export
                    </button>
                  </div>
                  <hr className="border-gray-200"/>
                  <div className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex size-12 items-center justify-center rounded-lg bg-red-100 text-red-600">
                        <span className="material-symbols-outlined">delete_forever</span>
                      </div>
                      <div>
                        <p className="text-base font-medium text-gray-800">Delete Account</p>
                        <p className="text-sm text-gray-600">Permanently delete your BeQ account and all data.</p>
                      </div>
                    </div>
                    <button className="h-10 rounded-md bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* Auto-Save Notice */}
              <div className="mt-8 rounded-lg bg-green-50 border border-green-200 p-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-600">check_circle</span>
                  <p className="text-sm text-green-700">Settings are automatically saved as you make changes.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}