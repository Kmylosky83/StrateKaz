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
  ChecklistIngreso,
  EjecucionIntegral,
  EntregaEPP,
  EntregaEPPFormData,
  EntregaActivo,
  EntregaActivoFormData,
  FirmaDocumento,
  OnboardingEstadisticas,
  ProgresoColaborador,
} from '../types';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const onboardingKeys = {
  all: ['onboarding'] as const,

  // Modulos
  modulos: {
    all: ['onboarding', 'modulos'] as const,
    list: () => [...onboardingKeys.modulos.all, 'list'] as const,
    detail: (id: string) => [...onboardingKeys.modulos.all, 'detail', id] as const,
    vigentes: () => [...onboardingKeys.modulos.all, 'vigentes'] as const,
    porTipo: (tipo: string) => [...onboardingKeys.modulos.all, 'tipo', tipo] as const,
  },

  // Items Checklist
  itemsChecklist: {
    all: ['onboarding', 'items-checklist'] as const,
    list: () => [...onboardingKeys.itemsChecklist.all, 'list'] as const,
    detail: (id: string) => [...onboardingKeys.itemsChecklist.all, 'detail', id] as const,
    porCategoria: (categoria: string) => [...onboardingKeys.itemsChecklist.all, 'categoria', categoria] as const,
  },

  // Checklist Ingreso
  checklistIngreso: {
    all: ['onboarding', 'checklist-ingreso'] as const,
    list: () => [...onboardingKeys.checklistIngreso.all, 'list'] as const,
    porColaborador: (id: string) => [...onboardingKeys.checklistIngreso.all, 'colaborador', id] as const,
    pendientes: () => [...onboardingKeys.checklistIngreso.all, 'pendientes'] as const,
  },

  // Ejecuciones
  ejecuciones: {
    all: ['onboarding', 'ejecuciones'] as const,
    list: () => [...onboardingKeys.ejecuciones.all, 'list'] as const,
    detail: (id: string) => [...onboardingKeys.ejecuciones.all, 'detail', id] as const,
    porColaborador: (id: string) => [...onboardingKeys.ejecuciones.all, 'colaborador', id] as const,
    pendientes: () => [...onboardingKeys.ejecuciones.all, 'pendientes'] as const,
    vencidas: () => [...onboardingKeys.ejecuciones.all, 'vencidas'] as const,
  },

  // Entregas EPP
  entregasEpp: {
    all: ['onboarding', 'entregas-epp'] as const,
    list: () => [...onboardingKeys.entregasEpp.all, 'list'] as const,
    detail: (id: string) => [...onboardingKeys.entregasEpp.all, 'detail', id] as const,
    porColaborador: (id: string) => [...onboardingKeys.entregasEpp.all, 'colaborador', id] as const,
    proxVencimientos: () => [...onboardingKeys.entregasEpp.all, 'prox-vencimientos'] as const,
  },

  // Entregas Activos
  entregasActivos: {
    all: ['onboarding', 'entregas-activos'] as const,
    list: () => [...onboardingKeys.entregasActivos.all, 'list'] as const,
    detail: (id: string) => [...onboardingKeys.entregasActivos.all, 'detail', id] as const,
    porColaborador: (id: string) => [...onboardingKeys.entregasActivos.all, 'colaborador', id] as const,
  },

  // Firmas Documentos
  firmasDocumentos: {
    all: ['onboarding', 'firmas-documentos'] as const,
    list: () => [...onboardingKeys.firmasDocumentos.all, 'list'] as const,
    porColaborador: (id: string) => [...onboardingKeys.firmasDocumentos.all, 'colaborador', id] as const,
    pendientes: () => [...onboardingKeys.firmasDocumentos.all, 'pendientes'] as const,
  },

  // Estadisticas
  estadisticas: () => [...onboardingKeys.all, 'estadisticas'] as const,
  progreso: (colaboradorId: string) => [...onboardingKeys.all, 'progreso', colaboradorId] as const,
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

export function useModuloInduccion(id: string) {
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
      toast.success('Modulo de induccion creado');
    },
    onError: () => toast.error('Error al crear modulo'),
  });
}

export function useUpdateModuloInduccion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data: formData }: { id: string; data: Partial<ModuloInduccionFormData> }) => {
      const { data } = await api.patch<ModuloInduccion>(`/talent-hub/onboarding/modulos/${id}/`, formData);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.modulos.all });
      queryClient.invalidateQueries({ queryKey: onboardingKeys.modulos.detail(id) });
      toast.success('Modulo actualizado');
    },
    onError: () => toast.error('Error al actualizar modulo'),
  });
}

// ============================================================================
// HOOKS - CHECKLIST INGRESO
// ============================================================================

