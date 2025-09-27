'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { useDashboard } from '@/lib/hooks/use-dashboard'
import { useDatabase } from '@/lib/hooks/use-database'
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
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext()
  const { refreshDashboard } = useDashboard()
  const { updateProfile } = useDatabase()

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 dark:from-slate-900 dark:via-gray-900 dark:to-stone-900 relative overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-slate-300 to-gray-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-stone-300 to-slate-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-gradient-to-br from-gray-300 to-zinc-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
        </div>

        <Navigation />
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show message for unauthenticated users
  if (!authLoading && (!isAuthenticated || !user)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 dark:from-slate-900 dark:via-gray-900 dark:to-stone-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-slate-300 to-gray-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-stone-300 to-slate-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-gradient-to-br from-gray-300 to-zinc-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
        </div>

        <Navigation />
        <div className="text-center relative z-10">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Please sign in to access your settings.</p>
          <button
            onClick={() => router.push('/auth')}
            className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 dark:from-slate-900 dark:via-gray-900 dark:to-stone-900 relative overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-slate-300 to-gray-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-stone-300 to-slate-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-gradient-to-br from-gray-300 to-zinc-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
        </div>

        <Navigation />
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto mb-4"></div>
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

        try {
          await updateProfile({ preferences: updatedPrefs })
          toast.success('Theme updated successfully')
          // Refresh dashboard to apply theme changes
          await refreshDashboard()
        } catch (profileError) {
          console.error('Failed to save theme to database:', profileError)
          toast.error('Settings saved locally but failed to sync to cloud')
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

        try {
          await updateProfile({ preferences: updatedPrefs })
          toast.success('Work hours updated successfully')
        } catch (profileError) {
          console.error('Failed to save work hours to database:', profileError)
          toast.error('Settings saved locally but failed to sync to cloud')
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

        try {
          await updateProfile({ preferences: updatedPrefs })
          toast.success('Notification preferences updated')
        } catch (profileError) {
          console.error('Failed to save notifications to database:', profileError)
          toast.error('Settings saved locally but failed to sync to cloud')
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
      await updateProfile({
        full_name: profileForm.full_name,
        email: profileForm.email
      })

      toast.success('Profile updated successfully')
      setShowProfileEdit(false)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 dark:from-slate-900 dark:via-gray-900 dark:to-stone-900 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-slate-300 to-gray-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-stone-300 to-slate-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-gradient-to-br from-gray-300 to-zinc-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <Navigation />

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Loading overlay */}
        {isSaving && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 rounded-2xl p-6 shadow-2xl flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-600"></div>
              <span className="text-gray-800 dark:text-white font-medium">Saving settings...</span>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          <div className="mb-8 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 rounded-3xl p-8 shadow-2xl">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-700 via-gray-800 to-stone-700 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
              Settings{user?.full_name ? ` - ${user.full_name}` : ''}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Manage your account preferences and BeQ settings
              {user?.email && (
                <span className="block text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Signed in as {user.email}
                </span>
              )}
            </p>
          </div>

          {/* Theme Selection */}
          <div className="mb-8 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-gray-800 bg-clip-text text-transparent dark:from-white dark:to-gray-300 mb-6">Choose Theme</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-4">
                  {themes.map((theme) => (
                    <div
                      key={theme.id}
                      onClick={() => handleThemeSelect(theme.id)}
                      className={`cursor-pointer rounded-2xl border-2 p-4 text-center transition-all hover:border-blue-500 hover:shadow-lg transform hover:scale-105 ${
                        settings.theme === theme.id
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-lg'
                          : 'border-white/40 dark:border-gray-700/40 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm'
                      }`}
                    >
                      {renderThemePreview(theme)}
                      <p className="mt-2 text-sm font-medium text-gray-800 dark:text-white">{theme.name}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calendar Integrations */}
              <div className="mb-8 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 rounded-3xl p-8 shadow-2xl">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-gray-800 bg-clip-text text-transparent dark:from-white dark:to-gray-300 mb-6">Calendar Integrations</h2>
                <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/50 dark:border-gray-700/50 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                        <span className="material-symbols-outlined">calendar_month</span>
                      </div>
                      <div>
                        <p className="text-base font-medium text-gray-800 dark:text-white">Connect Calendars</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Connect your external calendars to sync events and avoid scheduling conflicts.</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleCalendarConnect}
                      className="h-10 rounded-xl bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm border border-white/50 dark:border-gray-600/50 px-4 text-sm font-medium text-gray-800 dark:text-white hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Connect
                    </button>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="mb-8 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 rounded-3xl p-8 shadow-2xl">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-gray-800 bg-clip-text text-transparent dark:from-white dark:to-gray-300 mb-6">Notifications</h2>
                <div className="space-y-4">
                  {notifications.map((notification, index) => (
                    <div key={notification.id} className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/50 dark:border-gray-700/50 rounded-2xl p-6 hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                            <span className="material-symbols-outlined">{notification.icon}</span>
                          </div>
                          <div>
                            <p className="text-base font-medium text-gray-800 dark:text-white">{notification.title}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{notification.description}</p>
                          </div>
                        </div>
                        <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full bg-gray-200 dark:bg-gray-600 p-0.5 has-[:checked]:bg-blue-600 has-[:checked]:justify-end shadow-lg">
                          <div className="h-full w-[27px] rounded-full bg-white shadow-md transition-transform"></div>
                          <input
                            checked={notification.enabled}
                            onChange={() => handleNotificationToggle(notification.id)}
                            className="invisible absolute"
                            type="checkbox"
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Personal Information */}
              <div className="mb-8 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 rounded-3xl p-8 shadow-2xl">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-gray-800 bg-clip-text text-transparent dark:from-white dark:to-gray-300 mb-6">Personal Information</h2>
                <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/50 dark:border-gray-700/50 rounded-2xl p-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="text-base font-medium text-gray-800 dark:text-white" htmlFor="work-start">
                        Work Hours Start
                      </label>
                      <input
                        className="mt-2 block w-full rounded-xl border border-white/40 dark:border-gray-600/40 bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm px-4 py-3 text-gray-900 dark:text-white shadow-lg focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400 transition-all duration-300"
                        id="work-start"
                        type="time"
                        value={settings.workHours.start}
                        onChange={(e) => handleWorkHoursChange('start', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-base font-medium text-gray-800 dark:text-white" htmlFor="work-end">
                        Work Hours End
                      </label>
                      <input
                        className="mt-2 block w-full rounded-xl border border-white/40 dark:border-gray-600/40 bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm px-4 py-3 text-gray-900 dark:text-white shadow-lg focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400 transition-all duration-300"
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
              <div className="mb-8 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 rounded-3xl p-8 shadow-2xl">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-gray-800 bg-clip-text text-transparent dark:from-white dark:to-gray-300 mb-6">AI Assistance</h2>
                <div className="space-y-4">
                  <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/50 dark:border-gray-700/50 rounded-2xl p-6 hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
                          <span className="material-symbols-outlined">psychology</span>
                        </div>
                        <div>
                          <p className="text-base font-medium text-gray-800 dark:text-white">Smart Suggestions</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Let BeQ provide intelligent task and scheduling suggestions.</p>
                        </div>
                      </div>
                      <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full bg-gray-200 dark:bg-gray-600 p-0.5 has-[:checked]:bg-blue-600 has-[:checked]:justify-end shadow-lg">
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

                              try {
                                await updateProfile({ preferences: updatedPrefs })
                                toast.success('AI preferences updated')
                              } catch (profileError) {
                                toast.error('Settings saved locally but failed to sync to cloud')
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
                  </div>
                  <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/50 dark:border-gray-700/50 rounded-2xl p-6 hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg">
                          <span className="material-symbols-outlined">smart_toy</span>
                        </div>
                        <div>
                          <p className="text-base font-medium text-gray-800 dark:text-white">Smart Prioritization</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Automatically prioritize tasks based on deadlines and importance.</p>
                        </div>
                      </div>
                      <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full bg-gray-200 dark:bg-gray-600 p-0.5 has-[:checked]:bg-blue-600 has-[:checked]:justify-end shadow-lg">
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

                              try {
                                await updateProfile({ preferences: updatedPrefs })
                                toast.success('Smart prioritization updated')
                              } catch (profileError) {
                                toast.error('Settings saved locally but failed to sync to cloud')
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
              </div>

              {/* Privacy Settings */}
              <div className="mb-8 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 rounded-3xl p-8 shadow-2xl">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-gray-800 bg-clip-text text-transparent dark:from-white dark:to-gray-300 mb-6">Privacy & Data</h2>
                <div className="space-y-4">
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

                              try {
                                await updateProfile({ preferences: updatedPrefs })
                                toast.success('Analytics preferences updated')
                              } catch (profileError) {
                                toast.error('Settings saved locally but failed to sync to cloud')
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

                              try {
                                await updateProfile({ preferences: updatedPrefs })
                                toast.success('Data collection preferences updated')
                              } catch (profileError) {
                                toast.error('Settings saved locally but failed to sync to cloud')
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
              <div className="mb-8 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 rounded-3xl p-8 shadow-2xl">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-gray-800 bg-clip-text text-transparent dark:from-white dark:to-gray-300 mb-6">Account Management</h2>
                <div className="space-y-4">
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
          <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Settings are automatically saved and synced to your account.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}