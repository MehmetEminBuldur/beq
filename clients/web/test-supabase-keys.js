/**
 * Simple Supabase API Key Test
 * Tests if the API keys are valid and working
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🔑 TESTING SUPABASE API KEYS\n');

// Print environment info
console.log('Environment Variables:');
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('ANON KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set (' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...)' : 'Missing');
console.log('SERVICE KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set (' + process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...)' : 'Missing');

async function testKeys() {
  try {
    console.log('\n1️⃣ Testing Anonymous Key...');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Test basic API call
    const { data, error } = await supabase.auth.getSession();
    
    if (error && error.message.includes('Invalid API key')) {
      console.log('❌ Anonymous key is invalid');
      console.log('   Error:', error.message);
      return false;
    } else {
      console.log('✅ Anonymous key is valid');
    }

    console.log('\n2️⃣ Testing Service Role Key...');
    
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test admin API call
    const { data: adminData, error: adminError } = await supabaseAdmin.auth.getSession();
    
    if (adminError && adminError.message.includes('Invalid API key')) {
      console.log('❌ Service role key is invalid');
      console.log('   Error:', adminError.message);
      return false;
    } else {
      console.log('✅ Service role key is valid');
    }

    console.log('\n3️⃣ Testing Database Access...');
    
    // Test a simple database query with anon key
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (profileError) {
      console.log('❌ Database access with anon key failed:', profileError.message);
    } else {
      console.log('✅ Database access with anon key works');
    }

    // Test database query with service role
    const { data: adminProfiles, error: adminProfileError } = await supabaseAdmin
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (adminProfileError) {
      console.log('❌ Database access with service role failed:', adminProfileError.message);
    } else {
      console.log('✅ Database access with service role works');
    }

    console.log('\n4️⃣ Testing Authentication Endpoint...');
    
    // Test direct HTTP call to auth endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
      method: 'GET',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      }
    });

    console.log(`   Auth endpoint response: ${response.status} ${response.statusText}`);
    
    if (response.status === 401) {
      console.log('❌ Authentication endpoint rejected API key');
      const errorText = await response.text();
      console.log('   Response:', errorText);
    } else {
      console.log('✅ Authentication endpoint accepts API key');
    }

    return true;

  } catch (error) {
    console.log('❌ Key test failed:', error.message);
    return false;
  }
}

async function checkProjectStatus() {
  console.log('\n5️⃣ Checking Project Status...');
  
  try {
    // Check if project is accessible
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    });

    console.log(`   Project status: ${response.status} ${response.statusText}`);
    
    if (response.status === 200) {
      console.log('✅ Project is active and accessible');
    } else if (response.status === 401) {
      console.log('❌ Project rejected API key - key may be incorrect or expired');
    } else if (response.status === 404) {
      console.log('❌ Project not found - URL may be incorrect');
    } else {
      console.log(`⚠️  Unexpected status: ${response.status}`);
    }

    return response.status === 200;

  } catch (error) {
    console.log('❌ Project status check failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('=' .repeat(60));
  
  const projectOk = await checkProjectStatus();
  const keysOk = await testKeys();
  
  console.log('\n📋 SUMMARY:');
  console.log(`Project Status: ${projectOk ? '✅ ACCESSIBLE' : '❌ INACCESSIBLE'}`);
  console.log(`API Keys: ${keysOk ? '✅ VALID' : '❌ INVALID'}`);
  
  if (projectOk && keysOk) {
    console.log('\n🎉 All API keys are working correctly!');
    console.log('You can proceed with authentication and database operations.');
  } else {
    console.log('\n⚠️  Issues detected with API keys or project access.');
    console.log('\nTroubleshooting steps:');
    console.log('1. Check if the Supabase project URL is correct');
    console.log('2. Verify the anon key in your Supabase dashboard');
    console.log('3. Verify the service role key in your Supabase dashboard');
    console.log('4. Check if the project is paused or has billing issues');
    console.log('5. Ensure the keys haven\'t been regenerated recently');
  }
}

runTests();
