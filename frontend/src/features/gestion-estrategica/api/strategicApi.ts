/**
 * API Client para el módulo de Dirección Estratégica
 * Sistema de Gestión StrateKaz
 *
 * REFACTORIZADO (Sprint 18): Usa createApiClient factory para reducir boilerplate
 * Antes: ~600 líneas de CRUD manual | Después: ~300 líneas con factory
 */
import { apiClient } from '@/lib/api-client';
import { createApiClient } from '@/lib/api-factory';
import { APP_VERSION } from '@/constants/brand';
import type {
  CorporateIdentity,
  CreateCorporateIdentityDTO,
  UpdateCorporateIdentityDTO,
  CorporateValue,
  CreateCorporateValueDTO,
  UpdateCorporateValueDTO,
  StrategicPlan,
  CreateStrategicPlanDTO,
  UpdateStrategicPlanDTO,
  StrategicObjective,
  CreateStrategicObjectiveDTO,
  UpdateStrategicObjectiveDTO,
  UpdateProgressDTO,
  SystemModule,
  CreateSystemModuleDTO,
  UpdateSystemModuleDTO,
  ToggleModuleDTO,
  BrandingConfig,
  CreateBrandingConfigDTO,
  UpdateBrandingConfigDTO,
  StrategicStats,
  PaginatedResponse,
  SelectOption,
  SedeEmpresa,
  CreateSedeEmpresaDTO,
  UpdateSedeEmpresaDTO,
  IntegracionExterna,
  CreateIntegracionDTO,
  UpdateIntegracionDTO,
  UpdateCredencialesDTO,
  TestConnectionResult,
  IntegracionLog,
  IntegracionLogsFilters,
} from '../types/strategic.types';

// URLs por módulo según backend Django
const CORE_URL = '/core'; // Para system-modules, branding, strategic stats
const IDENTIDAD_URL = '/identidad';
const PLANEACION_URL = '/planeacion';
const CONFIGURACION_URL = '/configuracion';
const ORGANIZACION_URL = '/organizacion'; // Consecutivos y Unidades de Medida migrados aquí
const TENANT_URL = '/tenant'; // Para endpoints públicos de tenant (branding, verificación dominio)

// ==================== NORMAS ISO (Dinámico) ====================

export interface NormaISO {
  id: number;
  code: string;
  name: string;
  short_name: string | null;
  description?: string | null;
  category: string;
  category_display?: string;
  version?: string | null;
  icon: string | null;
  color: string | null;
  orden: number;
  es_sistema: boolean;
  is_active: boolean;
}

export interface NormaISOChoices {
  normas: Array<{
    value: number;
    label: string;
    code: string;
    name: string;
    short_name: string | null;
    icon: string | null;
    color: string | null;
    category: string;
  }>;
  categorias: Array<{ value: string; label: string }>;
}

/**
 * Norma ISO para selector en objetivos estratégicos
 * Viene del endpoint GET /planeacion/objetivos/normas-iso-choices/
 */
export interface NormaISOChoice {
  id: number;
  code: string;
  name: string;
  short_name: string | null;
  icon: string | null;
  color: string | null;
  category: string | null;
  // Campos de compatibilidad para SelectOption
  value: number;
  label: string;
}

export interface CreateNormaISODTO {
  code: string;
  name: string;
  short_name?: string;
  description?: string;
  category: string;
  icon?: string;
  color?: string;
  orden?: number;
  is_active?: boolean;
}

export interface UpdateNormaISODTO {
  code?: string;
  name?: string;
  short_name?: string;
  description?: string;
  category?: string;
  icon?: string;
  color?: string;
  orden?: number;
  is_active?: boolean;
}

// ✅ FACTORY: 9 líneas → reemplaza ~50 líneas de CRUD manual
export const normasISOApi = {
  ...createApiClient<NormaISO, CreateNormaISODTO, UpdateNormaISODTO>(
    CONFIGURACION_URL,
    'normas-iso'
  ),

  // Métodos custom (solo los que NO son CRUD básico)
  getChoices: async (): Promise<NormaISOChoices> => {
    const response = await apiClient.get(`${CONFIGURACION_URL}/normas-iso/choices/`);
    return response.data;
  },

  getByCategory: async (): Promise<Record<string, { name: string; normas: NormaISO[] }>> => {
    const response = await apiClient.get(`${CONFIGURACION_URL}/normas-iso/by-category/`);
    return response.data;
  },
};

