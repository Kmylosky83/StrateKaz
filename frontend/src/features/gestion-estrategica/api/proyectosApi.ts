/**
 * API Client para el módulo de Gestión de Proyectos PMI
 * Sistema de Gestión StrateKaz
 * Endpoints alineados con backend urls.py routers
 */
import axiosInstance from '@/api/axios-config';
import type { PaginatedResponse } from '@/types/api.types';
import type {
  Portafolio,
  CreatePortafolioDTO,
  UpdatePortafolioDTO,
  PortafolioFilters,
  Programa,
  CreateProgramaDTO,
  UpdateProgramaDTO,
  ProgramaFilters,
  Proyecto,
  CreateProyectoDTO,
  UpdateProyectoDTO,
  ProyectoFilters,
  CreateProyectoDesdeCambioDTO,
  ProyectosDashboard,
  ProjectCharter,
  CreateCharterDTO,
  UpdateCharterDTO,
  InteresadoProyecto,
  CreateInteresadoDTO,
  UpdateInteresadoDTO,
  InteresadoFilters,
  MatrizPoderInteres,
  FaseProyecto,
  CreateFaseDTO,
  UpdateFaseDTO,
  FaseFilters,
  ActividadProyecto,
  CreateActividadDTO,
  UpdateActividadDTO,
  ActividadFilters,
  KanbanData,
  KanbanReorderItem,
  GanttItem,
  RecursoProyecto,
  CreateRecursoDTO,
  UpdateRecursoDTO,
  RecursoFilters,
  RiesgoProyecto,
  CreateRiesgoDTO,
  UpdateRiesgoDTO,
  RiesgoFilters,
  MatrizRiesgos,
  SeguimientoProyecto,
  CreateSeguimientoDTO,
  UpdateSeguimientoDTO,
  SeguimientoFilters,
  CurvaSPoint,
  LeccionAprendida,
  CreateLeccionDTO,
  UpdateLeccionDTO,
  LeccionFilters,
  ActaCierre,
  CreateActaCierreDTO,
  UpdateActaCierreDTO,
  ActaCierreFilters,
} from '../types/proyectos';

const BASE_URL = '/proyectos';

// ==================== PORTAFOLIOS ====================

