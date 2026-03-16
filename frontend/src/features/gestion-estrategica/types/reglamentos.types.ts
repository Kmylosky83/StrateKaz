/**
 * Tipos TypeScript para Reglamentos Internos - Motor de Cumplimiento
 * Sistema de Gestion StrateKaz
 *
 * Consumido desde Fundacion Tab 4 "Mis Politicas y Reglamentos"
 * Backend: apps/motor_cumplimiento/reglamentos_internos
 */

// ==================== ENUMS ====================

export type EstadoReglamento = 'borrador' | 'en_revision' | 'aprobado' | 'vigente' | 'obsoleto';

export type MedioPublicacion = 'cartelera' | 'email' | 'intranet' | 'reunion' | 'impreso';

export type TipoSocializacion =
  | 'induccion'
  | 'reinduccion'
  | 'capacitacion'
  | 'reunion'
  | 'virtual';

// ==================== MODELS ====================

/**
 * Tipo de Reglamento (catalogo global)
 */
export interface TipoReglamento {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  requiere_aprobacion_legal: boolean;
  vigencia_anios: number;
  orden: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Reglamento Interno (por empresa)
 */
export interface Reglamento {
  id: number;
  empresa: number;
  tipo: number;
  tipo_nombre: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  estado: EstadoReglamento;
  estado_display: string;
  version_actual: string;
  fecha_aprobacion: string | null;
  fecha_vigencia: string | null;
  fecha_proxima_revision: string | null;
  aprobado_por: number | null;
  aprobado_por_nombre: string;
  documento: string | null;
  aplica_sst: boolean;
  aplica_ambiental: boolean;
  aplica_calidad: boolean;
  aplica_pesv: boolean;
  observaciones: string;
  orden: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Version de Reglamento
 */
export interface VersionReglamento {
  id: number;
  empresa: number;
  reglamento: number;
  numero_version: string;
  fecha_version: string;
  cambios_realizados: string;
  motivo_cambio: string;
  documento: string | null;
  elaborado_por: number | null;
  elaborado_por_nombre: string;
  revisado_por: number | null;
  aprobado_por: number | null;
  fecha_aprobacion: string | null;
}

/**
 * Publicacion de Reglamento
 */
export interface PublicacionReglamento {
  id: number;
  empresa: number;
  reglamento: number;
  version_publicada: string;
  fecha_publicacion: string;
  medio: MedioPublicacion;
  medio_display: string;
  ubicacion: string;
  observaciones: string;
  evidencia: string | null;
  publicado_por: number | null;
  publicado_por_nombre: string;
}

/**
 * Socializacion de Reglamento
 */
export interface SocializacionReglamento {
  id: number;
  empresa: number;
  reglamento: number;
  tipo: TipoSocializacion;
  tipo_display: string;
  fecha: string;
  duracion_horas: string;
  facilitador: number | null;
  facilitador_nombre: string;
  numero_asistentes: number;
  temas_tratados: string;
  lista_asistencia: string | null;
  observaciones: string;
}

// ==================== DTOs - CREATE ====================

export interface CreateReglamentoDTO {
  tipo: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  estado?: EstadoReglamento;
  version_actual?: string;
  fecha_aprobacion?: string | null;
  fecha_vigencia?: string | null;
  fecha_proxima_revision?: string | null;
  aprobado_por?: number | null;
  aplica_sst?: boolean;
  aplica_ambiental?: boolean;
  aplica_calidad?: boolean;
  aplica_pesv?: boolean;
  observaciones?: string;
  orden?: number;
}

export interface UpdateReglamentoDTO {
  tipo?: number;
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  estado?: EstadoReglamento;
  version_actual?: string;
  fecha_aprobacion?: string | null;
  fecha_vigencia?: string | null;
  fecha_proxima_revision?: string | null;
  aprobado_por?: number | null;
  aplica_sst?: boolean;
  aplica_ambiental?: boolean;
  aplica_calidad?: boolean;
  aplica_pesv?: boolean;
  observaciones?: string;
  orden?: number;
}

// ==================== ESTADISTICAS ====================

export interface ReglamentosEstadisticas {
  total: number;
  por_estado: {
    borrador: number;
    en_revision: number;
    aprobado: number;
    vigente: number;
    obsoleto: number;
  };
}
