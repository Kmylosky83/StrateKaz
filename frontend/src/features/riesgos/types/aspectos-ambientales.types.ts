/**
 * Tipos para Aspectos Ambientales - ISO 14001
 * Sistema de Gestión Ambiental
 *
 * Sincronizado con backend: apps/motor_riesgos/aspectos_ambientales/
 * Fecha sincronización: 2026-03-05
 */

// ============================================
// ENUMS — Exactos del backend models.py
// ============================================

/** CategoriaAspecto.TIPO_CHOICES */
export enum TipoAspecto {
  EMISION = 'EMISION',
  VERTIMIENTO = 'VERTIMIENTO',
  RESIDUO = 'RESIDUO',
  CONSUMO_RECURSO = 'CONSUMO_RECURSO',
  CONTAMINACION_SUELO = 'CONTAMINACION_SUELO',
  RUIDO_VIBRACION = 'RUIDO_VIBRACION',
  BIODIVERSIDAD = 'BIODIVERSIDAD',
  ENERGIA = 'ENERGIA',
  OTRO = 'OTRO',
}

/** AspectoAmbiental.CONDICION_CHOICES */
export enum CondicionOperacion {
  NORMAL = 'NORMAL',
  ANORMAL = 'ANORMAL',
  EMERGENCIA = 'EMERGENCIA',
}

/** AspectoAmbiental.TIEMPO_CHOICES */
export enum TiempoVerbo {
  PASADO = 'PASADO',
  PRESENTE = 'PRESENTE',
  FUTURO = 'FUTURO',
}

/** AspectoAmbiental.SIGNIFICANCIA_CHOICES */
export enum Significancia {
  NO_SIGNIFICATIVO = 'NO_SIGNIFICATIVO',
  SIGNIFICATIVO = 'SIGNIFICATIVO',
  CRITICO = 'CRITICO',
}

/** AspectoAmbiental.ESTADO_CHOICES */
export enum EstadoAspecto {
  BORRADOR = 'BORRADOR',
  VIGENTE = 'VIGENTE',
  EN_REVISION = 'EN_REVISION',
  OBSOLETO = 'OBSOLETO',
}

/** ImpactoAmbiental.COMPONENTE_CHOICES */
export enum ComponenteAmbiental {
  AIRE = 'AIRE',
  AGUA = 'AGUA',
  SUELO = 'SUELO',
  FLORA = 'FLORA',
  FAUNA = 'FAUNA',
  PAISAJE = 'PAISAJE',
  SOCIAL = 'SOCIAL',
  ECONOMICO = 'ECONOMICO',
}

/** ImpactoAmbiental.tipo_impacto + AspectoAmbiental.tipo_impacto */
export enum TipoImpacto {
  NEGATIVO = 'NEGATIVO',
  POSITIVO = 'POSITIVO',
}

/** ImpactoAmbiental.MAGNITUD_CHOICES */
export enum MagnitudImpacto {
  MUY_BAJA = 'MUY_BAJA',
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  MUY_ALTA = 'MUY_ALTA',
}

/** ImpactoAmbiental.duracion choices */
export enum DuracionImpacto {
  TEMPORAL = 'TEMPORAL',
  MEDIO_PLAZO = 'MEDIO_PLAZO',
  PERMANENTE = 'PERMANENTE',
}

/** ImpactoAmbiental.extension choices */
export enum ExtensionImpacto {
  PUNTUAL = 'PUNTUAL',
  LOCAL = 'LOCAL',
  REGIONAL = 'REGIONAL',
  NACIONAL = 'NACIONAL',
}

/** ProgramaAmbiental.ESTADO_CHOICES */
export enum EstadoPrograma {
  PLANIFICADO = 'PLANIFICADO',
  EN_EJECUCION = 'EN_EJECUCION',
  COMPLETADO = 'COMPLETADO',
  SUSPENDIDO = 'SUSPENDIDO',
  CANCELADO = 'CANCELADO',
}

/** ProgramaAmbiental.TIPO_PROGRAMA_CHOICES */
export enum TipoPrograma {
  PREVENCION = 'PREVENCION',
  MITIGACION = 'MITIGACION',
  COMPENSACION = 'COMPENSACION',
  MEJORAMIENTO = 'MEJORAMIENTO',
  CUMPLIMIENTO = 'CUMPLIMIENTO',
}

