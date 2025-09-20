import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers/providers';
import { logEnvironmentValidation } from '@/lib/utils/env-validation';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

// Validate environment variables on startup
if (typeof window === 'undefined') {
  logEnvironmentValidation();
}

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
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/apple-touch-icon.svg',
  },
  manifest: '/site.webmanifest',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
