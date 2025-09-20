'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { supabase } from '@/lib/supabase/client'
import { ProgressIndicator } from '../../../components/onboarding/progress-indicator'
import { AuthGuard } from '@/components/auth/auth-guard'
import { Navigation } from '@/components/layout/navigation'

function OnboardingWelcomeContent() {
  const router = useRouter()
  const { user } = useAuthContext()

  useEffect(() => {
    // Check if user has already completed onboarding
    const checkOnboardingStatus = async () => {
      if (!user?.id) return

      try {
        // Check database first
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single()

        if (!error && profile?.onboarding_completed) {
          // User has completed onboarding, redirect to dashboard
          router.replace('/dashboard')
          return
        }

        // Check localStorage as fallback
        const localOnboardingCompleted = localStorage.getItem('onboarding-completed')
        if (localOnboardingCompleted === 'true') {
          // Update database with localStorage value
          await supabase
            .from('profiles')
            .update({ onboarding_completed: true })
            .eq('id', user.id)
          router.replace('/dashboard')
          return
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
        // Continue with onboarding if there's an error
      }
    }

    checkOnboardingStatus()
  }, [user?.id, router])

  const handleGetStarted = () => {
    router.push('/onboarding/goals')
  }

  const steps = [
    { id: 'welcome', title: 'Welcome', completed: false, current: true },
    { id: 'goals', title: 'Goals', completed: false, current: false },
    { id: 'calendar', title: 'Calendar', completed: false, current: false }
  ]

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden">
      <Navigation />
      <div className="flex-1" style={{ paddingTop: '64px' }}>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8">
            <ProgressIndicator steps={steps} currentStep={0} />
            <div className="flex justify-center">
              <div className="h-16 w-16 text-primary-700">
                <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z" fill="currentColor"></path>
                </svg>
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Welcome to <span className="text-primary-700">Bricks & Quantas</span>
              </h1>
              <p className="mt-4 text-lg text-gray-600">
                Your intelligent assistant for effortless life management. Let's get you set up.
              </p>
            </div>

            <div className="mt-8 space-y-6">
              <div className="rounded-md bg-white p-6 shadow border border-gray-200">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <span className="material-symbols-outlined text-3xl text-primary-700">aod</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Conversational Interface</h3>
                    <p className="mt-1 text-gray-500">
                      Simply talk to BeQ to add tasks, set reminders, and schedule events.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <span className="material-symbols-outlined text-3xl text-primary-700">calendar_view_month</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Visual Calendar</h3>
                    <p className="mt-1 text-gray-500">
                      See your entire schedule at a glance with our intuitive calendar view.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <span className="material-symbols-outlined text-3xl text-primary-700">psychology</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">AI-Powered Optimization</h3>
                    <p className="mt-1 text-gray-500">
                      Let BeQ intelligently organize your life with personalized recommendations.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <button
                  onClick={handleGetStarted}
                  className="group relative flex w-full justify-center rounded-md border border-transparent bg-primary-700 px-4 py-3 text-base font-semibold text-white shadow-sm transition-all duration-200 ease-in-out hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="material-symbols-outlined text-xl text-primary-300">rocket_launch</span>
                  </span>
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingWelcome() {
  return (
    <AuthGuard>
      <OnboardingWelcomeContent />
    </AuthGuard>
  )
}