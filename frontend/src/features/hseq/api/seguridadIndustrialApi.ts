/**
 * API Client para Seguridad Industrial - HSEQ Management
 * Sistema de Gestión StrateKaz
 */
import { apiClient } from '@/lib/api-client';
import type {
  TipoPermisoTrabajo,
  PermisoTrabajo,
  CreateTipoPermisoTrabajoDTO,
  UpdateTipoPermisoTrabajoDTO,
  CreatePermisoTrabajoDTO,
  UpdatePermisoTrabajoDTO,
  AprobarPermisoDTO,
  CerrarPermisoDTO,
  TipoInspeccion,
  PlantillaInspeccion,
  Inspeccion,
  CreateTipoInspeccionDTO,
  UpdateTipoInspeccionDTO,
  CreatePlantillaInspeccionDTO,
  UpdatePlantillaInspeccionDTO,
  CreateInspeccionDTO,
  UpdateInspeccionDTO,
  CompletarInspeccionDTO,
  TipoEPP,
  EntregaEPP,
  CreateTipoEPPDTO,
  UpdateTipoEPPDTO,
  CreateEntregaEPPDTO,
  UpdateEntregaEPPDTO,
  DevolverEPPDTO,
  TiposEPPPorCategoria,
  ProgramaSeguridad,
  CreateProgramaSeguridadDTO,
  UpdateProgramaSeguridadDTO,
  ActualizarAvanceProgramaDTO,
  PaginatedResponse,
  EstadisticasPermisosTrabajo,
  EstadisticasInspecciones,
  EstadisticasProgramasSeguridad,
  EstadoPermisoTrabajo,
  EstadoInspeccion,
  EstadoEntregaEPP,
  EstadoProgramaSeguridad,
  CategoriaEPP,
} from '../types/seguridad-industrial.types';

const BASE_URL = '/api/hseq/seguridad-industrial';

// ==================== TIPOS DE PERMISO DE TRABAJO ====================

export const tipoPermisoTrabajoApi = {
  getAll: async (params?: { activo?: boolean }): Promise<TipoPermisoTrabajo[]> => {
    const { data } = await apiClient.get(`${BASE_URL}/tipos-permiso/`, { params });
    return data;
  },

  getById: async (id: number): Promise<TipoPermisoTrabajo> => {
    const { data } = await apiClient.get(`${BASE_URL}/tipos-permiso/${id}/`);
    return data;
  },

  create: async (dto: CreateTipoPermisoTrabajoDTO): Promise<TipoPermisoTrabajo> => {
    const { data } = await apiClient.post(`${BASE_URL}/tipos-permiso/`, dto);
    return data;
  },

  update: async (id: number, dto: UpdateTipoPermisoTrabajoDTO): Promise<TipoPermisoTrabajo> => {
    const { data } = await apiClient.patch(`${BASE_URL}/tipos-permiso/${id}/`, dto);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/tipos-permiso/${id}/`);
  },
};

// ==================== PERMISOS DE TRABAJO ====================

export const permisoTrabajoApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    estado?: EstadoPermisoTrabajo;
    tipo_permiso?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
    solicitante?: number;
  }): Promise<PaginatedResponse<PermisoTrabajo>> => {
    const { data } = await apiClient.get(`${BASE_URL}/permisos-trabajo/`, { params });
    return data;
  },

  getById: async (id: number): Promise<PermisoTrabajo> => {
    const { data } = await apiClient.get(`${BASE_URL}/permisos-trabajo/${id}/`);
    return data;
  },

  create: async (dto: CreatePermisoTrabajoDTO): Promise<PermisoTrabajo> => {
    const { data } = await apiClient.post(`${BASE_URL}/permisos-trabajo/`, dto);
    return data;
  },

  update: async (id: number, dto: UpdatePermisoTrabajoDTO): Promise<PermisoTrabajo> => {
    const { data } = await apiClient.patch(`${BASE_URL}/permisos-trabajo/${id}/`, dto);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/permisos-trabajo/${id}/`);
  },

  aprobar: async (id: number, dto: AprobarPermisoDTO): Promise<PermisoTrabajo> => {
    const { data } = await apiClient.post(`${BASE_URL}/permisos-trabajo/${id}/aprobar/`, dto);
    return data;
  },

  cerrar: async (id: number, dto: CerrarPermisoDTO): Promise<PermisoTrabajo> => {
    const { data } = await apiClient.post(`${BASE_URL}/permisos-trabajo/${id}/cerrar/`, dto);
    return data;
  },

  estadisticas: async (): Promise<EstadisticasPermisosTrabajo> => {
    const { data } = await apiClient.get(`${BASE_URL}/permisos-trabajo/estadisticas/`);
    return data;
  },
};

