/**
 * Bricks (tasks/projects) management endpoint
 * Vercel serverless function replacement for orchestrator Bricks API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Types
interface Brick {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'not_started' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  estimated_duration_minutes?: number;
  actual_duration_minutes?: number;
  deadline?: string;
  start_date?: string;
  completion_date?: string;
  progress_percentage: number;
  tags: string[];
  quantas: Quanta[]; // Sub-tasks
  dependencies: string[]; // Other Brick IDs
  resources: string[]; // Resource URLs or IDs
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface Quanta {
  id: string;
  brick_id: string;
  title: string;
  description?: string;
  estimated_duration_minutes: number;
  actual_duration_minutes?: number;
  status: 'not_started' | 'in_progress' | 'completed';
  order_index: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

interface CreateBrickRequest {
  title: string;
  description?: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_duration_minutes?: number;
  deadline?: string;
  tags?: string[];
  quantas?: Omit<Quanta, 'id' | 'brick_id' | 'created_at' | 'updated_at'>[];
}

interface UpdateBrickRequest {
  title?: string;
  description?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'not_started' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  estimated_duration_minutes?: number;
  actual_duration_minutes?: number;
  deadline?: string;
  progress_percentage?: number;
  tags?: string[];
  notes?: string;
}

// Utility functions
function calculateBrickProgress(quantas: Quanta[]): number {
  if (quantas.length === 0) return 0;
  
  const completedQuantas = quantas.filter(q => q.status === 'completed').length;
  return Math.round((completedQuantas / quantas.length) * 100);
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

// GET handler - Fetch user's Bricks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: user_id' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createServerComponentClient({ cookies });

    // Build query
    let query = supabase
      .from('bricks')
      .select(`
        *,
        quantas (*)
      `)
      .eq('user_id', userId);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: bricks, error } = await query;

    if (error) {
      console.error('Failed to fetch bricks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bricks' },
        { status: 500 }
      );
    }

    // Calculate progress for each brick
    const bricksWithProgress = (bricks || []).map(brick => ({
      ...brick,
      progress_percentage: calculateBrickProgress(brick.quantas || [])
    }));

    // Get total count for pagination
    const { count } = await supabase
      .from('bricks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return NextResponse.json({
      success: true,
      bricks: bricksWithProgress,
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit
      },
      filters: {
        status,
        category,
        priority
      },
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch bricks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bricks' },
      { status: 500 }
    );
  }
}

// POST handler - Create new Brick
export async function POST(request: NextRequest) {
  try {
    const body: CreateBrickRequest & { user_id: string } = await request.json();

    // Basic validation
    if (!body.user_id || !body.title) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id and title' },
        { status: 400 }
      );
    }

    if (body.title.length < 3 || body.title.length > 200) {
      return NextResponse.json(
        { error: 'Title must be between 3 and 200 characters' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createServerComponentClient({ cookies });

    const brickId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Create brick
    const brick: Omit<Brick, 'quantas'> = {
      id: brickId,
      user_id: body.user_id,
      title: body.title.trim(),
      description: body.description?.trim(),
      category: body.category || 'general',
      priority: body.priority || 'medium',
      status: 'not_started',
      estimated_duration_minutes: body.estimated_duration_minutes,
      progress_percentage: 0,
      tags: body.tags || [],
      dependencies: [],
      resources: [],
      deadline: body.deadline,
      created_at: now,
      updated_at: now
    };

    const { data: createdBrick, error: brickError } = await supabase
      .from('bricks')
      .insert(brick)
      .select()
      .single();

    if (brickError) {
      console.error('Failed to create brick:', brickError);
      return NextResponse.json(
        { error: 'Failed to create brick' },
        { status: 500 }
      );
    }

    // Create quantas if provided
    let createdQuantas: Quanta[] = [];
    if (body.quantas && body.quantas.length > 0) {
      const quantas = body.quantas.map((quanta, index) => ({
        id: crypto.randomUUID(),
        brick_id: brickId,
        title: quanta.title.trim(),
        description: quanta.description?.trim(),
        estimated_duration_minutes: quanta.estimated_duration_minutes,
        status: 'not_started' as const,
        order_index: quanta.order_index ?? index,
        created_at: now,
        updated_at: now
      }));

      const { data: quantaData, error: quantaError } = await supabase
        .from('quantas')
        .insert(quantas)
        .select();

      if (quantaError) {
        console.error('Failed to create quantas:', quantaError);
        // Delete the brick if quantas failed
        await supabase.from('bricks').delete().eq('id', brickId);
        return NextResponse.json(
          { error: 'Failed to create quantas' },
          { status: 500 }
        );
      }

      createdQuantas = quantaData || [];
    }

    const fullBrick: Brick = {
      ...createdBrick,
      quantas: createdQuantas
    };

    console.log(`Created brick "${body.title}" for user ${body.user_id} with ${createdQuantas.length} quantas`);

    return NextResponse.json({
      success: true,
      brick: fullBrick,
      message: 'Brick created successfully',
      timestamp: new Date().toISOString()
    }, { status: 201 });

  } catch (error) {
    console.error('Failed to create brick:', error);
    return NextResponse.json(
      { error: 'Failed to create brick' },
      { status: 500 }
    );
  }
}

// PUT handler - Update existing Brick
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brickId = searchParams.get('id');
    const userId = searchParams.get('user_id');
    
    if (!brickId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters: id and user_id' },
        { status: 400 }
      );
    }

    const body: UpdateBrickRequest = await request.json();

    // Initialize Supabase client
    const supabase = createServerComponentClient({ cookies });

    // Verify brick exists and belongs to user
    const { data: existingBrick, error: fetchError } = await supabase
      .from('bricks')
      .select('*')
      .eq('id', brickId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingBrick) {
      return NextResponse.json(
        { error: 'Brick not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    };

    // Update the brick
    const { data: updatedBrick, error: updateError } = await supabase
      .from('bricks')
      .update(updateData)
      .eq('id', brickId)
      .eq('user_id', userId)
      .select(`
        *,
        quantas (*)
      `)
      .single();

    if (updateError) {
      console.error('Failed to update brick:', updateError);
      return NextResponse.json(
        { error: 'Failed to update brick' },
        { status: 500 }
      );
    }

    // Calculate updated progress
    const brickWithProgress = {
      ...updatedBrick,
      progress_percentage: calculateBrickProgress(updatedBrick.quantas || [])
    };

    console.log(`Updated brick ${brickId} for user ${userId}`);

    return NextResponse.json({
      success: true,
      brick: brickWithProgress,
      message: 'Brick updated successfully',
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('Failed to update brick:', error);
    return NextResponse.json(
      { error: 'Failed to update brick' },
      { status: 500 }
    );
  }
}

// DELETE handler - Delete Brick
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brickId = searchParams.get('id');
    const userId = searchParams.get('user_id');
    
    if (!brickId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters: id and user_id' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createServerComponentClient({ cookies });

    // Verify brick exists and belongs to user
    const { data: existingBrick, error: fetchError } = await supabase
      .from('bricks')
      .select('title')
      .eq('id', brickId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingBrick) {
      return NextResponse.json(
        { error: 'Brick not found' },
        { status: 404 }
      );
    }

    // Delete quantas first (due to foreign key constraints)
    await supabase
      .from('quantas')
      .delete()
      .eq('brick_id', brickId);

    // Delete the brick
    const { error: deleteError } = await supabase
      .from('bricks')
      .delete()
      .eq('id', brickId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Failed to delete brick:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete brick' },
        { status: 500 }
      );
    }

    console.log(`Deleted brick "${existingBrick.title}" (${brickId}) for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Brick deleted successfully',
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('Failed to delete brick:', error);
    return NextResponse.json(
      { error: 'Failed to delete brick' },
      { status: 500 }
    );
  }
}
