/**
 * Hooks para Control de Tiempo - Talent Hub
 * Sistema de Gestión StrateKaz
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type {
  Turno,
  TurnoFormData,
  TurnoFilter,
  AsignacionTurno,
  AsignacionTurnoFormData,
  AsignacionTurnoFilter,
  RegistroAsistencia,
  RegistroAsistenciaFormData,
  RegistroAsistenciaFilter,
  MarcajeData,
  HoraExtra,
  HoraExtraFormData,
  HoraExtraFilter,
  AprobacionHoraExtraData,
  ConsolidadoAsistencia,
  ConsolidadoAsistenciaFilter,
  GenerarConsolidadoData,
} from '../types';

const BASE_URL = '/talent-hub/control-tiempo';

// ============== QUERY KEYS ==============

export const controlTiempoKeys = {
  all: ['control-tiempo'] as const,
  turnos: {
    all: () => [...controlTiempoKeys.all, 'turnos'] as const,
    list: (filters?: TurnoFilter) => [...controlTiempoKeys.turnos.all(), 'list', filters] as const,
    detail: (id: number) => [...controlTiempoKeys.turnos.all(), 'detail', id] as const,
  },
  asignaciones: {
    all: () => [...controlTiempoKeys.all, 'asignaciones'] as const,
    list: (filters?: AsignacionTurnoFilter) =>
      [...controlTiempoKeys.asignaciones.all(), 'list', filters] as const,
    detail: (id: number) => [...controlTiempoKeys.asignaciones.all(), 'detail', id] as const,
  },
  asistencias: {
    all: () => [...controlTiempoKeys.all, 'asistencias'] as const,
    list: (filters?: RegistroAsistenciaFilter) =>
      [...controlTiempoKeys.asistencias.all(), 'list', filters] as const,
    detail: (id: number) => [...controlTiempoKeys.asistencias.all(), 'detail', id] as const,
  },
  horasExtras: {
    all: () => [...controlTiempoKeys.all, 'horas-extras'] as const,
    list: (filters?: HoraExtraFilter) =>
      [...controlTiempoKeys.horasExtras.all(), 'list', filters] as const,
    detail: (id: number) => [...controlTiempoKeys.horasExtras.all(), 'detail', id] as const,
  },
  consolidados: {
    all: () => [...controlTiempoKeys.all, 'consolidados'] as const,
    list: (filters?: ConsolidadoAsistenciaFilter) =>
      [...controlTiempoKeys.consolidados.all(), 'list', filters] as const,
    detail: (id: number) => [...controlTiempoKeys.consolidados.all(), 'detail', id] as const,
  },
};

// ============== TURNOS ==============

export const useTurnos = (filters?: TurnoFilter) => {
  return useQuery({
    queryKey: controlTiempoKeys.turnos.list(filters),
    queryFn: async () => {
      const { data } = await api.get<Turno[]>(`${BASE_URL}/turnos/`, { params: filters });
      return data;
    },
  });
};

export const useTurno = (id: number, enabled = true) => {
  return useQuery({
    queryKey: controlTiempoKeys.turnos.detail(id),
    queryFn: async () => {
      const { data } = await api.get<Turno>(`${BASE_URL}/turnos/${id}/`);
      return data;
    },
    enabled: enabled && !!id,
  });
};

export const useCreateTurno = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: TurnoFormData) => {
      const { data: response } = await api.post<Turno>(`${BASE_URL}/turnos/`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: controlTiempoKeys.turnos.all() });
      toast.success('Turno creado exitosamente');
    },
    onError: () => toast.error('Error al crear el turno'),
  });
};

export const useUpdateTurno = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<TurnoFormData> }) => {
      const { data: response } = await api.patch<Turno>(`${BASE_URL}/turnos/${id}/`, data);
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: controlTiempoKeys.turnos.all() });
      queryClient.invalidateQueries({ queryKey: controlTiempoKeys.turnos.detail(id) });
      toast.success('Turno actualizado exitosamente');
    },
    onError: () => toast.error('Error al actualizar el turno'),
  });
};

export const useDeleteTurno = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`${BASE_URL}/turnos/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: controlTiempoKeys.turnos.all() });
      toast.success('Turno eliminado exitosamente');
    },
    onError: () => toast.error('Error al eliminar el turno'),
  });
};

// ============== ASIGNACIONES TURNO ==============

export const useAsignacionesTurno = (filters?: AsignacionTurnoFilter) => {
  return useQuery({
    queryKey: controlTiempoKeys.asignaciones.list(filters),
    queryFn: async () => {
      const { data } = await api.get<AsignacionTurno[]>(`${BASE_URL}/asignaciones/`, {
        params: filters,
      });
      return data;
    },
  });
};

export const useAsignacionTurno = (id: number, enabled = true) => {
  return useQuery({
    queryKey: controlTiempoKeys.asignaciones.detail(id),
    queryFn: async () => {
      const { data } = await api.get<AsignacionTurno>(`${BASE_URL}/asignaciones/${id}/`);
      return data;
    },
    enabled: enabled && !!id,
  });
};

export const useCreateAsignacionTurno = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AsignacionTurnoFormData) => {
      const { data: response } = await api.post<AsignacionTurno>(`${BASE_URL}/asignaciones/`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: controlTiempoKeys.asignaciones.all() });
      toast.success('Asignación de turno creada exitosamente');
    },
    onError: () => toast.error('Error al crear la asignación de turno'),
  });
};

export const useUpdateAsignacionTurno = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<AsignacionTurnoFormData> }) => {
      const { data: response } = await api.patch<AsignacionTurno>(
        `${BASE_URL}/asignaciones/${id}/`,
        data
      );
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: controlTiempoKeys.asignaciones.all() });
      queryClient.invalidateQueries({ queryKey: controlTiempoKeys.asignaciones.detail(id) });
      toast.success('Asignación de turno actualizada exitosamente');
    },
    onError: () => toast.error('Error al actualizar la asignación de turno'),
  });
};

export const useDeleteAsignacionTurno = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`${BASE_URL}/asignaciones/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: controlTiempoKeys.asignaciones.all() });
      toast.success('Asignación de turno eliminada exitosamente');
    },
    onError: () => toast.error('Error al eliminar la asignación de turno'),
  });
};

// ============== REGISTROS ASISTENCIA ==============

export const useRegistrosAsistencia = (filters?: RegistroAsistenciaFilter) => {
  return useQuery({
    queryKey: controlTiempoKeys.asistencias.list(filters),
    queryFn: async () => {
      const { data } = await api.get<RegistroAsistencia[]>(`${BASE_URL}/asistencias/`, {
        params: filters,
      });
      return data;
    },
  });
};

export const useRegistroAsistencia = (id: number, enabled = true) => {
  return useQuery({
    queryKey: controlTiempoKeys.asistencias.detail(id),
    queryFn: async () => {
      const { data } = await api.get<RegistroAsistencia>(`${BASE_URL}/asistencias/${id}/`);
      return data;
    },
    enabled: enabled && !!id,
  });
};

export const useCreateRegistroAsistencia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: RegistroAsistenciaFormData) => {
      const { data: response } = await api.post<RegistroAsistencia>(
        `${BASE_URL}/asistencias/`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: controlTiempoKeys.asistencias.all() });
      toast.success('Registro de asistencia creado exitosamente');
    },
    onError: () => toast.error('Error al crear el registro de asistencia'),
  });
};

export const useUpdateRegistroAsistencia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<RegistroAsistenciaFormData> }) => {
      const { data: response } = await api.patch<RegistroAsistencia>(
        `${BASE_URL}/asistencias/${id}/`,
        data
      );
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: controlTiempoKeys.asistencias.all() });
      queryClient.invalidateQueries({ queryKey: controlTiempoKeys.asistencias.detail(id) });
      toast.success('Registro de asistencia actualizado exitosamente');
    },
    onError: () => toast.error('Error al actualizar el registro de asistencia'),
  });
};

export const useRegistrarMarcaje = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: MarcajeData) => {
      const { data: response } = await api.post<RegistroAsistencia>(
        `${BASE_URL}/asistencias/registrar_marcaje/`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: controlTiempoKeys.asistencias.all() });
      toast.success('Marcaje registrado exitosamente');
    },
    onError: () => toast.error('Error al registrar el marcaje'),
  });
};

export const useJustificarAsistencia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, justificacion }: { id: number; justificacion: string }) => {
      const { data: response } = await api.post<RegistroAsistencia>(
        `${BASE_URL}/asistencias/${id}/justificar/`,
        { justificacion }
      );
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: controlTiempoKeys.asistencias.all() });
      queryClient.invalidateQueries({ queryKey: controlTiempoKeys.asistencias.detail(id) });
      toast.success('Asistencia justificada exitosamente');
    },
    onError: () => toast.error('Error al justificar la asistencia'),
  });
};

// ============== HORAS EXTRAS ==============

export const useHorasExtras = (filters?: HoraExtraFilter) => {
  return useQuery({
    queryKey: controlTiempoKeys.horasExtras.list(filters),
    queryFn: async () => {
      const { data } = await api.get<HoraExtra[]>(`${BASE_URL}/horas-extras/`, { params: filters });
      return data;
    },
  });
};

export const useHoraExtra = (id: number, enabled = true) => {
  return useQuery({
    queryKey: controlTiempoKeys.horasExtras.detail(id),
    queryFn: async () => {
      const { data } = await api.get<HoraExtra>(`${BASE_URL}/horas-extras/${id}/`);
      return data;
    },
    enabled: enabled && !!id,
  });
};

export const useCreateHoraExtra = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: HoraExtraFormData) => {
      const { data: response } = await api.post<HoraExtra>(`${BASE_URL}/horas-extras/`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: controlTiempoKeys.horasExtras.all() });
      toast.success('Solicitud de horas extras creada exitosamente');
    },
    onError: () => toast.error('Error al crear la solicitud de horas extras'),
  });
};

export const useUpdateHoraExtra = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<HoraExtraFormData> }) => {
      const { data: response } = await api.patch<HoraExtra>(
        `${BASE_URL}/horas-extras/${id}/`,
        data
      );
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: controlTiempoKeys.horasExtras.all() });
      queryClient.invalidateQueries({ queryKey: controlTiempoKeys.horasExtras.detail(id) });
      toast.success('Solicitud de horas extras actualizada exitosamente');
    },
    onError: () => toast.error('Error al actualizar la solicitud de horas extras'),
  });
};

export const useDeleteHoraExtra = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`${BASE_URL}/horas-extras/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: controlTiempoKeys.horasExtras.all() });
      toast.success('Solicitud de horas extras eliminada exitosamente');
    },
    onError: () => toast.error('Error al eliminar la solicitud de horas extras'),
  });
};

export const useAprobarHoraExtra = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: AprobacionHoraExtraData }) => {
      const { data: response } = await api.post<HoraExtra>(
        `${BASE_URL}/horas-extras/${id}/aprobar/`,
        data
      );
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: controlTiempoKeys.horasExtras.all() });
      queryClient.invalidateQueries({ queryKey: controlTiempoKeys.horasExtras.detail(id) });
      toast.success('Horas extras aprobadas exitosamente');
    },
    onError: () => toast.error('Error al aprobar las horas extras'),
  });
};

export const useRechazarHoraExtra = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, observaciones }: { id: number; observaciones: string }) => {
      const { data: response } = await api.post<HoraExtra>(
        `${BASE_URL}/horas-extras/${id}/rechazar/`,
        { observaciones_aprobacion: observaciones }
      );
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: controlTiempoKeys.horasExtras.all() });
      queryClient.invalidateQueries({ queryKey: controlTiempoKeys.horasExtras.detail(id) });
      toast.success('Horas extras rechazadas');
    },
    onError: () => toast.error('Error al rechazar las horas extras'),
  });
};

// ============== CONSOLIDADOS ASISTENCIA ==============

export const useConsolidadosAsistencia = (filters?: ConsolidadoAsistenciaFilter) => {
  return useQuery({
    queryKey: controlTiempoKeys.consolidados.list(filters),
    queryFn: async () => {
      const { data } = await api.get<ConsolidadoAsistencia[]>(`${BASE_URL}/consolidados/`, {
        params: filters,
      });
      return data;
    },
  });
};

export const useConsolidadoAsistencia = (id: number, enabled = true) => {
  return useQuery({
    queryKey: controlTiempoKeys.consolidados.detail(id),
    queryFn: async () => {
      const { data } = await api.get<ConsolidadoAsistencia>(`${BASE_URL}/consolidados/${id}/`);
      return data;
    },
    enabled: enabled && !!id,
  });
};

export const useGenerarConsolidado = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: GenerarConsolidadoData) => {
      const { data: response } = await api.post<ConsolidadoAsistencia>(
        `${BASE_URL}/consolidados/generar/`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: controlTiempoKeys.consolidados.all() });
      toast.success('Consolidado generado exitosamente');
    },
    onError: () => toast.error('Error al generar el consolidado'),
  });
};

export const useCerrarConsolidado = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data: response } = await api.post<ConsolidadoAsistencia>(
        `${BASE_URL}/consolidados/${id}/cerrar/`
      );
      return response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: controlTiempoKeys.consolidados.all() });
      queryClient.invalidateQueries({ queryKey: controlTiempoKeys.consolidados.detail(id) });
      toast.success('Consolidado cerrado exitosamente');
    },
    onError: () => toast.error('Error al cerrar el consolidado'),
  });
};

export const useAprobarConsolidado = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data: response } = await api.post<ConsolidadoAsistencia>(
        `${BASE_URL}/consolidados/${id}/aprobar/`
      );
      return response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: controlTiempoKeys.consolidados.all() });
      queryClient.invalidateQueries({ queryKey: controlTiempoKeys.consolidados.detail(id) });
      toast.success('Consolidado aprobado exitosamente');
    },
    onError: () => toast.error('Error al aprobar el consolidado'),
  });
};
