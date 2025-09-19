'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Plus,
  CalendarDays,
  TrendingUp,
  Play,
  CheckCircle,
  Target,
  Clock,
  Brain,
  Zap,
  Coffee
} from 'lucide-react';

interface DynamicQuickActionsProps {
  stats: {
    activeBricks: number;
    pendingBricks: number;
    completedToday: number;
    aiConversations: number;
  };
  todaySchedule: Array<{
    id: string;
    title: string;
    status: 'completed' | 'in_progress' | 'upcoming';
    type: string;
  }>;
  aiInsights: Array<{
    id: string;
    type: string;
    title: string;
    priority: 'low' | 'medium' | 'high';
    actionable: boolean;
  }>;
  isLoading: boolean;
  onChatClick: () => void;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  variant: 'default' | 'outline' | 'secondary' | 'destructive';
  priority: number; // Higher number = higher priority
  description?: string;
  onClick: () => void;
  showBadge?: boolean;
  badgeText?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export function DynamicQuickActions({
  stats,
  todaySchedule,
  aiInsights,
  isLoading,
  onChatClick
}: DynamicQuickActionsProps) {
  const router = useRouter();

  const quickActions = useMemo((): QuickAction[] => {
    const actions: QuickAction[] = [];

    // Always available actions
    actions.push({
      id: 'chat',
      label: 'Ask AI Assistant',
      icon: MessageSquare,
      variant: 'default',
      priority: 5,
      description: 'Get help with planning and tasks',
      onClick: onChatClick
    });

    // Dynamic actions based on stats
    if (stats.pendingBricks > 0) {
      actions.push({
        id: 'pending-bricks',
        label: 'View Pending Tasks',
        icon: Target,
        variant: 'outline',
        priority: 8,
        description: `${stats.pendingBricks} tasks waiting`,
        onClick: () => router.push('/bricks'),
        showBadge: true,
        badgeText: stats.pendingBricks.toString(),
        badgeVariant: 'secondary'
      });
    }

    if (stats.activeBricks === 0) {
      actions.push({
        id: 'create-brick',
        label: 'Start New Project',
        icon: Plus,
        variant: 'outline',
        priority: 7,
        description: 'Create your first brick',
        onClick: () => router.push('/bricks')
      });
    } else {
      actions.push({
        id: 'manage-bricks',
        label: 'Manage Projects',
        icon: Target,
        variant: 'outline',
        priority: 6,
        description: `${stats.activeBricks} active projects`,
        onClick: () => router.push('/bricks'),
        showBadge: true,
        badgeText: stats.activeBricks.toString(),
        badgeVariant: 'default'
      });
    }

    // Schedule-based actions
    const inProgressTasks = todaySchedule.filter(item => item.status === 'in_progress');
    const upcomingTasks = todaySchedule.filter(item => item.status === 'upcoming');

    if (inProgressTasks.length > 0) {
      actions.push({
        id: 'continue-task',
        label: 'Continue Current Task',
        icon: Play,
        variant: 'secondary',
        priority: 9,
        description: inProgressTasks[0].title,
        onClick: () => router.push('/bricks'),
        showBadge: true,
        badgeText: inProgressTasks.length.toString(),
        badgeVariant: 'default'
      });
    }

    if (upcomingTasks.length > 0) {
      actions.push({
        id: 'next-task',
        label: 'View Next Task',
        icon: Clock,
        variant: 'outline',
        priority: 4,
        description: upcomingTasks[0].title,
        onClick: () => router.push('/calendar')
      });
    }

    // AI insights based actions
    const highPriorityInsights = aiInsights.filter(insight => insight.priority === 'high');
    if (highPriorityInsights.length > 0) {
      actions.push({
        id: 'ai-insight',
        label: 'AI Recommendation',
        icon: Brain,
        variant: 'destructive',
        priority: 10,
        description: highPriorityInsights[0].title,
        onClick: () => {
          // Scroll to AI insights section
          const insightsSection = document.querySelector('[data-ai-insights]');
          if (insightsSection) {
            insightsSection.scrollIntoView({ behavior: 'smooth' });
          }
        },
        showBadge: true,
        badgeText: '!',
        badgeVariant: 'destructive'
      });
    }

    // Productivity-based actions
    if (stats.completedToday === 0 && stats.activeBricks > 0) {
      actions.push({
        id: 'start-day',
        label: 'Start Your Day',
        icon: Zap,
        variant: 'default',
        priority: 8,
        description: 'Begin working on your tasks',
        onClick: () => router.push('/bricks')
      });
    }

    if (stats.completedToday > 0) {
      actions.push({
        id: 'celebrate',
        label: 'View Progress',
        icon: CheckCircle,
        variant: 'outline',
        priority: 3,
        description: `${stats.completedToday} tasks completed today`,
        onClick: () => router.push('/bricks'),
        showBadge: true,
        badgeText: '✓',
        badgeVariant: 'default'
      });
    }

    // Break recommendation (mock for now)
    const breakInsights = aiInsights.filter(insight => insight.type === 'break_recommendation');
    if (breakInsights.length > 0) {
      actions.push({
        id: 'take-break',
        label: 'Take a Break',
        icon: Coffee,
        variant: 'secondary',
        priority: 7,
        description: breakInsights[0].title,
        onClick: () => {
          // Could open a break timer or just show a message
          alert('Time for a well-deserved break! ☕');
        }
      });
    }

    // Schedule management
    if (todaySchedule.length === 0) {
      actions.push({
        id: 'schedule-day',
        label: 'Plan Your Day',
        icon: CalendarDays,
        variant: 'outline',
        priority: 6,
        description: 'Create a schedule for today',
        onClick: () => router.push('/calendar')
      });
    }

    // Analytics (always available but lower priority)
    actions.push({
      id: 'analytics',
      label: 'View Analytics',
      icon: TrendingUp,
      variant: 'outline',
      priority: 2,
      description: 'See your productivity trends',
      onClick: () => router.push('/settings') // Could be a dedicated analytics page
    });

    // Sort by priority (highest first) and take top 4
    return actions
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 4);

  }, [stats, todaySchedule, aiInsights, onChatClick, router]);

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-10 w-32 bg-muted rounded-md"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-3">
        {quickActions.map((action) => (
          <div key={action.id} className="relative">
            <Button
              onClick={action.onClick}
              variant={action.variant}
              className="flex items-center gap-2 min-w-[120px]"
              title={action.description}
            >
              <action.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{action.label}</span>
              <span className="sm:hidden">{action.label.split(' ')[0]}</span>
            </Button>
            {action.showBadge && action.badgeText && (
              <Badge
                variant={action.badgeVariant}
                className="absolute -top-2 -right-2 text-xs px-1.5 py-0.5 min-w-[18px] h-5 flex items-center justify-center"
              >
                {action.badgeText}
              </Badge>
            )}
          </div>
        ))}
      </div>

      {/* Action descriptions for better UX */}
      <div className="mt-3 text-xs text-muted-foreground">
        {quickActions.length > 0 && (
          <span>💡 {quickActions[0].description}</span>
        )}
      </div>
    </div>
  );
}
