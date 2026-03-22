/**
 * React Query hooks para Contexto Organizacional
 *
 * DOFA, PESTEL, Porter, TOWS
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  tiposAnalisisDofaApi,
  tiposAnalisisPestelApi,
  analisisDofaApi,
  factoresDofaApi,
  analisisPestelApi,
  factoresPestelApi,
  fuerzasPorterApi,
  estrategiasTowsApi,
} from '../api/contextoApi';
import type {
  AnalisisDOFAFilters,
  FactorDOFAFilters,
  CreateAnalisisDOFADTO,
  UpdateAnalisisDOFADTO,
  CreateFactorDOFADTO,
  UpdateFactorDOFADTO,
  AnalisisPESTELFilters,
  FactorPESTELFilters,
  CreateAnalisisPESTELDTO,
  UpdateAnalisisPESTELDTO,
  CreateFactorPESTELDTO,
  UpdateFactorPESTELDTO,
  FuerzaPorterFilters,
  CreateFuerzaPorterDTO,
  UpdateFuerzaPorterDTO,
  EstrategiaTOWSFilters,
  CreateEstrategiaTOWSDTO,
  UpdateEstrategiaTOWSDTO,
  ConvertirObjetivoRequest,
} from '../types/contexto.types';

// ==============================================================================
// QUERY KEYS
// ==============================================================================

export const contextoKeys = {
  // Tipos de Análisis DOFA (catálogo global)
  tiposAnalisisDofa: ['tipos-analisis-dofa'] as const,
  tiposAnalisisDofaList: () => [...contextoKeys.tiposAnalisisDofa, 'list'] as const,

  // Tipos de Análisis PESTEL (catálogo global)
  tiposAnalisisPestel: ['tipos-analisis-pestel'] as const,
  tiposAnalisisPestelList: () => [...contextoKeys.tiposAnalisisPestel, 'list'] as const,

  // DOFA
  analisisDofa: ['analisis-dofa'] as const,
  analisisDofaLists: () => [...contextoKeys.analisisDofa, 'list'] as const,
  analisisDofaList: (filters?: AnalisisDOFAFilters) =>
    [...contextoKeys.analisisDofaLists(), filters] as const,
  analisisDofaDetails: () => [...contextoKeys.analisisDofa, 'detail'] as const,
  analisisDofaDetail: (id: number) =>
    [...contextoKeys.analisisDofaDetails(), id] as const,

  factoresDofa: ['factores-dofa'] as const,
  factoresDofaLists: () => [...contextoKeys.factoresDofa, 'list'] as const,
  factoresDofaList: (filters?: FactorDOFAFilters) =>
    [...contextoKeys.factoresDofaLists(), filters] as const,

  // PESTEL
  analisisPestel: ['analisis-pestel'] as const,
  analisisPestelLists: () => [...contextoKeys.analisisPestel, 'list'] as const,
  analisisPestelList: (filters?: AnalisisPESTELFilters) =>
    [...contextoKeys.analisisPestelLists(), filters] as const,
  analisisPestelDetails: () =>
    [...contextoKeys.analisisPestel, 'detail'] as const,
  analisisPestelDetail: (id: number) =>
    [...contextoKeys.analisisPestelDetails(), id] as const,

  factoresPestel: ['factores-pestel'] as const,
  factoresPestelLists: () => [...contextoKeys.factoresPestel, 'list'] as const,
  factoresPestelList: (filters?: FactorPESTELFilters) =>
    [...contextoKeys.factoresPestelLists(), filters] as const,

  // PORTER
  fuerzasPorter: ['fuerzas-porter'] as const,
  fuerzasPorterLists: () => [...contextoKeys.fuerzasPorter, 'list'] as const,
  fuerzasPorterList: (filters?: FuerzaPorterFilters) =>
    [...contextoKeys.fuerzasPorterLists(), filters] as const,
  fuerzasPorterDetails: () =>
    [...contextoKeys.fuerzasPorter, 'detail'] as const,
  fuerzasPorterDetail: (id: number) =>
    [...contextoKeys.fuerzasPorterDetails(), id] as const,

  // TOWS
  estrategiasTows: ['estrategias-tows'] as const,
  estrategiasTowsLists: () => [...contextoKeys.estrategiasTows, 'list'] as const,
  estrategiasTowsList: (filters?: EstrategiaTOWSFilters) =>
    [...contextoKeys.estrategiasTowsLists(), filters] as const,
  estrategiasTowsDetails: () =>
    [...contextoKeys.estrategiasTows, 'detail'] as const,
  estrategiasTowsDetail: (id: number) =>
    [...contextoKeys.estrategiasTowsDetails(), id] as const,
};

// ==============================================================================
// TIPOS DE ANÁLISIS DOFA HOOKS (Catálogo Global)
// ==============================================================================

/**
 * Hook para listar tipos de análisis DOFA
 */
