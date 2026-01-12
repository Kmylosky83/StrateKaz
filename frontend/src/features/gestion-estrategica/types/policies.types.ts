/**
 * Tipos unificados para el sistema de Políticas
 * Sistema de Gestión StrateKaz v3.0
 *
 * Este archivo define todos los tipos necesarios para el manejo
 * de políticas corporativas de forma unificada y dinámica.
 */

// ============================================================================
// ENUMERACIONES
// ============================================================================

/**
 * Estados del workflow de una política
 *
 * Flujo completo:
 * BORRADOR → EN_REVISION (firmando) → FIRMADO → Enviar a Documental → VIGENTE → OBSOLETO
 */
export type PoliticaStatus = 'BORRADOR' | 'EN_REVISION' | 'FIRMADO' | 'VIGENTE' | 'OBSOLETO';

/** Roles disponibles para firmantes en workflows */
export type RolFirmante =
  | 'ELABORO'
  | 'REVISO_TECNICO'
  | 'REVISO_JURIDICO'
  | 'APROBO_DIRECTOR'
  | 'APROBO_GERENTE'
  | 'APROBO_REPRESENTANTE_LEGAL';

/** Estados de una firma individual */
export type EstadoFirma = 'PENDIENTE' | 'FIRMADO' | 'RECHAZADO' | 'REVOCADO';

/** Estados del proceso de firma completo */
export type EstadoProcesoFirma = 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADO' | 'RECHAZADO';

// ============================================================================
// NORMA ISO (Dinámico desde BD)
// ============================================================================

/** Norma ISO o sistema de gestión */
export interface NormaISO {
  id: number;
  code: string;
  name: string;
  short_name?: string;
  description?: string;
  category?: string;
  version?: string;
  icon?: string;
  color?: string;
  orden: number;
  es_sistema: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Versión simplificada para selects */
export interface NormaISOOption {
  id: number;
  code: string;
  name: string;
  short_name?: string;
  icon?: string;
  color?: string;
}

// ============================================================================
// TIPO DE POLÍTICA (Dinámico desde BD)
// ============================================================================

/** Tipo de política configurable */
export interface TipoPolitica {
  id: number;
  code: string;
  name: string;
  description?: string;
  prefijo_codigo: string;
  requiere_firma: boolean;
  flujo_firma_default_id?: number;
  flujo_firma_default?: ConfiguracionFlujoFirma;
  normas_iso_default: number[];
  icon: string;
  color: string;
  orden: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Versión simplificada para selects */
export interface TipoPoliticaOption {
  id: number;
  code: string;
  name: string;
  icon: string;
  color: string;
  requiere_firma: boolean;
}

// ============================================================================
// WORKFLOW DE FIRMAS
// ============================================================================

/** Paso dentro de un flujo de firma */
export interface FirmaPaso {
  orden: number;
  rol_firmante: RolFirmante;
  rol_cargo_id: number;
  cargo_nombre?: string;
  es_opcional: boolean;
  puede_delegar: boolean;
}

/** Configuración de flujo de firma */
export interface ConfiguracionFlujoFirma {
  id: number;
  nombre: string;
  descripcion?: string;
  pasos_firma: FirmaPaso[];
  normas_iso_ids: number[];
  es_activo: boolean;
  requiere_firma_secuencial: boolean;
  total_pasos: number;
  pasos_obligatorios: number;
  created_at: string;
  updated_at: string;
}

/** Firma individual de una persona */
export interface FirmaIndividual {
  id: number;
  rol_firmante: RolFirmante;
  rol_firmante_display?: string;
  firmado_por: number;
  firmado_por_name: string;
  firmado_por_cargo?: string;
  estado: EstadoFirma;
  estado_display?: string;
  fecha_firma?: string;
  fecha_rechazo?: string;
  motivo_rechazo?: string;
  signature_image?: string;
  signature_hash?: string;
  orden: number;
  created_at: string;
  updated_at: string;
}

/** Proceso de firma completo para una política */
export interface ProcesoFirmaPolitica {
  id: number;
  politica_id: number;
  flujo_firma_id: number;
  flujo_firma?: ConfiguracionFlujoFirma;
  estado: EstadoProcesoFirma;
  estado_display?: string;
  firmas: FirmaIndividual[];
  progreso: number;
  fecha_inicio: string;
  fecha_completado?: string;
  motivo_rechazo?: string;
  iniciado_por: number;
  iniciado_por_name?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// POLÍTICA UNIFICADA
// ============================================================================

/** Política corporativa (modelo unificado) */
export interface Politica {
  id: number;
  identity: number;

