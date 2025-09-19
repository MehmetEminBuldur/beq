export interface UserSettings {
  theme: string
  workHours: {
    start: string
    end: string
  }
  notifications: {
    events: boolean
    tasks: boolean
    breaks: boolean
    weeklyReview: boolean
  }
  privacy: {
    dataCollection: boolean
    analyticsEnabled: boolean
    shareUsageData: boolean
  }
  calendar: {
    defaultView: 'day' | 'week' | 'month'
    startWeekOn: 'sunday' | 'monday'
    timeFormat: '12h' | '24h'
  }
  ai: {
    suggestionsEnabled: boolean
    autoScheduling: boolean
    smartPrioritization: boolean
  }
}

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'default',
  workHours: {
    start: '09:00',
    end: '17:00'
  },
  notifications: {
    events: true,
    tasks: true,
    breaks: false,
    weeklyReview: true
  },
  privacy: {
    dataCollection: true,
    analyticsEnabled: true,
    shareUsageData: false
  },
  calendar: {
    defaultView: 'week',
    startWeekOn: 'monday',
    timeFormat: '24h'
  },
  ai: {
    suggestionsEnabled: true,
    autoScheduling: false,
    smartPrioritization: true
  }
}

export function initializeDefaultSettings(): void {
  if (typeof window === 'undefined') return

  const existingSettings = localStorage.getItem('beq-settings')
  if (!existingSettings) {
    localStorage.setItem('beq-settings', JSON.stringify(DEFAULT_SETTINGS))
  }
}

export function getUserSettings(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS

  const stored = localStorage.getItem('beq-settings')
  if (!stored) {
    initializeDefaultSettings()
    return DEFAULT_SETTINGS
  }

  try {
    const parsed = JSON.parse(stored)
    // Merge with defaults to ensure all properties exist
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    localStorage.setItem('beq-settings', JSON.stringify(DEFAULT_SETTINGS))
    return DEFAULT_SETTINGS
  }
}

export function updateUserSettings(updates: Partial<UserSettings>): void {
  if (typeof window === 'undefined') return

  const current = getUserSettings()
  const updated = { ...current, ...updates }
  localStorage.setItem('beq-settings', JSON.stringify(updated))
}

export function resetToDefaultSettings(): void {
  if (typeof window === 'undefined') return

  localStorage.setItem('beq-settings', JSON.stringify(DEFAULT_SETTINGS))
}