// ==================== CORPORATE IDENTITY ====================

// ✅ FACTORY: 11 líneas → reemplaza ~60 líneas de CRUD manual
export const identityApi = {
  ...createApiClient<CorporateIdentity, CreateCorporateIdentityDTO, UpdateCorporateIdentityDTO>(
    IDENTIDAD_URL,
    'identidad'
  ),

  // Métodos custom
  getActive: async (): Promise<CorporateIdentity | null> => {
    try {
      const response = await apiClient.get(`${IDENTIDAD_URL}/identidad/active/`);
      return response.data;
    } catch (error: unknown) {
      // 404 significa que no hay identidad activa, retornar null
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          return null;
        }
      }
      throw error;
    }
  },

  signPolicy: async (
    id: number
  ): Promise<{ detail: string; signed_by: string; signed_at: string; signature_hash: string }> => {
    const response = await apiClient.post(`${IDENTIDAD_URL}/identidad/${id}/sign/`, {
      confirm: true,
    });
    return response.data;
  },

  // NOTA: Para agregar/remover valores, usar directamente valuesApi.create() y valuesApi.delete()
};

// ==================== CORPORATE VALUES ====================

// ✅ FACTORY: 3 líneas → reemplaza ~40 líneas de CRUD manual
export const valuesApi = {
  ...createApiClient<CorporateValue, CreateCorporateValueDTO, UpdateCorporateValueDTO>(
    IDENTIDAD_URL,
    'valores'
  ),
  // No hay métodos custom, solo CRUD básico
};

// ==================== STRATEGIC PLANS ====================

// ✅ FACTORY: 26 líneas → reemplaza ~80 líneas de CRUD manual
export const plansApi = {
  ...createApiClient<StrategicPlan, CreateStrategicPlanDTO, UpdateStrategicPlanDTO>(
    PLANEACION_URL,
    'planes'
  ),

  // Métodos custom
  getActive: async (): Promise<StrategicPlan | null> => {
    try {
      const response = await apiClient.get(`${PLANEACION_URL}/planes/active/`);
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          return null;
        }
      }
      throw error;
    }
  },

  approve: async (id: number): Promise<StrategicPlan> => {
    const response = await apiClient.post(`${PLANEACION_URL}/planes/${id}/approve/`, {
      confirm: true,
    });
    return response.data.plan;
  },

  getBSCPerspectives: async (): Promise<SelectOption[]> => {
    const response = await apiClient.get(`${PLANEACION_URL}/planes/bsc-perspectives/`);
    return response.data;
  },

  /**
   * @deprecated Use objectivesApi.getNormasISOChoices() instead
   */
  getISOStandards: async (): Promise<SelectOption[]> => {
    // Redirigir al nuevo endpoint dinámico
    const response = await apiClient.get(`${PLANEACION_URL}/objetivos/normas-iso-choices/`);
    return response.data;
  },

  getPeriodTypes: async (): Promise<SelectOption[]> => {
    const response = await apiClient.get(`${PLANEACION_URL}/planes/period-types/`);
    return response.data;
  },
};

// ==================== STRATEGIC OBJECTIVES ====================

