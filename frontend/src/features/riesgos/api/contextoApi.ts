/**
 * API Client para Contexto Organizacional
 * Sistema de Gestión StrateKaz
 */
import { apiClient } from '@/lib/api-client';
import type {
  AnalisisDOFA,
  FactorDOFA,
  EstrategiaTOWS,
  AnalisisPESTEL,
  FactorPESTEL,
  AnalisisPorter,
  FuerzaPorter,
  CreateAnalisisDOFADTO,
  UpdateAnalisisDOFADTO,
  CreateFactorDOFADTO,
  UpdateFactorDOFADTO,
  CreateEstrategiaTOWSDTO,
  UpdateEstrategiaTOWSDTO,
  CreateAnalisisPESTELDTO,
  UpdateAnalisisPESTELDTO,
  CreateFactorPESTELDTO,
  UpdateFactorPESTELDTO,
  CreateAnalisisPorterDTO,
  UpdateAnalisisPorterDTO,
  CreateFuerzaPorterDTO,
  UpdateFuerzaPorterDTO,
  PaginatedResponse,
} from '../types';

const BASE_URL = '/gestion-estrategica/contexto';

// ==================== ANÁLISIS DOFA ====================

export const dofaApi = {
  // Análisis DOFA
  getAllAnalisis: async (): Promise<PaginatedResponse<AnalisisDOFA>> => {
    const response = await apiClient.get(`${BASE_URL}/analisis-dofa/`);
    return response.data;
  },

  getAnalisisById: async (id: number): Promise<AnalisisDOFA> => {
    const response = await apiClient.get(`${BASE_URL}/analisis-dofa/${id}/`);
    return response.data;
  },

  createAnalisis: async (data: CreateAnalisisDOFADTO): Promise<AnalisisDOFA> => {
    const response = await apiClient.post(`${BASE_URL}/analisis-dofa/`, data);
    return response.data;
  },

  updateAnalisis: async (id: number, data: UpdateAnalisisDOFADTO): Promise<AnalisisDOFA> => {
    const response = await apiClient.patch(`${BASE_URL}/analisis-dofa/${id}/`, data);
    return response.data;
  },

  deleteAnalisis: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/analisis-dofa/${id}/`);
  },

  // Factores DOFA
  getFactores: async (analisisId: number): Promise<FactorDOFA[]> => {
    const response = await apiClient.get(`${BASE_URL}/factores-dofa/?analisis=${analisisId}`);
    return response.data.results || response.data;
  },

  createFactor: async (data: CreateFactorDOFADTO): Promise<FactorDOFA> => {
    const response = await apiClient.post(`${BASE_URL}/factores-dofa/`, data);
    return response.data;
  },

  updateFactor: async (id: number, data: UpdateFactorDOFADTO): Promise<FactorDOFA> => {
    const response = await apiClient.patch(`${BASE_URL}/factores-dofa/${id}/`, data);
    return response.data;
  },

  deleteFactor: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/factores-dofa/${id}/`);
  },

  // Estrategias TOWS
  getEstrategias: async (analisisId: number): Promise<EstrategiaTOWS[]> => {
    const response = await apiClient.get(`${BASE_URL}/estrategias-dofa/?analisis=${analisisId}`);
    return response.data.results || response.data;
  },

  createEstrategia: async (data: CreateEstrategiaTOWSDTO): Promise<EstrategiaTOWS> => {
    const response = await apiClient.post(`${BASE_URL}/estrategias-dofa/`, data);
    return response.data;
  },

  updateEstrategia: async (id: number, data: UpdateEstrategiaTOWSDTO): Promise<EstrategiaTOWS> => {
    const response = await apiClient.patch(`${BASE_URL}/estrategias-dofa/${id}/`, data);
    return response.data;
  },

  deleteEstrategia: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/estrategias-dofa/${id}/`);
  },
};

// ==================== ANÁLISIS PESTEL ====================

export const pestelApi = {
  // Análisis PESTEL
  getAllAnalisis: async (): Promise<PaginatedResponse<AnalisisPESTEL>> => {
    const response = await apiClient.get(`${BASE_URL}/analisis-pestel/`);
    return response.data;
  },

  getAnalisisById: async (id: number): Promise<AnalisisPESTEL> => {
    const response = await apiClient.get(`${BASE_URL}/analisis-pestel/${id}/`);
    return response.data;
  },

  createAnalisis: async (data: CreateAnalisisPESTELDTO): Promise<AnalisisPESTEL> => {
    const response = await apiClient.post(`${BASE_URL}/analisis-pestel/`, data);
    return response.data;
  },

  updateAnalisis: async (id: number, data: UpdateAnalisisPESTELDTO): Promise<AnalisisPESTEL> => {
    const response = await apiClient.patch(`${BASE_URL}/analisis-pestel/${id}/`, data);
    return response.data;
  },

  deleteAnalisis: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/analisis-pestel/${id}/`);
  },

  // Factores PESTEL
  getFactores: async (analisisId: number): Promise<FactorPESTEL[]> => {
    const response = await apiClient.get(`${BASE_URL}/factores-pestel/?analisis=${analisisId}`);
    return response.data.results || response.data;
  },

  createFactor: async (data: CreateFactorPESTELDTO): Promise<FactorPESTEL> => {
    const response = await apiClient.post(`${BASE_URL}/factores-pestel/`, data);
    return response.data;
  },

  updateFactor: async (id: number, data: UpdateFactorPESTELDTO): Promise<FactorPESTEL> => {
    const response = await apiClient.patch(`${BASE_URL}/factores-pestel/${id}/`, data);
    return response.data;
  },

  deleteFactor: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/factores-pestel/${id}/`);
  },
};

// ==================== ANÁLISIS PORTER ====================

export const porterApi = {
  // Análisis Porter
  getAllAnalisis: async (): Promise<PaginatedResponse<AnalisisPorter>> => {
    const response = await apiClient.get(`${BASE_URL}/analisis-porter/`);
    return response.data;
  },

  getAnalisisById: async (id: number): Promise<AnalisisPorter> => {
    const response = await apiClient.get(`${BASE_URL}/analisis-porter/${id}/`);
    return response.data;
  },

  createAnalisis: async (data: CreateAnalisisPorterDTO): Promise<AnalisisPorter> => {
    const response = await apiClient.post(`${BASE_URL}/analisis-porter/`, data);
    return response.data;
  },

  updateAnalisis: async (id: number, data: UpdateAnalisisPorterDTO): Promise<AnalisisPorter> => {
    const response = await apiClient.patch(`${BASE_URL}/analisis-porter/${id}/`, data);
    return response.data;
  },

  deleteAnalisis: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/analisis-porter/${id}/`);
  },

  // Fuerzas Porter
  getFuerzas: async (analisisId: number): Promise<FuerzaPorter[]> => {
    const response = await apiClient.get(`${BASE_URL}/fuerzas-porter/?analisis=${analisisId}`);
    return response.data.results || response.data;
  },

  createFuerza: async (data: CreateFuerzaPorterDTO): Promise<FuerzaPorter> => {
    const response = await apiClient.post(`${BASE_URL}/fuerzas-porter/`, data);
    return response.data;
  },

  updateFuerza: async (id: number, data: UpdateFuerzaPorterDTO): Promise<FuerzaPorter> => {
    const response = await apiClient.patch(`${BASE_URL}/fuerzas-porter/${id}/`, data);
    return response.data;
  },

  deleteFuerza: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/fuerzas-porter/${id}/`);
  },
};
