/**
 * Tipos TypeScript para Medicina Laboral - HSEQ Management
 * Sistema de Gestión StrateKaz
 *
 * Incluye:
 * - Tipos de Exámenes Médicos
 * - Exámenes Médicos Ocupacionales
 * - Restricciones Médicas
 * - Programas de Vigilancia Epidemiológica (PVE)
 * - Casos en Vigilancia
 * - Diagnósticos Ocupacionales
 * - Estadísticas Médicas
 */

// ==================== USER DETAIL ====================

/**
 * Información básica de usuario para relaciones
 */
export interface UserDetail {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
}

// ==================== ENUMS Y TIPOS ====================

/**
 * Tipos de exámenes médicos ocupacionales
 */
export type TipoExamen =
  | 'INGRESO'
  | 'PERIODICO'
  | 'EGRESO'
  | 'POST_INCAPACIDAD'
  | 'RETIRO'
  | 'CAMBIO_OCUPACION';

/**
 * Periodicidad de exámenes
 */
export type PeriodicidadExamen = 'UNICO' | 'ANUAL' | 'BIENAL' | 'TRIENAL' | 'PERSONALIZADO';

/**
 * Concepto de aptitud del examen médico
 */
export type ConceptoAptitud =
  | 'APTO'
  | 'APTO_CON_RESTRICCIONES'
  | 'NO_APTO_TEMPORAL'
  | 'NO_APTO_PERMANENTE'
  | 'PENDIENTE';

/**
 * Estado del examen médico
 */
export type EstadoExamen = 'PROGRAMADO' | 'EN_PROCESO' | 'COMPLETADO' | 'CANCELADO' | 'VENCIDO';

/**
 * Tipo de restricción médica
 */
export type TipoRestriccion = 'TEMPORAL' | 'PERMANENTE' | 'CONDICIONAL';

/**
 * Categoría de restricción médica
 */
export type CategoriaRestriccion =
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

/**
 * Estado de la restricción médica
 */
export type EstadoRestriccion = 'ACTIVA' | 'VENCIDA' | 'LEVANTADA' | 'CANCELADA';

/**
 * Tipos de programas de vigilancia epidemiológica
 */
export type TipoProgramaVigilancia =
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

/**
 * Estado del programa de vigilancia
 */
export type EstadoProgramaVigilancia = 'ACTIVO' | 'INACTIVO' | 'EN_REVISION';

/**
 * Severidad del caso en vigilancia
 */
export type SeveridadCaso = 'LEVE' | 'MODERADA' | 'SEVERA' | 'CRITICA';

/**
 * Estado del caso en vigilancia
 */
export type EstadoCasoVigilancia =
  | 'ACTIVO'
  | 'EN_SEGUIMIENTO'
  | 'CONTROLADO'
  | 'CERRADO'
  | 'CANCELADO';

/**
 * Origen del diagnóstico
 */
export type OrigenDiagnostico = 'OCUPACIONAL' | 'COMUN' | 'AMBOS';

// ==================== ARRAYS DE OPCIONES PARA FORMULARIOS ====================

export const TIPO_EXAMEN_OPTIONS: Array<{ value: TipoExamen; label: string }> = [
  { value: 'INGRESO', label: 'Examen de Ingreso' },
  { value: 'PERIODICO', label: 'Examen Periódico' },
  { value: 'EGRESO', label: 'Examen de Egreso' },
  { value: 'POST_INCAPACIDAD', label: 'Post-Incapacidad' },
  { value: 'RETIRO', label: 'Examen de Retiro' },
  { value: 'CAMBIO_OCUPACION', label: 'Cambio de Ocupación' },
];

export const PERIODICIDAD_EXAMEN_OPTIONS: Array<{ value: PeriodicidadExamen; label: string }> = [
  { value: 'UNICO', label: 'Único (ingreso/egreso)' },
  { value: 'ANUAL', label: 'Anual' },
  { value: 'BIENAL', label: 'Bienal (cada 2 años)' },
  { value: 'TRIENAL', label: 'Trienal (cada 3 años)' },
  { value: 'PERSONALIZADO', label: 'Personalizado' },
];