// ==================== TIPOS DE INSPECCION ====================

export const tipoInspeccionApi = {
  getAll: async (params?: { activo?: boolean }): Promise<TipoInspeccion[]> => {
    const { data } = await apiClient.get(`${BASE_URL}/tipos-inspeccion/`, { params });
    return data;
  },

  getById: async (id: number): Promise<TipoInspeccion> => {
    const { data } = await apiClient.get(`${BASE_URL}/tipos-inspeccion/${id}/`);
    return data;
  },

  create: async (dto: CreateTipoInspeccionDTO): Promise<TipoInspeccion> => {
    const { data } = await apiClient.post(`${BASE_URL}/tipos-inspeccion/`, dto);
    return data;
  },

  update: async (id: number, dto: UpdateTipoInspeccionDTO): Promise<TipoInspeccion> => {
    const { data } = await apiClient.patch(`${BASE_URL}/tipos-inspeccion/${id}/`, dto);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/tipos-inspeccion/${id}/`);
  },
};

// ==================== PLANTILLAS DE INSPECCION ====================

export const plantillaInspeccionApi = {
  getAll: async (params?: {
    tipo_inspeccion?: number;
    activo?: boolean;
  }): Promise<PlantillaInspeccion[]> => {
    const { data } = await apiClient.get(`${BASE_URL}/plantillas-inspeccion/`, { params });
    return data;
  },

  getById: async (id: number): Promise<PlantillaInspeccion> => {
    const { data } = await apiClient.get(`${BASE_URL}/plantillas-inspeccion/${id}/`);
    return data;
  },

  create: async (dto: CreatePlantillaInspeccionDTO): Promise<PlantillaInspeccion> => {
    const { data } = await apiClient.post(`${BASE_URL}/plantillas-inspeccion/`, dto);
    return data;
  },

  update: async (id: number, dto: UpdatePlantillaInspeccionDTO): Promise<PlantillaInspeccion> => {
    const { data } = await apiClient.patch(`${BASE_URL}/plantillas-inspeccion/${id}/`, dto);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/plantillas-inspeccion/${id}/`);
  },
};

// ==================== INSPECCIONES ====================

export const inspeccionApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    estado?: EstadoInspeccion;
    tipo_inspeccion?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
    inspector?: number;
  }): Promise<PaginatedResponse<Inspeccion>> => {
    const { data } = await apiClient.get(`${BASE_URL}/inspecciones/`, { params });
    return data;
  },

  getById: async (id: number): Promise<Inspeccion> => {
    const { data } = await apiClient.get(`${BASE_URL}/inspecciones/${id}/`);
    return data;
  },

  create: async (dto: CreateInspeccionDTO): Promise<Inspeccion> => {
    const { data } = await apiClient.post(`${BASE_URL}/inspecciones/`, dto);
    return data;
  },

  update: async (id: number, dto: UpdateInspeccionDTO): Promise<Inspeccion> => {
    const { data } = await apiClient.patch(`${BASE_URL}/inspecciones/${id}/`, dto);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/inspecciones/${id}/`);
  },

  crearDesdePlantilla: async (dto: CreateInspeccionDTO): Promise<Inspeccion> => {
    const { data } = await apiClient.post(`${BASE_URL}/inspecciones/crear-desde-plantilla/`, dto);
    return data;
  },

  completar: async (id: number, dto: CompletarInspeccionDTO): Promise<Inspeccion> => {
    const { data } = await apiClient.post(`${BASE_URL}/inspecciones/${id}/completar/`, dto);
    return data;
  },

  generarHallazgo: async (id: number, itemId: number): Promise<unknown> => {
    const { data } = await apiClient.post(`${BASE_URL}/inspecciones/${id}/generar-hallazgo/`, {
      item_id: itemId,
    });
    return data;
  },

  estadisticas: async (): Promise<EstadisticasInspecciones> => {
    const { data } = await apiClient.get(`${BASE_URL}/inspecciones/estadisticas/`);
    return data;
  },
};

// ==================== TIPOS DE EPP ====================

export const tipoEPPApi = {
  getAll: async (params?: {
    activo?: boolean;
    categoria?: CategoriaEPP;
  }): Promise<TipoEPP[]> => {
    const { data } = await apiClient.get(`${BASE_URL}/tipos-epp/`, { params });
    return data;
  },

  getById: async (id: number): Promise<TipoEPP> => {
    const { data } = await apiClient.get(`${BASE_URL}/tipos-epp/${id}/`);
    return data;
  },

  create: async (dto: CreateTipoEPPDTO): Promise<TipoEPP> => {
    const { data } = await apiClient.post(`${BASE_URL}/tipos-epp/`, dto);
    return data;
  },

  update: async (id: number, dto: UpdateTipoEPPDTO): Promise<TipoEPP> => {
    const { data } = await apiClient.patch(`${BASE_URL}/tipos-epp/${id}/`, dto);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/tipos-epp/${id}/`);
  },

  porCategoria: async (): Promise<TiposEPPPorCategoria[]> => {
    const { data } = await apiClient.get(`${BASE_URL}/tipos-epp/por-categoria/`);
    return data;
  },
};

