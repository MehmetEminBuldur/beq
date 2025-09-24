'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface AuthUser {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  timezone?: string;
  preferences?: Record<string, any>;
  onboarding_completed?: boolean;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  session: any;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<{ error: any }>;
}

// Default context value for server-side rendering
const defaultAuthContext: AuthContextType = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  session: null,
  signIn: async () => ({ data: null, error: new Error('Auth not initialized') }),
  signUp: async () => ({ data: null, error: new Error('Auth not initialized') }),
  signOut: async () => {},
  resetPassword: async () => ({ error: new Error('Auth not initialized') }),
  updateProfile: async () => ({ error: new Error('Auth not initialized') }),
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
}

// Client-only auth provider component
function ClientAuthProvider({ children }: AuthProviderProps) {
  const { useAuth } = require('@/lib/hooks/use-auth');
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth || defaultAuthContext}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Add a small delay to prevent rapid re-mounting during development
    const timeoutId = setTimeout(() => {
      setMounted(true);
    }, 50);

    return () => clearTimeout(timeoutId);
  }, []);

  // Show loading state while mounting
  if (!mounted) {
    return (
      <AuthContext.Provider value={defaultAuthContext}>
        {children}
      </AuthContext.Provider>
    );
  }

  return <ClientAuthProvider>{children}</ClientAuthProvider>;
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  // Context should never be undefined since we always provide a default value
  return context || defaultAuthContext;
}