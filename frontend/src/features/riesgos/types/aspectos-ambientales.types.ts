/**
 * Tipos para Aspectos Ambientales - ISO 14001
 * Sistema de Gestion Ambiental
 */

// ============================================
// ENUMS
// ============================================

export enum TipoAspecto {
  CONSUMO_AGUA = 'CONSUMO_AGUA',
  CONSUMO_ENERGIA = 'CONSUMO_ENERGIA',
  CONSUMO_MATERIAS_PRIMAS = 'CONSUMO_MATERIAS_PRIMAS',
  EMISIONES_ATMOSFERICAS = 'EMISIONES_ATMOSFERICAS',
  VERTIMIENTOS = 'VERTIMIENTOS',
  RESIDUOS_PELIGROSOS = 'RESIDUOS_PELIGROSOS',
  RESIDUOS_NO_PELIGROSOS = 'RESIDUOS_NO_PELIGROSOS',
  RUIDO = 'RUIDO',
  VIBRACIONES = 'VIBRACIONES',
  USO_SUELO = 'USO_SUELO',
  BIODIVERSIDAD = 'BIODIVERSIDAD',
  OTRO = 'OTRO',
}

export enum CondicionOperacion {
  NORMAL = 'NORMAL',
  ANORMAL = 'ANORMAL',
  EMERGENCIA = 'EMERGENCIA',
}

export enum Significancia {
  NO_SIGNIFICATIVO = 'NO_SIGNIFICATIVO',
  SIGNIFICATIVO = 'SIGNIFICATIVO',
  CRITICO = 'CRITICO',
}

export enum EstadoAspecto {
  IDENTIFICADO = 'IDENTIFICADO',
  EVALUADO = 'EVALUADO',
  EN_TRATAMIENTO = 'EN_TRATAMIENTO',
  CONTROLADO = 'CONTROLADO',
}

export enum ComponenteAmbiental {
  AIRE = 'AIRE',
  AGUA = 'AGUA',
  SUELO = 'SUELO',
  FLORA = 'FLORA',
  FAUNA = 'FAUNA',
  PAISAJE = 'PAISAJE',
  COMUNIDAD = 'COMUNIDAD',
}

export enum TipoImpacto {
  POSITIVO = 'POSITIVO',
  NEGATIVO_BAJO = 'NEGATIVO_BAJO',
  NEGATIVO_MODERADO = 'NEGATIVO_MODERADO',
  NEGATIVO_ALTO = 'NEGATIVO_ALTO',
}

export enum EstadoPrograma {
  PLANIFICADO = 'PLANIFICADO',
  EN_EJECUCION = 'EN_EJECUCION',
  COMPLETADO = 'COMPLETADO',
  SUSPENDIDO = 'SUSPENDIDO',
  CANCELADO = 'CANCELADO',
}

export enum TipoPrograma {
  PREVENCION = 'PREVENCION',
  MITIGACION = 'MITIGACION',
  COMPENSACION = 'COMPENSACION',
  RESTAURACION = 'RESTAURACION',
  MONITOREO = 'MONITOREO',
}

export enum TipoMonitoreo {
  AGUA = 'AGUA',
  AIRE = 'AIRE',
  RUIDO = 'RUIDO',
  SUELO = 'SUELO',
  RESIDUOS = 'RESIDUOS',
  ENERGIA = 'ENERGIA',
  BIODIVERSIDAD = 'BIODIVERSIDAD',
}

export enum FrecuenciaMonitoreo {
  DIARIO = 'DIARIO',
  SEMANAL = 'SEMANAL',
  QUINCENAL = 'QUINCENAL',
  MENSUAL = 'MENSUAL',
  BIMESTRAL = 'BIMESTRAL',
  TRIMESTRAL = 'TRIMESTRAL',
  SEMESTRAL = 'SEMESTRAL',
  ANUAL = 'ANUAL',
}

export enum CumplimientoMonitoreo {
  CUMPLE = 'CUMPLE',
  NO_CUMPLE = 'NO_CUMPLE',
  PENDIENTE = 'PENDIENTE',
}

// ============================================
// INTERFACES BASE
// ============================================

