/**
 * Tipos TypeScript para el módulo de Dirección Estratégica
 * Sistema de Gestión StrateKaz
 */

import { PaginatedResponse } from '@/types';

// Re-export para uso en strategicApi.ts
export type { PaginatedResponse };

// ==================== ENUMS ====================

export type BSCPerspective = 'FINANCIERA' | 'CLIENTES' | 'PROCESOS' | 'APRENDIZAJE';

/**
 * Normas y Sistemas de Gestión aplicables
 *
 * Incluye normas ISO internacionales, sistemas colombianos
 * y otras normativas aplicables a la organización:
 *
 * - ISO 9001:2015 (Sistema de Gestión de Calidad)
 * - ISO 14001:2015 (Sistema de Gestión Ambiental)
 * - ISO 45001:2018 (Sistema de Gestión de SST)
 * - ISO 27001:2013 (Seguridad de la Información)
 * - PESV (Plan Estratégico de Seguridad Vial - Resolución 40595/2022)
 * - SG-SST (Sistema de Gestión de Seguridad y Salud en el Trabajo - Decreto 1072/2015)
 */
export type ISOStandard =
  | 'ISO_9001'
  | 'ISO_14001'
  | 'ISO_45001'
  | 'ISO_27001'
  | 'PESV'
  | 'SG_SST'
  | 'NINGUNO';

export type ObjectiveStatus =
  | 'PENDIENTE'
  | 'EN_PROGRESO'
  | 'COMPLETADO'
  | 'CANCELADO'
  | 'RETRASADO';

export type ModuleCategory =
  | 'ESTRATEGICO'
  | 'MOTOR'
  | 'INTEGRAL'
  | 'MISIONAL'
  | 'APOYO'
  | 'INTELIGENCIA';

export type PeriodType = 'ANUAL' | 'BIANUAL' | 'TRIANUAL' | 'QUINQUENAL';

// ==================== CORPORATE VALUE ====================

export interface CorporateValue {
  id: number;
  identity?: number;
  name: string;
  description: string;
  icon?: string | null;
  orden: number; // Backend identidad/serializers.py usa 'orden'
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

// ==================== PROCESO/AREA PARA ALCANCE ====================

/**
 * Área/Proceso para el selector de Procesos Cubiertos
 * Usado en CorporateIdentity.procesos_cubiertos
 */
export interface ProcesoArea {
  id: number;
  code: string;
  name: string;
  full_path: string;  // "Gerencia > Operaciones > Logística"
  level: number;      // Nivel de profundidad en jerarquía
  icon?: string;
  color?: string;
}

// ==================== CORPORATE IDENTITY ====================

/**
 * Identidad Corporativa - Misión y Visión
 *
 * v4.0: Las políticas integrales se gestionan como categoría INTEGRAL
 * dentro del sistema unificado de PoliticaEspecifica.
 *
 * v4.1: Campos de alcance del sistema integrado de gestión (SIG).
 * El toggle declara_alcance controla la visibilidad de la sección.
 *
 * v4.2: Campo procesos_cubiertos (ManyToMany con Area) para selección dinámica.
 */
export interface CorporateIdentity {
  id: number;
  mission: string;
  vision: string;
  effective_date: string;
  version: string;
  is_active: boolean;
  values?: CorporateValue[];
  // Campos de alcance del SIG (v4.1)
  declara_alcance: boolean;
  alcance_general?: string | null;
  alcance_geografico?: string | null;
  alcance_procesos?: string | null;  // LEGACY: texto libre
  alcance_exclusiones?: string | null;
  // Procesos cubiertos - ManyToMany con Area (v4.2)
  procesos_cubiertos?: ProcesoArea[];
  // Contadores
  values_count?: number;
  alcances_count?: number;
  politicas_count?: number;
  // Auditoría
  created_by?: number | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCorporateIdentityDTO {
  mission: string;
  vision: string;
  effective_date: string;
  version?: string;
  is_active?: boolean;
  // Campos de alcance del SIG (v4.1)
  declara_alcance?: boolean;
  alcance_general?: string;
  alcance_geografico?: string;
  alcance_procesos?: string;  // LEGACY: texto libre
  alcance_exclusiones?: string;
  // Procesos cubiertos - IDs de áreas (v4.2)
  procesos_cubiertos_ids?: number[];
}

export interface UpdateCorporateIdentityDTO {
  mission?: string;
  vision?: string;
  effective_date?: string;
  version?: string;
  is_active?: boolean;
  // Campos de alcance del SIG (v4.1)
  declara_alcance?: boolean;
  alcance_general?: string;
  alcance_geografico?: string;
  alcance_procesos?: string;  // LEGACY: texto libre
  alcance_exclusiones?: string;
  // Procesos cubiertos - IDs de áreas (v4.2)
  procesos_cubiertos_ids?: number[];
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

/** Norma ISO vinculada a un objetivo (detalle) */
export interface NormaISODetail {
  id: number;
  code: string;
  short_name: string | null;
  name: string;
  icon: string | null;
  color: string | null;
}

export interface StrategicObjective {
  id: number;
  plan: number;
  code: string;
  name: string;
  description?: string | null;
  bsc_perspective: BSCPerspective;
  bsc_perspective_display?: string;
  /** @deprecated Use normas_iso instead */
  iso_standards?: ISOStandard[];
  iso_standards_display?: string[];
  /** IDs de normas ISO vinculadas (ManyToMany) */
  normas_iso?: number[];
  /** Detalles de normas ISO vinculadas */
  normas_iso_detail?: NormaISODetail[];
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
  /** @deprecated Use normas_iso_ids instead */
  iso_standards?: ISOStandard[];
  /** IDs de normas ISO a vincular (ManyToMany) */
  normas_iso_ids?: number[];
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
  /** @deprecated Use normas_iso_ids instead */
  iso_standards?: ISOStandard[];
  /** IDs de normas ISO a vincular (ManyToMany) */
  normas_iso_ids?: number[];
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

/**
 * Configuración de Branding - FUENTE ÚNICA DE VERDAD
 *
 * Consolidado desde EmpresaConfig para eliminar redundancias.
 * Incluye: logos, colores, PWA, gradientes para presentaciones.
 */
export interface BrandingConfig {
  id: number;
  company_name: string;
  company_short_name: string;
  company_slogan?: string | null;

