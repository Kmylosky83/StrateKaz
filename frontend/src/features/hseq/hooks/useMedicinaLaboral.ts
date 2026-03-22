/**
 * Hooks React Query para Medicina Laboral - HSEQ Management
 *
 * Sistema de gestión de medicina laboral y vigilancia epidemiológica ocupacional
 * Incluye exámenes médicos, restricciones, programas de vigilancia y estadísticas
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

// ==================== TYPES ====================

export interface TipoExamen {
  id: number;
  codigo: string;
  nombre: string;
  tipo: 'INGRESO' | 'PERIODICO' | 'EGRESO' | 'POST_INCAPACIDAD' | 'RETIRO' | 'CAMBIO_OCUPACION';
  descripcion?: string;
  periodicidad: 'UNICO' | 'ANUAL' | 'BIENAL' | 'TRIENAL' | 'PERSONALIZADO';
  meses_periodicidad?: number;
  incluye_clinico: boolean;
  incluye_laboratorio: boolean;
  incluye_paraclinicos: boolean;
  incluye_audiometria: boolean;
  incluye_visiometria: boolean;
  incluye_espirometria: boolean;
  enfasis_osteomuscular: boolean;
  enfasis_cardiovascular: boolean;
  enfasis_respiratorio: boolean;
  enfasis_neurologico: boolean;
  observaciones?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExamenMedico {
  id: number;
  empresa_id: number;
  numero_examen: string;
  tipo_examen: number;
  tipo_examen_nombre?: string;
  colaborador_id: number;
  cargo_id?: number;
  fecha_programada: string;
  fecha_realizado?: string;
  entidad_prestadora?: string;
  medico_evaluador?: string;
  licencia_medica?: string;
  concepto_aptitud:
    | 'APTO'
    | 'APTO_CON_RESTRICCIONES'
    | 'NO_APTO_TEMPORAL'
    | 'NO_APTO_PERMANENTE'
    | 'PENDIENTE';
  concepto_aptitud_display?: string;
  hallazgos_relevantes?: string;
  recomendaciones?: string;
  diagnosticos: Array<{ codigo: string; nombre: string }>;
  requiere_restricciones: boolean;
  restricciones_temporales?: string;
  restricciones_permanentes?: string;
  requiere_seguimiento: boolean;
  tipo_seguimiento?: string;
  fecha_proximo_control?: string;
  archivo_resultado?: string;
  estado: 'PROGRAMADO' | 'EN_PROCESO' | 'COMPLETADO' | 'CANCELADO' | 'VENCIDO';
  estado_display?: string;
  costo_examen?: number;
  observaciones?: string;
  created_by_id?: number;
  created_at: string;
  updated_at: string;
}

export interface RestriccionMedica {
  id: number;
  empresa_id: number;
  codigo_restriccion: string;
  examen_medico?: number;
  examen_medico_numero?: string;
  colaborador_id: number;
  cargo_id?: number;
  tipo_restriccion: 'TEMPORAL' | 'PERMANENTE' | 'CONDICIONAL';
  tipo_restriccion_display?: string;
  categoria:
    | 'CARGA'
    | 'POSTURA'
    | 'MOVIMIENTO'
    | 'ALTURA'
    | 'ESPACIOS_CONFINADOS'
    | 'QUIMICOS'
    | 'RUIDO'
    | 'TEMPERATURA'
    | 'JORNADA'
    | 'OTRAS';
  categoria_display?: string;
  descripcion: string;
  actividades_restringidas: string;
  fecha_inicio: string;
  fecha_fin?: string;
  medico_ordena: string;
  licencia_medica?: string;
  requiere_evaluacion_periodica: boolean;
  frecuencia_evaluacion_meses?: number;
  proxima_evaluacion?: string;
  ajuste_realizado: boolean;
  descripcion_ajuste?: string;
  estado: 'ACTIVA' | 'VENCIDA' | 'LEVANTADA' | 'CANCELADA';
  estado_display?: string;
  fecha_levantamiento?: string;
  motivo_levantamiento?: string;
  archivo_soporte?: string;
  observaciones?: string;
  esta_vigente: boolean;
  created_by_id?: number;
  created_at: string;
  updated_at: string;
}

export interface ProgramaVigilancia {
  id: number;
  empresa_id: number;
  codigo: string;
  nombre: string;
  tipo:
    | 'OSTEOMUSCULAR'
    | 'CARDIOVASCULAR'
    | 'AUDITIVO'
    | 'RESPIRATORIO'
    | 'VISUAL'
    | 'PSICOSOCIAL'
    | 'DERMATOLOGICO'
    | 'BIOLOGICO'
    | 'QUIMICO'
    | 'OTRO';
  tipo_display?: string;
  descripcion?: string;
  objetivo: string;
  alcance?: string;
  cargos_aplicables: number[];
  areas_aplicables: number[];
  actividades_vigilancia: unknown[];
  frecuencia_evaluacion_meses: number;
  indicadores: unknown[];
  fecha_inicio: string;
  fecha_revision?: string;
  proxima_revision?: string;
  responsable_id?: number;
  estado: 'ACTIVO' | 'INACTIVO' | 'EN_REVISION';
  estado_display?: string;
  archivo_programa?: string;
  observaciones?: string;
  casos_activos_count: number;
  created_by_id?: number;
  created_at: string;
  updated_at: string;
}

export interface CasoVigilancia {
  id: number;
  empresa_id: number;
  numero_caso: string;
  programa: number;
  programa_nombre?: string;
  programa_tipo?: string;
  colaborador_id: number;
  cargo_id?: number;
  fecha_apertura: string;
  descripcion_caso: string;
  severidad: 'LEVE' | 'MODERADA' | 'SEVERA' | 'CRITICA';
  severidad_display?: string;
  diagnosticos_cie10: Array<{ codigo: string; nombre: string }>;
  factores_riesgo_identificados?: string;
  exposicion_laboral?: string;
  plan_intervencion?: string;
  acciones_implementadas: unknown[];
  seguimientos: Array<{ fecha: string; descripcion: string; responsable_id: number }>;
  fecha_ultimo_seguimiento?: string;
  fecha_proximo_seguimiento?: string;
  fecha_cierre?: string;
  motivo_cierre?: string;
  resultado_final?: string;
  estado: 'ACTIVO' | 'EN_SEGUIMIENTO' | 'CONTROLADO' | 'CERRADO' | 'CANCELADO';
  estado_display?: string;
  archivo_adjunto?: string;
  observaciones?: string;
  created_by_id?: number;
  created_at: string;
  updated_at: string;
}

export interface DiagnosticoOcupacional {
  id: number;
  codigo_cie10: string;
  nombre: string;
  descripcion?: string;
  categoria: string;
  origen: 'OCUPACIONAL' | 'COMUN' | 'AMBOS';
  origen_display?: string;
  riesgos_relacionados?: string;
  requiere_vigilancia: boolean;
  programa_vigilancia_sugerido?: string;
  requiere_reporte_arl: boolean;
  requiere_reporte_secretaria: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EstadisticaMedica {
  id: number;
  empresa_id: number;
  anio: number;
  mes: number;
  total_colaboradores: number;
  examenes_realizados: number;
  examenes_ingreso: number;
  examenes_periodicos: number;
  examenes_egreso: number;
  aptos: number;
  aptos_con_restricciones: number;
  no_aptos_temporal: number;
  no_aptos_permanente: number;
  restricciones_activas: number;
  restricciones_nuevas: number;
  restricciones_levantadas: number;
  casos_vigilancia_activos: number;
  casos_nuevos: number;
  casos_cerrados: number;
  diagnosticos_ocupacionales: number;
  diagnosticos_comunes: number;
  top_diagnosticos: Array<{ codigo: string; nombre: string; cantidad: number }>;
  porcentaje_aptitud: number;
  porcentaje_cobertura_examenes: number;
  costo_total_examenes: number;
  observaciones?: string;
  created_by_id?: number;
  created_at: string;
  updated_at: string;
}

// DTOs
export interface CreateTipoExamenDTO {
  codigo: string;
  nombre: string;
  tipo: string;
  descripcion?: string;
  periodicidad?: string;
  meses_periodicidad?: number;
  incluye_clinico?: boolean;
  incluye_laboratorio?: boolean;
  incluye_paraclinicos?: boolean;
  incluye_audiometria?: boolean;
  incluye_visiometria?: boolean;
  incluye_espirometria?: boolean;
  enfasis_osteomuscular?: boolean;
  enfasis_cardiovascular?: boolean;
  enfasis_respiratorio?: boolean;
  enfasis_neurologico?: boolean;
  observaciones?: string;
}

export type UpdateTipoExamenDTO = Partial<CreateTipoExamenDTO>;

export interface CreateExamenMedicoDTO {
  empresa_id: number;
  tipo_examen: number;
  colaborador_id: number;
  cargo_id?: number;
  fecha_programada: string;
  fecha_realizado?: string;
  entidad_prestadora?: string;
  medico_evaluador?: string;
  licencia_medica?: string;
  concepto_aptitud?: string;
  hallazgos_relevantes?: string;
  recomendaciones?: string;
  diagnosticos?: Array<{ codigo: string; nombre: string }>;
  requiere_restricciones?: boolean;
  restricciones_temporales?: string;
  restricciones_permanentes?: string;
  requiere_seguimiento?: boolean;
  tipo_seguimiento?: string;
  fecha_proximo_control?: string;
  costo_examen?: number;
  observaciones?: string;
}

export type UpdateExamenMedicoDTO = Partial<CreateExamenMedicoDTO>;

export interface CreateRestriccionMedicaDTO {
  empresa_id: number;
  examen_medico?: number;
  colaborador_id: number;
  cargo_id?: number;
  tipo_restriccion: string;
  categoria: string;
  descripcion: string;
  actividades_restringidas: string;
  fecha_inicio: string;
  fecha_fin?: string;
  medico_ordena: string;
  licencia_medica?: string;
  requiere_evaluacion_periodica?: boolean;
  frecuencia_evaluacion_meses?: number;
  proxima_evaluacion?: string;
  observaciones?: string;
}

export type UpdateRestriccionMedicaDTO = Partial<CreateRestriccionMedicaDTO>;

export interface CreateProgramaVigilanciaDTO {
  empresa_id: number;
  codigo: string;
  nombre: string;
  tipo: string;
  descripcion?: string;
  objetivo: string;
  alcance?: string;
  cargos_aplicables?: number[];
  areas_aplicables?: number[];
  actividades_vigilancia?: unknown[];
  frecuencia_evaluacion_meses?: number;
  indicadores?: unknown[];
  fecha_inicio: string;
  responsable_id?: number;
  observaciones?: string;
}

export type UpdateProgramaVigilanciaDTO = Partial<CreateProgramaVigilanciaDTO>;

export interface CreateCasoVigilanciaDTO {
  empresa_id: number;
  programa: number;
  colaborador_id: number;
  cargo_id?: number;
  fecha_apertura: string;
  descripcion_caso: string;
  severidad: string;
  diagnosticos_cie10?: Array<{ codigo: string; nombre: string }>;
  factores_riesgo_identificados?: string;
  exposicion_laboral?: string;
  plan_intervencion?: string;
  observaciones?: string;
}

export type UpdateCasoVigilanciaDTO = Partial<CreateCasoVigilanciaDTO>;

export interface RegistrarSeguimientoDTO {
  descripcion: string;
  responsable_id: number;
}

export interface CerrarCasoDTO {
  motivo: string;
  resultado: string;
}

export interface LevantarRestriccionDTO {
  motivo: string;
}

export interface CreateDiagnosticoOcupacionalDTO {
  codigo_cie10: string;
  nombre: string;
  descripcion?: string;
  categoria: string;
  origen?: string;
  riesgos_relacionados?: string;
  requiere_vigilancia?: boolean;
  programa_vigilancia_sugerido?: string;
  requiere_reporte_arl?: boolean;
  requiere_reporte_secretaria?: boolean;
}

export type UpdateDiagnosticoOcupacionalDTO = Partial<CreateDiagnosticoOcupacionalDTO>;

// ==================== QUERY KEYS ====================

export const medicinaLaboralKeys = {
  all: ['hseq', 'medicina-laboral'] as const,

  // Tipos de Examen
  tiposExamen: () => [...medicinaLaboralKeys.all, 'tipos-examen'] as const,
  tipoExamen: (id: number) => [...medicinaLaboralKeys.tiposExamen(), id] as const,

  // Exámenes Médicos
  examenes: () => [...medicinaLaboralKeys.all, 'examenes'] as const,
  examen: (id: number) => [...medicinaLaboralKeys.examenes(), id] as const,
  examenesByColaborador: (colaboradorId: number) =>
    [...medicinaLaboralKeys.examenes(), 'colaborador', colaboradorId] as const,
  examenesVencidos: (dias?: number) =>
    [...medicinaLaboralKeys.examenes(), 'vencidos', dias] as const,
  estadisticasExamenes: () => [...medicinaLaboralKeys.examenes(), 'estadisticas'] as const,

  // Restricciones Médicas
  restricciones: () => [...medicinaLaboralKeys.all, 'restricciones'] as const,
  restriccion: (id: number) => [...medicinaLaboralKeys.restricciones(), id] as const,
  restriccionesByColaborador: (colaboradorId: number) =>
    [...medicinaLaboralKeys.restricciones(), 'colaborador', colaboradorId] as const,
  restriccionesActivas: () => [...medicinaLaboralKeys.restricciones(), 'activas'] as const,

  // Programas de Vigilancia
  programas: () => [...medicinaLaboralKeys.all, 'programas'] as const,
  programa: (id: number) => [...medicinaLaboralKeys.programas(), id] as const,
  programasActivos: () => [...medicinaLaboralKeys.programas(), 'activos'] as const,
  casosByPrograma: (programaId: number) =>
    [...medicinaLaboralKeys.programas(), programaId, 'casos'] as const,

  // Casos en Vigilancia
  casos: () => [...medicinaLaboralKeys.all, 'casos'] as const,
  caso: (id: number) => [...medicinaLaboralKeys.casos(), id] as const,
  casosByColaborador: (colaboradorId: number) =>
    [...medicinaLaboralKeys.casos(), 'colaborador', colaboradorId] as const,
  casosActivos: () => [...medicinaLaboralKeys.casos(), 'activos'] as const,

  // Diagnósticos Ocupacionales
  diagnosticos: () => [...medicinaLaboralKeys.all, 'diagnosticos'] as const,
  diagnostico: (id: number) => [...medicinaLaboralKeys.diagnosticos(), id] as const,
  diagnosticosBusqueda: (query: string) =>
    [...medicinaLaboralKeys.diagnosticos(), 'buscar', query] as const,

  // Estadísticas
  estadisticas: () => [...medicinaLaboralKeys.all, 'estadisticas'] as const,
  estadistica: (anio: number, mes: number) =>
    [...medicinaLaboralKeys.estadisticas(), anio, mes] as const,
  dashboard: (anio: number) => [...medicinaLaboralKeys.all, 'dashboard', anio] as const,
};

// ==================== TIPOS DE EXAMEN HOOKS ====================

export function useTiposExamen(params?: {
  tipo?: string;
  periodicidad?: string;
  is_active?: boolean;
}) {
  return useQuery({
    queryKey: [...medicinaLaboralKeys.tiposExamen(), params],
    queryFn: async () => {
      const { data } = await apiClient.get<TipoExamen[]>(
        '/api/hseq/medicina-laboral/tipos-examen/',
        { params }
      );
      return data;
    },
  });
}

export function useTipoExamen(id: number) {
  return useQuery({
    queryKey: medicinaLaboralKeys.tipoExamen(id),
    queryFn: async () => {
      const { data } = await apiClient.get<TipoExamen>(
        `/api/hseq/medicina-laboral/tipos-examen/${id}/`
      );
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateTipoExamen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (datos: CreateTipoExamenDTO) => {
      const { data } = await apiClient.post<TipoExamen>(
        '/api/hseq/medicina-laboral/tipos-examen/',
        datos
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.tiposExamen() });
      toast.success('Tipo de examen creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear tipo de examen');
    },
  });
}

export function useUpdateTipoExamen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateTipoExamenDTO }) => {
      const { data } = await apiClient.patch<TipoExamen>(
        `/api/hseq/medicina-laboral/tipos-examen/${id}/`,
        datos
      );
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.tiposExamen() });
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.tipoExamen(id) });
      toast.success('Tipo de examen actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar tipo de examen');
    },
  });
}

export function useDeleteTipoExamen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/hseq/medicina-laboral/tipos-examen/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.tiposExamen() });
      toast.success('Tipo de examen eliminado exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar tipo de examen');
    },
  });
}

// ==================== EXÁMENES MÉDICOS HOOKS ====================

export function useExamenesMedicos(params?: {
  empresa_id?: number;
  colaborador_id?: number;
  tipo_examen?: number;
  estado?: string;
  concepto_aptitud?: string;
}) {
  return useQuery({
    queryKey: [...medicinaLaboralKeys.examenes(), params],
    queryFn: async () => {
      const { data } = await apiClient.get<ExamenMedico[]>('/api/hseq/medicina-laboral/examenes/', {
        params,
      });
      return data;
    },
  });
}

export function useExamenMedico(id: number) {
  return useQuery({
    queryKey: medicinaLaboralKeys.examen(id),
    queryFn: async () => {
      const { data } = await apiClient.get<ExamenMedico>(
        `/api/hseq/medicina-laboral/examenes/${id}/`
      );
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateExamenMedico() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (datos: CreateExamenMedicoDTO) => {
      const { data } = await apiClient.post<ExamenMedico>(
        '/api/hseq/medicina-laboral/examenes/',
        datos
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.examenes() });
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.estadisticasExamenes() });
      toast.success('Examen médico programado exitosamente');
    },
    onError: () => {
      toast.error('Error al programar examen médico');
    },
  });
}

export function useUpdateExamenMedico() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateExamenMedicoDTO }) => {
      const { data } = await apiClient.patch<ExamenMedico>(
        `/api/hseq/medicina-laboral/examenes/${id}/`,
        datos
      );
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.examenes() });
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.examen(id) });
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.estadisticasExamenes() });
      toast.success('Examen médico actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar examen médico');
    },
  });
}

export function useDeleteExamenMedico() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/hseq/medicina-laboral/examenes/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.examenes() });
      toast.success('Examen médico eliminado exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar examen médico');
    },
  });
}

export function useProgramarExamen() {
  return useCreateExamenMedico();
}

export function useCompletarExamen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateExamenMedicoDTO }) => {
      const { data } = await apiClient.patch<ExamenMedico>(
        `/api/hseq/medicina-laboral/examenes/${id}/`,
        {
          ...datos,
          estado: 'COMPLETADO',
        }
      );
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.examenes() });
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.examen(id) });
      toast.success('Examen médico completado exitosamente');
    },
    onError: () => {
      toast.error('Error al completar examen médico');
    },
  });
}

export function useCancelarExamen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: number; motivo?: string }) => {
      const { data } = await apiClient.patch<ExamenMedico>(
        `/api/hseq/medicina-laboral/examenes/${id}/`,
        {
          estado: 'CANCELADO',
          observaciones: motivo,
        }
      );
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.examenes() });
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.examen(id) });
      toast.success('Examen médico cancelado');
    },
    onError: () => {
      toast.error('Error al cancelar examen médico');
    },
  });
}

export function useExamenesColaborador(colaboradorId: number) {
  return useQuery({
    queryKey: medicinaLaboralKeys.examenesByColaborador(colaboradorId),
    queryFn: async () => {
      const { data } = await apiClient.get<{
        colaborador_id: number;
        total_examenes: number;
        examenes: ExamenMedico[];
      }>('/api/hseq/medicina-laboral/examenes/por_colaborador/', {
        params: { colaborador_id: colaboradorId },
      });
      return data;
    },
    enabled: !!colaboradorId,
  });
}

export function useExamenesVencidos(dias: number = 30) {
  return useQuery({
    queryKey: medicinaLaboralKeys.examenesVencidos(dias),
    queryFn: async () => {
      const { data } = await apiClient.get<{
        dias_anticipacion: number;
        fecha_limite: string;
        total: number;
        examenes: ExamenMedico[];
      }>('/api/hseq/medicina-laboral/examenes/vencidos/', {
        params: { dias },
      });
      return data;
    },
  });
}

export function useExamenesProximos(dias: number = 30) {
  return useExamenesVencidos(dias);
}

export function useEstadisticasExamenes(params?: { empresa_id?: number; anio?: number }) {
  return useQuery({
    queryKey: [...medicinaLaboralKeys.estadisticasExamenes(), params],
    queryFn: async () => {
      const { data } = await apiClient.get<{
        total_examenes: number;
        por_estado: Array<{ estado: string; count: number }>;
        por_concepto: Array<{ concepto_aptitud: string; count: number }>;
      }>('/api/hseq/medicina-laboral/examenes/estadisticas/', { params });
      return data;
    },
  });
}

// ==================== RESTRICCIONES MÉDICAS HOOKS ====================

export function useRestricciones(params?: {
  empresa_id?: number;
  colaborador_id?: number;
  tipo_restriccion?: string;
  categoria?: string;
  estado?: string;
}) {
  return useQuery({
    queryKey: [...medicinaLaboralKeys.restricciones(), params],
    queryFn: async () => {
      const { data } = await apiClient.get<RestriccionMedica[]>(
        '/api/hseq/medicina-laboral/restricciones/',
        { params }
      );
      return data;
    },
  });
}

export function useRestriccion(id: number) {
  return useQuery({
    queryKey: medicinaLaboralKeys.restriccion(id),
    queryFn: async () => {
      const { data } = await apiClient.get<RestriccionMedica>(
        `/api/hseq/medicina-laboral/restricciones/${id}/`
      );
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateRestriccion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (datos: CreateRestriccionMedicaDTO) => {
      const { data } = await apiClient.post<RestriccionMedica>(
        '/api/hseq/medicina-laboral/restricciones/',
        datos
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.restricciones() });
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.restriccionesActivas() });
      toast.success('Restricción médica creada exitosamente');
    },
    onError: () => {
      toast.error('Error al crear restricción médica');
    },
  });
}

export function useUpdateRestriccion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateRestriccionMedicaDTO }) => {
      const { data } = await apiClient.patch<RestriccionMedica>(
        `/api/hseq/medicina-laboral/restricciones/${id}/`,
        datos
      );
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.restricciones() });
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.restriccion(id) });
      toast.success('Restricción médica actualizada exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar restricción médica');
    },
  });
}

export function useDeleteRestriccion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/hseq/medicina-laboral/restricciones/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.restricciones() });
      toast.success('Restricción médica eliminada exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar restricción médica');
    },
  });
}

export function useLevantarRestriccion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: number; motivo: string }) => {
      const { data } = await apiClient.post<RestriccionMedica>(
        `/api/hseq/medicina-laboral/restricciones/${id}/levantar/`,
        { motivo }
      );
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.restricciones() });
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.restriccion(id) });
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.restriccionesActivas() });
      toast.success('Restricción médica levantada exitosamente');
    },
    onError: () => {
      toast.error('Error al levantar restricción médica');
    },
  });
}

export function useRenovarRestriccion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateRestriccionMedicaDTO }) => {
      const { data } = await apiClient.patch<RestriccionMedica>(
        `/api/hseq/medicina-laboral/restricciones/${id}/`,
        datos
      );
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.restricciones() });
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.restriccion(id) });
      toast.success('Restricción médica renovada exitosamente');
    },
    onError: () => {
      toast.error('Error al renovar restricción médica');
    },
  });
}

export function useRestriccionesColaborador(colaboradorId: number, soloActivas: boolean = false) {
  return useQuery({
    queryKey: medicinaLaboralKeys.restriccionesByColaborador(colaboradorId),
    queryFn: async () => {
      const { data } = await apiClient.get<{
        colaborador_id: number;
        solo_activas: boolean;
        total_restricciones: number;
        restricciones: RestriccionMedica[];
      }>('/api/hseq/medicina-laboral/restricciones/por_colaborador/', {
        params: { colaborador_id: colaboradorId, solo_activas: soloActivas },
      });
      return data;
    },
    enabled: !!colaboradorId,
  });
}

export function useRestriccionesActivas() {
  return useQuery({
    queryKey: medicinaLaboralKeys.restriccionesActivas(),
    queryFn: async () => {
      const { data } = await apiClient.get<{
        total: number;
        restricciones: RestriccionMedica[];
      }>('/api/hseq/medicina-laboral/restricciones/activas/');
      return data;
    },
  });
}

export function useRestriccionesPorVencer(dias: number = 30) {
  return useQuery({
    queryKey: [...medicinaLaboralKeys.restriccionesActivas(), 'por-vencer', dias],
    queryFn: async () => {
      const { data } = await apiClient.get<RestriccionMedica[]>(
        '/api/hseq/medicina-laboral/restricciones/',
        {
          params: { estado: 'ACTIVA' },
        }
      );
      // Filtrar las que vencen en los próximos N días
      const hoy = new Date();
      const fechaLimite = new Date();
      fechaLimite.setDate(hoy.getDate() + dias);

      return data.filter((r) => {
        if (!r.fecha_fin) return false;
        const fechaFin = new Date(r.fecha_fin);
        return fechaFin >= hoy && fechaFin <= fechaLimite;
      });
    },
  });
}

// ==================== PROGRAMAS DE VIGILANCIA HOOKS ====================

export function useProgramasVigilancia(params?: {
  empresa_id?: number;
  tipo?: string;
  estado?: string;
  responsable_id?: number;
}) {
  return useQuery({
    queryKey: [...medicinaLaboralKeys.programas(), params],
    queryFn: async () => {
      const { data } = await apiClient.get<ProgramaVigilancia[]>(
        '/api/hseq/medicina-laboral/programas/',
        { params }
      );
      return data;
    },
  });
}

export function useProgramaVigilancia(id: number) {
  return useQuery({
    queryKey: medicinaLaboralKeys.programa(id),
    queryFn: async () => {
      const { data } = await apiClient.get<ProgramaVigilancia>(
        `/api/hseq/medicina-laboral/programas/${id}/`
      );
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateProgramaVigilancia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (datos: CreateProgramaVigilanciaDTO) => {
      const { data } = await apiClient.post<ProgramaVigilancia>(
        '/api/hseq/medicina-laboral/programas/',
        datos
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.programas() });
      toast.success('Programa de vigilancia creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear programa de vigilancia');
    },
  });
}

export function useUpdateProgramaVigilancia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateProgramaVigilanciaDTO }) => {
      const { data } = await apiClient.patch<ProgramaVigilancia>(
        `/api/hseq/medicina-laboral/programas/${id}/`,
        datos
      );
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.programas() });
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.programa(id) });
      toast.success('Programa de vigilancia actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar programa de vigilancia');
    },
  });
}

export function useDeleteProgramaVigilancia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/hseq/medicina-laboral/programas/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.programas() });
      toast.success('Programa de vigilancia eliminado exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar programa de vigilancia');
    },
  });
}

export function useProgramasActivos() {
  return useQuery({
    queryKey: medicinaLaboralKeys.programasActivos(),
    queryFn: async () => {
      const { data } = await apiClient.get<{
        total: number;
        programas: ProgramaVigilancia[];
      }>('/api/hseq/medicina-laboral/programas/activos/');
      return data;
    },
  });
}

export function useDashboardProgramas() {
  return useProgramasActivos();
}

// ==================== CASOS EN VIGILANCIA HOOKS ====================

export function useCasosVigilancia(params?: {
  empresa_id?: number;
  programa?: number;
  colaborador_id?: number;
  severidad?: string;
  estado?: string;
}) {
  return useQuery({
    queryKey: [...medicinaLaboralKeys.casos(), params],
    queryFn: async () => {
      const { data } = await apiClient.get<CasoVigilancia[]>('/api/hseq/medicina-laboral/casos/', {
        params,
      });
      return data;
    },
  });
}

export function useCasoVigilancia(id: number) {
  return useQuery({
    queryKey: medicinaLaboralKeys.caso(id),
    queryFn: async () => {
      const { data } = await apiClient.get<CasoVigilancia>(
        `/api/hseq/medicina-laboral/casos/${id}/`
      );
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateCasoVigilancia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (datos: CreateCasoVigilanciaDTO) => {
      const { data } = await apiClient.post<CasoVigilancia>(
        '/api/hseq/medicina-laboral/casos/',
        datos
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.casos() });
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.programas() });
      toast.success('Caso de vigilancia creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear caso de vigilancia');
    },
  });
}

export function useUpdateCasoVigilancia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateCasoVigilanciaDTO }) => {
      const { data } = await apiClient.patch<CasoVigilancia>(
        `/api/hseq/medicina-laboral/casos/${id}/`,
        datos
      );
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.casos() });
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.caso(id) });
      toast.success('Caso de vigilancia actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar caso de vigilancia');
    },
  });
}

export function useDeleteCasoVigilancia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/hseq/medicina-laboral/casos/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.casos() });
      toast.success('Caso de vigilancia eliminado exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar caso de vigilancia');
    },
  });
}

export function useRegistrarSeguimiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: RegistrarSeguimientoDTO }) => {
      const { data } = await apiClient.post<CasoVigilancia>(
        `/api/hseq/medicina-laboral/casos/${id}/registrar_seguimiento/`,
        datos
      );
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.casos() });
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.caso(id) });
      toast.success('Seguimiento registrado exitosamente');
    },
    onError: () => {
      toast.error('Error al registrar seguimiento');
    },
  });
}

export function useCerrarCaso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: CerrarCasoDTO }) => {
      const { data } = await apiClient.post<CasoVigilancia>(
        `/api/hseq/medicina-laboral/casos/${id}/cerrar_caso/`,
        datos
      );
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.casos() });
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.caso(id) });
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.programas() });
      toast.success('Caso cerrado exitosamente');
    },
    onError: () => {
      toast.error('Error al cerrar caso');
    },
  });
}

export function useCasosPorPrograma(programaId: number, estado?: string) {
  return useQuery({
    queryKey: medicinaLaboralKeys.casosByPrograma(programaId),
    queryFn: async () => {
      const { data } = await apiClient.get<{
        programa: { id: number; codigo: string; nombre: string };
        total_casos: number;
        casos: CasoVigilancia[];
      }>(`/api/hseq/medicina-laboral/programas/${programaId}/casos_programa/`, {
        params: estado ? { estado } : undefined,
      });
      return data;
    },
    enabled: !!programaId,
  });
}

export function useCasosActivos() {
  return useQuery({
    queryKey: medicinaLaboralKeys.casosActivos(),
    queryFn: async () => {
      const { data } = await apiClient.get<{
        total: number;
        casos: CasoVigilancia[];
      }>('/api/hseq/medicina-laboral/casos/activos/');
      return data;
    },
  });
}

// ==================== DIAGNÓSTICOS OCUPACIONALES HOOKS ====================

export function useDiagnosticos(params?: {
  origen?: string;
  categoria?: string;
  requiere_vigilancia?: boolean;
  is_active?: boolean;
}) {
  return useQuery({
    queryKey: [...medicinaLaboralKeys.diagnosticos(), params],
    queryFn: async () => {
      const { data } = await apiClient.get<DiagnosticoOcupacional[]>(
        '/api/hseq/medicina-laboral/diagnosticos/',
        { params }
      );
      return data;
    },
  });
}

export function useDiagnostico(id: number) {
  return useQuery({
    queryKey: medicinaLaboralKeys.diagnostico(id),
    queryFn: async () => {
      const { data } = await apiClient.get<DiagnosticoOcupacional>(
        `/api/hseq/medicina-laboral/diagnosticos/${id}/`
      );
      return data;
    },
    enabled: !!id,
  });
}

export function useBuscarCIE10(query: string) {
  return useQuery({
    queryKey: medicinaLaboralKeys.diagnosticosBusqueda(query),
    queryFn: async () => {
      const { data } = await apiClient.get<DiagnosticoOcupacional[]>(
        '/api/hseq/medicina-laboral/diagnosticos/',
        {
          params: { search: query },
        }
      );
      return data;
    },
    enabled: query.length >= 3,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useCreateDiagnostico() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (datos: CreateDiagnosticoOcupacionalDTO) => {
      const { data } = await apiClient.post<DiagnosticoOcupacional>(
        '/api/hseq/medicina-laboral/diagnosticos/',
        datos
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.diagnosticos() });
      toast.success('Diagnóstico ocupacional creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear diagnóstico ocupacional');
    },
  });
}

export function useUpdateDiagnostico() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: UpdateDiagnosticoOcupacionalDTO }) => {
      const { data } = await apiClient.patch<DiagnosticoOcupacional>(
        `/api/hseq/medicina-laboral/diagnosticos/${id}/`,
        datos
      );
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.diagnosticos() });
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.diagnostico(id) });
      toast.success('Diagnóstico ocupacional actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar diagnóstico ocupacional');
    },
  });
}

// ==================== ESTADÍSTICAS HOOKS ====================

export function useEstadisticaMedica(anio: number, mes: number) {
  return useQuery({
    queryKey: medicinaLaboralKeys.estadistica(anio, mes),
    queryFn: async () => {
      const { data } = await apiClient.get<{
        anio: number;
        mes: number;
        total_registros: number;
        estadisticas: EstadisticaMedica[];
      }>('/api/hseq/medicina-laboral/estadisticas/por_periodo/', {
        params: { anio, mes },
      });
      return data.estadisticas[0] || null;
    },
    enabled: !!anio && !!mes,
  });
}

export function useGenerarEstadistica() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (datos: { empresa_id: number; anio: number; mes: number }) => {
      const { data } = await apiClient.post<EstadisticaMedica>(
        '/api/hseq/medicina-laboral/estadisticas/',
        datos
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: medicinaLaboralKeys.estadisticas() });
      queryClient.invalidateQueries({
        queryKey: medicinaLaboralKeys.estadistica(data.anio, data.mes),
      });
      toast.success('Estadística médica generada exitosamente');
    },
    onError: () => {
      toast.error('Error al generar estadística médica');
    },
  });
}

export function useDashboardMedicinaLaboral(anio: number) {
  return useQuery({
    queryKey: medicinaLaboralKeys.dashboard(anio),
    queryFn: async () => {
      const { data } = await apiClient.get<{
        anio: number;
        meses: Array<{
          mes: number;
          porcentaje_aptitud: number;
          porcentaje_cobertura: number;
          examenes_realizados: number;
          restricciones_activas: number;
          casos_vigilancia_activos: number;
        }>;
      }>('/api/hseq/medicina-laboral/estadisticas/tendencias/', {
        params: { anio },
      });
      return data;
    },
    enabled: !!anio,
  });
}
