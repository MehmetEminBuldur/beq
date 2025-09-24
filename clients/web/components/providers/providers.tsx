'use client';

import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { QueryProvider } from '@/lib/providers/query-provider';
import { AuthProvider } from '@/lib/providers/auth-provider';
import { AppStateProviderWrapper } from '@/lib/providers/app-state-provider';
import { ServiceWorkerProvider } from '@/components/providers/service-worker-provider';
import { useState, useEffect } from 'react';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Delay mounting to ensure proper hydration
    const timeoutId = setTimeout(() => {
      setMounted(true);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <QueryProvider>
      <AuthProvider>
        <AppStateProviderWrapper>
          {!mounted ? (
            <div className="relative flex min-h-screen flex-col">
              <div className="flex-1">{children}</div>
            </div>
          ) : (
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <ServiceWorkerProvider>
                <div className="relative flex min-h-screen flex-col">
                  <div className="flex-1">{children}</div>
                </div>
              </ServiceWorkerProvider>
            </ThemeProvider>
          )}
          <Toaster
            position="top-right"
            containerClassName="z-[9999]"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--background)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                zIndex: 9999,
              },
              success: {
                iconTheme: {
                  primary: 'var(--success)',
                  secondary: 'var(--success-foreground)',
                },
              },
              error: {
                iconTheme: {
                  primary: 'var(--destructive)',
                  secondary: 'var(--destructive-foreground)',
                },
              },
            }}
          />
        </AppStateProviderWrapper>
      </AuthProvider>
    </QueryProvider>
  );
}