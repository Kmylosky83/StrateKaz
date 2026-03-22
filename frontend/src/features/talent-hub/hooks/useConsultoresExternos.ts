/**
 * React Query Hooks para Consultores Externos - Talent Hub
 * Sistema de Gestión StrateKaz
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { thKeys } from '../api/queryKeys';
import { consultorExternoApi } from '../api/talentHubApi';
import type {
  ConsultorExternoFilters,
  ConsultorExternoEstadisticas,
} from '../types';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const consultoresExternosKeys = {
  all: thKeys.consultoresExternos.all,
  list: (filters?: ConsultorExternoFilters) => thKeys.consultoresExternos.list(filters),
  detail: (id: string) => thKeys.consultoresExternos.detail(id),
  estadisticas: () => thKeys.estadisticasConsultores.all,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/** Listado paginado de consultores externos con filtros */
export function useConsultoresExternos(filters?: ConsultorExternoFilters) {
  return useQuery({
    queryKey: consultoresExternosKeys.list(filters),
    queryFn: async () => {
      const response = await consultorExternoApi.getAll(filters as Record<string, unknown>);
      // Manejar respuesta paginada o array directo
      return Array.isArray(response) ? response : (response?.results ?? []);
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Detalle de un consultor externo */
export function useConsultorExterno(id: string) {
  return useQuery({
    queryKey: consultoresExternosKeys.detail(id),
    queryFn: () => consultorExternoApi.getById(Number(id)),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/** Estadísticas de consultores externos */
export function useConsultoresExternosEstadisticas() {
  return useQuery<ConsultorExternoEstadisticas>({
    queryKey: consultoresExternosKeys.estadisticas(),
    queryFn: () => consultorExternoApi.getEstadisticas(),
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/** Toggle activo/inactivo de un consultor externo */
export function useToggleConsultorActivo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => consultorExternoApi.toggleActivo(id),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: thKeys.consultoresExternos.all });
      qc.invalidateQueries({ queryKey: thKeys.estadisticasConsultores.all });
      toast.success(data.detail);
    },
    onError: () => {
      toast.error('Error al cambiar el estado del consultor');
    },
  });
}
