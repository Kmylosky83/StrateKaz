/**
 * API Client para SAGRILAFT / PTEE
 * Backend: /api/riesgos/sagrilaft/
 */
import { apiClient } from '@/lib/api-client';
import type {
  FactorRiesgoLAFT,
  SegmentoCliente,
  MatrizRiesgoLAFT,
  SenalAlerta,
  ReporteROS,
  DebidaDiligencia,
} from '../types/sagrilaft-ptee.types';

const BASE_URL = '/api/riesgos/sagrilaft';

// ============================================
// FACTORES DE RIESGO LA/FT
// ============================================

export const factoresRiesgoLAFTApi = {
  getAll: async (params?: Record<string, unknown>) => {
    const response = await apiClient.get(`${BASE_URL}/factores-riesgo/`, { params });
    return response.data;
  },
  getById: async (id: number): Promise<FactorRiesgoLAFT> => {
    const response = await apiClient.get(`${BASE_URL}/factores-riesgo/${id}/`);
    return response.data;
  },
  create: async (data: Partial<FactorRiesgoLAFT>): Promise<FactorRiesgoLAFT> => {
    const response = await apiClient.post(`${BASE_URL}/factores-riesgo/`, data);
    return response.data;
  },
  update: async (id: number, data: Partial<FactorRiesgoLAFT>): Promise<FactorRiesgoLAFT> => {
    const response = await apiClient.patch(`${BASE_URL}/factores-riesgo/${id}/`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/factores-riesgo/${id}/`);
  },
  porTipo: async () => {
    const response = await apiClient.get(`${BASE_URL}/factores-riesgo/por_tipo/`);
    return response.data;
  },
};

// ============================================
// SEGMENTOS DE CLIENTE
// ============================================

export const segmentosClienteApi = {
  getAll: async (params?: Record<string, unknown>) => {
    const response = await apiClient.get(`${BASE_URL}/segmentos/`, { params });
    return response.data;
  },
  getById: async (id: number): Promise<SegmentoCliente> => {
    const response = await apiClient.get(`${BASE_URL}/segmentos/${id}/`);
    return response.data;
  },
  create: async (data: Partial<SegmentoCliente>): Promise<SegmentoCliente> => {
    const response = await apiClient.post(`${BASE_URL}/segmentos/`, data);
    return response.data;
  },
  update: async (id: number, data: Partial<SegmentoCliente>): Promise<SegmentoCliente> => {
    const response = await apiClient.patch(`${BASE_URL}/segmentos/${id}/`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/segmentos/${id}/`);
  },
};

// ============================================
// MATRICES DE RIESGO LA/FT
// ============================================

export const matricesRiesgoLAFTApi = {
  getAll: async (params?: Record<string, unknown>) => {
    const response = await apiClient.get(`${BASE_URL}/matrices/`, { params });
    return response.data;
  },
  getById: async (id: number): Promise<MatrizRiesgoLAFT> => {
    const response = await apiClient.get(`${BASE_URL}/matrices/${id}/`);
    return response.data;
  },
  create: async (data: Partial<MatrizRiesgoLAFT>): Promise<MatrizRiesgoLAFT> => {
    const response = await apiClient.post(`${BASE_URL}/matrices/`, data);
    return response.data;
  },
  update: async (id: number, data: Partial<MatrizRiesgoLAFT>): Promise<MatrizRiesgoLAFT> => {
    const response = await apiClient.patch(`${BASE_URL}/matrices/${id}/`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/matrices/${id}/`);
  },
  aprobar: async (id: number) => {
    const response = await apiClient.post(`${BASE_URL}/matrices/${id}/aprobar/`);
    return response.data;
  },
  resumen: async () => {
    const response = await apiClient.get(`${BASE_URL}/matrices/resumen/`);
    return response.data;
  },
  proximasRevisiones: async () => {
    const response = await apiClient.get(`${BASE_URL}/matrices/proximas_revisiones/`);
    return response.data;
  },
};

// ============================================
// SEÑALES DE ALERTA
// ============================================

export const senalesAlertaApi = {
  getAll: async (params?: Record<string, unknown>) => {
    const response = await apiClient.get(`${BASE_URL}/senales-alerta/`, { params });
    return response.data;
  },
  getById: async (id: number): Promise<SenalAlerta> => {
    const response = await apiClient.get(`${BASE_URL}/senales-alerta/${id}/`);
    return response.data;
  },
  create: async (data: Partial<SenalAlerta>): Promise<SenalAlerta> => {
    const response = await apiClient.post(`${BASE_URL}/senales-alerta/`, data);
    return response.data;
  },
  update: async (id: number, data: Partial<SenalAlerta>): Promise<SenalAlerta> => {
    const response = await apiClient.patch(`${BASE_URL}/senales-alerta/${id}/`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/senales-alerta/${id}/`);
  },
  asignarAnalista: async (id: number, analistaId: number) => {
    const response = await apiClient.post(`${BASE_URL}/senales-alerta/${id}/asignar_analista/`, {
      analista_id: analistaId,
    });
    return response.data;
  },
  pendientes: async () => {
    const response = await apiClient.get(`${BASE_URL}/senales-alerta/pendientes/`);
    return response.data;
  },
  requierenROS: async () => {
    const response = await apiClient.get(`${BASE_URL}/senales-alerta/requieren_ros/`);
    return response.data;
  },
};

