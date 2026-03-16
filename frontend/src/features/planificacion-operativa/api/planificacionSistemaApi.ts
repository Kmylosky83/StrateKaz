/**
 * API Client para Planificacion del Sistema - Gestion Estrategica
 * Sistema de Gestion StrateKaz
 *
 * Migrado desde features/hseq a features/gestion-estrategica (N1)
 *
 * Incluye:
 * - Plan de Trabajo Anual
 * - Actividades del Plan
 * - Objetivos del Sistema (vinculados a BSC)
 * - Programas de Gestion
 * - Actividades de Programas
 * - Seguimiento de Cronograma
 */
import { apiClient } from '@/lib/api-client';
import type {
  PlanTrabajoAnual,
  ActividadPlan,
  ObjetivoSistema,
  ProgramaGestion,
  ActividadPrograma,
  SeguimientoCronograma,
  CreatePlanTrabajoAnualDTO,
  UpdatePlanTrabajoAnualDTO,
  CreateActividadPlanDTO,
  UpdateActividadPlanDTO,
  CreateObjetivoSistemaDTO,
  UpdateObjetivoSistemaDTO,
  CreateProgramaGestionDTO,
  UpdateProgramaGestionDTO,
  CreateActividadProgramaDTO,
  UpdateActividadProgramaDTO,
  CreateSeguimientoCronogramaDTO,
  UpdateSeguimientoCronogramaDTO,
  PaginatedResponse,
  EstadisticasPlanTrabajo,
} from '../types/planificacion-sistema.types';

// Nueva ubicacion despues de migracion
const BASE_URL = '/gestion-estrategica/planificacion-sistema';

// ==================== PLAN TRABAJO ANUAL ====================

export const planTrabajoApi = {
  /**
   * Obtener todos los planes de trabajo
   */
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    periodo?: number;
    estado?: string;
    responsable?: number;
  }): Promise<PaginatedResponse<PlanTrabajoAnual>> => {
    const response = await apiClient.get(`${BASE_URL}/planes-trabajo/`, { params });
    return response.data;
  },

  /**
   * Obtener un plan de trabajo por ID
   */
  getById: async (id: number): Promise<PlanTrabajoAnual> => {
    const response = await apiClient.get(`${BASE_URL}/planes-trabajo/${id}/`);
    return response.data;
  },

  /**
   * Crear un nuevo plan de trabajo
   */
  create: async (data: CreatePlanTrabajoAnualDTO): Promise<PlanTrabajoAnual> => {
    const response = await apiClient.post(`${BASE_URL}/planes-trabajo/`, data);
    return response.data;
  },

  /**
   * Actualizar un plan de trabajo
   */
  update: async (id: number, data: UpdatePlanTrabajoAnualDTO): Promise<PlanTrabajoAnual> => {
    const response = await apiClient.patch(`${BASE_URL}/planes-trabajo/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar un plan de trabajo
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/planes-trabajo/${id}/`);
  },

  /**
   * Aprobar un plan de trabajo
   */
  aprobar: async (id: number): Promise<PlanTrabajoAnual> => {
    const response = await apiClient.post(`${BASE_URL}/planes-trabajo/${id}/aprobar/`);
    return response.data;
  },

  /**
   * Cambiar estado del plan de trabajo
   */
  cambiarEstado: async (
    id: number,
    estado: 'BORRADOR' | 'EN_REVISION' | 'APROBADO' | 'EN_EJECUCION' | 'CERRADO' | 'CANCELADO'
  ): Promise<PlanTrabajoAnual> => {
    const response = await apiClient.post(`${BASE_URL}/planes-trabajo/${id}/cambiar-estado/`, {
      estado,
    });
    return response.data;
  },

  /**
   * Obtener estadisticas de un plan de trabajo
   */
  getEstadisticas: async (id: number): Promise<EstadisticasPlanTrabajo> => {
    const response = await apiClient.get(`${BASE_URL}/planes-trabajo/${id}/reporte-ejecutivo/`);
    return response.data;
  },
};

// ==================== ACTIVIDAD PLAN ====================

