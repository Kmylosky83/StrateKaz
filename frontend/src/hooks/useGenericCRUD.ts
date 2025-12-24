/**
 * Hook genérico para operaciones CRUD con React Query
 * Sistema de Gestión Grasas y Huesos del Norte
 *
 * Provee funcionalidad CRUD completa con:
 * - Queries tipadas con React Query
 * - Mutations con invalidación automática
 * - Manejo de errores con toasts
 * - Toggle de estado activo/inactivo
 * - Estados de carga individuales
 *
 * @example
 * ```tsx
 * const {
 *   data,
 *   isLoading,
 *   create,
 *   update,
 *   delete: deleteFn,
 *   toggleActive,
 *   isCreating,
 *   isUpdating,
 *   isDeleting,
 *   invalidate
 * } = useGenericCRUD({
 *   queryKey: ['areas'],
 *   endpoint: '/api/areas/',
 *   entityName: 'Área',
 *   onSuccess: (data) => console.log('Success:', data)
 * });
 * ```
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';
import axiosInstance from '@/api/axios-config';

// ==================== TYPES ====================

/**
 * Estructura de respuesta paginada de Django REST Framework
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Errores de validación de DRF
 */
interface ValidationErrors {
  [key: string]: string | string[];
}

/**
 * Entidad base con ID
 */
export interface BaseEntity {
  id: number;
}

/**
 * Opciones de configuración del hook
 */
export interface CRUDOptions<T extends BaseEntity> {
  queryKey: unknown[];
  endpoint: string;
  entityName: string;
  isFeminine?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: unknown) => void;
  isPaginated?: boolean;
  queryOptions?: Omit<
    UseQueryOptions<T[] | PaginatedResponse<T>, Error>,
    'queryKey' | 'queryFn'
  >;
  enabled?: boolean;
}

/**
 * Valor de retorno del hook
 */
export interface CRUDResult<T extends BaseEntity> {
  data: T[];
  rawData: T[] | PaginatedResponse<T> | undefined;
  isLoading: boolean;
  error: Error | null;
  isFetching: boolean;
  pagination?: {
    count: number;
    next: string | null;
    previous: string | null;
  };
  create: (data: Partial<T>) => Promise<T>;
  update: (params: { id: number; data: Partial<T> }) => Promise<T>;
  delete: (id: number) => Promise<void>;
  toggleActive: (id: number, isActive?: boolean) => Promise<T>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isToggling: boolean;
  invalidate: () => Promise<void>;
}

// ==================== ERROR HANDLING ====================

const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data;

    if (typeof data === 'object' && !Array.isArray(data)) {
      const errors = data as ValidationErrors;
      const messages: string[] = [];

      for (const [field, value] of Object.entries(errors)) {
        if (field === 'detail' || field === 'message') {
          return String(value);
        }
        if (Array.isArray(value)) {
          messages.push(`${field}: ${value.join(', ')}`);
        } else if (typeof value === 'string') {
          messages.push(`${field}: ${value}`);
        }
      }

      if (messages.length > 0) {
        return messages.join('\n');
      }
    }

    if (typeof data === 'string') return data;
    if (data.detail) return String(data.detail);
    if (data.message) return String(data.message);
  }

  if (error instanceof Error) return error.message;
  return defaultMessage;
};

// ==================== HOOK ====================

