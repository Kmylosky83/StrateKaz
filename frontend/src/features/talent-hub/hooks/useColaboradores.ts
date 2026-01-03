/**
 * React Query Hooks para Colaboradores - Talent Hub
 * Sistema de Gestión StrateKaz
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
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
// QUERY KEYS
// ============================================================================

export const colaboradoresKeys = {
  all: ['colaboradores'] as const,
  list: (filters?: ColaboradorFilters) => [...colaboradoresKeys.all, 'list', filters] as const,
  detail: (id: string) => [...colaboradoresKeys.all, 'detail', id] as const,
  completo: (id: string) => [...colaboradoresKeys.all, 'completo', id] as const,
  activos: () => [...colaboradoresKeys.all, 'activos'] as const,
  porArea: (areaId: string) => [...colaboradoresKeys.all, 'area', areaId] as const,
  porCargo: (cargoId: string) => [...colaboradoresKeys.all, 'cargo', cargoId] as const,
  estadisticas: () => [...colaboradoresKeys.all, 'estadisticas'] as const,

  // Hoja de Vida
  hojasVida: {
    all: ['hojas-vida'] as const,
    list: () => [...colaboradoresKeys.hojasVida.all, 'list'] as const,
    detail: (id: string) => [...colaboradoresKeys.hojasVida.all, 'detail', id] as const,
    porColaborador: (colaboradorId: string) => [...colaboradoresKeys.hojasVida.all, 'colaborador', colaboradorId] as const,
  },

  // Info Personal
  infoPersonal: {
    all: ['info-personal'] as const,
    list: () => [...colaboradoresKeys.infoPersonal.all, 'list'] as const,
    detail: (id: string) => [...colaboradoresKeys.infoPersonal.all, 'detail', id] as const,
    porColaborador: (colaboradorId: string) => [...colaboradoresKeys.infoPersonal.all, 'colaborador', colaboradorId] as const,
  },

  // Historial Laboral
  historialLaboral: {
    all: ['historial-laboral'] as const,
    list: (filters?: HistorialLaboralFilters) => [...colaboradoresKeys.historialLaboral.all, 'list', filters] as const,
    detail: (id: string) => [...colaboradoresKeys.historialLaboral.all, 'detail', id] as const,
    porColaborador: (colaboradorId: string) => [...colaboradoresKeys.historialLaboral.all, 'colaborador', colaboradorId] as const,
    ascensos: () => [...colaboradoresKeys.historialLaboral.all, 'ascensos'] as const,
    traslados: () => [...colaboradoresKeys.historialLaboral.all, 'traslados'] as const,
  },
};

// ============================================================================
// HOOKS - COLABORADORES
// ============================================================================

/**
 * Hook para obtener lista de colaboradores con filtros
 */
