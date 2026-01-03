/**
 * Tipos TypeScript para Módulo de Gestión Ambiental - HSEQ Management
 * Sistema de Gestión StrateKaz
 *
 * Incluye:
 * - Gestión de Residuos (Tipos, Gestores, Registros)
 * - Vertimientos
 * - Emisiones Atmosféricas
 * - Consumo de Recursos
 * - Huella de Carbono
 * - Certificados Ambientales
 */

// ==================== ENUMS Y TIPOS ====================

// Residuos
export type ClaseResiduo =
  | 'PELIGROSO'
  | 'NO_PELIGROSO'
  | 'RECICLABLE'
  | 'ORGANICO'
  | 'RAEE'
  | 'RCD'
  | 'ESPECIAL';

export type TipoGestor =
  | 'RESIDUOS'
  | 'VERTIMIENTOS'
  | 'EMISIONES'
  | 'RECICLAJE'
  | 'APROVECHAMIENTO'
  | 'DISPOSICION_FINAL';

export type TipoMovimiento = 'GENERACION' | 'DISPOSICION' | 'TRANSFERENCIA' | 'APROVECHAMIENTO';

export type UnidadMedida = 'KG' | 'TON' | 'LT' | 'M3' | 'UND';

// Vertimientos
export type TipoVertimiento = 'DOMESTICO' | 'INDUSTRIAL' | 'PLUVIAL' | 'MIXTO';

export type CuerpoReceptor =
  | 'ALCANTARILLADO'
  | 'RIO'
  | 'QUEBRADA'
  | 'LAGO'
  | 'MAR'
  | 'SUELO'
  | 'PTAR';

// Emisiones
export type TipoFuente = 'FIJA_PUNTUAL' | 'FIJA_DISPERSA' | 'MOVIL';

// Recursos
export type CategoriaRecurso = 'AGUA' | 'ENERGIA' | 'GAS' | 'COMBUSTIBLE' | 'MATERIAL';

// Huella de Carbono
export type MetodologiaHuella = 'GHG Protocol' | 'ISO 14064' | 'PAS 2050' | 'Otra';

// Certificados
export type TipoCertificado =
  | 'DISPOSICION_RESIDUOS'
  | 'APROVECHAMIENTO'
  | 'RECICLAJE'
  | 'VERTIMIENTO'
  | 'EMISION'
  | 'CUMPLIMIENTO_AMBIENTAL'
  | 'COMPENSACION_CO2'
  | 'ISO_14001'
  | 'OTRO';

// ==================== TIPOS DE RESIDUOS ====================

export interface TipoResiduo {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  clase: ClaseResiduo;
  codigo_cer: string;
  es_corrosivo: boolean;
  es_reactivo: boolean;
  es_explosivo: boolean;
  es_toxico: boolean;
  es_inflamable: boolean;
  es_infeccioso: boolean;
  requiere_tratamiento_especial: boolean;
  instrucciones_manejo: string;
  color_contenedor: string;
  activo: boolean;
}

export interface TipoResiduoList {
  id: number;
  codigo: string;
  nombre: string;
  clase: ClaseResiduo;
  color_contenedor: string;
  activo: boolean;
}

// ==================== GESTORES AMBIENTALES ====================

export interface GestorAmbiental {
  id: number;
  empresa_id: number;
  razon_social: string;
  nit: string;
  tipo_gestor: TipoGestor;
  numero_licencia_ambiental: string;
  fecha_expedicion_licencia: string | null;
  fecha_vencimiento_licencia: string | null;
  autoridad_ambiental_emisor: string;
  tipos_residuos: number[];
  tipos_residuos_detalle?: TipoResiduoList[];
  contacto_nombre: string;
  contacto_telefono: string;
  contacto_email: string;
  direccion: string;
  ciudad: string;
  certificaciones: string;
  licencia_vigente?: boolean | null;
  activo: boolean;
}

export interface GestorAmbientalList {
  id: number;
  razon_social: string;
  nit: string;
  tipo_gestor: TipoGestor;
  fecha_vencimiento_licencia: string | null;
  licencia_vigente?: boolean | null;
  ciudad: string;
  activo: boolean;
}

