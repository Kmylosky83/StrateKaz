/**
 * Hooks para Novedades - Talent Hub
 * Sistema de Gestion StrateKaz
 *
 * Refactored to use createCrudHooks / createApiClient / thKeys factories.
 * Aligned with backend endpoints (2026-02-13)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { createCrudHooks } from '@/lib/crud-hooks-factory';
import {
  tipoIncapacidadApi,
  incapacidadApi,
  tipoLicenciaApi,
  licenciaApi,
  permisoApi,
  periodoVacacionesApi,
  solicitudVacacionesApi,
  dotacionConfigApi,
  entregaDotacionApi,
} from '../api/talentHubApi';
import { thKeys } from '../api/queryKeys';
import type {
  IncapacidadFilter,
  Incapacidad,
  LicenciaFilter,
  AprobacionLicenciaData,
  Licencia,
  Permiso,
  PermisoFilter,
  PeriodoVacaciones,
  PeriodoVacacionesFilter,
  SolicitudVacaciones,
  SolicitudVacacionesFilter,
  EntregaDotacionFilter,
} from '../types';

const BASE_URL = '/talent-hub/novedades';

// ============== LEGACY QUERY KEYS (backward compat) ==============

export const novedadesKeys = {
  all: ['novedades'] as const,
  tiposIncapacidad: {
    all: () => [...novedadesKeys.all, 'tipos-incapacidad'] as const,
    list: () => [...novedadesKeys.tiposIncapacidad.all(), 'list'] as const,
    detail: (id: number) => [...novedadesKeys.tiposIncapacidad.all(), 'detail', id] as const,
  },
  incapacidades: {
    all: () => [...novedadesKeys.all, 'incapacidades'] as const,
    list: (filters?: IncapacidadFilter) =>
      [...novedadesKeys.incapacidades.all(), 'list', filters] as const,
    detail: (id: number) => [...novedadesKeys.incapacidades.all(), 'detail', id] as const,
    estadisticas: () => [...novedadesKeys.incapacidades.all(), 'estadisticas'] as const,
  },
  tiposLicencia: {
    all: () => [...novedadesKeys.all, 'tipos-licencia'] as const,
    list: () => [...novedadesKeys.tiposLicencia.all(), 'list'] as const,
    detail: (id: number) => [...novedadesKeys.tiposLicencia.all(), 'detail', id] as const,
  },
  licencias: {
    all: () => [...novedadesKeys.all, 'licencias'] as const,
    list: (filters?: LicenciaFilter) =>
      [...novedadesKeys.licencias.all(), 'list', filters] as const,
    detail: (id: number) => [...novedadesKeys.licencias.all(), 'detail', id] as const,
  },
  permisos: {
    all: () => [...novedadesKeys.all, 'permisos'] as const,
    list: (filters?: PermisoFilter) => [...novedadesKeys.permisos.all(), 'list', filters] as const,
    detail: (id: number) => [...novedadesKeys.permisos.all(), 'detail', id] as const,
  },
  periodosVacaciones: {
    all: () => [...novedadesKeys.all, 'periodos-vacaciones'] as const,
    list: (filters?: PeriodoVacacionesFilter) =>
      [...novedadesKeys.periodosVacaciones.all(), 'list', filters] as const,
    detail: (id: number) => [...novedadesKeys.periodosVacaciones.all(), 'detail', id] as const,
  },
  solicitudesVacaciones: {
    all: () => [...novedadesKeys.all, 'solicitudes-vacaciones'] as const,
    list: (filters?: SolicitudVacacionesFilter) =>
      [...novedadesKeys.solicitudesVacaciones.all(), 'list', filters] as const,
    detail: (id: number) => [...novedadesKeys.solicitudesVacaciones.all(), 'detail', id] as const,
  },
  dotacionConfig: {
    all: () => [...novedadesKeys.all, 'dotacion-config'] as const,
    list: () => [...novedadesKeys.dotacionConfig.all(), 'list'] as const,
  },
  entregasDotacion: {
    all: () => [...novedadesKeys.all, 'entregas-dotacion'] as const,
    list: (filters?: EntregaDotacionFilter) =>
      [...novedadesKeys.entregasDotacion.all(), 'list', filters] as const,
    detail: (id: number) => [...novedadesKeys.entregasDotacion.all(), 'detail', id] as const,
  },
};

// ============== TIPOS INCAPACIDAD (factory CRUD) ==============

const tipoIncapacidadHooks = createCrudHooks(
  tipoIncapacidadApi,
  thKeys.tiposIncapacidad,
  'Tipo de incapacidad'
);

export const useTiposIncapacidad = tipoIncapacidadHooks.useList;
export const useCreateTipoIncapacidad = tipoIncapacidadHooks.useCreate;
export const useUpdateTipoIncapacidad = tipoIncapacidadHooks.useUpdate;
export const useDeleteTipoIncapacidad = tipoIncapacidadHooks.useDelete;

// ============== INCAPACIDADES (factory CRUD + custom actions) ==============

const incapacidadHooks = createCrudHooks(incapacidadApi, thKeys.incapacidades, 'Incapacidad', {
  isFeminine: true,
});

export const useIncapacidades = incapacidadHooks.useList;
export const useIncapacidad = incapacidadHooks.useDetail;
export const useCreateIncapacidad = incapacidadHooks.useCreate;
export const useUpdateIncapacidad = incapacidadHooks.useUpdate;
export const useDeleteIncapacidad = incapacidadHooks.useDelete;

export const useAprobarIncapacidad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post<Incapacidad>(
        `${BASE_URL}/incapacidades/${id}/aprobar/`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.incapacidades.lists() });
      toast.success('Incapacidad aprobada');
    },
    onError: () => toast.error('Error al aprobar la incapacidad'),
  });
};

export const useRechazarIncapacidad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, observaciones }: { id: number; observaciones: string }) => {
      const { data } = await apiClient.post<Incapacidad>(
        `${BASE_URL}/incapacidades/${id}/rechazar/`,
        { observaciones }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.incapacidades.lists() });
      toast.success('Incapacidad rechazada');
    },
    onError: () => toast.error('Error al rechazar la incapacidad'),
  });
};

export const useRadicarCobroIncapacidad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      fecha_radicacion_cobro,
    }: {
      id: number;
      fecha_radicacion_cobro: string;
    }) => {
      const { data } = await apiClient.post<Incapacidad>(
        `${BASE_URL}/incapacidades/${id}/radicar_cobro/`,
        { fecha_radicacion_cobro }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.incapacidades.lists() });
      toast.success('Cobro radicado exitosamente');
    },
    onError: () => toast.error('Error al radicar el cobro'),
  });
};

export const useEstadisticasIncapacidades = () => {
  return useQuery({
    queryKey: thKeys.incapacidades.custom('estadisticas'),
    queryFn: async () => {
      const { data } = await apiClient.get<{
        total: number;
        por_estado: Record<string, number>;
        pendientes: number;
        aprobadas: number;
        en_cobro: number;
        pagadas: number;
      }>(`${BASE_URL}/incapacidades/estadisticas/`);
      return data;
    },
  });
};

// ============== TIPOS LICENCIA (factory CRUD) ==============

const tipoLicenciaHooks = createCrudHooks(
  tipoLicenciaApi,
  thKeys.tiposLicencia,
  'Tipo de licencia'
);

export const useTiposLicencia = tipoLicenciaHooks.useList;
export const useCreateTipoLicencia = tipoLicenciaHooks.useCreate;
export const useUpdateTipoLicencia = tipoLicenciaHooks.useUpdate;
export const useDeleteTipoLicencia = tipoLicenciaHooks.useDelete;

// ============== LICENCIAS (factory CRUD + custom actions) ==============

const licenciaHooks = createCrudHooks(licenciaApi, thKeys.licencias, 'Licencia', {
  isFeminine: true,
});

export const useLicencias = licenciaHooks.useList;
export const useCreateLicencia = licenciaHooks.useCreate;
export const useUpdateLicencia = licenciaHooks.useUpdate;
export const useDeleteLicencia = licenciaHooks.useDelete;

export const useAprobarLicencia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data?: AprobacionLicenciaData }) => {
      const { data: response } = await apiClient.post<Licencia>(
        `${BASE_URL}/licencias/${id}/aprobar/`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.licencias.lists() });
      toast.success('Licencia aprobada');
    },
    onError: () => toast.error('Error al aprobar la licencia'),
  });
};

export const useRechazarLicencia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, observaciones }: { id: number; observaciones: string }) => {
      const { data: response } = await apiClient.post<Licencia>(
        `${BASE_URL}/licencias/${id}/rechazar/`,
        { observaciones }
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.licencias.lists() });
      toast.success('Licencia rechazada');
    },
    onError: () => toast.error('Error al rechazar la licencia'),
  });
};

// ============== PERMISOS (factory CRUD + custom actions) ==============

const permisoHooks = createCrudHooks(permisoApi, thKeys.permisos, 'Permiso');

export const usePermisos = permisoHooks.useList;
export const useCreatePermiso = permisoHooks.useCreate;
export const useUpdatePermiso = permisoHooks.useUpdate;
export const useDeletePermiso = permisoHooks.useDelete;

export const useAprobarPermiso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post<Permiso>(`${BASE_URL}/permisos/${id}/aprobar/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.permisos.lists() });
      toast.success('Permiso aprobado');
    },
    onError: () => toast.error('Error al aprobar el permiso'),
  });
};

export const useRechazarPermiso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, observaciones }: { id: number; observaciones: string }) => {
      const { data } = await apiClient.post<Permiso>(`${BASE_URL}/permisos/${id}/rechazar/`, {
        observaciones,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.permisos.lists() });
      toast.success('Permiso rechazado');
    },
    onError: () => toast.error('Error al rechazar el permiso'),
  });
};

// ============== PERIODOS VACACIONES (factory + custom action) ==============

const periodoVacacionesHooks = createCrudHooks(
  periodoVacacionesApi,
  thKeys.periodosVacaciones,
  'Periodo de vacaciones'
);

export const usePeriodosVacaciones = periodoVacacionesHooks.useList;
export const useCreatePeriodoVacaciones = periodoVacacionesHooks.useCreate;

export const useActualizarAcumulacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post<PeriodoVacaciones>(
        `${BASE_URL}/periodos-vacaciones/${id}/actualizar_acumulacion/`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.periodosVacaciones.lists() });
      toast.success('Acumulacion actualizada');
    },
    onError: () => toast.error('Error al actualizar la acumulacion'),
  });
};

// ============== SOLICITUDES VACACIONES (factory CRUD + custom actions) ==============

const solicitudVacacionesHooks = createCrudHooks(
  solicitudVacacionesApi,
  thKeys.solicitudesVacaciones,
  'Solicitud de vacaciones',
  { isFeminine: true }
);

export const useSolicitudesVacaciones = solicitudVacacionesHooks.useList;
export const useUpdateSolicitudVacaciones = solicitudVacacionesHooks.useUpdate;
export const useDeleteSolicitudVacaciones = solicitudVacacionesHooks.useDelete;

export const useCreateSolicitudVacaciones = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: import('../types').SolicitudVacacionesFormData) => {
      const response = await solicitudVacacionesApi.create(data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.solicitudesVacaciones.lists() });
      queryClient.invalidateQueries({ queryKey: thKeys.periodosVacaciones.lists() });
      toast.success('Solicitud de vacaciones creada');
    },
    onError: () => toast.error('Error al crear la solicitud'),
  });
};

export const useAprobarVacaciones = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post<SolicitudVacaciones>(
        `${BASE_URL}/solicitudes-vacaciones/${id}/aprobar/`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.solicitudesVacaciones.lists() });
      queryClient.invalidateQueries({ queryKey: thKeys.periodosVacaciones.lists() });
      toast.success('Vacaciones aprobadas');
    },
    onError: () => toast.error('Error al aprobar las vacaciones'),
  });
};

export const useRechazarVacaciones = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, observaciones }: { id: number; observaciones: string }) => {
      const { data } = await apiClient.post<SolicitudVacaciones>(
        `${BASE_URL}/solicitudes-vacaciones/${id}/rechazar/`,
        { observaciones }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: thKeys.solicitudesVacaciones.lists() });
      toast.success('Vacaciones rechazadas');
    },
    onError: () => toast.error('Error al rechazar las vacaciones'),
  });
};

// ============== CONFIGURACION DOTACION (factory CRUD) ==============

const dotacionConfigHooks = createCrudHooks(
  dotacionConfigApi,
  thKeys.dotacionConfig,
  'Configuracion de dotacion',
  { isFeminine: true }
);

export const useConfiguracionDotacion = dotacionConfigHooks.useList;
export const useCreateConfiguracionDotacion = dotacionConfigHooks.useCreate;
export const useUpdateConfiguracionDotacion = dotacionConfigHooks.useUpdate;

// ============== ENTREGAS DOTACION (factory CRUD) ==============

const entregaDotacionHooks = createCrudHooks(
  entregaDotacionApi,
  thKeys.entregasDotacion,
  'Entrega de dotacion',
  { isFeminine: true }
);

export const useEntregasDotacion = entregaDotacionHooks.useList;
export const useCreateEntregaDotacion = entregaDotacionHooks.useCreate;
export const useUpdateEntregaDotacion = entregaDotacionHooks.useUpdate;
export const useDeleteEntregaDotacion = entregaDotacionHooks.useDelete;
