/**
 * Hook para Partes Interesadas (Stakeholders)
 *
 * Ubicación: gestion-estrategica/contexto
 * API: /gestion-estrategica/contexto/partes-interesadas/
 * Cumple ISO 9001:2015 Cláusula 4.2 - Partes Interesadas
 *
 * ACTUALIZADO: Sprint 17 - Partes Interesadas V2
 * - Jerarquía GRUPO → TIPO → PI
 * - Impacto bidireccional (PI→Empresa + Empresa→PI)
 * - Temas de interés bidireccionales
 * - Responsables (Colaborador/Cargo/Área)
 * - Import/Export Excel
 * - Generación automática de matriz comunicaciones
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  gruposParteInteresadaApi,
  partesInteresadasApi,
  tiposParteInteresadaApi,
  type GrupoParteInteresada,
  type ParteInteresada,
  type TipoParteInteresada,
  type ParteInteresadaFilters,
  type GenerarMatrizResponse,
} from '../api/partesInteresadasApi';

// Query keys (ACTUALIZADO - Sprint 17)
const QUERY_KEYS = {
  gruposParteInteresada: 'grupos-parte-interesada', // NUEVO
  tiposParteInteresada: 'tipos-parte-interesada',
  partesInteresadas: 'partes-interesadas',
  matrizPoderInteres: 'matriz-poder-interes',
  estadisticas: 'estadisticas-partes-interesadas',
};

/**
 * Hook para listar partes interesadas con filtros
 */
export const usePartesInteresadas = (filters?: ParteInteresadaFilters) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [QUERY_KEYS.partesInteresadas, filters],
    queryFn: () => partesInteresadasApi.list(filters),
  });

  const deleteMutation = useMutation({
    mutationFn: partesInteresadasApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.partesInteresadas] });
    },
  });

  return {
    // Data
    data: query.data?.results || [],
    rawData: query.data,
    totalCount: query.data?.count || 0,

    // Status
    isLoading: query.isLoading,
    error: query.error,
    isError: query.isError,

    // Actions
    delete: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    // Query control
    refetch: query.refetch,
  };
};

/**
 * Hook para obtener una parte interesada por ID
 */
export const useParteInteresada = (id: number | null) => {
  return useQuery({
    queryKey: [QUERY_KEYS.partesInteresadas, id],
    queryFn: () => (id ? partesInteresadasApi.get(id) : null),
    enabled: !!id,
  });
};

/**
 * Hook para crear/actualizar partes interesadas
 */
export const useParteInteresadaMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: partesInteresadasApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.partesInteresadas] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ParteInteresada> }) =>
      partesInteresadasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.partesInteresadas] });
    },
  });

  return {
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isLoading: createMutation.isPending || updateMutation.isPending,
  };
};

/**
 * Hook para listar tipos de parte interesada
 */
export const useTiposParteInteresada = () => {
  const query = useQuery({
    queryKey: [QUERY_KEYS.tiposParteInteresada],
    queryFn: tiposParteInteresadaApi.list,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos (catálogo estático)
  });

  return {
    data: query.data?.results || [],
    isLoading: query.isLoading,
    error: query.error,
  };
};

/**
 * Hook para obtener matriz poder-interés
 */
export const useMatrizPoderInteres = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.partesInteresadas, 'matriz-poder-interes'],
    queryFn: partesInteresadasApi.matrizPoderInteres,
  });
};

/**
 * Hook para estadísticas de partes interesadas
 */
export const useEstadisticasPartesInteresadas = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.partesInteresadas, 'estadisticas'],
    queryFn: partesInteresadasApi.estadisticas,
  });
};

/**
 * 🆕 SPRINT 17: Hook para listar grupos de partes interesadas
 */
export const useGruposParteInteresada = (filters?: {
  es_sistema?: boolean;
  is_active?: boolean;
}) => {
  const query = useQuery({
    queryKey: [QUERY_KEYS.gruposParteInteresada, filters],
    queryFn: () => gruposParteInteresadaApi.list(filters),
    staleTime: 5 * 60 * 1000, // Cache 5 minutos (relativamente estático)
  });

  return {
    data: query.data?.results || [],
    rawData: query.data,
    totalCount: query.data?.count || 0,
    isLoading: query.isLoading,
    error: query.error,
    isError: query.isError,
    refetch: query.refetch,
  };
};

/**
 * 🆕 SPRINT 17: Hook para obtener un grupo por ID
 */
export const useGrupoParteInteresada = (id: number | null) => {
  return useQuery({
    queryKey: [QUERY_KEYS.gruposParteInteresada, id],
    queryFn: () => (id ? gruposParteInteresadaApi.get(id) : null),
    enabled: !!id,
  });
};

