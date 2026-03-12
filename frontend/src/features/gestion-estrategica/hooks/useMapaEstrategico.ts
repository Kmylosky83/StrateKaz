/**
 * Hooks para Mapa Estratégico
 *
 * Maneja la carga de datos, mutations y estado del canvas React Flow
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { mapasApi, causaEfectoApi } from '../api/mapaEstrategicoApi';
import type {
  CreateMapaEstrategicoDTO,
  UpdateMapaEstrategicoDTO,
  CreateCausaEfectoDTO,
  UpdateCausaEfectoDTO,
  CanvasData,
} from '../types/mapa-estrategico.types';

// ==============================================================================
// QUERY KEYS
// ==============================================================================

export const mapaEstrategicoKeys = {
  all: ['mapa-estrategico'] as const,
  lists: () => [...mapaEstrategicoKeys.all, 'list'] as const,
  list: (planId?: number) => [...mapaEstrategicoKeys.lists(), { planId }] as const,
  details: () => [...mapaEstrategicoKeys.all, 'detail'] as const,
  detail: (id: number) => [...mapaEstrategicoKeys.details(), id] as const,
  byPlan: (planId: number) => [...mapaEstrategicoKeys.all, 'by-plan', planId] as const,
  visualizacion: (planId: number) => [...mapaEstrategicoKeys.all, 'visualizacion', planId] as const,
  relaciones: () => [...mapaEstrategicoKeys.all, 'relaciones'] as const,
  relacionesByMapa: (mapaId: number) => [...mapaEstrategicoKeys.relaciones(), mapaId] as const,
};

// ==============================================================================
// HOOKS DE CONSULTA - MAPAS
// ==============================================================================

/**
 * Hook para obtener la visualización del mapa de un plan
 * Incluye objetivos agrupados por perspectiva y relaciones causa-efecto
 */
export const useMapaVisualizacion = (planId: number | undefined) => {
  return useQuery({
    queryKey: mapaEstrategicoKeys.visualizacion(planId || 0),
    queryFn: () => mapasApi.getVisualizacion(planId!),
    enabled: !!planId,
    staleTime: 30000, // 30 segundos
  });
};

/**
 * Hook para obtener el mapa activo de un plan
 */
export const useMapaByPlan = (planId: number | undefined) => {
  return useQuery({
    queryKey: mapaEstrategicoKeys.byPlan(planId || 0),
    queryFn: () => mapasApi.getByPlan(planId!),
    enabled: !!planId,
    staleTime: 60000, // 1 minuto
  });
};

/**
 * Hook para obtener detalle de un mapa
 */
export const useMapa = (id: number | undefined) => {
  return useQuery({
    queryKey: mapaEstrategicoKeys.detail(id || 0),
    queryFn: () => mapasApi.get(id!),
    enabled: !!id,
  });
};

/**
 * Hook para listar mapas de un plan
 */
export const useMapasList = (planId?: number) => {
  return useQuery({
    queryKey: mapaEstrategicoKeys.list(planId),
    queryFn: () => mapasApi.list(planId),
    staleTime: 60000,
  });
};

// ==============================================================================
// HOOKS DE MUTACIÓN - MAPAS
// ==============================================================================

/**
 * Hook para crear un mapa estratégico
 */
export const useCreateMapa = () => {
  const _queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMapaEstrategicoDTO) => mapasApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: mapaEstrategicoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: mapaEstrategicoKeys.byPlan(data.plan) });
      toast.success('Mapa estratégico creado correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear mapa: ${error.message}`);
    },
  });
};

/**
 * Hook para actualizar un mapa estratégico
 */
export const useUpdateMapa = () => {
  const _queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMapaEstrategicoDTO }) =>
      mapasApi.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: mapaEstrategicoKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: mapaEstrategicoKeys.byPlan(data.plan) });
      queryClient.invalidateQueries({ queryKey: mapaEstrategicoKeys.visualizacion(data.plan) });
      toast.success('Mapa actualizado correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar mapa: ${error.message}`);
    },
  });
};

/**
 * Hook para guardar posiciones del canvas
 */
export const useSaveCanvasPositions = () => {
  const _queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, canvasData }: { id: number; canvasData: CanvasData }) =>
      mapasApi.updateCanvas(id, canvasData),
    onSuccess: (_, _variables) => {
      // No invalidamos para evitar re-render, solo actualizamos el cache local
      toast.success('Posiciones guardadas');
    },
    onError: (error: Error) => {
      toast.error(`Error al guardar posiciones: ${error.message}`);
    },
  });
};

/**
 * Hook para obtener o crear un mapa para un plan
 */
export const useGetOrCreateMapa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, planName }: { planId: number; planName: string }) =>
      mapasApi.getOrCreate(planId, planName),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: mapaEstrategicoKeys.byPlan(data.plan) });
    },
  });
};

/**
 * Hook para eliminar un mapa
 */
export const useDeleteMapa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => mapasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mapaEstrategicoKeys.lists() });
      toast.success('Mapa eliminado correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar mapa: ${error.message}`);
    },
  });
};

// ==============================================================================
// HOOKS DE CONSULTA - RELACIONES CAUSA-EFECTO
// ==============================================================================

/**
 * Hook para listar relaciones de un mapa
 */
export const useRelaciones = (mapaId: number | undefined) => {
  return useQuery({
    queryKey: mapaEstrategicoKeys.relacionesByMapa(mapaId || 0),
    queryFn: () => causaEfectoApi.list(mapaId!),
    enabled: !!mapaId,
    staleTime: 30000,
  });
};

// ==============================================================================
// HOOKS DE MUTACIÓN - RELACIONES CAUSA-EFECTO
// ==============================================================================

/**
 * Hook para crear una relación causa-efecto
 */
export const useCreateRelacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCausaEfectoDTO) => causaEfectoApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: mapaEstrategicoKeys.relacionesByMapa(data.mapa) });
      // También invalidar visualización para actualizar edges
      queryClient.invalidateQueries({ queryKey: mapaEstrategicoKeys.all });
      toast.success('Relación creada correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear relación: ${error.message}`);
    },
  });
};

/**
 * Hook para actualizar una relación
 */
export const useUpdateRelacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCausaEfectoDTO }) =>
      causaEfectoApi.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: mapaEstrategicoKeys.relacionesByMapa(data.mapa) });
      toast.success('Relación actualizada');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar relación: ${error.message}`);
    },
  });
};

/**
 * Hook para eliminar una relación
 */
export const useDeleteRelacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, mapaId }: { id: number; mapaId: number }) =>
      causaEfectoApi.delete(id).then(() => mapaId),
    onSuccess: (mapaId) => {
      queryClient.invalidateQueries({ queryKey: mapaEstrategicoKeys.relacionesByMapa(mapaId) });
      queryClient.invalidateQueries({ queryKey: mapaEstrategicoKeys.all });
      toast.success('Relación eliminada');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar relación: ${error.message}`);
    },
  });
};

/**
 * Hook para crear múltiples relaciones
 */
export const useCreateRelacionesBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (relations: CreateCausaEfectoDTO[]) => causaEfectoApi.createBatch(relations),
    onSuccess: (data) => {
      if (data.length > 0) {
        queryClient.invalidateQueries({
          queryKey: mapaEstrategicoKeys.relacionesByMapa(data[0].mapa),
        });
        queryClient.invalidateQueries({ queryKey: mapaEstrategicoKeys.all });
      }
      toast.success(`${data.length} relaciones creadas`);
    },
    onError: (error: Error) => {
      toast.error(`Error al crear relaciones: ${error.message}`);
    },
  });
};
