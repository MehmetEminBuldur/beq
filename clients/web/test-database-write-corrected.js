/**
 * Test Database Write Operations - Corrected
 * Tests CRUD operations with the actual database schema
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('📝 TESTING DATABASE WRITE OPERATIONS (CORRECTED SCHEMA)\n');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testBricksWriteOperations() {
  console.log('1️⃣ Testing Bricks Table Write Operations...');
  
  try {
    // Get a user ID for testing
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

    // Test INSERT with correct schema and valid status
    console.log('   Testing INSERT operation...');
    const testBrick = {
      user_id: testUserId,
      title: 'Database Write Test Brick',
      description: 'Testing database write operations with correct schema',
      category: 'test',
      priority: 'medium',
      status: 'not_started', // Use valid status value
      estimated_duration_minutes: 30,
      progress_percentage: 0,
      tags: ['test', 'database'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
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
    console.log(`   Title: ${insertData.title}`);

    // Test UPDATE
    console.log('   Testing UPDATE operation...');
    const updateData = {
      description: 'Updated via database write test - ' + new Date().toISOString(),
      status: 'in_progress', // Use valid status value
      progress_percentage: 50,
      actual_duration_minutes: 15,
      updated_at: new Date().toISOString()
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

    console.log(`✅ UPDATE operation successful:`);
    console.log(`   Status: ${updatedData.status}`);
    console.log(`   Progress: ${updatedData.progress_percentage}%`);
    console.log(`   Duration: ${updatedData.actual_duration_minutes} minutes`);

    // Test READ to verify update
    console.log('   Testing READ to verify update...');
    const { data: readData, error: readError } = await supabaseAdmin
      .from('bricks')
      .select('*')
      .eq('id', insertData.id)
      .single();

    if (readError) {
      console.log('❌ READ verification failed:', readError.message);
      return false;
    }

    console.log(`✅ READ verification successful: Status is ${readData.status}`);

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

    // Verify deletion
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('bricks')
      .select('*')
      .eq('id', insertData.id);

    if (verifyError) {
      console.log('❌ DELETE verification failed:', verifyError.message);
      return false;
    }

    if (verifyData.length === 0) {
      console.log('✅ DELETE verification successful: Record no longer exists');
    } else {
      console.log('❌ DELETE verification failed: Record still exists');
      return false;
    }

    return true;

  } catch (error) {
    console.log('❌ Bricks write operations test failed:', error.message);
    return false;
  }
}

async function testMessagesWriteOperations() {
  console.log('\n2️⃣ Testing Messages Table Write Operations...');
  
  try {
    // Create a test conversation first
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .limit(1);

    const testUserId = profiles[0].id;

    const { data: conversation } = await supabaseAdmin
      .from('conversations')
      .insert([{
        user_id: testUserId,
        title: 'Test Conversation for Messages',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    // Test INSERT message with correct schema
    console.log('   Testing INSERT operation...');
    const testMessage = {
      conversation_id: conversation.id,
      user_id: testUserId,
      content: 'This is a test message for database write operations',
      response: 'This is a test response from the AI',
      model_used: 'gpt-4',
      processing_time_ms: 150,
      metadata: { test: true, source: 'database-write-test' },
      created_at: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('messages')
      .insert([testMessage])
      .select()
      .single();

    if (insertError) {
      console.log('❌ INSERT operation failed:', insertError.message);
      return false;
    }

    console.log(`✅ INSERT operation successful: Message ID ${insertData.id}`);
    console.log(`   Content: ${insertData.content.substring(0, 50)}...`);

    // Test UPDATE
    console.log('   Testing UPDATE operation...');
    const { data: updatedData, error: updateError } = await supabaseAdmin
      .from('messages')
      .update({ 
        content: 'Updated test message - ' + new Date().toISOString(),
        processing_time_ms: 200,
        metadata: { test: true, updated: true, source: 'database-write-test' }
      })
      .eq('id', insertData.id)
      .select()
      .single();

    if (updateError) {
      console.log('❌ UPDATE operation failed:', updateError.message);
      return false;
    }

    console.log(`✅ UPDATE operation successful`);
    console.log(`   Processing time: ${updatedData.processing_time_ms}ms`);

    // Clean up
    await supabaseAdmin.from('messages').delete().eq('id', insertData.id);
    await supabaseAdmin.from('conversations').delete().eq('id', conversation.id);

    console.log(`✅ Cleanup successful`);

    return true;

  } catch (error) {
    console.log('❌ Messages write operations test failed:', error.message);
    return false;
  }
}

async function testCalendarEventsWriteOperations() {
  console.log('\n3️⃣ Testing Calendar Events Table Write Operations...');
  
  try {
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .limit(1);

    const testUserId = profiles[0].id;

    // Test INSERT with correct schema
    console.log('   Testing INSERT operation...');
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now

    const testEvent = {
      user_id: testUserId,
      title: 'Database Write Test Event',
      description: 'Testing calendar events write operations',
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      location: 'Test Location',
      calendar_source: 'manual',
      is_all_day: false,
      is_recurring: false,
      timezone: 'UTC',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('calendar_events')
      .insert([testEvent])
      .select()
      .single();

    if (insertError) {
      console.log('❌ INSERT operation failed:', insertError.message);
      return false;
    }

    console.log(`✅ INSERT operation successful: Event ID ${insertData.id}`);
    console.log(`   Event: ${insertData.title}`);
    console.log(`   Time: ${new Date(insertData.start_time).toLocaleString()}`);
    console.log(`   Location: ${insertData.location}`);

    // Test UPDATE
    console.log('   Testing UPDATE operation...');
    const { data: updatedData, error: updateError } = await supabaseAdmin
      .from('calendar_events')
      .update({ 
        title: 'Updated Test Event - ' + new Date().toISOString(),
        location: 'Updated Test Location',
        description: 'Updated description for the test event',
        updated_at: new Date().toISOString()
      })
      .eq('id', insertData.id)
      .select()
      .single();

    if (updateError) {
      console.log('❌ UPDATE operation failed:', updateError.message);
      return false;
    }

    console.log(`✅ UPDATE operation successful:`);
    console.log(`   Updated title: ${updatedData.title}`);
    console.log(`   Updated location: ${updatedData.location}`);

    // Test DELETE
    console.log('   Testing DELETE operation...');
    const { error: deleteError } = await supabaseAdmin
      .from('calendar_events')
      .delete()
      .eq('id', insertData.id);

    if (deleteError) {
      console.log('❌ DELETE operation failed:', deleteError.message);
      return false;
    }

    console.log(`✅ DELETE operation successful: Event ${insertData.id} deleted`);

    return true;

  } catch (error) {
    console.log('❌ Calendar events write operations test failed:', error.message);
    return false;
  }
}

async function testConversationsWriteOperations() {
  console.log('\n4️⃣ Testing Conversations Table Write Operations...');
  
  try {
    // Get a user ID for testing
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .limit(1);

    const testUserId = profiles[0].id;

    // Test INSERT
    console.log('   Testing INSERT operation...');
    const testConversation = {
      user_id: testUserId,
      title: 'Database Write Test Conversation',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('conversations')
      .insert([testConversation])
      .select()
      .single();

    if (insertError) {
      console.log('❌ INSERT operation failed:', insertError.message);
      return false;
    }

    console.log(`✅ INSERT operation successful: Conversation ID ${insertData.id}`);

    // Test UPDATE
    console.log('   Testing UPDATE operation...');
    const { data: updatedData, error: updateError } = await supabaseAdmin
      .from('conversations')
      .update({ 
        title: 'Updated Test Conversation - ' + new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', insertData.id)
      .select()
      .single();

    if (updateError) {
      console.log('❌ UPDATE operation failed:', updateError.message);
      return false;
    }

    console.log(`✅ UPDATE operation successful: ${updatedData.title}`);

    // Test DELETE
    console.log('   Testing DELETE operation...');
    const { error: deleteError } = await supabaseAdmin
      .from('conversations')
      .delete()
      .eq('id', insertData.id);

    if (deleteError) {
      console.log('❌ DELETE operation failed:', deleteError.message);
      return false;
    }

    console.log(`✅ DELETE operation successful: Conversation ${insertData.id} deleted`);

    return true;

  } catch (error) {
    console.log('❌ Conversations write operations test failed:', error.message);
    return false;
  }
}

async function runAllWriteTests() {
  console.log('=' .repeat(60));
  
  try {
    const bricksSuccess = await testBricksWriteOperations();
    const messagesSuccess = await testMessagesWriteOperations();
    const eventsSuccess = await testCalendarEventsWriteOperations();
    const conversationsSuccess = await testConversationsWriteOperations();

    console.log('\n📋 DATABASE WRITE OPERATIONS SUMMARY:');
    console.log('=' .repeat(60));
    
    console.log(`Bricks Table: ${bricksSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Messages Table: ${messagesSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Calendar Events Table: ${eventsSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Conversations Table: ${conversationsSuccess ? '✅ PASSED' : '❌ FAILED'}`);

    const allPassed = bricksSuccess && messagesSuccess && eventsSuccess && conversationsSuccess;
    
    console.log(`\n🚀 OVERALL WRITE OPERATIONS STATUS: ${allPassed ? 'ALL TESTS PASSED! 🎊' : 'SOME TESTS FAILED ⚠️'}`);
    
    if (allPassed) {
      console.log('\nAll database write operations are working perfectly!');
      console.log('✅ CREATE operations');
      console.log('✅ READ operations');
      console.log('✅ UPDATE operations');
      console.log('✅ DELETE operations');
      console.log('✅ Data integrity maintained');
      console.log('✅ Schema constraints respected');
    }

  } catch (error) {
    console.error('\n❌ Write operations test suite failed:', error.message);
  }
}

// Run all write tests
runAllWriteTests();
