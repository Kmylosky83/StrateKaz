/**
 * Hooks para Control de Tiempo - Talent Hub
 * Sistema de Gestión StrateKaz
 *
 * Refactored to use createCrudHooks / createApiClient / thKeys factories.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { createCrudHooks } from '@/lib/crud-hooks-factory';
import {
  turnoApi,
  asignacionTurnoApi,
  registroAsistenciaApi,
  horaExtraApi,
  consolidadoApi,
  configuracionRecargoApi,
} from '../api/talentHubApi';
import { thKeys } from '../api/queryKeys';
import type {
  TurnoFilter,
  AsignacionTurnoFilter,
  RegistroAsistenciaFilter,
  RegistrarEntradaData,
  RegistrarSalidaData,
  JustificarAsistenciaData,
  EstadisticasAsistencia,
  MarcajeTiempo,
  MarcajeData,
  MarcajeQRData,
  MarcajeFilter,
  HoraExtra,
  HoraExtraFilter,
  RechazarHoraExtraData,
  ConsolidadoAsistencia,
  ConsolidadoFilter,
  GenerarConsolidadoData,
  RegistroAsistencia,
} from '../types';

const BASE_URL = '/talent-hub/control-tiempo';

// ============== LEGACY QUERY KEYS (backward compat) ==============
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
    estadisticas: (filters?: RegistroAsistenciaFilter) =>
      [...controlTiempoKeys.asistencias.all(), 'estadisticas', filters] as const,
  },
  marcajes: {
    all: () => [...controlTiempoKeys.all, 'marcajes'] as const,
    list: (filters?: MarcajeFilter) =>
      [...controlTiempoKeys.marcajes.all(), 'list', filters] as const,
    misMarcajes: (fecha?: string) =>
      [...controlTiempoKeys.marcajes.all(), 'mis-marcajes', fecha] as const,
  },
  horasExtras: {
    all: () => [...controlTiempoKeys.all, 'horas-extras'] as const,
    list: (filters?: HoraExtraFilter) =>
      [...controlTiempoKeys.horasExtras.all(), 'list', filters] as const,
    detail: (id: number) => [...controlTiempoKeys.horasExtras.all(), 'detail', id] as const,
  },
  consolidados: {
    all: () => [...controlTiempoKeys.all, 'consolidados'] as const,
    list: (filters?: ConsolidadoFilter) =>
      [...controlTiempoKeys.consolidados.all(), 'list', filters] as const,
    detail: (id: number) => [...controlTiempoKeys.consolidados.all(), 'detail', id] as const,
  },
  recargos: {
    all: () => [...controlTiempoKeys.all, 'recargos'] as const,
    list: () => [...controlTiempoKeys.recargos.all(), 'list'] as const,
  },
};

// ============== TURNOS (factory CRUD) ==============

const turnoHooks = createCrudHooks(turnoApi, thKeys.turnos, 'Turno');

export const useTurnos = turnoHooks.useList;
export const useTurno = turnoHooks.useDetail;
export const useCreateTurno = turnoHooks.useCreate;
export const useUpdateTurno = turnoHooks.useUpdate;
export const useDeleteTurno = turnoHooks.useDelete;

// ============== ASIGNACIONES TURNO (factory CRUD) ==============

const asignacionTurnoHooks = createCrudHooks(
  asignacionTurnoApi,
  thKeys.asignacionesTurno,
  'Asignación de turno',
  { isFeminine: true }
);

export const useAsignacionesTurno = asignacionTurnoHooks.useList;
export const useAsignacionTurno = asignacionTurnoHooks.useDetail;
export const useCreateAsignacionTurno = asignacionTurnoHooks.useCreate;
export const useUpdateAsignacionTurno = asignacionTurnoHooks.useUpdate;
export const useDeleteAsignacionTurno = asignacionTurnoHooks.useDelete;

// ============== REGISTROS ASISTENCIA (factory CRUD + custom actions) ==============

const asistenciaHooks = createCrudHooks(
  registroAsistenciaApi,
  thKeys.asistencias,
  'Registro de asistencia'
);

export const useRegistrosAsistencia = asistenciaHooks.useList;
export const useRegistroAsistencia = asistenciaHooks.useDetail;
export const useCreateRegistroAsistencia = asistenciaHooks.useCreate;
export const useUpdateRegistroAsistencia = asistenciaHooks.useUpdate;

export const useEstadisticasAsistencia = (filters?: RegistroAsistenciaFilter) => {
  return useQuery({
    queryKey: thKeys.asistencias.custom('estadisticas', filters),
    queryFn: async () => {
      const { data } = await apiClient.get<EstadisticasAsistencia>(
        `${BASE_URL}/asistencias/estadisticas/`,
        { params: filters }
      );
      return data;
    },
  });
};

export const useRegistrarEntrada = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: RegistrarEntradaData) => {
      const { data: response } = await apiClient.post<RegistroAsistencia>(
        `${BASE_URL}/asistencias/registrar-entrada/`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.asistencias.lists() });
      toast.success('Entrada registrada exitosamente');
    },
    onError: () => toast.error('Error al registrar la entrada'),
  });
};

export const useRegistrarSalida = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RegistrarSalidaData }) => {
      const { data: response } = await apiClient.post<RegistroAsistencia>(
        `${BASE_URL}/asistencias/${id}/registrar-salida/`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.asistencias.lists() });
      toast.success('Salida registrada exitosamente');
    },
    onError: () => toast.error('Error al registrar la salida'),
  });
};

export const useJustificarAsistencia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: JustificarAsistenciaData }) => {
      const { data: response } = await apiClient.post<RegistroAsistencia>(
        `${BASE_URL}/asistencias/${id}/justificar/`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.asistencias.lists() });
      toast.success('Asistencia justificada exitosamente');
    },
    onError: () => toast.error('Error al justificar la asistencia'),
  });
};

// ============== MARCAJES (custom — no standard CRUD) ==============

export const useMarcajes = (filters?: MarcajeFilter) => {
  return useQuery({
    queryKey: thKeys.marcajes.list(filters),
    queryFn: async () => {
      const response = await apiClient.get(`${BASE_URL}/marcajes/`, { params: filters });
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as MarcajeTiempo[];
    },
  });
};

export const useMisMarcajes = (fecha?: string) => {
  return useQuery({
    queryKey: thKeys.marcajes.custom('mis-marcajes', fecha),
    queryFn: async () => {
      const { data } = await apiClient.get<MarcajeTiempo[]>(`${BASE_URL}/marcajes/mis-marcajes/`, {
        params: fecha ? { fecha } : undefined,
      });
      return data;
    },
  });
};

export const useRegistrarMarcaje = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: MarcajeData) => {
      const { data: response } = await apiClient.post<MarcajeTiempo>(
        `${BASE_URL}/marcajes/marcar/`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.marcajes.lists() });
      queryClient.invalidateQueries({ queryKey: thKeys.asistencias.lists() });
      toast.success('Marcaje registrado exitosamente');
    },
    onError: () => toast.error('Error al registrar el marcaje'),
  });
};

export const useMarcarQR = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: MarcajeQRData) => {
      const { data: response } = await apiClient.post<{
        marcaje: MarcajeTiempo;
        turno: string;
        mensaje: string;
      }>(`${BASE_URL}/marcajes/marcar-qr/`, data);
      return response;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: thKeys.marcajes.lists() });
      queryClient.invalidateQueries({ queryKey: thKeys.asistencias.lists() });
      toast.success(response.mensaje || 'Marcaje QR registrado exitosamente');
    },
    onError: () => toast.error('Error al registrar el marcaje QR'),
  });
};

// ============== HORAS EXTRAS (factory CRUD + custom actions) ==============

const horaExtraHooks = createCrudHooks(
  horaExtraApi,
  thKeys.horasExtras,
  'Solicitud de horas extras',
  { isFeminine: true }
);

export const useHorasExtras = horaExtraHooks.useList;
export const useHoraExtra = horaExtraHooks.useDetail;
export const useCreateHoraExtra = horaExtraHooks.useCreate;
export const useUpdateHoraExtra = horaExtraHooks.useUpdate;
export const useDeleteHoraExtra = horaExtraHooks.useDelete;

export const useAprobarHoraExtra = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data: response } = await apiClient.post<HoraExtra>(
        `${BASE_URL}/horas-extras/${id}/aprobar/`
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.horasExtras.lists() });
      toast.success('Horas extras aprobadas exitosamente');
    },
    onError: () => toast.error('Error al aprobar las horas extras'),
  });
};

export const useRechazarHoraExtra = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RechazarHoraExtraData }) => {
      const { data: response } = await apiClient.post<HoraExtra>(
        `${BASE_URL}/horas-extras/${id}/rechazar/`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.horasExtras.lists() });
      toast.success('Horas extras rechazadas');
    },
    onError: () => toast.error('Error al rechazar las horas extras'),
  });
};

// ============== CONSOLIDADOS ASISTENCIA (factory list/detail + custom actions) ==============

const consolidadoHooks = createCrudHooks(consolidadoApi, thKeys.consolidados, 'Consolidado');

export const useConsolidadosAsistencia = consolidadoHooks.useList;
export const useConsolidadoAsistencia = consolidadoHooks.useDetail;

export const useGenerarConsolidado = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: GenerarConsolidadoData) => {
      const { data: response } = await apiClient.post<
        ConsolidadoAsistencia | ConsolidadoAsistencia[]
      >(`${BASE_URL}/consolidados/generar/`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.consolidados.lists() });
      toast.success('Consolidado generado exitosamente');
    },
    onError: () => toast.error('Error al generar el consolidado'),
  });
};

export const useCerrarConsolidado = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data: response } = await apiClient.post<ConsolidadoAsistencia>(
        `${BASE_URL}/consolidados/${id}/cerrar-mes/`
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.consolidados.lists() });
      toast.success('Consolidado cerrado exitosamente');
    },
    onError: () => toast.error('Error al cerrar el consolidado'),
  });
};

export const useReabrirConsolidado = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data: response } = await apiClient.post<ConsolidadoAsistencia>(
        `${BASE_URL}/consolidados/${id}/reabrir-mes/`
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.consolidados.lists() });
      toast.success('Consolidado reabierto exitosamente');
    },
    onError: () => toast.error('Error al reabrir el consolidado'),
  });
};

// ============== CONFIGURACION RECARGOS (factory CRUD) ==============

const recargoHooks = createCrudHooks(
  configuracionRecargoApi,
  thKeys.recargos,
  'Configuración de recargo',
  { isFeminine: true }
);

export const useConfiguracionesRecargo = recargoHooks.useList;
export const useCreateConfiguracionRecargo = recargoHooks.useCreate;
