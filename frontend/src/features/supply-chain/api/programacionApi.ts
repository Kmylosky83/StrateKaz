/**
 * API Functions para Programación de Abastecimiento - Supply Chain
 * Sistema de Gestión StrateKaz
 */

import apiClient from '@/api/axios-config';
import type {
  Programacion,
  ProgramacionList,
  AsignacionRecurso,
  Ejecucion,
  Liquidacion,
  TipoOperacion,
  EstadoProgramacion,
  UnidadMedida,
  EstadoEjecucion,
  EstadoLiquidacion,
  CreateProgramacionDTO,
  UpdateProgramacionDTO,
  CreateAsignacionRecursoDTO,
  UpdateAsignacionRecursoDTO,
  CreateEjecucionDTO,
  UpdateEjecucionDTO,
  CreateLiquidacionDTO,
  UpdateLiquidacionDTO,
  PaginatedResponse,
  CalendarioEvent,
  EstadisticasResponse,
} from '../types';

const BASE_URL = '/api/supply-chain/programacion-abastecimiento';

// ==================== CATÁLOGOS ====================

const catalogosApi = {
  // Tipos de Operación
  tiposOperacion: {
    getAll: () => apiClient.get<TipoOperacion[]>(`${BASE_URL}/tipos-operacion/`),
    getById: (id: number) => apiClient.get<TipoOperacion>(`${BASE_URL}/tipos-operacion/${id}/`),
    getActivos: () => apiClient.get<TipoOperacion[]>(`${BASE_URL}/tipos-operacion/?is_active=true`),
  },

  // Estados de Programación
  estadosProgramacion: {
    getAll: () => apiClient.get<EstadoProgramacion[]>(`${BASE_URL}/estados-programacion/`),
    getById: (id: number) =>
      apiClient.get<EstadoProgramacion>(`${BASE_URL}/estados-programacion/${id}/`),
    getActivos: () =>
      apiClient.get<EstadoProgramacion[]>(`${BASE_URL}/estados-programacion/?is_active=true`),
  },

  // Unidades de Medida
  unidadesMedida: {
    getAll: () => apiClient.get<UnidadMedida[]>(`${BASE_URL}/unidades-medida/`),
    getById: (id: number) => apiClient.get<UnidadMedida>(`${BASE_URL}/unidades-medida/${id}/`),
    getActivos: () => apiClient.get<UnidadMedida[]>(`${BASE_URL}/unidades-medida/?is_active=true`),
  },

  // Estados de Ejecución
  estadosEjecucion: {
    getAll: () => apiClient.get<EstadoEjecucion[]>(`${BASE_URL}/estados-ejecucion/`),
    getById: (id: number) => apiClient.get<EstadoEjecucion>(`${BASE_URL}/estados-ejecucion/${id}/`),
    getActivos: () =>
      apiClient.get<EstadoEjecucion[]>(`${BASE_URL}/estados-ejecucion/?is_active=true`),
  },

  // Estados de Liquidación
  estadosLiquidacion: {
    getAll: () => apiClient.get<EstadoLiquidacion[]>(`${BASE_URL}/estados-liquidacion/`),
    getById: (id: number) =>
      apiClient.get<EstadoLiquidacion>(`${BASE_URL}/estados-liquidacion/${id}/`),
    getActivos: () =>
      apiClient.get<EstadoLiquidacion[]>(`${BASE_URL}/estados-liquidacion/?is_active=true`),
  },
};

// ==================== PROGRAMACIONES ====================

const programacionApi = {
  getAll: (params?: Record<string, any>) =>
    apiClient.get<PaginatedResponse<ProgramacionList>>(`${BASE_URL}/programaciones/`, { params }),

  getById: (id: number) => apiClient.get<Programacion>(`${BASE_URL}/programaciones/${id}/`),

  create: (data: CreateProgramacionDTO) =>
    apiClient.post<Programacion>(`${BASE_URL}/programaciones/`, data),

  update: (id: number, data: UpdateProgramacionDTO) =>
    apiClient.patch<Programacion>(`${BASE_URL}/programaciones/${id}/`, data),

  delete: (id: number) => apiClient.delete(`${BASE_URL}/programaciones/${id}/`),

  restore: (id: number) =>
    apiClient.post<Programacion>(`${BASE_URL}/programaciones/${id}/restore/`),

  // Calendario de programaciones
  calendario: (params?: { fecha_inicio?: string; fecha_fin?: string; tipo_operacion?: number }) =>
    apiClient.get<CalendarioEvent[]>(`${BASE_URL}/programaciones/calendario/`, { params }),

  // Estadísticas
  estadisticas: (params?: { fecha_inicio?: string; fecha_fin?: string }) =>
    apiClient.get<EstadisticasResponse>(`${BASE_URL}/programaciones/estadisticas/`, { params }),
};

