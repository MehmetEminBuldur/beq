import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AuthPage from '@/app/auth/page'
import { Providers } from '@/components/providers/providers'

function renderWithProviders(ui: React.ReactElement) {
  return render(<Providers>{ui}</Providers>)
}

describe('Auth Integration Flow', () => {
  it('renders sign-in form and attempts login', async () => {
    const { supabase } = require('@/lib/supabase/client')
    supabase.auth.signInWithPassword.mockResolvedValueOnce({ data: { session: {} }, error: null })

    renderWithProviders(<AuthPage />)

    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'Password1' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalled()
    })
  })

  it('switches to sign-up form and submits', async () => {
    const { supabase } = require('@/lib/supabase/client')
    supabase.auth.signUp.mockResolvedValueOnce({ data: { user: {}, session: null }, error: null })

    renderWithProviders(<AuthPage />)

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
    expect(screen.getByText(/Create your account/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Test User' } })
    fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'new@example.com' } })
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'Password1' } })
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'Password1' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalled()
    })
  })
})