/** ProgramaAmbiental.eficacia choices */
export enum EficaciaPrograma {
  NO_EVALUADO = 'NO_EVALUADO',
  EFICAZ = 'EFICAZ',
  PARCIALMENTE_EFICAZ = 'PARCIALMENTE_EFICAZ',
  NO_EFICAZ = 'NO_EFICAZ',
}

/** MonitoreoAmbiental.TIPO_MONITOREO_CHOICES */
export enum TipoMonitoreo {
  EMISION_ATMOSFERICA = 'EMISION_ATMOSFERICA',
  CALIDAD_AGUA = 'CALIDAD_AGUA',
  VERTIMIENTO = 'VERTIMIENTO',
  RUIDO = 'RUIDO',
  RESIDUOS = 'RESIDUOS',
  CONSUMO_AGUA = 'CONSUMO_AGUA',
  CONSUMO_ENERGIA = 'CONSUMO_ENERGIA',
  CONSUMO_COMBUSTIBLE = 'CONSUMO_COMBUSTIBLE',
  BIODIVERSIDAD = 'BIODIVERSIDAD',
  SUELO = 'SUELO',
  OTRO = 'OTRO',
}

/** MonitoreoAmbiental.FRECUENCIA_CHOICES */
export enum FrecuenciaMonitoreo {
  DIARIA = 'DIARIA',
  SEMANAL = 'SEMANAL',
  MENSUAL = 'MENSUAL',
  TRIMESTRAL = 'TRIMESTRAL',
  SEMESTRAL = 'SEMESTRAL',
  ANUAL = 'ANUAL',
  EVENTUAL = 'EVENTUAL',
}

/** MonitoreoAmbiental.CUMPLIMIENTO_CHOICES */
export enum CumplimientoMonitoreo {
  CUMPLE = 'CUMPLE',
  NO_CUMPLE = 'NO_CUMPLE',
  NO_APLICA = 'NO_APLICA',
}

// ============================================
// CATEGORIA ASPECTO
// Serializer: CategoriaAspectoSerializer
// ============================================

/** CategoriaAspectoSerializer — fields completos */
export interface CategoriaAspecto {
  id: number;
  codigo: string;
  tipo: TipoAspecto;
  nombre: string;
  descripcion: string;
  impactos_asociados: string;
  requisitos_legales: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Campos escriturables de CategoriaAspectoSerializer */
export interface CategoriaAspectoCreate {
  codigo: string;
  tipo: TipoAspecto;
  nombre: string;
  descripcion?: string;
  impactos_asociados?: string;
  requisitos_legales?: string;
  is_active?: boolean;
}

export type CategoriaAspectoUpdate = Partial<CategoriaAspectoCreate>;

// ============================================
// ASPECTO AMBIENTAL
// Serializers: AspectoAmbientalListSerializer, AspectoAmbientalDetailSerializer
// ============================================

/** AspectoAmbientalListSerializer — listado */
export interface AspectoAmbientalList {
  id: number;
  codigo: string;
  categoria: number;
  categoria_nombre: string;
  proceso: string;
  actividad: string;
  condicion_operacion: CondicionOperacion;
  significancia: Significancia;
  valor_significancia: number;
  estado: EstadoAspecto;
  fecha_identificacion: string;
  total_impactos: number;
  empresa_id: number;
  created_at: string;
  created_by: number;
  created_by_nombre: string;
}

/** AspectoAmbientalDetailSerializer — fields='__all__' + computed */
export interface AspectoAmbiental {
  id: number;
  codigo: string;
  categoria: number;
  categoria_nombre: string;
  proceso: string;
  actividad: string;
  descripcion_aspecto: string;

  // Condición y temporalidad
  condicion_operacion: CondicionOperacion;
  tiempo_verbo: TiempoVerbo;

  // Criterios de evaluación (escala 1-5)
  frecuencia: number;
  severidad: number;
  probabilidad: number;
  alcance: number;
  reversibilidad: number;

  // Booleanos
  cumplimiento_legal: boolean;
  quejas_comunidad: boolean;

  // Cálculos automáticos (read-only)
  valor_significancia: number;
  significancia: Significancia;

  // Impactos asociados
  descripcion_impacto: string;
  tipo_impacto: TipoImpacto;

