/**
 * Tipos TypeScript para el módulo de Dirección Estratégica
 * Sistema de Gestión Grasas y Huesos del Norte
 */

// ==================== ENUMS ====================

export type BSCPerspective = 'FINANCIERA' | 'CLIENTES' | 'PROCESOS' | 'APRENDIZAJE';

export type ISOStandard =
  | 'ISO_9001'
  | 'ISO_14001'
  | 'ISO_45001'
  | 'ISO_27001'
  | 'PESV'
  | 'SG_SST'
  | 'NINGUNO';

export type ObjectiveStatus = 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADO' | 'CANCELADO' | 'RETRASADO';

export type ModuleCategory = 'ESTRATEGICO' | 'MOTOR' | 'INTEGRAL' | 'MISIONAL' | 'APOYO' | 'INTELIGENCIA';

// Tipos de documento para consecutivos
export type DocumentType =
  // Operacionales
  | 'RECOLECCION'
  | 'RECEPCION'
  | 'LOTE'
  | 'DESPACHO'
  | 'FACTURA'
  | 'ORDEN_COMPRA'
  | 'REQUISICION'
  | 'REMISION'
  | 'COTIZACION'
  | 'ORDEN_TRABAJO'
  | 'ACTA_COMITE'
  // Sistema de Gestión
  | 'PROCEDIMIENTO'
  | 'INSTRUCTIVO'
  | 'FORMATO'
  | 'PROTOCOLO'
  | 'MANUAL'
  | 'PROGRAMA'
  | 'PLAN'
  // Calidad y SST
  | 'NO_CONFORMIDAD'
  | 'ACCION_CORRECTIVA'
  | 'ACCION_PREVENTIVA'
  | 'ACCION_MEJORA'
  | 'INCIDENTE'
  | 'ACCIDENTE'
  | 'INVESTIGACION'
  | 'AUDITORIA'
  | 'CAPACITACION'
  // Proveedores/Clientes
  | 'PROVEEDOR_MP'
  | 'PROVEEDOR_PS'
  | 'CLIENTE'
  | 'ECOALIADO'
  // Pruebas
  | 'PRUEBA_ACIDEZ'
  | 'ANALISIS_CALIDAD';

// Separadores disponibles
export type SeparatorType = '-' | '/' | '_' | '';

// Contextos (áreas/procesos)
export type ContextCode =
  | ''
  // Sistemas de Gestión
  | 'SST'
  | 'CAL'
  | 'AMB'
  | 'PESV'
  // Áreas Operativas
  | 'PROD'
  | 'LOG'
  | 'COM'
  | 'ADM'
  | 'FIN'
  | 'TH'
  | 'MTO'
  | 'TI';

export type PeriodType = 'ANUAL' | 'BIANUAL' | 'TRIANUAL' | 'QUINQUENAL';

// ==================== CATEGORIA DOCUMENTO ====================

/**
 * Categoría dinámica de documentos
 * Las categorías pueden ser creadas por el usuario o ser del sistema
 */
export interface CategoriaDocumento {
  id: number;
  code: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  is_system: boolean;
  is_active: boolean;
  orden: number;  // Backend usa 'orden' (español)
  count_tipos?: number;
  puede_eliminar?: {
    puede: boolean;
    motivo?: string | null;
  };
  created_at?: string;
  updated_at?: string;
}

export interface CreateCategoriaDocumentoDTO {
  code: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  orden?: number;  // Backend usa 'orden'
  is_active?: boolean;
}

export interface UpdateCategoriaDocumentoDTO {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  orden?: number;  // Backend usa 'orden'
  is_active?: boolean;
}

export interface CategoriaDocumentoFilters {
  is_system?: boolean;
  is_active?: boolean;
  search?: string;
}

// ==================== CORPORATE VALUE ====================

