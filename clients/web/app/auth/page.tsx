'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SignInForm } from '@/components/auth/sign-in-form';
import { SignUpForm } from '@/components/auth/sign-up-form';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { Navigation } from '@/components/layout/navigation';
import { toast } from 'react-hot-toast';

type AuthMode = 'signin' | 'signup' | 'reset';

function AuthContent() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const searchParams = useSearchParams();

  const switchToSignIn = () => setMode('signin');
  const switchToSignUp = () => setMode('signup');
  const switchToResetPassword = () => setMode('reset');

  useEffect(() => {
    const verified = searchParams?.get('verified');
    if (verified === 'true') {
      toast.success('Email verified successfully! You can now sign in to your account.');
      setMode('signin');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-primary">BeQ</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Life Management Powered by AI
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
            {mode === 'signin' && (
              <SignInForm
                onSwitchToSignUp={switchToSignUp}
                onSwitchToResetPassword={switchToResetPassword}
              />
            )}

            {mode === 'signup' && (
              <SignUpForm onSwitchToSignIn={switchToSignIn} />
            )}

            {mode === 'reset' && (
              <ResetPasswordForm onSwitchToSignIn={switchToSignIn} />
            )}
          </div>

          <div className="text-center text-xs text-muted-foreground">
            <p>Secure authentication powered by Supabase</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
