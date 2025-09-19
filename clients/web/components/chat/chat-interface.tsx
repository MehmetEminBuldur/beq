'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Calendar, Target, Lightbulb } from 'lucide-react';
import { useChat } from '@/lib/hooks/use-chat';
import { useDashboard } from '@/lib/hooks/use-dashboard';
import { useAuthContext } from '@/lib/providers/auth-provider';
import { ChatMessage } from './chat-message';
import { SuggestedActions } from './suggested-actions';
import { ScheduleView } from './schedule-view';
import { AiInsightsSidebar } from './ai-insights-sidebar';

export function ChatInterface() {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarView, setSidebarView] = useState<'schedule' | 'insights'>('schedule');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { user } = useAuthContext();
  const { stats, todaySchedule, aiInsights } = useDashboard();
  const { messages, sendMessage, isLoading } = useChat();

  // Generate dynamic welcome message based on user state
  const getDynamicWelcomeMessage = () => {
    if (!user) return "Welcome to BeQ! 👋";

    const firstName = user.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'there';

    if (stats.activeBricks === 0) {
      return `Welcome to BeQ, ${firstName}! 👋`;
    }

    if (stats.completedToday > 0) {
      return `Great work today, ${firstName}! 🎉`;
    }

    if (todaySchedule.length > 0) {
      const inProgressTasks = todaySchedule.filter(t => t.status === 'in_progress');
      if (inProgressTasks.length > 0) {
        return `Ready to continue, ${firstName}? 🚀`;
      }
    }

    return `Welcome back, ${firstName}! 👋`;
  };

  // Generate dynamic description based on user state
  const getDynamicDescription = () => {
    if (stats.activeBricks === 0) {
      return "I'm here to help you organize your life using the Bricks and Quantas system. Let's get you started!";
    }

    if (stats.completedToday > 0) {
      return `You've completed ${stats.completedToday} task${stats.completedToday > 1 ? 's' : ''} today. What would you like to work on next?`;
    }

    if (stats.pendingBricks > 0) {
      return `You have ${stats.pendingBricks} pending task${stats.pendingBricks > 1 ? 's' : ''} waiting. How can I help you tackle them?`;
    }

    return `You have ${stats.activeBricks} active project${stats.activeBricks > 1 ? 's' : ''}. Tell me about your goals or ask me anything!`;
  };

  // Generate dynamic suggested actions based on user context
  const getDynamicSuggestions = () => {
    const suggestions = [];

    // Based on active bricks
    if (stats.activeBricks > 0) {
      suggestions.push(`Help me work on my ${stats.activeBricks} active project${stats.activeBricks > 1 ? 's' : ''}`);
    } else {
      suggestions.push("Help me create my first project");
    }

    // Based on today's schedule
    if (todaySchedule.length > 0) {
      const inProgressTasks = todaySchedule.filter(t => t.status === 'in_progress');
      const upcomingTasks = todaySchedule.filter(t => t.status === 'upcoming');

      if (inProgressTasks.length > 0) {
        suggestions.push(`Help me continue working on "${inProgressTasks[0].title}"`);
      } else if (upcomingTasks.length > 0) {
        suggestions.push(`What's next after "${upcomingTasks[0].title}"?`);
      }
    } else {
      suggestions.push("Help me plan my day");
    }

    // Based on AI insights
    if (aiInsights.length > 0) {
      const highPriorityInsights = aiInsights.filter(i => i.priority === 'high');
      if (highPriorityInsights.length > 0) {
        suggestions.push(`Address: "${highPriorityInsights[0].title}"`);
      }
    }

    // Based on productivity patterns
    if (stats.completedToday === 0 && stats.activeBricks > 0) {
      suggestions.push("Help me get started on my tasks today");
    }

    // Always include some general suggestions
    if (suggestions.length < 4) {
      const generalSuggestions = [
        "Help me learn Spanish - I'm a complete beginner",
        "I need to prepare for a presentation next week",
        "Create a morning routine that includes meditation",
        "Help me organize my work schedule better"
      ];

      // Add general suggestions to fill up to 4
      for (let i = suggestions.length; i < 4 && i < generalSuggestions.length; i++) {
        suggestions.push(generalSuggestions[i]);
      }
    }

    return suggestions.slice(0, 4); // Return max 4 suggestions
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');
    setIsTyping(true);

    try {
      await sendMessage(message);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSuggestedAction = (action: string) => {
    setInput(action);
    inputRef.current?.focus();
  };

  return (
    <div className="flex h-full flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              BeQ Assistant
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your AI-powered life management companion
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat area */}
        <div className="flex flex-1 flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="mx-auto max-w-3xl space-y-6">
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <div className="mb-6 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
                      <Bot className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                    </div>
                  </div>
                  <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                    {getDynamicWelcomeMessage()}
                  </h2>
                  <p className="mb-8 text-gray-600 dark:text-gray-300">
                    {getDynamicDescription()}
                  </p>

                  <SuggestedActions
                    suggestions={getDynamicSuggestions()}
                    onSelect={handleSuggestedAction}
                  />
                </motion.div>
              ) : (
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <ChatMessage
                      key={message.id || index}
                      message={message}
                      isLast={index === messages.length - 1}
                    />
                  ))}
                </AnimatePresence>
              )}

              {/* Typing indicator */}
              {(isLoading || isTyping) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex items-center gap-1 rounded-lg bg-white px-4 py-2 shadow-sm dark:bg-gray-800">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      BeQ is thinking...
                    </span>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input area */}
          <div className="border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-800">
            <div className="mx-auto max-w-3xl">
              <form onSubmit={handleSubmit} className="flex gap-4">
                <div className="flex-1">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask BeQ to help organize your life..."
                    rows={1}
                    className="block w-full resize-none rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary-400 dark:focus:ring-primary-400"
                    style={{
                      minHeight: '52px',
                      maxHeight: '120px',
                      height: Math.min(52 + (input.split('\n').length - 1) * 20, 120) + 'px'
                    }}
                    disabled={isLoading}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="flex h-[52px] w-[52px] items-center justify-center rounded-lg bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:focus:ring-offset-gray-800"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </motion.button>
              </form>
              
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden w-80 border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800 lg:flex lg:flex-col">
          {/* Sidebar tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setSidebarView('schedule')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                sidebarView === 'schedule'
                  ? 'text-primary-600 border-b-2 border-primary-600 dark:text-primary-400 dark:border-primary-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Calendar className="h-4 w-4 inline mr-2" />
              Schedule
            </button>
            <button
              onClick={() => setSidebarView('insights')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                sidebarView === 'insights'
                  ? 'text-primary-600 border-b-2 border-primary-600 dark:text-primary-400 dark:border-primary-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Lightbulb className="h-4 w-4 inline mr-2" />
              Insights
            </button>
          </div>

          {/* Sidebar content */}
          <div className="flex-1 overflow-hidden">
            {sidebarView === 'schedule' ? (
              <ScheduleView />
            ) : (
              <AiInsightsSidebar />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
