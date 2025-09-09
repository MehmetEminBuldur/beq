'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingIndex() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to welcome page as the first step of onboarding
    router.replace('/onboarding/welcome')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Starting your onboarding journey...</p>
      </div>
    </div>
  )
}