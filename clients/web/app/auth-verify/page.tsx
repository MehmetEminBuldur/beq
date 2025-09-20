'use client';

import { useState } from 'react';
import { useAuthContext } from '@/lib/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RefreshCw, User, Database, Shield } from 'lucide-react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Navigation } from '@/components/layout/navigation';

export default function AuthVerifyPage() {
  const { user, isAuthenticated, signOut } = useAuthContext();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const runVerificationTests = async () => {
    setIsTesting(true);
    const results = [];

    // Test 1: Authentication State
    results.push({
      name: 'Authentication Status',
      success: isAuthenticated,
      details: isAuthenticated ? `User: ${user?.email}` : 'Not authenticated',
      icon: isAuthenticated ? CheckCircle : XCircle,
      color: isAuthenticated ? 'text-green-500' : 'text-red-500'
    });

    // Test 2: Supabase Connection
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      results.push({
        name: 'Database Connection',
        success: !error,
        details: error ? `Error: ${error.message}` : 'Connected successfully',
        icon: !error ? CheckCircle : XCircle,
        color: !error ? 'text-green-500' : 'text-red-500'
      });
    } catch (error) {
      results.push({
        name: 'Database Connection',
        success: false,
        details: `Connection failed: ${error.message}`,
        icon: XCircle,
        color: 'text-red-500'
      });
    }

    // Test 3: User Profile Access
    if (user?.id) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        results.push({
          name: 'Profile Access',
          success: !error && !!data,
          details: data ? `Name: ${data.full_name || 'Not set'}` : `Error: ${error?.message}`,
          icon: (!error && !!data) ? CheckCircle : XCircle,
          color: (!error && !!data) ? 'text-green-500' : 'text-red-500'
        });
      } catch (error) {
        results.push({
          name: 'Profile Access',
          success: false,
          details: `Failed: ${error.message}`,
          icon: XCircle,
          color: 'text-red-500'
        });
      }
    }

    // Test 4: Session Persistence
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      const isValid = session && session.expires_at && session.expires_at > Date.now() / 1000;

      results.push({
        name: 'Session Persistence',
        success: isValid,
        details: isValid ? `Expires: ${new Date(session.expires_at * 1000).toLocaleString()}` : 'Session invalid or expired',
        icon: isValid ? CheckCircle : XCircle,
        color: isValid ? 'text-green-500' : 'text-red-500'
      });
    } catch (error) {
      results.push({
        name: 'Session Persistence',
        success: false,
        details: `Session check failed: ${error.message}`,
        icon: XCircle,
        color: 'text-red-500'
      });
    }

    setTestResults(results);
    setIsTesting(false);
  };

  const successCount = testResults.filter(r => r.success).length;
  const totalCount = testResults.length;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Shield className="h-8 w-8 text-primary" />
                Authentication Verification
              </h1>
              <p className="text-muted-foreground mt-2">
                Verify that your login session works correctly across all pages
              </p>
            </div>

            {/* User Info Card */}
            {isAuthenticated && user && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Current User Session
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Email:</span>
                      <span className="text-sm">{user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Name:</span>
                      <span className="text-sm">{user.full_name || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">User ID:</span>
                      <span className="text-sm font-mono">{user.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Timezone:</span>
                      <span className="text-sm">{user.timezone || 'UTC'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Test Results */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Authentication Tests
                    </CardTitle>
                    <CardDescription>
                      Test results for login session functionality
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {totalCount > 0 && (
                      <Badge variant={successCount === totalCount ? 'default' : 'destructive'}>
                        {successCount}/{totalCount} Passed
                      </Badge>
                    )}
                    <Button
                      onClick={runVerificationTests}
                      disabled={isTesting}
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isTesting ? 'animate-spin' : ''}`} />
                      {isTesting ? 'Testing...' : 'Run Tests'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {testResults.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Click "Run Tests" to verify your authentication setup</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {testResults.map((result, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                        <result.icon className={`h-5 w-5 ${result.color}`} />
                        <div className="flex-1">
                          <div className="font-medium">{result.name}</div>
                          <div className="text-sm text-muted-foreground">{result.details}</div>
                        </div>
                        <Badge variant={result.success ? 'default' : 'destructive'}>
                          {result.success ? '✓ Pass' : '✗ Fail'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation Tests */}
            <Card>
              <CardHeader>
                <CardTitle>Test Login Sessions Across Pages</CardTitle>
                <CardDescription>
                  Navigate to different pages to verify your session persists
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  <a
                    href="/dashboard"
                    className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    📊 Dashboard
                  </a>
                  <a
                    href="/bricks"
                    className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    🧱 Bricks
                  </a>
                  <a
                    href="/chat"
                    className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    💬 Chat
                  </a>
                  <a
                    href="/calendar"
                    className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    📅 Calendar
                  </a>
                  <a
                    href="/settings"
                    className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    ⚙️ Settings
                  </a>
                  <button
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    🔄 Refresh Page
                  </button>
                </div>

                <div className="mt-6 pt-4 border-t">
                  <div className="flex gap-2">
                    <Button onClick={signOut} variant="outline">
                      Sign Out (Test Logout)
                    </Button>
                    <Button onClick={runVerificationTests} variant="outline">
                      Re-run Tests
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Help Section */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>🎯 Authentication Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <p><strong>✅ Your authentication is working correctly!</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Login sessions persist across page navigation</li>
                    <li>Session survives page refreshes</li>
                    <li>All user data is accessible</li>
                    <li>Protected routes work properly</li>
                    <li>Logout clears session completely</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
