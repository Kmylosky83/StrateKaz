/**
 * Hooks React Query para Programación de Abastecimiento - Supply Chain
 * Sistema de gestión de programaciones, asignaciones, ejecuciones y liquidaciones
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import programacionAbastecimientoApi from '../api/programacionApi';

/** Extrae el mensaje de error de un AxiosError o Error genérico */
function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const detail = (error.response?.data as Record<string, unknown> | undefined)?.detail;
    if (typeof detail === 'string') return detail;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

import type {
  CreateProgramacionDTO,
  UpdateProgramacionDTO,
  CreateAsignacionRecursoDTO,
  UpdateAsignacionRecursoDTO,
  CreateEjecucionDTO,
  UpdateEjecucionDTO,
  CreateLiquidacionDTO,
  UpdateLiquidacionDTO,
  CreateTipoOperacionDTO,
  UpdateTipoOperacionDTO,
  CreateEstadoProgramacionDTO,
  UpdateEstadoProgramacionDTO,
  CreateUnidadMedidaProgramacionDTO,
  UpdateUnidadMedidaProgramacionDTO,
  CreateEstadoEjecucionDTO,
  UpdateEstadoEjecucionDTO,
  CreateEstadoLiquidacionDTO,
  UpdateEstadoLiquidacionDTO,
} from '../types';

// ==================== QUERY KEYS ====================

export const programacionKeys = {
  all: ['supply-chain', 'programacion-abastecimiento'] as const,

  // Catálogos
  tiposOperacion: () => [...programacionKeys.all, 'tipos-operacion'] as const,
  tipoOperacion: (id: number) => [...programacionKeys.tiposOperacion(), id] as const,
  estadosProgramacion: () => [...programacionKeys.all, 'estados-programacion'] as const,
  estadoProgramacion: (id: number) => [...programacionKeys.estadosProgramacion(), id] as const,
  unidadesMedida: () => [...programacionKeys.all, 'unidades-medida'] as const,
  unidadMedida: (id: number) => [...programacionKeys.unidadesMedida(), id] as const,
  estadosEjecucion: () => [...programacionKeys.all, 'estados-ejecucion'] as const,
  estadoEjecucion: (id: number) => [...programacionKeys.estadosEjecucion(), id] as const,
  estadosLiquidacion: () => [...programacionKeys.all, 'estados-liquidacion'] as const,
  estadoLiquidacion: (id: number) => [...programacionKeys.estadosLiquidacion(), id] as const,

  // Programaciones
  programaciones: () => [...programacionKeys.all, 'programaciones'] as const,
  programacionesFiltered: (filters: Record<string, unknown>) =>
    [...programacionKeys.programaciones(), 'filtered', filters] as const,
  programacion: (id: number) => [...programacionKeys.all, 'programacion', id] as const,
  calendario: (params?: Record<string, unknown>) =>
    [...programacionKeys.all, 'calendario', params] as const,
  estadisticas: (params?: Record<string, unknown>) =>
    [...programacionKeys.all, 'estadisticas', params] as const,

  // Asignaciones
  asignaciones: () => [...programacionKeys.all, 'asignaciones'] as const,
  asignacionesFiltered: (filters: Record<string, unknown>) =>
    [...programacionKeys.asignaciones(), 'filtered', filters] as const,
  asignacion: (id: number) => [...programacionKeys.all, 'asignacion', id] as const,

  // Ejecuciones
  ejecuciones: () => [...programacionKeys.all, 'ejecuciones'] as const,
  ejecucionesFiltered: (filters: Record<string, unknown>) =>
    [...programacionKeys.ejecuciones(), 'filtered', filters] as const,
  ejecucion: (id: number) => [...programacionKeys.all, 'ejecucion', id] as const,

  // Liquidaciones
  liquidaciones: () => [...programacionKeys.all, 'liquidaciones'] as const,
  liquidacionesFiltered: (filters: Record<string, unknown>) =>
    [...programacionKeys.liquidaciones(), 'filtered', filters] as const,
  liquidacion: (id: number) => [...programacionKeys.all, 'liquidacion', id] as const,
};

