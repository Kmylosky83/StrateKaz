/**
 * API Client para Riesgos y Oportunidades - Vista Estratégica (ISO 6.1)
 * Consume endpoints del motor_riesgos para vista consolidada en GE
 */
import axiosInstance from '@/api/axios-config';

const BASE_URL = '/api/motor-riesgos/riesgos-procesos';

// ==================== TIPOS LOCALES ====================

export interface RiesgoResumen {
  total: number;
  por_estado: Array<{ estado: string; cantidad: number }>;
  por_tipo: Array<{ tipo: string; cantidad: number }>;
  criticos: number;
  en_tratamiento: number;
}

export interface RiesgoProceso {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo: string;
  estado: string;
  proceso: string;
  causa_raiz: string;
  consecuencia: string;
  probabilidad_inherente: number;
  impacto_inherente: number;
  nivel_inherente: number;
  probabilidad_residual: number;
  impacto_residual: number;
  nivel_residual: number;
  responsable: number | null;
  responsable_detail?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  fecha_identificacion: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Oportunidad {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo: string;
  estado: string;
  beneficio_esperado: string;
  responsable: number | null;
  responsable_detail?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  prioridad: string;
  fecha_identificacion: string;
  is_active: boolean;
  created_at: string;
}

export interface TratamientoRiesgo {
  id: number;
  riesgo: number;
  riesgo_nombre?: string;
  tipo: string;
  descripcion: string;
  responsable: number | null;
  responsable_detail?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  fecha_inicio: string;
  fecha_fin: string | null;
  estado: string;
  porcentaje_avance: number;
  is_active: boolean;
  created_at: string;
}

export interface MapaCalorItem {
  probabilidad: number;
  impacto: number;
  cantidad: number;
  riesgos: Array<{ id: number; nombre: string }>;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ==================== API ====================

export const riesgosEstrategicosApi = {
  getResumen: async (): Promise<RiesgoResumen> => {
    const response = await axiosInstance.get(`${BASE_URL}/riesgos/resumen/`);
    return response.data;
  },

  getRiesgos: async (params?: Record<string, string>): Promise<PaginatedResponse<RiesgoProceso>> => {
    const response = await axiosInstance.get(`${BASE_URL}/riesgos/`, { params });
    return response.data;
  },

  getCriticos: async (): Promise<RiesgoProceso[]> => {
    const response = await axiosInstance.get(`${BASE_URL}/riesgos/criticos/`);
    return response.data;
  },

  getMapaCalor: async (): Promise<MapaCalorItem[]> => {
    const response = await axiosInstance.get(`${BASE_URL}/riesgos/mapa-calor/`);
    return response.data;
  },

  getOportunidades: async (params?: Record<string, string>): Promise<PaginatedResponse<Oportunidad>> => {
    const response = await axiosInstance.get(`${BASE_URL}/oportunidades/`, { params });
    return response.data;
  },

  getTratamientos: async (params?: Record<string, string>): Promise<PaginatedResponse<TratamientoRiesgo>> => {
    const response = await axiosInstance.get(`${BASE_URL}/tratamientos/`, { params });
    return response.data;
  },
};
