-- BeQ Database Schema for Supabase
-- This schema defines the complete database structure for the BeQ application

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create custom types
create type brick_category as enum (
  'work', 'personal', 'health', 'learning', 'social', 'maintenance', 'recreation'
);

create type priority_level as enum ('low', 'medium', 'high', 'urgent');

create type task_status as enum ('pending', 'in_progress', 'completed', 'cancelled', 'postponed');

create type event_type as enum ('brick', 'quanta', 'event', 'meeting', 'break', 'personal');

create type recurrence_type as enum ('none', 'daily', 'weekly', 'monthly', 'yearly', 'custom');

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  timezone text default 'UTC',
  location text,
  occupation text,
  industry text,
  date_of_birth date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User preferences table
create table public.user_preferences (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  
  -- Sleep preferences
  preferred_bedtime time not null default '22:00',
  preferred_wake_time time not null default '07:00',
  minimum_sleep_hours numeric(3,1) not null default 7.0,
  
  -- Work preferences
  work_schedule_type text not null default 'traditional',
  work_start_time time default '09:00',
  work_end_time time default '17:00',
  commute_duration_minutes integer not null default 0,
  
  -- Activity preferences
  activity_level text not null default 'moderately_active',
  workout_frequency_per_week integer not null default 3,
  daily_learning_minutes integer not null default 30,
  
  -- Break preferences
  break_frequency_minutes integer not null default 90,
  break_duration_minutes integer not null default 15,
  
  -- Notification preferences
  enable_reminders boolean not null default true,
  reminder_advance_minutes integer not null default 15,
  enable_daily_summary boolean not null default true,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(user_id)
);

-- Bricks table (main tasks/projects)
create table public.bricks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  
  title text not null,
  description text,
  category brick_category not null,
  priority priority_level not null default 'medium',
  status task_status not null default 'pending',
  
  estimated_duration_minutes integer not null,
  actual_duration_minutes integer,
  
  target_date timestamp with time zone,
  deadline timestamp with time zone,
  
  recurrence_type recurrence_type not null default 'none',
  recurrence_interval integer,
  recurrence_end_date timestamp with time zone,
  
  completion_percentage numeric(5,2) not null default 0.0 check (completion_percentage >= 0 and completion_percentage <= 100),
  
  -- AI and personalization
  ai_difficulty_rating numeric(3,1) check (ai_difficulty_rating >= 1 and ai_difficulty_rating <= 10),
  personalization_tags text[],
  learning_objectives text[],
  
  -- Tracking
  time_spent_minutes integer not null default 0,
  sessions_count integer not null default 0,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- Quantas table (sub-tasks within bricks)
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
  
  -- Dependencies
  depends_on_quantas uuid[],
  prerequisite_resources text[],
  
  -- Progress tracking
  completion_percentage numeric(5,2) not null default 0.0 check (completion_percentage >= 0 and completion_percentage <= 100),
  notes text,
  
  -- AI suggestions
  ai_suggestions text[],
  
  -- Timing
  scheduled_start timestamp with time zone,
  scheduled_end timestamp with time zone,
  actual_start timestamp with time zone,
  actual_end timestamp with time zone,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Events table (calendar events)
create table public.events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  
  title text not null,
  description text,
  location text,
  
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  timezone text not null default 'UTC',
  is_all_day boolean not null default false,
  
  event_type event_type not null,
  
  -- Source and integration
  source_calendar text,
  external_id text,
  is_beq_managed boolean not null default false,
  
  -- Related BeQ objects
  related_brick_id uuid references public.bricks(id) on delete set null,
  related_quanta_id uuid references public.quantas(id) on delete set null,
  
  -- Attendees and permissions
  attendees text[],
  is_modifiable boolean not null default true,
  
  -- Recurrence
  recurrence_type recurrence_type not null default 'none',
  recurrence_rule text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  check (end_time > start_time or is_all_day = true)
);

-- Constraints table (scheduling constraints)
create table public.constraints (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  
  name text not null,
  description text,
  
  -- Time constraints
  earliest_start timestamp with time zone,
  latest_end timestamp with time zone,
  
  -- Day/time patterns
  allowed_days integer[], -- 0=Monday, 6=Sunday
  allowed_time_ranges jsonb,
  
  -- Duration constraints
  min_duration_minutes integer check (min_duration_minutes > 0),
  max_duration_minutes integer check (max_duration_minutes > 0),
  
  -- Priority and flexibility
  is_hard_constraint boolean not null default true,
  flexibility_score numeric(3,2) not null default 0.5 check (flexibility_score >= 0 and flexibility_score <= 1),
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  check (max_duration_minutes is null or min_duration_minutes is null or max_duration_minutes >= min_duration_minutes)
);

