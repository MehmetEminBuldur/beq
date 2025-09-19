import { supabase } from '@/lib/supabase/client';

export interface Brick {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'postponed' | 'on_hold';
  estimated_duration_minutes: number;
  actual_duration_minutes?: number;
  target_date?: string;
  deadline?: string;
  completion_percentage: number;
  recurrence_type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  recurrence_interval?: number;
  recurrence_end_date?: string;
  ai_difficulty_rating?: number;
  personalization_tags?: string[];
  learning_objectives?: string[];
  time_spent_minutes: number;
  sessions_count: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface Quanta {
  id: string;
  brick_id: string;
  user_id: string;
  title: string;
  description?: string;
  estimated_duration_minutes: number;
  actual_duration_minutes?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
  order_index: number;
  depends_on_quantas?: string[];
  prerequisite_resources?: string[];
  completion_percentage: number;
  notes?: string;
  ai_suggestions?: string[];
  scheduled_start?: string;
  scheduled_end?: string;
  actual_start?: string;
  actual_end?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  brick?: {
    id: string;
    title: string;
    category: string;
    priority: string;
  };
}

export interface CreateBrickRequest {
  title: string;
  description?: string;
  category: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  estimated_duration_minutes: number;
  deadline?: string;
}

export interface UpdateBrickRequest {
  title?: string;
  description?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'postponed' | 'on_hold';
  estimated_duration_minutes?: number;
  actual_duration_minutes?: number;
  completion_percentage?: number;
  deadline?: string;
  target_date?: string;
  completed_at?: string;
}

export interface CreateQuantaRequest {
  brick_id: string;
  title: string;
  description?: string;
  estimated_duration_minutes: number;
  order_index?: number;
}

export interface UpdateQuantaRequest {
  title?: string;
  description?: string;
  estimated_duration_minutes?: number;
  status?: 'not_started' | 'in_progress' | 'completed';
  actual_duration_minutes?: number;
  completed_at?: string;
  order_index?: number;
}

class BricksAPI {
  // === BRICKS CRUD OPERATIONS ===

  async getUserBricks(userId: string): Promise<Brick[]> {
    try {
      const { data, error } = await supabase
        .from('bricks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get user bricks error:', error);
      throw error;
    }
  }

  async getBrickById(brickId: string): Promise<Brick | null> {
    try {
      const { data, error } = await supabase
        .from('bricks')
        .select('*')
        .eq('id', brickId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows returned
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Get brick by ID error:', error);
      throw error;
    }
  }

  async createBrick(userId: string, brickData: CreateBrickRequest): Promise<Brick> {
    try {
      const brickInsertData = {
        user_id: userId,
        ...brickData,
        status: brickData.priority === 'urgent' ? 'in_progress' : 'pending',
        completion_percentage: 0,
        time_spent_minutes: 0,
        sessions_count: 0,
        recurrence_type: 'none',
      } as any;

      const { data, error } = await supabase
        .from('bricks')
        .insert(brickInsertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create brick error:', error);
      throw error;
    }
  }

  async updateBrick(brickId: string, updates: UpdateBrickRequest): Promise<Brick> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('bricks')
        .update(updateData)
        .eq('id', brickId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update brick error:', error);
      throw error;
    }
  }

  async deleteBrick(brickId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('bricks')
        .delete()
        .eq('id', brickId);

      if (error) throw error;
    } catch (error) {
      console.error('Delete brick error:', error);
      throw error;
    }
  }

  // === QUANTAS CRUD OPERATIONS ===

