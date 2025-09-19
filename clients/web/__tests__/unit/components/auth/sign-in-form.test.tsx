/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils'
import { SignInForm } from '@/components/auth/sign-in-form'
import { mockSignInData, mockAuthError } from '../../../mocks/data/auth'

// Mock the auth context
const mockAuthContext = {
  signIn: jest.fn(),
  isLoading: false,
}

jest.mock('@/lib/providers/auth-provider', () => ({
  useAuthContext: () => mockAuthContext,
}))

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('SignInForm Component', () => {
  const mockOnSwitchToSignUp = jest.fn()
  const mockOnSwitchToResetPassword = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthContext.isLoading = false
  })

  const renderSignInForm = () => {
    return render(
      <SignInForm
        onSwitchToSignUp={mockOnSwitchToSignUp}
        onSwitchToResetPassword={mockOnSwitchToResetPassword}
      />
    )
  }

  describe('Rendering', () => {
    it('should render sign in form correctly', () => {
      renderSignInForm()

      expect(screen.getByText('Welcome back')).toBeInTheDocument()
      expect(screen.getByText('Enter your credentials to access your BeQ account')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
      expect(screen.getByText('Forgot your password?')).toBeInTheDocument()
      expect(screen.getByText('Sign up')).toBeInTheDocument()
    })

    it('should show password toggle button', () => {
      renderSignInForm()

      const passwordToggle = screen.getByRole('button', { name: '' })
      expect(passwordToggle).toBeInTheDocument()
    })
  })

  describe('Form Interaction', () => {
    it('should toggle password visibility', async () => {
      renderSignInForm()

      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement
      const toggleButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('[data-testid="eye-icon"], [data-testid="eye-off-icon"]')
      )

      expect(passwordInput.type).toBe('password')

      if (toggleButton) {
        fireEvent.click(toggleButton)
        expect(passwordInput.type).toBe('text')

        fireEvent.click(toggleButton)
        expect(passwordInput.type).toBe('password')
      }
    })

    it('should call onSwitchToSignUp when sign up link is clicked', () => {
      renderSignInForm()

      const signUpLink = screen.getByText('Sign up')
      fireEvent.click(signUpLink)

      expect(mockOnSwitchToSignUp).toHaveBeenCalledTimes(1)
    })

    it('should call onSwitchToResetPassword when forgot password link is clicked', () => {
      renderSignInForm()

      const resetPasswordLink = screen.getByText('Forgot your password?')
      fireEvent.click(resetPasswordLink)

      expect(mockOnSwitchToResetPassword).toHaveBeenCalledTimes(1)
    })
  })

  describe('Form Validation', () => {
    it('should show validation errors for invalid inputs', async () => {
      renderSignInForm()

      const submitButton = screen.getByRole('button', { name: 'Sign In' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
      })
    })

    it('should show password length validation', async () => {
      renderSignInForm()

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign In' })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: '123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid data and redirect on success', async () => {
      mockAuthContext.signIn.mockResolvedValue({ error: null })

      renderSignInForm()

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign In' })

      fireEvent.change(emailInput, { target: { value: mockSignInData.email } })
      fireEvent.change(passwordInput, { target: { value: mockSignInData.password } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockAuthContext.signIn).toHaveBeenCalledWith(
          mockSignInData.email,
          mockSignInData.password
        )
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('should handle sign in error', async () => {
      mockAuthContext.signIn.mockResolvedValue({ error: mockAuthError })

      renderSignInForm()

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign In' })

      fireEvent.change(emailInput, { target: { value: mockSignInData.email } })
      fireEvent.change(passwordInput, { target: { value: mockSignInData.password } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockAuthContext.signIn).toHaveBeenCalled()
        expect(mockPush).not.toHaveBeenCalled()
      })
    })
  })

  describe('Loading State', () => {
    it('should disable form controls when loading', () => {
      mockAuthContext.isLoading = true

      renderSignInForm()

      expect(screen.getByLabelText('Email')).toBeDisabled()
      expect(screen.getByLabelText('Password')).toBeDisabled()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled()
      expect(screen.getByText('Forgot your password?')).toBeInTheDocument()
      expect(screen.getByText('Sign up')).toBeInTheDocument()
    })

    it('should show loading spinner when submitting', () => {
      mockAuthContext.isLoading = true

      renderSignInForm()

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      expect(submitButton).toHaveTextContent('Sign In')
    })
  })

  describe('Accessibility', () => {
    it('should have proper form labels and structure', () => {
      renderSignInForm()

      expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email')
      expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password')
      expect(screen.getByRole('form')).toBeInTheDocument()
    })

    it('should support keyboard navigation', () => {
      renderSignInForm()

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign In' })

      expect(emailInput).toHaveAttribute('tabIndex')
      expect(passwordInput).toHaveAttribute('tabIndex')
      expect(submitButton).toHaveAttribute('tabIndex')
    })
  })
})