export const useTiposAnalisisDofa = () => {
  return useQuery({
    queryKey: contextoKeys.tiposAnalisisDofaList(),
    queryFn: tiposAnalisisDofaApi.list,
    staleTime: 10 * 60 * 1000, // 10 minutos - catálogo estático
  });
};

/**
 * Hook para listar tipos de análisis PESTEL
 */
export const useTiposAnalisisPestel = () => {
  return useQuery({
    queryKey: contextoKeys.tiposAnalisisPestelList(),
    queryFn: tiposAnalisisPestelApi.list,
    staleTime: 10 * 60 * 1000, // 10 minutos - catálogo estático
  });
};

// ==============================================================================
// ANALISIS DOFA HOOKS
// ==============================================================================

/**
 * Hook para listar analisis DOFA
 */
export function useAnalisisDofa(
  filters?: AnalisisDOFAFilters,
  page = 1,
  pageSize = 20
) {
  return useQuery({
    queryKey: [...contextoKeys.analisisDofaList(filters), page, pageSize],
    queryFn: () => analisisDofaApi.list(filters, page, pageSize),
  });
}

/**
 * Hook para obtener detalle de analisis DOFA
 */
export function useAnalisisDofaDetail(id: number | undefined) {
  return useQuery({
    queryKey: contextoKeys.analisisDofaDetail(id!),
    queryFn: () => analisisDofaApi.get(id!),
    enabled: !!id,
  });
}

/**
 * Hook para crear analisis DOFA
 */
export function useCreateAnalisisDofa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAnalisisDOFADTO) => analisisDofaApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: contextoKeys.analisisDofaLists(),
      });
      toast.success('Analisis DOFA creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear analisis DOFA: ${error.message}`);
    },
  });
}

/**
 * Hook para actualizar analisis DOFA
 */
export function useUpdateAnalisisDofa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAnalisisDOFADTO }) =>
      analisisDofaApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: contextoKeys.analisisDofaLists(),
      });
      queryClient.invalidateQueries({
        queryKey: contextoKeys.analisisDofaDetail(id),
      });
      toast.success('Analisis DOFA actualizado');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar: ${error.message}`);
    },
  });
}

/**
 * Hook para eliminar analisis DOFA
 */
export function useDeleteAnalisisDofa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => analisisDofaApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: contextoKeys.analisisDofaLists(),
      });
      toast.success('Analisis DOFA eliminado');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar: ${error.message}`);
    },
  });
}

/**
 * Hook para aprobar analisis DOFA
 */
export function useAprobarAnalisisDofa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => analisisDofaApi.aprobar(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: contextoKeys.analisisDofaLists(),
      });
      queryClient.invalidateQueries({
        queryKey: contextoKeys.analisisDofaDetail(id),
      });
      toast.success('Analisis DOFA aprobado');
    },
    onError: (error: Error) => {
      toast.error(`Error al aprobar: ${error.message}`);
    },
  });
}

// ==============================================================================
// FACTORES DOFA HOOKS
// ==============================================================================

/**
 * Hook para listar factores DOFA
 */
export function useFactoresDofa(
  filters?: FactorDOFAFilters,
  page = 1,
  pageSize = 50
) {
  return useQuery({
    queryKey: [...contextoKeys.factoresDofaList(filters), page, pageSize],
    queryFn: () => factoresDofaApi.list(filters, page, pageSize),
    enabled: !!filters?.analisis,
  });
}

