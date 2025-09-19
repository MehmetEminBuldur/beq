import { supabase } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/types';

type Tables = Database['public']['Tables'];
type ProfileRow = Tables['profiles']['Row'];
type ProfileInsert = Tables['profiles']['Insert'];
type ProfileUpdate = Tables['profiles']['Update'];

type BrickRow = Tables['bricks']['Row'];
type BrickInsert = Tables['bricks']['Insert'];
type BrickUpdate = Tables['bricks']['Update'];

type QuantaRow = Tables['quantas']['Row'];
type QuantaInsert = Tables['quantas']['Insert'];
type QuantaUpdate = Tables['quantas']['Update'];

// Profile CRUD Operations
export class ProfileService {
  static async getProfile(userId: string): Promise<ProfileRow | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      throw new Error(error.message);
    }

    return data;
  }

  static async updateProfile(userId: string, updates: ProfileUpdate): Promise<ProfileRow> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw new Error(error.message);
    }

    return data;
  }

  static async createProfile(profile: ProfileInsert): Promise<ProfileRow> {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      throw new Error(error.message);
    }

    return data;
  }
}

// Brick CRUD Operations
export class BrickService {
  static async getBricks(userId: string): Promise<BrickRow[]> {
    const { data, error } = await supabase
      .from('bricks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bricks:', error);
      throw new Error(error.message);
    }

    return data || [];
  }

  static async getBrick(brickId: string): Promise<BrickRow | null> {
    const { data, error } = await supabase
      .from('bricks')
      .select('*')
      .eq('id', brickId)
      .single();

    if (error) {
      console.error('Error fetching brick:', error);
      throw new Error(error.message);
    }

    return data;
  }

  static async createBrick(brick: BrickInsert): Promise<BrickRow> {
    const { data, error } = await supabase
      .from('bricks')
      .insert(brick)
      .select()
      .single();

    if (error) {
      console.error('Error creating brick:', error);
      throw new Error(error.message);
    }

    return data;
  }

  static async updateBrick(brickId: string, updates: BrickUpdate): Promise<BrickRow> {
    const { data, error } = await supabase
      .from('bricks')
      .update(updates)
      .eq('id', brickId)
      .select()
      .single();

    if (error) {
      console.error('Error updating brick:', error);
      throw new Error(error.message);
    }

    return data;
  }

  static async deleteBrick(brickId: string): Promise<void> {
    const { error } = await supabase
      .from('bricks')
      .delete()
      .eq('id', brickId);

    if (error) {
      console.error('Error deleting brick:', error);
      throw new Error(error.message);
    }
  }

  static async getBricksByStatus(userId: string, status: string): Promise<BrickRow[]> {
    const { data, error } = await supabase
      .from('bricks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .order('priority', { ascending: false });

    if (error) {
      console.error('Error fetching bricks by status:', error);
      throw new Error(error.message);
    }

    return data || [];
  }
}

// Quanta CRUD Operations
export class QuantaService {
  static async getQuantas(brickId: string): Promise<QuantaRow[]> {
    const { data, error } = await supabase
      .from('quantas')
      .select('*')
      .eq('brick_id', brickId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching quantas:', error);
      throw new Error(error.message);
    }

    return data || [];
  }

  static async getQuanta(quantaId: string): Promise<QuantaRow | null> {
    const { data, error } = await supabase
      .from('quantas')
      .select('*')
      .eq('id', quantaId)
      .single();

    if (error) {
      console.error('Error fetching quanta:', error);
      throw new Error(error.message);
    }

    return data;
  }

  static async createQuanta(quanta: QuantaInsert): Promise<QuantaRow> {
    const { data, error } = await supabase
      .from('quantas')
      .insert(quanta)
      .select()
      .single();

    if (error) {
      console.error('Error creating quanta:', error);
      throw new Error(error.message);
    }

    return data;
  }

  static async updateQuanta(quantaId: string, updates: QuantaUpdate): Promise<QuantaRow> {
    const { data, error } = await supabase
      .from('quantas')
      .update(updates)
      .eq('id', quantaId)
      .select()
      .single();

    if (error) {
      console.error('Error updating quanta:', error);
      throw new Error(error.message);
    }

    return data;
  }

  static async deleteQuanta(quantaId: string): Promise<void> {
    const { error } = await supabase
      .from('quantas')
      .delete()
      .eq('id', quantaId);

    if (error) {
      console.error('Error deleting quanta:', error);
      throw new Error(error.message);
    }
  }

