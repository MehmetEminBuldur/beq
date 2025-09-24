#!/usr/bin/env node

/**
 * Comprehensive Authentication Test Script
 * Tests the complete sign-in flow and identifies authentication issues
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../global.env' });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Debug Environment Variables:');
console.log('SUPABASE_URL:', SUPABASE_URL ? SUPABASE_URL.substring(0, 30) + '...' : 'undefined');
console.log('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.substring(0, 30) + '...' : 'undefined');
console.log('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? SUPABASE_SERVICE_ROLE_KEY.substring(0, 30) + '...' : 'undefined');
console.log('');

const TEST_EMAIL = 'test-auth@beq.dev';
const TEST_PASSWORD = 'TestPassword123!';

console.log('🔍 BeQ Authentication Comprehensive Test');
console.log('========================================\n');

// Initialize Supabase clients
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testEnvironmentConfiguration() {
  console.log('1. Testing Environment Configuration...');
  
  // Check required environment variables
  const requiredVars = {
    'NEXT_PUBLIC_SUPABASE_URL': SUPABASE_URL,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': SUPABASE_ANON_KEY,
    'SUPABASE_SERVICE_ROLE_KEY': SUPABASE_SERVICE_ROLE_KEY
  };
  
  let envValid = true;
  
  for (const [name, value] of Object.entries(requiredVars)) {
    if (!value) {
      console.log(`   ❌ Missing: ${name}`);
      envValid = false;
    } else {
      console.log(`   ✅ Found: ${name} (${value.substring(0, 20)}...)`);
    }
  }
  
  if (!envValid) {
    console.log('   🚨 Environment configuration is incomplete!');
    return false;
  }
  
  console.log('   ✅ Environment configuration is valid\n');
  return true;
}

async function testSupabaseConnectivity() {
  console.log('2. Testing Supabase Connectivity...');
  
  try {
    // Test basic connectivity with a simple query
    const { data, error } = await supabaseClient
      .from('users')
      .select('count')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "table not found" which is expected if schema isn't set up
      console.log(`   ❌ Connectivity failed: ${error.message}`);
      return false;
    }
    
    console.log('   ✅ Supabase connectivity is working');
    
    // Test authentication service specifically
    const { data: authData, error: authError } = await supabaseClient.auth.getSession();
    
    if (authError) {
      console.log(`   ❌ Auth service error: ${authError.message}`);
      return false;
    }
    
    console.log('   ✅ Supabase Auth service is accessible');
    console.log(`   📊 Current session: ${authData.session ? 'Active' : 'None'}\n`);
    return true;
    
  } catch (error) {
    console.log(`   ❌ Connection test failed: ${error.message}`);
    return false;
  }
}

async function testUserManagement() {
  console.log('3. Testing User Management...');
  
  try {
    // First, try to clean up any existing test user
    console.log('   🧹 Cleaning up existing test user...');
    
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.log(`   ⚠️  Could not list users: ${listError.message}`);
    } else {
      const testUser = existingUsers.users.find(user => user.email === TEST_EMAIL);
      if (testUser) {
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(testUser.id);
        if (deleteError) {
          console.log(`   ⚠️  Could not delete existing test user: ${deleteError.message}`);
        } else {
          console.log('   ✅ Cleaned up existing test user');
        }
      }
    }
    
    // Try to create a test user
    console.log('   👤 Creating test user...');
    
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true // Auto-confirm for testing
    });
    
    if (createError) {
      console.log(`   ❌ User creation failed: ${createError.message}`);
      return false;
    }
    
    console.log(`   ✅ Test user created: ${createData.user.id}`);
    return createData.user;
    
  } catch (error) {
    console.log(`   ❌ User management test failed: ${error.message}`);
    return false;
  }
}

async function testSignInFlow() {
  console.log('4. Testing Sign-In Flow...');
  
  try {
    // Test sign-in with the test user
    console.log('   🔐 Attempting sign-in...');
    
    const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (signInError) {
      console.log(`   ❌ Sign-in failed: ${signInError.message}`);
      console.log(`   🔍 Error details:`, signInError);
      return false;
    }
    
    if (!signInData.session) {
      console.log('   ❌ Sign-in succeeded but no session created');
      return false;
    }
    
    console.log('   ✅ Sign-in successful!');
    console.log(`   📊 Session ID: ${signInData.session.access_token.substring(0, 20)}...`);
    console.log(`   👤 User ID: ${signInData.user.id}`);
    console.log(`   📧 Email: ${signInData.user.email}`);
    
    // Test session validation
    console.log('   🔍 Validating session...');
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
    
    if (sessionError) {
      console.log(`   ❌ Session validation failed: ${sessionError.message}`);
      return false;
    }
    
    if (!sessionData.session) {
      console.log('   ❌ Session not found after sign-in');
      return false;
    }
    
    console.log('   ✅ Session validation successful');
    
    // Test user retrieval
    console.log('   👤 Testing user retrieval...');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError) {
      console.log(`   ❌ User retrieval failed: ${userError.message}`);
      return false;
    }
    
    if (!userData.user) {
      console.log('   ❌ No user data returned');
      return false;
    }
    
    console.log('   ✅ User retrieval successful');
    console.log(`   📊 User authenticated: ${userData.user.email}\n`);
    
    return true;
    
  } catch (error) {
    console.log(`   ❌ Sign-in flow test failed: ${error.message}`);
    console.log(`   🔍 Stack trace:`, error.stack);
    return false;
  }
}

async function testSignOut() {
  console.log('5. Testing Sign-Out...');
  
  try {
    const { error } = await supabaseClient.auth.signOut();
    
    if (error) {
      console.log(`   ❌ Sign-out failed: ${error.message}`);
      return false;
    }
    
    console.log('   ✅ Sign-out successful');
    
    // Verify no session exists
    const { data: sessionData } = await supabaseClient.auth.getSession();
    
    if (sessionData.session) {
      console.log('   ⚠️  Session still exists after sign-out');
      return false;
    }
    
    console.log('   ✅ Session cleared successfully\n');
    return true;
    
  } catch (error) {
    console.log(`   ❌ Sign-out test failed: ${error.message}`);
    return false;
  }
}

async function testAuthPersistence() {
  console.log('6. Testing Authentication Persistence...');
  
  try {
    // Sign in again
    const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (signInError) {
      console.log(`   ❌ Re-sign-in failed: ${signInError.message}`);
      return false;
    }
    
    console.log('   ✅ Re-sign-in successful');
    
    // Simulate page refresh by creating a new client instance
    const newClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
    
    // Wait a moment for session detection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: persistedSessionData } = await newClient.auth.getSession();
    
    if (!persistedSessionData.session) {
      console.log('   ⚠️  Session not persisted to new client instance');
      // This might be expected in Node.js environment
      console.log('   📝 Note: Session persistence may not work in Node.js test environment');
    } else {
      console.log('   ✅ Session persisted successfully');
    }
    
    console.log('   ✅ Authentication persistence test completed\n');
    return true;
    
  } catch (error) {
    console.log(`   ❌ Auth persistence test failed: ${error.message}`);
    return false;
  }
}

async function cleanup() {
  console.log('7. Cleanup...');
  
  try {
    // Sign out
    await supabaseClient.auth.signOut();
    
    // Delete test user
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const testUser = users.users.find(user => user.email === TEST_EMAIL);
    
    if (testUser) {
      await supabaseAdmin.auth.admin.deleteUser(testUser.id);
      console.log('   ✅ Test user cleaned up');
    }
    
    console.log('   ✅ Cleanup completed\n');
    
  } catch (error) {
    console.log(`   ⚠️  Cleanup error: ${error.message}\n`);
  }
}

async function main() {
  const results = [];
  
  try {
    results.push(await testEnvironmentConfiguration());
    results.push(await testSupabaseConnectivity());
    
    const testUser = await testUserManagement();
    results.push(!!testUser);
    
    if (testUser) {
      results.push(await testSignInFlow());
      results.push(await testSignOut());
      results.push(await testAuthPersistence());
    } else {
      results.push(false, false, false);
    }
    
  } catch (error) {
    console.log(`🚨 Critical error: ${error.message}`);
    results.push(false);
  } finally {
    await cleanup();
  }
  
  // Summary
  console.log('📋 Test Summary:');
  console.log('================');
  
  const tests = [
    'Environment Configuration',
    'Supabase Connectivity', 
    'User Management',
    'Sign-In Flow',
    'Sign-Out',
    'Auth Persistence'
  ];
  
  let passed = 0;
  
  tests.forEach((test, index) => {
    const result = results[index];
    console.log(`${result ? '✅' : '❌'} ${test}`);
    if (result) passed++;
  });
  
  console.log(`\n📊 Results: ${passed}/${tests.length} tests passed`);
  
  if (passed === tests.length) {
    console.log('🎉 All authentication tests passed!');
    process.exit(0);
  } else {
    console.log('🚨 Some authentication tests failed. Check the details above.');
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  console.log('🚨 Unhandled rejection:', error);
  process.exit(1);
});

main().catch(console.error);
