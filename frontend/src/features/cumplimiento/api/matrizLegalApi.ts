/**
 * API Client para Matriz Legal
 * Sistema de Gestión StrateKaz
 */
import axiosInstance from '@/api/axios-config';
import type {
  TipoNorma,
  CreateTipoNormaDTO,
  UpdateTipoNormaDTO,
  NormaLegal,
  CreateNormaLegalDTO,
  UpdateNormaLegalDTO,
  NormaLegalFilters,
  EmpresaNorma,
  CreateEmpresaNormaDTO,
  UpdateEmpresaNormaDTO,
  EmpresaNormaFilters,
  PaginatedResponse,
} from '../types';

const BASE_URL = '/motor_cumplimiento/matriz-legal';

// ==================== TIPOS DE NORMA ====================

export const tiposNormaApi = {
  getAll: async (): Promise<PaginatedResponse<TipoNorma>> => {
    const response = await axiosInstance.get(`${BASE_URL}/tipos-norma/`);
    return response.data;
  },

  getById: async (id: number): Promise<TipoNorma> => {
    const response = await axiosInstance.get(`${BASE_URL}/tipos-norma/${id}/`);
    return response.data;
  },

  create: async (data: CreateTipoNormaDTO): Promise<TipoNorma> => {
    const response = await axiosInstance.post(`${BASE_URL}/tipos-norma/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateTipoNormaDTO): Promise<TipoNorma> => {
    const response = await axiosInstance.patch(`${BASE_URL}/tipos-norma/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/tipos-norma/${id}/`);
  },
};

// ==================== NORMAS LEGALES ====================

export const normasLegalesApi = {
  getAll: async (filters?: NormaLegalFilters): Promise<PaginatedResponse<NormaLegal>> => {
    const response = await axiosInstance.get(`${BASE_URL}/normas/`, { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<NormaLegal> => {
    const response = await axiosInstance.get(`${BASE_URL}/normas/${id}/`);
    return response.data;
  },

  create: async (data: CreateNormaLegalDTO): Promise<NormaLegal> => {
    const response = await axiosInstance.post(`${BASE_URL}/normas/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateNormaLegalDTO): Promise<NormaLegal> => {
    const response = await axiosInstance.patch(`${BASE_URL}/normas/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/normas/${id}/`);
  },

  getBySistema: async (sistema: 'sst' | 'ambiental' | 'calidad' | 'pesv'): Promise<NormaLegal[]> => {
    const response = await axiosInstance.get(`${BASE_URL}/normas/by-sistema/`, {
      params: { sistema },
    });
    return response.data;
  },
};

// ==================== EMPRESA-NORMA ====================

export const empresaNormasApi = {
  getAll: async (filters?: EmpresaNormaFilters): Promise<PaginatedResponse<EmpresaNorma>> => {
    const response = await axiosInstance.get(`${BASE_URL}/empresa-normas/`, { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<EmpresaNorma> => {
    const response = await axiosInstance.get(`${BASE_URL}/empresa-normas/${id}/`);
    return response.data;
  },

  create: async (data: CreateEmpresaNormaDTO): Promise<EmpresaNorma> => {
    const response = await axiosInstance.post(`${BASE_URL}/empresa-normas/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateEmpresaNormaDTO): Promise<EmpresaNorma> => {
    const response = await axiosInstance.patch(`${BASE_URL}/empresa-normas/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/empresa-normas/${id}/`);
  },

  evaluarCumplimiento: async (
    id: number,
    data: { porcentaje_cumplimiento: number; fecha_evaluacion: string; observaciones?: string }
  ): Promise<EmpresaNorma> => {
    const response = await axiosInstance.post(`${BASE_URL}/empresa-normas/${id}/evaluar/`, data);
    return response.data;
  },
};
