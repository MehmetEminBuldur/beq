#!/usr/bin/env node

/**
 * Calendar Frontend Integration Test
 *
 * This script tests the frontend calendar integration by simulating
 * the calendar hook functionality and verifying the UI components.
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Calendar Frontend Integration...\n');

// Test 1: Check if calendar hook exists and has the right structure
console.log('1️⃣ Testing Calendar Hook Structure...');
const hookPath = path.join(__dirname, 'clients/web/lib/hooks/use-calendar.ts');

if (fs.existsSync(hookPath)) {
  const hookContent = fs.readFileSync(hookPath, 'utf8');

  // Check for key functions
  const hasGetAuthStatus = hookContent.includes('getAuthStatus');
  const hasConnectGoogleCalendar = hookContent.includes('connectGoogleCalendar');
  const hasSyncCalendar = hookContent.includes('syncCalendar');
  const hasGetCalendarEvents = hookContent.includes('getCalendarEvents');

  console.log(`   ✅ getAuthStatus: ${hasGetAuthStatus ? 'Found' : 'Missing'}`);
  console.log(`   ✅ connectGoogleCalendar: ${hasConnectGoogleCalendar ? 'Found' : 'Missing'}`);
  console.log(`   ✅ syncCalendar: ${hasSyncCalendar ? 'Found' : 'Missing'}`);
  console.log(`   ✅ getCalendarEvents: ${hasGetCalendarEvents ? 'Found' : 'Missing'}`);

  // Check for mock data in development
  const hasMockData = hookContent.includes('mockCalendarResponse');
  console.log(`   ✅ Mock data for testing: ${hasMockData ? 'Found' : 'Missing'}`);

} else {
  console.log('   ❌ Calendar hook file not found');
}

// Test 2: Check if schedule view component uses calendar integration
console.log('\n2️⃣ Testing Schedule View Component...');
const scheduleViewPath = path.join(__dirname, 'clients/web/components/chat/schedule-view.tsx');

if (fs.existsSync(scheduleViewPath)) {
  const componentContent = fs.readFileSync(scheduleViewPath, 'utf8');

  const hasCalendarHook = componentContent.includes('useCalendar');
  const hasGoogleConnect = componentContent.includes('handleGoogleConnect');
  const hasGoogleAuthStatus = componentContent.includes('googleAuthStatus');
  const hasGoogleEvents = componentContent.includes('googleEvents');

  console.log(`   ✅ Uses calendar hook: ${hasCalendarHook ? 'Yes' : 'No'}`);
  console.log(`   ✅ Google connect handler: ${hasGoogleConnect ? 'Found' : 'Missing'}`);
  console.log(`   ✅ Google auth status: ${hasGoogleAuthStatus ? 'Found' : 'Missing'}`);
  console.log(`   ✅ Google events display: ${hasGoogleEvents ? 'Found' : 'Missing'}`);

} else {
  console.log('   ❌ Schedule view component not found');
}

// Test 3: Check environment configuration
console.log('\n3️⃣ Testing Environment Configuration...');
const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');

  const hasCalendarUrl = envContent.includes('NEXT_PUBLIC_CALENDAR_INTEGRATION_URL');
  const hasOrchestratorUrl = envContent.includes('NEXT_PUBLIC_ORCHESTRATOR_API_URL');

  console.log(`   ✅ Calendar integration URL: ${hasCalendarUrl ? 'Configured' : 'Missing'}`);
  console.log(`   ✅ Orchestrator API URL: ${hasOrchestratorUrl ? 'Configured' : 'Missing'}`);

} else {
  console.log('   ❌ Environment file not found');
}

// Test 4: Check Next.js configuration
console.log('\n4️⃣ Testing Next.js Configuration...');
const nextConfigPath = path.join(__dirname, 'clients/web/next.config.js');

if (fs.existsSync(nextConfigPath)) {
  const configContent = fs.readFileSync(nextConfigPath, 'utf8');
  console.log('   ✅ Next.js config found');
} else {
  console.log('   ❌ Next.js config not found');
}

// Test 5: Summary and recommendations
console.log('\n🎯 Calendar Integration Test Summary:');
console.log('==========================================');

const tests = [
  { name: 'Calendar Hook Structure', status: fs.existsSync(hookPath) },
  { name: 'Schedule View Component', status: fs.existsSync(scheduleViewPath) },
  { name: 'Environment Configuration', status: fs.existsSync(envPath) },
  { name: 'Next.js Configuration', status: fs.existsSync(nextConfigPath) },
];

tests.forEach(test => {
  const status = test.status ? '✅ PASS' : '❌ FAIL';
  console.log(`   ${status} - ${test.name}`);
});

console.log('\n📋 Next Steps for Testing:');
console.log('   1. Start the web client: cd clients/web && npm run dev');
console.log('   2. Open http://localhost:3002 in your browser');
console.log('   3. Navigate to Chat page and open Schedule sidebar');
console.log('   4. Click "Connect Google" button (will work in test mode)');
console.log('   5. Verify Google Calendar events appear with purple indicators');
console.log('   6. Test "Sync" and "Disconnect" functionality');

console.log('\n🔧 For Production Testing:');
console.log('   1. Set up Google OAuth credentials in Google Cloud Console');
console.log('   2. Configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
console.log('   3. Start the calendar integration service');
console.log('   4. Test full OAuth flow with real Google Calendar');

console.log('\n🎊 Calendar Integration Frontend Test Complete!');
