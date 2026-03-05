/**
 * API Client para Higiene Industrial - HSEQ Management
 * Sistema de Gestión StrateKaz
 *
 * Incluye:
 * - Tipos de Agentes y Agentes de Riesgo
 * - Grupos de Exposición Similar (GES)
 * - Puntos de Medición
 * - Mediciones Ambientales
 * - Controles de Exposición
 * - Monitoreo Biológico
 */
import { apiClient } from '@/lib/api-client';
import type {
  TipoAgente,
  TipoAgenteList,
  AgenteRiesgo,
  AgenteRiesgoList,
  GrupoExposicionSimilar,
  GrupoExposicionSimilarList,
  PuntoMedicion,
  PuntoMedicionList,
  MedicionAmbiental,
  MedicionAmbientalList,
  ControlExposicion,
  ControlExposicionList,
  MonitoreoBiologico,
  MonitoreoBiologicoList,
  CreateTipoAgenteDTO,
  UpdateTipoAgenteDTO,
  CreateAgenteRiesgoDTO,
  UpdateAgenteRiesgoDTO,
  CreateGrupoExposicionSimilarDTO,
  UpdateGrupoExposicionSimilarDTO,
  CreatePuntoMedicionDTO,
  UpdatePuntoMedicionDTO,
  CreateMedicionAmbientalDTO,
  UpdateMedicionAmbientalDTO,
  CreateControlExposicionDTO,
  UpdateControlExposicionDTO,
  CreateMonitoreoBiologicoDTO,
  UpdateMonitoreoBiologicoDTO,
  PaginatedResponse,
  EstadisticasMediciones,
  EstadisticasControles,
  EstadisticasMonitoreo,
} from '../types/higiene-industrial.types';

const BASE_URL = '/hseq/higiene';

// ==================== TIPOS DE AGENTE ====================

export const tipoAgenteApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    categoria?: string;
    is_active?: boolean;
  }): Promise<PaginatedResponse<TipoAgenteList>> => {
    const response = await apiClient.get(`${BASE_URL}/tipos-agente/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<TipoAgente> => {
    const response = await apiClient.get(`${BASE_URL}/tipos-agente/${id}/`);
    return response.data;
  },

  create: async (data: CreateTipoAgenteDTO): Promise<TipoAgente> => {
    const response = await apiClient.post(`${BASE_URL}/tipos-agente/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateTipoAgenteDTO): Promise<TipoAgente> => {
    const response = await apiClient.patch(`${BASE_URL}/tipos-agente/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/tipos-agente/${id}/`);
  },
};

// ==================== AGENTES DE RIESGO ====================

export const agenteRiesgoApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    tipo_agente?: number;
    is_active?: boolean;
  }): Promise<PaginatedResponse<AgenteRiesgoList>> => {
    const response = await apiClient.get(`${BASE_URL}/agentes-riesgo/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<AgenteRiesgo> => {
    const response = await apiClient.get(`${BASE_URL}/agentes-riesgo/${id}/`);
    return response.data;
  },

  create: async (data: CreateAgenteRiesgoDTO): Promise<AgenteRiesgo> => {
    const response = await apiClient.post(`${BASE_URL}/agentes-riesgo/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateAgenteRiesgoDTO): Promise<AgenteRiesgo> => {
    const response = await apiClient.patch(`${BASE_URL}/agentes-riesgo/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/agentes-riesgo/${id}/`);
  },
};

// ==================== GRUPOS DE EXPOSICIÓN SIMILAR ====================

