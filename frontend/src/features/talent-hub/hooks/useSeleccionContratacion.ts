/**
 * React Query Hooks para Selección y Contratación - Talent Hub
 * Sistema de Gestión StrateKaz
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type {
  VacanteActiva,
  VacanteActivaFormData,
  VacanteActivaFilters,
  Candidato,
  CandidatoFormData,
  CandidatoFilters,
  Entrevista,
  EntrevistaFormData,
  EntrevistaFilters,
  Prueba,
  PruebaFormData,
  PruebaFilters,
  TipoContrato,
  TipoEntidad,
  EntidadSeguridadSocial,
  TipoPrueba,
  EstadoCandidato,
  ProcesoSeleccionEstadisticas,
} from '../types';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const seleccionKeys = {
  // Catálogos
  tiposContrato: ['tipos-contrato'] as const,
  tiposEntidad: ['tipos-entidad'] as const,
  entidadesSS: (tipoEntidad?: string) => ['entidades-ss', tipoEntidad] as const,
  tiposPrueba: ['tipos-prueba'] as const,

  // Vacantes Activas
  vacantesActivas: {
    all: ['vacantes-activas'] as const,
    list: (filters?: VacanteActivaFilters) => [...seleccionKeys.vacantesActivas.all, 'list', filters] as const,
    detail: (id: string) => [...seleccionKeys.vacantesActivas.all, 'detail', id] as const,
    abiertas: () => [...seleccionKeys.vacantesActivas.all, 'abiertas'] as const,
  },

  // Candidatos
  candidatos: {
    all: ['candidatos'] as const,
    list: (filters?: CandidatoFilters) => [...seleccionKeys.candidatos.all, 'list', filters] as const,
    detail: (id: string) => [...seleccionKeys.candidatos.all, 'detail', id] as const,
    porVacante: (vacanteId: string) => [...seleccionKeys.candidatos.all, 'vacante', vacanteId] as const,
  },

  // Entrevistas
  entrevistas: {
    all: ['entrevistas'] as const,
    list: (filters?: EntrevistaFilters) => [...seleccionKeys.entrevistas.all, 'list', filters] as const,
    detail: (id: string) => [...seleccionKeys.entrevistas.all, 'detail', id] as const,
    porCandidato: (candidatoId: string) => [...seleccionKeys.entrevistas.all, 'candidato', candidatoId] as const,
  },

  // Pruebas
  pruebas: {
    all: ['pruebas'] as const,
    list: (filters?: PruebaFilters) => [...seleccionKeys.pruebas.all, 'list', filters] as const,
    detail: (id: string) => [...seleccionKeys.pruebas.all, 'detail', id] as const,
    porCandidato: (candidatoId: string) => [...seleccionKeys.pruebas.all, 'candidato', candidatoId] as const,
  },

  // Estadísticas
  estadisticas: () => ['seleccion', 'estadisticas'] as const,
};

// ============================================================================
// HOOKS - CATÁLOGOS
// ============================================================================

export function useTiposContrato() {
  return useQuery({
    queryKey: seleccionKeys.tiposContrato,
    queryFn: async () => {
      const response = await api.get<TipoContrato[]>('/api/talent-hub/seleccion/tipos-contrato/');
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutos - catálogo estable
  });
}

export function useTiposEntidad() {
  return useQuery({
    queryKey: seleccionKeys.tiposEntidad,
    queryFn: async () => {
      const response = await api.get<TipoEntidad[]>('/api/talent-hub/seleccion/tipos-entidad/');
      return response.data;
    },
    staleTime: 30 * 60 * 1000,
  });
}

export function useEntidadesSS(tipoEntidad?: string) {
  return useQuery({
    queryKey: seleccionKeys.entidadesSS(tipoEntidad),
    queryFn: async () => {
      const params = tipoEntidad ? `?tipo_entidad=${tipoEntidad}` : '';
      const response = await api.get<EntidadSeguridadSocial[]>(`/api/talent-hub/seleccion/entidades-ss/${params}`);
      return response.data;
    },
    staleTime: 30 * 60 * 1000,
  });
}

export function useTiposPrueba() {
  return useQuery({
    queryKey: seleccionKeys.tiposPrueba,
    queryFn: async () => {
      const response = await api.get<TipoPrueba[]>('/api/talent-hub/seleccion/tipos-prueba/');
      return response.data;
    },
    staleTime: 30 * 60 * 1000,
  });
}

// ============================================================================
// HOOKS - VACANTES ACTIVAS
// ============================================================================

export function useVacantesActivas(filters?: VacanteActivaFilters) {
  return useQuery({
    queryKey: seleccionKeys.vacantesActivas.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.cargo) params.append('cargo', filters.cargo);
      if (filters?.area) params.append('area', filters.area);
      if (filters?.estado) params.append('estado', filters.estado);
      if (filters?.responsable_proceso) params.append('responsable_proceso', filters.responsable_proceso);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.page_size) params.append('page_size', String(filters.page_size));

      const response = await api.get(`/api/talent-hub/seleccion/vacantes-activas/?${params}`);
      return response.data;
    },
    staleTime: 3 * 60 * 1000,
  });
}

export function useVacanteActiva(id: string) {
  return useQuery({
    queryKey: seleccionKeys.vacantesActivas.detail(id),
    queryFn: async () => {
      const response = await api.get<VacanteActiva>(`/api/talent-hub/seleccion/vacantes-activas/${id}/`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 3 * 60 * 1000,
  });
}

export function useVacantesActivasAbiertas() {
  return useQuery({
    queryKey: seleccionKeys.vacantesActivas.abiertas(),
    queryFn: async () => {
      const response = await api.get('/api/talent-hub/seleccion/vacantes-activas/abiertas/');
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateVacanteActiva() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: VacanteActivaFormData) => {
      const response = await api.post('/api/talent-hub/seleccion/vacantes-activas/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seleccionKeys.vacantesActivas.all });
      toast.success('Vacante creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al crear la vacante');
    },
  });
}

export function useUpdateVacanteActiva() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<VacanteActivaFormData> }) => {
      const response = await api.patch(`/api/talent-hub/seleccion/vacantes-activas/${id}/`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: seleccionKeys.vacantesActivas.all });
      queryClient.invalidateQueries({ queryKey: seleccionKeys.vacantesActivas.detail(variables.id) });
      toast.success('Vacante actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al actualizar la vacante');
    },
  });
}

export function useCerrarVacanteActiva() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo?: string }) => {
      const response = await api.post(`/api/talent-hub/seleccion/vacantes-activas/${id}/cerrar/`, { motivo });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seleccionKeys.vacantesActivas.all });
      queryClient.invalidateQueries({ queryKey: seleccionKeys.estadisticas() });
      toast.success('Vacante cerrada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al cerrar la vacante');
    },
  });
}

// ============================================================================
// HOOKS - CANDIDATOS
// ============================================================================

export function useCandidatos(filters?: CandidatoFilters) {
  return useQuery({
    queryKey: seleccionKeys.candidatos.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.vacante) params.append('vacante', filters.vacante);
      if (filters?.estado) params.append('estado', filters.estado);
      if (filters?.fuente_reclutamiento) params.append('fuente_reclutamiento', filters.fuente_reclutamiento);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.page_size) params.append('page_size', String(filters.page_size));

      const response = await api.get(`/api/talent-hub/seleccion/candidatos/?${params}`);
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useCandidato(id: string) {
  return useQuery({
    queryKey: seleccionKeys.candidatos.detail(id),
    queryFn: async () => {
      const response = await api.get<Candidato>(`/api/talent-hub/seleccion/candidatos/${id}/`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCandidatosPorVacante(vacanteId: string) {
  return useQuery({
    queryKey: seleccionKeys.candidatos.porVacante(vacanteId),
    queryFn: async () => {
      const response = await api.get(`/api/talent-hub/seleccion/candidatos/?vacante=${vacanteId}`);
      return response.data;
    },
    enabled: !!vacanteId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateCandidato() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CandidatoFormData) => {
      const response = await api.post('/api/talent-hub/seleccion/candidatos/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seleccionKeys.candidatos.all });
      queryClient.invalidateQueries({ queryKey: seleccionKeys.estadisticas() });
      toast.success('Candidato registrado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al registrar el candidato');
    },
  });
}

export function useUpdateCandidato() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CandidatoFormData> }) => {
      const response = await api.patch(`/api/talent-hub/seleccion/candidatos/${id}/`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: seleccionKeys.candidatos.all });
      queryClient.invalidateQueries({ queryKey: seleccionKeys.candidatos.detail(variables.id) });
      toast.success('Candidato actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al actualizar el candidato');
    },
  });
}

export function useCambiarEstadoCandidato() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, estado, motivo }: { id: string; estado: EstadoCandidato; motivo?: string }) => {
      const response = await api.post(`/api/talent-hub/seleccion/candidatos/${id}/cambiar_estado/`, {
        estado,
        motivo_rechazo: motivo,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: seleccionKeys.candidatos.all });
      queryClient.invalidateQueries({ queryKey: seleccionKeys.candidatos.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: seleccionKeys.estadisticas() });
      toast.success('Estado del candidato actualizado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al cambiar el estado');
    },
  });
}

export function useContratarCandidato() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: string; datos: Record<string, any> }) => {
      const response = await api.post(`/api/talent-hub/seleccion/candidatos/${id}/contratar/`, datos);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seleccionKeys.candidatos.all });
      queryClient.invalidateQueries({ queryKey: seleccionKeys.vacantesActivas.all });
      queryClient.invalidateQueries({ queryKey: seleccionKeys.estadisticas() });
      toast.success('Candidato contratado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al contratar el candidato');
    },
  });
}

// ============================================================================
// HOOKS - ENTREVISTAS
// ============================================================================

export function useEntrevistas(filters?: EntrevistaFilters) {
  return useQuery({
    queryKey: seleccionKeys.entrevistas.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.candidato) params.append('candidato', filters.candidato);
      if (filters?.vacante) params.append('vacante', filters.vacante);
      if (filters?.entrevistador) params.append('entrevistador', filters.entrevistador);
      if (filters?.estado) params.append('estado', filters.estado);
      if (filters?.tipo_entrevista) params.append('tipo_entrevista', filters.tipo_entrevista);
      if (filters?.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
      if (filters?.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.page_size) params.append('page_size', String(filters.page_size));

      const response = await api.get(`/api/talent-hub/seleccion/entrevistas/?${params}`);
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useEntrevista(id: string) {
  return useQuery({
    queryKey: seleccionKeys.entrevistas.detail(id),
    queryFn: async () => {
      const response = await api.get<Entrevista>(`/api/talent-hub/seleccion/entrevistas/${id}/`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateEntrevista() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EntrevistaFormData) => {
      const response = await api.post('/api/talent-hub/seleccion/entrevistas/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seleccionKeys.entrevistas.all });
      queryClient.invalidateQueries({ queryKey: seleccionKeys.estadisticas() });
      toast.success('Entrevista programada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al programar la entrevista');
    },
  });
}

export function useUpdateEntrevista() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EntrevistaFormData> }) => {
      const response = await api.patch(`/api/talent-hub/seleccion/entrevistas/${id}/`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: seleccionKeys.entrevistas.all });
      queryClient.invalidateQueries({ queryKey: seleccionKeys.entrevistas.detail(variables.id) });
      toast.success('Entrevista actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al actualizar la entrevista');
    },
  });
}

// ============================================================================
// HOOKS - PRUEBAS
// ============================================================================

export function usePruebas(filters?: PruebaFilters) {
  return useQuery({
    queryKey: seleccionKeys.pruebas.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.candidato) params.append('candidato', filters.candidato);
      if (filters?.vacante) params.append('vacante', filters.vacante);
      if (filters?.tipo_prueba) params.append('tipo_prueba', filters.tipo_prueba);
      if (filters?.estado) params.append('estado', filters.estado);
      if (filters?.resultado) params.append('resultado', filters.resultado);
      if (filters?.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
      if (filters?.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.page_size) params.append('page_size', String(filters.page_size));

      const response = await api.get(`/api/talent-hub/seleccion/pruebas/?${params}`);
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function usePrueba(id: string) {
  return useQuery({
    queryKey: seleccionKeys.pruebas.detail(id),
    queryFn: async () => {
      const response = await api.get<Prueba>(`/api/talent-hub/seleccion/pruebas/${id}/`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreatePrueba() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PruebaFormData) => {
      const response = await api.post('/api/talent-hub/seleccion/pruebas/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seleccionKeys.pruebas.all });
      queryClient.invalidateQueries({ queryKey: seleccionKeys.estadisticas() });
      toast.success('Prueba programada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al programar la prueba');
    },
  });
}

export function useCalificarPrueba() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, puntaje, resultado, observaciones }: {
      id: string;
      puntaje: number;
      resultado: 'APROBADO' | 'REPROBADO';
      observaciones?: string;
    }) => {
      const response = await api.post(`/api/talent-hub/seleccion/pruebas/${id}/calificar/`, {
        puntaje_obtenido: puntaje,
        resultado,
        observaciones_evaluador: observaciones,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: seleccionKeys.pruebas.all });
      queryClient.invalidateQueries({ queryKey: seleccionKeys.pruebas.detail(variables.id) });
      toast.success('Prueba calificada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al calificar la prueba');
    },
  });
}

// ============================================================================
// HOOKS - ESTADÍSTICAS
// ============================================================================

export function useProcesoSeleccionEstadisticas() {
  return useQuery({
    queryKey: seleccionKeys.estadisticas(),
    queryFn: async () => {
      const response = await api.get<ProcesoSeleccionEstadisticas>('/api/talent-hub/seleccion/estadisticas/resumen/');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
