/**
 * Tipos TypeScript para Selección y Contratación - Talent Hub
 * Sistema de Gestión StrateKaz
 *
 * Basado en: backend/apps/talent_hub/seleccion_contratacion/models.py
 */

// =============================================================================
// ENUMS Y CHOICES
// =============================================================================

export type EstadoCandidato =
  | 'POSTULADO'
  | 'EN_REVISION'
  | 'PRESELECCIONADO'
  | 'EN_ENTREVISTAS'
  | 'EN_PRUEBAS'
  | 'VERIFICACION'
  | 'FINALISTA'
  | 'SELECCIONADO'
  | 'CONTRATADO'
  | 'RECHAZADO'
  | 'DESCARTADO'
  | 'RETIRADO';

export type EstadoEntrevista =
  | 'PROGRAMADA'
  | 'CONFIRMADA'
  | 'EN_PROGRESO'
  | 'COMPLETADA'
  | 'CANCELADA'
  | 'REPROGRAMADA'
  | 'NO_ASISTIO';

export type TipoEntrevistaType =
  | 'TELEFONICA'
  | 'VIRTUAL'
  | 'PRESENCIAL'
  | 'GRUPAL'
  | 'TECNICA'
  | 'GERENCIAL'
  | 'ASSESSMENT';

export type EstadoPrueba =
  | 'PENDIENTE'
  | 'PROGRAMADA'
  | 'EN_PROGRESO'
  | 'COMPLETADA'
  | 'CALIFICADA'
  | 'CANCELADA'
  | 'VENCIDA';

export type ResultadoPrueba =
  | 'APROBADO'
  | 'REPROBADO'
  | 'PENDIENTE'
  | 'EN_REVISION';

export type EstadoVacanteActiva =
  | 'ABIERTA'
  | 'EN_PROCESO'
  | 'CERRADA'
  | 'CANCELADA'
  | 'PAUSADA';

export type FuenteReclutamiento =
  | 'INTERNO'
  | 'PORTAL_EMPLEO'
  | 'REFERIDO'
  | 'RED_SOCIAL'
  | 'HEADHUNTER'
  | 'FERIA_EMPLEO'
  | 'UNIVERSIDAD'
  | 'OTRO';

// =============================================================================
// INTERFACES - Catálogos
// =============================================================================

