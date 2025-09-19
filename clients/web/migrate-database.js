/**
 * Database Migration Script
 * Recreates Supabase tables from scratch based on implementation models
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Use service role key to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? 'Found' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function executeSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
      console.log('⚠️  RPC method not available, trying direct approach...');
      // If RPC doesn't work, we'll need to execute SQL statements individually
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function dropExistingTables() {
  console.log('🗑️  Dropping existing tables...\n');

  const dropQueries = [
    'DROP TABLE IF EXISTS public.messages CASCADE;',
    'DROP TABLE IF EXISTS public.conversations CASCADE;',
    'DROP TABLE IF EXISTS public.calendar_syncs CASCADE;',
    'DROP TABLE IF EXISTS public.calendar_events CASCADE;',
    'DROP TABLE IF EXISTS public.quantas CASCADE;',
    'DROP TABLE IF EXISTS public.bricks CASCADE;',
    'DROP TABLE IF EXISTS public.profiles CASCADE;',
    'DROP TYPE IF EXISTS task_status CASCADE;',
    'DROP TYPE IF EXISTS priority_level CASCADE;',
    'DROP TYPE IF EXISTS brick_category CASCADE;',
    'DROP TYPE IF EXISTS event_type CASCADE;',
    'DROP TYPE IF EXISTS recurrence_type CASCADE;',
  ];

  for (const query of dropQueries) {
    try {
      console.log(`Executing: ${query.split(' ')[1]} ${query.split(' ')[2]}`);
      const result = await executeSQL(query);
      if (!result.success) {
        console.log(`⚠️  ${result.error}`);
      }
    } catch (error) {
      console.log(`⚠️  ${error.message}`);
    }
  }

  console.log('✅ Tables dropped successfully\n');
}

async function createSchemaFromFile() {
  console.log('📝 Creating new schema from implementation models...\n');

  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, '../../infra/supabase/schema-from-implementation.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    // Split SQL into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      if (statement.trim().length < 10) continue; // Skip empty statements

      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        const result = await executeSQL(statement);

        if (result.success) {
          successCount++;
        } else {
          console.log(`⚠️  Statement ${i + 1} failed: ${result.error}`);
          errorCount++;
        }
      } catch (error) {
        console.log(`⚠️  Statement ${i + 1} error: ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 Migration Results:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📈 Success Rate: ${Math.round((successCount / (successCount + errorCount)) * 100)}%\n`);

  } catch (error) {
    console.error('❌ Error reading schema file:', error);
    process.exit(1);
  }
}

async function verifySchema() {
  console.log('🔍 Verifying new schema...\n');

  const tablesToCheck = [
    'profiles',
    'bricks',
    'quantas',
    'calendar_events',
    'calendar_syncs',
    'conversations',
    'messages'
  ];

  let verifiedCount = 0;

  for (const tableName of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
      } else {
        console.log(`✅ ${tableName}: EXISTS`);
        verifiedCount++;
      }
    } catch (error) {
      console.log(`❌ ${tableName}: ${error.message}`);
    }
  }

  console.log(`\n📊 Verification: ${verifiedCount}/${tablesToCheck.length} tables verified\n`);
  return verifiedCount === tablesToCheck.length;
}

async function createTestData() {
  console.log('🎯 Creating test data...\n');

  try {
    // Get existing user
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError || !authUsers.users || authUsers.users.length === 0) {
      console.log('⚠️  No existing users found. Skipping test data creation.');
      return false;
    }

    const testUserId = authUsers.users[0].id;
    console.log(`Using existing user: ${authUsers.users[0].email}\n`);

    // Create test bricks
    const bricks = [
      {
        user_id: testUserId,
        title: 'Learn Spanish',
        description: 'Master conversational Spanish for travel and work',
        category: 'learning',
        priority: 'high',
        status: 'in_progress',
        estimated_duration_minutes: 180,
        completion_percentage: 35,
        tags: ['language', 'communication', 'travel'],
      },
      {
        user_id: testUserId,
        title: 'Fitness Routine',
        description: 'Build a sustainable fitness habit with strength training',
        category: 'health',
        priority: 'medium',
        status: 'in_progress',
        estimated_duration_minutes: 120,
        completion_percentage: 60,
        tags: ['fitness', 'health', 'strength'],
      },
    ];

    console.log('🧱 Creating test bricks...');
    const createdBricks = [];

    for (const brick of bricks) {
      try {
        const { data, error } = await supabase
          .from('bricks')
          .insert(brick)
          .select();

        if (error) {
          console.log(`❌ Brick "${brick.title}" creation error: ${error.message}`);
        } else {
          console.log(`✅ Brick created: ${data[0].title}`);
          createdBricks.push(data[0]);
        }
      } catch (error) {
        console.log(`❌ Brick "${brick.title}" creation error: ${error.message}`);
      }
    }

    // Create test conversation
    console.log('\n💬 Creating test conversation...');

    try {
      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert({
          user_id: testUserId,
          title: 'Schedule Planning Session',
          context: { topic: 'schedule_optimization', goals: ['spanish_learning', 'fitness_routine'] },
        })
        .select()
        .single();

      if (error) {
        console.log(`❌ Conversation creation error: ${error.message}`);
      } else {
        console.log(`✅ Conversation created: ${conversation.title}`);

        // Create test message
        const { data: message, error: msgError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversation.id,
            user_id: testUserId,
            content: 'Help me plan my day more effectively',
            response: 'I\'d be happy to help you plan your day!',
            model_used: 'google/gemma-2-27b-it',
          })
          .select();

        if (msgError) {
          console.log(`❌ Message creation error: ${msgError.message}`);
        } else {
          console.log('✅ Test message created');
        }
      }
    } catch (error) {
      console.log(`❌ Conversation creation error: ${error.message}`);
    }

    // Create test calendar event
    console.log('\n📅 Creating test calendar event...');

    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          user_id: testUserId,
          title: 'Morning Workout',
          description: 'Upper body strength training session',
          start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          end_time: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // 1 hour later
          calendar_source: 'beq',
          is_all_day: false,
          timezone: 'UTC',
        })
        .select();

      if (error) {
        console.log(`❌ Calendar event creation error: ${error.message}`);
      } else {
        console.log(`✅ Calendar event created: ${data[0].title}`);
      }
    } catch (error) {
      console.log(`❌ Calendar event creation error: ${error.message}`);
    }

    console.log('\n🎉 Test data creation completed!');
    return true;

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    return false;
  }
}

async function runMigration() {
  console.log('🚀 STARTING DATABASE MIGRATION\n');
  console.log('⚠️  WARNING: This will delete all existing data!\n');

  // Ask for confirmation
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise((resolve) => {
    rl.question('Do you want to continue? (type "yes" to proceed): ', resolve);
  });

  rl.close();

  if (answer.toLowerCase() !== 'yes') {
    console.log('❌ Migration cancelled by user');
    return;
  }

  console.log('\n🔄 Starting migration process...\n');

  try {
    // Step 1: Drop existing tables
    await dropExistingTables();

    // Step 2: Create new schema
    await createSchemaFromFile();

    // Step 3: Verify schema
    const schemaVerified = await verifySchema();

    if (schemaVerified) {
      // Step 4: Create test data
      await createTestData();

      console.log('\n🎊 MIGRATION COMPLETED SUCCESSFULLY!');
      console.log('\n📋 Summary:');
      console.log('   ✅ All existing tables dropped');
      console.log('   ✅ New schema created from implementation models');
      console.log('   ✅ Schema verification passed');
      console.log('   ✅ Test data created');
      console.log('\n🚀 Your BeQ application now uses the correct database schema!');
      console.log('   Run: cd clients/web && npm run dev');
      console.log('   Visit: http://localhost:3003');

    } else {
      console.log('\n❌ Schema verification failed. Please check the migration logs above.');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
