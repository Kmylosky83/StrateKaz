/**
 * API Client para Emergencias - HSEQ Management
 * Sistema de Gestión StrateKaz
 *
 * Incluye:
 * - Análisis de Vulnerabilidad y Amenazas
 * - Planes de Emergencia y Procedimientos
 * - Planos de Evacuación
 * - Brigadas y Brigadistas
 * - Simulacros y Evaluaciones
 * - Recursos de Emergencia e Inspecciones
 */
import { apiClient } from '@/lib/api-client';
import type {
  AnalisisVulnerabilidad,
  AnalisisVulnerabilidadList,
  Amenaza,
  PlanEmergencia,
  PlanEmergenciaList,
  ProcedimientoEmergencia,
  PlanoEvacuacion,
  TipoBrigada,
  Brigada,
  BrigadaList,
  BrigadistaActivo,
  Simulacro,
  SimulacroList,
  EvaluacionSimulacro,
  RecursoEmergencia,
  RecursoEmergenciaList,
  InspeccionRecurso,
  CreateAnalisisVulnerabilidadDTO,
  UpdateAnalisisVulnerabilidadDTO,
  CreateAmenazaDTO,
  UpdateAmenazaDTO,
  CreatePlanEmergenciaDTO,
  UpdatePlanEmergenciaDTO,
  CreateProcedimientoEmergenciaDTO,
  UpdateProcedimientoEmergenciaDTO,
  CreatePlanoEvacuacionDTO,
  UpdatePlanoEvacuacionDTO,
  CreateTipoBrigadaDTO,
  UpdateTipoBrigadaDTO,
  CreateBrigadaDTO,
  UpdateBrigadaDTO,
  CreateBrigadistaActivoDTO,
  UpdateBrigadistaActivoDTO,
  CreateSimulacroDTO,
  UpdateSimulacroDTO,
  CreateRecursoEmergenciaDTO,
  UpdateRecursoEmergenciaDTO,
  CreateInspeccionRecursoDTO,
  UpdateInspeccionRecursoDTO,
  PaginatedResponse,
} from '../types/emergencias.types';

const BASE_URL = '/hseq/emergencias';

// ==================== ANÁLISIS DE VULNERABILIDAD ====================