export const portafoliosApi = {
  getAll: async (filters?: PortafolioFilters): Promise<PaginatedResponse<Portafolio>> => {
    const response = await axiosInstance.get(`${BASE_URL}/portafolios/`, {
      params: filters,
    });
    return response.data;
  },

  getById: async (id: number): Promise<Portafolio> => {
    const response = await axiosInstance.get(`${BASE_URL}/portafolios/${id}/`);
    return response.data;
  },

  create: async (data: CreatePortafolioDTO): Promise<Portafolio> => {
    const response = await axiosInstance.post(`${BASE_URL}/portafolios/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdatePortafolioDTO): Promise<Portafolio> => {
    const response = await axiosInstance.patch(`${BASE_URL}/portafolios/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/portafolios/${id}/`);
  },
};

// ==================== PROGRAMAS ====================

export const programasApi = {
  getAll: async (filters?: ProgramaFilters): Promise<PaginatedResponse<Programa>> => {
    const response = await axiosInstance.get(`${BASE_URL}/programas/`, {
      params: filters,
    });
    return response.data;
  },

  getById: async (id: number): Promise<Programa> => {
    const response = await axiosInstance.get(`${BASE_URL}/programas/${id}/`);
    return response.data;
  },

  create: async (data: CreateProgramaDTO): Promise<Programa> => {
    const response = await axiosInstance.post(`${BASE_URL}/programas/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateProgramaDTO): Promise<Programa> => {
    const response = await axiosInstance.patch(`${BASE_URL}/programas/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/programas/${id}/`);
  },
};

// ==================== PROYECTOS ====================

export const proyectosApi = {
  getAll: async (filters?: ProyectoFilters): Promise<PaginatedResponse<Proyecto>> => {
    const response = await axiosInstance.get(`${BASE_URL}/proyectos/`, {
      params: filters,
    });
    return response.data;
  },

  getById: async (id: number): Promise<Proyecto> => {
    const response = await axiosInstance.get(`${BASE_URL}/proyectos/${id}/`);
    return response.data;
  },

  create: async (data: CreateProyectoDTO): Promise<Proyecto> => {
    const response = await axiosInstance.post(`${BASE_URL}/proyectos/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateProyectoDTO): Promise<Proyecto> => {
    const response = await axiosInstance.patch(`${BASE_URL}/proyectos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/proyectos/${id}/`);
  },

  getDashboard: async (): Promise<ProyectosDashboard> => {
    const response = await axiosInstance.get(`${BASE_URL}/proyectos/dashboard/`);
    return response.data;
  },

  getPorEstado: async (): Promise<Record<string, Proyecto[]>> => {
    const response = await axiosInstance.get(`${BASE_URL}/proyectos/por-estado/`);
    return response.data;
  },

  cambiarEstado: async (id: number, estado: string): Promise<Proyecto> => {
    const response = await axiosInstance.post(`${BASE_URL}/proyectos/${id}/cambiar-estado/`, {
      estado,
    });
    return response.data;
  },

  crearDesdeCambio: async (
    data: CreateProyectoDesdeCambioDTO
  ): Promise<{ detail: string; proyecto: Proyecto }> => {
    const response = await axiosInstance.post(`${BASE_URL}/proyectos/crear-desde-cambio/`, data);
    return response.data;
  },

  crearDesdeEstrategiaTOWS: async (data: {
    estrategia_id: number;
  }): Promise<{ detail: string; proyecto: Proyecto }> => {
    const response = await axiosInstance.post(
      `${BASE_URL}/proyectos/crear-desde-estrategia-tows/`,
      data
    );
    return response.data;
  },

  getOrigenesChoices: async (): Promise<{
    tipo_origen: Array<{ value: string; label: string }>;
  }> => {
    const response = await axiosInstance.get(`${BASE_URL}/proyectos/origenes-choices/`);
    return response.data;
  },
};

// ==================== PROJECT CHARTER ====================

export const chartersApi = {
  getAll: async (filters?: { proyecto?: number }): Promise<PaginatedResponse<ProjectCharter>> => {
    const response = await axiosInstance.get(`${BASE_URL}/charters/`, { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<ProjectCharter> => {
    const response = await axiosInstance.get(`${BASE_URL}/charters/${id}/`);
    return response.data;
  },

  create: async (data: CreateCharterDTO): Promise<ProjectCharter> => {
    const response = await axiosInstance.post(`${BASE_URL}/charters/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateCharterDTO): Promise<ProjectCharter> => {
    const response = await axiosInstance.patch(`${BASE_URL}/charters/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/charters/${id}/`);
  },

  aprobar: async (
    id: number,
    data: { observaciones_aprobacion?: string }
  ): Promise<ProjectCharter> => {
    const response = await axiosInstance.post(`${BASE_URL}/charters/${id}/aprobar/`, data);
    return response.data;
  },
};

// ==================== INTERESADOS (STAKEHOLDERS) ====================

export const interesadosApi = {
  getAll: async (filters?: InteresadoFilters): Promise<PaginatedResponse<InteresadoProyecto>> => {
    const response = await axiosInstance.get(`${BASE_URL}/interesados/`, { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<InteresadoProyecto> => {
    const response = await axiosInstance.get(`${BASE_URL}/interesados/${id}/`);
    return response.data;
  },

  create: async (data: CreateInteresadoDTO): Promise<InteresadoProyecto> => {
    const response = await axiosInstance.post(`${BASE_URL}/interesados/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateInteresadoDTO): Promise<InteresadoProyecto> => {
    const response = await axiosInstance.patch(`${BASE_URL}/interesados/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/interesados/${id}/`);
  },

  getMatrizPoderInteres: async (proyectoId: number): Promise<MatrizPoderInteres> => {
    const response = await axiosInstance.get(`${BASE_URL}/interesados/matriz-poder-interes/`, {
      params: { proyecto: proyectoId },
    });
    return response.data;
  },

  importarDesdeContexto: async (data: {
    proyecto_id: number;
    partes_interesadas_ids: number[];
  }): Promise<{ detail: string; creados: number }> => {
    const response = await axiosInstance.post(
      `${BASE_URL}/interesados/importar-desde-contexto/`,
      data
    );
    return response.data;
  },
};

// ==================== FASES ====================

export const fasesApi = {
  getAll: async (filters?: FaseFilters): Promise<PaginatedResponse<FaseProyecto>> => {
    const response = await axiosInstance.get(`${BASE_URL}/fases/`, { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<FaseProyecto> => {
    const response = await axiosInstance.get(`${BASE_URL}/fases/${id}/`);
    return response.data;
  },

  create: async (data: CreateFaseDTO): Promise<FaseProyecto> => {
    const response = await axiosInstance.post(`${BASE_URL}/fases/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateFaseDTO): Promise<FaseProyecto> => {
    const response = await axiosInstance.patch(`${BASE_URL}/fases/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/fases/${id}/`);
  },
};

// ==================== ACTIVIDADES ====================

export const actividadesApi = {
  getAll: async (filters?: ActividadFilters): Promise<PaginatedResponse<ActividadProyecto>> => {
    const response = await axiosInstance.get(`${BASE_URL}/actividades/`, { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<ActividadProyecto> => {
    const response = await axiosInstance.get(`${BASE_URL}/actividades/${id}/`);
    return response.data;
  },

  create: async (data: CreateActividadDTO): Promise<ActividadProyecto> => {
    const response = await axiosInstance.post(`${BASE_URL}/actividades/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateActividadDTO): Promise<ActividadProyecto> => {
    const response = await axiosInstance.patch(`${BASE_URL}/actividades/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/actividades/${id}/`);
  },

  getGantt: async (proyectoId: number): Promise<GanttItem[]> => {
    const response = await axiosInstance.get(`${BASE_URL}/actividades/gantt/`, {
      params: { proyecto: proyectoId },
    });
    return response.data;
  },

  getKanban: async (proyectoId: number): Promise<KanbanData> => {
    const response = await axiosInstance.get(`${BASE_URL}/actividades/kanban/`, {
      params: { proyecto_id: proyectoId },
    });
    return response.data;
  },

  reorder: async (items: KanbanReorderItem[]): Promise<{ status: string }> => {
    const response = await axiosInstance.post(`${BASE_URL}/actividades/reorder/`, { items });
    return response.data;
  },
};

// ==================== RECURSOS ====================

export const recursosApi = {
  getAll: async (filters?: RecursoFilters): Promise<PaginatedResponse<RecursoProyecto>> => {
    const response = await axiosInstance.get(`${BASE_URL}/recursos/`, { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<RecursoProyecto> => {
    const response = await axiosInstance.get(`${BASE_URL}/recursos/${id}/`);
    return response.data;
  },

  create: async (data: CreateRecursoDTO): Promise<RecursoProyecto> => {
    const response = await axiosInstance.post(`${BASE_URL}/recursos/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateRecursoDTO): Promise<RecursoProyecto> => {
    const response = await axiosInstance.patch(`${BASE_URL}/recursos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/recursos/${id}/`);
  },
};

// ==================== RIESGOS ====================

export const riesgosProyectoApi = {
  getAll: async (filters?: RiesgoFilters): Promise<PaginatedResponse<RiesgoProyecto>> => {
    const response = await axiosInstance.get(`${BASE_URL}/riesgos/`, { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<RiesgoProyecto> => {
    const response = await axiosInstance.get(`${BASE_URL}/riesgos/${id}/`);
    return response.data;
  },

  create: async (data: CreateRiesgoDTO): Promise<RiesgoProyecto> => {
    const response = await axiosInstance.post(`${BASE_URL}/riesgos/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateRiesgoDTO): Promise<RiesgoProyecto> => {
    const response = await axiosInstance.patch(`${BASE_URL}/riesgos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/riesgos/${id}/`);
  },

  getMatrizRiesgos: async (proyectoId: number): Promise<MatrizRiesgos> => {
    const response = await axiosInstance.get(`${BASE_URL}/riesgos/matriz-riesgos/`, {
      params: { proyecto: proyectoId },
    });
    return response.data;
  },
};

// ==================== SEGUIMIENTOS (EVM) ====================

export const seguimientosApi = {
  getAll: async (filters?: SeguimientoFilters): Promise<PaginatedResponse<SeguimientoProyecto>> => {
    const response = await axiosInstance.get(`${BASE_URL}/seguimientos/`, { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<SeguimientoProyecto> => {
    const response = await axiosInstance.get(`${BASE_URL}/seguimientos/${id}/`);
    return response.data;
  },

  create: async (data: CreateSeguimientoDTO): Promise<SeguimientoProyecto> => {
    const response = await axiosInstance.post(`${BASE_URL}/seguimientos/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateSeguimientoDTO): Promise<SeguimientoProyecto> => {
    const response = await axiosInstance.patch(`${BASE_URL}/seguimientos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/seguimientos/${id}/`);
  },

  getCurvaS: async (proyectoId: number): Promise<CurvaSPoint[]> => {
    const response = await axiosInstance.get(`${BASE_URL}/seguimientos/curva-s/`, {
      params: { proyecto: proyectoId },
    });
    return response.data;
  },
};

// ==================== LECCIONES APRENDIDAS ====================

export const leccionesApi = {
  getAll: async (filters?: LeccionFilters): Promise<PaginatedResponse<LeccionAprendida>> => {
    const response = await axiosInstance.get(`${BASE_URL}/lecciones/`, { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<LeccionAprendida> => {
    const response = await axiosInstance.get(`${BASE_URL}/lecciones/${id}/`);
    return response.data;
  },

  create: async (data: CreateLeccionDTO): Promise<LeccionAprendida> => {
    const response = await axiosInstance.post(`${BASE_URL}/lecciones/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateLeccionDTO): Promise<LeccionAprendida> => {
    const response = await axiosInstance.patch(`${BASE_URL}/lecciones/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/lecciones/${id}/`);
  },

  buscar: async (q: string): Promise<LeccionAprendida[]> => {
    const response = await axiosInstance.get(`${BASE_URL}/lecciones/buscar/`, {
      params: { q },
    });
    return response.data;
  },
};

// ==================== ACTAS DE CIERRE ====================

export const actasCierreApi = {
  getAll: async (filters?: ActaCierreFilters): Promise<PaginatedResponse<ActaCierre>> => {
    const response = await axiosInstance.get(`${BASE_URL}/actas-cierre/`, { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<ActaCierre> => {
    const response = await axiosInstance.get(`${BASE_URL}/actas-cierre/${id}/`);
    return response.data;
  },

  create: async (data: CreateActaCierreDTO): Promise<ActaCierre> => {
    const response = await axiosInstance.post(`${BASE_URL}/actas-cierre/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateActaCierreDTO): Promise<ActaCierre> => {
    const response = await axiosInstance.patch(`${BASE_URL}/actas-cierre/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/actas-cierre/${id}/`);
  },
};
