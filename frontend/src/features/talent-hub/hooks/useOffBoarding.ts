/**
 * Hooks para Off-Boarding - Talent Hub
 * Sistema de Gestión StrateKaz
 *
 * Sincronizado con backend: apps/talent_hub/off_boarding/views.py
 * - URLs y @action url_path coinciden con backend (kebab-case)
 * - Payloads de mutación coinciden con serializers
 * - Factory para CRUD básico, manual para @actions custom
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { createCrudHooks } from '@/lib/crud-hooks-factory';
import {
  tipoRetiroApi,
  procesoRetiroApi,
  checklistRetiroApi,
  pazSalvoApi,
  examenEgresoApi,
  entrevistaRetiroApi,
  liquidacionFinalApi,
  certificadoTrabajoApi,
} from '../api/talentHubApi';
import { thKeys } from '../api/queryKeys';
import type {
  TipoRetiro,
  TipoRetiroFormData,
  ProcesoRetiro,
  ProcesoRetiroFormData,
  ProcesoRetiroFilter,
  ChecklistRetiro,
  ChecklistRetiroFormData,
  ChecklistRetiroFilter,
  MarcarCompletadoData,
  PazSalvo,
  PazSalvoFormData,
  PazSalvoFilter,
  AprobarPazSalvoData,
  ExamenEgreso,
  ExamenEgresoFormData,
  ExamenEgresoFilter,
  EntrevistaRetiro,
  EntrevistaRetiroFormData,
  EntrevistaRetiroFilter,
  LiquidacionFinal,
  LiquidacionFinalFormData,
  LiquidacionFinalFilter,
  RegistrarPagoData,
  CertificadoTrabajo,
  CertificadoTrabajoFormData,
  CertificadoTrabajoFilter,
} from '../types';

const BASE_URL = '/talent-hub/off-boarding';

// ============== QUERY KEYS (backward compat re-exports) ==============

export const offBoardingKeys = {
  all: ['off-boarding'] as const,
  tiposRetiro: {
    all: () => thKeys.tiposRetiro.all,
    list: () => thKeys.tiposRetiro.lists(),
    detail: (id: number) => thKeys.tiposRetiro.detail(id),
  },
  procesos: {
    all: () => thKeys.procesosRetiro.all,
    list: (filters?: ProcesoRetiroFilter) =>
      thKeys.procesosRetiro.list(filters as Record<string, unknown>),
    detail: (id: number) => thKeys.procesosRetiro.detail(id),
  },
  checklist: {
    all: () => thKeys.checklistRetiro.all,
    list: (filters?: ChecklistRetiroFilter) =>
      thKeys.checklistRetiro.list(filters as Record<string, unknown>),
    detail: (id: number) => thKeys.checklistRetiro.detail(id),
  },
  pazSalvos: {
    all: () => thKeys.pazSalvos.all,
    list: (filters?: PazSalvoFilter) => thKeys.pazSalvos.list(filters as Record<string, unknown>),
    detail: (id: number) => thKeys.pazSalvos.detail(id),
  },
  examenes: {
    all: () => thKeys.examenesEgreso.all,
    list: (filters?: ExamenEgresoFilter) =>
      thKeys.examenesEgreso.list(filters as Record<string, unknown>),
    detail: (id: number) => thKeys.examenesEgreso.detail(id),
  },
  entrevistas: {
    all: () => thKeys.entrevistasRetiro.all,
    list: (filters?: EntrevistaRetiroFilter) =>
      thKeys.entrevistasRetiro.list(filters as Record<string, unknown>),
    detail: (id: number) => thKeys.entrevistasRetiro.detail(id),
  },
  liquidaciones: {
    all: () => thKeys.liquidacionesFinales.all,
    list: (filters?: LiquidacionFinalFilter) =>
      thKeys.liquidacionesFinales.list(filters as Record<string, unknown>),
    detail: (id: number) => thKeys.liquidacionesFinales.detail(id),
  },
  certificados: {
    all: () => thKeys.certificadosTrabajo.all,
    list: (filters?: CertificadoTrabajoFilter) =>
      thKeys.certificadosTrabajo.list(filters as Record<string, unknown>),
    detail: (id: number) => thKeys.certificadosTrabajo.detail(id),
  },
};

// ============== TIPOS RETIRO (via factory) ==============

const tipoRetiroHooks = createCrudHooks<
  TipoRetiro,
  TipoRetiroFormData,
  Partial<TipoRetiroFormData>
>(tipoRetiroApi, thKeys.tiposRetiro, 'Tipo de retiro');

export const useTiposRetiro = tipoRetiroHooks.useList;

export const useTipoRetiro = (id: number, enabled = true) => {
  return useQuery({
    queryKey: thKeys.tiposRetiro.detail(id),
    queryFn: () => tipoRetiroApi.getById(id),
    enabled: enabled && !!id,
  });
};

export const useCreateTipoRetiro = tipoRetiroHooks.useCreate;
export const useUpdateTipoRetiro = tipoRetiroHooks.useUpdate;
export const useDeleteTipoRetiro = tipoRetiroHooks.useDelete;

// ============== PROCESOS RETIRO (via factory + custom actions) ==============

const procesoRetiroHooks = createCrudHooks<
  ProcesoRetiro,
  ProcesoRetiroFormData,
  Partial<ProcesoRetiroFormData>
>(procesoRetiroApi, thKeys.procesosRetiro, 'Proceso de retiro');

export const useProcesosRetiro = (filters?: ProcesoRetiroFilter) => {
  return procesoRetiroHooks.useList(filters as Record<string, unknown>);
};

export const useProcesoRetiro = (id: number, enabled = true) => {
  return useQuery({
    queryKey: thKeys.procesosRetiro.detail(id),
    queryFn: () => procesoRetiroApi.getById(id),
    enabled: enabled && !!id,
  });
};

export const useCreateProcesoRetiro = procesoRetiroHooks.useCreate;
export const useUpdateProcesoRetiro = procesoRetiroHooks.useUpdate;
export const useDeleteProcesoRetiro = procesoRetiroHooks.useDelete;

/** POST /procesos/{id}/autorizar/ */
export const useAutorizarProcesoRetiro = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post(`${BASE_URL}/procesos/${id}/autorizar/`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: thKeys.procesosRetiro.all });
      queryClient.invalidateQueries({ queryKey: thKeys.procesosRetiro.detail(id) });
      toast.success('Proceso autorizado exitosamente');
    },
    onError: () => toast.error('Error al autorizar el proceso'),
  });
};

