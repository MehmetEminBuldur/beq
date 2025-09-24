#!/usr/bin/env node

/**
 * Test authentication in browser environment
 * Checks if environment variables are properly loaded in Next.js
 */

const puppeteer = require('puppeteer');

async function testBrowserAuth() {
  console.log('🌐 Testing Authentication in Browser Environment');
  console.log('==============================================\n');

  let browser;
  let page;

  try {
    // Launch browser
    console.log('🚀 Launching browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();

    // Set up console logging
    const consoleMessages = [];
    page.on('console', (msg) => {
      const text = msg.text();
      consoleMessages.push(text);
      if (text.includes('🔧 Supabase Client Debug') || text.includes('error') || text.includes('Error')) {
        console.log('📋 Browser Console:', text);
      }
    });

    // Set up error handling
    page.on('pageerror', (error) => {
      console.log('❌ Page Error:', error.message);
    });

    console.log('📱 Navigating to auth test page...');
    
    // Navigate to the auth test page
    const response = await page.goto('http://localhost:3000/auth-test', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    if (!response.ok()) {
      console.log(`❌ Failed to load page: ${response.status()}`);
      return false;
    }

    console.log('✅ Auth test page loaded successfully');

    // Wait for the page to be fully rendered
    await page.waitForTimeout(2000);

    // Check if environment variables are visible
    console.log('🔍 Checking environment variables...');
    
    const envCheck = await page.evaluate(() => {
      const envRows = document.querySelectorAll('div:contains("NEXT_PUBLIC_SUPABASE")');
      return {
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        pageElements: document.querySelectorAll('[data-testid], h1, button').length
      };
    });

    console.log('Environment variables in browser:', envCheck);

    // Try to fill in the test form and submit
    console.log('🔐 Testing sign-in form...');
    
    // Check if email input exists
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    const signInButton = await page.$('button:contains("Test Sign In")');

    if (!emailInput || !passwordInput) {
      console.log('⚠️  Sign-in form elements not found, checking page content...');
      
      const pageText = await page.evaluate(() => document.body.innerText);
      console.log('Page contains:', pageText.substring(0, 500) + '...');
      
      return false;
    }

    // Fill the form
    await emailInput.clear();
    await emailInput.type('test-auth@beq.dev');
    
    await passwordInput.clear();
    await passwordInput.type('TestPassword123!');

    // Click sign in button
    if (signInButton) {
      console.log('🚀 Clicking sign-in button...');
      await signInButton.click();
      
      // Wait for response
      await page.waitForTimeout(5000);
      
      // Check for success or error messages
      const resultText = await page.evaluate(() => {
        const result = document.querySelector('[class*="bg-muted"]');
        return result ? result.innerText : 'No result found';
      });
      
      console.log('📊 Sign-in result:', resultText);
      
      if (resultText.includes('✅')) {
        console.log('🎉 Sign-in test successful!');
        return true;
      } else if (resultText.includes('❌')) {
        console.log('❌ Sign-in test failed:', resultText);
        return false;
      } else {
        console.log('⚠️  Unclear sign-in result');
        return false;
      }
    } else {
      console.log('❌ Sign-in button not found');
      return false;
    }

  } catch (error) {
    console.log('❌ Browser test error:', error.message);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function main() {
  const success = await testBrowserAuth();
  
  console.log('\n📋 Browser Test Summary:');
  console.log('========================');
  
  if (success) {
    console.log('✅ Browser authentication test passed!');
    console.log('🎉 Sign-in functionality is working correctly');
    process.exit(0);
  } else {
    console.log('❌ Browser authentication test failed');
    console.log('🔧 Check the browser console logs above for details');
    process.exit(1);
  }
}

// Check if puppeteer is available
try {
  require.resolve('puppeteer');
  main().catch(console.error);
} catch (error) {
  console.log('⚠️  Puppeteer not available, skipping browser test');
  console.log('💡 Install puppeteer with: npm install puppeteer');
  console.log('🌐 Manually test at: http://localhost:3000/auth-test');
  process.exit(0);
}
