'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, Clock, CheckCircle, AlertCircle, Target, ChevronRight, X } from 'lucide-react';
import { useBricks } from '@/lib/hooks/use-bricks';
import { Brick } from '@/lib/api/bricks';

export function BricksSidebar() {
  const { bricks, isLoading, getBrickStats } = useBricks();
  const [selectedBrick, setSelectedBrick] = useState<Brick | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
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
      case 'pending':
        return 'text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900';
      default:
        return 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-900';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      work: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      personal: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      health: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      learning: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      general: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  const handleBrickClick = (brick: Brick) => {
    setSelectedBrick(brick);
  };

  const closeDetailPane = () => {
    setSelectedBrick(null);
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading bricks...</p>
      </div>
    );
  }

  if (bricks.length === 0) {
    return (
      <div className="p-4 text-center">
        <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No bricks yet</p>
        <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 dark:text-primary-400 dark:bg-primary-900 dark:hover:bg-primary-800">
          <Plus className="h-4 w-4 mr-1" />
          Create Your First Brick
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 relative">
      <div className="flex items-center gap-2 mb-4">
        <Package className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Your Bricks
        </h3>
      </div>

      <div className="space-y-2">
        {bricks.slice(0, 5).map((brick, index) => (
          <motion.div
            key={brick.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm cursor-pointer hover:shadow-md transition-all dark:border-gray-700 dark:bg-gray-800"
            onClick={() => handleBrickClick(brick)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getStatusIcon(brick.status)}
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {brick.title}
                  </h4>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(brick.category)}`}>
                    {brick.category}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(brick.status)}`}>
                    {brick.status.replace('_', ' ')}
                  </span>
                </div>
                {brick.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                    {brick.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{brick.time_spent_minutes}m spent</span>
                  <span>{brick.completion_percentage}% done</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {bricks.length > 5 && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            +{bricks.length - 5} more bricks
          </p>
        </div>
      )}

      {/* Brick Detail Pane */}
      {selectedBrick && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="absolute inset-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedBrick.title}
            </h3>
            <button
              onClick={closeDetailPane}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Status and Category */}
            <div className="flex items-center gap-2">
              {getStatusIcon(selectedBrick.status)}
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(selectedBrick.category)}`}>
                {selectedBrick.category}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedBrick.status)}`}>
                {selectedBrick.status.replace('_', ' ')}
              </span>
            </div>

            {/* Description */}
            {selectedBrick.description && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Description</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedBrick.description}
                </p>
              </div>
            )}

            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Progress</h4>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedBrick.completion_percentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${selectedBrick.completion_percentage}%` }}
                ></div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Time Spent</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedBrick.time_spent_minutes} minutes
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Sessions</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedBrick.sessions_count} sessions
                </p>
              </div>
            </div>

            {/* Priority */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Priority</h4>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                selectedBrick.priority === 'urgent'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  : selectedBrick.priority === 'high'
                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                  : selectedBrick.priority === 'medium'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
              }`}>
                {selectedBrick.priority}
              </span>
            </div>

            {/* Dates */}
            {(selectedBrick.target_date || selectedBrick.deadline) && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Dates</h4>
                <div className="space-y-1">
                  {selectedBrick.target_date && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Target: {new Date(selectedBrick.target_date).toLocaleDateString()}
                    </p>
                  )}
                  {selectedBrick.deadline && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Deadline: {new Date(selectedBrick.deadline).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors">
                Continue Working
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors">
                View Details
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