  // Controles existentes
  controles_actuales: string;
  procedimientos_asociados: string;
  areas_afectadas: string;
  requisito_legal_aplicable: string;

  // Gestión
  estado: EstadoAspecto;
  fecha_identificacion: string;
  proxima_evaluacion: string | null;

  // Multi-tenancy
  empresa_id: number;

  // Audit
  created_at: string;
  updated_at: string;
  created_by: number;
  created_by_nombre: string;
  updated_by: number | null;
  is_active: boolean;

  // Relaciones computadas (DetailSerializer)
  impactos: ImpactoAmbiental[];
  nivel_prioridad: string;
}

/** Campos escriturables para crear un AspectoAmbiental */
export interface AspectoAmbientalCreate {
  codigo: string;
  categoria: number;
  proceso: string;
  actividad: string;
  descripcion_aspecto: string;
  condicion_operacion?: CondicionOperacion;
  tiempo_verbo?: TiempoVerbo;
  frecuencia: number;
  severidad: number;
  probabilidad: number;
  alcance?: number;
  reversibilidad?: number;
  cumplimiento_legal?: boolean;
  quejas_comunidad?: boolean;
  descripcion_impacto: string;
  tipo_impacto?: TipoImpacto;
  controles_actuales?: string;
  procedimientos_asociados?: string;
  areas_afectadas?: string;
  requisito_legal_aplicable?: string;
  estado?: EstadoAspecto;
  fecha_identificacion: string;
  proxima_evaluacion?: string | null;
}

export type AspectoAmbientalUpdate = Partial<AspectoAmbientalCreate>;

export interface AspectoAmbientalFilter {
  categoria?: number;
  condicion_operacion?: CondicionOperacion;
  significancia?: Significancia;
  estado?: EstadoAspecto;
  cumplimiento_legal?: boolean;
  proceso?: string;
  search?: string;
}

// ============================================
// IMPACTO AMBIENTAL
// Serializer: ImpactoAmbientalSerializer
// ============================================

/** ImpactoAmbientalSerializer — todos los campos */
export interface ImpactoAmbiental {
  id: number;
  aspecto: number;
  aspecto_codigo: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  componente_ambiental: ComponenteAmbiental;
  tipo_impacto: TipoImpacto;
  magnitud: MagnitudImpacto;
  duracion: DuracionImpacto;
  extension: ExtensionImpacto;
  valor_cuantitativo: string | null; // DecimalField → string
  unidad_medida: string;
  medidas_control: string;
  empresa_id: number;
  created_at: string;
  updated_at: string;
  created_by: number;
  created_by_nombre: string;
}

/** Campos escriturables para crear un ImpactoAmbiental */
export interface ImpactoAmbientalCreate {
  aspecto: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  componente_ambiental: ComponenteAmbiental;
  tipo_impacto?: TipoImpacto;
  magnitud: MagnitudImpacto;
  duracion: DuracionImpacto;
  extension: ExtensionImpacto;
  valor_cuantitativo?: string | null;
  unidad_medida?: string;
  medidas_control?: string;
}

export type ImpactoAmbientalUpdate = Partial<ImpactoAmbientalCreate>;

export interface ImpactoAmbientalFilter {
  aspecto?: number;
  componente?: ComponenteAmbiental;
}

// ============================================
// PROGRAMA AMBIENTAL
// Serializers: ProgramaAmbientalListSerializer, ProgramaAmbientalDetailSerializer
// ============================================

/** ProgramaAmbientalListSerializer — listado */
export interface ProgramaAmbientalList {
  id: number;
  codigo: string;
  nombre: string;
  tipo_programa: TipoPrograma;
  responsable: number | null;
  responsable_nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: EstadoPrograma;
  porcentaje_avance: number;
  total_aspectos: number;
  duracion_dias: number | null;
  is_vencido: boolean;
  empresa_id: number;
  created_at: string;
  updated_at: string;
}

/** ProgramaAmbientalDetailSerializer — fields='__all__' + computed */
export interface ProgramaAmbiental {
  id: number;
  codigo: string;
  nombre: string;
  objetivo: string;
  tipo_programa: TipoPrograma;

  // Aspectos relacionados
  aspectos_relacionados: number[];
  aspectos_relacionados_detalle: AspectoAmbientalList[];