  // Tipo (dinámico)
  tipo_id: number;
  tipo?: TipoPolitica;
  tipo_code?: string;
  tipo_name?: string;

  // Identificación
  /**
   * Código oficial de la política (ej: POL-SST-001)
   * IMPORTANTE: Este campo es OPCIONAL hasta que la política sea
   * enviada al Gestor Documental, quien asigna el código oficial.
   * Solo las políticas con status='VIGENTE' tienen código asignado.
   */
  code?: string;
  /** Código del documento en Gestor Documental (referencia) */
  documento_codigo?: string;
  /** ID del documento en Gestor Documental */
  documento_id?: number;
  title: string;
  content: string;
  version: string;

  // Estado y vigencia
  status: PoliticaStatus;
  status_display?: string;
  effective_date?: string;
  expiry_date?: string;
  review_date?: string;
  needs_review?: boolean;

  // Normas aplicables (dinámico)
  normas_aplicables: NormaISO[];
  normas_aplicables_ids?: number[];

  // Responsables (opcional según tipo)
  area_id?: number;
  area_name?: string;
  responsible_id?: number;
  responsible_name?: string;
  responsible_cargo_id?: number;
  responsible_cargo_name?: string;

  // Workflow de firmas
  proceso_firma?: ProcesoFirmaPolitica;
  is_signed: boolean;

  // Documentos
  document_file?: string;
  change_reason?: string;
  keywords?: string[];

  // Control
  orden: number;
  is_active: boolean;

