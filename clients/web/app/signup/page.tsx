'use client';

import { useRouter } from 'next/navigation';
import { SignUpForm } from '@/components/auth/sign-up-form';
import { Navigation } from '@/components/layout/navigation';

export default function SignUpPage() {
  const router = useRouter();

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
            <SignUpForm onSwitchToSignIn={() => router.push('/auth')} />
          </div>

          <div className="text-center text-xs text-muted-foreground">
            <p>Secure authentication powered by Supabase</p>
          </div>
        </div>
      </div>
    </div>
  );
}
