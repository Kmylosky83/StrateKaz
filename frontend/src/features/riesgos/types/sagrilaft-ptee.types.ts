/**
 * Tipos para SAGRILAFT / PTEE
 * Backend: /api/riesgos/sagrilaft/
 */

// ============================================
// ENUMS
// ============================================

export type TipoFactorLAFT =
  | 'CLIENTE'
  | 'JURISDICCION'
  | 'PRODUCTO_SERVICIO'
  | 'CANAL_DISTRIBUCION';

export type NivelRiesgoLAFT = 'BAJO' | 'MEDIO' | 'ALTO' | 'EXTREMO';

export type TipoCliente = 'PERSONA_NATURAL' | 'PERSONA_JURIDICA' | 'PEP';

export type TipoEvaluado = 'CLIENTE' | 'PROVEEDOR' | 'EMPLEADO' | 'CONTRATISTA' | 'SOCIO';

export type EstadoMatrizLAFT = 'BORRADOR' | 'APROBADO' | 'VIGENTE' | 'EN_REVISION' | 'OBSOLETO';

export type CategoriaSenalAlerta =
  | 'TRANSACCIONAL'
  | 'COMPORTAMENTAL'
  | 'GEOGRAFICA'
  | 'DOCUMENTAL'
  | 'REPUTACIONAL'
  | 'LISTAS_CONTROL';

export type SeveridadSenal = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export type EstadoSenal =
  | 'DETECTADA'
  | 'EN_ANALISIS'
  | 'CONFIRMADA'
  | 'FALSO_POSITIVO'
  | 'ESCALADA'
  | 'CERRADA';

export type TipoOperacionROS =
  | 'LAVADO_ACTIVOS'
  | 'FINANCIACION_TERRORISMO'
  | 'ADMINISTRACION_RECURSOS_ILICITOS';

export type EstadoROS =
  | 'BORRADOR'
  | 'EN_REVISION'
  | 'APROBADO'
  | 'ENVIADO'
  | 'CONFIRMADO'
  | 'ARCHIVADO';

export type TipoDiligencia = 'NORMAL' | 'SIMPLIFICADA' | 'REFORZADA';

export type EstadoDiligencia =
  | 'INICIADA'
  | 'EN_PROCESO'
  | 'DOCUMENTOS_INCOMPLETOS'
  | 'COMPLETADA'
  | 'APROBADA'
  | 'RECHAZADA'
  | 'REQUIERE_ACTUALIZACION';

// ============================================
// INTERFACES
// ============================================

