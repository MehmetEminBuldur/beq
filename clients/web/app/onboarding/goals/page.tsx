'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { supabase } from '@/lib/supabase/client'
import { ProgressIndicator } from '../../../components/onboarding/progress-indicator'

function OnboardingGoalSettingContent() {
  const router = useRouter()
  const { user } = useAuthContext()
  const [goalInput, setGoalInput] = useState('')
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])

  const steps = [
    { id: 'welcome', title: 'Welcome', completed: true, current: false },
    { id: 'goals', title: 'Goals', completed: false, current: true },
    { id: 'calendar', title: 'Calendar', completed: false, current: false }
  ]

  // Load existing goals from localStorage on mount
  useEffect(() => {
    const savedGoals = localStorage.getItem('onboarding-goals')
    if (savedGoals) {
      try {
        const parsedGoals = JSON.parse(savedGoals)
        if (Array.isArray(parsedGoals)) {
          setSelectedGoals(parsedGoals)
        }
      } catch (error) {
        console.error('Error loading saved goals:', error)
      }
    }
  }, [])

  const suggestionGoals = [
    { icon: 'fitness_center', label: 'Exercise' },
    { icon: 'translate', label: 'Learn a new language' },
    { icon: 'menu_book', label: 'Read more books' },
    { icon: 'self_improvement', label: 'Meditate' },
  ]

  const handleAddGoal = () => {
    if (goalInput.trim() && !selectedGoals.includes(goalInput.trim())) {
      setSelectedGoals([...selectedGoals, goalInput.trim()])
      setGoalInput('')
    }
  }

  const handleSuggestionClick = (goal: string) => {
    if (!selectedGoals.includes(goal)) {
      setSelectedGoals([...selectedGoals, goal])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddGoal()
    }
  }

  const handleNext = async () => {
    try {
      // Store goals in localStorage
      localStorage.setItem('onboarding-goals', JSON.stringify(selectedGoals))

      // Save goals to database if user is authenticated
      if (user?.id && selectedGoals.length > 0) {
        const { error } = await supabase
          .from('profiles')
          .update({
            preferences: {
              onboarding_goals: selectedGoals,
              learning_goals: selectedGoals.filter(goal =>
                goal.toLowerCase().includes('learn') ||
                goal.toLowerCase().includes('language') ||
                goal.toLowerCase().includes('read')
              )
            }
          })
          .eq('id', user.id)

        if (error) {
          console.error('Error saving goals to database:', error)
          // Continue anyway - localStorage will preserve the data
        }
      }

      // Navigate to calendar integration
      router.push('/onboarding/calendar')
    } catch (error) {
      console.error('Error in handleNext:', error)
      // Still navigate even if saving fails
      router.push('/onboarding/calendar')
    }
  }

  return (
    <div className="relative flex size-full min-h-screen flex-col group/design-root overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 px-10 py-4 bg-white">
          <div className="flex items-center gap-3 text-gray-800">
            <svg className="h-8 w-8 text-[var(--primary-600)]" fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z"></path>
            </svg>
            <h2 className="text-xl font-bold leading-tight tracking-tight">BeQ</h2>
          </div>
        </header>
        <main className="flex flex-1 justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-lg space-y-8">
            <ProgressIndicator steps={steps} currentStep={1} />
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                What would you like to add to your life?
              </h1>
              <p className="mt-4 text-lg text-gray-600">
                This will help your assistant gather critical data for initial personalization.
              </p>
            </div>
            <div className="bg-white p-8 shadow-sm rounded-xl border border-gray-200">
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 sr-only" htmlFor="goals">
                    Your goals
                  </label>
                  <div className="relative">
                    <input
                      className="form-input block w-full rounded-lg border-gray-300 py-4 px-4 text-base text-gray-900 placeholder:text-gray-400 focus:border-[var(--primary-500)] focus:ring-[var(--primary-500)]"
                      id="goals"
                      placeholder="e.g., Exercise, Learn a new language"
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    <button 
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-[var(--primary-600)]"
                      onClick={handleAddGoal}
                    >
                      <span className="material-symbols-outlined">add_circle</span>
                    </button>
                  </div>
                </div>

                {selectedGoals.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Selected goals:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedGoals.map((goal, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 rounded-full bg-[var(--primary-100)] px-3 py-1 text-sm text-[var(--primary-800)]"
                        >
                          {goal}
                          <button
                            onClick={() => setSelectedGoals(selectedGoals.filter((_, i) => i !== index))}
                            className="ml-1 text-[var(--primary-600)] hover:text-[var(--primary-800)]"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-500">Suggestions:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestionGoals.map((goal) => (
                      <button
                        key={goal.label}
                        onClick={() => handleSuggestionClick(goal.label)}
                        disabled={selectedGoals.includes(goal.label)}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
                          selectedGoals.includes(goal.label)
                            ? 'bg-[var(--primary-100)] text-[var(--primary-800)] cursor-not-allowed'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">{goal.icon}</span>
                        <span>{goal.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button 
                onClick={handleNext}
                className="flex min-w-[120px] cursor-pointer items-center justify-center rounded-lg bg-[var(--primary-600)] py-3 px-6 text-base font-semibold text-white shadow-sm hover:bg-[var(--primary-700)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary-600)] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={selectedGoals.length === 0}
              >
                <span>Next</span>
                <span className="material-symbols-outlined ml-2">arrow_forward</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

import { AuthGuard } from '@/components/auth/auth-guard'

export default function OnboardingGoalSetting() {
  return (
    <AuthGuard>
      <OnboardingGoalSettingContent />
    </AuthGuard>
  )
}