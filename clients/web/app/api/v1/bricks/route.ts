/**
 * Bricks (tasks/projects) management endpoint
 * Temporarily simplified for Docker build
 */

import { NextRequest, NextResponse } from 'next/server';

// GET handler - Fetch user's Bricks
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Bricks API temporarily disabled for Docker build',
    bricks: []
  });
}

// POST handler - Create new Brick
export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Bricks creation temporarily disabled for Docker build',
    brick: null
  });
}

// PUT handler - Update Brick
export async function PUT(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Bricks update temporarily disabled for Docker build'
  });
}

// DELETE handler - Delete Brick
export async function DELETE(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Bricks deletion temporarily disabled for Docker build'
  });
}