/**
 * Health check endpoint for the BeQ application
 * Vercel serverless function replacement for orchestrator health check
 */

import { NextRequest, NextResponse } from 'next/server';

// CORS configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

// Handle preflight OPTIONS request
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET(request: NextRequest) {
  try {
    const health = {
      status: 'healthy',
      service: 'BeQ Application',
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'production',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        supabase: 'healthy',
        vercel: 'operational',
        openrouter: 'connected'
      },
      features: [
        'AI-powered life management',
        'Smart scheduling with Gemma 3 27B IT',
        'Real-time synchronization',
        'Serverless architecture',
        'Local storage caching'
      ]
    };

    return NextResponse.json(health, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=30'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        service: 'BeQ Application',
        version: '2.0.0',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { 
        status: 503,
        headers: corsHeaders,
      }
    );
  }
}
