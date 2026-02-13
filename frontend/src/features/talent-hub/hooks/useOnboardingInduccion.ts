/**
 * React Query Hooks para Onboarding e Induccion - Talent Hub
 * Sistema de Gestion StrateKaz
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
  EntregaEPP,
  EntregaEPPFormData,
  EntregaActivo,
  EntregaActivoFormData,
  FirmaDocumento,
  FirmaDocumentoFormData,
  OnboardingEstadisticas,
} from '../types';

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

  entregasEpp: {
    all: ['onboarding', 'entregas-epp'] as const,
    list: () => [...onboardingKeys.entregasEpp.all, 'list'] as const,
    porColaborador: (id: number) => [...onboardingKeys.entregasEpp.all, 'colaborador', id] as const,
    porVencer: () => [...onboardingKeys.entregasEpp.all, 'por-vencer'] as const,
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
      const { data } = await api.get<ModuloInduccion[]>('/talent-hub/onboarding/modulos/');
      return data;
    },
  });
}

export function useModuloInduccion(id: number) {
  return useQuery({
    queryKey: onboardingKeys.modulos.detail(id),
    queryFn: async () => {
      const { data } = await api.get<ModuloInduccion>(`/talent-hub/onboarding/modulos/${id}/`);
      return data;
    },
    enabled: !!id,
  });
}

export function useModulosVigentes() {
  return useQuery({
    queryKey: onboardingKeys.modulos.vigentes(),
    queryFn: async () => {
      const { data } = await api.get<ModuloInduccion[]>('/talent-hub/onboarding/modulos/vigentes/');
      return data;
    },
  });
}

export function useCreateModuloInduccion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: ModuloInduccionFormData) => {
      const { data } = await api.post<ModuloInduccion>('/talent-hub/onboarding/modulos/', formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.modulos.all });
      queryClient.invalidateQueries({ queryKey: onboardingKeys.estadisticas() });
      toast.success('Modulo de induccion creado');
    },
    onError: () => toast.error('Error al crear modulo'),
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
        `/talent-hub/onboarding/modulos/${id}/`,
        formData
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.modulos.all });
      toast.success('Modulo actualizado');
    },
    onError: () => toast.error('Error al actualizar modulo'),
  });
}

export function useDeleteModuloInduccion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/talent-hub/onboarding/modulos/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.modulos.all });
      queryClient.invalidateQueries({ queryKey: onboardingKeys.estadisticas() });
      toast.success('Modulo eliminado');
    },
    onError: () => toast.error('Error al eliminar modulo'),
  });
}

// ============================================================================
// HOOKS - ITEMS CHECKLIST
// ============================================================================

export function useItemsChecklist() {
  return useQuery({
    queryKey: onboardingKeys.itemsChecklist.list(),
    queryFn: async () => {
      const { data } = await api.get<ItemChecklist[]>('/talent-hub/onboarding/items-checklist/');
      return data;
    },
  });
}

export function useCreateItemChecklist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: ItemChecklistFormData) => {
      const { data } = await api.post<ItemChecklist>(
        '/talent-hub/onboarding/items-checklist/',
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
        `/talent-hub/onboarding/checklist-ingreso/por_colaborador/?colaborador_id=${colaboradorId}`
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
      const { data } = await api.post(`/talent-hub/onboarding/checklist-ingreso/${id}/verificar/`);
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
      const { data } = await api.get<EjecucionIntegral[]>('/talent-hub/onboarding/ejecuciones/');
      return data;
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
      }>(`/talent-hub/onboarding/ejecuciones/por_colaborador/?colaborador_id=${colaboradorId}`);
      return data;
    },
    enabled: !!colaboradorId,
  });
}

export function useEjecucionesVencidas() {
  return useQuery({
    queryKey: onboardingKeys.ejecuciones.vencidas(),
    queryFn: async () => {
      const { data } = await api.get<EjecucionIntegral[]>(
        '/talent-hub/onboarding/ejecuciones/vencidas/'
      );
      return data;
    },
  });
}

export function useCreateEjecucion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: EjecucionCreateData) => {
      const { data } = await api.post<EjecucionIntegral>(
        '/talent-hub/onboarding/ejecuciones/',
        formData
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.ejecuciones.all });
      queryClient.invalidateQueries({ queryKey: onboardingKeys.estadisticas() });
      toast.success('Induccion asignada');
    },
    onError: () => toast.error('Error al asignar induccion'),
  });
}

export function useIniciarModulo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post(`/talent-hub/onboarding/ejecuciones/${id}/iniciar/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.ejecuciones.all });
      toast.success('Modulo iniciado');
    },
    onError: () => toast.error('Error al iniciar modulo'),
  });
}

export function useCompletarModulo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, nota }: { id: number; nota?: number }) => {
      const { data } = await api.post(`/talent-hub/onboarding/ejecuciones/${id}/completar/`, {
        nota,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.ejecuciones.all });
      queryClient.invalidateQueries({ queryKey: onboardingKeys.estadisticas() });
      toast.success('Modulo completado');
    },
    onError: () => toast.error('Error al completar modulo'),
  });
}

// ============================================================================
// HOOKS - ENTREGAS EPP
// ============================================================================

export function useEntregasEpp() {
  return useQuery({
    queryKey: onboardingKeys.entregasEpp.list(),
    queryFn: async () => {
      const { data } = await api.get<EntregaEPP[]>('/talent-hub/onboarding/entregas-epp/');
      return data;
    },
  });
}

export function useEntregasEppPorColaborador(colaboradorId: number) {
  return useQuery({
    queryKey: onboardingKeys.entregasEpp.porColaborador(colaboradorId),
    queryFn: async () => {
      const { data } = await api.get<EntregaEPP[]>(
        `/talent-hub/onboarding/entregas-epp/por_colaborador/?colaborador_id=${colaboradorId}`
      );
      return data;
    },
    enabled: !!colaboradorId,
  });
}

export function useEppPorVencer() {
  return useQuery({
    queryKey: onboardingKeys.entregasEpp.porVencer(),
    queryFn: async () => {
      const { data } = await api.get<EntregaEPP[]>(
        '/talent-hub/onboarding/entregas-epp/por_vencer/'
      );
      return data;
    },
  });
}

export function useCreateEntregaEpp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: EntregaEPPFormData) => {
      const { data } = await api.post<EntregaEPP>('/talent-hub/onboarding/entregas-epp/', formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.entregasEpp.all });
      queryClient.invalidateQueries({ queryKey: onboardingKeys.estadisticas() });
      toast.success('Entrega de EPP registrada');
    },
    onError: () => toast.error('Error al registrar entrega'),
  });
}

// ============================================================================
// HOOKS - ENTREGAS ACTIVOS
// ============================================================================

export function useEntregasActivos() {
  return useQuery({
    queryKey: onboardingKeys.entregasActivos.list(),
    queryFn: async () => {
      const { data } = await api.get<EntregaActivo[]>('/talent-hub/onboarding/entregas-activos/');
      return data;
    },
  });
}

export function useEntregasActivosPorColaborador(colaboradorId: number) {
  return useQuery({
    queryKey: onboardingKeys.entregasActivos.porColaborador(colaboradorId),
    queryFn: async () => {
      const { data } = await api.get<EntregaActivo[]>(
        `/talent-hub/onboarding/entregas-activos/por_colaborador/?colaborador_id=${colaboradorId}`
      );
      return data;
    },
    enabled: !!colaboradorId,
  });
}

export function useActivosPendientesDevolucion() {
  return useQuery({
    queryKey: onboardingKeys.entregasActivos.pendientesDevolucion(),
    queryFn: async () => {
      const { data } = await api.get<EntregaActivo[]>(
        '/talent-hub/onboarding/entregas-activos/pendientes_devolucion/'
      );
      return data;
    },
  });
}

export function useCreateEntregaActivo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: EntregaActivoFormData) => {
      const { data } = await api.post<EntregaActivo>(
        '/talent-hub/onboarding/entregas-activos/',
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
        `/talent-hub/onboarding/entregas-activos/${id}/registrar_devolucion/`,
        body
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.entregasActivos.all });
      queryClient.invalidateQueries({ queryKey: onboardingKeys.estadisticas() });
      toast.success('Devolucion registrada');
    },
    onError: () => toast.error('Error al registrar devolucion'),
  });
}

// ============================================================================
// HOOKS - FIRMAS DOCUMENTOS
// ============================================================================

export function useFirmasDocumentos() {
  return useQuery({
    queryKey: onboardingKeys.firmasDocumentos.list(),
    queryFn: async () => {
      const { data } = await api.get<FirmaDocumento[]>('/talent-hub/onboarding/firmas-documentos/');
      return data;
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
        `/talent-hub/onboarding/firmas-documentos/por_colaborador/?colaborador_id=${colaboradorId}`
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
      const { data } = await api.get<FirmaDocumento[]>(
        '/talent-hub/onboarding/firmas-documentos/pendientes/'
      );
      return data;
    },
  });
}

export function useCreateFirmaDocumento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FirmaDocumentoFormData) => {
      const { data } = await api.post<FirmaDocumento>(
        '/talent-hub/onboarding/firmas-documentos/',
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
        `/talent-hub/onboarding/firmas-documentos/${id}/marcar_firmado/`
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
      const { data } = await api.get<OnboardingEstadisticas>(
        '/talent-hub/onboarding/estadisticas/resumen/'
      );
      return data;
    },
  });
}
