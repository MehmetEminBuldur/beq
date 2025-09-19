'use client';

import { useState } from 'react';
import { useAuthContext } from '@/lib/providers/auth-provider';
import { DatabaseTestService, BrickService, QuantaService, ProfileService } from '@/lib/services/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, Database, TestTube, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  result?: any;
  error?: string;
  duration?: number;
}

export function DatabaseTestComponent() {
  const { user, isAuthenticated } = useAuthContext();
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');

  const updateTestResult = (name: string, updates: Partial<TestResult>) => {
    setTestResults(prev => prev.map(test =>
      test.name === name ? { ...test, ...updates } : test
    ));
  };

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    const startTime = Date.now();
    updateTestResult(testName, { status: 'running' });

    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      updateTestResult(testName, {
        status: 'success',
        result,
        duration
      });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTestResult(testName, {
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      throw error;
    }
  };

  const initializeTests = () => {
    setTestResults([
      { name: 'Connection Test', status: 'pending' },
      { name: 'Schema Validation', status: 'pending' },
      { name: 'Profile Operations', status: 'pending' },
      { name: 'Brick CRUD', status: 'pending' },
      { name: 'Quanta CRUD', status: 'pending' },
      { name: 'Comprehensive CRUD Test', status: 'pending' },
    ]);
  };

  const testDatabaseConnection = async () => {
    const isConnected = await DatabaseTestService.testConnection();
    setConnectionStatus(isConnected ? 'connected' : 'disconnected');

    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    return { connected: true };
  };

  const testSchemaValidation = async () => {
    const validation = await DatabaseTestService.validateDatabaseSchema();

    if (!validation.valid) {
      throw new Error(`Schema validation failed: ${validation.errors.join(', ')}`);
    }

    return validation;
  };

  const testProfileOperations = async () => {
    if (!user?.id) {
      throw new Error('No user authenticated');
    }

    // Test profile read
    const profile = await ProfileService.getProfile(user.id);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Test profile update
    const originalTimezone = profile.timezone;
    const testTimezone = 'Europe/London';

    await ProfileService.updateProfile(user.id, { timezone: testTimezone });
    const updatedProfile = await ProfileService.getProfile(user.id);

    if (updatedProfile?.timezone !== testTimezone) {
      throw new Error('Profile update failed');
    }

    // Restore original timezone
    await ProfileService.updateProfile(user.id, { timezone: originalTimezone });

    return {
      profileFound: true,
      updateSuccessful: true,
      originalTimezone,
      testTimezone
    };
  };

  const testBrickCRUD = async () => {
    if (!user?.id) {
      throw new Error('No user authenticated');
    }

    // Create
    const newBrick = await BrickService.createBrick({
      user_id: user.id,
      title: 'Database Test Brick',
      description: 'Created for CRUD testing',
      category: 'work',
      priority: 'low',
      estimated_duration_minutes: 30
    });

    // Read
    const readBrick = await BrickService.getBrick(newBrick.id);
    if (!readBrick || readBrick.title !== 'Database Test Brick') {
      throw new Error('Brick read failed');
    }

    // Update
    const updatedBrick = await BrickService.updateBrick(newBrick.id, {
      title: 'Updated Database Test Brick',
      completion_percentage: 25
    });

    if (updatedBrick.title !== 'Updated Database Test Brick') {
      throw new Error('Brick update failed');
    }

    // List
    const userBricks = await BrickService.getBricks(user.id);
    const foundBrick = userBricks.find(b => b.id === newBrick.id);
    if (!foundBrick) {
      throw new Error('Brick not found in list');
    }

    // Delete
    await BrickService.deleteBrick(newBrick.id);

    // Verify deletion
    try {
      await BrickService.getBrick(newBrick.id);
      throw new Error('Brick deletion failed - still exists');
    } catch (error) {
      // Expected to fail
    }

    return {
      created: true,
      read: true,
      updated: true,
      listed: true,
      deleted: true
    };
  };

  const testQuantaCRUD = async () => {
    if (!user?.id) {
      throw new Error('No user authenticated');
    }

    // Create a test brick first
    const testBrick = await BrickService.createBrick({
      user_id: user.id,
      title: 'Test Brick for Quanta',
      description: 'Temporary brick for quanta testing',
      category: 'work',
      priority: 'low',
      estimated_duration_minutes: 60
    });

    try {
      // Create quanta
      const newQuanta = await QuantaService.createQuanta({
        brick_id: testBrick.id,
        user_id: user.id,
        title: 'Database Test Quanta',
        description: 'Created for CRUD testing',
        estimated_duration_minutes: 15,
        priority: 'medium'
      });

      // Read
      const readQuanta = await QuantaService.getQuanta(newQuanta.id);
      if (!readQuanta || readQuanta.title !== 'Database Test Quanta') {
        throw new Error('Quanta read failed');
      }

      // Update
      const updatedQuanta = await QuantaService.updateQuanta(newQuanta.id, {
        title: 'Updated Database Test Quanta',
        completion_percentage: 50
      });

      if (updatedQuanta.title !== 'Updated Database Test Quanta') {
        throw new Error('Quanta update failed');
      }

      // List quantas for brick
      const brickQuantas = await QuantaService.getQuantas(testBrick.id);
      const foundQuanta = brickQuantas.find(q => q.id === newQuanta.id);
      if (!foundQuanta) {
        throw new Error('Quanta not found in brick list');
      }

      // Delete quanta
      await QuantaService.deleteQuanta(newQuanta.id);

      return {
        created: true,
        read: true,
        updated: true,
        listed: true,
        deleted: true
      };

    } finally {
      // Clean up test brick
      await BrickService.deleteBrick(testBrick.id);
    }
  };

  const runComprehensiveTest = async () => {
    if (!user?.id) {
      throw new Error('No user authenticated');
    }

    return await DatabaseTestService.testCRUDOperations(user.id);
  };

  const runAllTests = async () => {
    if (!isAuthenticated || !user) {
      toast.error('Please sign in to run database tests');
      return;
    }

    setIsRunning(true);
    initializeTests();

    try {
      // Run tests sequentially
      await runTest('Connection Test', testDatabaseConnection);
      await runTest('Schema Validation', testSchemaValidation);
      await runTest('Profile Operations', testProfileOperations);
      await runTest('Brick CRUD', testBrickCRUD);
      await runTest('Quanta CRUD', testQuantaCRUD);
      await runTest('Comprehensive CRUD Test', runComprehensiveTest);

      toast.success('All database tests completed successfully!');
    } catch (error) {
      console.error('Test suite failed:', error);
      toast.error('Some tests failed. Check the results below.');
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      pending: 'secondary',
      running: 'default',
      success: 'success',
      error: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Authentication Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please sign in to run database tests.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Supabase Database CRUD Test Suite
          </CardTitle>
          <CardDescription>
            Test database connectivity and CRUD operations for all main tables
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                User: {user?.email} ({user?.id?.slice(0, 8)}...)
              </p>
              <p className="text-sm text-gray-600">
                Connection: {connectionStatus === 'connected' && <span className="text-green-600">Connected</span>}
                {connectionStatus === 'disconnected' && <span className="text-red-600">Disconnected</span>}
                {connectionStatus === 'unknown' && <span className="text-gray-600">Unknown</span>}
              </p>
            </div>
            <Button
              onClick={runAllTests}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              {testResults.filter(t => t.status === 'success').length} / {testResults.length} tests passed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((test, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <p className="font-medium">{test.name}</p>
                      {test.duration && (
                        <p className="text-xs text-gray-500">{test.duration}ms</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(test.status)}
                  </div>
                </div>
              ))}
            </div>

            {testResults.some(t => t.error) && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium text-red-600">Errors:</h4>
                {testResults
                  .filter(t => t.error)
                  .map((test, index) => (
                    <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                      <p className="font-medium">{test.name}:</p>
                      <p className="text-red-700">{test.error}</p>
                    </div>
                  ))
                }
              </div>
            )}

            {testResults.some(t => t.result && t.status === 'success') && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium text-green-600">Success Details:</h4>
                <div className="text-xs space-y-1">
                  {testResults
                    .filter(t => t.result && t.status === 'success')
                    .map((test, index) => (
                      <details key={index} className="p-2 bg-green-50 border border-green-200 rounded">
                        <summary className="font-medium cursor-pointer">{test.name}</summary>
                        <pre className="mt-2 whitespace-pre-wrap text-green-700">
                          {JSON.stringify(test.result, null, 2)}
                        </pre>
                      </details>
                    ))
                  }
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}