// ==================== CATÁLOGOS - TIPOS DE OPERACIÓN ====================

export function useTiposOperacion(params?: { is_active?: boolean }) {
  return useQuery({
    queryKey: programacionKeys.tiposOperacion(),
    queryFn: async () => {
      const response = params?.is_active
        ? await programacionAbastecimientoApi.catalogos.tiposOperacion.getActivos()
        : await programacionAbastecimientoApi.catalogos.tiposOperacion.getAll();
      return response.data;
    },
  });
}

export function useTipoOperacion(id: number) {
  return useQuery({
    queryKey: programacionKeys.tipoOperacion(id),
    queryFn: async () => {
      const response = await programacionAbastecimientoApi.catalogos.tiposOperacion.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateTipoOperacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (_data: CreateTipoOperacionDTO) => {
      // API would need to support this endpoint
      throw new Error('Endpoint not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programacionKeys.tiposOperacion() });
      toast.success('Tipo de operación creado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear tipo de operación'));
    },
  });
}

export function useUpdateTipoOperacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ _id, _data }: { _id: number; _data: UpdateTipoOperacionDTO }) => {
      // API would need to support this endpoint
      throw new Error('Endpoint not implemented');
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: programacionKeys.tiposOperacion() });
      queryClient.invalidateQueries({ queryKey: programacionKeys.tipoOperacion(id) });
      toast.success('Tipo de operación actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar tipo de operación'));
    },
  });
}

export function useDeleteTipoOperacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (_id: number) => {
      // API would need to support this endpoint
      throw new Error('Endpoint not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programacionKeys.tiposOperacion() });
      toast.success('Tipo de operación eliminado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar tipo de operación'));
    },
  });
}

// ==================== CATÁLOGOS - ESTADOS PROGRAMACIÓN ====================

export function useEstadosProgramacion(params?: { is_active?: boolean }) {
  return useQuery({
    queryKey: programacionKeys.estadosProgramacion(),
    queryFn: async () => {
      const response = params?.is_active
        ? await programacionAbastecimientoApi.catalogos.estadosProgramacion.getActivos()
        : await programacionAbastecimientoApi.catalogos.estadosProgramacion.getAll();
      return response.data;
    },
  });
}

export function useEstadoProgramacion(id: number) {
  return useQuery({
    queryKey: programacionKeys.estadoProgramacion(id),
    queryFn: async () => {
      const response =
        await programacionAbastecimientoApi.catalogos.estadosProgramacion.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateEstadoProgramacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (_data: CreateEstadoProgramacionDTO) => {
      throw new Error('Endpoint not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programacionKeys.estadosProgramacion() });
      toast.success('Estado de programación creado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear estado'));
    },
  });
}

export function useUpdateEstadoProgramacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ _id, _data }: { _id: number; _data: UpdateEstadoProgramacionDTO }) => {
      throw new Error('Endpoint not implemented');
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: programacionKeys.estadosProgramacion() });
      queryClient.invalidateQueries({ queryKey: programacionKeys.estadoProgramacion(id) });
      toast.success('Estado de programación actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar estado'));
    },
  });
}

export function useDeleteEstadoProgramacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (_id: number) => {
      throw new Error('Endpoint not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programacionKeys.estadosProgramacion() });
      toast.success('Estado de programación eliminado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar estado'));
    },
  });
}

// ==================== CATÁLOGOS - UNIDADES DE MEDIDA ====================

export function useUnidadesMedidaProgramacion(params?: { is_active?: boolean }) {
  return useQuery({
    queryKey: programacionKeys.unidadesMedida(),
    queryFn: async () => {
      const response = params?.is_active
        ? await programacionAbastecimientoApi.catalogos.unidadesMedida.getActivos()
        : await programacionAbastecimientoApi.catalogos.unidadesMedida.getAll();
      return response.data;
    },
  });
}