export const actividadPlanApi = {
  /**
   * Obtener todas las actividades del plan
   */
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    plan_trabajo?: number;
    tipo_actividad?: string;
    estado?: string;
    responsable?: number;
    fecha_inicio_desde?: string;
    fecha_inicio_hasta?: string;
  }): Promise<PaginatedResponse<ActividadPlan>> => {
    const response = await apiClient.get(`${BASE_URL}/actividades-plan/`, { params });
    return response.data;
  },

  /**
   * Obtener una actividad por ID
   */
  getById: async (id: number): Promise<ActividadPlan> => {
    const response = await apiClient.get(`${BASE_URL}/actividades-plan/${id}/`);
    return response.data;
  },

  /**
   * Crear una nueva actividad del plan
   */
  create: async (data: CreateActividadPlanDTO): Promise<ActividadPlan> => {
    const response = await apiClient.post(`${BASE_URL}/actividades-plan/`, data);
    return response.data;
  },

  /**
   * Actualizar una actividad del plan
   */
  update: async (id: number, data: UpdateActividadPlanDTO): Promise<ActividadPlan> => {
    const response = await apiClient.patch(`${BASE_URL}/actividades-plan/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar una actividad del plan
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/actividades-plan/${id}/`);
  },

  /**
   * Actualizar avance de la actividad
   */
  actualizarAvance: async (
    id: number,
    porcentaje: number,
    observaciones?: string
  ): Promise<ActividadPlan> => {
    const response = await apiClient.post(`${BASE_URL}/actividades-plan/${id}/reportar-avance/`, {
      porcentaje_avance: porcentaje,
      observaciones,
    });
    return response.data;
  },

  /**
   * Cambiar estado de la actividad
   */
  cambiarEstado: async (
    id: number,
    estado: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADA' | 'CANCELADA' | 'RETRASADA'
  ): Promise<ActividadPlan> => {
    const response = await apiClient.post(`${BASE_URL}/actividades-plan/${id}/cambiar-estado/`, {
      estado,
    });
    return response.data;
  },

  /**
   * Obtener actividades de un plan especifico
   */
  porPlan: async (planId: number): Promise<ActividadPlan[]> => {
    const response = await apiClient.get(`${BASE_URL}/actividades-plan/`, {
      params: { plan_trabajo: planId },
    });
    return response.data.results || response.data;
  },
};

// ==================== OBJETIVO SISTEMA ====================

export const objetivoSistemaApi = {
  /**
   * Obtener todos los objetivos del sistema
   */
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    plan_trabajo?: number;
    perspectiva_bsc?: string;
    tipo_objetivo?: string;
    area_aplicacion?: string;
    estado?: string;
    responsable?: number;
  }): Promise<PaginatedResponse<ObjetivoSistema>> => {
    const response = await apiClient.get(`${BASE_URL}/objetivos/`, { params });
    return response.data;
  },

  /**
   * Obtener un objetivo por ID
   */
  getById: async (id: number): Promise<ObjetivoSistema> => {
    const response = await apiClient.get(`${BASE_URL}/objetivos/${id}/`);
    return response.data;
  },

  /**
   * Crear un nuevo objetivo del sistema
   */
  create: async (data: CreateObjetivoSistemaDTO): Promise<ObjetivoSistema> => {
    const response = await apiClient.post(`${BASE_URL}/objetivos/`, data);
    return response.data;
  },

  /**
   * Actualizar un objetivo del sistema
   */
  update: async (id: number, data: UpdateObjetivoSistemaDTO): Promise<ObjetivoSistema> => {
    const response = await apiClient.patch(`${BASE_URL}/objetivos/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar un objetivo del sistema
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/objetivos/${id}/`);
  },

  /**
   * Actualizar cumplimiento del objetivo
   */
  actualizarCumplimiento: async (
    id: number,
    valor_actual: number,
    porcentaje: number
  ): Promise<ObjetivoSistema> => {
    const response = await apiClient.post(`${BASE_URL}/objetivos/${id}/actualizar-valor/`, {
      valor_actual,
      porcentaje_cumplimiento: porcentaje,
    });
    return response.data;
  },

  /**
   * Obtener objetivos por perspectiva BSC
   */
  porPerspectiva: async (
    planId: number,
    perspectiva: 'FINANCIERA' | 'CLIENTES' | 'PROCESOS' | 'APRENDIZAJE'
  ): Promise<ObjetivoSistema[]> => {
    const response = await apiClient.get(`${BASE_URL}/objetivos/`, {
      params: { plan_trabajo: planId, perspectiva_bsc: perspectiva },
    });
    return response.data.results || response.data;
  },

  /**
   * Obtener objetivos de un plan especifico
   */
  porPlan: async (planId: number): Promise<ObjetivoSistema[]> => {
    const response = await apiClient.get(`${BASE_URL}/objetivos/`, {
      params: { plan_trabajo: planId },
    });
    return response.data.results || response.data;
  },
};

