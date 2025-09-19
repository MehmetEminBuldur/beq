/**
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from '@/lib/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { mockUser, mockSession, mockAuthError } from '../../mocks/data/auth'

// Mock the supabase client
jest.mock('@/lib/supabase/client')
const mockSupabase = supabase as jest.Mocked<typeof supabase>

// Mock toast
jest.mock('react-hot-toast', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}))

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementations
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: jest.fn(),
        },
      },
    } as any)

    // Mock the from() method chain
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
    }

    mockSupabase.from.mockReturnValue(mockQueryBuilder as any)
  })

  describe('Initial State', () => {
    it('should initialize with correct default state', async () => {
      const { result } = renderHook(() => useAuth())

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(true)
      expect(result.current.user).toBe(null)
      expect(result.current.session).toBe(null)
    })

    it('should set isLoading to false after initialization', async () => {
      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('User Authentication', () => {
    it('should authenticate user when session exists', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      // Mock user profile query
      const mockQueryBuilder = mockSupabase.from() as any
      mockQueryBuilder.single.mockResolvedValue({
        data: mockUser,
        error: null,
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
        expect(result.current.user).toEqual(mockUser)
        expect(result.current.session).toEqual(mockSession)
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should handle authentication error gracefully', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: mockAuthError,
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false)
        expect(result.current.user).toBe(null)
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('Sign In', () => {
    it('should sign in user successfully', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      // Mock user profile query
      const mockQueryBuilder = mockSupabase.from() as any
      mockQueryBuilder.single.mockResolvedValue({
        data: mockUser,
        error: null,
      })

      const { result } = renderHook(() => useAuth())

      let signInResult: any
      await act(async () => {
        signInResult = await result.current.signIn('test@example.com', 'password')
      })

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      })

      expect(signInResult.error).toBe(null)
    })

    it('should handle sign in error', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockAuthError,
      })

      const { result } = renderHook(() => useAuth())

      let signInResult: any
      await act(async () => {
        signInResult = await result.current.signIn('test@example.com', 'wrongpassword')
      })

      expect(signInResult.error).toEqual(mockAuthError)
    })
  })

  describe('Sign Up', () => {
    it('should sign up user successfully', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      const { result } = renderHook(() => useAuth())

      let signUpResult: any
      await act(async () => {
        signUpResult = await result.current.signUp('test@example.com', 'password', 'Test User')
      })

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
        options: {
          data: {
            full_name: 'Test User',
          },
        },
      })

      expect(signUpResult.error).toBe(null)
    })

    it('should handle sign up error', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: mockAuthError,
      })

      const { result } = renderHook(() => useAuth())

      let signUpResult: any
      await act(async () => {
        signUpResult = await result.current.signUp('test@example.com', 'password')
      })

      expect(signUpResult.error).toEqual(mockAuthError)
    })
  })

  describe('Sign Out', () => {
    it('should sign out user successfully', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signOut()
      })

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })
  })

  describe('Password Reset', () => {
    it('should request password reset successfully', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      })

      const { result } = renderHook(() => useAuth())

      let resetResult: any
      await act(async () => {
        resetResult = await result.current.resetPassword('test@example.com')
      })

      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com')
      expect(resetResult.error).toBe(null)
    })

    it('should handle password reset error', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: mockAuthError,
      })

      const { result } = renderHook(() => useAuth())

      let resetResult: any
      await act(async () => {
        resetResult = await result.current.resetPassword('test@example.com')
      })

      expect(resetResult.error).toEqual(mockAuthError)
    })
  })

  describe('Update Profile', () => {
    it('should update user profile successfully', async () => {
      // Setup initial authenticated state
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const mockQueryBuilder = mockSupabase.from() as any
      mockQueryBuilder.single.mockResolvedValue({
        data: mockUser,
        error: null,
      })

      // Mock profile update
      mockQueryBuilder.update = jest.fn().mockReturnThis()
      mockQueryBuilder.eq = jest.fn().mockReturnThis()
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { ...mockUser, full_name: 'Updated Name' },
        error: null,
      })

      const { result } = renderHook(() => useAuth())

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      let updateResult: any
      await act(async () => {
        updateResult = await result.current.updateProfile({ full_name: 'Updated Name' })
      })

      expect(updateResult.error).toBe(null)
    })
  })
})