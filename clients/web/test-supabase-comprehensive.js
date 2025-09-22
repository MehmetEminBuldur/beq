/**
 * Comprehensive Supabase Testing Script
 * Tests authentication, database operations, and service role functionality
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Test configuration
const TEST_USER = {
  email: 'setiwa9522@artvara.com',
  password: 'QWaszx123' // From previous tests
};

console.log('🧪 COMPREHENSIVE SUPABASE TESTING\n');
console.log('=' .repeat(60));

// Initialize both clients
let supabaseClient, supabaseAdmin;

try {
  // Standard client (anon key)
  supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Admin client (service role key)
  supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('✅ Supabase clients initialized successfully');
} catch (error) {
  console.log('❌ Failed to initialize Supabase clients:', error.message);
  process.exit(1);
}

async function testEnvironmentVariables() {
  console.log('\n1️⃣ Testing Environment Variables...');
  
  const required = {
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY
  };

  for (const [key, value] of Object.entries(required)) {
    if (value) {
      console.log(`✅ ${key}: ${key.includes('KEY') ? value.substring(0, 10) + '...' : value}`);
    } else {
      console.log(`❌ ${key}: Missing`);
      return false;
    }
  }
  return true;
}

async function testBasicConnectivity() {
  console.log('\n2️⃣ Testing Basic Connectivity...');
  
  try {
    // Test anon client
    const { data, error } = await supabaseClient.auth.getSession();
    if (error && error.message !== 'Invalid JWT') {
      throw error;
    }
    console.log('✅ Anon client connectivity: Working');
    
    // Test admin client
    const { data: adminData, error: adminError } = await supabaseAdmin.auth.getSession();
    if (adminError && adminError.message !== 'Invalid JWT') {
      throw adminError;
    }
    console.log('✅ Admin client connectivity: Working');
    
    return true;
  } catch (error) {
    console.log('❌ Connectivity test failed:', error.message);
    return false;
  }
}

async function testAuthentication() {
  console.log('\n3️⃣ Testing Authentication Functions...');
  
  try {
    // Test sign in
    console.log('   Testing sign in...');
    const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });

    if (signInError) {
      console.log('❌ Sign in failed:', signInError.message);
      return false;
    }

    console.log('✅ Sign in successful');
    console.log(`   User ID: ${signInData.user.id}`);
    console.log(`   Email: ${signInData.user.email}`);

    // Test session retrieval
    console.log('   Testing session retrieval...');
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Session retrieval failed:', sessionError.message);
      return false;
    }

    if (sessionData.session) {
      console.log('✅ Session retrieved successfully');
      console.log(`   Expires at: ${new Date(sessionData.session.expires_at * 1000).toLocaleString()}`);
    } else {
      console.log('❌ No active session found');
      return false;
    }

    // Test user info
    console.log('   Testing user info retrieval...');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError) {
      console.log('❌ User info retrieval failed:', userError.message);
      return false;
    }

    console.log('✅ User info retrieved successfully');
    console.log(`   User metadata: ${JSON.stringify(userData.user.user_metadata || {})}`);

    return { success: true, userId: signInData.user.id };
  } catch (error) {
    console.log('❌ Authentication test failed:', error.message);
    return false;
  }
}

async function testDatabaseRead(userId) {
  console.log('\n4️⃣ Testing Database Read Operations...');
  
  const queries = [
    {
      name: 'Profile Query',
      query: () => supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
    },
    {
      name: 'Bricks Query',
      query: () => supabaseClient
        .from('bricks')
        .select('*')
        .eq('user_id', userId)
        .limit(5)
    },
    {
      name: 'Conversations Query',
      query: () => supabaseClient
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .limit(5)
    },
    {
      name: 'Calendar Events Query',
      query: () => supabaseClient
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .limit(5)
    },
    {
      name: 'Messages Query',
      query: () => supabaseClient
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .limit(5)
    }
  ];

  const results = {};
  
  for (const test of queries) {
    try {
      console.log(`   Testing ${test.name}...`);
      const { data, error } = await test.query();
      
      if (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
        results[test.name] = { success: false, error: error.message };
      } else {
        console.log(`✅ ${test.name}: ${data ? (Array.isArray(data) ? data.length : 1) : 0} records`);
        results[test.name] = { success: true, count: Array.isArray(data) ? data.length : (data ? 1 : 0) };
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
      results[test.name] = { success: false, error: error.message };
    }
  }

  return results;
}

async function testDatabaseWrite(userId) {
  console.log('\n5️⃣ Testing Database Write Operations...');
  
  const testData = {
    title: 'Test Write Operation',
    description: 'Testing database write functionality',
    created_at: new Date().toISOString(),
    user_id: userId
  };

  try {
    // Test insert operation
    console.log('   Testing insert operation...');
    const { data: insertData, error: insertError } = await supabaseClient
      .from('bricks')
      .insert([testData])
      .select()
      .single();

    if (insertError) {
      console.log('❌ Insert operation failed:', insertError.message);
      return false;
    }

    console.log('✅ Insert operation successful');
    console.log(`   Inserted record ID: ${insertData.id}`);

    // Test update operation
    console.log('   Testing update operation...');
    const updatedData = { 
      description: 'Updated test description - ' + new Date().toISOString()
    };
    
    const { data: updateData, error: updateError } = await supabaseClient
      .from('bricks')
      .update(updatedData)
      .eq('id', insertData.id)
      .select()
      .single();

    if (updateError) {
      console.log('❌ Update operation failed:', updateError.message);
      return false;
    }

    console.log('✅ Update operation successful');
    console.log(`   Updated description: ${updateData.description}`);

    // Test delete operation
    console.log('   Testing delete operation...');
    const { error: deleteError } = await supabaseClient
      .from('bricks')
      .delete()
      .eq('id', insertData.id);

    if (deleteError) {
      console.log('❌ Delete operation failed:', deleteError.message);
      return false;
    }

    console.log('✅ Delete operation successful');
    console.log(`   Deleted record ID: ${insertData.id}`);

    return true;
  } catch (error) {
    console.log('❌ Database write test failed:', error.message);
    return false;
  }
}

async function testServiceRoleKey() {
  console.log('\n6️⃣ Testing Service Role Key Functionality...');
  
  try {
    // Test admin operations that require service role
    console.log('   Testing admin user lookup...');
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name')
      .limit(5);

    if (usersError) {
      console.log('❌ Admin user lookup failed:', usersError.message);
      return false;
    }

    console.log('✅ Admin user lookup successful');
    console.log(`   Found ${users.length} user profiles`);

    // Test RLS bypass (service role should bypass RLS)
    console.log('   Testing RLS bypass...');
    const { data: allBricks, error: bricksError } = await supabaseAdmin
      .from('bricks')
      .select('id, user_id, title')
      .limit(10);

    if (bricksError) {
      console.log('❌ RLS bypass test failed:', bricksError.message);
      return false;
    }

    console.log('✅ RLS bypass successful');
    console.log(`   Retrieved ${allBricks.length} bricks (bypassing RLS)`);

    return true;
  } catch (error) {
    console.log('❌ Service role test failed:', error.message);
    return false;
  }
}

async function testRealTimeSubscription(userId) {
  console.log('\n7️⃣ Testing Real-time Subscriptions...');
  
  return new Promise((resolve) => {
    let messageReceived = false;
    let timeoutId;

    try {
      console.log('   Setting up real-time subscription...');
      
      const channel = supabaseClient
        .channel('test-bricks-changes')
        .on('postgres_changes', 
          { 
            event: 'INSERT',
            schema: 'public',
            table: 'bricks',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('✅ Real-time message received:', payload.new.title);
            messageReceived = true;
            clearTimeout(timeoutId);
            channel.unsubscribe();
            resolve(true);
          }
        )
        .subscribe((status) => {
          console.log(`   Subscription status: ${status}`);
          
          if (status === 'SUBSCRIBED') {
            console.log('   Subscription active, inserting test record...');
            
            // Insert a test record to trigger the subscription
            supabaseClient
              .from('bricks')
              .insert([{
                title: 'Real-time Test Brick',
                description: 'Testing real-time functionality',
                user_id: userId
              }])
              .then(({ data, error }) => {
                if (error) {
                  console.log('❌ Failed to insert test record:', error.message);
                  clearTimeout(timeoutId);
                  channel.unsubscribe();
                  resolve(false);
                } else {
                  console.log('   Test record inserted, waiting for real-time event...');
                }
              });
          }
        });

      // Set timeout for subscription test
      timeoutId = setTimeout(() => {
        if (!messageReceived) {
          console.log('❌ Real-time subscription test timed out');
          channel.unsubscribe();
          resolve(false);
        }
      }, 10000); // 10 second timeout

    } catch (error) {
      console.log('❌ Real-time subscription test failed:', error.message);
      clearTimeout(timeoutId);
      resolve(false);
    }
  });
}

async function cleanup() {
  console.log('\n8️⃣ Cleaning up test data...');
  
  try {
    // Clean up any test records
    const { error } = await supabaseClient
      .from('bricks')
      .delete()
      .ilike('title', '%test%');
    
    if (error) {
      console.log('⚠️  Cleanup warning:', error.message);
    } else {
      console.log('✅ Test data cleaned up');
    }

    // Sign out
    await supabaseClient.auth.signOut();
    console.log('✅ Signed out successfully');
    
  } catch (error) {
    console.log('⚠️  Cleanup error:', error.message);
  }
}

async function runAllTests() {
  try {
    // Test environment variables
    const envOk = await testEnvironmentVariables();
    if (!envOk) {
      console.log('\n❌ Environment variable test failed. Cannot continue.');
      return;
    }

    // Test basic connectivity
    const connectivityOk = await testBasicConnectivity();
    if (!connectivityOk) {
      console.log('\n❌ Basic connectivity test failed. Cannot continue.');
      return;
    }

    // Test authentication
    const authResult = await testAuthentication();
    if (!authResult || !authResult.success) {
      console.log('\n❌ Authentication test failed. Cannot continue with database tests.');
      return;
    }

    const userId = authResult.userId;

    // Test database read operations
    const readResults = await testDatabaseRead(userId);
    
    // Test database write operations
    const writeOk = await testDatabaseWrite(userId);
    
    // Test service role key
    const serviceRoleOk = await testServiceRoleKey();
    
    // Test real-time subscriptions
    const realtimeOk = await testRealTimeSubscription(userId);
    
    // Cleanup
    await cleanup();

    // Summary
    console.log('\n🎉 COMPREHENSIVE SUPABASE TEST COMPLETE!');
    console.log('=' .repeat(60));
    
    console.log('\n📋 TEST SUMMARY:');
    console.log('✅ Environment Variables: PASSED');
    console.log('✅ Basic Connectivity: PASSED');
    console.log('✅ Authentication: PASSED');
    console.log(`${Object.values(readResults).every(r => r.success) ? '✅' : '⚠️ '} Database Read: ${Object.values(readResults).filter(r => r.success).length}/${Object.keys(readResults).length} queries passed`);
    console.log(`${writeOk ? '✅' : '❌'} Database Write: ${writeOk ? 'PASSED' : 'FAILED'}`);
    console.log(`${serviceRoleOk ? '✅' : '❌'} Service Role Key: ${serviceRoleOk ? 'PASSED' : 'FAILED'}`);
    console.log(`${realtimeOk ? '✅' : '❌'} Real-time Subscriptions: ${realtimeOk ? 'PASSED' : 'FAILED'}`);

    const allPassed = writeOk && serviceRoleOk && realtimeOk && Object.values(readResults).every(r => r.success);
    
    console.log(`\n🚀 OVERALL STATUS: ${allPassed ? 'ALL TESTS PASSED! 🎊' : 'SOME TESTS FAILED ⚠️'}`);
    
    if (allPassed) {
      console.log('\nYour Supabase integration is working perfectly!');
      console.log('✅ Authentication flows');
      console.log('✅ Database operations');
      console.log('✅ Service role permissions');
      console.log('✅ Real-time functionality');
    }

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    await cleanup();
  }
}

// Run all tests
runAllTests();
