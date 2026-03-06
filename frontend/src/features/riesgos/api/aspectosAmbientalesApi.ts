/**
 * API Client para Aspectos Ambientales - ISO 14001
 * Sistema de Gestión Ambiental
 *
 * Sincronizado con backend: apps/motor_riesgos/aspectos_ambientales/
 * URL base: /api/riesgos/aspectos-ambientales/
 * Fecha sincronización: 2026-03-05
 */
import apiClient from '@/api/axios-config';
import type {
  CategoriaAspecto,
  CategoriaAspectoCreate,
  CategoriaAspectoUpdate,
  AspectoAmbiental,
  AspectoAmbientalList,
  AspectoAmbientalCreate,
  AspectoAmbientalUpdate,
  AspectoAmbientalFilter,
  ImpactoAmbiental,
  ImpactoAmbientalCreate,
  ImpactoAmbientalUpdate,
  ImpactoAmbientalFilter,
  ProgramaAmbiental,
  ProgramaAmbientalList,
  ProgramaAmbientalCreate,
  ProgramaAmbientalUpdate,
  ProgramaAmbientalFilter,
  MonitoreoAmbiental,
  MonitoreoAmbientalCreate,
  MonitoreoAmbientalUpdate,
  MonitoreoAmbientalFilter,
  ResumenAspectosAmbientales,
  ResumenProgramasAmbientales,
  ResumenMonitoreosAmbientales,
} from '../types/aspectos-ambientales.types';

const BASE_URL = '/riesgos/aspectos-ambientales';

// ============================================
// CATEGORIAS DE ASPECTOS (Catálogo)
// Router: categorias/ — CategoriaAspectoViewSet
// ============================================

export const categoriasAspectoApi = {
  getAll: async (): Promise<CategoriaAspecto[]> => {
    const { data } = await apiClient.get<CategoriaAspecto[]>(`${BASE_URL}/categorias/`);
    return Array.isArray(data)
      ? data
      : (((data as Record<string, unknown>)?.results as CategoriaAspecto[]) ?? []);
  },

  getById: async (id: number): Promise<CategoriaAspecto> => {
    const { data } = await apiClient.get<CategoriaAspecto>(`${BASE_URL}/categorias/${id}/`);
    return data;
  },

  create: async (payload: CategoriaAspectoCreate): Promise<CategoriaAspecto> => {
    const { data } = await apiClient.post<CategoriaAspecto>(`${BASE_URL}/categorias/`, payload);
    return data;
  },

  update: async (id: number, payload: CategoriaAspectoUpdate): Promise<CategoriaAspecto> => {
    const { data } = await apiClient.patch<CategoriaAspecto>(
      `${BASE_URL}/categorias/${id}/`,
      payload
    );
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/categorias/${id}/`);
  },
};

// ============================================
// ASPECTOS AMBIENTALES
// Router: aspectos/ — AspectoAmbientalViewSet
// ============================================

export const aspectosAmbientalesApi = {
  getAll: async (filters?: AspectoAmbientalFilter): Promise<AspectoAmbientalList[]> => {
    const { data } = await apiClient.get<AspectoAmbientalList[]>(`${BASE_URL}/aspectos/`, {
      params: filters,
    });
    return Array.isArray(data)
      ? data
      : (((data as Record<string, unknown>)?.results as AspectoAmbientalList[]) ?? []);
  },

  getById: async (id: number): Promise<AspectoAmbiental> => {
    const { data } = await apiClient.get<AspectoAmbiental>(`${BASE_URL}/aspectos/${id}/`);
    return data;
  },

  create: async (payload: AspectoAmbientalCreate): Promise<AspectoAmbiental> => {
    const { data } = await apiClient.post<AspectoAmbiental>(`${BASE_URL}/aspectos/`, payload);
    return data;
  },

  update: async (id: number, payload: AspectoAmbientalUpdate): Promise<AspectoAmbiental> => {
    const { data } = await apiClient.patch<AspectoAmbiental>(
      `${BASE_URL}/aspectos/${id}/`,
      payload
    );
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/aspectos/${id}/`);
  },

  // @action resumen — sin url_path (usa nombre del método)
  resumen: async (): Promise<ResumenAspectosAmbientales> => {
    const { data } = await apiClient.get<ResumenAspectosAmbientales>(
      `${BASE_URL}/aspectos/resumen/`
    );
    return data;
  },

  // @action significativos
  significativos: async (): Promise<AspectoAmbientalList[]> => {
    const { data } = await apiClient.get<AspectoAmbientalList[]>(
      `${BASE_URL}/aspectos/significativos/`
    );
    return Array.isArray(data)
      ? data
      : (((data as Record<string, unknown>)?.results as AspectoAmbientalList[]) ?? []);
  },

  // @action criticos
  criticos: async (): Promise<AspectoAmbientalList[]> => {
    const { data } = await apiClient.get<AspectoAmbientalList[]>(`${BASE_URL}/aspectos/criticos/`);
    return Array.isArray(data)
      ? data
      : (((data as Record<string, unknown>)?.results as AspectoAmbientalList[]) ?? []);
  },

  // @action incumplimiento_legal — url_path='incumplimiento-legal'
  incumplimientoLegal: async (): Promise<AspectoAmbientalList[]> => {
    const { data } = await apiClient.get<AspectoAmbientalList[]>(
      `${BASE_URL}/aspectos/incumplimiento-legal/`
    );
    return Array.isArray(data)
      ? data
      : (((data as Record<string, unknown>)?.results as AspectoAmbientalList[]) ?? []);
  },
};

