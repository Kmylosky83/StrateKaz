/**
 * API Client para Contexto Organizacional
 *
 * Módulo independiente de Contexto (separado de Planeación).
 *
 * Endpoints (relativo a API_URL que ya incluye /api):
 * - /gestion-estrategica/contexto/analisis-dofa/ - CRUD Análisis DOFA
 * - /gestion-estrategica/contexto/factores-dofa/ - CRUD Factores DOFA
 * - /gestion-estrategica/contexto/analisis-pestel/ - CRUD Análisis PESTEL
 * - /gestion-estrategica/contexto/factores-pestel/ - CRUD Factores PESTEL
 * - /gestion-estrategica/contexto/fuerzas-porter/ - CRUD 5 Fuerzas Porter
 * - /gestion-estrategica/contexto/estrategias-tows/ - CRUD Estrategias TOWS
 * - /gestion-estrategica/contexto/tipos-parte-interesada/ - Catálogo tipos
 * - /gestion-estrategica/contexto/partes-interesadas/ - CRUD Stakeholders
 */

import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@/types';
import type {
  TipoAnalisisDOFA,
  TipoAnalisisPESTEL,
  AnalisisDOFA,
  FactorDOFA,
  CreateAnalisisDOFADTO,
  UpdateAnalisisDOFADTO,
  CreateFactorDOFADTO,
  UpdateFactorDOFADTO,
  AnalisisDOFAFilters,
  FactorDOFAFilters,
  AnalisisPESTEL,
  FactorPESTEL,
  CreateAnalisisPESTELDTO,
  UpdateAnalisisPESTELDTO,
  CreateFactorPESTELDTO,
  UpdateFactorPESTELDTO,
  AnalisisPESTELFilters,
  FactorPESTELFilters,
  FuerzaPorter,
  CreateFuerzaPorterDTO,
  UpdateFuerzaPorterDTO,
  FuerzaPorterFilters,
  EstrategiaTOWS,
  CreateEstrategiaTOWSDTO,
  UpdateEstrategiaTOWSDTO,
  EstrategiaTOWSFilters,
} from '../types/contexto.types';

// BASE_URL sin prefijo /api porque apiClient.baseURL ya lo incluye
// Nueva ruta canónica: /gestion-estrategica/contexto/ (independiente de planeacion)
const BASE_URL = '/gestion-estrategica/contexto';

// ==============================================================================
// TIPOS DE ANÁLISIS DOFA (Catálogo Global)
// ==============================================================================

export const tiposAnalisisDofaApi = {
  /**
   * Listar todos los tipos de análisis DOFA activos
   */
  list: async (): Promise<PaginatedResponse<TipoAnalisisDOFA>> => {
    const response = await apiClient.get<PaginatedResponse<TipoAnalisisDOFA>>(
      `${BASE_URL}/tipos-analisis-dofa/?is_active=true`
    );
    return response.data;
  },

  /**
   * Obtener tipo de análisis por ID
   */
  get: async (id: number): Promise<TipoAnalisisDOFA> => {
    const response = await apiClient.get<TipoAnalisisDOFA>(
      `${BASE_URL}/tipos-analisis-dofa/${id}/`
    );
    return response.data;
  },
};

// ==============================================================================
// TIPOS DE ANÁLISIS PESTEL (Catálogo Global)
// ==============================================================================

export const tiposAnalisisPestelApi = {
  /**
   * Listar todos los tipos de análisis PESTEL activos
   */
  list: async (): Promise<PaginatedResponse<TipoAnalisisPESTEL>> => {
    const response = await apiClient.get<PaginatedResponse<TipoAnalisisPESTEL>>(
      `${BASE_URL}/tipos-analisis-pestel/?is_active=true`
    );
    return response.data;
  },

  /**
   * Obtener tipo de análisis PESTEL por ID
   */
  get: async (id: number): Promise<TipoAnalisisPESTEL> => {
    const response = await apiClient.get<TipoAnalisisPESTEL>(
      `${BASE_URL}/tipos-analisis-pestel/${id}/`
    );
    return response.data;
  },
};

// ==============================================================================
// ANALISIS DOFA
// ==============================================================================

