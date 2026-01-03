/**
 * API Client para el módulo de Gestión de Proyectos PMI
 * Sistema de Gestión StrateKaz
 * Semana 5: Gestión de Proyectos
 */
import axiosInstance from '@/api/axios-config';
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
  EquipoProyecto,
  CreateEquipoProyectoDTO,
  UpdateEquipoProyectoDTO,
  EquipoProyectoFilters,
  HitoProyecto,
  CreateHitoProyectoDTO,
  UpdateHitoProyectoDTO,
  HitoProyectoFilters,
  ProyectosDashboard,
  PaginatedResponse,
  ProyectosChoices,
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

  // Dashboard
  getDashboard: async (): Promise<ProyectosDashboard> => {
    const response = await axiosInstance.get(`${BASE_URL}/proyectos/dashboard/`);
    return response.data;
  },

  // Proyectos por estado (para Kanban)
  getPorEstado: async (): Promise<Record<string, Proyecto[]>> => {
    const response = await axiosInstance.get(`${BASE_URL}/proyectos/por_estado/`);
    return response.data;
  },

  // Cambiar estado del proyecto
  cambiarEstado: async (id: number, estado: string): Promise<Proyecto> => {
    const response = await axiosInstance.post(`${BASE_URL}/proyectos/${id}/cambiar_estado/`, {
      estado,
    });
    return response.data;
  },

  // Actualizar salud del proyecto
  actualizarSalud: async (
    id: number,
    data: { health_status: string; health_notes?: string }
  ): Promise<Proyecto> => {
    const response = await axiosInstance.post(`${BASE_URL}/proyectos/${id}/actualizar_salud/`, data);
    return response.data;
  },
};

// ==================== EQUIPO DE PROYECTO ====================

export const equipoProyectoApi = {
  getAll: async (filters?: EquipoProyectoFilters): Promise<PaginatedResponse<EquipoProyecto>> => {
    const response = await axiosInstance.get(`${BASE_URL}/equipo/`, {
      params: filters,
    });
    return response.data;
  },

  getById: async (id: number): Promise<EquipoProyecto> => {
    const response = await axiosInstance.get(`${BASE_URL}/equipo/${id}/`);
    return response.data;
  },

  create: async (data: CreateEquipoProyectoDTO): Promise<EquipoProyecto> => {
    const response = await axiosInstance.post(`${BASE_URL}/equipo/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateEquipoProyectoDTO): Promise<EquipoProyecto> => {
    const response = await axiosInstance.patch(`${BASE_URL}/equipo/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/equipo/${id}/`);
  },
};

// ==================== HITOS DE PROYECTO ====================

export const hitosProyectoApi = {
  getAll: async (filters?: HitoProyectoFilters): Promise<PaginatedResponse<HitoProyecto>> => {
    const response = await axiosInstance.get(`${BASE_URL}/hitos/`, {
      params: filters,
    });
    return response.data;
  },

  getById: async (id: number): Promise<HitoProyecto> => {
    const response = await axiosInstance.get(`${BASE_URL}/hitos/${id}/`);
    return response.data;
  },

  create: async (data: CreateHitoProyectoDTO): Promise<HitoProyecto> => {
    const response = await axiosInstance.post(`${BASE_URL}/hitos/`, data);
    return response.data;
  },

  update: async (id: number, data: UpdateHitoProyectoDTO): Promise<HitoProyecto> => {
    const response = await axiosInstance.patch(`${BASE_URL}/hitos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/hitos/${id}/`);
  },

  // Completar hito
  completar: async (id: number, data: { evidencia?: string }): Promise<HitoProyecto> => {
    const response = await axiosInstance.post(`${BASE_URL}/hitos/${id}/completar/`, data);
    return response.data;
  },
};

// ==================== CHOICES ====================

export const proyectosChoicesApi = {
  getChoices: async (): Promise<ProyectosChoices> => {
    const response = await axiosInstance.get(`${BASE_URL}/choices/`);
    return response.data;
  },
};
