/**
 * API Client para Requisitos Legales
 * Sistema de Gestión StrateKaz
 */
import axiosInstance from '@/api/axios-config';
import type {
  TipoRequisito,
  TipoRequisitoCreate,
  RequisitoLegal,
  RequisitoLegalCreate,
  EmpresaRequisito,
  EmpresaRequisitoCreate,
  PaginatedResponse,
} from '../types';

// Local filter types
interface RequisitoLegalFilters {
  tipo?: number;
  aplica_sst?: boolean;
  aplica_ambiental?: boolean;
  aplica_calidad?: boolean;
  aplica_pesv?: boolean;
  es_obligatorio?: boolean;
  search?: string;
}

interface EmpresaRequisitoFilters {
  empresa_id?: number;
  requisito?: number;
  estado?: string;
  responsable?: number;
  fecha_vencimiento_desde?: string;
  fecha_vencimiento_hasta?: string;
}

const BASE_URL = '/cumplimiento/requisitos-legales';

// ==================== TIPOS DE REQUISITO ====================

export const tiposRequisitoApi = {
  getAll: async (): Promise<PaginatedResponse<TipoRequisito>> => {
    const response = await axiosInstance.get(`${BASE_URL}/tipos-requisito/`);
    return response.data;
  },

  getById: async (id: number): Promise<TipoRequisito> => {
    const response = await axiosInstance.get(`${BASE_URL}/tipos-requisito/${id}/`);
    return response.data;
  },

  create: async (data: TipoRequisitoCreate): Promise<TipoRequisito> => {
    const response = await axiosInstance.post(`${BASE_URL}/tipos-requisito/`, data);
    return response.data;
  },

  update: async (id: number, data: Partial<TipoRequisitoCreate>): Promise<TipoRequisito> => {
    const response = await axiosInstance.patch(`${BASE_URL}/tipos-requisito/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/tipos-requisito/${id}/`);
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

  create: async (data: RequisitoLegalCreate): Promise<RequisitoLegal> => {
    const response = await axiosInstance.post(`${BASE_URL}/requisitos/`, data);
    return response.data;
  },

  update: async (id: number, data: Partial<RequisitoLegalCreate>): Promise<RequisitoLegal> => {
    const response = await axiosInstance.patch(`${BASE_URL}/requisitos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/requisitos/${id}/`);
  },
};

// ==================== EMPRESA-REQUISITO ====================

export const empresaRequisitosApi = {
  getAll: async (
    filters?: EmpresaRequisitoFilters
  ): Promise<PaginatedResponse<EmpresaRequisito>> => {
    const response = await axiosInstance.get(`${BASE_URL}/empresa-requisitos/`, {
      params: filters,
    });
    return response.data;
  },

  getById: async (id: number): Promise<EmpresaRequisito> => {
    const response = await axiosInstance.get(`${BASE_URL}/empresa-requisitos/${id}/`);
    return response.data;
  },

  create: async (data: EmpresaRequisitoCreate): Promise<EmpresaRequisito> => {
    const isFormData = data.documento_soporte instanceof File;

    let formData: FormData | EmpresaRequisitoCreate = data;

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

  update: async (id: number, data: Partial<EmpresaRequisitoCreate>): Promise<EmpresaRequisito> => {
    const isFormData = data.documento_soporte instanceof File;

    let formData: FormData | Partial<EmpresaRequisitoCreate> = data;

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

  getPorVencer: async (empresaId: number, dias?: number): Promise<EmpresaRequisito[]> => {
    const response = await axiosInstance.get(`${BASE_URL}/empresa-requisitos/por-vencer/`, {
      params: { empresa: empresaId, dias },
    });
    return response.data;
  },

  renovar: async (id: number, data: EmpresaRequisitoCreate): Promise<EmpresaRequisito> => {
    const response = await axiosInstance.post(
      `${BASE_URL}/empresa-requisitos/${id}/renovar/`,
      data
    );
    return response.data;
  },
};
