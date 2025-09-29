/**
 * CORS middleware for Next.js API routes
 * Handles cross-origin requests properly for production deployment
 */

import { NextRequest, NextResponse } from 'next/server';

// CORS configuration
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-Requested-With',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true',
};

/**
 * Handle preflight OPTIONS request
 */
export function handleCorsOptions(): NextResponse {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

/**
 * Add CORS headers to a response
 */
export function addCorsHeaders(response: NextResponse): NextResponse {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Create a JSON response with CORS headers
 */
export function createCorsResponse(
  data: any,
  options: { status?: number; headers?: Record<string, string> } = {}
): NextResponse {
  const { status = 200, headers = {} } = options;
  
  return NextResponse.json(data, {
    status,
    headers: {
      ...corsHeaders,
      ...headers,
    },
  });
}

/**
 * CORS middleware wrapper for API routes
 */
export function withCors(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
      return handleCorsOptions();
    }

    try {
      // Execute the actual handler
      const response = await handler(request);
      
      // Add CORS headers to the response
      return addCorsHeaders(response);
    } catch (error) {
      console.error('CORS middleware error:', error);
      
      // Return error response with CORS headers
      return createCorsResponse(
        {
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  };
}