// ✅ FACTORY: 16 líneas → reemplaza ~60 líneas de CRUD manual
export const objectivesApi = {
  ...createApiClient<StrategicObjective, CreateStrategicObjectiveDTO, UpdateStrategicObjectiveDTO>(
    PLANEACION_URL,
    'objetivos'
  ),

  // Métodos custom
  updateProgress: async (id: number, data: UpdateProgressDTO): Promise<StrategicObjective> => {
    const response = await apiClient.post(
      `${PLANEACION_URL}/objetivos/${id}/update-progress/`,
      data
    );
    return response.data.objective;
  },

  getStatuses: async (): Promise<SelectOption[]> => {
    const response = await apiClient.get(`${PLANEACION_URL}/objetivos/statuses/`);
    return response.data;
  },

  /**
   * Obtiene las normas ISO activas para vincular a objetivos
   * Endpoint: GET /planeacion/objetivos/normas-iso-choices/
   */
  getNormasISOChoices: async (): Promise<NormaISOChoice[]> => {
    const response = await apiClient.get(`${PLANEACION_URL}/objetivos/normas-iso-choices/`);
    return response.data;
  },
};

// ==================== SYSTEM MODULES ====================

// ✅ FACTORY: 15 líneas → reemplaza ~60 líneas de CRUD manual
export const modulesApi = {
  ...createApiClient<SystemModule, CreateSystemModuleDTO, UpdateSystemModuleDTO>(
    CORE_URL,
    'system-modules'
  ),

  // Métodos custom
  getEnabled: async (): Promise<SystemModule[]> => {
    const response = await apiClient.get(`${CORE_URL}/system-modules/enabled/`);
    return response.data;
  },

  toggle: async (id: number, data: ToggleModuleDTO): Promise<SystemModule> => {
    const response = await apiClient.post(`${CORE_URL}/system-modules/${id}/toggle/`, data);
    return response.data.module;
  },

  getCategories: async (): Promise<SelectOption[]> => {
    const response = await apiClient.get(`${CORE_URL}/system-modules/categories/`);
    return response.data;
  },
};

// ==================== BRANDING CONFIG ====================
// NOTA: El branding ahora se gestiona en el modelo Tenant.
// Las funciones legacy que apuntaban a /core/branding/ han sido eliminadas.
// Usar getByDomain() para branding público o getActive() para el tenant actual.

