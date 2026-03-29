/**
 * MS-003: usePreferences Hook
 *
 * Custom hook for managing user preferences with React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import {
  getUserPreferences,
  updateUserPreferences,
  patchUserPreferences,
} from '../api/preferences.api';
import type { UpdatePreferencesDTO } from '../types/preferences.types';

const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as Record<string, unknown>;
    if (typeof data.detail === 'string') return data.detail;
  }
  return 'Error al actualizar preferencias';
};

/**
 * Hook to get user preferences
 */
export const usePreferences = () => {
  return useQuery({
    queryKey: ['user-preferences'],
    queryFn: getUserPreferences,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
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
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
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
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
};
