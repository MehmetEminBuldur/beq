'use client';

import { useState, useEffect } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';

// Helper function to check network connectivity
const checkNetworkConnectivity = async (): Promise<boolean> => {
  try {
    // Try to fetch a small resource from Supabase
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

interface AuthUser {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  timezone?: string;
  preferences?: Record<string, any>;
  onboarding_completed?: boolean;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    // Prevent duplicate session checks (important for development hot reloading)
    if (sessionChecked) {
      return;
    }

    // Get initial session with timeout protection and network checking
    const getInitialSession = async () => {
      try {
        setSessionChecked(true); // Mark as checked immediately to prevent duplicates

        // First, check if we can reach Supabase
        const isNetworkAvailable = await checkNetworkConnectivity();
        if (!isNetworkAvailable) {
          console.warn('🚨 Supabase is not reachable. Authentication features will be limited.');
          console.warn('This may be because:');
          console.warn('1. Supabase service is not running locally (check if docker-compose is running)');
          console.warn('2. Network connectivity issues');
          console.warn('3. Incorrect Supabase URL configuration');
          console.warn('4. Environment variables are not set correctly');
          console.warn('');
          console.warn('To fix this, ensure:');
          console.warn('- Run: docker-compose up -d (for local Supabase)');
          console.warn('- Check: .env.local file has correct SUPABASE_URL and SUPABASE_ANON_KEY');
          console.warn('- Verify: Network connectivity to Supabase');
          setIsLoading(false);
          return;
        }

        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Session check timeout')), 10000); // 10 second timeout
        });

        // Race between session check and timeout
        const sessionPromise = supabase.auth.getSession();
        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]) as any;

        if (error) {
          // Only log network-related errors, not authentication errors
          if (error.message.includes('network') || error.message.includes('fetch')) {
            console.warn('Network error during session check:', error.message);
          } else if (error.message.includes('timeout')) {
            console.warn('Session check timed out - this may be due to network issues or Supabase service being unavailable');
          } else {
            console.warn('Supabase authentication error:', error.message);
          }
          return; // Don't throw, just continue without session
        }

        if (session?.user) {
          await loadUserProfile(session.user);
          setSession(session);
          setIsAuthenticated(true);
        }
      } catch (error: any) {
        console.error('Error getting initial session:', error);
        // Handle timeout specifically
        if (error.message === 'Session check timeout') {
          console.warn('⏰ Session check timed out - continuing without session.');
          console.warn('This usually means Supabase is not running or there are network issues.');
          console.warn('For local development: Run `docker-compose up -d` to start Supabase services.');
        } else {
          console.warn('Unexpected error during session check:', error);
        }
        // Don't show toast for session check errors - they're not user-facing issues
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);

        if (session?.user) {
          await loadUserProfile(session.user);
          setSession(session);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setSession(null);
          setIsAuthenticated(false);
        }

        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [sessionChecked]);

  const loadUserProfile = async (authUser: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      // profile will be null if no row is found (PGRST116), but will have proper typing if found
      const userData: AuthUser = {
        id: authUser.id,
        email: authUser.email,
        full_name: (profile as any)?.full_name || authUser.user_metadata?.full_name,
        avatar_url: (profile as any)?.avatar_url || authUser.user_metadata?.avatar_url,
        timezone: (profile as any)?.timezone || 'UTC',
        preferences: (profile as any)?.preferences || {},
        onboarding_completed: (profile as any)?.onboarding_completed || false,
      };

      setUser(userData);
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Still set basic user data even if profile fetch fails
      setUser({
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name,
        avatar_url: authUser.user_metadata?.avatar_url,
        timezone: 'UTC',
        preferences: {},
        onboarding_completed: false,
      });
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success('Successfully signed in!');
      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      const authError = error as AuthError;
      toast.error(authError.message || 'Failed to sign in');
      return { data: null, error: authError };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth?verified=true`,
        },
      });

      if (error) throw error;

      // Check if email confirmation is required
      if (data.user && !data.session) {
        toast.success(
          'Account created! Please check your email and click the verification link to activate your account.',
          { duration: 6000 }
        );
      } else if (data.session) {
        // Auto-confirmed (e.g., in development)
        toast.success('Account created and verified! Welcome to BeQ!');
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      const authError = error as AuthError;

      // Provide more specific error messages
      let errorMessage = 'Failed to create account';
      if (authError.message.includes('already registered')) {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      } else if (authError.message.includes('invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (authError.message.includes('Password')) {
        errorMessage = authError.message;
      }

      toast.error(errorMessage);
      return { data: null, error: authError };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast.success('Successfully signed out');

      // Redirect to login page after successful sign out
      if (typeof window !== 'undefined') {
        window.location.href = '/auth';
      }
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success('Password reset email sent!');
      return { error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      const authError = error as AuthError;
      toast.error(authError.message || 'Failed to send reset email');
      return { error: authError };
    }
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      const profileUpdates: any = {
        id: user.id,
        updated_at: new Date().toISOString(),
      };

      // Only include fields that are being updated
      if (updates.full_name !== undefined) profileUpdates.full_name = updates.full_name;
      if (updates.avatar_url !== undefined) profileUpdates.avatar_url = updates.avatar_url;
      if (updates.timezone !== undefined) profileUpdates.timezone = updates.timezone;
      if (updates.preferences !== undefined) profileUpdates.preferences = updates.preferences;
      if (updates.onboarding_completed !== undefined) profileUpdates.onboarding_completed = updates.onboarding_completed;

      const { error } = await supabase
        .from('profiles')
        .upsert(profileUpdates);

      if (error) throw error;

      // Update local state
      setUser(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Profile updated successfully');
      return { error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error('Failed to update profile');
      return { error: error as Error };
    }
  };

  return {
    isAuthenticated,
    isLoading,
    user,
    session,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
  };
}