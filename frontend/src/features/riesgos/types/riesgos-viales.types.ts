/**
 * Tipos para Riesgos Viales - PESV
 * Plan Estrategico de Seguridad Vial - Resolucion 40595/2022
 */

// ============================================
// ENUMS
// ============================================

export enum CategoriaFactor {
  HUMANO = 'HUMANO',
  VEHICULO = 'VEHICULO',
  VIA = 'VIA',
  AMBIENTAL = 'AMBIENTAL',
  ORGANIZACIONAL = 'ORGANIZACIONAL',
}

export enum NivelRiesgoVial {
  BAJO = 'BAJO',
  MEDIO = 'MEDIO',
  ALTO = 'ALTO',
  MUY_ALTO = 'MUY_ALTO',
}

export enum EstadoRiesgoVial {
  IDENTIFICADO = 'IDENTIFICADO',
  EVALUADO = 'EVALUADO',
  EN_TRATAMIENTO = 'EN_TRATAMIENTO',
  CONTROLADO = 'CONTROLADO',
  ACEPTADO = 'ACEPTADO',
}

export enum TipoControlVial {
  ELIMINACION = 'ELIMINACION',
  SUSTITUCION = 'SUSTITUCION',
  INGENIERIA = 'INGENIERIA',
  ADMINISTRATIVO = 'ADMINISTRATIVO',
  EPP = 'EPP',
}

export enum EstadoControlVial {
  PLANIFICADO = 'PLANIFICADO',
  EN_IMPLEMENTACION = 'EN_IMPLEMENTACION',
  IMPLEMENTADO = 'IMPLEMENTADO',
  EN_SEGUIMIENTO = 'EN_SEGUIMIENTO',
}

export enum TipoIncidenteVial {
  COLISION = 'COLISION',
  VOLCAMIENTO = 'VOLCAMIENTO',
  ATROPELLO = 'ATROPELLO',
  CAIDA = 'CAIDA',
  CUASI_ACCIDENTE = 'CUASI_ACCIDENTE',
  OTRO = 'OTRO',
}

export enum SeveridadIncidente {
  LEVE = 'LEVE',
  MODERADO = 'MODERADO',
  GRAVE = 'GRAVE',
  FATAL = 'FATAL',
}

export enum EstadoInvestigacion {
  PENDIENTE = 'PENDIENTE',
  EN_PROCESO = 'EN_PROCESO',
  COMPLETADA = 'COMPLETADA',
  CERRADA = 'CERRADA',
}

export enum TipoVehiculo {
  MOTOCICLETA = 'MOTOCICLETA',
  AUTOMOVIL = 'AUTOMOVIL',
  CAMIONETA = 'CAMIONETA',
  CAMION = 'CAMION',
  TRACTOMULA = 'TRACTOMULA',
  BUS = 'BUS',
  BICICLETA = 'BICICLETA',
  OTRO = 'OTRO',
}

export enum EstadoVehiculo {
  ACTIVO = 'ACTIVO',
  EN_MANTENIMIENTO = 'EN_MANTENIMIENTO',
  FUERA_SERVICIO = 'FUERA_SERVICIO',
}

export enum ResultadoInspeccion {
  APROBADO = 'APROBADO',
  APROBADO_CON_OBSERVACIONES = 'APROBADO_CON_OBSERVACIONES',
  RECHAZADO = 'RECHAZADO',
}

export enum TipoInspeccion {
  PREOPERACIONAL = 'PREOPERACIONAL',
  PERIODICA = 'PERIODICA',
  EXTRAORDINARIA = 'EXTRAORDINARIA',
}

export enum PilarPESV {
  FORTALECIMIENTO_GESTION = 'FORTALECIMIENTO_GESTION',
  COMPORTAMIENTO_HUMANO = 'COMPORTAMIENTO_HUMANO',
  VEHICULOS_SEGUROS = 'VEHICULOS_SEGUROS',
  INFRAESTRUCTURA_SEGURA = 'INFRAESTRUCTURA_SEGURA',
  ATENCION_VICTIMAS = 'ATENCION_VICTIMAS',
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
// TIPO/FACTOR DE RIESGO VIAL (Catalogo)
// ============================================

export interface TipoRiesgoVial extends BaseEntity {
  categoria: CategoriaFactor;
  categoria_display?: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  consecuencias_posibles?: string;
  marco_legal?: string;
}

export interface TipoRiesgoVialCreate {
  categoria: CategoriaFactor;
  codigo: string;
  nombre: string;
  descripcion: string;
  consecuencias_posibles?: string;
  marco_legal?: string;
}

export type TipoRiesgoVialUpdate = Partial<TipoRiesgoVialCreate>;

// ============================================
// RIESGO VIAL
// ============================================

export interface RiesgoVial extends BaseEntity {
  codigo: string;
  tipo_riesgo: number;
  tipo_riesgo_data?: TipoRiesgoVial;
  tipo_riesgo_nombre?: string;
  tipo_riesgo_categoria?: string;
  descripcion: string;
  proceso_afectado?: string;
  rutas_afectadas?: string;
  tipo_vehiculo?: TipoVehiculo;

