/**
 * Hooks para Novedades - Talent Hub
 * Sistema de Gestión StrateKaz
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api-client';
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
  TipoPermiso,
  TipoPermisoFormData,
  Permiso,
  PermisoFormData,
  PermisoFilter,
  PeriodoVacaciones,
  PeriodoVacacionesFilter,
  SolicitudVacaciones,
  SolicitudVacacionesFormData,
  SolicitudVacacionesFilter,
} from '../types';

const BASE_URL = '/api/v1/talent-hub/novedades';

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
    list: (filters?: IncapacidadFilter) => [...novedadesKeys.incapacidades.all(), 'list', filters] as const,
    detail: (id: number) => [...novedadesKeys.incapacidades.all(), 'detail', id] as const,
  },
  tiposLicencia: {
    all: () => [...novedadesKeys.all, 'tipos-licencia'] as const,
    list: () => [...novedadesKeys.tiposLicencia.all(), 'list'] as const,
    detail: (id: number) => [...novedadesKeys.tiposLicencia.all(), 'detail', id] as const,
  },
  licencias: {
    all: () => [...novedadesKeys.all, 'licencias'] as const,
    list: (filters?: LicenciaFilter) => [...novedadesKeys.licencias.all(), 'list', filters] as const,
    detail: (id: number) => [...novedadesKeys.licencias.all(), 'detail', id] as const,
  },
  tiposPermiso: {
    all: () => [...novedadesKeys.all, 'tipos-permiso'] as const,
    list: () => [...novedadesKeys.tiposPermiso.all(), 'list'] as const,
    detail: (id: number) => [...novedadesKeys.tiposPermiso.all(), 'detail', id] as const,
  },
  permisos: {
    all: () => [...novedadesKeys.all, 'permisos'] as const,
    list: (filters?: PermisoFilter) => [...novedadesKeys.permisos.all(), 'list', filters] as const,
    detail: (id: number) => [...novedadesKeys.permisos.all(), 'detail', id] as const,
  },
  periodosVacaciones: {
    all: () => [...novedadesKeys.all, 'periodos-vacaciones'] as const,
    list: (filters?: PeriodoVacacionesFilter) => [...novedadesKeys.periodosVacaciones.all(), 'list', filters] as const,
    detail: (id: number) => [...novedadesKeys.periodosVacaciones.all(), 'detail', id] as const,
  },
  solicitudesVacaciones: {
    all: () => [...novedadesKeys.all, 'solicitudes-vacaciones'] as const,
    list: (filters?: SolicitudVacacionesFilter) => [...novedadesKeys.solicitudesVacaciones.all(), 'list', filters] as const,
    detail: (id: number) => [...novedadesKeys.solicitudesVacaciones.all(), 'detail', id] as const,
  },
};

// ============== TIPOS INCAPACIDAD ==============

export const useTiposIncapacidad = () => {
  return useQuery({
    queryKey: novedadesKeys.tiposIncapacidad.list(),
    queryFn: async () => {
      const { data } = await api.get<TipoIncapacidad[]>(`${BASE_URL}/tipos-incapacidad/`);
      return data;
    },
  });
};

export const useTipoIncapacidad = (id: number, enabled = true) => {
  return useQuery({
    queryKey: novedadesKeys.tiposIncapacidad.detail(id),
    queryFn: async () => {
      const { data } = await api.get<TipoIncapacidad>(`${BASE_URL}/tipos-incapacidad/${id}/`);
      return data;
    },
    enabled: enabled && !!id,
  });
};

export const useCreateTipoIncapacidad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: TipoIncapacidadFormData) => {
      const { data: response } = await api.post<TipoIncapacidad>(`${BASE_URL}/tipos-incapacidad/`, data);
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
      const { data: response } = await api.patch<TipoIncapacidad>(`${BASE_URL}/tipos-incapacidad/${id}/`, data);
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.tiposIncapacidad.all() });
      queryClient.invalidateQueries({ queryKey: novedadesKeys.tiposIncapacidad.detail(id) });
      toast.success('Tipo de incapacidad actualizado exitosamente');
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
      toast.success('Tipo de incapacidad eliminado exitosamente');
    },
    onError: () => toast.error('Error al eliminar el tipo de incapacidad'),
  });
};

// ============== INCAPACIDADES ==============

export const useIncapacidades = (filters?: IncapacidadFilter) => {
  return useQuery({
    queryKey: novedadesKeys.incapacidades.list(filters),
    queryFn: async () => {
      const { data } = await api.get<Incapacidad[]>(`${BASE_URL}/incapacidades/`, { params: filters });
      return data;
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
      const { data: response } = await api.patch<Incapacidad>(`${BASE_URL}/incapacidades/${id}/`, data);
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.incapacidades.all() });
      queryClient.invalidateQueries({ queryKey: novedadesKeys.incapacidades.detail(id) });
      toast.success('Incapacidad actualizada exitosamente');
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
      toast.success('Incapacidad eliminada exitosamente');
    },
    onError: () => toast.error('Error al eliminar la incapacidad'),
  });
};

// ============== TIPOS LICENCIA ==============

export const useTiposLicencia = () => {
  return useQuery({
    queryKey: novedadesKeys.tiposLicencia.list(),
    queryFn: async () => {
      const { data } = await api.get<TipoLicencia[]>(`${BASE_URL}/tipos-licencia/`);
      return data;
    },
  });
};

export const useTipoLicencia = (id: number, enabled = true) => {
  return useQuery({
    queryKey: novedadesKeys.tiposLicencia.detail(id),
    queryFn: async () => {
      const { data } = await api.get<TipoLicencia>(`${BASE_URL}/tipos-licencia/${id}/`);
      return data;
    },
    enabled: enabled && !!id,
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
      const { data: response } = await api.patch<TipoLicencia>(`${BASE_URL}/tipos-licencia/${id}/`, data);
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.tiposLicencia.all() });
      queryClient.invalidateQueries({ queryKey: novedadesKeys.tiposLicencia.detail(id) });
      toast.success('Tipo de licencia actualizado exitosamente');
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
      toast.success('Tipo de licencia eliminado exitosamente');
    },
    onError: () => toast.error('Error al eliminar el tipo de licencia'),
  });
};

// ============== LICENCIAS ==============

export const useLicencias = (filters?: LicenciaFilter) => {
  return useQuery({
    queryKey: novedadesKeys.licencias.list(filters),
    queryFn: async () => {
      const { data } = await api.get<Licencia[]>(`${BASE_URL}/licencias/`, { params: filters });
      return data;
    },
  });
};

export const useLicencia = (id: number, enabled = true) => {
  return useQuery({
    queryKey: novedadesKeys.licencias.detail(id),
    queryFn: async () => {
      const { data } = await api.get<Licencia>(`${BASE_URL}/licencias/${id}/`);
      return data;
    },
    enabled: enabled && !!id,
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
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.licencias.all() });
      queryClient.invalidateQueries({ queryKey: novedadesKeys.licencias.detail(id) });
      toast.success('Licencia actualizada exitosamente');
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
      toast.success('Licencia eliminada exitosamente');
    },
    onError: () => toast.error('Error al eliminar la licencia'),
  });
};

export const useAprobarLicencia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: AprobacionLicenciaData }) => {
      const { data: response } = await api.post<Licencia>(`${BASE_URL}/licencias/${id}/aprobar/`, data);
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.licencias.all() });
      queryClient.invalidateQueries({ queryKey: novedadesKeys.licencias.detail(id) });
      toast.success('Licencia aprobada exitosamente');
    },
    onError: () => toast.error('Error al aprobar la licencia'),
  });
};

export const useRechazarLicencia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, observaciones }: { id: number; observaciones: string }) => {
      const { data: response } = await api.post<Licencia>(`${BASE_URL}/licencias/${id}/rechazar/`, { observaciones_aprobacion: observaciones });
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.licencias.all() });
      queryClient.invalidateQueries({ queryKey: novedadesKeys.licencias.detail(id) });
      toast.success('Licencia rechazada');
    },
    onError: () => toast.error('Error al rechazar la licencia'),
  });
};

// ============== TIPOS PERMISO ==============

export const useTiposPermiso = () => {
  return useQuery({
    queryKey: novedadesKeys.tiposPermiso.list(),
    queryFn: async () => {
      const { data } = await api.get<TipoPermiso[]>(`${BASE_URL}/tipos-permiso/`);
      return data;
    },
  });
};

export const useTipoPermiso = (id: number, enabled = true) => {
  return useQuery({
    queryKey: novedadesKeys.tiposPermiso.detail(id),
    queryFn: async () => {
      const { data } = await api.get<TipoPermiso>(`${BASE_URL}/tipos-permiso/${id}/`);
      return data;
    },
    enabled: enabled && !!id,
  });
};

export const useCreateTipoPermiso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: TipoPermisoFormData) => {
      const { data: response } = await api.post<TipoPermiso>(`${BASE_URL}/tipos-permiso/`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.tiposPermiso.all() });
      toast.success('Tipo de permiso creado exitosamente');
    },
    onError: () => toast.error('Error al crear el tipo de permiso'),
  });
};

export const useUpdateTipoPermiso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<TipoPermisoFormData> }) => {
      const { data: response } = await api.patch<TipoPermiso>(`${BASE_URL}/tipos-permiso/${id}/`, data);
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.tiposPermiso.all() });
      queryClient.invalidateQueries({ queryKey: novedadesKeys.tiposPermiso.detail(id) });
      toast.success('Tipo de permiso actualizado exitosamente');
    },
    onError: () => toast.error('Error al actualizar el tipo de permiso'),
  });
};

export const useDeleteTipoPermiso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`${BASE_URL}/tipos-permiso/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.tiposPermiso.all() });
      toast.success('Tipo de permiso eliminado exitosamente');
    },
    onError: () => toast.error('Error al eliminar el tipo de permiso'),
  });
};

// ============== PERMISOS ==============

export const usePermisos = (filters?: PermisoFilter) => {
  return useQuery({
    queryKey: novedadesKeys.permisos.list(filters),
    queryFn: async () => {
      const { data } = await api.get<Permiso[]>(`${BASE_URL}/permisos/`, { params: filters });
      return data;
    },
  });
};

export const usePermiso = (id: number, enabled = true) => {
  return useQuery({
    queryKey: novedadesKeys.permisos.detail(id),
    queryFn: async () => {
      const { data } = await api.get<Permiso>(`${BASE_URL}/permisos/${id}/`);
      return data;
    },
    enabled: enabled && !!id,
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
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.permisos.all() });
      queryClient.invalidateQueries({ queryKey: novedadesKeys.permisos.detail(id) });
      toast.success('Permiso actualizado exitosamente');
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
      toast.success('Permiso eliminado exitosamente');
    },
    onError: () => toast.error('Error al eliminar el permiso'),
  });
};

export const useAprobarPermiso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data: response } = await api.post<Permiso>(`${BASE_URL}/permisos/${id}/aprobar/`);
      return response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.permisos.all() });
      queryClient.invalidateQueries({ queryKey: novedadesKeys.permisos.detail(id) });
      toast.success('Permiso aprobado exitosamente');
    },
    onError: () => toast.error('Error al aprobar el permiso'),
  });
};

export const useRechazarPermiso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, observaciones }: { id: number; observaciones: string }) => {
      const { data: response } = await api.post<Permiso>(`${BASE_URL}/permisos/${id}/rechazar/`, { observaciones });
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.permisos.all() });
      queryClient.invalidateQueries({ queryKey: novedadesKeys.permisos.detail(id) });
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
      const { data } = await api.get<PeriodoVacaciones[]>(`${BASE_URL}/periodos-vacaciones/`, { params: filters });
      return data;
    },
  });
};

export const usePeriodoVacaciones = (id: number, enabled = true) => {
  return useQuery({
    queryKey: novedadesKeys.periodosVacaciones.detail(id),
    queryFn: async () => {
      const { data } = await api.get<PeriodoVacaciones>(`${BASE_URL}/periodos-vacaciones/${id}/`);
      return data;
    },
    enabled: enabled && !!id,
  });
};

// ============== SOLICITUDES VACACIONES ==============

export const useSolicitudesVacaciones = (filters?: SolicitudVacacionesFilter) => {
  return useQuery({
    queryKey: novedadesKeys.solicitudesVacaciones.list(filters),
    queryFn: async () => {
      const { data } = await api.get<SolicitudVacaciones[]>(`${BASE_URL}/solicitudes-vacaciones/`, { params: filters });
      return data;
    },
  });
};

export const useSolicitudVacaciones = (id: number, enabled = true) => {
  return useQuery({
    queryKey: novedadesKeys.solicitudesVacaciones.detail(id),
    queryFn: async () => {
      const { data } = await api.get<SolicitudVacaciones>(`${BASE_URL}/solicitudes-vacaciones/${id}/`);
      return data;
    },
    enabled: enabled && !!id,
  });
};

export const useCreateSolicitudVacaciones = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SolicitudVacacionesFormData) => {
      const { data: response } = await api.post<SolicitudVacaciones>(`${BASE_URL}/solicitudes-vacaciones/`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.solicitudesVacaciones.all() });
      queryClient.invalidateQueries({ queryKey: novedadesKeys.periodosVacaciones.all() });
      toast.success('Solicitud de vacaciones creada exitosamente');
    },
    onError: () => toast.error('Error al crear la solicitud de vacaciones'),
  });
};

export const useUpdateSolicitudVacaciones = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<SolicitudVacacionesFormData> }) => {
      const { data: response } = await api.patch<SolicitudVacaciones>(`${BASE_URL}/solicitudes-vacaciones/${id}/`, data);
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.solicitudesVacaciones.all() });
      queryClient.invalidateQueries({ queryKey: novedadesKeys.solicitudesVacaciones.detail(id) });
      toast.success('Solicitud de vacaciones actualizada exitosamente');
    },
    onError: () => toast.error('Error al actualizar la solicitud de vacaciones'),
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
      toast.success('Solicitud de vacaciones eliminada exitosamente');
    },
    onError: () => toast.error('Error al eliminar la solicitud de vacaciones'),
  });
};

export const useAprobarVacaciones = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data: response } = await api.post<SolicitudVacaciones>(`${BASE_URL}/solicitudes-vacaciones/${id}/aprobar/`);
      return response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.solicitudesVacaciones.all() });
      queryClient.invalidateQueries({ queryKey: novedadesKeys.solicitudesVacaciones.detail(id) });
      queryClient.invalidateQueries({ queryKey: novedadesKeys.periodosVacaciones.all() });
      toast.success('Vacaciones aprobadas exitosamente');
    },
    onError: () => toast.error('Error al aprobar las vacaciones'),
  });
};

export const useCancelarVacaciones = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: number; motivo: string }) => {
      const { data: response } = await api.post<SolicitudVacaciones>(`${BASE_URL}/solicitudes-vacaciones/${id}/cancelar/`, { motivo_cancelacion: motivo });
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: novedadesKeys.solicitudesVacaciones.all() });
      queryClient.invalidateQueries({ queryKey: novedadesKeys.solicitudesVacaciones.detail(id) });
      queryClient.invalidateQueries({ queryKey: novedadesKeys.periodosVacaciones.all() });
      toast.success('Vacaciones canceladas');
    },
    onError: () => toast.error('Error al cancelar las vacaciones'),
  });
};
