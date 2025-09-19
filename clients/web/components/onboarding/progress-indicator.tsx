'use client'

interface Step {
  id: string
  title: string
  completed: boolean
  current: boolean
}

interface ProgressIndicatorProps {
  steps: Step[]
  currentStep: number
}

export function ProgressIndicator({ steps, currentStep }: ProgressIndicatorProps) {
  return (
    <div className="w-full max-w-md mx-auto mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center flex-1">
            <div className="flex items-center w-full">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  step.completed
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : step.current
                    ? 'border-primary-600 text-primary-600 bg-white'
                    : 'border-gray-300 text-gray-400 bg-white'
                }`}
              >
                {step.completed ? (
                  <span className="material-symbols-outlined text-sm">check</span>
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 ${
                    steps[index + 1]?.completed || currentStep > index + 1
                      ? 'bg-primary-600'
                      : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
            <span
              className={`text-xs mt-2 text-center font-medium ${
                step.current
                  ? 'text-primary-600'
                  : step.completed
                  ? 'text-gray-700'
                  : 'text-gray-400'
              }`}
            >
              {step.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}