/**
 * 🆕 SPRINT 17: Hook para crear/actualizar grupos
 */
export const useGrupoParteInteresadaMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: gruposParteInteresadaApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.gruposParteInteresada] });
      toast.success('Grupo creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear el grupo');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<GrupoParteInteresada> }) =>
      gruposParteInteresadaApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.gruposParteInteresada] });
      toast.success('Grupo actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar el grupo');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: gruposParteInteresadaApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.gruposParteInteresada] });
      toast.success('Grupo eliminado exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar el grupo');
    },
  });

  return {
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isLoading: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
};

/**
 * Hook para descargar plantilla de importación masiva.
 * Patrón unificado: misma estructura que proveedores, clientes, cargos.
 */
export const useDownloadPlantillaPI = () => {
  const mutation = useMutation({
    mutationFn: partesInteresadasApi.downloadPlantilla,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Plantilla_Partes_Interesadas.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Plantilla descargada exitosamente');
    },
    onError: () => {
      toast.error('Error al descargar la plantilla');
    },
  });

  return {
    descargar: mutation.mutateAsync,
    isDownloading: mutation.isPending,
  };
};

/**
 * Hook para exportar a Excel (F-GD-04 — 4 hojas).
 */
export const useExportPartesInteresadasExcel = () => {
  const mutation = useMutation({
    mutationFn: partesInteresadasApi.exportExcel,
    onSuccess: (blob) => {
      // Crear URL del blob y descargar
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Matriz_Partes_Interesadas_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Excel exportado exitosamente');
    },
    onError: () => {
      toast.error('Error al exportar a Excel');
    },
  });

  return {
    exportar: mutation.mutateAsync,
    isExporting: mutation.isPending,
  };
};

/**
 * 🆕 SPRINT 17: Hook para importar desde Excel
 */
export const useImportPartesInteresadasExcel = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: partesInteresadasApi.importExcel,
    onSuccess: (result: GenerarMatrizResponse) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.partesInteresadas] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.gruposParteInteresada] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tiposParteInteresada] });

      const { created, updated, total_errores } = result;
      if (total_errores === 0) {
        toast.success(`Importación exitosa: ${created} creadas, ${updated} actualizadas`);
      } else {
        toast.warning(
          `Importación con errores: ${created} creadas, ${updated} actualizadas, ${total_errores} errores`
        );
      }
    },
    onError: () => {
      toast.error('Error al importar desde Excel');
    },
  });

  return {
    importar: mutation.mutateAsync,
    isImporting: mutation.isPending,
    result: mutation.data,
  };
};

/**
 * 🆕 SPRINT 17: Hook para generar matriz de comunicación individual
 */
export const useGenerarMatrizComunicacion = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: partesInteresadasApi.generarMatrizComunicacion,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['matriz-comunicacion'] });
      toast.success(result.message);
    },
    onError: () => {
      toast.error('Error al generar la matriz de comunicación');
    },
  });

  return {
    generar: mutation.mutateAsync,
    isGenerating: mutation.isPending,
  };
};

/**
 * 🆕 SPRINT 17: Hook para generar matrices de comunicación masivamente
 */
export const useGenerarMatrizComunicacionMasiva = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: partesInteresadasApi.generarMatrizComunicacionMasiva,
    onSuccess: (result: GenerarMatrizResponse) => {
      queryClient.invalidateQueries({ queryKey: ['matriz-comunicacion'] });

      const { created, updated, total_errores } = result;
      if (total_errores === 0) {
        toast.success(`Matrices generadas: ${created} creadas, ${updated} actualizadas`);
      } else {
        toast.warning(
          `Proceso completado con errores: ${created} creadas, ${updated} actualizadas, ${total_errores} errores`
        );
      }
    },
    onError: () => {
      toast.error('Error al generar las matrices de comunicación');
    },
  });

  return {
    generar: mutation.mutateAsync,
    isGenerating: mutation.isPending,
    result: mutation.data,
  };
};

/**
 * 🆕 SPRINT 17: Hook para obtener estadísticas de partes interesadas
 */
export const usePartesInteresadasEstadisticas = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.estadisticas],
    queryFn: partesInteresadasApi.estadisticas,
  });
};

// Re-exportar tipos para conveniencia (ACTUALIZADO - Sprint 17)
export type {
  GrupoParteInteresada,
  ParteInteresada,
  TipoParteInteresada,
  ParteInteresadaFilters,
  GenerarMatrizResponse,
};
