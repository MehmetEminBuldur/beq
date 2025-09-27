'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Plus, Clock, CheckCircle, AlertCircle, Target, ChevronRight, X, Play, Pause, Square } from 'lucide-react';
import { useBricks } from '@/lib/hooks/use-bricks';
import { Quanta } from '@/lib/api/bricks';
import { useRouter } from 'next/navigation';

export function QuantasSidebar() {
  const { quantas, isLoading, updateQuanta, completeQuanta } = useBricks();
  const [selectedQuanta, setSelectedQuanta] = useState<Quanta | null>(null);
  const router = useRouter();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Play className="h-4 w-4 text-blue-500" />;
      case 'not_started':
        return <Square className="h-4 w-4 text-gray-400" />;
      case 'postponed':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      default:
        return <Target className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900';
      case 'in_progress':
        return 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900';
      case 'not_started':
        return 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-900';
      case 'postponed':
        return 'text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900';
      default:
        return 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-900';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleQuantaStatusChange = async (quantaId: string, newStatus: 'not_started' | 'in_progress' | 'completed') => {
    try {
      if (newStatus === 'completed') {
        await completeQuanta(quantaId);
      } else {
        await updateQuanta(quantaId, { status: newStatus });
      }
    } catch (error) {
      console.error('Failed to update quanta status:', error);
    }
  };

  const handleQuantaClick = (quanta: Quanta) => {
    setSelectedQuanta(quanta);
  };

  const closeDetailPane = () => {
    setSelectedQuanta(null);
  };

  const handleStartWorking = (quanta: Quanta) => {
    // Navigate to calendar page with the quanta pre-selected for scheduling
    router.push(`/calendar?quanta=${quanta.id}`);
  };

  // Group quantas by status for better organization
  const groupedQuantas = {
    in_progress: quantas.filter(q => q.status === 'in_progress'),
    not_started: quantas.filter(q => q.status === 'not_started'),
    completed: quantas.filter(q => q.status === 'completed'),
    postponed: quantas.filter(q => q.status === 'postponed'),
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading quantas...</p>
      </div>
    );
  }

  if (quantas.length === 0) {
    return (
      <div className="p-4 text-center">
        <Zap className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No quantas yet</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          Quantas are actionable steps within your Bricks. Ask me to break down your projects!
        </p>
        <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 dark:text-primary-400 dark:bg-primary-900 dark:hover:bg-primary-800">
          <Plus className="h-4 w-4 mr-1" />
          Create Your First Quanta
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 relative">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Your Quantas ({quantas.length})
        </h3>
      </div>

      <div className="space-y-4">
        {/* In Progress Quantas */}
        {groupedQuantas.in_progress.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
              In Progress ({groupedQuantas.in_progress.length})
            </h4>
            <div className="space-y-2">
              {groupedQuantas.in_progress.slice(0, 3).map((quanta, index) => (
                <QuantaCard
                  key={quanta.id}
                  quanta={quanta}
                  index={index}
                  onQuantaClick={handleQuantaClick}
                  onStatusChange={handleQuantaStatusChange}
                  getStatusIcon={getStatusIcon}
                  getStatusColor={getStatusColor}
                  getPriorityColor={getPriorityColor}
                />
              ))}
            </div>
          </div>
        )}

        {/* Not Started Quantas */}
        {groupedQuantas.not_started.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
              Ready to Start ({groupedQuantas.not_started.length})
            </h4>
            <div className="space-y-2">
              {groupedQuantas.not_started.slice(0, 3).map((quanta, index) => (
                <QuantaCard
                  key={quanta.id}
                  quanta={quanta}
                  index={index}
                  onQuantaClick={handleQuantaClick}
                  onStatusChange={handleQuantaStatusChange}
                  getStatusIcon={getStatusIcon}
                  getStatusColor={getStatusColor}
                  getPriorityColor={getPriorityColor}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recently Completed */}
        {groupedQuantas.completed.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
              Recently Completed ({groupedQuantas.completed.length})
            </h4>
            <div className="space-y-2">
              {groupedQuantas.completed.slice(0, 2).map((quanta, index) => (
                <QuantaCard
                  key={quanta.id}
                  quanta={quanta}
                  index={index}
                  onQuantaClick={handleQuantaClick}
                  onStatusChange={handleQuantaStatusChange}
                  getStatusIcon={getStatusIcon}
                  getStatusColor={getStatusColor}
                  getPriorityColor={getPriorityColor}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {quantas.length > 8 && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            +{quantas.length - 8} more quantas
          </p>
        </div>
      )}

      {/* Quanta Detail Pane */}
      <AnimatePresence>
        {selectedQuanta && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute inset-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-lg shadow-2xl border border-white/40 dark:border-gray-700/40 p-4 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedQuanta.title}
              </h3>
              <button
                onClick={closeDetailPane}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Status and Priority */}
              <div className="flex items-center gap-2">
                {getStatusIcon(selectedQuanta.status)}
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedQuanta.status)}`}>
                  {selectedQuanta.status.replace('_', ' ')}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedQuanta.priority)}`}>
                  {selectedQuanta.priority}
                </span>
              </div>

              {/* Description */}
              {selectedQuanta.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Description</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {selectedQuanta.description}
                  </p>
                </div>
              )}

              {/* Duration */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Estimated Duration</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedQuanta.estimated_duration_minutes} minutes
                </p>
              </div>

              {/* Quick Status Actions */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Quick Actions</h4>
                <div className="flex items-center gap-2">
                  {selectedQuanta.status !== 'not_started' && (
                    <button
                      onClick={() => handleQuantaStatusChange(selectedQuanta.id, 'not_started')}
                      className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <Square className="h-3 w-3" />
                      Reset
                    </button>
                  )}
                  {selectedQuanta.status !== 'in_progress' && (
                    <button
                      onClick={() => handleQuantaStatusChange(selectedQuanta.id, 'in_progress')}
                      className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-lg transition-colors"
                    >
                      <Play className="h-3 w-3" />
                      Start
                    </button>
                  )}
                  {selectedQuanta.status !== 'completed' && (
                    <button
                      onClick={() => handleQuantaStatusChange(selectedQuanta.id, 'completed')}
                      className="flex items-center gap-1 px-3 py-1 text-xs bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-300 rounded-lg transition-colors"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Complete
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button 
                  onClick={() => handleStartWorking(selectedQuanta)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Schedule Time
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Separate component for individual quanta cards
function QuantaCard({ 
  quanta, 
  index, 
  onQuantaClick, 
  onStatusChange, 
  getStatusIcon, 
  getStatusColor, 
  getPriorityColor 
}: {
  quanta: Quanta;
  index: number;
  onQuantaClick: (quanta: Quanta) => void;
  onStatusChange: (quantaId: string, status: 'not_started' | 'in_progress' | 'completed') => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="rounded-lg border border-white/40 dark:border-gray-700/40 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-3 shadow-lg cursor-pointer hover:shadow-xl hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all transform hover:scale-105"
      onClick={() => onQuantaClick(quanta)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {getStatusIcon(quanta.status)}
            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {quanta.title}
            </h4>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(quanta.priority)}`}>
              {quanta.priority}
            </span>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(quanta.status)}`}>
              {quanta.status.replace('_', ' ')}
            </span>
          </div>

          {quanta.description && (
            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
              {quanta.description}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{quanta.estimated_duration_minutes}m estimated</span>
            <span className="text-xs text-primary-600 dark:text-primary-400 opacity-70">• Click for details</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