  async getBrickQuantas(brickId: string): Promise<Quanta[]> {
    try {
      const { data, error } = await supabase
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
        .eq('brick_id', brickId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get brick quantas error:', error);
      throw error;
    }
  }

  async getUserQuantas(userId: string): Promise<Quanta[]> {
    try {
      // First get all quantas that belong to bricks owned by this user
      const { data: userBricks, error: bricksError } = await supabase
        .from('bricks')
        .select('id')
        .eq('user_id', userId);

      if (bricksError) throw bricksError;

      if (!userBricks || userBricks.length === 0) {
        return [];
      }

      const brickIds = userBricks.map(brick => brick.id);

      const { data, error } = await supabase
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
        .in('brick_id', brickIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match the expected interface
      return (data || []).map(quanta => ({
        ...quanta,
        user_id: userId, // Add user_id from the brick's user_id
        priority: 'medium', // Default priority since it's missing in current DB
        completion_percentage: 0, // Default completion percentage
        depends_on_quantas: [],
        prerequisite_resources: [],
        notes: quanta.description || '', // Use description as notes
        ai_suggestions: [],
      }));
    } catch (error) {
      console.error('Get user quantas error:', error);
      throw error;
    }
  }

  async getQuantaById(quantaId: string): Promise<Quanta | null> {
    try {
      const { data, error } = await supabase
        .from('quantas')
        .select(`
          *,
          bricks (
            id,
            title,
            category,
            priority,
            user_id
          )
        `)
        .eq('id', quantaId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows returned
        throw error;
      }

      // Transform the data to match the expected interface
      return {
        ...data,
        user_id: data.bricks?.user_id, // Get user_id from the joined brick
        priority: 'medium', // Default priority
        completion_percentage: 0, // Default completion percentage
        depends_on_quantas: [],
        prerequisite_resources: [],
        notes: data.description || '',
        ai_suggestions: [],
      };
    } catch (error) {
      console.error('Get quanta by ID error:', error);
      throw error;
    }
  }

  async createQuanta(userId: string, quantaData: CreateQuantaRequest): Promise<Quanta> {
    try {
      // Verify the brick belongs to the user
      const { data: brick, error: brickError } = await supabase
        .from('bricks')
        .select('id, user_id')
        .eq('id', quantaData.brick_id)
        .eq('user_id', userId)
        .single();

      if (brickError || !brick) {
        throw new Error('Brick not found or access denied');
      }

      // Get the highest order index for this brick
      const { data: existingQuantas } = await supabase
        .from('quantas')
        .select('order_index')
        .eq('brick_id', quantaData.brick_id)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrderIndex = existingQuantas && existingQuantas.length > 0
        ? existingQuantas[0].order_index + 1
        : 0;

      const { data, error } = await supabase
        .from('quantas')
        .insert({
          brick_id: quantaData.brick_id,
          title: quantaData.title,
          description: quantaData.description,
          estimated_duration_minutes: quantaData.estimated_duration_minutes,
          order_index: quantaData.order_index ?? nextOrderIndex,
          status: 'not_started',
        })
        .select()
        .single();

      if (error) throw error;

      // Transform the data to match the expected interface
      return {
        ...data,
        user_id: userId,
        priority: 'medium',
        completion_percentage: 0,
        depends_on_quantas: [],
        prerequisite_resources: [],
        notes: data.description || '',
        ai_suggestions: [],
      };
    } catch (error) {
      console.error('Create quanta error:', error);
      throw error;
    }
  }

  async updateQuanta(quantaId: string, updates: UpdateQuantaRequest): Promise<Quanta> {
    try {
      // Prepare update data, mapping status values
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.estimated_duration_minutes !== undefined) updateData.estimated_duration_minutes = updates.estimated_duration_minutes;
      if (updates.status !== undefined) {
        // Map the interface status to database status
        if (updates.status === 'not_started') {
          updateData.status = 'not_started';
        } else if (updates.status === 'in_progress') {
          updateData.status = 'in_progress';
        } else if (updates.status === 'completed') {
          updateData.status = 'completed';
          updateData.completed_at = new Date().toISOString();
        }
      }
      if (updates.order_index !== undefined) updateData.order_index = updates.order_index;

      const { data, error } = await supabase
        .from('quantas')
        .update(updateData)
        .eq('id', quantaId)
        .select()
        .single();

      if (error) throw error;

      // Transform the data to match the expected interface
      return {
        ...data,
        user_id: data.brick_id ? 'unknown' : 'unknown', // Will be set by caller if needed
        priority: 'medium',
        completion_percentage: 0,
        depends_on_quantas: [],
        prerequisite_resources: [],
        notes: data.description || '',
        ai_suggestions: [],
      };
    } catch (error) {
      console.error('Update quanta error:', error);
      throw error;
    }
  }

  async deleteQuanta(quantaId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('quantas')
        .delete()
        .eq('id', quantaId);

      if (error) throw error;
    } catch (error) {
      console.error('Delete quanta error:', error);
      throw error;
    }
  }

  async reorderQuantas(quantaIds: string[]): Promise<void> {
    try {
      // Update order_index for each quanta
      const updates = quantaIds.map((id, index) =>
        supabase
          .from('quantas')
          .update({
            order_index: index,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter(result => result.error);

      if (errors.length > 0) {
        throw new Error('Failed to reorder some quantas');
      }
    } catch (error) {
      console.error('Reorder quantas error:', error);
      throw error;
    }
  }

  // === UTILITY METHODS ===

  async completeQuanta(quantaId: string): Promise<Quanta> {
    try {
      const { data, error } = await supabase
        .from('quantas')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', quantaId)
        .select()
        .single();

      if (error) throw error;

      // Update brick progress when quanta is completed
      await this.updateBrickProgress(data.brick_id);

      return data;
    } catch (error) {
      console.error('Complete quanta error:', error);
      throw error;
    }
  }

  async updateBrickProgress(brickId: string): Promise<void> {
    try {
      // Get all quantas for this brick
      const quantas = await this.getBrickQuantas(brickId);

      if (quantas.length === 0) return;

      const completedQuantas = quantas.filter(q => q.status === 'completed');
      const progressPercentage = Math.round((completedQuantas.length / quantas.length) * 100);

      // Calculate actual duration
      const actualDuration = quantas.reduce((total, q) => {
        return total + (q.actual_duration_minutes || 0);
      }, 0);

      const status = progressPercentage === 100 ? 'completed' :
                    progressPercentage > 0 ? 'in_progress' : 'pending';

      await this.updateBrick(brickId, {
        completion_percentage: progressPercentage,
        actual_duration_minutes: actualDuration,
        status: status,
        completed_at: status === 'completed' ? new Date().toISOString() : undefined,
      });
    } catch (error) {
      console.error('Update brick progress error:', error);
      // Don't throw here as this is a background operation
    }
  }

  async getBrickStats(brickId: string): Promise<{
    totalQuantas: number;
    completedQuantas: number;
    inProgressQuantas: number;
    notStartedQuantas: number;
    progressPercentage: number;
    totalEstimatedTime: number;
    totalActualTime: number;
  }> {
    try {
      const quantas = await this.getBrickQuantas(brickId);

      const stats = {
        totalQuantas: quantas.length,
        completedQuantas: quantas.filter(q => q.status === 'completed').length,
        inProgressQuantas: quantas.filter(q => q.status === 'in_progress').length,
        notStartedQuantas: quantas.filter(q => q.status === 'not_started').length,
        progressPercentage: 0,
        totalEstimatedTime: quantas.reduce((total, q) => total + q.estimated_duration_minutes, 0),
        totalActualTime: quantas.reduce((total, q) => total + (q.actual_duration_minutes || 0), 0),
      };

      stats.progressPercentage = stats.totalQuantas > 0
        ? Math.round((stats.completedQuantas / stats.totalQuantas) * 100)
        : 0;

      return stats;
    } catch (error) {
      console.error('Get brick stats error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const bricksAPI = new BricksAPI();
