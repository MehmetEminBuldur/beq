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
  // Use Docker-specific URL when running in Docker environment
  const isDocker = process.env.DOCKER_ENV === 'true';
  const baseURL = isDocker 
    ? (process.env.DOCKER_NEXT_PUBLIC_ORCHESTRATOR_API_URL || 'http://orchestrator:8000')
    : (process.env.NEXT_PUBLIC_ORCHESTRATOR_API_URL || 'http://localhost:8000');
  
  console.log('Calling orchestrator at:', `${baseURL}/api/v1/chat/message`, 'Docker:', isDocker);
  
  try {
    const response = await fetch(`${baseURL}/api/v1/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000), // 30 second timeout (increased for LangGraph workflow)
      // Note: If auth required, consider forwarding Supabase JWT in Authorization header
    });

    console.log('Orchestrator response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Orchestrator error response:', errorText);
      throw new Error(`Orchestrator API error: ${response.status} - ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Orchestrator raw response:', responseText.substring(0, 200));
    
    try {
      return JSON.parse(responseText);
    } catch (jsonError) {
      console.error('JSON parsing failed for orchestrator response:', jsonError);
      console.error('Response that failed to parse:', responseText);
      throw new Error(`Orchestrator returned invalid JSON: ${responseText.substring(0, 200)}...`);
    }
  } catch (fetchError) {
    console.error('Fetch error calling orchestrator:', fetchError);
    
    // Return fallback response instead of throwing
    console.log('Using fallback response due to orchestrator failure');
    return getFallbackResponse(body);
  }
}

// Fallback response when orchestrator is unavailable
function getFallbackResponse(request: ChatMessageRequest) {
  const message = request.message.toLowerCase();
  
  // Basic pattern matching for more relevant responses
  let response: string;
  
  if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
    response = "Hello! I'm BeQ, your AI life management assistant. I'm currently running in simplified mode, but I'm still here to help you organize your life using the Bricks and Quantas system!";
  } else if (message.includes('help') || message.includes('assist')) {
    response = "I'd love to help you! While my full AI capabilities are temporarily unavailable, I can still provide guidance on productivity, goal-setting, and life organization. What would you like to work on?";
  } else if (message.includes('brick') || message.includes('task') || message.includes('project')) {
    response = "Great question about task management! Bricks are your major projects or goals, while Quantas are the smaller, actionable steps that help you complete them. What project or goal are you working on?";
  } else if (message.includes('schedule') || message.includes('plan') || message.includes('calendar')) {
    response = "Planning and scheduling are essential for productivity! While I can't access your full calendar right now, I can help you think through time management strategies and how to structure your day effectively.";
  } else if (message.includes('goal') || message.includes('objective')) {
    response = "Goal setting is a cornerstone of the BeQ system! I recommend breaking larger goals into smaller, manageable Bricks, then further into daily Quantas. What goal are you working toward?";
  } else {
    const fallbackResponses = [
      "I'm here to help you organize your life with Bricks and Quantas! While I'm currently running in simplified mode, I can still assist you with planning and organizing your tasks.",
      "Thanks for your message! I'm temporarily running in offline mode, but I can still help you think through productivity strategies and life organization.",
      "I appreciate you reaching out! While my advanced AI features are temporarily unavailable, I can still provide guidance on the Bricks and Quantas productivity system.",
    ];
    response = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }
  
  return {
    response,
    model_used: 'fallback-v1',
    confidence_score: 0.5,
    processing_time_ms: 100,
    actions_taken: ['pattern_matching'],
    suggestions: [
      "Tell me about your current goals",
      "Help me plan my day", 
      "How do Bricks and Quantas work?",
      "What productivity techniques work best?"
    ],
    schedule_updated: false,
    bricks_created: [],
    bricks_updated: [],
    resources_recommended: [],
    timestamp: new Date().toISOString()
  };
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
    console.log('Attempting to call orchestrator with user_id:', user_id);
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

    // Extract actions from orchestrator response
    const actions: string[] = orchestratorResponse.actions_taken || [];
    const suggestions: string[] = orchestratorResponse.suggestions || [];
    const scheduleUpdated = orchestratorResponse.schedule_updated || false;
    const bricksCreated: string[] = orchestratorResponse.bricks_created || [];
    const bricksUpdated: string[] = orchestratorResponse.bricks_updated || [];
    const resourcesRecommended: string[] = orchestratorResponse.resources_recommended || [];

    // Log the extracted actions for debugging
    console.log('Extracted from orchestrator:', {
      actions,
      bricksCreated,
      bricksUpdated,
      scheduleUpdated,
      suggestions: suggestions.length
    });

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
      confidence_score: orchestratorResponse.confidence_score || 0.85,
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