// ==================== PROGRAMA GESTION ====================

export const programaGestionApi = {
  /**
   * Obtener todos los programas de gestion
   */
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    plan_trabajo?: number;
    tipo_programa?: string;
    estado?: string;
    responsable?: number;
  }): Promise<PaginatedResponse<ProgramaGestion>> => {
    const response = await apiClient.get(`${BASE_URL}/programas/`, { params });
    return response.data;
  },

  /**
   * Obtener un programa de gestion por ID
   */
  getById: async (id: number): Promise<ProgramaGestion> => {
    const response = await apiClient.get(`${BASE_URL}/programas/${id}/`);
    return response.data;
  },

  /**
   * Crear un nuevo programa de gestion
   */
  create: async (data: CreateProgramaGestionDTO): Promise<ProgramaGestion> => {
    const response = await apiClient.post(`${BASE_URL}/programas/`, data);
    return response.data;
  },

  /**
   * Actualizar un programa de gestion
   */
  update: async (id: number, data: UpdateProgramaGestionDTO): Promise<ProgramaGestion> => {
    const response = await apiClient.patch(`${BASE_URL}/programas/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar un programa de gestion
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/programas/${id}/`);
  },

  /**
   * Actualizar avance del programa
   */
  actualizarAvance: async (id: number, porcentaje: number): Promise<ProgramaGestion> => {
    const response = await apiClient.post(`${BASE_URL}/programas/${id}/actualizar-avance/`, {
      porcentaje_avance: porcentaje,
    });
    return response.data;
  },

  /**
   * Obtener programas de un plan especifico
   */
  porPlan: async (planId: number): Promise<ProgramaGestion[]> => {
    const response = await apiClient.get(`${BASE_URL}/programas/`, {
      params: { plan_trabajo: planId },
    });
    return response.data.results || response.data;
  },

  /**
   * Obtener programas por tipo
   */
  porTipo: async (
    tipo:
      | 'PVE'
      | 'CAPACITACION'
      | 'INSPECCIONES'
      | 'MANTENIMIENTO'
      | 'AMBIENTAL'
      | 'RESIDUOS'
      | 'EMERGENCIAS'
      | 'MEDICINA'
      | 'HIGIENE'
      | 'SEGURIDAD'
      | 'OTRO'
  ): Promise<ProgramaGestion[]> => {
    const response = await apiClient.get(`${BASE_URL}/programas/`, {
      params: { tipo_programa: tipo },
    });
    return response.data.results || response.data;
  },
};

// ==================== ACTIVIDAD PROGRAMA ====================

