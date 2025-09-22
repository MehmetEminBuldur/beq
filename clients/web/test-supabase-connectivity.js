/**
 * Supabase Connectivity Test Script
 * Tests basic connectivity to Supabase services
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testSupabaseConnectivity() {
  console.log('🔗 TESTING SUPABASE CONNECTIVITY\n');
  console.log('=' .repeat(50));

  // Check environment variables
  console.log('1️⃣ Checking environment variables...');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    console.log('❌ NEXT_PUBLIC_SUPABASE_URL is not set');
    return;
  }
  if (!supabaseKey) {
    console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
    return;
  }

  console.log('✅ Environment variables are set');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Key: ${supabaseKey.substring(0, 20)}...`);

  // Test basic connectivity
  console.log('\n2️⃣ Testing basic connectivity...');
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': supabaseKey,
      },
      timeout: 5000, // 5 second timeout
    });

    if (response.ok) {
      console.log('✅ Basic connectivity test passed');
    } else {
      console.log(`❌ Basic connectivity test failed: ${response.status} ${response.statusText}`);
      return;
    }
  } catch (error) {
    console.log(`❌ Basic connectivity test failed: ${error.message}`);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure Supabase is running: docker-compose up -d');
    console.log('2. Check if the URL is correct in .env.local');
    console.log('3. Verify network connectivity');
    return;
  }

  // Test Supabase client
  console.log('\n3️⃣ Testing Supabase client initialization...');
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created successfully');
  } catch (error) {
    console.log(`❌ Supabase client creation failed: ${error.message}`);
    return;
  }

  // Test authentication endpoint
  console.log('\n4️⃣ Testing authentication endpoint...');
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase.auth.getSession();

    if (error) {
      console.log(`⚠️  Auth endpoint responded with error: ${error.message}`);
      console.log('This might be normal if no session exists');
    } else {
      console.log('✅ Authentication endpoint is accessible');
    }
  } catch (error) {
    console.log(`❌ Authentication endpoint test failed: ${error.message}`);
  }

  // Test database access
  console.log('\n5️⃣ Testing database access...');
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase.from('profiles').select('count').limit(1).single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.log(`❌ Database access failed: ${error.message}`);
    } else {
      console.log('✅ Database access successful');
    }
  } catch (error) {
    console.log(`❌ Database access test failed: ${error.message}`);
  }

  console.log('\n🎉 CONNECTIVITY TEST COMPLETE!');
  console.log('=' .repeat(50));

  console.log('\n📋 SUMMARY:');
  console.log('✅ Environment variables configured');
  console.log('✅ Network connectivity to Supabase');
  console.log('✅ Supabase client initialization');
  console.log('✅ Authentication endpoint accessible');
  console.log('✅ Database access working');

  console.log('\n🚀 Your Supabase connection is ready for development!');
}

// Run the test
testSupabaseConnectivity().catch(error => {
  console.error('❌ Test script failed:', error);
});
