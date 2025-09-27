-- Fix task_status enum and ensure proper database schema
-- This migration creates the necessary enums and updates status fields

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types if they don't exist
DO $$ BEGIN
    CREATE TYPE brick_category AS ENUM (
        'work', 'personal', 'health', 'learning', 'social', 'maintenance', 'recreation'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('not_started', 'in_progress', 'completed', 'cancelled', 'postponed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_type AS ENUM ('brick', 'quanta', 'event', 'meeting', 'break', 'personal');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE recurrence_type AS ENUM ('none', 'daily', 'weekly', 'monthly', 'yearly', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- If task_status enum already exists but has 'pending' instead of 'not_started', add the new value
DO $$ BEGIN
    ALTER TYPE task_status ADD VALUE 'not_started';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update existing records if they exist and use 'pending'
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bricks' AND table_schema = 'public') THEN
        UPDATE public.bricks SET status = 'not_started' WHERE status = 'pending';
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quantas' AND table_schema = 'public') THEN
        UPDATE public.quantas SET status = 'not_started' WHERE status = 'pending';
    END IF;
END $$;

-- Update default values if tables exist
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bricks' AND column_name = 'status' AND table_schema = 'public') THEN
        ALTER TABLE public.bricks ALTER COLUMN status SET DEFAULT 'not_started';
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quantas' AND column_name = 'status' AND table_schema = 'public') THEN
        ALTER TABLE public.quantas ALTER COLUMN status SET DEFAULT 'not_started';
    END IF;
END $$;