export const actividadProgramaApi = {
  /**
   * Obtener todas las actividades de programas
   */
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    programa?: number;
    estado?: string;
    responsable?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<PaginatedResponse<ActividadPrograma>> => {
    const response = await apiClient.get(`${BASE_URL}/actividades-programa/`, { params });
    return response.data;
  },

  /**
   * Obtener una actividad de programa por ID
   */
  getById: async (id: number): Promise<ActividadPrograma> => {
    const response = await apiClient.get(`${BASE_URL}/actividades-programa/${id}/`);
    return response.data;
  },

  /**
   * Crear una nueva actividad de programa
   */
  create: async (data: CreateActividadProgramaDTO): Promise<ActividadPrograma> => {
    const response = await apiClient.post(`${BASE_URL}/actividades-programa/`, data);
    return response.data;
  },

  /**
   * Actualizar una actividad de programa
   */
  update: async (id: number, data: UpdateActividadProgramaDTO): Promise<ActividadPrograma> => {
    const response = await apiClient.patch(`${BASE_URL}/actividades-programa/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar una actividad de programa
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/actividades-programa/${id}/`);
  },

  /**
   * Ejecutar una actividad (marcar como ejecutada)
   */
  ejecutar: async (
    id: number,
    resultado: string,
    evidencias?: string
  ): Promise<ActividadPrograma> => {
    const response = await apiClient.post(`${BASE_URL}/actividades-programa/${id}/ejecutar/`, {
      resultado,
      evidencias,
    });
    return response.data;
  },

  /**
   * Cancelar una actividad
   */
  cancelar: async (id: number, motivo: string): Promise<ActividadPrograma> => {
    const response = await apiClient.post(`${BASE_URL}/actividades-programa/${id}/cancelar/`, {
      motivo,
    });
    return response.data;
  },

  /**
   * Obtener actividades de un programa especifico
   */
  porPrograma: async (programaId: number): Promise<ActividadPrograma[]> => {
    const response = await apiClient.get(`${BASE_URL}/actividades-programa/`, {
      params: { programa: programaId },
    });
    return response.data.results || response.data;
  },
};

// ==================== SEGUIMIENTO CRONOGRAMA ====================

export const seguimientoCronogramaApi = {
  /**
   * Obtener todos los seguimientos de cronograma
   */
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    plan_trabajo?: number;
    periodo?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    realizado_por?: number;
  }): Promise<PaginatedResponse<SeguimientoCronograma>> => {
    const response = await apiClient.get(`${BASE_URL}/seguimientos/`, { params });
    return response.data;
  },

  /**
   * Obtener un seguimiento de cronograma por ID
   */
  getById: async (id: number): Promise<SeguimientoCronograma> => {
    const response = await apiClient.get(`${BASE_URL}/seguimientos/${id}/`);
    return response.data;
  },

  /**
   * Crear un nuevo seguimiento de cronograma
   */
  create: async (data: CreateSeguimientoCronogramaDTO): Promise<SeguimientoCronograma> => {
    const response = await apiClient.post(`${BASE_URL}/seguimientos/`, data);
    return response.data;
  },

  /**
   * Actualizar un seguimiento de cronograma
   */
  update: async (
    id: number,
    data: UpdateSeguimientoCronogramaDTO
  ): Promise<SeguimientoCronograma> => {
    const response = await apiClient.patch(`${BASE_URL}/seguimientos/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar un seguimiento de cronograma
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/seguimientos/${id}/`);
  },

  /**
   * Generar seguimiento automatico
   */
  generarSeguimiento: async (planId: number, periodo: string): Promise<SeguimientoCronograma> => {
    const response = await apiClient.post(`${BASE_URL}/seguimientos/generar-seguimiento/`, {
      plan_trabajo_id: planId,
      periodo,
    });
    return response.data;
  },

  /**
   * Generar reporte de seguimiento
   */
  generarReporte: async (
    planId: number,
    formato: 'pdf' | 'excel' | 'json' = 'pdf'
  ): Promise<Blob | SeguimientoCronograma[]> => {
    const response = await apiClient.get(`${BASE_URL}/seguimientos/generar-reporte/`, {
      params: { plan_trabajo: planId, formato },
      responseType: formato === 'json' ? 'json' : 'blob',
    });
    return response.data;
  },

  /**
   * Obtener seguimientos de un plan especifico
   */
  porPlan: async (planId: number): Promise<SeguimientoCronograma[]> => {
    const response = await apiClient.get(`${BASE_URL}/seguimientos/`, {
      params: { plan_trabajo: planId },
    });
    return response.data.results || response.data;
  },
};
