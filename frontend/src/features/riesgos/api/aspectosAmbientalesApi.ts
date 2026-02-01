/**
 * API Client para Aspectos Ambientales - ISO 14001
 * Sistema de Gestion Ambiental
 */
import { apiClient } from '@/lib/api-client';
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

const BASE_URL = '/api/motor-riesgos/aspectos-ambientales';

// ============================================
// CATEGORIAS DE ASPECTOS (Catalogo)
// ============================================

export const categoriasAspectoApi = {
  getAll: async (): Promise<CategoriaAspecto[]> => {
    const response = await apiClient.get<CategoriaAspecto[]>(`${BASE_URL}/categorias/`);
    return response.data;
  },

  getById: async (id: number): Promise<CategoriaAspecto> => {
    const response = await apiClient.get<CategoriaAspecto>(`${BASE_URL}/categorias/${id}/`);
    return response.data;
  },

  create: async (data: CategoriaAspectoCreate): Promise<CategoriaAspecto> => {
    const response = await apiClient.post<CategoriaAspecto>(`${BASE_URL}/categorias/`, data);
    return response.data;
  },

  update: async (id: number, data: CategoriaAspectoUpdate): Promise<CategoriaAspecto> => {
    const response = await apiClient.patch<CategoriaAspecto>(`${BASE_URL}/categorias/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/categorias/${id}/`);
  },
};

// ============================================
// ASPECTOS AMBIENTALES
// ============================================

export const aspectosAmbientalesApi = {
  getAll: async (filters?: AspectoAmbientalFilter): Promise<AspectoAmbientalList[]> => {
    const response = await apiClient.get<AspectoAmbientalList[]>(`${BASE_URL}/aspectos/`, {
      params: filters,
    });
    return response.data;
  },

  getById: async (id: number): Promise<AspectoAmbiental> => {
    const response = await apiClient.get<AspectoAmbiental>(`${BASE_URL}/aspectos/${id}/`);
    return response.data;
  },

  create: async (data: AspectoAmbientalCreate): Promise<AspectoAmbiental> => {
    const response = await apiClient.post<AspectoAmbiental>(`${BASE_URL}/aspectos/`, data);
    return response.data;
  },

  update: async (id: number, data: AspectoAmbientalUpdate): Promise<AspectoAmbiental> => {
    const response = await apiClient.patch<AspectoAmbiental>(`${BASE_URL}/aspectos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/aspectos/${id}/`);
  },

  // Endpoints especiales
  resumen: async (): Promise<ResumenAspectosAmbientales> => {
    const response = await apiClient.get<ResumenAspectosAmbientales>(`${BASE_URL}/aspectos/resumen/`);
    return response.data;
  },

  significativos: async (): Promise<AspectoAmbientalList[]> => {
    const response = await apiClient.get<AspectoAmbientalList[]>(`${BASE_URL}/aspectos/significativos/`);
    return response.data;
  },

  criticos: async (): Promise<AspectoAmbientalList[]> => {
    const response = await apiClient.get<AspectoAmbientalList[]>(`${BASE_URL}/aspectos/criticos/`);
    return response.data;
  },

  incumplimientoLegal: async (): Promise<AspectoAmbientalList[]> => {
    const response = await apiClient.get<AspectoAmbientalList[]>(`${BASE_URL}/aspectos/incumplimiento_legal/`);
    return response.data;
  },
};

// ============================================
// IMPACTOS AMBIENTALES
// ============================================

export const impactosAmbientalesApi = {
  getAll: async (filters?: ImpactoAmbientalFilter): Promise<ImpactoAmbiental[]> => {
    const response = await apiClient.get<ImpactoAmbiental[]>(`${BASE_URL}/impactos/`, {
      params: filters,
    });
    return response.data;
  },

  getById: async (id: number): Promise<ImpactoAmbiental> => {
    const response = await apiClient.get<ImpactoAmbiental>(`${BASE_URL}/impactos/${id}/`);
    return response.data;
  },

  create: async (data: ImpactoAmbientalCreate): Promise<ImpactoAmbiental> => {
    const response = await apiClient.post<ImpactoAmbiental>(`${BASE_URL}/impactos/`, data);
    return response.data;
  },

  update: async (id: number, data: ImpactoAmbientalUpdate): Promise<ImpactoAmbiental> => {
    const response = await apiClient.patch<ImpactoAmbiental>(`${BASE_URL}/impactos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/impactos/${id}/`);
  },

  // Endpoints especiales
  porComponente: async (): Promise<Array<{ componente_ambiental: string; cantidad: number }>> => {
    const response = await apiClient.get<Array<{ componente_ambiental: string; cantidad: number }>>(
      `${BASE_URL}/impactos/por_componente/`
    );
    return response.data;
  },

  // Obtener impactos de un aspecto especifico
  getByAspecto: async (aspectoId: number): Promise<ImpactoAmbiental[]> => {
    const response = await apiClient.get<ImpactoAmbiental[]>(`${BASE_URL}/impactos/`, {
      params: { aspecto: aspectoId },
    });
    return response.data;
  },
};

