'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthContext } from '@/lib/providers/auth-provider';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignInForm = z.infer<typeof signInSchema>;

interface SignInFormProps {
  onSwitchToSignUp: () => void;
  onSwitchToResetPassword: () => void;
}

export function SignInForm({ onSwitchToSignUp, onSwitchToResetPassword }: SignInFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [rateLimiter, setRateLimiter] = useState<any>(null);
  const { signIn, isLoading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    // Dynamically import rateLimiter on client side only
    import('@/lib/utils/security').then((security) => {
      setRateLimiter(security.rateLimiter);
    });
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInForm) => {
    // Rate limiting - prevent brute force attacks (only if rateLimiter is loaded)
    if (rateLimiter && !rateLimiter.isAllowed(`signin-${data.email}`, 5, 15 * 60 * 1000)) { // 5 attempts per 15 minutes
      alert('Too many sign-in attempts. Please try again later.');
      return;
    }

    const result = await signIn(data.email, data.password);
    if (!result.error) {
      // Reset rate limiter on successful login (only if rateLimiter is loaded)
      if (rateLimiter) {
        rateLimiter.reset(`signin-${data.email}`);
      }
      router.push('/dashboard');
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to access your BeQ account
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            {...register('email')}
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              {...register('password')}
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign In
        </Button>
      </form>

      <div className="space-y-2 text-center text-sm">
        <button
          type="button"
          onClick={onSwitchToResetPassword}
          className="text-primary hover:underline"
          disabled={isLoading}
        >
          Forgot your password?
        </button>
        <div>
          <span className="text-muted-foreground">Don't have an account? </span>
          <button
            type="button"
            onClick={onSwitchToSignUp}
            className="text-primary hover:underline"
            disabled={isLoading}
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
}
