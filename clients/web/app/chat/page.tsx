'use client';

import dynamic from 'next/dynamic';
import { useAuthContext } from '@/lib/providers/auth-provider';
import { Navigation } from '@/components/layout/navigation';

const ChatInterface = dynamic(() => import('@/components/chat/chat-interface').then(m => m.ChatInterface), {
  ssr: false,
  loading: () => <div className="p-6 text-sm text-muted-foreground">Loading chat...</div>
});

export default function ChatPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();

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

  // Show login prompt if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900 mx-auto mb-4">
                  <svg className="h-8 w-8 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Authentication Required</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Please sign in to access the chat</p>
                <button onClick={() => window.location.href = '/auth'} className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700">
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="flex h-[calc(100vh-64px)]">
        <ChatInterface />
      </div>
    </div>
  );
}