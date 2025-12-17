/**
 * API Client para el módulo de Organización
 * Sistema de Gestión Grasas y Huesos del Norte
 */
import axiosInstance from '@/api/axios-config';

const BASE_URL = '/organizacion';

// ==================== TYPES ====================

export interface CategoriaDocumento {
  id: number;
  code: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  is_system: boolean;
  is_active: boolean;
  order: number;
}

export interface TipoDocumento {
  id: number;
  code: string;
  name: string;
  categoria: number;
  categoria_id?: number;
  categoria_code?: string;
  categoria_name?: string;
  categoria_color?: string;
  categoria_icon?: string;
  category_display?: string; // Deprecated
  description?: string;
  is_system: boolean;
  is_active: boolean;
  order: number;
  has_consecutivo: boolean;
  created_at: string;
  updated_at: string;
}

export interface TipoDocumentoList {
  id: number;
  code: string;
  name: string;
  categoria: number;
  categoria_code?: string;
  categoria_name?: string;
  categoria_color?: string;
  category_display?: string; // Deprecated
  is_active: boolean;
}

export interface CreateTipoDocumentoDTO {
  code: string;
  name: string;
  categoria: number;
  description?: string;
  is_active?: boolean;
  order?: number;
}

export interface UpdateTipoDocumentoDTO extends Partial<CreateTipoDocumentoDTO> {}

export interface ConsecutivoConfig {
  id: number;
  tipo_documento: number;
  tipo_documento_code: string;
  tipo_documento_name: string;
  prefix: string;
  suffix?: string;
  current_number: number;
  padding: number;
  include_year: boolean;
  include_month: boolean;
  include_day: boolean;
  separator: string;
  separator_display: string;
  area?: number;
  area_code?: string;
  area_name?: string;
  include_area: boolean;
  reset_yearly: boolean;
  reset_monthly: boolean;
  last_reset_date?: string;
  is_active: boolean;
  ejemplo_formato: string;
  created_at: string;
  updated_at: string;
}

export interface ConsecutivoConfigList {
  id: number;
  tipo_documento: number;
  tipo_documento_code: string;
  tipo_documento_name: string;
  prefix: string;
  current_number: number;
  area_code?: string;
  is_active: boolean;
  ejemplo: string;
}

export interface CreateConsecutivoDTO {
  tipo_documento: number;
  prefix: string;
  suffix?: string;
  padding?: number;
  include_year?: boolean;
  include_month?: boolean;
  include_day?: boolean;
  separator?: string;
  area?: number;
  include_area?: boolean;
  reset_yearly?: boolean;
  reset_monthly?: boolean;
  is_active?: boolean;
}

export interface UpdateConsecutivoDTO extends Partial<CreateConsecutivoDTO> {}

export interface GenerateConsecutivoResponse {
  consecutivo: string;
  current_number?: number;
}

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface TipoDocumentoFilters {
  categoria?: number;
  is_active?: boolean;
  is_system?: boolean;
  search?: string;
}

export interface ConsecutivoFilters {
  is_active?: boolean;
  tipo_documento__category?: string;
  area?: number;
  search?: string;
}

// ==================== AREA TYPES ====================

export interface Area {
  id: number;
  code: string;
  name: string;
  description?: string;
  parent?: number;
  parent_name?: string;
  cost_center?: string;
  manager?: number;
  manager_name?: string;
  is_active: boolean;
  order: number;
  children_count: number;
  full_path: string;
  level: number;
  created_at: string;
  updated_at: string;
}

export interface AreaList {
  id: number;
  code: string;
  name: string;
  parent?: number;
  parent_name?: string;
  is_active: boolean;
}

export interface CreateAreaDTO {
  code: string;
  name: string;
  description?: string;
  parent?: number;
  cost_center?: string;
  manager?: number;
  is_active?: boolean;
  order?: number;
}

export interface UpdateAreaDTO extends Partial<CreateAreaDTO> {}

export interface AreaFilters {
  is_active?: boolean;
  parent?: number;
  show_inactive?: boolean;
  search?: string;
}

// ==================== CATEGORIA DOCUMENTO API ====================

