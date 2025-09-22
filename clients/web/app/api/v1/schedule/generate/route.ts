/**
 * Schedule generation endpoint using AI
 * Vercel serverless function replacement for scheduler service
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Types
interface TaskInput {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_duration_minutes: number;
  deadline?: string;
  preferred_time?: 'morning' | 'afternoon' | 'evening';
  dependencies: string[];
}

interface EventInput {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  is_moveable: boolean;
}

interface UserPreferences {
  timezone: string;
  work_start_time: string;
  work_end_time: string;
  break_frequency_minutes: number;
  break_duration_minutes: number;
  lunch_time: string;
  lunch_duration_minutes: number;
  preferred_task_duration_minutes: number;
  energy_peak_hours: string[];
  avoid_scheduling_after: string;
}

interface ConstraintInput {
  type: string;
  start_time?: string;
  end_time?: string;
  description: string;
  is_hard_constraint: boolean;
}

interface ScheduleRequest {
  user_id: string;
  tasks: TaskInput[];
  existing_events: EventInput[];
  user_preferences: UserPreferences;
  constraints: ConstraintInput[];
  planning_horizon_days: number;
}

interface ScheduleResponse {
  success: boolean;
  scheduled_events: any[];
  reasoning: string;
  confidence_score: number;
  alternative_suggestions: string[];
  warnings: string[];
  unscheduled_tasks: string[];
  processing_time_seconds: number;
}

// OpenRouter scheduling client (disabled - OpenRouter not configured)
async function generateScheduleWithAI(context: ScheduleRequest): Promise<any> {
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;

  if (!openRouterApiKey) {
    throw new Error('OpenRouter API key not configured - AI scheduling features are disabled');
  }

  // Create a detailed prompt for scheduling
  const schedulingPrompt = `You are an expert AI scheduler for the BeQ life management system. Generate an optimal schedule based on the following information:

**User Preferences:**
- Timezone: ${context.user_preferences.timezone}
- Work hours: ${context.user_preferences.work_start_time} - ${context.user_preferences.work_end_time}
- Break frequency: Every ${context.user_preferences.break_frequency_minutes} minutes
- Break duration: ${context.user_preferences.break_duration_minutes} minutes
- Lunch time: ${context.user_preferences.lunch_time} for ${context.user_preferences.lunch_duration_minutes} minutes
- Energy peak hours: ${context.user_preferences.energy_peak_hours.join(', ')}
- Avoid scheduling after: ${context.user_preferences.avoid_scheduling_after}

**Tasks to Schedule:**
${context.tasks.map(task => `
- ID: ${task.id}
- Title: ${task.title}
- Description: ${task.description || 'N/A'}
- Category: ${task.category}
- Priority: ${task.priority}
- Duration: ${task.estimated_duration_minutes} minutes
- Deadline: ${task.deadline || 'None'}
- Preferred time: ${task.preferred_time || 'Any'}
- Dependencies: ${task.dependencies.length > 0 ? task.dependencies.join(', ') : 'None'}
`).join('')}

**Existing Events:**
${context.existing_events.map(event => `
- ${event.title}: ${event.start_time} - ${event.end_time} (${event.is_moveable ? 'moveable' : 'fixed'})
`).join('') || 'No existing events'}

**Constraints:**
${context.constraints.map(constraint => `
- ${constraint.type}: ${constraint.description} (${constraint.is_hard_constraint ? 'hard' : 'soft'} constraint)
`).join('') || 'No additional constraints'}

**Planning horizon:** ${context.planning_horizon_days} days from now

Please generate an optimal schedule and respond with a JSON object containing:
{
  "scheduled_events": [
    {
      "task_id": "string",
      "title": "string", 
      "start_time": "YYYY-MM-DDTHH:mm:ss.000Z",
      "end_time": "YYYY-MM-DDTHH:mm:ss.000Z",
      "category": "string",
      "priority": "string"
    }
  ],
  "reasoning": "Detailed explanation of scheduling decisions",
  "confidence_score": 0.85,
  "alternative_suggestions": ["suggestion1", "suggestion2"],
  "warnings": ["warning1", "warning2"]
}

Focus on:
1. Respecting user preferences and energy patterns
2. Prioritizing high-priority and deadline-sensitive tasks
3. Avoiding conflicts with existing events
4. Maintaining work-life balance
5. Including appropriate breaks
6. Considering task dependencies

Respond ONLY with valid JSON, no additional text.`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterApiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.VERCEL_URL || 'https://beq.app',
      'X-Title': 'BeQ - AI Scheduling'
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert AI scheduler. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: schedulingPrompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent scheduling
      max_tokens: 2000,
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
      scheduled_events: [],
      reasoning: "AI response could not be parsed. Please try again with simpler requirements.",
      confidence_score: 0.0,
      alternative_suggestions: ["Try reducing the number of tasks", "Simplify constraints"],
      warnings: ["AI scheduling temporarily unavailable"]
    };
  }
}

// Default user preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  timezone: 'UTC',
  work_start_time: '09:00',
  work_end_time: '17:00',
  break_frequency_minutes: 90,
  break_duration_minutes: 15,
  lunch_time: '12:00',
  lunch_duration_minutes: 60,
  preferred_task_duration_minutes: 90,
  energy_peak_hours: ['09:00-11:00', '14:00-16:00'],
  avoid_scheduling_after: '18:00'
};

// POST handler
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request body
    const body: ScheduleRequest = await request.json();

    // Basic validation
    if (!body.user_id || !body.tasks || !Array.isArray(body.tasks)) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id and tasks array' },
        { status: 400 }
      );
    }

    if (body.tasks.length === 0) {
      return NextResponse.json(
        { error: 'No tasks to schedule' },
        { status: 400 }
      );
    }

    // Apply defaults
    const requestWithDefaults: ScheduleRequest = {
      ...body,
      existing_events: body.existing_events || [],
      user_preferences: { ...DEFAULT_PREFERENCES, ...body.user_preferences },
      constraints: body.constraints || [],
      planning_horizon_days: body.planning_horizon_days || 7
    };

    console.log(`Generating schedule for user ${body.user_id} with ${body.tasks.length} tasks`);

    // Generate schedule using AI
    const aiResult = await generateScheduleWithAI(requestWithDefaults);

    // Calculate processing time
    const processingTime = (Date.now() - startTime) / 1000;

    // Identify unscheduled tasks
    const scheduledTaskIds = new Set(
      aiResult.scheduled_events?.map((event: any) => event.task_id) || []
    );

    const unscheduled_tasks = body.tasks
      .filter(task => !scheduledTaskIds.has(task.id))
      .map(task => task.id);

    // Store schedule in Supabase (optional)
    try {
      const supabase = createServerComponentClient({ cookies });
      
      await supabase
        .from('schedules')
        .insert({
          user_id: body.user_id,
          schedule_data: aiResult.scheduled_events,
          reasoning: aiResult.reasoning,
          confidence_score: aiResult.confidence_score,
          processing_time_seconds: processingTime,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to store schedule:', error);
      // Continue without storing - not critical
    }

    const response: ScheduleResponse = {
      success: true,
      scheduled_events: aiResult.scheduled_events || [],
      reasoning: aiResult.reasoning || 'Schedule generated successfully',
      confidence_score: aiResult.confidence_score || 0.8,
      alternative_suggestions: aiResult.alternative_suggestions || [],
      warnings: aiResult.warnings || [],
      unscheduled_tasks,
      processing_time_seconds: processingTime
    };

    console.log(`Schedule generated for user ${body.user_id}: ${aiResult.scheduled_events?.length || 0} events, ${unscheduled_tasks.length} unscheduled`);

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    const processingTime = (Date.now() - startTime) / 1000;
    
    console.error('Schedule generation failed:', error);

    return NextResponse.json(
      {
        success: false,
        scheduled_events: [],
        reasoning: 'Schedule generation failed due to an error',
        confidence_score: 0.0,
        alternative_suggestions: ['Try again with fewer tasks', 'Simplify scheduling constraints'],
        warnings: ['Scheduling service temporarily unavailable'],
        unscheduled_tasks: [],
        processing_time_seconds: processingTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
