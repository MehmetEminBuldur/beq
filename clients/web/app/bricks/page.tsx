'use client';

import { useEffect, useState } from 'react';
import { useBricks } from '@/lib/hooks/use-bricks';
import { useAuthContext } from '@/lib/providers/auth-provider';
import { Navigation } from '@/components/layout/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Trash2, Eye, Target, Clock, CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';

export default function BricksPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();
  const { bricks, isLoading, isCreatingBrick, createBrick, deleteBrick, getBricksByStatus, loadUserData } = useBricks();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);

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

  // Show loading state while authentication is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading bricks...</p>
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
    if (!title.trim()) return;
    await createBrick({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      estimated_duration_minutes: estimatedMinutes,
    });
    setTitle('');
    setDescription('');
  };

  const activeBricks = getBricksByStatus('in_progress');
  const pendingBricks = getBricksByStatus('not_started');
  const completedBricks = getBricksByStatus('completed');

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Your Bricks</h1>
            <p className="text-muted-foreground mt-2">
              Manage your goals and objectives with structured bricks
            </p>
          </div>
        </div>

        {/* Create New Brick Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Brick
            </CardTitle>
            <CardDescription>
              Add a new goal or objective to break down into manageable quantas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="md:col-span-2">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brick title (e.g., Complete project proposal)"
                  required
                />
              </div>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
              />
              <div className="flex gap-2">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="general">General</option>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="health">Health</option>
                  <option value="learning">Learning</option>
                </select>
              </div>
              <div className="flex gap-2 md:col-span-2 lg:col-span-1">
                <Input
                  type="number"
                  min={1}
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(parseInt(e.target.value || '1', 10))}
                  placeholder="Est. minutes"
                  className="flex-1"
                />
                <Button disabled={!user || isCreatingBrick} type="submit" className="whitespace-nowrap">
                  {isCreatingBrick ? 'Creating...' : 'Add Brick'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading bricks...</p>
            </div>
          </div>
        )}

        {/* Bricks Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Pending Bricks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Circle className="h-5 w-5 text-orange-500" />
                Pending Bricks
                <Badge variant="secondary" className="ml-auto">
                  {pendingBricks.length}
                </Badge>
              </CardTitle>
              <CardDescription>
                Goals not yet started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingBricks.map((b) => (
                <div key={b.id} className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <Link href={`/detail/${b.id}`} className="font-medium hover:underline block truncate">
                      {b.title}
                    </Link>
                    {b.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{b.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {b.category}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {b.estimated_duration_minutes}m
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/detail/${b.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteBrick(b.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {pendingBricks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No pending bricks yet</p>
                  <p className="text-xs mt-1">Create your first brick above</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Bricks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-blue-500" />
                Active Bricks
                <Badge variant="secondary" className="ml-auto">
                  {activeBricks.length}
                </Badge>
              </CardTitle>
              <CardDescription>
                Currently working on these goals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeBricks.map((b) => (
                <div key={b.id} className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <Link href={`/detail/${b.id}`} className="font-medium hover:underline block truncate">
                      {b.title}
                    </Link>
                    {b.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{b.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {b.completion_percentage}% complete
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Target className="h-3 w-3" />
                        {b.sessions_count} sessions
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/detail/${b.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteBrick(b.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {activeBricks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active bricks</p>
                  <p className="text-xs mt-1">Start working on a pending brick</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completed Bricks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Completed Bricks
                <Badge variant="secondary" className="ml-auto">
                  {completedBricks.length}
                </Badge>
              </CardTitle>
              <CardDescription>
                Successfully achieved goals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {completedBricks.map((b) => (
                <div key={b.id} className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <Link href={`/detail/${b.id}`} className="font-medium hover:underline block truncate">
                      {b.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="success" className="text-xs">
                        Completed
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/detail/${b.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteBrick(b.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {completedBricks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No completed bricks yet</p>
                  <p className="text-xs mt-1">Keep working towards your goals!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