// ============================================
// IMPACTOS AMBIENTALES
// Router: impactos/ — ImpactoAmbientalViewSet
// ============================================

export const impactosAmbientalesApi = {
  getAll: async (filters?: ImpactoAmbientalFilter): Promise<ImpactoAmbiental[]> => {
    const { data } = await apiClient.get<ImpactoAmbiental[]>(`${BASE_URL}/impactos/`, {
      params: filters,
    });
    return Array.isArray(data)
      ? data
      : (((data as Record<string, unknown>)?.results as ImpactoAmbiental[]) ?? []);
  },

  getById: async (id: number): Promise<ImpactoAmbiental> => {
    const { data } = await apiClient.get<ImpactoAmbiental>(`${BASE_URL}/impactos/${id}/`);
    return data;
  },

  create: async (payload: ImpactoAmbientalCreate): Promise<ImpactoAmbiental> => {
    const { data } = await apiClient.post<ImpactoAmbiental>(`${BASE_URL}/impactos/`, payload);
    return data;
  },

  update: async (id: number, payload: ImpactoAmbientalUpdate): Promise<ImpactoAmbiental> => {
    const { data } = await apiClient.patch<ImpactoAmbiental>(
      `${BASE_URL}/impactos/${id}/`,
      payload
    );
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/impactos/${id}/`);
  },

  // @action por_componente — url_path='por-componente'
  porComponente: async (): Promise<Array<{ componente_ambiental: string; cantidad: number }>> => {
    const { data } = await apiClient.get<Array<{ componente_ambiental: string; cantidad: number }>>(
      `${BASE_URL}/impactos/por-componente/`
    );
    return data;
  },

  // Filtrar impactos por aspecto (query param)
  getByAspecto: async (aspectoId: number): Promise<ImpactoAmbiental[]> => {
    const { data } = await apiClient.get<ImpactoAmbiental[]>(`${BASE_URL}/impactos/`, {
      params: { aspecto: aspectoId },
    });
    return Array.isArray(data)
      ? data
      : (((data as Record<string, unknown>)?.results as ImpactoAmbiental[]) ?? []);
  },
};

// ============================================
// PROGRAMAS AMBIENTALES
// Router: programas/ — ProgramaAmbientalViewSet
// ============================================

export const programasAmbientalesApi = {
  getAll: async (filters?: ProgramaAmbientalFilter): Promise<ProgramaAmbientalList[]> => {
    const { data } = await apiClient.get<ProgramaAmbientalList[]>(`${BASE_URL}/programas/`, {
      params: filters,
    });
    return Array.isArray(data)
      ? data
      : (((data as Record<string, unknown>)?.results as ProgramaAmbientalList[]) ?? []);
  },

  getById: async (id: number): Promise<ProgramaAmbiental> => {
    const { data } = await apiClient.get<ProgramaAmbiental>(`${BASE_URL}/programas/${id}/`);
    return data;
  },

  create: async (payload: ProgramaAmbientalCreate): Promise<ProgramaAmbiental> => {
    const { data } = await apiClient.post<ProgramaAmbiental>(`${BASE_URL}/programas/`, payload);
    return data;
  },

  update: async (id: number, payload: ProgramaAmbientalUpdate): Promise<ProgramaAmbiental> => {
    const { data } = await apiClient.patch<ProgramaAmbiental>(
      `${BASE_URL}/programas/${id}/`,
      payload
    );
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/programas/${id}/`);
  },

  // @action resumen
  resumen: async (): Promise<ResumenProgramasAmbientales> => {
    const { data } = await apiClient.get<ResumenProgramasAmbientales>(
      `${BASE_URL}/programas/resumen/`
    );
    return data;
  },

  // @action activos
  activos: async (): Promise<ProgramaAmbientalList[]> => {
    const { data } = await apiClient.get<ProgramaAmbientalList[]>(`${BASE_URL}/programas/activos/`);
    return Array.isArray(data)
      ? data
      : (((data as Record<string, unknown>)?.results as ProgramaAmbientalList[]) ?? []);
  },

  // @action vencidos
  vencidos: async (): Promise<ProgramaAmbientalList[]> => {
    const { data } = await apiClient.get<ProgramaAmbientalList[]>(
      `${BASE_URL}/programas/vencidos/`
    );
    return Array.isArray(data)
      ? data
      : (((data as Record<string, unknown>)?.results as ProgramaAmbientalList[]) ?? []);
  },
};