export interface FactorRiesgoLAFT {
  id: number;
  codigo: string;
  tipo_factor: TipoFactorLAFT;
  tipo_factor_display?: string;
  nombre: string;
  descripcion: string;
  nivel_riesgo_inherente: NivelRiesgoLAFT;
  nivel_display?: string;
  puntaje_base: string; // DecimalField -> string via DRF
  criterios_evaluacion: Record<string, unknown>;
  normativa_aplicable: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SegmentoCliente {
  id: number;
  codigo: string;
  nombre: string;
  tipo_cliente: TipoCliente;
  tipo_cliente_display?: string;
  nivel_riesgo: NivelRiesgoLAFT;
  nivel_display?: string;
  descripcion: string;
  criterios_clasificacion: Record<string, unknown>;
  requiere_debida_diligencia_reforzada: boolean;
  requiere_debida_diligencia_simplificada: boolean;
  frecuencia_monitoreo_dias: number;
  monto_maximo_transaccion?: string; // DecimalField
  empresa_id: number;
  created_by_nombre?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MatrizRiesgoLAFT {
  id: number;
  codigo: string;
  tipo_evaluado: TipoEvaluado;
  tipo_evaluado_display?: string;
  nombre_evaluado: string;
  identificacion_evaluado: string;
  segmento?: number;
  segmento_nombre?: string;
  puntaje_factor_cliente: string; // DecimalField
  puntaje_factor_jurisdiccion: string;
  puntaje_factor_producto: string;
  puntaje_factor_canal: string;
  puntaje_riesgo_inherente: string;
  nivel_riesgo_inherente: NivelRiesgoLAFT;
  controles_aplicados: unknown[];
  efectividad_controles: string;
  puntaje_riesgo_residual: string;
  nivel_riesgo_residual: NivelRiesgoLAFT;
  fecha_evaluacion: string;
  proxima_revision: string;
  estado: EstadoMatrizLAFT;
  estado_display?: string;
  observaciones: string;
  aprobado_por?: number;
  aprobado_por_nombre?: string;
  fecha_aprobacion?: string;
  empresa_id: number;
  created_by_nombre?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SenalAlerta {
  id: number;
  es_catalogo: boolean;
  codigo: string;
  nombre: string;
  categoria: CategoriaSenalAlerta;
  categoria_display?: string;
  descripcion: string;
  severidad: SeveridadSenal;
  severidad_display?: string;
  criterios_deteccion: Record<string, unknown>;
  matriz_riesgo?: number;
  matriz_riesgo_codigo?: string;
  fecha_deteccion?: string;
  origen_deteccion: string;
  evidencia: string;
  monto_involucrado?: string; // DecimalField
  analista_asignado?: number;
  analista_nombre?: string;
  fecha_analisis?: string;
  resultado_analisis: string;
  estado: EstadoSenal;
  estado_display?: string;
  requiere_ros: boolean;
  normativa_aplicable: string;
  empresa_id?: number;
  created_by_nombre?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReporteROS {
  id: number;
  numero_ros: string;
  fecha_deteccion: string;
  tipo_operacion: TipoOperacionROS;
  tipo_operacion_display?: string;
  matriz_riesgo: number;
  nombre_reportado: string;
  identificacion_reportado: string;
  tipo_identificacion: string;
  senales_alerta: number[];
  senales_detail?: SenalAlerta[];
  total_senales?: number;
  descripcion_operacion: string;
  monto_total: string; // DecimalField
  moneda: string;
  periodo_operaciones: string;
  analisis_detallado: string;
  fundamentos_sospecha: string;
  documentos_soporte: unknown[];
  elaborado_por: number;
  elaborado_por_nombre?: string;
  fecha_elaboracion: string;
  revisado_por?: number;
  revisado_por_nombre?: string;
  fecha_revision?: string;
  aprobado_por?: number;
  aprobado_por_nombre?: string;
  fecha_aprobacion?: string;
  fecha_envio_uiaf?: string;
  numero_radicado_uiaf: string;
  respuesta_uiaf: string;
  estado: EstadoROS;
  estado_display?: string;
  observaciones: string;
  empresa_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DebidaDiligencia {
  id: number;
  codigo: string;
  matriz_riesgo: number;
  matriz_riesgo_codigo?: string;
  evaluado_nombre?: string;
  tipo_diligencia: TipoDiligencia;
  tipo_display?: string;
  fecha_inicio: string;
  fecha_vencimiento: string;
  fecha_completada?: string;
  proxima_actualizacion?: string;
  documentos_requeridos: unknown[];
  documentos_recibidos: unknown[];
  porcentaje_completitud: string; // DecimalField
  verificacion_identidad_realizada: boolean;
  es_pep: boolean;
  responsable?: number;
  responsable_nombre?: string;
  aprobado_por?: number;
  aprobado_por_nombre?: string;
  fecha_aprobacion?: string;
  estado: EstadoDiligencia;
  estado_display?: string;
  observaciones: string;
  empresa_id: number;
  created_by_nombre?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// LABELS Y COLORES
// ============================================

export const TIPO_FACTOR_LABELS: Record<TipoFactorLAFT, string> = {
  CLIENTE: 'Clientes',
  JURISDICCION: 'Jurisdicciones',
  PRODUCTO_SERVICIO: 'Productos/Servicios',
  CANAL_DISTRIBUCION: 'Canales de Distribución',
};

export const NIVEL_LAFT_LABELS: Record<NivelRiesgoLAFT, string> = {
  BAJO: 'Bajo',
  MEDIO: 'Medio',
  ALTO: 'Alto',
  EXTREMO: 'Extremo',
};

export const NIVEL_LAFT_COLORS: Record<NivelRiesgoLAFT, string> = {
  BAJO: 'bg-green-100 text-green-800',
  MEDIO: 'bg-yellow-100 text-yellow-800',
  ALTO: 'bg-orange-100 text-orange-800',
  EXTREMO: 'bg-red-100 text-red-800',
};

export const ESTADO_MATRIZ_LABELS: Record<EstadoMatrizLAFT, string> = {
  BORRADOR: 'Borrador',
  APROBADO: 'Aprobado',
  VIGENTE: 'Vigente',
  EN_REVISION: 'En Revisión',
  OBSOLETO: 'Obsoleto',
};

export const ESTADO_MATRIZ_COLORS: Record<EstadoMatrizLAFT, string> = {
  BORRADOR: 'bg-gray-100 text-gray-800',
  APROBADO: 'bg-blue-100 text-blue-800',
  VIGENTE: 'bg-green-100 text-green-800',
  EN_REVISION: 'bg-yellow-100 text-yellow-800',
  OBSOLETO: 'bg-red-100 text-red-800',
};

export const CATEGORIA_SENAL_LABELS: Record<CategoriaSenalAlerta, string> = {
  TRANSACCIONAL: 'Transaccional',
  COMPORTAMENTAL: 'Comportamental',
  GEOGRAFICA: 'Geográfica',
  DOCUMENTAL: 'Documental',
  REPUTACIONAL: 'Reputacional',
  LISTAS_CONTROL: 'Listas de Control',
};

export const SEVERIDAD_SENAL_LABELS: Record<SeveridadSenal, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
  CRITICA: 'Crítica',
};

export const SEVERIDAD_SENAL_COLORS: Record<SeveridadSenal, string> = {
  BAJA: 'bg-green-100 text-green-800',
  MEDIA: 'bg-yellow-100 text-yellow-800',
  ALTA: 'bg-orange-100 text-orange-800',
  CRITICA: 'bg-red-100 text-red-800',
};

export const ESTADO_SENAL_LABELS: Record<EstadoSenal, string> = {
  DETECTADA: 'Detectada',
  EN_ANALISIS: 'En Análisis',
  CONFIRMADA: 'Confirmada',
  FALSO_POSITIVO: 'Falso Positivo',
  ESCALADA: 'Escalada',
  CERRADA: 'Cerrada',
};

export const ESTADO_ROS_LABELS: Record<EstadoROS, string> = {
  BORRADOR: 'Borrador',
  EN_REVISION: 'En Revisión',
  APROBADO: 'Aprobado',
  ENVIADO: 'Enviado',
  CONFIRMADO: 'Confirmado',
  ARCHIVADO: 'Archivado',
};

export const ESTADO_ROS_COLORS: Record<EstadoROS, string> = {
  BORRADOR: 'bg-gray-100 text-gray-800',
  EN_REVISION: 'bg-yellow-100 text-yellow-800',
  APROBADO: 'bg-blue-100 text-blue-800',
  ENVIADO: 'bg-purple-100 text-purple-800',
  CONFIRMADO: 'bg-green-100 text-green-800',
  ARCHIVADO: 'bg-gray-100 text-gray-600',
};

export const TIPO_DILIGENCIA_LABELS: Record<TipoDiligencia, string> = {
  NORMAL: 'Normal',
  SIMPLIFICADA: 'Simplificada',
  REFORZADA: 'Reforzada',
};

export const ESTADO_DILIGENCIA_LABELS: Record<EstadoDiligencia, string> = {
  INICIADA: 'Iniciada',
  EN_PROCESO: 'En Proceso',
  DOCUMENTOS_INCOMPLETOS: 'Documentos Incompletos',
  COMPLETADA: 'Completada',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
  REQUIERE_ACTUALIZACION: 'Requiere Actualización',
};

export const ESTADO_DILIGENCIA_COLORS: Record<EstadoDiligencia, string> = {
  INICIADA: 'bg-gray-100 text-gray-800',
  EN_PROCESO: 'bg-blue-100 text-blue-800',
  DOCUMENTOS_INCOMPLETOS: 'bg-yellow-100 text-yellow-800',
  COMPLETADA: 'bg-indigo-100 text-indigo-800',
  APROBADA: 'bg-green-100 text-green-800',
  RECHAZADA: 'bg-red-100 text-red-800',
  REQUIERE_ACTUALIZACION: 'bg-orange-100 text-orange-800',
};
