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
   * Ensure conversation exists, create if it doesn't
   */
  static async ensureConversationExists(
    conversationId: string,
    userId: string
  ): Promise<string> {
    try {
      // Check if conversation exists
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('id, user_id')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle() to handle 0 results gracefully

      if (convError) {
        console.error('Error checking conversation:', convError);
        throw new Error(`Failed to check conversation: ${convError.message}`);
      }

      if (conversation) {
        console.log('Conversation exists:', conversationId);
        return conversationId;
      }

      // Conversation doesn't exist, create it
      console.log('Conversation not found, creating new one');
      return await this.createConversation(userId, 'New Chat');

    } catch (error) {
      console.error('Error ensuring conversation exists:', error);
      throw new Error('Failed to ensure conversation exists');
    }
  }

  /**
   * Save a user message to Supabase
   */
  static async saveUserMessage(
    conversationId: string,
    userId: string,
    content: string
  ): Promise<string> {
    try {
      // First verify the conversation exists
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('id, user_id')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 results gracefully

      if (convError) {
        console.error('Conversation verification failed:', {
          conversationId,
          userId,
          error: convError,
          errorCode: convError?.code,
          errorMessage: convError?.message
        });
        throw new Error(`Conversation verification error: ${convError?.message || 'Unknown error'}`);
      }

      if (!conversation) {
        console.error('Conversation not found:', {
          conversationId,
          userId
        });
        throw new Error(`Conversation ${conversationId} not found or access denied`);
      }

      // Save the message (let Supabase generate the ID)
      const messageData = {
        conversation_id: conversationId,
        user_id: userId,
        content: content.trim(),
        response: null, // Will be updated when assistant responds
        model_used: null,
        processing_time_ms: null,
        metadata: {}
      };
      
      console.log('Attempting to insert message:', { 
        conversationId: messageData.conversation_id,
        userId: messageData.user_id,
        contentLength: messageData.content.length
      });
      
      const { data, error } = await supabase
        .from('messages')
        .insert(messageData as any)
        .select('id')
        .single();

      if (error) {
        console.error('Error saving user message:', {
          conversationId,
          userId,
          error,
          errorCode: error.code,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint
        });
        throw new Error(`Failed to save message: ${error.message} (Code: ${error.code})`);
      }

      if (!data || !(data as any).id) {
        throw new Error('Message saved but no ID returned');
      }

      // Update conversation's last_message_at
      await this.updateConversationLastMessage(conversationId);

      console.log('Successfully saved user message:', (data as any).id);
      return (data as any).id;

    } catch (error) {
      console.error('Message saving failed:', error);
      throw error instanceof Error ? error : new Error('Unknown error saving message');
    }
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
    const { error } = await (supabase
      .from('messages') as any)
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

    for (const msg of data as any[]) {
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
    try {
      // First, ensure the user profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('User profile not found:', profileError);
        throw new Error('User profile not found. Please ensure you are properly authenticated.');
      }

      // Create the conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          title: title || 'New Chat',
          context: context || {},
          last_message_at: new Date().toISOString()
        } as any)
        .select('id')
        .single();

      if (error) {
        console.error('Error creating conversation:', {
          userId,
          error,
          errorCode: error.code,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint
        });
        throw new Error(`Failed to create conversation: ${error.message} (Code: ${error.code})`);
      }

      if (!data || !(data as any).id) {
        throw new Error('Conversation created but no ID returned');
      }

      console.log('Successfully created conversation:', (data as any).id);
      return (data as any).id;

    } catch (error) {
      console.error('Conversation creation failed:', error);
      throw error instanceof Error ? error : new Error('Unknown error creating conversation');
    }
  }

  /**
   * Update conversation's last_message_at timestamp
   */
  private static async updateConversationLastMessage(conversationId: string): Promise<void> {
    const { error } = await (supabase
      .from('conversations') as any)
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
