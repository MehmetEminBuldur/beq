-- BeQ Database Schema - Generated from Implementation Models
-- This schema matches the actual TypeScript types and implementation usage

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create custom types based on implementation
create type brick_category as enum (
  'work', 'personal', 'health', 'learning', 'social', 'maintenance', 'recreation', 'general'
);

create type priority_level as enum ('low', 'medium', 'high', 'urgent');

create type task_status as enum (
  'pending', 'in_progress', 'completed', 'cancelled', 'postponed', 'on_hold', 'not_started'
);

create type event_type as enum ('brick', 'quanta', 'event', 'meeting', 'break', 'personal');

create type recurrence_type as enum ('none', 'daily', 'weekly', 'monthly', 'yearly', 'custom');

-- Profiles table (matches implementation)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  timezone text not null default 'UTC',
  preferences jsonb,
  onboarding_completed boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bricks table (matches implementation)
create table public.bricks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  category brick_category not null default 'general',
  priority priority_level not null default 'medium',
  status task_status not null default 'not_started',
  estimated_duration_minutes integer not null,
  actual_duration_minutes integer,
  target_date timestamp with time zone,
  deadline timestamp with time zone,
  completion_percentage numeric(5,2) not null default 0.0,
  recurrence_type recurrence_type not null default 'none',
  recurrence_interval integer,
  recurrence_end_date timestamp with time zone,
  ai_difficulty_rating numeric(3,1),
  personalization_tags text[],
  learning_objectives text[],
  time_spent_minutes integer not null default 0,
  sessions_count integer not null default 0,
  tags text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- Quantas table (matches implementation)
create table public.quantas (
  id uuid default uuid_generate_v4() primary key,
  brick_id uuid references public.bricks(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  estimated_duration_minutes integer not null,
  actual_duration_minutes integer,
  priority priority_level not null default 'medium',
  status task_status not null default 'pending',
  order_index integer not null default 0,
  depends_on_quantas uuid[],
  prerequisite_resources text[],
  completion_percentage numeric(5,2) not null default 0.0,
  notes text,
  ai_suggestions text[],
  scheduled_start timestamp with time zone,
  scheduled_end timestamp with time zone,
  actual_start timestamp with time zone,
  actual_end timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Calendar Events table (matches implementation)
create table public.calendar_events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  external_id text,
  title text not null,
  description text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  location text,
  attendees text[],
  calendar_source text not null,
  is_all_day boolean not null default false,
  is_recurring boolean not null default false,
  recurrence_rule text,
  timezone text not null default 'UTC',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Calendar Syncs table (matches implementation)
create table public.calendar_syncs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  calendar_provider text not null,
  access_token text,
  refresh_token text,
  calendar_ids text[],
  sync_enabled boolean not null default true,
  last_sync_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Conversations table (matches implementation)
create table public.conversations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text,
  context jsonb,
  last_message_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Messages table (matches implementation)
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  response text,
  model_used text,
  processing_time_ms integer,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for better performance
create index idx_profiles_email on public.profiles(email);
create index idx_bricks_user_id on public.bricks(user_id);
create index idx_bricks_status on public.bricks(status);
create index idx_bricks_category on public.bricks(category);
create index idx_bricks_deadline on public.bricks(deadline) where deadline is not null;
create index idx_quantas_brick_id on public.quantas(brick_id);
create index idx_quantas_user_id on public.quantas(user_id);
create index idx_quantas_status on public.quantas(status);
create index idx_calendar_events_user_id on public.calendar_events(user_id);
create index idx_calendar_events_start_time on public.calendar_events(start_time);
create index idx_calendar_events_end_time on public.calendar_events(end_time);
create index idx_calendar_syncs_user_id on public.calendar_syncs(user_id);
create index idx_conversations_user_id on public.conversations(user_id);
create index idx_messages_conversation_id on public.messages(conversation_id);
create index idx_messages_user_id on public.messages(user_id);

-- Row Level Security (RLS) policies
alter table public.profiles enable row level security;
alter table public.bricks enable row level security;
alter table public.quantas enable row level security;
alter table public.calendar_events enable row level security;
alter table public.calendar_syncs enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Bricks policies
create policy "Users can manage their own bricks"
  on public.bricks for all
  using (auth.uid() = user_id);

-- Quantas policies
create policy "Users can manage their own quantas"
  on public.quantas for all
  using (auth.uid() = user_id);

-- Calendar Events policies
create policy "Users can manage their own calendar events"
  on public.calendar_events for all
  using (auth.uid() = user_id);

-- Calendar Syncs policies
create policy "Users can manage their own calendar syncs"
  on public.calendar_syncs for all
  using (auth.uid() = user_id);

-- Conversations policies
create policy "Users can manage their own conversations"
  on public.conversations for all
  using (auth.uid() = user_id);

-- Messages policies
create policy "Users can view messages from their conversations"
  on public.messages for select
  using (
    auth.uid() in (
      select user_id from public.conversations
      where id = conversation_id
    )
  );

create policy "Users can insert messages to their conversations"
  on public.messages for insert
  with check (
    auth.uid() in (
      select user_id from public.conversations
      where id = conversation_id
    )
  );

create policy "Users can update their own messages"
  on public.messages for update
  using (auth.uid() = user_id);

-- Functions for automatic timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for automatic timestamps
create trigger handle_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.bricks
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.quantas
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.calendar_events
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.calendar_syncs
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.conversations
  for each row execute procedure public.handle_updated_at();

-- Function to automatically create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, timezone, onboarding_completed)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'UTC',
    false
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
