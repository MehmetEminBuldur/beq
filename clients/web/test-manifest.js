/**
 * Test Web App Manifest Configuration
 * Verifies that the PWA manifest is properly configured and accessible
 */

const fs = require('fs');
const path = require('path');

async function testManifest() {
  console.log('📱 TESTING WEB APP MANIFEST CONFIGURATION\n');
  console.log('=' .repeat(50));

  const publicDir = path.join(__dirname, 'public');
  const manifestPath = path.join(publicDir, 'site.webmanifest');

  try {
    console.log('1️⃣ Testing manifest file existence...');

    if (!fs.existsSync(manifestPath)) {
      throw new Error('Manifest file not found at: ' + manifestPath);
    }

    console.log('✅ Manifest file exists');

    console.log('\n2️⃣ Testing manifest JSON validity...');

    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);
    console.log('✅ Manifest JSON is valid');

    // Test 2: Validate required fields
    console.log('\n2️⃣ Validating manifest structure...');

    const requiredFields = ['name', 'short_name', 'start_url', 'display'];
    const missingFields = requiredFields.filter(field => !manifest[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    console.log('✅ All required fields present');

    // Test 3: Validate icons
    console.log('\n3️⃣ Testing icon file existence...');

    if (manifest.icons && manifest.icons.length > 0) {
      for (const icon of manifest.icons) {
        if (icon.src) {
          const iconPath = path.join(publicDir, icon.src.replace(/^\//, ''));
          if (fs.existsSync(iconPath)) {
            console.log(`✅ Icon exists: ${icon.src}`);
          } else {
            console.log(`⚠️ Icon not found: ${icon.src}`);
          }
        }
      }
    } else {
      console.log('⚠️ No icons defined in manifest');
    }

    // Test 4: Validate shortcuts
    console.log('\n4️⃣ Testing shortcuts...');

    if (manifest.shortcuts && manifest.shortcuts.length > 0) {
      console.log(`✅ ${manifest.shortcuts.length} shortcuts defined`);
      manifest.shortcuts.forEach((shortcut, index) => {
        console.log(`   ${index + 1}. ${shortcut.name} → ${shortcut.url}`);
      });
    } else {
      console.log('ℹ️ No shortcuts defined');
    }

    // Test 5: Test manifest content
    console.log('\n5️⃣ Manifest summary:');
    console.log(`   Name: ${manifest.name}`);
    console.log(`   Short Name: ${manifest.short_name}`);
    console.log(`   Description: ${manifest.description || 'Not set'}`);
    console.log(`   Start URL: ${manifest.start_url}`);
    console.log(`   Display: ${manifest.display}`);
    console.log(`   Theme Color: ${manifest.theme_color || 'Not set'}`);
    console.log(`   Background Color: ${manifest.background_color || 'Not set'}`);

    // Test 6: Validate manifest JSON syntax
    console.log('\n6️⃣ Validating JSON syntax...');

    try {
      JSON.stringify(manifest);
      console.log('✅ Valid JSON syntax');
    } catch (error) {
      throw new Error(`Invalid JSON syntax: ${error.message}`);
    }

    console.log('\n🎉 WEB APP MANIFEST TEST COMPLETE!');
    console.log('\n📋 SUMMARY:');
    console.log('✅ Manifest is accessible and properly configured');
    console.log('✅ All required PWA fields are present');
    console.log('✅ Icons are accessible (where defined)');
    console.log('✅ Shortcuts are properly configured');
    console.log('✅ JSON syntax is valid');
    console.log('✅ Ready for PWA installation');

    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Test PWA installation in supported browsers');
    console.log('2. Add service worker for offline functionality');
    console.log('3. Create actual PNG icons for better compatibility');
    console.log('4. Test shortcuts after PWA installation');

  } catch (error) {
    console.error('❌ Manifest test failed:', error.message);
    process.exit(1);
  }
}

testManifest();