export function useGenericCRUD<T extends BaseEntity>({
  queryKey,
  endpoint,
  entityName,
  isFeminine = false,
  onSuccess,
  onError,
  isPaginated = false,
  queryOptions,
  enabled = true,
}: CRUDOptions<T>): CRUDResult<T> {
  const queryClient = useQueryClient();

  const createdSuffix = isFeminine ? 'creada' : 'creado';
  const updatedSuffix = isFeminine ? 'actualizada' : 'actualizado';
  const deletedSuffix = isFeminine ? 'eliminada' : 'eliminado';
  const activatedSuffix = isFeminine ? 'activada' : 'activado';
  const deactivatedSuffix = isFeminine ? 'desactivada' : 'desactivado';

  const query = useQuery<T[] | PaginatedResponse<T>, Error>({
    queryKey,
    queryFn: async () => {
      const response = await axiosInstance.get<T[] | PaginatedResponse<T>>(endpoint);
      return response.data;
    },
    enabled,
    ...queryOptions,
  });

  const data: T[] = isPaginated
    ? ((query.data as PaginatedResponse<T>)?.results ?? [])
    : (query.data as T[]) ?? [];

  const pagination = isPaginated
    ? {
        count: (query.data as PaginatedResponse<T>)?.count ?? 0,
        next: (query.data as PaginatedResponse<T>)?.next ?? null,
        previous: (query.data as PaginatedResponse<T>)?.previous ?? null,
      }
    : undefined;

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey });
  };

  const createMutation = useMutation<T, Error, Partial<T>>({
    mutationFn: async (newData: Partial<T>) => {
      const response = await axiosInstance.post<T>(endpoint, newData);
      return response.data;
    },
    onSuccess: (newData) => {
      invalidate();
      toast.success(`${entityName} ${createdSuffix} exitosamente`);
      onSuccess?.(newData);
    },
    onError: (error: Error) => {
      const message = getErrorMessage(error, `Error al crear ${entityName}`);
      toast.error(message, { duration: 5000 });
      onError?.(error);
    },
  });

  const updateMutation = useMutation<T, Error, { id: number; data: Partial<T> }>({
    mutationFn: async ({ id, data: updateData }) => {
      const response = await axiosInstance.patch<T>(`${endpoint}${id}/`, updateData);
      return response.data;
    },
    onSuccess: (updatedData) => {
      invalidate();
      toast.success(`${entityName} ${updatedSuffix} exitosamente`);
      onSuccess?.(updatedData);
    },
    onError: (error: Error) => {
      const message = getErrorMessage(error, `Error al actualizar ${entityName}`);
      toast.error(message, { duration: 5000 });
      onError?.(error);
    },
  });

  const deleteMutation = useMutation<void, Error, number>({
    mutationFn: async (id: number) => {
      await axiosInstance.delete(`${endpoint}${id}/`);
    },
    onSuccess: () => {
      invalidate();
      toast.success(`${entityName} ${deletedSuffix} exitosamente`);
    },
    onError: (error: Error) => {
      const message = getErrorMessage(error, `Error al eliminar ${entityName}`);
      toast.error(message, { duration: 5000 });
      onError?.(error);
    },
  });

  const toggleActiveMutation = useMutation<T, Error, { id: number; isActive?: boolean }>({
    mutationFn: async ({ id, isActive }) => {
      if (isActive !== undefined) {
        const response = await axiosInstance.patch<T>(`${endpoint}${id}/`, {
          is_active: isActive,
        });
        return response.data;
      }

      try {
        const response = await axiosInstance.post<T>(`${endpoint}${id}/toggle-active/`);
        return response.data;
      } catch {
        const current = await axiosInstance.get<T>(`${endpoint}${id}/`);
        const currentActive = (current.data as T & { is_active?: boolean }).is_active ?? true;
        const response = await axiosInstance.patch<T>(`${endpoint}${id}/`, {
          is_active: !currentActive,
        });
        return response.data;
      }
    },
    onSuccess: (result) => {
      invalidate();
      const isActive = (result as T & { is_active?: boolean }).is_active;
      const status = isActive ? activatedSuffix : deactivatedSuffix;
      toast.success(`${entityName} ${status} exitosamente`);
    },
    onError: (error: Error) => {
      const message = getErrorMessage(error, `Error al cambiar estado de ${entityName}`);
      toast.error(message, { duration: 5000 });
      onError?.(error);
    },
  });

  return {
    data,
    rawData: query.data,
    isLoading: query.isLoading,
    error: query.error,
    isFetching: query.isFetching,
    pagination,

    create: (newData: Partial<T>) => {
      return new Promise<T>((resolve, reject) => {
        createMutation.mutate(newData, {
          onSuccess: resolve,
          onError: reject,
        });
      });
    },

    update: (params: { id: number; data: Partial<T> }) => {
      return new Promise<T>((resolve, reject) => {
        updateMutation.mutate(params, {
          onSuccess: resolve,
          onError: reject,
        });
      });
    },

    delete: (id: number) => {
      return new Promise<void>((resolve, reject) => {
        deleteMutation.mutate(id, {
          onSuccess: resolve,
          onError: reject,
        });
      });
    },

    toggleActive: (id: number, isActive?: boolean) => {
      return new Promise<T>((resolve, reject) => {
        toggleActiveMutation.mutate({ id, isActive }, {
          onSuccess: resolve,
          onError: reject,
        });
      });
    },

    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isToggling: toggleActiveMutation.isPending,

    invalidate,
  };
}

export default useGenericCRUD;
