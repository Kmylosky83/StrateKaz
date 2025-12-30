/**
 * Tipos TypeScript para Sistema Documental - HSEQ Management
 * Sistema de Gestión Grasas y Huesos del Norte
 *
 * Incluye:
 * - Tipos de Documentos
 * - Plantillas de Documentos
 * - Documentos
 * - Versiones de Documentos
 * - Campos de Formulario
 * - Firmas Digitales
 * - Control Documental
 */

// ==================== USER DETAIL ====================

/**
 * Información básica de usuario para relaciones
 */
export interface UserDetail {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
}

// ==================== ENUMS Y TIPOS ====================

export type NivelDocumento = 'ESTRATEGICO' | 'TACTICO' | 'OPERATIVO' | 'SOPORTE';

export type TipoPlantilla = 'HTML' | 'MARKDOWN' | 'FORMULARIO';

export type EstadoPlantilla = 'BORRADOR' | 'ACTIVA' | 'OBSOLETA';

export type EstadoDocumento = 'BORRADOR' | 'EN_REVISION' | 'APROBADO' | 'PUBLICADO' | 'OBSOLETO' | 'ARCHIVADO';

export type ClasificacionDocumento = 'PUBLICO' | 'INTERNO' | 'CONFIDENCIAL' | 'RESTRINGIDO';

export type TipoCambioVersion = 'CREACION' | 'REVISION_MENOR' | 'REVISION_MAYOR' | 'CORRECCION' | 'ACTUALIZACION';

export type TipoCampoFormulario =
  | 'TEXT'
  | 'TEXTAREA'
  | 'NUMBER'
  | 'DATE'
  | 'DATETIME'
  | 'SELECT'
  | 'MULTISELECT'
  | 'RADIO'
  | 'CHECKBOX'
  | 'FILE'
  | 'EMAIL'
  | 'PHONE'
  | 'URL'
  | 'SIGNATURE'
  | 'TABLA'
  | 'SECCION';

export type TipoFirma = 'ELABORACION' | 'REVISION' | 'APROBACION' | 'CONFORMIDAD' | 'VALIDACION';

export type EstadoFirma = 'PENDIENTE' | 'FIRMADO' | 'RECHAZADO' | 'REVOCADO';

export type TipoControl = 'DISTRIBUCION' | 'ACTUALIZACION' | 'RETIRO' | 'DESTRUCCION' | 'ARCHIVO';

export type MedioDistribucion = 'DIGITAL' | 'IMPRESO' | 'MIXTO';

// ==================== TIPO DOCUMENTO ====================

/**
 * Catálogo de tipos de documentos configurables
 * Ejemplos: Procedimiento, Instructivo, Formato, Manual, Política
 */
export interface TipoDocumento {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  nivel_documento: NivelDocumento;
  prefijo_codigo: string;
  requiere_aprobacion: boolean;
  requiere_firma: boolean;
  tiempo_retencion_años: number;
  plantilla_por_defecto: string;
  campos_obligatorios: string[];
  color_identificacion: string;
  is_active: boolean;
  orden: number;
  empresa_id: number;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  created_by_detail?: UserDetail;
}

// ==================== PLANTILLA DOCUMENTO ====================

/**
 * Plantillas base con estructura predefinida para generación de documentos
 */
export interface PlantillaDocumento {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo_documento: number;
  tipo_documento_detail?: TipoDocumento;
  tipo_plantilla: TipoPlantilla;
  contenido_plantilla: string;
  variables_disponibles: string[];
  estilos_css: string;
  encabezado: string;
  pie_pagina: string;
  version: string;
  estado: EstadoPlantilla;
  es_por_defecto: boolean;
  campos_formulario?: CampoFormulario[];
  empresa_id: number;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  created_by_detail?: UserDetail;
}

// ==================== DOCUMENTO ====================

/**
 * Documentos del sistema con control de versiones completo
 */