export const CONCEPTO_APTITUD_OPTIONS: Array<{ value: ConceptoAptitud; label: string }> = [
  { value: 'APTO', label: 'Apto' },
  { value: 'APTO_CON_RESTRICCIONES', label: 'Apto con Restricciones' },
  { value: 'NO_APTO_TEMPORAL', label: 'No Apto Temporal' },
  { value: 'NO_APTO_PERMANENTE', label: 'No Apto Permanente' },
  { value: 'PENDIENTE', label: 'Pendiente' },
];

export const ESTADO_EXAMEN_OPTIONS: Array<{ value: EstadoExamen; label: string }> = [
  { value: 'PROGRAMADO', label: 'Programado' },
  { value: 'EN_PROCESO', label: 'En Proceso' },
  { value: 'COMPLETADO', label: 'Completado' },
  { value: 'CANCELADO', label: 'Cancelado' },
  { value: 'VENCIDO', label: 'Vencido' },
];

export const TIPO_RESTRICCION_OPTIONS: Array<{ value: TipoRestriccion; label: string }> = [
  { value: 'TEMPORAL', label: 'Temporal' },
  { value: 'PERMANENTE', label: 'Permanente' },
  { value: 'CONDICIONAL', label: 'Condicional' },
];

export const CATEGORIA_RESTRICCION_OPTIONS: Array<{ value: CategoriaRestriccion; label: string }> =
  [
    { value: 'CARGA', label: 'Manipulación de Cargas' },
    { value: 'POSTURA', label: 'Posturas' },
    { value: 'MOVIMIENTO', label: 'Movimientos Repetitivos' },
    { value: 'ALTURA', label: 'Trabajo en Alturas' },
    { value: 'ESPACIOS_CONFINADOS', label: 'Espacios Confinados' },
    { value: 'QUIMICOS', label: 'Exposición a Químicos' },
    { value: 'RUIDO', label: 'Exposición a Ruido' },
    { value: 'TEMPERATURA', label: 'Temperaturas Extremas' },
    { value: 'JORNADA', label: 'Jornada Laboral' },
    { value: 'OTRAS', label: 'Otras' },
  ];

