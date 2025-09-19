-- Migration Script: Recreate Supabase Tables from Implementation Models
-- This script will drop existing tables and recreate them based on the implementation

-- WARNING: This will delete all existing data!
-- Make sure to backup your data before running this script

-- Drop existing tables in reverse dependency order
drop table if exists public.messages cascade;
drop table if exists public.conversations cascade;
drop table if exists public.calendar_syncs cascade;
drop table if exists public.calendar_events cascade;
drop table if exists public.quantas cascade;
drop table if exists public.bricks cascade;
drop table if exists public.profiles cascade;

-- Drop existing types
drop type if exists task_status cascade;
drop type if exists priority_level cascade;
drop type if exists brick_category cascade;
drop type if exists event_type cascade;
drop type if exists recurrence_type cascade;

-- Now apply the new schema
\i infra/supabase/schema-from-implementation.sql
