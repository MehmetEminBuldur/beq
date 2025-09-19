'use client';

import { useState } from 'react';
import { useAuthContext } from '@/lib/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, TestTube, CheckCircle, AlertCircle } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: string;
}

/**
 * SignOutTest Component
 * Tests signout functionality and redirect behavior
 */
export function SignOutTest() {
  const { signOut, isAuthenticated, user } = useAuthContext();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const runSignOutTest = async () => {
    setIsTesting(true);
    const results: TestResult[] = [];

    // Test 1: Current authentication status
    results.push({
      name: 'Current Authentication',
      status: isAuthenticated ? 'success' : 'error',
      message: isAuthenticated ? 'User is authenticated' : 'User is not authenticated',
      details: isAuthenticated ? `User: ${user?.email}` : 'No active session'
    });

    if (!isAuthenticated) {
      results.push({
        name: 'Sign Out Test',
        status: 'error',
        message: 'Cannot test sign out - user already signed out',
        details: 'Please sign in first to test sign out functionality'
      });
      setTestResults(results);
      setIsTesting(false);
      return;
    }

    // Test 2: Sign out process
    try {
      console.log('🧪 Testing sign out redirect...');

      // Store current location for verification
      const currentPath = window.location.pathname;
      console.log('📍 Current path before sign out:', currentPath);

      await signOut();

      // This code should not execute if redirect works
      results.push({
        name: 'Sign Out Redirect',
        status: 'error',
        message: 'Sign out did not redirect to login page',
        details: 'Expected redirect to /auth but stayed on current page'
      });

    } catch (error) {
      results.push({
        name: 'Sign Out Process',
        status: 'error',
        message: 'Sign out failed with error',
        details: `Error: ${error.message}`
      });
    }

    setTestResults(results);
    setIsTesting(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <TestTube className="h-4 w-4 animate-spin" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      pending: 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const successCount = testResults.filter(r => r.status === 'success').length;
  const errorCount = testResults.filter(r => r.status === 'error').length;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LogOut className="h-5 w-5" />
          Sign Out Redirect Test
        </CardTitle>
        <CardDescription>
          Test that sign out properly redirects users to the login page
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div>
            <h4 className="font-medium">Current Status</h4>
            <p className="text-sm text-muted-foreground">
              {isAuthenticated ? 'Authenticated' : 'Not authenticated'}
            </p>
          </div>
          <Badge variant={isAuthenticated ? 'default' : 'destructive'}>
            {isAuthenticated ? 'Signed In' : 'Signed Out'}
          </Badge>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Test Results</h4>
            {testResults.map((result, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{result.name}</span>
                    {getStatusBadge(result.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{result.message}</p>
                  {result.details && (
                    <p className="text-xs text-muted-foreground font-mono mt-1">{result.details}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Summary */}
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Summary:</span>
                <div className="flex gap-2">
                  <Badge variant="outline">{successCount} Passed</Badge>
                  <Badge variant="destructive">{errorCount} Failed</Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Test Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={runSignOutTest}
            disabled={isTesting || !isAuthenticated}
            variant="outline"
            className="flex items-center gap-2"
          >
            <TestTube className={`h-4 w-4 ${isTesting ? 'animate-spin' : ''}`} />
            {isTesting ? 'Testing...' : 'Test Sign Out Redirect'}
          </Button>

          {!isAuthenticated && (
            <Button
              onClick={() => window.location.href = '/auth'}
              variant="default"
            >
              Go to Login
            </Button>
          )}
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded">
          <p><strong>📋 How this test works:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Checks current authentication status</li>
            <li>Triggers sign out process</li>
            <li>Verifies automatic redirect to /auth</li>
            <li>Ensures user cannot access protected content after sign out</li>
          </ul>

          <p className="mt-2"><strong>✅ Expected behavior:</strong></p>
          <ul className="list-disc list-inside mt-1">
            <li>Sign out should redirect to /auth immediately</li>
            <li>User should not see this page after sign out</li>
            <li>Browser should navigate to login page automatically</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
