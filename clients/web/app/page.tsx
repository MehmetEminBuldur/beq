'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MessageCircle, Calendar, Target, Brain, Sparkles } from 'lucide-react';
import { ChatInterface } from '@/components/chat/chat-interface';
import { Hero } from '@/components/landing/hero';
import { FeatureCard } from '@/components/landing/feature-card';
import { Navigation } from '@/components/layout/navigation';
import { useAuthContext } from '@/lib/providers/auth-provider';

const features = [
  {
    icon: MessageCircle,
    title: 'Conversational AI',
    description: 'Natural language interaction for intelligent scheduling and task management.',
  },
  {
    icon: Target,
    title: 'Bricks & Quantas',
    description: 'Break down complex goals into manageable tasks with AI-powered organization.',
  },
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description: 'AI-driven optimization considering your health, preferences, and constraints.',
  },
  {
    icon: Brain,
    title: 'Learning Resources',
    description: 'Curated content and recommendations tailored to your goals and interests.',
  },
];

export default function HomePage() {
  const { isAuthenticated, isLoading, user } = useAuthContext();
  const [showChat, setShowChat] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  // Prevent hydration mismatch by ensuring we only render dynamic content on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only redirect after client-side hydration is complete
    if (isClient && !isLoading) {
      if (isAuthenticated) {
        router.push('/dashboard');
      }
      // For unauthenticated users, we'll show the landing page instead of redirecting
    }
  }, [isAuthenticated, isLoading, router, isClient]);

  // Show loading state during SSR and initial hydration
  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-center">
            <div className="w-8 h-8 bg-primary-600 rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading BeQ...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  // Authenticated users will be redirected to /dashboard

  // Show chat interface if authenticated and chat is requested
  if (showChat) {
    return (
      <div className="flex h-screen flex-col">
        <Navigation />
        <div className="flex-1 overflow-hidden">
          <ChatInterface />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation />
      
      {/* Hero Section */}
      <Hero
        onStartChat={() => setShowChat(true)}
        isAuthenticated={isAuthenticated}
        onSignUp={() => router.push('/auth')}
        onSignIn={() => router.push('/auth')}
      />
      
      {/* Features Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="text-base font-semibold leading-7 text-primary-600 dark:text-primary-400">
              Core Features
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Everything you need for efficient life management
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              BeQ combines AI intelligence with proven productivity methodologies to help you build a more purposeful life.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none"
          >
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2 xl:grid-cols-4">
              {features.map((feature, index) => (
                <FeatureCard
                  key={feature.title}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  delay={index * 0.1}
                />
              ))}
            </dl>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative isolate overflow-hidden bg-gray-900 px-6 py-24 shadow-2xl sm:rounded-3xl sm:px-24 xl:py-32">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {isAuthenticated ? 'Continue your journey' : 'Ready to transform your life?'}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-300">
            {isAuthenticated
              ? 'Keep building your purposeful life with AI-powered organization and smart scheduling.'
              : 'Join thousands of users who have already started their journey toward a more organized and fulfilling life with BeQ.'
            }
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            {isAuthenticated ? (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowChat(true)}
                  className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Continue Planning
                </motion.button>
                <a
                  href="/docs"
                  className="text-sm font-semibold leading-6 text-white hover:text-gray-300 transition-colors"
                >
                  Learn more <span aria-hidden="true">→</span>
                </a>
              </>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/auth')}
                  className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Get Started Free
                </motion.button>
                <a
                  href="/docs"
                  className="text-sm font-semibold leading-6 text-white hover:text-gray-300 transition-colors"
                >
                  Learn more <span aria-hidden="true">→</span>
                </a>
              </>
            )}
          </div>
        </motion.div>

        {/* Background decoration */}
        <div className="absolute -top-24 right-0 -z-10 transform-gpu blur-3xl" aria-hidden="true">
          <div
            className="aspect-[1404/767] w-[87.75rem] bg-gradient-to-r from-[#80caff] to-[#4f46e5] opacity-25"
            style={{
              clipPath:
                'polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)',
            }}
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © 2024 BeQ - Bricks and Quantas. All rights reserved.
            </p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
              Architecting a More Purposeful Humanity
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
