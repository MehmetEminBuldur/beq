/**
 * Chat message endpoint for AI conversations
 * Vercel serverless function replacement for orchestrator chat endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Types
interface ChatMessageRequest {
  message: string;
  user_id: string;
  conversation_id?: string;
  context?: Record<string, any>;
}

interface ChatMessageResponse {
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

// Forwarder to orchestrator chat endpoint
async function callOrchestrator(body: ChatMessageRequest) {
  const baseURL = process.env.NEXT_PUBLIC_ORCHESTRATOR_API_URL || 'http://localhost:8000';
  const response = await fetch(`${baseURL}/api/v1/chat/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    // Note: If auth required, consider forwarding Supabase JWT in Authorization header
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Orchestrator API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// Main POST handler
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request body
    const body: ChatMessageRequest = await request.json();
    const { message, user_id, conversation_id, context } = body;

    // Basic validation
    if (!message || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields: message and user_id' },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'Message too long (max 2000 characters)' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createServerComponentClient({ cookies });

    // Generate IDs
    const messageId = crypto.randomUUID();
    const finalConversationId = conversation_id || crypto.randomUUID();

    // Get user profile for context (optional, for personalization)
    let userProfile = null;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user_id)
        .single();
      userProfile = data;
    } catch (error) {
      console.log('Could not fetch user profile:', error);
    }

    // Call orchestrator for AI response
    const orchestratorResponse = await callOrchestrator({
      message,
      user_id,
      conversation_id: finalConversationId,
      context: context || {}
    });

    const responseText = orchestratorResponse.response || 'Sorry, I could not process your request.';
    const modelUsed = orchestratorResponse.model_used || 'google/gemma-2-27b-it';

    // Calculate processing time
    const processingTimeMs = Date.now() - startTime;

    // Analyze response for actions (simple keyword detection)
    const actions: string[] = [];
    const suggestions: string[] = [];
    let scheduleUpdated = false;
    const bricksCreated: string[] = [];
    const bricksUpdated: string[] = [];
    const resourcesRecommended: string[] = [];

    // Simple action detection
    if (responseText.toLowerCase().includes('schedule') || responseText.toLowerCase().includes('calendar')) {
      actions.push('schedule_analysis');
    }
    if (responseText.toLowerCase().includes('brick') || responseText.toLowerCase().includes('task')) {
      actions.push('task_management');
    }
    if (responseText.toLowerCase().includes('recommend')) {
      actions.push('resource_recommendation');
    }

    // Store conversation in Supabase (optional)
    try {
      await supabase
        .from('conversations')
        .upsert({
          id: finalConversationId,
          user_id: user_id,
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      await supabase
        .from('messages')
        .insert({
          id: messageId,
          conversation_id: finalConversationId,
          user_id: user_id,
          content: message,
          response: responseText,
          model_used: modelUsed,
          processing_time_ms: processingTimeMs,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to store conversation:', error);
      // Continue without storing - not critical
    }

    // Build response
    const response: ChatMessageResponse = {
      message_id: messageId,
      conversation_id: finalConversationId,
      response: responseText,
      model_used: modelUsed,
      confidence_score: 0.85, // Static for now, could be calculated
      processing_time_ms: processingTimeMs,
      actions_taken: actions,
      suggestions: suggestions,
      schedule_updated: scheduleUpdated,
      bricks_created: bricksCreated,
      bricks_updated: bricksUpdated,
      resources_recommended: resourcesRecommended,
      timestamp: new Date().toISOString()
    };

    console.log(`Chat message processed for user ${user_id} in ${processingTimeMs}ms`);

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    const processingTimeMs = Date.now() - startTime;
    
    console.error('Chat message processing failed:', error);

    return NextResponse.json(
      {
        error: 'Failed to process message',
        message: 'An error occurred while processing your message. Please try again.',
        processing_time_ms: processingTimeMs,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