  // Responsabilidades
  responsable: number | null;
  responsable_nombre: string;
  equipo_apoyo: number[];
  equipo_apoyo_nombres: string[];

  // Planificación
  fecha_inicio: string;
  fecha_fin: string;
  actividades: string;

  // Metas e indicadores
  metas: string;
  indicadores_medicion: string;

  // Recursos
  presupuesto: string | null; // DecimalField → string
  recursos_necesarios: string;

  // Seguimiento
  estado: EstadoPrograma;
  porcentaje_avance: number;
  observaciones: string;

  // Resultados
  fecha_completado: string | null;
  resultados_obtenidos: string;
  eficacia: EficaciaPrograma;

  // Multi-tenancy
  empresa_id: number;

  // Audit
  created_at: string;
  updated_at: string;
  created_by: number;
  created_by_nombre: string;
  updated_by: number | null;
  is_active: boolean;

  // Computed
  duracion_dias: number | null;
  is_vencido: boolean;
}

/** Campos escriturables para crear un ProgramaAmbiental */
export interface ProgramaAmbientalCreate {
  codigo: string;
  nombre: string;
  objetivo: string;
  tipo_programa: TipoPrograma;
  aspectos_relacionados?: number[];
  responsable?: number | null;
  equipo_apoyo?: number[];
  fecha_inicio: string;
  fecha_fin: string;
  actividades: string;
  metas: string;
  indicadores_medicion?: string;
  presupuesto?: string | null;
  recursos_necesarios?: string;
  estado?: EstadoPrograma;
  porcentaje_avance?: number;
  observaciones?: string;
  fecha_completado?: string | null;
  resultados_obtenidos?: string;
  eficacia?: EficaciaPrograma;
}

export type ProgramaAmbientalUpdate = Partial<ProgramaAmbientalCreate>;

export interface ProgramaAmbientalFilter {
  tipo_programa?: TipoPrograma;
  estado?: EstadoPrograma;
  responsable?: number;
  search?: string;
}

// ============================================
// MONITOREO AMBIENTAL
// Serializer: MonitoreoAmbientalSerializer
// ============================================

/** MonitoreoAmbientalSerializer — todos los campos */
export interface MonitoreoAmbiental {
  id: number;
  codigo: string;
  tipo_monitoreo: TipoMonitoreo;
  aspecto_relacionado: number | null;
  aspecto_codigo: string;
  programa_relacionado: number | null;
  programa_nombre: string;
  ubicacion: string;
  fecha_monitoreo: string;
  hora_monitoreo: string | null;
  frecuencia_requerida: FrecuenciaMonitoreo;
  parametro_medido: string;
  valor_medido: string; // DecimalField → string
  unidad_medida: string;
  valor_referencia: string | null; // DecimalField → string
  cumplimiento: CumplimientoMonitoreo;
  normatividad_aplicable: string;
  metodo_medicion: string;
  equipo_utilizado: string;
  responsable_medicion: number | null;
  responsable_nombre: string;
  laboratorio_externo: string;
  numero_informe: string;
  observaciones: string;
  acciones_tomadas: string;
  evidencia_fotografica: string;
  archivo_adjunto: string;
  porcentaje_cumplimiento: string | null; // DecimalField → string
  requiere_accion: boolean;
  empresa_id: number;
  created_at: string;
  updated_at: string;
  created_by: number;
  created_by_nombre: string;
}

/** Campos escriturables para crear un MonitoreoAmbiental */
export interface MonitoreoAmbientalCreate {
  codigo: string;
  tipo_monitoreo: TipoMonitoreo;
  aspecto_relacionado?: number | null;
  programa_relacionado?: number | null;
  ubicacion: string;
  fecha_monitoreo: string;
  hora_monitoreo?: string | null;
  frecuencia_requerida: FrecuenciaMonitoreo;
  parametro_medido: string;
  valor_medido: string;
  unidad_medida: string;
  valor_referencia?: string | null;
  cumplimiento: CumplimientoMonitoreo;
  normatividad_aplicable?: string;
  metodo_medicion?: string;
  equipo_utilizado?: string;
  responsable_medicion?: number | null;
  laboratorio_externo?: string;
  numero_informe?: string;
  observaciones?: string;
  acciones_tomadas?: string;
  evidencia_fotografica?: string;
  archivo_adjunto?: string;
}

export type MonitoreoAmbientalUpdate = Partial<MonitoreoAmbientalCreate>;

export interface MonitoreoAmbientalFilter {
  tipo_monitoreo?: TipoMonitoreo;
  aspecto?: number;
  programa?: number;
  cumplimiento?: CumplimientoMonitoreo;
  tipo?: TipoMonitoreo;
  fecha_inicio?: string;
  fecha_fin?: string;
}

// ============================================
// RESÚMENES Y ESTADÍSTICAS
// ============================================

export interface ResumenAspectosAmbientales {
  total: number;
  por_significancia: Array<{ significancia: Significancia; cantidad: number }>;
  por_estado: Array<{ estado: EstadoAspecto; cantidad: number }>;
  por_categoria: Array<{ categoria__nombre: string; cantidad: number }>;
  por_condicion: Array<{ condicion_operacion: CondicionOperacion; cantidad: number }>;
}

export interface ResumenProgramasAmbientales {
  total: number;
  por_estado: Array<{ estado: EstadoPrograma; cantidad: number }>;
  por_tipo: Array<{ tipo_programa: TipoPrograma; cantidad: number }>;
}

export interface ResumenMonitoreosAmbientales {
  total: number;
  por_tipo: Array<{ tipo_monitoreo: TipoMonitoreo; cantidad: number }>;
  por_cumplimiento: Array<{ cumplimiento: CumplimientoMonitoreo; cantidad: number }>;
  por_frecuencia: Array<{ frecuencia_requerida: FrecuenciaMonitoreo; cantidad: number }>;
}

// ============================================
// LABELS Y COLORES PARA UI
// ============================================

export const TIPO_ASPECTO_LABELS: Record<TipoAspecto, string> = {
  [TipoAspecto.EMISION]: 'Emisiones a la Atmósfera',
  [TipoAspecto.VERTIMIENTO]: 'Vertimientos al Agua',
  [TipoAspecto.RESIDUO]: 'Generación de Residuos',
  [TipoAspecto.CONSUMO_RECURSO]: 'Consumo de Recursos',
  [TipoAspecto.CONTAMINACION_SUELO]: 'Contaminación del Suelo',
  [TipoAspecto.RUIDO_VIBRACION]: 'Ruido y Vibraciones',
  [TipoAspecto.BIODIVERSIDAD]: 'Afectación a Biodiversidad',
  [TipoAspecto.ENERGIA]: 'Uso de Energía',
  [TipoAspecto.OTRO]: 'Otro',
};

export const CONDICION_OPERACION_LABELS: Record<CondicionOperacion, string> = {
  [CondicionOperacion.NORMAL]: 'Operación Normal',
  [CondicionOperacion.ANORMAL]: 'Operación Anormal',
  [CondicionOperacion.EMERGENCIA]: 'Situación de Emergencia',
};

export const TIEMPO_VERBO_LABELS: Record<TiempoVerbo, string> = {
  [TiempoVerbo.PASADO]: 'Pasado',
  [TiempoVerbo.PRESENTE]: 'Presente',
  [TiempoVerbo.FUTURO]: 'Futuro',
};

export const SIGNIFICANCIA_LABELS: Record<Significancia, string> = {
  [Significancia.NO_SIGNIFICATIVO]: 'No Significativo',
  [Significancia.SIGNIFICATIVO]: 'Significativo',
  [Significancia.CRITICO]: 'Crítico',
};

export const SIGNIFICANCIA_COLORS: Record<Significancia, string> = {
  [Significancia.NO_SIGNIFICATIVO]: 'bg-green-100 text-green-800',
  [Significancia.SIGNIFICATIVO]: 'bg-yellow-100 text-yellow-800',
  [Significancia.CRITICO]: 'bg-red-100 text-red-800',
};

export const ESTADO_ASPECTO_LABELS: Record<EstadoAspecto, string> = {
  [EstadoAspecto.BORRADOR]: 'Borrador',
  [EstadoAspecto.VIGENTE]: 'Vigente',
  [EstadoAspecto.EN_REVISION]: 'En Revisión',
  [EstadoAspecto.OBSOLETO]: 'Obsoleto',
};

export const ESTADO_ASPECTO_COLORS: Record<EstadoAspecto, string> = {
  [EstadoAspecto.BORRADOR]: 'bg-gray-100 text-gray-800',
  [EstadoAspecto.VIGENTE]: 'bg-green-100 text-green-800',
  [EstadoAspecto.EN_REVISION]: 'bg-yellow-100 text-yellow-800',
  [EstadoAspecto.OBSOLETO]: 'bg-red-100 text-red-800',
};

export const COMPONENTE_AMBIENTAL_LABELS: Record<ComponenteAmbiental, string> = {
  [ComponenteAmbiental.AIRE]: 'Aire',
  [ComponenteAmbiental.AGUA]: 'Agua',
  [ComponenteAmbiental.SUELO]: 'Suelo',
  [ComponenteAmbiental.FLORA]: 'Flora',
  [ComponenteAmbiental.FAUNA]: 'Fauna',
  [ComponenteAmbiental.PAISAJE]: 'Paisaje',
  [ComponenteAmbiental.SOCIAL]: 'Social',
  [ComponenteAmbiental.ECONOMICO]: 'Económico',
};

export const TIPO_IMPACTO_LABELS: Record<TipoImpacto, string> = {
  [TipoImpacto.NEGATIVO]: 'Negativo',
  [TipoImpacto.POSITIVO]: 'Positivo',
};

export const TIPO_IMPACTO_COLORS: Record<TipoImpacto, string> = {
  [TipoImpacto.POSITIVO]: 'bg-green-100 text-green-800',
  [TipoImpacto.NEGATIVO]: 'bg-red-100 text-red-800',
};

export const MAGNITUD_IMPACTO_LABELS: Record<MagnitudImpacto, string> = {
  [MagnitudImpacto.MUY_BAJA]: 'Muy Baja',
  [MagnitudImpacto.BAJA]: 'Baja',
  [MagnitudImpacto.MEDIA]: 'Media',
  [MagnitudImpacto.ALTA]: 'Alta',
  [MagnitudImpacto.MUY_ALTA]: 'Muy Alta',
};

export const DURACION_IMPACTO_LABELS: Record<DuracionImpacto, string> = {
  [DuracionImpacto.TEMPORAL]: 'Temporal (< 1 año)',
  [DuracionImpacto.MEDIO_PLAZO]: 'Medio Plazo (1-5 años)',
  [DuracionImpacto.PERMANENTE]: 'Permanente (> 5 años)',
};

export const EXTENSION_IMPACTO_LABELS: Record<ExtensionImpacto, string> = {
  [ExtensionImpacto.PUNTUAL]: 'Puntual',
  [ExtensionImpacto.LOCAL]: 'Local',
  [ExtensionImpacto.REGIONAL]: 'Regional',
  [ExtensionImpacto.NACIONAL]: 'Nacional',
};

export const ESTADO_PROGRAMA_LABELS: Record<EstadoPrograma, string> = {
  [EstadoPrograma.PLANIFICADO]: 'Planificado',
  [EstadoPrograma.EN_EJECUCION]: 'En Ejecución',
  [EstadoPrograma.COMPLETADO]: 'Completado',
  [EstadoPrograma.SUSPENDIDO]: 'Suspendido',
  [EstadoPrograma.CANCELADO]: 'Cancelado',
};

export const ESTADO_PROGRAMA_COLORS: Record<EstadoPrograma, string> = {
  [EstadoPrograma.PLANIFICADO]: 'bg-blue-100 text-blue-800',
  [EstadoPrograma.EN_EJECUCION]: 'bg-yellow-100 text-yellow-800',
  [EstadoPrograma.COMPLETADO]: 'bg-green-100 text-green-800',
  [EstadoPrograma.SUSPENDIDO]: 'bg-orange-100 text-orange-800',
  [EstadoPrograma.CANCELADO]: 'bg-red-100 text-red-800',
};

export const TIPO_PROGRAMA_LABELS: Record<TipoPrograma, string> = {
  [TipoPrograma.PREVENCION]: 'Prevención',
  [TipoPrograma.MITIGACION]: 'Mitigación',
  [TipoPrograma.COMPENSACION]: 'Compensación',
  [TipoPrograma.MEJORAMIENTO]: 'Mejoramiento Continuo',
  [TipoPrograma.CUMPLIMIENTO]: 'Cumplimiento Legal',
};

export const EFICACIA_PROGRAMA_LABELS: Record<EficaciaPrograma, string> = {
  [EficaciaPrograma.NO_EVALUADO]: 'No Evaluado',
  [EficaciaPrograma.EFICAZ]: 'Eficaz',
  [EficaciaPrograma.PARCIALMENTE_EFICAZ]: 'Parcialmente Eficaz',
  [EficaciaPrograma.NO_EFICAZ]: 'No Eficaz',
};

export const TIPO_MONITOREO_LABELS: Record<TipoMonitoreo, string> = {
  [TipoMonitoreo.EMISION_ATMOSFERICA]: 'Emisión Atmosférica',
  [TipoMonitoreo.CALIDAD_AGUA]: 'Calidad del Agua',
  [TipoMonitoreo.VERTIMIENTO]: 'Vertimiento',
  [TipoMonitoreo.RUIDO]: 'Ruido Ambiental',
  [TipoMonitoreo.RESIDUOS]: 'Gestión de Residuos',
  [TipoMonitoreo.CONSUMO_AGUA]: 'Consumo de Agua',
  [TipoMonitoreo.CONSUMO_ENERGIA]: 'Consumo de Energía',
  [TipoMonitoreo.CONSUMO_COMBUSTIBLE]: 'Consumo de Combustible',
  [TipoMonitoreo.BIODIVERSIDAD]: 'Biodiversidad',
  [TipoMonitoreo.SUELO]: 'Calidad del Suelo',
  [TipoMonitoreo.OTRO]: 'Otro',
};

export const FRECUENCIA_MONITOREO_LABELS: Record<FrecuenciaMonitoreo, string> = {
  [FrecuenciaMonitoreo.DIARIA]: 'Diaria',
  [FrecuenciaMonitoreo.SEMANAL]: 'Semanal',
  [FrecuenciaMonitoreo.MENSUAL]: 'Mensual',
  [FrecuenciaMonitoreo.TRIMESTRAL]: 'Trimestral',
  [FrecuenciaMonitoreo.SEMESTRAL]: 'Semestral',
  [FrecuenciaMonitoreo.ANUAL]: 'Anual',
  [FrecuenciaMonitoreo.EVENTUAL]: 'Eventual',
};

export const CUMPLIMIENTO_MONITOREO_LABELS: Record<CumplimientoMonitoreo, string> = {
  [CumplimientoMonitoreo.CUMPLE]: 'Cumple',
  [CumplimientoMonitoreo.NO_CUMPLE]: 'No Cumple',
  [CumplimientoMonitoreo.NO_APLICA]: 'No Aplica',
};

export const CUMPLIMIENTO_MONITOREO_COLORS: Record<CumplimientoMonitoreo, string> = {
  [CumplimientoMonitoreo.CUMPLE]: 'bg-green-100 text-green-800',
  [CumplimientoMonitoreo.NO_CUMPLE]: 'bg-red-100 text-red-800',
  [CumplimientoMonitoreo.NO_APLICA]: 'bg-gray-100 text-gray-800',
};

// ============================================
// FUNCIONES HELPER
// ============================================

/**
 * Calcula el valor de significancia igual que el backend
 * Backend: frecuencia * severidad * probabilidad + bonificadores
 */
export function calcularValorSignificancia(params: {
  frecuencia: number;
  severidad: number;
  probabilidad: number;
  alcance: number;
  reversibilidad: number;
  cumplimiento_legal: boolean;
  quejas_comunidad: boolean;
}): number {
  let valor = params.frecuencia * params.severidad * params.probabilidad;
  if (params.alcance >= 4) valor += 10;
  if (params.reversibilidad >= 4) valor += 10;
  if (!params.cumplimiento_legal) valor += 50;
  if (params.quejas_comunidad) valor += 25;
  return valor;
}

/**
 * Determina la significancia basado en el valor calculado
 * Backend: >= 100 CRITICO, >= 50 SIGNIFICATIVO, else NO_SIGNIFICATIVO
 */
export function determinarSignificancia(valor: number): Significancia {
  if (valor >= 100) return Significancia.CRITICO;
  if (valor >= 50) return Significancia.SIGNIFICATIVO;
  return Significancia.NO_SIGNIFICATIVO;
}
