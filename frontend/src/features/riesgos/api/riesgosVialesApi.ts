/**
 * API Client para Riesgos Viales - PESV
 * Plan Estrategico de Seguridad Vial - Resolucion 40595/2022
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
  ResumenRiesgosViales,
  ResumenControlesViales,
  ResumenIncidentesViales,
  ResumenInspeccionesVehiculo,
  EstadisticasPESV,
  CategoriaFactor,
  PilarPESV,
} from '../types/riesgos-viales.types';

const BASE_URL = '/riesgos/riesgos-viales';

// ============================================
// TIPOS/FACTORES DE RIESGO VIAL (Catalogo)
// ============================================

export const factoresRiesgoVialApi = {
  getAll: async (categoria?: CategoriaFactor): Promise<TipoRiesgoVial[]> => {
    const response = await apiClient.get<TipoRiesgoVial[]>(`${BASE_URL}/tipos-riesgo/`, {
      params: categoria ? { categoria } : undefined,
    });
    return response.data;
  },

  getById: async (id: number): Promise<TipoRiesgoVial> => {
    const response = await apiClient.get<TipoRiesgoVial>(`${BASE_URL}/tipos-riesgo/${id}/`);
    return response.data;
  },

  create: async (data: TipoRiesgoVialCreate): Promise<TipoRiesgoVial> => {
    const response = await apiClient.post<TipoRiesgoVial>(`${BASE_URL}/tipos-riesgo/`, data);
    return response.data;
  },

  update: async (id: number, data: TipoRiesgoVialUpdate): Promise<TipoRiesgoVial> => {
    const response = await apiClient.patch<TipoRiesgoVial>(`${BASE_URL}/tipos-riesgo/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/tipos-riesgo/${id}/`);
  },

  // Obtener por pilar PESV
  getByPilar: async (pilar: PilarPESV): Promise<TipoRiesgoVial[]> => {
    const response = await apiClient.get<TipoRiesgoVial[]>(`${BASE_URL}/tipos-riesgo/`, {
      params: { pilar_pesv: pilar },
    });
    return response.data;
  },
};

// ============================================
// RIESGOS VIALES
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

  // Endpoints especiales
  resumen: async (): Promise<ResumenRiesgosViales> => {
    const response = await apiClient.get<ResumenRiesgosViales>(`${BASE_URL}/riesgos/resumen/`);
    return response.data;
  },

  criticos: async (): Promise<RiesgoVialList[]> => {
    const response = await apiClient.get<RiesgoVialList[]>(`${BASE_URL}/riesgos/criticos/`);
    return response.data;
  },

  altos: async (): Promise<RiesgoVialList[]> => {
    const response = await apiClient.get<RiesgoVialList[]>(`${BASE_URL}/riesgos/altos/`);
    return response.data;
  },

  sinControles: async (): Promise<RiesgoVialList[]> => {
    const response = await apiClient.get<RiesgoVialList[]>(`${BASE_URL}/riesgos/sin_controles/`);
    return response.data;
  },

  // Por pilar PESV
  getByPilar: async (pilar: PilarPESV): Promise<RiesgoVialList[]> => {
    const response = await apiClient.get<RiesgoVialList[]>(`${BASE_URL}/riesgos/`, {
      params: { pilar_pesv: pilar },
    });
    return response.data;
  },
};

// ============================================
// CONTROLES VIALES
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

  // Endpoints especiales
  resumen: async (): Promise<ResumenControlesViales> => {
    const response = await apiClient.get<ResumenControlesViales>(`${BASE_URL}/controles/resumen/`);
    return response.data;
  },

  atrasados: async (): Promise<ControlVial[]> => {
    const response = await apiClient.get<ControlVial[]>(`${BASE_URL}/controles/atrasados/`);
    return response.data;
  },

  ineficaces: async (): Promise<ControlVial[]> => {
    const response = await apiClient.get<ControlVial[]>(`${BASE_URL}/controles/ineficaces/`);
    return response.data;
  },

  // Obtener controles de un riesgo especifico
  getByRiesgo: async (riesgoId: number): Promise<ControlVial[]> => {
    const response = await apiClient.get<ControlVial[]>(`${BASE_URL}/controles/`, {
      params: { riesgo: riesgoId },
    });
    return response.data;
  },
};

// ============================================
// INCIDENTES VIALES
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

  // Endpoints especiales
  resumen: async (): Promise<ResumenIncidentesViales> => {
    const response = await apiClient.get<ResumenIncidentesViales>(
      `${BASE_URL}/incidentes/resumen/`
    );
    return response.data;
  },

  pendientesInvestigacion: async (): Promise<IncidenteVialList[]> => {
    const response = await apiClient.get<IncidenteVialList[]>(
      `${BASE_URL}/incidentes/pendientes_investigacion/`
    );
    return response.data;
  },

  graves: async (): Promise<IncidenteVialList[]> => {
    const response = await apiClient.get<IncidenteVialList[]>(`${BASE_URL}/incidentes/graves/`);
    return response.data;
  },

  porRangoFechas: async (fechaInicio: string, fechaFin: string): Promise<IncidenteVialList[]> => {
    const response = await apiClient.get<IncidenteVialList[]>(
      `${BASE_URL}/incidentes/por_rango_fechas/`,
      {
        params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
      }
    );
    return response.data;
  },

  // Acciones especiales
  iniciarInvestigacion: async (id: number, responsableId: number): Promise<IncidenteVial> => {
    const response = await apiClient.post<IncidenteVial>(
      `${BASE_URL}/incidentes/${id}/iniciar_investigacion/`,
      {
        responsable_investigacion_id: responsableId,
      }
    );
    return response.data;
  },

  cerrarInvestigacion: async (
    id: number,
    data: {
      causa_inmediata: string;
      causas_basicas: string;
      factores_trabajo?: string;
      acciones_correctivas: string;
    }
  ): Promise<IncidenteVial> => {
    const response = await apiClient.post<IncidenteVial>(
      `${BASE_URL}/incidentes/${id}/cerrar_investigacion/`,
      data
    );
    return response.data;
  },

  reportarARL: async (
    id: number,
    data: { numero_reporte_arl: string; fecha_reporte_arl: string }
  ): Promise<IncidenteVial> => {
    const response = await apiClient.post<IncidenteVial>(
      `${BASE_URL}/incidentes/${id}/reportar_arl/`,
      data
    );
    return response.data;
  },
};

// ============================================
// INSPECCIONES DE VEHICULOS
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

  // Endpoints especiales
  resumen: async (): Promise<ResumenInspeccionesVehiculo> => {
    const response = await apiClient.get<ResumenInspeccionesVehiculo>(
      `${BASE_URL}/inspecciones/resumen/`
    );
    return response.data;
  },

  rechazadas: async (): Promise<InspeccionVehiculo[]> => {
    const response = await apiClient.get<InspeccionVehiculo[]>(
      `${BASE_URL}/inspecciones/rechazadas/`
    );
    return response.data;
  },

  porPlaca: async (placa: string): Promise<InspeccionVehiculo[]> => {
    const response = await apiClient.get<InspeccionVehiculo[]>(`${BASE_URL}/inspecciones/`, {
      params: { placa },
    });
    return response.data;
  },

  porRangoFechas: async (fechaInicio: string, fechaFin: string): Promise<InspeccionVehiculo[]> => {
    const response = await apiClient.get<InspeccionVehiculo[]>(
      `${BASE_URL}/inspecciones/por_rango_fechas/`,
      {
        params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
      }
    );
    return response.data;
  },

  // Obtener ultima inspeccion de un vehiculo
  ultimaInspeccion: async (placa: string): Promise<InspeccionVehiculo | null> => {
    const inspecciones = await inspeccionesVehiculoApi.porPlaca(placa);
    return inspecciones.length > 0 ? inspecciones[0] : null;
  },

  // Verificar si vehiculo puede operar
  puedeOperar: async (placa: string): Promise<{ puede_operar: boolean; motivo?: string }> => {
    const response = await apiClient.get<{ puede_operar: boolean; motivo?: string }>(
      `${BASE_URL}/inspecciones/puede_operar/`,
      { params: { placa } }
    );
    return response.data;
  },
};

// ============================================
// ESTADISTICAS GENERALES PESV
// ============================================

export const estadisticasPESVApi = {
  getGeneral: async (): Promise<EstadisticasPESV> => {
    const response = await apiClient.get<EstadisticasPESV>(`${BASE_URL}/estadisticas/`);
    return response.data;
  },

  getIndicadores: async (periodo?: {
    fecha_inicio: string;
    fecha_fin: string;
  }): Promise<EstadisticasPESV['indicadores']> => {
    const response = await apiClient.get<EstadisticasPESV['indicadores']>(
      `${BASE_URL}/estadisticas/indicadores/`,
      {
        params: periodo,
      }
    );
    return response.data;
  },

  getTendencias: async (
    meses: number = 12
  ): Promise<
    Array<{
      mes: string;
      incidentes: number;
      inspecciones: number;
      riesgos_nuevos: number;
    }>
  > => {
    const response = await apiClient.get<
      Array<{
        mes: string;
        incidentes: number;
        inspecciones: number;
        riesgos_nuevos: number;
      }>
    >(`${BASE_URL}/estadisticas/tendencias/`, { params: { meses } });
    return response.data;
  },

  // Dashboard resumen para pilares PESV
  getDashboardPilares: async (): Promise<
    Record<
      PilarPESV,
      {
        total_riesgos: number;
        riesgos_altos: number;
        controles_implementados: number;
        porcentaje_cumplimiento: number;
      }
    >
  > => {
    const response = await apiClient.get<
      Record<
        PilarPESV,
        {
          total_riesgos: number;
          riesgos_altos: number;
          controles_implementados: number;
          porcentaje_cumplimiento: number;
        }
      >
    >(`${BASE_URL}/estadisticas/dashboard_pilares/`);
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
  estadisticas: estadisticasPESVApi,
};

export default riesgosVialesModule;