export const analisisDofaApi = {
  /**
   * Listar analisis DOFA con filtros
   */
  list: async (
    filters?: AnalisisDOFAFilters,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResponse<AnalisisDOFA>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());

    if (filters?.estado) {
      params.append('estado', filters.estado);
    }
    if (filters?.periodo) {
      params.append('periodo', filters.periodo);
    }
    if (filters?.responsable) {
      params.append('responsable', filters.responsable.toString());
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }

    const response = await apiClient.get<PaginatedResponse<AnalisisDOFA>>(
      `${BASE_URL}/analisis-dofa/?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Obtener detalle de analisis DOFA
   */
  get: async (id: number): Promise<AnalisisDOFA> => {
    const response = await apiClient.get<AnalisisDOFA>(`${BASE_URL}/analisis-dofa/${id}/`);
    return response.data;
  },

  /**
   * Crear analisis DOFA
   */
  create: async (data: CreateAnalisisDOFADTO): Promise<AnalisisDOFA> => {
    const response = await apiClient.post<AnalisisDOFA>(`${BASE_URL}/analisis-dofa/`, data);
    return response.data;
  },

  /**
   * Actualizar analisis DOFA
   */
  update: async (id: number, data: UpdateAnalisisDOFADTO): Promise<AnalisisDOFA> => {
    const response = await apiClient.patch<AnalisisDOFA>(`${BASE_URL}/analisis-dofa/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar analisis DOFA
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/analisis-dofa/${id}/`);
  },

  /**
   * Aprobar analisis DOFA
   */
  aprobar: async (id: number): Promise<{ detail: string; estado: string }> => {
    const response = await apiClient.post<{ detail: string; estado: string }>(
      `${BASE_URL}/analisis-dofa/${id}/aprobar/`
    );
    return response.data;
  },
};

// ==============================================================================
// FACTORES DOFA
// ==============================================================================

export const factoresDofaApi = {
  /**
   * Listar factores DOFA de un analisis
   */
  list: async (
    filters?: FactorDOFAFilters,
    page = 1,
    pageSize = 50
  ): Promise<PaginatedResponse<FactorDOFA>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());

    if (filters?.analisis) {
      params.append('analisis', filters.analisis.toString());
    }
    if (filters?.tipo) {
      params.append('tipo', filters.tipo);
    }
    if (filters?.impacto) {
      params.append('impacto', filters.impacto);
    }
    if (filters?.area) {
      params.append('area', filters.area.toString());
    }

    const response = await apiClient.get<PaginatedResponse<FactorDOFA>>(
      `${BASE_URL}/factores-dofa/?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Obtener factor DOFA
   */
  get: async (id: number): Promise<FactorDOFA> => {
    const response = await apiClient.get<FactorDOFA>(`${BASE_URL}/factores-dofa/${id}/`);
    return response.data;
  },

  /**
   * Crear factor DOFA
   */
  create: async (data: CreateFactorDOFADTO): Promise<FactorDOFA> => {
    const response = await apiClient.post<FactorDOFA>(`${BASE_URL}/factores-dofa/`, data);
    return response.data;
  },

  /**
   * Actualizar factor DOFA
   */
  update: async (id: number, data: UpdateFactorDOFADTO): Promise<FactorDOFA> => {
    const response = await apiClient.patch<FactorDOFA>(`${BASE_URL}/factores-dofa/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar factor DOFA
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/factores-dofa/${id}/`);
  },
};

// ==============================================================================
// ANALISIS PESTEL
// ==============================================================================

export const analisisPestelApi = {
  /**
   * Listar analisis PESTEL con filtros
   */
  list: async (
    filters?: AnalisisPESTELFilters,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResponse<AnalisisPESTEL>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());

    if (filters?.estado) {
      params.append('estado', filters.estado);
    }
    if (filters?.periodo) {
      params.append('periodo', filters.periodo);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }

    const response = await apiClient.get<PaginatedResponse<AnalisisPESTEL>>(
      `${BASE_URL}/analisis-pestel/?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Obtener detalle de analisis PESTEL
   */
  get: async (id: number): Promise<AnalisisPESTEL> => {
    const response = await apiClient.get<AnalisisPESTEL>(`${BASE_URL}/analisis-pestel/${id}/`);
    return response.data;
  },

  /**
   * Crear analisis PESTEL
   */
  create: async (data: CreateAnalisisPESTELDTO): Promise<AnalisisPESTEL> => {
    const response = await apiClient.post<AnalisisPESTEL>(`${BASE_URL}/analisis-pestel/`, data);
    return response.data;
  },

  /**
   * Actualizar analisis PESTEL
   */
  update: async (id: number, data: UpdateAnalisisPESTELDTO): Promise<AnalisisPESTEL> => {
    const response = await apiClient.patch<AnalisisPESTEL>(
      `${BASE_URL}/analisis-pestel/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Eliminar analisis PESTEL
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/analisis-pestel/${id}/`);
  },
};

// ==============================================================================
// FACTORES PESTEL
// ==============================================================================

export const factoresPestelApi = {
  /**
   * Listar factores PESTEL de un analisis
   */
  list: async (
    filters?: FactorPESTELFilters,
    page = 1,
    pageSize = 50
  ): Promise<PaginatedResponse<FactorPESTEL>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());

    if (filters?.analisis) {
      params.append('analisis', filters.analisis.toString());
    }
    if (filters?.tipo) {
      params.append('tipo', filters.tipo);
    }
    if (filters?.impacto) {
      params.append('impacto', filters.impacto);
    }
    if (filters?.tendencia) {
      params.append('tendencia', filters.tendencia);
    }

    const response = await apiClient.get<PaginatedResponse<FactorPESTEL>>(
      `${BASE_URL}/factores-pestel/?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Obtener factor PESTEL
   */
  get: async (id: number): Promise<FactorPESTEL> => {
    const response = await apiClient.get<FactorPESTEL>(`${BASE_URL}/factores-pestel/${id}/`);
    return response.data;
  },

  /**
   * Crear factor PESTEL
   */
  create: async (data: CreateFactorPESTELDTO): Promise<FactorPESTEL> => {
    const response = await apiClient.post<FactorPESTEL>(`${BASE_URL}/factores-pestel/`, data);
    return response.data;
  },

  /**
   * Actualizar factor PESTEL
   */
  update: async (id: number, data: UpdateFactorPESTELDTO): Promise<FactorPESTEL> => {
    const response = await apiClient.patch<FactorPESTEL>(
      `${BASE_URL}/factores-pestel/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Eliminar factor PESTEL
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/factores-pestel/${id}/`);
  },
};

// ==============================================================================
// FUERZAS PORTER
// ==============================================================================

export const fuerzasPorterApi = {
  /**
   * Listar fuerzas de Porter
   */
  list: async (
    filters?: FuerzaPorterFilters,
    page = 1,
    pageSize = 10
  ): Promise<PaginatedResponse<FuerzaPorter>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());

    if (filters?.periodo) {
      params.append('periodo', filters.periodo);
    }
    if (filters?.tipo) {
      params.append('tipo', filters.tipo);
    }
    if (filters?.nivel) {
      params.append('nivel', filters.nivel);
    }

    const response = await apiClient.get<PaginatedResponse<FuerzaPorter>>(
      `${BASE_URL}/fuerzas-porter/?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Obtener fuerza de Porter
   */
  get: async (id: number): Promise<FuerzaPorter> => {
    const response = await apiClient.get<FuerzaPorter>(`${BASE_URL}/fuerzas-porter/${id}/`);
    return response.data;
  },

  /**
   * Crear fuerza de Porter
   */
  create: async (data: CreateFuerzaPorterDTO): Promise<FuerzaPorter> => {
    const response = await apiClient.post<FuerzaPorter>(`${BASE_URL}/fuerzas-porter/`, data);
    return response.data;
  },

  /**
   * Actualizar fuerza de Porter
   */
  update: async (id: number, data: UpdateFuerzaPorterDTO): Promise<FuerzaPorter> => {
    const response = await apiClient.patch<FuerzaPorter>(`${BASE_URL}/fuerzas-porter/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar fuerza de Porter
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/fuerzas-porter/${id}/`);
  },
};

// ==============================================================================
// ESTRATEGIAS TOWS
// ==============================================================================

export const estrategiasTowsApi = {
  /**
   * Listar estrategias TOWS
   */
  list: async (
    filters?: EstrategiaTOWSFilters,
    page = 1,
    pageSize = 50
  ): Promise<PaginatedResponse<EstrategiaTOWS>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());

    if (filters?.analisis) {
      params.append('analisis', filters.analisis.toString());
    }
    if (filters?.tipo) {
      params.append('tipo', filters.tipo);
    }
    if (filters?.estado) {
      params.append('estado', filters.estado);
    }
    if (filters?.prioridad) {
      params.append('prioridad', filters.prioridad);
    }
    if (filters?.area_responsable) {
      params.append('area_responsable', filters.area_responsable.toString());
    }

    const response = await apiClient.get<PaginatedResponse<EstrategiaTOWS>>(
      `${BASE_URL}/estrategias-tows/?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Obtener estrategia TOWS
   */
  get: async (id: number): Promise<EstrategiaTOWS> => {
    const response = await apiClient.get<EstrategiaTOWS>(`${BASE_URL}/estrategias-tows/${id}/`);
    return response.data;
  },

  /**
   * Crear estrategia TOWS
   */
  create: async (data: CreateEstrategiaTOWSDTO): Promise<EstrategiaTOWS> => {
    const response = await apiClient.post<EstrategiaTOWS>(`${BASE_URL}/estrategias-tows/`, data);
    return response.data;
  },

  /**
   * Actualizar estrategia TOWS
   */
  update: async (id: number, data: UpdateEstrategiaTOWSDTO): Promise<EstrategiaTOWS> => {
    const response = await apiClient.patch<EstrategiaTOWS>(
      `${BASE_URL}/estrategias-tows/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Eliminar estrategia TOWS
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/estrategias-tows/${id}/`);
  },

  /**
   * Aprobar estrategia TOWS
   */
  aprobar: async (id: number): Promise<{ message: string; data: EstrategiaTOWS }> => {
    const response = await apiClient.post<{ message: string; data: EstrategiaTOWS }>(
      `${BASE_URL}/estrategias-tows/${id}/aprobar/`
    );
    return response.data;
  },

  /**
   * Marcar estrategia como en ejecución
   */
  ejecutar: async (id: number): Promise<{ message: string; data: EstrategiaTOWS }> => {
    const response = await apiClient.post<{ message: string; data: EstrategiaTOWS }>(
      `${BASE_URL}/estrategias-tows/${id}/ejecutar/`
    );
    return response.data;
  },

  /**
   * Marcar estrategia como completada
   */
  completar: async (id: number): Promise<{ message: string; data: EstrategiaTOWS }> => {
    const response = await apiClient.post<{ message: string; data: EstrategiaTOWS }>(
      `${BASE_URL}/estrategias-tows/${id}/completar/`
    );
    return response.data;
  },

  /**
   * 🎯 ACCIÓN CLAVE: Convertir estrategia TOWS en objetivo estratégico BSC
   *
   * Esta es la pieza fundamental que conecta el análisis de contexto
   * con la formulación estratégica.
   *
   * @param id - ID de la estrategia TOWS
   * @param data - Datos del objetivo estratégico a crear
   */
  convertirObjetivo: async (
    id: number,
    data: {
      code: string;
      name?: string;
      bsc_perspective: 'FINANCIERA' | 'CLIENTES' | 'PROCESOS' | 'APRENDIZAJE';
      target_value?: number;
      unit?: string;
    }
  ): Promise<{
    message: string;
    objetivo: any; // Tipo del objetivo estratégico
    estrategia: EstrategiaTOWS;
  }> => {
    const response = await apiClient.post(
      `${BASE_URL}/estrategias-tows/${id}/convertir_objetivo/`,
      data
    );
    return response.data;
  },
};

// ==============================================================================
// PARTES INTERESADAS (Stakeholders) - SPRINT 17
// ==============================================================================

/**
 * Grupo de Partes Interesadas (NUEVO - Sprint 17)
 * Nivel superior de taxonomía: GRUPO → TIPO/SUBGRUPO → PARTE INTERESADA
 */
export interface GrupoParteInteresada {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;
  orden: number;
  es_sistema: boolean; // true = pre-seeded (no eliminable), false = custom
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Tipo de Parte Interesada (ACTUALIZADO - Sprint 17)
 * Ahora incluye FK grupo + campos read-only de grupo
 */
export interface TipoParteInteresada {
  id: number;
  codigo: string;
  nombre: string;
  categoria: 'interno' | 'externo';
  categoria_display: string;
  descripcion: string;
  orden: number;
  // NUEVOS CAMPOS - Sprint 17
  grupo: number | null;
  grupo_nombre: string;
  grupo_codigo: string;
  grupo_icono: string;
  grupo_color: string;
  es_sistema: boolean;
  is_active: boolean;
}

/**
 * Detalle de una Norma ISO relacionada (solo lectura)
 */
export interface NormaRelacionadaDetail {
  id: number;
  code: string;
  name: string;
  short_name: string;
  icon: string;
  color: string;
}

/**
 * Parte Interesada (ACTUALIZADO - Sprint 17)
 * Nuevos campos bidireccionales + responsables
 */
export interface ParteInteresada {
  id: number;
  tipo: number;
  tipo_nombre: string;
  tipo_categoria: string;
  // NUEVOS CAMPOS - Jerarquía grupo (Sprint 17)
  grupo_nombre: string;
  grupo_codigo: string;
  grupo_icono: string;
  grupo_color: string;
  nombre: string;
  descripcion: string;
  representante: string;
  cargo_representante: string;
  telefono: string;
  email: string;
  direccion: string;
  sitio_web: string;
  // Matriz poder-interés (ACTUALIZADO - Sprint 17)
  nivel_influencia_pi: 'alta' | 'media' | 'baja'; // Renombrado (antes nivel_influencia)
  nivel_influencia_pi_display: string;
  nivel_influencia_empresa: 'alta' | 'media' | 'baja'; // NUEVO - Sprint 17
  nivel_influencia_empresa_display: string;
  nivel_interes: 'alto' | 'medio' | 'bajo';
  nivel_interes_display: string;
  cuadrante_matriz: string;
  // NUEVOS CAMPOS - Temas bidireccionales (Sprint 17)
  temas_interes_pi: string; // Renombrado conceptual
  temas_interes_empresa: string; // NUEVO - Sprint 17
  // NUEVOS CAMPOS - Responsables (Sprint 17)
  responsable_empresa: number | null;
  responsable_empresa_nombre: string;
  cargo_responsable: number | null;
  cargo_responsable_nombre: string;
  area_responsable: number | null;
  area_responsable_nombre: string;
  // Comunicación
  canal_principal:
    | 'email'
    | 'telefono'
    | 'reunion'
    | 'videoconferencia'
    | 'whatsapp'
    | 'portal_web'
    | 'redes_sociales'
    | 'correspondencia'
    | 'otro';
  canal_principal_display: string;
  frecuencia_comunicacion:
    | 'diaria'
    | 'semanal'
    | 'quincenal'
    | 'mensual'
    | 'bimestral'
    | 'trimestral'
    | 'semestral'
    | 'anual'
    | 'segun_necesidad';
  frecuencia_comunicacion_display: string;
  // ISO 9001:2015 Cláusula 4.2
  necesidades: string;
  expectativas: string;
  requisitos_pertinentes: string;
  es_requisito_legal: boolean;
  // Sistemas de gestión relacionados (dinámico desde NormaISO)
  normas_relacionadas: number[];
  normas_relacionadas_detail: NormaRelacionadaDetail[];
  // Campos legacy (para compatibilidad durante migración)
  relacionado_sst: boolean;
  relacionado_ambiental: boolean;
  relacionado_calidad: boolean;
  relacionado_pesv: boolean;
  // Auditoría
  empresa: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Filtros para Partes Interesadas (ACTUALIZADO - Sprint 17)
 */
export interface ParteInteresadaFilters {
  tipo?: number;
  tipo__grupo?: number; // NUEVO - Filtrar por grupo
  nivel_influencia_pi?: 'alta' | 'media' | 'baja'; // Renombrado
  nivel_influencia_empresa?: 'alta' | 'media' | 'baja'; // NUEVO
  nivel_interes?: 'alto' | 'medio' | 'bajo';
  responsable_empresa?: number; // NUEVO
  cargo_responsable?: number; // NUEVO
  area_responsable?: number; // NUEVO
  search?: string;
  page?: number;
  page_size?: number;
}

/**
 * Response de estadísticas (ACTUALIZADO - Sprint 17)
 */
export interface EstadisticasPartesInteresadas {
  total: number;
  por_grupo: Record<string, number>; // NUEVO
  por_tipo: Record<string, number>;
  por_influencia_pi: Record<string, number>; // Renombrado
  por_influencia_empresa: Record<string, number>; // NUEVO
  por_interes: Record<string, number>;
  por_sistema: {
    sst: number;
    ambiental: number;
    calidad: number;
    pesv: number;
  };
}

/**
 * Response de generación de matriz (NUEVO - Sprint 17)
 */
export interface GenerarMatrizResponse {
  message: string;
  created: number;
  updated: number;
  errors: Array<{
    parte_interesada_id?: number;
    parte_interesada_nombre?: string;
    fila?: number;
    error: string;
  }>;
  total_procesadas: number;
  total_errores: number;
}

/**
 * Matriz de Comunicación (Sprint 17)
 * ISO 9001:2015 Cláusula 7.4 — Comunicación con Partes Interesadas
 */
export interface MatrizComunicacion {
  id: number;
  parte_interesada: number;
  parte_interesada_nombre: string;
  que_comunicar: string;
  cuando_comunicar:
    | 'diaria'
    | 'semanal'
    | 'quincenal'
    | 'mensual'
    | 'bimestral'
    | 'trimestral'
    | 'semestral'
    | 'anual'
    | 'segun_necesidad';
  cuando_display: string;
  como_comunicar:
    | 'email'
    | 'reunion'
    | 'videoconferencia'
    | 'informe'
    | 'cartelera'
    | 'intranet'
    | 'telefono'
    | 'whatsapp'
    | 'redes'
    | 'capacitacion'
    | 'otro';
  como_display: string;
  responsable: number | null;
  responsable_nombre: string;
  registro_evidencia: string;
  normas_aplicables: number[];
  normas_aplicables_lista: Array<{ id: number; code: string; name: string }>;
  es_obligatoria: boolean;
  observaciones: string;
  empresa: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MatrizComunicacionFilters {
  parte_interesada?: number;
  cuando_comunicar?: string;
  como_comunicar?: string;
  is_active?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
}

export type CreateMatrizComunicacionDTO = Pick<
  MatrizComunicacion,
  'parte_interesada' | 'que_comunicar' | 'cuando_comunicar' | 'como_comunicar' | 'es_obligatoria'
> &
  Partial<
    Pick<
      MatrizComunicacion,
      'responsable' | 'registro_evidencia' | 'normas_aplicables' | 'observaciones'
    >
  >;

/**
 * API para Matriz de Comunicación (Sprint 17)
 */
export const matrizComunicacionApi = {
  list: async (
    filters?: MatrizComunicacionFilters
  ): Promise<PaginatedResponse<MatrizComunicacion>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());
    if (filters?.parte_interesada)
      params.append('parte_interesada', filters.parte_interesada.toString());
    if (filters?.cuando_comunicar) params.append('cuando_comunicar', filters.cuando_comunicar);
    if (filters?.como_comunicar) params.append('como_comunicar', filters.como_comunicar);
    if (filters?.search) params.append('search', filters.search);

    const response = await apiClient.get<PaginatedResponse<MatrizComunicacion>>(
      `${BASE_URL}/matriz-comunicacion/?${params.toString()}`
    );
    return response.data;
  },

  get: async (id: number): Promise<MatrizComunicacion> => {
    const response = await apiClient.get<MatrizComunicacion>(
      `${BASE_URL}/matriz-comunicacion/${id}/`
    );
    return response.data;
  },

  create: async (data: CreateMatrizComunicacionDTO): Promise<MatrizComunicacion> => {
    const response = await apiClient.post<MatrizComunicacion>(
      `${BASE_URL}/matriz-comunicacion/`,
      data
    );
    return response.data;
  },

  update: async (
    id: number,
    data: Partial<CreateMatrizComunicacionDTO>
  ): Promise<MatrizComunicacion> => {
    const response = await apiClient.patch<MatrizComunicacion>(
      `${BASE_URL}/matriz-comunicacion/${id}/`,
      data
    );
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/matriz-comunicacion/${id}/`);
  },
};

/**
 * API para Grupos de Partes Interesadas (NUEVO - Sprint 17)
 */
export const gruposParteInteresadaApi = {
  /**
   * Listar grupos
   */
  list: async (filters?: {
    es_sistema?: boolean;
    is_active?: boolean;
  }): Promise<PaginatedResponse<GrupoParteInteresada>> => {
    const params = new URLSearchParams();
    if (filters?.es_sistema !== undefined)
      params.append('es_sistema', filters.es_sistema.toString());
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());

    const response = await apiClient.get<PaginatedResponse<GrupoParteInteresada>>(
      `${BASE_URL}/grupos-parte-interesada/?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Obtener grupo por ID
   */
  get: async (id: number): Promise<GrupoParteInteresada> => {
    const response = await apiClient.get<GrupoParteInteresada>(
      `${BASE_URL}/grupos-parte-interesada/${id}/`
    );
    return response.data;
  },

  /**
   * Crear grupo custom
   */
  create: async (data: Partial<GrupoParteInteresada>): Promise<GrupoParteInteresada> => {
    const response = await apiClient.post<GrupoParteInteresada>(
      `${BASE_URL}/grupos-parte-interesada/`,
      data
    );
    return response.data;
  },

  /**
   * Actualizar grupo
   */
  update: async (
    id: number,
    data: Partial<GrupoParteInteresada>
  ): Promise<GrupoParteInteresada> => {
    const response = await apiClient.patch<GrupoParteInteresada>(
      `${BASE_URL}/grupos-parte-interesada/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Eliminar grupo (soft-delete para sistema, hard-delete para custom)
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/grupos-parte-interesada/${id}/`);
  },
};

/**
 * API para Tipos de Partes Interesadas (ACTUALIZADO - Sprint 17)
 */
export const tiposParteInteresadaApi = {
  /**
   * Listar tipos con filtro opcional por grupo
   */
  list: async (filters?: {
    grupo?: number;
    es_sistema?: boolean;
    is_active?: boolean;
  }): Promise<PaginatedResponse<TipoParteInteresada>> => {
    const params = new URLSearchParams();
    if (filters?.grupo) params.append('grupo', filters.grupo.toString());
    if (filters?.es_sistema !== undefined)
      params.append('es_sistema', filters.es_sistema.toString());
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());

    const response = await apiClient.get<PaginatedResponse<TipoParteInteresada>>(
      `${BASE_URL}/tipos-parte-interesada/?${params.toString()}`
    );
    return response.data;
  },

  get: async (id: number): Promise<TipoParteInteresada> => {
    const response = await apiClient.get<TipoParteInteresada>(
      `${BASE_URL}/tipos-parte-interesada/${id}/`
    );
    return response.data;
  },

  create: async (data: Partial<TipoParteInteresada>): Promise<TipoParteInteresada> => {
    const response = await apiClient.post<TipoParteInteresada>(
      `${BASE_URL}/tipos-parte-interesada/`,
      data
    );
    return response.data;
  },

  update: async (id: number, data: Partial<TipoParteInteresada>): Promise<TipoParteInteresada> => {
    const response = await apiClient.patch<TipoParteInteresada>(
      `${BASE_URL}/tipos-parte-interesada/${id}/`,
      data
    );
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/tipos-parte-interesada/${id}/`);
  },
};

export const partesInteresadasApi = {
  list: async (filters?: ParteInteresadaFilters): Promise<PaginatedResponse<ParteInteresada>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());
    if (filters?.tipo) params.append('tipo', filters.tipo.toString());
    if (filters?.tipo__grupo) params.append('tipo__grupo', filters.tipo__grupo.toString());
    if (filters?.nivel_influencia_pi)
      params.append('nivel_influencia_pi', filters.nivel_influencia_pi);
    if (filters?.nivel_influencia_empresa)
      params.append('nivel_influencia_empresa', filters.nivel_influencia_empresa);
    if (filters?.nivel_interes) params.append('nivel_interes', filters.nivel_interes);
    if (filters?.responsable_empresa)
      params.append('responsable_empresa', filters.responsable_empresa.toString());
    if (filters?.area_responsable)
      params.append('area_responsable', filters.area_responsable.toString());
    if (filters?.search) params.append('search', filters.search);

    const response = await apiClient.get<PaginatedResponse<ParteInteresada>>(
      `${BASE_URL}/partes-interesadas/?${params.toString()}`
    );
    return response.data;
  },

  get: async (id: number): Promise<ParteInteresada> => {
    const response = await apiClient.get<ParteInteresada>(`${BASE_URL}/partes-interesadas/${id}/`);
    return response.data;
  },

  create: async (data: Partial<ParteInteresada>): Promise<ParteInteresada> => {
    const response = await apiClient.post<ParteInteresada>(`${BASE_URL}/partes-interesadas/`, data);
    return response.data;
  },

  update: async (id: number, data: Partial<ParteInteresada>): Promise<ParteInteresada> => {
    const response = await apiClient.patch<ParteInteresada>(
      `${BASE_URL}/partes-interesadas/${id}/`,
      data
    );
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/partes-interesadas/${id}/`);
  },

  /**
   * Obtener matriz poder-interés con stakeholders organizados por cuadrante
   */
  matrizPoderInteres: async (): Promise<{
    gestionar_cerca: ParteInteresada[];
    mantener_satisfecho: ParteInteresada[];
    mantener_informado: ParteInteresada[];
    monitorear: ParteInteresada[];
  }> => {
    const response = await apiClient.get(`${BASE_URL}/partes-interesadas/matriz-poder-interes/`);
    return response.data;
  },

  /**
   * Obtener estadísticas de partes interesadas (ACTUALIZADO - Sprint 17)
   */
  estadisticas: async (): Promise<EstadisticasPartesInteresadas> => {
    const response = await apiClient.get<EstadisticasPartesInteresadas>(
      `${BASE_URL}/partes-interesadas/estadisticas/`
    );
    return response.data;
  },

  /**
   * Descarga plantilla Excel profesional para importación masiva.
   * Patrón unificado: headers + ejemplo + notas + hoja referencia.
   */
  downloadPlantilla: async (): Promise<Blob> => {
    const response = await apiClient.get(`${BASE_URL}/partes-interesadas/plantilla-importacion/`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Exporta las partes interesadas a Excel (4 hojas F-GD-04).
   */
  exportExcel: async (): Promise<Blob> => {
    const response = await apiClient.get(`${BASE_URL}/partes-interesadas/export_excel/`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Importa partes interesadas desde Excel (plantilla nueva o legacy F-GD-04).
   * Campo: 'archivo' (nuevo) o 'file' (legacy — retrocompatible).
   */
  importExcel: async (file: File): Promise<GenerarMatrizResponse> => {
    const formData = new FormData();
    formData.append('archivo', file);

    const response = await apiClient.post<GenerarMatrizResponse>(
      `${BASE_URL}/partes-interesadas/import_excel/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * 🆕 SPRINT 17: Generar matriz de comunicación individual
   *
   * Genera matriz para una parte interesada específica.
   * Usa lógica cuadrante → frecuencia:
   * - gestionar_cerca → mensual
   * - mantener_satisfecho → trimestral
   * - mantener_informado → bimestral
   * - monitorear → semestral
   *
   * @param parteInteresadaId - ID de la parte interesada
   */
  generarMatrizComunicacion: async (
    parteInteresadaId: number
  ): Promise<{
    message: string;
    created: boolean;
    data: any; // MatrizComunicacion
  }> => {
    const response = await apiClient.post(
      `${BASE_URL}/partes-interesadas/generar_matriz_comunicacion/`,
      { parte_interesada_id: parteInteresadaId }
    );
    return response.data;
  },

  /**
   * 🆕 SPRINT 17: Generar matrices de comunicación masivamente
   *
   * Genera matrices para todas las partes interesadas activas.
   *
   * @param grupoId - Opcional: filtrar por grupo específico
   * @returns Estadísticas del proceso (created, updated, errors)
   */
  generarMatrizComunicacionMasiva: async (grupoId?: number): Promise<GenerarMatrizResponse> => {
    const params = grupoId ? `?grupo=${grupoId}` : '';
    const response = await apiClient.post<GenerarMatrizResponse>(
      `${BASE_URL}/partes-interesadas/generar_matriz_comunicacion_masiva/${params}`
    );
    return response.data;
  },
};

// Export default con todos los metodos (ACTUALIZADO - Sprint 17)
export default {
  analisisDofa: analisisDofaApi,
  factoresDofa: factoresDofaApi,
  analisisPestel: analisisPestelApi,
  factoresPestel: factoresPestelApi,
  fuerzasPorter: fuerzasPorterApi,
  estrategiasTows: estrategiasTowsApi,
  gruposParteInteresada: gruposParteInteresadaApi,
  tiposParteInteresada: tiposParteInteresadaApi,
  partesInteresadas: partesInteresadasApi,
  matrizComunicacion: matrizComunicacionApi,
};
