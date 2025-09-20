'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Target, Plus, ChevronRight, X } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { useDashboard } from '@/lib/hooks/use-dashboard';
import { useAuthContext } from '@/lib/providers/auth-provider';
import { toast } from 'react-hot-toast';

interface ScheduleEvent {
  id: string;
  title: string;
  time: string;
  duration: string;
  type: 'brick' | 'quanta' | 'event' | 'meeting';
  status: 'pending' | 'in_progress' | 'upcoming' | 'completed';
  color: string;
}

export function ScheduleView() {
  const { stats, todaySchedule } = useDashboard();
  const { user } = useAuthContext();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    type: 'event' as 'event' | 'meeting' | 'brick' | 'quanta',
    category: 'personal' as 'work' | 'personal' | 'health' | 'learning'
  });
  const [isAdding, setIsAdding] = useState(false);

  const startDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  // Transform dashboard schedule data to ScheduleEvent format
  const getEventsForDate = (date: Date) => {
    if (isSameDay(date, new Date())) {
      return todaySchedule.map((item): ScheduleEvent => {
        const start = new Date(item.start_time);
        const end = new Date(item.end_time);
        const durationMs = end.getTime() - start.getTime();
        const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
        const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

        let duration = '';
        if (durationHours > 0) {
          duration = `${durationHours}h`;
          if (durationMinutes > 0) duration += ` ${durationMinutes}m`;
        } else {
          duration = `${durationMinutes}m`;
        }

        return {
          id: item.id,
          title: item.title,
          time: format(start, 'HH:mm'),
          duration,
          type: item.type === 'brick' ? 'brick' : item.type === 'quanta' ? 'quanta' : 'event',
          status: item.status,
          color: item.status === 'completed' ? 'bg-green-500' :
                 item.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'
        };
      });
    }

    // For other dates, show empty array (could be enhanced to show scheduled items)
    return [];
  };

  const eventsForSelectedDate = getEventsForDate(selectedDate);

  const handleAddEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.startTime || !newEvent.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!user?.id) {
      toast.error('You must be logged in to add schedule items');
      return;
    }

    setIsAdding(true);

    try {
      // For now, we'll simulate adding to schedule by showing a success message
      // In a real implementation, this would call the schedule API
      const eventTime = `${newEvent.startTime} - ${newEvent.endTime}`;
      const eventType = newEvent.type === 'event' ? 'Event' : newEvent.type === 'meeting' ? 'Meeting' : 'Task';

      toast.success(`✅ Added "${newEvent.title}" to your schedule at ${eventTime}`);

      // Reset form
      setNewEvent({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        type: 'event',
        category: 'personal'
      });

      setShowAddModal(false);

      // In a real implementation, you would refresh the schedule data here
      // await refreshDashboard();

    } catch (error) {
      toast.error('Failed to add event to schedule');
      console.error('Error adding event:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleOpenAddModal = () => {
    // Pre-fill start time with current time + 1 hour
    const now = new Date();
    const startTime = format(now, 'HH:mm');
    const endTime = format(new Date(now.getTime() + 60 * 60 * 1000), 'HH:mm'); // 1 hour later

    setNewEvent({
      ...newEvent,
      startTime,
      endTime
    });

    setShowAddModal(true);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Schedule
          </h2>
          <button
            onClick={handleOpenAddModal}
            className="rounded-lg bg-primary-600 p-2 text-white hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {format(selectedDate, 'MMMM yyyy')}
        </p>
      </div>

      {/* Week view */}
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => (
            <motion.button
              key={day.toISOString()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedDate(day)}
              className={`rounded-lg p-2 text-center text-xs transition-colors ${
                isSameDay(day, selectedDate)
                  ? 'bg-primary-600 text-white'
                  : isToday(day)
                  ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              <div className="font-medium">
                {format(day, 'EEE')}
              </div>
              <div className="mt-1">
                {format(day, 'd')}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Events for selected date */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {format(selectedDate, 'EEEE, MMMM d')}
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {eventsForSelectedDate.length} events
            </span>
          </div>

          {eventsForSelectedDate.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No events scheduled</p>
              {isSameDay(selectedDate, new Date()) && (
                <p className="text-xs mt-1">Add some bricks or events to get started!</p>
              )}
            </div>
          ) : (
            eventsForSelectedDate.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="group cursor-pointer rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md transition-all dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${event.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {event.title}
                    </p>
                    <ChevronRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3" />
                      <span>{event.time}</span>
                    </div>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {event.duration}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      event.type === 'brick' 
                        ? 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400'
                        : event.type === 'quanta'
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                        : 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400'
                    }`}>
                      {event.type}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Status indicator */}
              <div className={`mt-2 h-1 rounded-full ${
                event.status === 'completed'
                  ? 'bg-green-500'
                  : event.status === 'in_progress'
                  ? 'bg-yellow-500'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`} />
            </motion.div>
          ))
          )}

          {/* Add new event */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenAddModal}
            className="w-full rounded-lg border-2 border-dashed border-gray-300 p-4 text-center text-gray-500 hover:border-primary-300 hover:text-primary-600 transition-colors dark:border-gray-600 dark:text-gray-400 dark:hover:border-primary-600 dark:hover:text-primary-400"
          >
            <Plus className="mx-auto h-5 w-5 mb-1" />
            <span className="text-sm">Add to schedule</span>
          </motion.button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {stats.activeBricks}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Active Bricks
            </div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {stats.completedToday}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Completed Today
            </div>
          </div>
          <div>
            <div className={`text-lg font-semibold ${
              stats.aiConversations > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'
            }`}>
              {stats.aiConversations}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              AI Conversations
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setShowAddModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add to Schedule
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-full p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Enter event title"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Optional description"
                  rows={2}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as any })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="event">Event</option>
                  <option value="meeting">Meeting</option>
                  <option value="brick">Brick Task</option>
                  <option value="quanta">Quanta Task</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={newEvent.category}
                  onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value as any })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="personal">Personal</option>
                  <option value="work">Work</option>
                  <option value="health">Health</option>
                  <option value="learning">Learning</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEvent}
                disabled={isAdding || !newEvent.title.trim() || !newEvent.startTime || !newEvent.endTime}
                className="flex-1 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAdding ? 'Adding...' : 'Add Event'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