// ==================== REGISTROS DE RESIDUOS ====================

export interface RegistroResiduo {
  id: number;
  empresa_id: number;
  fecha: string;
  tipo_residuo: number;
  tipo_residuo_detalle?: TipoResiduoList;
  tipo_movimiento: TipoMovimiento;
  tipo_movimiento_display?: string;
  cantidad: string;
  unidad_medida: UnidadMedida;
  area_generadora: string;
  gestor: number | null;
  gestor_detalle?: {
    id: number;
    razon_social: string;
    nit: string;
    tipo_gestor: string;
  } | null;
  tratamiento_aplicado: string;
  numero_manifiesto: string;
  certificado_disposicion: string | null;
  observaciones: string;
  registrado_por: string;
}

export interface RegistroResiduoList {
  id: number;
  fecha: string;
  tipo_residuo: number;
  tipo_residuo_detalle?: TipoResiduoList;
  tipo_movimiento: TipoMovimiento;
  cantidad: string;
  unidad_medida: UnidadMedida;
  area_generadora: string;
}

// ==================== VERTIMIENTOS ====================

export interface Vertimiento {
  id: number;
  empresa_id: number;
  fecha_vertimiento: string;
  hora_vertimiento: string | null;
  tipo_vertimiento: TipoVertimiento;
  tipo_vertimiento_display?: string;
  punto_vertimiento: string;
  coordenadas: string;
  cuerpo_receptor: CuerpoReceptor;
  cuerpo_receptor_display?: string;
  nombre_cuerpo_receptor: string;
  caudal_m3_dia: string | null;
  ph: string | null;
  temperatura_celsius: string | null;
  dbo5_mg_l: string | null;
  dqo_mg_l: string | null;
  sst_mg_l: string | null;
  grasas_aceites_mg_l: string | null;
  parametros_adicionales: Record<string, any>;
  cumple_normativa: boolean | null;
  norma_referencia: string;
  tratamiento_previo: string;
  observaciones: string;
  laboratorio_analisis: string;
  numero_informe_laboratorio: string;
  archivo_informe: string | null;
}

export interface VertimientoList {
  id: number;
  fecha_vertimiento: string;
  tipo_vertimiento: TipoVertimiento;
  punto_vertimiento: string;
  cuerpo_receptor: CuerpoReceptor;
  cumple_normativa: boolean | null;
}

// ==================== FUENTES DE EMISIÓN ====================

export interface FuenteEmision {
  id: number;
  empresa_id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo_fuente: TipoFuente;
  tipo_fuente_display?: string;
  area_ubicacion: string;
  coordenadas: string;
  altura_chimenea_m: string | null;
  proceso_generador: string;
  tipo_combustible: string;
  sistema_control: string;
  activo: boolean;
}

export interface FuenteEmisionList {
  id: number;
  codigo: string;
  nombre: string;
  tipo_fuente: TipoFuente;
  area_ubicacion: string;
  activo: boolean;
}

// ==================== REGISTROS DE EMISIONES ====================

export interface RegistroEmision {
  id: number;
  empresa_id: number;
  fecha_medicion: string;
  hora_medicion: string | null;
  fuente_emision: number;
  fuente_emision_detalle?: FuenteEmisionList;
  material_particulado_mg_m3: string | null;
  pm10_ug_m3: string | null;
  pm25_ug_m3: string | null;
  so2_ppm: string | null;
  nox_ppm: string | null;
  co_ppm: string | null;
  co2_ppm: string | null;
  cov_mg_m3: string | null;
  temperatura_gases_celsius: string | null;
  velocidad_gases_m_s: string | null;
  humedad_relativa_pct: string | null;
  cumple_normativa: boolean | null;
  norma_referencia: string;
  laboratorio_medicion: string;
  numero_informe: string;
  archivo_informe: string | null;
  observaciones: string;
}

export interface RegistroEmisionList {
  id: number;
  fecha_medicion: string;
  fuente_emision: number;
  fuente_emision_detalle?: FuenteEmisionList;
  cumple_normativa: boolean | null;
}

// ==================== TIPOS DE RECURSOS ====================