export const brandingApi = {
  /**
   * Obtiene el branding del tenant por dominio.
   * Este es el endpoint PÚBLICO que no requiere autenticación.
   * Usado para cargar branding ANTES del login.
   *
   * @param domain - Dominio completo (ej: 'empresa.localhost:5173')
   */
  getByDomain: async (domain: string): Promise<BrandingConfig | null> => {
    try {
      const response = await apiClient.get(`${TENANT_URL}/public/branding/`, {
        params: { domain },
      });
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          return null;
        }
      }
      throw error;
    }
  },

  /**
   * Obtiene la configuración de branding activa.
   *
   * FLUJO (v4.1 - público para todos los usuarios):
   * 1. Si hay tenant_id → endpoint público por ID (funciona con o sin token)
   * 2. Fallback: endpoint público por dominio (login en subdominio)
   * 3. Fallback final: null → valores por defecto
   *
   * NOTA: Usamos siempre el endpoint público para evitar 403 en usuarios
   * no-superadmin. El endpoint admin-only (/api/tenant/tenants/{id}/)
   * requiere IsSuperAdmin y causaba borrado accidental de tokens.
   */
  getActive: async (): Promise<BrandingConfig | null> => {
    const currentTenantId = localStorage.getItem('current_tenant_id');

    // Paso 1: Endpoint público por tenant ID (funciona para cualquier usuario)
    if (currentTenantId) {
      try {
        const response = await apiClient.get(`${TENANT_URL}/public/branding-by-id/`, {
          params: { tenant_id: currentTenantId },
        });
        return response.data;
      } catch {
        console.warn('[brandingApi] Failed to get branding by tenant_id, falling back to domain');
      }
    }

    // Paso 2: Endpoint público por dominio (login en subdominio del tenant)
    try {
      const currentDomain = window.location.host;
      const response = await apiClient.get(`${TENANT_URL}/public/branding/`, {
        params: { domain: currentDomain },
      });
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          return null;
        }
      }
      throw error;
    }
  },

  /**
   * Obtiene branding por tenant ID.
   * Usa endpoint público que no requiere IsSuperAdmin.
   *
   * @param tenantId - ID del tenant
   */
  getById: async (tenantId: number): Promise<BrandingConfig> => {
    const response = await apiClient.get(`${TENANT_URL}/public/branding-by-id/`, {
      params: { tenant_id: tenantId },
    });
    const tenant = response.data;

    // Mapear campos del tenant a formato BrandingConfig
    return {
      id: tenant.id,
      company_name: tenant.name,
      company_short_name: tenant.nombre_comercial || tenant.name,
      company_slogan: tenant.company_slogan || '',
      logo: tenant.logo,
      logo_white: tenant.logo_white,
      logo_dark: tenant.logo_dark,
      favicon: tenant.favicon,
      login_background: tenant.login_background,
      primary_color: tenant.primary_color || '#ec268f',
      secondary_color: tenant.secondary_color || '#000000',
      accent_color: tenant.accent_color || '#f4ec25',
      sidebar_color: tenant.sidebar_color || '#1E293B',
      background_color: tenant.background_color || '#F5F5F5',
      showcase_background: tenant.showcase_background || '#1F2937',
      gradient_mission: tenant.gradient_mission || '',
      gradient_vision: tenant.gradient_vision || '',
      gradient_policy: tenant.gradient_policy || '',
      gradient_values: tenant.gradient_values || [],
      app_version: APP_VERSION,
      pwa_name: tenant.pwa_name || tenant.name,
      pwa_short_name: tenant.pwa_short_name || tenant.nombre_comercial || tenant.name,
      pwa_description: tenant.pwa_description || '',
      pwa_theme_color: tenant.pwa_theme_color || tenant.primary_color || '#ec268f',
      pwa_background_color: tenant.pwa_background_color || '#FFFFFF',
      pwa_icon_192: tenant.pwa_icon_192,
      pwa_icon_512: tenant.pwa_icon_512,
      pwa_icon_maskable: tenant.pwa_icon_maskable,
      is_active: true,
    };
  },

  /**
   * Actualiza la configuración de branding del tenant.
   * En Admin Global se actualiza directamente el Tenant.
   *
   * @param tenantId - ID del tenant a actualizar
   * @param data - Datos de branding a actualizar
   */
  update: async (
    tenantId: number,
    data: UpdateBrandingConfigDTO | FormData
  ): Promise<BrandingConfig> => {
    const response = await apiClient.patch(`${TENANT_URL}/tenants/${tenantId}/`, data);
    return response.data;
  },

  /**
   * Actualiza el branding del tenant actual (desde el contexto del tenant).
   */
  updateCurrent: async (data: UpdateBrandingConfigDTO | FormData): Promise<BrandingConfig> => {
    const currentTenantId = localStorage.getItem('current_tenant_id');
    if (!currentTenantId) {
      throw new Error('No hay tenant seleccionado');
    }
    return brandingApi.update(parseInt(currentTenantId), data);
  },

  /**
   * Crea una configuración de branding.
   * En multi-tenant, esto no es necesario ya que el branding se crea con el Tenant.
   * @deprecated El branding se configura al crear el Tenant
   */
  create: async (_data: CreateBrandingConfigDTO | FormData): Promise<BrandingConfig> => {
    throw new Error('El branding se configura al crear el Tenant. Use la API de Tenant.');
  },
};

// ==================== STRATEGIC STATS ====================

export interface ConfigStatItem {
  key: string;
  label: string;
  value: string;
  icon: string;
  iconColor: 'primary' | 'success' | 'warning' | 'danger';
  description?: string;
}

export interface ConfigStatsResponse {
  section: string;
  stats: ConfigStatItem[];
}

export const statsApi = {
  getStats: async (): Promise<StrategicStats> => {
    const response = await apiClient.get(`${IDENTIDAD_URL}/stats/`);
    return response.data;
  },

  getConfigStats: async (section: string): Promise<ConfigStatsResponse> => {
    const response = await apiClient.get(`${CONFIGURACION_URL}/config-stats/`, {
      params: { section },
    });
    return response.data;
  },
};

// ==================== SEDE EMPRESA ====================