export interface Documento {
  id: number;
  codigo: string;
  titulo: string;
  tipo_documento: number;
  tipo_documento_detail?: TipoDocumento;
  plantilla: number | null;
  plantilla_detail?: PlantillaDocumento;
  resumen: string;
  contenido: string;
  datos_formulario: Record<string, any>;
  palabras_clave: string[];
  version_actual: string;
  numero_revision: number;
  estado: EstadoDocumento;
  clasificacion: ClasificacionDocumento;
  fecha_creacion: string;
  fecha_aprobacion: string | null;
  fecha_publicacion: string | null;
  fecha_vigencia: string | null;
  fecha_revision_programada: string | null;
  fecha_obsolescencia: string | null;
  elaborado_por: number;
  elaborado_por_detail?: UserDetail;
  revisado_por: number | null;
  revisado_por_detail?: UserDetail;
  aprobado_por: number | null;
  aprobado_por_detail?: UserDetail;
  areas_aplicacion: string[];
  puestos_aplicacion: string[];
  usuarios_autorizados: number[];
  archivo_pdf: string | null;
  archivos_anexos: string[];
  documento_padre: number | null;
  documento_padre_detail?: Partial<Documento>;
  documentos_referenciados: number[];
  numero_descargas: number;
  numero_impresiones: number;
  observaciones: string;
  motivo_cambio_version: string;
  versiones?: VersionDocumento[];
  firmas?: FirmaDocumento[];
  controles?: ControlDocumental[];
  empresa_id: number;
  created_at: string;
  updated_at: string;
}

// ==================== VERSION DOCUMENTO ====================

/**
 * Historial de versiones de documentos con control de cambios completo
 */
export interface VersionDocumento {
  id: number;
  documento: number;
  documento_detail?: Partial<Documento>;
  numero_version: string;
  tipo_cambio: TipoCambioVersion;
  contenido_snapshot: string;
  datos_formulario_snapshot: Record<string, any>;
  descripcion_cambios: string;
  cambios_detectados: Array<{
    campo?: string;
    valor_anterior?: any;
    valor_nuevo?: any;
    tipo_cambio?: string;
  }>;
  fecha_version: string;
  creado_por: number;
  creado_por_detail?: UserDetail;
  aprobado_por: number | null;
  aprobado_por_detail?: UserDetail;
  fecha_aprobacion: string | null;
  archivo_pdf_version: string | null;
  is_version_actual: boolean;
  checksum: string;
  firmas?: FirmaDocumento[];
  empresa_id: number;
}

// ==================== CAMPO FORMULARIO ====================

/**
 * Definición de columna para campos tipo tabla
 */
export interface ColumnaTabla {
  nombre_campo: string;
  etiqueta: string;
  tipo_campo: TipoCampoFormulario;
  ancho?: number;
  es_obligatorio?: boolean;
  opciones?: Array<{ value: string; label: string }>;
}

/**
 * Condición de visibilidad para campos
 */
export interface CondicionVisibilidad {
  campo_dependiente?: string;
  operador?: 'igual' | 'diferente' | 'contiene' | 'mayor_que' | 'menor_que';
  valor?: any;
  logica?: 'and' | 'or';
  condiciones?: CondicionVisibilidad[];
}

/**
 * Campos dinámicos configurables para Form Builder
 */
export interface CampoFormulario {
  id: number;
  plantilla: number | null;
  tipo_documento: number | null;
  nombre_campo: string;
  etiqueta: string;
  tipo_campo: TipoCampoFormulario;
  descripcion: string;
  placeholder: string;
  valor_por_defecto: string;
  opciones: Array<{ value: string; label: string }>;
  es_obligatorio: boolean;
  validacion_regex: string;
  mensaje_validacion: string;
  valor_minimo: number | null;
  valor_maximo: number | null;
  longitud_minima: number | null;
  longitud_maxima: number | null;
  columnas_tabla: ColumnaTabla[];
  orden: number;
  ancho_columna: number;
  clase_css: string;
  condicion_visible: CondicionVisibilidad;
  is_active: boolean;
  empresa_id: number;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  created_by_detail?: UserDetail;
}

// ==================== FIRMA DOCUMENTO ====================

