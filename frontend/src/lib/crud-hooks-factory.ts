/**
 * CRUD Hooks Factory - Genera hooks TanStack Query tipados
 *
 * Complementario a useGenericCRUD (hooks/useGenericCRUD.ts):
 * - useGenericCRUD: Hook monolitico que retorna data + mutations todo junto
 * - createCrudHooks: Factory que genera hooks individuales (useList, useCreate, etc.)
 *   que es el patron que usan TODOS los features actuales
 *
 * Elimina ~1000 lineas de boilerplate en 20+ archivos de hooks.
 *
 * @example
 * // En un hook file:
 * import { createCrudHooks } from '@/lib/crud-hooks-factory';
 * import { tipoDocumentoApi } from '../api/gestionDocumentalApi';
 * import { queryKeys } from '@/lib/query-keys';
 *
 * const tipoDocHooks = createCrudHooks(
 *   tipoDocumentoApi,
 *   queryKeys.tiposDocumento ?? createQueryKeys('tipos-documento'),
 *   'Tipo de documento'
 * );
 *
 * export const useTiposDocumento = tipoDocHooks.useList;
 * export const useTipoDocumento = tipoDocHooks.useDetail;
 * export const useCreateTipoDocumento = tipoDocHooks.useCreate;
 * export const useUpdateTipoDocumento = tipoDocHooks.useUpdate;
 * export const useDeleteTipoDocumento = tipoDocHooks.useDelete;
 */
import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import type { QueryKeyConfig } from './query-keys';

// ==================== ERROR HANDLING ====================

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data;
    if (typeof data === 'string') return data;
    if (data.detail) return String(data.detail);
    if (data.message) return String(data.message);
    if (typeof data === 'object') {
      const messages: string[] = [];
      for (const [field, value] of Object.entries(data)) {
        if (field === 'detail' || field === 'message') return String(value);
        if (Array.isArray(value)) messages.push(`${field}: ${value.join(', ')}`);
        else if (typeof value === 'string') messages.push(`${field}: ${value}`);
      }
      if (messages.length > 0) return messages.join('\n');
    }
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

// ==================== TYPES ====================

interface ApiMethods<T, CreateDTO, UpdateDTO> {
  getAll: (params?: Record<string, unknown>) => Promise<{ results?: T[] } | T[]>;
  getById: (id: number) => Promise<T>;
  create: (data: CreateDTO) => Promise<T>;
  update: (id: number, data: UpdateDTO) => Promise<T>;
  delete: (id: number) => Promise<void>;
}

interface CrudHooksResult<T, CreateDTO, UpdateDTO> {
  useList: (
    params?: Record<string, unknown>,
    options?: Partial<UseQueryOptions>
  ) => ReturnType<typeof useQuery<T[]>>;
  useDetail: (
    id: number | undefined | null,
    options?: Partial<UseQueryOptions>
  ) => ReturnType<typeof useQuery<T>>;
  useCreate: () => ReturnType<typeof useMutation<T, Error, CreateDTO>>;
  useUpdate: () => ReturnType<typeof useMutation<T, Error, { id: number; data: UpdateDTO }>>;
  useDelete: () => ReturnType<typeof useMutation<void, Error, number>>;
}

// ==================== FACTORY ====================

/**
 * Genera un conjunto de hooks CRUD tipados para un recurso
 *
 * @param api - Objeto API con metodos CRUD (de createApiClient o manual)
 * @param keys - Query keys del recurso (de createQueryKeys)
 * @param entityName - Nombre legible para toasts (ej: 'Tipo de documento')
 * @param options - Opciones adicionales
 */
export function createCrudHooks<T, CreateDTO = Partial<T>, UpdateDTO = Partial<T>>(
  api: ApiMethods<T, CreateDTO, UpdateDTO>,
  keys: QueryKeyConfig,
  entityName: string,
  options?: { isFeminine?: boolean }
): CrudHooksResult<T, CreateDTO, UpdateDTO> {
  const suffix = options?.isFeminine
    ? { created: 'creada', updated: 'actualizada', deleted: 'eliminada' }
    : { created: 'creado', updated: 'actualizado', deleted: 'eliminado' };

  return {
    useList(params?, queryOptions?) {
      return useQuery({
        queryKey: keys.list(params),
        queryFn: async () => {
          const response = await api.getAll(params);
          return Array.isArray(response) ? response : (response?.results ?? []);
        },
        ...queryOptions,
      }) as ReturnType<typeof useQuery<T[]>>;
    },

    useDetail(id, queryOptions?) {
      return useQuery({
        queryKey: keys.detail(id!),
        queryFn: () => api.getById(id!),
        enabled: !!id,
        ...queryOptions,
      }) as ReturnType<typeof useQuery<T>>;
    },

    useCreate() {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (data: CreateDTO) => api.create(data),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: keys.lists() });
          toast.success(`${entityName} ${suffix.created} exitosamente`);
        },
        onError: (error) => {
          toast.error(getErrorMessage(error, `Error al crear ${entityName}`), { duration: 5000 });
        },
      });
    },

    useUpdate() {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateDTO }) => api.update(id, data),
        onSuccess: (_, { id }) => {
          queryClient.invalidateQueries({ queryKey: keys.lists() });
          // Invalida también el detail del recurso actualizado para que los
          // modales de edición vean los cambios al reabrir (ej: productos M2M,
          // vínculos a otras entidades).
          queryClient.invalidateQueries({ queryKey: keys.detail(id) });
          toast.success(`${entityName} ${suffix.updated} exitosamente`);
        },
        onError: (error) => {
          toast.error(getErrorMessage(error, `Error al actualizar ${entityName}`), {
            duration: 5000,
          });
        },
      });
    },

    useDelete() {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (id: number) => api.delete(id),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: keys.lists() });
          toast.success(`${entityName} ${suffix.deleted} exitosamente`);
        },
        onError: (error) => {
          toast.error(getErrorMessage(error, `Error al eliminar ${entityName}`), {
            duration: 5000,
          });
        },
      });
    },
  };
}