// ✅ FACTORY: 19 líneas → reemplaza ~70 líneas de CRUD manual
export const sedesApi = {
  ...createApiClient<SedeEmpresa, CreateSedeEmpresaDTO, UpdateSedeEmpresaDTO>(
    CONFIGURACION_URL,
    'sedes'
  ),

  // Métodos custom
  getPrincipal: async (): Promise<SedeEmpresa | null> => {
    try {
      const response = await apiClient.get(`${CONFIGURACION_URL}/sedes/principal/`);
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          return null;
        }
      }
      throw error;
    }
  },

  restore: async (id: number): Promise<SedeEmpresa> => {
    const response = await apiClient.post(`${CONFIGURACION_URL}/sedes/${id}/restore/`);
    return response.data;
  },

  setPrincipal: async (id: number): Promise<SedeEmpresa> => {
    const response = await apiClient.post(`${CONFIGURACION_URL}/sedes/${id}/set-principal/`);
    return response.data;
  },

  getChoices: async (): Promise<{ tipos_sede: SelectOption[]; departamentos: SelectOption[] }> => {
    const response = await apiClient.get(`${CONFIGURACION_URL}/sedes/choices/`);
    return response.data;
  },
};

// ==================== INTEGRACIONES EXTERNAS ====================

// ✅ FACTORY: 28 líneas → reemplaza ~90 líneas de CRUD manual
export const integracionesApi = {
  ...createApiClient<IntegracionExterna, CreateIntegracionDTO, UpdateIntegracionDTO>(
    CONFIGURACION_URL,
    'integraciones-externas'
  ),

  // Métodos custom
  testConnection: async (id: number): Promise<TestConnectionResult> => {
    const response = await apiClient.post(
      `${CONFIGURACION_URL}/integraciones-externas/${id}/test-connection/`
    );
    return response.data;
  },

  toggleStatus: async (id: number): Promise<IntegracionExterna> => {
    const response = await apiClient.post(
      `${CONFIGURACION_URL}/integraciones-externas/${id}/toggle-status/`
    );
    return response.data.integracion;
  },

  getLogs: async (
    id: number,
    filters?: IntegracionLogsFilters
  ): Promise<PaginatedResponse<IntegracionLog>> => {
    const response = await apiClient.get(
      `${CONFIGURACION_URL}/integraciones-externas/${id}/logs/`,
      {
        params: filters,
      }
    );
    return response.data;
  },

  updateCredentials: async (
    id: number,
    data: UpdateCredencialesDTO
  ): Promise<IntegracionExterna> => {
    const response = await apiClient.patch(
      `${CONFIGURACION_URL}/integraciones-externas/${id}/update_credentials/`,
      data
    );
    return response.data;
  },

  getChoices: async (): Promise<{
    tipos_servicio: SelectOption[];
    proveedores: SelectOption[];
    ambientes: SelectOption[];
    metodos_autenticacion: SelectOption[];
  }> => {
    const response = await apiClient.get(`${CONFIGURACION_URL}/integraciones-externas/choices/`);
    return response.data;
  },
};

// ==================== ALCANCE DEL SISTEMA ====================

import type {
  AlcanceSistema,
  CreateAlcanceSistemaDTO,
  UpdateAlcanceSistemaDTO,
} from '../types/strategic.types';

// ✅ FACTORY: 18 líneas → reemplaza ~60 líneas de CRUD manual
export const alcancesApi = {
  ...createApiClient<AlcanceSistema, CreateAlcanceSistemaDTO, UpdateAlcanceSistemaDTO>(
    IDENTIDAD_URL,
    'alcances'
  ),

  // Métodos custom
  getByStandard: async (identityId: number): Promise<Record<string, AlcanceSistema>> => {
    const response = await apiClient.get(`${IDENTIDAD_URL}/alcances/by-standard/`, {
      params: { identity: identityId },
    });
    return response.data;
  },

  getCertifications: async (
    identityId: number
  ): Promise<{
    total: number;
    certified: number;
    pending: number;
    expiring_soon: AlcanceSistema[];
  }> => {
    const response = await apiClient.get(`${IDENTIDAD_URL}/alcances/certifications/`, {
      params: { identity: identityId },
    });
    return response.data;
  },
};

