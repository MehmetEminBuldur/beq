'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProgressIndicator } from '../../../components/onboarding/progress-indicator'
import { initializeDefaultSettings } from '../../../lib/default-settings'

interface CalendarConnection {
  id: string
  name: string
  provider: 'google' | 'microsoft'
  connected: boolean
}

export default function OnboardingCalendarIntegration() {
  const router = useRouter()
  const [connections, setConnections] = useState<CalendarConnection[]>([
    { id: '1', name: 'Google Calendar', provider: 'google', connected: false },
    { id: '2', name: 'Microsoft Outlook', provider: 'microsoft', connected: false }
  ])
  const [isConnecting, setIsConnecting] = useState<string | null>(null)

  const steps = [
    { id: 'welcome', title: 'Welcome', completed: true, current: false },
    { id: 'goals', title: 'Goals', completed: true, current: false },
    { id: 'calendar', title: 'Calendar', completed: false, current: true }
  ]

  const handleConnect = async (connectionId: string) => {
    setIsConnecting(connectionId)
    
    // Simulate API call for calendar connection
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate delay
      
      setConnections(prev => prev.map(conn => 
        conn.id === connectionId 
          ? { ...conn, connected: true }
          : conn
      ))
      
      // Store connection status
      const connection = connections.find(c => c.id === connectionId)
      if (connection) {
        const existingConnections = JSON.parse(localStorage.getItem('onboarding-calendar-connections') || '[]')
        const updatedConnections = [...existingConnections, connection.provider]
        localStorage.setItem('onboarding-calendar-connections', JSON.stringify(updatedConnections))
      }
    } catch (error) {
      console.error('Failed to connect calendar:', error)
    } finally {
      setIsConnecting(null)
    }
  }

  const handleContinue = () => {
    // Initialize default settings for the user
    initializeDefaultSettings()
    // Save onboarding completion status
    localStorage.setItem('onboarding-completed', 'true')
    router.push('/dashboard')
  }

  const handleSkip = () => {
    // Initialize default settings even when skipping
    initializeDefaultSettings()
    // Allow users to skip calendar integration
    localStorage.setItem('onboarding-completed', 'true')
    router.push('/dashboard')
  }

  const getProviderIcon = (provider: 'google' | 'microsoft') => {
    if (provider === 'google') {
      return (
        <svg className="h-6 w-6" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      )
    } else {
      return (
        <svg className="h-6 w-6" viewBox="0 0 24 24">
          <path fill="#0078D4" d="M21.53 4.306v2.294h-3.29v3.29h3.29v2.293h-3.29v3.29h3.29v2.294H12.47V4.306z"/>
          <path fill="#0078D4" d="M10.647 4.306v15.388H2.47V4.306z"/>
        </svg>
      )
    }
  }

  const hasAnyConnection = connections.some(conn => conn.connected)

  return (
    <div className="relative flex size-full min-h-screen flex-col group/design-root overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        <header className="flex items-center justify-between whitespace-nowrap px-10 py-5">
          <div className="flex items-center gap-3 text-gray-800">
            <div className="size-6 text-blue-600">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z" fill="currentColor"></path>
              </svg>
            </div>
            <h2 className="text-gray-800 text-xl font-bold leading-tight tracking-[-0.015em]">BeQ</h2>
          </div>
        </header>
        
        <div className="px-10 flex flex-1 justify-center items-center py-5">
          <div className="flex flex-col w-full max-w-md text-center">
            <ProgressIndicator steps={steps} currentStep={2} />
            <div className="mb-8">
              <span className="material-symbols-outlined text-6xl text-blue-600">
                calendar_month
              </span>
            </div>
            
            <h1 className="text-gray-900 text-4xl font-bold leading-tight tracking-tighter mb-4">
              Connect your calendars
            </h1>
            
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              Sync your existing calendars to get started with Bricks and Quantas.
            </p>
            
            <div className="flex flex-col gap-4">
              {connections.map((connection) => (
                <button
                  key={connection.id}
                  onClick={() => handleConnect(connection.id)}
                  disabled={isConnecting === connection.id || connection.connected}
                  className={`flex items-center justify-center gap-3 w-full cursor-pointer overflow-hidden rounded-md h-12 px-6 text-base font-semibold transition-all ${
                    connection.connected
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                  } ${
                    isConnecting === connection.id ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isConnecting === connection.id ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700"></div>
                      <span className="truncate">Connecting...</span>
                    </>
                  ) : connection.connected ? (
                    <>
                      <span className="material-symbols-outlined text-green-600">check_circle</span>
                      <span className="truncate">Connected to {connection.name}</span>
                    </>
                  ) : (
                    <>
                      {getProviderIcon(connection.provider)}
                      <span className="truncate">Connect {connection.name}</span>
                    </>
                  )}
                </button>
              ))}
            </div>
            
            <div className="flex flex-col gap-3 mt-8">
              <button
                onClick={handleContinue}
                className="flex min-w-[120px] items-center justify-center overflow-hidden rounded-md h-12 px-8 bg-blue-600 text-white text-base font-bold shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
              >
                <span className="truncate">Continue</span>
              </button>
              
              <button
                onClick={handleSkip}
                className="text-gray-500 text-sm hover:text-gray-700 transition-colors"
              >
                Skip for now
              </button>
            </div>
            
            {hasAnyConnection && (
              <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-700 text-sm">
                  Great! Your calendar{connections.filter(c => c.connected).length > 1 ? 's are' : ' is'} now connected.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}