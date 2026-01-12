/**
 * Hook para gestionar los accesos de secciones por cargo
 *
 * Permite cargar y guardar las secciones (TabSection) a las que
 * un cargo tiene acceso en el sistema.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axios-config';

// ============================================================================
// TYPES
// ============================================================================

interface CargoSectionAccessResponse {
  cargo_id: number;
  cargo_name: string;
  section_ids: number[];
  total_sections: number;
}

interface SaveSectionAccessResponse {
  message: string;
  cargo_id: number;
  cargo_name: string;
  sections_added: number;
  sections_removed: number;
  total_sections: number;
}

interface SaveSectionAccessParams {
  cargoId: number;
  sectionIds: number[];
  replace?: boolean;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const cargoSectionAccessKeys = {
  all: ['cargo-section-access'] as const,
  detail: (cargoId: number | null) => [...cargoSectionAccessKeys.all, cargoId] as const,
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

const cargoSectionAccessApi = {
  /**
   * Obtiene las secciones asignadas a un cargo
   */
  getAccesses: async (cargoId: number): Promise<CargoSectionAccessResponse> => {
    const { data } = await axiosInstance.get(`/core/cargos-rbac/${cargoId}/section_accesses/`);
    return data;
  },

  /**
   * Guarda las secciones asignadas a un cargo
   */
  saveAccesses: async ({
    cargoId,
    sectionIds,
    replace = true,
  }: SaveSectionAccessParams): Promise<SaveSectionAccessResponse> => {
    const { data } = await axiosInstance.post(`/core/cargos-rbac/${cargoId}/assign_section_accesses/`, {
      section_ids: sectionIds,
      replace,
    });
    return data;
  },

  /**
   * Elimina todas las secciones asignadas a un cargo
   */
  clearAccesses: async (cargoId: number): Promise<{ message: string; deleted_count: number }> => {
    const { data } = await axiosInstance.delete(`/core/cargos-rbac/${cargoId}/clear_section_accesses/`);
    return data;
  },
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook para obtener las secciones asignadas a un cargo
 *
 * @param cargoId - ID del cargo (null si no hay seleccionado)
 * @returns Query con las secciones asignadas
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useCargoSectionAccess(selectedCargoId);
 *
 * console.log(data?.section_ids); // [1, 2, 3, 5, 7]
 * ```
 */
export function useCargoSectionAccess(cargoId: number | null) {
  return useQuery({
    queryKey: cargoSectionAccessKeys.detail(cargoId),
    queryFn: () => cargoSectionAccessApi.getAccesses(cargoId!),
    enabled: !!cargoId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos en cache
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

/**
 * Hook para guardar las secciones asignadas a un cargo
 *
 * @returns Mutation para guardar secciones con optimistic updates
 *
 * @example
 * ```tsx
 * const saveMutation = useSaveCargoSectionAccess();
 *
 * saveMutation.mutate(
 *   { cargoId: 1, sectionIds: [1, 2, 3, 5, 7] },
 *   {
 *     onSuccess: (data) => {
 *       console.log('Guardado exitoso:', data.message);
 *     },
 *     onError: (error) => {
 *       console.error('Error al guardar:', error);
 *     }
 *   }
 * );
 * ```
 */
export function useSaveCargoSectionAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cargoSectionAccessApi.saveAccesses,
    // Optimistic update
    onMutate: async (variables) => {
      // Cancelar queries en curso para evitar sobrescribir el update optimista
      await queryClient.cancelQueries({
        queryKey: cargoSectionAccessKeys.detail(variables.cargoId),
      });

      // Guardar snapshot del estado anterior
      const previousData = queryClient.getQueryData(
        cargoSectionAccessKeys.detail(variables.cargoId)
      );

      // Actualizar optimísticamente el cache
      queryClient.setQueryData(
        cargoSectionAccessKeys.detail(variables.cargoId),
        (old: CargoSectionAccessResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            section_ids: variables.sectionIds,
            total_sections: variables.sectionIds.length,
          };
        }
      );

      // Retornar contexto con snapshot para posible rollback
      return { previousData };
    },
    onError: (error, variables, context) => {
      // Rollback en caso de error
      if (context?.previousData) {
        queryClient.setQueryData(
          cargoSectionAccessKeys.detail(variables.cargoId),
          context.previousData
        );
      }
    },
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas para refrescar datos del servidor
      queryClient.invalidateQueries({
        queryKey: cargoSectionAccessKeys.detail(variables.cargoId),
      });
      // Invalidar la lista de cargos para actualizar contadores en la tabla
      queryClient.invalidateQueries({ queryKey: ['cargos-rbac'] });
      queryClient.invalidateQueries({ queryKey: ['cargo-rbac', variables.cargoId] });
    },
  });
}

/**
 * Hook para eliminar todas las secciones asignadas a un cargo
 *
 * @returns Mutation para limpiar secciones
 *
 * @example
 * ```tsx
 * const clearMutation = useClearCargoSectionAccess();
 *
 * clearMutation.mutate(cargoId);
 * ```
 */
export function useClearCargoSectionAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cargoSectionAccessApi.clearAccesses,
    onSuccess: (_, cargoId) => {
      // Invalidar la query del cargo específico
      queryClient.invalidateQueries({
        queryKey: cargoSectionAccessKeys.detail(cargoId),
      });
    },
  });
}
