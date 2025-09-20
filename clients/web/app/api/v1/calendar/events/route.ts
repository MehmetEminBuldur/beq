/**
 * Calendar integration endpoint for external calendar services
 * Vercel serverless function replacement for calendar integration service
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Types
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  attendees?: string[];
  calendar_source: 'google' | 'microsoft' | 'apple' | 'beq';
  external_id?: string;
  is_all_day: boolean;
  is_recurring: boolean;
  recurrence_rule?: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

interface CalendarSync {
  user_id: string;
  calendar_provider: 'google' | 'microsoft' | 'apple';
  access_token?: string;
  refresh_token?: string;
  calendar_ids: string[];
  sync_enabled: boolean;
  last_sync_at?: string;
}

interface SyncRequest {
  user_id: string;
  calendar_provider: 'google' | 'microsoft' | 'apple';
  calendar_ids?: string[];
  start_date?: string;
  end_date?: string;
}

interface SyncResponse {
  success: boolean;
  events_synced: number;
  events_updated: number;
  events_created: number;
  events_removed: number;
  last_sync_time: string;
  next_sync_time?: string;
  errors: string[];
  warnings: string[];
}

// Mock calendar data for demonstration
const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: crypto.randomUUID(),
    title: "Team Stand-up",
    description: "Daily team synchronization meeting",
    start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T09:00:00.000Z',
    end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T09:30:00.000Z',
    location: "Conference Room A",
    attendees: ["team@company.com"],
    calendar_source: "google",
    external_id: "google_event_123",
    is_all_day: false,
    is_recurring: true,
    recurrence_rule: "FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR",
    timezone: "UTC",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: crypto.randomUUID(),
    title: "Project Planning Session",
    description: "Q4 project planning and roadmap review",
    start_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T14:00:00.000Z',
    end_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T16:00:00.000Z',
    location: "Virtual Meeting",
    attendees: ["pm@company.com", "dev@company.com"],
    calendar_source: "microsoft",
    external_id: "outlook_event_456",
    is_all_day: false,
    is_recurring: false,
    timezone: "UTC",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Google Calendar integration (mock implementation)
async function syncGoogleCalendar(userId: string, _accessToken?: string): Promise<CalendarEvent[]> {
  // In a real implementation, this would:
  // 1. Use the Google Calendar API
  // 2. Authenticate with the provided access token
  // 3. Fetch events from the user's calendars
  // 4. Transform the response to our CalendarEvent format
  
  console.log(`Mock: Syncing Google Calendar for user ${userId}`);
  
  // Return mock Google events
  return MOCK_CALENDAR_EVENTS.filter(event => event.calendar_source === 'google');
}

// Microsoft Calendar integration (mock implementation)
async function syncMicrosoftCalendar(userId: string, _accessToken?: string): Promise<CalendarEvent[]> {
  // In a real implementation, this would:
  // 1. Use the Microsoft Graph API
  // 2. Authenticate with the provided access token
  // 3. Fetch events from the user's Outlook calendars
  // 4. Transform the response to our CalendarEvent format
  
  console.log(`Mock: Syncing Microsoft Calendar for user ${userId}`);
  
  // Return mock Microsoft events
  return MOCK_CALENDAR_EVENTS.filter(event => event.calendar_source === 'microsoft');
}

// Apple Calendar integration (mock implementation)
async function syncAppleCalendar(userId: string): Promise<CalendarEvent[]> {
  // In a real implementation, this would:
  // 1. Use CalDAV protocol or Apple's EventKit
  // 2. Handle Apple's authentication
  // 3. Fetch events from iCloud calendars
  // 4. Transform the response to our CalendarEvent format
  
  console.log(`Mock: Syncing Apple Calendar for user ${userId}`);
  
  // Return empty for now as Apple integration is more complex
  return [];
}

// POST handler for calendar sync
export async function POST(request: NextRequest) {
  try {
    const body: SyncRequest = await request.json();

    // Basic validation
    if (!body.user_id || !body.calendar_provider) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id and calendar_provider' },
        { status: 400 }
      );
    }

    const supportedProviders = ['google', 'microsoft', 'apple'];
    if (!supportedProviders.includes(body.calendar_provider)) {
      return NextResponse.json(
        { error: `Unsupported calendar provider. Supported: ${supportedProviders.join(', ')}` },
        { status: 400 }
      );
    }

    console.log(`Starting calendar sync for user ${body.user_id} with ${body.calendar_provider}`);

    // Initialize Supabase client
    const supabase = createServerComponentClient({ cookies });

    // Get existing calendar sync configuration
    let syncConfig: CalendarSync | null = null;
    try {
      const { data } = await supabase
        .from('calendar_syncs')
        .select('*')
        .eq('user_id', body.user_id)
        .eq('calendar_provider', body.calendar_provider)
        .single();
      syncConfig = data;
    } catch (error) {
      console.log('No existing sync config found, will create new one');
    }

    // Sync events based on provider
    let syncedEvents: CalendarEvent[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      switch (body.calendar_provider) {
        case 'google':
          syncedEvents = await syncGoogleCalendar(body.user_id, syncConfig?.access_token);
          break;
        case 'microsoft':
          syncedEvents = await syncMicrosoftCalendar(body.user_id, syncConfig?.access_token);
          break;
        case 'apple':
          syncedEvents = await syncAppleCalendar(body.user_id);
          break;
        default:
          throw new Error(`Provider ${body.calendar_provider} not implemented`);
      }
    } catch (error) {
      errors.push(`Failed to sync ${body.calendar_provider} calendar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Store synced events in Supabase
    let eventsCreated = 0;
    let eventsUpdated = 0;

    for (const event of syncedEvents) {
      try {
        const { data, error } = await supabase
          .from('calendar_events')
          .upsert({
            id: event.id,
            user_id: body.user_id,
            title: event.title,
            description: event.description,
            start_time: event.start_time,
            end_time: event.end_time,
            location: event.location,
            attendees: event.attendees,
            calendar_source: event.calendar_source,
            external_id: event.external_id,
            is_all_day: event.is_all_day,
            is_recurring: event.is_recurring,
            recurrence_rule: event.recurrence_rule,
            timezone: event.timezone,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'external_id,user_id',
            ignoreDuplicates: false
          });

        if (error) {
          console.error('Failed to store event:', error);
          errors.push(`Failed to store event "${event.title}"`);
        } else {
          eventsCreated++;
        }
      } catch (error) {
        console.error('Error storing event:', error);
        errors.push(`Error storing event "${event.title}"`);
      }
    }

    // Update sync configuration
    const lastSyncTime = new Date().toISOString();
    const nextSyncTime = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // Next sync in 1 hour

    if (syncConfig) {
      await supabase
        .from('calendar_syncs')
        .update({
          last_sync_at: lastSyncTime,
          sync_enabled: true,
          updated_at: lastSyncTime
        })
        .eq('user_id', body.user_id)
        .eq('calendar_provider', body.calendar_provider);
    } else {
      await supabase
        .from('calendar_syncs')
        .insert({
          user_id: body.user_id,
          calendar_provider: body.calendar_provider,
          calendar_ids: body.calendar_ids || [],
          sync_enabled: true,
          last_sync_at: lastSyncTime,
          created_at: lastSyncTime,
          updated_at: lastSyncTime
        });
    }

    // Add helpful warnings
    if (syncedEvents.length === 0) {
      warnings.push('No events were found to sync. Check your calendar permissions.');
    }

    if (body.calendar_provider === 'apple') {
      warnings.push('Apple Calendar integration is limited. Consider using Google or Microsoft Calendar for better sync.');
    }

    const response: SyncResponse = {
      success: errors.length === 0,
      events_synced: syncedEvents.length,
      events_updated: eventsUpdated,
      events_created: eventsCreated,
      events_removed: 0, // TODO: Implement removal detection
      last_sync_time: lastSyncTime,
      next_sync_time: nextSyncTime,
      errors,
      warnings
    };

    console.log(`Calendar sync completed for user ${body.user_id}: ${eventsCreated} events created, ${errors.length} errors`);

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Calendar sync failed:', error);

    return NextResponse.json(
      {
        success: false,
        events_synced: 0,
        events_updated: 0,
        events_created: 0,
        events_removed: 0,
        last_sync_time: new Date().toISOString(),
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: []
      },
      { status: 500 }
    );
  }
}

// GET handler for fetching calendar events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const calendarProvider = searchParams.get('calendar_provider');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: user_id' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createServerComponentClient({ cookies });

    // Build query
    let query = supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId);

    if (startDate) {
      query = query.gte('start_time', startDate);
    }

    if (endDate) {
      query = query.lte('end_time', endDate);
    }

    if (calendarProvider) {
      query = query.eq('calendar_source', calendarProvider);
    }

    // Execute query
    const { data: events, error } = await query.order('start_time', { ascending: true });

    if (error) {
      console.error('Failed to fetch calendar events:', error);
      return NextResponse.json(
        { error: 'Failed to fetch calendar events' },
        { status: 500 }
      );
    }

    // If no events in database, return mock events for demonstration
    const eventsToReturn = events && events.length > 0 ? events : MOCK_CALENDAR_EVENTS;

    return NextResponse.json({
      success: true,
      events: eventsToReturn,
      total_count: eventsToReturn.length,
      filters: {
        user_id: userId,
        start_date: startDate,
        end_date: endDate,
        calendar_provider: calendarProvider
      },
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch calendar events:', error);

    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}
