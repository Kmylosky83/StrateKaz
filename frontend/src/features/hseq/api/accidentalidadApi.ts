/**
 * API Client para Accidentalidad (ATEL) - HSEQ Management
 * Sistema de Gestión StrateKaz
 */
import { apiClient } from '@/lib/api-client';
import type {
  AccidenteTrabajo,
  CreateAccidenteTrabajoDTO,
  UpdateAccidenteTrabajoDTO,
  EnfermedadLaboral,
  CreateEnfermedadLaboralDTO,
  UpdateEnfermedadLaboralDTO,
  IncidenteTrabajo,
  CreateIncidenteTrabajoDTO,
  UpdateIncidenteTrabajoDTO,
  InvestigacionATEL,
  CreateInvestigacionATELDTO,
  UpdateInvestigacionATELDTO,
  CompletarInvestigacionDTO,
  CausaRaiz,
  CreateCausaRaizDTO,
  UpdateCausaRaizDTO,
  LeccionAprendida,
  CreateLeccionAprendidaDTO,
  UpdateLeccionAprendidaDTO,
  DivulgarLeccionDTO,
  PlanAccionATEL,
  CreatePlanAccionATELDTO,
  UpdatePlanAccionATELDTO,
  VerificarPlanDTO,
  AccionPlan,
  CreateAccionPlanDTO,
  UpdateAccionPlanDTO,
  CompletarAccionDTO,
  VerificarAccionDTO,
  PaginatedResponse,
  EstadisticasAccidentalidad,
  GravedadAccidente,
  TipoEventoAccidente,
  TipoEnfermedadLaboral,
  EstadoCalificacionEL,
  TipoIncidente,
  PotencialGravedad,
  EstadoInvestigacion,
  EstadoPlanAccion,
  EstadoAccion,
} from '../types/accidentalidad.types';

const BASE_URL = '/hseq/accidentalidad';

// ==================== ACCIDENTES DE TRABAJO ====================

export const accidenteTrabajoApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    gravedad?: GravedadAccidente;
    tipo_evento?: TipoEventoAccidente;
    fecha_desde?: string;
    fecha_hasta?: string;
    trabajador?: number;
    requiere_investigacion?: boolean;
  }): Promise<PaginatedResponse<AccidenteTrabajo>> => {
    const { data } = await apiClient.get(`${BASE_URL}/accidentes-trabajo/`, { params });
    return data;
  },

  getById: async (id: number): Promise<AccidenteTrabajo> => {
    const { data } = await apiClient.get(`${BASE_URL}/accidentes-trabajo/${id}/`);
    return data;
  },

  create: async (dto: CreateAccidenteTrabajoDTO): Promise<AccidenteTrabajo> => {
    const { data } = await apiClient.post(`${BASE_URL}/accidentes-trabajo/`, dto);
    return data;
  },

  update: async (id: number, dto: UpdateAccidenteTrabajoDTO): Promise<AccidenteTrabajo> => {
    const { data } = await apiClient.patch(`${BASE_URL}/accidentes-trabajo/${id}/`, dto);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/accidentes-trabajo/${id}/`);
  },

  reportarARL: async (
    id: number,
    dto: {
      numero_caso_arl: string;
      fecha_reporte_arl: string;
    }
  ): Promise<AccidenteTrabajo> => {
    const { data } = await apiClient.post(
      `${BASE_URL}/accidentes-trabajo/${id}/reportar-arl/`,
      dto
    );
    return data;
  },

  iniciarInvestigacion: async (id: number): Promise<InvestigacionATEL> => {
    const { data } = await apiClient.post(
      `${BASE_URL}/accidentes-trabajo/${id}/iniciar-investigacion/`
    );
    return data;
  },
};

// ==================== ENFERMEDADES LABORALES ====================

export const enfermedadLaboralApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    tipo_enfermedad?: TipoEnfermedadLaboral;
    estado_calificacion?: EstadoCalificacionEL;
    fecha_desde?: string;
    fecha_hasta?: string;
    trabajador?: number;
  }): Promise<PaginatedResponse<EnfermedadLaboral>> => {
    const { data } = await apiClient.get(`${BASE_URL}/enfermedades-laborales/`, { params });
    return data;
  },

  getById: async (id: number): Promise<EnfermedadLaboral> => {
    const { data } = await apiClient.get(`${BASE_URL}/enfermedades-laborales/${id}/`);
    return data;
  },

  create: async (dto: CreateEnfermedadLaboralDTO): Promise<EnfermedadLaboral> => {
    const { data } = await apiClient.post(`${BASE_URL}/enfermedades-laborales/`, dto);
    return data;
  },

  update: async (id: number, dto: UpdateEnfermedadLaboralDTO): Promise<EnfermedadLaboral> => {
    const { data } = await apiClient.patch(`${BASE_URL}/enfermedades-laborales/${id}/`, dto);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/enfermedades-laborales/${id}/`);
  },

  iniciarInvestigacion: async (id: number): Promise<InvestigacionATEL> => {
    const { data } = await apiClient.post(
      `${BASE_URL}/enfermedades-laborales/${id}/iniciar-investigacion/`
    );
    return data;
  },
};