export interface CorporateValue {
  id: number;
  identity?: number;
  name: string;
  description: string;
  icon?: string | null;
  orden: number;  // Backend identidad/serializers.py usa 'orden'
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CreateCorporateValueDTO {
  identity?: number;
  name: string;
  description: string;
  icon?: string;
  orden?: number;
  is_active?: boolean;
}

export interface UpdateCorporateValueDTO {
  name?: string;
  description?: string;
  icon?: string;
  orden?: number;
  is_active?: boolean;
}

// ==================== CORPORATE IDENTITY ====================

export interface CorporateIdentity {
  id: number;
  mission: string;
  vision: string;
  integral_policy: string;
  policy_signed_by?: number | null;
  policy_signed_at?: string | null;
  policy_signature_hash?: string | null;
  is_signed: boolean;
  signed_by_name?: string | null;
  effective_date: string;
  version: string;
  is_active: boolean;
  values?: CorporateValue[];
  created_by?: number | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCorporateIdentityDTO {
  mission: string;
  vision: string;
  integral_policy: string;
  effective_date: string;
  version?: string;
  is_active?: boolean;
  values?: CreateCorporateValueDTO[];
}

export interface UpdateCorporateIdentityDTO {
  mission?: string;
  vision?: string;
  integral_policy?: string;
  effective_date?: string;
  version?: string;
  is_active?: boolean;
  values?: CreateCorporateValueDTO[];
}

// ==================== STRATEGIC PLAN ====================

export interface StrategicPlan {
  id: number;
  name: string;
  description?: string | null;
  period_type: PeriodType;
  period_type_display?: string;
  start_date: string;
  end_date: string;
  strategic_map_image?: string | null;
  strategic_map_description?: string | null;
  is_active: boolean;
  approved_by?: number | null;
  approved_by_name?: string | null;
  approved_at?: string | null;
  objectives_count?: number;
  progress?: number;
  bsc_summary?: Record<string, BSCSummaryItem>;
  created_by?: number | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BSCSummaryItem {
  label: string;
  total: number;
  completed: number;
  avg_progress: number;
}

export interface CreateStrategicPlanDTO {
  name: string;
  description?: string;
  period_type: PeriodType;
  start_date: string;
  end_date: string;
  strategic_map_description?: string;
  is_active?: boolean;
}

export interface UpdateStrategicPlanDTO {
  name?: string;
  description?: string;
  period_type?: PeriodType;
  start_date?: string;
  end_date?: string;
  strategic_map_description?: string;
  is_active?: boolean;
}

// ==================== STRATEGIC OBJECTIVE ====================

export interface StrategicObjective {
  id: number;
  plan: number;
  code: string;
  name: string;
  description?: string | null;
  bsc_perspective: BSCPerspective;
  bsc_perspective_display?: string;
  iso_standards: ISOStandard[];
  iso_standards_display?: string[];
  responsible?: number | null;
  responsible_name?: string | null;
  responsible_cargo?: number | null;
  responsible_cargo_name?: string | null;
  target_value?: number | null;
  current_value?: number | null;
  unit?: string | null;
  progress: number;
  status: ObjectiveStatus;
  status_display?: string;
  start_date?: string | null;
  due_date?: string | null;
  completed_at?: string | null;
  order: number;
  is_active: boolean;
  created_by?: number | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateStrategicObjectiveDTO {
  plan: number;
  code: string;
  name: string;
  description?: string;
  bsc_perspective: BSCPerspective;
  iso_standards?: ISOStandard[];
  responsible?: number;
  responsible_cargo?: number;
  target_value?: number;
  current_value?: number;
  unit?: string;
  start_date?: string;
  due_date?: string;
  order?: number;
  is_active?: boolean;
}

export interface UpdateStrategicObjectiveDTO {
  name?: string;
  description?: string;
  bsc_perspective?: BSCPerspective;
  iso_standards?: ISOStandard[];
  responsible?: number;
  responsible_cargo?: number;
  target_value?: number;
  current_value?: number;
  unit?: string;
  progress?: number;
  status?: ObjectiveStatus;
  start_date?: string;
  due_date?: string;
  order?: number;
  is_active?: boolean;
}

export interface UpdateProgressDTO {
  current_value: number;
}

// ==================== SYSTEM MODULE ====================

export interface SystemModule {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  category: ModuleCategory;
  category_display?: string;
  icon?: string | null;
  is_core: boolean;
  is_enabled: boolean;
  requires_license: boolean;
  license_expires_at?: string | null;
  dependencies_count?: number;
  dependents_count?: number;
  can_disable_info?: {
    can_disable: boolean;
    reason?: string | null;
  };
  order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSystemModuleDTO {
  code: string;
  name: string;
  description?: string;
  category: ModuleCategory;
  icon?: string;
  is_core?: boolean;
  is_enabled?: boolean;
  requires_license?: boolean;
  license_expires_at?: string;
  order?: number;
  dependency_ids?: number[];
}

export interface UpdateSystemModuleDTO {
  name?: string;
  description?: string;
  category?: ModuleCategory;
  icon?: string;
  is_enabled?: boolean;
  requires_license?: boolean;
  license_expires_at?: string;
  order?: number;
  dependency_ids?: number[];
}

export interface ToggleModuleDTO {
  enable: boolean;
}

// ==================== BRANDING CONFIG ====================

export interface BrandingConfig {
  id: number;
  company_name: string;
  company_short_name: string;
  company_slogan?: string | null;
  logo?: string | null;
  logo_white?: string | null;
  favicon?: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBrandingConfigDTO {
  company_name: string;
  company_short_name: string;
  company_slogan?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  is_active?: boolean;
}

export interface UpdateBrandingConfigDTO {
  company_name?: string;
  company_short_name?: string;
  company_slogan?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  is_active?: boolean;
}

// ==================== TIPO DOCUMENTO ====================

export interface TipoDocumento {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  categoria: number; // FK a CategoriaDocumento
  categoria_id?: number; // Alias para compatibilidad
  categoria_code?: string;
  categoria_name?: string;
  categoria_color?: string;
  categoria_icon?: string;
  category_display?: string; // Deprecated: usar categoria_name
  is_system: boolean;
  is_active: boolean;
  prefijo_sugerido?: string | null;
  order: number;
  puede_eliminar: {
    puede: boolean;
    motivo?: string | null;
  };
  tiene_consecutivo: boolean;
  created_at: string;
  created_by?: number | null;
  created_by_name?: string | null;
  updated_at: string;
}

export interface CreateTipoDocumentoDTO {
  code: string;
  name: string;
  description?: string;
  categoria: number; // ID de la categoría
  prefijo_sugerido?: string;
}

export interface UpdateTipoDocumentoDTO {
  name?: string;
  description?: string;
  categoria?: number; // ID de la categoría
  prefijo_sugerido?: string;
  is_active?: boolean;
  order?: number;
}

// ==================== CONSECUTIVO CONFIG ====================

/**
 * Modelo de ConsecutivoConfig simplificado - SIN áreas
 */
export interface ConsecutivoConfig {
  id: number;
  // Tipo de documento (FK al modelo TipoDocumento)
  tipo_documento: number;
  tipo_documento_code?: string;
  tipo_documento_name?: string;
  tipo_documento_categoria_id?: number; // ID de la categoría del tipo de documento
  tipo_documento_categoria_code?: string;
  tipo_documento_categoria_name?: string;
  tipo_documento_categoria_color?: string;
  tipo_documento_categoria_icon?: string;
  tipo_documento_category?: string; // Deprecated: para compatibilidad
  // Configuración del consecutivo
  prefix: string;
  suffix?: string | null;
  current_number: number;
  padding: number;
  include_year: boolean;
  include_month: boolean;
  include_day: boolean;
  separator: SeparatorType;
  separator_display?: string;
  // Reinicio
  reset_yearly: boolean;
  reset_monthly: boolean;
  last_reset_date?: string | null;
  // Campos calculados
  ejemplo_formato?: string;
  ejemplo?: string;
  // Estado
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateConsecutivoConfigDTO {
  tipo_documento: number;
  prefix: string;
  suffix?: string;
  padding?: number;
  include_year?: boolean;
  include_month?: boolean;
  include_day?: boolean;
  separator?: SeparatorType;
  reset_yearly?: boolean;
  reset_monthly?: boolean;
}

export interface UpdateConsecutivoConfigDTO {
  prefix?: string;
  suffix?: string;
  current_number?: number;
  padding?: number;
  include_year?: boolean;
  include_month?: boolean;
  include_day?: boolean;
  separator?: SeparatorType;
  reset_yearly?: boolean;
  reset_monthly?: boolean;
  is_active?: boolean;
}

export interface GenerateConsecutivoDTO {
  tipo_documento_code: string;
  area_code?: string;
}

export interface GenerateConsecutivoResponse {
  consecutivo: string;
  current_number: number;
}

// Opciones para selects (value puede ser string o number según el endpoint)
export interface SelectOption {
  value: string | number;
  label: string;
}

// ==================== STRATEGIC STATS ====================

export interface StrategicStats {
  // 1. Completitud del Sistema (% de configuracion completada)
  system_completeness: number; // 0-100%
  completeness_details: {
    has_identity: boolean;
    has_organization: boolean;
    has_plan: boolean;
    has_config: boolean;
  };

