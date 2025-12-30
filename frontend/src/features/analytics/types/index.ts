/**
 * Types para Analytics
 */

// ==================== ENUMS ====================

export type TipoIndicador = 'eficiencia' | 'eficacia' | 'efectividad';

export type CategoriaKPI =
  | 'sst'
  | 'pesv'
  | 'ambiental'
  | 'calidad'
  | 'financiero'
  | 'operacional'
  | 'rrhh'
  | 'comercial';

export type FrecuenciaMedicion =
  | 'diario'
  | 'semanal'
  | 'quincenal'
  | 'mensual'
  | 'trimestral'
  | 'semestral'
  | 'anual';

export type PerspectivaBSC =
  | 'financiera'
  | 'cliente'
  | 'procesos'
  | 'aprendizaje'
  | 'general';

export type TipoWidget =
  | 'kpi_card'
  | 'grafico_linea'
  | 'grafico_barra'
  | 'grafico_pie'
  | 'tabla'
  | 'gauge'
  | 'mapa_calor';

export type ColorSemaforo = 'verde' | 'amarillo' | 'rojo';

export type EstadoAccion = 'pendiente' | 'en_proceso' | 'completada' | 'cancelada';

export type TipoAlerta =
  | 'umbral_rojo'
  | 'tendencia_negativa'
  | 'sin_medicion'
  | 'meta_no_cumplida';

// ==================== CONFIG INDICADORES ====================

