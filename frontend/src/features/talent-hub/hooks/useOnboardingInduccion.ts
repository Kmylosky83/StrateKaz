/**
 * React Query Hooks para Onboarding e Induccion - Talent Hub
 * Sistema de Gestion StrateKaz
 *
 * EPP: delegado a HSEQ Seguridad Industrial (fuente unica de verdad)
 * Activos: gestionado localmente en onboarding
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type {
  ModuloInduccion,
  ModuloInduccionFormData,
  ItemChecklist,
  ItemChecklistFormData,
  ChecklistIngreso,
  ChecklistResumen,
  EjecucionIntegral,
  EjecucionResumen,
  EjecucionCreateData,
  EntregaActivo,
  EntregaActivoFormData,
  FirmaDocumento,
  FirmaDocumentoFormData,
  OnboardingEstadisticas,
} from '../types';
import type {
  EntregaEPP as HseqEntregaEPP,
  CreateEntregaEPPDTO,
} from '@/features/hseq/types/seguridad-industrial.types';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const onboardingKeys = {
  all: ['onboarding'] as const,

  modulos: {
    all: ['onboarding', 'modulos'] as const,
    list: () => [...onboardingKeys.modulos.all, 'list'] as const,
    detail: (id: number) => [...onboardingKeys.modulos.all, 'detail', id] as const,
    vigentes: () => [...onboardingKeys.modulos.all, 'vigentes'] as const,
  },

  itemsChecklist: {
    all: ['onboarding', 'items-checklist'] as const,
    list: () => [...onboardingKeys.itemsChecklist.all, 'list'] as const,
  },

  checklistIngreso: {
    all: ['onboarding', 'checklist-ingreso'] as const,
    porColaborador: (id: number) =>
      [...onboardingKeys.checklistIngreso.all, 'colaborador', id] as const,
  },

  ejecuciones: {
    all: ['onboarding', 'ejecuciones'] as const,
    list: () => [...onboardingKeys.ejecuciones.all, 'list'] as const,
    detail: (id: number) => [...onboardingKeys.ejecuciones.all, 'detail', id] as const,
    porColaborador: (id: number) => [...onboardingKeys.ejecuciones.all, 'colaborador', id] as const,
    vencidas: () => [...onboardingKeys.ejecuciones.all, 'vencidas'] as const,
  },

  // EPP keys apuntan a HSEQ
  entregasEpp: {
    all: ['hseq', 'entregas-epp'] as const,
    porColaborador: (userId: number) =>
      ['hseq', 'entregas-epp', 'por-colaborador', userId] as const,
    porVencer: () => ['hseq', 'entregas-epp', 'proximas-reposiciones'] as const,
  },

  entregasActivos: {
    all: ['onboarding', 'entregas-activos'] as const,
    list: () => [...onboardingKeys.entregasActivos.all, 'list'] as const,
    porColaborador: (id: number) =>
      [...onboardingKeys.entregasActivos.all, 'colaborador', id] as const,
    pendientesDevolucion: () => [...onboardingKeys.entregasActivos.all, 'pendientes'] as const,
  },

  firmasDocumentos: {
    all: ['onboarding', 'firmas-documentos'] as const,
    list: () => [...onboardingKeys.firmasDocumentos.all, 'list'] as const,
    porColaborador: (id: number) =>
      [...onboardingKeys.firmasDocumentos.all, 'colaborador', id] as const,
    pendientes: () => [...onboardingKeys.firmasDocumentos.all, 'pendientes'] as const,
  },

  estadisticas: () => [...onboardingKeys.all, 'estadisticas'] as const,
};

// ============================================================================
// HOOKS - MODULOS DE INDUCCION
// ============================================================================

export function useModulosInduccion() {
  return useQuery({
    queryKey: onboardingKeys.modulos.list(),
    queryFn: async () => {
      const response = await api.get('/mi-equipo/onboarding/modulos/');
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as ModuloInduccion[];
    },
  });
}

export function useModuloInduccion(id: number) {
  return useQuery({
    queryKey: onboardingKeys.modulos.detail(id),
    queryFn: async () => {
      const { data } = await api.get<ModuloInduccion>(`/mi-equipo/onboarding/modulos/${id}/`);
      return data;
    },
    enabled: !!id,
  });
}

export function useModulosVigentes() {
  return useQuery({
    queryKey: onboardingKeys.modulos.vigentes(),
    queryFn: async () => {
      const response = await api.get('/mi-equipo/onboarding/modulos/vigentes/');
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as ModuloInduccion[];
    },
  });
}

export function useCreateModuloInduccion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: ModuloInduccionFormData) => {
      const { data } = await api.post<ModuloInduccion>('/mi-equipo/onboarding/modulos/', formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.modulos.all });
      queryClient.invalidateQueries({ queryKey: onboardingKeys.estadisticas() });
      toast.success('Módulo de inducción creado');
    },
    onError: () => toast.error('Error al crear módulo'),
  });
}

export function useUpdateModuloInduccion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data: formData,
    }: {
      id: number;
      data: Partial<ModuloInduccionFormData>;
    }) => {
      const { data } = await api.patch<ModuloInduccion>(
        `/mi-equipo/onboarding/modulos/${id}/`,
        formData
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.modulos.all });
      toast.success('Módulo actualizado');
    },
    onError: () => toast.error('Error al actualizar módulo'),
  });
}

export function useDeleteModuloInduccion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/mi-equipo/onboarding/modulos/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.modulos.all });
      queryClient.invalidateQueries({ queryKey: onboardingKeys.estadisticas() });
      toast.success('Módulo eliminado');
    },
    onError: () => toast.error('Error al eliminar módulo'),
  });
}

// ============================================================================
// HOOKS - ITEMS CHECKLIST
// ============================================================================

export function useItemsChecklist() {
  return useQuery({
    queryKey: onboardingKeys.itemsChecklist.list(),
    queryFn: async () => {
      const response = await api.get('/mi-equipo/onboarding/items-checklist/');
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as ItemChecklist[];
    },
  });
}

export function useCreateItemChecklist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: ItemChecklistFormData) => {
      const { data } = await api.post<ItemChecklist>(
        '/mi-equipo/onboarding/items-checklist/',
        formData
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.itemsChecklist.all });
      toast.success('Item de checklist creado');
    },
    onError: () => toast.error('Error al crear item'),
  });
}

// ============================================================================
// HOOKS - CHECKLIST INGRESO
// ============================================================================

export function useChecklistPorColaborador(colaboradorId: number) {
  return useQuery({
    queryKey: onboardingKeys.checklistIngreso.porColaborador(colaboradorId),
    queryFn: async () => {
      const { data } = await api.get<{ items: ChecklistIngreso[]; resumen: ChecklistResumen }>(
        `/mi-equipo/onboarding/checklist-ingreso/por-colaborador/?colaborador_id=${colaboradorId}`
      );
      return data;
    },
    enabled: !!colaboradorId,
  });
}

export function useVerificarItemChecklist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post(`/mi-equipo/onboarding/checklist-ingreso/${id}/verificar/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.checklistIngreso.all });
      toast.success('Item verificado');
    },
    onError: () => toast.error('Error al verificar item'),
  });
}

// ============================================================================
// HOOKS - EJECUCIONES
// ============================================================================

export function useEjecuciones() {
  return useQuery({
    queryKey: onboardingKeys.ejecuciones.list(),
    queryFn: async () => {
      const response = await api.get('/mi-equipo/onboarding/ejecuciones/');
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as EjecucionIntegral[];
    },
  });
}

export function useEjecucionesPorColaborador(colaboradorId: number) {
  return useQuery({
    queryKey: onboardingKeys.ejecuciones.porColaborador(colaboradorId),
    queryFn: async () => {
      const { data } = await api.get<{
        inducciones: EjecucionIntegral[];
        resumen: EjecucionResumen;
      }>(`/mi-equipo/onboarding/ejecuciones/por-colaborador/?colaborador_id=${colaboradorId}`);
      return data;
    },
    enabled: !!colaboradorId,
  });
}

export function useEjecucionesVencidas() {
  return useQuery({
    queryKey: onboardingKeys.ejecuciones.vencidas(),
    queryFn: async () => {
      const response = await api.get('/mi-equipo/onboarding/ejecuciones/vencidas/');
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as EjecucionIntegral[];
    },
  });
}

export function useCreateEjecucion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: EjecucionCreateData) => {
      const { data } = await api.post<EjecucionIntegral>(
        '/mi-equipo/onboarding/ejecuciones/',
        formData
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.ejecuciones.all });
      queryClient.invalidateQueries({ queryKey: onboardingKeys.estadisticas() });
      toast.success('Inducción asignada');
    },
    onError: () => toast.error('Error al asignar inducción'),
  });
}

export function useIniciarModulo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post(`/mi-equipo/onboarding/ejecuciones/${id}/iniciar/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.ejecuciones.all });
      toast.success('Módulo iniciado');
    },
    onError: () => toast.error('Error al iniciar módulo'),
  });
}

export function useCompletarModulo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, nota }: { id: number; nota?: number }) => {
      const { data } = await api.post(`/mi-equipo/onboarding/ejecuciones/${id}/completar/`, {
        nota,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.ejecuciones.all });
      queryClient.invalidateQueries({ queryKey: onboardingKeys.estadisticas() });
      toast.success('Módulo completado');
    },
    onError: () => toast.error('Error al completar módulo'),
  });
}

// ============================================================================
// HOOKS - ENTREGAS EPP (delegado a HSEQ Seguridad Industrial)
// Fuente unica: POST/GET /api/hseq/seguridad/entregas-epp/
// ============================================================================

interface HseqEppPorColaboradorResponse {
  entregas: HseqEntregaEPP[];
  resumen: {
    total: number;
    en_uso: number;
    vencidos: number;
    devueltos: number;
  };
}

/** Lista todas las entregas EPP (vista admin — HSEQ) */
export function useEntregasEppList() {
  return useQuery({
    queryKey: [...onboardingKeys.entregasEpp.all, 'list'] as const,
    queryFn: async () => {
      const response = await api.get('/hseq/seguridad/entregas-epp/');
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as HseqEntregaEPP[];
    },
  });
}

