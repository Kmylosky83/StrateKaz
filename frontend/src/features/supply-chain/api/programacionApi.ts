/**
 * API Functions para Programación de Abastecimiento - Supply Chain
 * Sistema de Gestión StrateKaz
 */

import axios from 'axios';
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

const BASE_URL = '/api/v1/supply-chain/programacion-abastecimiento';

// ==================== CATÁLOGOS ====================

const catalogosApi = {
  // Tipos de Operación
  tiposOperacion: {
    getAll: () => axios.get<TipoOperacion[]>(`${BASE_URL}/tipos-operacion/`),
    getById: (id: number) => axios.get<TipoOperacion>(`${BASE_URL}/tipos-operacion/${id}/`),
    getActivos: () => axios.get<TipoOperacion[]>(`${BASE_URL}/tipos-operacion/?is_active=true`),
  },

  // Estados de Programación
  estadosProgramacion: {
    getAll: () => axios.get<EstadoProgramacion[]>(`${BASE_URL}/estados-programacion/`),
    getById: (id: number) => axios.get<EstadoProgramacion>(`${BASE_URL}/estados-programacion/${id}/`),
    getActivos: () => axios.get<EstadoProgramacion[]>(`${BASE_URL}/estados-programacion/?is_active=true`),
  },

  // Unidades de Medida
  unidadesMedida: {
    getAll: () => axios.get<UnidadMedida[]>(`${BASE_URL}/unidades-medida/`),
    getById: (id: number) => axios.get<UnidadMedida>(`${BASE_URL}/unidades-medida/${id}/`),
    getActivos: () => axios.get<UnidadMedida[]>(`${BASE_URL}/unidades-medida/?is_active=true`),
  },

  // Estados de Ejecución
  estadosEjecucion: {
    getAll: () => axios.get<EstadoEjecucion[]>(`${BASE_URL}/estados-ejecucion/`),
    getById: (id: number) => axios.get<EstadoEjecucion>(`${BASE_URL}/estados-ejecucion/${id}/`),
    getActivos: () => axios.get<EstadoEjecucion[]>(`${BASE_URL}/estados-ejecucion/?is_active=true`),
  },

  // Estados de Liquidación
  estadosLiquidacion: {
    getAll: () => axios.get<EstadoLiquidacion[]>(`${BASE_URL}/estados-liquidacion/`),
    getById: (id: number) => axios.get<EstadoLiquidacion>(`${BASE_URL}/estados-liquidacion/${id}/`),
    getActivos: () => axios.get<EstadoLiquidacion[]>(`${BASE_URL}/estados-liquidacion/?is_active=true`),
  },
};

// ==================== PROGRAMACIONES ====================

const programacionApi = {
  getAll: (params?: Record<string, any>) =>
    axios.get<PaginatedResponse<ProgramacionList>>(`${BASE_URL}/programaciones/`, { params }),

  getById: (id: number) =>
    axios.get<Programacion>(`${BASE_URL}/programaciones/${id}/`),

  create: (data: CreateProgramacionDTO) =>
    axios.post<Programacion>(`${BASE_URL}/programaciones/`, data),

  update: (id: number, data: UpdateProgramacionDTO) =>
    axios.patch<Programacion>(`${BASE_URL}/programaciones/${id}/`, data),

  delete: (id: number) =>
    axios.delete(`${BASE_URL}/programaciones/${id}/`),

  restore: (id: number) =>
    axios.post<Programacion>(`${BASE_URL}/programaciones/${id}/restore/`),

  // Calendario de programaciones
  calendario: (params?: { fecha_inicio?: string; fecha_fin?: string; tipo_operacion?: number }) =>
    axios.get<CalendarioEvent[]>(`${BASE_URL}/programaciones/calendario/`, { params }),

  // Estadísticas
  estadisticas: (params?: { fecha_inicio?: string; fecha_fin?: string }) =>
    axios.get<EstadisticasResponse>(`${BASE_URL}/programaciones/estadisticas/`, { params }),
};

// ==================== ASIGNACIÓN DE RECURSOS ====================

const asignacionRecursoApi = {
  getAll: (params?: Record<string, any>) =>
    axios.get<PaginatedResponse<AsignacionRecurso>>(`${BASE_URL}/asignaciones-recursos/`, { params }),

  getById: (id: number) =>
    axios.get<AsignacionRecurso>(`${BASE_URL}/asignaciones-recursos/${id}/`),

  create: (data: CreateAsignacionRecursoDTO) =>
    axios.post<AsignacionRecurso>(`${BASE_URL}/asignaciones-recursos/`, data),

  update: (id: number, data: UpdateAsignacionRecursoDTO) =>
    axios.patch<AsignacionRecurso>(`${BASE_URL}/asignaciones-recursos/${id}/`, data),

  delete: (id: number) =>
    axios.delete(`${BASE_URL}/asignaciones-recursos/${id}/`),

  // Asignar recursos a programación
  asignarRecursos: (programacionId: number, data: CreateAsignacionRecursoDTO) =>
    axios.post<AsignacionRecurso>(`${BASE_URL}/programaciones/${programacionId}/asignar-recursos/`, data),
};

// ==================== EJECUCIONES ====================

const ejecucionApi = {
  getAll: (params?: Record<string, any>) =>
    axios.get<PaginatedResponse<Ejecucion>>(`${BASE_URL}/ejecuciones/`, { params }),

  getById: (id: number) =>
    axios.get<Ejecucion>(`${BASE_URL}/ejecuciones/${id}/`),

  create: (data: CreateEjecucionDTO) =>
    axios.post<Ejecucion>(`${BASE_URL}/ejecuciones/`, data),

  update: (id: number, data: UpdateEjecucionDTO) =>
    axios.patch<Ejecucion>(`${BASE_URL}/ejecuciones/${id}/`, data),

  delete: (id: number) =>
    axios.delete(`${BASE_URL}/ejecuciones/${id}/`),

  // Completar ejecución
  completar: (id: number, data: { fecha_fin?: string; observaciones?: string }) =>
    axios.post<Ejecucion>(`${BASE_URL}/ejecuciones/${id}/completar/`, data),
};

// ==================== LIQUIDACIONES ====================

const liquidacionApi = {
  getAll: (params?: Record<string, any>) =>
    axios.get<PaginatedResponse<Liquidacion>>(`${BASE_URL}/liquidaciones/`, { params }),

  getById: (id: number) =>
    axios.get<Liquidacion>(`${BASE_URL}/liquidaciones/${id}/`),

  create: (data: CreateLiquidacionDTO) =>
    axios.post<Liquidacion>(`${BASE_URL}/liquidaciones/`, data),

  update: (id: number, data: UpdateLiquidacionDTO) =>
    axios.patch<Liquidacion>(`${BASE_URL}/liquidaciones/${id}/`, data),

  delete: (id: number) =>
    axios.delete(`${BASE_URL}/liquidaciones/${id}/`),

  // Aprobar liquidación
  aprobar: (id: number, data?: { observaciones?: string }) =>
    axios.post<Liquidacion>(`${BASE_URL}/liquidaciones/${id}/aprobar/`, data),

  // Generar cuenta por pagar
  generarCxP: (id: number) =>
    axios.post<Liquidacion>(`${BASE_URL}/liquidaciones/${id}/generar-cxp/`),
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
