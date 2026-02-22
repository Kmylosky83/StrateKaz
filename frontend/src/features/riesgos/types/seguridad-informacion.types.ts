/**
 * Tipos para Seguridad de la Información — ISO 27001:2022
 * Backend: /api/riesgos/seguridad-info/
 */

// ============================================
// ENUMS
// ============================================

export type TipoActivo =
  | 'HARDWARE'
  | 'SOFTWARE'
  | 'INFORMACION'
  | 'SERVICIOS'
  | 'PERSONAS'
  | 'INTANGIBLES';

export type ClasificacionActivo = 'PUBLICA' | 'INTERNA' | 'CONFIDENCIAL' | 'SECRETA';

export type TipoAmenaza = 'NATURAL' | 'HUMANA_INTENCIONAL' | 'HUMANA_NO_INTENCIONAL' | 'TECNICA';

export type NivelRiesgoSI = 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';

export type AceptabilidadRiesgo = 'ACEPTABLE' | 'TOLERABLE' | 'INACEPTABLE';

export type EstadoRiesgoSI =
  | 'IDENTIFICADO'
  | 'EN_EVALUACION'
  | 'EN_TRATAMIENTO'
  | 'CONTROLADO'
  | 'CERRADO';

export type TipoControlSI = 'PREVENTIVO' | 'DETECTIVO' | 'CORRECTIVO';

export type EstadoImplementacion =
  | 'NO_IMPLEMENTADO'
  | 'EN_IMPLEMENTACION'
  | 'IMPLEMENTADO'
  | 'OPTIMIZADO';

export type TipoIncidenteSI =
  | 'ACCESO_NO_AUTORIZADO'
  | 'MALWARE'
  | 'FUGA_INFORMACION'
  | 'PHISHING'
  | 'DENEGACION_SERVICIO'
  | 'PERDIDA_DATOS'
  | 'ROBO_EQUIPOS'
  | 'INGENIERIA_SOCIAL'
  | 'OTRO';

export type SeveridadIncidenteSI = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export type EstadoIncidenteSI =
  | 'REPORTADO'
  | 'EN_INVESTIGACION'
  | 'CONTENIDO'
  | 'ERRADICADO'
  | 'RECUPERADO'
  | 'CERRADO';

// ============================================
// INTERFACES
// ============================================