/** Entregas EPP de un usuario (core.User.id, NO Colaborador.id) */
export function useEntregasEppHseq(usuarioId?: number) {
  return useQuery({
    queryKey: onboardingKeys.entregasEpp.porColaborador(usuarioId || 0),
    queryFn: async () => {
      const { data } = await api.get<HseqEppPorColaboradorResponse>(
        `/hseq/seguridad/entregas-epp/por-colaborador/?colaborador_id=${usuarioId}`
      );
      return data;
    },
    enabled: !!usuarioId,
  });
}

/** EPP próximos a reposición (HSEQ) */
export function useEppProximasReposiciones(dias = 30) {
  return useQuery({
    queryKey: onboardingKeys.entregasEpp.porVencer(),
    queryFn: async () => {
      const { data } = await api.get<{ total: number; entregas: HseqEntregaEPP[] }>(
        `/hseq/seguridad/entregas-epp/proximas-reposiciones/?dias=${dias}`
      );
      return data;
    },
  });
}

/** Crear entrega EPP vía HSEQ */
export function useCreateEntregaEppHseq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: CreateEntregaEPPDTO) => {
      const { data } = await api.post<HseqEntregaEPP>('/hseq/seguridad/entregas-epp/', formData);
      return data;
    },
    onSuccess: () => {
      // Invalidar tanto keys HSEQ como onboarding estadísticas
      queryClient.invalidateQueries({ queryKey: ['hseq', 'entregas-epp'] });
      queryClient.invalidateQueries({ queryKey: ['hseq', 'seguridad-industrial'] });
      queryClient.invalidateQueries({ queryKey: onboardingKeys.estadisticas() });
      toast.success('Entrega de EPP registrada');
    },
    onError: () => toast.error('Error al registrar entrega de EPP'),
  });
}

