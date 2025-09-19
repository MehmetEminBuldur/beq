/**
 * Check the actual Supabase database schema
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

async function checkSchema() {
  console.log('🔍 Checking Supabase database schema...\n');

  try {
    // Get all tables
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .neq('table_name', 'schema_migrations'); // Exclude Supabase internal tables

    if (error) {
      console.error('Error fetching tables:', error);
      return;
    }

    console.log('📋 Tables in database:');
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });

    console.log('\n🔍 Checking columns for key tables...\n');

    // Check profiles table
    const { data: profilesColumns, error: profilesError } = await supabase
      .rpc('get_table_columns', { table_name: 'profiles' });

    if (profilesError) {
      console.log('❌ Error checking profiles table:', profilesError.message);
    } else if (profilesColumns) {
      console.log('👤 Profiles table columns:');
      profilesColumns.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    }

    // Check bricks table
    const { data: bricksColumns, error: bricksError } = await supabase
      .rpc('get_table_columns', { table_name: 'bricks' });

    if (bricksError) {
      console.log('❌ Error checking bricks table:', bricksError.message);
    } else if (bricksColumns) {
      console.log('\n🧱 Bricks table columns:');
      bricksColumns.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    }

    // Check conversations table
    const { data: convColumns, error: convError } = await supabase
      .rpc('get_table_columns', { table_name: 'conversations' });

    if (convError) {
      console.log('❌ Error checking conversations table:', convError.message);
    } else if (convColumns) {
      console.log('\n💬 Conversations table columns:');
      convColumns.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    }

    // Check messages table
    const { data: msgColumns, error: msgError } = await supabase
      .rpc('get_table_columns', { table_name: 'messages' });

    if (msgError) {
      console.log('❌ Error checking messages table:', msgError.message);
    } else if (msgColumns) {
      console.log('\n💬 Messages table columns:');
      msgColumns.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    }

    // Try to check calendar_events table if it exists
    if (tables.some(t => t.table_name === 'calendar_events')) {
      const { data: calColumns, error: calError } = await supabase
        .rpc('get_table_columns', { table_name: 'calendar_events' });

      if (!calError && calColumns) {
        console.log('\n📅 Calendar_events table columns:');
        calColumns.forEach(col => {
          console.log(`   - ${col.column_name} (${col.data_type})`);
        });
      }
    }

    // Check if quantas table exists
    if (tables.some(t => t.table_name === 'quantas')) {
      const { data: quantasColumns, error: quantasError } = await supabase
        .rpc('get_table_columns', { table_name: 'quantas' });

      if (!quantasError && quantasColumns) {
        console.log('\n⚡ Quantas table columns:');
        quantasColumns.forEach(col => {
          console.log(`   - ${col.column_name} (${col.data_type})`);
        });
      }
    }

  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

// Create a simple RPC function to get table columns (if it doesn't exist)
async function createHelperFunction() {
  try {
    await supabase.rpc('create_function_if_not_exists', {
      sql: `
        CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
        RETURNS TABLE(column_name text, data_type text, is_nullable text)
        LANGUAGE plpgsql
        AS $$
        BEGIN
          RETURN QUERY
          SELECT
            c.column_name,
            c.data_type,
            c.is_nullable
          FROM information_schema.columns c
          WHERE c.table_name = $1
            AND c.table_schema = 'public'
          ORDER BY c.ordinal_position;
        END;
        $$;
      `
    });
  } catch (error) {
    console.log('Helper function creation skipped:', error.message);
  }
}

async function runCheck() {
  await createHelperFunction();
  await checkSchema();
}

runCheck();