export function useChecklistPorColaborador(colaboradorId: string) {
  return useQuery({
    queryKey: onboardingKeys.checklistIngreso.porColaborador(colaboradorId),
    queryFn: async () => {
      const { data } = await api.get<ChecklistIngreso[]>(
        `/talent-hub/onboarding/checklist-ingreso/por_colaborador/?colaborador_id=${colaboradorId}`
      );
      return data;
    },
    enabled: !!colaboradorId,
  });
}

export function useCumplirItemChecklist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, observaciones }: { id: string; observaciones?: string }) => {
      const { data } = await api.post(`/talent-hub/onboarding/checklist-ingreso/${id}/cumplir/`, { observaciones });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.checklistIngreso.all });
      toast.success('Item marcado como cumplido');
    },
    onError: () => toast.error('Error al marcar item'),
  });
}

// ============================================================================
// HOOKS - EJECUCIONES
// ============================================================================

export function useEjecucionesPorColaborador(colaboradorId: string) {
  return useQuery({
    queryKey: onboardingKeys.ejecuciones.porColaborador(colaboradorId),
    queryFn: async () => {
      const { data } = await api.get<EjecucionIntegral[]>(
        `/talent-hub/onboarding/ejecuciones/por_colaborador/?colaborador_id=${colaboradorId}`
      );
      return data;
    },
    enabled: !!colaboradorId,
  });
}

export function useIniciarModulo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
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
    mutationFn: async ({ id, nota }: { id: string; nota?: number }) => {
      const { data } = await api.post(`/talent-hub/onboarding/ejecuciones/${id}/completar/`, { nota });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.ejecuciones.all });
      toast.success('Modulo completado');
    },
    onError: () => toast.error('Error al completar modulo'),
  });
}

// ============================================================================
// HOOKS - ENTREGAS EPP
// ============================================================================

export function useEntregasEppPorColaborador(colaboradorId: string) {
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

export function useCreateEntregaEpp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: EntregaEPPFormData) => {
      const { data } = await api.post<EntregaEPP>('/talent-hub/onboarding/entregas-epp/', formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.entregasEpp.all });
      toast.success('Entrega de EPP registrada');
    },
    onError: () => toast.error('Error al registrar entrega'),
  });
}

export function useProximosVencimientosEpp() {
  return useQuery({
    queryKey: onboardingKeys.entregasEpp.proxVencimientos(),
    queryFn: async () => {
      const { data } = await api.get<EntregaEPP[]>('/talent-hub/onboarding/entregas-epp/proximos_vencimientos/');
      return data;
    },
  });
}

// ============================================================================
// HOOKS - ENTREGAS ACTIVOS
// ============================================================================

export function useEntregasActivosPorColaborador(colaboradorId: string) {
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

export function useCreateEntregaActivo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: EntregaActivoFormData) => {
      const { data } = await api.post<EntregaActivo>('/talent-hub/onboarding/entregas-activos/', formData);
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
    mutationFn: async ({ id, estado, observaciones }: { id: string; estado: string; observaciones?: string }) => {
      const { data } = await api.post(`/talent-hub/onboarding/entregas-activos/${id}/registrar_devolucion/`, {
        estado,
        observaciones,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.entregasActivos.all });
      toast.success('Devolucion registrada');
    },
    onError: () => toast.error('Error al registrar devolucion'),
  });
}

// ============================================================================
// HOOKS - FIRMAS DOCUMENTOS
// ============================================================================

export function useFirmasPorColaborador(colaboradorId: string) {
  return useQuery({
    queryKey: onboardingKeys.firmasDocumentos.porColaborador(colaboradorId),
    queryFn: async () => {
      const { data } = await api.get<FirmaDocumento[]>(
        `/talent-hub/onboarding/firmas-documentos/por_colaborador/?colaborador_id=${colaboradorId}`
      );
      return data;
    },
    enabled: !!colaboradorId,
  });
}

export function useRegistrarFirma() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, metodo }: { id: string; metodo: string }) => {
      const { data } = await api.post(`/talent-hub/onboarding/firmas-documentos/${id}/registrar_firma/`, { metodo });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.firmasDocumentos.all });
      toast.success('Firma registrada');
    },
    onError: () => toast.error('Error al registrar firma'),
  });
}

// ============================================================================
// HOOKS - ESTADISTICAS
// ============================================================================

export function useOnboardingEstadisticas() {
  return useQuery({
    queryKey: onboardingKeys.estadisticas(),
    queryFn: async () => {
      const { data } = await api.get<OnboardingEstadisticas>('/talent-hub/onboarding/estadisticas/resumen/');
      return data;
    },
  });
}

export function useProgresoColaborador(colaboradorId: string) {
  return useQuery({
    queryKey: onboardingKeys.progreso(colaboradorId),
    queryFn: async () => {
      const { data } = await api.get<ProgresoColaborador>(
        `/talent-hub/onboarding/estadisticas/progreso_colaborador/?colaborador_id=${colaboradorId}`
      );
      return data;
    },
    enabled: !!colaboradorId,
  });
}
