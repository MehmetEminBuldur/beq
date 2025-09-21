import { supabase } from '@/lib/supabase/client';

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

export interface SendMessageRequest {
  message: string;
  user_id: string;
  conversation_id?: string;
  context?: Record<string, any>;
}

export interface SendMessageResponse {
  message_id: string;
  conversation_id: string;
  response: string;
  model_used: string;
  confidence_score?: number;
  processing_time_ms: number;
  actions_taken: string[];
  suggestions: string[];
  schedule_updated: boolean;
  bricks_created: string[];
  bricks_updated: string[];
  resources_recommended: string[];
  timestamp: string;
}

export interface ConversationHistory {
  conversation_id: string;
  user_id: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
  total_messages: number;
}

class ChatAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_ORCHESTRATOR_API_URL || 'http://localhost:8000';
  }

  private async getAuthHeaders() {
    try {
      console.log('Getting Supabase session...');
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error);
        // For debugging, continue without auth if session fails
        console.warn('Continuing without authentication for debugging...');
        return {
          'Content-Type': 'application/json',
        };
      }

      if (!session?.access_token) {
        console.error('No access token in session');
        // For debugging, continue without auth
        console.warn('No access token, continuing without authentication for debugging...');
        return {
          'Content-Type': 'application/json',
        };
      }

      console.log('Session found, token available');
      return {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      };
    } catch (error) {
      console.error('getAuthHeaders failed:', error);
      // For debugging, continue without auth
      console.warn('Auth failed, continuing without authentication for debugging...');
      return {
        'Content-Type': 'application/json',
      };
    }
  }

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      console.log('Getting auth headers...');
      const headers = await this.getAuthHeaders();
      console.log('Auth headers obtained:', !!headers['Authorization']);

      console.log('Making fetch request to:', `${this.baseURL}/api/v1/chat/message`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('Chat request timed out after 30 seconds');
        controller.abort();
      }, 30000); // 30 second timeout

      const response = await fetch(`${this.baseURL}/api/v1/chat/message`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail?.message || 'Failed to send message');
      }

      const data = await response.json();
      console.log('Received response data:', data);

      // Transform backend response to frontend format
      return {
        message_id: data.message_id,
        conversation_id: data.conversation_id,
        response: data.response,
        model_used: data.model_used,
        confidence_score: data.confidence_score,
        processing_time_ms: data.processing_time_ms,
        actions_taken: data.actions_taken || [],
        suggestions: data.suggestions || [],
        schedule_updated: data.schedule_updated || false,
        bricks_created: data.bricks_created || [],
        bricks_updated: data.bricks_updated || [],
        resources_recommended: data.resources_recommended || [],
        timestamp: data.timestamp,
      };
    } catch (error) {
      console.error('Chat API error:', error);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. The server took too long to respond.');
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      }

      throw error;
    }
  }

  async getConversationHistory(
    conversationId: string,
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ConversationHistory> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(
        `${this.baseURL}/api/v1/chat/conversations/${conversationId}?user_id=${userId}&limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail?.message || 'Failed to get conversation history');
      }

      const data = await response.json();

      return {
        conversation_id: data.conversation_id,
        user_id: data.user_id,
        messages: data.messages.map((msg: any) => ({
          id: msg.id,
          conversation_id: data.conversation_id,
          content: msg.content,
          response: msg.response,
          sender: msg.sender,
          timestamp: new Date(msg.timestamp),
          type: msg.type || 'text',
          metadata: msg.metadata,
        })),
        created_at: data.created_at,
        updated_at: data.updated_at,
        total_messages: data.total_messages,
      };
    } catch (error) {
      console.error('Get conversation history error:', error);
      throw error;
    }
  }

  async getUserConversations(
    userId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<ConversationHistory[]> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(
        `${this.baseURL}/api/v1/chat/conversations?user_id=${userId}&limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail?.message || 'Failed to get user conversations');
      }

      const data = await response.json();

      return data.map((conv: any) => ({
        conversation_id: conv.conversation_id,
        user_id: conv.user_id,
        messages: conv.messages || [],
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        total_messages: conv.total_messages || 0,
      }));
    } catch (error) {
      console.error('Get user conversations error:', error);
      throw error;
    }
  }

  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(
        `${this.baseURL}/api/v1/chat/conversations/${conversationId}?user_id=${userId}`,
        {
          method: 'DELETE',
          headers,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail?.message || 'Failed to delete conversation');
      }
    } catch (error) {
      console.error('Delete conversation error:', error);
      throw error;
    }
  }

  async clearConversation(conversationId: string, userId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(
        `${this.baseURL}/api/v1/chat/conversations/${conversationId}/clear?user_id=${userId}`,
        {
          method: 'POST',
          headers,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail?.message || 'Failed to clear conversation');
      }
    } catch (error) {
      console.error('Clear conversation error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const chatAPI = new ChatAPI();