-- Resources table (AI-curated content)
create table public.resources (
  id uuid default uuid_generate_v4() primary key,
  
  title text not null,
  description text not null,
  summary text,
  
  resource_type text not null,
  content_format text not null,
  difficulty_level text not null,
  
  url text,
  alternative_urls text[],
  
  -- Content metadata
  author text,
  publisher text,
  publish_date timestamp with time zone,
  language text not null default 'en',
  duration_minutes integer,
  word_count integer,
  
  -- Quality metrics
  rating numeric(3,2) check (rating >= 0 and rating <= 5),
  review_count integer not null default 0,
  credibility_score numeric(3,2) check (credibility_score >= 0 and credibility_score <= 1),
  
  -- Access information
  is_free boolean not null default true,
  price numeric(10,2),
  currency text not null default 'USD',
  requires_subscription boolean not null default false,
  
  -- Categorization
  tags text[],
  topics text[],
  target_skills text[],
  target_goals text[],
  
  -- Usage tracking
  view_count integer not null default 0,
  click_count integer not null default 0,
  
  -- Source and curation
  source text not null,
  curator text,
  is_ai_curated boolean not null default true,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_recommended_at timestamp with time zone
);

-- Resource recommendations table (personalized recommendations)
create table public.resource_recommendations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  resource_id uuid references public.resources(id) on delete cascade not null,
  
  context_brick_id uuid references public.bricks(id) on delete cascade,
  context_quanta_id uuid references public.quantas(id) on delete cascade,
  
  recommendation_reason text not null,
  confidence_score numeric(3,2) not null check (confidence_score >= 0 and confidence_score <= 1),
  priority_score numeric(3,2) not null check (priority_score >= 0 and priority_score <= 1),
  
  -- Personalization factors
  matches_user_level boolean not null,
  matches_user_interests boolean not null,
  matches_user_goals boolean not null,
  estimated_value numeric(3,2) not null check (estimated_value >= 0 and estimated_value <= 1),
  
  -- Timing
  suggested_timing timestamp with time zone,
  expires_at timestamp with time zone,
  
  -- User interaction
  viewed boolean not null default false,
  clicked boolean not null default false,
  dismissed boolean not null default false,
  saved boolean not null default false,
  
  -- Feedback
  user_rating numeric(3,2) check (user_rating >= 0 and user_rating <= 5),
  user_feedback text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(user_id, resource_id, context_brick_id, context_quanta_id)
);

-- Conversations table (chat history)
create table public.conversations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  
  title text,
  summary text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Messages table (chat messages)
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  
  -- AI-specific fields
  model_used text,
  confidence_score numeric(3,2) check (confidence_score >= 0 and confidence_score <= 1),
  processing_time_ms integer,
  
  -- Actions and context
  actions_taken text[],
  context_brick_id uuid references public.bricks(id) on delete set null,
  context_quanta_id uuid references public.quantas(id) on delete set null,
  
  -- Metadata
  metadata jsonb,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for better performance
create index idx_profiles_email on public.profiles(email);
create index idx_bricks_user_id on public.bricks(user_id);
create index idx_bricks_status on public.bricks(status);
create index idx_bricks_deadline on public.bricks(deadline) where deadline is not null;
create index idx_quantas_brick_id on public.quantas(brick_id);
create index idx_quantas_user_id on public.quantas(user_id);
create index idx_events_user_id on public.events(user_id);
create index idx_events_time_range on public.events(user_id, start_time, end_time);
create index idx_resources_type on public.resources(resource_type);
create index idx_resources_difficulty on public.resources(difficulty_level);
create index idx_resource_recommendations_user_id on public.resource_recommendations(user_id);
create index idx_conversations_user_id on public.conversations(user_id);
create index idx_messages_conversation_id on public.messages(conversation_id);

-- Row Level Security (RLS) policies
alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.bricks enable row level security;
alter table public.quantas enable row level security;
alter table public.events enable row level security;
alter table public.constraints enable row level security;
alter table public.resource_recommendations enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- User preferences policies
create policy "Users can manage their own preferences"
  on public.user_preferences for all
  using (auth.uid() = user_id);

-- Bricks policies
create policy "Users can manage their own bricks"
  on public.bricks for all
  using (auth.uid() = user_id);

-- Quantas policies
create policy "Users can manage their own quantas"
  on public.quantas for all
  using (auth.uid() = user_id);

-- Events policies
create policy "Users can manage their own events"
  on public.events for all
  using (auth.uid() = user_id);

-- Constraints policies
create policy "Users can manage their own constraints"
  on public.constraints for all
  using (auth.uid() = user_id);

-- Resource recommendations policies
create policy "Users can view their own recommendations"
  on public.resource_recommendations for select
  using (auth.uid() = user_id);

create policy "Users can update their own recommendations"
  on public.resource_recommendations for update
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

-- Resources table is public (read-only for users)
create policy "Anyone can view resources"
  on public.resources for select
  to authenticated
  using (true);

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

create trigger handle_updated_at before update on public.user_preferences
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.bricks
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.quantas
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.events
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.resources
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.resource_recommendations
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.conversations
  for each row execute procedure public.handle_updated_at();

-- Function to automatically create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  
  insert into public.user_preferences (user_id)
  values (new.id);
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
