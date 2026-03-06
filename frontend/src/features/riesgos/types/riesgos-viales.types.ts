/**
 * Tipos para Riesgos Viales - PESV
 * Plan Estratégico de Seguridad Vial - Resolución 40595/2022
 *
 * FUENTE: backend/apps/motor_riesgos/riesgos_viales/
 *   - models.py    (choices, campos, validators)
 *   - serializers.py (campos expuestos, read_only, writable)
 *   - views.py     (@action endpoints, response shapes)
 */

// ============================================
// ENUMS — copiados EXACTO de models.py choices
// ============================================

/** TipoRiesgoVial.CATEGORIA_CHOICES */
export enum CategoriaFactor {
  HUMANO = 'HUMANO',
  VEHICULO = 'VEHICULO',
  VIA = 'VIA',
  AMBIENTAL = 'AMBIENTAL',
}

/** RiesgoVial.NIVEL_RIESGO_CHOICES */
export enum NivelRiesgoVial {
  BAJO = 'BAJO',
  MEDIO = 'MEDIO',
  ALTO = 'ALTO',
  CRITICO = 'CRITICO',
}

/** RiesgoVial.ESTADO_CHOICES */
export enum EstadoRiesgoVial {
  IDENTIFICADO = 'IDENTIFICADO',
  EN_EVALUACION = 'EN_EVALUACION',
  EN_TRATAMIENTO = 'EN_TRATAMIENTO',
  CONTROLADO = 'CONTROLADO',
  CERRADO = 'CERRADO',
}

/** RiesgoVial.efectividad_controles choices */
export enum EfectividadControles {
  ALTA = 'ALTA',
  MEDIA = 'MEDIA',
  BAJA = 'BAJA',
  NO_EVALUADA = 'NO_EVALUADA',
}

/** ControlVial.TIPO_CONTROL_CHOICES */
export enum TipoControlVial {
  PREVENTIVO = 'PREVENTIVO',
  CORRECTIVO = 'CORRECTIVO',
  DETECTIVO = 'DETECTIVO',
}

/** ControlVial.MOMENTO_APLICACION_CHOICES */
export enum MomentoAplicacion {
  ANTES_VIAJE = 'ANTES_VIAJE',
  DURANTE_VIAJE = 'DURANTE_VIAJE',
  DESPUES_VIAJE = 'DESPUES_VIAJE',
  PERMANENTE = 'PERMANENTE',
}

/** ControlVial.jerarquia choices */
export enum JerarquiaControl {
  ELIMINACION = 'ELIMINACION',
  SUSTITUCION = 'SUSTITUCION',
  CONTROLES_INGENIERIA = 'CONTROLES_INGENIERIA',
  CONTROLES_ADMIN = 'CONTROLES_ADMIN',
  SENALIZACION = 'SENALIZACION',
  EPP = 'EPP',
}

/** ControlVial.ESTADO_CHOICES */
export enum EstadoControlVial {
  PROPUESTO = 'PROPUESTO',
  APROBADO = 'APROBADO',
  EN_IMPLEMENTACION = 'EN_IMPLEMENTACION',
  IMPLEMENTADO = 'IMPLEMENTADO',
  SUSPENDIDO = 'SUSPENDIDO',
}

/** IncidenteVial.TIPO_INCIDENTE_CHOICES */
export enum TipoIncidenteVial {
  ACCIDENTE_TRANSITO = 'ACCIDENTE_TRANSITO',
  INCIDENTE_MENOR = 'INCIDENTE_MENOR',
  CASI_ACCIDENTE = 'CASI_ACCIDENTE',
  INFRACCION = 'INFRACCION',
}

/** IncidenteVial.GRAVEDAD_CHOICES */
export enum GravedadIncidente {
  SOLO_DANOS = 'SOLO_DANOS',
  LESION_LEVE = 'LESION_LEVE',
  LESION_GRAVE = 'LESION_GRAVE',
  FATAL = 'FATAL',
}

/** IncidenteVial.ESTADO_INVESTIGACION_CHOICES */
export enum EstadoInvestigacion {
  REPORTADO = 'REPORTADO',
  EN_INVESTIGACION = 'EN_INVESTIGACION',
  ANALISIS_CAUSAL = 'ANALISIS_CAUSAL',
  PLAN_ACCION = 'PLAN_ACCION',
  CERRADO = 'CERRADO',
}

/** InspeccionVehiculo.RESULTADO_CHOICES */
export enum ResultadoInspeccion {
  APROBADO = 'APROBADO',
  APROBADO_OBSERVACIONES = 'APROBADO_OBSERVACIONES',
  RECHAZADO = 'RECHAZADO',
}

// ============================================
// TIPO/FACTOR DE RIESGO VIAL (Catálogo)
// Serializer: TipoRiesgoVialSerializer (list + detail + create/update)
// ============================================

