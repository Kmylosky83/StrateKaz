/**
 * Hooks para Off-Boarding - Talent Hub
 * Sistema de Gestión Grasas y Huesos del Norte
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api-client';
import type {
  TipoRetiro,
  TipoRetiroFormData,
  ProcesoRetiro,
  ProcesoRetiroFormData,
  ProcesoRetiroFilter,
  ChecklistRetiro,
  ChecklistRetiroFormData,
  ChecklistRetiroFilter,
  CompletarItemData,
  PazSalvo,
  PazSalvoFormData,
  PazSalvoFilter,
  AprobarPazSalvoData,
  ExamenEgreso,
  ExamenEgresoFormData,
  ExamenEgresoFilter,
  RegistrarResultadoExamenData,
  EntrevistaRetiro,
  EntrevistaRetiroFormData,
  EntrevistaRetiroFilter,
  LiquidacionFinal,
  LiquidacionFinalFilter,
  CalcularLiquidacionFinalData,
} from '../types';

const BASE_URL = '/api/v1/talent-hub/off-boarding';

// ============== QUERY KEYS ==============

export const offBoardingKeys = {
  all: ['off-boarding'] as const,
  tiposRetiro: {
    all: () => [...offBoardingKeys.all, 'tipos-retiro'] as const,
    list: () => [...offBoardingKeys.tiposRetiro.all(), 'list'] as const,
    detail: (id: number) => [...offBoardingKeys.tiposRetiro.all(), 'detail', id] as const,
  },
  procesos: {
    all: () => [...offBoardingKeys.all, 'procesos'] as const,
    list: (filters?: ProcesoRetiroFilter) => [...offBoardingKeys.procesos.all(), 'list', filters] as const,
    detail: (id: number) => [...offBoardingKeys.procesos.all(), 'detail', id] as const,
  },
  checklist: {
    all: () => [...offBoardingKeys.all, 'checklist'] as const,
    list: (filters?: ChecklistRetiroFilter) => [...offBoardingKeys.checklist.all(), 'list', filters] as const,
    detail: (id: number) => [...offBoardingKeys.checklist.all(), 'detail', id] as const,
  },
  pazSalvos: {
    all: () => [...offBoardingKeys.all, 'paz-salvos'] as const,
    list: (filters?: PazSalvoFilter) => [...offBoardingKeys.pazSalvos.all(), 'list', filters] as const,
    detail: (id: number) => [...offBoardingKeys.pazSalvos.all(), 'detail', id] as const,
  },
  examenes: {
    all: () => [...offBoardingKeys.all, 'examenes'] as const,
    list: (filters?: ExamenEgresoFilter) => [...offBoardingKeys.examenes.all(), 'list', filters] as const,
    detail: (id: number) => [...offBoardingKeys.examenes.all(), 'detail', id] as const,
  },
  entrevistas: {
    all: () => [...offBoardingKeys.all, 'entrevistas'] as const,
    list: (filters?: EntrevistaRetiroFilter) => [...offBoardingKeys.entrevistas.all(), 'list', filters] as const,
    detail: (id: number) => [...offBoardingKeys.entrevistas.all(), 'detail', id] as const,
  },
  liquidaciones: {
    all: () => [...offBoardingKeys.all, 'liquidaciones'] as const,
    list: (filters?: LiquidacionFinalFilter) => [...offBoardingKeys.liquidaciones.all(), 'list', filters] as const,
    detail: (id: number) => [...offBoardingKeys.liquidaciones.all(), 'detail', id] as const,
  },
};

// ============== TIPOS RETIRO ==============

export const useTiposRetiro = () => {
  return useQuery({
    queryKey: offBoardingKeys.tiposRetiro.list(),
    queryFn: async () => {
      const { data } = await api.get<TipoRetiro[]>(`${BASE_URL}/tipos-retiro/`);
      return data;
    },
  });
};

export const useTipoRetiro = (id: number, enabled = true) => {
  return useQuery({
    queryKey: offBoardingKeys.tiposRetiro.detail(id),
    queryFn: async () => {
      const { data } = await api.get<TipoRetiro>(`${BASE_URL}/tipos-retiro/${id}/`);
      return data;
    },
    enabled: enabled && !!id,
  });
};

export const useCreateTipoRetiro = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: TipoRetiroFormData) => {
      const { data: response } = await api.post<TipoRetiro>(`${BASE_URL}/tipos-retiro/`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.tiposRetiro.all() });
      toast.success('Tipo de retiro creado exitosamente');
    },
    onError: () => toast.error('Error al crear el tipo de retiro'),
  });
};

export const useUpdateTipoRetiro = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<TipoRetiroFormData> }) => {
      const { data: response } = await api.patch<TipoRetiro>(`${BASE_URL}/tipos-retiro/${id}/`, data);
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.tiposRetiro.all() });
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.tiposRetiro.detail(id) });
      toast.success('Tipo de retiro actualizado exitosamente');
    },
    onError: () => toast.error('Error al actualizar el tipo de retiro'),
  });
};

export const useDeleteTipoRetiro = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`${BASE_URL}/tipos-retiro/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.tiposRetiro.all() });
      toast.success('Tipo de retiro eliminado exitosamente');
    },
    onError: () => toast.error('Error al eliminar el tipo de retiro'),
  });
};

// ============== PROCESOS RETIRO ==============

export const useProcesosRetiro = (filters?: ProcesoRetiroFilter) => {
  return useQuery({
    queryKey: offBoardingKeys.procesos.list(filters),
    queryFn: async () => {
      const { data } = await api.get<ProcesoRetiro[]>(`${BASE_URL}/procesos/`, { params: filters });
      return data;
    },
  });
};

export const useProcesoRetiro = (id: number, enabled = true) => {
  return useQuery({
    queryKey: offBoardingKeys.procesos.detail(id),
    queryFn: async () => {
      const { data } = await api.get<ProcesoRetiro>(`${BASE_URL}/procesos/${id}/`);
      return data;
    },
    enabled: enabled && !!id,
  });
};

export const useCreateProcesoRetiro = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ProcesoRetiroFormData) => {
      const { data: response } = await api.post<ProcesoRetiro>(`${BASE_URL}/procesos/`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.procesos.all() });
      toast.success('Proceso de retiro iniciado exitosamente');
    },
    onError: () => toast.error('Error al iniciar el proceso de retiro'),
  });
};

export const useUpdateProcesoRetiro = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ProcesoRetiroFormData> }) => {
      const { data: response } = await api.patch<ProcesoRetiro>(`${BASE_URL}/procesos/${id}/`, data);
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.procesos.all() });
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.procesos.detail(id) });
      toast.success('Proceso de retiro actualizado exitosamente');
    },
    onError: () => toast.error('Error al actualizar el proceso de retiro'),
  });
};

export const useDeleteProcesoRetiro = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`${BASE_URL}/procesos/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.procesos.all() });
      toast.success('Proceso de retiro eliminado exitosamente');
    },
    onError: () => toast.error('Error al eliminar el proceso de retiro'),
  });
};

export const useFinalizarProcesoRetiro = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data: response } = await api.post<ProcesoRetiro>(`${BASE_URL}/procesos/${id}/finalizar/`);
      return response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.procesos.all() });
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.procesos.detail(id) });
      toast.success('Proceso de retiro finalizado exitosamente');
    },
    onError: () => toast.error('Error al finalizar el proceso de retiro'),
  });
};

export const useCancelarProcesoRetiro = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: number; motivo: string }) => {
      const { data: response } = await api.post<ProcesoRetiro>(`${BASE_URL}/procesos/${id}/cancelar/`, { observaciones: motivo });
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.procesos.all() });
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.procesos.detail(id) });
      toast.success('Proceso de retiro cancelado');
    },
    onError: () => toast.error('Error al cancelar el proceso de retiro'),
  });
};

// ============== CHECKLIST RETIRO ==============

export const useChecklistRetiro = (filters?: ChecklistRetiroFilter) => {
  return useQuery({
    queryKey: offBoardingKeys.checklist.list(filters),
    queryFn: async () => {
      const { data } = await api.get<ChecklistRetiro[]>(`${BASE_URL}/checklist/`, { params: filters });
      return data;
    },
  });
};

export const useChecklistRetiroDetalle = (id: number, enabled = true) => {
  return useQuery({
    queryKey: offBoardingKeys.checklist.detail(id),
    queryFn: async () => {
      const { data } = await api.get<ChecklistRetiro>(`${BASE_URL}/checklist/${id}/`);
      return data;
    },
    enabled: enabled && !!id,
  });
};

export const useCreateChecklistItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ChecklistRetiroFormData) => {
      const { data: response } = await api.post<ChecklistRetiro>(`${BASE_URL}/checklist/`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.checklist.all() });
      toast.success('Item de checklist creado exitosamente');
    },
    onError: () => toast.error('Error al crear el item de checklist'),
  });
};

export const useUpdateChecklistItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ChecklistRetiroFormData> }) => {
      const { data: response } = await api.patch<ChecklistRetiro>(`${BASE_URL}/checklist/${id}/`, data);
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.checklist.all() });
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.checklist.detail(id) });
      toast.success('Item de checklist actualizado exitosamente');
    },
    onError: () => toast.error('Error al actualizar el item de checklist'),
  });
};

export const useDeleteChecklistItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`${BASE_URL}/checklist/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.checklist.all() });
      toast.success('Item de checklist eliminado exitosamente');
    },
    onError: () => toast.error('Error al eliminar el item de checklist'),
  });
};

export const useCompletarChecklistItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data?: CompletarItemData }) => {
      const { data: response } = await api.post<ChecklistRetiro>(`${BASE_URL}/checklist/${id}/completar/`, data || {});
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.checklist.all() });
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.checklist.detail(id) });
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.procesos.all() });
      toast.success('Item completado exitosamente');
    },
    onError: () => toast.error('Error al completar el item'),
  });
};

// ============== PAZ Y SALVOS ==============

export const usePazSalvos = (filters?: PazSalvoFilter) => {
  return useQuery({
    queryKey: offBoardingKeys.pazSalvos.list(filters),
    queryFn: async () => {
      const { data } = await api.get<PazSalvo[]>(`${BASE_URL}/paz-salvos/`, { params: filters });
      return data;
    },
  });
};

export const usePazSalvo = (id: number, enabled = true) => {
  return useQuery({
    queryKey: offBoardingKeys.pazSalvos.detail(id),
    queryFn: async () => {
      const { data } = await api.get<PazSalvo>(`${BASE_URL}/paz-salvos/${id}/`);
      return data;
    },
    enabled: enabled && !!id,
  });
};

export const useCreatePazSalvo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PazSalvoFormData) => {
      const { data: response } = await api.post<PazSalvo>(`${BASE_URL}/paz-salvos/`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.pazSalvos.all() });
      toast.success('Paz y salvo creado exitosamente');
    },
    onError: () => toast.error('Error al crear el paz y salvo'),
  });
};

export const useUpdatePazSalvo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<PazSalvoFormData> }) => {
      const { data: response } = await api.patch<PazSalvo>(`${BASE_URL}/paz-salvos/${id}/`, data);
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.pazSalvos.all() });
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.pazSalvos.detail(id) });
      toast.success('Paz y salvo actualizado exitosamente');
    },
    onError: () => toast.error('Error al actualizar el paz y salvo'),
  });
};

export const useDeletePazSalvo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`${BASE_URL}/paz-salvos/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.pazSalvos.all() });
      toast.success('Paz y salvo eliminado exitosamente');
    },
    onError: () => toast.error('Error al eliminar el paz y salvo'),
  });
};

export const useAprobarPazSalvo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: AprobarPazSalvoData }) => {
      const { data: response } = await api.post<PazSalvo>(`${BASE_URL}/paz-salvos/${id}/aprobar/`, data);
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.pazSalvos.all() });
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.pazSalvos.detail(id) });
      toast.success('Paz y salvo aprobado exitosamente');
    },
    onError: () => toast.error('Error al aprobar el paz y salvo'),
  });
};

export const useRechazarPazSalvo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, observaciones }: { id: number; observaciones: string }) => {
      const { data: response } = await api.post<PazSalvo>(`${BASE_URL}/paz-salvos/${id}/rechazar/`, { observaciones });
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.pazSalvos.all() });
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.pazSalvos.detail(id) });
      toast.success('Paz y salvo rechazado');
    },
    onError: () => toast.error('Error al rechazar el paz y salvo'),
  });
};

// ============== EXAMENES EGRESO ==============

export const useExamenesEgreso = (filters?: ExamenEgresoFilter) => {
  return useQuery({
    queryKey: offBoardingKeys.examenes.list(filters),
    queryFn: async () => {
      const { data } = await api.get<ExamenEgreso[]>(`${BASE_URL}/examenes/`, { params: filters });
      return data;
    },
  });
};

export const useExamenEgreso = (id: number, enabled = true) => {
  return useQuery({
    queryKey: offBoardingKeys.examenes.detail(id),
    queryFn: async () => {
      const { data } = await api.get<ExamenEgreso>(`${BASE_URL}/examenes/${id}/`);
      return data;
    },
    enabled: enabled && !!id,
  });
};

export const useCreateExamenEgreso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ExamenEgresoFormData) => {
      const { data: response } = await api.post<ExamenEgreso>(`${BASE_URL}/examenes/`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.examenes.all() });
      toast.success('Examen de egreso programado exitosamente');
    },
    onError: () => toast.error('Error al programar el examen de egreso'),
  });
};

export const useUpdateExamenEgreso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ExamenEgresoFormData> }) => {
      const { data: response } = await api.patch<ExamenEgreso>(`${BASE_URL}/examenes/${id}/`, data);
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.examenes.all() });
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.examenes.detail(id) });
      toast.success('Examen de egreso actualizado exitosamente');
    },
    onError: () => toast.error('Error al actualizar el examen de egreso'),
  });
};

export const useDeleteExamenEgreso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`${BASE_URL}/examenes/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.examenes.all() });
      toast.success('Examen de egreso eliminado exitosamente');
    },
    onError: () => toast.error('Error al eliminar el examen de egreso'),
  });
};

export const useRegistrarResultadoExamen = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RegistrarResultadoExamenData }) => {
      const { data: response } = await api.post<ExamenEgreso>(`${BASE_URL}/examenes/${id}/registrar_resultado/`, data);
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.examenes.all() });
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.examenes.detail(id) });
      toast.success('Resultado registrado exitosamente');
    },
    onError: () => toast.error('Error al registrar el resultado'),
  });
};

// ============== ENTREVISTAS RETIRO ==============

export const useEntrevistasRetiro = (filters?: EntrevistaRetiroFilter) => {
  return useQuery({
    queryKey: offBoardingKeys.entrevistas.list(filters),
    queryFn: async () => {
      const { data } = await api.get<EntrevistaRetiro[]>(`${BASE_URL}/entrevistas/`, { params: filters });
      return data;
    },
  });
};

export const useEntrevistaRetiro = (id: number, enabled = true) => {
  return useQuery({
    queryKey: offBoardingKeys.entrevistas.detail(id),
    queryFn: async () => {
      const { data } = await api.get<EntrevistaRetiro>(`${BASE_URL}/entrevistas/${id}/`);
      return data;
    },
    enabled: enabled && !!id,
  });
};

export const useCreateEntrevistaRetiro = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: EntrevistaRetiroFormData) => {
      const { data: response } = await api.post<EntrevistaRetiro>(`${BASE_URL}/entrevistas/`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.entrevistas.all() });
      toast.success('Entrevista de retiro registrada exitosamente');
    },
    onError: () => toast.error('Error al registrar la entrevista de retiro'),
  });
};

export const useUpdateEntrevistaRetiro = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<EntrevistaRetiroFormData> }) => {
      const { data: response } = await api.patch<EntrevistaRetiro>(`${BASE_URL}/entrevistas/${id}/`, data);
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.entrevistas.all() });
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.entrevistas.detail(id) });
      toast.success('Entrevista de retiro actualizada exitosamente');
    },
    onError: () => toast.error('Error al actualizar la entrevista de retiro'),
  });
};

export const useDeleteEntrevistaRetiro = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`${BASE_URL}/entrevistas/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.entrevistas.all() });
      toast.success('Entrevista de retiro eliminada exitosamente');
    },
    onError: () => toast.error('Error al eliminar la entrevista de retiro'),
  });
};

// ============== LIQUIDACIONES FINALES ==============

export const useLiquidacionesFinales = (filters?: LiquidacionFinalFilter) => {
  return useQuery({
    queryKey: offBoardingKeys.liquidaciones.list(filters),
    queryFn: async () => {
      const { data } = await api.get<LiquidacionFinal[]>(`${BASE_URL}/liquidaciones/`, { params: filters });
      return data;
    },
  });
};

export const useLiquidacionFinal = (id: number, enabled = true) => {
  return useQuery({
    queryKey: offBoardingKeys.liquidaciones.detail(id),
    queryFn: async () => {
      const { data } = await api.get<LiquidacionFinal>(`${BASE_URL}/liquidaciones/${id}/`);
      return data;
    },
    enabled: enabled && !!id,
  });
};

export const useCalcularLiquidacionFinal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CalcularLiquidacionFinalData) => {
      const { data: response } = await api.post<LiquidacionFinal>(`${BASE_URL}/liquidaciones/calcular/`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.liquidaciones.all() });
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.procesos.all() });
      toast.success('Liquidación final calculada exitosamente');
    },
    onError: () => toast.error('Error al calcular la liquidación final'),
  });
};

export const useAprobarLiquidacionFinal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data: response } = await api.post<LiquidacionFinal>(`${BASE_URL}/liquidaciones/${id}/aprobar/`);
      return response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.liquidaciones.all() });
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.liquidaciones.detail(id) });
      toast.success('Liquidación final aprobada exitosamente');
    },
    onError: () => toast.error('Error al aprobar la liquidación final'),
  });
};

export const usePagarLiquidacionFinal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data: response } = await api.post<LiquidacionFinal>(`${BASE_URL}/liquidaciones/${id}/pagar/`);
      return response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.liquidaciones.all() });
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.liquidaciones.detail(id) });
      queryClient.invalidateQueries({ queryKey: offBoardingKeys.procesos.all() });
      toast.success('Liquidación final pagada exitosamente');
    },
    onError: () => toast.error('Error al pagar la liquidación final'),
  });
};
