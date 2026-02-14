/**
 * Hooks para Novedades - Talent Hub
 * Sistema de Gestion StrateKaz
 *
 * Aligned with backend endpoints (2026-02-13)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type {
  TipoIncapacidad,
  TipoIncapacidadFormData,
  Incapacidad,
  IncapacidadFormData,
  IncapacidadFilter,
  TipoLicencia,
  TipoLicenciaFormData,
  Licencia,
  LicenciaFormData,
  LicenciaFilter,
  AprobacionLicenciaData,
  Permiso,
  PermisoFormData,
  PermisoFilter,
  PeriodoVacaciones,
  PeriodoVacacionesFormData,
  PeriodoVacacionesFilter,
  SolicitudVacaciones,
  SolicitudVacacionesFormData,
  SolicitudVacacionesFilter,
  ConfiguracionDotacion,
  ConfiguracionDotacionFormData,
  EntregaDotacion,
  EntregaDotacionFormData,
  EntregaDotacionFilter,
} from '../types';

const BASE_URL = '/talent-hub/novedades';

// ============== QUERY KEYS ==============

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

// ============== TIPOS INCAPACIDAD ==============

export const useTiposIncapacidad = () => {
  return useQuery({
    queryKey: novedadesKeys.tiposIncapacidad.list(),
    queryFn: async () => {
      const response = await api.get(`${BASE_URL}/tipos-incapacidad/`);
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as TipoIncapacidad[];
    },
  });
};

export const useCreateTipoIncapacidad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: TipoIncapacidadFormData) => {
      const { data: response } = await api.post<TipoIncapacidad>(
        `${BASE_URL}/tipos-incapacidad/`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.tiposIncapacidad.all() });
      toast.success('Tipo de incapacidad creado exitosamente');
    },
    onError: () => toast.error('Error al crear el tipo de incapacidad'),
  });
};

export const useUpdateTipoIncapacidad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<TipoIncapacidadFormData> }) => {
      const { data: response } = await api.patch<TipoIncapacidad>(
        `${BASE_URL}/tipos-incapacidad/${id}/`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.tiposIncapacidad.all() });
      toast.success('Tipo de incapacidad actualizado');
    },
    onError: () => toast.error('Error al actualizar el tipo de incapacidad'),
  });
};

export const useDeleteTipoIncapacidad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`${BASE_URL}/tipos-incapacidad/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.tiposIncapacidad.all() });
      toast.success('Tipo de incapacidad eliminado');
    },
    onError: () => toast.error('Error al eliminar el tipo de incapacidad'),
  });
};

// ============== INCAPACIDADES ==============

export const useIncapacidades = (filters?: IncapacidadFilter) => {
  return useQuery({
    queryKey: novedadesKeys.incapacidades.list(filters),
    queryFn: async () => {
      const response = await api.get(`${BASE_URL}/incapacidades/`, { params: filters });
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as Incapacidad[];
    },
  });
};

export const useIncapacidad = (id: number, enabled = true) => {
  return useQuery({
    queryKey: novedadesKeys.incapacidades.detail(id),
    queryFn: async () => {
      const { data } = await api.get<Incapacidad>(`${BASE_URL}/incapacidades/${id}/`);
      return data;
    },
    enabled: enabled && !!id,
  });
};

export const useCreateIncapacidad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: IncapacidadFormData) => {
      const { data: response } = await api.post<Incapacidad>(`${BASE_URL}/incapacidades/`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.incapacidades.all() });
      toast.success('Incapacidad registrada exitosamente');
    },
    onError: () => toast.error('Error al registrar la incapacidad'),
  });
};

export const useUpdateIncapacidad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<IncapacidadFormData> }) => {
      const { data: response } = await api.patch<Incapacidad>(
        `${BASE_URL}/incapacidades/${id}/`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.incapacidades.all() });
      toast.success('Incapacidad actualizada');
    },
    onError: () => toast.error('Error al actualizar la incapacidad'),
  });
};

export const useDeleteIncapacidad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`${BASE_URL}/incapacidades/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.incapacidades.all() });
      toast.success('Incapacidad eliminada');
    },
    onError: () => toast.error('Error al eliminar la incapacidad'),
  });
};

export const useAprobarIncapacidad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<Incapacidad>(`${BASE_URL}/incapacidades/${id}/aprobar/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.incapacidades.all() });
      toast.success('Incapacidad aprobada');
    },
    onError: () => toast.error('Error al aprobar la incapacidad'),
  });
};

export const useRechazarIncapacidad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, observaciones }: { id: number; observaciones: string }) => {
      const { data } = await api.post<Incapacidad>(`${BASE_URL}/incapacidades/${id}/rechazar/`, {
        observaciones,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.incapacidades.all() });
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
      const { data } = await api.post<Incapacidad>(
        `${BASE_URL}/incapacidades/${id}/radicar_cobro/`,
        { fecha_radicacion_cobro }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.incapacidades.all() });
      toast.success('Cobro radicado exitosamente');
    },
    onError: () => toast.error('Error al radicar el cobro'),
  });
};

export const useEstadisticasIncapacidades = () => {
  return useQuery({
    queryKey: novedadesKeys.incapacidades.estadisticas(),
    queryFn: async () => {
      const { data } = await api.get<{
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

// ============== TIPOS LICENCIA ==============

export const useTiposLicencia = () => {
  return useQuery({
    queryKey: novedadesKeys.tiposLicencia.list(),
    queryFn: async () => {
      const response = await api.get(`${BASE_URL}/tipos-licencia/`);
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as TipoLicencia[];
    },
  });
};

export const useCreateTipoLicencia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: TipoLicenciaFormData) => {
      const { data: response } = await api.post<TipoLicencia>(`${BASE_URL}/tipos-licencia/`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.tiposLicencia.all() });
      toast.success('Tipo de licencia creado exitosamente');
    },
    onError: () => toast.error('Error al crear el tipo de licencia'),
  });
};

export const useUpdateTipoLicencia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<TipoLicenciaFormData> }) => {
      const { data: response } = await api.patch<TipoLicencia>(
        `${BASE_URL}/tipos-licencia/${id}/`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.tiposLicencia.all() });
      toast.success('Tipo de licencia actualizado');
    },
    onError: () => toast.error('Error al actualizar el tipo de licencia'),
  });
};

export const useDeleteTipoLicencia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`${BASE_URL}/tipos-licencia/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.tiposLicencia.all() });
      toast.success('Tipo de licencia eliminado');
    },
    onError: () => toast.error('Error al eliminar el tipo de licencia'),
  });
};

// ============== LICENCIAS ==============

export const useLicencias = (filters?: LicenciaFilter) => {
  return useQuery({
    queryKey: novedadesKeys.licencias.list(filters),
    queryFn: async () => {
      const response = await api.get(`${BASE_URL}/licencias/`, { params: filters });
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as Licencia[];
    },
  });
};

export const useCreateLicencia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: LicenciaFormData) => {
      const { data: response } = await api.post<Licencia>(`${BASE_URL}/licencias/`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.licencias.all() });
      toast.success('Licencia solicitada exitosamente');
    },
    onError: () => toast.error('Error al solicitar la licencia'),
  });
};

export const useUpdateLicencia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<LicenciaFormData> }) => {
      const { data: response } = await api.patch<Licencia>(`${BASE_URL}/licencias/${id}/`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.licencias.all() });
      toast.success('Licencia actualizada');
    },
    onError: () => toast.error('Error al actualizar la licencia'),
  });
};

export const useDeleteLicencia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`${BASE_URL}/licencias/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.licencias.all() });
      toast.success('Licencia eliminada');
    },
    onError: () => toast.error('Error al eliminar la licencia'),
  });
};

export const useAprobarLicencia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data?: AprobacionLicenciaData }) => {
      const { data: response } = await api.post<Licencia>(
        `${BASE_URL}/licencias/${id}/aprobar/`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.licencias.all() });
      toast.success('Licencia aprobada');
    },
    onError: () => toast.error('Error al aprobar la licencia'),
  });
};

export const useRechazarLicencia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, observaciones }: { id: number; observaciones: string }) => {
      const { data: response } = await api.post<Licencia>(`${BASE_URL}/licencias/${id}/rechazar/`, {
        observaciones,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.licencias.all() });
      toast.success('Licencia rechazada');
    },
    onError: () => toast.error('Error al rechazar la licencia'),
  });
};

// ============== PERMISOS ==============

export const usePermisos = (filters?: PermisoFilter) => {
  return useQuery({
    queryKey: novedadesKeys.permisos.list(filters),
    queryFn: async () => {
      const response = await api.get(`${BASE_URL}/permisos/`, { params: filters });
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as Permiso[];
    },
  });
};

export const useCreatePermiso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PermisoFormData) => {
      const { data: response } = await api.post<Permiso>(`${BASE_URL}/permisos/`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.permisos.all() });
      toast.success('Permiso solicitado exitosamente');
    },
    onError: () => toast.error('Error al solicitar el permiso'),
  });
};

export const useUpdatePermiso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<PermisoFormData> }) => {
      const { data: response } = await api.patch<Permiso>(`${BASE_URL}/permisos/${id}/`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.permisos.all() });
      toast.success('Permiso actualizado');
    },
    onError: () => toast.error('Error al actualizar el permiso'),
  });
};

export const useDeletePermiso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`${BASE_URL}/permisos/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.permisos.all() });
      toast.success('Permiso eliminado');
    },
    onError: () => toast.error('Error al eliminar el permiso'),
  });
};

export const useAprobarPermiso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<Permiso>(`${BASE_URL}/permisos/${id}/aprobar/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.permisos.all() });
      toast.success('Permiso aprobado');
    },
    onError: () => toast.error('Error al aprobar el permiso'),
  });
};

export const useRechazarPermiso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, observaciones }: { id: number; observaciones: string }) => {
      const { data } = await api.post<Permiso>(`${BASE_URL}/permisos/${id}/rechazar/`, {
        observaciones,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.permisos.all() });
      toast.success('Permiso rechazado');
    },
    onError: () => toast.error('Error al rechazar el permiso'),
  });
};

// ============== PERIODOS VACACIONES ==============

export const usePeriodosVacaciones = (filters?: PeriodoVacacionesFilter) => {
  return useQuery({
    queryKey: novedadesKeys.periodosVacaciones.list(filters),
    queryFn: async () => {
      const response = await api.get(`${BASE_URL}/periodos-vacaciones/`, { params: filters });
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as PeriodoVacaciones[];
    },
  });
};

export const useCreatePeriodoVacaciones = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PeriodoVacacionesFormData) => {
      const { data: response } = await api.post<PeriodoVacaciones>(
        `${BASE_URL}/periodos-vacaciones/`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.periodosVacaciones.all() });
      toast.success('Periodo de vacaciones creado');
    },
    onError: () => toast.error('Error al crear el periodo de vacaciones'),
  });
};

export const useActualizarAcumulacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<PeriodoVacaciones>(
        `${BASE_URL}/periodos-vacaciones/${id}/actualizar_acumulacion/`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.periodosVacaciones.all() });
      toast.success('Acumulacion actualizada');
    },
    onError: () => toast.error('Error al actualizar la acumulacion'),
  });
};

// ============== SOLICITUDES VACACIONES ==============

export const useSolicitudesVacaciones = (filters?: SolicitudVacacionesFilter) => {
  return useQuery({
    queryKey: novedadesKeys.solicitudesVacaciones.list(filters),
    queryFn: async () => {
      const response = await api.get(`${BASE_URL}/solicitudes-vacaciones/`, { params: filters });
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as SolicitudVacaciones[];
    },
  });
};

export const useCreateSolicitudVacaciones = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SolicitudVacacionesFormData) => {
      const { data: response } = await api.post<SolicitudVacaciones>(
        `${BASE_URL}/solicitudes-vacaciones/`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.solicitudesVacaciones.all() });
      queryClient.invalidateQueries({ queryKey: novedadesKeys.periodosVacaciones.all() });
      toast.success('Solicitud de vacaciones creada');
    },
    onError: () => toast.error('Error al crear la solicitud'),
  });
};

export const useUpdateSolicitudVacaciones = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<SolicitudVacacionesFormData>;
    }) => {
      const { data: response } = await api.patch<SolicitudVacaciones>(
        `${BASE_URL}/solicitudes-vacaciones/${id}/`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.solicitudesVacaciones.all() });
      toast.success('Solicitud actualizada');
    },
    onError: () => toast.error('Error al actualizar la solicitud'),
  });
};

export const useDeleteSolicitudVacaciones = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`${BASE_URL}/solicitudes-vacaciones/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.solicitudesVacaciones.all() });
      toast.success('Solicitud eliminada');
    },
    onError: () => toast.error('Error al eliminar la solicitud'),
  });
};

export const useAprobarVacaciones = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<SolicitudVacaciones>(
        `${BASE_URL}/solicitudes-vacaciones/${id}/aprobar/`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.solicitudesVacaciones.all() });
      queryClient.invalidateQueries({ queryKey: novedadesKeys.periodosVacaciones.all() });
      toast.success('Vacaciones aprobadas');
    },
    onError: () => toast.error('Error al aprobar las vacaciones'),
  });
};

export const useRechazarVacaciones = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, observaciones }: { id: number; observaciones: string }) => {
      const { data } = await api.post<SolicitudVacaciones>(
        `${BASE_URL}/solicitudes-vacaciones/${id}/rechazar/`,
        { observaciones }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.solicitudesVacaciones.all() });
      toast.success('Vacaciones rechazadas');
    },
    onError: () => toast.error('Error al rechazar las vacaciones'),
  });
};

// ============== CONFIGURACION DOTACION ==============

export const useConfiguracionDotacion = () => {
  return useQuery({
    queryKey: novedadesKeys.dotacionConfig.list(),
    queryFn: async () => {
      const response = await api.get(`${BASE_URL}/dotacion-config/`);
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as ConfiguracionDotacion[];
    },
  });
};

export const useCreateConfiguracionDotacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ConfiguracionDotacionFormData) => {
      const { data: response } = await api.post<ConfiguracionDotacion>(
        `${BASE_URL}/dotacion-config/`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.dotacionConfig.all() });
      toast.success('Configuracion de dotacion creada');
    },
    onError: () => toast.error('Error al crear la configuracion'),
  });
};

export const useUpdateConfiguracionDotacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<ConfiguracionDotacionFormData>;
    }) => {
      const { data: response } = await api.patch<ConfiguracionDotacion>(
        `${BASE_URL}/dotacion-config/${id}/`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.dotacionConfig.all() });
      toast.success('Configuracion actualizada');
    },
    onError: () => toast.error('Error al actualizar la configuracion'),
  });
};

// ============== ENTREGAS DOTACION ==============

export const useEntregasDotacion = (filters?: EntregaDotacionFilter) => {
  return useQuery({
    queryKey: novedadesKeys.entregasDotacion.list(filters),
    queryFn: async () => {
      const response = await api.get(`${BASE_URL}/entregas-dotacion/`, { params: filters });
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as EntregaDotacion[];
    },
  });
};

export const useCreateEntregaDotacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: EntregaDotacionFormData) => {
      const { data: response } = await api.post<EntregaDotacion>(
        `${BASE_URL}/entregas-dotacion/`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.entregasDotacion.all() });
      toast.success('Entrega de dotacion registrada');
    },
    onError: () => toast.error('Error al registrar la entrega'),
  });
};

export const useUpdateEntregaDotacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<EntregaDotacionFormData> }) => {
      const { data: response } = await api.patch<EntregaDotacion>(
        `${BASE_URL}/entregas-dotacion/${id}/`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.entregasDotacion.all() });
      toast.success('Entrega actualizada');
    },
    onError: () => toast.error('Error al actualizar la entrega'),
  });
};

export const useDeleteEntregaDotacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`${BASE_URL}/entregas-dotacion/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.entregasDotacion.all() });
      toast.success('Entrega eliminada');
    },
    onError: () => toast.error('Error al eliminar la entrega'),
  });
};
