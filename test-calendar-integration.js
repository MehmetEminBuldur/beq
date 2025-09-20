#!/usr/bin/env node

/**
 * Calendar Integration Test Script
 *
 * This script tests the Google Calendar integration functionality
 * by simulating the OAuth flow and API calls.
 */

const http = require('http');
const url = require('url');

// Mock Google OAuth server for testing
const MOCK_GOOGLE_OAUTH_SERVER = 'http://localhost:8004';

// Test data
const mockGoogleTokens = {
  access_token: 'mock_access_token_123',
  refresh_token: 'mock_refresh_token_456',
  token_type: 'Bearer',
  expires_in: 3600,
  expires_at: new Date(Date.now() + 3600000).toISOString(),
  scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events'
};

const mockCalendarEvents = [
  {
    id: 'google_event_1',
    title: 'Team Meeting',
    description: 'Weekly team sync',
    start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    location: 'Conference Room A',
    attendees: ['user1@example.com', 'user2@example.com'],
    is_all_day: false,
    status: 'confirmed'
  },
  {
    id: 'google_event_2',
    title: 'Project Review',
    description: 'Review project progress',
    start_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
    location: 'Virtual',
    attendees: ['manager@example.com'],
    is_all_day: false,
    status: 'confirmed'
  }
];

const mockUserProfile = {
  id: 'google_user_123',
  name: 'Test User',
  email: 'test@example.com',
  picture: 'https://example.com/avatar.jpg'
};

// Mock Google OAuth server
function createMockOAuthServer() {
  const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    console.log(`📡 Mock OAuth Server: ${req.method} ${pathname}`);

    // Mock OAuth authorization endpoint
    if (pathname === '/o/oauth2/auth' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>Mock Google OAuth</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>🔐 Mock Google OAuth</h1>
          <p>Testing Calendar Integration</p>
          <div style="background: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📅 Google Calendar Access</h3>
            <p><strong>App:</strong> BeQ Calendar Integration</p>
            <p><strong>Permissions:</strong></p>
            <ul>
              <li>✅ Read your calendar events</li>
              <li>✅ Create and modify calendar events</li>
            </ul>
          </div>
          <form method="POST" action="/oauth2callback">
            <input type="hidden" name="code" value="mock_auth_code_123" />
            <input type="hidden" name="state" value="${parsedUrl.query.state || 'test_state'}" />
            <button type="submit" style="background: #4285f4; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer;">
              ✅ Allow Access
            </button>
          </form>
        </body>
        </html>
      `);
      return;
    }

    // Mock OAuth token exchange
    if (pathname === '/token' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        console.log('🔄 Token exchange request received');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(mockGoogleTokens));
      });
      return;
    }

    // Mock OAuth callback
    if (pathname === '/oauth2callback' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        const params = new URLSearchParams(body);
        const code = params.get('code');
        const state = params.get('state');

        console.log(`🎯 OAuth callback: code=${code}, state=${state}`);

        // Redirect back to the application
        res.writeHead(302, {
          'Location': `http://localhost:3002/auth/callback?code=${code}&state=${state}`
        });
        res.end();
      });
      return;
    }

    // Mock Google Calendar API
    if (pathname.startsWith('/calendar/v3/')) {
      const calendarPath = pathname.replace('/calendar/v3/', '');

      if (calendarPath === 'calendars/primary/events' && req.method === 'GET') {
        console.log('📅 Fetching calendar events');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          items: mockCalendarEvents.map(event => ({
            id: event.id,
            summary: event.title,
            description: event.description,
            start: {
              dateTime: event.start_time
            },
            end: {
              dateTime: event.end_time
            },
            location: event.location,
            attendees: event.attendees?.map(email => ({ email })),
            status: event.status
          }))
        }));
        return;
      }

      if (calendarPath === 'calendars/primary/events' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          const eventData = JSON.parse(body);
          console.log('➕ Creating calendar event:', eventData.summary);

          const newEvent = {
            id: `google_event_${Date.now()}`,
            summary: eventData.summary,
            description: eventData.description,
            start: eventData.start,
            end: eventData.end,
            location: eventData.location,
            status: 'confirmed'
          };

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(newEvent));
        });
        return;
      }
    }

    // Mock People API for user profile
    if (pathname === '/v1/people/me' && req.method === 'GET') {
      console.log('👤 Fetching user profile');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        resourceName: `people/${mockUserProfile.id}`,
        names: [{ displayName: mockUserProfile.name }],
        emailAddresses: [{ value: mockUserProfile.email }],
        photos: [{ url: mockUserProfile.picture }]
      }));
      return;
    }

    // Default 404
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Mock Google API endpoint not found');
  });

  server.listen(8004, () => {
    console.log('🚀 Mock Google OAuth Server running on http://localhost:8004');
  });

  return server;
}

// Test functions
async function testCalendarIntegration() {
  console.log('🧪 Testing Calendar Integration...\n');

  // Test 1: Check service health
  console.log('1️⃣ Testing service health...');
  try {
    const response = await fetch('http://localhost:8003/health');
    if (response.ok) {
      const health = await response.json();
      console.log('✅ Service is healthy:', health);
    } else {
      console.log('❌ Service health check failed');
    }
  } catch (error) {
    console.log('❌ Cannot connect to calendar service:', error.message);
  }

  // Test 2: Test OAuth endpoints
  console.log('\n2️⃣ Testing OAuth endpoints...');
  try {
    const oauthResponse = await fetch('http://localhost:8003/api/v1/auth/providers');
    if (oauthResponse.ok) {
      const providers = await oauthResponse.json();
      console.log('✅ OAuth providers:', providers);
    } else {
      console.log('❌ OAuth providers check failed');
    }
  } catch (error) {
    console.log('❌ OAuth test failed:', error.message);
  }

  // Test 3: Test calendar endpoints (will fail without auth, but should return proper error)
  console.log('\n3️⃣ Testing calendar endpoints...');
  try {
    const calendarResponse = await fetch('http://localhost:8003/api/v1/calendar/calendars/test-user');
    console.log('ℹ️ Calendar endpoint response:', calendarResponse.status);
    if (calendarResponse.status === 401) {
      console.log('✅ Authentication properly required');
    }
  } catch (error) {
    console.log('ℹ️ Calendar endpoint test:', error.message);
  }

  console.log('\n🎯 Calendar Integration Test Complete!');
  console.log('📋 Next steps:');
  console.log('   1. Start the calendar integration service');
  console.log('   2. Start the web client');
  console.log('   3. Test OAuth flow in the browser');
  console.log('   4. Verify calendar events appear in chat');
}

// Main execution
if (require.main === module) {
  console.log('🎪 Calendar Integration Test Suite\n');

  // Start mock OAuth server
  const mockServer = createMockOAuthServer();

  // Run tests
  testCalendarIntegration().then(() => {
    console.log('\n⏹️ Test completed. Mock server still running on port 8004.');
    console.log('Press Ctrl+C to stop the mock server.');
  }).catch(console.error);

  // Cleanup on exit
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping mock server...');
    mockServer.close(() => {
      console.log('✅ Mock server stopped');
      process.exit(0);
    });
  });
}

module.exports = { createMockOAuthServer, mockGoogleTokens, mockCalendarEvents, mockUserProfile };