export interface BaseEntity {
  id: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface UserReference {
  id: number;
  username: string;
  full_name: string;
  email: string;
}

// ============================================
// CATEGORIA ASPECTO
// ============================================

export interface CategoriaAspecto extends BaseEntity {
  tipo: TipoAspecto;
  nombre: string;
  descripcion: string;
  icono?: string;
  color?: string;
}

export interface CategoriaAspectoCreate {
  tipo: TipoAspecto;
  nombre: string;
  descripcion: string;
  icono?: string;
  color?: string;
}

export type CategoriaAspectoUpdate = Partial<CategoriaAspectoCreate>;

// ============================================
// ASPECTO AMBIENTAL
// ============================================

export interface AspectoAmbiental extends BaseEntity {
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaAspecto;
  categoria_id: number;
  proceso: string;
  actividad: string;
  condicion_operacion: CondicionOperacion;

  // Evaluacion
  magnitud: number;
  frecuencia: number;
  severidad: number;
  reversibilidad: number;
  extension: number;
  valor_significancia: number;
  significancia: Significancia;
  estado: EstadoAspecto;

  // Legal
  requisito_legal: string;
  cumplimiento_legal: boolean;

  // Control
  control_operacional: string;
  indicador_seguimiento: string;
  meta: string;

  // Referencias
  created_by: UserReference;
  empresa_id: number;
}

export interface AspectoAmbientalList {
  id: number;
  codigo: string;
  nombre: string;
  categoria: Pick<CategoriaAspecto, 'id' | 'nombre' | 'tipo'>;
  proceso: string;
  condicion_operacion: CondicionOperacion;
  valor_significancia: number;
  significancia: Significancia;
  estado: EstadoAspecto;
  cumplimiento_legal: boolean;
  created_at: string;
}

export interface AspectoAmbientalCreate {
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria_id: number;
  proceso: string;
  actividad: string;
  condicion_operacion: CondicionOperacion;
  magnitud: number;
  frecuencia: number;
  severidad: number;
  reversibilidad: number;
  extension: number;
  requisito_legal?: string;
  cumplimiento_legal?: boolean;
  control_operacional?: string;
  indicador_seguimiento?: string;
  meta?: string;
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
// ============================================

export interface ImpactoAmbiental extends BaseEntity {
  aspecto: Pick<AspectoAmbiental, 'id' | 'codigo' | 'nombre'>;
  aspecto_id: number;
  descripcion: string;
  componente_ambiental: ComponenteAmbiental;
  tipo_impacto: TipoImpacto;
  caracter: 'POSITIVO' | 'NEGATIVO';
  extension_geografica: string;
  duracion: string;
  reversibilidad: string;
  probabilidad: number;
  intensidad: number;
  valor_impacto: number;
  observaciones: string;
  created_by: UserReference;
  empresa_id: number;
}

export interface ImpactoAmbientalCreate {
  aspecto_id: number;
  descripcion: string;
  componente_ambiental: ComponenteAmbiental;
  tipo_impacto: TipoImpacto;
  caracter: 'POSITIVO' | 'NEGATIVO';
  extension_geografica?: string;
  duracion?: string;
  reversibilidad?: string;
  probabilidad: number;
  intensidad: number;
  observaciones?: string;
}

export type ImpactoAmbientalUpdate = Partial<ImpactoAmbientalCreate>;

export interface ImpactoAmbientalFilter {
  aspecto?: number;
  componente_ambiental?: ComponenteAmbiental;
  tipo_impacto?: TipoImpacto;
  caracter?: 'POSITIVO' | 'NEGATIVO';
}

// ============================================
// PROGRAMA AMBIENTAL
// ============================================

export interface ProgramaAmbiental extends BaseEntity {
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo_programa: TipoPrograma;
  objetivo: string;
  metas: string;
  indicadores: string;

  // Fechas
  fecha_inicio: string;
  fecha_fin: string;

  // Responsables
  responsable: UserReference;
  responsable_id: number;
  equipo_apoyo: UserReference[];

  // Recursos
  presupuesto: number;
  recursos_humanos: string;
  recursos_tecnicos: string;

  // Estado y avance
  estado: EstadoPrograma;
  porcentaje_avance: number;

  // Relaciones
  aspectos_relacionados: Pick<AspectoAmbiental, 'id' | 'codigo' | 'nombre'>[];

