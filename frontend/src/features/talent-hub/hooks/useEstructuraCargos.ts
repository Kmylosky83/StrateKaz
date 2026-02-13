/**
 * React Query Hooks para Estructura de Cargos - Talent Hub
 * Sistema de Gestión StrateKaz
 *
 * Gestión de profesiogramas, competencias, requisitos especiales y vacantes.
 *
 * @module useEstructuraCargos
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';

// ============================================================================
// TIPOS
// ============================================================================

export interface Profesiograma {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  version: string;
  estado: 'BORRADOR' | 'EN_REVISION' | 'APROBADO' | 'VIGENTE' | 'OBSOLETO';
  cargo: {
    id: string;
    nombre: string;
  };
  area?: {
    id: string;
    nombre: string;
  };
  nivel_educativo_minimo: string;
  titulo_requerido: string;
  experiencia_minima: string;
  competencias_tecnicas_resumen: string[];
  competencias_blandas_resumen: string[];
  examenes_medicos_ingreso: string[];
  factores_riesgo: string[];
  epp_requeridos: string[];
  fecha_aprobacion?: string;
  fecha_vigencia_inicio?: string;
  fecha_vigencia_fin?: string;
  esta_vigente: boolean;
  total_competencias: number;
  total_requisitos_especiales: number;
  created_at: string;
  updated_at: string;
}

export interface MatrizCompetencia {
  id: string;
  profesiograma: string;
  tipo_competencia: 'TECNICA' | 'COMPORTAMENTAL' | 'IDIOMA' | 'SOFTWARE' | 'CERTIFICACION';
  nombre_competencia: string;
  descripcion: string;
  nivel_requerido: 'BASICO' | 'INTERMEDIO' | 'AVANZADO' | 'EXPERTO';
  criticidad: 'REQUERIDA' | 'DESEABLE' | 'OPCIONAL';
  peso_evaluacion: number;
  indicadores_nivel_basico?: string;
  indicadores_nivel_intermedio?: string;
  indicadores_nivel_avanzado?: string;
  indicadores_nivel_experto?: string;
  forma_desarrollo?: string;
  recursos_recomendados: string[];
  es_excluyente: boolean;
}

export interface RequisitoEspecial {
  id: string;
  profesiograma: string;
  tipo_requisito:
    | 'CERTIFICACION'
    | 'LICENCIA'
    | 'EXAMEN_MEDICO'
    | 'APTITUD_FISICA'
    | 'DISPONIBILIDAD'
    | 'SEGURIDAD'
    | 'TECNOLOGIA'
    | 'OTRO';
  nombre_requisito: string;
  descripcion: string;
  criticidad: 'OBLIGATORIO' | 'REQUERIDO' | 'DESEABLE' | 'OPCIONAL';
  es_renovable: boolean;
  vigencia_meses?: number;
  entidad_emisora?: string;
  requiere_documento_soporte: boolean;
  tipo_documento_soporte?: string;
  base_legal?: string;
  es_obligatorio_legal: boolean;
}

export interface Vacante {
  id: string;
  codigo: string;
  titulo_vacante: string;
  descripcion: string;
  cargo: {
    id: string;
    nombre: string;
  };
  profesiograma?: {
    id: string;
    codigo: string;
    nombre: string;
  };
  area?: {
    id: string;
    nombre: string;
  };
  motivo_vacante: string;
  cantidad_posiciones: number;
  posiciones_cubiertas: number;
  estado: string;
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  tipo_contrato: string;
  salario_minimo?: number;
  salario_maximo?: number;
  salario_a_convenir: boolean;
  beneficios_adicionales?: string;
  fecha_apertura: string;
  fecha_cierre_estimada?: string;
  fecha_cierre_real?: string;
  fecha_incorporacion_deseada?: string;
  publicar_externamente: boolean;
  canales_publicacion: string[];
  responsable_reclutamiento?: {
    id: string;
    nombre: string;
  };
  esta_abierta: boolean;
  posiciones_pendientes: number;
  dias_abierta: number;
  esta_vencida: boolean;
}

export interface ProfesiogramaFormData {
  cargo: string;
  area?: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  version?: string;
  estado?: string;
  nivel_educativo_minimo: string;
  titulo_requerido?: string;
  areas_conocimiento?: string[];
  formacion_complementaria?: string;
  experiencia_minima: string;
  experiencia_especifica?: string;
  experiencia_cargos_similares?: boolean;
  examenes_medicos_ingreso?: string[];
  examenes_medicos_periodicos?: string[];
  periodicidad_examenes?: string;
  restricciones_medicas?: string;
  factores_riesgo?: string[];
  epp_requeridos?: string[];
  requiere_licencia_conduccion?: boolean;
  categoria_licencia?: string;
  otras_certificaciones?: string[];
  jornada_laboral?: string;
  disponibilidad_viajar?: boolean;
  disponibilidad_turnos?: boolean;
  condiciones_especiales?: string;
  observaciones?: string;
}

export interface VacanteFormData {
  cargo: string;
  profesiograma?: string;
  area?: string;
  codigo: string;
  titulo_vacante: string;
  descripcion?: string;
  motivo_vacante: string;
  cantidad_posiciones: number;
  estado?: string;
  prioridad?: string;
  tipo_contrato: string;
  salario_minimo?: number;
  salario_maximo?: number;
  salario_a_convenir?: boolean;
  beneficios_adicionales?: string;
  fecha_apertura?: string;
  fecha_cierre_estimada?: string;
  fecha_incorporacion_deseada?: string;
  publicar_externamente?: boolean;
  canales_publicacion?: string[];
  responsable_reclutamiento?: string;
  observaciones?: string;
}

export interface ProfesiogramaFilters {
  cargo?: string;
  area?: string;
  estado?: string;
  vigente?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface VacanteFilters {
  cargo?: string;
  area?: string;
  estado?: string;
  prioridad?: string;
  abierta?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface VacanteEstadisticas {
  total_vacantes: number;
  vacantes_abiertas: number;
  vacantes_en_proceso: number;
  vacantes_cerradas_mes: number;
  posiciones_totales: number;
  posiciones_cubiertas: number;
  posiciones_pendientes: number;
  tiempo_promedio_cierre: number;
  vacantes_vencidas: number;
  vacantes_por_prioridad: {
    prioridad: string;
    cantidad: number;
  }[];
  vacantes_por_area: {
    area: string;
    cantidad: number;
  }[];
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const profesiogramaKeys = {
  all: ['profesiogramas'] as const,
  list: (filters?: ProfesiogramaFilters) => [...profesiogramaKeys.all, 'list', filters] as const,
  detail: (id: string) => [...profesiogramaKeys.all, 'detail', id] as const,
  competencias: (id: string) => [...profesiogramaKeys.all, id, 'competencias'] as const,
  requisitos: (id: string) => [...profesiogramaKeys.all, id, 'requisitos'] as const,
  vacantes: (id: string) => [...profesiogramaKeys.all, id, 'vacantes'] as const,
};

export const vacanteKeys = {
  all: ['vacantes'] as const,
  list: (filters?: VacanteFilters) => [...vacanteKeys.all, 'list', filters] as const,
  detail: (id: string) => [...vacanteKeys.all, 'detail', id] as const,
  abiertas: () => [...vacanteKeys.all, 'abiertas'] as const,
  estadisticas: () => [...vacanteKeys.all, 'estadisticas'] as const,
};

// ============================================================================
// HOOKS - PROFESIOGRAMAS
// ============================================================================

/**
 * Hook para obtener lista de profesiogramas con filtros
 *
 * @param filters Filtros opcionales de búsqueda
 * @returns Query con la lista paginada de profesiogramas
 *
 * @example
 * ```tsx
 * const { data: profesiogramas, isLoading } = useProfesiogramas({
 *   cargo: 'cargo-id',
 *   vigente: true
 * });
 * ```
 */
