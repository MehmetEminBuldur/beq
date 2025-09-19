'use client';

import { useState, useCallback } from 'react';
import { BrickService, QuantaService, ProfileService } from '@/lib/services/database';
import { useAuthContext } from '@/lib/providers/auth-provider';
import { toast } from 'react-hot-toast';

export function useDatabase() {
  const { user } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((error: any, operation: string) => {
    console.error(`Database ${operation} error:`, error);
    const message = error instanceof Error ? error.message : `${operation} failed`;
    setError(message);
    toast.error(message);
    throw error;
  }, []);

  const executeOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await operation();
      return result;
    } catch (error) {
      handleError(error, operationName);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, handleError]);

  // Profile operations
  const getProfile = useCallback(() => {
    return executeOperation(
      () => ProfileService.getProfile(user!.id),
      'get profile'
    );
  }, [executeOperation, user]);

  const updateProfile = useCallback((updates: any) => {
    return executeOperation(
      () => ProfileService.updateProfile(user!.id, updates),
      'update profile'
    );
  }, [executeOperation, user]);

  // Brick operations
  const getBricks = useCallback(() => {
    return executeOperation(
      () => BrickService.getBricks(user!.id),
      'get bricks'
    );
  }, [executeOperation, user]);

  const getBrick = useCallback((brickId: string) => {
    return executeOperation(
      () => BrickService.getBrick(brickId),
      'get brick'
    );
  }, [executeOperation]);

  const createBrick = useCallback((brickData: any) => {
    return executeOperation(
      () => BrickService.createBrick({ ...brickData, user_id: user!.id }),
      'create brick'
    );
  }, [executeOperation, user]);

  const updateBrick = useCallback((brickId: string, updates: any) => {
    return executeOperation(
      () => BrickService.updateBrick(brickId, updates),
      'update brick'
    );
  }, [executeOperation]);

  const deleteBrick = useCallback((brickId: string) => {
    return executeOperation(
      () => BrickService.deleteBrick(brickId),
      'delete brick'
    );
  }, [executeOperation]);

  // Quanta operations
  const getQuantas = useCallback((brickId: string) => {
    return executeOperation(
      () => QuantaService.getQuantas(brickId),
      'get quantas'
    );
  }, [executeOperation]);

  const getQuanta = useCallback((quantaId: string) => {
    return executeOperation(
      () => QuantaService.getQuanta(quantaId),
      'get quanta'
    );
  }, [executeOperation]);

  const createQuanta = useCallback((quantaData: any) => {
    return executeOperation(
      () => QuantaService.createQuanta({ ...quantaData, user_id: user!.id }),
      'create quanta'
    );
  }, [executeOperation, user]);

  const updateQuanta = useCallback((quantaId: string, updates: any) => {
    return executeOperation(
      () => QuantaService.updateQuanta(quantaId, updates),
      'update quanta'
    );
  }, [executeOperation]);

  const deleteQuanta = useCallback((quantaId: string) => {
    return executeOperation(
      () => QuantaService.deleteQuanta(quantaId),
      'delete quanta'
    );
  }, [executeOperation]);

  return {
    isLoading,
    error,
    // Profile operations
    getProfile,
    updateProfile,
    // Brick operations
    getBricks,
    getBrick,
    createBrick,
    updateBrick,
    deleteBrick,
    // Quanta operations
    getQuantas,
    getQuanta,
    createQuanta,
    updateQuanta,
    deleteQuanta,
  };
}