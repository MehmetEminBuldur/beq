'use client';

import { motion } from 'framer-motion';
import { Bot, User, Calendar, Target, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessageProps {
  message: {
    id: string;
    conversation_id: string;
    content: string;
    response?: string;
    sender: 'user' | 'assistant';
    timestamp: Date;
    type?: 'text' | 'schedule' | 'task' | 'resource';
    metadata?: {
      model_used?: string;
      confidence_score?: number;
      processing_time_ms?: number;
      actions_taken?: string[];
      suggestions?: string[];
      schedule_updated?: boolean;
      bricks_created?: string[];
      bricks_updated?: string[];
      resources_recommended?: string[];
    };
  };
  isLast?: boolean;
}

export function ChatMessage({ message, isLast }: ChatMessageProps) {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 flex-shrink-0">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}

      <div className={`max-w-[80%] ${isUser ? 'order-first' : ''}`}>
        <div
          className={`rounded-lg px-4 py-3 ${
            isUser
              ? 'bg-primary-600 text-white'
              : isSystem
              ? 'bg-yellow-50 border border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200'
              : 'bg-white border border-gray-200 text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-white'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 inline-flex items-center gap-1"
                    >
                      {children}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ),
                  code: ({ className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    return match ? (
                      <pre className="bg-gray-100 dark:bg-gray-900 rounded p-2 overflow-x-auto">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    ) : (
                      <code
                        className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded text-sm"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Actions and metadata */}
        {!isUser && message.metadata?.actions_taken && message.metadata.actions_taken.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-2 text-xs text-gray-500 dark:text-gray-400"
          >
            <div className="flex items-center gap-2">
              <Target className="h-3 w-3" />
              <span>Actions: {message.metadata.actions_taken.join(', ')}</span>
            </div>
          </motion.div>
        )}

        {/* Schedule Updated */}
        {!isUser && message.metadata?.schedule_updated && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-3 rounded-lg bg-purple-50 border border-purple-200 p-3 dark:bg-purple-900/20 dark:border-purple-800"
          >
            <div className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Schedule Updated</span>
            </div>
          </motion.div>
        )}

        {/* Created Bricks */}
        {!isUser && message.metadata?.bricks_created && message.metadata.bricks_created.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-3 rounded-lg bg-green-50 border border-green-200 p-3 dark:bg-green-900/20 dark:border-green-800"
          >
            <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <Target className="h-4 w-4" />
              <span className="text-sm font-medium">New Bricks Created ({message.metadata.bricks_created.length})</span>
            </div>
          </motion.div>
        )}

        {/* Updated Bricks */}
        {!isUser && message.metadata?.bricks_updated && message.metadata.bricks_updated.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-3 rounded-lg bg-orange-50 border border-orange-200 p-3 dark:bg-orange-900/20 dark:border-orange-800"
          >
            <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
              <Target className="h-4 w-4" />
              <span className="text-sm font-medium">Bricks Updated ({message.metadata.bricks_updated.length})</span>
            </div>
          </motion.div>
        )}

        {/* Recommended Resources */}
        {!isUser && message.metadata?.resources_recommended && message.metadata.resources_recommended.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-3 rounded-lg bg-blue-50 border border-blue-200 p-3 dark:bg-blue-900/20 dark:border-blue-800"
          >
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <ExternalLink className="h-4 w-4" />
              <span className="text-sm font-medium">Recommended Resources ({message.metadata.resources_recommended.length})</span>
            </div>
          </motion.div>
        )}

        {/* AI Metadata */}
        {!isUser && message.metadata && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="mt-2 text-xs text-gray-400 dark:text-gray-500"
          >
            {message.metadata.model_used && (
              <span>Model: {message.metadata.model_used}</span>
            )}
            {message.metadata.processing_time_ms && (
              <span className="ml-2">
                Time: {(message.metadata.processing_time_ms / 1000).toFixed(1)}s
              </span>
            )}
            {message.metadata.confidence_score && (
              <span className="ml-2">
                Confidence: {(message.metadata.confidence_score * 100).toFixed(0)}%
              </span>
            )}
          </motion.div>
        )}

        {/* Suggestions */}
        {!isUser && message.metadata?.suggestions && message.metadata.suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-3 flex flex-wrap gap-2"
          >
            {message.metadata.suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                {suggestion}
              </button>
            ))}
          </motion.div>
        )}

        {/* Timestamp */}
        {message.timestamp && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {message.timestamp.toLocaleTimeString()}
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-600 flex-shrink-0">
          <User className="h-4 w-4 text-white" />
        </div>
      )}
    </motion.div>
  );
}
