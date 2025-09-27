'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Calendar, Target, Lightbulb, Package, Zap } from 'lucide-react';
import { useChat } from '@/lib/hooks/use-chat';
import { useDashboard } from '@/lib/hooks/use-dashboard';
import { useBricks } from '@/lib/hooks/use-bricks';
import { useAuthContext } from '@/lib/providers/auth-provider';
import { ChatMessage } from './chat-message';
import { SuggestedActions } from './suggested-actions';
import { ScheduleView } from './schedule-view';
import { AiInsightsSidebar } from './ai-insights-sidebar';
import { BricksSidebar } from './bricks-sidebar';
import { QuantasSidebar } from './quantas-sidebar';

export function ChatInterface() {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarView, setSidebarView] = useState<'schedule' | 'insights' | 'bricks' | 'quantas'>('schedule');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { user } = useAuthContext();
  const { stats, todaySchedule, aiInsights } = useDashboard();
  const { bricks, isLoading: bricksLoading } = useBricks();
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
      return "I'm here to help you organize your life using the Bricks and Quantas system. Bricks are your main projects, and Quantas are the actionable steps within them. Let's get you started!";
    }

    if (stats.completedToday > 0) {
      return `You've completed ${stats.completedToday} task${stats.completedToday > 1 ? 's' : ''} today. Ready to break down more projects into quantas or work on existing ones?`;
    }

    if (stats.pendingBricks > 0) {
      return `You have ${stats.pendingBricks} pending task${stats.pendingBricks > 1 ? 's' : ''} waiting. I can help you break them down into manageable quantas!`;
    }

    return `You have ${stats.activeBricks} active project${stats.activeBricks > 1 ? 's' : ''}. I can help you create quantas (actionable steps) or work on existing ones. Tell me about your goals!`;
  };

  // Generate dynamic suggested actions based on user context
  const getDynamicSuggestions = () => {
    const suggestions = [];

    // Based on active bricks - prioritize quanta creation
    if (stats.activeBricks > 0) {
      suggestions.push(`Help me work on my ${stats.activeBricks} active project${stats.activeBricks > 1 ? 's' : ''}`);
      // Add quanta-specific suggestion
      suggestions.push("Break down my current project into smaller tasks (quantas)");
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

    // Always include some general suggestions with quanta focus
    if (suggestions.length < 4) {
      const generalSuggestions = [
        "Help me learn Spanish - break it into daily quantas",
        "I need to prepare for a presentation - create step-by-step quantas",
        "Create a morning routine with specific quantas",
        "Help me organize my work schedule with actionable quantas"
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
    <div className="flex h-full w-full flex-col bg-white/20 dark:bg-gray-900/20 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 rounded-3xl shadow-2xl m-4">
      {/* Header */}
      <div className="border-b border-white/30 dark:border-gray-700/30 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm px-6 py-4 rounded-t-3xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
              BeQ Assistant
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your AI-powered life management companion
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat area */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
            <div className="mx-auto max-w-3xl space-y-6">
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <div className="mb-6 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/50 dark:to-indigo-900/50 backdrop-blur-sm border border-white/40 dark:border-gray-700/40 shadow-lg">
                      <Bot className="h-8 w-8 text-blue-600 dark:text-blue-400" />
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
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex items-center gap-1 rounded-lg bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm px-4 py-2 shadow-lg border border-white/40 dark:border-gray-700/40">
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
          <div className="border-t border-white/30 dark:border-gray-700/30 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm px-6 py-4 rounded-b-3xl">
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
                    className="block w-full resize-none rounded-xl border border-white/40 dark:border-gray-700/40 bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400 dark:focus:ring-blue-400 shadow-lg"
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
                  className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 dark:focus:ring-offset-gray-800"
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
        <div className="hidden w-80 border-l border-white/30 dark:border-gray-700/30 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm lg:flex lg:flex-col rounded-r-3xl">
          {/* Sidebar tabs */}
          <div className="flex border-b border-white/30 dark:border-gray-700/30 rounded-tr-3xl bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm">
            <button
              onClick={() => setSidebarView('schedule')}
              className={`flex-1 px-3 py-3 text-xs font-medium transition-colors ${
                sidebarView === 'schedule'
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Calendar className="h-4 w-4 inline mr-1" />
              Schedule
            </button>
            <button
              onClick={() => setSidebarView('bricks')}
              className={`flex-1 px-3 py-3 text-xs font-medium transition-colors ${
                sidebarView === 'bricks'
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Package className="h-4 w-4 inline mr-1" />
              Bricks
            </button>
            <button
              onClick={() => setSidebarView('quantas')}
              className={`flex-1 px-3 py-3 text-xs font-medium transition-colors ${
                sidebarView === 'quantas'
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Zap className="h-4 w-4 inline mr-1" />
              Quantas
            </button>
            <button
              onClick={() => setSidebarView('insights')}
              className={`flex-1 px-3 py-3 text-xs font-medium transition-colors ${
                sidebarView === 'insights'
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Lightbulb className="h-4 w-4 inline mr-1" />
              Insights
            </button>
          </div>

          {/* Sidebar content */}
          <div className="flex-1 overflow-hidden">
            {sidebarView === 'schedule' ? (
              <ScheduleView />
            ) : sidebarView === 'bricks' ? (
              <BricksSidebar />
            ) : sidebarView === 'quantas' ? (
              <QuantasSidebar />
            ) : (
              <AiInsightsSidebar />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