  // Seguimiento
  observaciones: string;
  created_by: UserReference;
  empresa_id: number;
}

export interface ProgramaAmbientalList {
  id: number;
  codigo: string;
  nombre: string;
  tipo_programa: TipoPrograma;
  fecha_inicio: string;
  fecha_fin: string;
  responsable: Pick<UserReference, 'id' | 'full_name'>;
  estado: EstadoPrograma;
  porcentaje_avance: number;
  aspectos_count: number;
}

export interface ProgramaAmbientalCreate {
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo_programa: TipoPrograma;
  objetivo: string;
  metas: string;
  indicadores: string;
  fecha_inicio: string;
  fecha_fin: string;
  responsable_id: number;
  equipo_apoyo_ids?: number[];
  presupuesto?: number;
  recursos_humanos?: string;
  recursos_tecnicos?: string;
  aspectos_relacionados_ids?: number[];
  observaciones?: string;
}

export interface ProgramaAmbientalUpdate extends Partial<ProgramaAmbientalCreate> {
  estado?: EstadoPrograma;
  porcentaje_avance?: number;
}

export interface ProgramaAmbientalFilter {
  tipo_programa?: TipoPrograma;
  estado?: EstadoPrograma;
  responsable?: number;
  fecha_inicio_desde?: string;
  fecha_inicio_hasta?: string;
  search?: string;
}

// ============================================
// MONITOREO AMBIENTAL
// ============================================

export interface MonitoreoAmbiental extends BaseEntity {
  codigo: string;
  tipo_monitoreo: TipoMonitoreo;
  descripcion: string;

  // Relaciones opcionales
  aspecto_relacionado?: Pick<AspectoAmbiental, 'id' | 'codigo' | 'nombre'>;
  aspecto_relacionado_id?: number;
  programa_relacionado?: Pick<ProgramaAmbiental, 'id' | 'codigo' | 'nombre'>;
  programa_relacionado_id?: number;

  // Parametros
  parametro: string;
  unidad_medida: string;
  limite_permisible: string;
  normatividad_referencia: string;

  // Medicion
  frecuencia_requerida: FrecuenciaMonitoreo;
  fecha_monitoreo: string;
  hora_monitoreo: string;
  valor_medido: number;
  cumplimiento: CumplimientoMonitoreo;

  // Ubicacion y metodo
  punto_monitoreo: string;
  metodo_medicion: string;
  equipo_utilizado: string;
  laboratorio?: string;

  // Responsable
  responsable_medicion: UserReference;
  responsable_medicion_id: number;

  // Seguimiento
  observaciones: string;
  acciones_correctivas?: string;
  evidencia_url?: string;