export const analisisVulnerabilidadApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    tipo_amenaza?: string;
    nivel_vulnerabilidad?: string;
    estado?: string;
  }): Promise<PaginatedResponse<AnalisisVulnerabilidadList>> => {
    const response = await apiClient.get(`${BASE_URL}/analisis-vulnerabilidad/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<AnalisisVulnerabilidad> => {
    const response = await apiClient.get(`${BASE_URL}/analisis-vulnerabilidad/${id}/`);
    return response.data;
  },

  create: async (data: CreateAnalisisVulnerabilidadDTO): Promise<AnalisisVulnerabilidad> => {
    const response = await apiClient.post(`${BASE_URL}/analisis-vulnerabilidad/`, data);
    return response.data;
  },

  update: async (
    id: number,
    data: UpdateAnalisisVulnerabilidadDTO
  ): Promise<AnalisisVulnerabilidad> => {
    const response = await apiClient.patch(`${BASE_URL}/analisis-vulnerabilidad/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/analisis-vulnerabilidad/${id}/`);
  },

  aprobar: async (id: number): Promise<AnalisisVulnerabilidad> => {
    const response = await apiClient.post(`${BASE_URL}/analisis-vulnerabilidad/${id}/aprobar/`);
    return response.data;
  },
};

// ==================== AMENAZAS ====================

export const amenazaApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    categoria?: string;
    analisis_vulnerabilidad?: number;
    probabilidad?: string;
    severidad?: string;
  }): Promise<PaginatedResponse<Amenaza>> => {
    const response = await apiClient.get(`${BASE_URL}/amenazas/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<Amenaza> => {
    const response = await apiClient.get(`${BASE_URL}/amenazas/${id}/`);
    return response.data;
  },

  create: async (data: CreateAmenazaDTO): Promise<Amenaza> => {
    const response = await apiClient.post(`${BASE_URL}/amenazas/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateAmenazaDTO): Promise<Amenaza> => {
    const response = await apiClient.patch(`${BASE_URL}/amenazas/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/amenazas/${id}/`);
  },
};

// ==================== PLAN DE EMERGENCIA ====================

export const planEmergenciaApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    estado?: string;
    version?: string;
  }): Promise<PaginatedResponse<PlanEmergenciaList>> => {
    const response = await apiClient.get(`${BASE_URL}/planes-emergencia/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<PlanEmergencia> => {
    const response = await apiClient.get(`${BASE_URL}/planes-emergencia/${id}/`);
    return response.data;
  },

  create: async (data: CreatePlanEmergenciaDTO): Promise<PlanEmergencia> => {
    const response = await apiClient.post(`${BASE_URL}/planes-emergencia/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdatePlanEmergenciaDTO): Promise<PlanEmergencia> => {
    const response = await apiClient.patch(`${BASE_URL}/planes-emergencia/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/planes-emergencia/${id}/`);
  },

  aprobar: async (id: number): Promise<PlanEmergencia> => {
    const response = await apiClient.post(`${BASE_URL}/planes-emergencia/${id}/aprobar/`);
    return response.data;
  },

  activar: async (id: number): Promise<PlanEmergencia> => {
    const response = await apiClient.post(`${BASE_URL}/planes-emergencia/${id}/activar/`);
    return response.data;
  },
};

// ==================== PROCEDIMIENTOS DE EMERGENCIA ====================

export const procedimientoEmergenciaApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    tipo_emergencia?: string;
    estado?: string;
    plan_emergencia?: number;
  }): Promise<PaginatedResponse<ProcedimientoEmergencia>> => {
    const response = await apiClient.get(`${BASE_URL}/procedimientos/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<ProcedimientoEmergencia> => {
    const response = await apiClient.get(`${BASE_URL}/procedimientos/${id}/`);
    return response.data;
  },

  create: async (data: CreateProcedimientoEmergenciaDTO): Promise<ProcedimientoEmergencia> => {
    const response = await apiClient.post(`${BASE_URL}/procedimientos/`, data);
    return response.data;
  },

  update: async (
    id: number,
    data: UpdateProcedimientoEmergenciaDTO
  ): Promise<ProcedimientoEmergencia> => {
    const response = await apiClient.patch(`${BASE_URL}/procedimientos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/procedimientos/${id}/`);
  },
};

// ==================== PLANOS DE EVACUACIÓN ====================

export const planoEvacuacionApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    edificio?: string;
    piso?: string;
    publicado?: boolean;
    plan_emergencia?: number;
  }): Promise<PaginatedResponse<PlanoEvacuacion>> => {
    const response = await apiClient.get(`${BASE_URL}/planos-evacuacion/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<PlanoEvacuacion> => {
    const response = await apiClient.get(`${BASE_URL}/planos-evacuacion/${id}/`);
    return response.data;
  },

  create: async (data: CreatePlanoEvacuacionDTO): Promise<PlanoEvacuacion> => {
    const response = await apiClient.post(`${BASE_URL}/planos-evacuacion/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdatePlanoEvacuacionDTO): Promise<PlanoEvacuacion> => {
    const response = await apiClient.patch(`${BASE_URL}/planos-evacuacion/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/planos-evacuacion/${id}/`);
  },

  publicar: async (id: number): Promise<PlanoEvacuacion> => {
    const response = await apiClient.post(`${BASE_URL}/planos-evacuacion/${id}/publicar/`);
    return response.data;
  },
};

// ==================== TIPOS DE BRIGADA ====================

export const tipoBrigadaApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    certificacion_requerida?: boolean;
  }): Promise<PaginatedResponse<TipoBrigada>> => {
    const response = await apiClient.get(`${BASE_URL}/tipos-brigadas/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<TipoBrigada> => {
    const response = await apiClient.get(`${BASE_URL}/tipos-brigadas/${id}/`);
    return response.data;
  },

  create: async (data: CreateTipoBrigadaDTO): Promise<TipoBrigada> => {
    const response = await apiClient.post(`${BASE_URL}/tipos-brigadas/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateTipoBrigadaDTO): Promise<TipoBrigada> => {
    const response = await apiClient.patch(`${BASE_URL}/tipos-brigadas/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/tipos-brigadas/${id}/`);
  },
};

// ==================== BRIGADAS ====================

export const brigadaApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    tipo_brigada?: number;
    estado?: string;
  }): Promise<PaginatedResponse<BrigadaList>> => {
    const response = await apiClient.get(`${BASE_URL}/brigadas/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<Brigada> => {
    const response = await apiClient.get(`${BASE_URL}/brigadas/${id}/`);
    return response.data;
  },

  create: async (data: CreateBrigadaDTO): Promise<Brigada> => {
    const response = await apiClient.post(`${BASE_URL}/brigadas/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateBrigadaDTO): Promise<Brigada> => {
    const response = await apiClient.patch(`${BASE_URL}/brigadas/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/brigadas/${id}/`);
  },

  activar: async (id: number): Promise<Brigada> => {
    const response = await apiClient.post(`${BASE_URL}/brigadas/${id}/activar/`);
    return response.data;
  },
};