/**
 * Hook para crear factor DOFA
 */
export function useCreateFactorDofa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFactorDOFADTO) => factoresDofaApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: contextoKeys.factoresDofaLists(),
      });
      queryClient.invalidateQueries({
        queryKey: contextoKeys.analisisDofaLists(),
      });
      toast.success('Factor DOFA creado');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear factor: ${error.message}`);
    },
  });
}

/**
 * Hook para actualizar factor DOFA
 */
export function useUpdateFactorDofa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateFactorDOFADTO }) =>
      factoresDofaApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: contextoKeys.factoresDofaLists(),
      });
      toast.success('Factor DOFA actualizado');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar factor: ${error.message}`);
    },
  });
}

/**
 * Hook para eliminar factor DOFA
 */
export function useDeleteFactorDofa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => factoresDofaApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: contextoKeys.factoresDofaLists(),
      });
      queryClient.invalidateQueries({
        queryKey: contextoKeys.analisisDofaLists(),
      });
      toast.success('Factor DOFA eliminado');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar factor: ${error.message}`);
    },
  });
}

// ==============================================================================
// ANALISIS PESTEL HOOKS
// ==============================================================================

/**
 * Hook para listar analisis PESTEL
 */
export function useAnalisisPestel(
  filters?: AnalisisPESTELFilters,
  page = 1,
  pageSize = 20
) {
  return useQuery({
    queryKey: [...contextoKeys.analisisPestelList(filters), page, pageSize],
    queryFn: () => analisisPestelApi.list(filters, page, pageSize),
  });
}

/**
 * Hook para obtener detalle de analisis PESTEL
 */
export function useAnalisisPestelDetail(id: number | undefined) {
  return useQuery({
    queryKey: contextoKeys.analisisPestelDetail(id!),
    queryFn: () => analisisPestelApi.get(id!),
    enabled: !!id,
  });
}

/**
 * Hook para crear analisis PESTEL
 */
export function useCreateAnalisisPestel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAnalisisPESTELDTO) =>
      analisisPestelApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: contextoKeys.analisisPestelLists(),
      });
      toast.success('Analisis PESTEL creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear analisis PESTEL: ${error.message}`);
    },
  });
}

/**
 * Hook para actualizar analisis PESTEL
 */
export function useUpdateAnalisisPestel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAnalisisPESTELDTO }) =>
      analisisPestelApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: contextoKeys.analisisPestelLists(),
      });
      queryClient.invalidateQueries({
        queryKey: contextoKeys.analisisPestelDetail(id),
      });
      toast.success('Analisis PESTEL actualizado');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar: ${error.message}`);
    },
  });
}

/**
 * Hook para eliminar analisis PESTEL
 */
export function useDeleteAnalisisPestel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => analisisPestelApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: contextoKeys.analisisPestelLists(),
      });
      toast.success('Analisis PESTEL eliminado');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar: ${error.message}`);
    },
  });
}

// ==============================================================================
// FACTORES PESTEL HOOKS
// ==============================================================================

/**
 * Hook para listar factores PESTEL
 */
export function useFactoresPestel(
  filters?: FactorPESTELFilters,
  page = 1,
  pageSize = 50
) {
  return useQuery({
    queryKey: [...contextoKeys.factoresPestelList(filters), page, pageSize],
    queryFn: () => factoresPestelApi.list(filters, page, pageSize),
    enabled: !!filters?.analisis,
  });
}

/**
 * Hook para crear factor PESTEL
 */
export function useCreateFactorPestel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFactorPESTELDTO) => factoresPestelApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: contextoKeys.factoresPestelLists(),
      });
      queryClient.invalidateQueries({
        queryKey: contextoKeys.analisisPestelLists(),
      });
      toast.success('Factor PESTEL creado');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear factor: ${error.message}`);
    },
  });
}

/**
 * Hook para actualizar factor PESTEL
 */
export function useUpdateFactorPestel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateFactorPESTELDTO }) =>
      factoresPestelApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: contextoKeys.factoresPestelLists(),
      });
      toast.success('Factor PESTEL actualizado');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar factor: ${error.message}`);
    },
  });
}

