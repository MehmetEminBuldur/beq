'use client';

import { useEffect, useMemo, useState } from 'react';
import { useBricks } from '@/lib/hooks/use-bricks';
import { useAuthContext } from '@/lib/providers/auth-provider';
import { Navigation } from '@/components/layout/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Trash2, CheckCircle2, Clock, Target, Zap } from 'lucide-react';
import Link from 'next/link';

export default function QuantasPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();
  const { quantas, bricks, isLoading, isCreatingQuanta, createQuanta, deleteQuanta, completeQuanta, loadUserData } = useBricks();
  const [selectedBrickId, setSelectedBrickId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState(30);

  // Redirect to homepage if not authenticated
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user)) {
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  }, [isAuthenticated, user, authLoading]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserData();
    }
  }, [isAuthenticated, user, loadUserData]);

  const sortedQuantas = useMemo(() => {
    return [...quantas].sort((a, b) => (a.created_at > b.created_at ? -1 : 1));
  }, [quantas]);

  const brickTitleById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const b of bricks) {
      map[b.id] = b.title;
    }
    return map;
  }, [bricks]);

  // Show loading state while authentication is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading quantas...</p>
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrickId || !title.trim()) return;
    await createQuanta({
      brick_id: selectedBrickId,
      title: title.trim(),
      estimated_duration_minutes: minutes,
    });
    setTitle('');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/bricks">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Bricks
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Your Quantas</h1>
            <p className="text-muted-foreground mt-2">
              Break down your bricks into focused, actionable time blocks
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Create New Quanta Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Create New Quanta
            </CardTitle>
            <CardDescription>
              Break down your bricks into focused time blocks to make progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <select
                  value={selectedBrickId}
                  onChange={(e) => setSelectedBrickId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="">Select a brick</option>
                  {bricks.map((b) => (
                    <option key={b.id} value={b.id}>{b.title}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Quanta title (e.g., Research API documentation)"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  value={minutes}
                  onChange={(e) => setMinutes(parseInt(e.target.value || '1', 10))}
                  placeholder="Est. minutes"
                  className="flex-1"
                />
                <Button disabled={!user || isCreatingQuanta} type="submit" className="whitespace-nowrap">
                  {isCreatingQuanta ? 'Adding...' : 'Add Quanta'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading quantas...</p>
            </div>
          </div>
        )}

        {/* Quantas List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-blue-500" />
              Your Quantas
              <Badge variant="secondary" className="ml-auto">
                {sortedQuantas.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              All your time blocks organized by creation date
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sortedQuantas.length > 0 ? (
              <div className="space-y-3">
                {sortedQuantas.map((q) => (
                  <div key={q.id} className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium truncate">{q.title}</h3>
                        <Badge
                          variant={q.status === 'completed' ? 'success' : q.status === 'in_progress' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {q.status === 'in_progress' ? 'In Progress' : q.status === 'completed' ? 'Completed' : q.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {q.estimated_duration_minutes} minutes
                        </div>
                        {q.brick_id && (
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            <Link
                              href={`/detail/${q.brick_id}`}
                              className="hover:underline truncate max-w-48"
                            >
                              {brickTitleById[q.brick_id] || 'Unknown Brick'}
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {q.status !== 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => completeQuanta(q.id)}
                          className="gap-1 text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Complete
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteQuanta(q.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No quantas yet</h3>
                <p className="text-sm mb-4">Create your first quanta to break down your bricks into manageable time blocks.</p>
                <p className="text-xs">Start by selecting a brick and defining a focused task above.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