  // Evaluacion inherente
  frecuencia: number;
  probabilidad: number;
  severidad: number;
  valoracion_riesgo?: number;
  nivel_riesgo: NivelRiesgoVial;
  nivel_riesgo_display?: string;

  // Controles actuales
  controles_actuales?: string;
  efectividad_controles?: string;

  // Evaluacion residual
  frecuencia_residual?: number;
  probabilidad_residual?: number;
  severidad_residual?: number;
  valoracion_residual?: number;
  nivel_residual?: NivelRiesgoVial;
  nivel_residual_display?: string;
  porcentaje_reduccion?: number | null;

  // Responsable y estado
  responsable?: number;
  responsable_nombre?: string;
  estado: EstadoRiesgoVial;
  estado_display?: string;
  fecha_identificacion?: string;
  fecha_evaluacion?: string;
  fecha_revision?: string;
  observaciones?: string;

  // Calculados
  requiere_accion_inmediata?: boolean;

  created_by_nombre?: string;
  empresa_id?: number;
}

export interface RiesgoVialList {
  id: number;
  codigo: string;
  tipo_riesgo: number;
  tipo_riesgo_nombre?: string;
  tipo_riesgo_categoria?: string;
  descripcion: string;
  proceso_afectado?: string;
  tipo_vehiculo?: TipoVehiculo;
  frecuencia?: number;
  probabilidad?: number;
  severidad?: number;
  valoracion_riesgo?: number;
  nivel_riesgo: NivelRiesgoVial;
  nivel_riesgo_display?: string;
  nivel_residual?: NivelRiesgoVial;
  porcentaje_reduccion?: number | null;
  responsable?: number;
  responsable_nombre?: string;
  estado: EstadoRiesgoVial;
  estado_display?: string;
  fecha_identificacion?: string;
  fecha_revision?: string;
  requiere_accion_inmediata?: boolean;
  created_by_nombre?: string;
  created_at: string;
  updated_at: string;
}

export interface RiesgoVialCreate {
  codigo: string;
  descripcion: string;
  tipo_riesgo: number;
  proceso_afectado?: string;
  rutas_afectadas?: string;
  tipo_vehiculo: TipoVehiculo;
  frecuencia: number;
  probabilidad: number;
  severidad: number;
  controles_actuales?: string;
  efectividad_controles?: string;
  frecuencia_residual?: number;
  probabilidad_residual?: number;
  severidad_residual?: number;
  responsable?: number;
  estado?: EstadoRiesgoVial;
  fecha_identificacion?: string;
  fecha_evaluacion?: string;
  fecha_revision?: string;
  observaciones?: string;
}

export type RiesgoVialUpdate = Partial<RiesgoVialCreate>;

export interface RiesgoVialFilter {
  tipo_riesgo?: number;
  categoria?: CategoriaFactor;
  pilar_pesv?: PilarPESV;
  nivel_riesgo?: NivelRiesgoVial;
  estado?: EstadoRiesgoVial;
  tipo_vehiculo?: TipoVehiculo;
  ruta_asociada?: string;
  search?: string;
}

// ============================================
// CONTROL VIAL
// ============================================

export interface ControlVial extends BaseEntity {
  riesgo_vial: number;
  riesgo_vial_codigo?: string;
  riesgo_vial_descripcion?: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo_control: TipoControlVial;
  tipo_control_display?: string;
  momento_aplicacion?: string;
  momento_aplicacion_display?: string;
  jerarquia?: string;
  jerarquia_display?: string;
  responsable?: number;
  responsable_nombre?: string;
  area_responsable?: string;
  estado: EstadoControlVial;
  estado_display?: string;
  fecha_propuesta?: string;
  fecha_implementacion_programada?: string;
  fecha_implementacion_real?: string;
  costo_estimado?: number;
  costo_real?: number;
  recursos_necesarios?: string;
  indicador_efectividad?: string;
  efectividad_verificada?: boolean;
  fecha_verificacion?: string;
  resultado_verificacion?: string;
  observaciones?: string;
  esta_atrasado?: boolean;
  created_by_nombre?: string;
  empresa_id?: number;
}

export interface ControlVialCreate {
  riesgo_vial: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo_control: TipoControlVial;
  momento_aplicacion?: string;
  jerarquia?: string;
  responsable?: number;
  area_responsable?: string;
  fecha_propuesta?: string;
  fecha_implementacion_programada?: string;
  fecha_implementacion_real?: string;
  estado?: EstadoControlVial;
  costo_estimado?: number;
  costo_real?: number;
  recursos_necesarios?: string;
  indicador_efectividad?: string;
  efectividad_verificada?: boolean;
  fecha_verificacion?: string;
  resultado_verificacion?: string;
  observaciones?: string;
}

export type ControlVialUpdate = Partial<ControlVialCreate>;

export interface ControlVialFilter {
  riesgo_vial?: number;
  tipo_control?: TipoControlVial;
  estado?: EstadoControlVial;
  jerarquia?: string;
  responsable?: number;
  search?: string;
}

// ============================================
// INCIDENTE VIAL
// ============================================

export interface IncidenteVial extends BaseEntity {
  numero_incidente: string;
  tipo_incidente: TipoIncidenteVial;
  gravedad: SeveridadIncidente;
  estado_investigacion: EstadoInvestigacion;