export const categoriasDocumentoApi = {
  getAll: async (): Promise<PaginatedResponse<CategoriaDocumento>> => {
    const response = await axiosInstance.get(`${BASE_URL}/categorias-documento/`);
    return response.data;
  },

  getById: async (id: number): Promise<CategoriaDocumento> => {
    const response = await axiosInstance.get(`${BASE_URL}/categorias-documento/${id}/`);
    return response.data;
  },

  getChoices: async (): Promise<SelectOption[]> => {
    const response = await axiosInstance.get(`${BASE_URL}/categorias-documento/choices/`);
    return response.data;
  },
};

// ==================== AREA API ====================

export const areasApi = {
  getAll: async (filters?: AreaFilters): Promise<PaginatedResponse<AreaList>> => {
    const response = await axiosInstance.get(`${BASE_URL}/areas/`, { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<Area> => {
    const response = await axiosInstance.get(`${BASE_URL}/areas/${id}/`);
    return response.data;
  },

  create: async (data: CreateAreaDTO): Promise<Area> => {
    const response = await axiosInstance.post(`${BASE_URL}/areas/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateAreaDTO): Promise<Area> => {
    const response = await axiosInstance.patch(`${BASE_URL}/areas/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/areas/${id}/`);
  },

  getTree: async (): Promise<Area[]> => {
    const response = await axiosInstance.get(`${BASE_URL}/areas/tree/`);
    return response.data;
  },

  getRoot: async (): Promise<Area[]> => {
    const response = await axiosInstance.get(`${BASE_URL}/areas/root/`);
    return response.data;
  },

  getChildren: async (id: number): Promise<Area[]> => {
    const response = await axiosInstance.get(`${BASE_URL}/areas/${id}/children/`);
    return response.data;
  },

  toggle: async (id: number, isActive?: boolean): Promise<{ id: number; is_active: boolean; message: string }> => {
    const response = await axiosInstance.post(`${BASE_URL}/areas/${id}/toggle/`, {
      is_active: isActive,
    });
    return response.data;
  },
};

// ==================== TIPOS DOCUMENTO API ====================

export const tiposDocumentoApi = {
  getAll: async (filters?: TipoDocumentoFilters): Promise<PaginatedResponse<TipoDocumentoList>> => {
    const response = await axiosInstance.get(`${BASE_URL}/tipos-documento/`, { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<TipoDocumento> => {
    const response = await axiosInstance.get(`${BASE_URL}/tipos-documento/${id}/`);
    return response.data;
  },

  create: async (data: CreateTipoDocumentoDTO): Promise<TipoDocumento> => {
    const response = await axiosInstance.post(`${BASE_URL}/tipos-documento/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateTipoDocumentoDTO): Promise<TipoDocumento> => {
    const response = await axiosInstance.patch(`${BASE_URL}/tipos-documento/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/tipos-documento/${id}/`);
  },

  getChoices: async (): Promise<{ categorias: SelectOption[] }> => {
    const response = await axiosInstance.get(`${BASE_URL}/tipos-documento/choices/`);
    return response.data;
  },
};

// ==================== CONSECUTIVOS API ====================

export const consecutivosApi = {
  getAll: async (filters?: ConsecutivoFilters): Promise<PaginatedResponse<ConsecutivoConfigList>> => {
    const response = await axiosInstance.get(`${BASE_URL}/consecutivos/`, { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<ConsecutivoConfig> => {
    const response = await axiosInstance.get(`${BASE_URL}/consecutivos/${id}/`);
    return response.data;
  },

  create: async (data: CreateConsecutivoDTO): Promise<ConsecutivoConfig> => {
    const response = await axiosInstance.post(`${BASE_URL}/consecutivos/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateConsecutivoDTO): Promise<ConsecutivoConfig> => {
    const response = await axiosInstance.patch(`${BASE_URL}/consecutivos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/consecutivos/${id}/`);
  },

  getChoices: async (): Promise<{
    separators: SelectOption[];
    tipos_documento: SelectOption[];
    areas: SelectOption[];
  }> => {
    const response = await axiosInstance.get(`${BASE_URL}/consecutivos/choices/`);
    return response.data;
  },

  generate: async (id: number): Promise<GenerateConsecutivoResponse> => {
    const response = await axiosInstance.post(`${BASE_URL}/consecutivos/${id}/generate/`);
    return response.data;
  },

  generateByType: async (tipoDocumentoCode: string, areaCode?: string): Promise<GenerateConsecutivoResponse> => {
    const response = await axiosInstance.post(`${BASE_URL}/consecutivos/generate_by_type/`, {
      tipo_documento_code: tipoDocumentoCode,
      area_code: areaCode,
    });
    return response.data;
  },
};