  created_by: UserReference;
  empresa_id: number;
}

export interface MonitoreoAmbientalCreate {
  codigo: string;
  tipo_monitoreo: TipoMonitoreo;
  descripcion: string;
  aspecto_relacionado_id?: number;
  programa_relacionado_id?: number;
  parametro: string;
  unidad_medida: string;
  limite_permisible: string;
  normatividad_referencia: string;
  frecuencia_requerida: FrecuenciaMonitoreo;
  fecha_monitoreo: string;
  hora_monitoreo: string;
  valor_medido: number;
  punto_monitoreo: string;
  metodo_medicion: string;
  equipo_utilizado: string;
  laboratorio?: string;
  responsable_medicion_id: number;
  observaciones?: string;
  acciones_correctivas?: string;
  evidencia_url?: string;
}

export interface MonitoreoAmbientalUpdate extends Partial<MonitoreoAmbientalCreate> {
  cumplimiento?: CumplimientoMonitoreo;
}

export interface MonitoreoAmbientalFilter {
  tipo_monitoreo?: TipoMonitoreo;
  aspecto_relacionado?: number;
  programa_relacionado?: number;
  cumplimiento?: CumplimientoMonitoreo;
  frecuencia_requerida?: FrecuenciaMonitoreo;
  fecha_desde?: string;
  fecha_hasta?: string;
}

// ============================================
// RESUMENES Y ESTADISTICAS
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
  [TipoAspecto.CONSUMO_AGUA]: 'Consumo de Agua',
  [TipoAspecto.CONSUMO_ENERGIA]: 'Consumo de Energia',
  [TipoAspecto.CONSUMO_MATERIAS_PRIMAS]: 'Consumo de Materias Primas',
  [TipoAspecto.EMISIONES_ATMOSFERICAS]: 'Emisiones Atmosfericas',
  [TipoAspecto.VERTIMIENTOS]: 'Vertimientos',
  [TipoAspecto.RESIDUOS_PELIGROSOS]: 'Residuos Peligrosos',
  [TipoAspecto.RESIDUOS_NO_PELIGROSOS]: 'Residuos No Peligrosos',
  [TipoAspecto.RUIDO]: 'Ruido',
  [TipoAspecto.VIBRACIONES]: 'Vibraciones',
  [TipoAspecto.USO_SUELO]: 'Uso del Suelo',
  [TipoAspecto.BIODIVERSIDAD]: 'Biodiversidad',
  [TipoAspecto.OTRO]: 'Otro',
};

export const CONDICION_OPERACION_LABELS: Record<CondicionOperacion, string> = {
  [CondicionOperacion.NORMAL]: 'Normal',
  [CondicionOperacion.ANORMAL]: 'Anormal',
  [CondicionOperacion.EMERGENCIA]: 'Emergencia',
};

export const SIGNIFICANCIA_LABELS: Record<Significancia, string> = {
  [Significancia.NO_SIGNIFICATIVO]: 'No Significativo',
  [Significancia.SIGNIFICATIVO]: 'Significativo',
  [Significancia.CRITICO]: 'Critico',
};

export const SIGNIFICANCIA_COLORS: Record<Significancia, string> = {
  [Significancia.NO_SIGNIFICATIVO]: 'bg-green-100 text-green-800',
  [Significancia.SIGNIFICATIVO]: 'bg-yellow-100 text-yellow-800',
  [Significancia.CRITICO]: 'bg-red-100 text-red-800',
};

export const ESTADO_ASPECTO_LABELS: Record<EstadoAspecto, string> = {
  [EstadoAspecto.IDENTIFICADO]: 'Identificado',
  [EstadoAspecto.EVALUADO]: 'Evaluado',
  [EstadoAspecto.EN_TRATAMIENTO]: 'En Tratamiento',
  [EstadoAspecto.CONTROLADO]: 'Controlado',
};

export const ESTADO_ASPECTO_COLORS: Record<EstadoAspecto, string> = {
  [EstadoAspecto.IDENTIFICADO]: 'bg-gray-100 text-gray-800',
  [EstadoAspecto.EVALUADO]: 'bg-blue-100 text-blue-800',
  [EstadoAspecto.EN_TRATAMIENTO]: 'bg-yellow-100 text-yellow-800',
  [EstadoAspecto.CONTROLADO]: 'bg-green-100 text-green-800',
};

export const COMPONENTE_AMBIENTAL_LABELS: Record<ComponenteAmbiental, string> = {
  [ComponenteAmbiental.AIRE]: 'Aire',
  [ComponenteAmbiental.AGUA]: 'Agua',
  [ComponenteAmbiental.SUELO]: 'Suelo',
  [ComponenteAmbiental.FLORA]: 'Flora',
  [ComponenteAmbiental.FAUNA]: 'Fauna',
  [ComponenteAmbiental.PAISAJE]: 'Paisaje',
  [ComponenteAmbiental.COMUNIDAD]: 'Comunidad',
};

export const TIPO_IMPACTO_LABELS: Record<TipoImpacto, string> = {
  [TipoImpacto.POSITIVO]: 'Positivo',
  [TipoImpacto.NEGATIVO_BAJO]: 'Negativo Bajo',
  [TipoImpacto.NEGATIVO_MODERADO]: 'Negativo Moderado',
  [TipoImpacto.NEGATIVO_ALTO]: 'Negativo Alto',
};

export const TIPO_IMPACTO_COLORS: Record<TipoImpacto, string> = {
  [TipoImpacto.POSITIVO]: 'bg-green-100 text-green-800',
  [TipoImpacto.NEGATIVO_BAJO]: 'bg-yellow-100 text-yellow-800',
  [TipoImpacto.NEGATIVO_MODERADO]: 'bg-orange-100 text-orange-800',
  [TipoImpacto.NEGATIVO_ALTO]: 'bg-red-100 text-red-800',
};

export const ESTADO_PROGRAMA_LABELS: Record<EstadoPrograma, string> = {
  [EstadoPrograma.PLANIFICADO]: 'Planificado',
  [EstadoPrograma.EN_EJECUCION]: 'En Ejecucion',
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
  [TipoPrograma.PREVENCION]: 'Prevencion',
  [TipoPrograma.MITIGACION]: 'Mitigacion',
  [TipoPrograma.COMPENSACION]: 'Compensacion',
  [TipoPrograma.RESTAURACION]: 'Restauracion',
  [TipoPrograma.MONITOREO]: 'Monitoreo',
};

export const TIPO_MONITOREO_LABELS: Record<TipoMonitoreo, string> = {
  [TipoMonitoreo.AGUA]: 'Agua',
  [TipoMonitoreo.AIRE]: 'Aire',
  [TipoMonitoreo.RUIDO]: 'Ruido',
  [TipoMonitoreo.SUELO]: 'Suelo',
  [TipoMonitoreo.RESIDUOS]: 'Residuos',
  [TipoMonitoreo.ENERGIA]: 'Energia',
  [TipoMonitoreo.BIODIVERSIDAD]: 'Biodiversidad',
};

export const FRECUENCIA_MONITOREO_LABELS: Record<FrecuenciaMonitoreo, string> = {
  [FrecuenciaMonitoreo.DIARIO]: 'Diario',
  [FrecuenciaMonitoreo.SEMANAL]: 'Semanal',
  [FrecuenciaMonitoreo.QUINCENAL]: 'Quincenal',
  [FrecuenciaMonitoreo.MENSUAL]: 'Mensual',
  [FrecuenciaMonitoreo.BIMESTRAL]: 'Bimestral',
  [FrecuenciaMonitoreo.TRIMESTRAL]: 'Trimestral',
  [FrecuenciaMonitoreo.SEMESTRAL]: 'Semestral',
  [FrecuenciaMonitoreo.ANUAL]: 'Anual',
};

export const CUMPLIMIENTO_MONITOREO_LABELS: Record<CumplimientoMonitoreo, string> = {
  [CumplimientoMonitoreo.CUMPLE]: 'Cumple',
  [CumplimientoMonitoreo.NO_CUMPLE]: 'No Cumple',
  [CumplimientoMonitoreo.PENDIENTE]: 'Pendiente',
};

export const CUMPLIMIENTO_MONITOREO_COLORS: Record<CumplimientoMonitoreo, string> = {
  [CumplimientoMonitoreo.CUMPLE]: 'bg-green-100 text-green-800',
  [CumplimientoMonitoreo.NO_CUMPLE]: 'bg-red-100 text-red-800',
  [CumplimientoMonitoreo.PENDIENTE]: 'bg-gray-100 text-gray-800',
};

// ============================================
// FUNCIONES HELPER
// ============================================

/**
 * Calcula el valor de significancia basado en los criterios de evaluacion
 */
export function calcularValorSignificancia(
  magnitud: number,
  frecuencia: number,
  severidad: number,
  reversibilidad: number,
  extension: number
): number {
  return (magnitud + frecuencia + severidad + reversibilidad + extension) / 5;
}

/**
 * Determina la significancia basado en el valor calculado
 */
export function determinarSignificancia(valor: number): Significancia {
  if (valor >= 4) return Significancia.CRITICO;
  if (valor >= 2.5) return Significancia.SIGNIFICATIVO;
  return Significancia.NO_SIGNIFICATIVO;
}

/**
 * Calcula el valor del impacto
 */
export function calcularValorImpacto(probabilidad: number, intensidad: number): number {
  return probabilidad * intensidad;
}

/**
 * Determina el tipo de impacto basado en el valor
 */
export function determinarTipoImpacto(valor: number, esPositivo: boolean): TipoImpacto {
  if (esPositivo) return TipoImpacto.POSITIVO;
  if (valor >= 20) return TipoImpacto.NEGATIVO_ALTO;
  if (valor >= 10) return TipoImpacto.NEGATIVO_MODERADO;
  return TipoImpacto.NEGATIVO_BAJO;
}