  // Fecha y ubicacion
  fecha_incidente: string;
  ubicacion: string;
  municipio?: string;
  departamento?: string;
  coordenadas?: string;

  // Descripcion
  descripcion_hechos: string;
  condiciones_climaticas?: string;
  condiciones_via?: string;
  condiciones_vehiculo?: string;

  // Vehiculo y conductor
  conductor_nombre: string;
  conductor_identificacion: string;
  conductor_licencia?: string;
  vehiculo_placa?: string;
  vehiculo_tipo?: TipoVehiculo;

  // Consecuencias
  numero_lesionados?: number;
  numero_fallecidos?: number;
  descripcion_lesiones?: string;
  daños_vehiculo_propio?: string;
  daños_terceros?: string;
  costo_estimado_daños?: number;

  // Autoridades
  autoridades_notificadas?: boolean;
  numero_informe_policial?: string;
  comparendo_numero?: string;

  // Investigacion
  causas_inmediatas?: string;
  causas_basicas?: string;
  causas_raiz?: string;
  investigador?: number;
  investigador_nombre?: string;
  fecha_inicio_investigacion?: string;
  fecha_cierre_investigacion?: string;

  // Relaciones
  riesgos_relacionados?: number[];
  riesgos_relacionados_data?: Pick<RiesgoVial, 'id' | 'codigo' | 'descripcion'>[];

  // Lecciones y acciones
  lecciones_aprendidas?: string;
  acciones_correctivas?: string;

  // Calculados
  es_accidente_grave?: boolean;
  dias_investigacion_abierta?: number | null;

  created_by_nombre?: string;
  empresa_id?: number;
}

export interface IncidenteVialList {
  id: number;
  numero_incidente: string;
  tipo_incidente: TipoIncidenteVial;
  gravedad: SeveridadIncidente;
  estado_investigacion: EstadoInvestigacion;
  fecha_incidente: string;
  ubicacion: string;
  municipio?: string;
  departamento?: string;
  conductor_nombre: string;
  conductor_identificacion?: string;
  vehiculo_placa?: string;
  vehiculo_tipo?: TipoVehiculo;
  numero_lesionados?: number;
  numero_fallecidos?: number;
  costo_estimado_daños?: number;
  autoridades_notificadas?: boolean;
  investigador?: number;
  investigador_nombre?: string;
  fecha_inicio_investigacion?: string;
  fecha_cierre_investigacion?: string;
  es_accidente_grave?: boolean;
  dias_investigacion_abierta?: number | null;
  created_by_nombre?: string;
  created_at: string;
  updated_at: string;
}

export interface IncidenteVialCreate {
  numero_incidente: string;
  tipo_incidente: TipoIncidenteVial;
  gravedad: SeveridadIncidente;
  fecha_incidente: string;
  ubicacion: string;
  municipio?: string;
  departamento?: string;
  coordenadas?: string;
  conductor_nombre: string;
  conductor_identificacion: string;
  conductor_licencia?: string;
  vehiculo_placa?: string;
  vehiculo_tipo?: TipoVehiculo;
  descripcion_hechos: string;
  condiciones_climaticas?: string;
  condiciones_via?: string;
  condiciones_vehiculo?: string;
  numero_lesionados?: number;
  numero_fallecidos?: number;
  descripcion_lesiones?: string;
  daños_vehiculo_propio?: string;
  daños_terceros?: string;
  costo_estimado_daños?: number;
  autoridades_notificadas?: boolean;
  numero_informe_policial?: string;
  comparendo_numero?: string;
  estado_investigacion?: EstadoInvestigacion;
  investigador?: number;
  fecha_inicio_investigacion?: string;
  causas_inmediatas?: string;
  causas_basicas?: string;
  causas_raiz?: string;
  riesgos_relacionados?: number[];
  lecciones_aprendidas?: string;
  acciones_correctivas?: string;
}

export type IncidenteVialUpdate = Partial<IncidenteVialCreate> & {
  fecha_cierre_investigacion?: string;
};

export interface IncidenteVialFilter {
  tipo_incidente?: TipoIncidenteVial;
  gravedad?: SeveridadIncidente;
  estado_investigacion?: EstadoInvestigacion;
  vehiculo_placa?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  search?: string;
}

// ============================================
// INSPECCION VEHICULO
// ============================================

export interface ChecklistItem {
  id: string;
  categoria: string;
  item: string;
  descripcion: string;
  critico: boolean;
}

export interface ResultadoChecklistItem {
  item_id: string;
  cumple: boolean | null;
  observacion?: string;
}

export interface InspeccionVehiculo extends BaseEntity {
  codigo: string;
  tipo_inspeccion: TipoInspeccion;

