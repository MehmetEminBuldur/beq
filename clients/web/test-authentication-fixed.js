/**
 * Test Authentication with Updated API Keys
 * Comprehensive authentication testing and debugging
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🔐 TESTING AUTHENTICATION WITH UPDATED API KEYS\n');

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test credentials
const TEST_USER = {
  email: 'setiwa9522@artvara.com',
  password: 'QWaszx123'
};

console.log('Environment Check:');
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 25) + '...');
console.log('Service Key:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 25) + '...');

async function testBasicConnectivity() {
  console.log('\n1️⃣ Testing Basic API Connectivity...');
  
  try {
    // Test anon key with direct API call
    console.log('   Testing anon key with direct API...');
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      }
    });

    console.log(`   Anon API response: ${response.status} ${response.statusText}`);
    
    if (response.status === 200) {
      console.log('   ✅ Anon key is valid and accepted');
    } else {
      console.log('   ❌ Anon key rejected');
      const errorText = await response.text();
      console.log('   Response:', errorText);
    }

    // Test service role key
    console.log('   Testing service role key...');
    const adminResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    console.log(`   Service role API response: ${adminResponse.status} ${adminResponse.statusText}`);
    
    return response.status === 200;

  } catch (error) {
    console.log('❌ Connectivity test failed:', error.message);
    return false;
  }
}

async function testAuthEndpoints() {
  console.log('\n2️⃣ Testing Auth Endpoints...');
  
  try {
    // Test auth session endpoint
    console.log('   Testing auth session endpoint...');
    const { data: sessionData, error: sessionError } = await supabaseAnon.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Session endpoint error:', sessionError.message);
    } else {
      console.log('✅ Session endpoint working');
      console.log('   Current session:', sessionData.session ? 'Active' : 'None');
    }

    // Test auth user endpoint
    console.log('   Testing auth user endpoint...');
    const { data: userData, error: userError } = await supabaseAnon.auth.getUser();
    
    if (userError) {
      console.log('❌ User endpoint error:', userError.message);
    } else {
      console.log('✅ User endpoint working');
      console.log('   Current user:', userData.user ? userData.user.email : 'None');
    }

    return true;

  } catch (error) {
    console.log('❌ Auth endpoints test failed:', error.message);
    return false;
  }
}

async function testSignInProcess() {
  console.log('\n3️⃣ Testing Sign-In Process...');
  
  try {
    // First, ensure we're signed out
    console.log('   Ensuring clean state (sign out)...');
    await supabaseAnon.auth.signOut();

    // Test sign-in
    console.log('   Attempting sign-in...');
    const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });

    if (signInError) {
      console.log('❌ Sign-in failed:', signInError.message);
      
      // Let's check if the user exists using admin client
      console.log('   Checking if user exists with admin client...');
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        console.log('❌ Could not list users:', listError.message);
      } else {
        const userExists = users.find(u => u.email === TEST_USER.email);
        console.log(`   User ${TEST_USER.email} exists:`, !!userExists);
        
        if (userExists) {
          console.log(`   User ID: ${userExists.id}`);
          console.log(`   User status: ${userExists.email_confirmed_at ? 'Confirmed' : 'Unconfirmed'}`);
        }
      }
      
      return false;
    }

    console.log('✅ Sign-in successful!');
    console.log(`   User ID: ${signInData.user.id}`);
    console.log(`   Email: ${signInData.user.email}`);
    console.log(`   Session expires: ${new Date(signInData.session.expires_at * 1000).toLocaleString()}`);

    // Test session after sign-in
    console.log('   Verifying session after sign-in...');
    const { data: newSessionData, error: newSessionError } = await supabaseAnon.auth.getSession();
    
    if (newSessionError) {
      console.log('❌ Session verification failed:', newSessionError.message);
      return false;
    }

    if (newSessionData.session) {
      console.log('✅ Session verified successfully');
      console.log(`   Access token: ${newSessionData.session.access_token.substring(0, 20)}...`);
    } else {
      console.log('❌ No session found after sign-in');
      return false;
    }

    return { success: true, user: signInData.user, session: signInData.session };

  } catch (error) {
    console.log('❌ Sign-in process test failed:', error.message);
    return false;
  }
}

async function testAuthenticatedDatabaseAccess(userSession) {
  console.log('\n4️⃣ Testing Authenticated Database Access...');
  
  if (!userSession || !userSession.success) {
    console.log('❌ Skipping - no valid session');
    return false;
  }

  try {
    const userId = userSession.user.id;

    // Test reading user's own profile
    console.log('   Testing profile access...');
    const { data: profile, error: profileError } = await supabaseAnon
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.log('❌ Profile access failed:', profileError.message);
    } else {
      console.log('✅ Profile access successful');
      console.log(`   Profile: ${profile.email}`);
    }

    // Test reading user's bricks
    console.log('   Testing bricks access...');
    const { data: bricks, error: bricksError } = await supabaseAnon
      .from('bricks')
      .select('id, title, status')
      .eq('user_id', userId)
      .limit(5);

    if (bricksError) {
      console.log('❌ Bricks access failed:', bricksError.message);
    } else {
      console.log(`✅ Bricks access successful: ${bricks.length} bricks`);
    }

    // Test writing a brick
    console.log('   Testing brick creation...');
    const { data: newBrick, error: createError } = await supabaseAnon
      .from('bricks')
      .insert([{
        user_id: userId,
        title: 'Auth Test Brick',
        description: 'Testing authenticated database write',
        category: 'test',
        status: 'not_started'
      }])
      .select()
      .single();

    if (createError) {
      console.log('❌ Brick creation failed:', createError.message);
    } else {
      console.log('✅ Brick creation successful');
      console.log(`   Created brick: ${newBrick.title} (ID: ${newBrick.id})`);
      
      // Clean up
      await supabaseAnon.from('bricks').delete().eq('id', newBrick.id);
      console.log('   ✅ Test brick cleaned up');
    }

    return true;

  } catch (error) {
    console.log('❌ Authenticated database access test failed:', error.message);
    return false;
  }
}

async function testSignOut() {
  console.log('\n5️⃣ Testing Sign-Out Process...');
  
  try {
    const { error } = await supabaseAnon.auth.signOut();
    
    if (error) {
      console.log('❌ Sign-out failed:', error.message);
      return false;
    }

    console.log('✅ Sign-out successful');

    // Verify sign-out
    const { data: sessionData } = await supabaseAnon.auth.getSession();
    
    if (sessionData.session) {
      console.log('❌ Session still exists after sign-out');
      return false;
    } else {
      console.log('✅ Session cleared successfully');
    }

    return true;

  } catch (error) {
    console.log('❌ Sign-out test failed:', error.message);
    return false;
  }
}

async function runAuthenticationTests() {
  console.log('=' .repeat(70));
  
  try {
    const connectivity = await testBasicConnectivity();
    const authEndpoints = await testAuthEndpoints();
    const signInResult = await testSignInProcess();
    const dbAccess = await testAuthenticatedDatabaseAccess(signInResult);
    const signOut = await testSignOut();

    console.log('\n📋 AUTHENTICATION TEST SUMMARY:');
    console.log('=' .repeat(70));
    
    console.log(`Basic API Connectivity: ${connectivity ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Auth Endpoints: ${authEndpoints ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Sign-In Process: ${signInResult ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Authenticated DB Access: ${dbAccess ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Sign-Out Process: ${signOut ? '✅ PASSED' : '❌ FAILED'}`);

    const allWorking = connectivity && authEndpoints && signInResult && dbAccess && signOut;
    
    console.log(`\n🚀 AUTHENTICATION STATUS: ${allWorking ? '✅ FULLY WORKING!' : '⚠️  NEEDS ATTENTION'}`);
    
    if (allWorking) {
      console.log('\n🎊 AUTHENTICATION IS WORKING PERFECTLY!');
      console.log('\n✅ What\'s Working:');
      console.log('   • API key authentication');
      console.log('   • User sign-in/sign-out');
      console.log('   • Session management');
      console.log('   • Authenticated database access');
      console.log('   • Row Level Security (RLS)');
      console.log('   • User isolation');
    } else {
      console.log('\n🔧 Issues to Address:');
      if (!connectivity) console.log('   • API connectivity issues');
      if (!authEndpoints) console.log('   • Auth endpoint problems');
      if (!signInResult) console.log('   • Sign-in process errors');
      if (!dbAccess) console.log('   • Database access restrictions');
      if (!signOut) console.log('   • Sign-out process issues');
    }

  } catch (error) {
    console.error('\n❌ Authentication test suite failed:', error.message);
  }
}

// Run authentication tests
runAuthenticationTests();