// ============================================
// REPORTES DE OPERACIONES SOSPECHOSAS (ROS)
// ============================================

export const reportesROSApi = {
  getAll: async (params?: Record<string, unknown>) => {
    const response = await apiClient.get(`${BASE_URL}/reportes-ros/`, { params });
    return response.data;
  },
  getById: async (id: number): Promise<ReporteROS> => {
    const response = await apiClient.get(`${BASE_URL}/reportes-ros/${id}/`);
    return response.data;
  },
  create: async (data: Partial<ReporteROS>): Promise<ReporteROS> => {
    const response = await apiClient.post(`${BASE_URL}/reportes-ros/`, data);
    return response.data;
  },
  update: async (id: number, data: Partial<ReporteROS>): Promise<ReporteROS> => {
    const response = await apiClient.patch(`${BASE_URL}/reportes-ros/${id}/`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/reportes-ros/${id}/`);
  },
  enviarUIAF: async (id: number, data?: { numero_radicado?: string }) => {
    const response = await apiClient.post(`${BASE_URL}/reportes-ros/${id}/enviar_uiaf/`, data);
    return response.data;
  },
  pendientesEnvio: async () => {
    const response = await apiClient.get(`${BASE_URL}/reportes-ros/pendientes_envio/`);
    return response.data;
  },
};

// ============================================
// DEBIDAS DILIGENCIAS
// ============================================

export const debidasDiligenciasApi = {
  getAll: async (params?: Record<string, unknown>) => {
    const response = await apiClient.get(`${BASE_URL}/debidas-diligencias/`, { params });
    return response.data;
  },
  getById: async (id: number): Promise<DebidaDiligencia> => {
    const response = await apiClient.get(`${BASE_URL}/debidas-diligencias/${id}/`);
    return response.data;
  },
  create: async (data: Partial<DebidaDiligencia>): Promise<DebidaDiligencia> => {
    const response = await apiClient.post(`${BASE_URL}/debidas-diligencias/`, data);
    return response.data;
  },
  update: async (id: number, data: Partial<DebidaDiligencia>): Promise<DebidaDiligencia> => {
    const response = await apiClient.patch(`${BASE_URL}/debidas-diligencias/${id}/`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/debidas-diligencias/${id}/`);
  },
  vencidas: async () => {
    const response = await apiClient.get(`${BASE_URL}/debidas-diligencias/vencidas/`);
    return response.data;
  },
  proximasActualizacion: async () => {
    const response = await apiClient.get(`${BASE_URL}/debidas-diligencias/proximas_actualizacion/`);
    return response.data;
  },
  peps: async () => {
    const response = await apiClient.get(`${BASE_URL}/debidas-diligencias/peps/`);
    return response.data;
  },
};