export interface TipoContrato {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  requiere_duracion: boolean;
  requiere_objeto: boolean;
  color_badge: string;
  orden: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TipoEntidad {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  es_obligatorio: boolean;
  color_badge: string;
  orden: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EntidadSeguridadSocial {
  id: string;
  tipo_entidad: string;
  tipo_entidad_nombre?: string;
  codigo: string;
  nit: string;
  nombre: string;
  razon_social: string;
  direccion: string;
  telefono: string;
  email: string;
  sitio_web: string;
  cobertura_nacional: boolean;
  departamentos_cobertura: string[];
  porcentaje_aporte_empleador: string | null;
  porcentaje_aporte_empleado: string | null;
  observaciones: string;
  orden: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TipoPrueba {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  duracion_minutos: number | null;
  puntaje_maximo: number | null;
  puntaje_aprobacion: number | null;
  instrucciones: string;
  requiere_documento: boolean;
  aplica_virtual: boolean;
  color_badge: string;
  orden: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// INTERFACES - Vacante Activa
// =============================================================================

export interface VacanteActiva {
  id: string;
  empresa: string;
  codigo_vacante: string;
  titulo: string;
  descripcion: string;
  cargo: {
    id: string;
    nombre: string;
    codigo?: string;
  };
  area?: {
    id: string;
    nombre: string;
  };
  profesiograma?: {
    id: string;
    codigo: string;
    nombre: string;
  };

  // Cantidad y estado
  cantidad_posiciones: number;
  posiciones_cubiertas: number;
  estado: EstadoVacanteActiva;

  // Fechas
  fecha_apertura: string;
  fecha_cierre_estimada: string | null;
  fecha_cierre_real: string | null;

  // Publicación
  publicar_portal: boolean;
  publicar_redes: boolean;
  url_publicacion: string;

  // Responsables
  responsable_proceso: {
    id: string;
    nombre: string;
  };
  reclutador?: {
    id: string;
    nombre: string;
  };

  // Estadísticas calculadas
  total_candidatos?: number;
  candidatos_activos?: number;
  dias_abierta?: number;
  porcentaje_cubierto?: number;

  // Metadata
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface VacanteActivaFormData {
  codigo_vacante: string;
  titulo: string;
  descripcion?: string;
  cargo: string;
  area?: string;
  profesiograma?: string;
  cantidad_posiciones: number;
  estado?: EstadoVacanteActiva;
  fecha_apertura?: string;
  fecha_cierre_estimada?: string;
  publicar_portal?: boolean;
  publicar_redes?: boolean;
  url_publicacion?: string;
  responsable_proceso: string;
  reclutador?: string;
}

// =============================================================================
// INTERFACES - Candidato
// =============================================================================

export interface Candidato {
  id: string;
  empresa: string;
  vacante: {
    id: string;
    codigo_vacante: string;
    titulo: string;
  };

  // Datos personales
  tipo_documento: string;
  numero_documento: string;
  primer_nombre: string;
  segundo_nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  nombre_completo?: string;

  // Contacto
  email: string;
  telefono: string;
  telefono_alternativo: string;
  direccion: string;
  ciudad: string;
  departamento: string;

  // Proceso de selección
  estado: EstadoCandidato;
  fuente_reclutamiento: FuenteReclutamiento;
  referido_por: string;
  fecha_postulacion: string;
  fecha_ultimo_contacto: string | null;

  // Evaluación
  puntaje_cv: number | null;
  puntaje_entrevistas: string | null;
  puntaje_pruebas: string | null;
  puntaje_total: string | null;
  ranking_posicion: number | null;

  // Documentos
  cv_documento: string | null;
  foto: string | null;
  documentos_adicionales: {
    nombre: string;
    url: string;
  }[];

  // Observaciones
  observaciones: string;
  motivo_rechazo: string;

  // Entrevistas y pruebas relacionadas
  total_entrevistas?: number;
  total_pruebas?: number;
  entrevistas_pendientes?: number;
  pruebas_pendientes?: number;

  // Metadata
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface CandidatoFormData {
  vacante: string;
  tipo_documento: string;
  numero_documento: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  email: string;
  telefono: string;
  telefono_alternativo?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  estado?: EstadoCandidato;
  fuente_reclutamiento?: FuenteReclutamiento;
  referido_por?: string;
  fecha_postulacion?: string;
  observaciones?: string;
}

// =============================================================================
// INTERFACES - Entrevista
// =============================================================================

export interface Entrevista {
  id: string;
  empresa: string;
  candidato: {
    id: string;
    nombre_completo: string;
    numero_documento: string;
  };
  vacante: {
    id: string;
    codigo_vacante: string;
    titulo: string;
  };

  // Programación
  tipo_entrevista: TipoEntrevistaType;
  fecha_programada: string;
  hora_inicio: string;
  hora_fin: string | null;
  duracion_minutos: number;
  ubicacion: string;
  enlace_virtual: string;

  // Entrevistador
  entrevistador: {
    id: string;
    nombre: string;
  };
  entrevistadores_adicionales: {
    id: string;
    nombre: string;
  }[];

  // Estado y resultado
  estado: EstadoEntrevista;
  resultado: string;
  calificacion: string | null;

  // Evaluación
  evaluacion_competencias: Record<string, {
    puntaje: number;
    observacion: string;
  }>;
  fortalezas: string[];
  debilidades: string[];
  recomendacion: string;

  // Observaciones
  observaciones_previas: string;
  observaciones_entrevista: string;
  motivo_cancelacion: string;

  // Metadata
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface EntrevistaFormData {
  candidato: string;
  vacante: string;
  tipo_entrevista: TipoEntrevistaType;
  fecha_programada: string;
  hora_inicio: string;
  hora_fin?: string;
  duracion_minutos?: number;
  ubicacion?: string;
  enlace_virtual?: string;
  entrevistador: string;
  entrevistadores_adicionales?: string[];
  estado?: EstadoEntrevista;
  observaciones_previas?: string;
}

// =============================================================================
// INTERFACES - Prueba
// =============================================================================

export interface Prueba {
  id: string;
  empresa: string;
  candidato: {
    id: string;
    nombre_completo: string;
    numero_documento: string;
  };
  vacante: {
    id: string;
    codigo_vacante: string;
    titulo: string;
  };
  tipo_prueba: {
    id: string;
    codigo: string;
    nombre: string;
    categoria: string;
  };

  // Programación
  fecha_programada: string;
  fecha_realizacion: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;

  // Estado y resultado
  estado: EstadoPrueba;
  resultado: ResultadoPrueba;
  puntaje_obtenido: string | null;
  porcentaje: string | null;

  // Evaluación
  evaluador: {
    id: string;
    nombre: string;
  } | null;
  fecha_calificacion: string | null;
  observaciones_evaluador: string;

  // Documentos
  archivo_prueba: string | null;
  archivo_resultado: string | null;

  // Observaciones
  observaciones: string;
  motivo_cancelacion: string;

  // Metadata
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface PruebaFormData {
  candidato: string;
  vacante: string;
  tipo_prueba: string;
  fecha_programada: string;
  hora_inicio?: string;
  estado?: EstadoPrueba;
  observaciones?: string;
}

// =============================================================================
// INTERFACES - Afiliación Seguridad Social
// =============================================================================

export interface AfiliacionSS {
  id: string;
  empresa: string;
  candidato: {
    id: string;
    nombre_completo: string;
    numero_documento: string;
  };
  tipo_entidad: {
    id: string;
    codigo: string;
    nombre: string;
  };
  entidad: {
    id: string;
    codigo: string;
    nombre: string;
  };

  // Afiliación
  numero_afiliacion: string;
  fecha_afiliacion: string | null;
  estado_afiliacion: string;

  // Documentos
  documento_afiliacion: string | null;

  // Observaciones
  observaciones: string;

  // Metadata
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AfiliacionSSFormData {
  candidato: string;
  tipo_entidad: string;
  entidad: string;
  numero_afiliacion?: string;
  fecha_afiliacion?: string;
  estado_afiliacion?: string;
  observaciones?: string;
}

// =============================================================================
// INTERFACES - Respuestas API
// =============================================================================

export interface TipoContratoResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TipoContrato[];
}

export interface TipoEntidadResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TipoEntidad[];
}

export interface EntidadSeguridadSocialResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: EntidadSeguridadSocial[];
}

export interface TipoPruebaResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TipoPrueba[];
}

export interface VacanteActivaResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: VacanteActiva[];
}

export interface CandidatoResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Candidato[];
}

export interface EntrevistaResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Entrevista[];
}

export interface PruebaResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Prueba[];
}

// =============================================================================
// INTERFACES - Filtros
// =============================================================================

export interface VacanteActivaFilters {
  cargo?: string;
  area?: string;
  estado?: EstadoVacanteActiva;
  responsable_proceso?: string;
  search?: string;
  is_active?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface CandidatoFilters {
  vacante?: string;
  estado?: EstadoCandidato;
  fuente_reclutamiento?: FuenteReclutamiento;
  search?: string;
  is_active?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface EntrevistaFilters {
  candidato?: string;
  vacante?: string;
  entrevistador?: string;
  estado?: EstadoEntrevista;
  tipo_entrevista?: TipoEntrevistaType;
  fecha_desde?: string;
  fecha_hasta?: string;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface PruebaFilters {
  candidato?: string;
  vacante?: string;
  tipo_prueba?: string;
  estado?: EstadoPrueba;
  resultado?: ResultadoPrueba;
  fecha_desde?: string;
  fecha_hasta?: string;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

// =============================================================================
// INTERFACES - Estadísticas
// =============================================================================

export interface ProcesoSeleccionEstadisticas {
  total_vacantes_activas: number;
  vacantes_abiertas: number;
  total_candidatos: number;
  candidatos_activos: number;
  candidatos_por_estado: Record<EstadoCandidato, number>;
  entrevistas_programadas: number;
  entrevistas_hoy: number;
  pruebas_pendientes: number;
  contrataciones_mes: number;
  tiempo_promedio_contratacion: number;
  tasa_conversion: number;
  candidatos_por_fuente: Record<FuenteReclutamiento, number>;
}

// =============================================================================
// HISTORIAL DE CONTRATOS - Ley 2466/2025
// =============================================================================

export type TipoMovimientoContrato =
  | 'contrato_inicial'
  | 'renovacion'
  | 'otrosi'
  | 'prorroga';

export interface HistorialContrato {
  id: number;
  empresa: number;
  colaborador: number;
  colaborador_nombre?: string;
  tipo_contrato: number;
  tipo_contrato_nombre?: string;
  numero_contrato: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  salario_pactado: string;
  objeto_contrato: string;
  tipo_movimiento: TipoMovimientoContrato;
  tipo_movimiento_display?: string;
  contrato_padre: number | null;
  numero_renovacion: number;
  justificacion_tipo_contrato: string;
  fecha_preaviso_terminacion: string | null;
  preaviso_entregado: boolean;
  firmado: boolean;
  fecha_firma: string | null;
  archivo_contrato: string | null;
  // Propiedades calculadas
  esta_vigente?: boolean;
  dias_para_vencer?: number | null;
  duracion_meses?: number | null;
  // Warnings Ley 2466/2025
  warnings?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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
  firmado?: boolean;
  fecha_firma?: string | null;
  archivo_contrato?: File | null;
}

export interface HistorialContratoFilter {
  empresa_id?: number;
  colaborador?: number;
  tipo_contrato?: number;
  tipo_movimiento?: TipoMovimientoContrato;
  firmado?: boolean;
  fecha_inicio?: string;
  fecha_fin?: string;
}

export const tipoMovimientoContratoOptions = [
  { value: 'contrato_inicial', label: 'Contrato Inicial' },
  { value: 'renovacion', label: 'Renovacion' },
  { value: 'otrosi', label: 'Otrosi' },
  { value: 'prorroga', label: 'Prorroga' },
];
