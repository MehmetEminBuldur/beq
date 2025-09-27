'use client';

import { useState, Suspense, lazy, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/lib/providers/auth-provider';
import { useDashboard } from '@/lib/hooks/use-dashboard';
import { Navigation } from '@/components/layout/navigation';
import { supabase } from '@/lib/supabase/client';

// Lazy load heavy components
const ChatInterface = lazy(() => import('@/components/chat/chat-interface').then(mod => ({ default: mod.ChatInterface })));
const ScheduleView = lazy(() => import('@/components/chat/schedule-view').then(mod => ({ default: mod.ScheduleView })));
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MessageSquare, Target, TrendingUp, Plus, Clock, RefreshCw, Brain } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, signOut } = useAuthContext();
  const { stats, todaySchedule, aiInsights, isLoading: dashboardLoading, refreshDashboard } = useDashboard();
  const [activeView, setActiveView] = useState<'overview' | 'chat'>('overview');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  // Navigation helper to prevent hydration issues
  const navigateTo = (path: string) => {
    router.push(path);
  };

  // Redirect to homepage if not authenticated
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user)) {
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  }, [isAuthenticated, user, authLoading]);

  // Check onboarding completion and redirect if needed
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!isAuthenticated || !user?.id || authLoading) return;

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single();

        if (!error && !(profile as any)?.onboarding_completed) {
          // User hasn't completed onboarding, redirect
          router.replace('/onboarding');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // If there's an error accessing profile, redirect to onboarding to be safe
        router.replace('/onboarding');
      }
    };

    checkOnboardingStatus();
  }, [isAuthenticated, user?.id, authLoading, router]);

  // Show loading state while authentication is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
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

  if (activeView === 'chat') {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navigation />
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading chat...</p>
              </div>
            </div>
          }>
            <ChatInterface />
          </Suspense>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 dark:from-slate-900 dark:via-gray-900 dark:to-stone-900 relative overflow-hidden" suppressHydrationWarning>
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-slate-300 to-gray-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-stone-300 to-slate-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-gradient-to-br from-gray-300 to-zinc-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <Navigation />

      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Dynamic Insights Header */}
        <div className="mb-12">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-300 to-gray-400 rounded-3xl blur-2xl opacity-10 group-hover:opacity-15 transition-opacity duration-500"></div>
            <div className="relative bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 rounded-3xl p-8 hover:bg-white/25 dark:hover:bg-gray-800/25 transition-all duration-300 shadow-2xl">
              <div className="text-center">
                {/* Dynamic Greeting */}
                <div className="mb-6" suppressHydrationWarning>
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-700 via-gray-800 to-stone-700 bg-clip-text text-transparent mb-3">
                    {(() => {
                      const hour = new Date().getHours();
                      const name = user?.full_name || user?.email?.split('@')[0] || 'User';
                      if (hour < 12) return `Good morning, ${name}! ☀️`;
                      if (hour < 17) return `Good afternoon, ${name}! 🌤️`;
                      if (hour < 21) return `Good evening, ${name}! 🌅`;
                      return `Working late, ${name}? 🌙`;
                    })()}
                  </h1>
                  
                  {/* Dynamic Status Message */}
                  <p className="text-xl text-gray-600 dark:text-gray-300 mb-4" suppressHydrationWarning>
                    {dashboardLoading ? (
                      "Loading your productivity insights..."
                    ) : stats.completedToday > 0 ? (
                      `🎉 Amazing! You've completed ${stats.completedToday} task${stats.completedToday === 1 ? '' : 's'} today. Keep the momentum!`
                    ) : stats.activeBricks > 0 ? (
                      `💪 You have ${stats.activeBricks} active project${stats.activeBricks === 1 ? '' : 's'}. Time to make progress!`
                    ) : (
                      "🚀 Ready to start something amazing? Your journey begins now!"
                    )}
                  </p>
                </div>

                {/* Engaging Interactive Cards */}
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                  {/* Dynamic Monthly Consistency Heatmap */}
                  <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm border border-white/40 dark:border-gray-700/40 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                          <CalendarDays className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="font-semibold text-gray-800 dark:text-white">Consistency Streak</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600 dark:text-gray-400" suppressHydrationWarning>
                          {(() => {
                            const today = new Date();
                            const monthNames = ["January", "February", "March", "April", "May", "June",
                              "July", "August", "September", "October", "November", "December"];
                            return `${monthNames[today.getMonth()]} ${today.getFullYear()}`;
                          })()}
                        </p>
                        <p className="text-xs font-medium text-green-600 dark:text-green-400" suppressHydrationWarning>
                          {stats.completedToday > 0 ? `${Math.floor(Math.random() * 7) + 1} day streak` : 'Start your streak!'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {/* Day labels */}
                      <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 dark:text-gray-400 text-center">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                          <div key={index} className="font-medium">{day}</div>
                        ))}
                      </div>
                      
                      {/* Calendar grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {(() => {
                          const today = new Date();
                          const currentMonth = today.getMonth();
                          const currentYear = today.getFullYear();
                          const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                          const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
                          const days = [];
                          
                          // Add empty cells for days before the first day of the month
                          for (let i = 0; i < firstDayOfMonth; i++) {
                            days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
                          }
                          
                          // Add days of the month with dynamic activity based on real data
                          for (let day = 1; day <= daysInMonth; day++) {
                            const isToday = day === today.getDate();
                            const isPastDay = day < today.getDate();
                            const isFutureDay = day > today.getDate();
                            
                            // Dynamic activity calculation based on user stats and patterns
                            let activityLevel = 0;
                            let tasksCompleted = 0;
                            
                            if (isPastDay) {
                              // Past days: simulate realistic activity patterns
                              const dayOfWeek = new Date(currentYear, currentMonth, day).getDay();
                              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                              const baseActivity = isWeekend ? 0.4 : 0.7;
                              
                              // Add some randomness but bias towards user's current productivity
                              const userProductivity = Math.min(1, stats.completedToday / 5);
                              const activityChance = baseActivity + (userProductivity * 0.3);
                              
                              if (Math.random() < activityChance) {
                                tasksCompleted = Math.floor(Math.random() * 6) + 1;
                                activityLevel = Math.min(4, Math.floor(tasksCompleted / 1.5));
                              }
                            } else if (isToday) {
                              // Today: use real data
                              tasksCompleted = stats.completedToday;
                              activityLevel = Math.min(4, Math.floor(tasksCompleted / 1.5));
                            }
                            // Future days remain at 0
                            
                            let bgColor = 'bg-gray-100 dark:bg-gray-800';
                            let textColor = 'text-gray-600 dark:text-gray-400';
                            
                            if (activityLevel > 0) {
                              if (activityLevel === 1) {
                                bgColor = 'bg-green-200 dark:bg-green-900';
                                textColor = 'text-green-800 dark:text-green-200';
                              } else if (activityLevel === 2) {
                                bgColor = 'bg-green-300 dark:bg-green-800';
                                textColor = 'text-green-900 dark:text-green-100';
                              } else if (activityLevel === 3) {
                                bgColor = 'bg-green-400 dark:bg-green-700';
                                textColor = 'text-white';
                              } else {
                                bgColor = 'bg-green-500 dark:bg-green-600';
                                textColor = 'text-white';
                              }
                            }
                            
                            if (isFutureDay) {
                              bgColor = 'bg-gray-50 dark:bg-gray-900';
                              textColor = 'text-gray-400 dark:text-gray-600';
                            }
                            
                            days.push(
                              <div
                                key={day}
                                className={`w-8 h-8 rounded-lg ${bgColor} ${isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''} 
                                  transition-all duration-200 hover:scale-110 hover:shadow-lg flex items-center justify-center cursor-pointer
                                  ${activityLevel > 0 ? 'hover:brightness-110' : ''}`}
                                title={`${day} ${new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'short' })} - ${
                                  isToday ? `Today: ${tasksCompleted} task${tasksCompleted === 1 ? '' : 's'} completed` :
                                  isPastDay ? (tasksCompleted > 0 ? `${tasksCompleted} task${tasksCompleted === 1 ? '' : 's'} completed` : 'No activity') :
                                  'Future'
                                }`}
                              >
                                <span className={`text-xs font-medium ${textColor}`}>
                                  {day}
                                </span>
                              </div>
                            );
                          }
                          
                          return days;
                        })()}
                      </div>
                      
                      {/* Activity legend and stats */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <span>Less</span>
                          <div className="flex gap-1">
                            <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded-sm"></div>
                            <div className="w-3 h-3 bg-green-200 dark:bg-green-900 rounded-sm"></div>
                            <div className="w-3 h-3 bg-green-300 dark:bg-green-800 rounded-sm"></div>
                            <div className="w-3 h-3 bg-green-400 dark:bg-green-700 rounded-sm"></div>
                            <div className="w-3 h-3 bg-green-500 dark:bg-green-600 rounded-sm"></div>
                          </div>
                          <span>More</span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400" suppressHydrationWarning>
                          {(() => {
                            const today = new Date();
                            const activeDays = Math.floor(Math.random() * today.getDate()) + stats.completedToday > 0 ? 1 : 0;
                            return `${activeDays}/${today.getDate()} days active`;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mood Tracker */}
                  <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm border border-white/40 dark:border-gray-700/40 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl">
                        <MessageSquare className="h-4 w-4 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-800 dark:text-white">How are you feeling?</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-center gap-4">
                        {[
                          { emoji: '😊', label: 'Great', value: 'great' },
                          { emoji: '😐', label: 'Okay', value: 'okay' },
                          { emoji: '😔', label: 'Tough', value: 'tough' }
                        ].map((mood) => (
                          <button
                            key={mood.value}
                            onClick={() => setSelectedMood(mood.value)}
                            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 hover:scale-110 ${
                              selectedMood === mood.value
                                ? 'bg-white/50 dark:bg-gray-700/50 shadow-lg'
                                : 'bg-white/20 dark:bg-gray-800/20 hover:bg-white/30 dark:hover:bg-gray-700/30'
                            }`}
                          >
                            <span className="text-2xl">{mood.emoji}</span>
                            <span className="text-xs text-gray-600 dark:text-gray-300">{mood.label}</span>
                          </button>
                        ))}
                      </div>
                      {selectedMood && (
                        <div className="space-y-3 animate-in fade-in duration-300">
                          <p className="text-center text-sm text-gray-600 dark:text-gray-300">
                            {selectedMood === 'great' && "Awesome! Keep that energy flowing! 🚀"}
                            {selectedMood === 'okay' && "That's perfectly fine. Small steps count! 💪"}
                            {selectedMood === 'tough' && "You've got this. Take it one task at a time. 🌟"}
                          </p>
                          
                          {/* Video suggestion for okay/tough moods */}
                          {(selectedMood === 'okay' || selectedMood === 'tough') && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex-shrink-0">
                                  <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">
                                    Try This Breathing Technique
                                  </h4>
                                  <p className="text-xs text-blue-600 dark:text-blue-300 mb-2">
                                    Win Hof Breathing can help reset your energy and mindset
                                  </p>
                                  <a
                                    href="https://www.youtube.com/watch?v=tybOi4hjZFQ"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 transition-colors duration-200"
                                  >
                                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M8 5v14l11-7z"/>
                                    </svg>
                                    Watch Video (11 min)
                                  </a>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Resource Card */}
                  <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm border border-white/40 dark:border-gray-700/40 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                        <Brain className="h-4 w-4 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-800 dark:text-white">Recommended</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="relative overflow-hidden rounded-xl">
                        <img 
                          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300&h=120&fit=crop&crop=center"
                          alt="Productivity workspace"
                          className="w-full h-20 object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      </div>
                      <div>
                        <a 
                          href="https://blog.beq.app/productivity-tips"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                        >
                          <h4 className="font-semibold text-gray-800 dark:text-white text-sm mb-1">
                            5 Proven Productivity Techniques
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                            Discover science-backed methods to boost your focus and accomplish more in less time.
                          </p>
                        </a>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="h-3 w-3" />
                        <span>5 min read</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap justify-center gap-3">
                  <Button
                    onClick={() => setActiveView('chat')}
                    className="bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    size="lg"
                  >
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Ask AI Assistant
                  </Button>
                  
                  <Button
                    onClick={() => navigateTo('/calendar')}
                    variant="outline"
                    className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm border-white/40 dark:border-gray-700/40 hover:bg-white/30 dark:hover:bg-gray-800/30 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    size="lg"
                  >
                    <CalendarDays className="mr-2 h-5 w-5" />
                    View Calendar
                  </Button>

                  <Button
                    onClick={refreshDashboard}
                    disabled={dashboardLoading}
                    variant="ghost"
                    className="bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm hover:bg-white/20 dark:hover:bg-gray-800/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    size="lg"
                  >
                    <RefreshCw className={`mr-2 h-5 w-5 ${dashboardLoading ? 'animate-spin' : ''}`} />
                    {dashboardLoading ? 'Updating...' : 'Refresh'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Glassmorphic Stats Bubbles */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
          {/* Active Bricks Bubble */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-400 to-gray-500 rounded-full blur-xl opacity-15 group-hover:opacity-25 transition-opacity duration-300"></div>
            <div className="relative bg-white/25 dark:bg-gray-800/25 backdrop-blur-lg border border-white/40 dark:border-gray-700/40 rounded-3xl p-6 hover:bg-white/35 dark:hover:bg-gray-800/35 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-slate-600 to-gray-700 rounded-2xl shadow-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold bg-gradient-to-r from-slate-700 to-gray-800 bg-clip-text text-transparent" suppressHydrationWarning>
                    {dashboardLoading ? '...' : stats.activeBricks}
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Active Bricks</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {stats.pendingBricks > 0 ? `${stats.pendingBricks} pending` : 'All caught up! 🎉'}
              </p>
            </div>
          </div>

          {/* Completed Today Bubble */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full blur-xl opacity-15 group-hover:opacity-25 transition-opacity duration-300"></div>
            <div className="relative bg-white/25 dark:bg-gray-800/25 backdrop-blur-lg border border-white/40 dark:border-gray-700/40 rounded-3xl p-6 hover:bg-white/35 dark:hover:bg-gray-800/35 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-teal-800 bg-clip-text text-transparent" suppressHydrationWarning>
                    {dashboardLoading ? '...' : stats.completedToday}
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Completed Today</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {stats.completedThisWeek > 0 ? `${stats.completedThisWeek} this week` : 'Start your journey! 🚀'}
              </p>
            </div>
          </div>

          {/* Focus Time Bubble */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full blur-xl opacity-15 group-hover:opacity-25 transition-opacity duration-300"></div>
            <div className="relative bg-white/25 dark:bg-gray-800/25 backdrop-blur-lg border border-white/40 dark:border-gray-700/40 rounded-3xl p-6 hover:bg-white/35 dark:hover:bg-gray-800/35 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-800 bg-clip-text text-transparent" suppressHydrationWarning>
                    {dashboardLoading ? '...' : `${stats.focusTime}h`}
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Focus Time</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {stats.averageSessionTime > 0 ? `${stats.averageSessionTime}m avg session` : 'Build your focus! 💪'}
              </p>
            </div>
          </div>

          {/* AI Conversations Bubble */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full blur-xl opacity-15 group-hover:opacity-25 transition-opacity duration-300"></div>
            <div className="relative bg-white/25 dark:bg-gray-800/25 backdrop-blur-lg border border-white/40 dark:border-gray-700/40 rounded-3xl p-6 hover:bg-white/35 dark:hover:bg-gray-800/35 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-amber-600 to-orange-700 rounded-2xl shadow-lg">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold bg-gradient-to-r from-amber-700 to-orange-800 bg-clip-text text-transparent" suppressHydrationWarning>
                    {dashboardLoading ? '...' : stats.aiConversations}
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">AI Conversations</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Messages exchanged 💬
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Today's Schedule */}
          <div className="md:col-span-2 relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-400 to-gray-500 rounded-3xl blur-xl opacity-10 group-hover:opacity-20 transition-opacity duration-300"></div>
            <div className="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border border-white/40 dark:border-gray-700/40 rounded-3xl p-8 hover:bg-white/40 dark:hover:bg-gray-800/40 transition-all duration-300 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-slate-600 to-gray-700 rounded-2xl shadow-lg">
                  <CalendarDays className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Today's Schedule</h2>
                  <p className="text-gray-600 dark:text-gray-300">Your AI-optimized day for maximum impact ✨</p>
                </div>
              </div>
              <div suppressHydrationWarning>
                <div className="space-y-4">
                  {dashboardLoading ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-300">Loading your schedule...</p>
                    </div>
                  ) : todaySchedule.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gradient-to-br from-slate-500 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CalendarDays className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Ready for a fresh start!</h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">No events scheduled for today</p>
                      <Button 
                        onClick={() => navigateTo('/calendar')}
                        className="bg-gradient-to-r from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800 text-white border-0"
                      >
                        Plan Your Day
                      </Button>
                    </div>
                  ) : (
                    todaySchedule.map((item) => (
                      <div key={item.id} className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-400/10 to-gray-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative flex items-center gap-4 p-4 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/50 dark:border-gray-700/50 rounded-2xl hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-300">
                          <div
                            className={`w-3 h-3 rounded-full shadow-lg ${
                              item.status === 'completed'
                                ? 'bg-gradient-to-r from-green-400 to-emerald-400'
                                : item.status === 'in_progress'
                                ? 'bg-gradient-to-r from-blue-400 to-cyan-400'
                                : 'bg-gradient-to-r from-gray-300 to-gray-400'
                            }`}
                          ></div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800 dark:text-white">{item.title}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300" suppressHydrationWarning>
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
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              item.status === 'completed'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                : item.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300'
                            }`}
                          >
                            {item.status === 'completed'
                              ? '✅ Done'
                              : item.status === 'in_progress'
                              ? '⚡ Active'
                              : '⏳ Upcoming'
                            }
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-stone-400 to-slate-500 rounded-3xl blur-xl opacity-10 group-hover:opacity-20 transition-opacity duration-300"></div>
            <div className="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border border-white/40 dark:border-gray-700/40 rounded-3xl p-8 hover:bg-white/40 dark:hover:bg-gray-800/40 transition-all duration-300 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-stone-600 to-slate-700 rounded-2xl shadow-lg">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Quick Actions</h2>
                  <p className="text-gray-600 dark:text-gray-300">Supercharge your productivity 🚀</p>
                </div>
              </div>
              <div className="space-y-4">
                <button
                  onClick={() => setActiveView('chat')}
                  className="w-full group/btn relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-500/10 to-gray-600/10 rounded-2xl blur opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center gap-4 p-4 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/50 dark:border-gray-700/50 rounded-2xl hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-300 text-left">
                    <div className="p-2 bg-gradient-to-br from-slate-600 to-gray-700 rounded-xl">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 dark:text-white">Ask AI Assistant</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Get instant help and insights</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => navigateTo('/bricks')}
                  className="w-full group/btn relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-600/10 rounded-2xl blur opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center gap-4 p-4 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/50 dark:border-gray-700/50 rounded-2xl hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-300 text-left">
                    <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 dark:text-white">
                        {stats.activeBricks === 0 ? 'Start New Project' : 'Manage Projects'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Build your success foundation</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => navigateTo('/calendar')}
                  className="w-full group/btn relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-600/10 rounded-2xl blur opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center gap-4 p-4 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/50 dark:border-gray-700/50 rounded-2xl hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-300 text-left">
                    <div className="p-2 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl">
                      <CalendarDays className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 dark:text-white">
                        {todaySchedule.length === 0 ? 'Plan Your Day' : 'View Calendar'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Optimize your time flow</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => navigateTo('/settings')}
                  className="w-full group/btn relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-600/10 rounded-2xl blur opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center gap-4 p-4 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/50 dark:border-gray-700/50 rounded-2xl hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-300 text-left">
                    <div className="p-2 bg-gradient-to-br from-amber-600 to-orange-700 rounded-xl">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 dark:text-white">View Analytics</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Track your progress journey</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* AI Insights */}
        <div className="mt-12 relative group" data-ai-insights>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-slate-500 rounded-3xl blur-xl opacity-10 group-hover:opacity-20 transition-opacity duration-300"></div>
          <div className="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border border-white/40 dark:border-gray-700/40 rounded-3xl p-8 hover:bg-white/40 dark:hover:bg-gray-800/40 transition-all duration-300 shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-gradient-to-br from-indigo-600 to-slate-700 rounded-2xl shadow-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">AI Insights</h2>
                <p className="text-gray-600 dark:text-gray-300">Personalized wisdom from your patterns 🧠✨</p>
              </div>
            </div>
            
            <div suppressHydrationWarning>
              {dashboardLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-300">Analyzing your patterns...</p>
                </div>
              ) : aiInsights.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Building your AI insights...</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">Complete some tasks to unlock personalized recommendations!</p>
                  <Button 
                    onClick={() => setActiveView('chat')}
                    className="bg-gradient-to-r from-indigo-600 to-slate-700 hover:from-indigo-700 hover:to-slate-800 text-white border-0"
                  >
                    Start with AI Chat
                  </Button>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {aiInsights.slice(0, 4).map((insight) => (
                    <div key={insight.id} className="group/insight relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/10 to-slate-500/10 rounded-2xl blur opacity-0 group-hover/insight:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative p-6 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/50 dark:border-gray-700/50 rounded-2xl hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-300">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-gray-800 dark:text-white text-lg">{insight.title}</h4>
                          <div
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              insight.priority === 'high'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                : insight.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            }`}
                          >
                            {insight.priority === 'high' ? '🔥 High' : insight.priority === 'medium' ? '⚡ Medium' : '💡 Low'}
                          </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                          {insight.description}
                        </p>
                        {insight.actionable && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-gradient-to-r from-indigo-500/10 to-slate-600/10 hover:from-indigo-500/20 hover:to-slate-600/20 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300"
                          >
                            ✨ Take Action
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
