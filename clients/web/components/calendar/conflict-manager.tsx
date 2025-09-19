/**
 * Conflict Manager Component
 *
 * Provides a user interface for detecting and resolving calendar event conflicts
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useCalendar, type Conflict } from '@/lib/hooks/use-calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Zap,
  Clock,
  Users
} from 'lucide-react';


interface ConflictManagerProps {
  onConflictsResolved?: (resolvedCount: number) => void;
}

export function ConflictManager({ onConflictsResolved }: ConflictManagerProps) {
  const calendar = useCalendar();
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [resolving, setResolving] = useState(false);

  const fetchConflicts = async () => {
    try {
      const data = await calendar.getConflicts();
      setConflicts(data.conflicts || []);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const resolveConflict = async (conflictId: string, strategy: string) => {
    setResolving(true);
    try {
      const data = await calendar.resolveConflicts([{
        conflict_id: conflictId,
        strategy: strategy
      }]);

      // Remove resolved conflict from list
      setConflicts(prev => prev.filter(c => c.id !== conflictId));

      // Notify parent component
      onConflictsResolved?.(data.total_resolved || 1);

    } catch (err) {
      // Error is handled by the hook
    } finally {
      setResolving(false);
    }
  };

  const autoResolveAll = async () => {
    if (conflicts.length === 0) return;

    setResolving(true);
    try {
      const resolutions = conflicts.map(conflict => ({
        conflict_id: conflict.id,
        strategy: conflict.suggested_resolution
      }));

      const data = await calendar.resolveConflicts(resolutions);

      // Clear all conflicts
      setConflicts([]);

      // Notify parent component
      onConflictsResolved?.(data.total_resolved || conflicts.length);

    } catch (err) {
      // Error is handled by the hook
    } finally {
      setResolving(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConflictIcon = (type: string) => {
    switch (type) {
      case 'time_overlap': return <Clock className="h-4 w-4" />;
      case 'double_booking': return <Users className="h-4 w-4" />;
      case 'priority_conflict': return <AlertTriangle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    fetchConflicts();
  }, []);

  // Check if user is available (this would come from the calendar hook or auth context)
  // For now, assume user is available if calendar hook doesn't error

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Calendar Conflicts
          </CardTitle>
          <CardDescription>
            Detect and resolve scheduling conflicts in your calendar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              onClick={fetchConflicts}
              disabled={calendar.loading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${calendar.loading ? 'animate-spin' : ''}`} />
              Refresh Conflicts
            </Button>

            {conflicts.length > 0 && (
              <Button
                onClick={autoResolveAll}
                disabled={resolving}
                className="flex items-center gap-2"
              >
                <Zap className={`h-4 w-4 ${resolving ? 'animate-spin' : ''}`} />
                Auto-Resolve All ({conflicts.length})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {calendar.error && (
        <Alert variant="destructive">
          <AlertDescription>{calendar.error}</AlertDescription>
        </Alert>
      )}

      {/* Conflicts List */}
      {conflicts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Conflicts Found</h3>
            <p className="text-muted-foreground">
              Your calendar is free of scheduling conflicts.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {conflicts.map((conflict) => (
            <Card key={conflict.id} className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getConflictIcon(conflict.type)}
                    <CardTitle className="text-base">
                      {conflict.description}
                    </CardTitle>
                  </div>
                  <Badge className={getSeverityColor(conflict.severity)}>
                    {conflict.severity.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Events involved in conflict */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Events Involved:</h4>
                  {conflict.events.map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatTime(event.start_time)} - {formatTime(event.end_time)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Resolution options */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Resolution Options:</h4>
                  <div className="flex flex-wrap gap-2">
                    {conflict.resolution_options.map((option) => (
                      <Button
                        key={option}
                        onClick={() => resolveConflict(conflict.id, option)}
                        disabled={resolving}
                        variant={option === conflict.suggested_resolution ? "default" : "outline"}
                        size="sm"
                      >
                        {option.replace('_', ' ').toUpperCase()}
                        {option === conflict.suggested_resolution && (
                          <span className="ml-1 text-xs">(Suggested)</span>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Metadata */}
                {conflict.metadata && (
                  <div className="text-xs text-muted-foreground">
                    {conflict.metadata.overlap_duration &&
                      <span>Overlap: {conflict.metadata.overlap_duration} minutes</span>
                    }
                    {conflict.metadata.event_count &&
                      <span> • Events: {conflict.metadata.event_count}</span>
                    }
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Loading State */}
      {calendar.loading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Scanning for conflicts...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
