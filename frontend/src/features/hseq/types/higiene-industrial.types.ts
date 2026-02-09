/**
 * Tipos TypeScript para Módulo de Higiene Industrial - HSEQ Management
 * Sistema de Gestión StrateKaz
 *
 * Incluye:
 * - Tipos de Agentes y Agentes de Riesgo
 * - Grupos de Exposición Similar (GES)
 * - Puntos de Medición
 * - Mediciones Ambientales
 * - Controles de Exposición
 * - Monitoreo Biológico
 */

// ==================== ENUMS Y TIPOS ====================

// Tipo de Agente
export type CategoriaAgente =
  | 'FISICO'
  | 'QUIMICO'
  | 'BIOLOGICO'
  | 'ERGONOMICO'
  | 'PSICOSOCIAL';

// Medición Ambiental
export type EstadoMedicion =
  | 'PLANIFICADA'
  | 'EN_PROCESO'
  | 'COMPLETADA'
  | 'REVISADA'
  | 'APROBADA'
  | 'CANCELADA';

export type CumplimientoMedicion = 'CUMPLE' | 'NO_CUMPLE' | 'PENDIENTE';

// Control de Exposición
export type JerarquiaControl =
  | 'ELIMINACION'
  | 'SUSTITUCION'
  | 'CONTROLES_INGENIERIA'
  | 'CONTROLES_ADMINISTRATIVOS'
  | 'EPP';

export type TipoControl = 'FUENTE' | 'MEDIO' | 'INDIVIDUO';

export type EstadoControl =
  | 'PLANIFICADO'
  | 'EN_IMPLEMENTACION'
  | 'IMPLEMENTADO'
  | 'EN_MANTENIMIENTO'
  | 'SUSPENDIDO'
  | 'RETIRADO';

// Monitoreo Biológico
export type TipoExamen =
  | 'INGRESO'
  | 'PERIODICO'
  | 'RETIRO'
  | 'POST_INCAPACIDAD'
  | 'REUBICACION';

export type ResultadoExamen =
  | 'APTO'
  | 'APTO_CON_RECOMENDACIONES'
  | 'NO_APTO'
  | 'PENDIENTE';

// ==================== TIPO DE AGENTE ====================

