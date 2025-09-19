import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BricksPage from '@/app/bricks/page'
import QuantasPage from '@/app/quantas/page'
import { Providers } from '@/components/providers/providers'

function renderWithProviders(ui: React.ReactElement) {
  return render(<Providers>{ui}</Providers>)
}

describe('Bricks & Quantas Integration', () => {
  beforeEach(() => {
    const { supabase } = require('@/lib/supabase/client')
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'user-1', email: 't@e.com' } } }, error: null })
    supabase.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } })

    // Bricks list
    supabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null })
    })
  })

  it('creates a brick via form', async () => {
    const { supabase } = require('@/lib/supabase/client')
    // Insert brick
    supabase.from.mockReturnValueOnce({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: 'b1', title: 'My Brick', category: 'general', status: 'pending', completion_percentage: 0, sessions_count: 0, estimated_duration_minutes: 60, user_id: 'user-1', created_at: '', updated_at: '' }, error: null })
    })

    renderWithProviders(<BricksPage />)

    fireEvent.change(screen.getByPlaceholderText(/new brick title/i), { target: { value: 'My Brick' } })
    fireEvent.click(screen.getByRole('button', { name: /add/i }))

    await waitFor(() => {
      expect(screen.getByText(/My Brick/i)).toBeInTheDocument()
    })
  })

  it('creates a quanta for a brick', async () => {
    const { supabase } = require('@/lib/supabase/client')

    // Load bricks
    supabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [{ id: 'b1', title: 'Brick 1', user_id: 'user-1', category: 'general', status: 'pending', completion_percentage: 0, sessions_count: 0, created_at: '', updated_at: '' }], error: null })
    })

    // Load quantas
    supabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null })
    })

    // Get existing quantas for order index
    supabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null })
    })

    // Insert quanta
    supabase.from.mockReturnValueOnce({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: 'q1', brick_id: 'b1', title: 'Do part', estimated_duration_minutes: 30, status: 'not_started', order_index: 0, created_at: '', updated_at: '' }, error: null })
    })

    // Reload user quantas after create
    supabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [{ id: 'q1', brick_id: 'b1', title: 'Do part', estimated_duration_minutes: 30, status: 'not_started', order_index: 0, created_at: '1', updated_at: '1' }], error: null })
    })

    renderWithProviders(<QuantasPage />)

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'b1' } })
    fireEvent.change(screen.getByPlaceholderText(/new quanta title/i), { target: { value: 'Do part' } })
    fireEvent.click(screen.getByRole('button', { name: /add quanta/i }))

    await waitFor(() => {
      expect(screen.getByText(/Do part/i)).toBeInTheDocument()
    })
  })
})


