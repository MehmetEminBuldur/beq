'use client';

import { useState } from 'react';
import { useAuthContext } from '@/lib/providers/auth-provider';
import { useDashboard } from '@/lib/hooks/use-dashboard';
import { Navigation } from '@/components/layout/navigation';
import { ChatInterface } from '@/components/chat/chat-interface';
import { DynamicQuickActions } from '@/components/dashboard/dynamic-quick-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MessageSquare, Target, TrendingUp, Plus, Clock, RefreshCw, Brain } from 'lucide-react';

export default function DashboardPage() {
  const { user, signOut } = useAuthContext();
  const { stats, todaySchedule, aiInsights, isLoading, refreshDashboard } = useDashboard();
  const [activeView, setActiveView] = useState<'overview' | 'chat'>('overview');

  if (activeView === 'chat') {
    return (
      <div className="flex h-screen flex-col">
        <Navigation />
        <div className="flex-1 overflow-hidden">
          <ChatInterface />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" suppressHydrationWarning>
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight" suppressHydrationWarning>
                Welcome back, {user?.full_name || user?.email?.split('@')[0] || 'User'}! 👋
              </h1>
              <p className="text-muted-foreground mt-2">
                Here's your life management overview for today.
              </p>
            </div>
            <Button
              onClick={refreshDashboard}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Dynamic Quick Actions */}
        <DynamicQuickActions
          stats={stats}
          todaySchedule={todaySchedule}
          aiInsights={aiInsights}
          isLoading={isLoading}
          onChatClick={() => setActiveView('chat')}
        />

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bricks</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent suppressHydrationWarning>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : stats.activeBricks}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingBricks > 0 ? `${stats.pendingBricks} pending` : 'All caught up!'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent suppressHydrationWarning>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : stats.completedToday}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.completedThisWeek > 0 ? `${stats.completedThisWeek} this week` : 'Start your day!'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Focus Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent suppressHydrationWarning>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : `${stats.focusTime}h`}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.averageSessionTime > 0 ? `${stats.averageSessionTime}m avg session` : 'Track your progress'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Conversations</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent suppressHydrationWarning>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : stats.aiConversations}
              </div>
              <p className="text-xs text-muted-foreground">
                Messages sent
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Today's Schedule */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
              <CardDescription>
                Your AI-optimized schedule for maximum productivity
              </CardDescription>
            </CardHeader>
            <CardContent suppressHydrationWarning>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center text-muted-foreground py-8">
                    Loading your schedule...
                  </div>
                ) : todaySchedule.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No events scheduled for today</p>
                    <p className="text-sm mt-1">Add some bricks or events to get started!</p>
                  </div>
                ) : (
                  todaySchedule.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          item.status === 'completed'
                            ? 'bg-green-500'
                            : item.status === 'in_progress'
                            ? 'bg-blue-500'
                            : 'bg-gray-300'
                        }`}
                      ></div>
                      <div className="flex-1">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                          {(() => {
                            const start = new Date(item.start_time);
                            const end = new Date(item.end_time);
                            const formatTime = (date: Date) => {
                              const hours = date.getHours().toString().padStart(2, '0');
                              const minutes = date.getMinutes().toString().padStart(2, '0');
                              return `${hours}:${minutes}`;
                            };
                            return `${formatTime(start)} - ${formatTime(end)}`;
                          })()}
                        </p>
                      </div>
                      <Badge
                        variant={
                          item.status === 'completed'
                            ? 'default'
                            : item.status === 'in_progress'
                            ? 'secondary'
                            : 'outline'
                        }
                        className={`text-xs ${
                          item.status === 'completed'
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : item.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {item.status === 'completed'
                          ? 'Completed'
                          : item.status === 'in_progress'
                          ? 'In Progress'
                          : 'Upcoming'
                        }
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setActiveView('chat')}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Ask AI Assistant
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.location.href = '/bricks'}
              >
                <Plus className="mr-2 h-4 w-4" />
                {stats.activeBricks === 0 ? 'Create New Brick' : 'Manage Projects'}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.location.href = '/calendar'}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                {todaySchedule.length === 0 ? 'Plan Your Day' : 'View Calendar'}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.location.href = '/settings'}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        <Card className="mt-6" data-ai-insights>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Insights
            </CardTitle>
            <CardDescription>
              Personalized recommendations based on your activity patterns
            </CardDescription>
          </CardHeader>
          <CardContent suppressHydrationWarning>
            {isLoading ? (
              <div className="text-center text-muted-foreground py-8">
                Analyzing your patterns...
              </div>
            ) : aiInsights.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Complete some tasks to see personalized insights!</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {aiInsights.slice(0, 4).map((insight) => (
                  <div key={insight.id} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{insight.title}</h4>
                      <Badge
                        variant={
                          insight.priority === 'high'
                            ? 'destructive'
                            : insight.priority === 'medium'
                            ? 'default'
                            : 'secondary'
                        }
                        className="text-xs"
                      >
                        {insight.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {insight.description}
                    </p>
                    {insight.actionable && (
                      <Button variant="outline" size="sm" className="mt-2 text-xs">
                        Take Action
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
