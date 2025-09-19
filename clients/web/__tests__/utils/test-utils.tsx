import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/lib/providers/auth-provider'
import { AppStateProviderWrapper } from '@/lib/providers/app-state-provider'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'react-hot-toast'

// Create a new QueryClient for each test to ensure test isolation
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

interface AllTheProvidersProps {
  children: React.ReactNode
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const queryClient = createTestQueryClient()

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppStateProviderWrapper>
            <div className="relative flex min-h-screen flex-col">
              <div className="flex-1">{children}</div>
            </div>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 1000, // Shorter duration for tests
              }}
            />
          </AppStateProviderWrapper>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Helper function to mock user authentication state
export const mockAuthenticatedUser = (user: any = null) => {
  const mockUseAuth = {
    isAuthenticated: !!user,
    isLoading: false,
    user,
    session: user ? { user } : null,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    resetPassword: jest.fn(),
    updateProfile: jest.fn(),
  }

  jest.doMock('@/lib/hooks/use-auth', () => ({
    useAuth: () => mockUseAuth,
  }))

  return mockUseAuth
}

// Helper function to create mock form events
export const createMockFormEvent = (values: Record<string, any>) => ({
  preventDefault: jest.fn(),
  target: {
    elements: Object.entries(values).reduce((acc, [key, value]) => ({
      ...acc,
      [key]: { value },
    }), {}),
  },
})

// Helper function to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

// Mock IntersectionObserver for components that use it
export const mockIntersectionObserver = () => {
  const mockObserver = jest.fn()
  const mockUnobserve = jest.fn()
  const mockDisconnect = jest.fn()

  window.IntersectionObserver = jest.fn(() => ({
    observe: mockObserver,
    unobserve: mockUnobserve,
    disconnect: mockDisconnect,
  })) as any

  return { mockObserver, mockUnobserve, mockDisconnect }
}

// Helper to mock window.matchMedia
export const mockMatchMedia = (matches: boolean = false) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

// Helper to create mock router
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  prefetch: jest.fn(),
}