export function useUnidadMedidaProgramacion(id: number) {
  return useQuery({
    queryKey: programacionKeys.unidadMedida(id),
    queryFn: async () => {
      const response = await programacionAbastecimientoApi.catalogos.unidadesMedida.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateUnidadMedidaProgramacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (_data: CreateUnidadMedidaProgramacionDTO) => {
      throw new Error('Endpoint not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programacionKeys.unidadesMedida() });
      toast.success('Unidad de medida creada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear unidad de medida'));
    },
  });
}

export function useUpdateUnidadMedidaProgramacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ _id, _data }: { _id: number; _data: UpdateUnidadMedidaProgramacionDTO }) => {
      throw new Error('Endpoint not implemented');
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: programacionKeys.unidadesMedida() });
      queryClient.invalidateQueries({ queryKey: programacionKeys.unidadMedida(id) });
      toast.success('Unidad de medida actualizada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar unidad de medida'));
    },
  });
}

export function useDeleteUnidadMedidaProgramacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (_id: number) => {
      throw new Error('Endpoint not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programacionKeys.unidadesMedida() });
      toast.success('Unidad de medida eliminada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar unidad de medida'));
    },
  });
}

// ==================== CATÁLOGOS - ESTADOS EJECUCIÓN ====================

export function useEstadosEjecucion(params?: { is_active?: boolean }) {
  return useQuery({
    queryKey: programacionKeys.estadosEjecucion(),
    queryFn: async () => {
      const response = params?.is_active
        ? await programacionAbastecimientoApi.catalogos.estadosEjecucion.getActivos()
        : await programacionAbastecimientoApi.catalogos.estadosEjecucion.getAll();
      return response.data;
    },
  });
}

export function useEstadoEjecucion(id: number) {
  return useQuery({
    queryKey: programacionKeys.estadoEjecucion(id),
    queryFn: async () => {
      const response = await programacionAbastecimientoApi.catalogos.estadosEjecucion.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateEstadoEjecucion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (_data: CreateEstadoEjecucionDTO) => {
      throw new Error('Endpoint not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programacionKeys.estadosEjecucion() });
      toast.success('Estado de ejecución creado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear estado'));
    },
  });
}

export function useUpdateEstadoEjecucion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ _id, _data }: { _id: number; _data: UpdateEstadoEjecucionDTO }) => {
      throw new Error('Endpoint not implemented');
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: programacionKeys.estadosEjecucion() });
      queryClient.invalidateQueries({ queryKey: programacionKeys.estadoEjecucion(id) });
      toast.success('Estado de ejecución actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar estado'));
    },
  });
}

export function useDeleteEstadoEjecucion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (_id: number) => {
      throw new Error('Endpoint not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programacionKeys.estadosEjecucion() });
      toast.success('Estado de ejecución eliminado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar estado'));
    },
  });
}

// ==================== CATÁLOGOS - ESTADOS LIQUIDACIÓN ====================

export function useEstadosLiquidacion(params?: { is_active?: boolean }) {
  return useQuery({
    queryKey: programacionKeys.estadosLiquidacion(),
    queryFn: async () => {
      const response = params?.is_active
        ? await programacionAbastecimientoApi.catalogos.estadosLiquidacion.getActivos()
        : await programacionAbastecimientoApi.catalogos.estadosLiquidacion.getAll();
      return response.data;
    },
  });
}

export function useEstadoLiquidacion(id: number) {
  return useQuery({
    queryKey: programacionKeys.estadoLiquidacion(id),
    queryFn: async () => {
      const response = await programacionAbastecimientoApi.catalogos.estadosLiquidacion.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateEstadoLiquidacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (_data: CreateEstadoLiquidacionDTO) => {
      throw new Error('Endpoint not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programacionKeys.estadosLiquidacion() });
      toast.success('Estado de liquidación creado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear estado'));
    },
  });
}

export function useUpdateEstadoLiquidacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ _id, _data }: { _id: number; _data: UpdateEstadoLiquidacionDTO }) => {
      throw new Error('Endpoint not implemented');
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: programacionKeys.estadosLiquidacion() });
      queryClient.invalidateQueries({ queryKey: programacionKeys.estadoLiquidacion(id) });
      toast.success('Estado de liquidación actualizado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar estado'));
    },
  });
}

export function useDeleteEstadoLiquidacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (_id: number) => {
      throw new Error('Endpoint not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programacionKeys.estadosLiquidacion() });
      toast.success('Estado de liquidación eliminado exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar estado'));
    },
  });
}

// ==================== PROGRAMACIONES ====================

export function useProgramaciones(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params
      ? programacionKeys.programacionesFiltered(params)
      : programacionKeys.programaciones(),
    queryFn: async () => {
      const response = await programacionAbastecimientoApi.programacion.getAll(params);
      return response.data;
    },
  });
}

export function useProgramacion(id: number) {
  return useQuery({
    queryKey: programacionKeys.programacion(id),
    queryFn: async () => {
      const response = await programacionAbastecimientoApi.programacion.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateProgramacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateProgramacionDTO) => {
      const response = await programacionAbastecimientoApi.programacion.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programacionKeys.programaciones() });
      queryClient.invalidateQueries({ queryKey: programacionKeys.estadisticas() });
      toast.success('Programación creada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear programación'));
    },
  });
}

export function useUpdateProgramacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateProgramacionDTO }) => {
      const response = await programacionAbastecimientoApi.programacion.update(id, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: programacionKeys.programaciones() });
      queryClient.invalidateQueries({ queryKey: programacionKeys.programacion(id) });
      toast.success('Programación actualizada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar programación'));
    },
  });
}

export function useDeleteProgramacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await programacionAbastecimientoApi.programacion.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programacionKeys.programaciones() });
      queryClient.invalidateQueries({ queryKey: programacionKeys.estadisticas() });
      toast.success('Programación eliminada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar programación'));
    },
  });
}

export function useRestoreProgramacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await programacionAbastecimientoApi.programacion.restore(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programacionKeys.programaciones() });
      toast.success('Programación restaurada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al restaurar programación'));
    },
  });
}

export function useCalendarioProgramaciones(params?: {
  fecha_inicio?: string;
  fecha_fin?: string;
  tipo_operacion?: number;
}) {
  return useQuery({
    queryKey: programacionKeys.calendario(params),
    queryFn: async () => {
      const response = await programacionAbastecimientoApi.programacion.calendario(params);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useEstadisticasProgramaciones(params?: {
  fecha_inicio?: string;
  fecha_fin?: string;
}) {
  return useQuery({
    queryKey: programacionKeys.estadisticas(params),
    queryFn: async () => {
      const response = await programacionAbastecimientoApi.programacion.estadisticas(params);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// ==================== ASIGNACIONES DE RECURSOS ====================

export function useAsignacionesRecurso(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params
      ? programacionKeys.asignacionesFiltered(params)
      : programacionKeys.asignaciones(),
    queryFn: async () => {
      const response = await programacionAbastecimientoApi.asignacionRecurso.getAll(params);
      return response.data;
    },
  });
}

export function useAsignacionRecurso(id: number) {
  return useQuery({
    queryKey: programacionKeys.asignacion(id),
    queryFn: async () => {
      const response = await programacionAbastecimientoApi.asignacionRecurso.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateAsignacionRecurso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateAsignacionRecursoDTO) => {
      const response = await programacionAbastecimientoApi.asignacionRecurso.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programacionKeys.asignaciones() });
      toast.success('Asignación de recurso creada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear asignación'));
    },
  });
}

export function useUpdateAsignacionRecurso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateAsignacionRecursoDTO }) => {
      const response = await programacionAbastecimientoApi.asignacionRecurso.update(id, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: programacionKeys.asignaciones() });
      queryClient.invalidateQueries({ queryKey: programacionKeys.asignacion(id) });
      toast.success('Asignación de recurso actualizada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar asignación'));
    },
  });
}