// ==================== BRIGADISTAS ====================

export const brigadistaActivoApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    brigada?: number;
    estado?: string;
    rol?: string;
    grupo_sanguineo?: string;
  }): Promise<PaginatedResponse<BrigadistaActivo>> => {
    const response = await apiClient.get(`${BASE_URL}/brigadistas/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<BrigadistaActivo> => {
    const response = await apiClient.get(`${BASE_URL}/brigadistas/${id}/`);
    return response.data;
  },

  create: async (data: CreateBrigadistaActivoDTO): Promise<BrigadistaActivo> => {
    const response = await apiClient.post(`${BASE_URL}/brigadistas/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateBrigadistaActivoDTO): Promise<BrigadistaActivo> => {
    const response = await apiClient.patch(`${BASE_URL}/brigadistas/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/brigadistas/${id}/`);
  },

  inactivar: async (id: number, motivo?: string): Promise<BrigadistaActivo> => {
    const response = await apiClient.post(`${BASE_URL}/brigadistas/${id}/inactivar/`, { motivo });
    return response.data;
  },
};

// ==================== SIMULACROS ====================

export const simulacroApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    tipo_simulacro?: string;
    estado?: string;
    alcance?: string;
    plan_emergencia?: number;
  }): Promise<PaginatedResponse<SimulacroList>> => {
    const response = await apiClient.get(`${BASE_URL}/simulacros/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<Simulacro> => {
    const response = await apiClient.get(`${BASE_URL}/simulacros/${id}/`);
    return response.data;
  },

  create: async (data: CreateSimulacroDTO): Promise<Simulacro> => {
    const response = await apiClient.post(`${BASE_URL}/simulacros/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateSimulacroDTO): Promise<Simulacro> => {
    const response = await apiClient.patch(`${BASE_URL}/simulacros/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/simulacros/${id}/`);
  },

  programarSimulacro: async (data: any): Promise<Simulacro> => {
    const response = await apiClient.post(`${BASE_URL}/simulacros/programar_simulacro/`, data);
    return response.data;
  },

  marcarRealizado: async (
    id: number,
    data: {
      duracion_real?: number;
      numero_participantes_reales?: number;
      observaciones?: string;
      fue_exitoso?: boolean;
    }
  ): Promise<Simulacro> => {
    const response = await apiClient.post(`${BASE_URL}/simulacros/${id}/marcar_realizado/`, data);
    return response.data;
  },

  registrarEvaluacion: async (data: any): Promise<EvaluacionSimulacro> => {
    const response = await apiClient.post(`${BASE_URL}/simulacros/registrar_evaluacion/`, data);
    return response.data;
  },
};

