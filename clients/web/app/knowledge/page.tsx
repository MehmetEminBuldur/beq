'use client';

import { Navigation } from '@/components/layout/navigation';
import { BookOpen, Search, Brain, Share2, Archive, Bookmark } from 'lucide-react';

export default function KnowledgeBasePage() {
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
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl mb-6 shadow-2xl">
              <BookOpen className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-700 via-gray-800 to-stone-700 bg-clip-text text-transparent mb-4">
              Knowledge Base
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Your centralized hub for shared knowledge and collaborative learning
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
                  Building your knowledge ecosystem
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">50%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 h-3 rounded-full shadow-lg transition-all duration-1000 ease-out"
                    style={{ width: '50%' }}
                  ></div>
                </div>
              </div>

              {/* Features Preview */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/50 dark:border-gray-700/50 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                      <Search className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">Smart Search</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Find any information instantly with AI-powered semantic search
                  </p>
                </div>

                <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/50 dark:border-gray-700/50 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">AI Insights</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Get intelligent suggestions and connections between topics
                  </p>
                </div>

                <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/50 dark:border-gray-700/50 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                      <Share2 className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">Team Sharing</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Share knowledge across teams with granular permissions
                  </p>
                </div>

                <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/50 dark:border-gray-700/50 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
                      <Archive className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">Content Organization</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Organize content with categories, tags, and custom hierarchies
                  </p>
                </div>

                <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/50 dark:border-gray-700/50 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl">
                      <Bookmark className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">Bookmarking</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Save and organize important articles and resources
                  </p>
                </div>

                <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/50 dark:border-gray-700/50 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">Rich Content</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Support for documents, videos, images, and interactive content
                  </p>
                </div>
              </div>

              {/* Coming Soon Message */}
              <div className="text-center mt-8 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200 mb-2">
                  Coming Soon!
                </h3>
                <p className="text-emerald-600 dark:text-emerald-300">
                  We're building a powerful knowledge management system that will transform 
                  how you and your team share and discover information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