export function useDeleteAsignacionRecurso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await programacionAbastecimientoApi.asignacionRecurso.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programacionKeys.asignaciones() });
      toast.success('Asignación de recurso eliminada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar asignación'));
    },
  });
}

// ==================== EJECUCIONES ====================

export function useEjecuciones(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params
      ? programacionKeys.ejecucionesFiltered(params)
      : programacionKeys.ejecuciones(),
    queryFn: async () => {
      const response = await programacionAbastecimientoApi.ejecucion.getAll(params);
      return response.data;
    },
  });
}

export function useEjecucion(id: number) {
  return useQuery({
    queryKey: programacionKeys.ejecucion(id),
    queryFn: async () => {
      const response = await programacionAbastecimientoApi.ejecucion.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateEjecucion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateEjecucionDTO) => {
      const response = await programacionAbastecimientoApi.ejecucion.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programacionKeys.ejecuciones() });
      toast.success('Ejecución creada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear ejecución'));
    },
  });
}

export function useUpdateEjecucion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateEjecucionDTO }) => {
      const response = await programacionAbastecimientoApi.ejecucion.update(id, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: programacionKeys.ejecuciones() });
      queryClient.invalidateQueries({ queryKey: programacionKeys.ejecucion(id) });
      toast.success('Ejecución actualizada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar ejecución'));
    },
  });
}

export function useDeleteEjecucion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await programacionAbastecimientoApi.ejecucion.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programacionKeys.ejecuciones() });
      toast.success('Ejecución eliminada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar ejecución'));
    },
  });
}

export function useCompletarEjecucion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: { fecha_fin?: string; observaciones?: string };
    }) => {
      const response = await programacionAbastecimientoApi.ejecucion.completar(id, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: programacionKeys.ejecuciones() });
      queryClient.invalidateQueries({ queryKey: programacionKeys.ejecucion(id) });
      toast.success('Ejecución completada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al completar ejecución'));
    },
  });
}

// ==================== LIQUIDACIONES ====================

export function useLiquidaciones(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params
      ? programacionKeys.liquidacionesFiltered(params)
      : programacionKeys.liquidaciones(),
    queryFn: async () => {
      const response = await programacionAbastecimientoApi.liquidacion.getAll(params);
      return response.data;
    },
  });
}

export function useLiquidacion(id: number) {
  return useQuery({
    queryKey: programacionKeys.liquidacion(id),
    queryFn: async () => {
      const response = await programacionAbastecimientoApi.liquidacion.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateLiquidacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateLiquidacionDTO) => {
      const response = await programacionAbastecimientoApi.liquidacion.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programacionKeys.liquidaciones() });
      toast.success('Liquidación creada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear liquidación'));
    },
  });
}

export function useUpdateLiquidacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateLiquidacionDTO }) => {
      const response = await programacionAbastecimientoApi.liquidacion.update(id, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: programacionKeys.liquidaciones() });
      queryClient.invalidateQueries({ queryKey: programacionKeys.liquidacion(id) });
      toast.success('Liquidación actualizada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar liquidación'));
    },
  });
}

export function useDeleteLiquidacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await programacionAbastecimientoApi.liquidacion.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programacionKeys.liquidaciones() });
      toast.success('Liquidación eliminada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar liquidación'));
    },
  });
}

export function useAprobarLiquidacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, observaciones }: { id: number; observaciones?: string }) => {
      const response = await programacionAbastecimientoApi.liquidacion.aprobar(id, {
        observaciones,
      });
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: programacionKeys.liquidaciones() });
      queryClient.invalidateQueries({ queryKey: programacionKeys.liquidacion(id) });
      toast.success('Liquidación aprobada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al aprobar liquidación'));
    },
  });
}

export function useGenerarCxPLiquidacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await programacionAbastecimientoApi.liquidacion.generarCxP(id);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: programacionKeys.liquidaciones() });
      queryClient.invalidateQueries({ queryKey: programacionKeys.liquidacion(id) });
      toast.success('Cuenta por pagar generada exitosamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al generar cuenta por pagar'));
    },
  });
}
