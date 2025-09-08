'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Target, Plus, ChevronRight } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';

interface ScheduleEvent {
  id: string;
  title: string;
  time: string;
  duration: string;
  type: 'brick' | 'quanta' | 'event';
  status: 'pending' | 'in_progress' | 'completed';
  color: string;
}

const mockEvents: ScheduleEvent[] = [
  {
    id: '1',
    title: 'Morning Workout',
    time: '07:00',
    duration: '1h',
    type: 'brick',
    status: 'completed',
    color: 'bg-green-500',
  },
  {
    id: '2',
    title: 'Spanish Learning',
    time: '19:30',
    duration: '30m',
    type: 'quanta',
    status: 'pending',
    color: 'bg-blue-500',
  },
  {
    id: '3',
    title: 'Team Meeting',
    time: '14:00',
    duration: '1h',
    type: 'event',
    status: 'pending',
    color: 'bg-purple-500',
  },
];

export function ScheduleView() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const startDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Schedule
          </h2>
          <button className="rounded-lg bg-primary-600 p-2 text-white hover:bg-primary-700 transition-colors">
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
              {mockEvents.length} events
            </span>
          </div>

          {mockEvents.map((event, index) => (
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
          ))}

          {/* Add new event */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
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
              5
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Bricks
            </div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              12
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Quantas
            </div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
              85%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Complete
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
