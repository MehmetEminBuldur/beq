export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      bricks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          category: 'work' | 'personal' | 'health' | 'learning' | 'social' | 'maintenance' | 'recreation'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'postponed' | 'on_hold'
          estimated_duration_minutes: number
          actual_duration_minutes: number | null
          target_date: string | null
          deadline: string | null
          completion_percentage: number
          recurrence_type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
          recurrence_interval: number | null
          recurrence_end_date: string | null
          ai_difficulty_rating: number | null
          personalization_tags: string[] | null
          learning_objectives: string[] | null
          time_spent_minutes: number
          sessions_count: number
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          category: string
          priority?: string
          status?: string
          estimated_duration_minutes: number
          actual_duration_minutes?: number | null
          target_date?: string | null
          deadline?: string | null
          completion_percentage?: number
          recurrence_type?: string
          recurrence_interval?: number | null
          recurrence_end_date?: string | null
          ai_difficulty_rating?: number | null
          personalization_tags?: string[] | null
          learning_objectives?: string[] | null
          time_spent_minutes?: number
          sessions_count?: number
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          category?: string
          priority?: string
          status?: string
          estimated_duration_minutes?: number
          actual_duration_minutes?: number | null
          target_date?: string | null
          deadline?: string | null
          completion_percentage?: number
          recurrence_type?: string
          recurrence_interval?: number | null
          recurrence_end_date?: string | null
          ai_difficulty_rating?: number | null
          personalization_tags?: string[] | null
          learning_objectives?: string[] | null
          time_spent_minutes?: number
          sessions_count?: number
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
      }
      calendar_events: {
        Row: {
          id: string
          user_id: string
          external_id: string | null
          title: string
          description: string | null
          start_time: string
          end_time: string
          location: string | null
          attendees: string[]
          calendar_source: string
          is_all_day: boolean
          is_recurring: boolean
          recurrence_rule: string | null
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          external_id?: string | null
          title: string
          description?: string | null
          start_time: string
          end_time: string
          location?: string | null
          attendees?: string[]
          calendar_source: string
          is_all_day?: boolean
          is_recurring?: boolean
          recurrence_rule?: string | null
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          external_id?: string | null
          title?: string
          description?: string | null
          start_time?: string
          end_time?: string
          location?: string | null
          attendees?: string[]
          calendar_source?: string
          is_all_day?: boolean
          is_recurring?: boolean
          recurrence_rule?: string | null
          timezone?: string
          created_at?: string
          updated_at?: string
        }
      }
      calendar_syncs: {
        Row: {
          id: string
          user_id: string
          calendar_provider: string
          access_token: string | null
          refresh_token: string | null
          calendar_ids: string[]
          sync_enabled: boolean
          last_sync_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          calendar_provider: string
          access_token?: string | null
          refresh_token?: string | null
          calendar_ids?: string[]
          sync_enabled?: boolean
          last_sync_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          calendar_provider?: string
          access_token?: string | null
          refresh_token?: string | null
          calendar_ids?: string[]
          sync_enabled?: boolean
          last_sync_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          title: string | null
          context: Json
          last_message_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          context?: Json
          last_message_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          context?: Json
          last_message_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          content: string
          response: string | null
          model_used: string | null
          processing_time_ms: number | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          content: string
          response?: string | null
          model_used?: string | null
          processing_time_ms?: number | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          content?: string
          response?: string | null
          model_used?: string | null
          processing_time_ms?: number | null
          metadata?: Json
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          timezone: string
          preferences: Json
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          timezone?: string
          preferences?: Json
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          timezone?: string
          preferences?: Json
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      quantas: {
        Row: {
          id: string
          brick_id: string
          title: string
          description: string | null
          estimated_duration_minutes: number
          actual_duration_minutes: number | null
          status: string
          order_index: number
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          brick_id: string
          title: string
          description?: string | null
          estimated_duration_minutes: number
          actual_duration_minutes?: number | null
          status?: string
          order_index?: number
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          brick_id?: string
          title?: string
          description?: string | null
          estimated_duration_minutes?: number
          actual_duration_minutes?: number | null
          status?: string
          order_index?: number
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      recommendation_logs: {
        Row: {
          id: string
          user_id: string
          query: string
          category: string | null
          resources_count: number
          confidence_score: number | null
          processing_time_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          query: string
          category?: string | null
          resources_count?: number
          confidence_score?: number | null
          processing_time_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          query?: string
          category?: string | null
          resources_count?: number
          confidence_score?: number | null
          processing_time_ms?: number | null
          created_at?: string
        }
      }
      schedules: {
        Row: {
          id: string
          user_id: string
          schedule_data: Json
          reasoning: string | null
          confidence_score: number
          processing_time_seconds: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          schedule_data: Json
          reasoning?: string | null
          confidence_score?: number
          processing_time_seconds?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          schedule_data?: Json
          reasoning?: string | null
          confidence_score?: number
          processing_time_seconds?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          preferred_bedtime: string
          preferred_wake_time: string
          minimum_sleep_hours: number
          work_schedule_type: string
          work_start_time: string | null
          work_end_time: string | null
          commute_duration_minutes: number
          activity_level: string
          workout_frequency_per_week: number
          daily_learning_minutes: number
          break_frequency_minutes: number
          break_duration_minutes: number
          enable_reminders: boolean
          reminder_advance_minutes: number
          enable_daily_summary: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          preferred_bedtime?: string
          preferred_wake_time?: string
          minimum_sleep_hours?: number
          work_schedule_type?: string
          work_start_time?: string | null
          work_end_time?: string | null
          commute_duration_minutes?: number
          activity_level?: string
          workout_frequency_per_week?: number
          daily_learning_minutes?: number
          break_frequency_minutes?: number
          break_duration_minutes?: number
          enable_reminders?: boolean
          reminder_advance_minutes?: number
          enable_daily_summary?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          preferred_bedtime?: string
          preferred_wake_time?: string
          minimum_sleep_hours?: number
          work_schedule_type?: string
          work_start_time?: string | null
          work_end_time?: string | null
          commute_duration_minutes?: number
          activity_level?: string
          workout_frequency_per_week?: number
          daily_learning_minutes?: number
          break_frequency_minutes?: number
          break_duration_minutes?: number
          enable_reminders?: boolean
          reminder_advance_minutes?: number
          enable_daily_summary?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      brick_category: 'work' | 'personal' | 'health' | 'learning' | 'social' | 'maintenance' | 'recreation'
      priority_level: 'low' | 'medium' | 'high' | 'urgent'
      task_status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'postponed' | 'on_hold'
      event_type: 'brick' | 'quanta' | 'event' | 'meeting' | 'break' | 'personal'
      recurrence_type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
