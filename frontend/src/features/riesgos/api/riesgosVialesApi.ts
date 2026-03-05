/**
 * API Client para Riesgos Viales - PESV
 * Plan Estrategico de Seguridad Vial - Resolucion 40595/2022
 *
 * Endpoints disponibles en backend:
 * - factores/          CRUD + por-categoria/
 * - riesgos/           CRUD + estadisticas/ + criticos/
 * - controles/         CRUD + por-riesgo/{id}/ + atrasados/
 * - incidentes/        CRUD + estadisticas/ + graves/ + iniciar-investigacion/
 * - inspecciones/      CRUD + por-vehiculo/{placa}/
 */
import { apiClient } from '@/lib/api-client';
import type {
  TipoRiesgoVial,
  TipoRiesgoVialCreate,
  TipoRiesgoVialUpdate,
  RiesgoVial,
  RiesgoVialList,
  RiesgoVialCreate,
  RiesgoVialUpdate,
  RiesgoVialFilter,
  ControlVial,
  ControlVialCreate,
  ControlVialUpdate,
  ControlVialFilter,
  IncidenteVial,
  IncidenteVialList,
  IncidenteVialCreate,
  IncidenteVialUpdate,
  IncidenteVialFilter,
  InspeccionVehiculo,
  InspeccionVehiculoCreate,
  InspeccionVehiculoUpdate,
  InspeccionVehiculoFilter,
  CategoriaFactor,
  PilarPESV,
} from '../types/riesgos-viales.types';

const BASE_URL = '/riesgos/riesgos-viales';

// ============================================
// TIPOS/FACTORES DE RIESGO VIAL (Catalogo)
// Endpoint: factores/ (router.register(r'factores', FactorRiesgoVialViewSet))
// ============================================

export const factoresRiesgoVialApi = {
  getAll: async (categoria?: CategoriaFactor): Promise<TipoRiesgoVial[]> => {
    const response = await apiClient.get<TipoRiesgoVial[]>(`${BASE_URL}/factores/`, {
      params: categoria ? { categoria } : undefined,
    });
    return response.data;
  },

  getById: async (id: number): Promise<TipoRiesgoVial> => {
    const response = await apiClient.get<TipoRiesgoVial>(`${BASE_URL}/factores/${id}/`);
    return response.data;
  },

  create: async (data: TipoRiesgoVialCreate): Promise<TipoRiesgoVial> => {
    const response = await apiClient.post<TipoRiesgoVial>(`${BASE_URL}/factores/`, data);
    return response.data;
  },

  update: async (id: number, data: TipoRiesgoVialUpdate): Promise<TipoRiesgoVial> => {
    const response = await apiClient.patch<TipoRiesgoVial>(`${BASE_URL}/factores/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/factores/${id}/`);
  },

  // Filtrar por pilar PESV via query param
  getByPilar: async (pilar: PilarPESV): Promise<TipoRiesgoVial[]> => {
    const response = await apiClient.get<TipoRiesgoVial[]>(`${BASE_URL}/factores/`, {
      params: { pilar_pesv: pilar },
    });
    return response.data;
  },
};

// ============================================
// RIESGOS VIALES
// Endpoints disponibles: CRUD + estadisticas/ + criticos/
// ============================================

export const riesgosVialesApi = {
  getAll: async (filters?: RiesgoVialFilter): Promise<RiesgoVialList[]> => {
    const response = await apiClient.get<RiesgoVialList[]>(`${BASE_URL}/riesgos/`, {
      params: filters,
    });
    return response.data;
  },

  getById: async (id: number): Promise<RiesgoVial> => {
    const response = await apiClient.get<RiesgoVial>(`${BASE_URL}/riesgos/${id}/`);
    return response.data;
  },

  create: async (data: RiesgoVialCreate): Promise<RiesgoVial> => {
    const response = await apiClient.post<RiesgoVial>(`${BASE_URL}/riesgos/`, data);
    return response.data;
  },

  update: async (id: number, data: RiesgoVialUpdate): Promise<RiesgoVial> => {
    const response = await apiClient.patch<RiesgoVial>(`${BASE_URL}/riesgos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/riesgos/${id}/`);
  },

  // Estadisticas generales de riesgos viales (por nivel, estado, categoria)
  estadisticas: async (): Promise<Record<string, unknown>> => {
    const response = await apiClient.get<Record<string, unknown>>(
      `${BASE_URL}/riesgos/estadisticas/`
    );
    return response.data;
  },

  // Riesgos criticos que requieren atencion inmediata (nivel ALTO o CRITICO)
  criticos: async (): Promise<RiesgoVialList[]> => {
    const response = await apiClient.get<{ count: number; riesgos: RiesgoVialList[] }>(
      `${BASE_URL}/riesgos/criticos/`
    );
    return response.data.riesgos;
  },

  // Filtrar por pilar PESV via query param
  getByPilar: async (pilar: PilarPESV): Promise<RiesgoVialList[]> => {
    const response = await apiClient.get<RiesgoVialList[]>(`${BASE_URL}/riesgos/`, {
      params: { pilar_pesv: pilar },
    });
    return response.data;
  },
};

// ============================================
// CONTROLES VIALES
// Endpoints disponibles: CRUD + por-riesgo/{id}/ + atrasados/
// ============================================

