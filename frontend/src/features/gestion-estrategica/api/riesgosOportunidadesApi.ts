/**
 * API Client para Riesgos y Oportunidades - Vista Estratégica (ISO 6.1)
 * Consume endpoints del motor_riesgos para vista consolidada en GE
 *
 * Types alineados con backend serializers:
 * - RiesgoProcesoListSerializer → RiesgoProceso
 * - OportunidadSerializer → Oportunidad
 * - TratamientoRiesgoSerializer → TratamientoRiesgo
 */
import apiClient from '@/api/axios-config';

const BASE_URL = '/riesgos/riesgos-procesos';

// ==================== TIPOS LOCALES ====================

export interface RiesgoResumen {
  total: number;
  por_estado: Array<{ estado: string; cantidad: number }>;
  por_tipo: Array<{ tipo: string; cantidad: number }>;
  criticos: number;
  en_tratamiento: number;
}

/** Alineado con RiesgoProcesoListSerializer */
export interface RiesgoProceso {
  id: number;
  codigo: string;
  nombre: string;
  tipo: string;
  tipo_display: string;
  categoria: number | null;
  categoria_nombre: string;
  categoria_codigo: string;
  proceso: string;
  estado: string;
  estado_display: string;
  probabilidad_inherente: number;
  impacto_inherente: number;
  nivel_inherente: number;
  interpretacion_inherente: string;
  probabilidad_residual: number;
  impacto_residual: number;
  nivel_residual: number;
  interpretacion_residual: string;
  reduccion_riesgo_porcentaje: number;
  responsable: number | null;
  responsable_nombre: string;
  empresa: number;
  created_at: string;
}

/** Alineado con OportunidadSerializer */
export interface Oportunidad {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  fuente: string;
  impacto_potencial: string;
  viabilidad: string;
  recursos_requeridos: string;
  responsable: number | null;
  responsable_nombre: string;
  estado: string;
  estado_display: string;
  empresa: number;
  created_at: string;
  updated_at: string;
}

/** Alineado con TratamientoRiesgoSerializer */
export interface TratamientoRiesgo {
  id: number;
  riesgo: number;
  riesgo_codigo: string;
  riesgo_nombre: string;
  tipo: string;
  tipo_display: string;
  descripcion: string;
  control_propuesto: string;
  responsable: number | null;
  responsable_nombre: string;
  fecha_implementacion: string | null;
  estado: string;
  estado_display: string;
  efectividad: string;
  empresa: number;
  created_at: string;
  updated_at: string;
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
    const response = await apiClient.get(`${BASE_URL}/riesgos/resumen/`);
    return response.data;
  },

  getRiesgos: async (
    params?: Record<string, string>
  ): Promise<PaginatedResponse<RiesgoProceso>> => {
    const response = await apiClient.get(`${BASE_URL}/riesgos/`, { params });
    return response.data;
  },

  getCriticos: async (): Promise<RiesgoProceso[]> => {
    const response = await apiClient.get(`${BASE_URL}/riesgos/criticos/`);
    return response.data;
  },

  getMapaCalor: async (): Promise<MapaCalorItem[]> => {
    const response = await apiClient.get(`${BASE_URL}/riesgos/mapa-calor/`);
    return response.data;
  },

  getOportunidades: async (
    params?: Record<string, string>
  ): Promise<PaginatedResponse<Oportunidad>> => {
    const response = await apiClient.get(`${BASE_URL}/oportunidades/`, { params });
    return response.data;
  },

  getTratamientos: async (
    params?: Record<string, string>
  ): Promise<PaginatedResponse<TratamientoRiesgo>> => {
    const response = await apiClient.get(`${BASE_URL}/tratamientos/`, { params });
    return response.data;
  },
};