/**
 * Hook para eliminar factor PESTEL
 */
export function useDeleteFactorPestel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => factoresPestelApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: contextoKeys.factoresPestelLists(),
      });
      queryClient.invalidateQueries({
        queryKey: contextoKeys.analisisPestelLists(),
      });
      toast.success('Factor PESTEL eliminado');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar factor: ${error.message}`);
    },
  });
}

// ==============================================================================
// FUERZAS PORTER HOOKS
// ==============================================================================

/**
 * Hook para listar fuerzas de Porter
 */
export function useFuerzasPorter(
  filters?: FuerzaPorterFilters,
  page = 1,
  pageSize = 10
) {
  return useQuery({
    queryKey: [...contextoKeys.fuerzasPorterList(filters), page, pageSize],
    queryFn: () => fuerzasPorterApi.list(filters, page, pageSize),
  });
}

/**
 * Hook para obtener detalle de fuerza de Porter
 */
export function useFuerzaPorterDetail(id: number | undefined) {
  return useQuery({
    queryKey: contextoKeys.fuerzasPorterDetail(id!),
    queryFn: () => fuerzasPorterApi.get(id!),
    enabled: !!id,
  });
}

/**
 * Hook para crear fuerza de Porter
 */
export function useCreateFuerzaPorter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFuerzaPorterDTO) => fuerzasPorterApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: contextoKeys.fuerzasPorterLists(),
      });
      toast.success('Fuerza de Porter creada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear: ${error.message}`);
    },
  });
}

/**
 * Hook para actualizar fuerza de Porter
 */
export function useUpdateFuerzaPorter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateFuerzaPorterDTO }) =>
      fuerzasPorterApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: contextoKeys.fuerzasPorterLists(),
      });
      queryClient.invalidateQueries({
        queryKey: contextoKeys.fuerzasPorterDetail(id),
      });
      toast.success('Fuerza de Porter actualizada');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar: ${error.message}`);
    },
  });
}

/**
 * Hook para eliminar fuerza de Porter
 */
export function useDeleteFuerzaPorter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => fuerzasPorterApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: contextoKeys.fuerzasPorterLists(),
      });
      toast.success('Fuerza de Porter eliminada');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar: ${error.message}`);
    },
  });
}

// ==============================================================================
// ESTRATEGIAS TOWS HOOKS
// ==============================================================================

/**
 * Hook para listar estrategias TOWS
 */
export function useEstrategiasTows(
  filters?: EstrategiaTOWSFilters,
  page = 1,
  pageSize = 50
) {
  return useQuery({
    queryKey: [...contextoKeys.estrategiasTowsList(filters), page, pageSize],
    queryFn: () => estrategiasTowsApi.list(filters, page, pageSize),
  });
}

/**
 * Hook para obtener detalle de estrategia TOWS
 */
export function useEstrategiaTowsDetail(id: number | undefined) {
  return useQuery({
    queryKey: contextoKeys.estrategiasTowsDetail(id!),
    queryFn: () => estrategiasTowsApi.get(id!),
    enabled: !!id,
  });
}

/**
 * Hook para crear estrategia TOWS
 */
export function useCreateEstrategiaTows() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEstrategiaTOWSDTO) =>
      estrategiasTowsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: contextoKeys.estrategiasTowsLists(),
      });
      toast.success('Estrategia TOWS creada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear estrategia: ${error.message}`);
    },
  });
}

/**
 * Hook para actualizar estrategia TOWS
 */
export function useUpdateEstrategiaTows() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateEstrategiaTOWSDTO }) =>
      estrategiasTowsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: contextoKeys.estrategiasTowsLists(),
      });
      queryClient.invalidateQueries({
        queryKey: contextoKeys.estrategiasTowsDetail(id),
      });
      toast.success('Estrategia TOWS actualizada');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar: ${error.message}`);
    },
  });
}

/**
 * Hook para eliminar estrategia TOWS
 */
export function useDeleteEstrategiaTows() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => estrategiasTowsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: contextoKeys.estrategiasTowsLists(),
      });
      toast.success('Estrategia TOWS eliminada');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar: ${error.message}`);
    },
  });
}