export interface CatalogoKPI {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: CategoriaKPI;
  tipo_indicador: TipoIndicador;
  perspectiva_bsc: PerspectivaBSC;
  area?: number;
  area_nombre?: string;
  frecuencia_medicion: FrecuenciaMedicion;
  unidad_medida: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface FichaTecnicaKPI {
  id: number;
  kpi: number;
  kpi_codigo?: string;
  kpi_nombre?: string;
  formula: string;
  variables: string;
  fuente_datos: string;
  responsable_medicion: number;
  responsable_nombre?: string;
  responsable_analisis: number;
  responsable_analisis_nombre?: string;
  proceso_relacionado?: string;
  objetivo_estrategico?: string;
  interpretacion: string;
  limitaciones?: string;
  notas?: string;
  created_at: string;
  updated_at: string;
}

export interface MetaKPI {
  id: number;
  kpi: number;
  kpi_codigo?: string;
  kpi_nombre?: string;
  periodo: string;
  meta_minima: number;
  meta_esperada: number;
  meta_optima: number;
  valor_base?: number;
  justificacion?: string;
  activa: boolean;
  created_at: string;
}

export interface ConfiguracionSemaforo {
  id: number;
  kpi: number;
  kpi_codigo?: string;
  kpi_nombre?: string;
  umbral_rojo_min?: number;
  umbral_rojo_max?: number;
  umbral_amarillo_min?: number;
  umbral_amarillo_max?: number;
  umbral_verde_min?: number;
  umbral_verde_max?: number;
  logica_inversa: boolean;
  descripcion_rojo?: string;
  descripcion_amarillo?: string;
  descripcion_verde?: string;
  activa: boolean;
  created_at: string;
}

// ==================== DASHBOARD ====================

export interface VistaDashboard {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  perspectiva?: PerspectivaBSC;
  categoria?: CategoriaKPI;
  es_publica: boolean;
  creado_por: number;
  creado_por_nombre?: string;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

export interface WidgetDashboard {
  id: number;
  vista: number;
  vista_nombre?: string;
  kpi: number;
  kpi_codigo?: string;
  kpi_nombre?: string;
  tipo_widget: TipoWidget;
  posicion_fila: number;
  posicion_columna: number;
  ancho: number;
  alto: number;
  configuracion_grafico?: Record<string, unknown>;
  mostrar_tendencia: boolean;
  mostrar_meta: boolean;
  mostrar_semaforo: boolean;
  created_at: string;
}

export interface FavoritoDashboard {
  id: number;
  usuario: number;
  vista: number;
  vista_nombre?: string;
  es_predeterminado: boolean;
  orden: number;
  created_at: string;
}

// ==================== INDICADORES ====================

export interface ValorKPI {
  id: number;
  kpi: number;
  kpi_codigo?: string;
  kpi_nombre?: string;
  fecha_medicion: string;
  periodo: string;
  valor_numerico: number;
  unidad_medida?: string;
  valor_texto?: string;
  color_semaforo: ColorSemaforo;
  cumple_meta: boolean;
  meta_periodo?: number;
  variacion_anterior?: number;
  observaciones?: string;
  registrado_por: number;
  registrado_por_nombre?: string;
  evidencias?: string;
  aprobado: boolean;
  aprobado_por?: number;
  aprobado_por_nombre?: string;
  fecha_aprobacion?: string;
  created_at: string;
  updated_at: string;
}

export interface AccionPorKPI {
  id: number;
  kpi: number;
  kpi_codigo?: string;
  kpi_nombre?: string;
  valor_kpi?: number;
  titulo: string;
  descripcion: string;
  responsable: number;
  responsable_nombre?: string;
  fecha_limite: string;
  estado: EstadoAccion;
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
  fecha_cierre?: string;
  resultado?: string;
  created_at: string;
  updated_at: string;
}

export interface AlertaKPI {
  id: number;
  kpi: number;
  kpi_codigo?: string;
  kpi_nombre?: string;
  valor_kpi?: number;
  tipo_alerta: TipoAlerta;
  fecha_alerta: string;
  descripcion: string;
  severidad: 'baja' | 'media' | 'alta' | 'critica';
  notificado_a?: number[];
  fecha_notificacion?: string;
  leida: boolean;
  fecha_lectura?: string;
  accion_tomada?: number;
  created_at: string;
}

// ==================== STATS & SUMMARY TYPES ====================

export interface AnalyticsStats {
  total_kpis: number;
  kpis_activos: number;
  kpis_verde: number;
  kpis_amarillo: number;
  kpis_rojo: number;
  alertas_pendientes: number;
  acciones_pendientes: number;
  mediciones_mes: number;
}

export interface KPISummary {
  kpi: CatalogoKPI;
  ultimo_valor?: ValorKPI;
  meta_actual?: MetaKPI;
  tendencia?: 'ascendente' | 'descendente' | 'estable';
  porcentaje_cambio?: number;
  alertas_activas: number;
  acciones_pendientes: number;
}

export interface DashboardData {
  vista: VistaDashboard;
  widgets: Array<{
    widget: WidgetDashboard;
    valores: ValorKPI[];
    meta?: MetaKPI;
  }>;
  stats: AnalyticsStats;
}

// ==================== SEMANA 24 TYPES ====================

// Análisis Tendencias
export type TipoAnalisis = 'vs_meta' | 'vs_periodo_anterior' | 'vs_mejor_historico' | 'tendencia';
export type DireccionAnalisis = 'mejora' | 'deterioro' | 'estable';
export type TipoTendencia = 'lineal' | 'exponencial' | 'estacional';
export type TipoAnomalia = 'outlier' | 'cambio_brusco' | 'patron_inusual' | 'sin_datos';
export type SeveridadAnomalia = 'baja' | 'media' | 'alta' | 'critica';

export interface AnalisisKPI {
  id: number;
  kpi: number;
  kpi_codigo?: string;
  kpi_nombre?: string;
  periodo_analizado: string;
  tipo_analisis: TipoAnalisis;
  valor_actual: number;
  valor_comparacion?: number;
  variacion_absoluta?: number;
  variacion_porcentual?: number;
  direccion: DireccionAnalisis;
  cumple_meta: boolean;
  interpretacion: string;
  recomendaciones?: string;
  fecha_analisis: string;
  generado_por?: number;
  created_at: string;
}

export interface TendenciaKPI {
  id: number;
  kpi: number;
  kpi_codigo?: string;
  kpi_nombre?: string;
  periodo_inicio: string;
  periodo_fin: string;
  tipo_tendencia: TipoTendencia;
  puntos_datos: Array<{ periodo: string; valor: number }>;
  ecuacion_tendencia?: string;
  r_cuadrado?: number;
  pendiente?: number;
  intercepto?: number;
  proyeccion_siguiente?: number;
  proyeccion_trimestre?: number;
  confianza_proyeccion?: number;
  interpretacion: string;
  fecha_calculo: string;
  created_at: string;
}

export interface AnomaliaDetectada {
  id: number;
  kpi: number;
  kpi_codigo?: string;
  kpi_nombre?: string;
  valor_kpi: number;
  fecha_deteccion: string;
  periodo_anomalia: string;
  tipo_anomalia: TipoAnomalia;
  severidad: SeveridadAnomalia;
  descripcion: string;
  valor_esperado?: number;
  desviacion?: number;
  contexto?: string;
  revisada: boolean;
  revisada_por?: number;
  fecha_revision?: string;
  observaciones_revision?: string;
  created_at: string;
}

// Generador Informes
export type TipoInforme = 'normativo' | 'gerencial' | 'operativo' | 'personalizado';
export type FormatoSalida = 'pdf' | 'excel' | 'word' | 'html';
export type FrecuenciaInforme = 'diario' | 'semanal' | 'mensual' | 'trimestral' | 'semestral' | 'anual';
export type EstadoInforme = 'borrador' | 'generando' | 'completado' | 'error';

export interface PlantillaInforme {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo_informe: TipoInforme;
  formato_salida: FormatoSalida;
  seccion_portada?: Record<string, unknown>;
  secciones_contenido: Array<{
    orden: number;
    titulo: string;
    tipo_seccion: string;
    kpis_incluidos?: number[];
    configuracion?: Record<string, unknown>;
  }>;
  pie_pagina?: string;
  variables_disponibles?: string[];
  activa: boolean;
  creado_por: number;
  creado_por_nombre?: string;
  created_at: string;
  updated_at: string;
}

export interface InformeDinamico {
  id: number;
  plantilla: number;
  plantilla_nombre?: string;
  periodo: string;
  fecha_generacion?: string;
  estado: EstadoInforme;
  parametros_generacion?: Record<string, unknown>;
  archivo_generado?: string;
  url_descarga?: string;
  error_mensaje?: string;
  generado_por: number;
  generado_por_nombre?: string;
  destinatarios_email?: string[];
  enviado_email: boolean;
  fecha_envio?: string;
  created_at: string;
}

export interface ProgramacionInforme {
  id: number;
  plantilla: number;
  plantilla_nombre?: string;
  frecuencia: FrecuenciaInforme;
  dia_ejecucion?: number;
  hora_ejecucion: string;
  proxima_ejecucion: string;
  destinatarios_email: string[];
  parametros_generacion?: Record<string, unknown>;
  activa: boolean;
  ultima_ejecucion?: string;
  estado_ultima_ejecucion?: EstadoInforme;
  creado_por: number;
  creado_por_nombre?: string;
  created_at: string;
  updated_at: string;
}

export interface HistorialInforme {
  id: number;
  programacion?: number;
  informe: number;
  fecha_ejecucion: string;
  estado: EstadoInforme;
  duracion_segundos?: number;
  archivo_generado?: string;
  tamano_archivo?: number;
  error_mensaje?: string;
  created_at: string;
}

// Acciones Indicador
export type EstadoPlan = 'propuesto' | 'aprobado' | 'en_ejecucion' | 'completado' | 'cancelado';
export type PrioridadPlan = 'baja' | 'media' | 'alta' | 'critica';
export type EstadoActividad = 'pendiente' | 'en_proceso' | 'completada' | 'cancelada';
export type TipoVinculo = 'origen' | 'relacionada' | 'resultante';

export interface PlanAccionKPI {
  id: number;
  kpi: number;
  kpi_codigo?: string;
  kpi_nombre?: string;
  valor_actual: number;
  meta_objetivo: number;
  brecha: number;
  codigo_plan: string;
  titulo: string;
  descripcion: string;
  justificacion?: string;
  estado: EstadoPlan;
  prioridad: PrioridadPlan;
  fecha_inicio: string;
  fecha_fin_prevista: string;
  fecha_fin_real?: string;
  responsable: number;
  responsable_nombre?: string;
  participantes?: number[];
  presupuesto_estimado?: number;
  presupuesto_ejecutado?: number;
  resultado_esperado: string;
  resultado_obtenido?: string;
  aprobado_por?: number;
  aprobado_por_nombre?: string;
  fecha_aprobacion?: string;
  created_at: string;
  updated_at: string;
}

export interface ActividadPlanKPI {
  id: number;
  plan_accion: number;
  codigo_actividad: string;
  nombre: string;
  descripcion?: string;
  responsable: number;
  responsable_nombre?: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: EstadoActividad;
  porcentaje_avance: number;
  recursos_necesarios?: string;
  evidencias?: string;
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export interface SeguimientoPlanKPI {
  id: number;
  plan_accion: number;
  fecha_seguimiento: string;
  porcentaje_avance_general: number;
  avances_logrados: string;
  dificultades_encontradas?: string;
  acciones_correctivas?: string;
  valor_kpi_actual?: number;
  variacion_vs_inicio?: number;
  cumple_cronograma: boolean;
  proximas_acciones?: string;
  registrado_por: number;
  registrado_por_nombre?: string;
  created_at: string;
}

export interface IntegracionAccionCorrectiva {
  id: number;
  plan_accion_kpi: number;
  plan_codigo?: string;
  accion_correctiva_id?: number;
  accion_correctiva_codigo?: string;
  tipo_vinculo: TipoVinculo;
  descripcion_vinculo?: string;
  fecha_vinculacion: string;
  vinculado_por: number;
  vinculado_por_nombre?: string;
  created_at: string;
}

// Exportación
export type TipoExportacion = 'excel' | 'pdf' | 'power_bi' | 'api_externa' | 'webhook';
export type TipoLogExportacion = 'manual' | 'programada' | 'api';
export type EstadoExportacion = 'en_proceso' | 'exitoso' | 'fallido';

export interface ConfiguracionExportacion {
  id: number;
  empresa: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo_exportacion: TipoExportacion;
  kpis_incluidos: number[];
  campos_exportar?: string[];
  formato_fecha?: string;
  incluir_graficos: boolean;
  incluir_analisis: boolean;
  configuracion_destino?: Record<string, unknown>;
  activa: boolean;
  creado_por: number;
  creado_por_nombre?: string;
  created_at: string;
  updated_at: string;
}

export interface LogExportacion {
  id: number;
  configuracion?: number;
  configuracion_nombre?: string;
  tipo_log: TipoLogExportacion;
  fecha_exportacion: string;
  estado: EstadoExportacion;
  registros_exportados?: number;
  archivo_generado?: string;
  tamano_archivo?: number;
  duracion_segundos?: number;
  error_mensaje?: string;
  exportado_por?: number;
  exportado_por_nombre?: string;
  created_at: string;
}