  // Vehiculo
  tipo_vehiculo: TipoVehiculo;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  kilometraje: number;
  estado_vehiculo: EstadoVehiculo;

  // Inspeccion
  fecha_inspeccion: string;
  hora_inspeccion: string;
  inspector: UserReference;
  inspector_id: number;
  conductor_presente: string;

  // Checklist
  checklist_resultados: ResultadoChecklistItem[];
  items_cumplidos: number;
  items_no_cumplidos: number;
  items_na: number;

  // Resultado
  resultado: ResultadoInspeccion;
  porcentaje_cumplimiento: number;
  observaciones_generales: string;
  acciones_requeridas?: string;
  fecha_proxima_inspeccion?: string;

  // Firma y evidencias
  firma_inspector?: string;
  firma_conductor?: string;
  fotos_url?: string[];

  created_by: UserReference;
  empresa_id: number;
}

export interface InspeccionVehiculoCreate {
  codigo: string;
  tipo_inspeccion: TipoInspeccion;
  tipo_vehiculo: TipoVehiculo;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  kilometraje: number;
  fecha_inspeccion: string;
  hora_inspeccion: string;
  inspector_id: number;
  conductor_presente: string;
  checklist_resultados: ResultadoChecklistItem[];
  observaciones_generales?: string;
  acciones_requeridas?: string;
}

export interface InspeccionVehiculoUpdate extends Partial<InspeccionVehiculoCreate> {
  resultado?: ResultadoInspeccion;
  estado_vehiculo?: EstadoVehiculo;
  fecha_proxima_inspeccion?: string;
}

export interface InspeccionVehiculoFilter {
  tipo_inspeccion?: TipoInspeccion;
  tipo_vehiculo?: TipoVehiculo;
  resultado?: ResultadoInspeccion;
  estado_vehiculo?: EstadoVehiculo;
  placa?: string;
  inspector?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
}

// ============================================
// RESUMENES Y ESTADISTICAS
// ============================================

export interface ResumenRiesgosViales {
  total: number;
  por_nivel: Array<{ nivel_riesgo: NivelRiesgoVial; cantidad: number }>;
  por_estado: Array<{ estado: EstadoRiesgoVial; cantidad: number }>;
  por_categoria: Array<{ categoria: CategoriaFactor; cantidad: number }>;
  por_pilar: Array<{ pilar_pesv: PilarPESV; cantidad: number }>;
  por_tipo_vehiculo: Array<{ tipo_vehiculo: TipoVehiculo; cantidad: number }>;
}

export interface ResumenControlesViales {
  total: number;
  por_estado: Array<{ estado: EstadoControlVial; cantidad: number }>;
  por_tipo: Array<{ tipo_control: TipoControlVial; cantidad: number }>;
  eficaces: number;
  no_eficaces: number;
}

export interface ResumenIncidentesViales {
  total: number;
  por_tipo: Array<{ tipo_incidente: TipoIncidenteVial; cantidad: number }>;
  por_severidad: Array<{ severidad: SeveridadIncidente; cantidad: number }>;
  por_estado: Array<{ estado_investigacion: EstadoInvestigacion; cantidad: number }>;
  total_lesionados: number;
  total_fallecidos: number;
  costo_total: number;
}

export interface ResumenInspeccionesVehiculo {
  total: number;
  por_resultado: Array<{ resultado: ResultadoInspeccion; cantidad: number }>;
  por_tipo: Array<{ tipo_inspeccion: TipoInspeccion; cantidad: number }>;
  promedio_cumplimiento: number;
}

export interface EstadisticasPESV {
  riesgos: ResumenRiesgosViales;
  controles: ResumenControlesViales;
  incidentes: ResumenIncidentesViales;
  inspecciones: ResumenInspeccionesVehiculo;
  indicadores: {
    tasa_accidentalidad: number;
    incidentes_por_millon_km: number;
    cumplimiento_mantenimiento: number;
    cumplimiento_inspecciones: number;
  };
}

// ============================================
// LABELS Y COLORES PARA UI
// ============================================

export const CATEGORIA_FACTOR_LABELS: Record<CategoriaFactor, string> = {
  [CategoriaFactor.HUMANO]: 'Factor Humano',
  [CategoriaFactor.VEHICULO]: 'Factor Vehiculo',
  [CategoriaFactor.VIA]: 'Factor Via',
  [CategoriaFactor.AMBIENTAL]: 'Factor Ambiental',
  [CategoriaFactor.ORGANIZACIONAL]: 'Factor Organizacional',
};

export const CATEGORIA_FACTOR_COLORS: Record<CategoriaFactor, string> = {
  [CategoriaFactor.HUMANO]: 'bg-red-100 text-red-800',
  [CategoriaFactor.VEHICULO]: 'bg-orange-100 text-orange-800',
  [CategoriaFactor.VIA]: 'bg-yellow-100 text-yellow-800',
  [CategoriaFactor.AMBIENTAL]: 'bg-green-100 text-green-800',
  [CategoriaFactor.ORGANIZACIONAL]: 'bg-blue-100 text-blue-800',
};

export const NIVEL_RIESGO_VIAL_LABELS: Record<NivelRiesgoVial, string> = {
  [NivelRiesgoVial.BAJO]: 'Bajo',
  [NivelRiesgoVial.MEDIO]: 'Medio',
  [NivelRiesgoVial.ALTO]: 'Alto',
  [NivelRiesgoVial.MUY_ALTO]: 'Muy Alto',
};

export const NIVEL_RIESGO_VIAL_COLORS: Record<NivelRiesgoVial, string> = {
  [NivelRiesgoVial.BAJO]: 'bg-green-100 text-green-800',
  [NivelRiesgoVial.MEDIO]: 'bg-yellow-100 text-yellow-800',
  [NivelRiesgoVial.ALTO]: 'bg-orange-100 text-orange-800',
  [NivelRiesgoVial.MUY_ALTO]: 'bg-red-100 text-red-800',
};

export const ESTADO_RIESGO_VIAL_LABELS: Record<EstadoRiesgoVial, string> = {
  [EstadoRiesgoVial.IDENTIFICADO]: 'Identificado',
  [EstadoRiesgoVial.EVALUADO]: 'Evaluado',
  [EstadoRiesgoVial.EN_TRATAMIENTO]: 'En Tratamiento',
  [EstadoRiesgoVial.CONTROLADO]: 'Controlado',
  [EstadoRiesgoVial.ACEPTADO]: 'Aceptado',
};

export const ESTADO_RIESGO_VIAL_COLORS: Record<EstadoRiesgoVial, string> = {
  [EstadoRiesgoVial.IDENTIFICADO]: 'bg-gray-100 text-gray-800',
  [EstadoRiesgoVial.EVALUADO]: 'bg-blue-100 text-blue-800',
  [EstadoRiesgoVial.EN_TRATAMIENTO]: 'bg-yellow-100 text-yellow-800',
  [EstadoRiesgoVial.CONTROLADO]: 'bg-green-100 text-green-800',
  [EstadoRiesgoVial.ACEPTADO]: 'bg-purple-100 text-purple-800',
};

export const TIPO_CONTROL_VIAL_LABELS: Record<TipoControlVial, string> = {
  [TipoControlVial.ELIMINACION]: 'Eliminacion',
  [TipoControlVial.SUSTITUCION]: 'Sustitucion',
  [TipoControlVial.INGENIERIA]: 'Ingenieria',
  [TipoControlVial.ADMINISTRATIVO]: 'Administrativo',
  [TipoControlVial.EPP]: 'EPP',
};

export const ESTADO_CONTROL_VIAL_LABELS: Record<EstadoControlVial, string> = {
  [EstadoControlVial.PLANIFICADO]: 'Planificado',
  [EstadoControlVial.EN_IMPLEMENTACION]: 'En Implementacion',
  [EstadoControlVial.IMPLEMENTADO]: 'Implementado',
  [EstadoControlVial.EN_SEGUIMIENTO]: 'En Seguimiento',
};

export const ESTADO_CONTROL_VIAL_COLORS: Record<EstadoControlVial, string> = {
  [EstadoControlVial.PLANIFICADO]: 'bg-blue-100 text-blue-800',
  [EstadoControlVial.EN_IMPLEMENTACION]: 'bg-yellow-100 text-yellow-800',
  [EstadoControlVial.IMPLEMENTADO]: 'bg-green-100 text-green-800',
  [EstadoControlVial.EN_SEGUIMIENTO]: 'bg-purple-100 text-purple-800',
};

export const TIPO_INCIDENTE_VIAL_LABELS: Record<TipoIncidenteVial, string> = {
  [TipoIncidenteVial.COLISION]: 'Colision',
  [TipoIncidenteVial.VOLCAMIENTO]: 'Volcamiento',
  [TipoIncidenteVial.ATROPELLO]: 'Atropello',
  [TipoIncidenteVial.CAIDA]: 'Caida',
  [TipoIncidenteVial.CUASI_ACCIDENTE]: 'Cuasi Accidente',
  [TipoIncidenteVial.OTRO]: 'Otro',
};

export const SEVERIDAD_INCIDENTE_LABELS: Record<SeveridadIncidente, string> = {
  [SeveridadIncidente.LEVE]: 'Leve',
  [SeveridadIncidente.MODERADO]: 'Moderado',
  [SeveridadIncidente.GRAVE]: 'Grave',
  [SeveridadIncidente.FATAL]: 'Fatal',
};

export const SEVERIDAD_INCIDENTE_COLORS: Record<SeveridadIncidente, string> = {
  [SeveridadIncidente.LEVE]: 'bg-green-100 text-green-800',
  [SeveridadIncidente.MODERADO]: 'bg-yellow-100 text-yellow-800',
  [SeveridadIncidente.GRAVE]: 'bg-orange-100 text-orange-800',
  [SeveridadIncidente.FATAL]: 'bg-red-100 text-red-800',
};

export const ESTADO_INVESTIGACION_LABELS: Record<EstadoInvestigacion, string> = {
  [EstadoInvestigacion.PENDIENTE]: 'Pendiente',
  [EstadoInvestigacion.EN_PROCESO]: 'En Proceso',
  [EstadoInvestigacion.COMPLETADA]: 'Completada',
  [EstadoInvestigacion.CERRADA]: 'Cerrada',
};

export const ESTADO_INVESTIGACION_COLORS: Record<EstadoInvestigacion, string> = {
  [EstadoInvestigacion.PENDIENTE]: 'bg-gray-100 text-gray-800',
  [EstadoInvestigacion.EN_PROCESO]: 'bg-yellow-100 text-yellow-800',
  [EstadoInvestigacion.COMPLETADA]: 'bg-blue-100 text-blue-800',
  [EstadoInvestigacion.CERRADA]: 'bg-green-100 text-green-800',
};

export const TIPO_VEHICULO_LABELS: Record<TipoVehiculo, string> = {
  [TipoVehiculo.MOTOCICLETA]: 'Motocicleta',
  [TipoVehiculo.AUTOMOVIL]: 'Automovil',
  [TipoVehiculo.CAMIONETA]: 'Camioneta',
  [TipoVehiculo.CAMION]: 'Camion',
  [TipoVehiculo.TRACTOMULA]: 'Tractomula',
  [TipoVehiculo.BUS]: 'Bus',
  [TipoVehiculo.BICICLETA]: 'Bicicleta',
  [TipoVehiculo.OTRO]: 'Otro',
};

export const RESULTADO_INSPECCION_LABELS: Record<ResultadoInspeccion, string> = {
  [ResultadoInspeccion.APROBADO]: 'Aprobado',
  [ResultadoInspeccion.APROBADO_CON_OBSERVACIONES]: 'Aprobado con Observaciones',
  [ResultadoInspeccion.RECHAZADO]: 'Rechazado',
};

export const RESULTADO_INSPECCION_COLORS: Record<ResultadoInspeccion, string> = {
  [ResultadoInspeccion.APROBADO]: 'bg-green-100 text-green-800',
  [ResultadoInspeccion.APROBADO_CON_OBSERVACIONES]: 'bg-yellow-100 text-yellow-800',
  [ResultadoInspeccion.RECHAZADO]: 'bg-red-100 text-red-800',
};

export const TIPO_INSPECCION_LABELS: Record<TipoInspeccion, string> = {
  [TipoInspeccion.PREOPERACIONAL]: 'Preoperacional',
  [TipoInspeccion.PERIODICA]: 'Periodica',
  [TipoInspeccion.EXTRAORDINARIA]: 'Extraordinaria',
};

export const PILAR_PESV_LABELS: Record<PilarPESV, string> = {
  [PilarPESV.FORTALECIMIENTO_GESTION]: 'Fortalecimiento de la Gestion',
  [PilarPESV.COMPORTAMIENTO_HUMANO]: 'Comportamiento Humano',
  [PilarPESV.VEHICULOS_SEGUROS]: 'Vehiculos Seguros',
  [PilarPESV.INFRAESTRUCTURA_SEGURA]: 'Infraestructura Segura',
  [PilarPESV.ATENCION_VICTIMAS]: 'Atencion a Victimas',
};

export const PILAR_PESV_COLORS: Record<PilarPESV, string> = {
  [PilarPESV.FORTALECIMIENTO_GESTION]: 'bg-blue-100 text-blue-800',
  [PilarPESV.COMPORTAMIENTO_HUMANO]: 'bg-purple-100 text-purple-800',
  [PilarPESV.VEHICULOS_SEGUROS]: 'bg-orange-100 text-orange-800',
  [PilarPESV.INFRAESTRUCTURA_SEGURA]: 'bg-green-100 text-green-800',
  [PilarPESV.ATENCION_VICTIMAS]: 'bg-red-100 text-red-800',
};

// ============================================
// CHECKLIST ITEMS (Catalogo de items de inspeccion)
// ============================================

export const ITEMS_CHECKLIST: ChecklistItem[] = [
  // Documentos
  {
    id: 'DOC001',
    categoria: 'Documentos',
    item: 'Licencia de Conduccion',
    descripcion: 'Vigente y categoria correcta',
    critico: true,
  },
  { id: 'DOC002', categoria: 'Documentos', item: 'SOAT', descripcion: 'Vigente', critico: true },
  {
    id: 'DOC003',
    categoria: 'Documentos',
    item: 'Revision Tecnicomecanica',
    descripcion: 'Vigente',
    critico: true,
  },
  {
    id: 'DOC004',
    categoria: 'Documentos',
    item: 'Tarjeta de Propiedad',
    descripcion: 'Original o copia',
    critico: true,
  },
  {
    id: 'DOC005',
    categoria: 'Documentos',
    item: 'Poliza de Responsabilidad Civil',
    descripcion: 'Vigente',
    critico: false,
  },

  // Motor
  {
    id: 'MOT001',
    categoria: 'Motor',
    item: 'Nivel de Aceite',
    descripcion: 'En nivel adecuado',
    critico: true,
  },
  {
    id: 'MOT002',
    categoria: 'Motor',
    item: 'Nivel de Refrigerante',
    descripcion: 'En nivel adecuado',
    critico: true,
  },
  {
    id: 'MOT003',
    categoria: 'Motor',
    item: 'Nivel de Liquido de Frenos',
    descripcion: 'En nivel adecuado',
    critico: true,
  },
  {
    id: 'MOT004',
    categoria: 'Motor',
    item: 'Correas',
    descripcion: 'Sin grietas ni desgaste',
    critico: false,
  },
  {
    id: 'MOT005',
    categoria: 'Motor',
    item: 'Mangueras',
    descripcion: 'Sin fugas ni deterioro',
    critico: false,
  },

  // Llantas
  {
    id: 'LLA001',
    categoria: 'Llantas',
    item: 'Profundidad Labrado',
    descripcion: 'Minimo 1.6mm',
    critico: true,
  },
  {
    id: 'LLA002',
    categoria: 'Llantas',
    item: 'Presion de Aire',
    descripcion: 'Segun especificacion',
    critico: true,
  },
  {
    id: 'LLA003',
    categoria: 'Llantas',
    item: 'Estado General',
    descripcion: 'Sin cortes ni abultamientos',
    critico: true,
  },
  {
    id: 'LLA004',
    categoria: 'Llantas',
    item: 'Llanta de Repuesto',
    descripcion: 'En buen estado',
    critico: false,
  },

  // Frenos
  {
    id: 'FRE001',
    categoria: 'Frenos',
    item: 'Freno de Servicio',
    descripcion: 'Funcionamiento correcto',
    critico: true,
  },
  {
    id: 'FRE002',
    categoria: 'Frenos',
    item: 'Freno de Emergencia',
    descripcion: 'Funcionamiento correcto',
    critico: true,
  },
  {
    id: 'FRE003',
    categoria: 'Frenos',
    item: 'Pastillas/Bandas',
    descripcion: 'Con espesor adecuado',
    critico: true,
  },

  // Luces
  {
    id: 'LUC001',
    categoria: 'Luces',
    item: 'Luces Delanteras',
    descripcion: 'Funcionan correctamente',
    critico: true,
  },
  {
    id: 'LUC002',
    categoria: 'Luces',
    item: 'Luces Traseras',
    descripcion: 'Funcionan correctamente',
    critico: true,
  },
  {
    id: 'LUC003',
    categoria: 'Luces',
    item: 'Direccionales',
    descripcion: 'Funcionan correctamente',
    critico: true,
  },
  {
    id: 'LUC004',
    categoria: 'Luces',
    item: 'Luces de Freno',
    descripcion: 'Funcionan correctamente',
    critico: true,
  },
  {
    id: 'LUC005',
    categoria: 'Luces',
    item: 'Luces de Reversa',
    descripcion: 'Funcionan correctamente',
    critico: false,
  },

  // Seguridad
  {
    id: 'SEG001',
    categoria: 'Seguridad',
    item: 'Cinturones de Seguridad',
    descripcion: 'Funcionan correctamente',
    critico: true,
  },
  {
    id: 'SEG002',
    categoria: 'Seguridad',
    item: 'Extintor',
    descripcion: 'Vigente y cargado',
    critico: true,
  },
  {
    id: 'SEG003',
    categoria: 'Seguridad',
    item: 'Botiquin',
    descripcion: 'Completo y vigente',
    critico: true,
  },
  {
    id: 'SEG004',
    categoria: 'Seguridad',
    item: 'Kit de Carretera',
    descripcion: 'Completo',
    critico: true,
  },
  {
    id: 'SEG005',
    categoria: 'Seguridad',
    item: 'Espejos Retrovisores',
    descripcion: 'Completos y ajustados',
    critico: true,
  },

  // Carroceria
  {
    id: 'CAR001',
    categoria: 'Carroceria',
    item: 'Estado General',
    descripcion: 'Sin danos significativos',
    critico: false,
  },
  {
    id: 'CAR002',
    categoria: 'Carroceria',
    item: 'Puertas',
    descripcion: 'Abren y cierran correctamente',
    critico: false,
  },
  {
    id: 'CAR003',
    categoria: 'Carroceria',
    item: 'Parabrisas',
    descripcion: 'Sin grietas o fisuras',
    critico: true,
  },
  {
    id: 'CAR004',
    categoria: 'Carroceria',
    item: 'Limpiaparabrisas',
    descripcion: 'Funcionan correctamente',
    critico: false,
  },
];

// ============================================
// FUNCIONES HELPER
// ============================================

/**
 * Calcula el valor del riesgo vial (Probabilidad x Consecuencia x Exposicion)
 */
export function calcularValoracionRiesgo(
  probabilidad: number,
  consecuencia: number,
  exposicion: number
): number {
  return probabilidad * consecuencia * exposicion;
}

/**
 * Determina el nivel de riesgo basado en el valor calculado
 */
export function calcularNivelRiesgo(valorRiesgo: number): NivelRiesgoVial {
  if (valorRiesgo >= 600) return NivelRiesgoVial.MUY_ALTO;
  if (valorRiesgo >= 150) return NivelRiesgoVial.ALTO;
  if (valorRiesgo >= 40) return NivelRiesgoVial.MEDIO;
  return NivelRiesgoVial.BAJO;
}

/**
 * Verifica si un riesgo requiere accion inmediata
 */
export function requiereAccionInmediata(nivel: NivelRiesgoVial): boolean {
  return nivel === NivelRiesgoVial.MUY_ALTO || nivel === NivelRiesgoVial.ALTO;
}

/**
 * Verifica si un incidente es grave (reportable a ARL)
 */
export function esAccidenteGrave(
  incidente: Pick<IncidenteVial, 'severidad' | 'fallecidos' | 'lesionados'>
): boolean {
  return (
    incidente.severidad === SeveridadIncidente.GRAVE ||
    incidente.severidad === SeveridadIncidente.FATAL ||
    incidente.fallecidos > 0 ||
    incidente.lesionados >= 3
  );
}

/**
 * Calcula el porcentaje de cumplimiento de una inspeccion
 */
export function calcularPorcentajeCumplimiento(resultados: ResultadoChecklistItem[]): number {
  const itemsEvaluados = resultados.filter((r) => r.cumple !== null);
  if (itemsEvaluados.length === 0) return 0;
  const cumplidos = itemsEvaluados.filter((r) => r.cumple === true).length;
  return Math.round((cumplidos / itemsEvaluados.length) * 100);
}

/**
 * Determina el resultado de la inspeccion basado en los items criticos
 */
export function determinarResultadoInspeccion(
  resultados: ResultadoChecklistItem[],
  porcentaje: number
): ResultadoInspeccion {
  // Verificar items criticos
  const itemsCriticos = ITEMS_CHECKLIST.filter((item) => item.critico);
  const resultadosCriticos = resultados.filter((r) =>
    itemsCriticos.some((ic) => ic.id === r.item_id)
  );

  const algunCriticoNoCumple = resultadosCriticos.some((r) => r.cumple === false);

  if (algunCriticoNoCumple) {
    return ResultadoInspeccion.RECHAZADO;
  }

  if (porcentaje >= 90) {
    return ResultadoInspeccion.APROBADO;
  }

  return ResultadoInspeccion.APROBADO_CON_OBSERVACIONES;
}
