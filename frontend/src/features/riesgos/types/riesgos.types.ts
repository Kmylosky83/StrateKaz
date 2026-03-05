/**
 * Tipos TypeScript para Gestión de Riesgos
 * Sistema de Gestión StrateKaz
 *
 * Incluye:
 * - Riesgos de Proceso
 * - Tratamientos de Riesgo
 * - Controles
 * - Oportunidades
 */

// ==================== ENUMS Y TIPOS ====================

export type TipoRiesgo =
  | 'estrategico'
  | 'operativo'
  | 'financiero'
  | 'cumplimiento'
  | 'tecnologico'
  | 'reputacional';
export type TipoTratamiento = 'evitar' | 'mitigar' | 'transferir' | 'aceptar';
export type TipoControl = 'preventivo' | 'detectivo' | 'correctivo';
export type EstadoRiesgo =
  | 'identificado'
  | 'en_tratamiento'
  | 'controlado'
  | 'materializado'
  | 'cerrado';
export type EstadoTratamiento = 'pendiente' | 'en_curso' | 'completado' | 'cancelado';
export type NivelRiesgo = 'muy_bajo' | 'bajo' | 'medio' | 'alto' | 'muy_alto';
export type EfectividadControl = 'baja' | 'media' | 'alta';

// ==================== RIESGO DE PROCESO ====================

export interface RiesgoProceso {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo: TipoRiesgo;
  proceso: string;
  subproceso: string;
  area_responsable: string;
  causa_raiz: string;
  consecuencia: string;

  // Evaluación Inherente (sin controles)
  probabilidad_inherente: number; // 1-5
  impacto_inherente: number; // 1-5
  nivel_inherente: number; // probabilidad × impacto

  // Evaluación Residual (con controles actuales)
  probabilidad_residual: number; // 1-5
  impacto_residual: number; // 1-5
  nivel_residual: number; // probabilidad × impacto

  // Evaluación Objetivo (meta con tratamientos)
  probabilidad_objetivo: number | null; // 1-5
  impacto_objetivo: number | null; // 1-5
  nivel_objetivo: number | null; // probabilidad × impacto

  apetito_riesgo: number; // Nivel de riesgo aceptable

  responsable: number | null;
  responsable_detail?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };

  estado: EstadoRiesgo;
  fecha_identificacion: string;
  fecha_ultima_revision: string | null;
  proxima_revision: string | null;

  controles?: ControlRiesgo[];
  tratamientos?: TratamientoRiesgo[];

  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== CONTROL DE RIESGO ====================

export interface ControlRiesgo {
  id: number;
  riesgo: number;
  nombre: string;
  descripcion: string;
  tipo_control: TipoControl;
  responsable: number | null;
  responsable_detail?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  frecuencia: 'continuo' | 'diario' | 'semanal' | 'mensual' | 'trimestral' | 'semestral' | 'anual';
  efectividad: EfectividadControl;

  // Evidencia y seguimiento
  documentado: boolean;
  documento_soporte: string;
  automatizado: boolean;

  fecha_implementacion: string | null;
  fecha_ultima_prueba: string | null;
  proxima_prueba: string | null;

  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== TRATAMIENTO DE RIESGO ====================

export interface TratamientoRiesgo {
  id: number;
  riesgo: number;
  tipo: TipoTratamiento;
  descripcion: string;
  justificacion: string;

  responsable: number | null;
  responsable_detail?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };

  costo_estimado: number | null;
  beneficio_esperado: string;

  fecha_inicio: string | null;
  fecha_fin_planeada: string | null;
  fecha_fin_real: string | null;

  estado: EstadoTratamiento;
  porcentaje_avance: number; // 0-100

  observaciones: string;

  // Metas de reducción
  reduccion_probabilidad_esperada: number | null; // 1-5
  reduccion_impacto_esperada: number | null; // 1-5

