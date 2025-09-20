'use client';

import { useEffect, useMemo, useState } from 'react';
import { useBricks } from '@/lib/hooks/use-bricks';
import { useAuthContext } from '@/lib/providers/auth-provider';
import { Navigation } from '@/components/layout/navigation';
import Link from 'next/link';

export default function QuantasPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();
  const { quantas, bricks, isLoading, createQuanta, deleteQuanta, completeQuanta, loadUserData } = useBricks();
  const [selectedBrickId, setSelectedBrickId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState(30);

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
                <p className="text-gray-600 dark:text-gray-400 mb-6">Please sign in to access your quantas</p>
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
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Your Quantas</h1>
          <div className="space-x-4 text-sm">
            <Link href="/bricks" className="text-primary-600 hover:underline">Bricks</Link>
            <Link href="/dashboard" className="text-muted-foreground hover:underline">Dashboard</Link>
          </div>
        </div>

        <form onSubmit={handleCreate} className="mb-8 grid gap-3 md:grid-cols-5">
          <select
            value={selectedBrickId}
            onChange={(e) => setSelectedBrickId(e.target.value)}
            className="rounded border px-3 py-2"
          >
            <option value="">Select brick</option>
            {bricks.map((b) => (
              <option key={b.id} value={b.id}>{b.title}</option>
            ))}
          </select>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New quanta title"
            className="md:col-span-2 rounded border px-3 py-2"
          />
          <input
            type="number"
            min={1}
            value={minutes}
            onChange={(e) => setMinutes(parseInt(e.target.value || '1', 10))}
            className="rounded border px-3 py-2"
            placeholder="Minutes"
          />
          <button disabled={!user || isLoading} className="rounded bg-primary-600 px-4 py-2 text-white disabled:opacity-50" type="submit">
            {isLoading ? 'Adding...' : 'Add Quanta'}
          </button>
        </form>

        {isLoading && (
          <div className="text-sm text-muted-foreground mb-4">Loading...</div>
        )}

        <ul className="space-y-3">
          {sortedQuantas.map((q) => (
            <li key={q.id} className="rounded border p-3">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium truncate">{q.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Est. {q.estimated_duration_minutes}m • Status: {q.status}
                  </p>
                  {q.brick_id && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Brick: <Link href={`/detail/${q.brick_id}`} className="hover:underline">{brickTitleById[q.brick_id] || 'Unknown'}</Link>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => completeQuanta(q.id)} className="text-xs text-green-600 hover:underline">Complete</button>
                  <button onClick={() => deleteQuanta(q.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                </div>
              </div>
            </li>
          ))}
          {sortedQuantas.length === 0 && <p className="text-sm text-muted-foreground">No quantas yet</p>}
        </ul>
      </div>
    </div>
  );
}


