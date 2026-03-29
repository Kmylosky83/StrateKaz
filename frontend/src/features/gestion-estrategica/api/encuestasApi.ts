/**
 * API Client para Encuestas Colaborativas DOFA
 *
 * Endpoints (relativo a API_URL que ya incluye /api):
 * - /encuestas-dofa/encuestas/ - CRUD encuestas
 * - /encuestas-dofa/temas/ - CRUD temas
 * - /encuestas-dofa/participantes/ - CRUD participantes
 * - /encuestas-dofa/respuestas/ - CRUD respuestas
 */

import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@/types';
import type {
  PreguntaContexto,
  EncuestaDofa,
  EncuestaListItem,
  CreateEncuestaDTO,
  UpdateEncuestaDTO,
  EncuestaFilters,
  TemaEncuesta,
  CreateTemaDTO,
  ParticipanteEncuesta,
  CreateParticipanteDTO,
  ParticipanteFilters,
  RespuestaEncuesta,
  CreateRespuestaDTO,
  RespuestaFilters,
  EstadisticasEncuesta,
  ConsolidarResultado,
  EnviarNotificacionesResultado,
} from '../types/encuestas.types';

// BASE_URL sin prefijo /api porque apiClient.baseURL ya lo incluye
const BASE_URL = '/encuestas-dofa';

// ==============================================================================
// ENCUESTAS
// ==============================================================================

