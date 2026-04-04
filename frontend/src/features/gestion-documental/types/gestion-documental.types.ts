/**
 * Tipos TypeScript para Gestion Documental - Gestion Estrategica (N1)
 * Sistema de Gestion StrateKaz
 *
 * Migrado desde: features/hseq/types/sistema-documental.types.ts
 * NOTA: FirmaDocumento eliminado - usar FirmaDigital de workflow_engine
 */

// ==================== ENUMS Y TIPOS ====================

export type NivelDocumento = 'ESTRATEGICO' | 'TACTICO' | 'OPERATIVO' | 'SOPORTE';

export type TipoPlantilla = 'HTML' | 'MARKDOWN' | 'FORMULARIO';

export type EstadoPlantilla = 'BORRADOR' | 'ACTIVA' | 'OBSOLETA';

export type EstadoDocumento =
  | 'BORRADOR'
  | 'EN_REVISION'
  | 'APROBADO'
  | 'PUBLICADO'
  | 'OBSOLETO'
  | 'ARCHIVADO';

export type ClasificacionDocumento = 'PUBLICO' | 'INTERNO' | 'CONFIDENCIAL' | 'RESTRINGIDO';

export type TipoCambioVersion =
  | 'CREACION'
  | 'REVISION_MENOR'
  | 'REVISION_MAYOR'
  | 'CORRECCION'
  | 'ACTUALIZACION';

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

export type TipoControl = 'DISTRIBUCION' | 'ACTUALIZACION' | 'RETIRO' | 'DESTRUCCION' | 'ARCHIVO';

export type MedioDistribucion = 'DIGITAL' | 'IMPRESO' | 'MIXTO';

export type OcrEstado = 'PENDIENTE' | 'PROCESANDO' | 'COMPLETADO' | 'ERROR' | 'NO_APLICA';

export type SelladoEstado = 'NO_APLICA' | 'PENDIENTE' | 'PROCESANDO' | 'COMPLETADO' | 'ERROR';

export interface SelladoMetadatos {
  certificado_serial?: string;
  algoritmo?: string;
  subject?: string;
  valido_hasta?: string;
  tamano_bytes?: number;
  fecha_sellado?: string;
  error?: string;
}

// ==================== USER DETAIL ====================

export interface UserDetail {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
}

// ==================== TIPO DOCUMENTO ====================

export interface TipoDocumento {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  nivel_documento: NivelDocumento;
  prefijo_codigo: string;
  requiere_aprobacion: boolean;
  requiere_firma: boolean;
  tiempo_retencion_anos: number;
  plantilla_por_defecto: string;
  campos_obligatorios: string[];
  nivel_seguridad_firma: 1 | 2 | 3;
  color_identificacion: string;
  is_active: boolean;
  orden: number;
  empresa_id: number;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  created_by_detail?: UserDetail;
}

// ==================== FIRMANTES POR DEFECTO ====================

export type RolFirma = 'ELABORO' | 'REVISO' | 'APROBO';

export interface FirmantePorDefecto {
  rol_firma: RolFirma;
  cargo_code: string;
  orden: number;
  es_requerido?: boolean;
}

/** Opciones centralizadas de rol de firma — reutilizar en FirmantesEditor y AsignarFirmantesModal */
export const ROL_FIRMA_OPTIONS: ReadonlyArray<{ value: RolFirma; label: string }> = [
  { value: 'ELABORO', label: 'Elaboró' },
  { value: 'REVISO', label: 'Revisó' },
  { value: 'APROBO', label: 'Aprobó' },
] as const;

/** Resultado del endpoint resolver-firmantes */
export interface FirmanteResuelto {
  rol_firma: RolFirma;
  cargo_code: string;
  orden: number;
  es_requerido: boolean;
  cargo_nombre: string | null;
  usuario_nombre: string | null;
  usuario_id: number | null;
  resuelto: boolean;
  warning: string | null;
}

