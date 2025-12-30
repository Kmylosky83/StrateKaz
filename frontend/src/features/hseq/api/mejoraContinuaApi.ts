/**
 * API Client para Mejora Continua - HSEQ Management
 * Sistema de Gestión Grasas y Huesos del Norte
 *
 * Incluye:
 * - Programa de Auditorías
 * - Auditorías Internas/Externas
 * - Hallazgos (No Conformidades, Observaciones, Oportunidades de Mejora)
 * - Evaluación de Cumplimiento Legal
 */
import { apiClient } from '@/lib/api-client';
import type {
  ProgramaAuditoria,
  ProgramaAuditoriaList,
  Auditoria,
  AuditoriaList,
  Hallazgo,
  HallazgoList,
  EvaluacionCumplimiento,
  EvaluacionCumplimientoList,
  CreateProgramaAuditoriaDTO,
  UpdateProgramaAuditoriaDTO,
  CreateAuditoriaDTO,
  UpdateAuditoriaDTO,
  CreateHallazgoDTO,
  UpdateHallazgoDTO,
  CreateEvaluacionCumplimientoDTO,
  UpdateEvaluacionCumplimientoDTO,
  PaginatedResponse,
} from '../types/mejora-continua.types';

const BASE_URL = '/api/hseq/mejora-continua';

// ==================== PROGRAMA DE AUDITORÍA ====================

export const programaAuditoriaApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    año?: number;
    estado?: string;
  }): Promise<PaginatedResponse<ProgramaAuditoriaList>> => {
    const response = await apiClient.get(`${BASE_URL}/programas-auditoria/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<ProgramaAuditoria> => {
    const response = await apiClient.get(`${BASE_URL}/programas-auditoria/${id}/`);
    return response.data;
  },

  create: async (data: CreateProgramaAuditoriaDTO): Promise<ProgramaAuditoria> => {
    const response = await apiClient.post(`${BASE_URL}/programas-auditoria/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateProgramaAuditoriaDTO): Promise<ProgramaAuditoria> => {
    const response = await apiClient.patch(`${BASE_URL}/programas-auditoria/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/programas-auditoria/${id}/`);
  },

  aprobar: async (id: number): Promise<ProgramaAuditoria> => {
    const response = await apiClient.post(`${BASE_URL}/programas-auditoria/${id}/aprobar/`);
    return response.data;
  },

  iniciar: async (id: number): Promise<ProgramaAuditoria> => {
    const response = await apiClient.post(`${BASE_URL}/programas-auditoria/${id}/iniciar/`);
    return response.data;
  },

  completar: async (id: number): Promise<ProgramaAuditoria> => {
    const response = await apiClient.post(`${BASE_URL}/programas-auditoria/${id}/completar/`);
    return response.data;
  },
};

// ==================== AUDITORÍA ====================