// ==================== ASIGNACIÓN DE RECURSOS ====================

const asignacionRecursoApi = {
  getAll: (params?: Record<string, any>) =>
    apiClient.get<PaginatedResponse<AsignacionRecurso>>(`${BASE_URL}/asignaciones-recursos/`, {
      params,
    }),

  getById: (id: number) =>
    apiClient.get<AsignacionRecurso>(`${BASE_URL}/asignaciones-recursos/${id}/`),

  create: (data: CreateAsignacionRecursoDTO) =>
    apiClient.post<AsignacionRecurso>(`${BASE_URL}/asignaciones-recursos/`, data),

  update: (id: number, data: UpdateAsignacionRecursoDTO) =>
    apiClient.patch<AsignacionRecurso>(`${BASE_URL}/asignaciones-recursos/${id}/`, data),

  delete: (id: number) => apiClient.delete(`${BASE_URL}/asignaciones-recursos/${id}/`),

  // Asignar recursos a programación
  asignarRecursos: (programacionId: number, data: CreateAsignacionRecursoDTO) =>
    apiClient.post<AsignacionRecurso>(
      `${BASE_URL}/programaciones/${programacionId}/asignar-recursos/`,
      data
    ),
};

// ==================== EJECUCIONES ====================

const ejecucionApi = {
  getAll: (params?: Record<string, any>) =>
    apiClient.get<PaginatedResponse<Ejecucion>>(`${BASE_URL}/ejecuciones/`, { params }),

  getById: (id: number) => apiClient.get<Ejecucion>(`${BASE_URL}/ejecuciones/${id}/`),

  create: (data: CreateEjecucionDTO) => apiClient.post<Ejecucion>(`${BASE_URL}/ejecuciones/`, data),

  update: (id: number, data: UpdateEjecucionDTO) =>
    apiClient.patch<Ejecucion>(`${BASE_URL}/ejecuciones/${id}/`, data),

  delete: (id: number) => apiClient.delete(`${BASE_URL}/ejecuciones/${id}/`),

  // Completar ejecución
  completar: (id: number, data: { fecha_fin?: string; observaciones?: string }) =>
    apiClient.post<Ejecucion>(`${BASE_URL}/ejecuciones/${id}/completar/`, data),
};

// ==================== LIQUIDACIONES ====================

const liquidacionApi = {
  getAll: (params?: Record<string, any>) =>
    apiClient.get<PaginatedResponse<Liquidacion>>(`${BASE_URL}/liquidaciones/`, { params }),

  getById: (id: number) => apiClient.get<Liquidacion>(`${BASE_URL}/liquidaciones/${id}/`),

  create: (data: CreateLiquidacionDTO) =>
    apiClient.post<Liquidacion>(`${BASE_URL}/liquidaciones/`, data),

  update: (id: number, data: UpdateLiquidacionDTO) =>
    apiClient.patch<Liquidacion>(`${BASE_URL}/liquidaciones/${id}/`, data),

  delete: (id: number) => apiClient.delete(`${BASE_URL}/liquidaciones/${id}/`),

  // Aprobar liquidación
  aprobar: (id: number, data?: { observaciones?: string }) =>
    apiClient.post<Liquidacion>(`${BASE_URL}/liquidaciones/${id}/aprobar/`, data),

  // Generar cuenta por pagar
  generarCxP: (id: number) =>
    apiClient.post<Liquidacion>(`${BASE_URL}/liquidaciones/${id}/generar-cxp/`),
};

// ==================== EXPORT ====================

const programacionAbastecimientoApi = {
  catalogos: catalogosApi,
  programacion: programacionApi,
  asignacionRecurso: asignacionRecursoApi,
  ejecucion: ejecucionApi,
  liquidacion: liquidacionApi,
};

export default programacionAbastecimientoApi;