/** TipoRiesgoVialSerializer — usado para list, detail, create y update */
export interface TipoRiesgoVial {
  id: number;
  codigo: string;
  categoria: CategoriaFactor;
  categoria_display: string;
  nombre: string;
  descripcion: string;
  consecuencias_posibles: string;
  marco_legal: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Campos write del TipoRiesgoVialSerializer */
export interface TipoRiesgoVialCreate {
  codigo: string;
  categoria: CategoriaFactor;
  nombre: string;
  descripcion: string;
  consecuencias_posibles?: string;
  marco_legal?: string;
  is_active?: boolean;
}

export type TipoRiesgoVialUpdate = Partial<TipoRiesgoVialCreate>;

// ============================================
// RIESGO VIAL
// Serializers: RiesgoVialListSerializer, RiesgoVialDetailSerializer,
//              RiesgoVialCreateUpdateSerializer
// ============================================

/** RiesgoVialListSerializer — campos del listado */
export interface RiesgoVialList {
  id: number;
  codigo: string;
  tipo_riesgo: number;
  tipo_riesgo_nombre: string;
  tipo_riesgo_categoria: string;
  descripcion: string;
  proceso_afectado: string;
  tipo_vehiculo: string;
  // Evaluación inherente
  frecuencia: number;
  probabilidad: number;
  severidad: number;
  valoracion_riesgo: number;
  nivel_riesgo: NivelRiesgoVial;
  nivel_riesgo_display: string;
  // Evaluación residual
  nivel_residual: string;
  porcentaje_reduccion: number | null;
  // Responsable y estado
  responsable: number | null;
  responsable_nombre: string | null;
  estado: EstadoRiesgoVial;
  estado_display: string;
  fecha_identificacion: string;
  fecha_revision: string | null;
  // Propiedades calculadas
  requiere_accion_inmediata: boolean;
  // Auditoría
  created_by_nombre: string | null;
  created_at: string;
  updated_at: string;
}

/** RiesgoVialDetailSerializer — fields = '__all__' + campos extra */
export interface RiesgoVialDetail extends RiesgoVialList {
  tipo_riesgo_data: TipoRiesgoVial;
  rutas_afectadas: string;
  // Controles actuales
  controles_actuales: string;
  efectividad_controles: EfectividadControles;
  efectividad_controles_display: string;
  // Evaluación residual completa
  frecuencia_residual: number | null;
  probabilidad_residual: number | null;
  severidad_residual: number | null;
  valoracion_residual: number | null;
  nivel_residual_display: string;
  // Fechas
  fecha_evaluacion: string | null;
  // Observaciones
  observaciones: string;
  // Empresa
  empresa_id: number;
  // Soft delete
  is_active: boolean;
  deleted_at: string | null;
  // Audit
  created_by: number | null;
  updated_by: number | null;
}

/** RiesgoVialCreateUpdateSerializer — campos writable */
export interface RiesgoVialCreate {
  codigo: string;
  tipo_riesgo: number;
  descripcion: string;
  proceso_afectado: string;
  rutas_afectadas?: string;
  tipo_vehiculo?: string;
  // Evaluación inherente
  frecuencia: number;
  probabilidad: number;
  severidad: number;
  // Controles
  controles_actuales?: string;
  efectividad_controles?: EfectividadControles;
  // Evaluación residual
  frecuencia_residual?: number | null;
  probabilidad_residual?: number | null;
  severidad_residual?: number | null;
  // Responsable y estado
  responsable?: number | null;
  estado?: EstadoRiesgoVial;
  fecha_identificacion: string;
  fecha_evaluacion?: string | null;
  fecha_revision?: string | null;
  observaciones?: string;
  empresa_id: number;
}

export type RiesgoVialUpdate = Partial<RiesgoVialCreate>;

export interface RiesgoVialFilter {
  nivel_riesgo?: NivelRiesgoVial;
  estado?: EstadoRiesgoVial;
  tipo_riesgo?: number;
  responsable?: number;
  search?: string;
}

// ============================================
// CONTROL VIAL
// Serializers: ControlVialListSerializer, ControlVialDetailSerializer,
//              ControlVialCreateUpdateSerializer
// ============================================

/** ControlVialListSerializer — campos del listado */
export interface ControlVialList {
  id: number;
  riesgo_vial: number;
  riesgo_vial_codigo: string;
  riesgo_vial_descripcion: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo_control: TipoControlVial;
  tipo_control_display: string;
  momento_aplicacion: MomentoAplicacion;
  momento_aplicacion_display: string;
  jerarquia: JerarquiaControl;
  jerarquia_display: string;
  responsable: number | null;
  responsable_nombre: string | null;
  area_responsable: string;
  estado: EstadoControlVial;
  estado_display: string;
  fecha_propuesta: string;
  fecha_implementacion_programada: string | null;
  fecha_implementacion_real: string | null;
  costo_estimado: string | null;
  costo_real: string | null;
  efectividad_verificada: boolean;
  esta_atrasado: boolean;
  created_by_nombre: string | null;
  created_at: string;
  updated_at: string;
}

/** ControlVialDetailSerializer — fields = '__all__' + extras */
export interface ControlVialDetail extends ControlVialList {
  riesgo_vial_data: RiesgoVialList;
  recursos_necesarios: string;
  indicador_efectividad: string;
  fecha_verificacion: string | null;
  resultado_verificacion: string;
  documentos_soporte: string;
  evidencias: string;
  observaciones: string;
  empresa_id: number;
  is_active: boolean;
  deleted_at: string | null;
  created_by: number | null;
  updated_by: number | null;
}

/** ControlVialCreateUpdateSerializer — campos writable */
export interface ControlVialCreate {
  riesgo_vial: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo_control: TipoControlVial;
  momento_aplicacion: MomentoAplicacion;
  jerarquia: JerarquiaControl;
  responsable?: number | null;
  area_responsable: string;
  fecha_propuesta: string;
  fecha_implementacion_programada?: string | null;
  fecha_implementacion_real?: string | null;
  estado?: EstadoControlVial;
  costo_estimado?: number | null;
  costo_real?: number | null;
  recursos_necesarios?: string;
  indicador_efectividad?: string;
  efectividad_verificada?: boolean;
  fecha_verificacion?: string | null;
  resultado_verificacion?: string;
  documentos_soporte?: string;
  evidencias?: string;
  observaciones?: string;
  empresa_id: number;
}

export type ControlVialUpdate = Partial<ControlVialCreate>;

export interface ControlVialFilter {
  riesgo_vial?: number;
  tipo_control?: TipoControlVial;
  estado?: EstadoControlVial;
  jerarquia?: JerarquiaControl;
  responsable?: number;
  search?: string;
}

// ============================================
// INCIDENTE VIAL
// Serializers: IncidenteVialListSerializer, IncidenteVialDetailSerializer,
//              IncidenteVialCreateUpdateSerializer
// ============================================

/** IncidenteVialListSerializer — campos del listado */
export interface IncidenteVialList {
  id: number;
  numero_incidente: string;
  tipo_incidente: TipoIncidenteVial;
  tipo_incidente_display: string;
  gravedad: GravedadIncidente;
  gravedad_display: string;
  fecha_incidente: string;
  ubicacion: string;
  municipio: string;
  departamento: string;
  conductor_nombre: string;
  conductor_identificacion: string;
  vehiculo_placa: string;
  vehiculo_tipo: string;
  numero_lesionados: number;
  numero_fallecidos: number;
  costo_estimado_danos: number | null;
  autoridades_notificadas: boolean;
  estado_investigacion: EstadoInvestigacion;
  estado_investigacion_display: string;
  investigador: number | null;
  investigador_nombre: string | null;
  fecha_inicio_investigacion: string | null;
  fecha_cierre_investigacion: string | null;
  // Propiedades calculadas
  es_accidente_grave: boolean;
  dias_investigacion_abierta: number | null;
  // Auditoría
  created_by_nombre: string | null;
  created_at: string;
  updated_at: string;
}

/** IncidenteVialDetailSerializer — fields = '__all__' + extras */
export interface IncidenteVialDetail extends IncidenteVialList {
  coordenadas: string;
  conductor_licencia: string;
  // Descripción
  descripcion_hechos: string;
  condiciones_climaticas: string;
  condiciones_via: string;
  condiciones_vehiculo: string;
  // Consecuencias detalle
  descripcion_lesiones: string;
  danos_vehiculo_propio: string;
  danos_terceros: string;
  // Autoridades detalle
  numero_informe_policial: string;
  comparendo_numero: string;
  // Investigación
  causas_inmediatas: string;
  causas_basicas: string;
  causas_raiz: string;
  // Relaciones
  riesgos_relacionados: number[];
  riesgos_relacionados_data: RiesgoVialList[];
  // Lecciones
  lecciones_aprendidas: string;
  acciones_correctivas: string;
  // Evidencias
  evidencias_fotograficas: string;
  documentos_adjuntos: string;
  // Empresa
  empresa_id: number;
  // Soft delete / audit
  is_active: boolean;
  deleted_at: string | null;
  created_by: number | null;
  updated_by: number | null;
}

/** IncidenteVialCreateUpdateSerializer — campos writable */
export interface IncidenteVialCreate {
  numero_incidente: string;
  tipo_incidente: TipoIncidenteVial;
  gravedad: GravedadIncidente;
  fecha_incidente: string;
  ubicacion: string;
  municipio: string;
  departamento: string;
  coordenadas?: string;
  // Involucrados
  conductor_nombre: string;
  conductor_identificacion: string;
  conductor_licencia?: string;
  vehiculo_placa: string;
  vehiculo_tipo?: string;
  // Descripción
  descripcion_hechos: string;
  condiciones_climaticas?: string;
  condiciones_via?: string;
  condiciones_vehiculo?: string;
  // Consecuencias
  numero_lesionados?: number;
  numero_fallecidos?: number;
  descripcion_lesiones?: string;
  // Daños
  danos_vehiculo_propio?: string;
  danos_terceros?: string;
  costo_estimado_danos?: number | null;
  // Autoridades
  autoridades_notificadas?: boolean;
  numero_informe_policial?: string;
  comparendo_numero?: string;
  // Investigación
  estado_investigacion?: EstadoInvestigacion;
  investigador?: number | null;
  fecha_inicio_investigacion?: string | null;
  fecha_cierre_investigacion?: string | null;
  causas_inmediatas?: string;
  causas_basicas?: string;
  causas_raiz?: string;
  // Relaciones
  riesgos_relacionados?: number[];
  // Lecciones
  lecciones_aprendidas?: string;
  acciones_correctivas?: string;
  // Evidencias
  evidencias_fotograficas?: string;
  documentos_adjuntos?: string;
  empresa_id: number;
}

export type IncidenteVialUpdate = Partial<IncidenteVialCreate>;

export interface IncidenteVialFilter {
  tipo_incidente?: TipoIncidenteVial;
  gravedad?: GravedadIncidente;
  estado_investigacion?: EstadoInvestigacion;
  vehiculo_placa?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  search?: string;
}

// ============================================
// INSPECCIÓN VEHÍCULO
// Serializers: InspeccionVehiculoListSerializer, InspeccionVehiculoDetailSerializer,
//              InspeccionVehiculoCreateSerializer
// Backend usa 32 campos booleanos individuales para checklist, NO JSON.
// ============================================

/** InspeccionVehiculoListSerializer — campos del listado */
export interface InspeccionVehiculoList {
  id: number;
  numero_inspeccion: string;
  fecha_inspeccion: string;
  vehiculo_placa: string;
  vehiculo_tipo: string;
  conductor_nombre: string;
  conductor_identificacion: string;
  odometro: number | null;
  resultado: ResultadoInspeccion;
  resultado_display: string;
  observaciones: string;
  requiere_mantenimiento: boolean;
  fecha_mantenimiento_programado: string | null;
  mantenimiento_completado: boolean;
  porcentaje_conformidad: number;
  created_by_nombre: string | null;
  inspeccion_confirmada_por_nombre: string | null;
  fecha_confirmacion: string | null;
  created_at: string;
}

/** InspeccionVehiculoDetailSerializer — fields = '__all__' + extras */
export interface InspeccionVehiculoDetail extends InspeccionVehiculoList {
  // Checklist - 32 campos booleanos individuales
  estado_carroceria: boolean;
  limpieza_vehiculo: boolean;
  luces_delanteras: boolean;
  luces_traseras: boolean;
  luces_direccionales: boolean;
  luces_freno: boolean;
  luces_emergencia: boolean;
  espejo_retrovisor_int: boolean;
  espejo_lateral_izq: boolean;
  espejo_lateral_der: boolean;
  estado_llantas: boolean;
  llanta_repuesto: boolean;
  freno_servicio: boolean;
  freno_emergencia: boolean;
  sistema_direccion: boolean;
  sistema_suspension: boolean;
  nivel_aceite_motor: boolean;
  nivel_refrigerante: boolean;
  nivel_liquido_frenos: boolean;
  nivel_liquido_direccion: boolean;
  limpiabrisas: boolean;
  parabrisas: boolean;
  cinturones_seguridad: boolean;
  bocina: boolean;
  alarma_reversa: boolean;
  extintor: boolean;
  botiquin: boolean;
  kit_carretera: boolean;
  chaleco_reflectivo: boolean;
  soat_vigente: boolean;
  revision_tecnomecanica: boolean;
  tarjeta_propiedad: boolean;
  // Observaciones detalle
  items_rechazados: string;
  // Confirmación
  inspeccion_confirmada_por: number | null;
  // Empresa
  empresa_id: number;
  // Soft delete / audit
  is_active: boolean;
  deleted_at: string | null;
  created_by: number | null;
  updated_by: number | null;
  updated_at: string;
}

/** InspeccionVehiculoCreateSerializer — campos writable */
export interface InspeccionVehiculoCreate {
  numero_inspeccion: string;
  vehiculo_placa: string;
  vehiculo_tipo?: string;
  conductor_nombre: string;
  conductor_identificacion: string;
  odometro?: number | null;
  // Checklist - 32 campos booleanos individuales
  estado_carroceria?: boolean;
  limpieza_vehiculo?: boolean;
  luces_delanteras?: boolean;
  luces_traseras?: boolean;
  luces_direccionales?: boolean;
  luces_freno?: boolean;
  luces_emergencia?: boolean;
  espejo_retrovisor_int?: boolean;
  espejo_lateral_izq?: boolean;
  espejo_lateral_der?: boolean;
  estado_llantas?: boolean;
  llanta_repuesto?: boolean;
  freno_servicio?: boolean;
  freno_emergencia?: boolean;
  sistema_direccion?: boolean;
  sistema_suspension?: boolean;
  nivel_aceite_motor?: boolean;
  nivel_refrigerante?: boolean;
  nivel_liquido_frenos?: boolean;
  nivel_liquido_direccion?: boolean;
  limpiabrisas?: boolean;
  parabrisas?: boolean;
  cinturones_seguridad?: boolean;
  bocina?: boolean;
  alarma_reversa?: boolean;
  extintor?: boolean;
  botiquin?: boolean;
  kit_carretera?: boolean;
  chaleco_reflectivo?: boolean;
  soat_vigente?: boolean;
  revision_tecnomecanica?: boolean;
  tarjeta_propiedad?: boolean;
  // Observaciones
  observaciones?: string;
  items_rechazados?: string;
  empresa_id: number;
}

/** No existe UpdateSerializer en backend — InspeccionVehiculo list serializer is read-heavy */
export type InspeccionVehiculoUpdate = Partial<InspeccionVehiculoCreate>;

export interface InspeccionVehiculoFilter {
  vehiculo_placa?: string;
  resultado?: ResultadoInspeccion;
  requiere_mantenimiento?: string; // 'true'|'false' como query param
  fecha_desde?: string;
  fecha_hasta?: string;
  search?: string;
}

// ============================================
// RESPUESTAS DE @action ENDPOINTS
// ============================================

/** GET /riesgos/estadisticas/ */
export interface EstadisticasRiesgosViales {
  total_riesgos: number;
  por_nivel: Record<NivelRiesgoVial, number>;
  por_estado: Record<EstadoRiesgoVial, number>;
  por_categoria: Array<{ tipo_riesgo__categoria: string; count: number }>;
  valoracion_promedio: number;
  requieren_accion_inmediata: number;
}

/** GET /riesgos/criticos/ */
export interface RiesgosCriticosResponse {
  count: number;
  riesgos: RiesgoVialList[];
}

/** GET /incidentes/estadisticas/ */
export interface EstadisticasIncidentesViales {
  total_incidentes: number;
  por_tipo: Record<TipoIncidenteVial, number>;
  por_gravedad: Record<GravedadIncidente, number>;
  por_estado_investigacion: Record<EstadoInvestigacion, number>;
  total_lesionados: number;
  total_fallecidos: number;
  costo_total_estimado: number;
}

/** GET /incidentes/graves/ */
export interface IncidentesGravesResponse {
  count: number;
  incidentes_graves: IncidenteVialList[];
}

/** GET /controles/atrasados/ */
export interface ControlesAtrasadosResponse {
  count: number;
  controles_atrasados: ControlVialList[];
}

/** GET /controles/por-riesgo/{id}/ */
export interface ControlesPorRiesgoResponse {
  count: number;
  controles: ControlVialList[];
}

/** GET /inspecciones/por-vehiculo/{placa}/ */
export interface InspeccionesPorVehiculoResponse {
  count: number;
  vehiculo_placa: string;
  inspecciones: InspeccionVehiculoList[];
}

/** POST /incidentes/{id}/iniciar-investigacion/ */
export interface IniciarInvestigacionPayload {
  investigador_id: number;
  fecha_inicio?: string;
}

export interface IniciarInvestigacionResponse {
  message: string;
  incidente: IncidenteVialDetail;
}

/** GET /factores/por-categoria/ */
export type FactoresPorCategoriaResponse = Record<CategoriaFactor, TipoRiesgoVial[]>;

// ============================================
// CHECKLIST ITEMS — metadata para UI
// Los 32 campos booleanos del backend agrupados
// ============================================

export interface ChecklistItemMeta {
  field: keyof InspeccionVehiculoCreate;
  label: string;
  critico: boolean;
}

export const CHECKLIST_CARROCERIA: ChecklistItemMeta[] = [
  { field: 'estado_carroceria', label: 'Estado de Carrocería', critico: false },
  { field: 'limpieza_vehiculo', label: 'Limpieza del Vehículo', critico: false },
  { field: 'parabrisas', label: 'Parabrisas (sin fisuras)', critico: true },
  { field: 'limpiabrisas', label: 'Limpiabrisas', critico: false },
];

export const CHECKLIST_LUCES: ChecklistItemMeta[] = [
  { field: 'luces_delanteras', label: 'Luces Delanteras', critico: true },
  { field: 'luces_traseras', label: 'Luces Traseras', critico: true },
  { field: 'luces_direccionales', label: 'Luces Direccionales', critico: true },
  { field: 'luces_freno', label: 'Luces de Freno', critico: true },
  { field: 'luces_emergencia', label: 'Luces de Emergencia', critico: false },
];

export const CHECKLIST_ESPEJOS: ChecklistItemMeta[] = [
  { field: 'espejo_retrovisor_int', label: 'Espejo Retrovisor Interior', critico: true },
  { field: 'espejo_lateral_izq', label: 'Espejo Lateral Izquierdo', critico: true },
  { field: 'espejo_lateral_der', label: 'Espejo Lateral Derecho', critico: true },
];

export const CHECKLIST_LLANTAS: ChecklistItemMeta[] = [
  { field: 'estado_llantas', label: 'Estado de Llantas (profundidad, presión)', critico: true },
  { field: 'llanta_repuesto', label: 'Llanta de Repuesto', critico: false },
];

export const CHECKLIST_FRENOS: ChecklistItemMeta[] = [
  { field: 'freno_servicio', label: 'Freno de Servicio', critico: true },
  { field: 'freno_emergencia', label: 'Freno de Emergencia', critico: true },
  { field: 'sistema_direccion', label: 'Sistema de Dirección', critico: true },
  { field: 'sistema_suspension', label: 'Sistema de Suspensión', critico: false },
];

export const CHECKLIST_NIVELES: ChecklistItemMeta[] = [
  { field: 'nivel_aceite_motor', label: 'Nivel de Aceite de Motor', critico: true },
  { field: 'nivel_refrigerante', label: 'Nivel de Refrigerante', critico: true },
  { field: 'nivel_liquido_frenos', label: 'Nivel de Líquido de Frenos', critico: true },
  { field: 'nivel_liquido_direccion', label: 'Nivel de Líquido de Dirección', critico: false },
];

export const CHECKLIST_SEGURIDAD: ChecklistItemMeta[] = [
  { field: 'cinturones_seguridad', label: 'Cinturones de Seguridad', critico: true },
  { field: 'bocina', label: 'Bocina', critico: false },
  { field: 'alarma_reversa', label: 'Alarma de Reversa', critico: false },
  { field: 'extintor', label: 'Extintor (carga vigente)', critico: true },
  { field: 'botiquin', label: 'Botiquín de Primeros Auxilios', critico: true },
  { field: 'kit_carretera', label: 'Kit de Carretera (señales, cruceta, tacos)', critico: true },
  { field: 'chaleco_reflectivo', label: 'Chaleco Reflectivo', critico: false },
];

export const CHECKLIST_DOCUMENTOS: ChecklistItemMeta[] = [
  { field: 'soat_vigente', label: 'SOAT Vigente', critico: true },
  { field: 'revision_tecnomecanica', label: 'Revisión Tecnomecánica Vigente', critico: true },
  { field: 'tarjeta_propiedad', label: 'Tarjeta de Propiedad', critico: false },
];

/** Todos los items del checklist agrupados */
export const CHECKLIST_GROUPS = [
  { title: 'Carrocería y Exterior', items: CHECKLIST_CARROCERIA },
  { title: 'Luces', items: CHECKLIST_LUCES },
  { title: 'Espejos', items: CHECKLIST_ESPEJOS },
  { title: 'Llantas', items: CHECKLIST_LLANTAS },
  { title: 'Frenos y Dirección', items: CHECKLIST_FRENOS },
  { title: 'Niveles de Fluidos', items: CHECKLIST_NIVELES },
  { title: 'Seguridad', items: CHECKLIST_SEGURIDAD },
  { title: 'Documentos', items: CHECKLIST_DOCUMENTOS },
] as const;

// ============================================
// LABELS Y COLORES PARA UI
// ============================================

export const CATEGORIA_FACTOR_LABELS: Record<CategoriaFactor, string> = {
  [CategoriaFactor.HUMANO]: 'Factor Humano',
  [CategoriaFactor.VEHICULO]: 'Factor Vehículo',
  [CategoriaFactor.VIA]: 'Factor Vía/Infraestructura',
  [CategoriaFactor.AMBIENTAL]: 'Factor Ambiental',
};

export const CATEGORIA_FACTOR_COLORS: Record<CategoriaFactor, string> = {
  [CategoriaFactor.HUMANO]: 'bg-red-100 text-red-800',
  [CategoriaFactor.VEHICULO]: 'bg-orange-100 text-orange-800',
  [CategoriaFactor.VIA]: 'bg-yellow-100 text-yellow-800',
  [CategoriaFactor.AMBIENTAL]: 'bg-green-100 text-green-800',
};

export const NIVEL_RIESGO_VIAL_LABELS: Record<NivelRiesgoVial, string> = {
  [NivelRiesgoVial.BAJO]: 'Bajo',
  [NivelRiesgoVial.MEDIO]: 'Medio',
  [NivelRiesgoVial.ALTO]: 'Alto',
  [NivelRiesgoVial.CRITICO]: 'Crítico',
};

export const NIVEL_RIESGO_VIAL_COLORS: Record<NivelRiesgoVial, string> = {
  [NivelRiesgoVial.BAJO]: 'bg-green-100 text-green-800',
  [NivelRiesgoVial.MEDIO]: 'bg-yellow-100 text-yellow-800',
  [NivelRiesgoVial.ALTO]: 'bg-orange-100 text-orange-800',
  [NivelRiesgoVial.CRITICO]: 'bg-red-100 text-red-800',
};

export const ESTADO_RIESGO_VIAL_LABELS: Record<EstadoRiesgoVial, string> = {
  [EstadoRiesgoVial.IDENTIFICADO]: 'Identificado',
  [EstadoRiesgoVial.EN_EVALUACION]: 'En Evaluación',
  [EstadoRiesgoVial.EN_TRATAMIENTO]: 'En Tratamiento',
  [EstadoRiesgoVial.CONTROLADO]: 'Controlado',
  [EstadoRiesgoVial.CERRADO]: 'Cerrado',
};

export const ESTADO_RIESGO_VIAL_COLORS: Record<EstadoRiesgoVial, string> = {
  [EstadoRiesgoVial.IDENTIFICADO]: 'bg-gray-100 text-gray-800',
  [EstadoRiesgoVial.EN_EVALUACION]: 'bg-blue-100 text-blue-800',
  [EstadoRiesgoVial.EN_TRATAMIENTO]: 'bg-yellow-100 text-yellow-800',
  [EstadoRiesgoVial.CONTROLADO]: 'bg-green-100 text-green-800',
  [EstadoRiesgoVial.CERRADO]: 'bg-purple-100 text-purple-800',
};

export const EFECTIVIDAD_CONTROLES_LABELS: Record<EfectividadControles, string> = {
  [EfectividadControles.ALTA]: 'Alta',
  [EfectividadControles.MEDIA]: 'Media',
  [EfectividadControles.BAJA]: 'Baja',
  [EfectividadControles.NO_EVALUADA]: 'No Evaluada',
};

export const TIPO_CONTROL_VIAL_LABELS: Record<TipoControlVial, string> = {
  [TipoControlVial.PREVENTIVO]: 'Preventivo',
  [TipoControlVial.CORRECTIVO]: 'Correctivo',
  [TipoControlVial.DETECTIVO]: 'Detectivo',
};

export const TIPO_CONTROL_VIAL_COLORS: Record<TipoControlVial, string> = {
  [TipoControlVial.PREVENTIVO]: 'bg-blue-100 text-blue-800',
  [TipoControlVial.CORRECTIVO]: 'bg-orange-100 text-orange-800',
  [TipoControlVial.DETECTIVO]: 'bg-purple-100 text-purple-800',
};

export const MOMENTO_APLICACION_LABELS: Record<MomentoAplicacion, string> = {
  [MomentoAplicacion.ANTES_VIAJE]: 'Antes del Viaje',
  [MomentoAplicacion.DURANTE_VIAJE]: 'Durante el Viaje',
  [MomentoAplicacion.DESPUES_VIAJE]: 'Después del Viaje',
  [MomentoAplicacion.PERMANENTE]: 'Permanente',
};

export const JERARQUIA_CONTROL_LABELS: Record<JerarquiaControl, string> = {
  [JerarquiaControl.ELIMINACION]: 'Eliminación',
  [JerarquiaControl.SUSTITUCION]: 'Sustitución',
  [JerarquiaControl.CONTROLES_INGENIERIA]: 'Controles de Ingeniería',
  [JerarquiaControl.CONTROLES_ADMIN]: 'Controles Administrativos',
  [JerarquiaControl.SENALIZACION]: 'Señalización/Advertencia',
  [JerarquiaControl.EPP]: 'Equipos de Protección Personal',
};

export const ESTADO_CONTROL_VIAL_LABELS: Record<EstadoControlVial, string> = {
  [EstadoControlVial.PROPUESTO]: 'Propuesto',
  [EstadoControlVial.APROBADO]: 'Aprobado',
  [EstadoControlVial.EN_IMPLEMENTACION]: 'En Implementación',
  [EstadoControlVial.IMPLEMENTADO]: 'Implementado',
  [EstadoControlVial.SUSPENDIDO]: 'Suspendido',
};

export const ESTADO_CONTROL_VIAL_COLORS: Record<EstadoControlVial, string> = {
  [EstadoControlVial.PROPUESTO]: 'bg-gray-100 text-gray-800',
  [EstadoControlVial.APROBADO]: 'bg-blue-100 text-blue-800',
  [EstadoControlVial.EN_IMPLEMENTACION]: 'bg-yellow-100 text-yellow-800',
  [EstadoControlVial.IMPLEMENTADO]: 'bg-green-100 text-green-800',
  [EstadoControlVial.SUSPENDIDO]: 'bg-red-100 text-red-800',
};

export const TIPO_INCIDENTE_VIAL_LABELS: Record<TipoIncidenteVial, string> = {
  [TipoIncidenteVial.ACCIDENTE_TRANSITO]: 'Accidente de Tránsito',
  [TipoIncidenteVial.INCIDENTE_MENOR]: 'Incidente Menor',
  [TipoIncidenteVial.CASI_ACCIDENTE]: 'Casi Accidente',
  [TipoIncidenteVial.INFRACCION]: 'Infracción de Tránsito',
};

export const TIPO_INCIDENTE_VIAL_COLORS: Record<TipoIncidenteVial, string> = {
  [TipoIncidenteVial.ACCIDENTE_TRANSITO]: 'bg-red-100 text-red-800',
  [TipoIncidenteVial.INCIDENTE_MENOR]: 'bg-yellow-100 text-yellow-800',
  [TipoIncidenteVial.CASI_ACCIDENTE]: 'bg-orange-100 text-orange-800',
  [TipoIncidenteVial.INFRACCION]: 'bg-blue-100 text-blue-800',
};

export const GRAVEDAD_INCIDENTE_LABELS: Record<GravedadIncidente, string> = {
  [GravedadIncidente.SOLO_DANOS]: 'Solo Daños Materiales',
  [GravedadIncidente.LESION_LEVE]: 'Lesiones Leves',
  [GravedadIncidente.LESION_GRAVE]: 'Lesiones Graves',
  [GravedadIncidente.FATAL]: 'Fatal',
};

export const GRAVEDAD_INCIDENTE_COLORS: Record<GravedadIncidente, string> = {
  [GravedadIncidente.SOLO_DANOS]: 'bg-green-100 text-green-800',
  [GravedadIncidente.LESION_LEVE]: 'bg-yellow-100 text-yellow-800',
  [GravedadIncidente.LESION_GRAVE]: 'bg-orange-100 text-orange-800',
  [GravedadIncidente.FATAL]: 'bg-red-100 text-red-800',
};

export const ESTADO_INVESTIGACION_LABELS: Record<EstadoInvestigacion, string> = {
  [EstadoInvestigacion.REPORTADO]: 'Reportado',
  [EstadoInvestigacion.EN_INVESTIGACION]: 'En Investigación',
  [EstadoInvestigacion.ANALISIS_CAUSAL]: 'Análisis de Causas',
  [EstadoInvestigacion.PLAN_ACCION]: 'Plan de Acción',
  [EstadoInvestigacion.CERRADO]: 'Cerrado',
};

export const ESTADO_INVESTIGACION_COLORS: Record<EstadoInvestigacion, string> = {
  [EstadoInvestigacion.REPORTADO]: 'bg-gray-100 text-gray-800',
  [EstadoInvestigacion.EN_INVESTIGACION]: 'bg-yellow-100 text-yellow-800',
  [EstadoInvestigacion.ANALISIS_CAUSAL]: 'bg-blue-100 text-blue-800',
  [EstadoInvestigacion.PLAN_ACCION]: 'bg-purple-100 text-purple-800',
  [EstadoInvestigacion.CERRADO]: 'bg-green-100 text-green-800',
};

export const RESULTADO_INSPECCION_LABELS: Record<ResultadoInspeccion, string> = {
  [ResultadoInspeccion.APROBADO]: 'Aprobado - Apto para Operar',
  [ResultadoInspeccion.APROBADO_OBSERVACIONES]: 'Aprobado con Observaciones',
  [ResultadoInspeccion.RECHAZADO]: 'Rechazado - No Apto',
};

export const RESULTADO_INSPECCION_COLORS: Record<ResultadoInspeccion, string> = {
  [ResultadoInspeccion.APROBADO]: 'bg-green-100 text-green-800',
  [ResultadoInspeccion.APROBADO_OBSERVACIONES]: 'bg-yellow-100 text-yellow-800',
  [ResultadoInspeccion.RECHAZADO]: 'bg-red-100 text-red-800',
};

// ============================================
// FUNCIONES HELPER
// ============================================

/**
 * Calcula la valoración del riesgo vial (Frecuencia x Probabilidad x Severidad)
 * Escala PESV: 1-25: Bajo | 26-60: Medio | 61-100: Alto | 101-125: Crítico
 */
export function calcularValoracionRiesgo(
  frecuencia: number,
  probabilidad: number,
  severidad: number
): number {
  return frecuencia * probabilidad * severidad;
}

/**
 * Determina el nivel de riesgo basado en la valoración calculada
 * Misma lógica que backend _calcular_nivel_riesgo()
 */
export function calcularNivelRiesgo(valoracion: number): NivelRiesgoVial {
  if (valoracion <= 25) return NivelRiesgoVial.BAJO;
  if (valoracion <= 60) return NivelRiesgoVial.MEDIO;
  if (valoracion <= 100) return NivelRiesgoVial.ALTO;
  return NivelRiesgoVial.CRITICO;
}

/**
 * Verifica si un riesgo requiere acción inmediata
 * Misma lógica que backend requiere_accion_inmediata property
 */
export function requiereAccionInmediata(nivel: NivelRiesgoVial): boolean {
  return nivel === NivelRiesgoVial.ALTO || nivel === NivelRiesgoVial.CRITICO;
}

/**
 * Verifica si un incidente es grave (reportable a autoridades)
 * Misma lógica que backend es_accidente_grave property
 * Usa campos correctos: gravedad, numero_fallecidos, numero_lesionados
 */
export function esAccidenteGrave(
  incidente: Pick<IncidenteVialList, 'gravedad' | 'numero_fallecidos' | 'numero_lesionados'>
): boolean {
  return (
    incidente.gravedad === GravedadIncidente.LESION_GRAVE ||
    incidente.gravedad === GravedadIncidente.FATAL ||
    incidente.numero_lesionados > 0 ||
    incidente.numero_fallecidos > 0
  );
}

/**
 * Calcula el porcentaje de reducción del riesgo con controles
 * Misma lógica que backend porcentaje_reduccion property
 */
export function calcularPorcentajeReduccion(
  valoracionInherente: number,
  valoracionResidual: number | null
): number | null {
  if (valoracionResidual != null && valoracionInherente > 0) {
    return (
      Math.round(((valoracionInherente - valoracionResidual) / valoracionInherente) * 100 * 100) /
      100
    );
  }
  return null;
}