  tareas?: TareaTratamiento[];

  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TareaTratamiento {
  id: number;
  tratamiento: number;
  nombre: string;
  descripcion: string;
  responsable: number | null;
  responsable_detail?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  fecha_limite: string;
  completada: boolean;
  fecha_completada: string | null;
  orden: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== OPORTUNIDAD ====================

export interface Oportunidad {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  origen: 'dofa' | 'pestel' | 'porter' | 'otro';
  origen_referencia: number | null; // ID del análisis de origen

  beneficio_potencial: string;
  factibilidad: 'alta' | 'media' | 'baja';
  probabilidad_exito: number; // 1-5
  impacto_beneficio: number; // 1-5

  proceso_relacionado: string;
  area_responsable: string;

  responsable: number | null;
  responsable_detail?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };

  estado:
    | 'identificada'
    | 'en_evaluacion'
    | 'aprobada'
    | 'en_ejecucion'
    | 'implementada'
    | 'rechazada';

  fecha_identificacion: string;
  fecha_implementacion: string | null;

  recursos_requeridos: string;
  costo_estimado: number | null;

  observaciones: string;

  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== MATRIZ DE RIESGO ====================

export interface ConfiguracionMatrizRiesgo {
  id: number;
  nombre: string;
  descripcion: string;

  // Configuración de niveles
  niveles_probabilidad: NivelProbabilidad[];
  niveles_impacto: NivelImpacto[];
  zonas_riesgo: ZonaRiesgo[];

  activa: boolean;
  created_at: string;
  updated_at: string;
}

export interface NivelProbabilidad {
  valor: number;
  etiqueta: string;
  descripcion: string;
  color: string;
}

export interface NivelImpacto {
  valor: number;
  etiqueta: string;
  descripcion: string;
  color: string;
}

export interface ZonaRiesgo {
  nivel_min: number;
  nivel_max: number;
  clasificacion: NivelRiesgo;
  color: string;
  accion_requerida: string;
}

// ==================== DTOs ====================

export interface CreateRiesgoProcesoDTO {
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo: TipoRiesgo;
  proceso: string;
  subproceso?: string;
  area_responsable: string;
  causa_raiz: string;
  consecuencia: string;
  probabilidad_inherente: number;
  impacto_inherente: number;
  apetito_riesgo?: number;
  responsable?: number;
  estado?: EstadoRiesgo;
  fecha_identificacion: string;
}

export interface UpdateRiesgoProcesoDTO {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  tipo?: TipoRiesgo;
  proceso?: string;
  subproceso?: string;
  area_responsable?: string;
  causa_raiz?: string;
  consecuencia?: string;
  probabilidad_inherente?: number;
  impacto_inherente?: number;
  probabilidad_residual?: number;
  impacto_residual?: number;
  probabilidad_objetivo?: number;
  impacto_objetivo?: number;
  apetito_riesgo?: number;
  responsable?: number;
  estado?: EstadoRiesgo;
  fecha_identificacion?: string;
  fecha_ultima_revision?: string;
  proxima_revision?: string;
  is_active?: boolean;
}

export interface CreateControlRiesgoDTO {
  riesgo: number;
  nombre: string;
  descripcion: string;
  tipo_control: TipoControl;
  responsable?: number;
  frecuencia: 'continuo' | 'diario' | 'semanal' | 'mensual' | 'trimestral' | 'semestral' | 'anual';
  efectividad: EfectividadControl;
  documentado?: boolean;
  documento_soporte?: string;
  automatizado?: boolean;
  fecha_implementacion?: string;
}

export interface UpdateControlRiesgoDTO {
  nombre?: string;
  descripcion?: string;
  tipo_control?: TipoControl;
  responsable?: number;
  frecuencia?: 'continuo' | 'diario' | 'semanal' | 'mensual' | 'trimestral' | 'semestral' | 'anual';
  efectividad?: EfectividadControl;
  documentado?: boolean;
  documento_soporte?: string;
  automatizado?: boolean;
  fecha_implementacion?: string;
  fecha_ultima_prueba?: string;
  proxima_prueba?: string;
  is_active?: boolean;
}

export interface CreateTratamientoRiesgoDTO {
  riesgo: number;
  tipo: TipoTratamiento;
  descripcion: string;
  justificacion: string;
  responsable?: number;
  costo_estimado?: number;
  beneficio_esperado?: string;
  fecha_inicio?: string;
  fecha_fin_planeada?: string;
  reduccion_probabilidad_esperada?: number;
  reduccion_impacto_esperada?: number;
}

export interface UpdateTratamientoRiesgoDTO {
  tipo?: TipoTratamiento;
  descripcion?: string;
  justificacion?: string;
  responsable?: number;
  costo_estimado?: number;
  beneficio_esperado?: string;
  fecha_inicio?: string;
  fecha_fin_planeada?: string;
  fecha_fin_real?: string;
  estado?: EstadoTratamiento;
  porcentaje_avance?: number;
  observaciones?: string;
  reduccion_probabilidad_esperada?: number;
  reduccion_impacto_esperada?: number;
  is_active?: boolean;
}

export interface CreateOportunidadDTO {
  codigo: string;
  nombre: string;
  descripcion: string;
  origen: 'dofa' | 'pestel' | 'porter' | 'otro';
  origen_referencia?: number;
  beneficio_potencial: string;
  factibilidad: 'alta' | 'media' | 'baja';
  probabilidad_exito: number;
  impacto_beneficio: number;
  proceso_relacionado: string;
  area_responsable: string;
  responsable?: number;
  recursos_requeridos?: string;
  costo_estimado?: number;
  fecha_identificacion: string;
}

export interface UpdateOportunidadDTO {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  origen?: 'dofa' | 'pestel' | 'porter' | 'otro';
  origen_referencia?: number;
  beneficio_potencial?: string;
  factibilidad?: 'alta' | 'media' | 'baja';
  probabilidad_exito?: number;
  impacto_beneficio?: number;
  proceso_relacionado?: string;
  area_responsable?: string;
  responsable?: number;
  estado?:
    | 'identificada'
    | 'en_evaluacion'
    | 'aprobada'
    | 'en_ejecucion'
    | 'implementada'
    | 'rechazada';
  fecha_identificacion?: string;
  fecha_implementacion?: string;
  recursos_requeridos?: string;
  costo_estimado?: number;
  observaciones?: string;
  is_active?: boolean;
}

// ==================== RESPONSE TYPES ====================
// PaginatedResponse: importar desde '@/types'

// ==================== FILTERS ====================

export interface RiesgoProcesoFilters {
  tipo?: TipoRiesgo;
  estado?: EstadoRiesgo;
  proceso?: string;
  responsable?: number;
  nivel_minimo?: number;
  nivel_maximo?: number;
}

export interface OportunidadFilters {
  origen?: 'dofa' | 'pestel' | 'porter' | 'otro';
  estado?: string;
  factibilidad?: 'alta' | 'media' | 'baja';
  responsable?: number;
}