export function useProfesiogramas(filters?: ProfesiogramaFilters) {
  return useQuery({
    queryKey: profesiogramaKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.cargo) params.append('cargo', filters.cargo);
      if (filters?.area) params.append('area', filters.area);
      if (filters?.estado) params.append('estado', filters.estado);
      if (filters?.vigente !== undefined) params.append('vigente', String(filters.vigente));
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.page_size) params.append('page_size', String(filters.page_size));

      const response = await api.get(`/talent-hub/estructura-cargos/profesiogramas/?${params}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener un profesiograma específico
 *
 * @param id ID del profesiograma
 * @returns Query con los datos del profesiograma
 *
 * @example
 * ```tsx
 * const { data: profesiograma, isLoading } = useProfesiograma('prof-id');
 * ```
 */
export function useProfesiograma(id: string) {
  return useQuery({
    queryKey: profesiogramaKeys.detail(id),
    queryFn: async () => {
      const response = await api.get(`/talent-hub/estructura-cargos/profesiogramas/${id}/`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para crear un nuevo profesiograma
 *
 * @returns Mutation para crear profesiograma
 *
 * @example
 * ```tsx
 * const createProfesiograma = useCreateProfesiograma();
 *
 * createProfesiograma.mutate(formData, {
 *   onSuccess: () => navigate('/profesiogramas')
 * });
 * ```
 */
export function useCreateProfesiograma() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProfesiogramaFormData) => {
      const response = await api.post('/talent-hub/estructura-cargos/profesiogramas/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profesiogramaKeys.all });
      toast.success('Profesiograma creado exitosamente');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.codigo?.[0] ||
        'Error al crear el profesiograma';
      toast.error(message);
    },
  });
}

/**
 * Hook para actualizar un profesiograma existente
 *
 * @returns Mutation para actualizar profesiograma
 *
 * @example
 * ```tsx
 * const updateProfesiograma = useUpdateProfesiograma();
 *
 * updateProfesiograma.mutate({ id: 'prof-id', data: formData });
 * ```
 */
export function useUpdateProfesiograma() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProfesiogramaFormData> }) => {
      const response = await api.patch(`/talent-hub/estructura-cargos/profesiogramas/${id}/`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: profesiogramaKeys.all });
      queryClient.invalidateQueries({ queryKey: profesiogramaKeys.detail(variables.id) });
      toast.success('Profesiograma actualizado exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al actualizar el profesiograma';
      toast.error(message);
    },
  });
}

// ============================================================================
// HOOKS - COMPETENCIAS
// ============================================================================

/**
 * Hook para obtener competencias de un profesiograma
 *
 * @param profesiogramaId ID del profesiograma
 * @returns Query con las competencias del profesiograma
 */
export function useCompetencias(profesiogramaId: string) {
  return useQuery({
    queryKey: profesiogramaKeys.competencias(profesiogramaId),
    queryFn: async () => {
      const response = await api.get(
        `/talent-hub/estructura-cargos/profesiogramas/${profesiogramaId}/competencias/`
      );
      return response.data;
    },
    enabled: !!profesiogramaId,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// HOOKS - REQUISITOS ESPECIALES
// ============================================================================

/**
 * Hook para obtener requisitos especiales de un profesiograma
 *
 * @param profesiogramaId ID del profesiograma
 * @returns Query con los requisitos especiales
 */
export function useRequisitos(profesiogramaId: string) {
  return useQuery({
    queryKey: profesiogramaKeys.requisitos(profesiogramaId),
    queryFn: async () => {
      const response = await api.get(
        `/talent-hub/estructura-cargos/profesiogramas/${profesiogramaId}/requisitos-especiales/`
      );
      return response.data;
    },
    enabled: !!profesiogramaId,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// HOOKS - VACANTES
// ============================================================================

/**
 * Hook para obtener lista de vacantes con filtros
 *
 * @param filters Filtros opcionales de búsqueda
 * @returns Query con la lista paginada de vacantes
 *
 * @example
 * ```tsx
 * const { data: vacantes, isLoading } = useVacantes({
 *   abierta: true,
 *   prioridad: 'ALTA'
 * });
 * ```
 */
export function useVacantes(filters?: VacanteFilters) {
  return useQuery({
    queryKey: vacanteKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.cargo) params.append('cargo', filters.cargo);
      if (filters?.area) params.append('area', filters.area);
      if (filters?.estado) params.append('estado', filters.estado);
      if (filters?.prioridad) params.append('prioridad', filters.prioridad);
      if (filters?.abierta !== undefined) params.append('abierta', String(filters.abierta));
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.page_size) params.append('page_size', String(filters.page_size));

      const response = await api.get(`/talent-hub/estructura-cargos/vacantes/?${params}`);
      return response.data;
    },
    staleTime: 3 * 60 * 1000, // 3 minutos (datos más dinámicos)
  });
}

/**
 * Hook para obtener solo vacantes abiertas
 *
 * @returns Query con las vacantes en estado abierto
 *
 * @example
 * ```tsx
 * const { data: vacantesAbiertas } = useVacantesAbiertas();
 * ```
 */
export function useVacantesAbiertas() {
  return useQuery({
    queryKey: vacanteKeys.abiertas(),
    queryFn: async () => {
      const response = await api.get('/talent-hub/estructura-cargos/vacantes/?abierta=true');
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para obtener estadísticas de vacantes
 *
 * @returns Query con estadísticas agregadas de vacantes
 *
 * @example
 * ```tsx
 * const { data: stats } = useVacanteEstadisticas();
 *
 * // stats.vacantes_abiertas, stats.posiciones_pendientes
 * ```
 */
export function useVacanteEstadisticas() {
  return useQuery({
    queryKey: vacanteKeys.estadisticas(),
    queryFn: async () => {
      const response = await api.get<VacanteEstadisticas>(
        '/talent-hub/estructura-cargos/vacantes/estadisticas/'
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para crear una nueva vacante
 *
 * @returns Mutation para crear vacante
 *
 * @example
 * ```tsx
 * const createVacante = useCreateVacante();
 *
 * createVacante.mutate(formData);
 * ```
 */
export function useCreateVacante() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: VacanteFormData) => {
      const response = await api.post('/talent-hub/estructura-cargos/vacantes/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vacanteKeys.all });
      toast.success('Vacante creada exitosamente');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.codigo?.[0] ||
        'Error al crear la vacante';
      toast.error(message);
    },
  });
}

/**
 * Hook para actualizar una vacante existente
 *
 * @returns Mutation para actualizar vacante
 */
export function useUpdateVacante() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<VacanteFormData> }) => {
      const response = await api.patch(`/talent-hub/estructura-cargos/vacantes/${id}/`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vacanteKeys.all });
      queryClient.invalidateQueries({ queryKey: vacanteKeys.detail(variables.id) });
      toast.success('Vacante actualizada exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al actualizar la vacante';
      toast.error(message);
    },
  });
}

/**
 * Hook para cerrar una vacante
 *
 * @returns Mutation para cerrar vacante
 */
export function useCerrarVacante() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo?: string }) => {
      const response = await api.post(`/talent-hub/estructura-cargos/vacantes/${id}/cerrar/`, {
        motivo_cierre: motivo,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vacanteKeys.all });
      queryClient.invalidateQueries({ queryKey: vacanteKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: vacanteKeys.estadisticas() });
      toast.success('Vacante cerrada exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al cerrar la vacante';
      toast.error(message);
    },
  });
}