// ==================== EVALUACIONES DE SIMULACRO ====================

export const evaluacionSimulacroApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    simulacro?: number;
    aprobado?: boolean;
    requiere_acciones_correctivas?: boolean;
  }): Promise<PaginatedResponse<EvaluacionSimulacro>> => {
    const response = await apiClient.get(`${BASE_URL}/evaluaciones-simulacros/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<EvaluacionSimulacro> => {
    const response = await apiClient.get(`${BASE_URL}/evaluaciones-simulacros/${id}/`);
    return response.data;
  },

  create: async (data: any): Promise<EvaluacionSimulacro> => {
    const response = await apiClient.post(`${BASE_URL}/evaluaciones-simulacros/`, data);
    return response.data;
  },

  update: async (id: number, data: any): Promise<EvaluacionSimulacro> => {
    const response = await apiClient.patch(`${BASE_URL}/evaluaciones-simulacros/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/evaluaciones-simulacros/${id}/`);
  },
};

// ==================== RECURSOS DE EMERGENCIA ====================

export const recursoEmergenciaApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    tipo_recurso?: string;
    estado?: string;
    area?: string;
    edificio?: string;
    piso?: string;
  }): Promise<PaginatedResponse<RecursoEmergenciaList>> => {
    const response = await apiClient.get(`${BASE_URL}/recursos/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<RecursoEmergencia> => {
    const response = await apiClient.get(`${BASE_URL}/recursos/${id}/`);
    return response.data;
  },

  create: async (data: CreateRecursoEmergenciaDTO): Promise<RecursoEmergencia> => {
    const response = await apiClient.post(`${BASE_URL}/recursos/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateRecursoEmergenciaDTO): Promise<RecursoEmergencia> => {
    const response = await apiClient.patch(`${BASE_URL}/recursos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/recursos/${id}/`);
  },

  requierenInspeccion: async (): Promise<{ count: number; recursos: RecursoEmergenciaList[] }> => {
    const response = await apiClient.get(`${BASE_URL}/recursos/requieren_inspeccion/`);
    return response.data;
  },

  porVencer: async (): Promise<{ count: number; recursos: RecursoEmergenciaList[] }> => {
    const response = await apiClient.get(`${BASE_URL}/recursos/por_vencer/`);
    return response.data;
  },
};

// ==================== INSPECCIONES DE RECURSOS ====================

export const inspeccionRecursoApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    recurso?: number;
    resultado?: string;
    inspector?: string;
  }): Promise<PaginatedResponse<InspeccionRecurso>> => {
    const response = await apiClient.get(`${BASE_URL}/inspecciones-recursos/`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<InspeccionRecurso> => {
    const response = await apiClient.get(`${BASE_URL}/inspecciones-recursos/${id}/`);
    return response.data;
  },

  create: async (data: CreateInspeccionRecursoDTO): Promise<InspeccionRecurso> => {
    const response = await apiClient.post(`${BASE_URL}/inspecciones-recursos/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateInspeccionRecursoDTO): Promise<InspeccionRecurso> => {
    const response = await apiClient.patch(`${BASE_URL}/inspecciones-recursos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/inspecciones-recursos/${id}/`);
  },
};

// ==================== EXPORT DEFAULT ====================

export default {
  analisisVulnerabilidad: analisisVulnerabilidadApi,
  amenaza: amenazaApi,
  planEmergencia: planEmergenciaApi,
  procedimientoEmergencia: procedimientoEmergenciaApi,
  planoEvacuacion: planoEvacuacionApi,
  tipoBrigada: tipoBrigadaApi,
  brigada: brigadaApi,
  brigadistaActivo: brigadistaActivoApi,
  simulacro: simulacroApi,
  evaluacionSimulacro: evaluacionSimulacroApi,
  recursoEmergencia: recursoEmergenciaApi,
  inspeccionRecurso: inspeccionRecursoApi,
};
