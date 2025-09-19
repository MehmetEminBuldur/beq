'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/lib/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

/**
 * AuthTester Component
 * Comprehensive testing component for authentication across all pages
 * Can be added to any page to verify authentication state
 */
export function AuthTester() {
  const { isAuthenticated, isLoading, user, signIn, signOut } = useAuthContext();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const runAuthTests = async () => {
    setIsRunningTests(true);
    const results: TestResult[] = [];

    // Test 1: Authentication State
    results.push({
      name: 'Authentication State',
      status: isAuthenticated ? 'success' : 'error',
      message: isAuthenticated ? 'User is authenticated' : 'User is not authenticated',
      details: isAuthenticated ? `User ID: ${user?.id}, Email: ${user?.email}` : 'No active session'
    });

    // Test 2: Session Persistence
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    results.push({
      name: 'Session Persistence',
      status: session ? 'success' : sessionError ? 'error' : 'warning',
      message: session ? 'Session persists across page loads' : 'Session not found',
      details: sessionError ? `Error: ${sessionError.message}` : session ?
        `Expires: ${new Date(session.expires_at! * 1000).toLocaleString()}` : 'No session data'
    });

    // Test 3: Profile Data Access
    if (user?.id) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      results.push({
        name: 'Profile Data Access',
        status: profile ? 'success' : profileError ? 'error' : 'warning',
        message: profile ? 'Profile data accessible' : 'Profile data not accessible',
        details: profileError ? `Error: ${profileError.message}` : profile ?
          `Name: ${profile.full_name || 'Not set'}, Timezone: ${profile.timezone}` : 'No profile found'
      });
    }

    // Test 4: Database Access (Bricks)
    if (user?.id) {
      const { data: bricks, error: bricksError } = await supabase
        .from('bricks')
        .select('*')
        .eq('user_id', user.id)
        .limit(5);

      results.push({
        name: 'Database Access - Bricks',
        status: bricks !== null ? 'success' : bricksError ? 'error' : 'warning',
        message: bricks ? `Bricks accessible (${bricks.length} found)` : 'Bricks not accessible',
        details: bricksError ? `Error: ${bricksError.message}` : bricks ?
          `First brick: ${bricks[0]?.title || 'No bricks'}` : 'No bricks data'
      });
    }

    // Test 5: Database Access (Conversations)
    if (user?.id) {
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .limit(5);

      results.push({
        name: 'Database Access - Conversations',
        status: conversations !== null ? 'success' : convError ? 'error' : 'warning',
        message: conversations ? `Conversations accessible (${conversations.length} found)` : 'Conversations not accessible',
        details: convError ? `Error: ${convError.message}` : conversations ?
          `Latest conversation: ${conversations[0]?.title || 'No conversations'}` : 'No conversations data'
      });
    }

    // Test 6: Calendar Events Access
    if (user?.id) {
      const { data: events, error: eventsError } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .limit(5);

      results.push({
        name: 'Database Access - Calendar Events',
        status: events !== null ? 'success' : eventsError ? 'error' : 'warning',
        message: events ? `Calendar events accessible (${events.length} found)` : 'Calendar events not accessible',
        details: eventsError ? `Error: ${eventsError.message}` : events ?
          `First event: ${events[0]?.title || 'No events'}` : 'No events data'
      });
    }

    // Test 7: Messages Access
    if (user?.id) {
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .limit(5);

      results.push({
        name: 'Database Access - Messages',
        status: messages !== null ? 'success' : msgError ? 'error' : 'warning',
        message: messages ? `Messages accessible (${messages.length} found)` : 'Messages not accessible',
        details: msgError ? `Error: ${msgError.message}` : messages ?
          `Latest message: ${messages[0]?.content?.substring(0, 50) || 'No messages'}...` : 'No messages data'
      });
    }

    // Test 8: Supabase Connection
    try {
      const { error: healthError } = await supabase.from('profiles').select('id').limit(1);
      results.push({
        name: 'Supabase Connection',
        status: !healthError ? 'success' : 'error',
        message: !healthError ? 'Supabase connection healthy' : 'Supabase connection issues',
        details: healthError ? `Connection error: ${healthError.message}` : 'Connection successful'
      });
    } catch (error) {
      results.push({
        name: 'Supabase Connection',
        status: 'error',
        message: 'Supabase connection failed',
        details: `Error: ${error.message}`
      });
    }

    setTestResults(results);
    setIsRunningTests(false);
  };

  useEffect(() => {
    if (!isLoading) {
      runAuthTests();
    }
  }, [isAuthenticated, isLoading]);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const successCount = testResults.filter(r => r.status === 'success').length;
  const totalCount = testResults.length;
  const overallStatus = isAuthenticated && successCount === totalCount ? 'success' :
                       isAuthenticated && successCount > 0 ? 'warning' : 'error';

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              🔐 Authentication Status
              {getStatusIcon(overallStatus)}
            </CardTitle>
            <CardDescription>
              Login session verification across all pages
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={runAuthTests}
              disabled={isRunningTests}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRunningTests ? 'animate-spin' : ''}`} />
              Re-test
            </Button>
            <Button
              onClick={() => setShowDetails(!showDetails)}
              variant="ghost"
              size="sm"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <h3 className="font-medium">Overall Status</h3>
            <p className="text-sm text-muted-foreground">
              {isAuthenticated ? 'Authenticated and functional' : 'Not authenticated'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {successCount}/{totalCount}
            </div>
            <p className="text-sm text-muted-foreground">Tests passed</p>
          </div>
        </div>

        {/* User Info */}
        {isAuthenticated && user && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">👤 Current User</h4>
            <div className="text-sm text-green-700 space-y-1">
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Name:</strong> {user.full_name || 'Not set'}</p>
              <p><strong>Timezone:</strong> {user.timezone || 'UTC'}</p>
            </div>
          </div>
        )}

        {/* Test Results */}
        {showDetails && (
          <div className="space-y-2">
            <h4 className="font-medium">📋 Detailed Test Results</h4>
            {testResults.map((result, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{result.name}</span>
                    {getStatusBadge(result.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{result.message}</p>
                  {result.details && (
                    <p className="text-xs text-muted-foreground font-mono">{result.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-4 border-t">
          {isAuthenticated ? (
            <Button onClick={signOut} variant="outline">
              Sign Out (Test Logout)
            </Button>
          ) : (
            <Button onClick={() => window.location.href = '/auth'}>
              Go to Login
            </Button>
          )}
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
          >
            Test Page Refresh
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded">
          <p><strong>🎯 What this tests:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Authentication state persistence</li>
            <li>Database access for all user data</li>
            <li>Session handling across page refreshes</li>
            <li>Profile data loading</li>
            <li>Supabase connection health</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