/** POST /procesos/{id}/verificar-progreso/ */
export const useVerificarProgresoRetiro = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post(`${BASE_URL}/procesos/${id}/verificar-progreso/`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: thKeys.procesosRetiro.detail(id) });
      toast.success('Progreso actualizado');
    },
    onError: () => toast.error('Error al verificar progreso'),
  });
};

/** POST /procesos/{id}/completar-checklist/ */
export const useCompletarChecklistProceso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post(`${BASE_URL}/procesos/${id}/completar-checklist/`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: thKeys.procesosRetiro.all });
      queryClient.invalidateQueries({ queryKey: thKeys.procesosRetiro.detail(id) });
      toast.success('Checklist marcado como completado');
    },
    onError: () => toast.error('Error al completar checklist'),
  });
};

/** POST /procesos/{id}/completar-paz-salvos/ */
export const useCompletarPazSalvosProceso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post(`${BASE_URL}/procesos/${id}/completar-paz-salvos/`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: thKeys.procesosRetiro.all });
      queryClient.invalidateQueries({ queryKey: thKeys.procesosRetiro.detail(id) });
      toast.success('Paz y salvos marcados como completos');
    },
    onError: () => toast.error('Error al completar paz y salvos'),
  });
};

/** POST /procesos/{id}/completar-examen/ */
export const useCompletarExamenProceso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post(`${BASE_URL}/procesos/${id}/completar-examen/`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: thKeys.procesosRetiro.all });
      queryClient.invalidateQueries({ queryKey: thKeys.procesosRetiro.detail(id) });
      toast.success('Examen de egreso marcado como realizado');
    },
    onError: () => toast.error('Error al completar examen'),
  });
};

/** POST /procesos/{id}/completar-entrevista/ */
export const useCompletarEntrevistaProceso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post(`${BASE_URL}/procesos/${id}/completar-entrevista/`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: thKeys.procesosRetiro.all });
      queryClient.invalidateQueries({ queryKey: thKeys.procesosRetiro.detail(id) });
      toast.success('Entrevista marcada como realizada');
    },
    onError: () => toast.error('Error al completar entrevista'),
  });
};

