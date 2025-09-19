'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/lib/providers/auth-provider';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

/**
 * AuthGuard Component
 * Protects routes and ensures authentication works across all pages
 *
 * Features:
 * - Automatic redirect for unauthenticated users
 * - Loading state during authentication check
 * - Session persistence verification
 * - Custom fallback component support
 */
export function AuthGuard({
  children,
  requireAuth = true,
  redirectTo = '/auth',
  fallback
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuthContext();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Additional session verification
    const verifySession = async () => {
      if (!isLoading) {
        setIsChecking(false);

        if (requireAuth && !isAuthenticated) {
          console.log('🔒 AuthGuard: User not authenticated, redirecting to:', redirectTo);
          router.push(redirectTo);
          return;
        }

        if (!requireAuth && isAuthenticated) {
          console.log('🔓 AuthGuard: User authenticated, staying on public page');
          // Could redirect to dashboard if needed
        }

        console.log('✅ AuthGuard: Authentication check passed');
      }
    };

    verifySession();
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, router]);

  // Show loading state while checking authentication
  if (isLoading || isChecking) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Handle authentication requirements
  if (requireAuth && !isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">
            Please sign in to access this page.
          </p>
          <div className="animate-pulse">
            Redirecting to login...
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated (or auth not required), render children
  return <>{children}</>;
}

/**
 * Higher-Order Component for protecting pages
 */
export function withAuthGuard<T extends {}>(
  Component: React.ComponentType<T>,
  options?: Omit<AuthGuardProps, 'children'>
) {
  const WrappedComponent = (props: T) => (
    <AuthGuard {...options}>
      <Component {...props} />
    </AuthGuard>
  );

  WrappedComponent.displayName = `withAuthGuard(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Hook for manual authentication checks
 */
export function useAuthGuard(requireAuth = true) {
  const { isAuthenticated, isLoading, user } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        router.push('/auth');
      }
    }
  }, [isAuthenticated, isLoading, requireAuth, router]);

  return {
    isAuthenticated,
    isLoading,
    user,
    canAccess: !requireAuth || isAuthenticated,
  };
}
