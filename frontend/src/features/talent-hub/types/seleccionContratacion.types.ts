/**
 * Tipos TypeScript para Seleccion y Contratacion - Talent Hub
 * Sistema de Gestion StrateKaz
 *
 * SINCRONIZADO con serializers reales del backend:
 * - backend/apps/talent_hub/seleccion_contratacion/serializers.py
 * - backend/apps/talent_hub/seleccion_contratacion/views.py
 *
 * API Base: /api/talent-hub/seleccion/
 */

// =============================================================================
// ENUMS Y CHOICES (lowercase - tal como los retorna el backend)
// =============================================================================

export type EstadoVacante = 'abierta' | 'en_proceso' | 'cerrada' | 'cancelada';

export type PrioridadVacante = 'baja' | 'media' | 'alta' | 'urgente';

export type ModalidadVacante = 'presencial' | 'hibrido' | 'remoto';

export type EstadoCandidato =
  | 'postulado'
  | 'preseleccionado'
  | 'en_evaluacion'
  | 'aprobado'
  | 'rechazado'
  | 'contratado';

export type OrigenPostulacion =
  | 'portal_empleo'
  | 'referido'
  | 'redes_sociales'
  | 'base_datos'
  | 'agencia'
  | 'universidad'
  | 'otro';

export type TipoDocumentoCandidato = 'CC' | 'CE' | 'PA' | 'TI';

export type NivelEducativo =
  | 'bachiller'
  | 'tecnico'
  | 'tecnologo'
  | 'profesional'
  | 'especializacion'
  | 'maestria'
  | 'doctorado';

export type TipoEntrevistaType = 'telefonica' | 'presencial' | 'virtual' | 'grupal' | 'panel';

export type EstadoEntrevista = 'programada' | 'realizada' | 'cancelada' | 'reprogramada';

export type RecomendacionEntrevista = 'contratar' | 'segunda_entrevista' | 'rechazar' | 'pendiente';

export type EstadoPrueba = 'programada' | 'realizada' | 'calificada' | 'cancelada';

export type EstadoAfiliacion = 'pendiente' | 'en_proceso' | 'afiliado' | 'rechazado' | 'cancelado';

export type TipoMovimientoContrato = 'contrato_inicial' | 'renovacion' | 'otrosi' | 'prorroga';

// =============================================================================
// OPTIONS para Selects (UI)
// =============================================================================

export const ESTADO_VACANTE_OPTIONS = [
  { value: 'abierta', label: 'Abierta' },
  { value: 'en_proceso', label: 'En Proceso' },
  { value: 'cerrada', label: 'Cerrada' },
  { value: 'cancelada', label: 'Cancelada' },
];

export const PRIORIDAD_OPTIONS = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
];

export const MODALIDAD_OPTIONS = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'hibrido', label: 'Hibrido' },
  { value: 'remoto', label: 'Remoto' },
];

export const ESTADO_CANDIDATO_OPTIONS = [
  { value: 'postulado', label: 'Postulado' },
  { value: 'preseleccionado', label: 'Preseleccionado' },
  { value: 'en_evaluacion', label: 'En Evaluacion' },
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'rechazado', label: 'Rechazado' },
  { value: 'contratado', label: 'Contratado' },
];

export const ORIGEN_OPTIONS = [
  { value: 'portal_empleo', label: 'Portal de Empleo' },
  { value: 'referido', label: 'Referido' },
  { value: 'redes_sociales', label: 'Redes Sociales' },
  { value: 'base_datos', label: 'Base de Datos' },
  { value: 'agencia', label: 'Agencia' },
  { value: 'universidad', label: 'Universidad' },
  { value: 'otro', label: 'Otro' },
];