/** POST /procesos/{id}/completar-liquidacion/ */
export const useCompletarLiquidacionProceso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post(`${BASE_URL}/procesos/${id}/completar-liquidacion/`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: thKeys.procesosRetiro.all });
      queryClient.invalidateQueries({ queryKey: thKeys.procesosRetiro.detail(id) });
      toast.success('Liquidación marcada como aprobada en el proceso');
    },
    onError: () => toast.error('Error al completar liquidación en el proceso'),
  });
};

/** POST /procesos/{id}/cerrar-proceso/ */
export const useCerrarProcesoRetiro = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post<{ proceso: ProcesoRetiro }>(
        `${BASE_URL}/procesos/${id}/cerrar-proceso/`
      );
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: thKeys.procesosRetiro.all });
      queryClient.invalidateQueries({ queryKey: thKeys.procesosRetiro.detail(id) });
      toast.success('Proceso cerrado exitosamente');
    },
    onError: () => toast.error('Error al cerrar el proceso de retiro'),
  });
};

/** GET /procesos/{id}/estadisticas/ */
export const useEstadisticasProceso = (id: number, enabled = true) => {
  return useQuery({
    queryKey: [...thKeys.procesosRetiro.detail(id), 'estadisticas'],
    queryFn: async () => {
      const { data } = await apiClient.get(`${BASE_URL}/procesos/${id}/estadisticas/`);
      return data;
    },
    enabled: enabled && !!id,
  });
};

// ============== CHECKLIST RETIRO (via factory + custom actions) ==============

const checklistHooks = createCrudHooks<
  ChecklistRetiro,
  ChecklistRetiroFormData,
  Partial<ChecklistRetiroFormData>
>(checklistRetiroApi, thKeys.checklistRetiro, 'Item de checklist');

export const useChecklistRetiro = (filters?: ChecklistRetiroFilter) => {
  return checklistHooks.useList(filters as Record<string, unknown>);
};

export const useChecklistRetiroDetalle = (id: number, enabled = true) => {
  return useQuery({
    queryKey: thKeys.checklistRetiro.detail(id),
    queryFn: () => checklistRetiroApi.getById(id),
    enabled: enabled && !!id,
  });
};

export const useCreateChecklistItem = checklistHooks.useCreate;
export const useUpdateChecklistItem = checklistHooks.useUpdate;
export const useDeleteChecklistItem = checklistHooks.useDelete;

/** POST /checklist/{id}/marcar-completado/ */
export const useMarcarCompletadoChecklistItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data?: MarcarCompletadoData }) => {
      const { data: response } = await apiClient.post(
        `${BASE_URL}/checklist/${id}/marcar-completado/`,
        data || {}
      );
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: thKeys.checklistRetiro.all });
      queryClient.invalidateQueries({ queryKey: thKeys.checklistRetiro.detail(id) });
      queryClient.invalidateQueries({ queryKey: thKeys.procesosRetiro.all });
      toast.success('Item marcado como completado');
    },
    onError: () => toast.error('Error al completar el item'),
  });
};

/** POST /checklist/{id}/marcar-no-aplica/ */
export const useMarcarNoAplicaChecklistItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, observaciones }: { id: number; observaciones?: string }) => {
      const { data: response } = await apiClient.post(
        `${BASE_URL}/checklist/${id}/marcar-no-aplica/`,
        { observaciones: observaciones || '' }
      );
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: thKeys.checklistRetiro.all });
      queryClient.invalidateQueries({ queryKey: thKeys.checklistRetiro.detail(id) });
      queryClient.invalidateQueries({ queryKey: thKeys.procesosRetiro.all });
      toast.success('Item marcado como no aplica');
    },
    onError: () => toast.error('Error al marcar item como no aplica'),
  });
};

// ============== PAZ Y SALVOS (via factory + custom actions) ==============

const pazSalvoHooks = createCrudHooks<PazSalvo, PazSalvoFormData, Partial<PazSalvoFormData>>(
  pazSalvoApi,
  thKeys.pazSalvos,
  'Paz y salvo'
);

export const usePazSalvos = (filters?: PazSalvoFilter) => {
  return pazSalvoHooks.useList(filters as Record<string, unknown>);
};

export const usePazSalvo = (id: number, enabled = true) => {
  return useQuery({
    queryKey: thKeys.pazSalvos.detail(id),
    queryFn: () => pazSalvoApi.getById(id),
    enabled: enabled && !!id,
  });
};

