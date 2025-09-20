'use client';

import { useState, useEffect } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';

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

  useEffect(() => {
    // Get initial session with timeout
    const getInitialSession = async () => {
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session check timeout')), 5000)
        );

        const sessionPromise = supabase.auth.getSession();
        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]) as any;

        if (error) throw error;

        if (session?.user) {
          await loadUserProfile(session.user);
          setSession(session);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        // Don't show error toast for timeout/network issues on first load
        if (!error.message.includes('timeout')) {
          toast.error('Failed to load authentication state');
        }
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
  }, []);

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

      const userData: AuthUser = {
        id: authUser.id,
        email: authUser.email,
        full_name: profile?.full_name || authUser.user_metadata?.full_name,
        avatar_url: profile?.avatar_url || authUser.user_metadata?.avatar_url,
        timezone: profile?.timezone || 'UTC',
        preferences: profile?.preferences || {},
        onboarding_completed: profile?.onboarding_completed || false,
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