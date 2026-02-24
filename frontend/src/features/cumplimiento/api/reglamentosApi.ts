/**
 * API Client para Reglamentos Internos
 * Sistema de Gestión StrateKaz
 */
import axiosInstance from '@/api/axios-config';
import type {
  TipoReglamento,
  CreateTipoReglamentoDTO,
  UpdateTipoReglamentoDTO,
  Reglamento,
  CreateReglamentoDTO,
  UpdateReglamentoDTO,
  ReglamentoFilters,
  PaginatedResponse,
} from '../types';

const BASE_URL = '/cumplimiento/reglamentos-internos';

// ==================== TIPOS DE REGLAMENTO ====================

export const tiposReglamentoApi = {
  getAll: async (): Promise<PaginatedResponse<TipoReglamento>> => {
    const response = await axiosInstance.get(`${BASE_URL}/tipos/`);
    return response.data;
  },

  getById: async (id: number): Promise<TipoReglamento> => {
    const response = await axiosInstance.get(`${BASE_URL}/tipos/${id}/`);
    return response.data;
  },

  create: async (data: CreateTipoReglamentoDTO): Promise<TipoReglamento> => {
    const response = await axiosInstance.post(`${BASE_URL}/tipos/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateTipoReglamentoDTO): Promise<TipoReglamento> => {
    const response = await axiosInstance.patch(`${BASE_URL}/tipos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/tipos/${id}/`);
  },

  reorder: async (items: { id: number; orden: number }[]): Promise<void> => {
    await axiosInstance.post(`${BASE_URL}/tipos/reorder/`, { items });
  },
};

// ==================== REGLAMENTOS ====================

export const reglamentosApi = {
  getAll: async (filters?: ReglamentoFilters): Promise<PaginatedResponse<Reglamento>> => {
    const response = await axiosInstance.get(`${BASE_URL}/reglamentos/`, { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<Reglamento> => {
    const response = await axiosInstance.get(`${BASE_URL}/reglamentos/${id}/`);
    return response.data;
  },

  create: async (data: CreateReglamentoDTO): Promise<Reglamento> => {
    const isFormData = data.documento instanceof File;

    let formData: FormData | CreateReglamentoDTO = data;

    if (isFormData && data.documento) {
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

    const response = await axiosInstance.post(`${BASE_URL}/reglamentos/`, formData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data;
  },

  update: async (id: number, data: UpdateReglamentoDTO): Promise<Reglamento> => {
    const isFormData = data.documento instanceof File;

    let formData: FormData | UpdateReglamentoDTO = data;

    if (isFormData && data.documento) {
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

    const response = await axiosInstance.patch(`${BASE_URL}/reglamentos/${id}/`, formData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/reglamentos/${id}/`);
  },

  aprobar: async (id: number, aprobado_por: number): Promise<Reglamento> => {
    const response = await axiosInstance.post(`${BASE_URL}/reglamentos/${id}/aprobar/`, {
      aprobado_por,
    });
    return response.data;
  },

  publicar: async (id: number): Promise<Reglamento> => {
    const response = await axiosInstance.post(`${BASE_URL}/reglamentos/${id}/publicar/`);
    return response.data;
  },

  marcarObsoleto: async (id: number, observaciones?: string): Promise<Reglamento> => {
    const response = await axiosInstance.post(`${BASE_URL}/reglamentos/${id}/marcar-obsoleto/`, {
      observaciones,
    });
    return response.data;
  },

  reorder: async (empresaId: number, items: { id: number; orden: number }[]): Promise<void> => {
    await axiosInstance.post(`${BASE_URL}/reglamentos/reorder/`, {
      empresa: empresaId,
      items,
    });
  },
};
