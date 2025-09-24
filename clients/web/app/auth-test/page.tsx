'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/lib/providers/auth-provider';
import { Navigation } from '@/components/layout/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthTestPage() {
  const { signIn, signOut, isAuthenticated, user, isLoading } = useAuthContext();
  const [email, setEmail] = useState('test-auth@beq.dev');
  const [password, setPassword] = useState('TestPassword123!');
  const [envCheck, setEnvCheck] = useState<Record<string, string | boolean>>({});
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    // Check environment variables in browser
    const envVars = {
      'NEXT_PUBLIC_SUPABASE_URL': typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_SUPABASE_URL || 'undefined') : 'server-side',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY': typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'undefined') : 'server-side',
      'window available': typeof window !== 'undefined',
      'process.env available': typeof process !== 'undefined' && !!process.env,
    };
    
    setEnvCheck(envVars);
  }, []);

  const handleTestSignIn = async () => {
    setTestResult('🔄 Testing sign-in...');
    
    try {
      const result = await signIn(email, password);
      
      if (result.error) {
        setTestResult(`❌ Sign-in failed: ${result.error.message}`);
      } else {
        setTestResult('✅ Sign-in successful!');
      }
    } catch (error) {
      setTestResult(`❌ Sign-in error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTestSignOut = async () => {
    setTestResult('🔄 Testing sign-out...');
    
    try {
      await signOut();
      setTestResult('✅ Sign-out successful!');
    } catch (error) {
      setTestResult(`❌ Sign-out error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Authentication Test Dashboard</h1>
        
        {/* Environment Check */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Environment Variables Check</CardTitle>
            <CardDescription>Checking if Supabase environment variables are available in the browser</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(envCheck).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="font-mono text-sm">{key}:</span>
                  <span className={`text-sm ${
                    value === 'undefined' || value === false ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {typeof value === 'string' && value.length > 30 
                      ? value.substring(0, 30) + '...' 
                      : String(value)
                    }
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Authentication Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Current Authentication Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Authenticated:</span>
                <span className={isAuthenticated ? 'text-green-500' : 'text-red-500'}>
                  {isAuthenticated ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Loading:</span>
                <span className={isLoading ? 'text-yellow-500' : 'text-gray-500'}>
                  {isLoading ? '🔄 Yes' : '⏸️ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>User:</span>
                <span className="text-sm">
                  {user ? `${user.email} (${user.id?.substring(0, 8)}...)` : 'None'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual Sign-In Test */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Manual Authentication Test</CardTitle>
            <CardDescription>Test sign-in with pre-filled test credentials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="test-email">Email</Label>
              <Input
                id="test-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test-auth@beq.dev"
              />
            </div>
            
            <div>
              <Label htmlFor="test-password">Password</Label>
              <Input
                id="test-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="TestPassword123!"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleTestSignIn} 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? '🔄 Testing...' : '🔐 Test Sign In'}
              </Button>
              
              {isAuthenticated && (
                <Button 
                  onClick={handleTestSignOut} 
                  variant="outline"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? '🔄 Testing...' : '🚪 Test Sign Out'}
                </Button>
              )}
            </div>
            
            {testResult && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-mono">{testResult}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Debug Information */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
            <CardDescription>Technical details for troubleshooting</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm font-mono">
              <div>User Agent: {typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'}</div>
              <div>Location: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
              <div>Timestamp: {new Date().toISOString()}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}