/**
 * API Client para el módulo de Organización
 * Sistema de Gestión StrateKaz
 */
import axiosInstance from '@/api/axios-config';

const BASE_URL = '/organizacion';

// ==================== TYPES ====================

export interface SelectOption {
  value: string | number;
  label: string;
}

// PaginatedResponse: importar desde '@/types'
import type { PaginatedResponse } from '@/types';

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
  icon: string;
  color: string;
  is_active: boolean;
  orden: number;
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
  manager?: number;
  manager_name?: string;
  icon: string;
  color: string;
  is_active: boolean;
}

export interface CreateAreaDTO {
  code: string;
  name: string;
  description?: string;
  parent?: number;
  cost_center?: string;
  manager?: number;
  icon?: string;
  color?: string;
  is_active?: boolean;
  orden?: number;
}

export type UpdateAreaDTO = Partial<CreateAreaDTO>;

export interface AreaFilters {
  is_active?: boolean;
  parent?: number;
  include_inactive?: boolean; // Backend usa 'include_inactive', no 'show_inactive'
  search?: string;
}

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

  toggle: async (
    id: number,
    isActive?: boolean
  ): Promise<{ id: number; is_active: boolean; message: string }> => {
    const response = await axiosInstance.post(`${BASE_URL}/areas/${id}/toggle-active/`, {
      is_active: isActive,
    });
    return response.data;
  },
};
