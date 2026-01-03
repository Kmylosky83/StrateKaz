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
  CategoriaDocumento,
  CreateCategoriaDocumentoDTO,
  UpdateCategoriaDocumentoDTO,
  CategoriaDocumentoFilters,
  TipoDocumento,
  CreateTipoDocumentoDTO,
  UpdateTipoDocumentoDTO,
  TipoDocumentoFilters,
  ConsecutivoConfig,
  CreateConsecutivoConfigDTO,
  UpdateConsecutivoConfigDTO,
  GenerateConsecutivoDTO,
  GenerateConsecutivoResponse,
  StrategicStats,
  PaginatedResponse,
  ObjectiveFilters,
  ModuleFilters,
  ConsecutivoFilters,
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
const ORGANIZACION_URL = '/organizacion';
const CONFIGURACION_URL = '/configuracion';

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

  signPolicy: async (id: number): Promise<CorporateIdentity> => {
    const response = await axiosInstance.post(`${IDENTIDAD_URL}/identidad/${id}/sign-policy/`, {
      confirm: true,
    });
    return response.data.identity;
  },

  addValue: async (id: number, data: CreateCorporateValueDTO): Promise<CorporateValue> => {
    const response = await axiosInstance.post(
      `${IDENTIDAD_URL}/identidad/${id}/add-value/`,
      data
    );
    return response.data;
  },

  removeValue: async (identityId: number, valueId: number): Promise<void> => {
    await axiosInstance.delete(
      `${IDENTIDAD_URL}/identidad/${identityId}/remove-value/${valueId}/`
    );
  },
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

// ==================== CATEGORIA DOCUMENTO ====================

export const categoriasDocumentoApi = {
  getAll: async (filters?: CategoriaDocumentoFilters): Promise<PaginatedResponse<CategoriaDocumento>> => {
    const response = await axiosInstance.get(`${ORGANIZACION_URL}/categorias-documento/`, { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<CategoriaDocumento> => {
    const response = await axiosInstance.get(`${ORGANIZACION_URL}/categorias-documento/${id}/`);
    return response.data;
  },

  create: async (data: CreateCategoriaDocumentoDTO): Promise<CategoriaDocumento> => {
    const response = await axiosInstance.post(`${ORGANIZACION_URL}/categorias-documento/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateCategoriaDocumentoDTO): Promise<CategoriaDocumento> => {
    const response = await axiosInstance.patch(`${ORGANIZACION_URL}/categorias-documento/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${ORGANIZACION_URL}/categorias-documento/${id}/`);
  },

  getChoices: async (): Promise<SelectOption[]> => {
    const response = await axiosInstance.get(`${ORGANIZACION_URL}/categorias-documento/choices/`);
    return response.data;
  },
};

// ==================== TIPO DOCUMENTO ====================

export const tiposDocumentoApi = {
  getAll: async (filters?: TipoDocumentoFilters): Promise<PaginatedResponse<TipoDocumento>> => {
    const response = await axiosInstance.get(`${ORGANIZACION_URL}/tipos-documento/`, { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<TipoDocumento> => {
    const response = await axiosInstance.get(`${ORGANIZACION_URL}/tipos-documento/${id}/`);
    return response.data;
  },

  create: async (data: CreateTipoDocumentoDTO): Promise<TipoDocumento> => {
    const response = await axiosInstance.post(`${ORGANIZACION_URL}/tipos-documento/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateTipoDocumentoDTO): Promise<TipoDocumento> => {
    const response = await axiosInstance.patch(`${ORGANIZACION_URL}/tipos-documento/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${ORGANIZACION_URL}/tipos-documento/${id}/`);
  },

  getSistema: async (): Promise<TipoDocumento[]> => {
    const response = await axiosInstance.get(`${ORGANIZACION_URL}/tipos-documento/sistema/`);
    return response.data;
  },

  getCustom: async (): Promise<TipoDocumento[]> => {
    const response = await axiosInstance.get(`${ORGANIZACION_URL}/tipos-documento/custom/`);
    return response.data;
  },

  getChoices: async (): Promise<{
    categorias: SelectOption[];
  }> => {
    const response = await axiosInstance.get(`${ORGANIZACION_URL}/tipos-documento/choices/`);
    return response.data;
  },
};

// ==================== CONSECUTIVO CONFIG ====================

export const consecutivosApi = {
  getAll: async (filters?: ConsecutivoFilters): Promise<PaginatedResponse<ConsecutivoConfig>> => {
    const response = await axiosInstance.get(`${ORGANIZACION_URL}/consecutivos/`, { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<ConsecutivoConfig> => {
    const response = await axiosInstance.get(`${ORGANIZACION_URL}/consecutivos/${id}/`);
    return response.data;
  },

  create: async (data: CreateConsecutivoConfigDTO): Promise<ConsecutivoConfig> => {
    const response = await axiosInstance.post(`${ORGANIZACION_URL}/consecutivos/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateConsecutivoConfigDTO): Promise<ConsecutivoConfig> => {
    const response = await axiosInstance.patch(`${ORGANIZACION_URL}/consecutivos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${ORGANIZACION_URL}/consecutivos/${id}/`);
  },

  generate: async (data: GenerateConsecutivoDTO): Promise<GenerateConsecutivoResponse> => {
    const response = await axiosInstance.post(`${ORGANIZACION_URL}/consecutivos/generate/`, data);
    return response.data;
  },

  getChoices: async (): Promise<{
    tipos_documento: SelectOption[];
    separators: SelectOption[];
  }> => {
    const response = await axiosInstance.get(`${ORGANIZACION_URL}/consecutivos/choices/`);
    return response.data;
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
