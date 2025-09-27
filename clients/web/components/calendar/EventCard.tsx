/**
 * EventCard Component - Trevor AI Inspired Design
 * 
 * Beautiful event cards with soft colors, rounded corners, and smooth interactions
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { 
  Clock, 
  MapPin, 
  Users, 
  MoreHorizontal,
  Zap,
  Target,
  Calendar,
  User
} from 'lucide-react';

import { ScheduleObject } from '@/lib/calendar/types';

interface EventCardProps {
  event: ScheduleObject;
  onClick?: (event: ScheduleObject) => void;
  onEdit?: (event: ScheduleObject) => void;
  onDelete?: (event: ScheduleObject) => void;
  onDragStart?: (event: ScheduleObject) => void;
  onDragEnd?: (event: ScheduleObject) => void;
  isSelected?: boolean;
  compactMode?: boolean;
  draggable?: boolean;
  className?: string;
}

const getEventStyles = (type: string, status: string) => {
  const baseStyles = "rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:shadow-lg backdrop-blur-sm";
  
  // Trevor AI inspired color schemes
  const colorSchemes = {
    brick: {
      pending: "bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 border border-blue-200/50 hover:from-blue-200 hover:to-indigo-200",
      in_progress: "bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100 border border-amber-200/50 hover:from-amber-200 hover:to-orange-200",
      completed: "bg-gradient-to-br from-emerald-100 via-green-50 to-teal-100 border border-emerald-200/50 hover:from-emerald-200 hover:to-teal-200",
    },
    quanta: {
      pending: "bg-gradient-to-br from-purple-100 via-violet-50 to-indigo-100 border border-purple-200/50 hover:from-purple-200 hover:to-indigo-200",
      in_progress: "bg-gradient-to-br from-pink-100 via-rose-50 to-red-100 border border-pink-200/50 hover:from-pink-200 hover:to-red-200",
      completed: "bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 border border-green-200/50 hover:from-green-200 hover:to-teal-200",
    },
    meeting: {
      upcoming: "bg-gradient-to-br from-slate-100 via-gray-50 to-blue-100 border border-slate-200/50 hover:from-slate-200 hover:to-blue-200",
      in_progress: "bg-gradient-to-br from-yellow-100 via-amber-50 to-orange-100 border border-yellow-200/50 hover:from-yellow-200 hover:to-orange-200",
      completed: "bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 border border-green-200/50 hover:from-green-200 hover:to-teal-200",
    },
    event: {
      upcoming: "bg-gradient-to-br from-cyan-100 via-blue-50 to-indigo-100 border border-cyan-200/50 hover:from-cyan-200 hover:to-indigo-200",
      in_progress: "bg-gradient-to-br from-violet-100 via-purple-50 to-indigo-100 border border-violet-200/50 hover:from-violet-200 hover:to-indigo-200",
      completed: "bg-gradient-to-br from-emerald-100 via-green-50 to-teal-100 border border-emerald-200/50 hover:from-emerald-200 hover:to-teal-200",
    }
  };

  return `${baseStyles} ${colorSchemes[type as keyof typeof colorSchemes]?.[status as keyof typeof colorSchemes.brick] || colorSchemes.event.upcoming}`;
};

const getTextColor = (type: string, status: string) => {
  const colorMap = {
    brick: {
      pending: "text-blue-800",
      in_progress: "text-amber-800", 
      completed: "text-emerald-800",
    },
    quanta: {
      pending: "text-purple-800",
      in_progress: "text-pink-800",
      completed: "text-green-800",
    },
    meeting: {
      upcoming: "text-slate-800",
      in_progress: "text-yellow-800",
      completed: "text-green-800",
    },
    event: {
      upcoming: "text-cyan-800",
      in_progress: "text-violet-800",
      completed: "text-emerald-800",
    }
  };

  return colorMap[type as keyof typeof colorMap]?.[status as keyof typeof colorMap.brick] || "text-gray-800";
};

const getIcon = (type: string) => {
  switch (type) {
    case 'brick':
      return Target;
    case 'quanta':
      return Zap;
    case 'meeting':
      return Users;
    case 'event':
      return Calendar;
    default:
      return Clock;
  }
};

export function EventCard({
  event,
  onClick,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  isSelected = false,
  compactMode = false,
  draggable = true,
  className = '',
}: EventCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const duration = Math.round((new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60));
  const IconComponent = getIcon(event.type);
  const textColor = getTextColor(event.type, event.status);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(event);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    setShowMenu(false);
    
    // Set drag data
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'event',
      data: event
    }));
    e.dataTransfer.effectAllowed = 'move';
    
    // Create a smaller drag image with reduced shadow
    const dragElement = e.currentTarget as HTMLElement;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Get element dimensions
      const rect = dragElement.getBoundingClientRect();
      const scale = 0.8; // Make it 80% of original size
      
      canvas.width = rect.width * scale;
      canvas.height = rect.height * scale;
      
      // Create a smaller, semi-transparent version
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      // Add border
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
      
      // Set the custom drag image
      e.dataTransfer.setDragImage(canvas, canvas.width / 2, canvas.height / 2);
    } else {
      // Fallback to default behavior
      e.dataTransfer.setDragImage(dragElement, 0, 0);
    }
    
    onDragStart?.(event);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    onDragEnd?.(event);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ 
        opacity: isDragging ? 0.5 : 1, 
        scale: isSelected ? 1.02 : 1,
        y: isHovered ? -2 : 0
      }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        relative group
        ${getEventStyles(event.type, event.status)}
        ${isSelected ? 'ring-2 ring-blue-400 ring-opacity-60' : ''}
        ${isDragging ? 'cursor-grabbing' : draggable ? 'cursor-grab' : 'cursor-pointer'}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowMenu(false);
      }}
      onClick={handleClick}
    >
      {/* Event Content */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Header with Icon and Title */}
          <div className="flex items-center gap-2 mb-2">
            <div className={`
              p-1.5 rounded-lg ${event.type === 'brick' ? 'bg-blue-200/70' : 
                event.type === 'quanta' ? 'bg-purple-200/70' :
                event.type === 'meeting' ? 'bg-slate-200/70' : 'bg-cyan-200/70'}
            `}>
              <IconComponent className={`w-3.5 h-3.5 ${textColor}`} />
            </div>
            <h3 className={`font-semibold text-sm truncate ${textColor}`}>
              {event.title}
            </h3>
          </div>

          {/* Time and Duration */}
          <div className="flex items-center gap-2 mb-2">
            <Clock className={`w-3 h-3 ${textColor} opacity-70`} />
            <span className={`text-xs ${textColor} opacity-80`}>
              {format(new Date(event.startTime), 'h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${event.type === 'brick' ? 'bg-blue-200/50' : 
              event.type === 'quanta' ? 'bg-purple-200/50' :
              event.type === 'meeting' ? 'bg-slate-200/50' : 'bg-cyan-200/50'} ${textColor} opacity-80`}>
              {duration}m
            </span>
          </div>

          {/* Description */}
          {!compactMode && event.description && (
            <p className={`text-xs ${textColor} opacity-70 line-clamp-2 mb-2`}>
              {event.description}
            </p>
          )}

          {/* Additional Details */}
          <div className="flex items-center gap-3 text-xs">
            {/* Attendees for meetings */}
            {event.type === 'meeting' && (event as any).attendees && (
              <div className="flex items-center gap-1">
                <Users className={`w-3 h-3 ${textColor} opacity-70`} />
                <span className={`${textColor} opacity-80`}>
                  {(event as any).attendees.length}
                </span>
              </div>
            )}

            {/* Priority for bricks */}
            {event.type === 'brick' && event.priority && (
              <div className={`
                px-2 py-0.5 rounded-full text-xs font-medium
                ${event.priority === 'high' ? 'bg-red-200/70 text-red-800' :
                  event.priority === 'medium' ? 'bg-yellow-200/70 text-yellow-800' :
                  'bg-green-200/70 text-green-800'}
              `}>
                {event.priority}
              </div>
            )}

            {/* Energy for quantas */}
            {event.type === 'quanta' && (event as any).energy && (
              <div className="flex items-center gap-1">
                <Zap className={`w-3 h-3 ${textColor} opacity-70`} />
                <span className={`${textColor} opacity-80`}>
                  {(event as any).energy}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Menu Button */}
        <div className="relative">
          <button
            onClick={handleMenuClick}
            className={`
              opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-white/50
              ${textColor}
            `}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-[9999]"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(event);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(event);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Progress Bar for bricks */}
      {event.type === 'brick' && (event as any).progress !== undefined && (
        <div className="mt-3">
          <div className="w-full bg-white/60 rounded-full h-1.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(event as any).progress}%` }}
              transition={{ delay: 0.5, duration: 1 }}
              className={`h-1.5 rounded-full ${
                event.status === 'completed' ? 'bg-emerald-500' :
                event.status === 'in_progress' ? 'bg-amber-500' :
                'bg-blue-500'
              }`}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default EventCard;