  // Auditoría
  created_by?: number;
  created_by_name?: string;
  updated_by?: number;
  updated_by_name?: string;
  created_at: string;
  updated_at: string;
}

/** DTO para crear política */
export interface CreatePoliticaDTO {
  identity: number;
  tipo_id: number;
  title: string;
  content: string;
  code?: string;
  version?: string;
  effective_date?: string;
  review_date?: string;
  normas_aplicables_ids?: number[];
  area_id?: number;
  responsible_id?: number;
  responsible_cargo_id?: number;
  keywords?: string[];
  orden?: number;
}

/** DTO para actualizar política */
export interface UpdatePoliticaDTO {
  title?: string;
  content?: string;
  code?: string;
  version?: string;
  status?: PoliticaStatus;
  effective_date?: string;
  review_date?: string;
  normas_aplicables_ids?: number[];
  area_id?: number | null;
  responsible_id?: number | null;
  responsible_cargo_id?: number | null;
  keywords?: string[];
  change_reason?: string;
  orden?: number;
  is_active?: boolean;
}

/** Filtros para búsqueda de políticas */
export interface PoliticaFilters {
  identity?: number;
  tipo_id?: number;
  tipo_code?: string;
  norma_iso_id?: number;
  status?: PoliticaStatus;
  area_id?: number;
  responsible_id?: number;
  needs_review?: boolean;
  is_signed?: boolean;
  is_active?: boolean;
  search?: string;
  ordering?: string;
}

// ============================================================================
// RESPUESTAS DE API
// ============================================================================

/** Respuesta paginada genérica */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Respuesta de lista de políticas */
export type PoliticasResponse = PaginatedResponse<Politica>;

/** Respuesta de lista de tipos */
export type TiposPoliticaResponse = TipoPolitica[];

/** Respuesta de lista de normas */
export type NormasISOResponse = PaginatedResponse<NormaISO>;

// ============================================================================
// ESTADÍSTICAS
// ============================================================================

/** Estadísticas del módulo de políticas */
export interface PoliticasStats {
  total: number;
  por_status: Record<PoliticaStatus, number>;
  por_tipo: Record<string, number>;
  vigentes: number;
  en_revision: number;
  borradores: number;
  obsoletas: number;
  necesitan_revision: number;
  firmas_pendientes: number;
  cobertura_normas: {
    total_normas: number;
    normas_cubiertas: number;
    porcentaje: number;
  };
}

// ============================================================================
// ACCIONES
// ============================================================================

/** DTO para iniciar proceso de firma */
export interface IniciarFirmaDTO {
  flujo_firma_id?: number;
}

/** DTO para firmar una política */
export interface FirmarPoliticaDTO {
  firma_id: number;
  signature_image: string;
  confirmar: boolean;
}

/** DTO para rechazar firma */
export interface RechazarFirmaDTO {
  firma_id: number;
  motivo: string;
}

/** DTO para publicar política */
export interface PublicarPoliticaDTO {
  confirmar: boolean;
}

// ============================================================================
// INTEGRACIÓN CON GESTOR DOCUMENTAL
// ============================================================================

/** Clasificación de seguridad del documento */
export type ClasificacionDocumento = 'PUBLICO' | 'INTERNO' | 'CONFIDENCIAL' | 'RESTRINGIDO';

/** DTO para enviar política firmada al Gestor Documental */
export interface EnviarADocumentalDTO {
  /** ID del tipo de documento (opcional, se crea POLITICA si no existe) */
  tipo_documento_id?: number;
  /** Clasificación de seguridad */
  clasificacion?: ClasificacionDocumento;
  /** IDs de áreas donde aplica la política */
  areas_aplicacion?: number[];
  /** Observaciones adicionales */
  observaciones?: string;
}

/** Respuesta del envío a documental */
export interface EnviarADocumentalResponse {
  detail: string;
  politica_id: number;
  politica_status: PoliticaStatus;
  mensaje: string;
  datos_documental: {
    origen: string;
    tipo_origen: string;
    politica_id: number;
    empresa_id: number;
    titulo: string;
    contenido: string;
    version: string;
    norma_iso_code: string;
    area_id?: number;
    area_nombre?: string;
    palabras_clave: string[];
    clasificacion: ClasificacionDocumento;
    areas_aplicacion: number[];
    observaciones: string;
    firmas: Array<{
      orden: number;
      rol: string;
      rol_display: string;
      cargo_id: number;
      cargo_nombre: string;
      usuario_id?: number;
      usuario_nombre?: string;
      fecha_firma?: string;
      firma_hash?: string;
    }>;
    proceso_firma_id: number;
    fecha_firma_completada?: string;
    solicitado_por: number;
    solicitado_por_nombre: string;
    fecha_solicitud: string;
  };
  instrucciones: {
    endpoint_destino: string;
    metodo: string;
    nota: string;
  };
}

/** Respuesta de recepción en Gestor Documental */
export interface RecibirPoliticaResponse {
  detail: string;
  documento_id: number;
  codigo: string;
  titulo: string;
  estado: string;
  version: string;
  fecha_publicacion: string;
  total_firmas_registradas: number;
  url_documento: string;
  origen: {
    modulo: string;
    tipo: string;
    politica_id: number;
  };
}

// ============================================================================
// CONFIGURACIÓN DE UI
// ============================================================================

/** Configuración visual de estados */
export const STATUS_CONFIG: Record<PoliticaStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  BORRADOR: {
    label: 'Borrador',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: 'FileEdit',
  },
  EN_REVISION: {
    label: 'En Revisión',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: 'Clock',
  },
  FIRMADO: {
    label: 'Firmado',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: 'PenTool',
  },
  VIGENTE: {
    label: 'Vigente',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: 'CheckCircle',
  },
  OBSOLETO: {
    label: 'Obsoleto',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: 'XCircle',
  },
};

/** Configuración visual de estados de firma */
export const FIRMA_STATUS_CONFIG: Record<EstadoFirma, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  PENDIENTE: {
    label: 'Pendiente',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: 'Clock',
  },
  FIRMADO: {
    label: 'Firmado',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: 'CheckCircle',
  },
  RECHAZADO: {
    label: 'Rechazado',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: 'XCircle',
  },
  REVOCADO: {
    label: 'Revocado',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: 'AlertTriangle',
  },
};
