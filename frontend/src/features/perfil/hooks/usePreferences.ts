/**
 * MS-003: usePreferences Hook
 *
 * Custom hook for managing user preferences with React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getUserPreferences,
  updateUserPreferences,
  patchUserPreferences,
} from '../api/preferences.api';
import type { UpdatePreferencesDTO } from '../types/preferences.types';

/**
 * Hook to get user preferences
 */
export const usePreferences = () => {
  return useQuery({
    queryKey: ['user-preferences'],
    queryFn: getUserPreferences,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
  });
};

/**
 * Hook to update user preferences (full update)
 */
export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePreferencesDTO) => updateUserPreferences(data),
    onSuccess: (data) => {
      queryClient.setQueryData(['user-preferences'], data);
      toast.success('Preferencias actualizadas correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al actualizar preferencias';
      toast.error(message);
    },
  });
};

/**
 * Hook to update user preferences (partial update)
 */
export const usePatchPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<UpdatePreferencesDTO>) => patchUserPreferences(data),
    onSuccess: (data) => {
      queryClient.setQueryData(['user-preferences'], data);
      toast.success('Preferencias actualizadas correctamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al actualizar preferencias';
      toast.error(message);
    },
  });
};
