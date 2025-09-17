-- ==============================================
-- BeQ Supabase Database Schema
-- ==============================================
-- This file contains the complete database schema for BeQ
-- Run this in your Supabase SQL editor to set up all tables

-- ==============================================
-- ENABLE REQUIRED EXTENSIONS
-- ==============================================

-- Enable UUID extension for ID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS (Row Level Security) for data isolation
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- ==============================================
-- USER PROFILES TABLE
-- ==============================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'UTC',
    preferences JSONB DEFAULT '{}',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ==============================================
-- BRICKS (MAIN TASKS/PROJECTS) TABLE
-- ==============================================

CREATE TABLE public.bricks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL CHECK (length(title) >= 3 AND length(title) <= 200),
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'on_hold', 'completed', 'cancelled')),
    estimated_duration_minutes INTEGER,
    actual_duration_minutes INTEGER,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    deadline TIMESTAMP WITH TIME ZONE,
    start_date TIMESTAMP WITH TIME ZONE,
    completion_date TIMESTAMP WITH TIME ZONE,
    tags TEXT[] DEFAULT '{}',
    dependencies TEXT[] DEFAULT '{}', -- Array of Brick IDs
    resources TEXT[] DEFAULT '{}', -- Array of resource URLs or IDs
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on bricks
ALTER TABLE public.bricks ENABLE ROW LEVEL SECURITY;

-- Bricks policies
CREATE POLICY "Users can manage own bricks" ON public.bricks
    USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_bricks_user_id ON public.bricks(user_id);
CREATE INDEX idx_bricks_status ON public.bricks(status);
CREATE INDEX idx_bricks_category ON public.bricks(category);
CREATE INDEX idx_bricks_deadline ON public.bricks(deadline);

-- ==============================================
-- QUANTAS (SUB-TASKS) TABLE
-- ==============================================

CREATE TABLE public.quantas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brick_id UUID REFERENCES public.bricks(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 200),
    description TEXT,
    estimated_duration_minutes INTEGER NOT NULL,
    actual_duration_minutes INTEGER,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    order_index INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on quantas
ALTER TABLE public.quantas ENABLE ROW LEVEL SECURITY;

-- Quantas policies (access through brick ownership)
CREATE POLICY "Users can manage quantas of own bricks" ON public.quantas
    USING (EXISTS (
        SELECT 1 FROM public.bricks 
        WHERE bricks.id = quantas.brick_id 
        AND bricks.user_id = auth.uid()
    ));

-- Create indexes
CREATE INDEX idx_quantas_brick_id ON public.quantas(brick_id);
CREATE INDEX idx_quantas_status ON public.quantas(status);
CREATE INDEX idx_quantas_order ON public.quantas(order_index);

-- ==============================================
-- CONVERSATIONS TABLE
-- ==============================================

CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT,
    context JSONB DEFAULT '{}',
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can manage own conversations" ON public.conversations
    USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_last_message ON public.conversations(last_message_at);

-- ==============================================
-- MESSAGES TABLE
-- ==============================================

CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    response TEXT,
    model_used TEXT,
    processing_time_ms INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Messages policies
CREATE POLICY "Users can manage own messages" ON public.messages
    USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_user_id ON public.messages(user_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

-- ==============================================
-- SCHEDULES TABLE
-- ==============================================

CREATE TABLE public.schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    schedule_data JSONB NOT NULL DEFAULT '[]',
    reasoning TEXT,
    confidence_score DECIMAL(3,2) DEFAULT 0.0,
    processing_time_seconds DECIMAL(10,3),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on schedules
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Schedules policies
CREATE POLICY "Users can manage own schedules" ON public.schedules
    USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_schedules_user_id ON public.schedules(user_id);
CREATE INDEX idx_schedules_active ON public.schedules(is_active);
CREATE INDEX idx_schedules_created_at ON public.schedules(created_at);

-- ==============================================
-- CALENDAR EVENTS TABLE
-- ==============================================

CREATE TABLE public.calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    external_id TEXT, -- ID from external calendar service
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    attendees TEXT[] DEFAULT '{}',
    calendar_source TEXT NOT NULL CHECK (calendar_source IN ('google', 'microsoft', 'apple', 'beq')),
    is_all_day BOOLEAN DEFAULT FALSE,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_rule TEXT,
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique external events per user
    UNIQUE(external_id, user_id, calendar_source)
);

