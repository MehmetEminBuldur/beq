-- Migration: Add user_preferences table
-- This table stores user preferences for scheduling and AI recommendations
-- Run this in your Supabase SQL editor to add the missing table

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Sleep preferences
  preferred_bedtime time NOT NULL DEFAULT '22:00',
  preferred_wake_time time NOT NULL DEFAULT '07:00',
  minimum_sleep_hours numeric(3,1) NOT NULL DEFAULT 7.0,
  
  -- Work preferences
  work_schedule_type text NOT NULL DEFAULT 'traditional',
  work_start_time time DEFAULT '09:00',
  work_end_time time DEFAULT '17:00',
  commute_duration_minutes integer NOT NULL DEFAULT 0,
  
  -- Activity preferences
  activity_level text NOT NULL DEFAULT 'moderately_active',
  workout_frequency_per_week integer NOT NULL DEFAULT 3,
  daily_learning_minutes integer NOT NULL DEFAULT 30,
  
  -- Break preferences
  break_frequency_minutes integer NOT NULL DEFAULT 90,
  break_duration_minutes integer NOT NULL DEFAULT 15,
  
  -- Notification preferences
  enable_reminders boolean NOT NULL DEFAULT true,
  reminder_advance_minutes integer NOT NULL DEFAULT 15,
  enable_daily_summary boolean NOT NULL DEFAULT true,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_preferences
CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences" ON public.user_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Create function to automatically create default preferences for new users
CREATE OR REPLACE FUNCTION create_default_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create preferences when a profile is created
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION create_default_user_preferences();

-- Update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;

-- Insert default preferences for existing users who don't have them yet
INSERT INTO public.user_preferences (user_id)
SELECT id FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.user_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- Verify the table was created successfully
-- You can uncomment this to test
-- SELECT COUNT(*) as total_preferences FROM public.user_preferences;
