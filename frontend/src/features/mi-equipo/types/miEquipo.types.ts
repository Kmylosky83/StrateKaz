/**
 * Types para Mi Equipo (MSS - Manager Self-Service)
 * Sistema de Gestion StrateKaz
 */

export interface ColaboradorEquipo {
  id: number;
  nombre_completo: string;
  numero_identificacion: string;
  cargo_nombre: string;
  is_externo: boolean;
  estado: string;
  fecha_ingreso: string;
  foto_url: string | null;
}

export type TipoSolicitud = 'vacaciones' | 'permiso' | 'hora_extra';

export interface AprobacionPendiente {
  id: number;
  tipo: TipoSolicitud;
  colaborador_nombre: string;
  fecha_solicitud: string;
  detalle: string;
  estado: string;
}

export interface AprobarRechazarData {
  accion: 'aprobar' | 'rechazar';
  observaciones?: string;
}

export interface AsistenciaEquipo {
  colaborador_id: number;
  colaborador_nombre: string;
  dias_trabajados: number;
  dias_ausencia: number;
  horas_extra: number;
  tardanzas: number;
}

export interface EvaluacionEquipo {
  colaborador_id: number;
  colaborador_nombre: string;
  evaluacion_id: number | null;
  estado: string;
  calificacion_general: number | null;
  fecha_evaluacion: string | null;
}

export type MiEquipoTab = 'equipo' | 'aprobaciones' | 'asistencia' | 'evaluaciones';