/**
 * Registro de firmas digitales en documentos
 */
export interface FirmaDocumento {
  id: number;
  documento: number;
  documento_detail?: Partial<Documento>;
  version_documento: number | null;
  version_documento_detail?: Partial<VersionDocumento>;
  tipo_firma: TipoFirma;
  firmante: number;
  firmante_detail?: UserDetail;
  cargo_firmante: string;
  estado: EstadoFirma;
  fecha_solicitud: string;
  fecha_firma: string | null;
  firma_digital: string;
  certificado_digital: string;
  ip_address: string | null;
  user_agent: string;
  latitud: number | null;
  longitud: number | null;
  comentarios: string;
  motivo_rechazo: string;
  orden_firma: number;
  checksum_documento: string;
  empresa_id: number;
  created_at: string;
  updated_at: string;
}

// ==================== CONTROL DOCUMENTAL ====================

/**
 * Confirmación de recepción de documento
 */
export interface ConfirmacionRecepcion {
  usuario_id: number;
  usuario_nombre?: string;
  fecha_confirmacion: string;
  medio?: MedioDistribucion;
  observaciones?: string;
}

/**
 * Control de distribución, obsolescencia y trazabilidad de documentos
 */
export interface ControlDocumental {
  id: number;
  documento: number;
  documento_detail?: Partial<Documento>;
  version_documento: number | null;
  version_documento_detail?: Partial<VersionDocumento>;
  tipo_control: TipoControl;
  fecha_distribucion: string | null;
  medio_distribucion: MedioDistribucion;
  areas_distribucion: string[];
  usuarios_distribucion: number[];
  numero_copias_impresas: number;
  numero_copias_controladas: number;
  fecha_retiro: string | null;
  motivo_retiro: string;
  documento_sustituto: number | null;
  documento_sustituto_detail?: Partial<Documento>;
  confirmaciones_recepcion: ConfirmacionRecepcion[];
  fecha_destruccion: string | null;
  metodo_destruccion: string;
  responsable_destruccion: number | null;
  responsable_destruccion_detail?: UserDetail;
  acta_destruccion: string | null;
  observaciones: string;
  empresa_id: number;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  created_by_detail?: UserDetail;
}

// ==================== DTOs - CREATE ====================

export interface CreateTipoDocumentoDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  nivel_documento: NivelDocumento;
  prefijo_codigo: string;
  requiere_aprobacion?: boolean;
  requiere_firma?: boolean;
  tiempo_retencion_años?: number;
  plantilla_por_defecto?: string;
  campos_obligatorios?: string[];
  color_identificacion?: string;
  orden?: number;
}

export interface CreatePlantillaDocumentoDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo_documento: number;
  tipo_plantilla: TipoPlantilla;
  contenido_plantilla: string;
  variables_disponibles?: string[];
  estilos_css?: string;
  encabezado?: string;
  pie_pagina?: string;
  version?: string;
  estado?: EstadoPlantilla;
  es_por_defecto?: boolean;
}

export interface CreateDocumentoDTO {
  titulo: string;
  tipo_documento: number;
  plantilla?: number;
  resumen?: string;
  contenido: string;
  datos_formulario?: Record<string, any>;
  palabras_clave?: string[];
  clasificacion?: ClasificacionDocumento;
  fecha_vigencia?: string;
  fecha_revision_programada?: string;
  elaborado_por: number;
  areas_aplicacion?: string[];
  puestos_aplicacion?: string[];
  observaciones?: string;
}

export interface CreateVersionDocumentoDTO {
  documento: number;
  numero_version: string;
  tipo_cambio: TipoCambioVersion;
  descripcion_cambios: string;
  contenido_snapshot: string;
  datos_formulario_snapshot?: Record<string, any>;
}