export function useColaboradores(filters?: ColaboradorFilters) {
  return useQuery({
    queryKey: colaboradoresKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.estado) params.append('estado', filters.estado);
      if (filters?.cargo) params.append('cargo', filters.cargo);
      if (filters?.area) params.append('area', filters.area);
      if (filters?.tipo_contrato) params.append('tipo_contrato', filters.tipo_contrato);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.page_size) params.append('page_size', String(filters.page_size));

      const response = await api.get(`/api/talent-hub/empleados/colaboradores/?${params}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener un colaborador específico
 */
export function useColaborador(id: string) {
  return useQuery({
    queryKey: colaboradoresKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<Colaborador>(`/api/talent-hub/empleados/colaboradores/${id}/`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener el perfil completo de un colaborador
 * (incluye hoja de vida, info personal e historial)
 */
export function useColaboradorCompleto(id: string) {
  return useQuery({
    queryKey: colaboradoresKeys.completo(id),
    queryFn: async () => {
      const response = await api.get<ColaboradorCompleto>(`/api/talent-hub/empleados/colaboradores/${id}/completo/`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener solo colaboradores activos
 */
export function useColaboradoresActivos() {
  return useQuery({
    queryKey: colaboradoresKeys.activos(),
    queryFn: async () => {
      const response = await api.get('/api/talent-hub/empleados/colaboradores/activos/');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener colaboradores por área
 */
export function useColaboradoresPorArea(areaId: string) {
  return useQuery({
    queryKey: colaboradoresKeys.porArea(areaId),
    queryFn: async () => {
      const response = await api.get(`/api/talent-hub/empleados/colaboradores/por-area/${areaId}/`);
      return response.data;
    },
    enabled: !!areaId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener colaboradores por cargo
 */
export function useColaboradoresPorCargo(cargoId: string) {
  return useQuery({
    queryKey: colaboradoresKeys.porCargo(cargoId),
    queryFn: async () => {
      const response = await api.get(`/api/talent-hub/empleados/colaboradores/por-cargo/${cargoId}/`);
      return response.data;
    },
    enabled: !!cargoId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener estadísticas de colaboradores
 */
export function useColaboradoresEstadisticas() {
  return useQuery({
    queryKey: colaboradoresKeys.estadisticas(),
    queryFn: async () => {
      const response = await api.get<ColaboradorEstadisticas>('/api/talent-hub/empleados/colaboradores/estadisticas/');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para crear un nuevo colaborador
 */
export function useCreateColaborador() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ColaboradorFormData) => {
      const response = await api.post('/api/talent-hub/empleados/colaboradores/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: colaboradoresKeys.all });
      queryClient.invalidateQueries({ queryKey: colaboradoresKeys.estadisticas() });
      toast.success('Colaborador creado exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail ||
        error.response?.data?.numero_identificacion?.[0] ||
        'Error al crear el colaborador';
      toast.error(message);
    },
  });
}

/**
 * Hook para actualizar un colaborador existente
 */
export function useUpdateColaborador() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ColaboradorFormData> }) => {
      const response = await api.patch(`/api/talent-hub/empleados/colaboradores/${id}/`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: colaboradoresKeys.all });
      queryClient.invalidateQueries({ queryKey: colaboradoresKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: colaboradoresKeys.completo(variables.id) });
      toast.success('Colaborador actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al actualizar el colaborador');
    },
  });
}

/**
 * Hook para retirar un colaborador
 */
export function useRetirarColaborador() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, fecha_retiro, motivo_retiro }: {
      id: string;
      fecha_retiro?: string;
      motivo_retiro?: string;
    }) => {
      const response = await api.post(`/api/talent-hub/empleados/colaboradores/${id}/retirar/`, {
        fecha_retiro,
        motivo_retiro,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: colaboradoresKeys.all });
      queryClient.invalidateQueries({ queryKey: colaboradoresKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: colaboradoresKeys.estadisticas() });
      queryClient.invalidateQueries({ queryKey: colaboradoresKeys.historialLaboral.porColaborador(variables.id) });
      toast.success('Colaborador retirado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al retirar el colaborador');
    },
  });
}

// ============================================================================
// HOOKS - HOJA DE VIDA
// ============================================================================

/**
 * Hook para obtener la hoja de vida de un colaborador
 */
export function useHojaVidaColaborador(colaboradorId: string) {
  return useQuery({
    queryKey: colaboradoresKeys.hojasVida.porColaborador(colaboradorId),
    queryFn: async () => {
      const response = await api.get<HojaVida>(`/api/talent-hub/empleados/hojas-vida/por-colaborador/${colaboradorId}/`);
      return response.data;
    },
    enabled: !!colaboradorId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook para crear hoja de vida
 */
export function useCreateHojaVida() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: HojaVidaFormData) => {
      const response = await api.post('/api/talent-hub/empleados/hojas-vida/', data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: colaboradoresKeys.hojasVida.all });
      queryClient.invalidateQueries({ queryKey: colaboradoresKeys.hojasVida.porColaborador(variables.colaborador) });
      queryClient.invalidateQueries({ queryKey: colaboradoresKeys.completo(variables.colaborador) });
      toast.success('Hoja de vida creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al crear la hoja de vida');
    },
  });
}

/**
 * Hook para actualizar hoja de vida
 */
export function useUpdateHojaVida() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<HojaVidaFormData> }) => {
      const response = await api.patch(`/api/talent-hub/empleados/hojas-vida/${id}/`, data);
      return response.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: colaboradoresKeys.hojasVida.all });
      if (result.colaborador) {
        queryClient.invalidateQueries({ queryKey: colaboradoresKeys.completo(result.colaborador.id || result.colaborador) });
      }
      toast.success('Hoja de vida actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al actualizar la hoja de vida');
    },
  });
}

// ============================================================================
// HOOKS - INFORMACIÓN PERSONAL
// ============================================================================

/**
 * Hook para obtener la información personal de un colaborador
 */
export function useInfoPersonalColaborador(colaboradorId: string) {
  return useQuery({
    queryKey: colaboradoresKeys.infoPersonal.porColaborador(colaboradorId),
    queryFn: async () => {
      const response = await api.get<InfoPersonal>(`/api/talent-hub/empleados/info-personal/por-colaborador/${colaboradorId}/`);
      return response.data;
    },
    enabled: !!colaboradorId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook para crear información personal
 */
export function useCreateInfoPersonal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InfoPersonalFormData) => {
      const response = await api.post('/api/talent-hub/empleados/info-personal/', data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: colaboradoresKeys.infoPersonal.all });
      queryClient.invalidateQueries({ queryKey: colaboradoresKeys.infoPersonal.porColaborador(variables.colaborador) });
      queryClient.invalidateQueries({ queryKey: colaboradoresKeys.completo(variables.colaborador) });
      toast.success('Información personal registrada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al registrar la información personal');
    },
  });
}

/**
 * Hook para actualizar información personal
 */
export function useUpdateInfoPersonal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InfoPersonalFormData> }) => {
      const response = await api.patch(`/api/talent-hub/empleados/info-personal/${id}/`, data);
      return response.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: colaboradoresKeys.infoPersonal.all });
      if (result.colaborador) {
        queryClient.invalidateQueries({ queryKey: colaboradoresKeys.completo(result.colaborador.id || result.colaborador) });
      }
      toast.success('Información personal actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al actualizar la información personal');
    },
  });
}

// ============================================================================
// HOOKS - HISTORIAL LABORAL
// ============================================================================

/**
 * Hook para obtener historial laboral con filtros
 */
export function useHistorialLaboral(filters?: HistorialLaboralFilters) {
  return useQuery({
    queryKey: colaboradoresKeys.historialLaboral.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.colaborador) params.append('colaborador', filters.colaborador);
      if (filters?.tipo_movimiento) params.append('tipo_movimiento', filters.tipo_movimiento);
      if (filters?.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
      if (filters?.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.page_size) params.append('page_size', String(filters.page_size));

      const response = await api.get(`/api/talent-hub/empleados/historial-laboral/?${params}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener historial laboral de un colaborador
 */
export function useHistorialLaboralColaborador(colaboradorId: string) {
  return useQuery({
    queryKey: colaboradoresKeys.historialLaboral.porColaborador(colaboradorId),
    queryFn: async () => {
      const response = await api.get<HistorialLaboral[]>(`/api/talent-hub/empleados/historial-laboral/por-colaborador/${colaboradorId}/`);
      return response.data;
    },
    enabled: !!colaboradorId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener solo ascensos
 */
export function useAscensos() {
  return useQuery({
    queryKey: colaboradoresKeys.historialLaboral.ascensos(),
    queryFn: async () => {
      const response = await api.get('/api/talent-hub/empleados/historial-laboral/ascensos/');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener solo traslados
 */
export function useTraslados() {
  return useQuery({
    queryKey: colaboradoresKeys.historialLaboral.traslados(),
    queryFn: async () => {
      const response = await api.get('/api/talent-hub/empleados/historial-laboral/traslados/');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para crear un registro de historial laboral
 */
export function useCreateHistorialLaboral() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: HistorialLaboralFormData) => {
      const response = await api.post('/api/talent-hub/empleados/historial-laboral/', data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: colaboradoresKeys.historialLaboral.all });
      queryClient.invalidateQueries({ queryKey: colaboradoresKeys.historialLaboral.porColaborador(variables.colaborador) });
      queryClient.invalidateQueries({ queryKey: colaboradoresKeys.completo(variables.colaborador) });
      toast.success('Movimiento registrado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al registrar el movimiento');
    },
  });
}
