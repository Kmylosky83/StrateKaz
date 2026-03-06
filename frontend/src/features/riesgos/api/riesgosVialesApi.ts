/**
 * API Client para Riesgos Viales - PESV
 * Plan Estratégico de Seguridad Vial - Resolución 40595/2022
 *
 * Base URL: /api/riesgos/riesgos-viales/
 * Router registrations (urls.py):
 *   factores/      -> FactorRiesgoVialViewSet
 *   riesgos/       -> RiesgoVialViewSet
 *   controles/     -> ControlVialViewSet
 *   incidentes/    -> IncidenteVialViewSet
 *   inspecciones/  -> InspeccionVehiculoViewSet
 *
 * @action endpoints:
 *   GET  factores/por-categoria/
 *   GET  riesgos/estadisticas/
 *   GET  riesgos/criticos/
 *   GET  controles/por-riesgo/{id}/
 *   GET  controles/atrasados/
 *   GET  incidentes/estadisticas/
 *   GET  incidentes/graves/
 *   POST incidentes/{id}/iniciar-investigacion/
 *   GET  inspecciones/por-vehiculo/{placa}/
 */
import apiClient from '@/api/axios-config';
import type {
  TipoRiesgoVial,
  TipoRiesgoVialCreate,
  TipoRiesgoVialUpdate,
  RiesgoVialList,
  RiesgoVialDetail,
  RiesgoVialCreate,
  RiesgoVialUpdate,
  RiesgoVialFilter,
  ControlVialList,
  ControlVialDetail,
  ControlVialCreate,
  ControlVialUpdate,
  ControlVialFilter,
  IncidenteVialList,
  IncidenteVialDetail,
  IncidenteVialCreate,
  IncidenteVialUpdate,
  IncidenteVialFilter,
  InspeccionVehiculoList,
  InspeccionVehiculoDetail,
  InspeccionVehiculoCreate,
  InspeccionVehiculoFilter,
  CategoriaFactor,
  EstadisticasRiesgosViales,
  EstadisticasIncidentesViales,
  RiesgosCriticosResponse,
  IncidentesGravesResponse,
  ControlesAtrasadosResponse,
  ControlesPorRiesgoResponse,
  InspeccionesPorVehiculoResponse,
  FactoresPorCategoriaResponse,
  IniciarInvestigacionResponse,
} from '../types/riesgos-viales.types';

const BASE_URL = '/riesgos/riesgos-viales';

// ============================================
// TIPOS/FACTORES DE RIESGO VIAL (Catálogo)
// router.register(r'factores', FactorRiesgoVialViewSet)
// ============================================

