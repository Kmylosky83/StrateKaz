/**
 * Tipos TypeScript para Estructura de Cargos - Talent Hub
 * Sistema de Gestión Grasas y Huesos del Norte
 *
 * Basado en: backend/apps/talent_hub/estructura_cargos/models.py
 */

// =============================================================================
// ENUMS Y CHOICES
// =============================================================================

export type NivelEducativo =
  | 'PRIMARIA'
  | 'BACHILLER'
  | 'TECNICO'
  | 'TECNOLOGO'
  | 'PROFESIONAL'
  | 'ESPECIALIZACION'
  | 'MAESTRIA'
  | 'DOCTORADO';

export type ExperienciaMinima =
  | 'SIN_EXPERIENCIA'
  | '6_MESES'
  | '1_ANO'
  | '2_ANOS'
  | '3_ANOS'
  | '4_ANOS'
  | '5_ANOS'
  | '7_ANOS'
  | '10_ANOS';

export type EstadoProfesiograma =
  | 'BORRADOR'
  | 'EN_REVISION'
  | 'APROBADO'
  | 'VIGENTE'
  | 'OBSOLETO';

export type TipoCompetencia =
  | 'TECNICA'
  | 'COMPORTAMENTAL'
  | 'IDIOMA'
  | 'SOFTWARE'
  | 'CERTIFICACION';

export type NivelRequerido =
  | 'BASICO'
  | 'INTERMEDIO'
  | 'AVANZADO'
  | 'EXPERTO';

export type CriticidadCompetencia =
  | 'REQUERIDA'
  | 'DESEABLE'
  | 'OPCIONAL';

export type TipoRequisito =
  | 'CERTIFICACION'
  | 'LICENCIA'
  | 'EXAMEN_MEDICO'
  | 'APTITUD_FISICA'
  | 'DISPONIBILIDAD'
  | 'SEGURIDAD'
  | 'TECNOLOGIA'
  | 'OTRO';

export type CriticidadRequisito =
  | 'OBLIGATORIO'
  | 'REQUERIDO'
  | 'DESEABLE'
  | 'OPCIONAL';

export type MotivoVacante =
  | 'NUEVA_POSICION'
  | 'REEMPLAZO_RENUNCIA'
  | 'REEMPLAZO_RETIRO'
  | 'REEMPLAZO_DESPIDO'
  | 'REEMPLAZO_TEMPORAL'
  | 'PROYECTO_TEMPORAL'
  | 'ROTACION_INTERNA'
  | 'OTRO';

export type EstadoVacante =
  | 'BORRADOR'
  | 'PENDIENTE_APROBACION'
  | 'APROBADA'
  | 'PUBLICADA'
  | 'EN_PROCESO'
  | 'FINALISTAS'
  | 'CERRADA_CONTRATADA'
  | 'CERRADA_CANCELADA'
  | 'EN_ESPERA';

export type TipoContratoVacante =
  | 'INDEFINIDO'
  | 'FIJO'
  | 'OBRA_LABOR'
  | 'APRENDIZAJE'
  | 'PRESTACION_SERVICIOS'
  | 'TEMPORAL';

export type PrioridadVacante =
  | 'BAJA'
  | 'MEDIA'
  | 'ALTA'
  | 'URGENTE';

// =============================================================================
// INTERFACES - Profesiograma
// =============================================================================

export interface Profesiograma {
  id: string;
  empresa: string;
  cargo: string;
  area: string | null;

  // Identificación
  codigo: string;
  nombre: string;
  descripcion: string;
  version: string;
  estado: EstadoProfesiograma;

  // Requisitos Académicos
  nivel_educativo_minimo: NivelEducativo;
  titulo_requerido: string;
  areas_conocimiento: string[];
  formacion_complementaria: string;

  // Experiencia Laboral
  experiencia_minima: ExperienciaMinima;
  experiencia_especifica: string;
  experiencia_cargos_similares: boolean;

  // Competencias (Resumen)
  competencias_tecnicas_resumen: string[];
  competencias_blandas_resumen: string[];

  // Requisitos de Salud Ocupacional (SST)
  examenes_medicos_ingreso: string[];
  examenes_medicos_periodicos: string[];
  periodicidad_examenes: string;
  restricciones_medicas: string;

  // Riesgos Laborales
  factores_riesgo: string[];
  epp_requeridos: string[];

  // Certificaciones y Licencias
  requiere_licencia_conduccion: boolean;
  categoria_licencia: string;
  otras_certificaciones: string[];

  // Condiciones del Cargo
  jornada_laboral: string;
  disponibilidad_viajar: boolean;
  disponibilidad_turnos: boolean;
  condiciones_especiales: string;

  // Aprobación y Vigencia
  fecha_aprobacion: string | null;
  aprobado_por: string | null;
  fecha_vigencia_inicio: string | null;
  fecha_vigencia_fin: string | null;

  // Observaciones
  observaciones: string;

  // Metadata
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ProfesiogramaFormData {
  cargo: string;
  area?: string | null;
  codigo: string;
  nombre: string;
  descripcion?: string;
  version?: string;
  estado?: EstadoProfesiograma;
  nivel_educativo_minimo: NivelEducativo;
  titulo_requerido?: string;
  areas_conocimiento?: string[];
  formacion_complementaria?: string;
  experiencia_minima?: ExperienciaMinima;
  experiencia_especifica?: string;
  experiencia_cargos_similares?: boolean;
  competencias_tecnicas_resumen?: string[];
  competencias_blandas_resumen?: string[];
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
  fecha_aprobacion?: string | null;
  fecha_vigencia_inicio?: string | null;
  fecha_vigencia_fin?: string | null;
  observaciones?: string;
}

// =============================================================================
// INTERFACES - Matriz de Competencias
// =============================================================================

export interface MatrizCompetencia {
  id: string;
  empresa: string;
  profesiograma: string;