export const grupoExposicionApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    area?: string;
    is_active?: boolean;
  }): Promise<PaginatedResponse<GrupoExposicionSimilarList>> => {
    const response = await apiClient.get(`${BASE_URL}/grupos-exposicion/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<GrupoExposicionSimilar> => {
    const response = await apiClient.get(`${BASE_URL}/grupos-exposicion/${id}/`);
    return response.data;
  },

  create: async (data: CreateGrupoExposicionSimilarDTO): Promise<GrupoExposicionSimilar> => {
    const response = await apiClient.post(`${BASE_URL}/grupos-exposicion/`, data);
    return response.data;
  },

  update: async (
    id: number,
    data: UpdateGrupoExposicionSimilarDTO
  ): Promise<GrupoExposicionSimilar> => {
    const response = await apiClient.patch(`${BASE_URL}/grupos-exposicion/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/grupos-exposicion/${id}/`);
  },
};

// ==================== PUNTOS DE MEDICIÓN ====================

export const puntoMedicionApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    area?: string;
    grupo_exposicion?: number;
    is_active?: boolean;
  }): Promise<PaginatedResponse<PuntoMedicionList>> => {
    const response = await apiClient.get(`${BASE_URL}/puntos-medicion/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<PuntoMedicion> => {
    const response = await apiClient.get(`${BASE_URL}/puntos-medicion/${id}/`);
    return response.data;
  },

  create: async (data: CreatePuntoMedicionDTO): Promise<PuntoMedicion> => {
    const response = await apiClient.post(`${BASE_URL}/puntos-medicion/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdatePuntoMedicionDTO): Promise<PuntoMedicion> => {
    const response = await apiClient.patch(`${BASE_URL}/puntos-medicion/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/puntos-medicion/${id}/`);
  },
};

// ==================== MEDICIONES AMBIENTALES ====================

export const medicionAmbientalApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    agente_riesgo?: number;
    punto_medicion?: number;
    grupo_exposicion?: number;
    cumplimiento?: string;
    estado?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<PaginatedResponse<MedicionAmbientalList>> => {
    const response = await apiClient.get(`${BASE_URL}/mediciones-ambientales/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<MedicionAmbiental> => {
    const response = await apiClient.get(`${BASE_URL}/mediciones-ambientales/${id}/`);
    return response.data;
  },

  create: async (data: CreateMedicionAmbientalDTO): Promise<MedicionAmbiental> => {
    const response = await apiClient.post(`${BASE_URL}/mediciones-ambientales/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateMedicionAmbientalDTO): Promise<MedicionAmbiental> => {
    const response = await apiClient.patch(`${BASE_URL}/mediciones-ambientales/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/mediciones-ambientales/${id}/`);
  },

  getEstadisticas: async (): Promise<EstadisticasMediciones> => {
    const response = await apiClient.get(`${BASE_URL}/mediciones-ambientales/estadisticas/`);
    return response.data;
  },

  evaluarCumplimiento: async (id: number): Promise<MedicionAmbiental> => {
    const response = await apiClient.post(
      `${BASE_URL}/mediciones-ambientales/${id}/evaluar-cumplimiento/`
    );
    return response.data;
  },

  proximasMediciones: async (): Promise<MedicionAmbientalList[]> => {
    const response = await apiClient.get(`${BASE_URL}/mediciones-ambientales/proximas-mediciones/`);
    return response.data;
  },
};

// ==================== CONTROLES DE EXPOSICIÓN ====================

export const controlExposicionApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    agente_riesgo?: number;
    jerarquia_control?: string;
    tipo_control?: string;
    estado?: string;
    area_aplicacion?: string;
  }): Promise<PaginatedResponse<ControlExposicionList>> => {
    const response = await apiClient.get(`${BASE_URL}/controles-exposicion/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<ControlExposicion> => {
    const response = await apiClient.get(`${BASE_URL}/controles-exposicion/${id}/`);
    return response.data;
  },

  create: async (data: CreateControlExposicionDTO): Promise<ControlExposicion> => {
    const response = await apiClient.post(`${BASE_URL}/controles-exposicion/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateControlExposicionDTO): Promise<ControlExposicion> => {
    const response = await apiClient.patch(`${BASE_URL}/controles-exposicion/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/controles-exposicion/${id}/`);
  },

  getEstadisticas: async (): Promise<EstadisticasControles> => {
    const response = await apiClient.get(`${BASE_URL}/controles-exposicion/estadisticas/`);
    return response.data;
  },

  porJerarquia: async (): Promise<Record<string, ControlExposicionList[]>> => {
    const response = await apiClient.get(`${BASE_URL}/controles-exposicion/por-jerarquia/`);
    return response.data;
  },

  efectividad: async (id: number): Promise<ControlExposicion> => {
    const response = await apiClient.post(`${BASE_URL}/controles-exposicion/${id}/efectividad/`);
    return response.data;
  },
};

// ==================== MONITOREO BIOLÓGICO ====================

export const monitoreoBiologicoApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    trabajador_identificacion?: string;
    grupo_exposicion?: number;
    tipo_examen?: string;
    resultado?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    requiere_seguimiento?: boolean;
  }): Promise<PaginatedResponse<MonitoreoBiologicoList>> => {
    const response = await apiClient.get(`${BASE_URL}/monitoreo-biologico/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<MonitoreoBiologico> => {
    const response = await apiClient.get(`${BASE_URL}/monitoreo-biologico/${id}/`);
    return response.data;
  },

  create: async (data: CreateMonitoreoBiologicoDTO): Promise<MonitoreoBiologico> => {
    const response = await apiClient.post(`${BASE_URL}/monitoreo-biologico/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateMonitoreoBiologicoDTO): Promise<MonitoreoBiologico> => {
    const response = await apiClient.patch(`${BASE_URL}/monitoreo-biologico/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/monitoreo-biologico/${id}/`);
  },

  getEstadisticas: async (): Promise<EstadisticasMonitoreo> => {
    const response = await apiClient.get(`${BASE_URL}/monitoreo-biologico/estadisticas/`);
    return response.data;
  },

  vencidos: async (): Promise<MonitoreoBiologicoList[]> => {
    const response = await apiClient.get(`${BASE_URL}/monitoreo-biologico/vencidos/`);
    return response.data;
  },

  alertasSeguimiento: async (): Promise<{
    count: number;
    examenes: MonitoreoBiologicoList[];
  }> => {
    const response = await apiClient.get(`${BASE_URL}/monitoreo-biologico/alertas-seguimiento/`);
    return response.data;
  },
};

// ==================== EXPORT DEFAULT ====================

export default {
  tipoAgente: tipoAgenteApi,
  agenteRiesgo: agenteRiesgoApi,
  grupoExposicion: grupoExposicionApi,
  puntoMedicion: puntoMedicionApi,
  medicionAmbiental: medicionAmbientalApi,
  controlExposicion: controlExposicionApi,
  monitoreoBiologico: monitoreoBiologicoApi,
};