export const ESTADO_RESTRICCION_OPTIONS: Array<{ value: EstadoRestriccion; label: string }> = [
  { value: 'ACTIVA', label: 'Activa' },
  { value: 'VENCIDA', label: 'Vencida' },
  { value: 'LEVANTADA', label: 'Levantada' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

export const TIPO_PROGRAMA_VIGILANCIA_OPTIONS: Array<{
  value: TipoProgramaVigilancia;
  label: string;
}> = [
  { value: 'OSTEOMUSCULAR', label: 'Desórdenes Osteomusculares' },
  { value: 'CARDIOVASCULAR', label: 'Riesgo Cardiovascular' },
  { value: 'AUDITIVO', label: 'Conservación Auditiva' },
  { value: 'RESPIRATORIO', label: 'Riesgo Respiratorio' },
  { value: 'VISUAL', label: 'Conservación Visual' },
  { value: 'PSICOSOCIAL', label: 'Riesgo Psicosocial' },
  { value: 'DERMATOLOGICO', label: 'Riesgo Dermatológico' },
  { value: 'BIOLOGICO', label: 'Riesgo Biológico' },
  { value: 'QUIMICO', label: 'Exposición a Químicos' },
  { value: 'OTRO', label: 'Otro' },
];

export const ESTADO_PROGRAMA_VIGILANCIA_OPTIONS: Array<{
  value: EstadoProgramaVigilancia;
  label: string;
}> = [
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'INACTIVO', label: 'Inactivo' },
  { value: 'EN_REVISION', label: 'En Revisión' },
];

export const SEVERIDAD_CASO_OPTIONS: Array<{ value: SeveridadCaso; label: string }> = [
  { value: 'LEVE', label: 'Leve' },
  { value: 'MODERADA', label: 'Moderada' },
  { value: 'SEVERA', label: 'Severa' },
  { value: 'CRITICA', label: 'Crítica' },
];

export const ESTADO_CASO_VIGILANCIA_OPTIONS: Array<{ value: EstadoCasoVigilancia; label: string }> =
  [
    { value: 'ACTIVO', label: 'Activo' },
    { value: 'EN_SEGUIMIENTO', label: 'En Seguimiento' },
    { value: 'CONTROLADO', label: 'Controlado' },
    { value: 'CERRADO', label: 'Cerrado' },
    { value: 'CANCELADO', label: 'Cancelado' },
  ];

export const ORIGEN_DIAGNOSTICO_OPTIONS: Array<{ value: OrigenDiagnostico; label: string }> = [
  { value: 'OCUPACIONAL', label: 'Ocupacional' },
  { value: 'COMUN', label: 'Común' },
  { value: 'AMBOS', label: 'Ambos' },
];

// ==================== INTERFACES DE JSON FIELDS ====================

/**
 * Estructura de un diagnóstico CIE-10
 */
export interface DiagnosticoCIE10 {
  codigo: string;
  nombre: string;
  tipo?: 'principal' | 'secundario' | 'relacionado';
}

/**
 * Estructura de un seguimiento en caso de vigilancia
 */
export interface SeguimientoCaso {
  fecha: string;
  descripcion: string;
  responsable_id: number;
  responsable_nombre?: string;
  hallazgos?: string;
  acciones_tomadas?: string;
}

/**
 * Estructura de una acción implementada en caso de vigilancia
 */
export interface AccionImplementada {
  tipo: string;
  descripcion: string;
  fecha_implementacion: string;
  responsable_id?: number;
  responsable_nombre?: string;
  estado?: 'planificada' | 'en_proceso' | 'completada' | 'cancelada';
  efectividad?: 'pendiente' | 'efectiva' | 'no_efectiva';
}

/**
 * Estructura de actividad de vigilancia en programa PVE
 */
export interface ActividadVigilancia {
  nombre: string;
  descripcion: string;
  periodicidad?: string;
  responsable?: string;
  recursos_necesarios?: string;
}

/**
 * Estructura de un indicador de programa PVE
 */
export interface IndicadorPVE {
  nombre: string;
  formula: string;
  meta?: string;
  unidad_medida?: string;
  frecuencia_medicion?: string;
}

/**
 * Estructura de diagnóstico top en estadísticas
 */
export interface TopDiagnostico {
  codigo_cie10: string;
  nombre: string;
  cantidad: number;
  porcentaje?: number;
}

// ==================== TIPO EXAMEN ====================

/**
 * Tipo de Examen Médico - Catálogo de tipos de exámenes médicos ocupacionales
 */
export interface TipoExamenMedico {
  id: number;
  codigo: string;
  nombre: string;
  tipo: TipoExamen;
  descripcion: string;
  periodicidad: PeriodicidadExamen;
  meses_periodicidad: number | null;

  // Pruebas incluidas
  incluye_clinico: boolean;
  incluye_laboratorio: boolean;
  incluye_paraclinicos: boolean;
  incluye_audiometria: boolean;
  incluye_visiometria: boolean;
  incluye_espirometria: boolean;

  // Énfasis
  enfasis_osteomuscular: boolean;
  enfasis_cardiovascular: boolean;
  enfasis_respiratorio: boolean;
  enfasis_neurologico: boolean;

  observaciones: string;
  is_active: boolean;

  // Auditoría
  created_at: string;
  updated_at: string;
}

export type TipoExamenMedicoList = TipoExamenMedico;

export interface TipoExamenMedicoDetail extends TipoExamenMedico {
  examenes?: ExamenMedicoList[];
}

// ==================== EXAMEN MEDICO ====================

/**
 * Examen Médico Ocupacional - Registro de exámenes realizados
 */
export interface ExamenMedico {
  id: number;
  empresa_id: number;
  numero_examen: string;

  // Relaciones
  tipo_examen: number;
  tipo_examen_detail?: TipoExamenMedico;
  colaborador_id: number;
  colaborador_nombre?: string;
  cargo_id: number | null;
  cargo_nombre?: string;

  // Programación
  fecha_programada: string;
  fecha_realizado: string | null;

  // Proveedor
  entidad_prestadora: string;
  medico_evaluador: string;
  licencia_medica: string;

  // Resultados
  concepto_aptitud: ConceptoAptitud;
  hallazgos_relevantes: string;
  recomendaciones: string;

  // Diagnósticos (JSON)
  diagnosticos: DiagnosticoCIE10[];

  // Restricciones
  requiere_restricciones: boolean;
  restricciones_temporales: string;
  restricciones_permanentes: string;

  // Seguimiento
  requiere_seguimiento: boolean;
  tipo_seguimiento: string;
  fecha_proximo_control: string | null;

  // Archivo
  archivo_resultado: string | null;

  // Estado
  estado: EstadoExamen;
  costo_examen: string | null; // DecimalField as string

  observaciones: string;

  // Auditoría
  created_by_id: number | null;
  created_by_detail?: UserDetail;
  created_at: string;
  updated_at: string;
}

export type ExamenMedicoList = ExamenMedico;

export interface ExamenMedicoDetail extends ExamenMedico {
  restricciones?: RestriccionMedicaList[];
}

// ==================== RESTRICCION MEDICA ====================

/**
 * Restricción Médica - Restricciones temporales o permanentes por colaborador
 */
export interface RestriccionMedica {
  id: number;
  empresa_id: number;
  codigo_restriccion: string;

  // Relaciones
  examen_medico: number | null;
  examen_medico_detail?: Partial<ExamenMedico>;
  colaborador_id: number;
  colaborador_nombre?: string;
  cargo_id: number | null;
  cargo_nombre?: string;

  // Clasificación
  tipo_restriccion: TipoRestriccion;
  categoria: CategoriaRestriccion;

  // Descripción
  descripcion: string;
  actividades_restringidas: string;

  // Vigencia
  fecha_inicio: string;
  fecha_fin: string | null;

  // Médico
  medico_ordena: string;
  licencia_medica: string;

  // Seguimiento
  requiere_evaluacion_periodica: boolean;
  frecuencia_evaluacion_meses: number | null;
  proxima_evaluacion: string | null;

  // Gestión
  ajuste_realizado: boolean;
  descripcion_ajuste: string;

  // Estado
  estado: EstadoRestriccion;
  fecha_levantamiento: string | null;
  motivo_levantamiento: string;

  // Documento soporte
  archivo_soporte: string | null;

  observaciones: string;

  // Auditoría
  created_by_id: number | null;
  created_by_detail?: UserDetail;
  created_at: string;
  updated_at: string;
}

export type RestriccionMedicaList = RestriccionMedica;

export interface RestriccionMedicaDetail extends RestriccionMedica {
  esta_vigente?: boolean;
}

// ==================== PROGRAMA VIGILANCIA ====================

/**
 * Programa de Vigilancia Epidemiológica (PVE)
 */
export interface ProgramaVigilancia {
  id: number;
  empresa_id: number;
  codigo: string;
  nombre: string;
  tipo: TipoProgramaVigilancia;

  // Descripción
  descripcion: string;
  objetivo: string;
  alcance: string;

  // Población objetivo (JSON)
  cargos_aplicables: number[];
  areas_aplicables: number[];

  // Actividades (JSON)
  actividades_vigilancia: ActividadVigilancia[];

  // Periodicidad
  frecuencia_evaluacion_meses: number;

  // Indicadores (JSON)
  indicadores: IndicadorPVE[];

  // Vigencia
  fecha_inicio: string;
  fecha_revision: string | null;
  proxima_revision: string | null;

  // Responsable
  responsable_id: number | null;
  responsable_detail?: UserDetail;

  // Estado
  estado: EstadoProgramaVigilancia;

  // Documentación
  archivo_programa: string | null;

  observaciones: string;

  // Auditoría
  created_by_id: number | null;
  created_by_detail?: UserDetail;
  created_at: string;
  updated_at: string;
}

export type ProgramaVigilanciaList = ProgramaVigilancia;

export interface ProgramaVigilanciaDetail extends ProgramaVigilancia {
  casos?: CasoVigilanciaList[];
  casos_activos_count?: number;
}

// ==================== CASO VIGILANCIA ====================

/**
 * Caso en Vigilancia Epidemiológica
 */
export interface CasoVigilancia {
  id: number;
  empresa_id: number;
  numero_caso: string;

  // Relaciones
  programa: number;
  programa_detail?: ProgramaVigilancia;
  colaborador_id: number;
  colaborador_nombre?: string;
  cargo_id: number | null;
  cargo_nombre?: string;

  // Identificación del caso
  fecha_apertura: string;
  descripcion_caso: string;

  // Clasificación
  severidad: SeveridadCaso;

  // Diagnósticos relacionados (JSON)
  diagnosticos_cie10: DiagnosticoCIE10[];

  // Factores de riesgo
  factores_riesgo_identificados: string;
  exposicion_laboral: string;

  // Plan de intervención
  plan_intervencion: string;
  acciones_implementadas: AccionImplementada[];

  // Seguimientos (JSON)
  seguimientos: SeguimientoCaso[];

  // Control
  fecha_ultimo_seguimiento: string | null;
  fecha_proximo_seguimiento: string | null;

  // Cierre
  fecha_cierre: string | null;
  motivo_cierre: string;
  resultado_final: string;

  // Estado
  estado: EstadoCasoVigilancia;

  // Archivo
  archivo_adjunto: string | null;

  observaciones: string;

  // Auditoría
  created_by_id: number | null;
  created_by_detail?: UserDetail;
  created_at: string;
  updated_at: string;
}

export type CasoVigilanciaList = CasoVigilancia;

export type CasoVigilanciaDetail = CasoVigilancia;

// ==================== DIAGNOSTICO OCUPACIONAL ====================

/**
 * Diagnóstico Ocupacional - Catálogo CIE-10 con clasificación ocupacional
 */
export interface DiagnosticoOcupacional {
  id: number;
  codigo_cie10: string;
  nombre: string;
  descripcion: string;

  // Clasificación
  categoria: string;
  origen: OrigenDiagnostico;

  // Relación con riesgos
  riesgos_relacionados: string;

  // Configuración
  requiere_vigilancia: boolean;
  programa_vigilancia_sugerido: string;

  // Notificación
  requiere_reporte_arl: boolean;
  requiere_reporte_secretaria: boolean;

  is_active: boolean;

  // Auditoría
  created_at: string;
  updated_at: string;
}

export type DiagnosticoOcupacionalList = DiagnosticoOcupacional;

export type DiagnosticoOcupacionalDetail = DiagnosticoOcupacional;

// ==================== ESTADISTICA MEDICA ====================

/**
 * Estadísticas Médicas - Consolidado mensual de indicadores
 */
export interface EstadisticaMedica {
  id: number;
  empresa_id: number;

  // Período
  anio: number;
  mes: number;

  // Población
  total_colaboradores: number;

  // Exámenes médicos
  examenes_realizados: number;
  examenes_ingreso: number;
  examenes_periodicos: number;
  examenes_egreso: number;

  // Conceptos de aptitud
  aptos: number;
  aptos_con_restricciones: number;
  no_aptos_temporal: number;
  no_aptos_permanente: number;

  // Restricciones
  restricciones_activas: number;
  restricciones_nuevas: number;
  restricciones_levantadas: number;

  // Vigilancia epidemiológica
  casos_vigilancia_activos: number;
  casos_nuevos: number;
  casos_cerrados: number;

  // Diagnósticos
  diagnosticos_ocupacionales: number;
  diagnosticos_comunes: number;

  // Top diagnósticos (JSON)
  top_diagnosticos: TopDiagnostico[];

  // Indicadores calculados
  porcentaje_aptitud: string; // DecimalField as string
  porcentaje_cobertura_examenes: string; // DecimalField as string

  // Costos
  costo_total_examenes: string; // DecimalField as string

  observaciones: string;

  // Auditoría
  created_by_id: number | null;
  created_by_detail?: UserDetail;
  created_at: string;
  updated_at: string;
}

export type EstadisticaMedicaList = EstadisticaMedica;

export type EstadisticaMedicaDetail = EstadisticaMedica;

// ==================== DTOs - CREATE ====================

export interface CreateTipoExamenMedicoDTO {
  codigo: string;
  nombre: string;
  tipo: TipoExamen;
  descripcion?: string;
  periodicidad?: PeriodicidadExamen;
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

export interface CreateExamenMedicoDTO {
  tipo_examen: number;
  colaborador_id: number;
  cargo_id?: number;
  fecha_programada: string;
  fecha_realizado?: string;
  entidad_prestadora?: string;
  medico_evaluador?: string;
  licencia_medica?: string;
  concepto_aptitud?: ConceptoAptitud;
  hallazgos_relevantes?: string;
  recomendaciones?: string;
  diagnosticos?: DiagnosticoCIE10[];
  requiere_restricciones?: boolean;
  restricciones_temporales?: string;
  restricciones_permanentes?: string;
  requiere_seguimiento?: boolean;
  tipo_seguimiento?: string;
  fecha_proximo_control?: string;
  estado?: EstadoExamen;
  costo_examen?: string;
  observaciones?: string;
}

export interface CreateRestriccionMedicaDTO {
  examen_medico?: number;
  colaborador_id: number;
  cargo_id?: number;
  tipo_restriccion: TipoRestriccion;
  categoria: CategoriaRestriccion;
  descripcion: string;
  actividades_restringidas: string;
  fecha_inicio: string;
  fecha_fin?: string;
  medico_ordena: string;
  licencia_medica?: string;
  requiere_evaluacion_periodica?: boolean;
  frecuencia_evaluacion_meses?: number;
  proxima_evaluacion?: string;
  ajuste_realizado?: boolean;
  descripcion_ajuste?: string;
  observaciones?: string;
}

export interface CreateProgramaVigilanciaDTO {
  codigo: string;
  nombre: string;
  tipo: TipoProgramaVigilancia;
  descripcion?: string;
  objetivo: string;
  alcance?: string;
  cargos_aplicables?: number[];
  areas_aplicables?: number[];
  actividades_vigilancia?: ActividadVigilancia[];
  frecuencia_evaluacion_meses?: number;
  indicadores?: IndicadorPVE[];
  fecha_inicio: string;
  fecha_revision?: string;
  proxima_revision?: string;
  responsable_id?: number;
  observaciones?: string;
}

export interface CreateCasoVigilanciaDTO {
  programa: number;
  colaborador_id: number;
  cargo_id?: number;
  fecha_apertura: string;
  descripcion_caso: string;
  severidad: SeveridadCaso;
  diagnosticos_cie10?: DiagnosticoCIE10[];
  factores_riesgo_identificados?: string;
  exposicion_laboral?: string;
  plan_intervencion?: string;
  acciones_implementadas?: AccionImplementada[];
  fecha_proximo_seguimiento?: string;
  observaciones?: string;
}

export interface CreateDiagnosticoOcupacionalDTO {
  codigo_cie10: string;
  nombre: string;
  descripcion?: string;
  categoria: string;
  origen?: OrigenDiagnostico;
  riesgos_relacionados?: string;
  requiere_vigilancia?: boolean;
  programa_vigilancia_sugerido?: string;
  requiere_reporte_arl?: boolean;
  requiere_reporte_secretaria?: boolean;
}

export interface CreateEstadisticaMedicaDTO {
  anio: number;
  mes: number;
  total_colaboradores?: number;
  examenes_realizados?: number;
  examenes_ingreso?: number;
  examenes_periodicos?: number;
  examenes_egreso?: number;
  aptos?: number;
  aptos_con_restricciones?: number;
  no_aptos_temporal?: number;
  no_aptos_permanente?: number;
  restricciones_activas?: number;
  restricciones_nuevas?: number;
  restricciones_levantadas?: number;
  casos_vigilancia_activos?: number;
  casos_nuevos?: number;
  casos_cerrados?: number;
  diagnosticos_ocupacionales?: number;
  diagnosticos_comunes?: number;
  top_diagnosticos?: TopDiagnostico[];
  costo_total_examenes?: string;
  observaciones?: string;
}

// ==================== DTOs - UPDATE ====================

export interface UpdateTipoExamenMedicoDTO {
  codigo?: string;
  nombre?: string;
  tipo?: TipoExamen;
  descripcion?: string;
  periodicidad?: PeriodicidadExamen;
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
  is_active?: boolean;
  observaciones?: string;
}

export interface UpdateExamenMedicoDTO {
  tipo_examen?: number;
  colaborador_id?: number;
  cargo_id?: number;
  fecha_programada?: string;
  fecha_realizado?: string;
  entidad_prestadora?: string;
  medico_evaluador?: string;
  licencia_medica?: string;
  concepto_aptitud?: ConceptoAptitud;
  hallazgos_relevantes?: string;
  recomendaciones?: string;
  diagnosticos?: DiagnosticoCIE10[];
  requiere_restricciones?: boolean;
  restricciones_temporales?: string;
  restricciones_permanentes?: string;
  requiere_seguimiento?: boolean;
  tipo_seguimiento?: string;
  fecha_proximo_control?: string;
  estado?: EstadoExamen;
  costo_examen?: string;
  observaciones?: string;
}

export interface UpdateRestriccionMedicaDTO {
  examen_medico?: number;
  colaborador_id?: number;
  cargo_id?: number;
  tipo_restriccion?: TipoRestriccion;
  categoria?: CategoriaRestriccion;
  descripcion?: string;
  actividades_restringidas?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  medico_ordena?: string;
  licencia_medica?: string;
  requiere_evaluacion_periodica?: boolean;
  frecuencia_evaluacion_meses?: number;
  proxima_evaluacion?: string;
  ajuste_realizado?: boolean;
  descripcion_ajuste?: string;
  estado?: EstadoRestriccion;
  fecha_levantamiento?: string;
  motivo_levantamiento?: string;
  observaciones?: string;
}

export interface UpdateProgramaVigilanciaDTO {
  codigo?: string;
  nombre?: string;
  tipo?: TipoProgramaVigilancia;
  descripcion?: string;
  objetivo?: string;
  alcance?: string;
  cargos_aplicables?: number[];
  areas_aplicables?: number[];
  actividades_vigilancia?: ActividadVigilancia[];
  frecuencia_evaluacion_meses?: number;
  indicadores?: IndicadorPVE[];
  fecha_inicio?: string;
  fecha_revision?: string;
  proxima_revision?: string;
  responsable_id?: number;
  estado?: EstadoProgramaVigilancia;
  observaciones?: string;
}

export interface UpdateCasoVigilanciaDTO {
  programa?: number;
  colaborador_id?: number;
  cargo_id?: number;
  fecha_apertura?: string;
  descripcion_caso?: string;
  severidad?: SeveridadCaso;
  diagnosticos_cie10?: DiagnosticoCIE10[];
  factores_riesgo_identificados?: string;
  exposicion_laboral?: string;
  plan_intervencion?: string;
  acciones_implementadas?: AccionImplementada[];
  fecha_proximo_seguimiento?: string;
  estado?: EstadoCasoVigilancia;
  observaciones?: string;
}

export interface UpdateDiagnosticoOcupacionalDTO {
  codigo_cie10?: string;
  nombre?: string;
  descripcion?: string;
  categoria?: string;
  origen?: OrigenDiagnostico;
  riesgos_relacionados?: string;
  requiere_vigilancia?: boolean;
  programa_vigilancia_sugerido?: string;
  requiere_reporte_arl?: boolean;
  requiere_reporte_secretaria?: boolean;
  is_active?: boolean;
}

export interface UpdateEstadisticaMedicaDTO {
  anio?: number;
  mes?: number;
  total_colaboradores?: number;
  examenes_realizados?: number;
  examenes_ingreso?: number;
  examenes_periodicos?: number;
  examenes_egreso?: number;
  aptos?: number;
  aptos_con_restricciones?: number;
  no_aptos_temporal?: number;
  no_aptos_permanente?: number;
  restricciones_activas?: number;
  restricciones_nuevas?: number;
  restricciones_levantadas?: number;
  casos_vigilancia_activos?: number;
  casos_nuevos?: number;
  casos_cerrados?: number;
  diagnosticos_ocupacionales?: number;
  diagnosticos_comunes?: number;
  top_diagnosticos?: TopDiagnostico[];
  porcentaje_aptitud?: string;
  porcentaje_cobertura_examenes?: string;
  costo_total_examenes?: string;
  observaciones?: string;
}

// ==================== DTOs - FILTERS ====================

export interface TipoExamenMedicoFilters {
  tipo?: TipoExamen;
  periodicidad?: PeriodicidadExamen;
  is_active?: boolean;
  search?: string;
}

export interface ExamenMedicoFilters {
  tipo_examen?: number;
  colaborador_id?: number;
  concepto_aptitud?: ConceptoAptitud;
  estado?: EstadoExamen;
  fecha_programada_desde?: string;
  fecha_programada_hasta?: string;
  fecha_realizado_desde?: string;
  fecha_realizado_hasta?: string;
  requiere_restricciones?: boolean;
  requiere_seguimiento?: boolean;
  search?: string;
}

export interface RestriccionMedicaFilters {
  colaborador_id?: number;
  tipo_restriccion?: TipoRestriccion;
  categoria?: CategoriaRestriccion;
  estado?: EstadoRestriccion;
  fecha_inicio_desde?: string;
  fecha_inicio_hasta?: string;
  fecha_fin_desde?: string;
  fecha_fin_hasta?: string;
  vigente?: boolean;
  search?: string;
}

export interface ProgramaVigilanciaFilters {
  tipo?: TipoProgramaVigilancia;
  estado?: EstadoProgramaVigilancia;
  responsable_id?: number;
  fecha_inicio_desde?: string;
  fecha_inicio_hasta?: string;
  search?: string;
}

export interface CasoVigilanciaFilters {
  programa?: number;
  colaborador_id?: number;
  severidad?: SeveridadCaso;
  estado?: EstadoCasoVigilancia;
  fecha_apertura_desde?: string;
  fecha_apertura_hasta?: string;
  fecha_cierre_desde?: string;
  fecha_cierre_hasta?: string;
  search?: string;
}

export interface DiagnosticoOcupacionalFilters {
  origen?: OrigenDiagnostico;
  categoria?: string;
  requiere_vigilancia?: boolean;
  requiere_reporte_arl?: boolean;
  is_active?: boolean;
  search?: string;
}

export interface EstadisticaMedicaFilters {
  anio?: number;
  mes?: number;
  anio_desde?: number;
  anio_hasta?: number;
}

// ==================== ACCIONES ESPECIALES ====================

/**
 * DTO para registrar seguimiento en caso de vigilancia
 */
export interface RegistrarSeguimientoDTO {
  descripcion: string;
  responsable_id: number;
  hallazgos?: string;
  acciones_tomadas?: string;
}

/**
 * DTO para cerrar caso de vigilancia
 */
export interface CerrarCasoVigilanciaDTO {
  motivo: string;
  resultado: string;
  fecha_cierre?: string;
}

/**
 * DTO para levantar restricción médica
 */
export interface LevantarRestriccionDTO {
  motivo_levantamiento: string;
  fecha_levantamiento?: string;
}

/**
 * DTO para calcular indicadores de estadística médica
 */
export interface CalcularIndicadoresDTO {
  recalcular_porcentajes?: boolean;
}

/**
 * DTO para generar reporte de medicina laboral
 */
export interface GenerarReporteMedicinaLaboralDTO {
  tipo_reporte: 'examenes' | 'restricciones' | 'vigilancia' | 'estadisticas';
  fecha_inicio: string;
  fecha_fin: string;
  incluir_graficos?: boolean;
  incluir_detalles?: boolean;
  formato?: 'pdf' | 'excel' | 'csv';
}

// ==================== RESPONSE TYPES ====================

// PaginatedResponse: importar desde '@/types'

/**
 * Dashboard de Medicina Laboral
 */
export interface DashboardMedicinaLaboral {
  // Resumen de exámenes
  examenes_programados_mes: number;
  examenes_realizados_mes: number;
  examenes_pendientes: number;
  examenes_vencidos: number;

  // Conceptos de aptitud
  aptos_porcentaje: number;
  aptos_restricciones_porcentaje: number;
  no_aptos_porcentaje: number;

  // Restricciones
  restricciones_activas_total: number;
  restricciones_temporales: number;
  restricciones_permanentes: number;
  restricciones_proximas_vencer: number;

  // Vigilancia epidemiológica
  programas_activos: number;
  casos_vigilancia_activos: number;
  casos_nuevos_mes: number;
  casos_criticos: number;

  // Alertas
  examenes_proximos_vencer: number;
  seguimientos_pendientes: number;
  restricciones_sin_ajuste: number;

  // Gráficos
  examenes_por_tipo: Array<{ tipo: string; cantidad: number }>;
  restricciones_por_categoria: Array<{ categoria: string; cantidad: number }>;
  casos_por_severidad: Array<{ severidad: string; cantidad: number }>;
  top_diagnosticos_mes: TopDiagnostico[];
}

/**
 * Análisis de tendencias de medicina laboral
 */
export interface TendenciasMedicinaLaboral {
  periodo: string;
  total_examenes: number;
  porcentaje_aptitud: number;
  restricciones_nuevas: number;
  casos_nuevos: number;
  diagnosticos_ocupacionales: number;
  costo_total: number;
}

/**
 * Perfil médico del colaborador
 */
export interface PerfilMedicoColaborador {
  colaborador_id: number;
  colaborador_nombre: string;
  cargo_actual: string;

  // Exámenes
  ultimo_examen?: ExamenMedicoDetail;
  proximo_examen_fecha?: string;
  historial_examenes: ExamenMedicoList[];

  // Restricciones activas
  restricciones_activas: RestriccionMedicaList[];

  // Casos de vigilancia
  casos_vigilancia: CasoVigilanciaList[];

  // Diagnósticos históricos
  diagnosticos_historicos: DiagnosticoCIE10[];

  // Indicadores
  total_examenes: number;
  total_restricciones: number;
  dias_incapacidad_acumulados?: number;
}