// ==================== INCIDENTES DE TRABAJO ====================

export const incidenteTrabajoApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    tipo_incidente?: TipoIncidente;
    potencial_gravedad?: PotencialGravedad;
    fecha_desde?: string;
    fecha_hasta?: string;
    hubo_danos_materiales?: boolean;
  }): Promise<PaginatedResponse<IncidenteTrabajo>> => {
    const { data } = await apiClient.get(`${BASE_URL}/incidentes-trabajo/`, { params });
    return data;
  },

  getById: async (id: number): Promise<IncidenteTrabajo> => {
    const { data } = await apiClient.get(`${BASE_URL}/incidentes-trabajo/${id}/`);
    return data;
  },

  create: async (dto: CreateIncidenteTrabajoDTO): Promise<IncidenteTrabajo> => {
    const { data } = await apiClient.post(`${BASE_URL}/incidentes-trabajo/`, dto);
    return data;
  },

  update: async (id: number, dto: UpdateIncidenteTrabajoDTO): Promise<IncidenteTrabajo> => {
    const { data } = await apiClient.patch(`${BASE_URL}/incidentes-trabajo/${id}/`, dto);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/incidentes-trabajo/${id}/`);
  },

  iniciarInvestigacion: async (id: number): Promise<InvestigacionATEL> => {
    const { data } = await apiClient.post(
      `${BASE_URL}/incidentes-trabajo/${id}/iniciar-investigacion/`
    );
    return data;
  },
};

// ==================== INVESTIGACIONES ATEL ====================

export const investigacionATELApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    estado?: EstadoInvestigacion;
    metodologia?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    lider?: number;
  }): Promise<PaginatedResponse<InvestigacionATEL>> => {
    const { data } = await apiClient.get(`${BASE_URL}/investigaciones/`, { params });
    return data;
  },

  getById: async (id: number): Promise<InvestigacionATEL> => {
    const { data } = await apiClient.get(`${BASE_URL}/investigaciones/${id}/`);
    return data;
  },

  create: async (dto: CreateInvestigacionATELDTO): Promise<InvestigacionATEL> => {
    const { data } = await apiClient.post(`${BASE_URL}/investigaciones/`, dto);
    return data;
  },

  update: async (id: number, dto: UpdateInvestigacionATELDTO): Promise<InvestigacionATEL> => {
    const { data } = await apiClient.patch(`${BASE_URL}/investigaciones/${id}/`, dto);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/investigaciones/${id}/`);
  },

  completar: async (id: number, dto: CompletarInvestigacionDTO): Promise<InvestigacionATEL> => {
    const { data } = await apiClient.post(`${BASE_URL}/investigaciones/${id}/completar/`, dto);
    return data;
  },

  aprobar: async (id: number): Promise<InvestigacionATEL> => {
    const { data } = await apiClient.post(`${BASE_URL}/investigaciones/${id}/aprobar/`);
    return data;
  },

  cerrar: async (id: number): Promise<InvestigacionATEL> => {
    const { data } = await apiClient.post(`${BASE_URL}/investigaciones/${id}/cerrar/`);
    return data;
  },

  agregarCausas: async (id: number, causas: CreateCausaRaizDTO[]): Promise<CausaRaiz[]> => {
    const { data } = await apiClient.post(`${BASE_URL}/investigaciones/${id}/agregar-causas/`, {
      causas,
    });
    return data;
  },
};

// ==================== CAUSAS RAIZ ====================

