/**
 * Tipos TypeScript para Encuestas Colaborativas DOFA
 * Sistema de Gestión StrateKaz
 *
 * Permite recopilar opiniones de colaboradores sobre
 * fortalezas y debilidades organizacionales.
 */

// ==================== ENUMS ====================

export type EstadoEncuesta =
  | 'borrador'
  | 'activa'
  | 'cerrada'
  | 'procesada'
  | 'cancelada';

export type TipoParticipante = 'usuario' | 'area' | 'cargo';

export type EstadoParticipacion =
  | 'pendiente'
  | 'notificado'
  | 'en_progreso'
  | 'completado';

export type Clasificacion = 'fortaleza' | 'debilidad';

export type NivelImpacto = 'alto' | 'medio' | 'bajo';

// ==================== TEMA ENCUESTA ====================

export interface TemaEncuesta {
  id: number;
  encuesta: number;
  area?: number | null;
  area_name?: string | null;
  titulo: string;
  descripcion?: string;
  orden: number;
  total_votos_fortaleza?: number;
  total_votos_debilidad?: number;
  clasificacion_consenso?: 'fortaleza' | 'debilidad' | 'empate';
  created_at: string;
  updated_at: string;
}

export interface CreateTemaDTO {
  area?: number | null;
  titulo: string;
  descripcion?: string;
  orden?: number;
}

// ==================== PARTICIPANTE ====================

