/**
 * RAG-powered recommendations endpoint
 * Vercel serverless function replacement for RAG recommender service
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Types
interface RecommendationRequest {
  user_id: string;
  query: string;
  category?: 'learning' | 'tools' | 'productivity' | 'wellness' | 'general';
  context?: {
    current_bricks?: string[];
    user_goals?: string[];
    preferences?: Record<string, any>;
  };
  limit?: number;
}

interface Resource {
  id: string;
  title: string;
  description: string;
  url?: string;
  category: string;
  relevance_score: number;
  reasoning: string;
  resource_type: 'article' | 'tool' | 'course' | 'book' | 'video' | 'app';
  estimated_time_minutes?: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

interface RecommendationResponse {
  success: boolean;
  query: string;
  resources: Resource[];
  reasoning: string;
  confidence_score: number;
  total_found: number;
  processing_time_ms: number;
  suggestions: string[];
  timestamp: string;
}

// OpenRouter recommendation client (disabled - OpenRouter not configured)
async function generateRecommendationsWithAI(request: RecommendationRequest): Promise<any> {
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;

  if (!openRouterApiKey) {
    throw new Error('OpenRouter API key not configured - AI recommendation features are disabled');
  }

  // Create recommendation prompt
  const recommendationPrompt = `You are an expert recommendation engine for the BeQ life management system. Generate personalized resource recommendations based on the user's query and context.

**User Query:** "${request.query}"

**Category:** ${request.category || 'general'}

**Context:**
- Current Bricks (projects): ${request.context?.current_bricks?.join(', ') || 'None provided'}
- User Goals: ${request.context?.user_goals?.join(', ') || 'None provided'}
- Additional Preferences: ${JSON.stringify(request.context?.preferences || {})}

**Request:** Generate up to ${request.limit || 5} relevant resource recommendations.

Please respond with a JSON object containing:
{
  "resources": [
    {
      "id": "unique_id",
      "title": "Resource Title",
      "description": "Brief description of the resource",
      "url": "https://example.com (if available)",
      "category": "learning|tools|productivity|wellness|general",
      "relevance_score": 0.95,
      "reasoning": "Why this resource is relevant to the user",
      "resource_type": "article|tool|course|book|video|app",
      "estimated_time_minutes": 30,
      "difficulty_level": "beginner|intermediate|advanced",
      "tags": ["tag1", "tag2", "tag3"]
    }
  ],
  "reasoning": "Overall explanation of recommendation strategy",
  "confidence_score": 0.85,
  "suggestions": ["Follow-up suggestion 1", "Follow-up suggestion 2"]
}

Focus on:
1. Relevance to the user's query and current projects
2. Practical applicability and actionability
3. Quality and reliability of resources
4. Diversity of resource types and approaches
5. Alignment with user's goals and skill level

For URLs, prefer well-known, high-quality sources. If specific URLs aren't available, you can suggest general platforms or indicate "Search for: [specific terms]".

Respond ONLY with valid JSON, no additional text.`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterApiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.VERCEL_URL || 'https://beq.app',
      'X-Title': 'BeQ - AI Recommendations'
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert recommendation engine. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: recommendationPrompt
        }
      ],
      temperature: 0.4, // Balanced creativity and consistency
      max_tokens: 1500,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const aiResponse = data.choices?.[0]?.message?.content;

  if (!aiResponse) {
    throw new Error('No response from AI model');
  }

  try {
    return JSON.parse(aiResponse);
  } catch (error) {
    console.error('Failed to parse AI response as JSON:', aiResponse);
    
    // Fallback response
    return {
      resources: [],
      reasoning: "AI recommendation service temporarily unavailable. Please try again.",
      confidence_score: 0.0,
      suggestions: ["Try rephrasing your query", "Check back later for recommendations"]
    };
  }
}

// Generate mock recommendations as fallback
function generateMockRecommendations(query: string, category: string): any {
  const mockResources: Resource[] = [
    {
      id: crypto.randomUUID(),
      title: "Getting Things Done (GTD) Method",
      description: "A productivity system for capturing, clarifying, organizing, and reviewing tasks",
      url: "https://gettingthingsdone.com/",
      category: "productivity",
      relevance_score: 0.9,
      reasoning: "Highly relevant for task management and productivity improvement",
      resource_type: "article",
      estimated_time_minutes: 45,
      difficulty_level: "beginner",
      tags: ["productivity", "task-management", "organization"]
    },
    {
      id: crypto.randomUUID(),
      title: "Notion - All-in-one workspace",
      description: "Note-taking, task management, and collaboration platform",
      url: "https://notion.so/",
      category: "tools",
      relevance_score: 0.85,
      reasoning: "Excellent tool for organizing projects and tasks",
      resource_type: "app",
      estimated_time_minutes: 120,
      difficulty_level: "intermediate",
      tags: ["productivity", "notes", "collaboration", "organization"]
    }
  ];

  return {
    resources: mockResources.slice(0, 2),
    reasoning: `Mock recommendations generated for query: "${query}" in category: ${category}`,
    confidence_score: 0.7,
    suggestions: ["Try being more specific in your query", "Explore different categories"]
  };
}

// POST handler
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request body
    const body: RecommendationRequest = await request.json();

    // Basic validation
    if (!body.user_id || !body.query) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id and query' },
        { status: 400 }
      );
    }

    if (body.query.length < 3) {
      return NextResponse.json(
        { error: 'Query too short (minimum 3 characters)' },
        { status: 400 }
      );
    }

    if (body.query.length > 500) {
      return NextResponse.json(
        { error: 'Query too long (maximum 500 characters)' },
        { status: 400 }
      );
    }

    console.log(`Generating recommendations for user ${body.user_id}: "${body.query}"`);

    // Try AI recommendations first
    let aiResult;
    try {
      aiResult = await generateRecommendationsWithAI(body);
    } catch (error) {
      console.error('AI recommendation failed, using fallback:', error);
      aiResult = generateMockRecommendations(body.query, body.category || 'general');
    }

    // Calculate processing time
    const processingTimeMs = Date.now() - startTime;

    // Ensure all resources have IDs
    const resourcesWithIds = (aiResult.resources || []).map((resource: any) => ({
      ...resource,
      id: resource.id || crypto.randomUUID()
    }));

    // Store recommendations in Supabase (optional)
    try {
      const supabase = createServerComponentClient({ cookies });
      
      await supabase
        .from('recommendation_logs')
        .insert({
          user_id: body.user_id,
          query: body.query,
          category: body.category,
          resources_count: resourcesWithIds.length,
          confidence_score: aiResult.confidence_score,
          processing_time_ms: processingTimeMs,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to store recommendation log:', error);
      // Continue without storing - not critical
    }

    const response: RecommendationResponse = {
      success: true,
      query: body.query,
      resources: resourcesWithIds,
      reasoning: aiResult.reasoning || 'Recommendations generated based on your query',
      confidence_score: aiResult.confidence_score || 0.8,
      total_found: resourcesWithIds.length,
      processing_time_ms: processingTimeMs,
      suggestions: aiResult.suggestions || [],
      timestamp: new Date().toISOString()
    };

    console.log(`Generated ${resourcesWithIds.length} recommendations for user ${body.user_id} in ${processingTimeMs}ms`);

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    const processingTimeMs = Date.now() - startTime;
    
    console.error('Recommendation generation failed:', error);

    return NextResponse.json(
      {
        success: false,
        query: '',
        resources: [],
        reasoning: 'Recommendation service temporarily unavailable',
        confidence_score: 0.0,
        total_found: 0,
        processing_time_ms: processingTimeMs,
        suggestions: ['Try again later', 'Check your internet connection'],
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET handler for trending/popular recommendations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'general';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);

    // Mock trending recommendations
    const trendingRecommendations = {
      success: true,
      category,
      resources: [
        {
          id: crypto.randomUUID(),
          title: "Deep Work by Cal Newport",
          description: "A guide to focused success in a distracted world",
          category: "productivity",
          relevance_score: 0.95,
          reasoning: "Highly rated productivity book",
          resource_type: "book",
          tags: ["focus", "productivity", "deep-work"]
        },
        {
          id: crypto.randomUUID(),
          title: "Todoist - Task Management",
          description: "Popular task management application",
          url: "https://todoist.com/",
          category: "tools",
          relevance_score: 0.9,
          reasoning: "Widely used productivity tool",
          resource_type: "app",
          tags: ["tasks", "productivity", "organization"]
        }
      ].slice(0, limit),
      total_found: 2,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(trendingRecommendations, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch trending recommendations:', error);

    return NextResponse.json(
      { error: 'Failed to fetch trending recommendations' },
      { status: 500 }
    );
  }
}