  // Logos (3 variantes para diferentes contextos)
  logo?: string | null;
  logo_white?: string | null;
  logo_dark?: string | null;
  favicon?: string | null;
  login_background?: string | null;

  // Colores principales
  primary_color: string;
  secondary_color: string;
  accent_color: string;

  // Colores de interfaz (consolidados desde EmpresaConfig)
  sidebar_color?: string | null;
  background_color?: string | null;
  showcase_background?: string | null;

  // Gradientes para presentaciones (consolidados desde EmpresaConfig)
  gradient_mission?: string | null;
  gradient_vision?: string | null;
  gradient_policy?: string | null;
  gradient_values?: string[] | null;

  // Versión app
  app_version: string;

  // Campos PWA
  pwa_name?: string | null;
  pwa_short_name?: string | null;
  pwa_description?: string | null;
  pwa_theme_color?: string | null;
  pwa_background_color?: string | null;
  pwa_icon_192?: string | null;
  pwa_icon_512?: string | null;
  pwa_icon_maskable?: string | null;

  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBrandingConfigDTO {
  company_name: string;
  company_short_name: string;
  company_slogan?: string;

  // Logos
  logo?: File;
  logo_white?: File;
  logo_dark?: File;
  favicon?: File;
  login_background?: File;

  // Colores principales
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;

  // Colores de interfaz
  sidebar_color?: string;
  background_color?: string;
  showcase_background?: string;

  // Gradientes
  gradient_mission?: string;
  gradient_vision?: string;
  gradient_policy?: string;
  gradient_values?: string[];

  // Campos PWA
  pwa_name?: string;
  pwa_short_name?: string;
  pwa_description?: string;
  pwa_theme_color?: string;
  pwa_background_color?: string;
  pwa_icon_192?: File;
  pwa_icon_512?: File;
  pwa_icon_maskable?: File;
}

export interface UpdateBrandingConfigDTO {
  company_name?: string;
  company_short_name?: string;
  company_slogan?: string;

  // Logos
  logo?: File;
  logo_white?: File;
  logo_dark?: File;
  favicon?: File;
  login_background?: File;

  // Clear flags para logos
  logo_clear?: boolean;
  logo_white_clear?: boolean;
  logo_dark_clear?: boolean;
  favicon_clear?: boolean;
  login_background_clear?: boolean;

  // Colores principales
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;

  // Colores de interfaz
  sidebar_color?: string;
  background_color?: string;
  showcase_background?: string;

  // Gradientes
  gradient_mission?: string;
  gradient_vision?: string;
  gradient_policy?: string;
  gradient_values?: string[];

  // Campos PWA
  pwa_name?: string;
  pwa_short_name?: string;
  pwa_description?: string;
  pwa_theme_color?: string;
  pwa_background_color?: string;
  pwa_icon_192?: File;
  pwa_icon_512?: File;
  pwa_icon_maskable?: File;
  pwa_icon_192_clear?: boolean;
  pwa_icon_512_clear?: boolean;
  pwa_icon_maskable_clear?: boolean;

