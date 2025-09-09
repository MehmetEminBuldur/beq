import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { QueryProvider } from '@/lib/providers/query-provider';
import { AuthProvider } from '@/lib/providers/auth-provider';
import { AppStateProviderWrapper } from '@/lib/providers/app-state-provider';
import { ServiceWorkerProvider, OfflineIndicator } from '@/components/providers/service-worker-provider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'BeQ - Bricks and Quantas',
    template: '%s | BeQ - Efficient Life Management',
  },
  description: 'AI-powered life management application that transcends traditional calendar planning by serving as a dynamic and intuitive personal assistant.',
  keywords: [
    'life management',
    'AI assistant',
    'productivity',
    'calendar',
    'scheduling',
    'personal development',
    'task management',
    'bricks and quantas'
  ],
  authors: [{ name: 'BeQ Team' }],
  creator: 'BeQ Team',
  publisher: 'BeQ',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://beq.app',
    title: 'BeQ - Bricks and Quantas',
    description: 'Architecting a More Purposeful Humanity through AI-powered life management.',
    siteName: 'BeQ',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'BeQ - Efficient Life Management',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BeQ - Bricks and Quantas',
    description: 'AI-powered life management for a more purposeful life.',
    images: ['/og-image.png'],
    creator: '@beq_app',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-verification-code',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
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
      </body>
    </html>
  );
}