// NOTA v4.0: politicasEspecificasApi ELIMINADA.
// Las políticas se gestionan desde Gestión Documental (tipo_documento=POL).

// ==================== UNIDADES DE MEDIDA (MC-001) ====================

export type CategoriaUnidad =
  | 'MASA'
  | 'VOLUMEN'
  | 'LONGITUD'
  | 'AREA'
  | 'CANTIDAD'
  | 'TIEMPO'
  | 'CONTENEDOR'
  | 'OTRO';

export interface UnidadMedida {
  id: number;
  codigo: string;
  nombre: string;
  nombre_plural: string;
  simbolo: string;
  categoria: CategoriaUnidad;
  categoria_display: string;
  unidad_base: number | null;
  unidad_base_nombre: string | null;
  unidad_base_simbolo: string | null;
  factor_conversion: string;
  decimales_display: number;
  prefiere_notacion_cientifica: boolean;
  usar_separador_miles: boolean;
  descripcion: string | null;
  es_sistema: boolean;
  orden_display: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UnidadMedidaList {
  id: number;
  codigo: string;
  nombre: string;
  simbolo: string;
  categoria: CategoriaUnidad;
  categoria_display: string;
  decimales_display: number;
  es_sistema: boolean;
  is_active: boolean;
}

export interface CreateUnidadMedidaDTO {
  codigo: string;
  nombre: string;
  nombre_plural?: string;
  simbolo: string;
  categoria: CategoriaUnidad;
  unidad_base?: number | null;
  factor_conversion?: string;
  decimales_display?: number;
  prefiere_notacion_cientifica?: boolean;
  usar_separador_miles?: boolean;
  descripcion?: string;
  orden_display?: number;
  is_active?: boolean;
}

export type UpdateUnidadMedidaDTO = Partial<CreateUnidadMedidaDTO>;

export interface UnidadMedidaFilters {
  categoria?: CategoriaUnidad;
  es_sistema?: boolean;
  is_active?: boolean;
  search?: string;
}

export interface UnidadMedidaChoices {
  unidades: Array<{
    value: number;
    label: string;
    codigo: string;
    simbolo: string;
    categoria: CategoriaUnidad;
    es_sistema: boolean;
  }>;
  categorias: Array<{ value: string; label: string }>;
  unidades_base: Array<{
    value: number;
    label: string;
    codigo: string;
    categoria: CategoriaUnidad;
  }>;
}

export interface ConversionResult {
  valor_original: number;
  unidad_origen: { codigo: string; simbolo: string; nombre: string };
  valor_convertido: number;
  unidad_destino: { codigo: string; simbolo: string; nombre: string };
}

export interface FormateoResult {
  valor_original: number;
  valor_formateado: string;
  unidad: { codigo: string; simbolo: string; nombre: string };
}

// ✅ FACTORY: 31 líneas → reemplaza ~90 líneas de CRUD manual
export const unidadesMedidaApi = {
  ...createApiClient<UnidadMedida, CreateUnidadMedidaDTO, UpdateUnidadMedidaDTO>(
    ORGANIZACION_URL,
    'unidades-medida'
  ),

  // Métodos custom
  restore: async (id: number): Promise<UnidadMedida> => {
    const response = await apiClient.post(`${ORGANIZACION_URL}/unidades-medida/${id}/restore/`);
    return response.data.data;
  },

  getChoices: async (): Promise<UnidadMedidaChoices> => {
    const response = await apiClient.get(`${ORGANIZACION_URL}/unidades-medida/choices/`);
    return response.data;
  },

  getByCategoria: async (): Promise<
    Record<CategoriaUnidad, { label: string; unidades: UnidadMedidaList[] }>
  > => {
    const response = await apiClient.get(`${ORGANIZACION_URL}/unidades-medida/by-categoria/`);
    return response.data;
  },

  convertir: async (
    valor: number,
    unidadOrigen: string,
    unidadDestino: string
  ): Promise<ConversionResult> => {
    const response = await apiClient.post(`${ORGANIZACION_URL}/unidades-medida/convertir/`, {
      valor,
      unidad_origen: unidadOrigen,
      unidad_destino: unidadDestino,
    });
    return response.data;
  },

  formatear: async (
    valor: number,
    unidad: string,
    incluirSimbolo = true
  ): Promise<FormateoResult> => {
    const response = await apiClient.post(`${ORGANIZACION_URL}/unidades-medida/formatear/`, {
      valor,
      unidad,
      incluir_simbolo: incluirSimbolo,
    });
    return response.data;
  },

  cargarSistema: async (): Promise<{
    message: string;
    unidades_creadas: number;
    total_unidades: number;
  }> => {
    const response = await apiClient.post(`${ORGANIZACION_URL}/unidades-medida/cargar-sistema/`);
    return response.data;
  },
};

// ==============================================================================
// MC-002: CONSECUTIVOS CONFIG API
// ==============================================================================

export type CategoriaConsecutivo =
  | 'DOCUMENTOS'
  | 'COMPRAS'
  | 'VENTAS'
  | 'INVENTARIO'
  | 'CONTABILIDAD'
  | 'PRODUCCION'
  | 'CALIDAD'
  | 'RRHH'
  | 'SST'
  | 'AMBIENTAL'
  | 'GENERAL';

export type SeparadorConsecutivo = '-' | '/' | '_' | '.' | '';

export interface ConsecutivoConfig {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  categoria: CategoriaConsecutivo;
  categoria_display: string;
  prefix: string;
  suffix: string;
  separator: SeparadorConsecutivo;
  separator_display: string;
  current_number: number;
  padding: number;
  numero_inicial: number;
  include_year: boolean;
  include_month: boolean;
  include_day: boolean;
  reset_yearly: boolean;
  reset_monthly: boolean;
  last_reset_date: string | null;
  es_sistema: boolean;
  is_active: boolean;
  ejemplo_formato: string;
  created_at: string;
  updated_at: string;
}

export interface ConsecutivoConfigList {
  id: number;
  codigo: string;
  nombre: string;
  categoria: CategoriaConsecutivo;
  categoria_display: string;
  prefix: string;
  current_number: number;
  es_sistema: boolean;
  is_active: boolean;
  ejemplo_formato: string;
}

export interface CreateConsecutivoDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: CategoriaConsecutivo;
  prefix: string;
  suffix?: string;
  separator?: SeparadorConsecutivo;
  padding?: number;
  numero_inicial?: number;
  include_year?: boolean;
  include_month?: boolean;
  include_day?: boolean;
  reset_yearly?: boolean;
  reset_monthly?: boolean;
}

