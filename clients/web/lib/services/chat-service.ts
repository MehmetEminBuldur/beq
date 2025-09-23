import { supabase } from '@/lib/supabase/client';
import { ChatMessage } from '@/lib/hooks/use-chat';

export interface DatabaseMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  response: string | null;
  model_used: string | null;
  processing_time_ms: number | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  context: Record<string, any>;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export class ChatService {
  /**
   * Save a user message to Supabase
   */
  static async saveUserMessage(
    conversationId: string,
    userId: string,
    content: string
  ): Promise<string> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        content,
        response: null, // Will be updated when assistant responds
        model_used: null,
        processing_time_ms: null,
        metadata: {}
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving user message:', error);
      throw new Error('Failed to save message');
    }

    // Update conversation's last_message_at
    await this.updateConversationLastMessage(conversationId);

    return data.id;
  }

  /**
   * Save an assistant response to Supabase
   */
  static async saveAssistantMessage(
    conversationId: string,
    userId: string,
    messageId: string,
    response: string,
    modelUsed: string,
    processingTimeMs: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({
        response,
        model_used: modelUsed,
        processing_time_ms: processingTimeMs,
        metadata: metadata || {}
      })
      .eq('id', messageId);

    if (error) {
      console.error('Error saving assistant message:', error);
      throw new Error('Failed to save assistant response');
    }

    // Update conversation's last_message_at
    await this.updateConversationLastMessage(conversationId);
  }

  /**
   * Load conversation history from Supabase
   */
  static async loadConversationHistory(
    conversationId: string,
    userId: string,
    limit: number = 50
  ): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error loading conversation history:', error);
      throw new Error('Failed to load conversation history');
    }

    // Transform database messages to frontend format
    const messages: ChatMessage[] = [];

    for (const msg of data) {
      // Add user message
      messages.push({
        id: msg.id + '_user',
        conversation_id: msg.conversation_id,
        content: msg.content,
        sender: 'user',
        timestamp: new Date(msg.created_at),
        type: 'text'
      });

      // Add assistant response if exists
      if (msg.response) {
        messages.push({
          id: msg.id + '_assistant',
          conversation_id: msg.conversation_id,
          content: msg.response,
          sender: 'assistant',
          timestamp: new Date(msg.created_at),
          type: 'text',
          metadata: {
            model_used: msg.model_used,
            processing_time_ms: msg.processing_time_ms,
            ...msg.metadata
          }
        });
      }
    }

    return messages;
  }

  /**
   * Create a new conversation
   */
  static async createConversation(
    userId: string,
    title?: string,
    context?: Record<string, any>
  ): Promise<string> {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        title: title || null,
        context: context || {},
        last_message_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      throw new Error('Failed to create conversation');
    }

    return data.id;
  }

  /**
   * Update conversation's last_message_at timestamp
   */
  private static async updateConversationLastMessage(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (error) {
      console.error('Error updating conversation last_message_at:', error);
    }
  }

  /**
   * Get user's conversations
   */
  static async getUserConversations(
    userId: string,
    limit: number = 10
  ): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error loading user conversations:', error);
      throw new Error('Failed to load conversations');
    }

    return data;
  }

  /**
   * Delete a conversation and all its messages
   */
  static async deleteConversation(
    conversationId: string,
    userId: string
  ): Promise<void> {
    // Messages will be deleted automatically due to CASCADE constraint
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting conversation:', error);
      throw new Error('Failed to delete conversation');
    }
  }

  /**
   * Clear all messages from a conversation
   */
  static async clearConversation(
    conversationId: string,
    userId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error clearing conversation:', error);
      throw new Error('Failed to clear conversation');
    }
  }
}