export const useCreatePazSalvo = pazSalvoHooks.useCreate;
export const useUpdatePazSalvo = pazSalvoHooks.useUpdate;
export const useDeletePazSalvo = pazSalvoHooks.useDelete;

/** POST /paz-salvos/{id}/aprobar/ — sends { observaciones } */
export const useAprobarPazSalvo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data?: AprobarPazSalvoData }) => {
      const { data: response } = await apiClient.post(
        `${BASE_URL}/paz-salvos/${id}/aprobar/`,
        data || {}
      );
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: thKeys.pazSalvos.all });
      queryClient.invalidateQueries({ queryKey: thKeys.pazSalvos.detail(id) });
      queryClient.invalidateQueries({ queryKey: thKeys.procesosRetiro.all });
      toast.success('Paz y salvo aprobado exitosamente');
    },
    onError: () => toast.error('Error al aprobar el paz y salvo'),
  });
};

/** POST /paz-salvos/{id}/rechazar/ — sends { motivo } (NOT observaciones) */
export const useRechazarPazSalvo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: number; motivo: string }) => {
      const { data: response } = await apiClient.post(`${BASE_URL}/paz-salvos/${id}/rechazar/`, {
        motivo,
      });
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: thKeys.pazSalvos.all });
      queryClient.invalidateQueries({ queryKey: thKeys.pazSalvos.detail(id) });
      queryClient.invalidateQueries({ queryKey: thKeys.procesosRetiro.all });
      toast.success('Paz y salvo rechazado');
    },
    onError: () => toast.error('Error al rechazar el paz y salvo'),
  });
};

// ============== EXAMENES EGRESO (via factory) ==============

const examenHooks = createCrudHooks<
  ExamenEgreso,
  ExamenEgresoFormData,
  Partial<ExamenEgresoFormData>
>(examenEgresoApi, thKeys.examenesEgreso, 'Examen de egreso');

export const useExamenesEgreso = (filters?: ExamenEgresoFilter) => {
  return examenHooks.useList(filters as Record<string, unknown>);
};

export const useExamenEgreso = (id: number, enabled = true) => {
  return useQuery({
    queryKey: thKeys.examenesEgreso.detail(id),
    queryFn: () => examenEgresoApi.getById(id),
    enabled: enabled && !!id,
  });
};

export const useCreateExamenEgreso = examenHooks.useCreate;
export const useUpdateExamenEgreso = examenHooks.useUpdate;
export const useDeleteExamenEgreso = examenHooks.useDelete;

// ============== ENTREVISTAS RETIRO (via factory + custom action) ==============

const entrevistaRetiroHooks = createCrudHooks<
  EntrevistaRetiro,
  EntrevistaRetiroFormData,
  Partial<EntrevistaRetiroFormData>
>(entrevistaRetiroApi, thKeys.entrevistasRetiro, 'Entrevista de retiro', { isFeminine: true });

export const useEntrevistasRetiro = (filters?: EntrevistaRetiroFilter) => {
  return entrevistaRetiroHooks.useList(filters as Record<string, unknown>);
};

export const useEntrevistaRetiro = (id: number, enabled = true) => {
  return useQuery({
    queryKey: thKeys.entrevistasRetiro.detail(id),
    queryFn: () => entrevistaRetiroApi.getById(id),
    enabled: enabled && !!id,
  });
};

export const useCreateEntrevistaRetiro = entrevistaRetiroHooks.useCreate;
export const useUpdateEntrevistaRetiro = entrevistaRetiroHooks.useUpdate;
export const useDeleteEntrevistaRetiro = entrevistaRetiroHooks.useDelete;

/** GET /entrevistas/estadisticas-generales/ (list-level action) */
export const useEstadisticasEntrevistas = (enabled = true) => {
  return useQuery({
    queryKey: [...thKeys.entrevistasRetiro.all, 'estadisticas-generales'],
    queryFn: async () => {
      const { data } = await apiClient.get(`${BASE_URL}/entrevistas/estadisticas-generales/`);
      return data;
    },
    enabled,
  });
};

// ============== LIQUIDACIONES FINALES (via factory + custom actions) ==============

const liquidacionHooks = createCrudHooks<
  LiquidacionFinal,
  LiquidacionFinalFormData,
  Partial<LiquidacionFinalFormData>
>(liquidacionFinalApi, thKeys.liquidacionesFinales, 'Liquidación final', { isFeminine: true });

