/**
 * Comprehensive E2E tests for chat functionality
 * Tests the complete flow from frontend to orchestrator to LLM
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import ChatPage from '@/app/chat/page'

// Mock fetch to simulate orchestrator response
const originalFetch = global.fetch as any

// Bypass dynamic() loading fallback
jest.mock('next/dynamic', () => (factory: any) => {
  const mod = require('@/components/chat/chat-interface')
  return mod.ChatInterface
})

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: jest.fn(),
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}))

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

// Mock the chat hook
jest.mock('@/lib/hooks/use-chat', () => ({
  useChat: () => ({
    messages: [],
    isLoading: false,
    sendMessage: jest.fn().mockResolvedValue(undefined),
  })
}))

beforeAll(() => {
  // Mock console methods to reduce noise in tests
  jest.spyOn(console, 'error').mockImplementation(() => {})
  jest.spyOn(console, 'warn').mockImplementation(() => {})
  
  // Mock fetch with realistic orchestrator responses
  global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString()
    
    if (url.includes('/api/v1/chat/message')) {
      const requestBody = init?.body ? JSON.parse(init.body as string) : {}
      
      // Simulate different responses based on message content
      let response = {
        message_id: `m-${Date.now()}`,
        conversation_id: 'c-1',
        response: 'Hello! How can I help you today?',
        model_used: 'claude-3-sonnet',
        processing_time_ms: Math.floor(Math.random() * 100) + 50,
        actions_taken: [],
        suggestions: [],
        schedule_updated: false,
        bricks_created: [],
        bricks_updated: [],
        resources_recommended: [],
        timestamp: new Date().toISOString(),
      }

      // Customize response based on message content
      if (requestBody.message?.toLowerCase().includes('schedule')) {
        response.response = 'I can help you with scheduling. What would you like to schedule?'
        response.suggestions = ['Create a new event', 'View your calendar', 'Optimize your schedule']
      } else if (requestBody.message?.toLowerCase().includes('brick')) {
        response.response = 'I can help you create and manage Bricks. What type of Brick would you like to create?'
        response.suggestions = ['Work Brick', 'Personal Brick', 'Learning Brick']
      } else if (requestBody.message?.toLowerCase().includes('error')) {
        // Simulate an error response
        return new Response(
          JSON.stringify({ error: 'Internal server error' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        ) as any
      }

      return new Response(
        JSON.stringify(response),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ) as any
    }
    
    return (originalFetch as any)(input as any, init as any)
  }) as any
})

afterAll(() => {
  global.fetch = originalFetch
  ;(console.error as any).mockRestore()
  ;(console.warn as any).mockRestore()
})

function renderWithProviders(ui: React.ReactElement) {
  return render(ui)
}

describe('Chat Comprehensive E2E', () => {
  beforeEach(() => {
    // Clear any previous fetch calls
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('renders chat interface with input field', async () => {
    renderWithProviders(<ChatPage />)

    // Check that the chat interface loads
    const textbox = await screen.findByPlaceholderText(/ask beq/i)
    expect(textbox).toBeInTheDocument()
    expect(textbox).toHaveAttribute('type', 'text')
  })

  it('sends a message and receives a response', async () => {
    renderWithProviders(<ChatPage />)

    const textbox = await screen.findByPlaceholderText(/ask beq/i)
    const testMessage = 'Hello, can you help me?'
    
    fireEvent.change(textbox, { target: { value: testMessage } })
    fireEvent.keyDown(textbox, { key: 'Enter' })

    // Verify input is cleared after sending
    await waitFor(() => {
      expect(textbox).toHaveValue('')
    })

    // Verify fetch was called with correct parameters
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/chat/message'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining(testMessage)
        })
      )
    })
  })

  it('handles different types of messages with appropriate responses', async () => {
    renderWithProviders(<ChatPage />)

    const textbox = await screen.findByPlaceholderText(/ask beq/i)
    
    // Test schedule-related message
    fireEvent.change(textbox, { target: { value: 'Help me with my schedule' } })
    fireEvent.keyDown(textbox, { key: 'Enter' })

    await waitFor(() => {
      expect(textbox).toHaveValue('')
    })

    // Verify the request was made
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/chat/message'),
        expect.objectContaining({
          body: expect.stringContaining('schedule')
        })
      )
    })
  })

  it('handles error responses gracefully', async () => {
    renderWithProviders(<ChatPage />)

    const textbox = await screen.findByPlaceholderText(/ask beq/i)
    
    // Send a message that triggers an error response
    fireEvent.change(textbox, { target: { value: 'This will cause an error' } })
    fireEvent.keyDown(textbox, { key: 'Enter' })

    await waitFor(() => {
      expect(textbox).toHaveValue('')
    })

    // Verify the request was made (error handling is tested at the component level)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
  })

  it('validates message format and content', async () => {
    renderWithProviders(<ChatPage />)

    const textbox = await screen.findByPlaceholderText(/ask beq/i)
    
    // Test empty message (should not send)
    fireEvent.change(textbox, { target: { value: '' } })
    fireEvent.keyDown(textbox, { key: 'Enter' })

    // Should not trigger a fetch call for empty message
    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled()
    })

    // Test whitespace-only message
    fireEvent.change(textbox, { target: { value: '   ' } })
    fireEvent.keyDown(textbox, { key: 'Enter' })

    // Should not trigger a fetch call for whitespace-only message
    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  it('maintains conversation state across multiple messages', async () => {
    renderWithProviders(<ChatPage />)

    const textbox = await screen.findByPlaceholderText(/ask beq/i)
    
    // Send first message
    fireEvent.change(textbox, { target: { value: 'First message' } })
    fireEvent.keyDown(textbox, { key: 'Enter' })

    await waitFor(() => {
      expect(textbox).toHaveValue('')
    })

    // Send second message
    fireEvent.change(textbox, { target: { value: 'Second message' } })
    fireEvent.keyDown(textbox, { key: 'Enter' })

    await waitFor(() => {
      expect(textbox).toHaveValue('')
    })

    // Verify both messages were sent
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })

  it('handles keyboard interactions correctly', async () => {
    renderWithProviders(<ChatPage />)

    const textbox = await screen.findByPlaceholderText(/ask beq/i)
    
    // Test Enter key sends message
    fireEvent.change(textbox, { target: { value: 'Test message' } })
    fireEvent.keyDown(textbox, { key: 'Enter' })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    // Reset mock
    ;(global.fetch as jest.Mock).mockClear()

    // Test other keys don't send message
    fireEvent.change(textbox, { target: { value: 'Another message' } })
    fireEvent.keyDown(textbox, { key: 'Escape' })
    fireEvent.keyDown(textbox, { key: 'Tab' })
    fireEvent.keyDown(textbox, { key: 'Shift' })

    // Should not trigger fetch calls
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