// ============================================
// PROGRAMAS AMBIENTALES
// ============================================

export const programasAmbientalesApi = {
  getAll: async (filters?: ProgramaAmbientalFilter): Promise<ProgramaAmbientalList[]> => {
    const response = await apiClient.get<ProgramaAmbientalList[]>(`${BASE_URL}/programas/`, {
      params: filters,
    });
    return response.data;
  },

  getById: async (id: number): Promise<ProgramaAmbiental> => {
    const response = await apiClient.get<ProgramaAmbiental>(`${BASE_URL}/programas/${id}/`);
    return response.data;
  },

  create: async (data: ProgramaAmbientalCreate): Promise<ProgramaAmbiental> => {
    const response = await apiClient.post<ProgramaAmbiental>(`${BASE_URL}/programas/`, data);
    return response.data;
  },

  update: async (id: number, data: ProgramaAmbientalUpdate): Promise<ProgramaAmbiental> => {
    const response = await apiClient.patch<ProgramaAmbiental>(`${BASE_URL}/programas/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/programas/${id}/`);
  },

  // Endpoints especiales
  resumen: async (): Promise<ResumenProgramasAmbientales> => {
    const response = await apiClient.get<ResumenProgramasAmbientales>(`${BASE_URL}/programas/resumen/`);
    return response.data;
  },

  activos: async (): Promise<ProgramaAmbientalList[]> => {
    const response = await apiClient.get<ProgramaAmbientalList[]>(`${BASE_URL}/programas/activos/`);
    return response.data;
  },

  vencidos: async (): Promise<ProgramaAmbientalList[]> => {
    const response = await apiClient.get<ProgramaAmbientalList[]>(`${BASE_URL}/programas/vencidos/`);
    return response.data;
  },
};

// ============================================
// MONITOREOS AMBIENTALES
// ============================================

export const monitoreosAmbientalesApi = {
  getAll: async (filters?: MonitoreoAmbientalFilter): Promise<MonitoreoAmbiental[]> => {
    const response = await apiClient.get<MonitoreoAmbiental[]>(`${BASE_URL}/monitoreos/`, {
      params: filters,
    });
    return response.data;
  },

  getById: async (id: number): Promise<MonitoreoAmbiental> => {
    const response = await apiClient.get<MonitoreoAmbiental>(`${BASE_URL}/monitoreos/${id}/`);
    return response.data;
  },

  create: async (data: MonitoreoAmbientalCreate): Promise<MonitoreoAmbiental> => {
    const response = await apiClient.post<MonitoreoAmbiental>(`${BASE_URL}/monitoreos/`, data);
    return response.data;
  },

  update: async (id: number, data: MonitoreoAmbientalUpdate): Promise<MonitoreoAmbiental> => {
    const response = await apiClient.patch<MonitoreoAmbiental>(`${BASE_URL}/monitoreos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/monitoreos/${id}/`);
  },

  // Endpoints especiales
  resumen: async (): Promise<ResumenMonitoreosAmbientales> => {
    const response = await apiClient.get<ResumenMonitoreosAmbientales>(`${BASE_URL}/monitoreos/resumen/`);
    return response.data;
  },

  incumplimientos: async (): Promise<MonitoreoAmbiental[]> => {
    const response = await apiClient.get<MonitoreoAmbiental[]>(`${BASE_URL}/monitoreos/incumplimientos/`);
    return response.data;
  },

  porRangoFechas: async (fechaInicio: string, fechaFin: string): Promise<MonitoreoAmbiental[]> => {
    const response = await apiClient.get<MonitoreoAmbiental[]>(`${BASE_URL}/monitoreos/por_rango_fechas/`, {
      params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
    });
    return response.data;
  },

  // Obtener monitoreos de un aspecto especifico
  getByAspecto: async (aspectoId: number): Promise<MonitoreoAmbiental[]> => {
    const response = await apiClient.get<MonitoreoAmbiental[]>(`${BASE_URL}/monitoreos/`, {
      params: { aspecto: aspectoId },
    });
    return response.data;
  },

  // Obtener monitoreos de un programa especifico
  getByPrograma: async (programaId: number): Promise<MonitoreoAmbiental[]> => {
    const response = await apiClient.get<MonitoreoAmbiental[]>(`${BASE_URL}/monitoreos/`, {
      params: { programa: programaId },
    });
    return response.data;
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
