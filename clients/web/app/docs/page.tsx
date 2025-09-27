'use client';

import { Navigation } from '@/components/layout/navigation';
import { motion } from 'framer-motion';
import { BookOpen, Lightbulb, Target, Calendar, Brain, Sparkles } from 'lucide-react';

const sections = [
  {
    icon: BookOpen,
    title: 'Getting Started',
    description: 'Learn the basics of using BeQ for life management',
    items: [
      'Setting up your account',
      'Understanding Bricks and Quantas',
      'Your first goal setup',
      'Basic navigation guide'
    ]
  },
  {
    icon: Target,
    title: 'Bricks & Quantas System',
    description: 'Master our unique goal-breaking methodology',
    items: [
      'What are Bricks?',
      'Understanding Quantas',
      'Creating effective breakdowns',
      'Tracking progress efficiently'
    ]
  },
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description: 'Make the most of AI-powered time management',
    items: [
      'Calendar integration setup',
      'AI scheduling preferences',
      'Optimizing your routine',
      'Managing conflicts'
    ]
  },
  {
    icon: Brain,
    title: 'AI Assistant',
    description: 'Get the most out of your AI companion',
    items: [
      'Chat interface basics',
      'Natural language commands',
      'Personalization settings',
      'Advanced AI features'
    ]
  }
];

const quickStart = [
  {
    step: '1',
    title: 'Create Your Account',
    description: 'Sign up with email or social auth'
  },
  {
    step: '2',
    title: 'Set Your First Goal',
    description: 'Define what you want to achieve'
  },
  {
    step: '3',
    title: 'Break It Down',
    description: 'Let AI help create actionable Bricks'
  },
  {
    step: '4',
    title: 'Schedule & Execute',
    description: 'Follow your personalized timeline'
  }
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 dark:from-slate-900 dark:via-gray-900 dark:to-stone-900 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-slate-300 to-gray-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-stone-300 to-slate-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-gradient-to-br from-gray-300 to-zinc-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <Navigation />

      <div className="py-24 sm:py-32 relative z-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-2xl text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl mb-6 shadow-2xl">
              <BookOpen className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-700 via-gray-800 to-stone-700 bg-clip-text text-transparent sm:text-5xl">
              BeQ Documentation
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Everything you need to know about using BeQ for effective life management.
            </p>
          </motion.div>

          {/* Quick Start Guide */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mx-auto mt-16 max-w-4xl"
          >
            <div className="relative group mb-12">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-300 to-gray-400 rounded-3xl blur-2xl opacity-10 group-hover:opacity-15 transition-opacity duration-500"></div>
              <div className="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 rounded-3xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-4 shadow-lg">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Quick Start Guide</h2>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">Get up and running in minutes</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {quickStart.map((item, index) => (
                    <div key={item.step} className="text-center bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/50 dark:border-gray-700/50 rounded-2xl p-6 hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-300">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg font-semibold mb-4 shadow-lg">
                        {item.step}
                      </div>
                      <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Documentation Sections */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mx-auto mt-20 max-w-6xl"
          >
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Explore the Documentation</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">Dive deeper into BeQ's features and capabilities</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {sections.map((section, index) => (
                <div
                  key={section.title}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-300 to-gray-400 rounded-2xl blur-xl opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
                  <div className="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm border border-white/40 dark:border-gray-700/40 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/40 dark:hover:bg-gray-800/40">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                          <section.icon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                          {section.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                          {section.description}
                        </p>
                        <ul className="space-y-2">
                          {section.items.map((item, itemIndex) => (
                            <li
                              key={itemIndex}
                              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                            >
                              <div className="w-1.5 h-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full"></div>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Additional Resources */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mx-auto mt-20 max-w-4xl text-center"
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-300 to-gray-400 rounded-3xl blur-2xl opacity-10 group-hover:opacity-15 transition-opacity duration-500"></div>
              <div className="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 rounded-3xl p-8 shadow-2xl">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mb-6 shadow-lg">
                  <Lightbulb className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  Need More Help?
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Our support team is here to help you make the most of BeQ.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                    Contact Support
                  </button>
                  <button className="rounded-xl bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/50 dark:border-gray-700/50 px-6 py-3 text-sm font-semibold text-gray-800 dark:text-white hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                    Community Forum
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}