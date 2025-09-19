'use client';

import { motion } from 'framer-motion';
import { Lightbulb, TrendingUp, Clock, Target, AlertTriangle } from 'lucide-react';
import { useDashboard } from '@/lib/hooks/use-dashboard';

export function AiInsightsSidebar() {
  const { aiInsights } = useDashboard();

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'productivity_pattern':
        return TrendingUp;
      case 'break_recommendation':
        return Clock;
      case 'goal_progress':
        return Target;
      case 'learning_suggestion':
        return Lightbulb;
      default:
        return Lightbulb;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900';
      case 'low':
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900';
    }
  };

  if (aiInsights.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">AI insights will appear here as you use BeQ</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          AI Insights
        </h3>
      </div>

      <div className="space-y-3">
        {aiInsights.slice(0, 3).map((insight, index) => {
          const Icon = getInsightIcon(insight.type);

          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-start gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  insight.priority === 'high'
                    ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                    : insight.priority === 'medium'
                    ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400'
                    : 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {insight.title}
                    </h4>
                    {insight.priority === 'high' && (
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                    {insight.description}
                  </p>
                  {insight.actionable && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                        Actionable
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {aiInsights.length > 3 && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            +{aiInsights.length - 3} more insights available
          </p>
        </div>
      )}
    </div>
  );
}
