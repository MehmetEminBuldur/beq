-- Fix chat RLS issues by adding service role policies and missing fields
-- Run this migration to fix chat functionality

-- Add missing fields to conversations table
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS context jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_message_at timestamp with time zone;

-- Add missing fields to messages table  
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS response text;

-- Create service role policies for conversations
DROP POLICY IF EXISTS "Service role can manage all conversations" ON public.conversations;
CREATE POLICY "Service role can manage all conversations"
  ON public.conversations FOR ALL
  USING (auth.role() = 'service_role');

-- Create service role policies for messages
DROP POLICY IF EXISTS "Service role can manage all messages" ON public.messages;
CREATE POLICY "Service role can manage all messages"
  ON public.messages FOR ALL
  USING (auth.role() = 'service_role');

-- Update existing messages to have user_id (if needed)
-- This will need to be done manually if there are existing messages without user_id

-- Add index for messages user_id
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