export interface ActivoInformacion {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo: TipoActivo;
  tipo_display?: string;
  clasificacion: ClasificacionActivo;
  clasificacion_display?: string;
  propietario: number;
  propietario_nombre?: string;
  custodio?: number;
  custodio_nombre?: string;
  ubicacion: string;
  valor_confidencialidad: number;
  valor_integridad: number;
  valor_disponibilidad: number;
  criticidad: number;
  empresa_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Amenaza {
  id: number;
  codigo: string;
  tipo: TipoAmenaza;
  tipo_display?: string;
  nombre: string;
  descripcion: string;
  probabilidad_ocurrencia: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vulnerabilidad {
  id: number;
  activo: number;
  activo_codigo?: string;
  activo_nombre?: string;
  codigo: string;
  descripcion: string;
  facilidad_explotacion: number;
  empresa_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RiesgoSeguridad {
  id: number;
  activo: number;
  activo_nombre?: string;
  amenaza: number;
  amenaza_nombre?: string;
  vulnerabilidad?: number;
  vulnerabilidad_descripcion?: string;
  escenario_riesgo: string;
  probabilidad: number;
  impacto: number;
  nivel_riesgo: NivelRiesgoSI;
  nivel_riesgo_display?: string;
  controles_existentes: string;
  probabilidad_residual?: number;
  impacto_residual?: number;
  nivel_residual?: NivelRiesgoSI;
  aceptabilidad: AceptabilidadRiesgo;
  aceptabilidad_display?: string;
  responsable_tratamiento?: number;
  responsable_nombre?: string;
  estado: EstadoRiesgoSI;
  estado_display?: string;
  empresa_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ControlSeguridad {
  id: number;
  riesgo: number;
  riesgo_info?: { id: number; escenario_riesgo: string };
  control_iso: string;
  descripcion: string;
  tipo_control: TipoControlSI;
  tipo_control_display?: string;
  estado_implementacion: EstadoImplementacion;
  estado_implementacion_display?: string;
  efectividad: number;
  responsable?: number;
  responsable_nombre?: string;
  fecha_implementacion?: string;
  evidencia: string;
  empresa_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IncidenteSeguridad {
  id: number;
  fecha_deteccion: string;
  descripcion: string;
  activos_afectados?: number[];
  activos_afectados_info?: Array<{ id: number; codigo: string; nombre: string }>;
  activos_count?: number;
  tipo_incidente: TipoIncidenteSI;
  tipo_incidente_display?: string;
  severidad: SeveridadIncidenteSI;
  severidad_display?: string;
  impacto_real: string;
  acciones_contencion: string;
  acciones_erradicacion: string;
  lecciones_aprendidas: string;
  estado: EstadoIncidenteSI;
  estado_display?: string;
  reportado_por?: number;
  reportado_por_nombre?: string;
  empresa_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// LABELS Y COLORES PARA UI
// ============================================

export const TIPO_ACTIVO_LABELS: Record<TipoActivo, string> = {
  HARDWARE: 'Hardware',
  SOFTWARE: 'Software',
  INFORMACION: 'Información',
  SERVICIOS: 'Servicios',
  PERSONAS: 'Personas',
  INTANGIBLES: 'Intangibles',
};

export const CLASIFICACION_LABELS: Record<ClasificacionActivo, string> = {
  PUBLICA: 'Pública',
  INTERNA: 'Interna',
  CONFIDENCIAL: 'Confidencial',
  SECRETA: 'Secreta',
};

export const CLASIFICACION_COLORS: Record<ClasificacionActivo, string> = {
  PUBLICA: 'bg-green-100 text-green-800',
  INTERNA: 'bg-blue-100 text-blue-800',
  CONFIDENCIAL: 'bg-orange-100 text-orange-800',
  SECRETA: 'bg-red-100 text-red-800',
};

export const NIVEL_RIESGO_SI_LABELS: Record<NivelRiesgoSI, string> = {
  BAJO: 'Bajo',
  MEDIO: 'Medio',
  ALTO: 'Alto',
  CRITICO: 'Crítico',
};

export const NIVEL_RIESGO_SI_COLORS: Record<NivelRiesgoSI, string> = {
  BAJO: 'bg-green-100 text-green-800',
  MEDIO: 'bg-yellow-100 text-yellow-800',
  ALTO: 'bg-orange-100 text-orange-800',
  CRITICO: 'bg-red-100 text-red-800',
};

export const ESTADO_RIESGO_SI_LABELS: Record<EstadoRiesgoSI, string> = {
  IDENTIFICADO: 'Identificado',
  EN_EVALUACION: 'En Evaluación',
  EN_TRATAMIENTO: 'En Tratamiento',
  CONTROLADO: 'Controlado',
  CERRADO: 'Cerrado',
};

export const SEVERIDAD_SI_LABELS: Record<SeveridadIncidenteSI, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
  CRITICA: 'Crítica',
};

export const SEVERIDAD_SI_COLORS: Record<SeveridadIncidenteSI, string> = {
  BAJA: 'bg-green-100 text-green-800',
  MEDIA: 'bg-yellow-100 text-yellow-800',
  ALTA: 'bg-orange-100 text-orange-800',
  CRITICA: 'bg-red-100 text-red-800',
};

export const ESTADO_INCIDENTE_SI_LABELS: Record<EstadoIncidenteSI, string> = {
  REPORTADO: 'Reportado',
  EN_INVESTIGACION: 'En Investigación',
  CONTENIDO: 'Contenido',
  ERRADICADO: 'Erradicado',
  RECUPERADO: 'Recuperado',
  CERRADO: 'Cerrado',
};

export const TIPO_CONTROL_SI_LABELS: Record<TipoControlSI, string> = {
  PREVENTIVO: 'Preventivo',
  DETECTIVO: 'Detectivo',
  CORRECTIVO: 'Correctivo',
};

export const ESTADO_IMPL_LABELS: Record<EstadoImplementacion, string> = {
  NO_IMPLEMENTADO: 'No Implementado',
  EN_IMPLEMENTACION: 'En Implementación',
  IMPLEMENTADO: 'Implementado',
  OPTIMIZADO: 'Optimizado',
};

export const ESTADO_IMPL_COLORS: Record<EstadoImplementacion, string> = {
  NO_IMPLEMENTADO: 'bg-gray-100 text-gray-800',
  EN_IMPLEMENTACION: 'bg-yellow-100 text-yellow-800',
  IMPLEMENTADO: 'bg-green-100 text-green-800',
  OPTIMIZADO: 'bg-blue-100 text-blue-800',
};