export interface CreateCampoFormularioDTO {
  plantilla?: number;
  tipo_documento?: number;
  nombre_campo: string;
  etiqueta: string;
  tipo_campo: TipoCampoFormulario;
  descripcion?: string;
  placeholder?: string;
  valor_por_defecto?: string;
  opciones?: Array<{ value: string; label: string }>;
  es_obligatorio?: boolean;
  validacion_regex?: string;
  mensaje_validacion?: string;
  valor_minimo?: number;
  valor_maximo?: number;
  longitud_minima?: number;
  longitud_maxima?: number;
  columnas_tabla?: ColumnaTabla[];
  orden?: number;
  ancho_columna?: number;
  clase_css?: string;
  condicion_visible?: CondicionVisibilidad;
}

export interface CreateFirmaDocumentoDTO {
  documento: number;
  version_documento?: number;
  tipo_firma: TipoFirma;
  firmante: number;
  cargo_firmante: string;
  orden_firma?: number;
}

export interface CreateControlDocumentalDTO {
  documento: number;
  version_documento?: number;
  tipo_control: TipoControl;
  fecha_distribucion?: string;
  medio_distribucion?: MedioDistribucion;
  areas_distribucion?: string[];
  usuarios_distribucion?: number[];
  numero_copias_impresas?: number;
  numero_copias_controladas?: number;
  motivo_retiro?: string;
  documento_sustituto?: number;
  observaciones?: string;
}

// ==================== DTOs - UPDATE ====================

export interface UpdateTipoDocumentoDTO {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  nivel_documento?: NivelDocumento;
  prefijo_codigo?: string;
  requiere_aprobacion?: boolean;
  requiere_firma?: boolean;
  tiempo_retencion_años?: number;
  plantilla_por_defecto?: string;
  campos_obligatorios?: string[];
  color_identificacion?: string;
  is_active?: boolean;
  orden?: number;
}

export interface UpdatePlantillaDocumentoDTO {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  tipo_documento?: number;
  tipo_plantilla?: TipoPlantilla;
  contenido_plantilla?: string;
  variables_disponibles?: string[];
  estilos_css?: string;
  encabezado?: string;
  pie_pagina?: string;
  version?: string;
  estado?: EstadoPlantilla;
  es_por_defecto?: boolean;
}

export interface UpdateDocumentoDTO {
  titulo?: string;
  tipo_documento?: number;
  plantilla?: number;
  resumen?: string;
  contenido?: string;
  datos_formulario?: Record<string, any>;
  palabras_clave?: string[];
  estado?: EstadoDocumento;
  clasificacion?: ClasificacionDocumento;
  fecha_aprobacion?: string;
  fecha_publicacion?: string;
  fecha_vigencia?: string;
  fecha_revision_programada?: string;
  fecha_obsolescencia?: string;
  revisado_por?: number;
  aprobado_por?: number;
  areas_aplicacion?: string[];
  puestos_aplicacion?: string[];
  usuarios_autorizados?: number[];
  archivo_pdf?: string;
  archivos_anexos?: string[];
  documento_padre?: number;
  documentos_referenciados?: number[];
  observaciones?: string;
  motivo_cambio_version?: string;
}

export interface UpdateCampoFormularioDTO {
  nombre_campo?: string;
  etiqueta?: string;
  tipo_campo?: TipoCampoFormulario;
  descripcion?: string;
  placeholder?: string;
  valor_por_defecto?: string;
  opciones?: Array<{ value: string; label: string }>;
  es_obligatorio?: boolean;
  validacion_regex?: string;
  mensaje_validacion?: string;
  valor_minimo?: number;
  valor_maximo?: number;
  longitud_minima?: number;
  longitud_maxima?: number;
  columnas_tabla?: ColumnaTabla[];
  orden?: number;
  ancho_columna?: number;
  clase_css?: string;
  condicion_visible?: CondicionVisibilidad;
  is_active?: boolean;
}

export interface UpdateFirmaDocumentoDTO {
  estado?: EstadoFirma;
  fecha_firma?: string;
  firma_digital?: string;
  certificado_digital?: string;
  ip_address?: string;
  user_agent?: string;
  latitud?: number;
  longitud?: number;
  comentarios?: string;
  motivo_rechazo?: string;
  checksum_documento?: string;
}