export const TIPO_DOCUMENTO_OPTIONS = [
  { value: 'CC', label: 'Cedula de Ciudadania' },
  { value: 'CE', label: 'Cedula de Extranjeria' },
  { value: 'PA', label: 'Pasaporte' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
];

export const NIVEL_EDUCATIVO_OPTIONS = [
  { value: 'bachiller', label: 'Bachiller' },
  { value: 'tecnico', label: 'Tecnico' },
  { value: 'tecnologo', label: 'Tecnologo' },
  { value: 'profesional', label: 'Profesional' },
  { value: 'especializacion', label: 'Especializacion' },
  { value: 'maestria', label: 'Maestria' },
  { value: 'doctorado', label: 'Doctorado' },
];

export const TIPO_ENTREVISTA_OPTIONS = [
  { value: 'telefonica', label: 'Telefonica' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'virtual', label: 'Virtual' },
  { value: 'grupal', label: 'Grupal' },
  { value: 'panel', label: 'Panel' },
];

export const ESTADO_ENTREVISTA_OPTIONS = [
  { value: 'programada', label: 'Programada' },
  { value: 'realizada', label: 'Realizada' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'reprogramada', label: 'Reprogramada' },
];

export const RECOMENDACION_OPTIONS = [
  { value: 'contratar', label: 'Contratar' },
  { value: 'segunda_entrevista', label: 'Segunda Entrevista' },
  { value: 'rechazar', label: 'Rechazar' },
  { value: 'pendiente', label: 'Pendiente' },
];

export const TIPO_MOVIMIENTO_OPTIONS = [
  { value: 'contrato_inicial', label: 'Contrato Inicial' },
  { value: 'renovacion', label: 'Renovacion' },
  { value: 'otrosi', label: 'Otrosi' },
  { value: 'prorroga', label: 'Prorroga' },
];

// =============================================================================
// INTERFACES - Catalogos (tal como los retorna el backend)
// =============================================================================

export interface TipoContrato {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  requiere_duracion: boolean;
  requiere_objeto: boolean;
  color_badge: string;
  orden: number;
  is_active: boolean;
}

export interface TipoEntidad {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  es_obligatorio: boolean;
  color_badge: string;
  orden: number;
  is_active: boolean;
}

export interface EntidadSeguridadSocial {
  id: number;
  tipo_entidad: number;
  tipo_entidad_nombre: string;
  tipo_entidad_codigo: string;
  codigo: string;
  nombre: string;
  razon_social: string;
  nit: string;
  telefono: string | null;
  email: string | null;
  sitio_web: string | null;
  orden: number;
  is_active: boolean;
}

export interface TipoPrueba {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  permite_calificacion: boolean;
  requiere_archivo: boolean;
  duracion_estimada_minutos: number | null;
  color_badge: string;
  orden: number;
  is_active: boolean;
}

// =============================================================================
// INTERFACES - Vacante Activa
// =============================================================================

/** VacanteActiva en vista de lista */
export interface VacanteActivaList {
  id: number;
  codigo_vacante: string;
  titulo: string;
  cargo_requerido: string;
  area: string;
  tipo_contrato: number;
  tipo_contrato_nombre: string;
  estado: EstadoVacante;
  estado_display: string;
  prioridad: PrioridadVacante;
  prioridad_display: string;
  modalidad: ModalidadVacante;
  modalidad_display: string;
  numero_posiciones: number;
  fecha_apertura: string;
  fecha_cierre_esperada: string | null;
  dias_abierta: number;
  total_candidatos: number;
  candidatos_activos: number;
  publicada_externamente: boolean;
  is_active: boolean;
  created_at: string;
}

/** VacanteActiva en vista de detalle */
export interface VacanteActivaDetail extends VacanteActivaList {
  empresa: number;
  descripcion: string;
  requisitos_minimos: string;
  requisitos_deseables: string | null;
  funciones_principales: string;
  competencias_requeridas: string | null;
  salario_minimo: string | null;
  salario_maximo: string | null;
  salario_oculto: boolean;
  beneficios: string | null;
  horario: string;
  ubicacion: string;
  fecha_cierre_real: string | null;
  url_publicacion: string | null;
  responsable_proceso: number;
  reclutador: number | null;
  observaciones: string | null;
  motivo_cierre: string | null;
  candidatos_aprobados: number;
  candidatos_contratados: number;
  updated_at: string;
}

/** Tipo union para uso general */
export type VacanteActiva = VacanteActivaList;

/** FormData para crear/actualizar vacante */
export interface VacanteActivaFormData {
  codigo_vacante: string;
  titulo: string;
  cargo_requerido: string;
  area: string;
  tipo_contrato: number;
  estado?: EstadoVacante;
  prioridad?: PrioridadVacante;
  modalidad?: ModalidadVacante;
  numero_posiciones?: number;
  fecha_apertura?: string;
  fecha_cierre_esperada?: string;
  descripcion?: string;
  requisitos_minimos?: string;
  requisitos_deseables?: string;
  funciones_principales?: string;
  competencias_requeridas?: string;
  salario_minimo?: number;
  salario_maximo?: number;
  salario_oculto?: boolean;
  beneficios?: string;
  horario?: string;
  ubicacion?: string;
  publicada_externamente?: boolean;
  url_publicacion?: string;
  responsable_proceso: number;
  reclutador?: number;
  observaciones?: string;
}

// =============================================================================
// INTERFACES - Candidato
// =============================================================================

/** Candidato en vista de lista */
export interface CandidatoList {
  id: number;
  vacante: number;
  vacante_codigo: string;
  vacante_titulo: string;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  tipo_documento: TipoDocumentoCandidato;
  numero_documento: string;
  email: string;
  telefono: string;
  ciudad: string;
  nivel_educativo: NivelEducativo;
  anos_experiencia: number;
  estado: EstadoCandidato;
  estado_display: string;
  origen_postulacion: OrigenPostulacion;
  origen_display: string;
  fecha_postulacion: string;
  dias_en_proceso: number;
  calificacion_general: number | null;
  is_active: boolean;
}

/** Candidato en vista de detalle */
export interface CandidatoDetail extends CandidatoList {
  empresa: number;
  edad: number;
  tipo_documento_display: string;
  nivel_educativo_display: string;
  total_entrevistas: number;
  total_pruebas: number;
  telefono_alternativo: string | null;
  direccion: string | null;
  titulo_obtenido: string | null;
  anos_experiencia_cargo: number;
  fecha_ultima_actualizacion: string;
  hoja_vida: string;
  carta_presentacion: string | null;
  pretension_salarial: string | null;
  fecha_disponibilidad: string | null;
  requiere_reubicacion: boolean;
  disponibilidad_viajes: boolean;
  referido_por: string | null;
  fortalezas: string | null;
  debilidades: string | null;
  observaciones: string | null;
  motivo_rechazo: string | null;
  fecha_contratacion: string | null;
  salario_ofrecido: string | null;
  created_at: string;
  updated_at: string;
}

export type Candidato = CandidatoList;

/** FormData para crear/actualizar candidato */
export interface CandidatoFormData {
  vacante: number;
  nombres: string;
  apellidos: string;
  tipo_documento: TipoDocumentoCandidato;
  numero_documento: string;
  email: string;
  telefono: string;
  telefono_alternativo?: string;
  ciudad?: string;
  direccion?: string;
  nivel_educativo?: NivelEducativo;
  titulo_obtenido?: string;
  anos_experiencia?: number;
  anos_experiencia_cargo?: number;
  estado?: EstadoCandidato;
  origen_postulacion?: OrigenPostulacion;
  referido_por?: string;
  fecha_postulacion?: string;
  hoja_vida?: File;
  carta_presentacion?: File;
  pretension_salarial?: number;
  fecha_disponibilidad?: string;
  requiere_reubicacion?: boolean;
  disponibilidad_viajes?: boolean;
  fortalezas?: string;
  debilidades?: string;
  observaciones?: string;
}

// =============================================================================
// INTERFACES - Entrevista
// =============================================================================

export interface Entrevista {
  id: number;
  candidato: number;
  candidato_nombre: string;
  vacante_codigo: string;
  numero_entrevista: number;
  tipo_entrevista: TipoEntrevistaType;
  tipo_display: string;
  fecha_programada: string;
  duracion_estimada_minutos: number;
  ubicacion: string | null;
  entrevistador_principal: number;
  entrevistadores_adicionales: number[];
  estado: EstadoEntrevista;
  estado_display: string;
  fecha_realizacion: string | null;
  duracion_real_minutos: number | null;
  asistio_candidato: boolean;
  calificacion_tecnica: number | null;
  calificacion_competencias: number | null;
  calificacion_general: number | null;
  calificacion_promedio: number | null;
  fortalezas_identificadas: string | null;
  aspectos_mejorar: string | null;
  observaciones: string | null;
  recomendacion: RecomendacionEntrevista;
  recomendacion_display: string;
  notas_entrevista: string | null;
  motivo_cancelacion: string | null;
  fecha_reprogramada: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EntrevistaFormData {
  candidato: number;
  tipo_entrevista: TipoEntrevistaType;
  fecha_programada: string;
  duracion_estimada_minutos?: number;
  ubicacion?: string;
  entrevistador_principal: number;
  entrevistadores_adicionales?: number[];
  estado?: EstadoEntrevista;
  observaciones?: string;
}

// =============================================================================
// INTERFACES - Prueba
// =============================================================================

export interface Prueba {
  id: number;
  candidato: number;
  candidato_nombre: string;
  tipo_prueba: number;
  tipo_prueba_nombre: string;
  fecha_programada: string;
  fecha_realizacion: string | null;
  ubicacion: string | null;
  proveedor_externo: string | null;
  responsable: number;
  estado: EstadoPrueba;
  estado_display: string;
  calificacion: string | null;
  aprobado: boolean | null;
  puntaje_minimo_aprobacion: string | null;
  archivo_prueba: string | null;
  archivo_resultado: string | null;
  observaciones: string | null;
  recomendaciones: string | null;
  motivo_cancelacion: string | null;
  costo: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PruebaFormData {
  candidato: number;
  tipo_prueba: number;
  fecha_programada: string;
  ubicacion?: string;
  proveedor_externo?: string;
  responsable: number;
  estado?: EstadoPrueba;
  puntaje_minimo_aprobacion?: number;
  archivo_prueba?: File;
  costo?: number;
  observaciones?: string;
}

// =============================================================================
// INTERFACES - Afiliacion Seguridad Social
// =============================================================================

export interface AfiliacionSS {
  id: number;
  candidato: number;
  candidato_nombre: string;
  entidad: number;
  entidad_nombre: string;
  tipo_entidad: string;
  fecha_solicitud: string;
  fecha_afiliacion: string | null;
  numero_afiliacion: string | null;
  estado: EstadoAfiliacion;
  estado_display: string;
  responsable_tramite: number;
  documento_afiliacion: string | null;
  observaciones: string | null;
  motivo_rechazo: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AfiliacionSSFormData {
  candidato: number;
  entidad: number;
  fecha_solicitud: string;
  responsable_tramite: number;
  observaciones?: string;
}

// =============================================================================
// INTERFACES - Historial de Contratos (Ley 2466/2025)
// =============================================================================

/** HistorialContrato en vista de lista */
export interface HistorialContratoList {
  id: number;
  colaborador: number;
  colaborador_nombre: string;
  colaborador_identificacion: string;
  tipo_contrato: number;
  tipo_contrato_nombre: string;
  numero_contrato: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  salario_pactado: string;
  tipo_movimiento: TipoMovimientoContrato;
  tipo_movimiento_display: string;
  numero_renovacion: number;
  firmado: boolean;
  esta_vigente: boolean;
  dias_para_vencer: number | null;
  contrato_documento: number | null;
  created_at: string;
}

/** HistorialContrato en vista de detalle */
export interface HistorialContratoDetail extends HistorialContratoList {
  empresa: number;
  objeto_contrato: string | null;
  contrato_padre: number | null;
  justificacion_tipo_contrato: string;
  fecha_preaviso_terminacion: string | null;
  preaviso_entregado: boolean;
  fecha_firma: string | null;
  archivo_contrato: string | null;
  colaborador_info: {
    id: number;
    nombre_completo: string;
    numero_identificacion: string;
    cargo: string;
    area: string;
  };
  duracion_meses: number | null;
  warnings: string[];
  movimientos_hijos: HistorialContratoList[];
  updated_at: string;
}

export type HistorialContrato = HistorialContratoList;

export interface HistorialContratoFormData {
  colaborador: number;
  tipo_contrato: number;
  numero_contrato: string;
  fecha_inicio: string;
  fecha_fin?: string | null;
  salario_pactado: number;
  objeto_contrato?: string;
  tipo_movimiento: TipoMovimientoContrato;
  contrato_padre?: number | null;
  numero_renovacion?: number;
  justificacion_tipo_contrato?: string;
  fecha_preaviso_terminacion?: string | null;
  preaviso_entregado?: boolean;
  archivo_contrato?: File | null;
}

// =============================================================================
// INTERFACES - Pruebas Dinamicas (Form Builder)
// =============================================================================

export type TipoScoring = 'manual' | 'automatico' | 'mixto';

export type EstadoAsignacionPrueba =
  | 'pendiente'
  | 'en_progreso'
  | 'completada'
  | 'calificada'
  | 'vencida'
  | 'cancelada';

export const TIPO_SCORING_OPTIONS = [
  { value: 'manual', label: 'Calificacion Manual' },
  { value: 'automatico', label: 'Scoring Automatico' },
  { value: 'mixto', label: 'Mixto (Auto + Manual)' },
];

export const ESTADO_ASIGNACION_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_progreso', label: 'En Progreso' },
  { value: 'completada', label: 'Completada' },
  { value: 'calificada', label: 'Calificada' },
  { value: 'vencida', label: 'Vencida' },
  { value: 'cancelada', label: 'Cancelada' },
];

export const ESTADO_ASIGNACION_BADGE: Record<
  EstadoAsignacionPrueba,
  'info' | 'primary' | 'warning' | 'success' | 'danger' | 'gray'
> = {
  pendiente: 'info',
  en_progreso: 'primary',
  completada: 'warning',
  calificada: 'success',
  vencida: 'danger',
  cancelada: 'gray',
};

/** Campo del form builder para pruebas dinamicas */
export interface CampoPruebaDinamica {
  nombre_campo: string;
  etiqueta: string;
  tipo_campo: string;
  descripcion?: string;
  placeholder?: string;
  opciones?: { valor: string; etiqueta: string }[];
  es_obligatorio?: boolean;
  respuesta_correcta?: string | string[] | number;
  puntaje?: number;
  orden: number;
  ancho_columna?: number;
}

/** PlantillaPruebaDinamica en vista de lista */
export interface PlantillaPruebaList {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  tipo_scoring: TipoScoring;
  duracion_estimada_minutos: number;
  tiempo_limite_minutos: number | null;
  total_campos: number;
  puntaje_maximo: number;
  total_asignaciones: number;
  is_active: boolean;
  created_by_nombre: string;
  created_at: string;
  updated_at: string;
}

/** PlantillaPruebaDinamica en vista de detalle */
export interface PlantillaPruebaDetail extends PlantillaPruebaList {
  instrucciones: string;
  campos: CampoPruebaDinamica[];
  scoring_config: {
    puntaje_aprobacion?: number;
    penalizar_incorrectas?: boolean;
  };
  created_by: number;
}

export interface PlantillaPruebaFormData {
  nombre: string;
  descripcion?: string;
  instrucciones?: string;
  campos: CampoPruebaDinamica[];
  scoring_config?: Record<string, unknown>;
  tipo_scoring?: TipoScoring;
  categoria?: string;
  duracion_estimada_minutos?: number;
  tiempo_limite_minutos?: number | null;
}

/** AsignacionPruebaDinamica en vista de lista */
export interface AsignacionPruebaList {
  id: number;
  plantilla: number;
  plantilla_nombre: string;
  plantilla_categoria: string;
  candidato: number;
  candidato_nombre: string;
  vacante: number | null;
  vacante_titulo: string;
  vacante_codigo: string;
  token: string;
  estado: EstadoAsignacionPrueba;
  estado_display: string;
  fecha_asignacion: string;
  fecha_vencimiento: string | null;
  fecha_inicio: string | null;
  fecha_completado: string | null;
  puntaje_obtenido: string | null;
  puntaje_maximo: string | null;
  porcentaje: string | null;
  aprobado: boolean | null;
  esta_vencida: boolean;
  tiempo_transcurrido_minutos: number | null;
  email_enviado: boolean;
  asignado_por_nombre: string;
  created_at: string;
}

/** AsignacionPruebaDinamica en vista de detalle (incluye respuestas + scoring_config) */
export interface AsignacionPruebaDetail extends AsignacionPruebaList {
  respuestas: Record<string, unknown>;
  detalle_calificacion: Record<string, unknown>;
  observaciones: string;
  ip_address: string | null;
  user_agent: string;
  plantilla_campos: CampoPruebaDinamica[];
  plantilla_instrucciones: string;
  plantilla_scoring_config: Record<string, unknown>;
  updated_at: string;
}

export interface AsignacionPruebaFormData {
  plantilla: number;
  candidato: number;
  vacante?: number;
  observaciones?: string;
  dias_vencimiento?: number;
  enviar_email?: boolean;
}

/** Datos de prueba para la pagina publica (sin auth) */
export interface PruebaPublicaData {
  token: string;
  prueba_nombre: string;
  prueba_descripcion: string;
  instrucciones: string;
  duracion_estimada_minutos: number;
  tiempo_limite_minutos: number | null;
  candidato_nombre: string;
  vacante_titulo: string;
  campos: CampoPruebaDinamica[];
  fecha_inicio: string | null;
  fecha_vencimiento: string | null;
}

export interface AsignacionPruebaFilters {
  candidato?: number;
  plantilla?: number;
  estado?: EstadoAsignacionPrueba;
  page?: number;
  page_size?: number;
}

// =============================================================================
// INTERFACES - Estadisticas
// =============================================================================

export interface ProcesoSeleccionEstadisticas {
  vacantes_total: number;
  vacantes_abiertas: number;
  candidatos_total: number;
  candidatos_en_proceso: number;
  candidatos_aprobados: number;
  candidatos_contratados: number;
  candidatos_rechazados: number;
  entrevistas_programadas: number;
  entrevistas_realizadas: number;
  pruebas_pendientes: number;
  tiempo_promedio_contratacion: number;
}

// =============================================================================
// INTERFACES - Perfilamiento / Matching
// =============================================================================

export type NivelMatching = 'excelente' | 'bueno' | 'regular' | 'bajo';

export interface PerfilamientoScores {
  educacion: number;
  experiencia: number;
  salario: number;
  entrevistas: number;
  pruebas: number;
  evaluacion_hr: number;
}

export interface PerfilamientoCandidato {
  candidato_id: number;
  candidato_nombre: string;
  estado: EstadoCandidato;
  estado_display: string;
  nivel_educativo: string;
  nivel_educativo_display: string;
  anos_experiencia: number;
  pretension_salarial: string | null;
  scores: PerfilamientoScores;
  total: number;
  nivel: NivelMatching;
}

export interface PerfilamientoResponse {
  vacante_id: number;
  vacante_titulo: string;
  vacante_codigo: string;
  salario_rango: string | null;
  total_candidatos: number;
  candidatos: PerfilamientoCandidato[];
}

export const NIVEL_MATCHING_BADGE: Record<NivelMatching, 'success' | 'info' | 'warning' | 'gray'> =
  {
    excelente: 'success',
    bueno: 'info',
    regular: 'warning',
    bajo: 'gray',
  };

// =============================================================================
// INTERFACES - Filtros
// =============================================================================

export interface VacanteActivaFilters {
  estado?: EstadoVacante;
  prioridad?: PrioridadVacante;
  area?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface CandidatoFilters {
  vacante?: string;
  estado?: EstadoCandidato;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface EntrevistaFilters {
  candidato?: string;
  estado?: EstadoEntrevista;
  entrevistador?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

// =============================================================================
// INTERFACES - Entrevista Asincronica (por Email)
// =============================================================================

export type EstadoEntrevistaAsync =
  | 'pendiente'
  | 'enviada'
  | 'en_progreso'
  | 'completada'
  | 'evaluada'
  | 'vencida'
  | 'cancelada';

export interface PreguntaEntrevistaAsync {
  id: string;
  pregunta: string;
  descripcion?: string;
  tipo: 'texto_corto' | 'texto_largo' | 'opcion_multiple' | 'escala';
  obligatoria: boolean;
  opciones?: string[];
  escala_min?: number;
  escala_max?: number;
  orden: number;
}

export interface EntrevistaAsincronicaList {
  id: number;
  candidato: number;
  candidato_nombre: string;
  vacante_codigo: string;
  titulo: string;
  estado: EstadoEntrevistaAsync;
  estado_display: string;
  total_preguntas: number;
  total_respuestas: number;
  token: string;
  email_enviado: boolean;
  fecha_envio: string | null;
  fecha_vencimiento: string | null;
  fecha_completado: string | null;
  fecha_evaluacion: string | null;
  calificacion_general: number | null;
  recomendacion: RecomendacionEntrevista | null;
  recomendacion_display: string | null;
  esta_vencida: boolean;
  created_at: string;
}

export interface EntrevistaAsincronicaDetail extends EntrevistaAsincronicaList {
  preguntas: PreguntaEntrevistaAsync[];
  respuestas: Record<string, string>;
  instrucciones: string;
  evaluador: number | null;
  evaluador_nombre: string | null;
  observaciones_evaluador: string | null;
  fortalezas_identificadas: string | null;
  aspectos_mejorar: string | null;
}

export interface EntrevistaAsincronicaFormData {
  candidato: number;
  titulo: string;
  instrucciones?: string;
  preguntas: PreguntaEntrevistaAsync[];
  dias_vencimiento?: number;
  enviar_email?: boolean;
}

export interface EntrevistaAsincronicaPublicData {
  titulo: string;
  instrucciones: string;
  candidato_nombre: string;
  empresa_nombre: string;
  preguntas: PreguntaEntrevistaAsync[];
  estado: EstadoEntrevistaAsync;
  fecha_vencimiento: string | null;
}

export interface EntrevistaAsincronicaFilters {
  candidato?: string;
  estado?: EstadoEntrevistaAsync;
  search?: string;
  page?: number;
  page_size?: number;
}

export const ESTADO_ENTREVISTA_ASYNC_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'enviada', label: 'Enviada' },
  { value: 'en_progreso', label: 'En Progreso' },
  { value: 'completada', label: 'Completada' },
  { value: 'evaluada', label: 'Evaluada' },
  { value: 'vencida', label: 'Vencida' },
  { value: 'cancelada', label: 'Cancelada' },
];

export const ESTADO_ENTREVISTA_ASYNC_BADGE: Record<
  EstadoEntrevistaAsync,
  'gray' | 'info' | 'primary' | 'warning' | 'success' | 'danger'
> = {
  pendiente: 'gray',
  enviada: 'info',
  en_progreso: 'primary',
  completada: 'warning',
  evaluada: 'success',
  vencida: 'danger',
  cancelada: 'gray',
};

export const TIPO_PREGUNTA_ASYNC_OPTIONS = [
  { value: 'texto_corto', label: 'Texto Corto' },
  { value: 'texto_largo', label: 'Texto Largo' },
  { value: 'opcion_multiple', label: 'Opcion Multiple' },
  { value: 'escala', label: 'Escala Numerica' },
];

export interface PruebaFilters {
  candidato?: string;
  tipo_prueba?: string;
  estado?: EstadoPrueba;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface HistorialContratoFilters {
  colaborador?: number;
  tipo_movimiento?: TipoMovimientoContrato;
  vigentes?: boolean;
  page?: number;
  page_size?: number;
}

// =============================================================================
// INTERFACES - Sprint 20: Contratación completa (DTOs)
// =============================================================================

/** Request body para contratar un candidato aprobado */
export interface ContratarCandidatoDTO {
  fecha_contratacion: string;
  salario_ofrecido: number;
  datos_contrato?: {
    numero_contrato: string;
    tipo_contrato_id: number;
    fecha_inicio: string;
    fecha_fin?: string | null;
    objeto_contrato?: string;
    justificacion_tipo_contrato?: string;
    generar_documento?: boolean;
  };
}

/** Response de contratar candidato */
export interface ContratarCandidatoResponse {
  message: string;
  colaborador_id: number;
  colaborador_nombre: string;
  contrato_id: number | null;
  contrato_numero: string | null;
  onboarding: {
    checklist_items: number;
    modulos_asignados: number;
  } | null;
  documento_id: number | null;
}

/** Request body para renovar contrato */
export interface RenovarContratoDTO {
  fecha_inicio: string;
  fecha_fin?: string | null;
  salario_pactado: number;
  justificacion_tipo_contrato?: string;
  objeto_contrato?: string;
  generar_documento?: boolean;
}

/** Request body para crear otrosí */
export interface OtrosiDTO {
  fecha_inicio: string;
  fecha_fin?: string | null;
  salario_pactado?: number;
  justificacion_tipo_contrato: string;
  objeto_contrato?: string;
  generar_documento?: boolean;
}

/** Warnings de Ley 2466/2025 */
export interface ContratoWarnings {
  warnings: string[];
}

// =============================================================================
// INTERFACES - Respuestas API (paginadas)
// =============================================================================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// =============================================================================
// Badge Helpers
// =============================================================================

export const ESTADO_VACANTE_BADGE: Record<EstadoVacante, 'success' | 'info' | 'gray' | 'danger'> = {
  abierta: 'success',
  en_proceso: 'info',
  cerrada: 'gray',
  cancelada: 'danger',
};

export const PRIORIDAD_BADGE: Record<PrioridadVacante, 'gray' | 'info' | 'warning' | 'danger'> = {
  baja: 'gray',
  media: 'info',
  alta: 'warning',
  urgente: 'danger',
};

export const ESTADO_CANDIDATO_BADGE: Record<
  EstadoCandidato,
  'info' | 'primary' | 'warning' | 'success' | 'danger'
> = {
  postulado: 'info',
  preseleccionado: 'primary',
  en_evaluacion: 'warning',
  aprobado: 'success',
  rechazado: 'danger',
  contratado: 'success',
};

export const ESTADO_ENTREVISTA_BADGE: Record<
  EstadoEntrevista,
  'info' | 'success' | 'danger' | 'warning'
> = {
  programada: 'info',
  realizada: 'success',
  cancelada: 'danger',
  reprogramada: 'warning',
};

export const RECOMENDACION_BADGE: Record<
  RecomendacionEntrevista,
  'success' | 'info' | 'danger' | 'warning'
> = {
  contratar: 'success',
  segunda_entrevista: 'info',
  rechazar: 'danger',
  pendiente: 'warning',
};

export const TIPO_ENTREVISTA_BADGE: Record<
  TipoEntrevistaType,
  'gray' | 'info' | 'primary' | 'warning' | 'success'
> = {
  telefonica: 'gray',
  presencial: 'info',
  virtual: 'primary',
  grupal: 'warning',
  panel: 'success',
};

export const ESTADO_AFILIACION_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_proceso', label: 'En Proceso' },
  { value: 'afiliado', label: 'Afiliado' },
  { value: 'rechazado', label: 'Rechazado' },
  { value: 'cancelado', label: 'Cancelado' },
];

export const ESTADO_AFILIACION_BADGE: Record<
  EstadoAfiliacion,
  'gray' | 'info' | 'primary' | 'success' | 'danger'
> = {
  pendiente: 'gray',
  en_proceso: 'info',
  afiliado: 'success',
  rechazado: 'danger',
  cancelado: 'gray',
};

export const TIPO_MOVIMIENTO_BADGE: Record<
  TipoMovimientoContrato,
  'info' | 'primary' | 'warning' | 'success'
> = {
  contrato_inicial: 'info',
  renovacion: 'primary',
  otrosi: 'warning',
  prorroga: 'success',
};

export interface AfiliacionSSFilters {
  candidato?: number;
  estado?: EstadoAfiliacion;
  tipo_entidad?: string;
  search?: string;
  page?: number;
  page_size?: number;
}