  is_active?: boolean;
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

// TipoSede ahora es ID numérico (ForeignKey a TipoSede model)
// Se mantiene compatibilidad con strings legacy para migración
export type TipoSede = number | string;

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
  // Capacidad - Sistema dinámico multi-industria
  capacidad_almacenamiento?: number | null;
  unidad_capacidad?: number | null;
  unidad_capacidad_display?: string | null;
  capacidad_formateada?: string;
  // DEPRECATED: Mantener para compatibilidad temporal
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
  // Capacidad - Sistema dinámico multi-industria
  capacidad_almacenamiento?: number;
  unidad_capacidad?: number;
  // DEPRECATED: Mantener para compatibilidad temporal
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
  // Capacidad - Sistema dinámico multi-industria
  capacidad_almacenamiento?: number | null;
  unidad_capacidad?: number | null;
  // DEPRECATED: Mantener para compatibilidad temporal
  capacidad_almacenamiento_kg?: number | null;
  is_active?: boolean;
}

// ==================== UNIDAD DE CAPACIDAD ====================

export interface UnidadCapacidad {
  value: number;
  label: string;
  simbolo: string;
  categoria: 'MASA' | 'VOLUMEN' | 'CONTENEDOR';
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

export type MetodoAutenticacion =
  | 'API_KEY'
  | 'OAUTH2'
  | 'BASIC_AUTH'
  | 'SERVICE_ACCOUNT'
  | 'CERTIFICATE';

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
export type PoliticaStatus = 'BORRADOR' | 'EN_REVISION' | 'FIRMADO' | 'VIGENTE' | 'OBSOLETO';

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

/**
 * Alcance de Sistemas de Gestión
 *
 * Define el alcance de aplicación de normas y sistemas de gestión
 * (ISO, PESV, SG-SST, etc.) en la organización.
 */
export interface AlcanceSistema {
  id: number;
  identity: number;
  norma_iso: number | null;
  norma_iso_code?: string | null;
  norma_iso_name?: string | null;
  scope: string;
  exclusions?: string | null;
  exclusion_justification?: string | null;
  is_certified: boolean;
  is_certificate_valid?: boolean;
  certification_date?: string | null;
  certification_body?: string | null;
  certificate_number?: string | null;
  expiry_date?: string | null;
  days_until_expiry?: number | null;
  last_audit_date?: string | null;
  next_audit_date?: string | null;
  certificate_file?: string | null;
  is_active: boolean;
  created_by?: number | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAlcanceSistemaDTO {
  identity: number;
  norma_iso: number;
  scope: string;
  exclusions?: string;
  exclusion_justification?: string;
  is_certified?: boolean;
  certification_date?: string;
  certification_body?: string;
  certificate_number?: string;
  expiry_date?: string;
  last_audit_date?: string;
  next_audit_date?: string;
  is_active?: boolean;
}

export interface UpdateAlcanceSistemaDTO {
  norma_iso?: number;
  scope?: string;
  exclusions?: string;
  exclusion_justification?: string;
  is_certified?: boolean;
  certification_date?: string;
  certification_body?: string;
  certificate_number?: string;
  expiry_date?: string;
  last_audit_date?: string;
  next_audit_date?: string;
  is_active?: boolean;
}

export interface AlcanceSistemaFilters {
  identity?: number;
  norma_iso?: number;
  is_certified?: boolean;
  is_active?: boolean;
}

// ==================== POLÍTICA ESPECÍFICA ====================
// @deprecated - Usar types/policies.types.ts (Sistema Unificado v3.0) en su lugar.
// Estos tipos legacy serán eliminados en una futura versión.

/**
 * @deprecated Usar Politica de policies.types.ts
 *
 * Políticas específicas asociadas a normas y sistemas de gestión
 * (ISO, PESV, SG-SST, etc.)
 */
export interface PoliticaEspecifica {
  id: number;
  identity: number;
  norma_iso: number | null; // FK a NormaISO (dinámico desde BD - incluye ISO, PESV, SG-SST, etc.)
  norma_iso_code?: string | null;
  norma_iso_name?: string | null;
  code: string; // Código único (POL-SST-001)
  title: string; // Título de la política
  content: string;
  version: string;
  status: PoliticaStatus;
  status_display?: string;
  effective_date: string;
  review_date?: string | null;
  needs_review?: boolean;
  // Responsables
  area?: number | null;
  area_name?: string | null;
  responsible?: number | null;
  responsible_name?: string | null;
  responsible_cargo?: number | null;
  responsible_cargo_name?: string | null;
  // Aprobación
  approved_by?: number | null;
  approved_by_name?: string | null;
  approved_at?: string | null;
  // Extras
  document_file?: string | null;
  keywords?: string | null;
  orden: number;
  is_active: boolean;
  created_by?: number | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePoliticaEspecificaDTO {
  identity: number;
  norma_iso?: number | null; // FK a NormaISO (dinámico desde BD - incluye ISO, PESV, SG-SST, etc.)
  code: string; // Requerido
  title: string; // Requerido
  content: string;
  version: string;
  status?: PoliticaStatus;
  effective_date?: string;
  review_date?: string;
  area?: number | null;
  responsible?: number | null;
  responsible_cargo?: number | null;
  keywords?: string;
  orden?: number;
  is_active?: boolean;
}

export interface UpdatePoliticaEspecificaDTO {
  norma_iso?: number | null;
  code?: string;
  title?: string;
  content?: string;
  version?: string;
  status?: PoliticaStatus;
  effective_date?: string;
  review_date?: string;
  area?: number | null;
  responsible?: number | null;
  responsible_cargo?: number | null;
  keywords?: string;
  orden?: number;
  is_active?: boolean;
}

export interface PoliticaEspecificaFilters {
  identity?: number;
  norma_iso?: number; // FK a NormaISO (incluye ISO, PESV, SG-SST, etc.)
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