export interface TipoAgente {
  id: number;
  empresa_id: number;
  codigo: string;
  nombre: string;
  categoria: CategoriaAgente;
  categoria_display?: string;
  descripcion: string;
  normativa_aplicable: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface TipoAgenteList {
  id: number;
  codigo: string;
  nombre: string;
  categoria: CategoriaAgente;
  categoria_display?: string;
  normativa_aplicable: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== AGENTE DE RIESGO ====================

export interface AgenteRiesgo {
  id: number;
  empresa_id: number;
  tipo_agente: number;
  tipo_agente_nombre?: string;
  tipo_agente_categoria?: CategoriaAgente;
  codigo: string;
  nombre: string;
  descripcion: string;
  limite_permisible: string | null;
  unidad_medida: string;
  tiempo_exposicion_referencia: string;
  efectos_salud: string;
  via_respiratoria: boolean;
  via_dermica: boolean;
  via_digestiva: boolean;
  via_parenteral: boolean;
  normativa_referencia: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface AgenteRiesgoList {
  id: number;
  tipo_agente: number;
  tipo_agente_nombre?: string;
  codigo: string;
  nombre: string;
  limite_permisible: string | null;
  unidad_medida: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== GRUPO DE EXPOSICIÓN SIMILAR ====================

export interface GrupoExposicionSimilar {
  id: number;
  empresa_id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  area: string;
  proceso: string;
  numero_trabajadores: number;
  agentes_riesgo: number[];
  agentes_riesgo_nombres?: string[];
  horas_dia: string;
  dias_semana: number;
  observaciones: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface GrupoExposicionSimilarList {
  id: number;
  codigo: string;
  nombre: string;
  area: string;
  proceso: string;
  numero_trabajadores: number;
  agentes_riesgo_count?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== PUNTO DE MEDICIÓN ====================

export interface PuntoMedicion {
  id: number;
  empresa_id: number;
  codigo: string;
  nombre: string;
  area: string;
  seccion: string;
  coordenadas_x: string | null;
  coordenadas_y: string | null;
  coordenadas_z: string | null;
  grupo_exposicion: number | null;
  grupo_exposicion_nombre?: string;
  descripcion: string;
  observaciones: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface PuntoMedicionList {
  id: number;
  codigo: string;
  nombre: string;
  area: string;
  seccion: string;
  grupo_exposicion_nombre?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== MEDICIÓN AMBIENTAL ====================

export interface MedicionAmbiental {
  id: number;
  empresa_id: number;
  numero_medicion: string;
  agente_riesgo: number;
  agente_riesgo_nombre?: string;
  punto_medicion: number;
  punto_medicion_nombre?: string;
  grupo_exposicion: number | null;
  grupo_exposicion_nombre?: string;
  fecha_medicion: string;
  hora_inicio: string;
  hora_fin: string | null;
  duracion_minutos: number | null;
  valor_medido: string;
  unidad_medida: string;
  limite_permisible_aplicable: string | null;
  cumplimiento: CumplimientoMedicion;
  cumplimiento_display?: string;
  porcentaje_limite: string | null;
  temperatura_ambiente: string | null;
  humedad_relativa: string | null;
  presion_atmosferica: string | null;
  equipo_utilizado: string;
  numero_serie: string;
  fecha_calibracion: string | null;
  realizado_por: string;
  licencia_profesional: string;
  estado: EstadoMedicion;
  estado_display?: string;
  observaciones: string;
  recomendaciones: string;
  informe_adjunto: string;
  fecha_proxima_medicion: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface MedicionAmbientalList {
  id: number;
  numero_medicion: string;
  agente_riesgo_nombre?: string;
  punto_medicion_nombre?: string;
  fecha_medicion: string;
  valor_medido: string;
  unidad_medida: string;
  cumplimiento: CumplimientoMedicion;
  cumplimiento_display?: string;
  porcentaje_limite: string | null;
  estado: EstadoMedicion;
  estado_display?: string;
  created_at: string;
  updated_at: string;
}

// ==================== CONTROL DE EXPOSICIÓN ====================

export interface ControlExposicion {
  id: number;
  empresa_id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  jerarquia_control: JerarquiaControl;
  jerarquia_control_display?: string;
  tipo_control: TipoControl;
  tipo_control_display?: string;
  agente_riesgo: number;
  agente_riesgo_nombre?: string;
  area_aplicacion: string;
  grupos_exposicion: number[];
  grupos_exposicion_nombres?: string[];
  puntos_medicion: number[];
  puntos_medicion_nombres?: string[];
  fecha_implementacion: string | null;
  responsable_implementacion: string;
  efectividad_esperada: string | null;
  efectividad_medida: string | null;
  fecha_medicion_efectividad: string | null;
  requiere_mantenimiento: boolean;
  frecuencia_mantenimiento: string;
  fecha_ultimo_mantenimiento: string | null;
  fecha_proximo_mantenimiento: string | null;
  costo_implementacion: string | null;
  costo_mantenimiento_anual: string | null;
  estado: EstadoControl;
  estado_display?: string;
  observaciones: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface ControlExposicionList {
  id: number;
  codigo: string;
  nombre: string;
  jerarquia_control: JerarquiaControl;
  jerarquia_control_display?: string;
  tipo_control: TipoControl;
  tipo_control_display?: string;
  agente_riesgo_nombre?: string;
  area_aplicacion: string;
  estado: EstadoControl;
  estado_display?: string;
  efectividad_medida: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== MONITOREO BIOLÓGICO ====================

export interface MonitoreoBiologico {
  id: number;
  empresa_id: number;
  numero_examen: string;
  trabajador_nombre: string;
  trabajador_identificacion: string;
  trabajador_cargo: string;
  grupo_exposicion: number | null;
  grupo_exposicion_nombre?: string;
  agentes_riesgo: number[];
  agentes_riesgo_nombres?: string[];
  tipo_examen: TipoExamen;
  tipo_examen_display?: string;
  fecha_examen: string;
  examenes_realizados: string;
  indicador_biologico: string;
  valor_medido: string | null;
  unidad_medida: string;
  valor_referencia: string;
  resultado: ResultadoExamen;
  resultado_display?: string;
  hallazgos: string;
  recomendaciones: string;
  restricciones: string;
  medico_responsable: string;
  licencia_medica: string;
  ips_entidad: string;
  requiere_seguimiento: boolean;
  fecha_proximo_examen: string | null;
  informe_adjunto: string;
  observaciones: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface MonitoreoBiologicoList {
  id: number;
  numero_examen: string;
  trabajador_nombre: string;
  trabajador_identificacion: string;
  trabajador_cargo: string;
  tipo_examen: TipoExamen;
  tipo_examen_display?: string;
  fecha_examen: string;
  resultado: ResultadoExamen;
  resultado_display?: string;
  requiere_seguimiento: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== DTOs - CREATE ====================

export interface CreateTipoAgenteDTO {
  codigo: string;
  nombre: string;
  categoria: CategoriaAgente;
  descripcion?: string;
  normativa_aplicable?: string;
}

export interface CreateAgenteRiesgoDTO {
  tipo_agente: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  limite_permisible?: number;
  unidad_medida?: string;
  tiempo_exposicion_referencia?: string;
  efectos_salud?: string;
  via_respiratoria?: boolean;
  via_dermica?: boolean;
  via_digestiva?: boolean;
  via_parenteral?: boolean;
  normativa_referencia?: string;
}

export interface CreateGrupoExposicionSimilarDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  area?: string;
  proceso?: string;
  numero_trabajadores?: number;
  agentes_riesgo?: number[];
  horas_dia?: number;
  dias_semana?: number;
  observaciones?: string;
}

export interface CreatePuntoMedicionDTO {
  codigo: string;
  nombre: string;
  area: string;
  seccion?: string;
  coordenadas_x?: number;
  coordenadas_y?: number;
  coordenadas_z?: number;
  grupo_exposicion?: number;
  descripcion?: string;
  observaciones?: string;
}

export interface CreateMedicionAmbientalDTO {
  numero_medicion: string;
  agente_riesgo: number;
  punto_medicion: number;
  grupo_exposicion?: number;
  fecha_medicion: string;
  hora_inicio: string;
  hora_fin?: string;
  duracion_minutos?: number;
  valor_medido: number;
  unidad_medida: string;
  limite_permisible_aplicable?: number;
  temperatura_ambiente?: number;
  humedad_relativa?: number;
  presion_atmosferica?: number;
  equipo_utilizado?: string;
  numero_serie?: string;
  fecha_calibracion?: string;
  realizado_por?: string;
  licencia_profesional?: string;
  estado?: EstadoMedicion;
  observaciones?: string;
  recomendaciones?: string;
}

export interface CreateControlExposicionDTO {
  codigo: string;
  nombre: string;
  descripcion: string;
  jerarquia_control: JerarquiaControl;
  tipo_control: TipoControl;
  agente_riesgo: number;
  area_aplicacion?: string;
  grupos_exposicion?: number[];
  puntos_medicion?: number[];
  fecha_implementacion?: string;
  responsable_implementacion?: string;
  efectividad_esperada?: number;
  requiere_mantenimiento?: boolean;
  frecuencia_mantenimiento?: string;
  costo_implementacion?: number;
  costo_mantenimiento_anual?: number;
  estado?: EstadoControl;
  observaciones?: string;
}

export interface CreateMonitoreoBiologicoDTO {
  numero_examen: string;
  trabajador_nombre: string;
  trabajador_identificacion: string;
  trabajador_cargo?: string;
  grupo_exposicion?: number;
  agentes_riesgo?: number[];
  tipo_examen: TipoExamen;
  fecha_examen: string;
  examenes_realizados: string;
  indicador_biologico?: string;
  valor_medido?: number;
  unidad_medida?: string;
  valor_referencia?: string;
  resultado?: ResultadoExamen;
  hallazgos?: string;
  recomendaciones?: string;
  restricciones?: string;
  medico_responsable?: string;
  licencia_medica?: string;
  ips_entidad?: string;
  requiere_seguimiento?: boolean;
  fecha_proximo_examen?: string;
  observaciones?: string;
}

// ==================== DTOs - UPDATE ====================

export interface UpdateTipoAgenteDTO extends Partial<CreateTipoAgenteDTO> {
  is_active?: boolean;
}

export interface UpdateAgenteRiesgoDTO extends Partial<CreateAgenteRiesgoDTO> {
  is_active?: boolean;
}

export interface UpdateGrupoExposicionSimilarDTO extends Partial<CreateGrupoExposicionSimilarDTO> {
  is_active?: boolean;
}

export interface UpdatePuntoMedicionDTO extends Partial<CreatePuntoMedicionDTO> {
  is_active?: boolean;
}

export interface UpdateMedicionAmbientalDTO extends Partial<CreateMedicionAmbientalDTO> {
  cumplimiento?: CumplimientoMedicion;
  porcentaje_limite?: number;
  fecha_proxima_medicion?: string;
  is_active?: boolean;
}

export interface UpdateControlExposicionDTO extends Partial<CreateControlExposicionDTO> {
  efectividad_medida?: number;
  fecha_medicion_efectividad?: string;
  fecha_ultimo_mantenimiento?: string;
  fecha_proximo_mantenimiento?: string;
  is_active?: boolean;
}

export interface UpdateMonitoreoBiologicoDTO extends Partial<CreateMonitoreoBiologicoDTO> {
  is_active?: boolean;
}

// ==================== RESPONSE TYPES ====================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface EstadisticasMediciones {
  total_mediciones: number;
  por_estado: Record<EstadoMedicion, number>;
  por_cumplimiento: Record<CumplimientoMedicion, number>;
  mediciones_recientes: MedicionAmbientalList[];
  proximas_mediciones: MedicionAmbientalList[];
}

export interface EstadisticasControles {
  total_controles: number;
  por_jerarquia: Record<JerarquiaControl, number>;
  por_estado: Record<EstadoControl, number>;
  efectividad_promedio: number;
  controles_mantenimiento_pendiente: ControlExposicionList[];
}

export interface EstadisticasMonitoreo {
  total_examenes: number;
  por_tipo: Record<TipoExamen, number>;
  por_resultado: Record<ResultadoExamen, number>;
  examenes_vencidos: MonitoreoBiologicoList[];
  proximos_examenes: MonitoreoBiologicoList[];
  trabajadores_seguimiento: number;
}