// Aliases de compatibilidad (mantener exports usados por componentes)
export const useEntregasEpp = useEntregasEppHseq;
export const useEppPorVencer = useEppProximasReposiciones;
export const useCreateEntregaEpp = useCreateEntregaEppHseq;

// ============================================================================
// HOOKS - ENTREGAS ACTIVOS
// ============================================================================

export function useEntregasActivos() {
  return useQuery({
    queryKey: onboardingKeys.entregasActivos.list(),
    queryFn: async () => {
      const response = await api.get('/mi-equipo/onboarding/entregas-activos/');
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as EntregaActivo[];
    },
  });
}

export function useEntregasActivosPorColaborador(colaboradorId: number) {
  return useQuery({
    queryKey: onboardingKeys.entregasActivos.porColaborador(colaboradorId),
    queryFn: async () => {
      const response = await api.get(
        `/mi-equipo/onboarding/entregas-activos/por-colaborador/?colaborador_id=${colaboradorId}`
      );
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as EntregaActivo[];
    },
    enabled: !!colaboradorId,
  });
}

export function useActivosPendientesDevolucion() {
  return useQuery({
    queryKey: onboardingKeys.entregasActivos.pendientesDevolucion(),
    queryFn: async () => {
      const response = await api.get(
        '/mi-equipo/onboarding/entregas-activos/pendientes-devolucion/'
      );
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as EntregaActivo[];
    },
  });
}

