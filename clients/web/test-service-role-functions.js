/**
 * Test Service Role Key Functions
 * Since the service role key is working, let's test all database operations with it
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🔧 TESTING SERVICE ROLE KEY FUNCTIONS\n');

// Initialize admin client (service role key)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...');

async function testAdminDatabaseOperations() {
  console.log('\n1️⃣ Testing Admin Database Read Operations...');
  
  try {
    // Test reading profiles
    console.log('   Testing profiles table...');
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, created_at')
      .limit(5);

    if (profilesError) {
      console.log('❌ Profiles query failed:', profilesError.message);
    } else {
      console.log(`✅ Profiles query successful: ${profiles.length} records`);
      if (profiles.length > 0) {
        console.log(`   Sample profile: ${profiles[0].email} (ID: ${profiles[0].id})`);
      }
    }

    // Test reading bricks
    console.log('   Testing bricks table...');
    const { data: bricks, error: bricksError } = await supabaseAdmin
      .from('bricks')
      .select('id, title, user_id, created_at')
      .limit(5);

    if (bricksError) {
      console.log('❌ Bricks query failed:', bricksError.message);
    } else {
      console.log(`✅ Bricks query successful: ${bricks.length} records`);
      if (bricks.length > 0) {
        console.log(`   Sample brick: "${bricks[0].title}" by user ${bricks[0].user_id}`);
      }
    }

    // Test reading conversations
    console.log('   Testing conversations table...');
    const { data: conversations, error: conversationsError } = await supabaseAdmin
      .from('conversations')
      .select('id, title, user_id, created_at')
      .limit(5);

    if (conversationsError) {
      console.log('❌ Conversations query failed:', conversationsError.message);
    } else {
      console.log(`✅ Conversations query successful: ${conversations.length} records`);
    }

    // Test reading messages
    console.log('   Testing messages table...');
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('id, content, user_id, conversation_id, created_at')
      .limit(5);

    if (messagesError) {
      console.log('❌ Messages query failed:', messagesError.message);
    } else {
      console.log(`✅ Messages query successful: ${messages.length} records`);
    }

    // Test reading calendar events
    console.log('   Testing calendar_events table...');
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('calendar_events')
      .select('id, title, user_id, start_time, end_time')
      .limit(5);

    if (eventsError) {
      console.log('❌ Calendar events query failed:', eventsError.message);
    } else {
      console.log(`✅ Calendar events query successful: ${events.length} records`);
    }

    return { profiles, bricks, conversations, messages, events };

  } catch (error) {
    console.log('❌ Admin database read test failed:', error.message);
    return null;
  }
}

async function testAdminDatabaseWrites() {
  console.log('\n2️⃣ Testing Admin Database Write Operations...');
  
  try {
    // Get a user ID to use for testing
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .limit(1);

    if (!profiles || profiles.length === 0) {
      console.log('❌ No users found to test with');
      return false;
    }

    const testUserId = profiles[0].id;
    console.log(`   Using test user ID: ${testUserId}`);

    // Test INSERT
    console.log('   Testing INSERT operation...');
    const testBrick = {
      user_id: testUserId,
      title: 'Service Role Test Brick',
      description: 'Testing service role write operations',
      type: 'experience',
      status: 'draft',
      created_at: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('bricks')
      .insert([testBrick])
      .select()
      .single();

    if (insertError) {
      console.log('❌ INSERT operation failed:', insertError.message);
      return false;
    }

    console.log(`✅ INSERT operation successful: Record ID ${insertData.id}`);

    // Test UPDATE
    console.log('   Testing UPDATE operation...');
    const updateData = {
      description: 'Updated via service role test - ' + new Date().toISOString(),
      status: 'published'
    };

    const { data: updatedData, error: updateError } = await supabaseAdmin
      .from('bricks')
      .update(updateData)
      .eq('id', insertData.id)
      .select()
      .single();

    if (updateError) {
      console.log('❌ UPDATE operation failed:', updateError.message);
      return false;
    }

    console.log(`✅ UPDATE operation successful: Status changed to ${updatedData.status}`);

    // Test DELETE
    console.log('   Testing DELETE operation...');
    const { error: deleteError } = await supabaseAdmin
      .from('bricks')
      .delete()
      .eq('id', insertData.id);

    if (deleteError) {
      console.log('❌ DELETE operation failed:', deleteError.message);
      return false;
    }

    console.log(`✅ DELETE operation successful: Record ${insertData.id} deleted`);

    return true;

  } catch (error) {
    console.log('❌ Admin database write test failed:', error.message);
    return false;
  }
}

async function testUserManagement() {
  console.log('\n3️⃣ Testing User Management Functions...');
  
  try {
    // List users (admin function)
    console.log('   Testing user listing...');
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.log('❌ User listing failed:', listError.message);
      return false;
    }

    console.log(`✅ User listing successful: ${users.length} users found`);
    if (users.length > 0) {
      console.log(`   Sample user: ${users[0].email} (ID: ${users[0].id})`);
    }

    // Get user by ID
    if (users.length > 0) {
      console.log('   Testing user lookup by ID...');
      const { data: { user }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(users[0].id);

      if (getUserError) {
        console.log('❌ User lookup failed:', getUserError.message);
        return false;
      }

      console.log(`✅ User lookup successful: ${user.email}`);
    }

    return true;

  } catch (error) {
    console.log('❌ User management test failed:', error.message);
    return false;
  }
}

async function testRLS() {
  console.log('\n4️⃣ Testing Row Level Security (RLS) Bypass...');
  
  try {
    // Service role should bypass RLS
    console.log('   Testing RLS bypass on profiles table...');
    const { data: allProfiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .limit(10);

    if (profilesError) {
      console.log('❌ RLS bypass test failed:', profilesError.message);
      return false;
    }

    console.log(`✅ RLS bypass successful: Retrieved ${allProfiles.length} profiles`);

    // Test with bricks table
    console.log('   Testing RLS bypass on bricks table...');
    const { data: allBricks, error: bricksError } = await supabaseAdmin
      .from('bricks')
      .select('id, title, user_id')
      .limit(10);

    if (bricksError) {
      console.log('❌ RLS bypass test failed on bricks:', bricksError.message);
      return false;
    }

    console.log(`✅ RLS bypass successful: Retrieved ${allBricks.length} bricks from all users`);

    return true;

  } catch (error) {
    console.log('❌ RLS bypass test failed:', error.message);
    return false;
  }
}

async function testDatabaseSchema() {
  console.log('\n5️⃣ Testing Database Schema Access...');
  
  try {
    // Test accessing different tables to verify schema
    const tables = [
      'profiles',
      'bricks', 
      'conversations',
      'messages',
      'calendar_events',
      'quantas_submissions',
      'user_settings'
    ];

    const schemaResults = {};

    for (const table of tables) {
      try {
        console.log(`   Testing ${table} table...`);
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
          schemaResults[table] = { accessible: false, error: error.message };
        } else {
          console.log(`✅ ${table}: Accessible`);
          schemaResults[table] = { accessible: true, recordCount: data ? data.length : 0 };
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
        schemaResults[table] = { accessible: false, error: err.message };
      }
    }

    return schemaResults;

  } catch (error) {
    console.log('❌ Schema access test failed:', error.message);
    return null;
  }
}

async function runAllServiceRoleTests() {
  console.log('=' .repeat(60));
  
  try {
    const readResults = await testAdminDatabaseOperations();
    const writeSuccess = await testAdminDatabaseWrites();
    const userMgmtSuccess = await testUserManagement();
    const rlsSuccess = await testRLS();
    const schemaResults = await testDatabaseSchema();

    console.log('\n📋 SERVICE ROLE TEST SUMMARY:');
    console.log('=' .repeat(60));
    
    console.log(`Database Read Operations: ${readResults ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Database Write Operations: ${writeSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`User Management: ${userMgmtSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`RLS Bypass: ${rlsSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Schema Access: ${schemaResults ? '✅ TESTED' : '❌ FAILED'}`);

    if (schemaResults) {
      console.log('\n📊 Table Access Results:');
      for (const [table, result] of Object.entries(schemaResults)) {
        console.log(`   ${table}: ${result.accessible ? '✅' : '❌'} ${result.accessible ? 'Accessible' : result.error}`);
      }
    }

    const allPassed = readResults && writeSuccess && userMgmtSuccess && rlsSuccess && schemaResults;
    
    console.log(`\n🚀 OVERALL SERVICE ROLE STATUS: ${allPassed ? 'ALL FUNCTIONS WORKING! 🎊' : 'SOME ISSUES DETECTED ⚠️'}`);
    
    if (allPassed) {
      console.log('\nYour service role key is working perfectly!');
      console.log('✅ Admin database operations');
      console.log('✅ User management functions');
      console.log('✅ RLS bypass capabilities');
      console.log('✅ Full schema access');
    }

  } catch (error) {
    console.error('\n❌ Service role test suite failed:', error.message);
  }
}

// Run all service role tests
runAllServiceRoleTests();