-- Enable RLS on calendar_events
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Calendar events policies
CREATE POLICY "Users can manage own calendar events" ON public.calendar_events
    USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX idx_calendar_events_start_time ON public.calendar_events(start_time);
CREATE INDEX idx_calendar_events_source ON public.calendar_events(calendar_source);
CREATE INDEX idx_calendar_events_external_id ON public.calendar_events(external_id);

-- ==============================================
-- CALENDAR SYNCS TABLE
-- ==============================================

CREATE TABLE public.calendar_syncs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    calendar_provider TEXT NOT NULL CHECK (calendar_provider IN ('google', 'microsoft', 'apple')),
    access_token TEXT, -- Encrypted token for API access
    refresh_token TEXT, -- Encrypted refresh token
    calendar_ids TEXT[] DEFAULT '{}',
    sync_enabled BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- One sync config per provider per user
    UNIQUE(user_id, calendar_provider)
);

-- Enable RLS on calendar_syncs
ALTER TABLE public.calendar_syncs ENABLE ROW LEVEL SECURITY;

-- Calendar syncs policies
CREATE POLICY "Users can manage own calendar syncs" ON public.calendar_syncs
    USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_calendar_syncs_user_id ON public.calendar_syncs(user_id);
CREATE INDEX idx_calendar_syncs_provider ON public.calendar_syncs(calendar_provider);

-- ==============================================
-- RECOMMENDATION LOGS TABLE
-- ==============================================

CREATE TABLE public.recommendation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    query TEXT NOT NULL,
    category TEXT,
    resources_count INTEGER DEFAULT 0,
    confidence_score DECIMAL(3,2),
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on recommendation_logs
ALTER TABLE public.recommendation_logs ENABLE ROW LEVEL SECURITY;

-- Recommendation logs policies
CREATE POLICY "Users can view own recommendation logs" ON public.recommendation_logs
    USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_recommendation_logs_user_id ON public.recommendation_logs(user_id);
CREATE INDEX idx_recommendation_logs_created_at ON public.recommendation_logs(created_at);

-- ==============================================
-- FUNCTIONS AND TRIGGERS
-- ==============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all relevant tables
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bricks_updated_at 
    BEFORE UPDATE ON public.bricks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quantas_updated_at 
    BEFORE UPDATE ON public.quantas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON public.conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at 
    BEFORE UPDATE ON public.schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at 
    BEFORE UPDATE ON public.calendar_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_syncs_updated_at 
    BEFORE UPDATE ON public.calendar_syncs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- REAL-TIME SUBSCRIPTIONS
-- ==============================================

-- Enable real-time for tables that need live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.bricks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quantas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;

-- ==============================================
-- SAMPLE DATA (OPTIONAL - FOR DEVELOPMENT)
-- ==============================================

-- Insert a sample profile (replace with actual user ID after signup)
-- INSERT INTO public.profiles (id, email, full_name, timezone) VALUES 
-- ('550e8400-e29b-41d4-a716-446655440000', 'user@example.com', 'Sample User', 'UTC');

-- ==============================================
-- SECURITY NOTES
-- ==============================================

-- 1. All tables have Row Level Security (RLS) enabled
-- 2. Users can only access their own data
-- 3. Foreign keys ensure data integrity
-- 4. Check constraints validate data quality
-- 5. Indexes optimize query performance
-- 6. Real-time enabled for live updates

-- ==============================================
-- MIGRATION NOTES
-- ==============================================

-- To apply this schema:
-- 1. Create a new Supabase project
-- 2. Go to SQL Editor in Supabase dashboard
-- 3. Copy and paste this entire file
-- 4. Execute the script
-- 5. Verify all tables are created successfully
-- 6. Set up authentication policies as needed

-- For production deployment:
-- 1. Review and adjust RLS policies
-- 2. Set up proper JWT secrets
-- 3. Configure email templates
-- 4. Set up storage buckets if needed
-- 5. Configure webhooks for real-time features