export interface ParticipanteEncuesta {
  id: number;
  encuesta: number;
  tipo: TipoParticipante;
  tipo_display?: string;
  usuario?: number | null;
  usuario_nombre?: string | null;
  area?: number | null;
  area_nombre?: string | null;
  cargo?: number | null;
  cargo_nombre?: string | null;
  estado: EstadoParticipacion;
  estado_display?: string;
  fecha_notificacion?: string | null;
  fecha_inicio_respuesta?: string | null;
  fecha_completado?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateParticipanteDTO {
  tipo: TipoParticipante;
  usuario?: number | null;
  area?: number | null;
  cargo?: number | null;
}

// ==================== RESPUESTA ====================

export interface RespuestaEncuesta {
  id: number;
  tema: number;
  tema_titulo?: string;
  respondente?: number | null;
  respondente_nombre?: string | null;
  clasificacion: Clasificacion;
  clasificacion_display?: string;
  justificacion?: string;
  impacto_percibido: NivelImpacto;
  impacto_display?: string;
  created_at: string;
}

export interface CreateRespuestaDTO {
  tema: number;
  clasificacion: Clasificacion;
  justificacion?: string;
  impacto_percibido?: NivelImpacto;
}

export interface RespuestaPublicaDTO {
  tema_id: number;
  clasificacion: Clasificacion;
  justificacion?: string;
  impacto_percibido?: NivelImpacto;
}

export interface RespuestasLoteDTO {
  respuestas: RespuestaPublicaDTO[];
}

// ==================== ENCUESTA ====================

export interface EncuestaDofa {
  id: number;
  titulo: string;
  descripcion?: string | null;
  analisis_dofa: number;
  analisis_dofa_nombre?: string;
  token_publico?: string;
  es_publica: boolean;
  enlace_publico?: string;
  requiere_justificacion: boolean;
  fecha_inicio: string;
  fecha_cierre: string;
  estado: EstadoEncuesta;
  estado_display?: string;
  responsable?: number | null;
  responsable_nombre?: string | null;
  total_invitados: number;
  total_respondidos: number;
  porcentaje_participacion?: number;
  esta_vigente?: boolean;
  notificacion_enviada: boolean;
  fecha_notificacion?: string | null;
  total_temas?: number;
  temas?: TemaEncuesta[];
  participantes?: ParticipanteEncuesta[];
  created_at: string;
  updated_at?: string;
}

export interface EncuestaListItem {
  id: number;
  titulo: string;
  descripcion?: string | null;
  analisis_dofa: number;
  analisis_dofa_nombre?: string;
  estado: EstadoEncuesta;
  estado_display?: string;
  es_publica: boolean;
  fecha_inicio: string;
  fecha_cierre: string;
  responsable?: number | null;
  responsable_nombre?: string | null;
  total_invitados: number;
  total_respondidos: number;
  porcentaje_participacion?: number;
  esta_vigente?: boolean;
  total_temas?: number;
  notificacion_enviada: boolean;
  created_at: string;
}

export interface CreateEncuestaDTO {
  analisis_dofa: number;
  titulo: string;
  descripcion?: string;
  es_publica?: boolean;
  requiere_justificacion?: boolean;
  fecha_inicio: string;
  fecha_cierre: string;
  temas?: CreateTemaDTO[];
  participantes?: CreateParticipanteDTO[];
}

export interface UpdateEncuestaDTO {
  titulo?: string;
  descripcion?: string;
  es_publica?: boolean;
  requiere_justificacion?: boolean;
  fecha_inicio?: string;
  fecha_cierre?: string;
}

// ==================== ENCUESTA PÚBLICA ====================

export interface EncuestaPublica {
  id: number;
  titulo: string;
  descripcion?: string | null;
  requiere_justificacion: boolean;
  fecha_inicio: string;
  fecha_cierre: string;
  esta_vigente: boolean;
  temas: TemaPublico[];
  puede_responder?: boolean;
  razon?: string;
}

export interface TemaPublico {
  id: number;
  titulo: string;
  descripcion?: string;
  area_name?: string | null;
  orden: number;
}

// ==================== ESTADÍSTICAS ====================

export interface EstadisticasTema {
  tema_id: number;
  titulo: string;
  area_name?: string | null;
  total_respuestas: number;
  votos_fortaleza: number;
  votos_debilidad: number;
  porcentaje_fortaleza: number;
  porcentaje_debilidad: number;
  consenso: 'fortaleza' | 'debilidad' | 'empate';
  nivel_consenso: number; // 0-100, qué tan fuerte es el consenso
}

export interface EstadisticasEncuesta {
  encuesta_id: number;
  titulo: string;
  estado: EstadoEncuesta;
  fecha_inicio: string;
  fecha_cierre: string;
  total_invitados: number;
  total_respondieron: number;
  porcentaje_participacion: number;
  total_temas: number;
  esta_vigente: boolean;
  temas: EstadisticasTema[];
}

// ==================== FILTERS ====================

export interface EncuestaFilters {
  analisis_dofa?: number;
  estado?: EstadoEncuesta;
  es_publica?: boolean;
  search?: string;
}

export interface ParticipanteFilters {
  encuesta?: number;
  tipo?: TipoParticipante;
  estado?: EstadoParticipacion;
}

export interface RespuestaFilters {
  tema?: number;
  tema__encuesta?: number;
  clasificacion?: Clasificacion;
  respondente?: number;
}

// ==================== ACCIONES ====================

export interface ConsolidarResultado {
  success: boolean;
  message: string;
  factores_creados?: number;
  detalles?: {
    fortalezas: number;
    debilidades: number;
    empates: number;
  };
}

export interface EnviarNotificacionesResultado {
  success: boolean;
  message: string;
  total_notificados?: number;
  errores?: string[];
}

// ==================== UI CONFIG ====================

export const ESTADO_ENCUESTA_CONFIG = {
  borrador: {
    label: 'Borrador',
    color: 'gray' as const,
    description: 'En preparacion',
  },
  activa: {
    label: 'Activa',
    color: 'success' as const,
    description: 'Recibiendo respuestas',
  },
  cerrada: {
    label: 'Cerrada',
    color: 'warning' as const,
    description: 'Finalizada',
  },
  procesada: {
    label: 'Procesada',
    color: 'info' as const,
    description: 'Resultados consolidados',
  },
  cancelada: {
    label: 'Cancelada',
    color: 'danger' as const,
    description: 'Cancelada',
  },
} as const;