// ==============================================================================
// ACCIONES DE WORKFLOW - ESTRATEGIAS TOWS
// ==============================================================================

/**
 * Hook para aprobar estrategia TOWS
 */
export function useAprobarEstrategiaTows() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => estrategiasTowsApi.aprobar(id),
    onSuccess: (result, id) => {
      // Actualizar cache con los datos retornados
      queryClient.setQueryData(contextoKeys.estrategiasTowsDetail(id), result.data);
      queryClient.invalidateQueries({
        queryKey: contextoKeys.estrategiasTowsLists(),
      });
      toast.success(result.message || 'Estrategia aprobada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al aprobar: ${error.message}`);
    },
  });
}

/**
 * Hook para marcar estrategia TOWS como en ejecución
 */
export function useEjecutarEstrategiaTows() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => estrategiasTowsApi.ejecutar(id),
    onSuccess: (result, id) => {
      queryClient.setQueryData(contextoKeys.estrategiasTowsDetail(id), result.data);
      queryClient.invalidateQueries({
        queryKey: contextoKeys.estrategiasTowsLists(),
      });
      toast.success(result.message || 'Estrategia marcada como en ejecución');
    },
    onError: (error: Error) => {
      toast.error(`Error al ejecutar: ${error.message}`);
    },
  });
}

/**
 * Hook para completar estrategia TOWS
 */
export function useCompletarEstrategiaTows() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => estrategiasTowsApi.completar(id),
    onSuccess: (result, id) => {
      queryClient.setQueryData(contextoKeys.estrategiasTowsDetail(id), result.data);
      queryClient.invalidateQueries({
        queryKey: contextoKeys.estrategiasTowsLists(),
      });
      toast.success(result.message || 'Estrategia completada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al completar: ${error.message}`);
    },
  });
}

// ==============================================================================
// 🎯 ACCIÓN CLAVE: CONVERTIR ESTRATEGIA TOWS → OBJETIVO ESTRATÉGICO BSC
// ==============================================================================

/**
 * Hook para convertir una estrategia TOWS en un objetivo estratégico BSC.
 *
 * Esta es la pieza fundamental que conecta el análisis de contexto
 * con la formulación estratégica del Balanced Scorecard.
 *
 * Flujo completo:
 * 1. Análisis DOFA → Factores DOFA
 * 2. Matriz TOWS → Estrategias cruzadas
 * 3. ⭐ Convertir estrategia → Objetivo estratégico BSC
 * 4. Objetivo BSC → KPIs, Iniciativas, Proyectos
 *
 * @example
 * ```tsx
 * const convertirMutation = useConvertirEstrategiaObjetivo();
 *
 * const handleConvertir = () => {
 *   convertirMutation.mutate({
 *     id: estrategia.id,
 *     data: {
 *       code: 'OE-F-001',
 *       name: 'Lanzar módulo IA en Q2 2026',
 *       bsc_perspective: 'FINANCIERA',
 *       target_value: 30,
 *       unit: '%'
 *     }
 *   });
 * };
 * ```
 */
export function useConvertirEstrategiaObjetivo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ConvertirObjetivoRequest }) =>
      estrategiasTowsApi.convertirObjetivo(id, data),
    onSuccess: (result, { id }) => {
      // Actualizar cache de la estrategia con los nuevos datos
      queryClient.setQueryData(contextoKeys.estrategiasTowsDetail(id), result.estrategia);

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: contextoKeys.estrategiasTowsLists(),
      });
      queryClient.invalidateQueries({
        queryKey: ['objectives'], // De strategicKeys
      });
      queryClient.invalidateQueries({
        queryKey: ['plan', 'active'], // Plan activo
      });

      // Mensaje de éxito con información del objetivo creado
      toast.success(
        `${result.message}: ${result.objetivo.code} - ${result.objetivo.name}`,
        {
          duration: 5000,
          description: `Perspectiva: ${result.objetivo.bsc_perspective}`,
        }
      );
    },
    onError: (error: unknown) => {
      const errorMessage =
        error?.response?.data?.error ||
        error?.message ||
        'Error al convertir la estrategia en objetivo';
      toast.error(errorMessage);
    },
  });
}
