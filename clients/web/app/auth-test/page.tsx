'use client';

import { AuthTester } from '@/components/auth/auth-tester';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Navigation } from '@/components/layout/navigation';

export default function AuthTestPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navigation />

        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">
              🔐 Authentication Test Center
            </h1>
            <p className="text-muted-foreground mt-2">
              Comprehensive testing of login sessions across all pages and scenarios.
            </p>
          </div>

          <div className="space-y-6">
            <AuthTester />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">🧱 Bricks Page</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Test authentication on the bricks management page.
                </p>
                <a
                  href="/bricks"
                  className="text-primary hover:underline text-sm"
                >
                  Go to Bricks →
                </a>
              </div>

              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">💬 Chat Page</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Test authentication on the AI chat page.
                </p>
                <a
                  href="/chat"
                  className="text-primary hover:underline text-sm"
                >
                  Go to Chat →
                </a>
              </div>

              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">📅 Calendar Page</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Test authentication on the calendar page.
                </p>
                <a
                  href="/calendar"
                  className="text-primary hover:underline text-sm"
                >
                  Go to Calendar →
                </a>
              </div>

              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">⚙️ Settings Page</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Test authentication on the settings page.
                </p>
                <a
                  href="/settings"
                  className="text-primary hover:underline text-sm"
                >
                  Go to Settings →
                </a>
              </div>

              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">📊 Dashboard</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Test authentication on the main dashboard.
                </p>
                <a
                  href="/dashboard"
                  className="text-primary hover:underline text-sm"
                >
                  Go to Dashboard →
                </a>
              </div>

              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">🔄 Page Refresh Test</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Test if authentication persists after page refresh.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-primary hover:underline text-sm"
                >
                  Refresh Page →
                </button>
              </div>
            </div>

            <div className="bg-muted/50 p-6 rounded-lg">
              <h3 className="font-medium mb-3">🎯 Authentication Testing Guide</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium text-sm mb-2">✅ What Should Work:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Login persists across page navigation</li>
                    <li>• Session survives page refreshes</li>
                    <li>• All user data loads correctly</li>
                    <li>• Protected routes redirect properly</li>
                    <li>• Logout clears session completely</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-2">🚨 Common Issues:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Supabase connection problems</li>
                    <li>• Expired or invalid tokens</li>
                    <li>• Database permission issues</li>
                    <li>• Network connectivity problems</li>
                    <li>• Browser storage/cookies disabled</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
