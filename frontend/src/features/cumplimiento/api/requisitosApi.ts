/**
 * API Client para Requisitos Legales
 * Sistema de Gestión StrateKaz
 */
import axiosInstance from '@/api/axios-config';
import type {
  TipoRequisito,
  CreateTipoRequisitoDTO,
  UpdateTipoRequisitoDTO,
  RequisitoLegal,
  CreateRequisitoLegalDTO,
  UpdateRequisitoLegalDTO,
  RequisitoLegalFilters,
  EmpresaRequisito,
  CreateEmpresaRequisitoDTO,
  UpdateEmpresaRequisitoDTO,
  EmpresaRequisitoFilters,
  PaginatedResponse,
} from '../types';

const BASE_URL = '/motor_cumplimiento/requisitos-legales';

// ==================== TIPOS DE REQUISITO ====================

export const tiposRequisitoApi = {
  getAll: async (): Promise<PaginatedResponse<TipoRequisito>> => {
    const response = await axiosInstance.get(`${BASE_URL}/tipos/`);
    return response.data;
  },

  getById: async (id: number): Promise<TipoRequisito> => {
    const response = await axiosInstance.get(`${BASE_URL}/tipos/${id}/`);
    return response.data;
  },

  create: async (data: CreateTipoRequisitoDTO): Promise<TipoRequisito> => {
    const response = await axiosInstance.post(`${BASE_URL}/tipos/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateTipoRequisitoDTO): Promise<TipoRequisito> => {
    const response = await axiosInstance.patch(`${BASE_URL}/tipos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/tipos/${id}/`);
  },
};

// ==================== REQUISITOS LEGALES ====================

export const requisitosLegalesApi = {
  getAll: async (filters?: RequisitoLegalFilters): Promise<PaginatedResponse<RequisitoLegal>> => {
    const response = await axiosInstance.get(`${BASE_URL}/requisitos/`, { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<RequisitoLegal> => {
    const response = await axiosInstance.get(`${BASE_URL}/requisitos/${id}/`);
    return response.data;
  },

  create: async (data: CreateRequisitoLegalDTO): Promise<RequisitoLegal> => {
    const response = await axiosInstance.post(`${BASE_URL}/requisitos/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateRequisitoLegalDTO): Promise<RequisitoLegal> => {
    const response = await axiosInstance.patch(`${BASE_URL}/requisitos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/requisitos/${id}/`);
  },
};

// ==================== EMPRESA-REQUISITO ====================

export const empresaRequisitosApi = {
  getAll: async (filters?: EmpresaRequisitoFilters): Promise<PaginatedResponse<EmpresaRequisito>> => {
    const response = await axiosInstance.get(`${BASE_URL}/empresa-requisitos/`, { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<EmpresaRequisito> => {
    const response = await axiosInstance.get(`${BASE_URL}/empresa-requisitos/${id}/`);
    return response.data;
  },

  create: async (data: CreateEmpresaRequisitoDTO): Promise<EmpresaRequisito> => {
    const isFormData = data.documento_soporte instanceof File;

    let formData: FormData | CreateEmpresaRequisitoDTO = data;

    if (isFormData && data.documento_soporte) {
      formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof File) {
            (formData as FormData).append(key, value);
          } else {
            (formData as FormData).append(key, String(value));
          }
        }
      });
    }

    const response = await axiosInstance.post(`${BASE_URL}/empresa-requisitos/`, formData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data;
  },

  update: async (id: number, data: UpdateEmpresaRequisitoDTO): Promise<EmpresaRequisito> => {
    const isFormData = data.documento_soporte instanceof File;

    let formData: FormData | UpdateEmpresaRequisitoDTO = data;

    if (isFormData && data.documento_soporte) {
      formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof File) {
            (formData as FormData).append(key, value);
          } else {
            (formData as FormData).append(key, String(value));
          }
        }
      });
    }

    const response = await axiosInstance.patch(`${BASE_URL}/empresa-requisitos/${id}/`, formData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/empresa-requisitos/${id}/`);
  },

  getVencimientos: async (empresaId: number, dias?: number): Promise<EmpresaRequisito[]> => {
    const response = await axiosInstance.get(`${BASE_URL}/empresa-requisitos/vencimientos/`, {
      params: { empresa: empresaId, dias },
    });
    return response.data;
  },

  renovar: async (id: number, data: CreateEmpresaRequisitoDTO): Promise<EmpresaRequisito> => {
    const response = await axiosInstance.post(`${BASE_URL}/empresa-requisitos/${id}/renovar/`, data);
    return response.data;
  },
};
