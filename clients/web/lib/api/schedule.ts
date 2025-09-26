/**
 * Schedule API
 * 
 * API functions for managing schedule objects (bricks, quantas, events)
 */

import { ScheduleObject } from '@/lib/calendar/types';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export class ScheduleAPI {
  private supabase = createClientComponentClient();

  /**
   * Update a schedule object's time
   */
  async updateScheduleTime(
    objectId: string,
    objectType: 'brick' | 'quanta' | 'event',
    startTime: Date,
    endTime: Date
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updates = {
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        updated_at: new Date().toISOString(),
      };

      let result;
      
      switch (objectType) {
        case 'brick':
          result = await this.supabase
            .from('bricks')
            .update(updates)
            .eq('id', objectId);
          break;
          
        case 'quanta':
          result = await this.supabase
            .from('quantas')
            .update(updates)
            .eq('id', objectId);
          break;
          
        case 'event':
          result = await this.supabase
            .from('calendar_events')
            .update(updates)
            .eq('id', objectId);
          break;
          
        default:
          throw new Error(`Unknown object type: ${objectType}`);
      }

      if (result.error) {
        throw result.error;
      }

      return { success: true };

    } catch (error) {
      console.error('Failed to update schedule time:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Create a new scheduled event
   */
  async createScheduledEvent(
    object: ScheduleObject
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { user } = await this.supabase.auth.getUser();
      
      if (!user.data.user) {
        throw new Error('User not authenticated');
      }

      const eventData = {
        id: object.id,
        user_id: user.data.user.id,
        title: object.title,
        description: object.description || '',
        start_time: new Date(object.startTime).toISOString(),
        end_time: new Date(object.endTime).toISOString(),
        type: object.type,
        status: object.status,
        priority: object.priority || 'medium',
        color: object.color,
        background_color: object.backgroundColor,
        border_color: object.borderColor,
        is_all_day: object.isAllDay || false,
        is_recurring: object.isRecurring || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = await this.supabase
        .from('calendar_events')
        .insert([eventData])
        .select()
        .single();

      if (result.error) {
        throw result.error;
      }

      return { 
        success: true, 
        id: result.data.id 
      };

    } catch (error) {
      console.error('Failed to create scheduled event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Move a brick/quanta to the calendar
   */
  async moveToCalendar(
    objectId: string,
    objectType: 'brick' | 'quanta',
    startTime: Date,
    endTime: Date
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Update the original object with calendar time
      const updateResult = await this.updateScheduleTime(
        objectId,
        objectType,
        startTime,
        endTime
      );

      if (!updateResult.success) {
        throw new Error(updateResult.error);
      }

      // Create a calendar event reference if needed
      const { user } = await this.supabase.auth.getUser();
      
      if (user.data.user) {
        const eventData = {
          user_id: user.data.user.id,
          related_object_id: objectId,
          related_object_type: objectType,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          created_at: new Date().toISOString(),
        };

        // Insert into calendar_events table for unified calendar view
        await this.supabase
          .from('calendar_events')
          .upsert([eventData], { 
            onConflict: 'related_object_id,related_object_type',
            ignoreDuplicates: false 
          });
      }

      return { success: true };

    } catch (error) {
      console.error('Failed to move to calendar:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Remove from calendar (unschedule)
   */
  async removeFromCalendar(
    objectId: string,
    objectType: 'brick' | 'quanta' | 'event'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (objectType === 'event') {
        // Delete the event entirely
        const result = await this.supabase
          .from('calendar_events')
          .delete()
          .eq('id', objectId);

        if (result.error) {
          throw result.error;
        }
      } else {
        // Remove scheduling from brick/quanta
        const updates = {
          start_time: null,
          end_time: null,
          updated_at: new Date().toISOString(),
        };

        const result = await this.supabase
          .from(objectType === 'brick' ? 'bricks' : 'quantas')
          .update(updates)
          .eq('id', objectId);

        if (result.error) {
          throw result.error;
        }

        // Remove calendar event reference
        await this.supabase
          .from('calendar_events')
          .delete()
          .eq('related_object_id', objectId)
          .eq('related_object_type', objectType);
      }

      return { success: true };

    } catch (error) {
      console.error('Failed to remove from calendar:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get all scheduled events for a user
   */
  async getScheduledEvents(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ success: boolean; events?: ScheduleObject[]; error?: string }> {
    try {
      let query = this.supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId);

      if (startDate) {
        query = query.gte('start_time', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('start_time', endDate.toISOString());
      }

      const result = await query.order('start_time', { ascending: true });

      if (result.error) {
        throw result.error;
      }

      // Convert to ScheduleObject format
      const events: ScheduleObject[] = result.data.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description || '',
        startTime: new Date(event.start_time),
        endTime: new Date(event.end_time),
        type: event.type || 'event',
        status: event.status || 'pending',
        priority: event.priority || 'medium',
        color: event.color || '#3b82f6',
        backgroundColor: event.background_color || '#eff6ff',
        borderColor: event.border_color || '#3b82f6',
        isAllDay: event.is_all_day || false,
        isRecurring: event.is_recurring || false,
        userId: event.user_id,
      }));

      return { success: true, events };

    } catch (error) {
      console.error('Failed to get scheduled events:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Check for scheduling conflicts
   */
  async checkConflicts(
    userId: string,
    startTime: Date,
    endTime: Date,
    excludeEventId?: string
  ): Promise<{ success: boolean; conflicts?: ScheduleObject[]; error?: string }> {
    try {
      let query = this.supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .or(`and(start_time.lte.${startTime.toISOString()},end_time.gt.${startTime.toISOString()}),and(start_time.lt.${endTime.toISOString()},end_time.gte.${endTime.toISOString()}),and(start_time.gte.${startTime.toISOString()},end_time.lte.${endTime.toISOString()})`);

      if (excludeEventId) {
        query = query.neq('id', excludeEventId);
      }

      const result = await query;

      if (result.error) {
        throw result.error;
      }

      const conflicts: ScheduleObject[] = result.data.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description || '',
        startTime: new Date(event.start_time),
        endTime: new Date(event.end_time),
        type: event.type || 'event',
        status: event.status || 'pending',
        priority: event.priority || 'medium',
        color: event.color || '#3b82f6',
        backgroundColor: event.background_color || '#eff6ff',
        borderColor: event.border_color || '#3b82f6',
        isAllDay: event.is_all_day || false,
        isRecurring: event.is_recurring || false,
        userId: event.user_id,
      }));

      return { success: true, conflicts };

    } catch (error) {
      console.error('Failed to check conflicts:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// Export singleton instance
export const scheduleAPI = new ScheduleAPI();