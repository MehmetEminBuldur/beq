'use client';

import { Navigation } from '@/components/layout/navigation';
import { FileText, Clock, Users, Zap } from 'lucide-react';

export default function NotesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 dark:from-slate-900 dark:via-gray-900 dark:to-stone-900">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-slate-300 to-gray-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-stone-300 to-slate-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-gradient-to-br from-gray-300 to-zinc-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <Navigation />

      <main className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl mb-6 shadow-2xl">
              <FileText className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-700 via-gray-800 to-stone-700 bg-clip-text text-transparent mb-4">
              Notes
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Your personal knowledge management system is being crafted with care
            </p>
          </div>

          {/* Progress Section */}
          <div className="relative group mb-12">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-300 to-gray-400 rounded-3xl blur-2xl opacity-10 group-hover:opacity-15 transition-opacity duration-500"></div>
            <div className="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 rounded-3xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                  Development Progress
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  We're building something amazing for you
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">50%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full shadow-lg transition-all duration-1000 ease-out"
                    style={{ width: '50%' }}
                  ></div>
                </div>
              </div>

              {/* Features Preview */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/50 dark:border-gray-700/50 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">Rich Text Editor</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Create and format your notes with a powerful, intuitive editor
                  </p>
                </div>

                <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/50 dark:border-gray-700/50 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">Smart Organization</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    AI-powered tagging and categorization for easy retrieval
                  </p>
                </div>

                <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/50 dark:border-gray-700/50 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">Version History</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Never lose your work with automatic versioning and backups
                  </p>
                </div>

                <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/50 dark:border-gray-700/50 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">Collaboration</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Share and collaborate on notes with your team members
                  </p>
                </div>
              </div>

              {/* Coming Soon Message */}
              <div className="text-center mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  Coming Soon!
                </h3>
                <p className="text-blue-600 dark:text-blue-300">
                  We're putting the finishing touches on your Notes experience. 
                  Stay tuned for something extraordinary!
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
