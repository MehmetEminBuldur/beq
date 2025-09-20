'use client';

import { useEffect, useState } from 'react';
import { useBricks } from '@/lib/hooks/use-bricks';
import { useAuthContext } from '@/lib/providers/auth-provider';
import { Navigation } from '@/components/layout/navigation';
import Link from 'next/link';

export default function BricksPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();

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
                <p className="text-gray-600 dark:text-gray-400 mb-6">Please sign in to access your bricks</p>
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
  const { bricks, isLoading, createBrick, deleteBrick, getBricksByStatus, loadUserData } = useBricks();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

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
  const pendingBricks = getBricksByStatus('pending');
  const completedBricks = getBricksByStatus('completed');

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Your Bricks</h1>
          <Link href="/dashboard" className="text-sm text-primary-600 hover:underline">Back to Dashboard</Link>
        </div>

        <form onSubmit={handleCreate} className="mb-8 grid gap-3 md:grid-cols-5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New brick title"
            className="md:col-span-2 rounded border px-3 py-2"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="md:col-span-2 rounded border px-3 py-2"
          />
          <div className="flex gap-2">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded border px-3 py-2">
              <option value="general">General</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="health">Health</option>
              <option value="learning">Learning</option>
            </select>
            <input
              type="number"
              min={1}
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(parseInt(e.target.value || '1', 10))}
              className="w-28 rounded border px-3 py-2"
              placeholder="Minutes"
            />
            <button disabled={!user || isLoading} className="rounded bg-primary-600 px-4 py-2 text-white disabled:opacity-50" type="submit">
              {isLoading ? 'Creating...' : 'Add'}
            </button>
          </div>
        </form>

        {isLoading && (
          <div className="text-sm text-muted-foreground mb-4">Loading...</div>
        )}

        <div className="grid gap-8 md:grid-cols-3">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Pending</h2>
            <ul className="space-y-2">
              {pendingBricks.map((b) => (
                <li key={b.id} className="rounded border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Link href={`/detail/${b.id}`} className="font-medium hover:underline">{b.title}</Link>
                      {b.description && <p className="text-sm text-muted-foreground">{b.description}</p>}
                      <p className="mt-1 text-xs text-gray-500">{b.category} • Est. {b.estimated_duration_minutes}m</p>
                    </div>
                    <button onClick={() => deleteBrick(b.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                  </div>
                </li>
              ))}
              {pendingBricks.length === 0 && <p className="text-sm text-muted-foreground">No pending bricks</p>}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Active</h2>
            <ul className="space-y-2">
              {activeBricks.map((b) => (
                <li key={b.id} className="rounded border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Link href={`/detail/${b.id}`} className="font-medium hover:underline">{b.title}</Link>
                      {b.description && <p className="text-sm text-muted-foreground">{b.description}</p>}
                      <p className="mt-1 text-xs text-gray-500">Progress {b.completion_percentage}% • Sessions {b.sessions_count}</p>
                    </div>
                    <button onClick={() => deleteBrick(b.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                  </div>
                </li>
              ))}
              {activeBricks.length === 0 && <p className="text-sm text-muted-foreground">No active bricks</p>}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Completed</h2>
            <ul className="space-y-2">
              {completedBricks.map((b) => (
                <li key={b.id} className="rounded border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Link href={`/detail/${b.id}`} className="font-medium hover:underline">{b.title}</Link>
                      <p className="mt-1 text-xs text-gray-500">Completed</p>
                    </div>
                    <button onClick={() => deleteBrick(b.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                  </div>
                </li>
              ))}
              {completedBricks.length === 0 && <p className="text-sm text-muted-foreground">No completed bricks</p>}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}


