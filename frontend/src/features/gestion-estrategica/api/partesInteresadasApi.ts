/**
 * API Client para Partes Interesadas (Stakeholders)
 *
 * REORG-B4: Extraído de contextoApi.ts — PI ahora vive en Fundación → Mi Organización.
 * Los modelos permanecen en contexto/ (backend), pero las URLs se sirven desde /organizacion/.
 *
 * Endpoints (relativo a API_URL que ya incluye /api):
 * - /organizacion/grupos-parte-interesada/ - Catálogo grupos
 * - /organizacion/tipos-parte-interesada/ - Catálogo tipos
 * - /organizacion/partes-interesadas/ - CRUD Stakeholders
 * - /organizacion/requisitos-pi/ - Requisitos por PI
 * - /organizacion/matriz-comunicacion/ - Matriz comunicación ISO 7.4
 */

import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@/types';

// REORG-B3: PI endpoints remontados a /organizacion/
const BASE_URL = '/organizacion';

// ==============================================================================
// TIPOS
// ==============================================================================

/**
 * Grupo de Partes Interesadas
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
  es_sistema: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Tipo de Parte Interesada
 * Incluye FK grupo + campos read-only de grupo
 */
export interface TipoParteInteresada {
  id: number;
  codigo: string;
  nombre: string;
  categoria: 'interno' | 'externo';
  categoria_display: string;
  descripcion: string;
  orden: number;
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
 * Parte Interesada — ISO 9001:2015 Cláusula 4.2
 * Jerarquía GRUPO → TIPO → PI con impacto bidireccional
 */
export interface ParteInteresada {
  id: number;
  tipo: number;
  tipo_nombre: string;
  tipo_categoria: string;
  // Jerarquía grupo
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
  // Matriz poder-interés (bidireccional)
  nivel_influencia_pi: 'alta' | 'media' | 'baja';
  nivel_influencia_pi_display: string;
  nivel_influencia_empresa: 'alta' | 'media' | 'baja';
  nivel_influencia_empresa_display: string;
  nivel_interes: 'alto' | 'medio' | 'bajo';
  nivel_interes_display: string;
  cuadrante_matriz: string;
  // Temas bidireccionales
  temas_interes_pi: string;
  temas_interes_empresa: string;
  // Responsables
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
  // Sistemas de gestión relacionados
  normas_relacionadas: number[];
  normas_relacionadas_detail: NormaRelacionadaDetail[];
  // Campos legacy
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

export interface ParteInteresadaFilters {
  tipo?: number;
  tipo__grupo?: number;
  nivel_influencia_pi?: 'alta' | 'media' | 'baja';
  nivel_influencia_empresa?: 'alta' | 'media' | 'baja';
  nivel_interes?: 'alto' | 'medio' | 'bajo';
  responsable_empresa?: number;
  cargo_responsable?: number;
  area_responsable?: number;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface EstadisticasPartesInteresadas {
  total: number;
  por_grupo: Record<string, number>;
  por_tipo: Record<string, number>;
  por_influencia_pi: Record<string, number>;
  por_influencia_empresa: Record<string, number>;
  por_interes: Record<string, number>;
  por_sistema: {
    sst: number;
    ambiental: number;
    calidad: number;
    pesv: number;
  };
}

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
 * Matriz de Comunicación — ISO 9001:2015 Cláusula 7.4
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

// ==============================================================================
// API: MATRIZ DE COMUNICACIÓN
// ==============================================================================

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

// ==============================================================================
// API: GRUPOS DE PARTES INTERESADAS
// ==============================================================================

export const gruposParteInteresadaApi = {
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

  get: async (id: number): Promise<GrupoParteInteresada> => {
    const response = await apiClient.get<GrupoParteInteresada>(
      `${BASE_URL}/grupos-parte-interesada/${id}/`
    );
    return response.data;
  },

  create: async (data: Partial<GrupoParteInteresada>): Promise<GrupoParteInteresada> => {
    const response = await apiClient.post<GrupoParteInteresada>(
      `${BASE_URL}/grupos-parte-interesada/`,
      data
    );
    return response.data;
  },

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

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/grupos-parte-interesada/${id}/`);
  },
};

// ==============================================================================
// API: TIPOS DE PARTES INTERESADAS
// ==============================================================================

export const tiposParteInteresadaApi = {
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

// ==============================================================================
// API: PARTES INTERESADAS
// ==============================================================================

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

  matrizPoderInteres: async (): Promise<{
    gestionar_cerca: ParteInteresada[];
    mantener_satisfecho: ParteInteresada[];
    mantener_informado: ParteInteresada[];
    monitorear: ParteInteresada[];
  }> => {
    const response = await apiClient.get(`${BASE_URL}/partes-interesadas/matriz-poder-interes/`);
    return response.data;
  },

  estadisticas: async (): Promise<EstadisticasPartesInteresadas> => {
    const response = await apiClient.get<EstadisticasPartesInteresadas>(
      `${BASE_URL}/partes-interesadas/estadisticas/`
    );
    return response.data;
  },

  downloadPlantilla: async (): Promise<Blob> => {
    const response = await apiClient.get(`${BASE_URL}/partes-interesadas/plantilla-importacion/`, {
      responseType: 'blob',
    });
    return response.data;
  },

  exportExcel: async (): Promise<Blob> => {
    const response = await apiClient.get(`${BASE_URL}/partes-interesadas/export-excel/`, {
      responseType: 'blob',
    });
    return response.data;
  },

  importExcel: async (file: File): Promise<GenerarMatrizResponse> => {
    const formData = new FormData();
    formData.append('archivo', file);

    const response = await apiClient.post<GenerarMatrizResponse>(
      `${BASE_URL}/partes-interesadas/import-excel/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  generarMatrizComunicacion: async (
    parteInteresadaId: number
  ): Promise<{
    message: string;
    created: boolean;
    data: unknown;
  }> => {
    const response = await apiClient.post(
      `${BASE_URL}/partes-interesadas/generar-matriz-comunicacion/`,
      { parte_interesada_id: parteInteresadaId }
    );
    return response.data;
  },

  generarMatrizComunicacionMasiva: async (grupoId?: number): Promise<GenerarMatrizResponse> => {
    const response = await apiClient.post<GenerarMatrizResponse>(
      `${BASE_URL}/partes-interesadas/generar-matriz-comunicacion-masiva/`,
      {},
      { params: grupoId ? { grupo: grupoId } : undefined }
    );
    return response.data;
  },
};