  // 2. Objetivos Estrategicos
  total_objectives: number;
  completed_objectives: number;
  in_progress_objectives: number;
  at_risk_objectives: number; // objetivos con progreso <50% y fecha limite cercana
  avg_progress: number;
  active_plan_name?: string | null;

  // 3. Control de Acceso (RBAC)
  total_users: number;
  users_with_roles: number;
  users_without_roles: number;
  total_roles: number;
  total_cargos: number;

  // 4. Identidad Corporativa
  has_active_identity: boolean;
  identity_is_signed: boolean;
  identity_version: number;
  values_count: number;
  policy_pending_signature: boolean;

  // Configuracion del sistema
  enabled_modules: number;
  total_modules: number;
}

// ==================== PAGINATION ====================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ==================== FILTERS ====================

export interface ObjectiveFilters {
  plan?: number;
  bsc_perspective?: BSCPerspective;
  status?: ObjectiveStatus;
  responsible?: number;
  include_inactive?: boolean;
  search?: string;
}

export interface ModuleFilters {
  category?: ModuleCategory;
  is_enabled?: boolean;
  is_core?: boolean;
  search?: string;
}

export interface ConsecutivoFilters {
  document_type?: DocumentType;
  is_active?: boolean;
}

export interface TipoDocumentoFilters {
  categoria?: number; // ID de la categoría
  is_system?: boolean;
  is_active?: boolean;
  search?: string;
}

// ==================== TENANT CONFIG ====================

export interface TenantConfig {
  id: number;
  // Modulos habilitados (codigos)
  enabled_modules: string[];
  // Feature flags
  features: TenantFeatures;
  // Configuraciones de UI
  ui_settings: TenantUISettings;
  // Metadata
  tenant_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenantFeatures {
  // Modulos principales
  enable_econorte: boolean;
  enable_sst: boolean;
  enable_pesv: boolean;
  enable_iso: boolean;
  enable_cadena_valor: boolean;
  enable_inteligencia: boolean;
  // Sub-features
  enable_certificados: boolean;
  enable_multiples_politicas: boolean;
  enable_auditoria: boolean;
}

export interface TenantUISettings {
  // Sidebar
  sidebar_collapsed_default: boolean;
  show_module_badges: boolean;
  // Temas
  dark_mode_enabled: boolean;
  custom_theme_enabled: boolean;
}

export interface UpdateTenantFeaturesDTO {
  enable_econorte?: boolean;
  enable_sst?: boolean;
  enable_pesv?: boolean;
  enable_iso?: boolean;
  enable_cadena_valor?: boolean;
  enable_inteligencia?: boolean;
  enable_certificados?: boolean;
  enable_multiples_politicas?: boolean;
  enable_auditoria?: boolean;
}

export interface UpdateTenantUISettingsDTO {
  sidebar_collapsed_default?: boolean;
  show_module_badges?: boolean;
  dark_mode_enabled?: boolean;
  custom_theme_enabled?: boolean;
}

// ==================== SEDE EMPRESA ====================

export type TipoSede =
  | 'SEDE_PRINCIPAL'
  | 'SEDE'
  | 'SUCURSAL'
  | 'PLANTA'
  | 'CENTRO_ACOPIO'
  | 'ALMACEN'
  | 'PUNTO_VENTA'
  | 'BODEGA'
  | 'OTRO';

export interface SedeEmpresa {
  id: number;
  // Identificación
  codigo: string;
  nombre: string;
  tipo_sede: TipoSede;
  tipo_sede_display?: string;
  descripcion?: string | null;
  // Ubicación
  direccion: string;
  direccion_completa?: string;
  ciudad: string;
  departamento: string;
  departamento_display?: string;
  codigo_postal?: string | null;
  // Geolocalización
  latitud?: number | null;
  longitud?: number | null;
  tiene_geolocalizacion?: boolean;
  // Administración
  responsable?: number | null;
  responsable_name?: string | null;
  telefono?: string | null;
  email?: string | null;
  // Control
  es_sede_principal: boolean;
  fecha_apertura?: string | null;
  fecha_cierre?: string | null;
  capacidad_almacenamiento_kg?: number | null;
  // Auditoría
  is_active: boolean;
  is_deleted?: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number | null;
  created_by_name?: string | null;
  deleted_at?: string | null;
}

export interface SedeEmpresaList {
  id: number;
  codigo: string;
  nombre: string;
  tipo_sede: TipoSede;
  tipo_sede_display?: string;
  ciudad: string;
  departamento_display?: string;
  responsable?: number | null;
  responsable_name?: string | null;
  es_sede_principal: boolean;
  is_active: boolean;
}

export interface CreateSedeEmpresaDTO {
  codigo: string;
  nombre: string;
  tipo_sede: TipoSede;
  descripcion?: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  codigo_postal?: string;
  latitud?: number;
  longitud?: number;
  responsable?: number;
  telefono?: string;
  email?: string;
  es_sede_principal?: boolean;
  fecha_apertura?: string;
  fecha_cierre?: string;
  capacidad_almacenamiento_kg?: number;
  is_active?: boolean;
}

export interface UpdateSedeEmpresaDTO {
  codigo?: string;
  nombre?: string;
  tipo_sede?: TipoSede;
  descripcion?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  codigo_postal?: string;
  latitud?: number | null;
  longitud?: number | null;
  responsable?: number | null;
  telefono?: string;
  email?: string;
  es_sede_principal?: boolean;
  fecha_apertura?: string | null;
  fecha_cierre?: string | null;
  capacidad_almacenamiento_kg?: number | null;
  is_active?: boolean;
}

export interface SedeFilters {
  tipo_sede?: TipoSede;
  departamento?: string;
  is_active?: boolean;
  es_sede_principal?: boolean;
  search?: string;
  include_deleted?: boolean;
}

// ==================== INTEGRACIONES EXTERNAS ====================

export type TipoServicio =
  | 'EMAIL'
  | 'FACTURACION'
  | 'SMS'
  | 'WHATSAPP'
  | 'MAPAS'
  | 'ALMACENAMIENTO'
  | 'BI'
  | 'PAGOS'
  | 'ERP'
  | 'FIRMA_DIGITAL';

export type Proveedor =
  // Email
  | 'GMAIL'
  | 'OUTLOOK'
  | 'SMTP_CUSTOM'
  // SMS
  | 'TWILIO'
  | 'MESSAGEBIRD'
  // WhatsApp
  | 'WHATSAPP_BUSINESS'
  // Facturación
  | 'DIAN'
  // Almacenamiento
  | 'GOOGLE_DRIVE'
  | 'AWS_S3'
  | 'AZURE_BLOB'
  | 'GCS'
  // BI
  | 'GOOGLE_LOOKER'
  | 'GOOGLE_SHEETS'
  // Pagos
  | 'PSE'
  | 'WOMPI'
  | 'PAYU'
  | 'MERCADOPAGO'
  // ERP
  | 'SIIGO'
  | 'ALEGRA'
  | 'WORLD_OFFICE'
  | 'SAP'
  // Firma Digital
  | 'CERTICAMARA'
  | 'GSE'
  | 'ANDES_SCD'
  // Mapas
  | 'GOOGLE_MAPS'
  | 'OSM'
  // Transporte
  | 'RUNT'
  | 'MINTRANSPORTE';

export type MetodoAutenticacion = 'API_KEY' | 'OAUTH2' | 'BASIC_AUTH' | 'SERVICE_ACCOUNT' | 'CERTIFICATE';

export type Ambiente = 'PRODUCCION' | 'SANDBOX';

export type StatusIndicator = 'success' | 'warning' | 'danger';

export interface IntegracionExterna {
  id: number;
  // Identificación
  nombre: string;
  descripcion?: string | null;
  tipo_servicio: TipoServicio;
  tipo_servicio_display?: string;
  proveedor: Proveedor;
  proveedor_display?: string;
  // Configuración
  ambiente: Ambiente;
  ambiente_display?: string;
  metodo_autenticacion: MetodoAutenticacion;
  metodo_autenticacion_display?: string;
  url_base: string;
  // Credenciales (siempre masked en respuestas)
  credenciales_masked?: Record<string, string>;
  // Configuración adicional
  configuracion_adicional?: Record<string, unknown> | null;
  timeout_segundos: number;
  reintentos_max: number;
  // Estado y salud
  is_active: boolean;
  is_healthy: boolean;
  status_indicator: StatusIndicator;
  ultima_verificacion?: string | null;
  ultimo_error?: string | null;
  // Metadatos
  created_at: string;
  updated_at: string;
  created_by?: number | null;
  created_by_name?: string | null;
  // Estadísticas
  total_llamadas?: number;
  llamadas_exitosas?: number;
  llamadas_fallidas?: number;
  tasa_exito?: number;
}

export interface IntegracionExternaList {
  id: number;
  nombre: string;
  tipo_servicio: TipoServicio;
  tipo_servicio_display?: string;
  proveedor: Proveedor;
  proveedor_display?: string;
  ambiente: Ambiente;
  ambiente_display?: string;
  is_active: boolean;
  is_healthy: boolean;
  status_indicator: StatusIndicator;
  ultima_verificacion?: string | null;
  tasa_exito?: number;
}

export interface CreateIntegracionDTO {
  nombre: string;
  descripcion?: string;
  tipo_servicio: TipoServicio;
  proveedor: Proveedor;
  ambiente: Ambiente;
  metodo_autenticacion: MetodoAutenticacion;
  url_base: string;
  credenciales: Record<string, string>;
  configuracion_adicional?: Record<string, unknown>;
  timeout_segundos?: number;
  reintentos_max?: number;
  is_active?: boolean;
}

export interface UpdateIntegracionDTO {
  nombre?: string;
  descripcion?: string;
  ambiente?: Ambiente;
  url_base?: string;
  configuracion_adicional?: Record<string, unknown>;
  timeout_segundos?: number;
  reintentos_max?: number;
  is_active?: boolean;
}

export interface UpdateCredencialesDTO {
  credenciales: Record<string, string>;
}

export interface IntegracionFilters {
  tipo_servicio?: TipoServicio;
  proveedor?: Proveedor;
  ambiente?: Ambiente;
  is_active?: boolean;
  is_healthy?: boolean;
  search?: string;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  response_time_ms?: number;
  details?: Record<string, unknown>;
  error?: string | null;
}

export interface IntegracionLog {
  id: number;
  integracion: number;
  integracion_nombre?: string;
  metodo: string;
  endpoint: string;
  payload_size_bytes?: number;
  response_status?: number;
  response_time_ms?: number;
  success: boolean;
  error_message?: string | null;
  created_at: string;
}

export interface IntegracionLogsFilters {
  integracion?: number;
  success?: boolean;
  fecha_desde?: string;
  fecha_hasta?: string;
  limit?: number;
}

// ==================== SEMANA 4: PLANEACIÓN ESTRATÉGICA ====================

// --- Tipos de Frecuencia y Tendencia para KPIs ---
export type FrequencyType =
  | 'DIARIA'
  | 'SEMANAL'
  | 'QUINCENAL'
  | 'MENSUAL'
  | 'BIMESTRAL'
  | 'TRIMESTRAL'
  | 'SEMESTRAL'
  | 'ANUAL';

export type TrendType = 'MAYOR_MEJOR' | 'MENOR_MEJOR' | 'EN_RANGO';

export type SemaforoStatus = 'VERDE' | 'AMARILLO' | 'ROJO' | 'SIN_DATOS';

// --- Tipos de Gestión de Cambio ---
export type ChangeType =
  | 'ESTRATEGICO'
  | 'ORGANIZACIONAL'
  | 'PROCESO'
  | 'TECNOLOGICO'
  | 'CULTURAL'
  | 'NORMATIVO'
  | 'OTRO';

export type ChangePriority = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export type ChangeStatus =
  | 'IDENTIFICADO'
  | 'ANALISIS'
  | 'PLANIFICADO'
  | 'EN_EJECUCION'
  | 'COMPLETADO'
  | 'CANCELADO';

// --- Tipos de Política ---
export type PoliticaStatus = 'BORRADOR' | 'EN_REVISION' | 'VIGENTE' | 'OBSOLETO';

// ==================== MAPA ESTRATÉGICO ====================

export interface MapaEstrategico {
  id: number;
  plan: number;
  plan_name?: string;
  name: string;
  description?: string | null;
  canvas_data?: Record<string, unknown> | null;
  image?: string | null;
  version: number;
  is_active: boolean;
  relaciones?: CausaEfecto[];
  relaciones_count?: number;
  created_by?: number | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CausaEfecto {
  id: number;
  mapa: number;
  source_objective: number;
  source_objective_code?: string;
  source_objective_name?: string;
  target_objective: number;
  target_objective_code?: string;
  target_objective_name?: string;
  description?: string | null;
  weight: number;
  created_at: string;
  updated_at: string;
}

export interface CreateMapaEstrategicoDTO {
  plan: number;
  name: string;
  description?: string;
  canvas_data?: Record<string, unknown>;
  version?: number;
  is_active?: boolean;
}

export interface UpdateMapaEstrategicoDTO {
  name?: string;
  description?: string;
  canvas_data?: Record<string, unknown>;
  image?: string;
  version?: number;
  is_active?: boolean;
}

export interface CreateCausaEfectoDTO {
  mapa: number;
  source_objective: number;
  target_objective: number;
  description?: string;
  weight?: number;
}

export interface UpdateCausaEfectoDTO {
  description?: string;
  weight?: number;
}

// ==================== KPI Y MEDICIONES ====================

export interface MedicionKPI {
  id: number;
  kpi: number;
  period: string;
  value: string;
  notes?: string | null;
  evidence_file?: string | null;
  measured_by?: number | null;
  measured_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface KPIObjetivo {
  id: number;
  objective: number;
  objective_code?: string;
  objective_name?: string;
  name: string;
  description?: string | null;
  formula?: string | null;
  unit: string;
  frequency: FrequencyType;
  frequency_display?: string;
  trend_type: TrendType;
  trend_type_display?: string;
  target_value: string;
  warning_threshold?: string | null;
  critical_threshold?: string | null;
  min_value?: string | null;
  max_value?: string | null;
  data_source?: string | null;
  responsible?: number | null;
  responsible_name?: string | null;
  responsible_cargo?: number | null;
  responsible_cargo_name?: string | null;
  last_value?: string | null;
  last_measurement_date?: string | null;
  status_semaforo: SemaforoStatus;
  measurements_count?: number;
  recent_measurements?: MedicionKPI[];
  is_active: boolean;
  created_by?: number | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateKPIObjetivoDTO {
  objective: number;
  name: string;
  description?: string;
  formula?: string;
  unit: string;
  frequency: FrequencyType;
  trend_type: TrendType;
  target_value: string;
  warning_threshold?: string;
  critical_threshold?: string;
  min_value?: string;
  max_value?: string;
  data_source?: string;
  responsible?: number;
  responsible_cargo?: number;
  is_active?: boolean;
}

export interface UpdateKPIObjetivoDTO {
  name?: string;
  description?: string;
  formula?: string;
  unit?: string;
  frequency?: FrequencyType;
  trend_type?: TrendType;
  target_value?: string;
  warning_threshold?: string;
  critical_threshold?: string;
  min_value?: string;
  max_value?: string;
  data_source?: string;
  responsible?: number;
  responsible_cargo?: number;
  is_active?: boolean;
}

export interface AddMeasurementDTO {
  value: string;
  period?: string;
  notes?: string;
  evidence_file?: File;
}

export interface KPIFilters {
  objective?: number;
  frequency?: FrequencyType;
  trend_type?: TrendType;
  status_semaforo?: SemaforoStatus;
  responsible?: number;
  is_active?: boolean;
  search?: string;
}

// ==================== GESTIÓN DEL CAMBIO ====================

export interface GestionCambio {
  id: number;
  code: string;
  title: string;
  description?: string | null;
  change_type: ChangeType;
  change_type_display?: string;
  priority: ChangePriority;
  priority_display?: string;
  status: ChangeStatus;
  status_display?: string;
  impact_analysis?: string | null;
  risk_assessment?: string | null;
  action_plan?: string | null;
  resources_required?: string | null;
  responsible?: number | null;
  responsible_name?: string | null;
  responsible_cargo?: number | null;
  responsible_cargo_name?: string | null;
  start_date?: string | null;
  due_date?: string | null;
  completed_date?: string | null;
  related_objectives?: number[];
  related_objectives_details?: Array<{
    id: number;
    code: string;
    name: string;
  }>;
  lessons_learned?: string | null;
  is_active: boolean;
  created_by?: number | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateGestionCambioDTO {
  code: string;
  title: string;
  description?: string;
  change_type: ChangeType;
  priority: ChangePriority;
  status?: ChangeStatus;
  impact_analysis?: string;
  risk_assessment?: string;
  action_plan?: string;
  resources_required?: string;
  responsible?: number;
  responsible_cargo?: number;
  start_date?: string;
  due_date?: string;
  related_objectives?: number[];
  is_active?: boolean;
}

export interface UpdateGestionCambioDTO {
  title?: string;
  description?: string;
  change_type?: ChangeType;
  priority?: ChangePriority;
  status?: ChangeStatus;
  impact_analysis?: string;
  risk_assessment?: string;
  action_plan?: string;
  resources_required?: string;
  responsible?: number;
  responsible_cargo?: number;
  start_date?: string;
  due_date?: string;
  related_objectives?: number[];
  lessons_learned?: string;
  is_active?: boolean;
}

export interface TransitionStatusDTO {
  new_status: ChangeStatus;
}

export interface GestionCambioFilters {
  change_type?: ChangeType;
  priority?: ChangePriority;
  status?: ChangeStatus;
  responsible?: number;
  is_active?: boolean;
  search?: string;
}

// ==================== ALCANCE DEL SISTEMA ====================

export interface AlcanceSistema {
  id: number;
  identity: number;
  iso_standard: ISOStandard;
  iso_standard_display?: string;
  scope: string;
  exclusions?: string | null;
  justification?: string | null;
  is_certified: boolean;
  certification_body?: string | null;
  certificate_number?: string | null;
  certification_date?: string | null;
  expiry_date?: string | null;
  is_certificate_valid?: boolean;
  days_until_expiry?: number | null;
  is_active: boolean;
  created_by?: number | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAlcanceSistemaDTO {
  identity: number;
  iso_standard: ISOStandard;
  scope: string;
  exclusions?: string;
  justification?: string;
  is_certified?: boolean;
  certification_body?: string;
  certificate_number?: string;
  certification_date?: string;
  expiry_date?: string;
  is_active?: boolean;
}

export interface UpdateAlcanceSistemaDTO {
  scope?: string;
  exclusions?: string;
  justification?: string;
  is_certified?: boolean;
  certification_body?: string;
  certificate_number?: string;
  certification_date?: string;
  expiry_date?: string;
  is_active?: boolean;
}

export interface AlcanceSistemaFilters {
  identity?: number;
  iso_standard?: ISOStandard;
  is_certified?: boolean;
  is_active?: boolean;
}

// ==================== POLÍTICA INTEGRAL ====================

export interface PoliticaIntegral {
  id: number;
  identity: number;
  version: string;
  content: string;
  effective_date: string;
  status: PoliticaStatus;
  status_display?: string;
  is_signed: boolean;
  signed_by?: number | null;
  signed_by_name?: string | null;
  signed_at?: string | null;
  signature_hash?: string | null;
  applicable_standards: ISOStandard[];
  applicable_standards_display?: string[];
  review_date?: string | null;
  is_active: boolean;
  created_by?: number | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePoliticaIntegralDTO {
  identity: number;
  version: string;
  content: string;
  effective_date: string;
  status?: PoliticaStatus;
  applicable_standards?: ISOStandard[];
  review_date?: string;
  is_active?: boolean;
}

export interface UpdatePoliticaIntegralDTO {
  version?: string;
  content?: string;
  effective_date?: string;
  status?: PoliticaStatus;
  applicable_standards?: ISOStandard[];
  review_date?: string;
  is_active?: boolean;
}

export interface PoliticaIntegralFilters {
  identity?: number;
  status?: PoliticaStatus;
  is_signed?: boolean;
  is_active?: boolean;
}

// ==================== POLÍTICA ESPECÍFICA ====================

export interface PoliticaEspecifica {
  id: number;
  identity: number;
  iso_standard: ISOStandard;
  iso_standard_display?: string;
  name: string;
  version: string;
  content: string;
  objectives?: string | null;
  commitments?: string | null;
  effective_date: string;
  status: PoliticaStatus;
  status_display?: string;
  is_signed: boolean;
  signed_by?: number | null;
  signed_by_name?: string | null;
  signed_at?: string | null;
  signature_hash?: string | null;
  review_date?: string | null;
  is_active: boolean;
  created_by?: number | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePoliticaEspecificaDTO {
  identity: number;
  iso_standard: ISOStandard;
  name: string;
  version: string;
  content: string;
  objectives?: string;
  commitments?: string;
  effective_date: string;
  status?: PoliticaStatus;
  review_date?: string;
  is_active?: boolean;
}

export interface UpdatePoliticaEspecificaDTO {
  name?: string;
  version?: string;
  content?: string;
  objectives?: string;
  commitments?: string;
  effective_date?: string;
  status?: PoliticaStatus;
  review_date?: string;
  is_active?: boolean;
}

export interface PoliticaEspecificaFilters {
  identity?: number;
  iso_standard?: ISOStandard;
  status?: PoliticaStatus;
  is_signed?: boolean;
  is_active?: boolean;
}


// ==================== REVISIÓN POR LA DIRECCIÓN ====================

export type EstadoRevision = 'PROGRAMADA' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA';

export type EstadoCompromiso = 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADO' | 'VENCIDO' | 'CANCELADO';

export type PrioridadCompromiso = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export interface RevisionDireccion {
  id: number;
  codigo: string;
  fecha_programada: string;
  fecha_realizada?: string | null;
  estado: EstadoRevision;
  estado_display?: string;
  asistentes?: number[];
  asistentes_nombres?: string[];
  temas_agenda?: string | null;
  puntos_tratados?: string | null;
  decisiones_tomadas?: string | null;
  recursos_necesarios?: string | null;
  acta_file?: string | null;
  acta_firmada?: boolean;
  is_active: boolean;
  compromisos_count?: number;
  compromisos_pendientes?: number;
  compromisos_vencidos?: number;
  created_by?: number | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompromisoRevision {
  id: number;
  revision: number;
  revision_codigo?: string;
  codigo: string;
  descripcion: string;
  responsable: number;
  responsable_name?: string;
  responsable_cargo?: number | null;
  responsable_cargo_name?: string | null;
  fecha_compromiso: string;
  fecha_limite: string;
  fecha_completado?: string | null;
  estado: EstadoCompromiso;
  estado_display?: string;
  prioridad: PrioridadCompromiso;
  prioridad_display?: string;
  observaciones?: string | null;
  evidencia_file?: string | null;
  dias_vencimiento?: number | null;
  esta_vencido?: boolean;
  related_objectives?: number[];
  related_objectives_details?: Array<{
    id: number;
    code: string;
    name: string;
  }>;
  is_active: boolean;
  created_by?: number | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRevisionDireccionDTO {
  codigo: string;
  fecha_programada: string;
  estado?: EstadoRevision;
  asistentes?: number[];
  temas_agenda?: string;
  is_active?: boolean;
}

export interface UpdateRevisionDireccionDTO {
  codigo?: string;
  fecha_programada?: string;
  fecha_realizada?: string;
  estado?: EstadoRevision;
  asistentes?: number[];
  temas_agenda?: string;
  puntos_tratados?: string;
  decisiones_tomadas?: string;
  recursos_necesarios?: string;
  acta_firmada?: boolean;
  is_active?: boolean;
}

export interface CreateCompromisoRevisionDTO {
  revision: number;
  codigo: string;
  descripcion: string;
  responsable: number;
  responsable_cargo?: number;
  fecha_compromiso: string;
  fecha_limite: string;
  prioridad: PrioridadCompromiso;
  observaciones?: string;
  related_objectives?: number[];
  is_active?: boolean;
}

export interface UpdateCompromisoRevisionDTO {
  descripcion?: string;
  responsable?: number;
  responsable_cargo?: number;
  fecha_limite?: string;
  fecha_completado?: string;
  estado?: EstadoCompromiso;
  prioridad?: PrioridadCompromiso;
  observaciones?: string;
  related_objectives?: number[];
  is_active?: boolean;
}

export interface RevisionDireccionFilters {
  estado?: EstadoRevision;
  fecha_desde?: string;
  fecha_hasta?: string;
  is_active?: boolean;
  search?: string;
}

export interface CompromisoRevisionFilters {
  revision?: number;
  estado?: EstadoCompromiso;
  prioridad?: PrioridadCompromiso;
  responsable?: number;
  esta_vencido?: boolean;
  fecha_desde?: string;
  fecha_hasta?: string;
  is_active?: boolean;
  search?: string;
}

export interface CompromisosDashboardStats {
  total_compromisos: number;
  compromisos_pendientes: number;
  compromisos_en_progreso: number;
  compromisos_completados: number;
  compromisos_vencidos: number;
  compromisos_proximos_vencer: number;
  tasa_cumplimiento: number;
  promedio_dias_cierre: number;
  compromisos_por_responsable: Array<{
    responsable_id: number;
    responsable_nombre: string;
    total: number;
    pendientes: number;
    completados: number;
    vencidos: number;
    tasa_cumplimiento: number;
  }>;
  compromisos_por_prioridad: {
    critica: number;
    alta: number;
    media: number;
    baja: number;
  };
  tendencia_mensual?: Array<{
    mes: string;
    creados: number;
    completados: number;
    vencidos: number;
  }>;
}
