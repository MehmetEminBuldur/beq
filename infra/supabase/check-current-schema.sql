-- Check current database schema to understand what exists
-- Run this to see what tables and types currently exist

-- Check if custom types exist
SELECT typname, typtype 
FROM pg_type 
WHERE typname IN ('task_status', 'priority_level', 'brick_category', 'event_type', 'recurrence_type');

-- Check existing tables
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('bricks', 'quantas', 'profiles', 'user_preferences');

-- Check bricks table structure if it exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'bricks'
ORDER BY ordinal_position;

-- Check quantas table structure if it exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'quantas'
ORDER BY ordinal_position;
