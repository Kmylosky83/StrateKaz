/**
 * API Client para Partes Interesadas
 * Sistema de Gestión StrateKaz
 */
import axiosInstance from '@/api/axios-config';
import type {
  TipoParteInteresada,
  CreateTipoParteInteresadaDTO,
  UpdateTipoParteInteresadaDTO,
  ParteInteresada,
  CreateParteInteresadaDTO,
  UpdateParteInteresadaDTO,
  ParteInteresadaFilters,
  PaginatedResponse,
} from '../types';

const BASE_URL = '/cumplimiento/partes-interesadas';

// ==================== TIPOS DE PARTE INTERESADA ====================

export const tiposParteInteresadaApi = {
  getAll: async (): Promise<PaginatedResponse<TipoParteInteresada>> => {
    const response = await axiosInstance.get(`${BASE_URL}/tipos/`);
    return response.data;
  },

  getById: async (id: number): Promise<TipoParteInteresada> => {
    const response = await axiosInstance.get(`${BASE_URL}/tipos/${id}/`);
    return response.data;
  },

  create: async (data: CreateTipoParteInteresadaDTO): Promise<TipoParteInteresada> => {
    const response = await axiosInstance.post(`${BASE_URL}/tipos/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateTipoParteInteresadaDTO): Promise<TipoParteInteresada> => {
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

// ==================== PARTES INTERESADAS ====================

export const partesInteresadasApi = {
  getAll: async (filters?: ParteInteresadaFilters): Promise<PaginatedResponse<ParteInteresada>> => {
    const response = await axiosInstance.get(`${BASE_URL}/partes/`, { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<ParteInteresada> => {
    const response = await axiosInstance.get(`${BASE_URL}/partes/${id}/`);
    return response.data;
  },

  create: async (data: CreateParteInteresadaDTO): Promise<ParteInteresada> => {
    const response = await axiosInstance.post(`${BASE_URL}/partes/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateParteInteresadaDTO): Promise<ParteInteresada> => {
    const response = await axiosInstance.patch(`${BASE_URL}/partes/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/partes/${id}/`);
  },

  getMatrizInfluenciaInteres: async (empresaId: number): Promise<{
    alta_alto: ParteInteresada[];
    alta_medio: ParteInteresada[];
    alta_bajo: ParteInteresada[];
    media_alto: ParteInteresada[];
    media_medio: ParteInteresada[];
    media_bajo: ParteInteresada[];
    baja_alto: ParteInteresada[];
    baja_medio: ParteInteresada[];
    baja_bajo: ParteInteresada[];
  }> => {
    const response = await axiosInstance.get(`${BASE_URL}/partes/matriz-influencia-interes/`, {
      params: { empresa: empresaId },
    });
    return response.data;
  },
};
