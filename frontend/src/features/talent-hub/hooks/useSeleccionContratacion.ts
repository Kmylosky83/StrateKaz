/**
 * React Query Hooks para Seleccion y Contratacion - Talent Hub
 * Sistema de Gestion StrateKaz
 *
 * API Base: /api/talent-hub/seleccion/
 * Sincronizado con serializers del backend.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type {
  VacanteActiva,
  VacanteActivaFormData,
  VacanteActivaFilters,
  VacanteActivaDetail,
  Candidato,
  CandidatoFormData,
  CandidatoFilters,
  CandidatoDetail,
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
  AfiliacionSS,
  AfiliacionSSFormData,
  AfiliacionSSFilters,
  HistorialContrato,
  HistorialContratoFormData,
  HistorialContratoDetail,
  HistorialContratoFilters,
  EstadoCandidato,
  ProcesoSeleccionEstadisticas,
  PaginatedResponse,
  PlantillaPruebaList,
  PlantillaPruebaDetail,
  PlantillaPruebaFormData,
  AsignacionPruebaList,
  AsignacionPruebaDetail,
  AsignacionPruebaFormData,
  AsignacionPruebaFilters,
  PruebaPublicaData,
  EntrevistaAsincronicaList,
  EntrevistaAsincronicaDetail,
  EntrevistaAsincronicaFormData,
  EntrevistaAsincronicaFilters,
  EntrevistaAsincronicaPublicData,
  PerfilamientoResponse,
} from '../types';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const seleccionKeys = {
  // Catalogos
  tiposContrato: ['seleccion', 'tipos-contrato'] as const,
  tiposEntidad: ['seleccion', 'tipos-entidad'] as const,
  entidadesSS: (tipoCodigo?: string) => ['seleccion', 'entidades-ss', tipoCodigo] as const,
  tiposPrueba: ['seleccion', 'tipos-prueba'] as const,

  // Vacantes Activas
  vacantesActivas: {
    all: ['seleccion', 'vacantes-activas'] as const,
    list: (filters?: VacanteActivaFilters) =>
      [...seleccionKeys.vacantesActivas.all, 'list', filters] as const,
    detail: (id: number) => [...seleccionKeys.vacantesActivas.all, 'detail', id] as const,
    abiertas: () => [...seleccionKeys.vacantesActivas.all, 'abiertas'] as const,
    perfilamiento: (id: number) =>
      [...seleccionKeys.vacantesActivas.all, 'perfilamiento', id] as const,
  },

  // Candidatos
  candidatos: {
    all: ['seleccion', 'candidatos'] as const,
    list: (filters?: CandidatoFilters) =>
      [...seleccionKeys.candidatos.all, 'list', filters] as const,
    detail: (id: number) => [...seleccionKeys.candidatos.all, 'detail', id] as const,
    porVacante: (vacanteId: number) =>
      [...seleccionKeys.candidatos.all, 'vacante', vacanteId] as const,
  },

  // Entrevistas
  entrevistas: {
    all: ['seleccion', 'entrevistas'] as const,
    list: (filters?: EntrevistaFilters) =>
      [...seleccionKeys.entrevistas.all, 'list', filters] as const,
    detail: (id: number) => [...seleccionKeys.entrevistas.all, 'detail', id] as const,
    porCandidato: (candidatoId: number) =>
      [...seleccionKeys.entrevistas.all, 'candidato', candidatoId] as const,
  },

  // Pruebas
  pruebas: {
    all: ['seleccion', 'pruebas'] as const,
    list: (filters?: PruebaFilters) => [...seleccionKeys.pruebas.all, 'list', filters] as const,
    detail: (id: number) => [...seleccionKeys.pruebas.all, 'detail', id] as const,
    porCandidato: (candidatoId: number) =>
      [...seleccionKeys.pruebas.all, 'candidato', candidatoId] as const,
  },

  // Afiliaciones
  afiliaciones: {
    all: ['seleccion', 'afiliaciones'] as const,
    list: (filters?: AfiliacionSSFilters) =>
      [...seleccionKeys.afiliaciones.all, 'list', filters] as const,
    porCandidato: (candidatoId: number) =>
      [...seleccionKeys.afiliaciones.all, 'candidato', candidatoId] as const,
  },

  // Historial Contratos
  historialContratos: {
    all: ['seleccion', 'historial-contratos'] as const,
    list: (filters?: HistorialContratoFilters) =>
      [...seleccionKeys.historialContratos.all, 'list', filters] as const,
    detail: (id: number) => [...seleccionKeys.historialContratos.all, 'detail', id] as const,
    porVencer: (dias?: number) =>
      [...seleccionKeys.historialContratos.all, 'por-vencer', dias] as const,
  },

  // Plantillas Prueba Dinámica
  plantillasPrueba: {
    all: ['seleccion', 'plantillas-prueba'] as const,
    list: () => [...seleccionKeys.plantillasPrueba.all, 'list'] as const,
    detail: (id: number) => [...seleccionKeys.plantillasPrueba.all, 'detail', id] as const,
    activas: () => [...seleccionKeys.plantillasPrueba.all, 'activas'] as const,
  },

  // Asignaciones Prueba Dinámica
  asignacionesPrueba: {
    all: ['seleccion', 'asignaciones-prueba'] as const,
    list: (filters?: AsignacionPruebaFilters) =>
      [...seleccionKeys.asignacionesPrueba.all, 'list', filters] as const,
    detail: (id: number) => [...seleccionKeys.asignacionesPrueba.all, 'detail', id] as const,
    porCandidato: (candidatoId: number) =>
      [...seleccionKeys.asignacionesPrueba.all, 'candidato', candidatoId] as const,
  },

  // Entrevistas Asincronicas
  entrevistasAsync: {
    all: ['seleccion', 'entrevistas-async'] as const,
    list: (filters?: EntrevistaAsincronicaFilters) =>
      [...seleccionKeys.entrevistasAsync.all, 'list', filters] as const,
    detail: (id: number) => [...seleccionKeys.entrevistasAsync.all, 'detail', id] as const,
    porCandidato: (candidatoId: number) =>
      [...seleccionKeys.entrevistasAsync.all, 'candidato', candidatoId] as const,
  },

  // Estadisticas
  estadisticas: () => ['seleccion', 'estadisticas'] as const,
};

// ============================================================================
// HOOKS - CATALOGOS
// ============================================================================

export function useTiposContrato() {
  return useQuery({
    queryKey: seleccionKeys.tiposContrato,
    queryFn: async () => {
      const response = await api.get<TipoContrato[]>('/api/talent-hub/seleccion/tipos-contrato/');
      return response.data;
    },
    staleTime: 30 * 60 * 1000,
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

export function useEntidadesSS(tipoCodigo?: string) {
  return useQuery({
    queryKey: seleccionKeys.entidadesSS(tipoCodigo),
    queryFn: async () => {
      const params = tipoCodigo ? `?tipo_codigo=${tipoCodigo}` : '';
      const response = await api.get<EntidadSeguridadSocial[]>(
        `/api/talent-hub/seleccion/entidades-ss/${params}`
      );
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
      if (filters?.estado) params.append('estado', filters.estado);
      if (filters?.prioridad) params.append('prioridad', filters.prioridad);
      if (filters?.area) params.append('area', filters.area);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.page_size) params.append('page_size', String(filters.page_size));

      const response = await api.get<PaginatedResponse<VacanteActiva>>(
        `/api/talent-hub/seleccion/vacantes-activas/?${params}`
      );
      return response.data;
    },
    staleTime: 3 * 60 * 1000,
  });
}

export function useVacanteActiva(id: number) {
  return useQuery({
    queryKey: seleccionKeys.vacantesActivas.detail(id),
    queryFn: async () => {
      const response = await api.get<VacanteActivaDetail>(
        `/api/talent-hub/seleccion/vacantes-activas/${id}/`
      );
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
      const response = await api.get<PaginatedResponse<VacanteActiva>>(
        '/api/talent-hub/seleccion/vacantes-activas/abiertas/'
      );
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
      queryClient.invalidateQueries({ queryKey: seleccionKeys.estadisticas() });
      toast.success('Vacante creada exitosamente');
    },
    onError: (error: any) => {
      const msg =
        error.response?.data?.detail ||
        error.response?.data?.codigo_vacante?.[0] ||
        'Error al crear la vacante';
      toast.error(msg);
    },
  });
}

export function useUpdateVacanteActiva() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<VacanteActivaFormData> }) => {
      const response = await api.patch(`/api/talent-hub/seleccion/vacantes-activas/${id}/`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: seleccionKeys.vacantesActivas.all });
      queryClient.invalidateQueries({
        queryKey: seleccionKeys.vacantesActivas.detail(variables.id),
      });
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
    mutationFn: async ({ id, motivo_cierre }: { id: number; motivo_cierre?: string }) => {
      const response = await api.post(`/api/talent-hub/seleccion/vacantes-activas/${id}/cerrar/`, {
        motivo_cierre,
      });
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

export function usePublicarVacanteActiva() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, url_publicacion }: { id: number; url_publicacion?: string }) => {
      const response = await api.post(
        `/api/talent-hub/seleccion/vacantes-activas/${id}/publicar/`,
        { url_publicacion }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: seleccionKeys.vacantesActivas.all });
      queryClient.invalidateQueries({
        queryKey: seleccionKeys.vacantesActivas.detail(variables.id),
      });
      toast.success('Estado de publicacion actualizado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al publicar la vacante');
    },
  });
}

export function usePerfilamientoVacante(vacanteId: number | null) {
  return useQuery({
    queryKey: seleccionKeys.vacantesActivas.perfilamiento(vacanteId!),
    queryFn: async () => {
      const response = await api.get<PerfilamientoResponse>(
        `/api/talent-hub/seleccion/vacantes-activas/${vacanteId}/perfilamiento/`
      );
      return response.data;
    },
    enabled: !!vacanteId,
    staleTime: 2 * 60 * 1000,
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
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.page_size) params.append('page_size', String(filters.page_size));

      const response = await api.get<PaginatedResponse<Candidato>>(
        `/api/talent-hub/seleccion/candidatos/?${params}`
      );
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useCandidato(id: number) {
  return useQuery({
    queryKey: seleccionKeys.candidatos.detail(id),
    queryFn: async () => {
      const response = await api.get<CandidatoDetail>(
        `/api/talent-hub/seleccion/candidatos/${id}/`
      );
      return response.data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCandidatosPorVacante(vacanteId: number) {
  return useQuery({
    queryKey: seleccionKeys.candidatos.porVacante(vacanteId),
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Candidato>>(
        `/api/talent-hub/seleccion/candidatos/?vacante=${vacanteId}`
      );
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
      // Si hay archivos, usar FormData
      if (data.hoja_vida || data.carta_presentacion) {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (value instanceof File) {
              formData.append(key, value);
            } else {
              formData.append(key, String(value));
            }
          }
        });
        const response = await api.post('/api/talent-hub/seleccion/candidatos/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
      }
      const response = await api.post('/api/talent-hub/seleccion/candidatos/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seleccionKeys.candidatos.all });
      queryClient.invalidateQueries({ queryKey: seleccionKeys.vacantesActivas.all });
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
    mutationFn: async ({ id, data }: { id: number; data: Partial<CandidatoFormData> }) => {
      const response = await api.patch(`/api/talent-hub/seleccion/candidatos/${id}/`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: seleccionKeys.candidatos.all });
      queryClient.invalidateQueries({
        queryKey: seleccionKeys.candidatos.detail(variables.id),
      });
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
    mutationFn: async ({
      id,
      estado,
      motivo,
    }: {
      id: number;
      estado: EstadoCandidato;
      motivo?: string;
    }) => {
      const response = await api.post(
        `/api/talent-hub/seleccion/candidatos/${id}/cambiar-estado/`,
        { estado, motivo }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: seleccionKeys.candidatos.all });
      queryClient.invalidateQueries({
        queryKey: seleccionKeys.candidatos.detail(variables.id),
      });
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
    mutationFn: async ({
      id,
      fecha_contratacion,
      salario_ofrecido,
    }: {
      id: number;
      fecha_contratacion?: string;
      salario_ofrecido?: number;
    }) => {
      const response = await api.post(`/api/talent-hub/seleccion/candidatos/${id}/contratar/`, {
        fecha_contratacion,
        salario_ofrecido,
      });
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
      if (filters?.estado) params.append('estado', filters.estado);
      if (filters?.entrevistador) params.append('entrevistador', filters.entrevistador);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.page_size) params.append('page_size', String(filters.page_size));

      const response = await api.get<PaginatedResponse<Entrevista>>(
        `/api/talent-hub/seleccion/entrevistas/?${params}`
      );
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useEntrevistasPorCandidato(candidatoId: number) {
  return useQuery({
    queryKey: seleccionKeys.entrevistas.porCandidato(candidatoId),
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Entrevista>>(
        `/api/talent-hub/seleccion/entrevistas/por-candidato/${candidatoId}/`
      );
      return response.data;
    },
    enabled: !!candidatoId,
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
    mutationFn: async ({ id, data }: { id: number; data: Partial<EntrevistaFormData> }) => {
      const response = await api.patch(`/api/talent-hub/seleccion/entrevistas/${id}/`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: seleccionKeys.entrevistas.all });
      queryClient.invalidateQueries({
        queryKey: seleccionKeys.entrevistas.detail(variables.id),
      });
      toast.success('Entrevista actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al actualizar la entrevista');
    },
  });
}

export function useRealizarEntrevista() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: {
        duracion_real_minutos: number;
        asistio_candidato: boolean;
        calificacion_tecnica?: number;
        calificacion_competencias?: number;
        calificacion_general?: number;
        fortalezas_identificadas?: string;
        aspectos_mejorar?: string;
        observaciones?: string;
        recomendacion: string;
      };
    }) => {
      const response = await api.post(
        `/api/talent-hub/seleccion/entrevistas/${id}/realizar/`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: seleccionKeys.entrevistas.all });
      queryClient.invalidateQueries({
        queryKey: seleccionKeys.entrevistas.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: seleccionKeys.estadisticas() });
      toast.success('Entrevista registrada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al registrar la entrevista');
    },
  });
}

export function useCancelarEntrevista() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      estado,
      motivo,
      fecha_reprogramada,
    }: {
      id: number;
      estado: 'cancelada' | 'reprogramada';
      motivo: string;
      fecha_reprogramada?: string;
    }) => {
      const response = await api.post(`/api/talent-hub/seleccion/entrevistas/${id}/cancelar/`, {
        estado,
        motivo,
        fecha_reprogramada,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seleccionKeys.entrevistas.all });
      queryClient.invalidateQueries({ queryKey: seleccionKeys.estadisticas() });
      toast.success('Entrevista actualizada');
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
      if (filters?.tipo_prueba) params.append('tipo_prueba', filters.tipo_prueba);
      if (filters?.estado) params.append('estado', filters.estado);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.page_size) params.append('page_size', String(filters.page_size));

      const response = await api.get<PaginatedResponse<Prueba>>(
        `/api/talent-hub/seleccion/pruebas/?${params}`
      );
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function usePruebasPorCandidato(candidatoId: number) {
  return useQuery({
    queryKey: seleccionKeys.pruebas.porCandidato(candidatoId),
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Prueba>>(
        `/api/talent-hub/seleccion/pruebas/por-candidato/${candidatoId}/`
      );
      return response.data;
    },
    enabled: !!candidatoId,
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
    mutationFn: async ({
      id,
      calificacion,
      observaciones,
      recomendaciones,
      aprobado,
    }: {
      id: number;
      calificacion: number;
      observaciones?: string;
      recomendaciones?: string;
      aprobado?: boolean;
    }) => {
      const response = await api.post(`/api/talent-hub/seleccion/pruebas/${id}/calificar/`, {
        calificacion,
        observaciones,
        recomendaciones,
        aprobado,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: seleccionKeys.pruebas.all });
      queryClient.invalidateQueries({
        queryKey: seleccionKeys.pruebas.detail(variables.id),
      });
      toast.success('Prueba calificada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al calificar la prueba');
    },
  });
}

// ============================================================================
// HOOKS - AFILIACIONES SS
// ============================================================================

export function useAfiliaciones(filters?: AfiliacionSSFilters) {
  return useQuery({
    queryKey: seleccionKeys.afiliaciones.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.candidato) params.append('candidato', String(filters.candidato));
      if (filters?.estado) params.append('estado', filters.estado);
      if (filters?.tipo_entidad) params.append('tipo_entidad', filters.tipo_entidad);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.page_size) params.append('page_size', String(filters.page_size));

      const response = await api.get<PaginatedResponse<AfiliacionSS>>(
        `/api/talent-hub/seleccion/afiliaciones/?${params}`
      );
      return response.data;
    },
    staleTime: 3 * 60 * 1000,
  });
}

export function useAfiliacionesPorCandidato(candidatoId: number) {
  return useQuery({
    queryKey: seleccionKeys.afiliaciones.porCandidato(candidatoId),
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<AfiliacionSS>>(
        `/api/talent-hub/seleccion/afiliaciones/por-candidato/${candidatoId}/`
      );
      return response.data;
    },
    enabled: !!candidatoId,
    staleTime: 3 * 60 * 1000,
  });
}

export function useCreateAfiliacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AfiliacionSSFormData) => {
      const response = await api.post('/api/talent-hub/seleccion/afiliaciones/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seleccionKeys.afiliaciones.all });
      toast.success('Afiliacion registrada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al registrar la afiliacion');
    },
  });
}

export function useConfirmarAfiliacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      fecha_afiliacion,
      numero_afiliacion,
    }: {
      id: number;
      fecha_afiliacion?: string;
      numero_afiliacion?: string;
    }) => {
      const response = await api.post(`/api/talent-hub/seleccion/afiliaciones/${id}/confirmar/`, {
        fecha_afiliacion,
        numero_afiliacion,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seleccionKeys.afiliaciones.all });
      toast.success('Afiliacion confirmada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al confirmar la afiliacion');
    },
  });
}

export function useUpdateAfiliacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<AfiliacionSSFormData & { estado: string; motivo_rechazo?: string }>;
    }) => {
      const response = await api.patch(`/api/talent-hub/seleccion/afiliaciones/${id}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seleccionKeys.afiliaciones.all });
      toast.success('Afiliacion actualizada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al actualizar la afiliacion');
    },
  });
}

// ============================================================================
// HOOKS - HISTORIAL CONTRATOS
// ============================================================================

export function useHistorialContratos(filters?: HistorialContratoFilters) {
  return useQuery({
    queryKey: seleccionKeys.historialContratos.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.colaborador) params.append('colaborador', String(filters.colaborador));
      if (filters?.tipo_movimiento) params.append('tipo_movimiento', filters.tipo_movimiento);
      if (filters?.vigentes !== undefined) params.append('vigentes', String(filters.vigentes));
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.page_size) params.append('page_size', String(filters.page_size));

      const response = await api.get<PaginatedResponse<HistorialContrato>>(
        `/api/talent-hub/seleccion/historial-contratos/?${params}`
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useHistorialContratoDetail(id: number) {
  return useQuery({
    queryKey: seleccionKeys.historialContratos.detail(id),
    queryFn: async () => {
      const response = await api.get<HistorialContratoDetail>(
        `/api/talent-hub/seleccion/historial-contratos/${id}/`
      );
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useContratosPorVencer(dias = 30) {
  return useQuery({
    queryKey: seleccionKeys.historialContratos.porVencer(dias),
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<HistorialContrato>>(
        `/api/talent-hub/seleccion/historial-contratos/por-vencer/?dias=${dias}`
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateHistorialContrato() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: HistorialContratoFormData) => {
      if (data.archivo_contrato) {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (value instanceof File) {
              formData.append(key, value);
            } else {
              formData.append(key, String(value));
            }
          }
        });
        const response = await api.post(
          '/api/talent-hub/seleccion/historial-contratos/',
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return response.data;
      }
      const response = await api.post('/api/talent-hub/seleccion/historial-contratos/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seleccionKeys.historialContratos.all });
      toast.success('Contrato registrado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al registrar el contrato');
    },
  });
}

export function useFirmarContrato() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post(
        `/api/talent-hub/seleccion/historial-contratos/${id}/firmar/`
      );
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: seleccionKeys.historialContratos.all });
      queryClient.invalidateQueries({
        queryKey: seleccionKeys.historialContratos.detail(id),
      });
      toast.success('Contrato firmado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al firmar el contrato');
    },
  });
}

// ============================================================================
// HOOKS - ESTADISTICAS
// ============================================================================

export function useProcesoSeleccionEstadisticas() {
  return useQuery({
    queryKey: seleccionKeys.estadisticas(),
    queryFn: async () => {
      const response = await api.get<ProcesoSeleccionEstadisticas>(
        '/api/talent-hub/seleccion/estadisticas/'
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// HOOKS - PLANTILLAS PRUEBA DINÁMICA
// ============================================================================

export function usePlantillasPrueba() {
  return useQuery({
    queryKey: seleccionKeys.plantillasPrueba.list(),
    queryFn: async () => {
      const response = await api.get<PlantillaPruebaList[]>(
        '/api/talent-hub/seleccion/plantillas-prueba/'
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePlantillasPruebaActivas() {
  return useQuery({
    queryKey: seleccionKeys.plantillasPrueba.activas(),
    queryFn: async () => {
      const response = await api.get<PlantillaPruebaList[]>(
        '/api/talent-hub/seleccion/plantillas-prueba/activas/'
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePlantillaPrueba(id: number) {
  return useQuery({
    queryKey: seleccionKeys.plantillasPrueba.detail(id),
    queryFn: async () => {
      const response = await api.get<PlantillaPruebaDetail>(
        `/api/talent-hub/seleccion/plantillas-prueba/${id}/`
      );
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePlantillaPrueba() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PlantillaPruebaFormData) => {
      const response = await api.post('/api/talent-hub/seleccion/plantillas-prueba/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seleccionKeys.plantillasPrueba.all });
      toast.success('Plantilla de prueba creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al crear la plantilla');
    },
  });
}

export function useUpdatePlantillaPrueba() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<PlantillaPruebaFormData> }) => {
      const response = await api.patch(`/api/talent-hub/seleccion/plantillas-prueba/${id}/`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: seleccionKeys.plantillasPrueba.all });
      queryClient.invalidateQueries({
        queryKey: seleccionKeys.plantillasPrueba.detail(variables.id),
      });
      toast.success('Plantilla actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al actualizar la plantilla');
    },
  });
}

export function useDeletePlantillaPrueba() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/talent-hub/seleccion/plantillas-prueba/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seleccionKeys.plantillasPrueba.all });
      toast.success('Plantilla eliminada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al eliminar la plantilla');
    },
  });
}

export function useDuplicarPlantillaPrueba() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post(
        `/api/talent-hub/seleccion/plantillas-prueba/${id}/duplicar/`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seleccionKeys.plantillasPrueba.all });
      toast.success('Plantilla duplicada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al duplicar');
    },
  });
}

// ============================================================================
// HOOKS - ASIGNACIONES PRUEBA DINÁMICA
// ============================================================================

export function useAsignacionesPrueba(filters?: AsignacionPruebaFilters) {
  return useQuery({
    queryKey: seleccionKeys.asignacionesPrueba.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.candidato) params.append('candidato', String(filters.candidato));
      if (filters?.plantilla) params.append('plantilla', String(filters.plantilla));
      if (filters?.estado) params.append('estado', filters.estado);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.page_size) params.append('page_size', String(filters.page_size));

      const response = await api.get<PaginatedResponse<AsignacionPruebaList>>(
        `/api/talent-hub/seleccion/asignaciones-prueba/?${params}`
      );
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useAsignacionesPruebaPorCandidato(candidatoId: number) {
  return useQuery({
    queryKey: seleccionKeys.asignacionesPrueba.porCandidato(candidatoId),
    queryFn: async () => {
      const response = await api.get<AsignacionPruebaList[]>(
        `/api/talent-hub/seleccion/asignaciones-prueba/por_candidato/?candidato=${candidatoId}`
      );
      return response.data;
    },
    enabled: !!candidatoId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useAsignacionPruebaDetail(id: number | null) {
  return useQuery({
    queryKey: seleccionKeys.asignacionesPrueba.detail(id!),
    queryFn: async () => {
      const response = await api.get<AsignacionPruebaDetail>(
        `/api/talent-hub/seleccion/asignaciones-prueba/${id}/`
      );
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateAsignacionPrueba() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AsignacionPruebaFormData) => {
      const response = await api.post('/api/talent-hub/seleccion/asignaciones-prueba/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seleccionKeys.asignacionesPrueba.all });
      queryClient.invalidateQueries({ queryKey: seleccionKeys.plantillasPrueba.all });
      toast.success('Prueba asignada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al asignar la prueba');
    },
  });
}

export function useReenviarEmailPrueba() {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post(
        `/api/talent-hub/seleccion/asignaciones-prueba/${id}/reenviar_email/`
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success('Email reenviado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al reenviar el email');
    },
  });
}

// ============================================================================
// HOOKS - RESPONDER PRUEBA (PÚBLICO, SIN AUTH)
// ============================================================================

export function usePruebaPublica(token: string) {
  return useQuery({
    queryKey: ['prueba-publica', token],
    queryFn: async () => {
      const response = await api.get<PruebaPublicaData>(
        `/api/talent-hub/seleccion/responder-prueba/${token}/`
      );
      return response.data;
    },
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
  });
}

export function useResponderPrueba() {
  return useMutation({
    mutationFn: async ({
      token,
      respuestas,
    }: {
      token: string;
      respuestas: Record<string, unknown>;
    }) => {
      const response = await api.put(`/api/talent-hub/seleccion/responder-prueba/${token}/`, {
        respuestas,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Prueba enviada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al enviar la prueba');
    },
  });
}

// ============================================================================
// HOOKS - ENTREVISTAS ASINCRONICAS
// ============================================================================

export function useEntrevistasAsync(filters?: EntrevistaAsincronicaFilters) {
  return useQuery({
    queryKey: seleccionKeys.entrevistasAsync.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.candidato) params.append('candidato', filters.candidato);
      if (filters?.estado) params.append('estado', filters.estado);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.page_size) params.append('page_size', String(filters.page_size));

      const response = await api.get<PaginatedResponse<EntrevistaAsincronicaList>>(
        `/api/talent-hub/seleccion/entrevistas-async/?${params}`
      );
      return response.data;
    },
    staleTime: 30 * 1000,
  });
}

export function useEntrevistaAsyncDetail(id: number) {
  return useQuery({
    queryKey: seleccionKeys.entrevistasAsync.detail(id),
    queryFn: async () => {
      const response = await api.get<EntrevistaAsincronicaDetail>(
        `/api/talent-hub/seleccion/entrevistas-async/${id}/`
      );
      return response.data;
    },
    enabled: !!id,
  });
}

export function useEntrevistasAsyncPorCandidato(candidatoId: number) {
  return useQuery({
    queryKey: seleccionKeys.entrevistasAsync.porCandidato(candidatoId),
    queryFn: async () => {
      const response = await api.get<EntrevistaAsincronicaList[]>(
        `/api/talent-hub/seleccion/entrevistas-async/por-candidato/${candidatoId}/`
      );
      return response.data;
    },
    enabled: !!candidatoId,
  });
}

export function useCreateEntrevistaAsync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EntrevistaAsincronicaFormData) => {
      const response = await api.post('/api/talent-hub/seleccion/entrevistas-async/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seleccionKeys.entrevistasAsync.all });
      queryClient.invalidateQueries({ queryKey: seleccionKeys.estadisticas() });
      toast.success('Entrevista asincronica creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al crear la entrevista');
    },
  });
}

export function useEvaluarEntrevistaAsync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: {
        calificacion_general?: number;
        recomendacion?: string;
        fortalezas_identificadas?: string;
        aspectos_mejorar?: string;
        observaciones_evaluador?: string;
      };
    }) => {
      const response = await api.post(
        `/api/talent-hub/seleccion/entrevistas-async/${id}/evaluar/`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: seleccionKeys.entrevistasAsync.all });
      queryClient.invalidateQueries({
        queryKey: seleccionKeys.entrevistasAsync.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: seleccionKeys.estadisticas() });
      toast.success('Entrevista evaluada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al evaluar la entrevista');
    },
  });
}

export function useReenviarEmailEntrevistaAsync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post(
        `/api/talent-hub/seleccion/entrevistas-async/${id}/reenviar-email/`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seleccionKeys.entrevistasAsync.all });
      toast.success('Email reenviado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al reenviar el email');
    },
  });
}

export function useCancelarEntrevistaAsync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post(
        `/api/talent-hub/seleccion/entrevistas-async/${id}/cancelar/`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seleccionKeys.entrevistasAsync.all });
      queryClient.invalidateQueries({ queryKey: seleccionKeys.estadisticas() });
      toast.success('Entrevista cancelada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al cancelar la entrevista');
    },
  });
}

// ============================================================================
// HOOKS - ENTREVISTA ASINCRONICA PUBLICA (AllowAny)
// ============================================================================

export function useEntrevistaPublica(token: string) {
  return useQuery({
    queryKey: ['entrevista-publica', token],
    queryFn: async () => {
      const response = await api.get<EntrevistaAsincronicaPublicData>(
        `/api/talent-hub/seleccion/responder-entrevista/${token}/`
      );
      return response.data;
    },
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
  });
}

export function useResponderEntrevistaAsync() {
  return useMutation({
    mutationFn: async ({
      token,
      respuestas,
    }: {
      token: string;
      respuestas: Record<string, string>;
    }) => {
      const response = await api.put(`/api/talent-hub/seleccion/responder-entrevista/${token}/`, {
        respuestas,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Entrevista enviada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al enviar las respuestas');
    },
  });
}