export interface TipoRecurso {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaRecurso;
  categoria_display?: string;
  unidad_medida: string;
  factor_emision_co2_kg: string | null;
  costo_unitario: string | null;
  activo: boolean;
}

export interface TipoRecursoList {
  id: number;
  codigo: string;
  nombre: string;
  categoria: CategoriaRecurso;
  unidad_medida: string;
  activo: boolean;
}

// ==================== CONSUMO DE RECURSOS ====================

export interface ConsumoRecurso {
  id: number;
  empresa_id: number;
  periodo_year: number;
  periodo_month: number;
  periodo_display?: string;
  tipo_recurso: number;
  tipo_recurso_detalle?: TipoRecursoList;
  cantidad_consumida: string;
  fuente_suministro: string;
  area_consumidora: string;
  costo_total: string | null;
  lectura_inicial: string | null;
  lectura_final: string | null;
  numero_factura: string;
  emision_co2_kg: string | null;
  observaciones: string;
}

export interface ConsumoRecursoList {
  id: number;
  periodo_year: number;
  periodo_month: number;
  periodo_display?: string;
  tipo_recurso: number;
  tipo_recurso_detalle?: TipoRecursoList;
  cantidad_consumida: string;
  costo_total: string | null;
  emision_co2_kg: string | null;
}

export interface ConsumoRecursoResumen {
  periodo_year: number;
  periodo_month: number;
  tipo_recurso: string;
  total_consumo: string;
  total_costo: string;
  total_emision_co2: string;
}

// ==================== HUELLA DE CARBONO ====================

export interface CalculoHuellaCarbono {
  id: number;
  empresa_id: number;
  periodo_year: number;
  periodo_inicio: string;
  periodo_fin: string;
  metodologia: string;
  version_metodologia: string;
  alcance1_combustion_estacionaria: string;
  alcance1_combustion_movil: string;
  alcance1_emisiones_proceso: string;
  alcance1_emisiones_fugitivas: string;
  alcance1_total: string;
  alcance2_electricidad: string;
  alcance2_vapor: string;
  alcance2_calefaccion: string;
  alcance2_total: string;
  alcance3_viajes_negocio: string;
  alcance3_desplazamiento_empleados: string;
  alcance3_transporte_upstream: string;
  alcance3_transporte_downstream: string;
  alcance3_residuos: string;
  alcance3_otros: string;
  alcance3_total: string;
  huella_total: string;
  numero_empleados: number | null;
  huella_per_capita: string | null;
  detalle_calculos: Record<string, any>;
  verificado: boolean;
  verificador_externo: string;
  fecha_verificacion: string | null;
  compensaciones_co2: string;
  huella_neta: string;
  informe_pdf: string | null;
  observaciones: string;
  alcances_detalle?: {
    alcance_1: {
      combustion_estacionaria: number;
      combustion_movil: number;
      emisiones_proceso: number;
      emisiones_fugitivas: number;
      total: number;
    };
    alcance_2: {
      electricidad: number;
      vapor: number;
      calefaccion: number;
      total: number;
    };
    alcance_3: {
      viajes_negocio: number;
      desplazamiento_empleados: number;
      transporte_upstream: number;
      transporte_downstream: number;
      residuos: number;
      otros: number;
      total: number;
    };
  };
  distribucion_porcentual?: {
    alcance_1: number;
    alcance_2: number;
    alcance_3: number;
  };
}

export interface CalculoHuellaCarbonoList {
  id: number;
  periodo_year: number;
  periodo_inicio: string;
  periodo_fin: string;
  huella_total: string;
  huella_per_capita: string | null;
  verificado: boolean;
}

// ==================== CERTIFICADOS AMBIENTALES ====================

export interface CertificadoAmbiental {
  id: number;
  empresa_id: number;
  numero_certificado: string;
  tipo_certificado: TipoCertificado;
  tipo_certificado_display?: string;
  emisor: string;
  gestor: number | null;
  gestor_detalle?: {
    id: number;
    razon_social: string;
    nit: string;
  } | null;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  descripcion: string;
  residuos_relacionados: number[];
  residuos_relacionados_detalle?: RegistroResiduoList[];
  cantidad_certificada: string | null;
  unidad_medida: string;
  archivo_certificado: string;
  vigente: boolean;
  esta_vigente?: boolean;
  observaciones: string;
}