// ==================== ENTREGAS EPP ====================

export const entregaEPPApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    estado?: EstadoEntregaEPP;
    colaborador?: number;
    tipo_epp?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<PaginatedResponse<EntregaEPP>> => {
    const { data } = await apiClient.get(`${BASE_URL}/entregas-epp/`, { params });
    return data;
  },

  getById: async (id: number): Promise<EntregaEPP> => {
    const { data } = await apiClient.get(`${BASE_URL}/entregas-epp/${id}/`);
    return data;
  },

  create: async (dto: CreateEntregaEPPDTO): Promise<EntregaEPP> => {
    const { data } = await apiClient.post(`${BASE_URL}/entregas-epp/`, dto);
    return data;
  },

  update: async (id: number, dto: UpdateEntregaEPPDTO): Promise<EntregaEPP> => {
    const { data } = await apiClient.patch(`${BASE_URL}/entregas-epp/${id}/`, dto);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/entregas-epp/${id}/`);
  },

  devolver: async (id: number, dto: DevolverEPPDTO): Promise<EntregaEPP> => {
    const { data } = await apiClient.post(`${BASE_URL}/entregas-epp/${id}/devolver/`, dto);
    return data;
  },

  porColaborador: async (colaboradorId: number): Promise<EntregaEPP[]> => {
    const { data } = await apiClient.get(`${BASE_URL}/entregas-epp/por-colaborador/${colaboradorId}/`);
    return data;
  },

  porVencer: async (): Promise<EntregaEPP[]> => {
    const { data } = await apiClient.get(`${BASE_URL}/entregas-epp/por-vencer/`);
    return data;
  },
};

// ==================== PROGRAMAS DE SEGURIDAD ====================

export const programaSeguridadApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    estado?: EstadoProgramaSeguridad;
    tipo_programa?: string;
    responsable?: number;
    vigente?: boolean;
  }): Promise<PaginatedResponse<ProgramaSeguridad>> => {
    const { data } = await apiClient.get(`${BASE_URL}/programas-seguridad/`, { params });
    return data;
  },

  getById: async (id: number): Promise<ProgramaSeguridad> => {
    const { data } = await apiClient.get(`${BASE_URL}/programas-seguridad/${id}/`);
    return data;
  },

  create: async (dto: CreateProgramaSeguridadDTO): Promise<ProgramaSeguridad> => {
    const { data } = await apiClient.post(`${BASE_URL}/programas-seguridad/`, dto);
    return data;
  },

  update: async (id: number, dto: UpdateProgramaSeguridadDTO): Promise<ProgramaSeguridad> => {
    const { data } = await apiClient.patch(`${BASE_URL}/programas-seguridad/${id}/`, dto);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/programas-seguridad/${id}/`);
  },

  actualizarAvance: async (id: number, dto: ActualizarAvanceProgramaDTO): Promise<ProgramaSeguridad> => {
    const { data } = await apiClient.post(`${BASE_URL}/programas-seguridad/${id}/actualizar-avance/`, dto);
    return data;
  },

  estadisticas: async (): Promise<EstadisticasProgramasSeguridad> => {
    const { data } = await apiClient.get(`${BASE_URL}/programas-seguridad/estadisticas/`);
    return data;
  },
};

// ==================== EXPORT DEFAULT ====================

const seguridadIndustrialApi = {
  tipoPermisoTrabajo: tipoPermisoTrabajoApi,
  permisoTrabajo: permisoTrabajoApi,
  tipoInspeccion: tipoInspeccionApi,
  plantillaInspeccion: plantillaInspeccionApi,
  inspeccion: inspeccionApi,
  tipoEPP: tipoEPPApi,
  entregaEPP: entregaEPPApi,
  programaSeguridad: programaSeguridadApi,
};

export default seguridadIndustrialApi;