export type UpdateConsecutivoDTO = Partial<CreateConsecutivoDTO>;

export interface ConsecutivoFilters {
  categoria?: CategoriaConsecutivo;
  es_sistema?: boolean;
  is_active?: boolean;
  search?: string;
}

export interface ConsecutivoChoices {
  categorias: Array<{ value: string; label: string }>;
  separadores: Array<{ value: string; label: string }>;
  consecutivos: Array<{
    value: number;
    label: string;
    codigo: string;
    categoria: CategoriaConsecutivo;
    ejemplo: string;
  }>;
}

export interface GenerarConsecutivoResult {
  consecutivo: string;
  numero: number;
  codigo: string;
}

export interface PreviewConsecutivoParams {
  prefix: string;
  suffix?: string;
  separator?: SeparadorConsecutivo;
  padding?: number;
  numero?: number;
  include_year?: boolean;
  include_month?: boolean;
  include_day?: boolean;
}

// ✅ FACTORY: 37 líneas → reemplaza ~100 líneas de CRUD manual
export const consecutivosApi = {
  ...createApiClient<ConsecutivoConfig, CreateConsecutivoDTO, UpdateConsecutivoDTO>(
    ORGANIZACION_URL,
    'consecutivos'
  ),

  // Métodos custom
  restore: async (id: number): Promise<ConsecutivoConfig> => {
    const response = await apiClient.post(`${ORGANIZACION_URL}/consecutivos/${id}/restore/`);
    return response.data.data;
  },

  getChoices: async (): Promise<ConsecutivoChoices> => {
    const response = await apiClient.get(`${ORGANIZACION_URL}/consecutivos/choices/`);
    return response.data;
  },

  getByCategoria: async (): Promise<
    Record<
      CategoriaConsecutivo,
      Array<{
        id: number;
        codigo: string;
        nombre: string;
        prefix: string;
        ejemplo: string;
        es_sistema: boolean;
      }>
    >
  > => {
    const response = await apiClient.get(`${ORGANIZACION_URL}/consecutivos/by-categoria/`);
    return response.data;
  },

  generar: async (codigo: string): Promise<GenerarConsecutivoResult> => {
    const response = await apiClient.post(`${ORGANIZACION_URL}/consecutivos/generar/`, {
      codigo,
    });
    return response.data;
  },

  generarPorId: async (consecutivoId: number): Promise<GenerarConsecutivoResult> => {
    const response = await apiClient.post(`${ORGANIZACION_URL}/consecutivos/generar/`, {
      consecutivo_id: consecutivoId,
    });
    return response.data;
  },

  preview: async (params: PreviewConsecutivoParams): Promise<{ formato: string }> => {
    const response = await apiClient.post(`${ORGANIZACION_URL}/consecutivos/preview/`, params);
    return response.data;
  },

  reiniciar: async (
    id: number,
    confirmar = false
  ): Promise<{ message: string; data: ConsecutivoConfig }> => {
    const response = await apiClient.post(`${ORGANIZACION_URL}/consecutivos/${id}/reiniciar/`, {
      confirmar,
    });
    return response.data;
  },

  cargarSistema: async (): Promise<{
    message: string;
    creados: number;
    actualizados: number;
    total: number;
  }> => {
    const response = await apiClient.post(`${ORGANIZACION_URL}/consecutivos/cargar-sistema/`);
    return response.data;
  },
};