export interface CertificadoAmbientalList {
  id: number;
  numero_certificado: string;
  tipo_certificado: TipoCertificado;
  tipo_certificado_display?: string;
  emisor: string;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  vigente: boolean;
  esta_vigente?: boolean;
}

// ==================== RESÚMENES Y REPORTES ====================

export interface ResumenGestionResiduos {
  periodo_inicio: string;
  periodo_fin: string;
  total_residuos_kg: number;
  residuos_peligrosos_kg: number;
  residuos_reciclables_kg: number;
  residuos_organicos_kg: number;
  tasa_reciclaje_pct: number;
  por_tipo_residuo: Array<{
    tipo_residuo__nombre: string;
    tipo_residuo__clase: ClaseResiduo;
    total_kg: number;
    num_registros: number;
  }>;
  por_area_generadora: Array<{
    area_generadora: string;
    total_kg: number;
    num_registros: number;
  }>;
}

export interface EstadisticasAmbientales {
  periodo: string;
  residuos: Record<string, any>;
  vertimientos: Record<string, any>;
  emisiones: Record<string, any>;
  consumos: Record<string, any>;
  huella_carbono: Record<string, any>;
}

// ==================== DTOs - CREATE ====================

export interface CreateTipoResiduoDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  clase: ClaseResiduo;
  codigo_cer?: string;
  es_corrosivo?: boolean;
  es_reactivo?: boolean;
  es_explosivo?: boolean;
  es_toxico?: boolean;
  es_inflamable?: boolean;
  es_infeccioso?: boolean;
  requiere_tratamiento_especial?: boolean;
  instrucciones_manejo?: string;
  color_contenedor?: string;
}

export interface CreateGestorAmbientalDTO {
  empresa_id: number;
  razon_social: string;
  nit: string;
  tipo_gestor: TipoGestor;
  numero_licencia_ambiental?: string;
  fecha_expedicion_licencia?: string;
  fecha_vencimiento_licencia?: string;
  autoridad_ambiental_emisor?: string;
  tipos_residuos?: number[];
  contacto_nombre?: string;
  contacto_telefono?: string;
  contacto_email?: string;
  direccion?: string;
  ciudad?: string;
  certificaciones?: string;
}

export interface CreateRegistroResiduoDTO {
  empresa_id: number;
  fecha: string;
  tipo_residuo: number;
  tipo_movimiento: TipoMovimiento;
  cantidad: number;
  unidad_medida?: UnidadMedida;
  area_generadora?: string;
  gestor?: number;
  tratamiento_aplicado?: string;
  numero_manifiesto?: string;
  observaciones?: string;
  registrado_por?: string;
}

export interface CreateVertimientoDTO {
  empresa_id: number;
  fecha_vertimiento: string;
  hora_vertimiento?: string;
  tipo_vertimiento: TipoVertimiento;
  punto_vertimiento: string;
  coordenadas?: string;
  cuerpo_receptor: CuerpoReceptor;
  nombre_cuerpo_receptor?: string;
  caudal_m3_dia?: number;
  ph?: number;
  temperatura_celsius?: number;
  dbo5_mg_l?: number;
  dqo_mg_l?: number;
  sst_mg_l?: number;
  grasas_aceites_mg_l?: number;
  parametros_adicionales?: Record<string, any>;
  cumple_normativa?: boolean;
  norma_referencia?: string;
  tratamiento_previo?: string;
  observaciones?: string;
  laboratorio_analisis?: string;
  numero_informe_laboratorio?: string;
}

export interface CreateFuenteEmisionDTO {
  empresa_id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo_fuente: TipoFuente;
  area_ubicacion?: string;
  coordenadas?: string;
  altura_chimenea_m?: number;
  proceso_generador?: string;
  tipo_combustible?: string;
  sistema_control?: string;
}

