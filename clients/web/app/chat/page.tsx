'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAuthContext } from '@/lib/providers/auth-provider';
import { Navigation } from '@/components/layout/navigation';

const ChatInterface = dynamic(() => import('@/components/chat/chat-interface').then(m => m.ChatInterface), {
  ssr: false,
  loading: () => <div className="p-6 text-sm text-muted-foreground">Loading chat...</div>
});

export default function ChatPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();

  // Redirect to homepage if not authenticated
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user)) {
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  }, [isAuthenticated, user, authLoading]);

  // Show loading state while authentication is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading chat...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show loading while redirecting
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting to homepage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        <ChatInterface />
      </div>
    </div>
  );
}