export const factoresRiesgoVialApi = {
  getAll: async (params?: {
    categoria?: CategoriaFactor;
    is_active?: string;
    search?: string;
  }): Promise<TipoRiesgoVial[]> => {
    const response = await apiClient.get<TipoRiesgoVial[]>(`${BASE_URL}/factores/`, { params });
    const data = response.data;
    return Array.isArray(data)
      ? data
      : (((data as Record<string, unknown>)?.results as TipoRiesgoVial[]) ?? []);
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

  /** GET factores/por-categoria/ — agrupa tipos por categoría */
  porCategoria: async (): Promise<FactoresPorCategoriaResponse> => {
    const response = await apiClient.get<FactoresPorCategoriaResponse>(
      `${BASE_URL}/factores/por-categoria/`
    );
    return response.data;
  },
};

// ============================================
// RIESGOS VIALES
// router.register(r'riesgos', RiesgoVialViewSet)
// ============================================

export const riesgosVialesApi = {
  getAll: async (filters?: RiesgoVialFilter): Promise<RiesgoVialList[]> => {
    const response = await apiClient.get<RiesgoVialList[]>(`${BASE_URL}/riesgos/`, {
      params: filters,
    });
    const data = response.data;
    return Array.isArray(data)
      ? data
      : (((data as Record<string, unknown>)?.results as RiesgoVialList[]) ?? []);
  },

  getById: async (id: number): Promise<RiesgoVialDetail> => {
    const response = await apiClient.get<RiesgoVialDetail>(`${BASE_URL}/riesgos/${id}/`);
    return response.data;
  },

  create: async (data: RiesgoVialCreate): Promise<RiesgoVialDetail> => {
    const response = await apiClient.post<RiesgoVialDetail>(`${BASE_URL}/riesgos/`, data);
    return response.data;
  },

  update: async (id: number, data: RiesgoVialUpdate): Promise<RiesgoVialDetail> => {
    const response = await apiClient.patch<RiesgoVialDetail>(`${BASE_URL}/riesgos/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/riesgos/${id}/`);
  },

  /** GET riesgos/estadisticas/ */
  estadisticas: async (): Promise<EstadisticasRiesgosViales> => {
    const response = await apiClient.get<EstadisticasRiesgosViales>(
      `${BASE_URL}/riesgos/estadisticas/`
    );
    return response.data;
  },

  /** GET riesgos/criticos/ */
  criticos: async (): Promise<RiesgosCriticosResponse> => {
    const response = await apiClient.get<RiesgosCriticosResponse>(`${BASE_URL}/riesgos/criticos/`);
    return response.data;
  },
};

// ============================================
// CONTROLES VIALES
// router.register(r'controles', ControlVialViewSet)
// ============================================

export const controlesVialesApi = {
  getAll: async (filters?: ControlVialFilter): Promise<ControlVialList[]> => {
    const response = await apiClient.get<ControlVialList[]>(`${BASE_URL}/controles/`, {
      params: filters,
    });
    const data = response.data;
    return Array.isArray(data)
      ? data
      : (((data as Record<string, unknown>)?.results as ControlVialList[]) ?? []);
  },

  getById: async (id: number): Promise<ControlVialDetail> => {
    const response = await apiClient.get<ControlVialDetail>(`${BASE_URL}/controles/${id}/`);
    return response.data;
  },

  create: async (data: ControlVialCreate): Promise<ControlVialDetail> => {
    const response = await apiClient.post<ControlVialDetail>(`${BASE_URL}/controles/`, data);
    return response.data;
  },

  update: async (id: number, data: ControlVialUpdate): Promise<ControlVialDetail> => {
    const response = await apiClient.patch<ControlVialDetail>(`${BASE_URL}/controles/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/controles/${id}/`);
  },

  /** GET controles/por-riesgo/{riesgoId}/ */
  porRiesgo: async (riesgoId: number): Promise<ControlesPorRiesgoResponse> => {
    const response = await apiClient.get<ControlesPorRiesgoResponse>(
      `${BASE_URL}/controles/por-riesgo/${riesgoId}/`
    );
    return response.data;
  },

  /** GET controles/atrasados/ */
  atrasados: async (): Promise<ControlesAtrasadosResponse> => {
    const response = await apiClient.get<ControlesAtrasadosResponse>(
      `${BASE_URL}/controles/atrasados/`
    );
    return response.data;
  },
};

// ============================================
// INCIDENTES VIALES
// router.register(r'incidentes', IncidenteVialViewSet)
// ============================================

export const incidentesVialesApi = {
  getAll: async (filters?: IncidenteVialFilter): Promise<IncidenteVialList[]> => {
    const response = await apiClient.get<IncidenteVialList[]>(`${BASE_URL}/incidentes/`, {
      params: filters,
    });
    const data = response.data;
    return Array.isArray(data)
      ? data
      : (((data as Record<string, unknown>)?.results as IncidenteVialList[]) ?? []);
  },

  getById: async (id: number): Promise<IncidenteVialDetail> => {
    const response = await apiClient.get<IncidenteVialDetail>(`${BASE_URL}/incidentes/${id}/`);
    return response.data;
  },

  create: async (data: IncidenteVialCreate): Promise<IncidenteVialDetail> => {
    const response = await apiClient.post<IncidenteVialDetail>(`${BASE_URL}/incidentes/`, data);
    return response.data;
  },

  update: async (id: number, data: IncidenteVialUpdate): Promise<IncidenteVialDetail> => {
    const response = await apiClient.patch<IncidenteVialDetail>(
      `${BASE_URL}/incidentes/${id}/`,
      data
    );
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/incidentes/${id}/`);
  },

  /** GET incidentes/estadisticas/ */
  estadisticas: async (): Promise<EstadisticasIncidentesViales> => {
    const response = await apiClient.get<EstadisticasIncidentesViales>(
      `${BASE_URL}/incidentes/estadisticas/`
    );
    return response.data;
  },

  /** GET incidentes/graves/ */
  graves: async (): Promise<IncidentesGravesResponse> => {
    const response = await apiClient.get<IncidentesGravesResponse>(
      `${BASE_URL}/incidentes/graves/`
    );
    return response.data;
  },

  /** POST incidentes/{id}/iniciar-investigacion/ */
  iniciarInvestigacion: async (
    id: number,
    investigadorId: number,
    fechaInicio?: string
  ): Promise<IniciarInvestigacionResponse> => {
    const response = await apiClient.post<IniciarInvestigacionResponse>(
      `${BASE_URL}/incidentes/${id}/iniciar-investigacion/`,
      {
        investigador_id: investigadorId,
        ...(fechaInicio ? { fecha_inicio: fechaInicio } : {}),
      }
    );
    return response.data;
  },
};

// ============================================
// INSPECCIONES DE VEHÍCULOS
// router.register(r'inspecciones', InspeccionVehiculoViewSet)
// ============================================

export const inspeccionesVehiculoApi = {
  getAll: async (filters?: InspeccionVehiculoFilter): Promise<InspeccionVehiculoList[]> => {
    const response = await apiClient.get<InspeccionVehiculoList[]>(`${BASE_URL}/inspecciones/`, {
      params: filters,
    });
    const data = response.data;
    return Array.isArray(data)
      ? data
      : (((data as Record<string, unknown>)?.results as InspeccionVehiculoList[]) ?? []);
  },

  getById: async (id: number): Promise<InspeccionVehiculoDetail> => {
    const response = await apiClient.get<InspeccionVehiculoDetail>(
      `${BASE_URL}/inspecciones/${id}/`
    );
    return response.data;
  },

  create: async (data: InspeccionVehiculoCreate): Promise<InspeccionVehiculoDetail> => {
    const response = await apiClient.post<InspeccionVehiculoDetail>(
      `${BASE_URL}/inspecciones/`,
      data
    );
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/inspecciones/${id}/`);
  },

  /** GET inspecciones/por-vehiculo/{placa}/ */
  porVehiculo: async (placa: string): Promise<InspeccionesPorVehiculoResponse> => {
    const response = await apiClient.get<InspeccionesPorVehiculoResponse>(
      `${BASE_URL}/inspecciones/por-vehiculo/${encodeURIComponent(placa)}/`
    );
    return response.data;
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
