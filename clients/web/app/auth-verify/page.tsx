'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/lib/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { Loader2, CheckCircle, User } from 'lucide-react';
import { Navigation } from '@/components/layout/navigation';
import { toast } from 'react-hot-toast';

export default function AuthVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthContext();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  // Handle email verification and redirect to onboarding
  useEffect(() => {
    const handleVerification = async () => {
      const verified = searchParams?.get('verified');
      const onboarding = searchParams?.get('onboarding');
      
      if (verified === 'true') {
        setVerificationSuccess(true);
        toast.success('Email verified successfully! Welcome to BeQ!');
        
        // If this is from signup (onboarding=true), redirect to onboarding
        if (onboarding === 'true') {
          setTimeout(() => {
            router.replace('/onboarding');
          }, 2000);
        } else {
          // If this is from signin or other verification, check onboarding status
          setTimeout(() => {
            checkOnboardingAndRedirect();
          }, 2000);
        }
      }
      
      setIsVerifying(false);
    };

    const checkOnboardingAndRedirect = async () => {
      if (!isAuthenticated || !user?.id) {
        router.replace('/auth');
        return;
      }

      try {
        // Check if user has completed onboarding
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single();

        if (!error && (profile as any)?.onboarding_completed) {
          // User has completed onboarding, go to dashboard
          router.replace('/dashboard');
        } else {
          // User needs to complete onboarding
          router.replace('/onboarding');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // Default to onboarding if there's an error
        router.replace('/onboarding');
      }
    };

    handleVerification();
  }, [searchParams, router, isAuthenticated, user?.id]);

  // Create user profile if doesn't exist (for new signups)
  useEffect(() => {
    const createProfileIfNeeded = async () => {
      if (!isAuthenticated || !user?.id) return;

      try {
        // Check if profile exists
        const { error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        // If profile doesn't exist, create it
        if (checkError && checkError.code === 'PGRST116') {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              full_name: user.full_name,
              onboarding_completed: false,
              timezone: 'UTC',
              preferences: {},
            } as any);

          if (insertError) {
            console.error('Error creating profile:', insertError);
          } else {
            console.log('Profile created for new user');
          }
        }
      } catch (error) {
        console.error('Error in profile creation:', error);
      }
    };

    createProfileIfNeeded();
  }, [isAuthenticated, user?.id, user?.email, user?.full_name]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
          <div className="w-full max-w-md space-y-8 text-center">
            <div className="h-16 w-16 mx-auto text-primary">
              <Loader2 className="h-16 w-16 animate-spin" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Verifying your account...
              </h1>
              <p className="mt-2 text-gray-600">
                Please wait while we set up your account.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (verificationSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
          <div className="w-full max-w-md space-y-8 text-center">
            <div className="h-16 w-16 mx-auto text-green-500">
              <CheckCircle className="h-16 w-16" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Welcome to BeQ!
              </h1>
              <p className="mt-2 text-gray-600">
                Your email has been verified successfully. Redirecting you to get started...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback for cases where verification parameters are missing
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="h-16 w-16 mx-auto text-primary">
            <User className="h-16 w-16" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Account Verification
            </h1>
            <p className="mt-2 text-gray-600">
              If you&apos;re seeing this page, please check your email for the verification link or try signing in again.
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/auth')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
