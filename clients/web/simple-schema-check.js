/**
 * Simple schema check for Supabase database
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('🔍 Checking Supabase database tables...\n');

  const tablesToCheck = [
    'profiles',
    'bricks',
    'quantas',
    'events',
    'calendar_events',
    'conversations',
    'messages',
    'user_preferences'
  ];

  for (const tableName of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
      } else {
        console.log(`✅ ${tableName}: EXISTS (${data ? data.length : 0} rows)`);

        // If table exists, show a sample row structure
        if (data && data.length > 0) {
          console.log(`   Sample columns: ${Object.keys(data[0]).join(', ')}`);
        }
      }
    } catch (error) {
      console.log(`❌ ${tableName}: ERROR - ${error.message}`);
    }
  }

  console.log('\n🎯 Now let\'s try a simple insert to see the actual schema...\n');

  // Try to insert into profiles to see what columns it expects
  try {
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: 'test-user-id',
        email: 'test@example.com',
        full_name: 'Test User',
      });

    if (error) {
      console.log('📝 Profiles insert error (shows expected columns):', error.message);
    } else {
      console.log('✅ Profiles insert succeeded');
    }
  } catch (error) {
    console.log('❌ Profiles insert error:', error.message);
  }
}

checkTables();
