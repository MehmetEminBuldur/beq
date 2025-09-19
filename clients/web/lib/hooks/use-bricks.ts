'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/lib/providers/auth-provider';
import { bricksAPI, Brick, Quanta, CreateBrickRequest, UpdateBrickRequest, CreateQuantaRequest, UpdateQuantaRequest } from '@/lib/api/bricks';
import { toast } from 'react-hot-toast';

export function useBricks() {
  const { user } = useAuthContext();
  const [bricks, setBricks] = useState<Brick[]>([]);
  const [quantas, setQuantas] = useState<Quanta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBrick, setSelectedBrick] = useState<Brick | null>(null);

  // Load user bricks and quantas
  const loadUserData = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const [userBricks, userQuantas] = await Promise.all([
        bricksAPI.getUserBricks(user.id),
        bricksAPI.getUserQuantas(user.id),
      ]);

      setBricks(userBricks);
      setQuantas(userQuantas);
    } catch (error) {
      console.error('Failed to load user data:', error);
      toast.error('Failed to load your tasks');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load data when user changes
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // === BRICK OPERATIONS ===

  const createBrick = useCallback(async (brickData: CreateBrickRequest) => {
    if (!user) {
      toast.error('You must be logged in to create bricks');
      return null;
    }

    try {
      setIsLoading(true);
      const newBrick = await bricksAPI.createBrick(user.id, brickData);
      setBricks(prev => [newBrick, ...prev]);
      toast.success('Brick created successfully!');
      return newBrick;
    } catch (error) {
      console.error('Failed to create brick:', error);
      toast.error('Failed to create brick');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const updateBrick = useCallback(async (brickId: string, updates: UpdateBrickRequest) => {
    try {
      setIsLoading(true);
      const updatedBrick = await bricksAPI.updateBrick(brickId, updates);

      setBricks(prev => prev.map(brick =>
        brick.id === brickId ? updatedBrick : brick
      ));

      // Update selected brick if it's the one being updated
      if (selectedBrick?.id === brickId) {
        setSelectedBrick(updatedBrick);
      }

      toast.success('Brick updated successfully!');
      return updatedBrick;
    } catch (error) {
      console.error('Failed to update brick:', error);
      toast.error('Failed to update brick');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [selectedBrick]);

  const deleteBrick = useCallback(async (brickId: string) => {
    try {
      setIsLoading(true);
      await bricksAPI.deleteBrick(brickId);

      setBricks(prev => prev.filter(brick => brick.id !== brickId));
      setQuantas(prev => prev.filter(quanta => quanta.brick_id !== brickId));

      // Clear selected brick if it's the one being deleted
      if (selectedBrick?.id === brickId) {
        setSelectedBrick(null);
      }

      toast.success('Brick deleted successfully!');
    } catch (error) {
      console.error('Failed to delete brick:', error);
      toast.error('Failed to delete brick');
    } finally {
      setIsLoading(false);
    }
  }, [selectedBrick]);

  const getBrickById = useCallback(async (brickId: string) => {
    try {
      const brick = await bricksAPI.getBrickById(brickId);
      return brick;
    } catch (error) {
      console.error('Failed to get brick:', error);
      return null;
    }
  }, []);

  // === QUANTA OPERATIONS ===

  const createQuanta = useCallback(async (quantaData: CreateQuantaRequest) => {
    if (!user) {
      toast.error('You must be logged in to create quantas');
      return null;
    }

    try {
      setIsLoading(true);
      const newQuanta = await bricksAPI.createQuanta(user.id, quantaData);

      // Reload quantas to get updated data with joined brick info
      const updatedQuantas = await bricksAPI.getUserQuantas(user.id);
      setQuantas(updatedQuantas);

      toast.success('Quanta created successfully!');
      return newQuanta;
    } catch (error) {
      console.error('Failed to create quanta:', error);
      toast.error('Failed to create quanta');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const updateQuanta = useCallback(async (quantaId: string, updates: UpdateQuantaRequest) => {
    try {
      setIsLoading(true);
      const updatedQuanta = await bricksAPI.updateQuanta(quantaId, updates);

      // Reload quantas to get updated data
      if (user) {
        const updatedQuantas = await bricksAPI.getUserQuantas(user.id);
        setQuantas(updatedQuantas);
      }

      toast.success('Quanta updated successfully!');
      return updatedQuanta;
    } catch (error) {
      console.error('Failed to update quanta:', error);
      toast.error('Failed to update quanta');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const deleteQuanta = useCallback(async (quantaId: string) => {
    try {
      setIsLoading(true);
      await bricksAPI.deleteQuanta(quantaId);

      setQuantas(prev => prev.filter(quanta => quanta.id !== quantaId));

      toast.success('Quanta deleted successfully!');
    } catch (error) {
      console.error('Failed to delete quanta:', error);
      toast.error('Failed to delete quanta');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const completeQuanta = useCallback(async (quantaId: string) => {
    try {
      setIsLoading(true);
      const updatedQuanta = await bricksAPI.completeQuanta(quantaId);

      // Reload both bricks and quantas to reflect progress changes
      await loadUserData();

      toast.success('Quanta completed! 🎉');
      return updatedQuanta;
    } catch (error) {
      console.error('Failed to complete quanta:', error);
      toast.error('Failed to complete quanta');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [loadUserData]);

  const reorderQuantas = useCallback(async (quantaIds: string[]) => {
    try {
      await bricksAPI.reorderQuantas(quantaIds);

      // Reload quantas to get updated order
      if (user) {
        const updatedQuantas = await bricksAPI.getUserQuantas(user.id);
        setQuantas(updatedQuantas);
      }

      toast.success('Quantas reordered successfully!');
    } catch (error) {
      console.error('Failed to reorder quantas:', error);
      toast.error('Failed to reorder quantas');
    }
  }, [user]);

  // === UTILITY FUNCTIONS ===

  const getBrickQuantas = useCallback(async (brickId: string) => {
    try {
      const brickQuantas = await bricksAPI.getBrickQuantas(brickId);
      return brickQuantas;
    } catch (error) {
      console.error('Failed to get brick quantas:', error);
      return [];
    }
  }, []);

  const getBrickStats = useCallback(async (brickId: string) => {
    try {
      const stats = await bricksAPI.getBrickStats(brickId);
      return stats;
    } catch (error) {
      console.error('Failed to get brick stats:', error);
      return {
        totalQuantas: 0,
        completedQuantas: 0,
        inProgressQuantas: 0,
        notStartedQuantas: 0,
        progressPercentage: 0,
        totalEstimatedTime: 0,
        totalActualTime: 0,
      };
    }
  }, []);

  // === FILTERS AND SEARCH ===

  const getBricksByCategory = useCallback((category: string) => {
    return bricks.filter(brick => brick.category === category);
  }, [bricks]);

  const getBricksByStatus = useCallback((status: string) => {
    return bricks.filter(brick => brick.status === status);
  }, [bricks]);

  const getBricksByPriority = useCallback((priority: string) => {
    return bricks.filter(brick => brick.priority === priority);
  }, [bricks]);

  const searchBricks = useCallback((query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return bricks.filter(brick =>
      brick.title.toLowerCase().includes(lowercaseQuery) ||
      brick.description?.toLowerCase().includes(lowercaseQuery) ||
      brick.category.toLowerCase().includes(lowercaseQuery) ||
      brick.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }, [bricks]);

  return {
    // State
    bricks,
    quantas,
    selectedBrick,
    isLoading,

    // Brick operations
    createBrick,
    updateBrick,
    deleteBrick,
    getBrickById,
    setSelectedBrick,

    // Quanta operations
    createQuanta,
    updateQuanta,
    deleteQuanta,
    completeQuanta,
    reorderQuantas,
    getBrickQuantas,

    // Utility functions
    getBrickStats,
    loadUserData,

    // Filters and search
    getBricksByCategory,
    getBricksByStatus,
    getBricksByPriority,
    searchBricks,
  };
}
