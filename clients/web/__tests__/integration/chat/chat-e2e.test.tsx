/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ChatPage from '@/app/chat/page'
import { Providers } from '@/components/providers/providers'

// Mock fetch to simulate orchestrator response
const originalFetch = global.fetch as any

// Bypass dynamic() loading fallback
jest.mock('next/dynamic', () => (factory: any) => {
  const mod = require('@/components/chat/chat-interface')
  return mod.ChatInterface
})

// Provide authenticated user via auth context
jest.mock('@/lib/providers/auth-provider', () => ({
  useAuthContext: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: { id: 'u-1', email: 'user@test.com' },
    session: { access_token: 'test-token' },
    signIn: () => Promise.resolve({ data: null, error: null }),
    signUp: () => Promise.resolve({ data: null, error: null }),
    signOut: () => Promise.resolve(),
    resetPassword: () => Promise.resolve({ error: null }),
    updateProfile: () => Promise.resolve({ error: null }),
  })
}))

beforeAll(() => {
  // Minimal auth/logging mocks
  jest.spyOn(console, 'error').mockImplementation(() => {})
  global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString()
    if (url.includes('/api/v1/chat/message')) {
      return new Response(
        JSON.stringify({
          message_id: 'm-1',
          conversation_id: 'c-1',
          response: 'Hello! How can I help you today?',
          model_used: 'test-model',
          processing_time_ms: 42,
          actions_taken: [],
          suggestions: [],
          schedule_updated: false,
          bricks_created: [],
          bricks_updated: [],
          resources_recommended: [],
          timestamp: new Date().toISOString(),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ) as any
    }
    return (originalFetch as any)(input as any, init as any)
  }) as any
})

afterAll(() => {
  global.fetch = originalFetch
  ;(console.error as any).mockRestore()
})

function renderWithProviders(ui: React.ReactElement) {
  return render(<Providers>{ui}</Providers>)
}

describe('Chat E2E', () => {
  it('sends a message and renders assistant response', async () => {
    renderWithProviders(<ChatPage />)

    const textbox = await screen.findByPlaceholderText(/ask beq/i)
    fireEvent.change(textbox, { target: { value: 'Hello' } })
    fireEvent.keyDown(textbox, { key: 'Enter' })

    await waitFor(() => {
      // Input cleared by hook after send
      expect(textbox).toHaveValue('')
    })

    // Assistant response eventually appears
    await waitFor(() => {
      expect(
        screen.getByText(/how can i help you today\?/i)
      ).toBeInTheDocument()
    })
  })
})
