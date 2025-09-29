/**
 * Quantas (subtasks) management endpoint
 * Handles CRUD operations for quantas associated with bricks
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '@/lib/middleware/cors';

// Handle preflight OPTIONS request
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// GET handler - Fetch quantas for a brick
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brickId = searchParams.get('brick_id');
    const userId = searchParams.get('user_id');

    if (!brickId || !userId) {
      return NextResponse.json({
        error: 'Missing required parameters: brick_id and user_id'
      }, {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Use service role for server-side operations to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify the brick belongs to the user
    const { data: brick, error: brickError } = await supabase
      .from('bricks')
      .select('id, user_id')
      .eq('id', brickId)
      .eq('user_id', userId)
      .single();

    if (brickError || !brick) {
      return NextResponse.json({
        error: 'Brick not found or access denied'
      }, {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Fetch quantas for the brick
    const { data: quantas, error } = await supabase
      .from('quantas')
      .select('*')
      .eq('brick_id', brickId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching quantas:', error);
      return NextResponse.json({
        error: 'Failed to fetch quantas',
        details: error.message
      }, {
        status: 500,
        headers: corsHeaders,
      });
    }

    return NextResponse.json({
      success: true,
      quantas: quantas || []
    }, {
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('GET /api/v1/quantas error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500,
      headers: corsHeaders,
    });
  }
}

// POST handler - Create new Quanta
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, brick_id, title, description, estimated_duration_minutes, priority, ai_suggestions } = body;

    if (!user_id || !brick_id || !title) {
      return NextResponse.json({
        error: 'Missing required fields: user_id, brick_id, and title'
      }, {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Use service role for server-side operations to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify the brick belongs to the user
    const { data: brick, error: brickError } = await supabase
      .from('bricks')
      .select('id, user_id')
      .eq('id', brick_id)
      .eq('user_id', user_id)
      .single();

    if (brickError || !brick) {
      return NextResponse.json({
        error: 'Brick not found or access denied'
      }, {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Get the highest order index for this brick
    const { data: existingQuantas } = await supabase
      .from('quantas')
      .select('order_index')
      .eq('brick_id', brick_id)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrderIndex = existingQuantas && existingQuantas.length > 0
      ? existingQuantas[0].order_index + 1
      : 0;

    const quantaData = {
      brick_id,
      title,
      description: description || '',
      estimated_duration_minutes: estimated_duration_minutes || 30,
      status: 'not_started',
      order_index: nextOrderIndex
    };

    const { data: createdQuanta, error: quantaError } = await supabase
      .from('quantas')
      .insert(quantaData)
      .select()
      .single();

    if (quantaError) {
      console.error('Error creating quanta:', quantaError);
      return NextResponse.json({
        error: 'Failed to create quanta',
        details: quantaError.message
      }, {
        status: 500,
        headers: corsHeaders,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Quanta created successfully',
      quanta: createdQuanta
    }, {
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('POST /api/v1/quantas error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500,
      headers: corsHeaders,
    });
  }
}

// PUT handler - Update Quanta
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { quanta_id, user_id, updates } = body;

    if (!quanta_id || !user_id || !updates) {
      return NextResponse.json({
        error: 'Missing required fields: quanta_id, user_id, and updates'
      }, {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Use service role for server-side operations to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify the quanta belongs to the user
    const { data: quanta, error: quantaCheckError } = await supabase
      .from('quantas')
      .select('id, user_id')
      .eq('id', quanta_id)
      .eq('user_id', user_id)
      .single();

    if (quantaCheckError || !quanta) {
      return NextResponse.json({
        error: 'Quanta not found or access denied'
      }, {
        status: 404,
        headers: corsHeaders,
      });
    }

    const { data, error } = await supabase
      .from('quantas')
      .update(updates)
      .eq('id', quanta_id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating quanta:', error);
      return NextResponse.json({
        error: 'Failed to update quanta',
        details: error.message
      }, {
        status: 500,
        headers: corsHeaders,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Quanta updated successfully',
      quanta: data
    }, {
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('PUT /api/v1/quantas error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500,
      headers: corsHeaders,
    });
  }
}

// DELETE handler - Delete Quanta
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const quantaId = searchParams.get('quanta_id');
    const userId = searchParams.get('user_id');

    if (!quantaId || !userId) {
      return NextResponse.json({
        error: 'Missing required parameters: quanta_id and user_id'
      }, {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Use service role for server-side operations to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
      .from('quantas')
      .delete()
      .eq('id', quantaId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting quanta:', error);
      return NextResponse.json({
        error: 'Failed to delete quanta',
        details: error.message
      }, {
        status: 500,
        headers: corsHeaders,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Quanta deleted successfully'
    }, {
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('DELETE /api/v1/quantas error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500,
      headers: corsHeaders,
    });
  }
}