// ==================== PLANTILLA DOCUMENTO ====================

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
  // Firmantes por defecto (auto-crea FirmaDigital al crear documento)
  firmantes_por_defecto?: FirmantePorDefecto[];
  // Biblioteca Maestra (Fase 8)
  plantilla_maestra_codigo?: string;
  es_personalizada?: boolean;
  empresa_id: number;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  created_by_detail?: UserDetail;
}

// ==================== DOCUMENTO ====================

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
  datos_formulario: Record<string, unknown>;
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
  elaborado_por_nombre?: string;
  elaborado_por_detail?: UserDetail;
  revisado_por: number | null;
  revisado_por_nombre?: string;
  revisado_por_detail?: UserDetail;
  aprobado_por: number | null;
  aprobado_por_nombre?: string;
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
  // Campos de política (cuando tipo_documento=POL)
  norma_iso: number | null;
  norma_iso_nombre?: string;
  norma_iso_codigo?: string;
  responsable_cargo: number | null;
  responsable_cargo_nombre?: string;
  fecha_expiracion: string | null;
  motivo_cambio: string;
  es_politica_integral: boolean;
  // Firmas ahora vienen de workflow_engine.firma_digital
  firmas_digitales?: unknown[];
  controles?: ControlDocumental[];
  // OCR / Extracción de texto (Fase 5)
  texto_extraido?: string;
  ocr_estado: OcrEstado;
  ocr_metadatos?: OcrMetadatos;
  // BPM auto-generación (Fase 4)
  workflow_asociado_id?: number | null;
  es_auto_generado?: boolean;
  es_externo: boolean;
  archivo_original?: string | null;
  // Scoring (Fase 6)
  score_cumplimiento?: number;
  score_detalle?: ScoreDetalle;
  score_actualizado_at?: string;
  // Sellado PDF (Mejora 2 — ISO 27001)
  pdf_sellado?: string | null;
  hash_pdf_sellado?: string;
  fecha_sellado?: string | null;
  sellado_estado: SelladoEstado;
  sellado_metadatos?: SelladoMetadatos;
  // Google Drive (Fase 7)
  drive_file_id?: string;
  drive_exportado_at?: string;
  empresa_id: number;
  created_at: string;
  updated_at: string;
}

// ==================== VERSION DOCUMENTO ====================

export interface VersionDocumento {
  id: number;
  documento: number;
  documento_detail?: Partial<Documento>;
  numero_version: string;
  tipo_cambio: TipoCambioVersion;
  contenido_snapshot: string;
  datos_formulario_snapshot: Record<string, unknown>;
  descripcion_cambios: string;
  cambios_detectados: Array<{
    campo?: string;
    valor_anterior?: unknown;
    valor_nuevo?: unknown;
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
  empresa_id: number;
}

// ==================== CAMPO FORMULARIO ====================

export interface ColumnaTabla {
  nombre_campo: string;
  etiqueta: string;
  tipo_campo: TipoCampoFormulario;
  ancho?: number;
  es_obligatorio?: boolean;
  opciones?: Array<{ value: string; label: string }>;
}

export interface CondicionVisibilidad {
  campo_dependiente?: string;
  operador?: 'igual' | 'diferente' | 'contiene' | 'mayor_que' | 'menor_que';
  valor?: unknown;
  logica?: 'and' | 'or';
  condiciones?: CondicionVisibilidad[];
}

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
  formula_calculo?: FormulaCalculo;
  is_active: boolean;
  empresa_id: number;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  created_by_detail?: UserDetail;
}

// ==================== CONTROL DOCUMENTAL ====================

export interface ConfirmacionRecepcion {
  usuario_id: number;
  usuario_nombre?: string;
  fecha_confirmacion: string;
  medio?: MedioDistribucion;
  observaciones?: string;
}

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
  nivel_seguridad_firma?: 1 | 2 | 3;
  tiempo_retencion_anos?: number;
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
  firmantes_por_defecto?: FirmantePorDefecto[];
}

