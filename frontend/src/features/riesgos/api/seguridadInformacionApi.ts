/**
 * API Client para Seguridad de la Información — ISO 27001:2022
 * Backend: /api/riesgos/seguridad-info/
 */
import { apiClient } from '@/lib/api-client';
import type {
  ActivoInformacion,
  Amenaza,
  Vulnerabilidad,
  RiesgoSeguridad,
  ControlSeguridad,
  IncidenteSeguridad,
} from '../types/seguridad-informacion.types';

const BASE_URL = '/riesgos/seguridad-info';

// ============================================
// ACTIVOS DE INFORMACIÓN
// ============================================

export const activosInformacionApi = {
  getAll: async (params?: Record<string, unknown>) => {
    const response = await apiClient.get(`${BASE_URL}/activos-informacion/`, { params });
    return response.data;
  },
  getById: async (id: number): Promise<ActivoInformacion> => {
    const response = await apiClient.get(`${BASE_URL}/activos-informacion/${id}/`);
    return response.data;
  },
  create: async (data: Partial<ActivoInformacion>): Promise<ActivoInformacion> => {
    const response = await apiClient.post(`${BASE_URL}/activos-informacion/`, data);
    return response.data;
  },
  update: async (id: number, data: Partial<ActivoInformacion>): Promise<ActivoInformacion> => {
    const response = await apiClient.patch(`${BASE_URL}/activos-informacion/${id}/`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/activos-informacion/${id}/`);
  },
  criticos: async () => {
    const response = await apiClient.get(`${BASE_URL}/activos-informacion/criticos/`);
    return response.data;
  },
  estadisticas: async () => {
    const response = await apiClient.get(`${BASE_URL}/activos-informacion/estadisticas/`);
    return response.data;
  },
};

// ============================================
// AMENAZAS
// ============================================

export const amenazasApi = {
  getAll: async (params?: Record<string, unknown>) => {
    const response = await apiClient.get(`${BASE_URL}/amenazas/`, { params });
    return response.data;
  },
  getById: async (id: number): Promise<Amenaza> => {
    const response = await apiClient.get(`${BASE_URL}/amenazas/${id}/`);
    return response.data;
  },
  create: async (data: Partial<Amenaza>): Promise<Amenaza> => {
    const response = await apiClient.post(`${BASE_URL}/amenazas/`, data);
    return response.data;
  },
  update: async (id: number, data: Partial<Amenaza>): Promise<Amenaza> => {
    const response = await apiClient.patch(`${BASE_URL}/amenazas/${id}/`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/amenazas/${id}/`);
  },
};

// ============================================
// VULNERABILIDADES
// ============================================

export const vulnerabilidadesApi = {
  getAll: async (params?: Record<string, unknown>) => {
    const response = await apiClient.get(`${BASE_URL}/vulnerabilidades/`, { params });
    return response.data;
  },
  getById: async (id: number): Promise<Vulnerabilidad> => {
    const response = await apiClient.get(`${BASE_URL}/vulnerabilidades/${id}/`);
    return response.data;
  },
  create: async (data: Partial<Vulnerabilidad>): Promise<Vulnerabilidad> => {
    const response = await apiClient.post(`${BASE_URL}/vulnerabilidades/`, data);
    return response.data;
  },
  update: async (id: number, data: Partial<Vulnerabilidad>): Promise<Vulnerabilidad> => {
    const response = await apiClient.patch(`${BASE_URL}/vulnerabilidades/${id}/`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/vulnerabilidades/${id}/`);
  },
};

// ============================================
// RIESGOS DE SEGURIDAD
// ============================================

export const riesgosSeguridadApi = {
  getAll: async (params?: Record<string, unknown>) => {
    const response = await apiClient.get(`${BASE_URL}/riesgos-seguridad/`, { params });
    return response.data;
  },
  getById: async (id: number): Promise<RiesgoSeguridad> => {
    const response = await apiClient.get(`${BASE_URL}/riesgos-seguridad/${id}/`);
    return response.data;
  },
  create: async (data: Partial<RiesgoSeguridad>): Promise<RiesgoSeguridad> => {
    const response = await apiClient.post(`${BASE_URL}/riesgos-seguridad/`, data);
    return response.data;
  },
  update: async (id: number, data: Partial<RiesgoSeguridad>): Promise<RiesgoSeguridad> => {
    const response = await apiClient.patch(`${BASE_URL}/riesgos-seguridad/${id}/`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/riesgos-seguridad/${id}/`);
  },
  criticos: async () => {
    const response = await apiClient.get(`${BASE_URL}/riesgos-seguridad/criticos/`);
    return response.data;
  },
  resumen: async () => {
    const response = await apiClient.get(`${BASE_URL}/riesgos-seguridad/resumen/`);
    return response.data;
  },
  matriz: async () => {
    const response = await apiClient.get(`${BASE_URL}/riesgos-seguridad/matriz/`);
    return response.data;
  },
};

// ============================================
// CONTROLES DE SEGURIDAD
// ============================================

export const controlesSeguridadApi = {
  getAll: async (params?: Record<string, unknown>) => {
    const response = await apiClient.get(`${BASE_URL}/controles-seguridad/`, { params });
    return response.data;
  },
  getById: async (id: number): Promise<ControlSeguridad> => {
    const response = await apiClient.get(`${BASE_URL}/controles-seguridad/${id}/`);
    return response.data;
  },
  create: async (data: Partial<ControlSeguridad>): Promise<ControlSeguridad> => {
    const response = await apiClient.post(`${BASE_URL}/controles-seguridad/`, data);
    return response.data;
  },
  update: async (id: number, data: Partial<ControlSeguridad>): Promise<ControlSeguridad> => {
    const response = await apiClient.patch(`${BASE_URL}/controles-seguridad/${id}/`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/controles-seguridad/${id}/`);
  },
  pendientes: async () => {
    const response = await apiClient.get(`${BASE_URL}/controles-seguridad/pendientes/`);
    return response.data;
  },
  porEfectividad: async () => {
    const response = await apiClient.get(`${BASE_URL}/controles-seguridad/por-efectividad/`);
    return response.data;
  },
};

// ============================================
// INCIDENTES DE SEGURIDAD
// ============================================

export const incidentesSeguridadApi = {
  getAll: async (params?: Record<string, unknown>) => {
    const response = await apiClient.get(`${BASE_URL}/incidentes-seguridad/`, { params });
    return response.data;
  },
  getById: async (id: number): Promise<IncidenteSeguridad> => {
    const response = await apiClient.get(`${BASE_URL}/incidentes-seguridad/${id}/`);
    return response.data;
  },
  create: async (data: Partial<IncidenteSeguridad>): Promise<IncidenteSeguridad> => {
    const response = await apiClient.post(`${BASE_URL}/incidentes-seguridad/`, data);
    return response.data;
  },
  update: async (id: number, data: Partial<IncidenteSeguridad>): Promise<IncidenteSeguridad> => {
    const response = await apiClient.patch(`${BASE_URL}/incidentes-seguridad/${id}/`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/incidentes-seguridad/${id}/`);
  },
  abiertos: async () => {
    const response = await apiClient.get(`${BASE_URL}/incidentes-seguridad/abiertos/`);
    return response.data;
  },
  criticosIncidentes: async () => {
    const response = await apiClient.get(`${BASE_URL}/incidentes-seguridad/criticos/`);
    return response.data;
  },
  resumen: async () => {
    const response = await apiClient.get(`${BASE_URL}/incidentes-seguridad/resumen/`);
    return response.data;
  },
};
