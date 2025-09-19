/**
 * Debug Quantas Schema
 * Check the actual structure of the quantas table in the database
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugQuantasSchema() {
  console.log('🔍 DEBUGGING QUANTAS SCHEMA\n');
  console.log('=' .repeat(50));

  const testUser = {
    email: 'setiwa9522@artvara.com',
    password: 'QWaszx123'
  };

  try {
    // Login
    console.log('1️⃣ Logging in...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    });

    if (loginError) {
      console.log('❌ Login failed:', loginError.message);
      return;
    }

    console.log('✅ Login successful');

    // Test 2: Check quantas table structure by trying different queries
    console.log('\n2️⃣ Checking quantas table structure...');

    // Try to get all columns from quantas
    try {
      const { data: allQuantas, error: allError } = await supabase
        .from('quantas')
        .select('*')
        .limit(1);

      if (allError) {
        console.log('❌ Failed to query quantas table:', allError.message);
      } else if (allQuantas && allQuantas.length > 0) {
        console.log('✅ Quantas table exists');
        console.log('   Columns found:', Object.keys(allQuantas[0]));
        console.log('   Sample data:', JSON.stringify(allQuantas[0], null, 2));
      } else {
        console.log('✅ Quantas table exists but is empty');
      }
    } catch (err) {
      console.log('❌ Error querying quantas:', err.message);
    }

    // Test 3: Check if there's a different table name
    console.log('\n3️⃣ Checking for alternative table names...');

    const possibleTableNames = ['quanta', 'quantums', 'tasks', 'subtasks'];

    for (const tableName of possibleTableNames) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (!error) {
          console.log(`✅ Found alternative table: '${tableName}'`);
          if (data && data.length > 0) {
            console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`);
          }
        }
      } catch (err) {
        // Table doesn't exist, continue
      }
    }

    // Test 4: Check if quantas table exists at all
    console.log('\n4️⃣ Checking if quantas table exists...');

    // Try a different approach - query information_schema
    try {
      // Note: This might not work with Supabase's RLS, but let's try
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .like('table_name', '%quant%');

      if (!tablesError && tables) {
        console.log('Tables with "quant" in name:', tables.map(t => t.table_name));
      }
    } catch (err) {
      console.log('Could not query information_schema (expected with RLS)');
    }

    // Test 5: Try to create a test quantas record to see what happens
    console.log('\n5️⃣ Testing quantas insertion...');

    const testQuanta = {
      id: 'test-id-123',
      brick_id: 'test-brick-id', // This might not exist, but let's see the error
      title: 'Test Quanta',
      estimated_duration_minutes: 30,
      order_index: 0
    };

    try {
      const { data, error } = await supabase
        .from('quantas')
        .insert(testQuanta);

      if (error) {
        console.log('❌ Insert failed:', error.message);
        console.log('   Code:', error.code);
        console.log('   This will tell us what columns are actually expected');
      } else {
        console.log('✅ Insert succeeded (unexpected)');
      }
    } catch (err) {
      console.log('❌ Insert error:', err.message);
    }

    // Test 6: Check bricks table to see if it has the expected structure
    console.log('\n6️⃣ Checking bricks table structure...');

    try {
      const { data: bricks, error: bricksError } = await supabase
        .from('bricks')
        .select('*')
        .limit(1);

      if (bricksError) {
        console.log('❌ Bricks query failed:', bricksError.message);
      } else if (bricks && bricks.length > 0) {
        console.log('✅ Bricks table structure:');
        console.log('   Columns:', Object.keys(bricks[0]).join(', '));
        console.log('   Sample:', JSON.stringify(bricks[0], null, 2));
      }
    } catch (err) {
      console.log('❌ Error checking bricks:', err.message);
    }

    console.log('\n🔚 Logout...');
    await supabase.auth.signOut();

    console.log('\n🎉 SCHEMA DEBUG COMPLETE!');
    console.log('\n📋 POSSIBLE SOLUTIONS:');
    console.log('1. The quantas table might not exist - need to create it');
    console.log('2. The quantas table exists but has different column names');
    console.log('3. There might be a different table name being used');
    console.log('4. The schema migration might not have been applied');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugQuantasSchema();