export const useLiquidacionesFinales = (filters?: LiquidacionFinalFilter) => {
  return liquidacionHooks.useList(filters as Record<string, unknown>);
};

export const useLiquidacionFinal = (id: number, enabled = true) => {
  return useQuery({
    queryKey: thKeys.liquidacionesFinales.detail(id),
    queryFn: () => liquidacionFinalApi.getById(id),
    enabled: enabled && !!id,
  });
};

export const useCreateLiquidacionFinal = liquidacionHooks.useCreate;
export const useUpdateLiquidacionFinal = liquidacionHooks.useUpdate;
export const useDeleteLiquidacionFinal = liquidacionHooks.useDelete;

/** POST /liquidaciones/{id}/calcular/ — recalculates existing liquidacion */
export const useCalcularLiquidacionFinal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post(`${BASE_URL}/liquidaciones/${id}/calcular/`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: thKeys.liquidacionesFinales.all });
      queryClient.invalidateQueries({ queryKey: thKeys.liquidacionesFinales.detail(id) });
      queryClient.invalidateQueries({ queryKey: thKeys.procesosRetiro.all });
      toast.success('Liquidación calculada exitosamente');
    },
    onError: () => toast.error('Error al calcular la liquidación final'),
  });
};

/** POST /liquidaciones/{id}/aprobar/ */
export const useAprobarLiquidacionFinal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post(`${BASE_URL}/liquidaciones/${id}/aprobar/`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: thKeys.liquidacionesFinales.all });
      queryClient.invalidateQueries({ queryKey: thKeys.liquidacionesFinales.detail(id) });
      toast.success('Liquidación aprobada exitosamente');
    },
    onError: () => toast.error('Error al aprobar la liquidación final'),
  });
};

/** POST /liquidaciones/{id}/registrar-pago/ — sends { fecha_pago, metodo_pago, referencia_pago } */
export const useRegistrarPagoLiquidacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RegistrarPagoData }) => {
      const { data: response } = await apiClient.post(
        `${BASE_URL}/liquidaciones/${id}/registrar-pago/`,
        data
      );
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: thKeys.liquidacionesFinales.all });
      queryClient.invalidateQueries({ queryKey: thKeys.liquidacionesFinales.detail(id) });
      queryClient.invalidateQueries({ queryKey: thKeys.procesosRetiro.all });
      toast.success('Pago registrado exitosamente');
    },
    onError: () => toast.error('Error al registrar el pago'),
  });
};

// ============== CERTIFICADOS DE TRABAJO (via factory + custom actions) ==============

const certificadoHooks = createCrudHooks<
  CertificadoTrabajo,
  CertificadoTrabajoFormData,
  Partial<CertificadoTrabajoFormData>
>(certificadoTrabajoApi, thKeys.certificadosTrabajo, 'Certificado de trabajo');

export const useCertificadosTrabajo = (filters?: CertificadoTrabajoFilter) => {
  return certificadoHooks.useList(filters as Record<string, unknown>);
};

export const useCertificadoTrabajo = (id: number, enabled = true) => {
  return useQuery({
    queryKey: thKeys.certificadosTrabajo.detail(id),
    queryFn: () => certificadoTrabajoApi.getById(id),
    enabled: enabled && !!id,
  });
};

export const useCreateCertificadoTrabajo = certificadoHooks.useCreate;
export const useUpdateCertificadoTrabajo = certificadoHooks.useUpdate;
export const useDeleteCertificadoTrabajo = certificadoHooks.useDelete;

/** POST /certificados-trabajo/{id}/generar/ */
export const useGenerarCertificado = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post(`${BASE_URL}/certificados-trabajo/${id}/generar/`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: thKeys.certificadosTrabajo.all });
      queryClient.invalidateQueries({ queryKey: thKeys.certificadosTrabajo.detail(id) });
      toast.success('Certificado generado exitosamente');
    },
    onError: () => toast.error('Error al generar el certificado'),
  });
};

/** POST /certificados-trabajo/{id}/entregar/ */
export const useEntregarCertificado = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post(`${BASE_URL}/certificados-trabajo/${id}/entregar/`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: thKeys.certificadosTrabajo.all });
      queryClient.invalidateQueries({ queryKey: thKeys.certificadosTrabajo.detail(id) });
      toast.success('Certificado marcado como entregado');
    },
    onError: () => toast.error('Error al entregar el certificado'),
  });
};