export const auditoriaApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    programa?: number;
    tipo?: string;
    norma_principal?: string;
    estado?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
  }): Promise<PaginatedResponse<AuditoriaList>> => {
    const response = await apiClient.get(`${BASE_URL}/auditorias/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<Auditoria> => {
    const response = await apiClient.get(`${BASE_URL}/auditorias/${id}/`);
    return response.data;
  },

  create: async (data: CreateAuditoriaDTO): Promise<Auditoria> => {
    const response = await apiClient.post(`${BASE_URL}/auditorias/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateAuditoriaDTO): Promise<Auditoria> => {
    const response = await apiClient.patch(`${BASE_URL}/auditorias/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/auditorias/${id}/`);
  },

  iniciar: async (id: number): Promise<Auditoria> => {
    const response = await apiClient.post(`${BASE_URL}/auditorias/${id}/iniciar/`);
    return response.data;
  },

  cerrar: async (id: number): Promise<Auditoria> => {
    const response = await apiClient.post(`${BASE_URL}/auditorias/${id}/cerrar/`);
    return response.data;
  },

  uploadPlan: async (id: number, file: File): Promise<Auditoria> => {
    const formData = new FormData();
    formData.append('plan_auditoria', file);
    const response = await apiClient.post(`${BASE_URL}/auditorias/${id}/upload_plan/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  uploadInforme: async (id: number, file: File): Promise<Auditoria> => {
    const formData = new FormData();
    formData.append('informe_auditoria', file);
    const response = await apiClient.post(`${BASE_URL}/auditorias/${id}/upload_informe/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

// ==================== HALLAZGO ====================

export const hallazgoApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    auditoria?: number;
    tipo?: string;
    estado?: string;
    proceso_area?: string;
    responsable_proceso?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<PaginatedResponse<HallazgoList>> => {
    const response = await apiClient.get(`${BASE_URL}/hallazgos/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<Hallazgo> => {
    const response = await apiClient.get(`${BASE_URL}/hallazgos/${id}/`);
    return response.data;
  },

  create: async (data: CreateHallazgoDTO): Promise<Hallazgo> => {
    const response = await apiClient.post(`${BASE_URL}/hallazgos/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateHallazgoDTO): Promise<Hallazgo> => {
    const response = await apiClient.patch(`${BASE_URL}/hallazgos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/hallazgos/${id}/`);
  },

  comunicar: async (id: number): Promise<Hallazgo> => {
    const response = await apiClient.post(`${BASE_URL}/hallazgos/${id}/comunicar/`);
    return response.data;
  },

  iniciarTratamiento: async (id: number): Promise<Hallazgo> => {
    const response = await apiClient.post(`${BASE_URL}/hallazgos/${id}/iniciar_tratamiento/`);
    return response.data;
  },

  verificar: async (
    id: number,
    data: {
      es_eficaz: boolean;
      observaciones?: string;
    }
  ): Promise<Hallazgo> => {
    const response = await apiClient.post(`${BASE_URL}/hallazgos/${id}/verificar/`, data);
    return response.data;
  },

  cerrar: async (id: number): Promise<Hallazgo> => {
    const response = await apiClient.post(`${BASE_URL}/hallazgos/${id}/cerrar/`);
    return response.data;
  },

  uploadEvidencia: async (id: number, file: File): Promise<Hallazgo> => {
    const formData = new FormData();
    formData.append('archivo_evidencia', file);
    const response = await apiClient.post(`${BASE_URL}/hallazgos/${id}/upload_evidencia/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

// ==================== EVALUACIÓN DE CUMPLIMIENTO ====================

export const evaluacionCumplimientoApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    tipo?: string;
    resultado?: string;
    requisito_legal?: number;
    periodicidad?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<PaginatedResponse<EvaluacionCumplimientoList>> => {
    const response = await apiClient.get(`${BASE_URL}/evaluaciones-cumplimiento/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<EvaluacionCumplimiento> => {
    const response = await apiClient.get(`${BASE_URL}/evaluaciones-cumplimiento/${id}/`);
    return response.data;
  },

  create: async (data: CreateEvaluacionCumplimientoDTO): Promise<EvaluacionCumplimiento> => {
    const response = await apiClient.post(`${BASE_URL}/evaluaciones-cumplimiento/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateEvaluacionCumplimientoDTO): Promise<EvaluacionCumplimiento> => {
    const response = await apiClient.patch(`${BASE_URL}/evaluaciones-cumplimiento/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/evaluaciones-cumplimiento/${id}/`);
  },

  calcularProximaEvaluacion: async (id: number): Promise<EvaluacionCumplimiento> => {
    const response = await apiClient.post(`${BASE_URL}/evaluaciones-cumplimiento/${id}/calcular_proxima_evaluacion/`);
    return response.data;
  },

  porVencer: async (): Promise<{ count: number; evaluaciones: EvaluacionCumplimientoList[] }> => {
    const response = await apiClient.get(`${BASE_URL}/evaluaciones-cumplimiento/por_vencer/`);
    return response.data;
  },
};

// ==================== EXPORT DEFAULT ====================

export default {
  programaAuditoria: programaAuditoriaApi,
  auditoria: auditoriaApi,
  hallazgo: hallazgoApi,
  evaluacionCumplimiento: evaluacionCumplimientoApi,
};