  static async getUserQuantas(userId: string): Promise<QuantaRow[]> {
    const { data, error } = await supabase
      .from('quantas')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user quantas:', error);
      throw new Error(error.message);
    }

    return data || [];
  }
}

// Database Test Utilities
export class DatabaseTestService {
  static async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count(*)')
        .limit(1);

      return !error;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  static async testCRUDOperations(userId: string): Promise<{
    success: boolean;
    results: Record<string, any>;
    errors: string[];
  }> {
    const results: Record<string, any> = {};
    const errors: string[] = [];

    try {
      // Test Profile operations
      console.log('Testing Profile CRUD...');

      // Read profile
      const profile = await ProfileService.getProfile(userId);
      results.profileRead = !!profile;

      if (profile) {
        // Update profile
        const updatedProfile = await ProfileService.updateProfile(userId, {
          timezone: 'America/New_York'
        });
        results.profileUpdate = updatedProfile.timezone === 'America/New_York';
      }

      // Test Brick operations
      console.log('Testing Brick CRUD...');

      // Create brick
      const newBrick = await BrickService.createBrick({
        user_id: userId,
        title: 'Test Brick',
        description: 'A test brick for CRUD operations',
        category: 'work',
        priority: 'medium',
        estimated_duration_minutes: 60
      });
      results.brickCreate = !!newBrick.id;

      // Read brick
      const readBrick = await BrickService.getBrick(newBrick.id);
      results.brickRead = readBrick?.title === 'Test Brick';

      // Update brick
      const updatedBrick = await BrickService.updateBrick(newBrick.id, {
        title: 'Updated Test Brick',
        completion_percentage: 50
      });
      results.brickUpdate = updatedBrick.title === 'Updated Test Brick';

      // Test Quanta operations
      console.log('Testing Quanta CRUD...');

      // Create quanta
      const newQuanta = await QuantaService.createQuanta({
        brick_id: newBrick.id,
        user_id: userId,
        title: 'Test Quanta',
        description: 'A test quanta for CRUD operations',
        estimated_duration_minutes: 30,
        priority: 'medium'
      });
      results.quantaCreate = !!newQuanta.id;

      // Read quanta
      const readQuanta = await QuantaService.getQuanta(newQuanta.id);
      results.quantaRead = readQuanta?.title === 'Test Quanta';

      // Update quanta
      const updatedQuanta = await QuantaService.updateQuanta(newQuanta.id, {
        title: 'Updated Test Quanta',
        completion_percentage: 75
      });
      results.quantaUpdate = updatedQuanta.title === 'Updated Test Quanta';

      // Test list operations
      const userBricks = await BrickService.getBricks(userId);
      results.bricksList = userBricks.length > 0;

      const brickQuantas = await QuantaService.getQuantas(newBrick.id);
      results.quantasList = brickQuantas.length > 0;

      // Clean up test data
      console.log('Cleaning up test data...');
      await QuantaService.deleteQuanta(newQuanta.id);
      results.quantaDelete = true;

      await BrickService.deleteBrick(newBrick.id);
      results.brickDelete = true;

      return {
        success: true,
        results,
        errors
      };

    } catch (error) {
      errors.push(`CRUD test failed: ${error}`);
      console.error('CRUD test error:', error);

      return {
        success: false,
        results,
        errors
      };
    }
  }

  static async validateDatabaseSchema(): Promise<{
    valid: boolean;
    tables: string[];
    errors: string[];
  }> {
    const errors: string[] = [];
    const tables: string[] = [];

    try {
      // Check if main tables exist by attempting to query them
      const tablesToCheck = ['profiles', 'bricks', 'quantas', 'conversations', 'messages'];

      for (const tableName of tablesToCheck) {
        try {
          const { error } = await supabase
            .from(tableName as any)
            .select('*')
            .limit(1);

          if (!error) {
            tables.push(tableName);
          } else {
            errors.push(`Table ${tableName} not accessible: ${error.message}`);
          }
        } catch (err) {
          errors.push(`Table ${tableName} check failed: ${err}`);
        }
      }

      return {
        valid: errors.length === 0,
        tables,
        errors
      };

    } catch (error) {
      errors.push(`Schema validation failed: ${error}`);
      return {
        valid: false,
        tables,
        errors
      };
    }
  }
}