  // Competencia
  tipo_competencia: TipoCompetencia;
  nombre_competencia: string;
  descripcion: string;

  // Nivel y Criticidad
  nivel_requerido: NivelRequerido;
  criticidad: CriticidadCompetencia;
  peso_evaluacion: number; // 1-10

  // Criterios de Evaluación
  indicadores_nivel_basico: string;
  indicadores_nivel_intermedio: string;
  indicadores_nivel_avanzado: string;
  indicadores_nivel_experto: string;

  // Desarrollo
  forma_desarrollo: string;
  recursos_recomendados: string[];

  // Observaciones
  observaciones: string;

  // Metadata
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MatrizCompetenciaFormData {
  profesiograma: string;
  tipo_competencia: TipoCompetencia;
  nombre_competencia: string;
  descripcion?: string;
  nivel_requerido: NivelRequerido;
  criticidad?: CriticidadCompetencia;
  peso_evaluacion?: number;
  indicadores_nivel_basico?: string;
  indicadores_nivel_intermedio?: string;
  indicadores_nivel_avanzado?: string;
  indicadores_nivel_experto?: string;
  forma_desarrollo?: string;
  recursos_recomendados?: string[];
  observaciones?: string;
}

// =============================================================================
// INTERFACES - Requisito Especial
// =============================================================================

export interface RequisitoEspecial {
  id: string;
  empresa: string;
  profesiograma: string;

  // Requisito
  tipo_requisito: TipoRequisito;
  nombre_requisito: string;
  descripcion: string;

  // Criticidad y Validez
  criticidad: CriticidadRequisito;
  es_renovable: boolean;
  vigencia_meses: number | null;

  // Entidad Emisora
  entidad_emisora: string;

  // Validación y Verificación
  requiere_documento_soporte: boolean;
  tipo_documento_soporte: string;

  // Base Legal
  base_legal: string;

  // Observaciones
  observaciones: string;

  // Metadata
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RequisitoEspecialFormData {
  profesiograma: string;
  tipo_requisito: TipoRequisito;
  nombre_requisito: string;
  descripcion: string;
  criticidad?: CriticidadRequisito;
  es_renovable?: boolean;
  vigencia_meses?: number | null;
  entidad_emisora?: string;
  requiere_documento_soporte?: boolean;
  tipo_documento_soporte?: string;
  base_legal?: string;
  observaciones?: string;
}

// =============================================================================
// INTERFACES - Vacante
// =============================================================================

export interface Vacante {
  id: string;
  empresa: string;
  cargo: string;
  profesiograma: string | null;
  area: string | null;

  // Identificación
  codigo: string;
  titulo_vacante: string;
  descripcion: string;

  // Motivo y Cantidad
  motivo_vacante: MotivoVacante;
  cantidad_posiciones: number;
  posiciones_cubiertas: number;

  // Estado y Prioridad
  estado: EstadoVacante;
  prioridad: PrioridadVacante;

  // Condiciones Laborales
  tipo_contrato: TipoContratoVacante;
  salario_minimo: string | null; // Decimal as string
  salario_maximo: string | null; // Decimal as string
  salario_a_convenir: boolean;
  beneficios_adicionales: string;

  // Fechas
  fecha_apertura: string;
  fecha_cierre_estimada: string | null;
  fecha_cierre_real: string | null;
  fecha_incorporacion_deseada: string | null;

  // Aprobación
  aprobado_por: string | null;
  fecha_aprobacion: string | null;

  // Publicación
  publicar_externamente: boolean;
  canales_publicacion: string[];

  // Responsable
  responsable_reclutamiento: string | null;

  // Observaciones
  observaciones: string;
  motivo_cierre: string;

  // Metadata
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface VacanteFormData {
  cargo: string;
  profesiograma?: string | null;
  area?: string | null;
  codigo: string;
  titulo_vacante: string;
  descripcion?: string;
  motivo_vacante: MotivoVacante;
  cantidad_posiciones?: number;
  posiciones_cubiertas?: number;
  estado?: EstadoVacante;
  prioridad?: PrioridadVacante;
  tipo_contrato?: TipoContratoVacante;
  salario_minimo?: string | null;
  salario_maximo?: string | null;
  salario_a_convenir?: boolean;
  beneficios_adicionales?: string;
  fecha_apertura?: string;
  fecha_cierre_estimada?: string | null;
  fecha_cierre_real?: string | null;
  fecha_incorporacion_deseada?: string | null;
  fecha_aprobacion?: string | null;
  publicar_externamente?: boolean;
  canales_publicacion?: string[];
  responsable_reclutamiento?: string | null;
  observaciones?: string;
  motivo_cierre?: string;
}

// =============================================================================
// INTERFACES - Respuestas API
// =============================================================================

export interface ProfesiogramaResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Profesiograma[];
}

export interface MatrizCompetenciaResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: MatrizCompetencia[];
}

export interface RequisitoEspecialResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: RequisitoEspecial[];
}

export interface VacanteResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Vacante[];
}

// =============================================================================
// INTERFACES - Filtros
// =============================================================================

export interface ProfesiogramaFilters {
  cargo?: string;
  area?: string;
  estado?: EstadoProfesiograma;
  nivel_educativo_minimo?: NivelEducativo;
  search?: string;
  is_active?: boolean;
  ordering?: string;
}

export interface VacanteFilters {
  cargo?: string;
  area?: string;
  estado?: EstadoVacante;
  prioridad?: PrioridadVacante;
  tipo_contrato?: TipoContratoVacante;
  search?: string;
  is_active?: boolean;
  ordering?: string;
  fecha_apertura_desde?: string;
  fecha_apertura_hasta?: string;
}
