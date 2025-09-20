'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { useDashboard } from '@/lib/hooks/use-dashboard'
import { Navigation } from '@/components/layout/navigation'
import { getUserSettings, updateUserSettings, UserSettings } from '../../lib/default-settings'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

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
  const { user, isAuthenticated, isLoading: authLoading, updateProfile } = useAuth()
  const { refreshDashboard } = useDashboard()

  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [notifications, setNotifications] = useState<NotificationSetting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: ''
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Update profile form when user data changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || '',
        email: user.email || ''
      })
    }
  }, [user])

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true)
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
      } catch (error) {
        console.error('Error loading settings:', error)
        toast.error('Failed to load settings')
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  // Show loading state while authentication is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900 mx-auto mb-4">
                  <svg className="h-8 w-8 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Authentication Required</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Please sign in to access your settings</p>
                <button onClick={() => window.location.href = '/auth'} className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700">
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading || !settings) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const themes: Theme[] = [
    { id: 'default', name: 'Default', color: 'bg-gray-100' },
    { id: 'dark', name: 'Dark Mode', color: 'bg-gray-800' },
    { id: 'rose', name: 'Rose', color: 'bg-rose-100' },
    { id: 'mint', name: 'Mint', color: 'bg-teal-100' },
    { id: 'metallic', name: 'Metallic', color: 'bg-gray-500', gradient: 'bg-gradient-to-br from-gray-400 to-gray-600' },
    { id: 'bricks', name: 'Bricks', color: 'bg-orange-400', pattern: 'brick-pattern' },
    { id: 'wooden', name: 'Wooden', color: 'bg-amber-600' }
  ]

  const handleThemeSelect = async (themeId: string) => {
    try {
      setIsSaving(true)
      const updated = { ...settings, theme: themeId }
      setSettings(updated)

      // Update localStorage
      updateUserSettings(updated)

      // Update user profile in database if user has preferences
      if (user) {
        const currentPrefs = user.preferences || {}
        const updatedPrefs = {
          ...currentPrefs,
          theme: themeId
        }

        const result = await updateProfile({ preferences: updatedPrefs })
        if (result.error) {
          console.error('Failed to save theme to database:', result.error)
          toast.error('Settings saved locally but failed to sync to cloud')
        } else {
          toast.success('Theme updated successfully')
          // Refresh dashboard to apply theme changes
          await refreshDashboard()
        }
      }
    } catch (error) {
      console.error('Error updating theme:', error)
      toast.error('Failed to update theme')
    } finally {
      setIsSaving(false)
    }
  }

  const handleWorkHoursChange = async (type: 'start' | 'end', value: string) => {
    try {
      setIsSaving(true)
      const updated = {
        ...settings,
        workHours: {
          ...settings.workHours,
          [type]: value
        }
      }
      setSettings(updated)

      // Update localStorage
      updateUserSettings(updated)

      // Update user profile in database
      if (user) {
        const currentPrefs = user.preferences || {}
        const updatedPrefs = {
          ...currentPrefs,
          workHours: updated.workHours
        }

        const result = await updateProfile({ preferences: updatedPrefs })
        if (result.error) {
          console.error('Failed to save work hours to database:', result.error)
          toast.error('Settings saved locally but failed to sync to cloud')
        } else {
          toast.success('Work hours updated successfully')
        }
      }
    } catch (error) {
      console.error('Error updating work hours:', error)
      toast.error('Failed to update work hours')
    } finally {
      setIsSaving(false)
    }
  }

  const handleNotificationToggle = async (notificationId: keyof UserSettings['notifications']) => {
    try {
      setIsSaving(true)
      const updated = {
        ...settings,
        notifications: {
          ...settings.notifications,
          [notificationId]: !settings.notifications[notificationId]
        }
      }
      setSettings(updated)

      // Update localStorage
      updateUserSettings(updated)

      // Update notifications state
      setNotifications(prev => prev.map(notif =>
        notif.id === notificationId
          ? { ...notif, enabled: !notif.enabled }
          : notif
      ))

      // Update user profile in database
      if (user) {
        const currentPrefs = user.preferences || {}
        const updatedPrefs = {
          ...currentPrefs,
          notifications: updated.notifications
        }

        const result = await updateProfile({ preferences: updatedPrefs })
        if (result.error) {
          console.error('Failed to save notifications to database:', result.error)
          toast.error('Settings saved locally but failed to sync to cloud')
        } else {
          toast.success('Notification preferences updated')
        }
      }
    } catch (error) {
      console.error('Error updating notifications:', error)
      toast.error('Failed to update notification preferences')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCalendarConnect = () => {
    console.log('Opening calendar connection dialog')
  }

  const handleProfileUpdate = async () => {
    try {
      setIsSaving(true)
      const result = await updateProfile({
        full_name: profileForm.full_name,
        email: profileForm.email
      })

      if (result.error) {
        toast.error('Failed to update profile')
      } else {
        toast.success('Profile updated successfully')
        setShowProfileEdit(false)
      }
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    try {
      setIsSaving(true)
      // Note: Password change would typically be handled by Supabase auth
      // For now, we'll show a placeholder implementation
      toast.error('Password change not implemented yet')
    } catch (error) {
      toast.error('Failed to change password')
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportData = async () => {
    try {
      setIsSaving(true)
      // This would typically call an API endpoint to export user data
      toast.error('Data export not implemented yet')
    } catch (error) {
      toast.error('Failed to export data')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.'
    )

    if (!confirmed) return

    try {
      setIsSaving(true)
      // This would typically call an API endpoint to delete the account
      toast.error('Account deletion not implemented yet')
    } catch (error) {
      toast.error('Failed to delete account')
    } finally {
      setIsSaving(false)
    }
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
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Loading overlay */}
        {isSaving && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-lg flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              <span className="text-gray-700">Saving settings...</span>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">
              Settings{user?.full_name ? ` - ${user.full_name}` : ''}
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your account preferences and BeQ settings
              {user?.email && (
                <span className="block text-sm text-muted-foreground mt-1">
                  Signed in as {user.email}
                </span>
              )}
            </p>
          </div>

          {/* Theme Selection */}
          <div className="mb-8">
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
                        onChange={async () => {
                          try {
                            setIsSaving(true)
                            const updated = {
                              ...settings,
                              ai: { ...settings.ai, suggestionsEnabled: !settings.ai.suggestionsEnabled }
                            }
                            setSettings(updated)
                            updateUserSettings(updated)

                            if (user) {
                              const currentPrefs = user.preferences || {}
                              const updatedPrefs = {
                                ...currentPrefs,
                                ai: updated.ai
                              }

                              const result = await updateProfile({ preferences: updatedPrefs })
                              if (result.error) {
                                toast.error('Settings saved locally but failed to sync to cloud')
                              } else {
                                toast.success('AI preferences updated')
                              }
                            }
                          } catch (error) {
                            toast.error('Failed to update AI preferences')
                          } finally {
                            setIsSaving(false)
                          }
                        }}
                        className="invisible absolute"
                        disabled={isSaving}
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
                        onChange={async () => {
                          try {
                            setIsSaving(true)
                            const updated = {
                              ...settings,
                              ai: { ...settings.ai, smartPrioritization: !settings.ai.smartPrioritization }
                            }
                            setSettings(updated)
                            updateUserSettings(updated)

                            if (user) {
                              const currentPrefs = user.preferences || {}
                              const updatedPrefs = {
                                ...currentPrefs,
                                ai: updated.ai
                              }

                              const result = await updateProfile({ preferences: updatedPrefs })
                              if (result.error) {
                                toast.error('Settings saved locally but failed to sync to cloud')
                              } else {
                                toast.success('Smart prioritization updated')
                              }
                            }
                          } catch (error) {
                            toast.error('Failed to update smart prioritization')
                          } finally {
                            setIsSaving(false)
                          }
                        }}
                        className="invisible absolute"
                        disabled={isSaving}
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
                        onChange={async () => {
                          try {
                            setIsSaving(true)
                            const updated = {
                              ...settings,
                              privacy: { ...settings.privacy, analyticsEnabled: !settings.privacy.analyticsEnabled }
                            }
                            setSettings(updated)
                            updateUserSettings(updated)

                            if (user) {
                              const currentPrefs = user.preferences || {}
                              const updatedPrefs = {
                                ...currentPrefs,
                                privacy: updated.privacy
                              }

                              const result = await updateProfile({ preferences: updatedPrefs })
                              if (result.error) {
                                toast.error('Settings saved locally but failed to sync to cloud')
                              } else {
                                toast.success('Analytics preferences updated')
                              }
                            }
                          } catch (error) {
                            toast.error('Failed to update analytics preferences')
                          } finally {
                            setIsSaving(false)
                          }
                        }}
                        className="invisible absolute"
                        disabled={isSaving}
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
                        onChange={async () => {
                          try {
                            setIsSaving(true)
                            const updated = {
                              ...settings,
                              privacy: { ...settings.privacy, dataCollection: !settings.privacy.dataCollection }
                            }
                            setSettings(updated)
                            updateUserSettings(updated)

                            if (user) {
                              const currentPrefs = user.preferences || {}
                              const updatedPrefs = {
                                ...currentPrefs,
                                privacy: updated.privacy
                              }

                              const result = await updateProfile({ preferences: updatedPrefs })
                              if (result.error) {
                                toast.error('Settings saved locally but failed to sync to cloud')
                              } else {
                                toast.success('Data collection preferences updated')
                              }
                            }
                          } catch (error) {
                            toast.error('Failed to update data collection preferences')
                          } finally {
                            setIsSaving(false)
                          }
                        }}
                        className="invisible absolute"
                        disabled={isSaving}
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
                    <button
                      onClick={() => setShowProfileEdit(!showProfileEdit)}
                      className="h-10 rounded-md bg-gray-100 px-4 text-sm font-medium text-gray-800 hover:bg-gray-200 transition-colors"
                    >
                      {showProfileEdit ? 'Cancel' : 'Edit Profile'}
                    </button>
                  </div>

                  {/* Profile Edit Form */}
                  {showProfileEdit && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                          <input
                            type="text"
                            value={profileForm.full_name}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Enter your full name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            value={profileForm.email}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Enter your email"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={handleProfileUpdate}
                          disabled={isSaving}
                          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                        >
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={() => setShowProfileEdit(false)}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

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
                    <button
                      onClick={() => setShowPasswordChange(!showPasswordChange)}
                      className="h-10 rounded-md bg-gray-100 px-4 text-sm font-medium text-gray-800 hover:bg-gray-200 transition-colors"
                    >
                      {showPasswordChange ? 'Cancel' : 'Change'}
                    </button>
                  </div>

                  {/* Password Change Form */}
                  {showPasswordChange && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                          <input
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Enter current password"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                          <input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Enter new password"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                          <input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Confirm new password"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={handlePasswordChange}
                          disabled={isSaving}
                          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                        >
                          {isSaving ? 'Changing...' : 'Change Password'}
                        </button>
                        <button
                          onClick={() => setShowPasswordChange(false)}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

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
                    <button
                      onClick={handleExportData}
                      disabled={isSaving}
                      className="h-10 rounded-md bg-gray-100 px-4 text-sm font-medium text-gray-800 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      {isSaving ? 'Exporting...' : 'Export'}
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
                    <button
                      onClick={handleDeleteAccount}
                      disabled={isSaving}
                      className="h-10 rounded-md bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {isSaving ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>

          {/* Auto-Save Notice */}
          <div className="mt-8 rounded-lg bg-green-50 border border-green-200 p-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-green-600">check_circle</span>
              <p className="text-sm text-green-700">Settings are automatically saved and synced to your account.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}