export interface CreateRegistroEmisionDTO {
  empresa_id: number;
  fecha_medicion: string;
  hora_medicion?: string;
  fuente_emision: number;
  material_particulado_mg_m3?: number;
  pm10_ug_m3?: number;
  pm25_ug_m3?: number;
  so2_ppm?: number;
  nox_ppm?: number;
  co_ppm?: number;
  co2_ppm?: number;
  cov_mg_m3?: number;
  temperatura_gases_celsius?: number;
  velocidad_gases_m_s?: number;
  humedad_relativa_pct?: number;
  cumple_normativa?: boolean;
  norma_referencia?: string;
  laboratorio_medicion?: string;
  numero_informe?: string;
  observaciones?: string;
}

export interface CreateTipoRecursoDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: CategoriaRecurso;
  unidad_medida: string;
  factor_emision_co2_kg?: number;
  costo_unitario?: number;
}

export interface CreateConsumoRecursoDTO {
  empresa_id: number;
  periodo_year: number;
  periodo_month: number;
  tipo_recurso: number;
  cantidad_consumida: number;
  fuente_suministro?: string;
  area_consumidora?: string;
  costo_total?: number;
  lectura_inicial?: number;
  lectura_final?: number;
  numero_factura?: string;
  observaciones?: string;
}

export interface CreateCalculoHuellaCarbonoDTO {
  empresa_id: number;
  periodo_year: number;
  periodo_inicio: string;
  periodo_fin: string;
  metodologia?: string;
  version_metodologia?: string;
  alcance1_combustion_estacionaria?: number;
  alcance1_combustion_movil?: number;
  alcance1_emisiones_proceso?: number;
  alcance1_emisiones_fugitivas?: number;
  alcance2_electricidad?: number;
  alcance2_vapor?: number;
  alcance2_calefaccion?: number;
  alcance3_viajes_negocio?: number;
  alcance3_desplazamiento_empleados?: number;
  alcance3_transporte_upstream?: number;
  alcance3_transporte_downstream?: number;
  alcance3_residuos?: number;
  alcance3_otros?: number;
  numero_empleados?: number;
  detalle_calculos?: Record<string, any>;
  compensaciones_co2?: number;
  observaciones?: string;
}

export interface CreateCertificadoAmbientalDTO {
  empresa_id: number;
  numero_certificado: string;
  tipo_certificado: TipoCertificado;
  emisor: string;
  gestor?: number;
  fecha_emision: string;
  fecha_vencimiento?: string;
  descripcion: string;
  residuos_relacionados?: number[];
  cantidad_certificada?: number;
  unidad_medida?: string;
  observaciones?: string;
}

export interface GenerarCertificadoDTO {
  empresa_id: number;
  tipo_certificado: TipoCertificado;
  residuos_ids?: number[];
  gestor_id: number;
  descripcion: string;
  observaciones?: string;
}

export interface CalcularHuellaInputDTO {
  empresa_id: number;
  periodo_year: number;
  incluir_alcance_3?: boolean;
  factores_emision_personalizados?: Record<string, any>;
}

// ==================== DTOs - UPDATE ====================

export interface UpdateTipoResiduoDTO extends Partial<CreateTipoResiduoDTO> {
  activo?: boolean;
}

export interface UpdateGestorAmbientalDTO extends Partial<CreateGestorAmbientalDTO> {
  activo?: boolean;
}

export interface UpdateRegistroResiduoDTO extends Partial<CreateRegistroResiduoDTO> {}

export interface UpdateVertimientoDTO extends Partial<CreateVertimientoDTO> {}

export interface UpdateFuenteEmisionDTO extends Partial<CreateFuenteEmisionDTO> {
  activo?: boolean;
}

export interface UpdateRegistroEmisionDTO extends Partial<CreateRegistroEmisionDTO> {}

export interface UpdateTipoRecursoDTO extends Partial<CreateTipoRecursoDTO> {
  activo?: boolean;
}

export interface UpdateConsumoRecursoDTO extends Partial<CreateConsumoRecursoDTO> {}

export interface UpdateCalculoHuellaCarbonoDTO extends Partial<CreateCalculoHuellaCarbonoDTO> {
  verificado?: boolean;
  verificador_externo?: string;
  fecha_verificacion?: string;
}

export interface UpdateCertificadoAmbientalDTO extends Partial<CreateCertificadoAmbientalDTO> {
  vigente?: boolean;
}

// ==================== RESPONSE TYPES ====================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
