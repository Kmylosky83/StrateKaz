/**
 * API Client para el módulo de Dirección Estratégica
 * Sistema de Gestión StrateKaz
 */
import axiosInstance from '@/api/axios-config';
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
  ObjectiveFilters,
  ModuleFilters,
  SelectOption,
  SedeEmpresa,
  SedeEmpresaList,
  CreateSedeEmpresaDTO,
  UpdateSedeEmpresaDTO,
  SedeFilters,
  IntegracionExterna,
  IntegracionExternaList,
  CreateIntegracionDTO,
  UpdateIntegracionDTO,
  UpdateCredencialesDTO,
  IntegracionFilters,
  TestConnectionResult,
  IntegracionLog,
  IntegracionLogsFilters,
} from '../types/strategic.types';

// URLs por módulo según backend Django
const CORE_URL = '/core';  // Para system-modules, branding, strategic stats
const IDENTIDAD_URL = '/identidad';
const PLANEACION_URL = '/planeacion';
const CONFIGURACION_URL = '/configuracion';

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

export const normasISOApi = {
  getAll: async (): Promise<PaginatedResponse<NormaISO>> => {
    const response = await axiosInstance.get(`${CONFIGURACION_URL}/normas-iso/`);
    return response.data;
  },

  getById: async (id: number): Promise<NormaISO> => {
    const response = await axiosInstance.get(`${CONFIGURACION_URL}/normas-iso/${id}/`);
    return response.data;
  },

  getChoices: async (): Promise<NormaISOChoices> => {
    const response = await axiosInstance.get(`${CONFIGURACION_URL}/normas-iso/choices/`);
    return response.data;
  },

  getByCategory: async (): Promise<Record<string, { name: string; normas: NormaISO[] }>> => {
    const response = await axiosInstance.get(`${CONFIGURACION_URL}/normas-iso/by-category/`);
    return response.data;
  },
};

// ==================== CORPORATE IDENTITY ====================

