'use client';

import { motion } from 'framer-motion';
import { Sparkles, Calendar, Target, BookOpen, Dumbbell } from 'lucide-react';

interface SuggestedActionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

const suggestionIcons = [
  Calendar,
  BookOpen,
  Target,
  Dumbbell,
  Sparkles,
];

export function SuggestedActions({ suggestions, onSelect }: SuggestedActionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="grid gap-3 sm:grid-cols-2"
    >
      {suggestions.map((suggestion, index) => {
        const Icon = suggestionIcons[index % suggestionIcons.length];
        
        return (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(suggestion)}
            className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-primary-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-primary-600"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors dark:bg-primary-900 dark:text-primary-400">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors dark:text-white dark:group-hover:text-primary-400">
                  {suggestion}
                </p>
              </div>
            </div>
            
            {/* Hover effect gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>
        );
      })}
    </motion.div>
  );
}