export function useCreateEntregaActivo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: EntregaActivoFormData) => {
      const { data } = await api.post<EntregaActivo>(
        '/mi-equipo/onboarding/entregas-activos/',
        formData
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.entregasActivos.all });
      toast.success('Entrega de activo registrada');
    },
    onError: () => toast.error('Error al registrar entrega'),
  });
}

export function useRegistrarDevolucion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: number;
      fecha_devolucion?: string;
      estado_devolucion?: string;
      observaciones?: string;
    }) => {
      const { data } = await api.post(
        `/mi-equipo/onboarding/entregas-activos/${id}/registrar-devolucion/`,
        body
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.entregasActivos.all });
      queryClient.invalidateQueries({ queryKey: onboardingKeys.estadisticas() });
      toast.success('Devolución registrada');
    },
    onError: () => toast.error('Error al registrar devolución'),
  });
}

// ============================================================================
// HOOKS - FIRMAS DOCUMENTOS
// ============================================================================

export function useFirmasDocumentos() {
  return useQuery({
    queryKey: onboardingKeys.firmasDocumentos.list(),
    queryFn: async () => {
      const response = await api.get('/mi-equipo/onboarding/firmas-documentos/');
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as FirmaDocumento[];
    },
  });
}

export function useFirmasPorColaborador(colaboradorId: number) {
  return useQuery({
    queryKey: onboardingKeys.firmasDocumentos.porColaborador(colaboradorId),
    queryFn: async () => {
      const { data } = await api.get<{
        documentos: FirmaDocumento[];
        resumen: { total: number; firmados: number; pendientes: number };
      }>(
        `/mi-equipo/onboarding/firmas-documentos/por-colaborador/?colaborador_id=${colaboradorId}`
      );
      return data;
    },
    enabled: !!colaboradorId,
  });
}

export function useFirmasPendientes() {
  return useQuery({
    queryKey: onboardingKeys.firmasDocumentos.pendientes(),
    queryFn: async () => {
      const response = await api.get('/mi-equipo/onboarding/firmas-documentos/pendientes/');
      const data = response.data;
      return (Array.isArray(data) ? data : (data?.results ?? [])) as FirmaDocumento[];
    },
  });
}

export function useCreateFirmaDocumento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FirmaDocumentoFormData) => {
      const { data } = await api.post<FirmaDocumento>(
        '/mi-equipo/onboarding/firmas-documentos/',
        formData
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.firmasDocumentos.all });
      toast.success('Documento registrado');
    },
    onError: () => toast.error('Error al registrar documento'),
  });
}

export function useMarcarFirmado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post(
        `/mi-equipo/onboarding/firmas-documentos/${id}/marcar-firmado/`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.firmasDocumentos.all });
      toast.success('Documento marcado como firmado');
    },
    onError: () => toast.error('Error al marcar documento'),
  });
}

// ============================================================================
// HOOKS - ESTADISTICAS
// ============================================================================

export function useOnboardingEstadisticas() {
  return useQuery({
    queryKey: onboardingKeys.estadisticas(),
    queryFn: async () => {
      const { data } = await api.get<OnboardingEstadisticas>('/mi-equipo/onboarding/estadisticas/');
      return data;
    },
  });
}
