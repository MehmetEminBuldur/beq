#!/usr/bin/env node

/**
 * Test frontend environment variables
 */

// Test direct environment access
console.log('🔧 Testing Environment Variables in Node.js Context:');
console.log('====================================================');

// Load from parent directory global.env
require('dotenv').config({ path: '../../global.env' });

console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...' : 'undefined');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 30) + '...' : 'undefined');

// Test what Next.js would see
const nextEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

console.log('\n🔍 Environment Variables Available:');
console.log('===================================');
for (const [key, value] of Object.entries(nextEnvVars)) {
  console.log(`${key}: ${value ? '✅ Available' : '❌ Missing'}`);
}

// Test if the Supabase client configuration would work
console.log('\n🧪 Testing Supabase Client Configuration:');
console.log('==========================================');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.log('❌ NEXT_PUBLIC_SUPABASE_URL is missing');
} else if (!supabaseUrl.startsWith('https://')) {
  console.log('⚠️  NEXT_PUBLIC_SUPABASE_URL should start with https://');
} else {
  console.log('✅ NEXT_PUBLIC_SUPABASE_URL is valid');
}

if (!supabaseAnonKey) {
  console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
} else if (!supabaseAnonKey.startsWith('eyJ')) {
  console.log('⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY should be a JWT token');
} else {
  console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY is valid JWT format');
}

// Try to decode the JWT to check validity
if (supabaseAnonKey && supabaseAnonKey.startsWith('eyJ')) {
  try {
    const payload = JSON.parse(atob(supabaseAnonKey.split('.')[1]));
    console.log(`   🔍 JWT role: ${payload.role}`);
    console.log(`   🔍 JWT ref: ${payload.ref}`);
    console.log(`   🔍 JWT iss: ${payload.iss}`);
    console.log(`   🔍 JWT exp: ${new Date(payload.exp * 1000).toISOString()}`);
  } catch (error) {
    console.log('⚠️  Could not decode JWT:', error.message);
  }
}

console.log('\n📋 Summary:');
console.log('==========');
if (supabaseUrl && supabaseAnonKey) {
  console.log('✅ Supabase configuration appears valid');
} else {
  console.log('❌ Supabase configuration is incomplete');
}