export interface CreateDocumentoDTO {
  titulo: string;
  tipo_documento: number;
  plantilla?: number;
  resumen?: string;
  contenido: string;
  datos_formulario?: Record<string, unknown>;
  palabras_clave?: string[];
  clasificacion?: ClasificacionDocumento;
  fecha_vigencia?: string;
  fecha_revision_programada?: string;
  elaborado_por: number;
  areas_aplicacion?: string[];
  puestos_aplicacion?: string[];
  observaciones?: string;
  // Campos de política (cuando tipo_documento=POL)
  norma_iso?: number;
  responsable_cargo?: number;
  fecha_expiracion?: string;
  motivo_cambio?: string;
  es_politica_integral?: boolean;
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
  formula_calculo?: FormulaCalculo;
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

export interface UpdateTipoDocumentoDTO extends Partial<CreateTipoDocumentoDTO> {
  is_active?: boolean;
}

export type UpdatePlantillaDocumentoDTO = Partial<CreatePlantillaDocumentoDTO>;

export interface UpdateDocumentoDTO extends Partial<CreateDocumentoDTO> {
  estado?: EstadoDocumento;
  fecha_aprobacion?: string;
  fecha_publicacion?: string;
  fecha_obsolescencia?: string;
  revisado_por?: number;
  aprobado_por?: number;
  usuarios_autorizados?: number[];
  archivo_pdf?: string;
  archivos_anexos?: string[];
  documento_padre?: number;
  documentos_referenciados?: number[];
  motivo_cambio_version?: string;
}

export interface UpdateCampoFormularioDTO extends Partial<CreateCampoFormularioDTO> {
  is_active?: boolean;
}

export interface UpdateControlDocumentalDTO extends Partial<CreateControlDocumentalDTO> {
  fecha_retiro?: string;
  confirmaciones_recepcion?: ConfirmacionRecepcion[];
  fecha_destruccion?: string;
  metodo_destruccion?: string;
  responsable_destruccion?: number;
  acta_destruccion?: string;
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

export interface ControlDocumentalFilters {
  documento?: number;
  tipo_control?: TipoControl;
  medio_distribucion?: MedioDistribucion;
  fecha_distribucion_desde?: string;
  fecha_distribucion_hasta?: string;
}

// ==================== ACCIONES ESPECIALES ====================

export interface AprobarDocumentoDTO {
  aprobado_por: number;
  fecha_aprobacion: string;
  observaciones?: string;
}

export interface PublicarDocumentoDTO {
  fecha_publicacion: string;
  fecha_vigencia?: string;
  areas_aplicacion?: string[];
  puestos_aplicacion?: string[];
}

export interface ConfirmarRecepcionDTO {
  usuario_id: number;
  medio?: MedioDistribucion;
  observaciones?: string;
}

// ==================== ESTADISTICAS ====================

export interface EstadisticasDocumentales {
  total: number;
  // Shortcuts (acceso directo sin ir a por_estado)
  publicados: number;
  obsoletos: number;
  archivados: number;
  score_promedio: number;
  // Desglose por estado
  por_estado: {
    borrador: number;
    en_revision: number;
    aprobado: number;
    publicado: number;
    obsoleto: number;
    archivado: number;
  };
  // Desglose por tipo y nivel (para gráficas BI)
  por_tipo: Array<{ nombre: string; total: number }>;
  por_nivel: Array<{ nivel: string; total: number }>;
  // Revisiones
  revision_vencida: number;
  proximas_revision_30d: number;
  // Distribución
  distribucion: {
    total_distribuciones: number;
    total_confirmaciones: number;
  };
  // Lecturas obligatorias
  lecturas_total: number;
  lecturas_pendientes: number;
  lecturas_completadas: number;
  lecturas_vencidas: number;
}

// ==================== OCR (Fase 5) ====================

export interface OcrMetadatos {
  metodo?: 'pdfplumber' | 'tesseract' | 'mixto' | 'ninguno';
  confianza?: number;
  paginas_procesadas?: number;
  total_paginas?: number;
  duracion_seg?: number;
  error?: string | null;
  nota?: string;
}

export interface IngestarExternoDTO {
  archivo: File;
  titulo: string;
  tipo_documento: number;
  clasificacion?: ClasificacionDocumento;
  palabras_clave?: string[];
}

export interface BusquedaTextoResult {
  id: number;
  codigo: string;
  titulo: string;
  resumen: string;
  estado: EstadoDocumento;
  estado_display: string;
  clasificacion: ClasificacionDocumento;
  relevancia: number;
  texto_extracto: string;
  ocr_estado: OcrEstado;
  es_externo: boolean;
}

export const OCR_ESTADO_LABELS: Record<OcrEstado, string> = {
  PENDIENTE: 'OCR pendiente',
  PROCESANDO: 'Procesando OCR...',
  COMPLETADO: 'Texto extraído',
  ERROR: 'Error OCR',
  NO_APLICA: '',
};

export const OCR_ESTADO_COLORS: Record<OcrEstado, string> = {
  PENDIENTE: 'gray',
  PROCESANDO: 'info',
  COMPLETADO: 'success',
  ERROR: 'danger',
  NO_APLICA: 'gray',
};

// ==================== SELLADO PDF (Mejora 2) ====================

export const SELLADO_ESTADO_LABELS: Record<SelladoEstado, string> = {
  NO_APLICA: '',
  PENDIENTE: 'Sellado pendiente',
  PROCESANDO: 'Sellando PDF...',
  COMPLETADO: 'PDF sellado',
  ERROR: 'Error sellado',
};

export const SELLADO_ESTADO_COLORS: Record<SelladoEstado, string> = {
  NO_APLICA: 'gray',
  PENDIENTE: 'gray',
  PROCESANDO: 'info',
  COMPLETADO: 'success',
  ERROR: 'danger',
};

export interface VerificacionSellado {
  integro: boolean;
  hash_actual: string | null;
  hash_almacenado: string;
  error?: string;
}

// ==================== SCORING (Fase 6) ====================

export interface ScoreDetalle {
  [regla: string]: {
    puntos: number;
    maximo: number;
    cumple: boolean;
    descripcion: string;
  };
}

export interface ScoreResumen {
  promedio: number;
  distribucion: {
    critico: number;
    bajo: number;
    medio: number;
    alto: number;
  };
  incompletos: number;
  total: number;
}

// ==================== LECTURA VERIFICADA (Mejora 3) ====================

export type AceptacionEstado = 'PENDIENTE' | 'EN_PROGRESO' | 'ACEPTADO' | 'RECHAZADO' | 'VENCIDO';

export interface AceptacionDocumental {
  id: number;
  documento: number;
  documento_codigo: string;
  documento_titulo: string;
  documento_contenido?: string;
  version_documento: string;
  usuario: number;
  usuario_nombre: string;
  asignado_por: number | null;
  asignado_por_nombre: string | null;
  control_documental?: number | null;
  estado: AceptacionEstado;
  estado_display: string;
  fecha_asignacion: string;
  fecha_limite: string | null;
  dias_restantes: number | null;
  fecha_inicio_lectura: string | null;
  fecha_aceptacion: string | null;
  fecha_rechazo?: string | null;
  porcentaje_lectura: number;
  tiempo_lectura_seg: number;
  scroll_data?: Record<string, unknown>;
  texto_aceptacion?: string;
  motivo_rechazo?: string;
  ip_address?: string;
  user_agent?: string;
  empresa_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AsignarLecturaDTO {
  documento_id: number;
  /** Modo 1: usuarios individuales */
  usuario_ids?: number[];
  /** Modo 2: todos los usuarios con estos cargos */
  cargo_ids?: number[];
  /** Modo 3: todos los usuarios activos del tenant */
  aplica_a_todos?: boolean;
  fecha_limite?: string | null;
}

export interface RegistrarProgresoDTO {
  porcentaje_lectura: number;
  tiempo_lectura_seg: number;
  scroll_data: Record<string, unknown>;
}

export interface AceptacionResumen {
  total: number;
  pendientes: number;
  en_progreso: number;
  aceptados: number;
  rechazados: number;
  vencidos: number;
  promedio_tiempo: number | null;
  promedio_porcentaje: number | null;
}

export const ACEPTACION_ESTADO_LABELS: Record<AceptacionEstado, string> = {
  PENDIENTE: 'Pendiente',
  EN_PROGRESO: 'Leyendo',
  ACEPTADO: 'Aceptado',
  RECHAZADO: 'Rechazado',
  VENCIDO: 'Vencido',
};

export const ACEPTACION_ESTADO_COLORS: Record<AceptacionEstado, string> = {
  PENDIENTE: 'gray',
  EN_PROGRESO: 'info',
  ACEPTADO: 'success',
  RECHAZADO: 'danger',
  VENCIDO: 'warning',
};

// ==================== ANEXOS (Sprint 2 — Evidencias Adjuntas) ====================

export interface AnexoMeta {
  id: string;
  nombre: string;
  path: string;
  url: string;
  tipo_mime: string;
  tamaño: number;
  subido_por: number;
  subido_por_nombre?: string;
  fecha_subida: string;
}

// ==================== INGESTA EN LOTE (Sprint 2) ====================

export interface IngestarLoteDTO {
  archivos: File[];
  tipo_documento: number;
  clasificacion?: ClasificacionDocumento;
}

export interface IngestarLoteResult {
  creados: number;
  errores: Array<{ archivo: string; error: string }>;
  documentos_ids: number[];
}

// ==================== COBERTURA DOCUMENTAL (Sprint 3) ====================

export interface CoberturaDocumental {
  total_tipos: number;
  con_documentos: number;
  sin_documentos: number;
  cobertura_pct: number;
  detalle_por_tipo: Array<{
    tipo_codigo: string;
    tipo_nombre: string;
    total_documentos: number;
    vigentes: number;
    borradores: number;
    obsoletos: number;
  }>;
  workflows_sin_procedimiento: Array<{
    workflow_id: number;
    workflow_nombre: string;
  }>;
}

// ==================== FORMULA DE CÁLCULO (Sprint 4) ====================

export interface FormulaCalculo {
  expresion: string;
  campos: string[];
  auto?: boolean;
}

// ==================== GOOGLE DRIVE (Fase 7) ====================

export interface DriveExportResult {
  drive_file_id: string;
  web_view_link: string;
  filename: string;
}

export interface DriveExportLoteResult {
  exportados: number;
  omitidos: number;
  errores: Array<{ documento_id: number; codigo: string; error: string }>;
}

// ==================== BIBLIOTECA MAESTRA (Fase 8) ====================

export type CategoriaPlantilla =
  | 'PROCEDIMIENTO'
  | 'FORMATO'
  | 'MANUAL'
  | 'POLITICA'
  | 'INSTRUCTIVO';

export type IndustriaPlantilla =
  | 'GENERAL'
  | 'ALIMENTOS'
  | 'CONSTRUCCION'
  | 'MANUFACTURA'
  | 'SERVICIOS'
  | 'SALUD'
  | 'TECNOLOGIA';

export interface BibliotecaPlantilla {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo_documento_codigo: string;
  contenido_plantilla?: string;
  variables_disponibles?: string[];
  categoria: CategoriaPlantilla;
  categoria_display: string;
  industria: IndustriaPlantilla;
  industria_display: string;
  norma_iso_codigo: string;
  version: string;
  is_active: boolean;
  orden: number;
}

export const CATEGORIA_LABELS: Record<CategoriaPlantilla, string> = {
  PROCEDIMIENTO: 'Procedimiento',
  FORMATO: 'Formato',
  MANUAL: 'Manual',
  POLITICA: 'Política',
  INSTRUCTIVO: 'Instructivo',
};

export const INDUSTRIA_LABELS: Record<IndustriaPlantilla, string> = {
  GENERAL: 'General',
  ALIMENTOS: 'Alimentos',
  CONSTRUCCION: 'Construcción',
  MANUFACTURA: 'Manufactura',
  SERVICIOS: 'Servicios',
  SALUD: 'Salud',
  TECNOLOGIA: 'Tecnología',
};
