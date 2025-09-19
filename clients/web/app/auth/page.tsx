'use client';

import { useState } from 'react';
import { SignInForm } from '@/components/auth/sign-in-form';
import { SignUpForm } from '@/components/auth/sign-up-form';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

type AuthMode = 'signin' | 'signup' | 'reset';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('signin');

  const switchToSignIn = () => setMode('signin');
  const switchToSignUp = () => setMode('signup');
  const switchToResetPassword = () => setMode('reset');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
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
  );
}
