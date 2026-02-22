/**
 * React Query Hooks para Colaboradores - Talent Hub
 * Sistema de Gestión StrateKaz
 *
 * Sprint 20: Migrado a factories (talentHubApi + thKeys).
 * Antes: 529 líneas | Ahora: ~150 líneas (-72%)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { thKeys } from '../api/queryKeys';
import {
  colaboradorApi,
  hojaVidaApi,
  infoPersonalApi,
  historialLaboralApi,
} from '../api/talentHubApi';
import { apiClient as api } from '@/lib/api-client';
import type {
  Colaborador,
  ColaboradorFormData,
  ColaboradorFilters,
  ColaboradorCompleto,
  ColaboradorEstadisticas,
  HojaVida,
  HojaVidaFormData,
  InfoPersonal,
  InfoPersonalFormData,
  HistorialLaboral,
  HistorialLaboralFormData,
  HistorialLaboralFilters,
} from '../types';

// ============================================================================
// QUERY KEYS — backward compat (remap to thKeys)
// ============================================================================

export const colaboradoresKeys = {
  all: thKeys.colaboradores.all,
  list: (filters?: ColaboradorFilters) => thKeys.colaboradores.list(filters),
  detail: (id: string) => thKeys.colaboradores.detail(id),
  completo: (id: string) => thKeys.colaboradores.custom('completo', id),
  activos: () => thKeys.colaboradores.custom('activos'),
  porArea: (areaId: string) => thKeys.colaboradores.custom('area', areaId),
  porCargo: (cargoId: string) => thKeys.colaboradores.custom('cargo', cargoId),
  estadisticas: () => thKeys.estadisticasColaboradores.all,
  hojasVida: {
    all: thKeys.hojasVida.all,
    list: () => thKeys.hojasVida.lists(),
    detail: (id: string) => thKeys.hojasVida.detail(id),
    porColaborador: (colaboradorId: string) =>
      thKeys.hojasVida.custom('colaborador', colaboradorId),
  },
  infoPersonal: {
    all: thKeys.infoPersonal.all,
    list: () => thKeys.infoPersonal.lists(),
    detail: (id: string) => thKeys.infoPersonal.detail(id),
    porColaborador: (colaboradorId: string) =>
      thKeys.infoPersonal.custom('colaborador', colaboradorId),
  },
  historialLaboral: {
    all: thKeys.historialLaboral.all,
    list: (filters?: HistorialLaboralFilters) => thKeys.historialLaboral.list(filters),
    detail: (id: string) => thKeys.historialLaboral.detail(id),
    porColaborador: (colaboradorId: string) =>
      thKeys.historialLaboral.custom('colaborador', colaboradorId),
    ascensos: () => thKeys.historialLaboral.custom('ascensos'),
    traslados: () => thKeys.historialLaboral.custom('traslados'),
  },
};

// ============================================================================
// HELPERS
// ============================================================================

function getMsg(error: unknown, fallback: string): string {
  if (error instanceof AxiosError && error.response?.data) {
    const d = error.response.data;
    if (typeof d === 'string') return d;
    if (d.detail) return String(d.detail);
    if (d.message) return String(d.message);
    // Field-level errors (e.g. numero_identificacion)
    if (typeof d === 'object') {
      const msgs: string[] = [];
      for (const [k, v] of Object.entries(d)) {
        if (Array.isArray(v)) msgs.push(`${k}: ${v.join(', ')}`);
        else if (typeof v === 'string') msgs.push(`${k}: ${v}`);
      }
      if (msgs.length) return msgs.join('\n');
    }
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'results' in data)
    return (data as { results: T[] }).results ?? [];
  return [];
}

// ============================================================================
// HOOKS - COLABORADORES
// ============================================================================

export function useColaboradores(filters?: ColaboradorFilters) {
  return useQuery({
    queryKey: colaboradoresKeys.list(filters),
    queryFn: async () => {
      const response = await colaboradorApi.getAll(filters as Record<string, unknown>);
      return unwrapList<Colaborador>(response);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useColaborador(id: string) {
  return useQuery({
    queryKey: colaboradoresKeys.detail(id),
    queryFn: () => colaboradorApi.getById(Number(id)),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useColaboradorCompleto(id: string) {
  return useQuery({
    queryKey: colaboradoresKeys.completo(id),
    queryFn: async () => {
      const r = await api.get<ColaboradorCompleto>(
        `/talent-hub/empleados/colaboradores/${id}/completo/`
      );
      return r.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useColaboradoresActivos() {
  return useQuery({
    queryKey: colaboradoresKeys.activos(),
    queryFn: async () => {
      const r = await api.get('/talent-hub/empleados/colaboradores/activos/');
      return unwrapList<Colaborador>(r.data);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useColaboradoresPorArea(areaId: string) {
  return useQuery({
    queryKey: colaboradoresKeys.porArea(areaId),
    queryFn: async () => {
      const r = await api.get(`/talent-hub/empleados/colaboradores/por-area/${areaId}/`);
      return unwrapList<Colaborador>(r.data);
    },
    enabled: !!areaId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useColaboradoresPorCargo(cargoId: string) {
  return useQuery({
    queryKey: colaboradoresKeys.porCargo(cargoId),
    queryFn: async () => {
      const r = await api.get(`/talent-hub/empleados/colaboradores/por-cargo/${cargoId}/`);
      return unwrapList<Colaborador>(r.data);
    },
    enabled: !!cargoId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useColaboradoresEstadisticas() {
  return useQuery({
    queryKey: colaboradoresKeys.estadisticas(),
    queryFn: () => colaboradorApi.estadisticas(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateColaborador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ColaboradorFormData) => colaboradorApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: thKeys.colaboradores.all });
      qc.invalidateQueries({ queryKey: thKeys.estadisticasColaboradores.all });
      toast.success('Colaborador creado exitosamente');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al crear el colaborador')),
  });
}

export function useUpdateColaborador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ColaboradorFormData> }) =>
      api.patch(`/talent-hub/empleados/colaboradores/${id}/`, data).then((r) => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: thKeys.colaboradores.all });
      qc.invalidateQueries({ queryKey: colaboradoresKeys.detail(id) });
      qc.invalidateQueries({ queryKey: colaboradoresKeys.completo(id) });
      toast.success('Colaborador actualizado exitosamente');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al actualizar el colaborador')),
  });
}

export function useRetirarColaborador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      fecha_retiro,
      motivo_retiro,
    }: {
      id: string;
      fecha_retiro?: string;
      motivo_retiro?: string;
    }) =>
      colaboradorApi.retirar(id, {
        fecha_retiro: fecha_retiro ?? new Date().toISOString().split('T')[0],
        motivo_retiro: motivo_retiro ?? '',
      }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: thKeys.colaboradores.all });
      qc.invalidateQueries({ queryKey: colaboradoresKeys.detail(id) });
      qc.invalidateQueries({ queryKey: thKeys.estadisticasColaboradores.all });
      qc.invalidateQueries({ queryKey: colaboradoresKeys.historialLaboral.porColaborador(id) });
      toast.success('Colaborador retirado exitosamente');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al retirar el colaborador')),
  });
}

// ============================================================================
// HOOKS - CREAR ACCESO (para colaboradores existentes sin usuario)
// ============================================================================

export function useCrearAccesoColaborador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      email_corporativo,
      username,
    }: {
      id: string;
      email_corporativo: string;
      username: string;
    }) =>
      api
        .post(`/talent-hub/empleados/colaboradores/${id}/crear-acceso/`, {
          email_corporativo,
          username,
        })
        .then((r) => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: thKeys.colaboradores.all });
      qc.invalidateQueries({ queryKey: colaboradoresKeys.detail(id) });
      qc.invalidateQueries({ queryKey: colaboradoresKeys.completo(id) });
      toast.success('Acceso al sistema creado. Se envió un correo para configurar la contraseña.');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al crear acceso al sistema')),
  });
}

// ============================================================================
// HOOKS - HOJA DE VIDA
// ============================================================================

export function useHojaVidaColaborador(colaboradorId: string) {
  return useQuery({
    queryKey: colaboradoresKeys.hojasVida.porColaborador(colaboradorId),
    queryFn: async () => {
      const r = await api.get<HojaVida>(
        `/talent-hub/empleados/hojas-vida/por-colaborador/${colaboradorId}/`
      );
      return r.data;
    },
    enabled: !!colaboradorId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateHojaVida() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: HojaVidaFormData) => hojaVidaApi.create(data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: thKeys.hojasVida.all });
      qc.invalidateQueries({
        queryKey: colaboradoresKeys.hojasVida.porColaborador(vars.colaborador),
      });
      qc.invalidateQueries({ queryKey: colaboradoresKeys.completo(vars.colaborador) });
      toast.success('Hoja de vida creada exitosamente');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al crear la hoja de vida')),
  });
}

export function useUpdateHojaVida() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HojaVidaFormData> }) =>
      api.patch(`/talent-hub/empleados/hojas-vida/${id}/`, data).then((r) => r.data),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: thKeys.hojasVida.all });
      if (result.colaborador) {
        const colId = result.colaborador.id || result.colaborador;
        qc.invalidateQueries({ queryKey: colaboradoresKeys.completo(String(colId)) });
      }
      toast.success('Hoja de vida actualizada exitosamente');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al actualizar la hoja de vida')),
  });
}

// ============================================================================
// HOOKS - INFORMACIÓN PERSONAL
// ============================================================================

export function useInfoPersonalColaborador(colaboradorId: string) {
  return useQuery({
    queryKey: colaboradoresKeys.infoPersonal.porColaborador(colaboradorId),
    queryFn: async () => {
      const r = await api.get<InfoPersonal>(
        `/talent-hub/empleados/info-personal/por-colaborador/${colaboradorId}/`
      );
      return r.data;
    },
    enabled: !!colaboradorId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateInfoPersonal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: InfoPersonalFormData) => infoPersonalApi.create(data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: thKeys.infoPersonal.all });
      qc.invalidateQueries({
        queryKey: colaboradoresKeys.infoPersonal.porColaborador(vars.colaborador),
      });
      qc.invalidateQueries({ queryKey: colaboradoresKeys.completo(vars.colaborador) });
      toast.success('Información personal registrada exitosamente');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al registrar la información personal')),
  });
}

export function useUpdateInfoPersonal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InfoPersonalFormData> }) =>
      api.patch(`/talent-hub/empleados/info-personal/${id}/`, data).then((r) => r.data),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: thKeys.infoPersonal.all });
      if (result.colaborador) {
        const colId = result.colaborador.id || result.colaborador;
        qc.invalidateQueries({ queryKey: colaboradoresKeys.completo(String(colId)) });
      }
      toast.success('Información personal actualizada exitosamente');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al actualizar la información personal')),
  });
}

// ============================================================================
// HOOKS - HISTORIAL LABORAL
// ============================================================================

export function useHistorialLaboral(filters?: HistorialLaboralFilters) {
  return useQuery({
    queryKey: colaboradoresKeys.historialLaboral.list(filters),
    queryFn: async () => {
      const response = await historialLaboralApi.getAll(filters as Record<string, unknown>);
      return unwrapList<HistorialLaboral>(response);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useHistorialLaboralColaborador(colaboradorId: string) {
  return useQuery({
    queryKey: colaboradoresKeys.historialLaboral.porColaborador(colaboradorId),
    queryFn: async () => {
      const r = await api.get(
        `/talent-hub/empleados/historial-laboral/por-colaborador/${colaboradorId}/`
      );
      return unwrapList<HistorialLaboral>(r.data);
    },
    enabled: !!colaboradorId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAscensos() {
  return useQuery({
    queryKey: colaboradoresKeys.historialLaboral.ascensos(),
    queryFn: async () => {
      const r = await api.get('/talent-hub/empleados/historial-laboral/ascensos/');
      return unwrapList<HistorialLaboral>(r.data);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useTraslados() {
  return useQuery({
    queryKey: colaboradoresKeys.historialLaboral.traslados(),
    queryFn: async () => {
      const r = await api.get('/talent-hub/empleados/historial-laboral/traslados/');
      return unwrapList<HistorialLaboral>(r.data);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateHistorialLaboral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: HistorialLaboralFormData) => historialLaboralApi.create(data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: thKeys.historialLaboral.all });
      qc.invalidateQueries({
        queryKey: colaboradoresKeys.historialLaboral.porColaborador(vars.colaborador),
      });
      qc.invalidateQueries({ queryKey: colaboradoresKeys.completo(vars.colaborador) });
      toast.success('Movimiento registrado exitosamente');
    },
    onError: (e) => toast.error(getMsg(e, 'Error al registrar el movimiento')),
  });
}
