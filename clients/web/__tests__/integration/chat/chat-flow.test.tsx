import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ChatPage from '@/app/chat/page'
import { Providers } from '@/components/providers/providers'

function renderWithProviders(ui: React.ReactElement) {
  return render(<Providers>{ui}</Providers>)
}

describe('Chat Integration', () => {
  it('sends a message through chat interface', async () => {
    jest.mock('@/lib/hooks/use-chat', () => ({
      useChat: () => ({
        messages: [],
        isLoading: false,
        sendMessage: jest.fn().mockResolvedValue(undefined),
      })
    }))

    renderWithProviders(<ChatPage />)

    const textbox = screen.getByPlaceholderText(/ask beq/i)
    fireEvent.change(textbox, { target: { value: 'Hello' } })
    fireEvent.keyDown(textbox, { key: 'Enter' })

    await waitFor(() => {
      expect(textbox).toHaveValue('')
    })
  })
})