export const causaRaizApi = {
  getAll: async (params?: {
    investigacion?: number;
    tipo_causa?: string;
  }): Promise<CausaRaiz[]> => {
    const { data } = await apiClient.get(`${BASE_URL}/causas-raiz/`, { params });
    return data;
  },

  getById: async (id: number): Promise<CausaRaiz> => {
    const { data } = await apiClient.get(`${BASE_URL}/causas-raiz/${id}/`);
    return data;
  },

  create: async (dto: CreateCausaRaizDTO): Promise<CausaRaiz> => {
    const { data } = await apiClient.post(`${BASE_URL}/causas-raiz/`, dto);
    return data;
  },

  update: async (id: number, dto: UpdateCausaRaizDTO): Promise<CausaRaiz> => {
    const { data } = await apiClient.patch(`${BASE_URL}/causas-raiz/${id}/`, dto);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/causas-raiz/${id}/`);
  },
};

// ==================== LECCIONES APRENDIDAS ====================

export const leccionAprendidaApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    categoria?: string;
    estado_divulgacion?: string;
    investigacion?: number;
  }): Promise<PaginatedResponse<LeccionAprendida>> => {
    const { data } = await apiClient.get(`${BASE_URL}/lecciones-aprendidas/`, { params });
    return data;
  },

  getById: async (id: number): Promise<LeccionAprendida> => {
    const { data } = await apiClient.get(`${BASE_URL}/lecciones-aprendidas/${id}/`);
    return data;
  },

  create: async (dto: CreateLeccionAprendidaDTO): Promise<LeccionAprendida> => {
    const { data } = await apiClient.post(`${BASE_URL}/lecciones-aprendidas/`, dto);
    return data;
  },

  update: async (id: number, dto: UpdateLeccionAprendidaDTO): Promise<LeccionAprendida> => {
    const { data } = await apiClient.patch(`${BASE_URL}/lecciones-aprendidas/${id}/`, dto);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/lecciones-aprendidas/${id}/`);
  },

  divulgar: async (id: number, dto: DivulgarLeccionDTO): Promise<LeccionAprendida> => {
    const { data } = await apiClient.post(`${BASE_URL}/lecciones-aprendidas/${id}/divulgar/`, dto);
    return data;
  },
};

// ==================== PLANES DE ACCION ATEL ====================

export const planAccionATELApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    estado?: EstadoPlanAccion;
    investigacion?: number;
    responsable?: number;
    vencidos?: boolean;
  }): Promise<PaginatedResponse<PlanAccionATEL>> => {
    const { data } = await apiClient.get(`${BASE_URL}/planes-accion/`, { params });
    return data;
  },

  getById: async (id: number): Promise<PlanAccionATEL> => {
    const { data } = await apiClient.get(`${BASE_URL}/planes-accion/${id}/`);
    return data;
  },

  create: async (dto: CreatePlanAccionATELDTO): Promise<PlanAccionATEL> => {
    const { data } = await apiClient.post(`${BASE_URL}/planes-accion/`, dto);
    return data;
  },

  update: async (id: number, dto: UpdatePlanAccionATELDTO): Promise<PlanAccionATEL> => {
    const { data } = await apiClient.patch(`${BASE_URL}/planes-accion/${id}/`, dto);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/planes-accion/${id}/`);
  },

  verificar: async (id: number, dto: VerificarPlanDTO): Promise<PlanAccionATEL> => {
    const { data } = await apiClient.post(`${BASE_URL}/planes-accion/${id}/verificar/`, dto);
    return data;
  },
};

// ==================== ACCIONES DE PLAN ====================

export const accionPlanApi = {
  getAll: async (params?: {
    plan_accion?: number;
    estado?: EstadoAccion;
    responsable?: number;
  }): Promise<AccionPlan[]> => {
    const { data } = await apiClient.get(`${BASE_URL}/acciones-plan/`, { params });
    return data;
  },

  getById: async (id: number): Promise<AccionPlan> => {
    const { data } = await apiClient.get(`${BASE_URL}/acciones-plan/${id}/`);
    return data;
  },

  create: async (dto: CreateAccionPlanDTO): Promise<AccionPlan> => {
    const { data } = await apiClient.post(`${BASE_URL}/acciones-plan/`, dto);
    return data;
  },

  update: async (id: number, dto: UpdateAccionPlanDTO): Promise<AccionPlan> => {
    const { data } = await apiClient.patch(`${BASE_URL}/acciones-plan/${id}/`, dto);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/acciones-plan/${id}/`);
  },

  completar: async (id: number, dto: CompletarAccionDTO): Promise<AccionPlan> => {
    const { data } = await apiClient.post(`${BASE_URL}/acciones-plan/${id}/completar/`, dto);
    return data;
  },

  verificar: async (id: number, dto: VerificarAccionDTO): Promise<AccionPlan> => {
    const { data } = await apiClient.post(`${BASE_URL}/acciones-plan/${id}/verificar/`, dto);
    return data;
  },
};

// ==================== ESTADISTICAS ====================

export const estadisticasApi = {
  getEstadisticas: async (params?: {
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<EstadisticasAccidentalidad> => {
    const { data } = await apiClient.get(`${BASE_URL}/estadisticas/`, { params });
    return data;
  },
};

// ==================== EXPORT DEFAULT ====================

const accidentalidadApi = {
  accidenteTrabajo: accidenteTrabajoApi,
  enfermedadLaboral: enfermedadLaboralApi,
  incidenteTrabajo: incidenteTrabajoApi,
  investigacionATEL: investigacionATELApi,
  causaRaiz: causaRaizApi,
  leccionAprendida: leccionAprendidaApi,
  planAccionATEL: planAccionATELApi,
  accionPlan: accionPlanApi,
  estadisticas: estadisticasApi,
};

export default accidentalidadApi;
