'use client';

import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { QueryProvider } from '@/lib/providers/query-provider';
import { AuthProvider } from '@/lib/providers/auth-provider';
import { AppStateProviderWrapper } from '@/lib/providers/app-state-provider';
import { ServiceWorkerProvider, OfflineIndicator } from '@/components/providers/service-worker-provider';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <div suppressHydrationWarning>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
        suppressHydrationWarning
      >
      <ServiceWorkerProvider>
        <OfflineIndicator />
        <QueryProvider>
          <AuthProvider>
            <AppStateProviderWrapper>
              <div className="relative flex min-h-screen flex-col">
                <div className="flex-1">{children}</div>
              </div>
            </AppStateProviderWrapper>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
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
          </AuthProvider>
        </QueryProvider>
      </ServiceWorkerProvider>
      </ThemeProvider>
    </div>
  );
}