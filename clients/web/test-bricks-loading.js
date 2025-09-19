/**
 * Test Bricks Loading Issue
 * Verifies that bricks can be loaded and identifies the root cause of the error
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testBricksLoading() {
  console.log('🔧 TESTING BRICKS LOADING ISSUE\n');
  console.log('=' .repeat(50));

  const testUser = {
    email: 'setiwa9522@artvara.com',
    password: 'QWaszx123'
  };

  try {
    // Test 1: Login
    console.log('1️⃣ Testing login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    });

    if (loginError) {
      console.log('❌ Login failed:', loginError.message);
      return;
    }

    console.log('✅ Login successful');
    const userId = loginData.user.id;

    // Test 2: Check if tables exist
    console.log('\n2️⃣ Testing table existence...');

    const tablesToCheck = ['profiles', 'bricks', 'quantas'];
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);

        if (error) {
          console.log(`❌ Table '${table}' error:`, error.message);
          console.log(`   Code: ${error.code}, Details: ${error.details}, Hint: ${error.hint}`);
        } else {
          console.log(`✅ Table '${table}' exists and accessible`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}' access failed:`, err.message);
      }
    }

    // Test 3: Test user profile access
    console.log('\n3️⃣ Testing user profile access...');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.log('❌ Profile access failed:', profileError.message);
      console.log('   This could be an RLS policy issue');
    } else {
      console.log('✅ Profile access successful:', profile.full_name);
    }

    // Test 4: Test bricks access (basic query)
    console.log('\n4️⃣ Testing bricks access...');

    const { data: bricks, error: bricksError } = await supabase
      .from('bricks')
      .select('*')
      .eq('user_id', userId)
      .limit(5);

    if (bricksError) {
      console.log('❌ Bricks access failed:', bricksError.message);
      console.log('   Code:', bricksError.code);
      console.log('   Details:', bricksError.details);
      console.log('   Hint:', bricksError.hint);
    } else {
      console.log(`✅ Bricks access successful: ${bricks.length} bricks found`);
      if (bricks.length > 0) {
        console.log('   Sample brick:', bricks[0].title, '(Status:', bricks[0].status + ')');
      }
    }

    // Test 5: Test quantas access (basic query)
    console.log('\n5️⃣ Testing quantas access...');

    const { data: quantas, error: quantasError } = await supabase
      .from('quantas')
      .select('*')
      .eq('user_id', userId)
      .limit(5);

    if (quantasError) {
      console.log('❌ Quantas access failed:', quantasError.message);
      console.log('   Code:', quantasError.code);
      console.log('   Details:', quantasError.details);
      console.log('   Hint:', quantasError.hint);
    } else {
      console.log(`✅ Quantas access successful: ${quantas.length} quantas found`);
    }

    // Test 6: Test the exact query from bricksAPI.getUserBricks
    console.log('\n6️⃣ Testing exact bricksAPI query...');

    const { data: apiBricks, error: apiBricksError } = await supabase
      .from('bricks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (apiBricksError) {
      console.log('❌ API bricks query failed:', apiBricksError.message);
      console.log('   This is the exact query causing "Failed to load your tasks"');
    } else {
      console.log(`✅ API bricks query successful: ${apiBricks.length} bricks`);
    }

    // Test 7: Test the exact query from bricksAPI.getUserQuantas
    console.log('\n7️⃣ Testing exact quantasAPI query...');

    const { data: apiQuantas, error: apiQuantasError } = await supabase
      .from('quantas')
      .select(`
        *,
        bricks (
          id,
          title,
          category,
          priority
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (apiQuantasError) {
      console.log('❌ API quantas query failed:', apiQuantasError.message);
      console.log('   Join query failed - this could be the issue');
      console.log('   Code:', apiQuantasError.code);

      // Try without join to isolate the issue
      console.log('   Testing without join...');
      const { data: simpleQuantas, error: simpleError } = await supabase
        .from('quantas')
        .select('*')
        .eq('user_id', userId)
        .limit(5);

      if (simpleError) {
        console.log('   ❌ Even simple quantas query failed:', simpleError.message);
      } else {
        console.log(`   ✅ Simple quantas query works: ${simpleQuantas.length} found`);
        console.log('   Issue is likely with the JOIN to bricks table');
      }
    } else {
      console.log(`✅ API quantas query successful: ${apiQuantas.length} quantas`);
    }

    // Test 8: Check if bricks table has data that quantas can join to
    console.log('\n8️⃣ Testing foreign key relationships...');

    if (apiBricks && apiBricks.length > 0 && apiQuantas && apiQuantas.length > 0) {
      const bricksWithQuantas = apiBricks.filter(brick =>
        apiQuantas.some(quanta => quanta.brick_id === brick.id)
      );
      console.log(`✅ Foreign key relationships look good: ${bricksWithQuantas.length} bricks have quantas`);
    }

    // Test 9: Test the Promise.all from loadUserData
    console.log('\n9️⃣ Testing Promise.all from loadUserData...');

    try {
      const [userBricks, userQuantas] = await Promise.all([
        supabase
          .from('bricks')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('quantas')
          .select(`
            *,
            bricks (
              id,
              title,
              category,
              priority
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
      ]);

      if (userBricks.error) {
        console.log('❌ Promise.all bricks failed:', userBricks.error.message);
      } else {
        console.log(`✅ Promise.all bricks successful: ${userBricks.data?.length || 0} bricks`);
      }

      if (userQuantas.error) {
        console.log('❌ Promise.all quantas failed:', userQuantas.error.message);
        console.log('   This is likely the source of "Failed to load your tasks"');
      } else {
        console.log(`✅ Promise.all quantas successful: ${userQuantas.data?.length || 0} quantas`);
      }
    } catch (promiseError) {
      console.log('❌ Promise.all failed:', promiseError.message);
    }

    // Final logout
    console.log('\n🔚 Final logout...');
    const { error: finalSignOutError } = await supabase.auth.signOut();
    if (finalSignOutError) {
      console.log('❌ Final sign out failed:', finalSignOutError.message);
    } else {
      console.log('✅ Final sign out successful');
    }

    console.log('\n🎉 BRICKS LOADING TEST COMPLETE!');
    console.log('\n📋 SUMMARY:');
    console.log('If you see errors above, those are the root causes of the "Failed to load your tasks" error.');
    console.log('The most likely issues are:');
    console.log('1. RLS policies preventing data access');
    console.log('2. Join queries failing due to missing foreign key relationships');
    console.log('3. Table structure mismatches');
    console.log('4. Authentication/session issues');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBricksLoading();