export const controlesVialesApi = {
  getAll: async (filters?: ControlVialFilter): Promise<ControlVial[]> => {
    const response = await apiClient.get<ControlVial[]>(`${BASE_URL}/controles/`, {
      params: filters,
    });
    return response.data;
  },

  getById: async (id: number): Promise<ControlVial> => {
    const response = await apiClient.get<ControlVial>(`${BASE_URL}/controles/${id}/`);
    return response.data;
  },

  create: async (data: ControlVialCreate): Promise<ControlVial> => {
    const response = await apiClient.post<ControlVial>(`${BASE_URL}/controles/`, data);
    return response.data;
  },

  update: async (id: number, data: ControlVialUpdate): Promise<ControlVial> => {
    const response = await apiClient.patch<ControlVial>(`${BASE_URL}/controles/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/controles/${id}/`);
  },

  // Controles atrasados en su implementacion
  atrasados: async (): Promise<ControlVial[]> => {
    const response = await apiClient.get<{ count: number; controles_atrasados: ControlVial[] }>(
      `${BASE_URL}/controles/atrasados/`
    );
    return response.data.controles_atrasados;
  },

  // Obtener controles de un riesgo especifico via query param riesgo_vial
  getByRiesgo: async (riesgoId: number): Promise<ControlVial[]> => {
    const response = await apiClient.get<ControlVial[]>(`${BASE_URL}/controles/`, {
      params: { riesgo_vial: riesgoId },
    });
    return response.data;
  },
};

// ============================================
// INCIDENTES VIALES
// Endpoints disponibles: CRUD + estadisticas/ + graves/ + iniciar-investigacion/
// ============================================

export const incidentesVialesApi = {
  getAll: async (filters?: IncidenteVialFilter): Promise<IncidenteVialList[]> => {
    const response = await apiClient.get<IncidenteVialList[]>(`${BASE_URL}/incidentes/`, {
      params: filters,
    });
    return response.data;
  },

  getById: async (id: number): Promise<IncidenteVial> => {
    const response = await apiClient.get<IncidenteVial>(`${BASE_URL}/incidentes/${id}/`);
    return response.data;
  },

  create: async (data: IncidenteVialCreate): Promise<IncidenteVial> => {
    const response = await apiClient.post<IncidenteVial>(`${BASE_URL}/incidentes/`, data);
    return response.data;
  },

  update: async (id: number, data: IncidenteVialUpdate): Promise<IncidenteVial> => {
    const response = await apiClient.patch<IncidenteVial>(`${BASE_URL}/incidentes/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/incidentes/${id}/`);
  },

  // Estadisticas de incidentes (por tipo, gravedad, estado investigacion)
  estadisticas: async (): Promise<Record<string, unknown>> => {
    const response = await apiClient.get<Record<string, unknown>>(
      `${BASE_URL}/incidentes/estadisticas/`
    );
    return response.data;
  },

  // Incidentes graves (con lesionados o fallecidos)
  graves: async (): Promise<IncidenteVialList[]> => {
    const response = await apiClient.get<{ count: number; incidentes_graves: IncidenteVialList[] }>(
      `${BASE_URL}/incidentes/graves/`
    );
    return response.data.incidentes_graves;
  },

  // Iniciar investigacion de un incidente
  // Payload: { investigador_id: number, fecha_inicio?: string }
  iniciarInvestigacion: async (
    id: number,
    investigadorId: number,
    fechaInicio?: string
  ): Promise<IncidenteVial> => {
    const response = await apiClient.post<{ message: string; incidente: IncidenteVial }>(
      `${BASE_URL}/incidentes/${id}/iniciar-investigacion/`,
      { investigador_id: investigadorId, ...(fechaInicio ? { fecha_inicio: fechaInicio } : {}) }
    );
    return response.data.incidente;
  },
};

// ============================================
// INSPECCIONES DE VEHICULOS
// Endpoints disponibles: CRUD + por-vehiculo/{placa}/
// ============================================

export const inspeccionesVehiculoApi = {
  getAll: async (filters?: InspeccionVehiculoFilter): Promise<InspeccionVehiculo[]> => {
    const response = await apiClient.get<InspeccionVehiculo[]>(`${BASE_URL}/inspecciones/`, {
      params: filters,
    });
    return response.data;
  },

  getById: async (id: number): Promise<InspeccionVehiculo> => {
    const response = await apiClient.get<InspeccionVehiculo>(`${BASE_URL}/inspecciones/${id}/`);
    return response.data;
  },

  create: async (data: InspeccionVehiculoCreate): Promise<InspeccionVehiculo> => {
    const response = await apiClient.post<InspeccionVehiculo>(`${BASE_URL}/inspecciones/`, data);
    return response.data;
  },

  update: async (id: number, data: InspeccionVehiculoUpdate): Promise<InspeccionVehiculo> => {
    const response = await apiClient.patch<InspeccionVehiculo>(
      `${BASE_URL}/inspecciones/${id}/`,
      data
    );
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/inspecciones/${id}/`);
  },

  // Historial de inspecciones de un vehiculo especifico
  porPlaca: async (placa: string): Promise<InspeccionVehiculo[]> => {
    const response = await apiClient.get<{
      count: number;
      vehiculo_placa: string;
      inspecciones: InspeccionVehiculo[];
    }>(`${BASE_URL}/inspecciones/por-vehiculo/${placa}/`);
    return response.data.inspecciones;
  },

  // Obtener ultima inspeccion de un vehiculo (client-side: toma el primero del listado)
  ultimaInspeccion: async (placa: string): Promise<InspeccionVehiculo | null> => {
    const inspecciones = await inspeccionesVehiculoApi.porPlaca(placa);
    return inspecciones.length > 0 ? inspecciones[0] : null;
  },
};

// ============================================
// EXPORT COMBINADO
// ============================================

export const riesgosVialesModule = {
  factores: factoresRiesgoVialApi,
  riesgos: riesgosVialesApi,
  controles: controlesVialesApi,
  incidentes: incidentesVialesApi,
  inspecciones: inspeccionesVehiculoApi,
};

export default riesgosVialesModule;