export const encuestasApi = {
  /**
   * Listar encuestas con filtros
   */
  list: async (
    filters?: EncuestaFilters,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResponse<EncuestaListItem>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());

    if (filters?.analisis_dofa) {
      params.append('analisis_dofa', filters.analisis_dofa.toString());
    }
    if (filters?.estado) {
      params.append('estado', filters.estado);
    }
    if (filters?.tipo_encuesta) {
      params.append('tipo_encuesta', filters.tipo_encuesta);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }

    const response = await apiClient.get<PaginatedResponse<EncuestaListItem>>(
      `${BASE_URL}/encuestas/?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Obtener detalle de encuesta
   */
  get: async (id: number): Promise<EncuestaDofa> => {
    const response = await apiClient.get<EncuestaDofa>(`${BASE_URL}/encuestas/${id}/`);
    return response.data;
  },

  /**
   * Crear encuesta
   */
  create: async (data: CreateEncuestaDTO): Promise<EncuestaDofa> => {
    const response = await apiClient.post<EncuestaDofa>(`${BASE_URL}/encuestas/`, data);
    return response.data;
  },

  /**
   * Actualizar encuesta
   */
  update: async (id: number, data: UpdateEncuestaDTO): Promise<EncuestaDofa> => {
    const response = await apiClient.patch<EncuestaDofa>(`${BASE_URL}/encuestas/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar encuesta
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/encuestas/${id}/`);
  },

  /**
   * Activar encuesta
   */
  activar: async (id: number): Promise<{ detail: string; estado: string }> => {
    const response = await apiClient.post<{ detail: string; estado: string }>(
      `${BASE_URL}/encuestas/${id}/activar/`
    );
    return response.data;
  },

  /**
   * Cerrar encuesta
   */
  cerrar: async (id: number): Promise<{ detail: string; estado: string }> => {
    const response = await apiClient.post<{ detail: string; estado: string }>(
      `${BASE_URL}/encuestas/${id}/cerrar/`
    );
    return response.data;
  },

  /**
   * Enviar notificaciones a participantes
   */
  enviarNotificaciones: async (id: number): Promise<EnviarNotificacionesResultado> => {
    const response = await apiClient.post<EnviarNotificacionesResultado>(
      `${BASE_URL}/encuestas/${id}/enviar-notificaciones/`
    );
    return response.data;
  },

  /**
   * Enviar recordatorio a participantes que no han respondido
   */
  enviarRecordatorio: async (id: number): Promise<EnviarNotificacionesResultado> => {
    const response = await apiClient.post<EnviarNotificacionesResultado>(
      `${BASE_URL}/encuestas/${id}/enviar-recordatorio/`
    );
    return response.data;
  },

  /**
   * Obtener estadísticas de la encuesta
   */
  estadisticas: async (id: number): Promise<EstadisticasEncuesta> => {
    const response = await apiClient.get<EstadisticasEncuesta>(
      `${BASE_URL}/encuestas/${id}/estadisticas/`
    );
    return response.data;
  },

  /**
   * Consolidar respuestas en factores DOFA (y PESTEL para PCI-POAM)
   */
  consolidar: async (id: number, umbralConsenso = 0.6): Promise<ConsolidarResultado> => {
    const response = await apiClient.post<ConsolidarResultado>(
      `${BASE_URL}/encuestas/${id}/consolidar/`,
      { umbral_consenso: umbralConsenso }
    );
    return response.data;
  },

  /**
   * Regenerar temas PCI-POAM (si se crearon con error)
   */
  regenerarTemas: async (id: number): Promise<{ detail: string; temas_creados: number }> => {
    const response = await apiClient.post<{ detail: string; temas_creados: number }>(
      `${BASE_URL}/encuestas/${id}/regenerar-temas/`
    );
    return response.data;
  },
};

// ==============================================================================
// PREGUNTAS CONTEXTO PCI-POAM
// ==============================================================================

export const preguntasContextoApi = {
  /**
   * Listar banco de preguntas PCI-POAM (sin paginación)
   */
  list: async (filters?: {
    perfil?: string;
    capacidad_pci?: string;
    factor_poam?: string;
  }): Promise<PreguntaContexto[]> => {
    const params = new URLSearchParams();
    if (filters?.perfil) params.append('perfil', filters.perfil);
    if (filters?.capacidad_pci) params.append('capacidad_pci', filters.capacidad_pci);
    if (filters?.factor_poam) params.append('factor_poam', filters.factor_poam);

    const query = params.toString();
    const response = await apiClient.get<PreguntaContexto[]>(
      `${BASE_URL}/preguntas-contexto/${query ? `?${query}` : ''}`
    );
    return Array.isArray(response.data)
      ? response.data
      : ((response.data as unknown)?.results ?? []);
  },
};

// ==============================================================================
// TEMAS
// ==============================================================================

export const temasApi = {
  /**
   * Listar temas de una encuesta
   */
  list: async (
    encuestaId: number,
    page = 1,
    pageSize = 50
  ): Promise<PaginatedResponse<TemaEncuesta>> => {
    const params = new URLSearchParams();
    params.append('encuesta', encuestaId.toString());
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());

    const response = await apiClient.get<PaginatedResponse<TemaEncuesta>>(
      `${BASE_URL}/temas/?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Crear tema
   */
  create: async (encuestaId: number, data: CreateTemaDTO): Promise<TemaEncuesta> => {
    const response = await apiClient.post<TemaEncuesta>(`${BASE_URL}/temas/`, {
      ...data,
      encuesta: encuestaId,
    });
    return response.data;
  },

  /**
   * Actualizar tema
   */
  update: async (id: number, data: Partial<CreateTemaDTO>): Promise<TemaEncuesta> => {
    const response = await apiClient.patch<TemaEncuesta>(`${BASE_URL}/temas/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar tema
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/temas/${id}/`);
  },
};

// ==============================================================================
// PARTICIPANTES
// ==============================================================================

export const participantesApi = {
  /**
   * Listar participantes
   */
  list: async (
    filters?: ParticipanteFilters,
    page = 1,
    pageSize = 50
  ): Promise<PaginatedResponse<ParticipanteEncuesta>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());

    if (filters?.encuesta) {
      params.append('encuesta', filters.encuesta.toString());
    }
    if (filters?.tipo) {
      params.append('tipo', filters.tipo);
    }
    if (filters?.estado) {
      params.append('estado', filters.estado);
    }

    const response = await apiClient.get<PaginatedResponse<ParticipanteEncuesta>>(
      `${BASE_URL}/participantes/?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Agregar participante
   */
  create: async (
    encuestaId: number,
    data: CreateParticipanteDTO
  ): Promise<ParticipanteEncuesta> => {
    const response = await apiClient.post<ParticipanteEncuesta>(`${BASE_URL}/participantes/`, {
      ...data,
      encuesta: encuestaId,
    });
    return response.data;
  },

  /**
   * Eliminar participante
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/participantes/${id}/`);
  },
};

// ==============================================================================
// RESPUESTAS
// ==============================================================================

export const respuestasApi = {
  /**
   * Listar respuestas
   */
  list: async (
    filters?: RespuestaFilters,
    page = 1,
    pageSize = 50
  ): Promise<PaginatedResponse<RespuestaEncuesta>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());

    if (filters?.tema) {
      params.append('tema', filters.tema.toString());
    }
    if (filters?.tema__encuesta) {
      params.append('tema__encuesta', filters.tema__encuesta.toString());
    }
    if (filters?.clasificacion) {
      params.append('clasificacion', filters.clasificacion);
    }
    if (filters?.respondente) {
      params.append('respondente', filters.respondente.toString());
    }

    const response = await apiClient.get<PaginatedResponse<RespuestaEncuesta>>(
      `${BASE_URL}/respuestas/?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Crear respuesta (usuario autenticado)
   */
  create: async (data: CreateRespuestaDTO): Promise<RespuestaEncuesta> => {
    const response = await apiClient.post<RespuestaEncuesta>(`${BASE_URL}/respuestas/`, data);
    return response.data;
  },
};

// Export default con todos los métodos
export default {
  encuestas: encuestasApi,
  preguntasContexto: preguntasContextoApi,
  temas: temasApi,
  participantes: participantesApi,
  respuestas: respuestasApi,
};
