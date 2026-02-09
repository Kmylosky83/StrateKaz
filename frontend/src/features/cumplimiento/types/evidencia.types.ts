/**
 * Types para Evidencias Centralizadas.
 */

export type EstadoEvidencia = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'VENCIDA' | 'ARCHIVADA';

export type CategoriaEvidencia =
  | 'FOTOGRAFICA'
  | 'DOCUMENTAL'
  | 'REGISTRO'
  | 'CERTIFICADO'
  | 'ACTA'
  | 'INFORME'
  | 'RESULTADO_PRUEBA'
  | 'CAPACITACION'
  | 'INSPECCION'
  | 'VIDEO'
  | 'OTRO';

export interface Evidencia {
  id: number;
  titulo: string;
  descripcion: string;
  archivo: string;
  nombre_original: string;
  mime_type: string;
  tamano_bytes: number;
  tamano_legible: string;
  checksum_sha256: string;
  categoria: CategoriaEvidencia;
  estado: EstadoEvidencia;
  normas_relacionadas: string[];
  tags: string[];
  fecha_vigencia: string | null;
  es_imagen: boolean;
  es_pdf: boolean;
  aprobado_por: number | null;
  aprobado_por_nombre: string;
  fecha_aprobacion: string | null;
  motivo_rechazo: string;
  subido_por: number;
  subido_por_nombre: string;
  content_type: number;
  object_id: number;
  entity_label: string;
  created_at: string;
  updated_at: string;
}

export interface EvidenciaDetalle extends Evidencia {
  historial: HistorialEvidencia[];
}

export interface HistorialEvidencia {
  id: number;
  accion: string;
  usuario: number | null;
  usuario_nombre: string;
  comentario: string;
  datos_anteriores: Record<string, unknown>;
  fecha: string;
}

export interface ResumenEvidencias {
  total: number;
  pendientes: number;
  aprobadas: number;
  rechazadas: number;
  vencidas: number;
  archivadas: number;
  por_categoria: Record<string, number>;
}

export interface CrearEvidenciaPayload {
  archivo: File;
  titulo: string;
  entity_type: string;
  entity_id: number;
  descripcion?: string;
  categoria?: CategoriaEvidencia;
  normas_relacionadas?: string[];
  tags?: string[];
  fecha_vigencia?: string | null;
}

export interface RechazarEvidenciaPayload {
  motivo: string;
}

export interface ActualizarEvidenciaPayload {
  titulo?: string;
  descripcion?: string;
  categoria?: CategoriaEvidencia;
  normas_relacionadas?: string[];
  tags?: string[];
  fecha_vigencia?: string | null;
}

export interface EvidenciaFilters {
  estado?: EstadoEvidencia;
  categoria?: CategoriaEvidencia;
  norma?: string;
  tag?: string;
  search?: string;
  ordering?: string;
}

/** Opciones de categoría para selects */
export const CATEGORIA_OPTIONS: { value: CategoriaEvidencia; label: string }[] = [
  { value: 'FOTOGRAFICA', label: 'Evidencia Fotográfica' },
  { value: 'DOCUMENTAL', label: 'Evidencia Documental' },
  { value: 'REGISTRO', label: 'Registro' },
  { value: 'CERTIFICADO', label: 'Certificado' },
  { value: 'ACTA', label: 'Acta' },
  { value: 'INFORME', label: 'Informe' },
  { value: 'RESULTADO_PRUEBA', label: 'Resultado de Prueba' },
  { value: 'CAPACITACION', label: 'Evidencia de Capacitación' },
  { value: 'INSPECCION', label: 'Evidencia de Inspección' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'OTRO', label: 'Otro' },
];

/** Opciones de estado para filtros */
export const ESTADO_OPTIONS: { value: EstadoEvidencia; label: string }[] = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'APROBADA', label: 'Aprobada' },
  { value: 'RECHAZADA', label: 'Rechazada' },
  { value: 'VENCIDA', label: 'Vencida' },
  { value: 'ARCHIVADA', label: 'Archivada' },
];
