'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuthContext } from '@/lib/providers/auth-provider';
import { chatAPI, ChatMessage, SendMessageResponse } from '@/lib/api/chat';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  content: string;
  response?: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  type?: 'text' | 'schedule' | 'task' | 'resource';
  metadata?: {
    model_used?: string;
    confidence_score?: number;
    processing_time_ms?: number;
    actions_taken?: string[];
    suggestions?: string[];
    schedule_updated?: boolean;
    bricks_created?: string[];
    bricks_updated?: string[];
    resources_recommended?: string[];
  };
}

export function useChat(conversationId?: string) {
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize or load conversation
  useEffect(() => {
    if (user && !isInitialized) {
      if (currentConversationId) {
        loadConversationHistory();
      } else {
        setIsInitialized(true);
      }
    }
  }, [user, currentConversationId, isInitialized]);

  const loadConversationHistory = async () => {
    if (!user || !currentConversationId) return;

    try {
      const history = await chatAPI.getConversationHistory(currentConversationId, user.id);

      // Transform backend messages to frontend format
      const transformedMessages: ChatMessage[] = history.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));

      setMessages(transformedMessages);
    } catch (error) {
      console.error('Failed to load conversation history:', error);
      toast.error('Failed to load conversation history');
    } finally {
      setIsInitialized(true);
    }
  };

  const sendMessage = useCallback(async (content: string) => {
    if (!user) {
      toast.error('You must be logged in to send messages');
      setIsLoading(false);
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      conversation_id: currentConversationId || '',
      content,
      sender: 'user',
      timestamp: new Date(),
      type: 'text',
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Add overall timeout for the entire operation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Chat request timed out after 60 seconds'));
      }, 60000);
    });

    try {
      const sendMessagePromise = async () => {
        // Get current user context for more personalized responses
        console.log('Fetching user context from Supabase...');

        // Add timeout to Supabase queries
        const supabaseTimeout = (promise: Promise<any>, timeoutMs: number = 10000) => {
          return Promise.race([
            promise,
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Supabase query timed out')), timeoutMs)
            )
          ]);
        };

        let currentStats = null;
        let recentConversations = null;

        try {
          const statsPromise = supabase
            .from('bricks')
            .select('id, title, status, priority')
            .eq('user_id', user.id);
          const { data, error: statsError } = await supabaseTimeout(statsPromise, 5000) as any;

          if (statsError) {
            console.error('Error fetching bricks stats:', statsError);
          } else {
            currentStats = data;
          }
        } catch (error) {
          console.error('Timeout or error fetching bricks stats:', error);
        }

        try {
          const conversationsPromise = supabase
            .from('conversations')
            .select('title, context')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3);
          const { data, error: conversationsError } = await supabaseTimeout(conversationsPromise, 5000) as any;

          if (conversationsError) {
            console.error('Error fetching recent conversations:', conversationsError);
          } else {
            recentConversations = data;
          }
        } catch (error) {
          console.error('Timeout or error fetching recent conversations:', error);
        }

        console.log('User context fetched, preparing chat request...');

        const request = {
          message: content,
          user_id: user.id,
          conversation_id: currentConversationId,
          context: {
            timezone: user.timezone,
            preferences: user.preferences,
            onboarding_completed: user.onboarding_completed,
            current_stats: {
              active_bricks: currentStats?.filter((b: any) => b.status === 'in_progress').length || 0,
              pending_bricks: currentStats?.filter((b: any) => b.status === 'pending').length || 0,
              total_bricks: currentStats?.length || 0,
            },
            recent_conversations: recentConversations?.map((c: any) => ({
              title: c.title,
              context: c.context
            })) || [],
            user_goals: user.preferences?.onboarding_goals || user.preferences?.learning_goals || [],
          },
        };

        console.log('Sending chat request to orchestrator...', request);
        const response: SendMessageResponse = await chatAPI.sendMessage(request);
        console.log('Chat response received:', response);

        // Update conversation ID if this is a new conversation
        if (!currentConversationId) {
          setCurrentConversationId(response.conversation_id);
        }

        // Create assistant message
        const assistantMessage: ChatMessage = {
          id: response.message_id,
          conversation_id: response.conversation_id,
          content: response.response,
          sender: 'assistant',
          timestamp: new Date(response.timestamp),
          type: 'text',
          metadata: {
            model_used: response.model_used,
            confidence_score: response.confidence_score,
            processing_time_ms: response.processing_time_ms,
            actions_taken: response.actions_taken,
            suggestions: response.suggestions,
            schedule_updated: response.schedule_updated,
            bricks_created: response.bricks_created,
            bricks_updated: response.bricks_updated,
            resources_recommended: response.resources_recommended,
          },
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Show success messages based on actions taken
        if (response.schedule_updated) {
          toast.success('Your schedule has been updated!');
        }

        if (response.bricks_created.length > 0) {
          toast.success(`Created ${response.bricks_created.length} new task(s)!`);
        }

        if (response.bricks_updated.length > 0) {
          toast.success(`Updated ${response.bricks_updated.length} task(s)!`);
        }

        if (response.resources_recommended.length > 0) {
          toast.success(`Recommended ${response.resources_recommended.length} resource(s)!`);
        }
      };

      // Race between the actual operation and timeout
      await Promise.race([sendMessagePromise(), timeoutPromise]);

    } catch (error) {
      console.error('Failed to send message:', error);

      // Extract error details for better debugging
      let errorDetails = 'Unknown error occurred';
      if (error instanceof Error) {
        errorDetails = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Handle API error responses
        if ('detail' in error && typeof error.detail === 'object' && error.detail !== null) {
          errorDetails = error.detail.message || JSON.stringify(error.detail);
        } else if ('message' in error) {
          errorDetails = error.message;
        } else {
          errorDetails = JSON.stringify(error);
        }
      }

      // Add detailed error message to chat for debugging
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        conversation_id: currentConversationId || '',
        content: `Sorry, I encountered an error processing your message. Error details: ${errorDetails}`,
        sender: 'assistant',
        timestamp: new Date(),
        type: 'text',
      };

      setMessages(prev => [...prev, errorMessage]);
      toast.error(`Failed to send message: ${errorDetails}`);
    } finally {
      setIsLoading(false);
    }
  }, [user, currentConversationId]);

  const clearMessages = useCallback(async () => {
    if (!user || !currentConversationId) {
      setMessages([]);
      return;
    }

    try {
      await chatAPI.clearConversation(currentConversationId, user.id);
      setMessages([]);
      toast.success('Conversation cleared');
    } catch (error) {
      console.error('Failed to clear conversation:', error);
      toast.error('Failed to clear conversation');
    }
  }, [user, currentConversationId]);

  const deleteConversation = useCallback(async () => {
    if (!user || !currentConversationId) return;

    try {
      await chatAPI.deleteConversation(currentConversationId, user.id);
      setMessages([]);
      setCurrentConversationId(undefined);
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast.error('Failed to delete conversation');
    }
  }, [user, currentConversationId]);

  const startNewConversation = useCallback(() => {
    setCurrentConversationId(undefined);
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    isInitialized,
    conversationId: currentConversationId,
    sendMessage,
    clearMessages,
    deleteConversation,
    startNewConversation,
  };
}