// ============================================
// MONITOREOS AMBIENTALES
// Router: monitoreos/ — MonitoreoAmbientalViewSet
// ============================================

export const monitoreosAmbientalesApi = {
  getAll: async (filters?: MonitoreoAmbientalFilter): Promise<MonitoreoAmbiental[]> => {
    const { data } = await apiClient.get<MonitoreoAmbiental[]>(`${BASE_URL}/monitoreos/`, {
      params: filters,
    });
    return Array.isArray(data)
      ? data
      : (((data as Record<string, unknown>)?.results as MonitoreoAmbiental[]) ?? []);
  },

  getById: async (id: number): Promise<MonitoreoAmbiental> => {
    const { data } = await apiClient.get<MonitoreoAmbiental>(`${BASE_URL}/monitoreos/${id}/`);
    return data;
  },

  create: async (payload: MonitoreoAmbientalCreate): Promise<MonitoreoAmbiental> => {
    const { data } = await apiClient.post<MonitoreoAmbiental>(`${BASE_URL}/monitoreos/`, payload);
    return data;
  },

  update: async (id: number, payload: MonitoreoAmbientalUpdate): Promise<MonitoreoAmbiental> => {
    const { data } = await apiClient.patch<MonitoreoAmbiental>(
      `${BASE_URL}/monitoreos/${id}/`,
      payload
    );
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/monitoreos/${id}/`);
  },

  // @action resumen
  resumen: async (): Promise<ResumenMonitoreosAmbientales> => {
    const { data } = await apiClient.get<ResumenMonitoreosAmbientales>(
      `${BASE_URL}/monitoreos/resumen/`
    );
    return data;
  },

  // @action incumplimientos
  incumplimientos: async (): Promise<MonitoreoAmbiental[]> => {
    const { data } = await apiClient.get<MonitoreoAmbiental[]>(
      `${BASE_URL}/monitoreos/incumplimientos/`
    );
    return Array.isArray(data)
      ? data
      : (((data as Record<string, unknown>)?.results as MonitoreoAmbiental[]) ?? []);
  },

  // @action por_rango_fechas — url_path='por-rango-fechas'
  porRangoFechas: async (fechaInicio: string, fechaFin: string): Promise<MonitoreoAmbiental[]> => {
    const { data } = await apiClient.get<MonitoreoAmbiental[]>(
      `${BASE_URL}/monitoreos/por-rango-fechas/`,
      {
        params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
      }
    );
    return Array.isArray(data)
      ? data
      : (((data as Record<string, unknown>)?.results as MonitoreoAmbiental[]) ?? []);
  },

  // Filtrar monitoreos por aspecto (query param)
  getByAspecto: async (aspectoId: number): Promise<MonitoreoAmbiental[]> => {
    const { data } = await apiClient.get<MonitoreoAmbiental[]>(`${BASE_URL}/monitoreos/`, {
      params: { aspecto: aspectoId },
    });
    return Array.isArray(data)
      ? data
      : (((data as Record<string, unknown>)?.results as MonitoreoAmbiental[]) ?? []);
  },

  // Filtrar monitoreos por programa (query param)
  getByPrograma: async (programaId: number): Promise<MonitoreoAmbiental[]> => {
    const { data } = await apiClient.get<MonitoreoAmbiental[]>(`${BASE_URL}/monitoreos/`, {
      params: { programa: programaId },
    });
    return Array.isArray(data)
      ? data
      : (((data as Record<string, unknown>)?.results as MonitoreoAmbiental[]) ?? []);
  },
};

// ============================================
// EXPORT COMBINADO
// ============================================

export const aspectosAmbientalesModule = {
  categorias: categoriasAspectoApi,
  aspectos: aspectosAmbientalesApi,
  impactos: impactosAmbientalesApi,
  programas: programasAmbientalesApi,
  monitoreos: monitoreosAmbientalesApi,
};

export default aspectosAmbientalesModule;
