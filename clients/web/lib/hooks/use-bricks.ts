'use client';

import { useCallback, useEffect } from 'react';
import { useAuthContext } from '@/lib/providers/auth-provider';
import { bricksAPI, Brick, Quanta, CreateBrickRequest, UpdateBrickRequest, CreateQuantaRequest, UpdateQuantaRequest } from '@/lib/api/bricks';
import { useUserDataCache } from './use-cached-query';
import { toast } from 'react-hot-toast';

export function useBricks() {
  const { user } = useAuthContext();

  // Cached queries for bricks and quantas
  const bricksQuery = useUserDataCache(
    'bricks',
    user?.id || '',
    () => user ? bricksAPI.getUserBricks(user.id) : Promise.resolve([]),
    {
      cacheTTL: 10 * 60 * 1000, // 10 minutes for bricks
      enableOffline: true,
      compress: true, // Compress brick data
    }
  );

  const quantasQuery = useUserDataCache(
    'quantas',
    user?.id || '',
    () => user ? bricksAPI.getUserQuantas(user.id) : Promise.resolve([]),
    {
      cacheTTL: 10 * 60 * 1000, // 10 minutes for quantas
      enableOffline: true,
      compress: true, // Compress quanta data
    }
  );

  const bricks = bricksQuery.data || [];
  const quantas = quantasQuery.data || [];
  const isLoading = bricksQuery.isLoading || quantasQuery.isLoading;
  const selectedBrick = null; // This would need to be managed separately if needed

  // Combined loading state
  const isLoadingAny = bricksQuery.isLoading || quantasQuery.isLoading;
  const hasError = bricksQuery.error || quantasQuery.error;

  // Trigger refresh when user becomes available
  useEffect(() => {
    if (user?.id && !bricksQuery.data && !quantasQuery.data && !isLoadingAny) {
      // User just became available and we don't have data yet, refresh
      bricksQuery.refresh();
      quantasQuery.refresh();
    }
  }, [user?.id, bricksQuery, quantasQuery, bricksQuery.data, quantasQuery.data, isLoadingAny]);

  // === BRICK OPERATIONS ===

  const createBrick = useCallback(async (brickData: CreateBrickRequest) => {
    if (!user) {
      toast.error('You must be logged in to create bricks');
      return null;
    }

    try {
      const newBrick = await bricksAPI.createBrick(user.id, brickData);

      // Invalidate bricks cache to refresh data
      bricksQuery.invalidate();

      toast.success('Brick created successfully!');
      return newBrick;
    } catch (error) {
      console.error('Failed to create brick:', error);
      toast.error('Failed to create brick');
      return null;
    }
  }, [user, bricksQuery]);

  const updateBrick = useCallback(async (brickId: string, updates: UpdateBrickRequest) => {
    try {
      const updatedBrick = await bricksAPI.updateBrick(brickId, updates);

      // Invalidate bricks cache to refresh data
      bricksQuery.invalidate();

      toast.success('Brick updated successfully!');
      return updatedBrick;
    } catch (error) {
      console.error('Failed to update brick:', error);
      toast.error('Failed to update brick');
      return null;
    }
  }, [bricksQuery]);

  const deleteBrick = useCallback(async (brickId: string) => {
    try {
      await bricksAPI.deleteBrick(brickId);

      // Invalidate both bricks and quantas caches since deleting a brick affects quantas
      bricksQuery.invalidate();
      quantasQuery.invalidate();

      toast.success('Brick deleted successfully!');
    } catch (error) {
      console.error('Failed to delete brick:', error);
      toast.error('Failed to delete brick');
    }
  }, [bricksQuery, quantasQuery]);

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
      const newQuanta = await bricksAPI.createQuanta(user.id, quantaData);

      // Invalidate quantas cache to refresh data
      quantasQuery.invalidate();

      toast.success('Quanta created successfully!');
      return newQuanta;
    } catch (error) {
      console.error('Failed to create quanta:', error);
      toast.error('Failed to create quanta');
      return null;
    }
  }, [user, quantasQuery]);

  const updateQuanta = useCallback(async (quantaId: string, updates: UpdateQuantaRequest) => {
    try {
      const updatedQuanta = await bricksAPI.updateQuanta(quantaId, updates);

      // Invalidate quantas cache to refresh data
      quantasQuery.invalidate();

      toast.success('Quanta updated successfully!');
      return updatedQuanta;
    } catch (error) {
      console.error('Failed to update quanta:', error);
      toast.error('Failed to update quanta');
      return null;
    }
  }, [quantasQuery]);

  const deleteQuanta = useCallback(async (quantaId: string) => {
    try {
      await bricksAPI.deleteQuanta(quantaId);

      // Invalidate quantas cache to refresh data
      quantasQuery.invalidate();

      toast.success('Quanta deleted successfully!');
    } catch (error) {
      console.error('Failed to delete quanta:', error);
      toast.error('Failed to delete quanta');
    }
  }, [quantasQuery]);

  const completeQuanta = useCallback(async (quantaId: string) => {
    try {
      const updatedQuanta = await bricksAPI.completeQuanta(quantaId);

      // Invalidate both caches since completing quantas affects brick progress
      bricksQuery.invalidate();
      quantasQuery.invalidate();

      toast.success('Quanta completed! 🎉');
      return updatedQuanta;
    } catch (error) {
      console.error('Failed to complete quanta:', error);
      toast.error('Failed to complete quanta');
      return null;
    }
  }, [bricksQuery, quantasQuery]);

  const reorderQuantas = useCallback(async (quantaIds: string[]) => {
    try {
      await bricksAPI.reorderQuantas(quantaIds);

      // Invalidate quantas cache to refresh data
      quantasQuery.invalidate();

      toast.success('Quantas reordered successfully!');
    } catch (error) {
      console.error('Failed to reorder quantas:', error);
      toast.error('Failed to reorder quantas');
    }
  }, [quantasQuery]);

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
      brick.personalization_tags?.some((tag: string) => tag.toLowerCase().includes(lowercaseQuery))
    );
  }, [bricks]);

  const setSelectedBrick = useCallback((brick: Brick | null) => {
    // For now, this is a no-op since we're using cached queries
    // In the future, this could be used for more complex state management
    console.log('Selected brick:', brick?.id);
  }, []);

  return {
    // State
    bricks,
    quantas,
    selectedBrick,
    isLoading,
    isLoadingAny,
    hasError,

    // Cache status
    bricksCache: {
      isStale: bricksQuery.isStale,
      lastFetched: bricksQuery.lastFetched,
      error: bricksQuery.error,
    },
    quantasCache: {
      isStale: quantasQuery.isStale,
      lastFetched: quantasQuery.lastFetched,
      error: quantasQuery.error,
    },

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
    loadUserData: bricksQuery.refresh, // Use cache refresh instead

    // Filters and search
    getBricksByCategory,
    getBricksByStatus,
    getBricksByPriority,
    searchBricks,
  };
}
