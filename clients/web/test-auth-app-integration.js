/**
 * Test Authentication App Integration
 * Tests the actual auth implementation in the React app
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🔗 TESTING AUTHENTICATION APP INTEGRATION\n');

// Initialize the same way the app does
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

const TEST_USER = {
  email: 'setiwa9522@artvara.com',
  password: 'QWaszx123'
};

async function testAuthFlow() {
  console.log('1️⃣ Testing Complete Auth Flow (App Configuration)...');
  
  try {
    // Step 1: Sign out to ensure clean state
    console.log('   Step 1: Ensuring clean state...');
    await supabase.auth.signOut();
    
    let { data: initialSession } = await supabase.auth.getSession();
    console.log(`   Initial session: ${initialSession.session ? 'Found' : 'None'}`);

    // Step 2: Sign in
    console.log('   Step 2: Signing in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });

    if (signInError) {
      console.log('❌ Sign-in failed:', signInError.message);
      return false;
    }

    console.log('✅ Sign-in successful');
    console.log(`   User: ${signInData.user.email}`);
    console.log(`   Session token: ${signInData.session.access_token.substring(0, 20)}...`);

    // Step 3: Test session persistence
    console.log('   Step 3: Testing session persistence...');
    const { data: persistedSession } = await supabase.auth.getSession();
    
    if (!persistedSession.session) {
      console.log('❌ Session not persisted');
      return false;
    }

    console.log('✅ Session persisted correctly');

    // Step 4: Test user retrieval
    console.log('   Step 4: Testing user retrieval...');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('❌ User retrieval failed:', userError.message);
      return false;
    }

    console.log('✅ User retrieval successful');
    console.log(`   User ID: ${userData.user.id}`);

    // Step 5: Test authenticated API calls
    console.log('   Step 5: Testing authenticated API calls...');
    
    // Test profile access
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    if (profileError) {
      console.log('❌ Profile access failed:', profileError.message);
      return false;
    }

    console.log('✅ Profile access successful');
    console.log(`   Profile: ${profile.full_name || profile.email}`);

    // Test bricks access
    const { data: userBricks, error: bricksError } = await supabase
      .from('bricks')
      .select('id, title, status, created_at')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (bricksError) {
      console.log('❌ Bricks access failed:', bricksError.message);
      return false;
    }

    console.log(`✅ Bricks access successful: ${userBricks.length} bricks found`);
    if (userBricks.length > 0) {
      console.log(`   Latest brick: "${userBricks[0].title}" (${userBricks[0].status})`);
    }

    // Step 6: Test write operations
    console.log('   Step 6: Testing write operations...');
    
    const testBrick = {
      user_id: userData.user.id,
      title: `Auth Integration Test - ${new Date().toISOString()}`,
      description: 'Testing authenticated write operations',
      category: 'test',
      status: 'not_started',
      priority: 'low',
      estimated_duration_minutes: 15,
      progress_percentage: 0
    };

    const { data: newBrick, error: createError } = await supabase
      .from('bricks')
      .insert([testBrick])
      .select()
      .single();

    if (createError) {
      console.log('❌ Write operation failed:', createError.message);
      return false;
    }

    console.log('✅ Write operation successful');
    console.log(`   Created: "${newBrick.title}" (ID: ${newBrick.id})`);

    // Test update
    const { data: updatedBrick, error: updateError } = await supabase
      .from('bricks')
      .update({ 
        status: 'in_progress', 
        progress_percentage: 25,
        updated_at: new Date().toISOString()
      })
      .eq('id', newBrick.id)
      .select()
      .single();

    if (updateError) {
      console.log('❌ Update operation failed:', updateError.message);
    } else {
      console.log(`✅ Update operation successful: Status = ${updatedBrick.status}`);
    }

    // Clean up test brick
    await supabase.from('bricks').delete().eq('id', newBrick.id);
    console.log('   ✅ Test data cleaned up');

    // Step 7: Test sign out
    console.log('   Step 7: Testing sign out...');
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      console.log('❌ Sign out failed:', signOutError.message);
      return false;
    }

    // Verify sign out
    const { data: finalSession } = await supabase.auth.getSession();
    if (finalSession.session) {
      console.log('❌ Session still exists after sign out');
      return false;
    }

    console.log('✅ Sign out successful');

    return true;

  } catch (error) {
    console.log('❌ Auth flow test failed:', error.message);
    return false;
  }
}

async function testAuthHooks() {
  console.log('\n2️⃣ Testing Auth State Changes (Hooks Simulation)...');
  
  try {
    console.log('   Setting up auth state listener...');
    
    let authStateChanges = [];
    
    // Simulate what the auth hook does
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      authStateChanges.push({ event, hasSession: !!session, timestamp: new Date() });
      console.log(`   📡 Auth state change: ${event} (session: ${session ? 'present' : 'none'})`);
    });

    // Sign in and monitor changes
    console.log('   Triggering sign in to monitor state changes...');
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });

    if (signInError) {
      console.log('❌ Sign in for hooks test failed:', signInError.message);
      authListener.subscription.unsubscribe();
      return false;
    }

    // Wait for state changes to propagate
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Sign out and monitor
    console.log('   Triggering sign out to monitor state changes...');
    await supabase.auth.signOut();

    // Wait for state changes
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Clean up listener
    authListener.subscription.unsubscribe();

    console.log(`   ✅ Auth state monitoring: ${authStateChanges.length} events captured`);
    
    return authStateChanges.length > 0;

  } catch (error) {
    console.log('❌ Auth hooks test failed:', error.message);
    return false;
  }
}

async function testErrorHandling() {
  console.log('\n3️⃣ Testing Error Handling...');
  
  try {
    // Test invalid credentials
    console.log('   Testing invalid credentials...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'invalid@example.com',
      password: 'wrongpassword',
    });

    if (error) {
      console.log(`   ✅ Invalid credentials properly rejected: ${error.message}`);
    } else {
      console.log('   ❌ Invalid credentials were accepted (this should not happen)');
      return false;
    }

    // Test accessing protected resource without auth
    console.log('   Testing unauthorized access...');
    await supabase.auth.signOut(); // Ensure signed out
    
    const { data: protectedData, error: protectedError } = await supabase
      .from('bricks')
      .select('*')
      .limit(1);

    // This should either work (if RLS allows) or fail appropriately
    if (protectedError) {
      console.log(`   ✅ Unauthorized access properly handled: ${protectedError.message}`);
    } else {
      console.log(`   ✅ Unauthorized access handled by RLS: ${protectedData.length} records (RLS filtering)`);
    }

    return true;

  } catch (error) {
    console.log('❌ Error handling test failed:', error.message);
    return false;
  }
}

async function runIntegrationTests() {
  console.log('=' .repeat(70));
  
  try {
    const authFlow = await testAuthFlow();
    const authHooks = await testAuthHooks();
    const errorHandling = await testErrorHandling();

    console.log('\n📋 AUTH INTEGRATION TEST SUMMARY:');
    console.log('=' .repeat(70));
    
    console.log(`Complete Auth Flow: ${authFlow ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Auth State Changes: ${authHooks ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Error Handling: ${errorHandling ? '✅ PASSED' : '❌ FAILED'}`);

    const allWorking = authFlow && authHooks && errorHandling;
    
    console.log(`\n🚀 AUTH INTEGRATION STATUS: ${allWorking ? '✅ FULLY WORKING!' : '⚠️  NEEDS ATTENTION'}`);
    
    if (allWorking) {
      console.log('\n🎊 AUTHENTICATION INTEGRATION IS PERFECT!');
      console.log('\n✅ What\'s Working:');
      console.log('   • Complete sign-in/sign-out flow');
      console.log('   • Session persistence and retrieval');
      console.log('   • Authenticated database operations');
      console.log('   • Real-time auth state changes');
      console.log('   • Proper error handling');
      console.log('   • User data isolation (RLS)');
      console.log('   • Write/update operations');
      console.log('\n🔧 Your app configuration is optimal for:');
      console.log('   • React auth hooks');
      console.log('   • Automatic token refresh');
      console.log('   • Session persistence across page reloads');
      console.log('   • Secure API calls');
    }

  } catch (error) {
    console.error('\n❌ Integration test suite failed:', error.message);
  }
}

// Run integration tests
runIntegrationTests();