// ==================== CURRENT TENANT (Admin Tenant Self-Edit) ====================

export interface CurrentTenantData {
  id: number;
  code: string;
  name: string;
  nit: string;
  razon_social: string;
  nombre_comercial: string;
  representante_legal: string;
  cedula_representante: string;
  tipo_sociedad: string;
  actividad_economica: string;
  descripcion_actividad: string;
  regimen_tributario: string;
  direccion_fiscal: string;
  ciudad: string;
  departamento: string;
  pais: string;
  codigo_postal: string;
  telefono_principal: string;
  telefono_secundario: string;
  email_corporativo: string;
  sitio_web: string;
  matricula_mercantil: string;
  camara_comercio: string;
  fecha_constitucion: string | null;
  fecha_inscripcion_registro: string | null;
  zona_horaria: string;
  formato_fecha: string;
  moneda: string;
  simbolo_moneda: string;
  separador_miles: string;
  separador_decimales: string;
  company_slogan: string;
  logo: string | null;
  logo_white: string | null;
  logo_dark: string | null;
  favicon: string | null;
  login_background: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  sidebar_color: string;
  background_color: string;
  showcase_background: string;
  gradient_mission: string;
  gradient_vision: string;
  gradient_policy: string;
  gradient_values: string;
  pwa_name: string;
  pwa_short_name: string;
  pwa_description: string;
  pwa_theme_color: string;
  pwa_background_color: string;
  pwa_icon_192: string | null;
  pwa_icon_512: string | null;
  pwa_icon_maskable: string | null;
  [key: string]: unknown;
}

export const currentTenantApi = {
  get: async (): Promise<CurrentTenantData> => {
    const response = await apiClient.get(`${TENANT_URL}/tenants/me/`);
    return response.data;
  },

  update: async (data: FormData | Partial<CurrentTenantData>): Promise<CurrentTenantData> => {
    const isFormData = data instanceof FormData;
    const response = await apiClient.patch(`${TENANT_URL}/tenants/me/`, data, {
      headers: isFormData ? { 'Content-Type': undefined } : {},
    });
    return response.data;
  },
};
