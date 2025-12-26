/**
 * Hooks para Normas Legales usando TanStack Query
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { normasApi, tiposNormaApi, type NormasListParams } from '../api/normasApi';
import type {
  NormaLegal,
  NormaLegalCreateUpdate,
  TipoNormaCreate,
} from '../types/matrizLegal';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const normasKeys = {
  all: ['normas-legales'] as const,
  lists: () => [...normasKeys.all, 'list'] as const,
  list: (params?: NormasListParams) => [...normasKeys.lists(), params] as const,
  details: () => [...normasKeys.all, 'detail'] as const,
  detail: (id: number) => [...normasKeys.details(), id] as const,
};

export const tiposNormaKeys = {
  all: ['tipos-norma'] as const,
  list: () => [...tiposNormaKeys.all, 'list'] as const,
};

// ============================================================================
// NORMAS LEGALES - QUERIES
// ============================================================================

/**
 * Hook para listar normas legales con filtros
 */
export function useNormasLegales(params?: NormasListParams) {
  return useQuery({
    queryKey: normasKeys.list(params),
    queryFn: () => normasApi.list(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener detalle de una norma
 */
export function useNormaLegal(id: number | null | undefined) {
  return useQuery({
    queryKey: normasKeys.detail(id!),
    queryFn: () => normasApi.get(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// NORMAS LEGALES - MUTATIONS
// ============================================================================

/**
 * Hook para crear norma legal
 */
export function useCreateNorma() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NormaLegalCreateUpdate) => normasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: normasKeys.lists() });
    },
  });
}

/**
 * Hook para actualizar norma legal
 */
export function useUpdateNorma() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<NormaLegalCreateUpdate> }) =>
      normasApi.update(id, data),
    onSuccess: (updatedNorma) => {
      queryClient.invalidateQueries({ queryKey: normasKeys.lists() });
      queryClient.invalidateQueries({ queryKey: normasKeys.detail(updatedNorma.id) });
    },
  });
}

/**
 * Hook para eliminar norma legal
 */
export function useDeleteNorma() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => normasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: normasKeys.lists() });
    },
  });
}

/**
 * Hook para scraping de norma
 */
export function useScrapeNorma() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tipo, numero, anio }: { tipo: string; numero: string; anio: number }) =>
      normasApi.scrapeNorma(tipo, numero, anio),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: normasKeys.lists() });
    },
  });
}

/**
 * Hook para exportar normas a Excel
 */
export function useExportNormas() {
  return useMutation({
    mutationFn: (params?: NormasListParams) => normasApi.exportExcel(params),
    onSuccess: (blob) => {
      // Descargar archivo
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `normas-legales-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
}

// ============================================================================
// TIPOS DE NORMA - QUERIES
// ============================================================================

/**
 * Hook para listar tipos de norma
 */
export function useTiposNorma() {
  return useQuery({
    queryKey: tiposNormaKeys.list(),
    queryFn: () => tiposNormaApi.list(),
    staleTime: 10 * 60 * 1000, // 10 minutos (cambian poco)
  });
}

/**
 * Hook para crear tipo de norma
 */
export function useCreateTipoNorma() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TipoNormaCreate) => tiposNormaApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tiposNormaKeys.list() });
    },
  });
}
