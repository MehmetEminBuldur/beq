'use client';

import { DatabaseTestComponent } from '@/components/dev/database-test';

export default function DatabaseTestPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Database Test Suite</h1>
          <p className="text-muted-foreground">
            This page allows you to test Supabase database CRUD operations and verify connectivity.
          </p>
        </div>

        <DatabaseTestComponent />
      </div>
    </div>
  );
}