export interface UpdateControlDocumentalDTO {
  tipo_control?: TipoControl;
  fecha_distribucion?: string;
  medio_distribucion?: MedioDistribucion;
  areas_distribucion?: string[];
  usuarios_distribucion?: number[];
  numero_copias_impresas?: number;
  numero_copias_controladas?: number;
  fecha_retiro?: string;
  motivo_retiro?: string;
  documento_sustituto?: number;
  confirmaciones_recepcion?: ConfirmacionRecepcion[];
  fecha_destruccion?: string;
  metodo_destruccion?: string;
  responsable_destruccion?: number;
  acta_destruccion?: string;
  observaciones?: string;
}

// ==================== DTOs - FILTERS ====================

export interface TipoDocumentoFilters {
  nivel_documento?: NivelDocumento;
  is_active?: boolean;
  search?: string;
}

export interface PlantillaDocumentoFilters {
  tipo_documento?: number;
  tipo_plantilla?: TipoPlantilla;
  estado?: EstadoPlantilla;
  es_por_defecto?: boolean;
  search?: string;
}

export interface DocumentoFilters {
  tipo_documento?: number;
  estado?: EstadoDocumento;
  clasificacion?: ClasificacionDocumento;
  elaborado_por?: number;
  aprobado_por?: number;
  fecha_creacion_desde?: string;
  fecha_creacion_hasta?: string;
  fecha_publicacion_desde?: string;
  fecha_publicacion_hasta?: string;
  revision_vencida?: boolean;
  search?: string;
}

export interface VersionDocumentoFilters {
  documento?: number;
  tipo_cambio?: TipoCambioVersion;
  creado_por?: number;
  is_version_actual?: boolean;
  fecha_desde?: string;
  fecha_hasta?: string;
}

export interface CampoFormularioFilters {
  plantilla?: number;
  tipo_documento?: number;
  tipo_campo?: TipoCampoFormulario;
  es_obligatorio?: boolean;
  is_active?: boolean;
}

export interface FirmaDocumentoFilters {
  documento?: number;
  version_documento?: number;
  tipo_firma?: TipoFirma;
  firmante?: number;
  estado?: EstadoFirma;
  fecha_desde?: string;
  fecha_hasta?: string;
}

export interface ControlDocumentalFilters {
  documento?: number;
  tipo_control?: TipoControl;
  medio_distribucion?: MedioDistribucion;
  fecha_distribucion_desde?: string;
  fecha_distribucion_hasta?: string;
}

// ==================== ACCIONES ESPECIALES ====================

/**
 * DTO para aprobar un documento
 */
export interface AprobarDocumentoDTO {
  aprobado_por: number;
  fecha_aprobacion: string;
  observaciones?: string;
}

/**
 * DTO para publicar un documento
 */
export interface PublicarDocumentoDTO {
  fecha_publicacion: string;
  fecha_vigencia?: string;
  areas_aplicacion?: string[];
  puestos_aplicacion?: string[];
}

/**
 * DTO para firmar un documento
 */
export interface FirmarDocumentoDTO {
  firma_digital: string;
  certificado_digital?: string;
  ip_address?: string;
  user_agent?: string;
  latitud?: number;
  longitud?: number;
  comentarios?: string;
}

/**
 * DTO para rechazar una firma
 */
export interface RechazarFirmaDTO {
  motivo_rechazo: string;
}

/**
 * DTO para confirmar recepción de documento
 */
export interface ConfirmarRecepcionDTO {
  usuario_id: number;
  medio?: MedioDistribucion;
  observaciones?: string;
}

// ==================== RESPONSE TYPES ====================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Estadísticas del sistema documental
 */
export interface EstadisticasDocumentales {
  total_documentos: number;
  por_estado: Record<EstadoDocumento, number>;
  por_tipo: Array<{ tipo: string; cantidad: number }>;
  proximos_vencer: number;
  pendientes_aprobacion: number;
  pendientes_revision: number;
  total_versiones: number;
  total_firmas_pendientes: number;
}