export const identityApi = {
  getAll: async (): Promise<PaginatedResponse<CorporateIdentity>> => {
    const response = await axiosInstance.get(`${IDENTIDAD_URL}/identidad/`);
    return response.data;
  },

  getActive: async (): Promise<CorporateIdentity | null> => {
    try {
      const response = await axiosInstance.get(`${IDENTIDAD_URL}/identidad/active/`);
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

  getById: async (id: number): Promise<CorporateIdentity> => {
    const response = await axiosInstance.get(`${IDENTIDAD_URL}/identidad/${id}/`);
    return response.data;
  },

  create: async (data: CreateCorporateIdentityDTO): Promise<CorporateIdentity> => {
    const response = await axiosInstance.post(`${IDENTIDAD_URL}/identidad/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateCorporateIdentityDTO): Promise<CorporateIdentity> => {
    const response = await axiosInstance.patch(`${IDENTIDAD_URL}/identidad/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${IDENTIDAD_URL}/identidad/${id}/`);
  },

  signPolicy: async (id: number): Promise<{ detail: string; signed_by: string; signed_at: string; signature_hash: string }> => {
    const response = await axiosInstance.post(`${IDENTIDAD_URL}/identidad/${id}/sign/`, {
      confirm: true,
    });
    return response.data;
  },

  // NOTA: Para agregar/remover valores, usar directamente valuesApi.create() y valuesApi.delete()
};

// ==================== CORPORATE VALUES ====================

export const valuesApi = {
  getAll: async (identityId?: number): Promise<PaginatedResponse<CorporateValue>> => {
    const params = identityId ? { identity: identityId } : {};
    const response = await axiosInstance.get(`${IDENTIDAD_URL}/valores/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<CorporateValue> => {
    const response = await axiosInstance.get(`${IDENTIDAD_URL}/valores/${id}/`);
    return response.data;
  },

  create: async (data: CreateCorporateValueDTO & { identity: number }): Promise<CorporateValue> => {
    const response = await axiosInstance.post(`${IDENTIDAD_URL}/valores/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateCorporateValueDTO): Promise<CorporateValue> => {
    const response = await axiosInstance.patch(`${IDENTIDAD_URL}/valores/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${IDENTIDAD_URL}/valores/${id}/`);
  },
};

// ==================== STRATEGIC PLANS ====================

export const plansApi = {
  getAll: async (): Promise<PaginatedResponse<StrategicPlan>> => {
    const response = await axiosInstance.get(`${PLANEACION_URL}/planes/`);
    return response.data;
  },

  getActive: async (): Promise<StrategicPlan | null> => {
    try {
      const response = await axiosInstance.get(`${PLANEACION_URL}/planes/active/`);
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

  getById: async (id: number): Promise<StrategicPlan> => {
    const response = await axiosInstance.get(`${PLANEACION_URL}/planes/${id}/`);
    return response.data;
  },

  create: async (data: CreateStrategicPlanDTO): Promise<StrategicPlan> => {
    const response = await axiosInstance.post(`${PLANEACION_URL}/planes/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateStrategicPlanDTO): Promise<StrategicPlan> => {
    const response = await axiosInstance.patch(`${PLANEACION_URL}/planes/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${PLANEACION_URL}/planes/${id}/`);
  },

  approve: async (id: number): Promise<StrategicPlan> => {
    const response = await axiosInstance.post(`${PLANEACION_URL}/planes/${id}/approve/`, {
      confirm: true,
    });
    return response.data.plan;
  },

  getBSCPerspectives: async (): Promise<SelectOption[]> => {
    const response = await axiosInstance.get(`${PLANEACION_URL}/planes/bsc-perspectives/`);
    return response.data;
  },

  getISOStandards: async (): Promise<SelectOption[]> => {
    const response = await axiosInstance.get(`${PLANEACION_URL}/planes/iso-standards/`);
    return response.data;
  },

  getPeriodTypes: async (): Promise<SelectOption[]> => {
    const response = await axiosInstance.get(`${PLANEACION_URL}/planes/period-types/`);
    return response.data;
  },
};

// ==================== STRATEGIC OBJECTIVES ====================

export const objectivesApi = {
  getAll: async (filters?: ObjectiveFilters): Promise<PaginatedResponse<StrategicObjective>> => {
    const response = await axiosInstance.get(`${PLANEACION_URL}/objetivos/`, {
      params: filters,
    });
    return response.data;
  },

  getById: async (id: number): Promise<StrategicObjective> => {
    const response = await axiosInstance.get(`${PLANEACION_URL}/objetivos/${id}/`);
    return response.data;
  },

  create: async (data: CreateStrategicObjectiveDTO): Promise<StrategicObjective> => {
    const response = await axiosInstance.post(`${PLANEACION_URL}/objetivos/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateStrategicObjectiveDTO): Promise<StrategicObjective> => {
    const response = await axiosInstance.patch(`${PLANEACION_URL}/objetivos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${PLANEACION_URL}/objetivos/${id}/`);
  },

  updateProgress: async (id: number, data: UpdateProgressDTO): Promise<StrategicObjective> => {
    const response = await axiosInstance.post(
      `${PLANEACION_URL}/objetivos/${id}/update-progress/`,
      data
    );
    return response.data.objective;
  },

  getStatuses: async (): Promise<SelectOption[]> => {
    const response = await axiosInstance.get(`${PLANEACION_URL}/objetivos/statuses/`);
    return response.data;
  },
};

// ==================== SYSTEM MODULES ====================

export const modulesApi = {
  getAll: async (filters?: ModuleFilters): Promise<PaginatedResponse<SystemModule>> => {
    const response = await axiosInstance.get(`${CORE_URL}/system-modules/`, { params: filters });
    return response.data;
  },

  getEnabled: async (): Promise<SystemModule[]> => {
    const response = await axiosInstance.get(`${CORE_URL}/system-modules/enabled/`);
    return response.data;
  },

  getById: async (id: number): Promise<SystemModule> => {
    const response = await axiosInstance.get(`${CORE_URL}/system-modules/${id}/`);
    return response.data;
  },

  create: async (data: CreateSystemModuleDTO): Promise<SystemModule> => {
    const response = await axiosInstance.post(`${CORE_URL}/system-modules/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateSystemModuleDTO): Promise<SystemModule> => {
    const response = await axiosInstance.patch(`${CORE_URL}/system-modules/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${CORE_URL}/system-modules/${id}/`);
  },

  toggle: async (id: number, data: ToggleModuleDTO): Promise<SystemModule> => {
    const response = await axiosInstance.post(`${CORE_URL}/system-modules/${id}/toggle/`, data);
    return response.data.module;
  },

  getCategories: async (): Promise<SelectOption[]> => {
    const response = await axiosInstance.get(`${CORE_URL}/system-modules/categories/`);
    return response.data;
  },
};

// ==================== BRANDING CONFIG ====================

export const brandingApi = {
  getAll: async (): Promise<PaginatedResponse<BrandingConfig>> => {
    const response = await axiosInstance.get(`${CORE_URL}/branding/`);
    return response.data;
  },

  getActive: async (): Promise<BrandingConfig | null> => {
    try {
      const response = await axiosInstance.get(`${CORE_URL}/branding/active/`);
      return response.data;
    } catch (error: unknown) {
      // 404 significa que no hay branding activo, retornar null
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          return null;
        }
      }
      throw error;
    }
  },

  getById: async (id: number): Promise<BrandingConfig> => {
    const response = await axiosInstance.get(`${CORE_URL}/branding/${id}/`);
    return response.data;
  },

  create: async (data: CreateBrandingConfigDTO | FormData): Promise<BrandingConfig> => {
    const isFormData = data instanceof FormData;
    const response = await axiosInstance.post(`${CORE_URL}/branding/`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data;
  },

  update: async (id: number, data: UpdateBrandingConfigDTO | FormData): Promise<BrandingConfig> => {
    const isFormData = data instanceof FormData;
    const response = await axiosInstance.patch(`${CORE_URL}/branding/${id}/`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${CORE_URL}/branding/${id}/`);
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
    const response = await axiosInstance.get(`${CORE_URL}/strategic/stats/`);
    return response.data;
  },

  getConfigStats: async (section: string): Promise<ConfigStatsResponse> => {
    const response = await axiosInstance.get(`${CONFIGURACION_URL}/config-stats/`, {
      params: { section },
    });
    return response.data;
  },
};

// ==================== SEDE EMPRESA ====================

export const sedesApi = {
  getAll: async (filters?: SedeFilters): Promise<PaginatedResponse<SedeEmpresaList>> => {
    const response = await axiosInstance.get(`${CONFIGURACION_URL}/sedes/`, { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<SedeEmpresa> => {
    const response = await axiosInstance.get(`${CONFIGURACION_URL}/sedes/${id}/`);
    return response.data;
  },

  getPrincipal: async (): Promise<SedeEmpresa | null> => {
    try {
      const response = await axiosInstance.get(`${CONFIGURACION_URL}/sedes/principal/`);
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

  create: async (data: CreateSedeEmpresaDTO): Promise<SedeEmpresa> => {
    const response = await axiosInstance.post(`${CONFIGURACION_URL}/sedes/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateSedeEmpresaDTO): Promise<SedeEmpresa> => {
    const response = await axiosInstance.patch(`${CONFIGURACION_URL}/sedes/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${CONFIGURACION_URL}/sedes/${id}/`);
  },

  restore: async (id: number): Promise<SedeEmpresa> => {
    const response = await axiosInstance.post(`${CONFIGURACION_URL}/sedes/${id}/restore/`);
    return response.data;
  },

  setPrincipal: async (id: number): Promise<SedeEmpresa> => {
    const response = await axiosInstance.post(`${CONFIGURACION_URL}/sedes/${id}/set_principal/`);
    return response.data;
  },

  getChoices: async (): Promise<{ tipos_sede: SelectOption[]; departamentos: SelectOption[] }> => {
    const response = await axiosInstance.get(`${CONFIGURACION_URL}/sedes/choices/`);
    return response.data;
  },
};

// ==================== INTEGRACIONES EXTERNAS ====================

export const integracionesApi = {
  getAll: async (filters?: IntegracionFilters): Promise<PaginatedResponse<IntegracionExternaList>> => {
    const response = await axiosInstance.get(`${CONFIGURACION_URL}/integraciones-externas/`, { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<IntegracionExterna> => {
    const response = await axiosInstance.get(`${CONFIGURACION_URL}/integraciones-externas/${id}/`);
    return response.data;
  },

  create: async (data: CreateIntegracionDTO): Promise<IntegracionExterna> => {
    const response = await axiosInstance.post(`${CONFIGURACION_URL}/integraciones-externas/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateIntegracionDTO): Promise<IntegracionExterna> => {
    const response = await axiosInstance.patch(`${CONFIGURACION_URL}/integraciones-externas/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${CONFIGURACION_URL}/integraciones-externas/${id}/`);
  },

  testConnection: async (id: number): Promise<TestConnectionResult> => {
    const response = await axiosInstance.post(`${CONFIGURACION_URL}/integraciones-externas/${id}/test_connection/`);
    return response.data;
  },

  toggleStatus: async (id: number): Promise<IntegracionExterna> => {
    const response = await axiosInstance.post(`${CONFIGURACION_URL}/integraciones-externas/${id}/toggle_status/`);
    return response.data.integracion;
  },

  getLogs: async (id: number, filters?: IntegracionLogsFilters): Promise<PaginatedResponse<IntegracionLog>> => {
    const response = await axiosInstance.get(`${CONFIGURACION_URL}/integraciones-externas/${id}/logs/`, {
      params: filters,
    });
    return response.data;
  },

  updateCredentials: async (id: number, data: UpdateCredencialesDTO): Promise<IntegracionExterna> => {
    const response = await axiosInstance.patch(
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
    const response = await axiosInstance.get(`${CONFIGURACION_URL}/integraciones-externas/choices/`);
    return response.data;
  },
};

// ==================== ALCANCE DEL SISTEMA ====================

import type {
  AlcanceSistema,
  CreateAlcanceSistemaDTO,
  UpdateAlcanceSistemaDTO,
  AlcanceSistemaFilters,
  PoliticaIntegral,
  CreatePoliticaIntegralDTO,
  UpdatePoliticaIntegralDTO,
  PoliticaIntegralFilters,
  PoliticaEspecifica,
  CreatePoliticaEspecificaDTO,
  UpdatePoliticaEspecificaDTO,
  PoliticaEspecificaFilters,
} from '../types/strategic.types';

export const alcancesApi = {
  getAll: async (filters?: AlcanceSistemaFilters): Promise<PaginatedResponse<AlcanceSistema>> => {
    const response = await axiosInstance.get(`${IDENTIDAD_URL}/alcances/`, { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<AlcanceSistema> => {
    const response = await axiosInstance.get(`${IDENTIDAD_URL}/alcances/${id}/`);
    return response.data;
  },

  create: async (data: CreateAlcanceSistemaDTO): Promise<AlcanceSistema> => {
    const response = await axiosInstance.post(`${IDENTIDAD_URL}/alcances/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateAlcanceSistemaDTO): Promise<AlcanceSistema> => {
    const response = await axiosInstance.patch(`${IDENTIDAD_URL}/alcances/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${IDENTIDAD_URL}/alcances/${id}/`);
  },

  getByStandard: async (identityId: number): Promise<Record<string, AlcanceSistema>> => {
    const response = await axiosInstance.get(`${IDENTIDAD_URL}/alcances/by-standard/`, {
      params: { identity: identityId },
    });
    return response.data;
  },

  getCertifications: async (identityId: number): Promise<{
    total: number;
    certified: number;
    pending: number;
    expiring_soon: AlcanceSistema[];
  }> => {
    const response = await axiosInstance.get(`${IDENTIDAD_URL}/alcances/certifications/`, {
      params: { identity: identityId },
    });
    return response.data;
  },
};

// ==================== POLÍTICAS INTEGRALES ====================

export const politicasIntegralesApi = {
  getAll: async (filters?: PoliticaIntegralFilters): Promise<PaginatedResponse<PoliticaIntegral>> => {
    const response = await axiosInstance.get(`${IDENTIDAD_URL}/politicas-integrales/`, {
      params: filters,
    });
    return response.data;
  },

  getCurrent: async (identityId: number): Promise<PoliticaIntegral | null> => {
    try {
      const response = await axiosInstance.get(`${IDENTIDAD_URL}/politicas-integrales/current/`, {
        params: { identity: identityId },
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

  getById: async (id: number): Promise<PoliticaIntegral> => {
    const response = await axiosInstance.get(`${IDENTIDAD_URL}/politicas-integrales/${id}/`);
    return response.data;
  },

  getVersions: async (identityId: number): Promise<PoliticaIntegral[]> => {
    const response = await axiosInstance.get(`${IDENTIDAD_URL}/politicas-integrales/versions/`, {
      params: { identity: identityId },
    });
    return response.data;
  },

  create: async (data: CreatePoliticaIntegralDTO): Promise<PoliticaIntegral> => {
    const response = await axiosInstance.post(`${IDENTIDAD_URL}/politicas-integrales/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdatePoliticaIntegralDTO): Promise<PoliticaIntegral> => {
    const response = await axiosInstance.patch(`${IDENTIDAD_URL}/politicas-integrales/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${IDENTIDAD_URL}/politicas-integrales/${id}/`);
  },

  sign: async (id: number): Promise<{ detail: string; signed_by: string; signed_at: string; signature_hash: string }> => {
    const response = await axiosInstance.post(`${IDENTIDAD_URL}/politicas-integrales/${id}/sign/`, {
      confirm: true,
    });
    return response.data;
  },

  publish: async (id: number): Promise<{ detail: string; status: string; effective_date: string }> => {
    const response = await axiosInstance.post(`${IDENTIDAD_URL}/politicas-integrales/${id}/publish/`, {
      confirm: true,
    });
    return response.data;
  },

  reorder: async (newOrder: { id: number; orden: number }[]): Promise<void> => {
    await axiosInstance.post(`${IDENTIDAD_URL}/politicas-integrales/reorder/`, {
      items: newOrder,
    });
  },
};

// ==================== POLÍTICAS ESPECÍFICAS ====================

export const politicasEspecificasApi = {
  getAll: async (filters?: PoliticaEspecificaFilters): Promise<PaginatedResponse<PoliticaEspecifica>> => {
    const response = await axiosInstance.get(`${IDENTIDAD_URL}/politicas-especificas/`, {
      params: filters,
    });
    return response.data;
  },

  getByStandard: async (): Promise<Record<string, { label: string; total: number; vigentes: number; borradores: number }>> => {
    const response = await axiosInstance.get(`${IDENTIDAD_URL}/politicas-especificas/by-standard/`);
    return response.data;
  },

  getPendingReview: async (): Promise<{ count: number; policies: PoliticaEspecifica[] }> => {
    const response = await axiosInstance.get(`${IDENTIDAD_URL}/politicas-especificas/pending-review/`);
    return response.data;
  },

  getStats: async (): Promise<{
    total: number;
    by_status: Record<string, number>;
    pending_review: number;
  }> => {
    const response = await axiosInstance.get(`${IDENTIDAD_URL}/politicas-especificas/stats/`);
    return response.data;
  },

  getById: async (id: number): Promise<PoliticaEspecifica> => {
    const response = await axiosInstance.get(`${IDENTIDAD_URL}/politicas-especificas/${id}/`);
    return response.data;
  },

  create: async (data: CreatePoliticaEspecificaDTO): Promise<PoliticaEspecifica> => {
    const response = await axiosInstance.post(`${IDENTIDAD_URL}/politicas-especificas/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdatePoliticaEspecificaDTO): Promise<PoliticaEspecifica> => {
    const response = await axiosInstance.patch(`${IDENTIDAD_URL}/politicas-especificas/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${IDENTIDAD_URL}/politicas-especificas/${id}/`);
  },

  approve: async (id: number): Promise<{ detail: string; approved_by: string; approved_at: string; status: string }> => {
    const response = await axiosInstance.post(`${IDENTIDAD_URL}/politicas-especificas/${id}/approve/`, {
      confirm: true,
    });
    return response.data;
  },

  reorder: async (newOrder: { id: number; orden: number }[]): Promise<void> => {
    await axiosInstance.post(`${IDENTIDAD_URL}/politicas-especificas/reorder/`, {
      items: newOrder,
    });
  },
};
